import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { BowlingStyleSelector, Button, Badge } from '../components/Common';
import { User, Mail, Calendar, Shield, ArrowLeft } from 'lucide-react';
import type { BowlingStyle } from '../types';
import { toast } from 'react-hot-toast';
import userService from '../services/user';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle>(user?.bowlingStyle || 'pace');
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with user object when it changes
  useEffect(() => {
    if (user) {
      console.log('👤 User object changed, syncing local state:', JSON.stringify({
        userBowlingStyle: user.bowlingStyle,
        currentLocalStyle: bowlingStyle
      }));
      setBowlingStyle(user.bowlingStyle || 'pace');
    }
  }, [user?.bowlingStyle]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    console.log('🎯 handleSaveProfile called', { bowlingStyle, userId: user.id });
    setIsSaving(true);
    try {
      // Save to backend (works for both guest and registered users)
      console.log('📡 Calling backend API...');
      const response = await userService.updateBowlingProfile(user.id, bowlingStyle);
      console.log('✅ Backend response:', response);
      console.log('✅ Bowling profile saved to backend:', { 
        bowlingStyle, 
        userId: user.id,
        isGuest: user.isGuest 
      });
      
      // Show success toast FIRST (before state update that might cause re-render)
      console.log('🎉 Showing success toast...');
      toast.success('Bowling profile saved successfully!', { 
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
          zIndex: 9999,
        },
      });
      
      // Update local state after a brief delay to ensure toast is mounted
      console.log('💾 Updating local state...');
      console.log('💾 Values to save:', JSON.stringify({ bowlingStyle }));
      console.log('💾 Current user state:', JSON.stringify({ 
        currentBowlingStyle: user.bowlingStyle 
      }));
      await new Promise(resolve => setTimeout(resolve, 50));
      updateUser({ bowlingStyle });
      console.log('✅ Bowling profile updated locally:', JSON.stringify({ bowlingStyle }));
      
      // Verify it was saved
      setTimeout(() => {
        const savedUser = localStorage.getItem('user');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        console.log('🔍 Verification - localStorage after save:', JSON.stringify({
          bowlingStyle: parsedUser?.bowlingStyle,
          bowlingArm: parsedUser?.bowlingArm,
          fullUser: parsedUser
        }, null, 2));
      }, 100);
    } catch (error: any) {
      console.error('❌ Error updating bowling profile:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response',
        request: error.request ? 'Request was made' : 'No request',
        config: error.config ? {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        } : 'No config'
      });
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update bowling profile';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-900 py-8 px-4 pt-safe-top pb-safe-bottom">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft size={20} />}
            className="mb-6"
          >
            Back to Home
          </Button>

          {/* Profile Header */}
          <div className="bg-slate-800 rounded-2xl p-8 mb-6 border border-slate-700">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <span className="text-4xl font-bold text-white">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <p className="text-slate-400 mb-4">{user.email}</p>
                {user.isGuest && (
                  <Badge variant="warning" size="md">
                    <Shield size={16} className="inline mr-1" />
                    Guest Account
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-6">Account Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-1">Full Name</p>
                  <p className="text-white font-medium">{user.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Mail size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-1">Email Address</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400 mb-1">Member Since</p>
                  <p className="text-white font-medium">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Recently joined'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bowling Profile */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 mt-6">
            <h2 className="text-xl font-bold text-white mb-4">Bowling Profile</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your bowling style helps our AI provide accurate biomechanical analysis.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Bowling Style
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Pace and spin bowling have fundamentally different biomechanics
              </p>
              <BowlingStyleSelector 
                value={bowlingStyle} 
                onChange={setBowlingStyle}
                disabled={isSaving}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleSaveProfile}
              disabled={isSaving || bowlingStyle === user.bowlingStyle}
              loading={isSaving}
              fullWidth
            >
              Save Bowling Profile
            </Button>
          </div>

          {user.isGuest && (
            <div className="mt-6 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <h3 className="text-amber-500 font-bold mb-2">Guest Account Limitations</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Limited to device-based profile</li>
                <li>• Data is stored locally on this device</li>
                <li>• Create a full account to sync across devices</li>
              </ul>
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                className="mt-4"
              >
                Upgrade to Full Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
