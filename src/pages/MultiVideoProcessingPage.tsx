import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, CheckCircle, Clock, Film } from 'lucide-react';
import { useMultiVideoResults } from '../hooks/useAnalysis';
import { Button, Badge, ConfirmDialog } from '../components/Common';
import AnalysisService from '../services/analysis';

// Stages match backend AnalysisStage enum from multi_video.py
const PROCESSING_STAGES = [
  { key: 'uploading', label: 'Uploading Videos', icon: Upload, time: '0:10' },
  { key: 'validation', label: 'Validating All Videos', icon: CheckCircle, time: '0:05' },
  { key: 'pose_detection', label: 'Multi-Angle Pose Detection', icon: '🤸', time: '0:15' },
  { key: 'angle_detection', label: 'Detecting Camera Angles', icon: '📷', time: '0:08' },
  { key: 'temporal_alignment', label: 'Synchronizing Videos', icon: '🔄', time: '0:12' },
  { key: 'analysis', label: 'Biomechanical Analysis', icon: '⚡', time: '0:15' },
  { key: 'gallery_generation', label: 'Generating Results', icon: '🎬', time: '0:08' },
  { key: 'completed', label: 'Analysis Complete', icon: '🏆', time: '0:00' },
];

interface ProcessStepProps {
  Icon: any;
  label: string;
  time: string;
  isCurrent: boolean;
  isComplete: boolean;
}

