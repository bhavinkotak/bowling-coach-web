/**
 * Apple Sign In Button Component
 */

import { useState } from 'react';
import socialAuthService from '../../services/social-auth';

interface AppleLoginButtonProps {
  onSuccess: (token: string) => void;
  onError?: (error: Error) => void;
  text?: string;
  className?: string;
}

export function AppleLoginButton({ 
  onSuccess, 
  onError, 
  text = 'Continue with Apple',
  className = ''
}: AppleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await socialAuthService.authenticateWithProvider('apple');
      onSuccess(response.token);
    } catch (error) {
      console.error('Apple login error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38-1.09-.52-2.09-.53-3.24 0-1.44.66-2.2.52-3.08-.38C3.21 15.64 3.91 8.48 9.05 8.24c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.14l.01.01zM12.03 8.2c-.15-2.23 1.66-4.07 3.74-4.2.29 2.58-2.34 4.52-3.74 4.2z"/>
      </svg>
      {isLoading ? 'Loading...' : text}
    </button>
  );
}
