/**
 * Social Authentication Service
 * Handles OAuth flows and exchanges tokens with backend
 * 
 * Uses @codetrix-studio/capacitor-google-auth for native Google Sign-In
 * Uses popup flow for web browsers
 */

import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import apiClient from './api';
import type { AuthResponse, SocialLoginPayload, SocialProvider } from '../types';
import { 
  OAUTH_CONFIG, 
  getFacebookAuthUrl, 
  getGoogleAuthUrl,
  getTwitterAuthUrl, 
  getAppleAuthUrl,
  getStoredCodeVerifier,
  checkPopupBlocked 
} from '../config/oauth';

// ============================================================================
// Helper: Detect if running in native app
// ============================================================================

const isNativeApp = () => Capacitor.isNativePlatform();

// Initialize Google Auth
if (!isNativeApp()) {
  // Web initialization with specific config
  GoogleAuth.initialize({
    clientId: OAUTH_CONFIG.google.clientId,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
} else {
  // Native initialization (reads from capacitor.config.ts)
  GoogleAuth.initialize();
}

// ============================================================================
// Helper: Store auth response in localStorage
// ============================================================================

/**
 * Store authentication response with default bowling parameters
 */
function storeAuthResponse(response: AuthResponse): AuthResponse {
  if (response.token) {
    const userWithDefaults = {
      ...response.user,
      bowlingStyle: response.user.bowlingStyle || 'pace',
      bowlingArm: response.user.bowlingArm || 'right',
    };
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(userWithDefaults));
    response.user = userWithDefaults;
  }
  return response;
}

// ============================================================================
// Social Auth Service Class
// ============================================================================

class SocialAuthService {
  /**
   * Exchange social provider's access token/code for our backend token
   */
  async exchangeToken(payload: SocialLoginPayload): Promise<AuthResponse> {
    try {
      console.log('Exchanging token with backend:', JSON.stringify(payload, null, 2));
      
      // Determine the correct URL based on provider and API structure
      // The backend exposes /auth/{provider} at the root, not under /api/v2
      let url = '/auth/social-login'; // Default fallback
      let requestPayload: any = payload;
      
      if (['google', 'facebook', 'apple', 'twitter'].includes(payload.provider)) {
         // Construct absolute URL to bypass axios baseURL
         const baseUrl = apiClient.defaults.baseURL || '';
         // If baseURL ends with /api/v2, strip it to get the root
         const rootUrl = baseUrl.replace(/\/api\/v2\/?$/, '');
         url = `${rootUrl}/auth/${payload.provider}`;

         // Adjust payload for Google stub endpoint
         if (payload.provider === 'google') {
             requestPayload = { 
               id_token: payload.accessToken,
               email: payload.email,
               name: payload.name,
               picture: payload.profilePicture
             };
         }
      }

      const response = await apiClient.post<any>(url, requestPayload);
      console.log('Backend exchange success:', response.data);
      // Map backend user format to frontend User interface
      // Handle both nested user object and flattened response
      const backendUser = response.data.user || response.data;
      
      // Extract user fields with fallbacks
      // For Google, prefer 'sub' (Google's user ID) over generic 'id' which might be a token
      let id = backendUser.sub || backendUser.user_id || backendUser.google_id;
      
      // If backend returns a generic 'id', check if it looks like a proper ID (numeric) vs a JWT token
      if (!id && backendUser.id) {
        let backendId = String(backendUser.id);
        // Strip any provider prefix first
        if (backendId.startsWith('google_')) {
          backendId = backendId.substring(7);
        }
        // JWT tokens start with 'eyJ', proper IDs are typically numeric or short alphanumeric
        if (!backendId.startsWith('eyJ')) {
          id = backendId;
        }
      }
      
      // Always try to decode from the ID token - this is the most reliable source
      if (payload.accessToken && payload.accessToken.includes('.')) {
        try {
          const base64Url = payload.accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const tokenPayload = JSON.parse(jsonPayload);
          // sub from ID token is the most authoritative source
          if (tokenPayload.sub) {
            id = tokenPayload.sub;
            console.log('Extracted user ID from token sub:', id);
          }
        } catch (e) {
          console.warn('Failed to decode ID from token:', e);
        }
      }
      
      // Prefix with provider for uniqueness if we got a valid ID
      if (id && !id.startsWith('google_') && !id.startsWith('facebook_')) {
        id = `google_${id}`;
      }
      
      if (!id) {
        id = 'unknown_id';
      }
      
      console.log('Final user ID:', id);
      
      // Use backend data, but fallback to payload data if backend data seems invalid (e.g. mock backend generating fake emails)
      let email = backendUser.email || backendUser.email_address || '';
      if ((!email || email.includes('@example.com') || (email.length > 50 && !email.includes('@'))) && payload.email) {
        email = payload.email;
      }

      let name = backendUser.name || backendUser.full_name || backendUser.display_name;
      if ((!name || name === 'User' || name === 'Google User' || name.length > 50) && payload.name) {
        name = payload.name;
      }
      if (!name) {
        name = email.split('@')[0] || 'User';
      }

      let picture = backendUser.picture || backendUser.avatar || backendUser.profile_picture || backendUser.photo_url;
      if (!picture && payload.profilePicture) {
        picture = payload.profilePicture;
      }

      const user = {
        id,
        email,
        name,
        picture,
        isGuest: false,
        createdAt: backendUser.created_at || backendUser.createdAt,
        // Preserve bowling parameters if they exist in the response
        bowlingStyle: backendUser.bowling_style || backendUser.bowlingStyle,
        bowlingArm: backendUser.bowling_arm || backendUser.bowlingArm
      };

      const authResponse: AuthResponse = {
        token: response.data.token || response.data.session_token || response.data.access_token,
        user: user,
        message: response.data.message
      };

      return storeAuthResponse(authResponse);
    } catch (error: any) {
      console.error('Backend exchange failed:', error.message);
      if (error.response) {
        console.error('Backend error status:', error.response.status);
        console.error('Backend error data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Handle OAuth callback - exchange authorization code for backend token
   */
  async handleOAuthCallback(
    provider: SocialProvider, 
    code: string, 
    codeVerifier?: string | null,
    options?: { skipErrorToast?: boolean }
  ): Promise<AuthResponse> {
    const payload: Record<string, string> = {
      code,
      redirectUri: this.getRedirectUri(provider),
    };

    // Include code verifier for Twitter PKCE
    if (provider === 'twitter' && codeVerifier) {
      payload.codeVerifier = codeVerifier;
    }

    // Construct URL relative to root, not API version (same as exchangeToken)
    const baseUrl = apiClient.defaults.baseURL || '';
    const rootUrl = baseUrl.replace(/\/api\/v2\/?$/, '');
    const url = `${rootUrl}/auth/${provider}/callback`;

    const response = await apiClient.post<AuthResponse>(url, payload, { 
      skipErrorToast: options?.skipErrorToast 
    });
    return storeAuthResponse(response.data);
  }

  /**
   * Login with Google using credential (JWT token from @react-oauth/google)
   */
  async loginWithGoogle(credential: string): Promise<AuthResponse> {
    return this.exchangeToken({
      provider: 'google',
      accessToken: credential,
    });
  }

  /**
   * Login with Facebook using authorization code
   */
  async loginWithFacebook(code: string): Promise<AuthResponse> {
    return this.handleOAuthCallback('facebook', code);
  }

  /**
   * Login with Twitter using authorization code and PKCE verifier
   */
  async loginWithTwitter(code: string, codeVerifier?: string | null): Promise<AuthResponse> {
    // If no verifier provided, try to get from session storage
    const verifier = codeVerifier || getStoredCodeVerifier();
    return this.handleOAuthCallback('twitter', code, verifier);
  }

  /**
   * Login with Apple using authorization code/identity token
   */
  async loginWithApple(code: string, identityToken?: string): Promise<AuthResponse> {
    // Construct URL relative to root
    const baseUrl = apiClient.defaults.baseURL || '';
    const rootUrl = baseUrl.replace(/\/api\/v2\/?$/, '');
    const url = `${rootUrl}/auth/apple/callback`;

    const response = await apiClient.post<AuthResponse>(url, {
      code,
      identityToken,
      redirectUri: this.getRedirectUri('apple'),
    });
    return storeAuthResponse(response.data);
  }

  /**
   * Get redirect URI for a provider
   */
  private getRedirectUri(provider: SocialProvider): string {
    const config = OAUTH_CONFIG[provider];
    return config?.redirectUri || `${window.location.origin}/auth/${provider}/callback`;
  }

  /**
   * Open OAuth popup window for authentication
   */
  private async openOAuthPopup(
    provider: SocialProvider
  ): Promise<{ code: string; codeVerifier?: string }> {
    // For native apps, show a helpful message
    if (isNativeApp()) {
      throw new Error(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sign-In is not yet available in the mobile app. Please use email login or try the web version.`
      );
    }

    // Check if popups are blocked
    if (checkPopupBlocked()) {
      throw new Error(
        'Popups are blocked. Please allow popups for this site to use social login, or try a different browser.'
      );
    }

    // Get auth URL based on provider
    let authUrl: string;
    let codeVerifier: string | undefined;

    switch (provider) {
      case 'google':
        authUrl = getGoogleAuthUrl();
        break;
      case 'facebook':
        authUrl = getFacebookAuthUrl();
        break;
      case 'twitter':
        const twitterAuth = await getTwitterAuthUrl();
        authUrl = twitterAuth.url;
        codeVerifier = twitterAuth.codeVerifier;
        break;
      case 'apple':
        authUrl = getAppleAuthUrl();
        break;
      default:
        throw new Error(`Provider ${provider} does not support OAuth`);
    }

    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        `${provider}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0`
      );

      if (!popup) {
        reject(new Error('Failed to open popup window. Please allow popups for this site.'));
        return;
      }

      // Set up timeout for auth (5 minutes)
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Authentication timed out. Please try again.'));
      }, 5 * 60 * 1000);

      // Poll for popup closure
      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            cleanup();
            reject(new Error('Login cancelled'));
          }
        } catch (e) {
          // Ignore cross-origin errors during polling
        }
      }, 500);

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        // Only accept messages from our origin
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'oauth_success') {
          cleanup();
          popup.close();
          resolve({ 
            code: event.data.code,
            codeVerifier: event.data.codeVerifier || codeVerifier 
          });
        } else if (event.data.type === 'oauth_error') {
          cleanup();
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      // Cleanup function
      const cleanup = () => {
        clearInterval(pollTimer);
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
      };

      window.addEventListener('message', messageHandler);
    });
  }

  /**
   * Complete OAuth flow for a provider
   */
  async authenticateWithProvider(provider: SocialProvider): Promise<AuthResponse> {
    // Special handling for Google on Native Apps
    if (provider === 'google' && isNativeApp()) {
      try {
        const googleUser = await GoogleAuth.signIn();
        console.log('Google Native Sign-In Response:', JSON.stringify(googleUser, null, 2));

        // Strategy 1: If we have a serverAuthCode, try the standard callback endpoint
        if (googleUser.serverAuthCode) {
          console.log('Has serverAuthCode, attempting /auth/google/callback...');
          try {
            return await this.handleOAuthCallback('google', googleUser.serverAuthCode, null, { skipErrorToast: true });
          } catch (callbackError: any) {
            console.warn('Callback endpoint failed:', callbackError.message);
            // If callback fails (e.g. 404), fall through to strategy 2
          }
        }

        // Strategy 2: Use ID Token with /auth/social-login exchange
        const authentication = googleUser.authentication;
        const token = authentication?.idToken || authentication?.accessToken;
        
        if (!token) {
          throw new Error('No token received from Google Sign-In');
        }
        
        let email = googleUser.email;
        let name = googleUser.name;
        let picture = googleUser.imageUrl;

        // Fallback: Try to decode ID Token if email or name is missing
        if ((!email || !name) && authentication?.idToken) {
          try {
            const base64Url = authentication.idToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            
            if (payload.email) email = payload.email;
            if (payload.name && !name) name = payload.name;
            if (payload.picture && !picture) picture = payload.picture;
          } catch (e) {
            console.warn('Failed to decode ID Token:', e);
          }
        }
        
        return await this.exchangeToken({
          provider: 'google',
          accessToken: token,
          email: email,
          name: name,
          profilePicture: picture,
        });
      } catch (error) {
        console.error('Google Sign-In Error:', JSON.stringify(error, null, 2));
        throw error;
      }
    }

    const { code, codeVerifier } = await this.openOAuthPopup(provider);

    switch (provider) {
      case 'google':
        return this.handleOAuthCallback('google', code);
      case 'facebook':
        return this.loginWithFacebook(code);
      case 'twitter':
        return this.loginWithTwitter(code, codeVerifier);
      case 'apple':
        return this.loginWithApple(code);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

export default new SocialAuthService();
