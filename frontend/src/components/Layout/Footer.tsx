import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CB</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                CareerBoost E-petitpas
              </span>
            </div>
            <p className="mt-4 text-gray-600 text-sm max-w-md">
              La plateforme de recrutement intelligente qui connecte les talents 
              aux opportunités grâce à l'IA et au matching géographique.
            </p>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                © 2024 CareerBoost E-petitpas. Tous droits réservés.
              </p>
            </div>
          </div>

          {/* Liens candidats */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Candidats
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/offers" className="text-sm text-gray-600 hover:text-gray-900">
                  Rechercher des offres
                </Link>
              </li>
              <li>
                <Link to="/register?role=candidate" className="text-sm text-gray-600 hover:text-gray-900">
                  Créer un profil
                </Link>
              </li>
              <li>
                <Link to="/help/candidate" className="text-sm text-gray-600 hover:text-gray-900">
                  Guide candidat
                </Link>
              </li>
              <li>
                <Link to="/tips" className="text-sm text-gray-600 hover:text-gray-900">
                  Conseils carrière
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens recruteurs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Recruteurs
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/register?role=recruiter" className="text-sm text-gray-600 hover:text-gray-900">
                  Créer un compte
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/help/recruiter" className="text-sm text-gray-600 hover:text-gray-900">
                  Guide recruteur
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-sm text-gray-600 hover:text-gray-900">
                  Fonctionnalités
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Liens légaux */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Politique de confidentialité
              </Link>
              <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                Conditions d'utilisation
              </Link>
              <Link to="/cookies" className="text-sm text-gray-600 hover:text-gray-900">
                Politique des cookies
              </Link>
              <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                Contact
              </Link>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-gray-500">
                Fait avec ❤️ en France
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
