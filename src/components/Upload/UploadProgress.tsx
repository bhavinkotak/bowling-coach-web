import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  fileName?: string;
  error?: string;
}

export default function UploadProgress({
  progress,
  status,
  fileName,
  error,
}: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'uploading':
      case 'processing':
        return <Loader className="text-indigo-500 animate-spin" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Complete';
      case 'error':
        return error || 'Upload failed';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-white">
            {fileName || 'Video'}
          </span>
        </div>
        <span className="text-sm text-slate-300">{progress}%</span>
      </div>

      <div className="w-full bg-slate-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            status === 'error' ? 'bg-red-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 mt-2">{getStatusText()}</p>
    </div>
  );
}
