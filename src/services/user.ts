import apiClient from './api';
import axios from 'axios';
import type { User, BowlingStyle, BowlingArm } from '../types';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  is_guest: boolean;
  bowling_style?: BowlingStyle;
  bowling_arm?: BowlingArm;
  total_analyses: number;
  best_score?: number;
  average_score?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  bowlingStyle?: BowlingStyle;
  bowlingArm?: BowlingArm;
  name?: string;
}

class UserService {
  /**
   * Get user profile from backend (includes bowling parameters from database)
   */
  async getProfile(token: string): Promise<UserProfile> {
    // Use axios directly to avoid base URL issue (endpoint is /api/user/profile not /api/v2/user/profile)
    const response = await apiClient.get<UserProfile>('/user/profile'.replace('/api/v2', '/api'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  /**
   * Update user bowling profile (works for both guest and registered users)
   * Note: bowling_arm is no longer user-settable - it's auto-detected from video analysis
   */
  async updateBowlingProfile(
    userId: string,
    bowlingStyle: BowlingStyle
  ): Promise<{ success: boolean; message: string }> {
    // Use axios directly with correct backend URL
    // Note: From Android emulator, use 10.0.2.2 to reach host machine's localhost
    const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v2';
    // const backendURL = baseURL.replace('/api/v2', '').replace('localhost', '10.0.2.2');
    const backendURL = baseURL.replace('/api/v2', '');
    
    const response = await axios.put<{ success: boolean; message: string }>(
      `${backendURL}/api/user/profile`,
      {
        user_id: userId,
        bowling_style: bowlingStyle,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * Convert backend profile to frontend User format
   */
  profileToUser(profile: UserProfile): User {
    return {
      id: profile.user_id,
      name: profile.name,
      email: profile.email,
      isGuest: profile.is_guest,
      bowlingStyle: profile.bowling_style,
      bowlingArm: profile.bowling_arm,
      createdAt: profile.created_at,
    };
  }
}

const userService = new UserService();
export default userService;
