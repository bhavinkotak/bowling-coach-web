import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  // UI State
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Network State
  isOnline: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setOnline: (isOnline: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        isSidebarOpen: false,
        theme: 'light',
        isOnline: true,
        
        // Actions
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
        setTheme: (theme) => set({ theme }),
        setOnline: (isOnline) => set({ isOnline }),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          theme: state.theme,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// Selectors for better performance
export const selectIsSidebarOpen = (state: AppState) => state.isSidebarOpen;
export const selectTheme = (state: AppState) => state.theme;
export const selectIsOnline = (state: AppState) => state.isOnline;
