import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Smartphone, ArrowLeft, User, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { validateEmail, validatePassword } from '../utils/validators';
import { Button, Input } from '../components/Common';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

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

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
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

  if (showEmailForm) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col p-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
        
        <div className="flex-1 flex flex-col justify-center relative z-10 overflow-y-auto py-8">
          <div className="mb-8">
            <button
              onClick={() => setShowEmailForm(false)}
              className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Join thousands of bowlers improving their technique</p>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <Input
              id="name"
              name="name"
              type="text"
              label="Full Name"
              startIcon={<User size={20} />}
              required
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              fullWidth
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="John Doe"
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              startIcon={<Mail size={20} />}
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              fullWidth
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="you@example.com"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              startIcon={<Lock size={20} />}
              helperText="At least 8 characters"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              fullWidth
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="••••••••"
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              startIcon={<Lock size={20} />}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              fullWidth
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              className="mt-6"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                Sign in
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
          <button
            onClick={() => navigate('/login')}
            className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Login</span>
          </button>
          
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
            <Activity size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Start Your</h1>
          <h2 className="text-4xl font-bold text-emerald-400 mb-4">Bowling Journey.</h2>
          <p className="text-slate-400 text-lg">Create an account to unlock AI-powered analysis.</p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => toast('Google sign-up coming soon!', { icon: '🔐' })}
            leftIcon={
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                G
              </div>
            }
            className="bg-white text-slate-900 hover:bg-slate-100 border-white shadow-lg"
          >
            Sign up with Google
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => toast('Apple sign-up coming soon!', { icon: '🍎' })}
            leftIcon={
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <Smartphone size={12} className="text-black" fill="black" />
              </div>
            }
            className="bg-slate-800 hover:bg-slate-700"
          >
            Sign up with Apple
          </Button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-slate-500 text-xs uppercase">Or</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => setShowEmailForm(true)}
            leftIcon={<Mail size={18} />}
          >
            Sign up with Email
          </Button>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              By signing up, you agree to our{' '}
              <button className="text-emerald-400 hover:underline">Terms</button>
              {' '}and{' '}
              <button className="text-emerald-400 hover:underline">Privacy Policy</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
