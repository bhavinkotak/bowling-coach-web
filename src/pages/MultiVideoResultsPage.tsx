import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Film, TrendingUp } from 'lucide-react';
import { ParameterCard } from '../components/Results';
import { LoadingSpinner, Button, Badge } from '../components/Common';
import AnalysisService from '../services/analysis';
import type { MultiVideoAnalysisResult, CameraAngle } from '../types';

export default function MultiVideoResultsPage() {
  const navigate = useNavigate();
  const { analysisId } = useParams<{ analysisId: string }>();
  const [tab, setTab] = useState('report'); // report | video | feedback
  const [result, setResult] = useState<MultiVideoAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  
  // Ref for scrollable content container
  const contentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!analysisId || result) return;

      try {
        setIsLoading(true);
        console.log('=== MULTI-VIDEO RESULTS PAGE LOADING ===');
        console.log('Analysis ID:', analysisId);
        const data = await AnalysisService.getMultiVideoResults(analysisId);
        console.log('=== DATA RECEIVED FROM SERVICE ===');
        console.log('Has parameters?', data.parameters != null);
        console.log('Parameters is array?', Array.isArray(data.parameters));
        console.log('Parameters length:', data.parameters?.length);
        if (data.parameters && Array.isArray(data.parameters) && data.parameters.length > 0) {
          console.log('First parameter:', data.parameters[0]);
          console.log('First param has clips?', data.parameters[0].clips != null);
          console.log('First param clips:', data.parameters[0].clips);
        }
        setResult(data);
        console.log('=== RESULT SET IN STATE ===');
      } catch (error) {
        console.error('Failed to fetch multi-video analysis result:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [analysisId, result]);

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [tab]);

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading multi-angle results..." centered />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h2>
        <p className="text-slate-600 mb-6">This multi-angle analysis could not be loaded.</p>
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

  // Backend returns aggregated score from multi-video analysis
  const overallScore = Number((result.overall_score || result.aggregated?.overallScore || 0).toFixed(1));
  
  // Get parameters from new array format or old aggregated format
  let parameters: Record<string, any> = {};
  let parameterEntries: [string, any][] = [];
  
  if (result.parameters && Array.isArray(result.parameters)) {
    // NEW format: parameters is an array
    console.log('Using NEW multi-video format with parameters array');
    result.parameters.forEach((param: any) => {
      const paramName = param.name || param.parameter_name;
      if (paramName) {
        parameters[paramName] = {
          score: param.score,
          feedback: param.feedback,
          clips: param.clips,
          best_angle: param.best_angle,
          snapshot: param.snapshot,
        };
      }
    });
    parameterEntries = Object.entries(parameters);
  } else if (result.aggregated?.parameters) {
    // OLD format: aggregated.parameters is a Record
    console.log('Using OLD multi-video format with aggregated.parameters');
    parameters = result.aggregated.parameters;
    parameterEntries = Object.entries(parameters);
  }
  
  // Extract video angles from results keys
  const videoAngles: CameraAngle[] = result.results 
    ? (Object.keys(result.results) as CameraAngle[]) 
    : ['front', 'side', 'diagonal'];
  const videoCount = result.videoCount || videoAngles.length;

  return (
    <div className="h-full bg-slate-50 flex flex-col pt-safe-top pb-safe-bottom">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 pt-6 flex items-center justify-between z-10 sticky top-0">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full min-w-fit"
        >
          <ArrowLeft size={24} />
        </Button>
        <div className="flex flex-col items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <Button
              variant="ghost"
              onClick={() => setTab('report')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'report' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Report
            </Button>
            <Button
              variant="ghost"
              onClick={() => setTab('video')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'video' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Video
            </Button>
            <Button
              variant="ghost"
              onClick={() => setTab('feedback')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                tab === 'feedback' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Feedback
            </Button>
          </div>
          <Badge variant="info" size="sm" className="mt-2">
            <Film size={12} className="inline mr-1" />
            {videoCount} Videos
          </Badge>
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
            {/* Multi-Angle Badge */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Film size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Multi-Angle Analysis</h3>
                  <p className="text-sm text-emerald-50">Enhanced accuracy from {videoCount} perspectives</p>
                </div>
              </div>
            </div>

            {/* Score Header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {overallScore > 80 ? 'Exceptional Form!' : overallScore > 60 ? 'Solid Technique!' : 'Room to Improve'}
                  </h2>
                  <p className="text-slate-400 text-sm">Composite Score from {videoCount} Angles</p>
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
                  <p className="text-xs text-slate-400 uppercase">Consistency</p>
                  <p className="font-bold text-lg">High</p>
                </div>
                <div className="text-center border-r border-white/10">
                  <p className="text-xs text-slate-400 uppercase">Coverage</p>
                  <p className="font-bold text-lg">{videoCount}/3</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase">Reliability</p>
                  <p className="font-bold text-lg text-emerald-400">95%</p>
                </div>
              </div>
            </div>

            {/* Parameter Breakdown */}
            <h3 className="font-bold text-slate-700 mt-6 mb-2">Biomechanical Breakdown</h3>
            <div className="space-y-3">
              {parameterEntries.length > 0 ? (
                parameterEntries.map(([paramName, parameter]) => (
                  <ParameterCard
                    key={paramName}
                    parameterName={paramName}
                    parameter={parameter}
                    hideClipsInfo={true}
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
                leftIcon={<Film size={20} />}
                className="shadow-lg shadow-emerald-500/20"
              >
                Analyze Another Video
              </Button>
            </div>
          </div>
        )}

        {tab === 'video' && (
          <div className="animate-in fade-in">
            {/* Instagram-style Clips Gallery */}
            {(() => {
              // Extract clips from parameters
              const clipsData: Array<{name: string, path: string, score: number, angle: string}> = [];
              if (result.parameters && Array.isArray(result.parameters)) {
                result.parameters.forEach((param: any) => {
                  if (param.clips && param.clips.path) {
                    clipsData.push({
                      name: param.name || param.parameter_name,
                      path: param.clips.path,
                      score: param.score || 0,
                      angle: param.best_angle || 'unknown'
                    });
                  }
                });
              }
              
              const getFullMediaUrl = (path: string) => {
                if (path.startsWith('http')) return path;
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v2', '') || 'http://localhost:8000';
                return `${baseUrl}${path}`;
              };
              
              const formatName = (name: string) => {
                return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              };

              if (clipsData.length === 0) {
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Film size={32} className="text-slate-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">No Clips Available</h4>
                    <p className="text-sm text-slate-600">
                      Clips are being generated or unavailable for this analysis.
                    </p>
                  </div>
                );
              }

              // Instagram-style swipeable carousel
              const currentClip = clipsData[currentClipIndex];

              return (
                <div className="space-y-0">
                  {/* Main Clip Viewer - Full Width */}
                  <div className="bg-black">
                    {/* Video Container - No overlays needed, backend adds all annotations */}
                    <div className="relative aspect-video bg-black">
                      <video
                        key={currentClip.name}
                        className="w-full h-full object-contain"
                        src={getFullMediaUrl(currentClip.path)}
                        autoPlay
                        muted
                        playsInline
                        loop
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    {/* Quick Parameter Selector Pills */}
                    <div className="p-4 bg-slate-800">
                      <p className="text-xs text-slate-400 mb-3 uppercase tracking-wide">Select Parameter to View</p>
                      <div className="flex flex-wrap gap-2">
                        {clipsData.map((clip, index) => (
                          <button
                            key={clip.name}
                            onClick={() => setCurrentClipIndex(index)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                              index === currentClipIndex
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            <span className="truncate max-w-[100px]">{formatName(clip.name)}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              clip.score >= 80 ? 'bg-emerald-600' : clip.score >= 60 ? 'bg-amber-600' : 'bg-red-600'
                            }`}>
                              {clip.score.toFixed(0)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Section */}
                  <div className="bg-white p-4 space-y-4">
                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-2">
                      {clipsData.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentClipIndex(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === currentClipIndex
                              ? 'bg-emerald-500 w-8'
                              : 'bg-slate-300 w-2 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* All Parameters List */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 px-1">All Parameters</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {clipsData.map((clip, index) => (
                          <button
                            key={clip.name}
                            onClick={() => setCurrentClipIndex(index)}
                            className={`text-left rounded-lg p-3 transition-all ${
                              index === currentClipIndex
                                ? 'bg-emerald-50 ring-2 ring-emerald-500'
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                index === currentClipIndex
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}>
                                <Film size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{formatName(clip.name)}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs font-bold ${
                                    clip.score >= 80 
                                      ? 'text-emerald-600' 
                                      : clip.score >= 60 
                                      ? 'text-amber-600' 
                                      : 'text-red-600'
                                  }`}>
                                    {clip.score.toFixed(0)}
                                  </span>
                                  <span className="text-xs text-slate-500">·</span>
                                  <span className="text-xs text-slate-500 capitalize">{clip.angle}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tab === 'feedback' && (
          <div className="p-4 space-y-6 animate-in fade-in pb-20">
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
                    Review your performance across all key biomechanical parameters with specific drills and training tips to elevate your technique.
                  </p>
                </div>
              </div>
            </div>

            {/* ALL Parameters Feedback */}
            {(() => {
              const getFullMediaUrl = (relativePath: string | undefined): string => {
                if (!relativePath) return '';
                if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
                  return relativePath;
                }
                const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v2', '') || 'http://localhost:8000';
                return `${baseUrl}${relativePath}`;
              };

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

              return (
                <div className="space-y-6">
                  {parameterEntries.map(([paramName, parameter]) => {
                    const paramScore = typeof parameter === 'number' ? parameter : parameter?.score || 0;
                    const snapshotUrl = parameter?.snapshot;
                    const paramFeedback = parameter?.feedback;
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
                          {paramFeedback && typeof paramFeedback === 'object' && (
                            <div className="space-y-3">
                              {paramFeedback.strengths && paramFeedback.strengths.length > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <h5 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                    <span className="text-base">✓</span> What's Working Well
                                  </h5>
                                  <ul className="space-y-1">
                                    {paramFeedback.strengths.map((strength: string, idx: number) => (
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
                                    {paramFeedback.issues.map((issue: string, idx: number) => (
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
                  <li className="pl-4 relative before:content-['→'] before:absolute before:left-0">
                    Multi-angle analysis provides deeper insights - keep using {videoCount} camera angles
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
