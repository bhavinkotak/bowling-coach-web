import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { validateEmail, validatePassword } from '../utils/validators';
import { Button, Input } from '../components/Common';
import { 
  GoogleLoginButton, 
  FacebookLoginButton, 
  TwitterLoginButton,
  AppleLoginButton 
} from '../components/Auth';
import type { SocialProvider, AuthResponse } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsGuest, socialLogin, handleLoginSuccess } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSocialLogin = async (provider: SocialProvider, data: string | AuthResponse) => {
    try {
      setIsLoading(true);
      
      if (typeof data === 'object' && 'token' in data) {
        // It's AuthResponse (already exchanged)
        await handleLoginSuccess(data as AuthResponse);
      } else {
        // It's a token (needs exchange)
        await socialLogin(provider, data as string);
      }
      
      toast.success(`Welcome! Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || `${provider} login failed. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialError = (error: Error) => {
    console.error('Social login error:', error);
    toast.error(error.message || 'Social login failed. Please try again.');
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      toast.error(emailValidation.error || 'Invalid email');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.error || 'Invalid password');
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    toast.success('Welcome, Guest!');
    navigate('/');
  };

  if (showEmailForm) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col p-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
        
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="mb-8">
            <button
              onClick={() => setShowEmailForm(false)}
              className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-slate-400">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="you@example.com"
              startIcon={<Mail size={20} />}
              fullWidth
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="••••••••"
              fullWidth
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
            />

            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 flex flex-col p-6 relative overflow-hidden pt-safe-top pb-safe-bottom">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
      <Activity className="absolute -top-10 -right-10 text-slate-800 opacity-50" size={200} />

      <div className="flex-1 flex flex-col justify-end pb-8 relative z-10">
        <div className="mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Bowl Better.</h1>
          <h2 className="text-4xl font-bold text-emerald-400 mb-4">Bowl Faster.</h2>
          <p className="text-slate-400 text-lg">AI-powered biomechanics analysis for the modern cricketer.</p>
        </div>

        <div className="space-y-3">
          {/* Google Login */}
          <div className="google-login-wrapper">
            <GoogleLoginButton
              onSuccess={(credential) => handleSocialLogin('google', credential)}
              onError={handleSocialError}
              text="continue"
            />
          </div>

          {/* Facebook Login */}
          <FacebookLoginButton
            onSuccess={(token) => handleSocialLogin('facebook', token)}
            onError={handleSocialError}
            text="Continue with Facebook"
          />

          {/* Apple Login */}
          <AppleLoginButton
            onSuccess={(token) => handleSocialLogin('apple', token)}
            onError={handleSocialError}
            text="Continue with Apple"
          />

          {/* Twitter Login */}
          <TwitterLoginButton
            onSuccess={(token) => handleSocialLogin('twitter', token)}
            onError={handleSocialError}
            text="Continue with X (Twitter)"
          />

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-slate-500 text-xs uppercase">Or</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <button
            onClick={() => setShowEmailForm(true)}
            className="w-full py-4 bg-transparent border border-slate-700 text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Mail size={18} />
            Sign in with Email
          </button>

          <button
            onClick={handleGuestLogin}
            className="w-full py-4 text-slate-500 text-sm font-medium hover:text-emerald-400 transition-colors"
          >
            Try as Guest (Limited Features)
          </button>
        </div>
      </div>
    </div>
  );
}
