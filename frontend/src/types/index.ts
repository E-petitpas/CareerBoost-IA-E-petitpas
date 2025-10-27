// Types pour l'authentification
export interface User {
  id: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  name: string;
  email: string;
  verified: boolean;
  city?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  company_memberships?: CompanyMembership[];
}

export interface CompanyMembership {
  company_id: string;
  role_in_company: 'ADMIN_RH' | 'RH' | 'MANAGER';
  is_primary: boolean;
  companies: Company;
}

export interface Company {
  id: string;
  name: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  logo_url?: string;
  sector?: string;
  size_employees?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Types pour les candidats
export interface CandidateProfile {
  user_id: string;
  title?: string;
  summary?: string;
  experience_years?: number;
  mobility_km: number;
  preferred_contracts: ContractType[];
  updated_at?: string;
  users: User;
  candidate_skills: CandidateSkill[];
  experiences?: Experience[];
  educations?: Education[];
}

export interface CandidateSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level?: number;
  last_used_on?: string;
  skills: Skill;
}

export interface Education {
  id: string;
  user_id: string;
  school: string;
  degree?: string;
  field?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface Experience {
  id: string;
  user_id: string;
  company?: string;
  role_title?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

// Types pour les compétences
export interface Skill {
  id: string;
  slug: string;
  display_name: string;
  category?: string;
  created_at?: string;
  // Champs calculés pour l'admin
  candidate_count?: number;
  offer_count?: number;
  total_usage?: number;
}

// Types pour les offres d'emploi
export type ContractType = 'CDI' | 'CDD' | 'STAGE' | 'ALTERNANCE' | 'INTERIM' | 'FREELANCE' | 'TEMPS_PARTIEL' | 'TEMPS_PLEIN' | 'OTHER';

export interface JobOffer {
  id: string;
  title: string;
  description: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  contract_type?: ContractType;
  experience_min?: number;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  source: 'INTERNAL' | 'EXTERNAL';
  source_url?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'EXPIRED';
  premium_until?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  companies: Company;
  job_offer_skills: JobOfferSkill[];
  score?: number;
  explanation?: string;
  matched_skills?: Array<{ skill: string; level?: number; required?: boolean }>;
  missing_skills?: Array<{ skill: string; required?: boolean }>;
  distance_km?: number;
}

export interface JobOfferSkill {
  is_required: boolean;
  weight: number;
  skills: Skill;
}

// Types pour les candidatures
export type ApplicationStatus = 'ENVOYE' | 'EN_ATTENTE' | 'ENTRETIEN' | 'REFUS' | 'EMBAUCHE';

export interface Application {
  id: string;
  offer_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  score?: number;
  explanation?: string;
  cv_snapshot_url?: string;
  lm_snapshot_url?: string;
  created_at: string;
  updated_at: string;
  job_offers?: JobOffer;
  users?: User;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  event_type: 'STATUS_CHANGE' | 'NOTE_ADDED' | 'DOCUMENT_UPLOADED';
  old_status?: ApplicationStatus;
  new_status?: ApplicationStatus;
  note?: string;
  actor_user_id: string;
  created_at: string;
  users: User;
}

// Types pour les notifications
export type NotificationType = 'NEW_MATCH' | 'STATUS_CHANGE' | 'WEEKLY_DIGEST' | 'PROFILE_HINT' | 'ADMIN_ALERT';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: any;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  offers_min_score: number;
  enable_email: boolean;
  enable_in_app: boolean;
  enable_sms: boolean;
  digest_daily: boolean;
}

// Types pour les statistiques
export interface DashboardStats {
  offers?: {
    total: number;
    active: number;
    archived: number;
    expired: number;
  };
  applications?: {
    total: number;
    pending: number;
    inProgress: number;
    interviews: number;
    hired: number;
    rejected: number;
  };
  companies?: Array<{
    id: string;
    name: string;
    role: string;
    isPrimary: boolean;
  }>;
}

// Types pour la réponse du dashboard recruteur
export interface RecruiterDashboardResponse {
  stats?: DashboardStats;
  status?: 'pending_validation' | 'verified';
  message?: string;
  company?: {
    id: string;
    name: string;
    siren?: string;
    domain?: string;
    status: string;
    created_at: string;
  };
  canPublishOffers?: boolean;
}

// Types pour les formulaires
export interface RegisterForm {
  role: 'CANDIDATE' | 'RECRUITER';
  name: string;
  email: string;
  phone?: string;
  // password et confirmPassword supprimés - définis via email d'invitation
  city?: string;
  companyName?: string;
  companySiren?: string;
  companyDomain?: string;
}

export interface RegisterData {
  role: 'CANDIDATE' | 'RECRUITER';
  name: string;
  email: string;
  phone?: string;
  // password supprimé - défini via email d'invitation
  city?: string;
  companyName?: string;
  companySiren?: string;
  companyDomain?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface ProfileForm {
  title?: string;
  summary?: string;
  experience_years?: number;
  mobility_km: number;
  preferred_contracts: ContractType[];
}

export interface OfferForm {
  title: string;
  description: string;
  city?: string;
  contract_type?: ContractType;
  experience_min?: number;
  salary_min?: number;
  salary_max?: number;
  required_skills: string[];
  optional_skills: string[];
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour l'analyse de CV
export interface CVAnalysisResult {
  personal_info: {
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    location: string | null;
    summary: string | null;
  };
  professional_summary: string | null;
  experience_years: number;
  skills: CVSkill[];
  experiences: CVExperience[];
  educations: CVEducation[];
}

export interface CVSkill {
  name: string;
  category: 'technique' | 'métier' | 'soft_skill';
  level: 'débutant' | 'intermédiaire' | 'avancé' | 'expert';
}

export interface CVExperience {
  company: string;
  position: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
}

export interface CVEducation {
  school: string;
  degree: string;
  field: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
}

export interface CVUploadResponse {
  success: boolean;
  message: string;
  data: {
    document_id: string;
    file_url: string;
    original_name: string;
    file_size: number;
    text_stats: {
      characters: number;
      words: number;
      lines: number;
      estimatedReadingTime: number;
    };
    analysis: CVAnalysisResult;
    extracted_text: string;
  };
}

// Types pour les filtres de recherche
export interface OfferSearchFilters {
  near?: string;
  radius?: number;
  minScore?: number;
  contract_type?: ContractType;
  experience_min?: number;
  experience_max?: number;
  salary_min?: number;
  salary_max?: number;
  skills?: string[];
  company_sector?: string;
  remote_work?: boolean;
  source?: 'INTERNAL' | 'EXTERNAL';
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'date_desc' | 'date_asc' | 'salary_desc' | 'salary_asc' | 'score_desc';
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
  sort?: 'score_desc' | 'score_asc' | 'date_desc' | 'date_asc' | 'status';
}

// Types pour les offres sauvegardées
export interface SavedOffer {
  id: string;
  user_id: string;
  job_offer_id: string;
  list_name?: string;
  notes?: string;
  created_at: string;
  job_offers: JobOffer;
}

export interface SavedOfferList {
  name: string;
  count: number;
  created_at: string;
}
