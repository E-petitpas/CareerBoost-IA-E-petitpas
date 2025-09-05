import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS and logging middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

app.use('*', logger(console.log));

// Supabase client for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to verify user authentication
const verifyAuth = async (token: string) => {
  if (!token) return null;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
};

// Get user profile data
const getUserProfile = async (userId: string) => {
  return await kv.get(`profile:${userId}`);
};

// Routes

// Health check
app.get('/make-server-490d8e88/health', (c) => {
  return c.json({ status: 'ok', message: 'CareerBoost server is running' });
});

// Authentication routes
app.post('/make-server-490d8e88/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, userType = 'learner' } = body;

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, user_type: userType },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Sign up error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Create user profile in KV store
    const profile = {
      id: data.user.id,
      name,
      email,
      user_type: userType,
      created_at: new Date().toISOString(),
      // Default profile data based on user type
      ...(userType === 'learner' && {
        skills: [],
        location: '',
        mobility: '',
        formation: '',
        preferences: [],
        phone: ''
      }),
      ...(userType === 'recruiter' && {
        company_name: '',
        company_email: email,
        is_premium: false,
        status: 'pending'
      })
    };

    await kv.set(`profile:${data.user.id}`, profile);

    return c.json({ 
      message: 'User created successfully', 
      user: data.user,
      profile 
    });
  } catch (error) {
    console.log(`Error during sign up: ${error}`);
    return c.json({ error: 'Internal server error during sign up' }, 500);
  }
});

