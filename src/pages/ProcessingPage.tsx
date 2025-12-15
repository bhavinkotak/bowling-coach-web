import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, CheckCircle, Clock } from 'lucide-react';
import { useAnalysisResult } from '../hooks/useAnalysis';
import { Button, ConfirmDialog } from '../components/Common';
import analysisService from '../services/analysis';

const PROCESSING_STAGES = [
  { key: 'uploading', label: 'Uploading Video', icon: Upload, time: '0:05' },
  { key: 'validation', label: 'Validating Format & Quality', icon: CheckCircle, time: '0:03' },
  { key: 'pose_detection', label: 'Detecting Poses & Joints', icon: '🤸', time: '0:10' },
  { key: 'angle_detection', label: 'Measuring Biomechanical Angles', icon: '📐', time: '0:08' },
  { key: 'analysis', label: 'Generating Report & Score', icon: '⚡', time: '0:05' },
  { key: 'complete', label: 'Analysis Complete', icon: '🏆', time: '0:00' },
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

export default function ProcessingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const analysisId = location.state?.analysisId;
  const [stepIndex, setStepIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Redirect if no analysisId
  useEffect(() => {
    if (!analysisId) {
      console.error('No analysisId provided to ProcessingPage');
      navigate('/', { replace: true });
    }
  }, [analysisId, navigate]);

  // Handle cancel confirmation
  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  // Handle actual cancellation
  const handleConfirmCancel = async () => {
    if (!analysisId) return;
    
    setIsCancelling(true);
    try {
      console.log('Cancelling analysis:', analysisId);
      await analysisService.cancelAnalysis(analysisId);
      console.log('Analysis cancelled successfully');
      // Navigate home after successful cancellation
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to cancel analysis:', error);
      // Navigate home anyway - user wants to cancel
      navigate('/', { replace: true });
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const { result, isError, error } = useAnalysisResult(analysisId, {
    enabled: !!analysisId,
    onSuccess: (data) => {
      console.log('Analysis result received:', data);
      if (data.status === 'completed') {
        console.log('Analysis completed, navigating to results');
        navigate(`/results/${analysisId}`, { replace: true });
      }
    },
  });

  // Update step index based on actual backend progress
  useEffect(() => {
    if (!result?.progress) return;
    
    const progress = result.progress;
    const totalStages = PROCESSING_STAGES.length;
    
    // Map progress percentage to stage index
    // 0-20%: uploading (stage 0)
    // 20-40%: validation (stage 1)
    // 40-60%: pose_detection (stage 2)
    // 60-80%: angle_detection (stage 3)
    // 80-99%: analysis (stage 4)
    // 100%: complete (stage 5)
    let newStepIndex = 0;
    if (progress >= 80) newStepIndex = 4;
    else if (progress >= 60) newStepIndex = 3;
    else if (progress >= 40) newStepIndex = 2;
    else if (progress >= 20) newStepIndex = 1;
    
    // Only show "complete" stage when status is actually completed
    if (result.status === 'completed') {
      newStepIndex = totalStages - 1;
    }
    
    setStepIndex(newStepIndex);
  }, [result?.progress, result?.status]);

  // Handle timeout (4 minutes)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (result?.status !== 'completed') {
        navigate('/', { replace: true });
      }
    }, 240000); // 4 minutes

    return () => clearTimeout(timeout);
  }, [result, navigate]);

  if (isError) {
    return (
      <div className="h-full bg-slate-900 text-white flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto border-2 border-red-500/30">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-slate-400 mb-3">{error?.message || 'Something went wrong during analysis'}</p>
          <p className="text-slate-500 text-sm mb-8">
            This could be due to video quality, format issues, or server problems. You can try again or upload a different video.
          </p>
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => window.location.reload()}
              leftIcon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              }
            >
              Retry Analysis
            </Button>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => navigate('/upload')}
              leftIcon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              }
            >
              Upload New Video
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-slate-300"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use actual backend progress if available, otherwise calculate from stepIndex
  const backendProgress = result?.progress ?? 0;
  const calculatedProgress = Math.min(Math.round((stepIndex / PROCESSING_STAGES.length) * 100), 95);
  const overallProgress = backendProgress > 0 ? backendProgress : calculatedProgress;
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  
  console.log('ProcessingPage:', { 
    backendProgress, 
    calculatedProgress, 
    overallProgress, 
    stepIndex, 
    status: result?.status 
  });

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Visuals */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 w-full h-px bg-emerald-500/50" />
        <div className="absolute top-2/4 left-0 w-full h-px bg-emerald-500/50" />
        <div className="absolute top-3/4 left-0 w-full h-px bg-emerald-500/50" />
        <div className="absolute left-1/2 top-0 w-px h-full bg-emerald-500/50" />
      </div>

      <div className="relative z-10 w-full max-w-xs text-center pt-8">
        {/* Overall Progress */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-2">Biomechanics Scan</h3>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{overallProgress}% Complete</p>
          <p className="text-xs text-slate-500 mt-1">
            <Clock size={12} className="inline mr-1" />
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </p>
        </div>

        {/* Step Timeline */}
        <div className="bg-slate-800/50 p-6 rounded-2xl shadow-xl w-full text-left">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Current Flow
          </p>
          <div className="space-y-0">
            {PROCESSING_STAGES.map((stage, index) => (
              <ProcessStep
                key={stage.key}
                Icon={stage.icon}
                label={stage.label}
                time={stage.time}
                isCurrent={index === stepIndex && index !== PROCESSING_STAGES.length - 1}
                isComplete={
                  index < stepIndex ||
                  (index === PROCESSING_STAGES.length - 1 && index === stepIndex)
                }
              />
            ))}
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
        title="Cancel Analysis?"
        message="Are you sure you want to cancel this analysis? This will stop the processing and you'll need to start over."
        confirmLabel="Yes, Cancel"
        cancelLabel="No, Continue"
        variant="danger"
        loading={isCancelling}
      />
    </div>
  );
}
