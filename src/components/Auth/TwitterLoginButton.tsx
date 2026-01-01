/**
 * Twitter (X) OAuth Login Button Component
 */

import { useState } from 'react';
import socialAuthService from '../../services/social-auth';

interface TwitterLoginButtonProps {
  onSuccess: (token: string) => void;
  onError?: (error: Error) => void;
  text?: string;
  className?: string;
}

export function TwitterLoginButton({ 
  onSuccess, 
  onError, 
  text = 'Continue with X (Twitter)',
  className = ''
}: TwitterLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await socialAuthService.authenticateWithProvider('twitter');
      onSuccess(response.token);
    } catch (error) {
      console.error('Twitter login error:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`w-full py-4 bg-black text-white border border-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      {isLoading ? 'Loading...' : text}
    </button>
  );
}
