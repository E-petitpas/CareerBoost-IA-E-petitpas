const express = require('express');
const { supabase } = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Récupérer les notifications de l'utilisateur
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread_only = false } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unread_only === 'true') {
    query = query.is('read_at', null);
  }

  const { data: notifications, error, count } = await query;

  if (error) {
    console.error('Erreur récupération notifications:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }

  res.json({
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Marquer une notification comme lue
router.patch('/:id/read', asyncHandler(async (req, res) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur marquage notification lue:', error);
    return res.status(500).json({ error: 'Erreur lors du marquage de la notification' });
  }

  if (!notification) {
    return res.status(404).json({ error: 'Notification non trouvée' });
  }

  res.json({ 
    message: 'Notification marquée comme lue',
    notification 
  });
}));

// Marquer toutes les notifications comme lues
router.patch('/mark-all-read', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', req.user.id)
    .is('read_at', null);

  if (error) {
    console.error('Erreur marquage toutes notifications lues:', error);
    return res.status(500).json({ error: 'Erreur lors du marquage des notifications' });
  }

  res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
}));

// Supprimer une notification
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Erreur suppression notification:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression de la notification' });
  }

  res.json({ message: 'Notification supprimée avec succès' });
}));

// Récupérer les préférences de notification
router.get('/preferences', asyncHandler(async (req, res) => {
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Erreur récupération préférences:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des préférences' });
  }

  // Si aucune préférence n'existe, retourner les valeurs par défaut
  const defaultPreferences = {
    user_id: req.user.id,
    offers_min_score: 60,
    enable_email: true,
    enable_in_app: true,
    enable_sms: false,
    digest_daily: true
  };

  res.json({ 
    preferences: preferences || defaultPreferences 
  });
}));

// Mettre à jour les préférences de notification
router.put('/preferences', asyncHandler(async (req, res) => {
  const { 
    offers_min_score, 
    enable_email, 
    enable_in_app, 
    enable_sms, 
    digest_daily 
  } = req.body;

  // Validation des données
  if (offers_min_score !== undefined && (offers_min_score < 0 || offers_min_score > 100)) {
    return res.status(400).json({ error: 'Le score minimum doit être entre 0 et 100' });
  }

  const updateData = {};
  if (offers_min_score !== undefined) updateData.offers_min_score = offers_min_score;
  if (enable_email !== undefined) updateData.enable_email = enable_email;
  if (enable_in_app !== undefined) updateData.enable_in_app = enable_in_app;
  if (enable_sms !== undefined) updateData.enable_sms = enable_sms;
  if (digest_daily !== undefined) updateData.digest_daily = digest_daily;

  // Essayer de mettre à jour les préférences existantes
  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: req.user.id,
      ...updateData
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour préférences:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour des préférences' });
  }

  res.json({ 
    message: 'Préférences mises à jour avec succès',
    preferences 
  });
}));

// Compter les notifications non lues
router.get('/unread-count', asyncHandler(async (req, res) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .is('read_at', null);

  if (error) {
    console.error('Erreur comptage notifications non lues:', error);
    return res.status(500).json({ error: 'Erreur lors du comptage des notifications' });
  }

  res.json({ unreadCount: count });
}));

// Créer une notification (utilisé par d'autres services)
router.post('/', asyncHandler(async (req, res) => {
  const { user_id, type, payload } = req.body;

  // Vérifier que l'utilisateur a le droit de créer des notifications
  if (req.user.role !== 'ADMIN' && req.user.id !== user_id) {
    return res.status(403).json({ error: 'Permissions insuffisantes' });
  }

  // Valider le type de notification
  const validTypes = ['NEW_MATCH', 'STATUS_CHANGE', 'WEEKLY_DIGEST', 'PROFILE_HINT', 'ADMIN_ALERT'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Type de notification invalide' });
  }

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id,
      type,
      payload
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur création notification:', error);
    return res.status(500).json({ error: 'Erreur lors de la création de la notification' });
  }

  res.status(201).json({ 
    message: 'Notification créée avec succès',
    notification 
  });
}));

module.exports = router;
