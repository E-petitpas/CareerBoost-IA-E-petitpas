import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import {
  MagnifyingGlassIcon,
  ChartBarIcon,
  SparklesIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: SparklesIcon,
      title: 'Matching IA',
      description: 'Notre algorithme d\'IA analyse vos compétences et trouve les offres qui vous correspondent le mieux.',
    },
    {
      icon: MapPinIcon,
      title: 'Géolocalisation',
      description: 'Trouvez des opportunités près de chez vous avec notre système de recherche géographique avancé.',
    },
    {
      icon: ClockIcon,
      title: 'Temps réel',
      description: 'Recevez des notifications instantanées pour les nouvelles offres qui matchent avec votre profil.',
    },
    {
      icon: ChartBarIcon,
      title: 'Statistiques',
      description: 'Suivez vos candidatures et optimisez votre recherche d\'emploi avec nos analyses détaillées.',
    },
  ];

  const stats = [
    { label: 'Offres d\'emploi', value: '10,000+' },
    { label: 'Entreprises partenaires', value: '500+' },
    { label: 'Candidats actifs', value: '25,000+' },
    { label: 'Taux de matching', value: '85%' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative bg-gradient-primary overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Trouvez votre</span>{' '}
                  <span className="block text-yellow-300 xl:inline">emploi idéal</span>
                </h1>
                <p className="mt-3 text-base text-gray-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  CareerBoost E-petitpas utilise l'intelligence artificielle pour connecter 
                  les talents aux opportunités. Découvrez des offres personnalisées près de chez vous.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  {!isAuthenticated ? (
                    <div className="space-y-3 sm:space-y-0 sm:space-x-3 sm:flex">
                      <Link
                        to="/register?role=candidate"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                      >
                        Je cherche un emploi
                      </Link>
                      <Link
                        to="/register?role=recruiter"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 md:py-4 md:text-lg md:px-10"
                      >
                        Je recrute
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to="/dashboard"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 sm:w-auto"
                    >
                      Accéder au tableau de bord
                    </Link>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-br from-primary-400 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center text-white">
              <MagnifyingGlassIcon className="h-32 w-32 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium opacity-75">Votre carrière commence ici</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Des chiffres qui parlent
            </h2>
            <p className="mt-3 text-xl text-gray-500 sm:mt-4">
              CareerBoost E-petitpas est la plateforme de référence pour l'emploi intelligent
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-4 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col">
                <dt className="order-2 mt-2 text-lg leading-6 font-medium text-gray-500">
                  {stat.label}
                </dt>
                <dd className="order-1 text-5xl font-extrabold text-primary-600">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              Fonctionnalités
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Une approche révolutionnaire du recrutement
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Découvrez comment notre technologie transforme la recherche d'emploi et le recrutement
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {features.map((feature) => (
                <div key={feature.title} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                      {feature.title}
                    </p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Prêt à booster votre carrière ?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-primary-200">
            Rejoignez des milliers de professionnels qui ont trouvé leur emploi idéal grâce à notre plateforme.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
            >
              Commencer maintenant
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
