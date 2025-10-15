import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterForm } from '../../types';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const schema = yup.object().shape({
  role: yup
    .string()
    .oneOf(['CANDIDATE', 'RECRUITER'], 'Veuillez sélectionner un rôle valide')
    .required('Le rôle est requis') as yup.StringSchema<'CANDIDATE' | 'RECRUITER'>,
  name: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .required('Le nom est requis'),
  email: yup
    .string()
    .email('Adresse email invalide')
    .required('L\'email est requis'),
  phone: yup
    .string()
    .matches(/^[0-9+\-\s()]+$/, 'Numéro de téléphone invalide')
    .optional(),
  // password et confirmPassword supprimés - définis via email d'invitation
  city: yup.string().optional(),
  companyName: yup.string().when('role', {
    is: 'RECRUITER',
    then: (schema) => schema.required('Le nom de l\'entreprise est requis pour les recruteurs'),
    otherwise: (schema) => schema.optional(),
  }),
  companySiren: yup.string().when('role', {
    is: 'RECRUITER',
    then: (schema) => schema.matches(/^\d{9}$/, 'Le SIREN doit contenir 9 chiffres').required('Le SIREN est requis'),
    otherwise: (schema) => schema.optional(),
  }),
  companyDomain: yup.string().when('role', {
    is: 'RECRUITER',
    then: (schema) => schema.url('Veuillez entrer une URL valide').optional(),
    otherwise: (schema) => schema.optional(),
  }),
});

// Fonction pour déterminer la route de redirection selon le rôle
const getRedirectPath = (userRole: string): string => {
  switch (userRole) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'RECRUITER':
      // Les recruteurs vont sur /dashboard qui gère le statut PENDING
      return '/dashboard';
    case 'CANDIDATE':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

const Register: React.FC = () => {
  const { register: registerUser, user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const defaultRole = searchParams.get('role') === 'recruiter' ? 'RECRUITER' : 'CANDIDATE';

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      console.log('Register: Utilisateur déjà connecté, redirection vers:', getRedirectPath(user.role));
      navigate(getRedirectPath(user.role), { replace: true });
    }
  }, [loading, isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      role: defaultRole,
    },
  });

  const watchedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Envoyer les données d'inscription (sans mot de passe)
      await registerUser(data as any);

      // Afficher le message de succès
      setSuccess('Inscription réussie ! Un email de bienvenue a été envoyé à votre adresse. Veuillez cliquer sur le lien pour définir votre mot de passe et activer votre compte.');

      // Rediriger vers la page de login après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CB</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créez votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="alert-error">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Sélection du rôle */}
            <div>
              <label className="form-label">Je suis</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    {...register('role')}
                    type="radio"
                    value="CANDIDATE"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                    watchedRole === 'CANDIDATE' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="font-medium">Candidat</div>
                    <div className="text-sm text-gray-500">Je cherche un emploi</div>
                  </div>
                </label>
                <label className="relative">
                  <input
                    {...register('role')}
                    type="radio"
                    value="RECRUITER"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                    watchedRole === 'RECRUITER' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="font-medium">Recruteur</div>
                    <div className="text-sm text-gray-500">Je recrute des talents</div>
                  </div>
                </label>
              </div>
              {errors.role && (
                <p className="form-error">{errors.role.message}</p>
              )}
            </div>

            {/* Informations personnelles */}
            <div>
              <label htmlFor="name" className="form-label form-label-required">
                Nom complet
              </label>
              <input
                {...register('name')}
                type="text"
                className={`form-input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Jean Dupont"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label form-label-required">
                Adresse email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`form-input ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="jean@exemple.com"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Téléphone
              </label>
              <input
                {...register('phone')}
                type="tel"
                className={`form-input ${errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="06 12 34 56 78"
              />
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="form-label">
                Ville
              </label>
              <input
                {...register('city')}
                type="text"
                className={`form-input ${errors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Paris"
              />
              {errors.city && (
                <p className="form-error">{errors.city.message}</p>
              )}
            </div>

            {/* Informations entreprise (si recruteur) */}
            {watchedRole === 'RECRUITER' && (
              <>
                <div>
                  <label htmlFor="companyName" className="form-label form-label-required">
                    Nom de l'entreprise
                  </label>
                  <input
                    {...register('companyName')}
                    type="text"
                    className={`form-input ${errors.companyName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Mon Entreprise SAS"
                  />
                  {errors.companyName && (
                    <p className="form-error">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companySiren" className="form-label form-label-required">
                    SIREN de l'entreprise
                  </label>
                  <input
                    {...register('companySiren')}
                    type="text"
                    className={`form-input ${errors.companySiren ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="123456789"
                    maxLength={9}
                  />
                  {errors.companySiren && (
                    <p className="form-error">{errors.companySiren.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyDomain" className="form-label">
                    Site web de l'entreprise
                  </label>
                  <input
                    {...register('companyDomain')}
                    type="url"
                    className={`form-input ${errors.companyDomain ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="https://www.monentreprise.com"
                  />
                  {errors.companyDomain && (
                    <p className="form-error">{errors.companyDomain.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Message de succès */}
          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {success}
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    Redirection vers la page de connexion dans quelques secondes...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note explicative */}
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Nouveau processus d'inscription :</strong> Après avoir créé votre compte, vous recevrez un email de bienvenue avec un lien pour définir votre mot de passe et activer votre compte.
                </p>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="spinner w-4 h-4 mr-2"></div>
                  Envoi de l'invitation...
                </div>
              ) : !!success ? (
                'Inscription réussie !'
              ) : (
                'Créer mon compte et recevoir l\'invitation'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-600">
              En créant un compte, vous acceptez nos{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                conditions d'utilisation
              </Link>{' '}
              et notre{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
