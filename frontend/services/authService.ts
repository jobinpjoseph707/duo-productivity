import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

export const authService = {
  // Register new user
  async register(email: string, password: string, displayName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) throw error;

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      // Always attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();

      // If there's an error (e.g. session already invalid), we still want to 
      // treat this as a successful local logout to avoid sticking the user.
      if (error) {
        console.warn('Supabase signOut returned error, proceeding with local logout:', error);
      }
    } catch (error) {
      console.error('Logout error encountered, continuing anyway:', error);
      // We don't re-throw here because we want the frontend to proceed with 
      // clearing local state regardless of server-side success.
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      // Platform-specific redirect URL:
      // - Web: redirect back to current origin so Supabase client detects tokens in URL
      // - Mobile: use deep link URL (exp:// in Expo Go, duoproductivityapp:// in APK)
      let redirectUrl: string;
      if (Platform.OS === 'web') {
        redirectUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
      } else {
        redirectUrl = Linking.createURL('reset-password');
      }
      console.log('Password reset redirectTo:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },

  // Update password (called after clicking reset link)
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(displayName: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },
};
