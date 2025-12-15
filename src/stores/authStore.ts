import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      user: null,
      token: null,
      isInitialized: false,
  
  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },
  
  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  },
  
  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
  
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  },
  
      // Initialize from localStorage on app load
      initialize: () => {
        try {
          const token = localStorage.getItem('authToken');
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : null;
          
          if (token && user) {
            // Ensure user has default bowling parameters if not set
            const userWithDefaults = {
              ...user,
              bowlingStyle: user.bowlingStyle || 'pace',
              bowlingArm: user.bowlingArm || 'right',
            };
            
            // Update localStorage if defaults were added
            if (!user.bowlingStyle || !user.bowlingArm) {
              localStorage.setItem('user', JSON.stringify(userWithDefaults));
            }
            
            set({ token, user: userWithDefaults, isInitialized: true });
          } else {
            // No existing user - create a guest user automatically with default bowling profile
            let deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
              deviceId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
              localStorage.setItem('device_id', deviceId);
            }
            
            const guestUser = {
              id: deviceId,
              name: 'Guest',
              email: `${deviceId}@guest.local`,
              isGuest: true,
              bowlingStyle: 'pace' as const, // Default to pace bowling
              bowlingArm: 'right' as const,  // Default to right-arm (most common)
            };
            const guestToken = `guest_token_${deviceId}`;
            
            localStorage.setItem('authToken', guestToken);
            localStorage.setItem('user', JSON.stringify(guestUser));
            
            set({ token: guestToken, user: guestUser, isInitialized: true });
          }
        } catch (error) {
          console.error('Failed to initialize auth store:', error);
          set({ isInitialized: true });
        }
      },
    }),
    { name: 'AuthStore' }
  )
);

// Selectors for better performance and reusability
export const selectUser = (state: AuthStore) => state.user;
export const selectToken = (state: AuthStore) => state.token;
export const selectIsAuthenticated = (state: AuthStore) => !!state.user && !!state.token;
export const selectIsGuest = (state: AuthStore) => state.user?.isGuest || false;
export const selectUserBowlingProfile = (state: AuthStore) => ({
  bowlingStyle: state.user?.bowlingStyle,
  bowlingArm: state.user?.bowlingArm,
});