// Get user profile
app.get('/make-server-490d8e88/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log(`Error getting profile: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile
app.put('/make-server-490d8e88/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const currentProfile = await getUserProfile(user.id);
    
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...currentProfile,
      ...body,
      updated_at: new Date().toISOString()
    };

    await kv.set(`profile:${user.id}`, updatedProfile);

    return c.json({ 
      message: 'Profile updated successfully', 
      profile: updatedProfile 
    });
  } catch (error) {
    console.log(`Error updating profile: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Job offers routes

// Create job offer
app.post('/make-server-490d8e88/offers', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'recruiter') {
      return c.json({ error: 'Only recruiters can create offers' }, 403);
    }

    const body = await c.req.json();
    const { title, location, type, salary, skills, description, experience_level, remote_work, is_premium } = body;

    if (!title || !location || !type) {
      return c.json({ error: 'Title, location, and type are required' }, 400);
    }

    const offerId = crypto.randomUUID();
    const offer = {
      id: offerId,
      recruiter_id: user.id,
      company_name: profile.company_name,
      title,
      location,
      type,
      salary: salary || '',
      skills: skills || [],
      description: description || '',
      experience_level: experience_level || 'junior',
      remote_work: remote_work || false,
      is_premium: is_premium || false,
      status: 'active',
      created_at: new Date().toISOString(),
      applications_count: 0
    };

    await kv.set(`offer:${offerId}`, offer);

    // Add to recruiter's offers list
    const recruiterOffers = await kv.get(`recruiter_offers:${user.id}`) || [];
    recruiterOffers.push(offerId);
    await kv.set(`recruiter_offers:${user.id}`, recruiterOffers);

    return c.json({ 
      message: 'Offer created successfully', 
      offer 
    });
  } catch (error) {
    console.log(`Error creating offer: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all job offers (public)
app.get('/make-server-490d8e88/offers', async (c) => {
  try {
    const offers = await kv.getByPrefix('offer:');
    const activeOffers = offers
      .filter(offer => offer.status === 'active')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return c.json({ offers: activeOffers });
  } catch (error) {
    console.log(`Error getting offers: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get recruiter's offers
app.get('/make-server-490d8e88/recruiter/offers', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'recruiter') {
      return c.json({ error: 'Only recruiters can access this endpoint' }, 403);
    }

    const offerIds = await kv.get(`recruiter_offers:${user.id}`) || [];
    const offers = await kv.mget(offerIds.map(id => `offer:${id}`));

    return c.json({ offers: offers.filter(offer => offer !== null) });
  } catch (error) {
    console.log(`Error getting recruiter offers: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Applications routes

// Submit application
app.post('/make-server-490d8e88/applications', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'learner') {
      return c.json({ error: 'Only learners can apply to jobs' }, 403);
    }

    const body = await c.req.json();
    const { offer_id } = body;

    if (!offer_id) {
      return c.json({ error: 'Offer ID is required' }, 400);
    }

    // Check if offer exists
    const offer = await kv.get(`offer:${offer_id}`);
    if (!offer) {
      return c.json({ error: 'Offer not found' }, 404);
    }

    // Check if already applied
    const existingApplication = await kv.get(`application:${user.id}:${offer_id}`);
    if (existingApplication) {
      return c.json({ error: 'Already applied to this offer' }, 400);
    }

    const applicationId = crypto.randomUUID();
    const application = {
      id: applicationId,
      learner_id: user.id,
      learner_name: profile.name,
      offer_id,
      offer_title: offer.title,
      company_name: offer.company_name,
      status: 'submitted',
      ai_score: Math.floor(Math.random() * 30) + 70, // Mock AI score
      applied_at: new Date().toISOString(),
      notes: ''
    };

    await kv.set(`application:${user.id}:${offer_id}`, application);
    await kv.set(`application:${applicationId}`, application);

    // Add to learner's applications list
    const learnerApps = await kv.get(`learner_applications:${user.id}`) || [];
    learnerApps.push(applicationId);
    await kv.set(`learner_applications:${user.id}`, learnerApps);

    // Add to offer applications list
    const offerApps = await kv.get(`offer_applications:${offer_id}`) || [];
    offerApps.push(applicationId);
    await kv.set(`offer_applications:${offer_id}`, offerApps);

    // Update offer applications count
    offer.applications_count = (offer.applications_count || 0) + 1;
    await kv.set(`offer:${offer_id}`, offer);

    return c.json({ 
      message: 'Application submitted successfully', 
      application 
    });
  } catch (error) {
    console.log(`Error submitting application: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get learner's applications
app.get('/make-server-490d8e88/learner/applications', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'learner') {
      return c.json({ error: 'Only learners can access this endpoint' }, 403);
    }

    const applicationIds = await kv.get(`learner_applications:${user.id}`) || [];
    const applications = await kv.mget(applicationIds.map(id => `application:${id}`));

    return c.json({ 
      applications: applications
        .filter(app => app !== null)
        .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    });
  } catch (error) {
    console.log(`Error getting learner applications: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get applications for an offer (recruiter)
app.get('/make-server-490d8e88/offers/:offerId/applications', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'recruiter') {
      return c.json({ error: 'Only recruiters can access this endpoint' }, 403);
    }

    const offerId = c.req.param('offerId');
    
    // Check if recruiter owns this offer
    const offer = await kv.get(`offer:${offerId}`);
    if (!offer || offer.recruiter_id !== user.id) {
      return c.json({ error: 'Offer not found or access denied' }, 404);
    }

    const applicationIds = await kv.get(`offer_applications:${offerId}`) || [];
    const applications = await kv.mget(applicationIds.map(id => `application:${id}`));

    return c.json({ 
      applications: applications
        .filter(app => app !== null)
        .sort((a, b) => b.ai_score - a.ai_score) // Sort by AI score
    });
  } catch (error) {
    console.log(`Error getting offer applications: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update application status (recruiter)
app.put('/make-server-490d8e88/applications/:applicationId/status', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'recruiter') {
      return c.json({ error: 'Only recruiters can update application status' }, 403);
    }

    const applicationId = c.req.param('applicationId');
    const body = await c.req.json();
    const { status, notes } = body;

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const application = await kv.get(`application:${applicationId}`);
    if (!application) {
      return c.json({ error: 'Application not found' }, 404);
    }

    // Verify recruiter owns the offer
    const offer = await kv.get(`offer:${application.offer_id}`);
    if (!offer || offer.recruiter_id !== user.id) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const updatedApplication = {
      ...application,
      status,
      notes: notes || application.notes,
      updated_at: new Date().toISOString()
    };

    await kv.set(`application:${applicationId}`, updatedApplication);
    await kv.set(`application:${application.learner_id}:${application.offer_id}`, updatedApplication);

    return c.json({ 
      message: 'Application status updated successfully', 
      application: updatedApplication 
    });
  } catch (error) {
    console.log(`Error updating application status: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Admin routes

// Get platform statistics (admin only)
app.get('/make-server-490d8e88/admin/stats', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const offers = await kv.getByPrefix('offer:');
    const applications = await kv.getByPrefix('application:');
    const profiles = await kv.getByPrefix('profile:');

    const activeOffers = offers.filter(offer => offer.status === 'active');
    const hiredApplications = applications.filter(app => app.status === 'hired');
    const pendingRecruiters = profiles.filter(p => p.user_type === 'recruiter' && p.status === 'pending');

    const stats = {
      total_offers: offers.length,
      active_offers: activeOffers.length,
      total_applications: applications.length,
      confirmed_hires: hiredApplications.length,
      pending_companies: pendingRecruiters.length,
      total_users: profiles.length,
      learners_count: profiles.filter(p => p.user_type === 'learner').length,
      recruiters_count: profiles.filter(p => p.user_type === 'recruiter').length
    };

    return c.json({ stats });
  } catch (error) {
    console.log(`Error getting admin stats: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all companies (admin only)
app.get('/make-server-490d8e88/admin/companies', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const profiles = await kv.getByPrefix('profile:');
    const companies = profiles.filter(p => p.user_type === 'recruiter');

    // Get additional stats for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const offerIds = await kv.get(`recruiter_offers:${company.id}`) || [];
        const offers = await kv.mget(offerIds.map(id => `offer:${id}`));
        const validOffers = offers.filter(offer => offer !== null);
        
        const totalApplications = validOffers.reduce((sum, offer) => 
          sum + (offer.applications_count || 0), 0
        );

        return {
          ...company,
          active_offers: validOffers.filter(offer => offer.status === 'active').length,
          total_applications: totalApplications,
          total_offers: validOffers.length
        };
      })
    );

    return c.json({ companies: companiesWithStats });
  } catch (error) {
    console.log(`Error getting companies: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update company status (admin only)
app.put('/make-server-490d8e88/admin/companies/:companyId/status', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const companyId = c.req.param('companyId');
    const body = await c.req.json();
    const { status } = body;

    if (!status || !['approved', 'pending', 'suspended'].includes(status)) {
      return c.json({ error: 'Valid status is required' }, 400);
    }

    const companyProfile = await getUserProfile(companyId);
    if (!companyProfile || companyProfile.user_type !== 'recruiter') {
      return c.json({ error: 'Company not found' }, 404);
    }

    const updatedProfile = {
      ...companyProfile,
      status,
      updated_at: new Date().toISOString()
    };

    await kv.set(`profile:${companyId}`, updatedProfile);

    return c.json({ 
      message: 'Company status updated successfully', 
      company: updatedProfile 
    });
  } catch (error) {
    console.log(`Error updating company status: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// AI-powered CV generation (mock endpoint)
app.post('/make-server-490d8e88/generate-cv', async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await verifyAuth(token!);
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await getUserProfile(user.id);
    if (!profile || profile.user_type !== 'learner') {
      return c.json({ error: 'Only learners can generate CVs' }, 403);
    }

    // Mock CV generation - in real app, this would call an AI service
    const generatedCV = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: `CV - ${profile.name}`,
      content: `Professional CV generated for ${profile.name}`,
      skills: profile.skills || [],
      formation: profile.formation || '',
      created_at: new Date().toISOString()
    };

    await kv.set(`cv:${generatedCV.id}`, generatedCV);

    return c.json({ 
      message: 'CV generated successfully', 
      cv: generatedCV 
    });
  } catch (error) {
    console.log(`Error generating CV: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);