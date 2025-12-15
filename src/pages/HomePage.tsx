import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, TrendingUp, Activity, Play, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import analysisService from '../services/analysis';
import type { AnalysisResult } from '../types';
import { Button, Badge, AnalysisCardSkeleton } from '../components/Common';
import { toast } from 'react-hot-toast';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageScore: 0,
    totalAnalyses: 0,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load analyses on mount and when returning to home page
  useEffect(() => {
    console.log('[HomePage] ========== useEffect FIRED ==========');
    console.log('[HomePage] Timestamp:', new Date().toISOString());
    console.log('[HomePage] user:', user);
    console.log('[HomePage] user?.id:', user?.id);
    console.log('[HomePage] location.key:', location.key);
    console.log('[HomePage] Current stats BEFORE load:', stats);
    
    if (user?.id) {
      console.log('[HomePage] ✅ User ID exists, loading analyses...');
      loadUserAnalyses();
    } else {
      console.log('[HomePage] ⚠️ No user ID, skipping analysis load');
      console.log('[HomePage] User object:', JSON.stringify(user, null, 2));
    }
  }, [user?.id, location.key]); // Added location.key to refresh when navigating back
  
  // Also refresh when window regains focus (user returns from another tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[HomePage] Focus event - visibility:', document.visibilityState);
      if (user?.id && document.visibilityState === 'visible') {
        console.log('[HomePage] 🔄 Refreshing analyses on focus...');
        loadUserAnalyses();
      }
    };
    
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  const loadUserAnalyses = async () => {
    try {
      setLoading(true);
      console.log('[HomePage] ========== loadUserAnalyses CALLED ==========');
      console.log('[HomePage] Loading analyses for user:', user?.id);
      console.log('[HomePage] User object:', user);
      console.log('[HomePage] Calling getUserAnalyses API...');
      console.log('[HomePage] API call timestamp:', new Date().toISOString());
      
      const response = await analysisService.getUserAnalyses(user!.id, 5);
      
      console.log('[HomePage] ========== API RESPONSE RECEIVED ==========');
      console.log('[HomePage] Response timestamp:', new Date().toISOString());
      console.log('[HomePage] Raw response data:', response);
      console.log('[HomePage] Total count from backend:', response.totalCount);
      console.log('[HomePage] Average score from backend:', response.averageScore);
      console.log('[HomePage] Recent analyses count:', response.analyses?.length || 0);
      
      // Set recent analyses (already sorted and limited by backend)
      setRecentAnalyses(response.analyses || []);
      
      // Use stats from backend (already calculated)
      const newStats = {
        averageScore: Math.round(response.averageScore),
        totalAnalyses: response.totalCount,
      };
      
      console.log('[HomePage] 📊 Updating stats:', newStats);
      setStats(newStats);
      console.log('[HomePage] ✅ Stats updated successfully');
    } catch (error: any) {
      console.error('[HomePage] ❌ Failed to load user analyses:', error);
      console.error('[HomePage] Error type:', error?.constructor?.name);
      console.error('[HomePage] Error message:', error?.message);
      
      const errorDetails = {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
        fullURL: error?.config?.baseURL + error?.config?.url,
      };
      console.error('[HomePage] Error details:', JSON.stringify(errorDetails, null, 2));
      
      // If endpoint doesn't exist (404), gracefully show empty state
      // This is expected if backend doesn't have history endpoint yet
      setRecentAnalyses([]);
      setStats({ averageScore: 0, totalAnalyses: 0 });
    } finally {
      setLoading(false);
      console.log('[HomePage] Loading state set to false');
    }
  };

  const handleDeleteAnalysis = async (analysisId: string, event: React.MouseEvent) => {
    // Stop propagation to prevent navigation to results page
    event.stopPropagation();
    
    // Confirm deletion
    const confirmed = window.confirm(
      'Are you sure you want to delete this analysis? This action cannot be undone and will remove all associated videos, clips, and snapshots.'
    );
    
    if (!confirmed) return;
    
    setDeletingId(analysisId);
    
    try {
      const result = await analysisService.deleteAnalysis(analysisId);
      
      toast.success(`Analysis deleted successfully (${result.files_deleted} files removed)`);
      
      // Remove from local state
      setRecentAnalyses(prev => prev.filter(a => 
        (a.analysisId || a.analysis_id) !== analysisId
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalAnalyses: Math.max(0, prev.totalAnalyses - 1)
      }));
      
      // Show any errors that occurred during file cleanup
      if (result.errors && result.errors.length > 0) {
        console.warn('Some files could not be deleted:', result.errors);
      }
      
    } catch (error: any) {
      console.error('Failed to delete analysis:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete analysis');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 pb-8 rounded-b-3xl shadow-lg relative">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-slate-400 text-sm">Welcome back,</h1>
            <h2 className="text-2xl font-bold">{user?.name || 'Guest'}</h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="w-10 h-10 p-0 bg-slate-700 rounded-full border border-slate-600 hover:bg-slate-600"
          >
            <span className="text-white font-bold text-lg">
              {user?.name?.charAt(0) || 'G'}
            </span>
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-emerald-400" />
              <span className="text-xs text-slate-400 font-bold uppercase">Avg Score</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : stats.averageScore}
              <span className="text-sm text-slate-500 font-normal">/100</span>
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-blue-400" />
              <span className="text-xs text-slate-400 font-bold uppercase">Analyses</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {loading ? '...' : stats.totalAnalyses}
              <span className="text-sm text-slate-500 font-normal"> total</span>
            </p>
          </div>
        </div>
      </header>

      {/* Main CTA */}
      <div className="px-6 -mt-6 z-10">
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/upload')}
          fullWidth
          className="justify-between px-6 shadow-lg shadow-emerald-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Camera size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Upload or Record Video</p>
              <p className="text-emerald-100 text-xs font-normal">Upload from gallery or record directly</p>
            </div>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Button>
      </div>

      {/* Recent Analysis */}
      <div className="flex-1 px-6 pt-6 overflow-y-auto pb-6">
        <h3 className="font-bold text-slate-800 mb-3">Recent Analysis</h3>
        
        {loading ? (
          <div className="space-y-3">
            <AnalysisCardSkeleton />
            <AnalysisCardSkeleton />
            <AnalysisCardSkeleton />
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-emerald-500/30">
              <Camera size={32} className="text-emerald-500" />
            </div>
            <p className="text-slate-800 font-bold text-lg mb-2">Start Your First Analysis</p>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Upload a bowling video to get AI-powered biomechanical insights and improve your technique
            </p>
          </div>
        ) : (
          recentAnalyses.map((analysis) => {
            const score = Math.round(analysis.overallScore || analysis.overall_score || 0);
            const analysisId = analysis.analysisId || analysis.analysis_id || '';
            const sequenceNumber = analysis.sequenceNumber || analysis.sequence_number;
            
            // Get top parameters (if available)
            const topParams = analysis.parameters 
              ? Object.entries(analysis.parameters)
                  .slice(0, 2)
                  .map(([key]) => key.replace(/_/g, ' '))
              : [];

            // Get date from created_at field
            let dateStr = 'Recent';
            try {
              const createdAt = analysis.createdAt || analysis.created_at;
              if (createdAt) {
                const date = new Date(createdAt);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                
                if (diffHours < 1) {
                  dateStr = 'Just now';
                } else if (diffHours < 24) {
                  dateStr = `${diffHours}h ago`;
                } else if (diffDays < 7) {
                  dateStr = `${diffDays}d ago`;
                } else {
                  dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });
                }
              }
            } catch (e) {
              console.warn('Could not parse date from created_at:', analysis.created_at);
            }

            const handleNavigate = async () => {
              // Check if it's multi-video or single-video by fetching both endpoints
              // Try multi-video first since it has a specific structure
              try {
                console.log('🔍 Checking analysis type for:', analysisId);
                const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v2', '') || 'http://localhost:8000';
                
                // Try multi-video endpoint first
                const multiResponse = await fetch(`${API_BASE}/api/v2/multi-analysis/${analysisId}`);
                console.log('📡 Multi-video response status:', multiResponse.status);
                
                if (multiResponse.ok) {
                  const multiData = await multiResponse.json();
                  console.log('📦 Multi-video data:', multiData);
                  
                  // Check if it has multi-video specific structure:
                  // 1. parameters is an array (not object)
                  // 2. First parameter has best_angle field
                  // 3. Has video_count or videoCount field
                  const isMultiVideo = (
                    multiData.parameters && 
                    Array.isArray(multiData.parameters) && 
                    multiData.parameters.length > 0 && 
                    (
                      multiData.parameters[0].best_angle !== undefined ||
                      multiData.video_count > 1 ||
                      multiData.videoCount > 1
                    )
                  );
                  
                  console.log('✅ Is multi-video?', isMultiVideo);
                  
                  if (isMultiVideo) {
                    console.log('➡️  Navigating to multi-video results:', analysisId);
                    navigate(`/multi-results/${analysisId}`);
                    return;
                  }
                }
                
                // If multi-video check failed, try single-video endpoint
                console.log('📡 Checking single-video endpoint...');
                const singleResponse = await fetch(`${API_BASE}/api/v2/analysis/${analysisId}`);
                console.log('📡 Single-video response status:', singleResponse.status);
                
                if (singleResponse.ok) {
                  console.log('➡️  Navigating to single-video results:', analysisId);
                  navigate(`/results/${analysisId}`);
                  return;
                }
                
                // If both fail, default to single-video (will show error there)
                console.log('⚠️  Both endpoints failed, defaulting to single-video route');
                navigate(`/results/${analysisId}`);
                
              } catch (e) {
                console.error('❌ Error checking analysis type:', e);
                // On error, default to single-video route
                navigate(`/results/${analysisId}`);
              }
            };
            
            return (
              <div
                key={analysisId}
                onClick={handleNavigate}
                className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between mb-3 active:scale-98 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden relative">
                    {analysis.videoInfo?.parameterSnapshots ? (
                      <img 
                        src={Object.values(analysis.videoInfo.parameterSnapshots)[0] as string}
                        alt="Analysis thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={16} className="text-white fill-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      Analysis #{sequenceNumber || '?'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {dateStr}
                    </p>
                    {topParams.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {topParams.map((param, i) => (
                          <Badge 
                            key={i}
                            variant="default" 
                            size="sm"
                            className="capitalize"
                          >
                            {param}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}
                    size="md"
                    className="rounded-full w-8 h-8 flex items-center justify-center font-bold border-2"
                  >
                    {score}
                  </Badge>
                  <button
                    onClick={(e) => handleDeleteAnalysis(analysisId, e)}
                    disabled={deletingId === analysisId}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Delete analysis"
                  >
                    {deletingId === analysisId ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
