import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BellIcon, 
  UserCircleIcon, 
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

const Header: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [notificationCount] = useState(3); // TODO: Récupérer le vrai nombre

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Tableau de bord', href: '/dashboard' },
    ];

    if (hasRole('CANDIDATE')) {
      return [
        ...baseItems,
        { name: 'Offres d\'emploi', href: '/offers' },
        { name: 'Mes candidatures', href: '/applications' },
        { name: 'Mon profil', href: '/profile' },
      ];
    }

    if (hasRole('RECRUITER')) {
      return [
        ...baseItems,
        { name: 'Mes offres', href: '/recruiter/offers' },
        { name: 'Candidatures', href: '/recruiter/applications' },
        { name: 'Publier une offre', href: '/recruiter/offers/new' },
      ];
    }

    if (hasRole('ADMIN')) {
      return [
        ...baseItems,
        { name: 'Entreprises', href: '/admin/companies' },
        { name: 'Offres', href: '/admin/offers' },
        { name: 'France Travail', href: '/admin/france-travail' },
        { name: 'Rapports', href: '/admin/reports' },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CB</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                CareerBoost
              </span>
            </Link>
          </div>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="nav-link-inactive"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <BellIcon className="h-6 w-6" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                  )}
                </button>

                {/* Menu utilisateur */}
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    <span className="hidden md:block text-gray-700 font-medium">
                      {user.name}
                    </span>
                    <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-400" />
                  </Menu.Button>

                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs">{user.email}</div>
                          <div className="text-xs">
                            <span className={`badge ${
                              user.role === 'ADMIN' ? 'badge-error' :
                              user.role === 'RECRUITER' ? 'badge-warning' :
                              'badge-primary'
                            }`}>
                              {user.role === 'ADMIN' ? 'Administrateur' :
                               user.role === 'RECRUITER' ? 'Recruteur' :
                               'Candidat'}
                            </span>
                          </div>
                        </div>

                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <UserCircleIcon className="mr-3 h-4 w-4" />
                              Mon profil
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/settings"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <Cog6ToothIcon className="mr-3 h-4 w-4" />
                              Paramètres
                            </Link>
                          )}
                        </Menu.Item>

                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                            >
                              <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                              Se déconnecter
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation mobile */}
      {user && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
