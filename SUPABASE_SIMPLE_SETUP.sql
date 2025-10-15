-- ========================================
-- MIGRATION SUPABASE SIMPLIFIÉE
-- CareerBoost E-petitpas
-- ========================================
-- Version compatible avec l'interface SQL Supabase
-- Copiez et collez ce script dans l'éditeur SQL de Supabase

-- Activer les extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Types énumérés (syntaxe compatible Supabase)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CANDIDATE', 'RECRUITER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE company_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE contract_type AS ENUM ('CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'INTERIM', 'FREELANCE', 'TEMPS_PARTIEL', 'TEMPS_PLEIN', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('ACTIVE', 'ARCHIVED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE admin_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('ENVOYE', 'EN_ATTENTE', 'ENTRETIEN', 'REFUS', 'EMBAUCHE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_source AS ENUM ('INTERNAL', 'EXTERNAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text,
  name text NOT NULL,
  phone text,
  role user_role NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT false,
  company_id uuid,
  city text,
  latitude double precision,
  longitude double precision,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des entreprises
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  siren text UNIQUE,
  domain text,
  sector text,
  logo_url text,
  description text,
  website text,
  status company_status NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des compétences
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des profils candidats
CREATE TABLE IF NOT EXISTS candidate_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title text,
  summary text,
  experience_years integer DEFAULT 0,
  mobility_km integer DEFAULT 0,
  preferred_contracts contract_type[] DEFAULT '{}',
  cv_url text,
  lm_url text,
  current_cv_document_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des offres d'emploi
CREATE TABLE IF NOT EXISTS job_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  city text,
  latitude double precision,
  longitude double precision,
  contract_type contract_type,
  experience_min integer DEFAULT 0,
  salary_min integer,
  salary_max integer,
  currency text DEFAULT 'EUR',
  source offer_source NOT NULL DEFAULT 'INTERNAL',
  source_url text,
  status offer_status NOT NULL DEFAULT 'ACTIVE',
  admin_status admin_status NOT NULL DEFAULT 'PENDING',
  premium_until timestamptz,
  published_at timestamptz NOT NULL DEFAULT now(),
  admin_validated_at timestamptz,
  admin_validated_by uuid REFERENCES users(id),
  france_travail_id text,
  france_travail_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table de liaison offres-compétences
CREATE TABLE IF NOT EXISTS job_offer_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  is_required boolean NOT NULL DEFAULT false,
  weight integer DEFAULT 1,
  UNIQUE(offer_id, skill_id)
);

-- Table des candidatures
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'ENVOYE',
  score double precision,
  explanation text,
  cv_snapshot_url text,
  lm_snapshot_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id, candidate_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  payload jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des traces de matching
CREATE TABLE IF NOT EXISTS match_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inputs_hash text,
  score double precision,
  matched_skills text[],
  missing_skills text[],
  distance_km double precision,
  hard_filters jsonb DEFAULT '{}',
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  original_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des versions de documents
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  file_url text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Table des éducations
CREATE TABLE IF NOT EXISTS educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  field text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des expériences
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company text NOT NULL,
  position text NOT NULL,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des compétences des candidats
CREATE TABLE IF NOT EXISTS candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level integer DEFAULT 1,
  years_experience integer DEFAULT 0,
  UNIQUE(user_id, skill_id)
);

-- Table des invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table des statistiques de synchronisation
CREATE TABLE IF NOT EXISTS sync_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  processed integer NOT NULL DEFAULT 0,
  created integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0,
  sync_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ajouter les contraintes de clés étrangères
ALTER TABLE users ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE candidate_profiles ADD CONSTRAINT fk_candidate_profiles_current_cv FOREIGN KEY (current_cv_document_id) REFERENCES documents(id) ON DELETE SET NULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_job_offers_company_id ON job_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_job_offers_status ON job_offers(status);
CREATE INDEX IF NOT EXISTS idx_job_offers_admin_status ON job_offers(admin_status);
CREATE INDEX IF NOT EXISTS idx_applications_offer_id ON applications(offer_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Fonction pour updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_offers_updated_at BEFORE UPDATE ON job_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer les compétences de base
INSERT INTO skills (slug, display_name, category) VALUES
  ('javascript', 'JavaScript', 'Développement Web'),
  ('python', 'Python', 'Développement'),
  ('react', 'React', 'Développement Web'),
  ('nodejs', 'Node.js', 'Développement Backend'),
  ('postgresql', 'PostgreSQL', 'Base de données'),
  ('docker', 'Docker', 'DevOps'),
  ('aws', 'AWS', 'Cloud'),
  ('git', 'Git', 'Outils de développement')
ON CONFLICT (slug) DO NOTHING;

-- Message de confirmation
SELECT 'Migration Supabase terminée avec succès! 🎉' as status;
