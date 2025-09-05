import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useApi } from '../hooks/useAuth';
import { 
  Bell,
  MessageSquare,
  User,
  Building2,
  Clock,
  Check,
  CheckCheck,
  Eye,
  X,
  MarkAsUnread
} from 'lucide-react';

interface MessageNotification {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'learner' | 'recruiter';
  sender_company?: string;
  message_preview: string;
  conversation_id: string;
  timestamp: string;
  read: boolean;
  job_title?: string;
}

interface MessageNotificationsProps {
  userId: string;
  userType: 'learner' | 'recruiter';
  onOpenConversation?: (conversationId: string) => void;
}

export function MessageNotifications({ userId, userType, onOpenConversation }: MessageNotificationsProps) {
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { apiCall } = useApi();

  useEffect(() => {
    loadNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // Skip API call in demo mode or if no network
      let serverNotifications: MessageNotification[] = [];
      try {
        const response = await apiCall('/messages/notifications');
        serverNotifications = response.notifications || [];
      } catch (apiError) {
        // Fallback to mock data if API fails - this is expected in demo mode
        console.warn('Using mock notification data (expected in demo mode):', apiError);
      }
      
      // Mock data for demonstration (will be used if server is unavailable)
      const mockNotifications: MessageNotification[] = [
        {
          id: '1',
          sender_id: '2',
          sender_name: userType === 'learner' ? 'Marie Dubois' : 'Thomas Martin',
          sender_type: userType === 'learner' ? 'recruiter' : 'learner',
          sender_company: userType === 'learner' ? 'TechCorp' : undefined,
          message_preview: 'Bonjour ! J\'ai quelques questions concernant votre profil...',
          conversation_id: '1',
          timestamp: '2024-01-20T14:30:00Z',
          read: false,
          job_title: 'Développeur Frontend React'
        },
        {
          id: '2',
          sender_id: '3',
          sender_name: userType === 'learner' ? 'Sophie Bernard' : 'Julie Lecomte',
          sender_type: userType === 'learner' ? 'recruiter' : 'learner',
          sender_company: userType === 'learner' ? 'WebAgency' : undefined,
          message_preview: 'Parfait pour l\'entretien de demain ! À bientôt.',
          conversation_id: '2',
          timestamp: '2024-01-20T11:15:00Z',
          read: false,
          job_title: 'Designer UX/UI'
        },
        {
          id: '3',
          sender_id: '4',
          sender_name: userType === 'learner' ? 'Jean Moreau' : 'Alice Dupont',
          sender_type: userType === 'learner' ? 'recruiter' : 'learner',
          sender_company: userType === 'learner' ? 'StartupInc' : undefined,
          message_preview: 'Merci pour votre candidature. Nous revenons vers vous très bientôt.',
          conversation_id: '3',
          timestamp: '2024-01-19T16:45:00Z',
          read: true
        }
      ];
      
      // Use server data if available, otherwise use mock data
      const finalNotifications = serverNotifications.length > 0 ? serverNotifications : mockNotifications;
      setNotifications(finalNotifications);
      setUnreadCount(finalNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Update UI immediately for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Try to sync with backend
      try {
        await apiCall(`/messages/notifications/${notificationId}/read`, {
          method: 'POST'
        });
      } catch (apiError) {
        console.warn('Failed to sync read status with backend:', apiError);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      
      // Update UI immediately
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      
      // Try to sync with backend
      try {
        await apiCall('/messages/notifications/read-all', {
          method: 'POST'
        });
      } catch (apiError) {
        console.warn('Failed to sync read-all status with backend:', apiError);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: MessageNotification) => {
    markAsRead(notification.id);
    if (onOpenConversation) {
      onOpenConversation(notification.conversation_id);
    }
    setShowNotifications(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderNotificationItem = (notification: MessageNotification) => (
    <div
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      className={`p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[--color-careerboost-blue] flex items-center justify-center">
            {notification.sender_type === 'recruiter' ? (
              <Building2 className="h-5 w-5 text-white" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          {!notification.read && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
              {notification.sender_name}
            </h4>
            <span className="text-xs text-gray-500">
              {formatTime(notification.timestamp)}
            </span>
          </div>
          
          {notification.sender_company && (
            <p className="text-xs text-gray-600 mb-1">{notification.sender_company}</p>
          )}
          
          {notification.job_title && (
            <div className="text-xs text-blue-600 mb-1 flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              {notification.job_title}
            </div>
          )}
          
          <p className={`text-sm text-gray-700 truncate ${!notification.read ? 'font-medium' : ''}`}>
            {notification.message_preview}
          </p>
        </div>
        
        <div className="flex items-center space-x-1">
          {notification.read ? (
            <CheckCheck className="h-4 w-4 text-blue-500" />
          ) : (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Messages ({unreadCount > 0 ? `${unreadCount} non lus` : notifications.length})
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucun message</p>
              <p className="text-sm text-gray-500">
                Vos notifications de messages apparaîtront ici
              </p>
            </div>
          ) : (
            <div>
              {notifications.map(renderNotificationItem)}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t bg-gray-50 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNotifications(false);
                if (onOpenConversation) {
                  onOpenConversation('all');
                }
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir toutes les conversations
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}