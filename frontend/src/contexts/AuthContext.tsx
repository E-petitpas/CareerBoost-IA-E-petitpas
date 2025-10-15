import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginForm, RegisterData } from '../types';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('AuthContext: Initialisation de l\'authentification...');
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      console.log('AuthContext: Token trouvé:', token ? token.substring(0, 20) + '...' : 'aucun');
      console.log('AuthContext: Utilisateur stocké:', storedUser ? JSON.parse(storedUser) : 'aucun');

      if (token && storedUser) {
        // Vérifier si le token est toujours valide
        try {
          console.log('AuthContext: Vérification du token...');
          const response = await apiService.verifyToken();
          console.log('AuthContext: Token valide, utilisateur:', response.user);
          setUser(response.user);
        } catch (error) {
          console.error('AuthContext: Token invalide, nettoyage...', error);
          // Token invalide, nettoyer le localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('AuthContext: Pas de token ou d\'utilisateur stocké');
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('AuthContext: Initialisation terminée');
    }
  };

  const login = async (credentials: LoginForm) => {
    console.log('AuthContext: Tentative de connexion avec:', credentials);
    try {
      const response = await apiService.login(credentials);
      console.log('AuthContext: Réponse reçue:', response);

      // Stocker le token et les informations utilisateur
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      console.log('AuthContext: Token stocké:', response.token.substring(0, 20) + '...');
      console.log('AuthContext: Utilisateur stocké:', response.user);

      setUser(response.user);
      console.log('AuthContext: Utilisateur connecté:', response.user);
    } catch (error: any) {
      console.error('AuthContext: Erreur de connexion:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de la connexion');
    }
  };

  const register = async (data: RegisterData) => {
    console.log('AuthContext: Tentative d\'inscription avec:', data);
    try {
      const response = await apiService.register(data);
      console.log('AuthContext: Réponse reçue:', response);

      // Stocker le token et les informations utilisateur
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setUser(response.user);
      console.log('AuthContext: Utilisateur connecté:', response.user);
    } catch (error: any) {
      console.error('AuthContext: Erreur d\'inscription:', error);
      throw new Error(error.response?.data?.error || 'Erreur lors de l\'inscription');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
