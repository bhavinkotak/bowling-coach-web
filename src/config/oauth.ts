/**
 * OAuth Configuration for Social Login
 * 
 * IMPORTANT: Replace with your actual OAuth credentials in .env file:
 * 
 * Google OAuth: https://console.cloud.google.com/apis/credentials
 * Facebook Login: https://developers.facebook.com/apps/
 * Twitter OAuth 2.0: https://developer.twitter.com/en/portal/dashboard
 * Apple Sign In: https://developer.apple.com/account/resources/identifiers/list/serviceId
 * 
 * For production, these should be stored in environment variables (.env file)
 * 
 * NOTE: For mobile apps (Capacitor), we use the same HTTP redirect URI as web.
 * The Capacitor app intercepts the redirect via localhost or configured VITE_APP_URL.
 */

// Facebook Graph API version - can be overridden via env var
const FB_API_VERSION = import.meta.env.VITE_FB_API_VERSION || 'v18.0';

// Get redirect URI - always use HTTP/HTTPS (required by Google)
const getRedirectUri = (provider: string): string => {
  const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
  return `${baseUrl}/auth/${provider}/callback`;
};

export const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: getRedirectUri('google'),
  },
  
  facebook: {
    appId: import.meta.env.VITE_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
    redirectUri: getRedirectUri('facebook'),
    scope: 'email,public_profile',
    apiVersion: FB_API_VERSION,
  },
  
  twitter: {
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || 'YOUR_TWITTER_CLIENT_ID',
    redirectUri: getRedirectUri('twitter'),
    scope: 'tweet.read users.read offline.access',
  },
  
  apple: {
    clientId: import.meta.env.VITE_APPLE_CLIENT_ID || 'YOUR_APPLE_SERVICE_ID',
    redirectUri: getRedirectUri('apple'),
    scope: 'name email',
  },
};

export type SocialProvider = 'google' | 'facebook' | 'twitter' | 'apple';

// ============================================================================
// PKCE (Proof Key for Code Exchange) Implementation for Twitter OAuth 2.0
// ============================================================================

/**
 * Generate a cryptographically secure random code verifier for PKCE
 * @returns Base64URL encoded string of 43-128 characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 * @param verifier The code verifier string
 * @returns Promise resolving to Base64URL encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Base64URL encode a Uint8Array (RFC 4648)
 */
function base64URLEncode(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ============================================================================
// State Token Management (CSRF Protection)
// ============================================================================

/**
 * Generate a random state token for CSRF protection
 */
export function generateStateToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const token = base64URLEncode(array);
  sessionStorage.setItem('oauth_state', token);
  return token;
}

/**
 * Verify state token matches the stored one
 */
export function verifyStateToken(state: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return state === storedState;
}

/**
 * Store PKCE code verifier for later use
 */
export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem('pkce_code_verifier', verifier);
}

/**
 * Retrieve and remove stored PKCE code verifier
 */
export function getStoredCodeVerifier(): string | null {
  const verifier = sessionStorage.getItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_code_verifier');
  return verifier;
}

// ============================================================================
// OAuth Authorization URL Generators
// ============================================================================

/**
 * Generate OAuth authorization URL for Facebook
 */
export function getFacebookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.facebook.appId,
    redirect_uri: OAUTH_CONFIG.facebook.redirectUri,
    scope: OAUTH_CONFIG.facebook.scope,
    response_type: 'code',
    state: generateStateToken(),
  });
  return `https://www.facebook.com/${OAUTH_CONFIG.facebook.apiVersion}/dialog/oauth?${params.toString()}`;
}

/**
 * Generate OAuth authorization URL for Google
 */
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.google.clientId,
    redirect_uri: OAUTH_CONFIG.google.redirectUri,
    scope: 'openid email profile',
    response_type: 'code',
    access_type: 'offline',
    prompt: 'select_account',
    state: generateStateToken(),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Generate OAuth authorization URL for Twitter with PKCE
 * @returns Object containing the auth URL and the code verifier (needed for token exchange)
 */
export async function getTwitterAuthUrl(): Promise<{ url: string; codeVerifier: string }> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Store verifier for later token exchange
  storeCodeVerifier(codeVerifier);
  
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.twitter.clientId,
    redirect_uri: OAUTH_CONFIG.twitter.redirectUri,
    scope: OAUTH_CONFIG.twitter.scope,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: generateStateToken(),
  });
  
  return {
    url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
    codeVerifier,
  };
}

/**
 * Generate OAuth authorization URL for Apple Sign In
 */
export function getAppleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.apple.clientId,
    redirect_uri: OAUTH_CONFIG.apple.redirectUri,
    scope: OAUTH_CONFIG.apple.scope,
    response_type: 'code id_token',
    response_mode: 'fragment',
    state: generateStateToken(),
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

/**
 * Get authorization URL for a provider (legacy compatibility)
 * Note: For Twitter, use getTwitterAuthUrl() directly for PKCE support
 */
export function getAuthorizationUrl(provider: SocialProvider): string {
  switch (provider) {
    case 'google':
      return getGoogleAuthUrl();
    case 'facebook':
      return getFacebookAuthUrl();
    case 'twitter':
      // For Twitter, caller should use getTwitterAuthUrl() for PKCE
      // This is kept for backward compatibility but won't work properly
      console.warn('Use getTwitterAuthUrl() for Twitter OAuth with PKCE support');
      return '';
    case 'apple':
      return getAppleAuthUrl();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ============================================================================
// Popup Utilities
// ============================================================================

/**
 * Check if popups are likely blocked
 */
export function checkPopupBlocked(): boolean {
  const popup = window.open('', '_blank', 'width=1,height=1');
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    return true;
  }
  popup.close();
  return false;
}
