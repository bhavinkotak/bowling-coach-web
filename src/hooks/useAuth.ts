import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import AuthService from '../services/auth';
// Import social auth service
import socialAuthService from '../services/social-auth';
import userService from '../services/user';
import type { SocialProvider, AuthResponse } from '../types';

export function useAuth() {
  const { user, token, setUser, setToken, updateUser, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  // Verify token and sync profile from backend on mount
  useEffect(() => {
    const verifyAndSyncProfile = async () => {
      if (token && !user?.isGuest) {
        try {
          const isValid = await AuthService.verifyToken();
          if (!isValid) {
            storeLogout();
            navigate('/login');
          } else {
            // Token is valid, try to get user from localStorage first
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const localUser = JSON.parse(storedUser);
              setUser(localUser);
              
              // Fetch profile from backend to sync bowling parameters
              try {
                const profile = await userService.getProfile(token);
                const syncedUser = userService.profileToUser(profile);
                
                // Update with backend data (source of truth for bowling params)
                if (syncedUser.bowlingStyle && syncedUser.bowlingArm) {
                  updateUser({
                    bowlingStyle: syncedUser.bowlingStyle,
                    bowlingArm: syncedUser.bowlingArm,
                  });
                  console.log('✅ Synced bowling profile from backend:', {
                    bowlingStyle: syncedUser.bowlingStyle,
                    bowlingArm: syncedUser.bowlingArm,
                  });
                }
              } catch (profileError) {
                console.warn('Could not fetch profile from backend:', profileError);
                // Continue with local user data
              }
            }
          }
        } catch (error) {
          // Token invalid, clear auth state
          storeLogout();
          navigate('/login');
        }
      }
    };

    verifyAndSyncProfile();
  }, [token, user?.isGuest, setUser, updateUser, storeLogout, navigate]);

  const login = async (email: string, password: string) => {
    const response = await AuthService.login({ email, password });
    setToken(response.token);
    setUser(response.user);
    
    // Fetch full profile from backend to get bowling parameters
    try {
      const profile = await userService.getProfile(response.token);
      const syncedUser = userService.profileToUser(profile);
      
      // Update with backend bowling parameters
      if (syncedUser.bowlingStyle && syncedUser.bowlingArm) {
        updateUser({
          bowlingStyle: syncedUser.bowlingStyle,
          bowlingArm: syncedUser.bowlingArm,
        });
        console.log('✅ Synced bowling profile on login:', {
          bowlingStyle: syncedUser.bowlingStyle,
          bowlingArm: syncedUser.bowlingArm,
        });
      }
    } catch (error) {
      console.warn('Could not fetch profile after login:', error);
    }
    
    return response;
  };

  const signup = async (data: { name: string; email: string; password: string }) => {
    const response = await AuthService.signup(data);
    setToken(response.token);
    setUser(response.user);
    
    // Fetch full profile from backend to get bowling parameters
    try {
      const profile = await userService.getProfile(response.token);
      const syncedUser = userService.profileToUser(profile);
      
      // Update with backend bowling parameters
      if (syncedUser.bowlingStyle && syncedUser.bowlingArm) {
        updateUser({
          bowlingStyle: syncedUser.bowlingStyle,
          bowlingArm: syncedUser.bowlingArm,
        });
        console.log('✅ Synced bowling profile on signup:', {
          bowlingStyle: syncedUser.bowlingStyle,
          bowlingArm: syncedUser.bowlingArm,
        });
      }
    } catch (error) {
      console.warn('Could not fetch profile after signup:', error);
    }
    
    return response;
  };

  const loginAsGuest = () => {
    // Generate or retrieve device ID for guest user
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      // Generate a unique device ID based on browser fingerprint
      deviceId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('device_id', deviceId);
    }
    
    // Create a guest user with device-based identity and default bowling profile
    const guestUser = {
      id: deviceId,
      name: 'Guest',
      email: `${deviceId}@guest.local`,
      isGuest: true,
      bowlingStyle: 'pace' as const, // Default to pace bowling
      bowlingArm: 'right' as const,  // Default to right-arm (most common)
    };
    const guestToken = `guest_token_${deviceId}`;
    
    setToken(guestToken);
    setUser(guestUser);
  };

  const logout = () => {
    AuthService.logout();
    storeLogout();
    navigate('/login');
  };

  const socialLogin = async (provider: SocialProvider, accessToken: string) => {
    const response = await socialAuthService.exchangeToken({
      provider,
      accessToken,
    });
    
    setToken(response.token);
    setUser(response.user);
    
    // Fetch full profile from backend to get bowling parameters
    try {
      const profile = await userService.getProfile(response.token);
      const syncedUser = userService.profileToUser(profile);
      
      // Update with backend bowling parameters
      if (syncedUser.bowlingStyle && syncedUser.bowlingArm) {
        updateUser({
          bowlingStyle: syncedUser.bowlingStyle,
          bowlingArm: syncedUser.bowlingArm,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleLoginSuccess = async (response: AuthResponse) => {
    setToken(response.token);
    setUser(response.user);
    
    // Fetch full profile from backend to get bowling parameters
    try {
      const profile = await userService.getProfile(response.token);
      const syncedUser = userService.profileToUser(profile);
      
      // Update with backend bowling parameters
      if (syncedUser.bowlingStyle && syncedUser.bowlingArm) {
        updateUser({
          bowlingStyle: syncedUser.bowlingStyle,
          bowlingArm: syncedUser.bowlingArm,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };



  const isAuthenticated = !!user && !!token;

  return {
    user,
    token,
    isAuthenticated,
    login,
    signup,
    logout,
    loginAsGuest,
    socialLogin,
    handleLoginSuccess,
    updateUser,
  };
}
