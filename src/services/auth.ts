import apiClient from './api';
import type { User, AuthResponse } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Store token and user in localStorage with default bowling parameters
    if (response.data.token) {
      const userWithDefaults = {
        ...response.data.user,
        bowlingStyle: response.data.user.bowlingStyle || 'pace',
        bowlingArm: response.data.user.bowlingArm || 'right',
      };
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(userWithDefaults));
      response.data.user = userWithDefaults;
    }
    
    return response.data;
  }

  /**
   * Signup new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    
    // Auto-login after signup - store token and user with default bowling parameters
    if (response.data.token) {
      const userWithDefaults = {
        ...response.data.user,
        bowlingStyle: response.data.user.bowlingStyle || 'pace',
        bowlingArm: response.data.user.bowlingArm || 'right',
      };
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(userWithDefaults));
      response.data.user = userWithDefaults;
    }
    
    return response.data;
  }

  /**
   * Verify if current token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;
      
      await apiClient.post('/auth/verify', { token });
      return true;
    } catch (error) {
      // Token is invalid
      this.logout();
      return false;
    }
  }

  /**
   * Logout user - clear local storage
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
