# Social Login Integration Guide

This application now supports social login with Google, Facebook, Instagram, and Twitter (X).

## Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your OAuth credentials:

```bash
cp .env.example .env
```

### 2. OAuth Provider Setup

#### Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Create OAuth 2.0 Client ID credentials
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - Your production domain
6. Add authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback`
   - Your production callback URL
7. Copy the Client ID to `VITE_GOOGLE_CLIENT_ID` in `.env`

#### Facebook Login

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app or select existing one
3. Add "Facebook Login" product
4. Configure OAuth Redirect URIs:
   - `http://localhost:5173/auth/facebook/callback`
   - Your production callback URL
5. Copy the App ID to `VITE_FACEBOOK_APP_ID` in `.env`
6. Make sure your app is in "Live" mode for production

#### Instagram Basic Display

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create a new app or select existing one
3. Add "Instagram Basic Display" product
4. Create a new Instagram App
5. Add OAuth Redirect URIs:
   - `http://localhost:5173/auth/instagram/callback`
   - Your production callback URL
6. Copy the Instagram App ID to `VITE_INSTAGRAM_CLIENT_ID` in `.env`

#### Twitter (X) OAuth 2.0

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or select existing one
3. Enable OAuth 2.0
4. Add Callback URIs:
   - `http://localhost:5173/auth/twitter/callback`
   - Your production callback URL
5. Copy the Client ID to `VITE_TWITTER_CLIENT_ID` in `.env`

### 3. Backend Integration

Your backend needs to implement the following endpoints:

#### POST /auth/social-login
Exchange social provider token for your backend JWT token.

**Request Body:**
```json
{
  "provider": "google|facebook|instagram|twitter",
  "accessToken": "provider_access_token"
}
```

**Response:**
```json
{
  "token": "your_jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "bowlingStyle": "pace",
    "bowlingArm": "right"
  }
}
```

#### POST /auth/{provider}/callback
Handle OAuth callback and exchange authorization code for tokens.

**Request Body:**
```json
{
  "code": "authorization_code",
  "redirectUri": "callback_url"
}
```

**Response:**
```json
{
  "token": "your_jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### 4. Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Click on any social login button
4. Complete the OAuth flow
5. You should be redirected back and logged in

## Implementation Details

### Files Created/Modified

1. **Config:**
   - `src/config/oauth.ts` - OAuth configuration and URL generators

2. **Services:**
   - `src/services/auth.ts` - Added social login method
   - `src/services/socialAuth.ts` - Social authentication service

3. **Components:**
   - `src/components/Auth/GoogleLoginButton.tsx` - Google OAuth button
   - `src/components/Auth/FacebookLoginButton.tsx` - Facebook login button
   - `src/components/Auth/InstagramLoginButton.tsx` - Instagram login button
   - `src/components/Auth/TwitterLoginButton.tsx` - Twitter login button

4. **Pages:**
   - `src/pages/LoginPage.tsx` - Integrated social login buttons
   - `src/pages/SignupPage.tsx` - Integrated social signup buttons

5. **Hooks:**
   - `src/hooks/useAuth.ts` - Added socialLogin method

6. **Types:**
   - `src/types/index.ts` - Added SocialProvider and SocialLoginPayload types

### Security Considerations

1. **State Parameter:** CSRF protection using state tokens (stored in sessionStorage)
2. **PKCE:** Twitter OAuth uses PKCE for enhanced security
3. **Token Storage:** Tokens are stored in localStorage (consider httpOnly cookies for production)
4. **HTTPS:** Always use HTTPS in production
5. **Popup Blocking:** Handle popup blockers gracefully

### Styling

All social buttons follow your existing design system:
- Consistent rounded corners and shadows
- Hover and active states
- Loading states
- Mobile-responsive

### Google Login Button

The Google login button uses the official `@react-oauth/google` library which provides:
- Official Google branding
- Automatic token handling
- Built-in security features

### Facebook, Instagram, Twitter

These providers use custom OAuth 2.0 flow with popup windows:
- Opens OAuth in popup window
- Handles authorization code exchange
- Communicates back to parent window
- Closes popup on success/error

## Troubleshooting

### "Popup blocked"
- Users need to allow popups for your domain
- Alternative: Use redirect-based flow instead of popups

### "Invalid OAuth redirect URI"
- Make sure all redirect URIs are registered in provider console
- Check for trailing slashes and protocol (http vs https)

### "Origin not allowed"
- Add your domain to allowed origins in provider settings
- For Google: JavaScript origins
- For others: Check CORS settings

### Token exchange fails
- Verify backend endpoint is working
- Check network tab for error details
- Ensure backend can validate provider tokens

## Production Checklist

- [ ] Replace placeholder client IDs with real ones
- [ ] Configure production redirect URIs
- [ ] Move credentials to secure environment variables
- [ ] Enable HTTPS
- [ ] Test all providers in production
- [ ] Set up error monitoring
- [ ] Configure rate limiting
- [ ] Add analytics tracking for social logins
