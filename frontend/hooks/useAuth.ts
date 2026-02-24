import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { authService } from '@/services/authService';

export interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check current session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
          });
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Failed to check session');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email || '',
        });
      }
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setIsSigningUp(true);
    setError(null);
    try {
      return await authService.register(email, password, displayName);
    } catch (err: any) {
      const errorMessage = err.message || 'Signup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSigningUp(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err: any) {
      setError('Logout failed');
      throw err;
    }
  };

  return {
    user,
    isLoading,
    isSigningUp,
    isLoggingIn,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };
}