const ProcessStep = ({ Icon, label, time, isCurrent, isComplete }: ProcessStepProps) => {
  const iconColor = isComplete ? 'text-emerald-400' : isCurrent ? 'text-emerald-400' : 'text-slate-500';
  const labelColor = isComplete ? 'text-white' : isCurrent ? 'text-emerald-400' : 'text-slate-400';
  const isEmoji = typeof Icon === 'string';

  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            isComplete
              ? 'bg-emerald-600 border-emerald-600'
              : isCurrent
              ? 'bg-slate-700 border-emerald-500'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          {isComplete ? (
            <CheckCircle size={16} className="text-white" />
          ) : isEmoji ? (
            <span className="text-sm">{Icon}</span>
          ) : (
            <Icon size={16} className={iconColor} />
          )}
        </div>
        {label !== PROCESSING_STAGES.slice(-1)[0].label && (
          <div
            className={`w-px h-10 ${
              isComplete ? 'bg-emerald-600' : isCurrent ? 'bg-emerald-400' : 'bg-slate-700'
            }`}
          />
        )}
      </div>
      <div className="flex flex-col flex-1 pb-4">
        <p className={`font-semibold ${labelColor}`}>{label}</p>
        <div className="flex items-center gap-2 mt-1">
          {isCurrent && (
            <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          )}
          <p className="text-xs text-slate-500">
            {isCurrent ? 'Processing...' : isComplete ? 'Complete' : `Est. ${time}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function MultiVideoProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const analysisId = location.state?.analysisId;
  const videoCount = location.state?.videoCount || 1;
  const [startTime] = useState(Date.now());
  const [currentStage, setCurrentStage] = useState('uploading');
  const [currentProgress, setCurrentProgress] = useState(5); // Start at 5% to show initial progress
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Handle cancel confirmation
  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  // Handle actual cancellation
  const handleConfirmCancel = async () => {
    if (!analysisId) return;
    
    setIsCancelling(true);
    try {
      console.log('[MultiVideoProcessing] Cancelling analysis:', analysisId);
      await AnalysisService.cancelMultiVideoAnalysis(analysisId);
      console.log('[MultiVideoProcessing] Analysis cancelled successfully');
      // Navigate home after successful cancellation
      navigate('/', { replace: true });
    } catch (error) {
      console.error('[MultiVideoProcessing] Failed to cancel analysis:', error);
      // Navigate home anyway - user wants to cancel
      navigate('/', { replace: true });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const { result, isError, error } = useMultiVideoResults(analysisId, {
    enabled: !!analysisId,
    onSuccess: (data) => {
      console.log('[MultiVideoProcessing] onSuccess called with status:', data.status);
      if (data.status === 'completed') {
        console.log('[MultiVideoProcessing] Navigating to results:', `/multi-results/${analysisId}`);
        navigate(`/multi-results/${analysisId}`, { replace: true });
      }
    },
  });

  // Poll backend for real progress updates
  useEffect(() => {
    if (!analysisId) return;

    const pollProgress = async () => {
      try {
        const progressData = await AnalysisService.getMultiVideoProgress(analysisId);
        console.log('[MultiVideoProcessing] Progress data:', JSON.stringify(progressData, null, 2));
        console.log('[MultiVideoProcessing] Stage:', progressData.stage, 'Progress:', progressData.progress, '%');
        setCurrentStage(progressData.stage || 'uploading');
        setCurrentProgress(progressData.progress || 0);
        
        // If completed, stop polling (useMultiVideoResults will handle navigation)
        if (progressData.status === 'completed') {
          console.log('[MultiVideoProcessing] Progress shows completed, stopping poll');
          return;
        }
      } catch (error: any) {
        const status = error?.response?.status;
        console.error('[MultiVideoProcessing] Failed to fetch progress:', error?.response?.status, error?.message);
        
        // If we get a 410 (Gone) error, analysis is complete - navigate immediately
        if (status === 410) {
          console.log('[MultiVideoProcessing] Got 410, analysis complete - navigating to results');
          setCurrentStage('completed');
          setCurrentProgress(100);
          // Navigate directly since backend says it's done
          navigate(`/multi-results/${analysisId}`, { replace: true });
          return;
        }
        
        // If 404, analysis not found yet (just started) - keep showing uploading
        if (status === 404) {
          console.log('[MultiVideoProcessing] Analysis not found yet, keeping at uploading stage');
          setCurrentStage('uploading');
          setCurrentProgress(5);
        }
      }
    };

    // Initial poll
    pollProgress();

    // Poll every 2 seconds
    const interval = setInterval(pollProgress, 2000);

    return () => clearInterval(interval);
  }, [analysisId]);

  // Handle timeout (6 minutes for multi-video)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (result?.status !== 'completed') {
        navigate('/', { replace: true });
      }
    }, 360000); // 6 minutes

    return () => clearTimeout(timeout);
  }, [result, navigate]);

  if (isError) {
    return (
      <div className="h-full bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-slate-400 mb-6">{error?.message || 'Something went wrong'}</p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Map current stage to step index
  const stepIndex = PROCESSING_STAGES.findIndex(stage => stage.key === currentStage);
  const activeStepIndex = stepIndex >= 0 ? stepIndex : 0;
  
  // Use backend progress, but show 100% only when actually complete
  const isComplete = currentStage === 'completed' || currentProgress === 100;
  const overallProgress = isComplete ? 100 : Math.min(currentProgress, 95);
  
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);

  return (
    <div className="min-h-full bg-slate-900 text-white flex flex-col items-center p-8 relative overflow-y-auto pt-safe-top pb-safe-bottom">
      {/* Background Visuals */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 w-full h-px bg-emerald-500/50" />
        <div className="absolute top-2/4 left-0 w-full h-px bg-emerald-500/50" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-emerald-500/50" />
        <div className="absolute left-1/2 top-0 w-px h-full bg-emerald-500/50" />
      </div>

      <div className="relative z-10 w-full max-w-xs text-center py-8">
        {/* Video Count Badge */}
        <Badge variant="success" size="md" className="mb-4">
          <Film size={16} className="inline mr-1" />
          {videoCount} Video{videoCount !== 1 ? 's' : ''} • Multi-Angle
        </Badge>

        {/* Overall Progress */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Multi-Angle Analysis</h3>
          <p className="text-sm text-slate-400 mb-4">
            Analyzing delivery from {videoCount} different perspectives
          </p>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {isComplete ? 'Complete' : `${overallProgress}% Complete`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <Clock size={12} className="inline mr-1" />
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </p>
        </div>

        {/* Step Timeline */}
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-xl w-full text-left">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Processing Pipeline
          </p>
          <div className="space-y-0">
            {PROCESSING_STAGES.map((stage, index) => (
              <ProcessStep
                key={stage.key}
                Icon={stage.icon}
                label={stage.label}
                time={stage.time}
                isCurrent={index === activeStepIndex && !isComplete}
                isComplete={
                  index < activeStepIndex ||
                  (index === activeStepIndex && isComplete)
                }
              />
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-6">
          <div className="flex gap-3">
            <div className="mt-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-blue-200 text-xs leading-relaxed">
                Multi-angle analysis provides deeper insights by correlating data across different camera perspectives, 
                resulting in more accurate biomechanical measurements.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelClick}
            leftIcon={<Clock size={16} />}
            className="text-slate-500 hover:text-red-400 mx-auto"
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Analysis'}
          </Button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Multi-Video Analysis?"
        message={`Are you sure you want to cancel this ${videoCount}-video analysis? This will stop the processing and you'll need to start over.`}
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Continue"
        variant="danger"
        loading={isCancelling}
      />
    </div>
  );
}
