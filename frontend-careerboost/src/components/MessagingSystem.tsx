import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth, useApi } from '../hooks/useAuth';
import { 
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Clock,
  CheckCheck,
  Check,
  User,
  Building2,
  Star,
  Circle,
  ArrowLeft,
  Filter,
  Archive,
  Trash2,
  Flag,
  UserPlus,
  Calendar,
  FileText,
  Image,
  Download
} from 'lucide-react';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'learner' | 'recruiter';
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
  file_url?: string;
  file_name?: string;
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    type: 'learner' | 'recruiter';
    avatar?: string;
    company?: string;
    position?: string;
  }>;
  last_message: Message;
  unread_count: number;
  updated_at: string;
  job_title?: string;
  application_id?: string;
}

interface MessagingSystemProps {
  userType: 'learner' | 'recruiter';
  userId: string;
}

export function MessagingSystem({ userType, userId }: MessagingSystemProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { apiCall } = useApi();

  useEffect(() => {
    loadConversations();
    
    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await apiCall('/messages/conversations');
      
      // Mock data for demonstration
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participants: [
            {
              id: '2',
              name: userType === 'learner' ? 'Marie Dubois' : 'Thomas Martin',
              type: userType === 'learner' ? 'recruiter' : 'learner',
              company: userType === 'learner' ? 'TechCorp' : undefined,
              position: userType === 'learner' ? 'Responsable RH' : 'Développeur Frontend'
            }
          ],
          last_message: {
            id: '1',
            conversation_id: '1',
            sender_id: '2',
            sender_name: userType === 'learner' ? 'Marie Dubois' : 'Thomas Martin',
            sender_type: userType === 'learner' ? 'recruiter' : 'learner',
            content: 'Bonjour ! Je souhaiterais échanger avec vous concernant votre candidature.',
            timestamp: '2024-01-20T14:30:00Z',
            read: false,
            type: 'text'
          },
          unread_count: 2,
          updated_at: '2024-01-20T14:30:00Z',
          job_title: 'Développeur Frontend React',
          application_id: 'app_1'
        },
        {
          id: '2',
          participants: [
            {
              id: '3',
              name: userType === 'learner' ? 'Sophie Bernard' : 'Julie Lecomte',
              type: userType === 'learner' ? 'recruiter' : 'learner',
              company: userType === 'learner' ? 'WebAgency' : undefined,
              position: userType === 'learner' ? 'Directrice Technique' : 'UX Designer'
            }
          ],
          last_message: {
            id: '2',
            conversation_id: '2',
            sender_id: userId,
            sender_name: 'Vous',
            sender_type: userType,
            content: 'Merci pour votre retour ! Je reste disponible pour un entretien.',
            timestamp: '2024-01-19T16:45:00Z',
            read: true,
            type: 'text'
          },
          unread_count: 0,
          updated_at: '2024-01-19T16:45:00Z',
          job_title: 'Designer UX/UI',
          application_id: 'app_2'
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await apiCall(`/messages/conversations/${conversationId}/messages`);
      
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          conversation_id: conversationId,
          sender_id: '2',
          sender_name: userType === 'learner' ? 'Marie Dubois' : 'Thomas Martin',
          sender_type: userType === 'learner' ? 'recruiter' : 'learner',
          content: 'Bonjour ! J\'ai consulté votre profil et je trouve votre parcours très intéressant.',
          timestamp: '2024-01-20T10:00:00Z',
          read: true,
          type: 'text'
        },
        {
          id: '2',
          conversation_id: conversationId,
          sender_id: '2',
          sender_name: userType === 'learner' ? 'Marie Dubois' : 'Thomas Martin',
          sender_type: userType === 'learner' ? 'recruiter' : 'learner',
          content: 'Seriez-vous disponible pour un entretien cette semaine ?',
          timestamp: '2024-01-20T10:05:00Z',
          read: true,
          type: 'text'
        },
        {
          id: '3',
          conversation_id: conversationId,
          sender_id: userId,
          sender_name: 'Vous',
          sender_type: userType,
          content: 'Bonjour Marie ! Merci beaucoup pour votre message. Je suis effectivement très intéressé(e) par cette opportunité.',
          timestamp: '2024-01-20T11:30:00Z',
          read: true,
          type: 'text'
        },
        {
          id: '4',
          conversation_id: conversationId,
          sender_id: userId,
          sender_name: 'Vous',
          sender_type: userType,
          content: 'Je suis disponible cette semaine pour un entretien. Quels créneaux vous conviendraient le mieux ?',
          timestamp: '2024-01-20T11:32:00Z',
          read: true,
          type: 'text'
        },
        {
          id: '5',
          conversation_id: conversationId,
          sender_id: '2',
          sender_name: userType === 'learner' ? 'Marie Dubois' : 'Thomas Martin',
          sender_type: userType === 'learner' ? 'recruiter' : 'learner',
          content: 'Parfait ! Que diriez-vous de jeudi à 14h ? Nous pourrons faire l\'entretien en visio.',
          timestamp: '2024-01-20T14:30:00Z',
          read: false,
          type: 'text'
        }
      ];
      
      setMessages(mockMessages);
      
      // Mark messages as read
      if (selectedConversation) {
        markConversationAsRead(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      const message: Message = {
        id: Date.now().toString(),
        conversation_id: selectedConversation.id,
        sender_id: userId,
        sender_name: 'Vous',
        sender_type: userType,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: true,
        type: 'text'
      };
      
      // Add message to UI immediately
      setMessages(prev => [...prev, message]);
      
      // Update conversation's last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, last_message: message, updated_at: message.timestamp }
            : conv
        )
      );
      
      setNewMessage('');
      
      // Send to backend
      await apiCall('/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage,
          type: 'text'
        })
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await apiCall(`/messages/conversations/${conversationId}/read`, {
        method: 'POST'
      });
      
      // Update unread count locally
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.company && p.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (conv.job_title && conv.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const renderConversationList = () => (
    <div className={`${isMobile && selectedConversation ? 'hidden' : 'block'} w-full md:w-1/3 border-r bg-white`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewChat(true)}
            className="text-[--color-careerboost-blue]"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune conversation</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParticipant = conversation.participants[0];
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[--color-careerboost-blue] flex items-center justify-center">
                        {otherParticipant.type === 'recruiter' ? (
                          <Building2 className="h-5 w-5 text-white" />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">{conversation.unread_count}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{otherParticipant.name}</h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.updated_at)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-1">
                        {otherParticipant.company && (
                          <span>{otherParticipant.company}</span>
                        )}
                        {otherParticipant.position && (
                          <span> • {otherParticipant.position}</span>
                        )}
                      </div>
                      
                      {conversation.job_title && (
                        <div className="text-xs text-blue-600 mb-1">
                          📋 {conversation.job_title}
                        </div>
                      )}
                      
                      <p className={`text-sm truncate ${
                        conversation.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                      }`}>
                        {conversation.last_message.sender_id === userId ? 'Vous: ' : ''}
                        {conversation.last_message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const renderChatArea = () => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Sélectionnez une conversation</p>
            <p className="text-sm text-gray-500">
              Choisissez une conversation dans la liste pour commencer à discuter
            </p>
          </div>
        </div>
      );
    }

    const otherParticipant = selectedConversation.participants[0];

    return (
      <div className={`${isMobile && selectedConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col bg-white`}>
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="w-10 h-10 rounded-full bg-[--color-careerboost-blue] flex items-center justify-center">
                {otherParticipant.type === 'recruiter' ? (
                  <Building2 className="h-5 w-5 text-white" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{otherParticipant.name}</h3>
                <div className="text-sm text-gray-600">
                  {otherParticipant.company && (
                    <span>{otherParticipant.company}</span>
                  )}
                  {otherParticipant.position && (
                    <span> • {otherParticipant.position}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedConversation.job_title && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <FileText className="h-3 w-3 mr-1" />
                  {selectedConversation.job_title}
                </Badge>
              )}
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === userId;
              const showSender = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              
              return (
                <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    {showSender && !isOwn && (
                      <p className="text-xs text-gray-500 mb-1 ml-2">{message.sender_name}</p>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-[--color-careerboost-blue] text-white ml-4'
                          : 'bg-gray-100 text-gray-900 mr-4'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className={`flex items-center mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="mr-1">{formatTime(message.timestamp)}</span>
                      {isOwn && (
                        message.read ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Image className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center space-x-2">
              <Input
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-[--color-careerboost-blue] hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex border rounded-lg overflow-hidden bg-white">
      {renderConversationList()}
      {renderChatArea()}
    </div>
  );
}