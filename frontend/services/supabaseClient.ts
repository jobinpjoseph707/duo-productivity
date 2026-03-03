import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";


// Create appropriate storage adapter based on platform
const createStorageAdapter = () => {
  if (Platform.OS === "web") {
    // Use localStorage for web to persist sessions across refreshes
    // Check for typeof localStorage to prevent ReferenceError in SSR/Node environments
    const isLocalStorageAvailable = typeof localStorage !== 'undefined';

    return {
      getItem: (key: string) => {
        if (!isLocalStorageAvailable) return null;
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.warn("Error retrieving item from localStorage:", error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        if (!isLocalStorageAvailable) return Promise.resolve();
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          console.warn("Error storing item in localStorage:", error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        if (!isLocalStorageAvailable) return Promise.resolve();
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          console.warn("Error removing item from localStorage:", error);
          return Promise.resolve();
        }
      },
    };
  }

  // Use expo-secure-store for native platforms
  return {
    getItem: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.warn("Error retrieving item from secure store:", error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (error) {
        console.warn("Error storing item in secure store:", error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.warn("Error removing item from secure store:", error);
      }
    },
  };
};

const storageAdapter = createStorageAdapter();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // On web, we need to detect session tokens in the URL (for password reset redirects)
    // On mobile, we handle deep links manually, so keep it false
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Handle app state changes to refresh session when app comes to foreground
let appSubscription: any = null;
let lastRefreshTime = 0;
const REFRESH_THRESHOLD = 5000; // Only refresh every 5s max

const handleAppStateChange = async (state: string) => {
  if (state === "active") {
    // Supabase autoRefreshToken usually handles this, 
    // but we can trigger a manual check, wrapped in a threshold to prevent races.
    const now = Date.now();
    if (now - lastRefreshTime > REFRESH_THRESHOLD) {
      lastRefreshTime = now;
      try {
        await supabase.auth.getSession(); // getSession() will trigger a refresh if needed
      } catch (err) {
        console.warn("Background session sync failed:", err);
      }
    }
  }
};

// Safe session refresh helper to prevent multiple concurrent refreshes
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

export const safeRefreshSession = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        // Handle fatal errors that require logout
        if (error.message?.includes('refresh_token_already_used') || error.status === 400) {
          console.error("Fatal auth error: session invalidated.", error.message);
          await supabase.auth.signOut();
          // We don't redirect here, we let onAuthStateChange in AuthContext handle it
        }
        throw error;
      }
      return data;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Call this from your root layout to initialize listeners
export const initializeSupabaseListeners = () => {
  if (appSubscription) return;

  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange,
  );
  appSubscription = subscription;

  // Handle deep link URLs for password reset
  // When Supabase redirects to duoproductivityapp://reset-password#access_token=...,
  // we need to extract the tokens and set the session.
  if (Platform.OS !== 'web') {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);

      // Extract fragment (everything after #)
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const fragment = url.substring(hashIndex + 1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('Deep link: Setting session from URL tokens');
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('Error setting session from deep link:', error);
          }
        } catch (err) {
          console.error('Unexpected error handling deep link:', err);
        }
      }
    };

    // Listen for incoming links
    Linking.addEventListener('url', handleDeepLink);

    // Also check if the app was opened via a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });
  }
};

// Clean up listeners if needed
export const cleanupSupabaseListeners = () => {
  if (appSubscription) {
    appSubscription.remove();
    appSubscription = null;
  }
};

// Helper to get current session
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error("Unexpected error getting session:", err);
    return null;
  }
};

// Helper to get current user
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return data.user;
  } catch (err) {
    console.error("Unexpected error getting user:", err);
    return null;
  }
};
