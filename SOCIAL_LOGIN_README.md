# Social Login Integration - Quick Reference

## Overview
Integrated Google, Facebook, Instagram, and Twitter OAuth 2.0 login for the bowling coach app.

## What Was Implemented

### 1. OAuth Components (src/components/Auth/)
- ✅ `GoogleLoginButton.tsx` - Official Google OAuth button
- ✅ `FacebookLoginButton.tsx` - Facebook login with popup flow
- ✅ `InstagramLoginButton.tsx` - Instagram login with popup flow
- ✅ `TwitterLoginButton.tsx` - Twitter/X login with popup flow

### 2. Services
- ✅ `src/services/socialAuth.ts` - Social authentication logic
- ✅ `src/services/auth.ts` - Updated with social login method
- ✅ `src/config/oauth.ts` - OAuth configuration and URL generators

### 3. UI Integration
- ✅ `LoginPage.tsx` - Added all 4 social login buttons
- ✅ `SignupPage.tsx` - Added all 4 social signup buttons
- ✅ `useAuth.ts` hook - Added `socialLogin` method

### 4. Types
- ✅ `SocialProvider` type - 'google' | 'facebook' | 'instagram' | 'twitter'
- ✅ `SocialLoginPayload` interface - For API requests

## Quick Start

### 1. Install Dependencies
```bash
npm install @react-oauth/google
```
✅ Already installed

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Then edit .env with your OAuth credentials
```

### 3. Set Up OAuth Apps

**Google:** https://console.cloud.google.com/apis/credentials
- Create OAuth 2.0 Client ID
- Add `http://localhost:5173` to Authorized JavaScript origins
- Add `http://localhost:5173/auth/google/callback` to Authorized redirect URIs

**Facebook:** https://developers.facebook.com/apps/
- Create App → Add Facebook Login
- Add `http://localhost:5173/auth/facebook/callback` to Valid OAuth Redirect URIs

**Instagram:** https://developers.facebook.com/apps/
- Add Instagram Basic Display product
- Add `http://localhost:5173/auth/instagram/callback` to Valid OAuth Redirect URIs

**Twitter:** https://developer.twitter.com/en/portal/dashboard
- Create App → Set up OAuth 2.0
- Add `http://localhost:5173/auth/twitter/callback` to Callback URIs

### 4. Update Backend

Your backend needs to implement:

#### POST /auth/social-login
```typescript
{
  provider: 'google' | 'facebook' | 'instagram' | 'twitter',
  accessToken: string
}
→ Returns: { token: string, user: User }
```

#### POST /auth/{provider}/callback (Optional - for code exchange)
```typescript
{
  code: string,
  redirectUri: string
}
→ Returns: { token: string, user: User }
```

## Usage Example

```typescript
import { useAuth } from '../hooks/useAuth';
import { GoogleLoginButton } from '../components/Auth';

function LoginPage() {
  const { socialLogin } = useAuth();

  const handleGoogleLogin = async (credential: string) => {
    try {
      await socialLogin('google', credential);
      // User is now logged in
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <GoogleLoginButton
      onSuccess={handleGoogleLogin}
      onError={(error) => console.error(error)}
    />
  );
}
```

## Features

✅ **Google Login** - Official Google OAuth with @react-oauth/google
✅ **Facebook Login** - Popup-based OAuth flow
✅ **Instagram Login** - Popup-based OAuth flow with Instagram Basic Display API
✅ **Twitter/X Login** - OAuth 2.0 with PKCE support
✅ **Security** - CSRF protection with state tokens
✅ **Responsive Design** - Mobile-friendly buttons
✅ **Loading States** - Proper feedback during authentication
✅ **Error Handling** - User-friendly error messages
✅ **Type Safety** - Full TypeScript support

## File Structure

```
src/
├── components/
│   └── Auth/
│       ├── GoogleLoginButton.tsx
│       ├── FacebookLoginButton.tsx
│       ├── InstagramLoginButton.tsx
│       ├── TwitterLoginButton.tsx
│       └── index.ts
├── config/
│   └── oauth.ts
├── services/
│   ├── auth.ts
│   └── socialAuth.ts
├── hooks/
│   └── useAuth.ts
├── pages/
│   ├── LoginPage.tsx
│   └── SignupPage.tsx
└── types/
    └── index.ts
```

## Environment Variables

```bash
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=xxx
VITE_INSTAGRAM_CLIENT_ID=xxx
VITE_TWITTER_CLIENT_ID=xxx
VITE_APP_URL=http://localhost:5173
```

## Testing Checklist

- [ ] Google login works in dev
- [ ] Facebook login works in dev
- [ ] Instagram login works in dev
- [ ] Twitter login works in dev
- [ ] Error handling works (popup blocked, cancelled, etc.)
- [ ] User data syncs correctly
- [ ] Bowling profile defaults are set
- [ ] Navigation works after login
- [ ] All providers tested in production

## Next Steps

1. **Get OAuth Credentials** - Set up apps on each provider's platform
2. **Configure Backend** - Implement social login endpoints
3. **Test Locally** - Verify each provider works
4. **Deploy** - Update production redirect URIs
5. **Monitor** - Track login success/failure rates

## Support & Documentation

- Full setup guide: `SOCIAL_LOGIN_SETUP.md`
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2
- Facebook Login Docs: https://developers.facebook.com/docs/facebook-login
- Instagram API Docs: https://developers.facebook.com/docs/instagram-basic-display-api
- Twitter OAuth Docs: https://developer.twitter.com/en/docs/authentication/oauth-2-0

## Notes

- Google uses JWT credentials directly (no code exchange needed)
- Facebook, Instagram, Twitter use popup-based OAuth flow
- All tokens are exchanged with backend for app-specific JWT
- State tokens prevent CSRF attacks
- Popup blockers may need to be handled in production
