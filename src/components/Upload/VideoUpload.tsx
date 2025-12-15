import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { VideoValidationResult } from '../../types';
import { validateVideoFile } from '../../utils/validators';

interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  maxSize?: number; // in bytes
  disabled?: boolean;
  currentFile?: File | null;
}

export default function VideoUpload({
  onVideoSelect,
  maxSize = 500 * 1024 * 1024, // 500MB default
  disabled = false,
  currentFile = null,
}: VideoUploadProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      console.log('File selected via dropzone:', file.name, file.size, file.type);
      
      setIsValidating(true);
      setValidationError(null);

      try {
        const validation: VideoValidationResult = await validateVideoFile(file);
        
        if (!validation.valid) {
          setValidationError(validation.error || 'Invalid video file');
          setIsValidating(false);
          return;
        }

        console.log('Video validation passed, calling onVideoSelect');
        onVideoSelect(file);
        setValidationError(null);
      } catch (error) {
        console.error('Video validation error:', error);
        setValidationError('Error validating video file');
      } finally {
        setIsValidating(false);
      }
    },
    [onVideoSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/*': []
    },
    maxSize,
    multiple: false,
    disabled: disabled || isValidating,
    noClick: false,
    noKeyboard: false,
  });

  return (
    <div className="space-y-2">
      <button
        type="button"
        {...getRootProps()}
        disabled={disabled || isValidating}
        className="w-full px-6 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
      >
        <input {...getInputProps()} />
        {isValidating ? 'Validating...' : isDragActive ? 'Drop video here' : currentFile ? 'Change Video' : 'Select Video'}
      </button>

      {validationError && (
        <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <svg
            className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-red-300">{validationError}</p>
        </div>
      )}
    </div>
  );
}
