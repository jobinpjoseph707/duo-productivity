import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AppState {
  // Theme
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  themeName: string;
  setThemeName: (name: string) => void;

  // Modal states
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;

  isLogWorkModalOpen: boolean;
  setLogWorkModalOpen: (isOpen: boolean) => void;
  
  prefillLogData: any | null;
  setPrefillLogData: (data: any | null) => void;

  isRoutineModalOpen: boolean;
  setRoutineModalOpen: (isOpen: boolean) => void;

  prefillRoutineData: any | null;
  setPrefillRoutineData: (data: any | null) => void;

  // Notifications
  notification: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;

  // Active project (for context)
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;

  // Active task (for context)
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;

  // Global reset
  reset: () => void;
}

const initialState = {
  isAuthModalOpen: false,
  isLogWorkModalOpen: false,
  isRoutineModalOpen: false,
  prefillLogData: null,
  prefillRoutineData: null,
  activeProjectId: null,
  activeTaskId: null,
};

export const useAppStore = create<AppState>((set) => ({
  // Theme
  isDarkMode: true,
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),
  themeName: 'solo-leveling',
  setThemeName: (name) => {
    set({ themeName: name });
    AsyncStorage.setItem('app_theme', name).catch(console.warn);
  },

  ...initialState,

  // Modal states
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  setLogWorkModalOpen: (isOpen) => set({ isLogWorkModalOpen: isOpen }),
  setPrefillLogData: (data) => set({ prefillLogData: data }),
  setRoutineModalOpen: (isOpen) => set({ isRoutineModalOpen: isOpen }),
  setPrefillRoutineData: (data) => set({ prefillRoutineData: data }),

  // Notifications
  notification: null,
  showNotification: (message, type) =>
    set({
      notification: { message, type },
    }),
  clearNotification: () => set({ notification: null }),

  // Active context
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setActiveTaskId: (id) => set({ activeTaskId: id }),

  // Global reset
  reset: () => set(initialState),
}));

// Load saved theme on startup
AsyncStorage.getItem('app_theme').then((saved: string | null) => {
  if (saved) useAppStore.setState({ themeName: saved });
}).catch(console.warn);
