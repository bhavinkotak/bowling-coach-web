import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, AlertCircle, TrendingUp, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { useResultsStore } from '../stores/resultsStore';
import { ParameterCard } from '../components/Results';
import { LoadingSpinner, Button, Badge } from '../components/Common';
import { SnapshotGallery, SnapshotLightbox } from '../components/Gallery';
import { VideoPlayerModal } from '../components/VideoPlayer';
import AnalysisService from '../services/analysis';
import type { AnalysisResult } from '../types';
import type { Snapshot } from '../components/Gallery';
import type { VideoClip } from '../components/VideoPlayer';

// Keyframe marker interface
interface KeyframeMarker {
  timestamp: number;
  label: string;
  parameterName: string;
}

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const [tab, setTab] = useState('report'); // report | video | feedback - Start with report tab
  const { getResult } = useResultsStore();
  const [result, setResult] = useState(getResult(analysisId || ''));
  const [isLoading, setIsLoading] = useState(!result);
  const [hasFetched, setHasFetched] = useState(false);
  
  // Ref for scrollable content container
  const contentContainerRef = useRef<HTMLDivElement>(null);
  
  // Lazy loading states for media assets
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [loadedSnapshots, setLoadedSnapshots] = useState<Record<string, string>>({});
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [keyframes, setKeyframes] = useState<KeyframeMarker[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);
  const [loopingClip, setLoopingClip] = useState<{ start: number; end: number } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // New gallery and video modal state
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [selectedVideoClip, setSelectedVideoClip] = useState<VideoClip | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Helper to construct full URL from relative backend path
  const getFullMediaUrl = (relativePath: string | undefined): string => {
    if (!relativePath) return '';
    
    // If already a full URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // Prepend backend base URL
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v2', '') || 'http://localhost:8000';
    return `${baseUrl}${relativePath}`;
  };

  // Helper functions for video player
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    
    // Handle clip looping
    if (loopingClip && videoRef.current.currentTime >= loopingClip.end) {
      videoRef.current.currentTime = loopingClip.start;
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const seekToKeyframe = (timestamp: number, parameterName: string) => {
    if (!videoRef.current) return;
    
    // Seek to timestamp
    videoRef.current.currentTime = timestamp;
    setSelectedKeyframe(parameterName);
    
    // Set up looping around this keyframe (-0.5s to +0.5s)
    const loopStart = Math.max(0, timestamp - 0.5);
    const loopEnd = Math.min(duration, timestamp + 0.5);
    setLoopingClip({ start: loopStart, end: loopEnd });
    
    // Auto-play the clip
    videoRef.current.play();
    setIsPlaying(true);
  };

  const stopLooping = () => {
    setLoopingClip(null);
    setSelectedKeyframe(null);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await videoContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes (e.g., user pressing ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const fetchResult = async () => {
      // Always fetch if we haven't fetched yet, even if result exists in store
      // This ensures we get complete data including videoInfo
      if (!analysisId || hasFetched) return;

      try {
        setIsLoading(true);
        console.log('Fetching analysis result for ID:', analysisId);
        const data = await AnalysisService.getAnalysisResult(analysisId);
        console.log('Raw analysis data from backend:', data);
        console.log('video_info:', data.video_info);
        console.log('videoInfo:', data.videoInfo);
        
        // Convert video_info snake_case to camelCase if needed
        const videoInfo = data.videoInfo || (data.video_info ? {
          parameterSnapshots: data.video_info.parameter_snapshots,
          parameterClips: data.video_info.parameter_clips,
          duration: data.video_info.duration,
          fps: data.video_info.fps,
          resolution: data.video_info.resolution,
          qualityScore: data.video_info.quality_score,
        } : undefined);
        
        // Normalize backend response to frontend format
        const normalized: AnalysisResult = {
          ...data,
          analysisId: data.analysisId || data.analysis_id,
          overallScore: data.overallScore || data.overall_score,
          parameters: data.parameters || data.analysis, // Backend returns 'analysis' field
          videoInfo: videoInfo,
        };
        
        console.log('Normalized analysis data:', normalized);
        console.log('Normalized videoInfo:', normalized.videoInfo);
        console.log('Parameter snapshots available:', normalized.videoInfo?.parameterSnapshots);
        setResult(normalized);
        setHasFetched(true);
      } catch (error) {
        console.error('Failed to fetch analysis result:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [analysisId, hasFetched]);

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tab]);

  // Lazy load media assets (snapshots and clips) after initial result is loaded
  useEffect(() => {
    if (!result || mediaLoaded) return;
    
    const loadMediaAssets = async () => {
      try {
        // Extract snapshots and clips
        const snapshots = result.videoInfo?.parameterSnapshots || 
                         result.video_info?.parameter_snapshots || {};
        
        const clips = result.videoInfo?.parameterClips || 
                     result.video_info?.parameter_clips || {};
        
        console.log('📸 Lazy loading media assets...');
        console.log('- Snapshots:', Object.keys(snapshots).length);
        console.log('- Clips:', Object.keys(clips).length);
        
        // Pre-load snapshot images to cache them
        const snapshotPromises = Object.entries(snapshots).map(async ([param, url]) => {
          try {
            const img = new Image();
            img.src = url as string;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });
            return [param, url];
          } catch (error) {
            console.warn(`Failed to preload snapshot for ${param}:`, error);
            return [param, url]; // Still include it even if preload fails
          }
        });
        
        const loadedSnapshotsArray = await Promise.all(snapshotPromises);
        const snapshotsMap = Object.fromEntries(loadedSnapshotsArray);
        
        setLoadedSnapshots(snapshotsMap);
        // Clips loaded but not used yet (reserved for future enhancement)
        console.log('- Clips available:', Object.keys(clips).length);
        setMediaLoaded(true);
        
        console.log('✅ Media assets loaded successfully');
      } catch (error) {
        console.error('Failed to lazy load media assets:', error);
        // Still mark as loaded to prevent infinite retries
        setMediaLoaded(true);
      }
    };
    
    // Delay media loading slightly to prioritize initial render
    const timeoutId = setTimeout(() => {
      loadMediaAssets();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [result, mediaLoaded]);

  // Extract keyframes from parameter snapshots when result is loaded
  useEffect(() => {
    if (!result) return;
    
    // Use snapshots as the source of truth for keyframes
    const snapshots = result.videoInfo?.parameterSnapshots || 
                     result.video_info?.parameter_snapshots || {};
    const extractedKeyframes: KeyframeMarker[] = [];
    
    // Backend should provide clip metadata with timestamps
    // For now, we'll estimate based on parameter names and video duration
    const videoDuration = (result.video_info?.duration || (result.videoInfo as any)?.duration || 10) as number;
    
    // Define typical bowling action sequence with better labels
    const parameterSequence: Record<string, { order: number; label: string }> = {
      'run_up': { order: 1, label: 'Run-up' },
      'back_foot_contact': { order: 2, label: 'Back Foot' },
      'front_foot_contact': { order: 3, label: 'Front Foot' },
      'release_point': { order: 4, label: 'Release' },
      'follow_through': { order: 5, label: 'Follow-through' },
      'bound': { order: 6, label: 'Bound' },
      'hip_separation': { order: 3, label: 'Hip Separation' },
      'front_arm': { order: 4, label: 'Front Arm' },
      'bowling_arm_angle': { order: 4, label: 'Bowling Arm' },
    };
    
    // Count how many parameters we have
    const snapshotKeys = Object.keys(snapshots);
    const totalParams = snapshotKeys.length;
    
    if (totalParams === 0) {
      setKeyframes([]);
      return;
    }
    
    snapshotKeys.forEach((paramName) => {
      const paramInfo = parameterSequence[paramName];
      const order = paramInfo?.order || 4; // Default to mid-action
      const label = paramInfo?.label || paramName
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      
      // Estimate timestamp based on typical bowling action sequence
      // Spread across video duration proportionally
      const estimatedTimestamp = (videoDuration / (totalParams + 1)) * order;
      
      extractedKeyframes.push({
        timestamp: Math.min(estimatedTimestamp, videoDuration * 0.95), // Cap at 95% of duration
        label,
        parameterName: paramName,
      });
    });
    
    // Sort by timestamp
    extractedKeyframes.sort((a, b) => a.timestamp - b.timestamp);
    
    setKeyframes(extractedKeyframes);
  }, [result]);

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading results..." centered />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h2>
        <p className="text-slate-600 mb-6">This analysis could not be loaded.</p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </div>
    );
  }

  // Backend returns score nested in analysis or feedback objects
  const overallScore = 
    result.overallScore || 
    result.overall_score || 
    result.analysis?.overall_score || 
    (result.feedback as any)?.overall_score || 
    0;
  
  // Transform backend response structure to expected format
  const rawParameters = result.parameters || result.analysis || {};
  const parameters: Record<string, any> = {};
  
  // Convert backend format (key: score_number) to frontend format (key: {score: number, ...})
  Object.entries(rawParameters).forEach(([key, value]) => {
    if (key !== 'overall_score') {
      if (typeof value === 'number') {
        // Backend returns just the score number
        parameters[key] = { score: value };
      } else {
        // Already in correct format
        parameters[key] = value;
      }
    }
  });
  
  const parameterEntries = Object.entries(parameters);

  return (
    <div className="h-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 pt-6 flex items-center justify-between z-10 sticky top-0">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full min-w-fit"
        >
          <ArrowLeft size={24} />
        </Button>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Button
            variant="ghost"
            onClick={() => setTab('report')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'report' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Report
          </Button>
          <Button
            variant="ghost"
            onClick={() => setTab('video')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'video' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Video
          </Button>
          <Button
            variant="ghost"
            onClick={() => setTab('feedback')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tab === 'feedback' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Feedback
          </Button>
        </div>
        <Button
          variant="ghost"
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full min-w-fit"
        >
          <Share2 size={24} />
        </Button>
      </div>

      {/* Content */}
      <div ref={contentContainerRef} className="flex-1 overflow-y-auto pb-24">
        {tab === 'report' && (
          <div className="p-4 space-y-4 animate-in fade-in">
            {/* Score Header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {overallScore > 80 ? 'Great Technique!' : overallScore > 60 ? 'Good Progress!' : 'Keep Training!'}
                  </h2>
                  <p className="text-slate-400 text-sm">Analysis Complete</p>
                </div>
                <Badge
                  variant={overallScore > 80 ? 'success' : overallScore > 60 ? 'warning' : 'danger'}
                  size="lg"
                  className="rounded-full flex items-center justify-center font-bold bg-white shadow-sm text-4xl w-24 h-24 border-4"
                >
                  {overallScore}
                </Badge>
              </div>
              {/* Micro Stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                <div className="text-center border-r border-white/10">
                  <p className="text-xs text-slate-400 uppercase">Style</p>
                  <p className="font-bold text-lg">
                    {(() => {
                      const bowlerType = result.bowlerType || result.bowler_type;
                      return bowlerType === 'fast' || bowlerType === 'pace' ? 'Pace ⚡' : 'Spin 🌀';
                    })()}
                  </p>
                </div>
                <div className="text-center border-r border-white/10">
                  <p className="text-xs text-slate-400 uppercase">Bowling Arm</p>
                  <p className="font-bold text-lg capitalize">
                    {(() => {
                      const bowlingArm = result.bowlingArmDetected || result.bowling_arm_detected || (result.analysis as any)?.bowling_arm_detected;
                      if (!bowlingArm) return 'N/A';
                      return bowlingArm === 'right' ? 'Right 👉' : 'Left 👈';
                    })()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase">Parameters</p>
                  <p className="font-bold text-lg text-emerald-400">{Object.keys(parameters).length}</p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            {result.feedback?.parameterFeedback && (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
                <div className="mt-1">
                  <AlertCircle size={20} className="text-orange-500" />
                </div>
                <div>
                  <h4 className="font-bold text-orange-900 text-sm">Key Insights</h4>
                  <p className="text-orange-800 text-sm mt-1 leading-relaxed">
                    Review your parameter scores below for detailed feedback on each aspect of your
                    bowling technique.
                  </p>
                </div>
              </div>
            )}

            {/* Parameter Breakdown */}
            <h3 className="font-bold text-slate-700 mt-6 mb-2">Biomechanical Breakdown</h3>
            <div className="space-y-3">
              {parameterEntries.length > 0 ? (
                parameterEntries.map(([paramName, parameter]) => (
                  <ParameterCard
                    key={paramName}
                    parameterName={paramName}
                    parameter={parameter}
                  />
                ))
              ) : (
                <div className="bg-white p-6 rounded-xl text-center">
                  <p className="text-slate-500">No parameter data available</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/upload')}
                rightIcon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                }
                className="shadow-lg shadow-emerald-500/20"
              >
                Analyze Another Video
              </Button>
            </div>
          </div>
        )}

        {tab === 'video' && (
          <div className="p-4 space-y-4 animate-in fade-in">
            {/* Hero Video Player */}
            <div 
              ref={videoContainerRef} 
              className={`bg-slate-900 rounded-2xl overflow-hidden shadow-xl ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col' : ''
              }`}
            >
              <div className={`relative bg-black ${isFullscreen ? 'flex-1' : 'aspect-video'}`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  src={(() => {
                    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v2', '') || 'http://localhost:8000';
                    const annotatedPath = result.annotated_url || result.annotatedUrl;
                    
                    console.log('🎬 Constructing video URL:', {
                      baseUrl,
                      annotatedPath,
                      analysisId,
                      VITE_API_URL: import.meta.env.VITE_API_URL
                    });
                    
                    // If we have an annotated path from backend, ensure it's a full URL
                    if (annotatedPath) {
                      // If it's already a full URL, use it as-is
                      if (annotatedPath.startsWith('http://') || annotatedPath.startsWith('https://')) {
                        console.log('✅ Using full URL:', annotatedPath);
                        return annotatedPath;
                      }
                      // Otherwise, prepend the base URL
                      const fullUrl = `${baseUrl}${annotatedPath}`;
                      console.log('✅ Constructed URL from relative path:', fullUrl);
                      return fullUrl;
                    }
                    
                    // Fallback: construct URL from analysisId
                    const fallbackUrl = `${baseUrl}/api/v2/annotated/${analysisId}_annotated.mp4`;
                    console.log('⚠️ Using fallback URL:', fallbackUrl);
                    return fallbackUrl;
                  })()}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={handlePlayPause}
                  onError={(e) => {
                    console.error('Video load error:', e);
                    console.error('Video src:', videoRef.current?.src);
                    console.error('Result annotated_url:', result.annotated_url || result.annotatedUrl);
                    console.error('VITE_API_URL:', import.meta.env.VITE_API_URL);
                  }}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Play/Pause Overlay */}
                <div 
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity pointer-events-none ${
                    isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                  }`}
                >
                  <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                    {isPlaying ? (
                      <Pause size={40} className="text-slate-900 ml-1" />
                    ) : (
                      <Play size={40} className="text-slate-900 ml-1" />
                    )}
                  </div>
                </div>

                {/* Top Controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  {/* Clip Looping Indicator */}
                  {loopingClip && (
                    <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg">
                      <span className="animate-pulse">●</span>
                      Looping: {selectedKeyframe}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          stopLooping();
                        }}
                        className="ml-1 hover:bg-emerald-600 rounded-full p-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  {/* Video Controls */}
                  <div className="flex gap-2 ml-auto">
                    {/* Mute Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full transition-colors shadow-lg"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                    
                    {/* Fullscreen Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                      }}
                      className="bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full transition-colors shadow-lg"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize size={20} />
                      ) : (
                        <Maximize size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Timeline with Keyframe Markers */}
              <div className={`p-4 bg-slate-800 ${isFullscreen ? 'flex-shrink-0' : ''}`}>
                {/* Hint for keyframe dots */}
                {keyframes.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-white border border-slate-900"></div>
                    <span>Click dots to jump to key moments</span>
                  </div>
                )}
                
                <div className="relative h-10 mb-2">
                  {/* Progress Bar */}
                  <div className="absolute inset-0 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>

                  {/* Keyframe Markers */}
                  {keyframes.map((keyframe) => (
                    <button
                      key={keyframe.parameterName}
                      onClick={() => seekToKeyframe(keyframe.timestamp, keyframe.parameterName)}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all hover:scale-125 shadow-lg ${
                        selectedKeyframe === keyframe.parameterName
                          ? 'bg-emerald-400 border-white scale-125'
                          : 'bg-white border-slate-900 hover:bg-emerald-300'
                      }`}
                      style={{ left: `${(keyframe.timestamp / duration) * 100}%` }}
                      title={keyframe.label}
                      aria-label={`Jump to ${keyframe.label}`}
                    />
                  ))}
                </div>

                {/* Time Display */}
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Key Moments - New SnapshotGallery Component */}
            {(() => {
              // Transform keyframes data into Snapshot format
              console.log('🖼️ Building SnapshotGallery:');
              console.log('- Keyframes:', keyframes.length);
              console.log('- Loaded snapshots:', Object.keys(loadedSnapshots).length);
              console.log('- videoInfo snapshots:', result.videoInfo?.parameterSnapshots);
              console.log('- video_info snapshots:', result.video_info?.parameter_snapshots);
              
              const snapshots: Snapshot[] = keyframes.map((keyframe) => {
                const snapshotUrl = loadedSnapshots[keyframe.parameterName] ||
                                   result.videoInfo?.parameterSnapshots?.[keyframe.parameterName] ||
                                   result.video_info?.parameter_snapshots?.[keyframe.parameterName];
                const paramScore = typeof parameters[keyframe.parameterName] === 'number'
                  ? parameters[keyframe.parameterName]
                  : (parameters[keyframe.parameterName] as any)?.score || 0;
                const paramData = parameters[keyframe.parameterName];
                
                console.log(`- Snapshot for ${keyframe.parameterName}:`, snapshotUrl ? '✅' : '❌', snapshotUrl);
                
                return {
                  id: keyframe.parameterName,
                  url: snapshotUrl ? getFullMediaUrl(snapshotUrl as string) : '',
                  timestamp: keyframe.timestamp,
                  parameterName: keyframe.label,
                  score: paramScore as number,
                  metrics: paramData?.metrics || [],
                  phase: paramData?.phase || 'delivery'
                };
              });

              console.log('- Final snapshots array:', snapshots.length);
              console.log('- Snapshots with URLs:', snapshots.filter(s => s.url).length);

              if (snapshots.length === 0) {
                return (
                  <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-3">Key Moments</h3>
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp size={24} className="text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 font-medium">No Key Moments Available</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Snapshot extraction is in progress. Check back soon!
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="mb-6">
                  <SnapshotGallery
                    snapshots={snapshots}
                    onSnapshotClick={(snapshot) => {
                      setSelectedSnapshot(snapshot);
                      setIsLightboxOpen(true);
                    }}
                    onClipOpen={(snapshot) => {
                      // Open video at the specific keyframe timestamp
                      seekToKeyframe(snapshot.timestamp, snapshot.id);
                    }}
                  />
                  
                  {/* Lightbox for full-screen snapshot viewing */}
                  {selectedSnapshot && (
                    <SnapshotLightbox
                      snapshot={selectedSnapshot}
                      isOpen={isLightboxOpen}
                      onClose={() => {
                        setIsLightboxOpen(false);
                        setSelectedSnapshot(null);
                      }}
                      onShare={async (snapshot) => {
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: `${snapshot.parameterName} - Score: ${snapshot.score}`,
                              text: `Check out my ${snapshot.parameterName} analysis!`,
                              url: window.location.href
                            });
                          } catch (err) {
                            console.log('Share cancelled or failed:', err);
                          }
                        }
                      }}
                      onDownload={(snapshot) => {
                        // Create download link
                        const link = document.createElement('a');
                        link.href = snapshot.url;
                        link.download = `${snapshot.parameterName}_${snapshot.score}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    />
                  )}
                </div>
              );
            })()}

            {/* Parameter Clips Grid with New VideoPlayerModal */}
            {(() => {
              const clips = result.videoInfo?.parameterClips || result.video_info?.parameter_clips || {};
              const clipEntries = Object.entries(clips);
              
              if (clipEntries.length === 0) return null;

              // Transform clips into VideoClip format
              const videoClips: VideoClip[] = clipEntries.map(([paramName, clipUrl]) => {
                const paramScore = typeof parameters[paramName] === 'number'
                  ? parameters[paramName]
                  : (parameters[paramName] as any)?.score || 0;
                const paramData = parameters[paramName];
                const displayName = paramName
                  .split('_')
                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
                
                // Get snapshot for this parameter
                const snapshotUrl = loadedSnapshots[paramName] ||
                                   result.videoInfo?.parameterSnapshots?.[paramName] ||
                                   result.video_info?.parameter_snapshots?.[paramName];
                
                return {
                  id: paramName,
                  url: getFullMediaUrl(clipUrl as string),
                  snapshot: snapshotUrl ? getFullMediaUrl(snapshotUrl as string) : undefined,
                  duration: 0, // Will be set when video loads
                  parameterName: displayName,
                  score: paramScore as number,
                  phase: paramData?.phase || 'delivery',
                  metrics: paramData?.metrics || []
                };
              });

              return (
                <div className="mb-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    Individual Parameter Clips
                    <Badge variant="primary" size="sm">{videoClips.length}</Badge>
                  </h3>
                  
                  {/* Grid of Clip Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videoClips.map((clip) => (
                      <button
                        key={clip.id}
                        onClick={() => {
                          setSelectedVideoClip(clip);
                          setIsVideoModalOpen(true);
                        }}
                        className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-105"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-900">
                          {clip.snapshot ? (
                            <img
                              src={clip.snapshot}
                              alt={clip.parameterName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Play size={32} />
                            </div>
                          )}
                          
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                              <Play size={24} className="text-slate-900" />
                            </div>
                          </div>
                          
                          {/* Score Badge */}
                          <div className="absolute top-2 right-2">
                            <Badge
                              variant={clip.score >= 80 ? 'success' : clip.score >= 60 ? 'warning' : 'danger'}
                              size="sm"
                              className="text-xs font-bold"
                            >
                              {Math.round(clip.score)}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Clip Info */}
                        <div className="p-3 bg-white">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {clip.parameterName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 capitalize">
                            {clip.phase} phase
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Video Player Modal */}
                  {selectedVideoClip && (
                    <VideoPlayerModal
                      clip={selectedVideoClip}
                      isOpen={isVideoModalOpen}
                      onClose={() => {
                        setIsVideoModalOpen(false);
                        setSelectedVideoClip(null);
                      }}
                      autoplay={true}
                      showMetrics={true}
                    />
                  )}
                </div>
              );
            })()}

            {/* Split-Screen Comparison CTA */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setTab('frames')}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  VS
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-1">View Split-Screen Comparison</h4>
                  <p className="text-sm text-slate-600 mb-3">
                    Compare your technique against ideal standards with side-by-side overlays showing angle measurements.
                  </p>
                  <Button variant="primary" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setTab('feedback');
                  }}>
                    View Detailed Feedback →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'feedback' && (
          <div className="p-4 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Detailed Feedback & Improvement Plan</h3>
              <Badge variant="success" size="sm">
                {parameterEntries.length} Parameters
              </Badge>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <p className="text-sm text-slate-700 font-medium mb-1">
                    Personalized improvement roadmap for each bowling parameter
                  </p>
                  <p className="text-xs text-slate-600">
                    Review your performance across all 7 key biomechanical parameters with specific drills and training tips to elevate your technique.
                  </p>
                </div>
              </div>
            </div>

            {/* ALL Parameters Feedback (Not just snapshots) */}
            {(() => {
              if (parameterEntries.length === 0) {
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp size={32} className="text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">No Parameters Available</h4>
                    <p className="text-sm text-slate-600">
                      Parameter analysis is in progress or unavailable for this analysis.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {parameterEntries.map(([paramName, parameter]) => {
                    const paramScore = typeof parameter === 'number' ? parameter : parameter?.score || 0;
                    const snapshotUrl = result.videoInfo?.parameterSnapshots?.[paramName] || 
                                       result.video_info?.parameter_snapshots?.[paramName];
                    
                    // Get parameter-specific feedback from backend
                    const paramFeedback = result.parameterFeedback?.[paramName] || 
                                        result.feedback?.parameterFeedback?.[paramName];
                    
                    // Generate improvement guidance based on score
                    const getImprovementGuidance = (score: number, paramName: string): { level: string; tips: string[]; drills: string[] } => {
                      const paramDisplayName = paramName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      
                      if (score >= 90) {
                        return {
                          level: "Elite Performance",
                          tips: [
                            "Maintain consistency across all deliveries",
                            "Film from multiple angles to track micro-variations",
                            "Focus on replicating technique under match pressure",
                            "Work with biomechanics specialist for marginal gains"
                          ],
                          drills: [
                            "High-intensity simulation drills with fatigue",
                            "Consistency challenge: 10 consecutive deliveries maintaining form",
                            "Video analysis: Compare current vs previous sessions"
                          ]
                        };
                      } else if (score >= 80) {
                        return {
                          level: "Advanced - Path to Elite",
                          tips: [
                            "Identify specific angles/movements that vary between deliveries",
                            "Fine-tune timing and coordination for this phase",
                            "Increase training intensity while maintaining technique",
                            "Study professional bowlers with similar body type and style"
                          ],
                          drills: [
                            `Slow-motion repetitions focusing on ${paramDisplayName.toLowerCase()}`,
                            "Mirror drills: Practice in front of mirror to develop kinesthetic awareness",
                            "Partner feedback: Have someone observe and call out deviations",
                            "Progressive overload: Gradually increase bowling volume while maintaining form"
                          ]
                        };
                      } else if (score >= 60) {
                        return {
                          level: "Good - Building Consistency",
                          tips: [
                            "Break down the movement into smaller components",
                            "Practice isolated drills for this specific phase",
                            "Get coach feedback on technical execution",
                            "Record every session to track improvements"
                          ],
                          drills: [
                            `Shadow bowling: Focus only on ${paramDisplayName.toLowerCase()} without ball`,
                            "Wall drills: Practice movement pattern against wall for feedback",
                            "Tempo training: Vary speed (slow→medium→fast) to build control",
                            "Repetition sets: 3 sets of 10 focusing only on this parameter"
                          ]
                        };
                      } else if (score >= 40) {
                        return {
                          level: "Developing - Needs Focus",
                          tips: [
                            "Schedule 1-on-1 coaching sessions for this area",
                            "Start with fundamental movement patterns",
                            "Use video feedback immediately after each delivery",
                            "Reduce bowling speed to perfect technique first"
                          ],
                          drills: [
                            "Static position holds: Freeze at key positions for 5-10 seconds",
                            "Assisted drills: Use resistance bands or coaching aids",
                            "Step-by-step breakdown: Master each phase before progressing",
                            "Daily practice: 15-20 minutes focused solely on this parameter"
                          ]
                        };
                      } else {
                        return {
                          level: "Foundation Building Required",
                          tips: [
                            "Urgent: Work with certified bowling coach",
                            "Start from basic body mechanics and progressions",
                            "Film every session from multiple angles",
                            "Focus on quality over quantity - fewer deliveries with correct form"
                          ],
                          drills: [
                            "Foundational movement patterns without ball",
                            "Body awareness exercises and stretching",
                            "Mirror work and visualization techniques",
                            "Slow-motion walk-through of entire action"
                          ]
                        };
                      }
                    };

                    const guidance = getImprovementGuidance(paramScore as number, paramName);

                    return (
                      <div key={paramName} className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
                        {/* Parameter Header */}
                        <div className={`p-4 ${
                          paramScore >= 90 ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200' :
                          paramScore >= 80 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200' : 
                          paramScore >= 60 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200' : 
                          paramScore >= 40 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200' : 
                          'bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-300'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 text-lg mb-1">
                                {paramName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </h4>
                              <div className="flex items-center gap-3">
                                <Badge
                                  variant={paramScore >= 80 ? 'success' : paramScore >= 60 ? 'warning' : 'danger'}
                                  size="lg"
                                  className="text-lg font-bold"
                                >
                                  {Math.round(paramScore as number)}/100
                                </Badge>
                                <span className={`text-sm font-semibold ${
                                  paramScore >= 90 ? 'text-purple-700' :
                                  paramScore >= 80 ? 'text-green-700' : 
                                  paramScore >= 60 ? 'text-yellow-700' : 
                                  paramScore >= 40 ? 'text-orange-700' : 
                                  'text-red-700'
                                }`}>
                                  {guidance.level}
                                </span>
                              </div>
                            </div>
                            {snapshotUrl && (
                              <img
                                src={getFullMediaUrl(snapshotUrl as string)}
                                alt={paramName}
                                className="w-24 h-16 object-cover rounded-lg border-2 border-white shadow-md"
                              />
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Backend Feedback (if available) */}
                          {paramFeedback && (
                            <div className="space-y-3">
                              {paramFeedback.strengths && paramFeedback.strengths.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                    <span className="text-base">✓</span> What's Working Well
                                  </h5>
                                  <ul className="space-y-1">
                                    {paramFeedback.strengths.map((strength, idx) => (
                                      <li key={idx} className="text-sm text-green-900 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-green-600">
                                        {strength}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {paramFeedback.issues && paramFeedback.issues.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                    <span className="text-base">⚠</span> Areas Needing Attention
                                  </h5>
                                  <ul className="space-y-1">
                                    {paramFeedback.issues.map((issue, idx) => (
                                      <li key={idx} className="text-sm text-amber-900 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-amber-600">
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Improvement Guidance */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                              <span className="text-base">💡</span> Training Tips to Improve
                            </h5>
                            <ul className="space-y-1">
                              {guidance.tips.map((tip, idx) => (
                                <li key={idx} className="text-sm text-blue-900 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-blue-600">
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Recommended Drills */}
                          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <h5 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                              <span className="text-base">🏋️</span> Recommended Drills
                            </h5>
                            <ul className="space-y-1">
                              {guidance.drills.map((drill, idx) => (
                                <li key={idx} className="text-sm text-indigo-900 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-indigo-600">
                                  {drill}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Overall Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl mt-8">
              <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>🎯</span> Overall Performance Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-300 mb-1">Overall Score</p>
                  <p className="text-3xl font-bold">{overallScore}/100</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-slate-300 mb-1">Parameters Analyzed</p>
                  <p className="text-3xl font-bold">{parameterEntries.length}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm mb-2 font-medium">💪 Next Steps:</p>
                <ul className="text-sm space-y-1 text-slate-200">
                  <li className="pl-4 relative before:content-['→'] before:absolute before:left-0">
                    Focus on parameters scoring below 80 for maximum improvement potential
                  </li>
                  <li className="pl-4 relative before:content-['→'] before:absolute before:left-0">
                    Film your practice sessions weekly to track progress
                  </li>
                  <li className="pl-4 relative before:content-['→'] before:absolute before:left-0">
                    Work with a certified coach for parameters needing significant work
                  </li>
                  <li className="pl-4 relative before:content-['→'] before:absolute before:left-0">
                    Consistency is key - small improvements compound over time
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
