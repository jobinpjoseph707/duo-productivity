import { authService } from '@/services/authService';
import { supabase } from '@/services/supabaseClient';
import { useAppStore } from '@/stores/appStore';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isLoggingIn: boolean;
    isSigningUp: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<any>;
    signup: (email: string, password: string, displayName: string) => Promise<any>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check current session on mount
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
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                console.log('Auth State Change Event:', _event);
                if (session?.user) {
                    console.log('AuthProvider: User detected in onAuthStateChange');
                    setUser({
                        id: session.user.id,
                        email: session.user.email || '',
                    });
                } else {
                    console.log('AuthProvider: No user in onAuthStateChange, setting user to null');
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

    const queryClient = useQueryClient();
    const resetAppStore = useAppStore((state) => state.reset);

    const logout = async () => {
        try {
            console.log('AuthProvider: Global logout initiated');

            // 1. Clear Supabase session
            await authService.logout();

            // 2. Clear TanStack Query cache (removes all cached API data)
            queryClient.clear();
            console.log('AuthProvider: Query cache cleared');

            // 3. Reset Zustand app store (resets UI state)
            resetAppStore();
            console.log('AuthProvider: App store reset');

        } catch (err: any) {
            console.warn('AuthProvider: logout error, but clearing state:', err);
            // Fallback: still clear caches if possible
            queryClient.clear();
            resetAppStore();
        } finally {
            console.log('AuthProvider: Finalizing logout, setting state to null');
            setUser(null);
            setError(null);
            console.log('AuthProvider: User state is now:', null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isLoggingIn,
                isSigningUp,
                error,
                login,
                signup,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
