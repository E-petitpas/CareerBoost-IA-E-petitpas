import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

const supabase = createClient(supabaseUrl, publicAnonKey);

interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'learner' | 'recruiter' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, userType?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Check for demo user on mount
  const checkDemoUser = () => {
    try {
      const demoUser = localStorage.getItem('demoUser');
      if (demoUser) {
        const userData = JSON.parse(demoUser);
        setUser(userData);
        setProfile({ name: userData.name, user_type: userData.user_type });
        return true;
      }
    } catch (error) {
      console.error('Error loading demo user:', error);
    }
    return false;
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token || publicAnonKey;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-490d8e88${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Backend service unavailable - using demo mode');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data.error || 'Unknown error');
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - backend not available:', error);
        throw new Error('Backend service unavailable - using demo mode');
      }
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('Invalid JSON response - backend not properly configured:', error);
        throw new Error('Backend service unavailable - using demo mode');
      }
      throw error;
    }
  };

  const loadUserProfile = async () => {
    try {
      // First check for demo user
      if (checkDemoUser()) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        try {
          const profileResponse = await apiCall('/profile');
          setProfile(profileResponse.profile);
          setUser({
            id: data.session.user.id,
            email: data.session.user.email!,
            name: profileResponse.profile.name,
            user_type: profileResponse.profile.user_type
          });
        } catch (profileError) {
          console.warn('Profile loading failed, using session data:', profileError);
          // Fallback to session data if profile API fails
          setUser({
            id: data.session.user.id,
            email: data.session.user.email!,
            name: data.session.user.user_metadata?.name || 'Utilisateur',
            user_type: data.session.user.user_metadata?.user_type || 'learner'
          });
        }
      } else {
        // No session, set loading to false to show homepage
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      // Clear session if session check fails
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadUserProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await loadUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, name: string, userType = 'learner') => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-490d8e88/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name, userType }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Backend not available for signup');
        return { success: false, error: 'Service unavailable - please try demo mode' };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      // Auto sign in after successful signup
      const signInResult = await signIn(email, password);
      return signInResult;
    } catch (error) {
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('Backend not available for signup:', error);
        return { success: false, error: 'Service unavailable - please try demo mode' };
      }
      console.error('Signup error:', error);
      return { success: false, error: 'Sign up failed - please try demo mode' };
    }
  };

  const signOut = async () => {
    // Clear demo user if exists
    localStorage.removeItem('demoUser');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for API calls
export function useApi() {
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token || publicAnonKey;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-490d8e88${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Backend service unavailable - using demo mode');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data.error || 'Unknown error');
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error - backend not available:', error);
        throw new Error('Backend service unavailable - using demo mode');
      }
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('Invalid JSON response - backend not properly configured:', error);
        throw new Error('Backend service unavailable - using demo mode');
      }
      throw error;
    }
  };

  return { apiCall };
}