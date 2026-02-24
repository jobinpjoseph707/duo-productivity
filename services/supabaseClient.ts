import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";

// In-memory storage fallback for development
const memoryStorage: Record<string, string> = {};

// Create appropriate storage adapter based on platform
const createStorageAdapter = () => {
  if (Platform.OS === "web") {
    // Use memory storage for web
    return {
      getItem: (key: string) => {
        try {
          return memoryStorage[key] || null;
        } catch (error) {
          console.warn("Error retrieving item from memory storage:", error);
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          memoryStorage[key] = value;
          return Promise.resolve();
        } catch (error) {
          console.warn("Error storing item in memory storage:", error);
          return Promise.resolve();
        }
      },
      removeItem: (key: string) => {
        try {
          delete memoryStorage[key];
          return Promise.resolve();
        } catch (error) {
          console.warn("Error removing item from memory storage:", error);
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
    detectSessionInUrl: false,
  },
});

// Handle app state changes to refresh session when app comes to foreground
let appSubscription: any = null;

const setupAppStateListener = () => {
  if (appSubscription) return;

  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange,
  );
  appSubscription = subscription;
};

const handleAppStateChange = async (state: string) => {
  if (state === "active") {
    // Refresh session when app comes back to foreground
    await supabase.auth.refreshSession();
  }
};

// Call this from your root layout to initialize listeners
export const initializeSupabaseListeners = () => {
  setupAppStateListener();
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
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  return data.session;
};

// Helper to get current user
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error);
    return null;
  }
  return data.user;
};
