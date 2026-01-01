import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, AlertCircle, TrendingUp, Play } from 'lucide-react';
import { useResultsStore } from '../stores/resultsStore';
import { ParameterCard, AdvancedMetricsPanel } from '../components/Results';
import { LoadingSpinner, Button, Badge } from '../components/Common';
import { SnapshotLightbox } from '../components/Gallery';
import AnalysisService from '../services/analysis';
import type { AnalysisResult } from '../types';
import type { Snapshot } from '../components/Gallery';

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
  
  // Gallery state for lightbox
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Featured clip selector state (for Video tab)
  const [featuredClipIndex, setFeaturedClipIndex] = useState(0);

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
  const overallScore = Number((
    result.overallScore || 
    result.overall_score || 
    result.analysis?.overall_score || 
    (result.feedback as any)?.overall_score || 
    0
  ).toFixed(1));
  
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
      <div className="bg-white shadow-sm p-4 pt-safe-top flex items-center justify-between z-10 sticky top-0">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full min-w-fit mt-2"
        >
          <ArrowLeft size={24} />
        </Button>
        <div className="flex bg-slate-100 p-1 rounded-lg mt-2">
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
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-full min-w-fit mt-2"
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

            {/* Advanced Metrics (Premium Feature) */}
            <AdvancedMetricsPanel
              advancedMetrics={result.advancedMetrics || result.advanced_metrics}
              qualityGates={result.qualityGates || result.quality_gates}
              isEnabled={result.advancedMetricsEnabled ?? result.advanced_metrics_enabled ?? true}
            />

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
          <div className="animate-in fade-in">
            {/* Instagram-style Full-Screen Swipeable Media */}
            {(() => {
              const clips = result.videoInfo?.parameterClips || result.video_info?.parameter_clips || {};
              const snapshots = result.videoInfo?.parameterSnapshots || result.video_info?.parameter_snapshots || {};
              
              // Define parameter order for display
              const parameterOrder = [
                'back_foot_contact',
                'braced_front_leg', 
                'delayed_arms',
                'hip_shoulder_separation',
                'chest_drive',
                'jump_and_gather',
                'run_up_effectiveness'
              ];
              
              // Build media items (clip + snapshot pairs)
              const mediaItems = parameterOrder
                .filter(param => clips[param] || snapshots[param])
                .map(param => ({
                  paramName: param,
                  clipUrl: clips[param] as string,
                  snapshotUrl: snapshots[param] as string,
                  score: typeof parameters[param] === 'number' 
                    ? parameters[param] 
                    : (parameters[param] as any)?.score || 0,
                  displayName: param.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }));
              
              if (mediaItems.length === 0) {
                return (
                  <div className="h-[70vh] flex items-center justify-center bg-slate-900 rounded-2xl m-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play size={32} className="text-slate-500" />
                      </div>
                      <h4 className="font-bold text-white mb-2">Processing Media</h4>
                      <p className="text-sm text-slate-400">Your clips are being generated...</p>
                    </div>
                  </div>
                );
              }
              
              const currentItem = mediaItems[featuredClipIndex] || mediaItems[0];
              const safeIndex = Math.min(featuredClipIndex, mediaItems.length - 1);
              
              return (
                <div className="relative">
                  {/* Main Media Display - Instagram Reels Style */}
                  <div className="relative bg-black" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
                    {/* Video Player - No overlays needed, backend adds all annotations */}
                    {currentItem.clipUrl && (
                      <video
                        key={currentItem.clipUrl}
                        className="w-full h-full object-contain"
                        src={getFullMediaUrl(currentItem.clipUrl)}
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    )}
                    
                    {/* Right Side Actions - Minimal */}
                    <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4">
                      {/* Snapshot Preview */}
                      {currentItem.snapshotUrl && (
                        <button 
                          onClick={() => {
                            const snapshot: Snapshot = {
                              id: currentItem.paramName,
                              url: getFullMediaUrl(currentItem.snapshotUrl),
                              timestamp: 0,
                              parameterName: currentItem.displayName,
                              score: currentItem.score as number,
                              metrics: [],
                              phase: 'delivery'
                            };
                            setSelectedSnapshot(snapshot);
                            setIsLightboxOpen(true);
                          }}
                          className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/40 shadow-lg">
                            <img 
                              src={getFullMediaUrl(currentItem.snapshotUrl)} 
                              alt="Snapshot" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-white/70 text-[10px] mt-1">Photo</span>
                        </button>
                      )}
                      
                      {/* Share Button */}
                      <button 
                        onClick={async () => {
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: `${currentItem.displayName} - Score: ${Math.round(currentItem.score)}`,
                                text: `Check out my bowling analysis!`,
                                url: window.location.href
                              });
                            } catch (err) {
                              console.log('Share cancelled');
                            }
                          }
                        }}
                        className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                          <Share2 size={18} className="text-white/90" />
                        </div>
                        <span className="text-white/70 text-[10px] mt-1">Share</span>
                      </button>
                    </div>
                    
                    {/* Swipe Navigation Arrows */}
                    {safeIndex > 0 && (
                      <button 
                        onClick={() => setFeaturedClipIndex(safeIndex - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
                      >
                        <ArrowLeft size={20} className="text-white" />
                      </button>
                    )}
                    {safeIndex < mediaItems.length - 1 && (
                      <button 
                        onClick={() => setFeaturedClipIndex(safeIndex + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center rotate-180"
                      >
                        <ArrowLeft size={20} className="text-white" />
                      </button>
                    )}
                  </div>
                  
                  {/* Bottom Dot Navigation */}
                  <div className="bg-slate-900 py-3 px-4">
                    <div className="flex justify-center gap-2 mb-3">
                      {mediaItems.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setFeaturedClipIndex(index)}
                          className={`transition-all rounded-full ${
                            index === safeIndex 
                              ? 'w-6 h-2 bg-emerald-500' 
                              : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-center text-slate-400 text-xs">
                      {safeIndex + 1} of {mediaItems.length} • Swipe or tap arrows to navigate
                    </p>
                  </div>
                </div>
              );
            })()}

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
                        title: `${snapshot.parameterName} - Score: ${Math.round(snapshot.score)}`,
                        text: `Check out my ${snapshot.parameterName} analysis!`,
                        url: window.location.href
                      });
                    } catch (err) {
                      console.log('Share cancelled or failed:', err);
                    }
                  }
                }}
                onDownload={(snapshot) => {
                  const link = document.createElement('a');
                  link.href = snapshot.url;
                  link.download = `${snapshot.parameterName}_${Math.round(snapshot.score)}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              />
            )}
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
