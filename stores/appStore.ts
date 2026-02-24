import { create } from 'zustand';

interface AppState {
  // Theme
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;

  // Modal states
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;

  isLogWorkModalOpen: boolean;
  setLogWorkModalOpen: (isOpen: boolean) => void;

  isTimeAllocationModalOpen: boolean;
  setTimeAllocationModalOpen: (isOpen: boolean) => void;

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
}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  isDarkMode: true,
  setDarkMode: (isDark) => set({ isDarkMode: isDark }),

  // Modal states
  isAuthModalOpen: false,
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),

  isLogWorkModalOpen: false,
  setLogWorkModalOpen: (isOpen) => set({ isLogWorkModalOpen: isOpen }),

  isTimeAllocationModalOpen: false,
  setTimeAllocationModalOpen: (isOpen) => set({ isTimeAllocationModalOpen: isOpen }),

  // Notifications
  notification: null,
  showNotification: (message, type) =>
    set({
      notification: { message, type },
    }),
  clearNotification: () => set({ notification: null }),

  // Active context
  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),

  activeTaskId: null,
  setActiveTaskId: (id) => set({ activeTaskId: id }),
}));
