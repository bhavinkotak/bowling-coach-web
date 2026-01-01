/**
 * OAuth Callback Page
 * 
 * This page handles OAuth redirects from social providers.
 * It extracts the authorization code from the URL and sends it
 * back to the parent window (if opened as popup) or processes it directly.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyStateToken, getStoredCodeVerifier } from '../config/oauth';
import type { SocialProvider } from '../types';

type CallbackStatus = 'processing' | 'success' | 'error';

export default function OAuthCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // Get parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle error response from provider
      if (error) {
        const message = errorDescription || error || 'Authentication failed';
        setErrorMessage(message);
        setStatus('error');
        sendMessageToOpener('oauth_error', { error: message });
        return;
      }

      // Verify we have required parameters
      if (!code) {
        setErrorMessage('No authorization code received');
        setStatus('error');
        sendMessageToOpener('oauth_error', { error: 'No authorization code received' });
        return;
      }

      // Verify state token for CSRF protection
      if (state && !verifyStateToken(state)) {
        setErrorMessage('Invalid state token - possible CSRF attack');
        setStatus('error');
        sendMessageToOpener('oauth_error', { error: 'Invalid state token' });
        return;
      }

      // Get PKCE code verifier if this was a Twitter auth
      const codeVerifier = provider === 'twitter' ? getStoredCodeVerifier() : null;

      // Check if this is a popup or direct navigation
      if (window.opener && window.opener !== window) {
        // This is a popup - send message to parent and close
        sendMessageToOpener('oauth_success', { 
          code, 
          provider: provider as SocialProvider,
          codeVerifier 
        });
        setStatus('success');
        
        // Close popup after short delay to show success message
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        // Direct navigation - redirect to login with code in state
        // This handles cases where popups are blocked
        setStatus('success');
        
        // Store auth data temporarily and redirect to login
        sessionStorage.setItem('oauth_pending', JSON.stringify({
          provider,
          code,
          codeVerifier,
        }));
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              oauthCallback: true,
              provider,
              code,
              codeVerifier,
            } 
          });
        }, 1000);
      }
    };

    handleCallback();
  }, [searchParams, provider, navigate]);

  /**
   * Send message to parent window (opener)
   */
  const sendMessageToOpener = (type: string, data: Record<string, any>) => {
    if (window.opener && window.opener !== window) {
      try {
        window.opener.postMessage(
          { type, ...data },
          window.location.origin
        );
      } catch (e) {
        console.error('Failed to send message to opener:', e);
      }
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
      
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-emerald-500/20">
          <Activity size={32} className="text-white" />
        </div>

        {/* Status Display */}
        {status === 'processing' && (
          <>
            <Loader2 size={48} className="text-emerald-400 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Processing Login</h1>
            <p className="text-slate-400">
              Completing authentication with {provider ? capitalizeFirst(provider) : 'provider'}...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Login Successful!</h1>
            <p className="text-slate-400">
              {window.opener ? 'This window will close automatically...' : 'Redirecting...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Login Failed</h1>
            <p className="text-slate-400 mb-4">{errorMessage}</p>
            {!window.opener && (
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
              >
                Back to Login
              </button>
            )}
            {window.opener && (
              <p className="text-slate-500 text-sm mt-4">
                This window will close automatically...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
