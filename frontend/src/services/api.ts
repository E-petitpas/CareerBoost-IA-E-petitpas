import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthResponse,
  LoginForm,
  RegisterData,
  User,
  CandidateProfile,
  Education,
  Experience,
  JobOffer,
  Application,
  ApplicationEvent,
  Notification,
  NotificationPreferences,
  DashboardStats,
  RecruiterDashboardResponse,
  Skill,
  OfferSearchFilters,
  ApplicationFilters,
  PaginatedResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        console.log('API Interceptor: Token trouvé:', token ? token.substring(0, 20) + '...' : 'aucun');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Interceptor: Token ajouté aux en-têtes pour', config.url);
        } else {
          console.log('API Interceptor: Pas de token, requête sans authentification pour', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const isLoginRequest = error.config?.url?.includes('/auth/login');
          const isRegisterRequest = error.config?.url?.includes('/auth/register');
          const hasToken = localStorage.getItem('token');

          console.log('API Interceptor: Erreur 401 détectée', {
            url: error.config?.url,
            isLoginRequest,
            isRegisterRequest,
            hasToken: !!hasToken
          });

          // Ne rediriger que si :
          // 1. Ce n'est pas une requête de connexion/inscription
          // 2. ET nous avons un token (donc c'est vraiment un token expiré)
          if (!isLoginRequest && !isRegisterRequest && hasToken) {
            console.log('API Interceptor: Token expiré/invalide, nettoyage et redirection');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          } else {
            console.log('API Interceptor: Erreur 401 mais pas de redirection nécessaire');
          }
        } else if (error.response?.status === 403 && error.response?.data?.requiresValidation) {
          // Entreprise nécessite validation (en attente ou rejetée)
          const validationData = error.response.data;
          console.log('API Interceptor: Entreprise nécessite validation détectée:', validationData.status);

          // Si on n'est pas déjà sur le dashboard, rediriger
          if (!window.location.pathname.includes('/dashboard')) {
            console.log('API Interceptor: Redirection vers dashboard pour validation');
            window.location.href = '/dashboard';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Méthodes d'authentification
  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('API: Tentative d\'inscription avec:', data);
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
      console.log('API: Réponse d\'inscription:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API: Erreur d\'inscription:', error.response?.data || error.message);
      throw error;
    }
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    console.log('API: Tentative de connexion avec:', data);
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
      console.log('API: Réponse de connexion:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API: Erreur de connexion:', error.response?.data || error.message);
      throw error;
    }
  }

  async verifyToken(): Promise<{ user: User }> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/verify');
    return response.data;
  }

  async setPassword(data: { token: string; password: string }): Promise<{ message: string; user: User }> {
    console.log('API: Définition du mot de passe');
    try {
      const response: AxiosResponse<{ message: string; user: User }> = await this.api.post('/auth/set-password', data);
      console.log('API: Mot de passe défini avec succès:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API: Erreur définition mot de passe:', error.response?.data || error.message);
      throw error;
    }
  }

  // Méthodes pour les candidats
  async getCandidateProfile(): Promise<{ profile: CandidateProfile }> {
    const response = await this.api.get('/candidate/profile');
    return response.data;
  }

  async updateCandidateProfile(data: Partial<CandidateProfile>): Promise<{ profile: CandidateProfile }> {
    const response = await this.api.put('/candidate/profile', data);
    return response.data;
  }

  async updateEducation(id: string, data: Partial<Education>): Promise<{ education: Education; message: string }> {
    const response = await this.api.put(`/candidate/educations/${id}`, data);
    return response.data;
  }

  async deleteEducation(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/candidate/educations/${id}`);
    return response.data;
  }

  async updateExperience(id: string, data: Partial<Experience>): Promise<{ experience: Experience; message: string }> {
    const response = await this.api.put(`/candidate/experiences/${id}`, data);
    return response.data;
  }

  async deleteExperience(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/candidate/experiences/${id}`);
    return response.data;
  }

  async updateCandidateSkills(skills: Array<{ skill_id: string; proficiency_level?: number; last_used_on?: string }>): Promise<{ message: string }> {
    const response = await this.api.put('/candidate/skills', skills);
    return response.data;
  }

  async addCandidateSkill(data: { skill_name: string; proficiency_level?: number; last_used_on?: string }): Promise<{ skill: any; message: string }> {
    const response = await this.api.post('/candidate/skills', data);
    return response.data;
  }

  async deleteCandidateSkill(skillId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/candidate/skills/${skillId}`);
    return response.data;
  }

  async createExperience(data: Omit<Experience, 'id' | 'user_id'>): Promise<{ experience: Experience; message: string }> {
    const response = await this.api.post('/candidate/experiences', data);
    return response.data;
  }

  async createEducation(data: Omit<Education, 'id' | 'user_id'>): Promise<{ education: Education; message: string }> {
    const response = await this.api.post('/candidate/educations', data);
    return response.data;
  }

  // Méthodes pour les offres d'emploi
  async searchOffers(filters: OfferSearchFilters): Promise<PaginatedResponse<JobOffer>> {
    const response = await this.api.get('/offers/search', { params: filters });
    return response.data;
  }

  async getOffer(id: string): Promise<{ offer: JobOffer }> {
    const response = await this.api.get(`/offers/${id}`);
    return response.data;
  }

  async createOffer(data: any): Promise<{ offer: JobOffer; message: string }> {
    const response = await this.api.post('/offers', data);
    return response.data;
  }

  async updateOffer(id: string, data: any): Promise<{ offer: JobOffer; message: string }> {
    const response = await this.api.put(`/offers/${id}`, data);
    return response.data;
  }

  async archiveOffer(id: string): Promise<{ message: string }> {
    const response = await this.api.patch(`/offers/${id}/archive`);
    return response.data;
  }

  // Méthodes pour les candidatures
  async applyToOffer(offerId: string, customMessage?: string): Promise<{ application: Application; message: string }> {
    const response = await this.api.post('/applications/apply', {
      offer_id: offerId,
      custom_message: customMessage
    });
    return response.data;
  }

  async getMyApplications(): Promise<{ applications: Application[] }> {
    const response = await this.api.get('/applications/my-applications');
    return response.data;
  }

  async getApplicationEvents(applicationId: string): Promise<{ events: ApplicationEvent[] }> {
    const response = await this.api.get(`/applications/${applicationId}/events`);
    return response.data;
  }

  async updateApplicationStatus(applicationId: string, status: string, note?: string): Promise<{ application: Application; message: string }> {
    const response = await this.api.patch(`/applications/${applicationId}/status`, { status, note });
    return response.data;
  }

  async addApplicationNote(applicationId: string, note: string): Promise<{ event: ApplicationEvent; message: string }> {
    const response = await this.api.post(`/applications/${applicationId}/notes`, { note });
    return response.data;
  }

  // Méthode temporaire pour supprimer une candidature (tests)
  async deleteTestApplication(offerId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/applications/test-delete/${offerId}`);
    return response.data;
  }

  // Méthode temporaire pour valider automatiquement l'entreprise (tests)
  async validateTestCompany(): Promise<{ message: string; companies: string[] }> {
    const response = await this.api.post('/applications/test-validate-company');
    return response.data;
  }

  // Méthodes pour la génération de CV/LM
  async generateCV(): Promise<{ cv_url: string; message: string }> {
    const response = await this.api.post('/candidate/cv/generate');
    return response.data;
  }

  async generateCoverLetter(offerId: string, customMessage?: string): Promise<{ lm_url: string; message: string }> {
    const response = await this.api.post('/candidate/lm/generate', {
      offer_id: offerId,
      custom_message: customMessage
    });
    return response.data;
  }

  async uploadCV(formData: FormData): Promise<{ cv_url: string; message: string; filename: string }> {
    const response = await this.api.post('/candidate/cv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Méthodes pour les recruteurs
  async getRecruiterDashboard(): Promise<RecruiterDashboardResponse> {
    const response = await this.api.get('/recruiter/dashboard');
    return response.data;
  }

  async checkRecruiterValidation(): Promise<{ status: string; message: string }> {
    const response = await this.api.get('/recruiter/validation-check');
    return response.data;
  }

  async getSkills(): Promise<{ skills: any[] }> {
    const response = await this.api.get('/skills');
    return response.data;
  }

  async getCompanyOffers(companyId: string, params?: any): Promise<PaginatedResponse<JobOffer>> {
    const response = await this.api.get(`/recruiter/companies/${companyId}/offers`, { params });
    return response.data;
  }

  async getOfferApplications(offerId: string, filters?: ApplicationFilters): Promise<PaginatedResponse<Application>> {
    const response = await this.api.get(`/recruiter/offers/${offerId}/applications`, { params: filters });
    return response.data;
  }

  async getCompanyApplications(companyId: string, params?: any): Promise<PaginatedResponse<Application>> {
    const response = await this.api.get(`/recruiter/companies/${companyId}/applications`, { params });
    return response.data;
  }

  async activateOfferPremium(offerId: string, duration: number = 30): Promise<{ offer: JobOffer; message: string }> {
    const response = await this.api.patch(`/recruiter/offers/${offerId}/premium`, { duration });
    return response.data;
  }

  async exportApplications(companyId: string): Promise<Blob> {
    const response = await this.api.get(`/recruiter/companies/${companyId}/applications/export`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Méthodes pour les compétences
  async searchSkills(query: string, limit: number = 20): Promise<{ skills: Skill[] }> {
    const response = await this.api.get('/skills/search', { params: { q: query, limit } });
    return response.data;
  }

  async getAllSkills(): Promise<{ skills: Skill[] }> {
    const response = await this.api.get('/skills');
    return response.data;
  }

  async getTopSkills(limit: number = 20): Promise<{ skills: Skill[] }> {
    const response = await this.api.get('/skills/top', { params: { limit } });
    return response.data;
  }

  async createSkill(displayName: string): Promise<{ skill: Skill; message: string }> {
    const response = await this.api.post('/skills', { display_name: displayName });
    return response.data;
  }

  // Méthodes pour les offres sauvegardées
  async getSavedOffers(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get('/candidate/saved-offers', { params });
    return response.data;
  }

  async saveOffer(offerId: string, listName?: string, notes?: string): Promise<{ message: string }> {
    const response = await this.api.post('/candidate/saved-offers', {
      job_offer_id: offerId,
      list_name: listName,
      notes: notes
    });
    return response.data;
  }

  async unsaveOffer(offerId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/candidate/saved-offers/${offerId}`);
    return response.data;
  }

  async getSavedOfferLists(): Promise<{ lists: any[] }> {
    const response = await this.api.get('/candidate/saved-offers/lists');
    return response.data;
  }



  // Méthodes pour les notifications
  async getNotifications(params?: any): Promise<PaginatedResponse<Notification>> {
    const response = await this.api.get('/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<{ notification: Notification; message: string }> {
    const response = await this.api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    const response = await this.api.patch('/notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  async getNotificationPreferences(): Promise<{ preferences: NotificationPreferences }> {
    const response = await this.api.get('/notifications/preferences');
    return response.data;
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<{ preferences: NotificationPreferences; message: string }> {
    const response = await this.api.put('/notifications/preferences', preferences);
    return response.data;
  }

  async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
    const response = await this.api.get('/notifications/unread-count');
    return response.data;
  }

  // Méthodes pour les administrateurs
  async getAdminDashboard(): Promise<{ stats: any }> {
    const response = await this.api.get('/admin/dashboard');
    return response.data;
  }

  async getPendingCompanies(): Promise<{ companies: any[] }> {
    const response = await this.api.get('/admin/companies');
    return response.data;
  }

  async approveCompany(companyId: string): Promise<void> {
    await this.api.post(`/admin/companies/${companyId}/approve`);
  }

  async rejectCompany(companyId: string): Promise<void> {
    await this.api.post(`/admin/companies/${companyId}/reject`);
  }

  async updateCompanyStatus(companyId: string, status: string, reason?: string): Promise<{ company: any; message: string }> {
    const response = await this.api.patch(`/admin/companies/${companyId}/status`, { status, reason });
    return response.data;
  }

  async getAdminCompanies(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get('/admin/companies', { params });
    return response.data;
  }

  async suspendCompany(companyId: string, suspend: boolean, reason?: string): Promise<{ company: any; message: string }> {
    const response = await this.api.patch(`/admin/companies/${companyId}/suspend`, { suspend, reason });
    return response.data;
  }

  async getAdminOffers(params?: any): Promise<PaginatedResponse<JobOffer>> {
    const response = await this.api.get('/admin/offers', { params });
    return response.data;
  }

  async getAdminOffersStats(): Promise<any> {
    const response = await this.api.get('/admin/offers/stats');
    return response.data;
  }

  async updateOfferAdminStatus(offerId: string, action: 'approve' | 'reject' | 'flag'): Promise<{ message: string }> {
    const response = await this.api.post(`/admin/offers/${offerId}/status`, { action });
    return response.data;
  }

  async moderateOffer(offerId: string, action: string, reason?: string): Promise<{ offer: JobOffer; message: string }> {
    const response = await this.api.patch(`/admin/offers/${offerId}/moderate`, { action, reason });
    return response.data;
  }

  async generateReport(params?: any): Promise<{ report: any; period: any }> {
    const response = await this.api.get('/admin/reports', { params });
    return response.data;
  }

  async getAuditLogs(params?: any): Promise<PaginatedResponse<any>> {
    const response = await this.api.get('/admin/audit-logs', { params });
    return response.data;
  }

  // Méthodes pour France Travail (Admin)
  async getFranceTravailStats(): Promise<any> {
    const response = await this.api.get('/admin/offers/france-travail/stats');
    return response.data;
  }

  async syncFranceTravail(): Promise<any> {
    const response = await this.api.post('/admin/offers/france-travail/sync');
    return response.data;
  }

  async getFranceTravailPendingOffers(params?: any): Promise<any> {
    const response = await this.api.get('/admin/offers/france-travail/pending', { params });
    return response.data;
  }

  async approveFranceTravailOffer(offerId: string, reason?: string): Promise<any> {
    const response = await this.api.post(`/admin/offers/france-travail/${offerId}/approve`, { reason });
    return response.data;
  }

  async rejectFranceTravailOffer(offerId: string, reason?: string): Promise<any> {
    const response = await this.api.post(`/admin/offers/france-travail/${offerId}/reject`, { reason });
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
