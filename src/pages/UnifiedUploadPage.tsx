import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Film, X, Target, Camera } from 'lucide-react';
import { Button } from '../components/Common';
import type { CameraAngle } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUpload } from '../hooks/useUpload';
import { toast } from 'react-hot-toast';

interface VideoItem {
  id: string;
  file: File;
  angle: CameraAngle | null; // Still needed for API compatibility, but auto-detected
  progress: number;
  // Removed: detectingAngle, detectionMessage, detectionConfidence
  // Camera angle is now automatically detected during backend analysis
}

export default function UnifiedUploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { uploadSingleVideo, uploadMultipleVideos, isUploading } = useUpload();
  
  const [videos, setVideos] = useState<VideoItem[]>([]);

  // Detect if user is on a mobile device
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Auto-detect mode based on video count
  const isMultiVideo = videos.length > 1;

  // Validate video file and check for optimization opportunities
  const validateVideoFile = async (file: File): Promise<{ 
    valid: boolean; 
    warnings: string[]; 
    needsCompression?: boolean;
    metadata?: { width: number; height: number; duration: number };
  }> => {
    const warnings: string[] = [];
    let needsCompression = false;
    let metadata: { width: number; height: number; duration: number } | undefined;
    
    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
      toast.error(`Invalid file type: ${file.type || 'unknown'}. Please use MP4, MOV, AVI, or MKV format.`);
      return { valid: false, warnings };
    }
    
    // Check file size (500MB max)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum size is 500MB.`);
      return { valid: false, warnings };
    }
    
    // Warn if file is very small (might be low quality)
    if (file.size < 1 * 1024 * 1024) {
      warnings.push('Video file is very small. Ensure it has good quality for accurate analysis.');
    }
    
    // Extract video metadata (duration and resolution)
    try {
      const videoMetadata = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const data = {
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          };
          window.URL.revokeObjectURL(video.src);
          resolve(data);
        };
        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          reject(new Error('Could not load video metadata'));
        };
        video.src = URL.createObjectURL(file);
      });
      
      metadata = videoMetadata;
      
      // Check duration (3-30 seconds recommended)
      if (videoMetadata.duration < 3) {
        warnings.push(`Video is ${videoMetadata.duration.toFixed(1)}s. Recommended minimum is 3s for accurate analysis.`);
      } else if (videoMetadata.duration > 30) {
        warnings.push(`Video is ${videoMetadata.duration.toFixed(1)}s. Consider trimming to 10-30s for faster processing.`);
      }
      
      // Check resolution - offer compression for 4K or very high resolution
      const is4K = videoMetadata.width >= 3840 || videoMetadata.height >= 2160;
      const isHighRes = videoMetadata.width >= 1920 || videoMetadata.height >= 1080;
      const isLargeFile = file.size > 50 * 1024 * 1024; // 50MB
      
      if (is4K) {
        needsCompression = true;
        toast(
          `4K video detected (${videoMetadata.width}×${videoMetadata.height}). Compression recommended to speed up upload and processing.`,
          {
            icon: '🎬',
            duration: 6000,
          }
        );
      } else if (isHighRes && isLargeFile) {
        needsCompression = true;
        toast(
          `Large HD video detected (${(file.size / (1024 * 1024)).toFixed(1)}MB). Consider compressing to 720p for faster upload.`,
          {
            icon: '💾',
            duration: 6000,
          }
        );
      }
      
      console.log('📊 Video metadata:', {
        width: videoMetadata.width,
        height: videoMetadata.height,
        duration: videoMetadata.duration.toFixed(1),
        size: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        needsCompression,
      });
      
    } catch (error) {
      console.warn('Could not extract video metadata:', error);
    }
    
    // Show warnings if any
    if (warnings.length > 0) {
      warnings.forEach(warning => {
        toast(warning, {
          icon: '⚠️',
          duration: 5000,
        });
      });
    }
    
    return { valid: true, warnings, needsCompression, metadata };
  };

  // Add video with auto-detection
  const handleAddVideo = async (file: File) => {
    if (videos.length >= 3) {
      toast.error('Maximum 3 videos allowed');
      return;
    }

    if (videos.some(v => v.file.name === file.name)) {
      toast.error('This video is already added');
      return;
    }
    
    // Validate video file and check for compression needs
    const validation = await validateVideoFile(file);
    if (!validation.valid) {
      return;
    }
    
    // TODO: Implement compression prompt and flow
    if (validation.needsCompression && validation.metadata) {
      console.log('💡 Compression recommended:', {
        originalSize: `${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        resolution: `${validation.metadata.width}×${validation.metadata.height}`,
        targetResolution: validation.metadata.width >= 3840 ? '1080p' : '720p',
      });
      // Future: Show compression modal here offering to compress before upload
      // For now, we'll proceed with the original file
    }

    const newVideo: VideoItem = {
      id: Date.now().toString(),
      file,
      angle: null, // Will be auto-detected by backend during analysis
      progress: 0,
    };

    setVideos(prev => [...prev, newVideo]);
    
    // Camera angle detection now happens automatically during backend analysis
    // No need for pre-upload detection or manual selection
  };

  const handleRemoveVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleAddVideo(file));
      e.target.value = '';
    }
  };

  // Unified Analyze function - handles both single and multi-video
  const handleAnalyze = async () => {
    if (videos.length === 0) {
      toast.error('Please add at least one video');
      return;
    }

    if (!user?.id) {
      toast.error('Please login to analyze videos');
      navigate('/login');
      return;
    }

    // CRITICAL: Always get the latest user data from localStorage (source of truth after profile updates)
    const userFromLocalStorage = localStorage.getItem('user');
    const localStorageUser = userFromLocalStorage ? JSON.parse(userFromLocalStorage) : null;
    
    // Use localStorage values as they are authoritative after profile saves
    const currentBowlingStyle = localStorageUser?.bowlingStyle || user.bowlingStyle || 'pace';
    const currentBowlingArm = localStorageUser?.bowlingArm || user.bowlingArm || 'right';
    
    console.log('🎯 Bowling profile comparison:');
    console.log('  Zustand store:', JSON.stringify({ 
      bowlingStyle: user.bowlingStyle, 
      bowlingArm: user.bowlingArm,
      isGuest: user.isGuest,
      userId: user.id
    }));
    console.log('  localStorage (source of truth):', JSON.stringify({
      bowlingStyle: localStorageUser?.bowlingStyle,
      bowlingArm: localStorageUser?.bowlingArm,
      userId: localStorageUser?.id
    }));
    console.log('  ✅ WILL USE FOR ANALYSIS:', JSON.stringify({
      bowlingStyle: currentBowlingStyle,
      bowlingArm: currentBowlingArm
    }));

    // Note: Bowling arm AND camera angles are now auto-detected by backend analysis
    
    const bowlerType = currentBowlingStyle === 'pace' ? 'fast' : 'spin';

    // Single video analysis
    if (videos.length === 1) {
      try {
        await uploadSingleVideo(
          videos[0].file, 
          user.id, 
          bowlerType,
          user.name || 'Anonymous',
          {
            onProgress: (progress) => {
              console.log('Upload progress:', progress);
            },
            onSuccess: (analysisId) => {
              toast.success('Upload successful! Starting analysis...');
              navigate('/processing', { state: { analysisId } });
            },
            onError: (error) => {
              toast.error(error.message || 'Upload failed');
            },
          },
          currentBowlingStyle
        );
      } catch (error) {
        console.error('Upload exception:', error);
      }
      return;
    }

    // Multi-video analysis
    // Note: Camera angles are automatically detected by backend - no need for user input
    try {
      console.log('🎬 Preparing video data for upload...');
      const videoData = videos.map(v => ({
        file: v.file,
        angle: 'unknown' as CameraAngle, // Backend will auto-detect during analysis
      }));
      console.log('🎬 Video data prepared, calling uploadMultipleVideos...');

      await uploadMultipleVideos(videoData, user.id, bowlerType, currentBowlingStyle, {
        onProgress: (progress) => {
          console.log(`📊 Upload progress: ${progress}%`);
        },
        onSuccess: (analysisId) => {
          console.log('✅ Upload successful, analysis ID:', analysisId);
          toast.success('All videos uploaded successfully!');
          navigate('/multi-processing', { state: { analysisId, videoCount: videos.length } });
        },
        onError: (error) => {
          console.error('❌ Upload error callback:', error);
          toast.error(error.message || 'Upload failed');
        },
      });
      console.log('✅ uploadMultipleVideos completed successfully');
    } catch (error) {
      console.error('❌ Upload exception caught:', error);
      console.error('❌ Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast.error('Upload failed. Please try again.');
    }
  };

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col pt-safe-top pb-safe-bottom">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft size={16} />}
          className="text-slate-400 hover:text-white"
        >
          Back
        </Button>
      </div>

      <div className="flex-1 px-6 pt-4 pb-24 flex flex-col overflow-y-auto">
        {/* Header Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Upload Videos</h2>
          <p className="text-slate-400 text-sm">
            {videos.length === 0 
              ? 'Add 1 video for single analysis or 2-3 videos for multi-angle analysis'
              : isMultiVideo
                ? `Multi-Angle Analysis • ${videos.length}/3 videos`
                : 'Single Video Analysis'
            }
          </p>
        </div>

        {/* Video List */}
        {videos.length > 0 && (
          <div className="space-y-3 mb-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Film size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{video.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(video.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveVideo(video.id)}
                    className="text-slate-500 hover:text-red-400 p-2 rounded-full hover:bg-slate-700/50 min-w-fit"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Video Options - Side by Side */}
        {videos.length < 3 && (
          <div className="mb-6">
            {/* Hidden file inputs */}
            <input
              type="file"
              accept="video/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="video-input-gallery"
              multiple={videos.length === 0}
            />
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
              id="video-input-camera"
            />

            {/* Side by Side Upload Options */}
            <div className="grid grid-cols-2 gap-4">
              {/* Gallery Upload Button */}
              <label 
                htmlFor="video-input-gallery" 
                className="border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-500 hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                  <Upload size={28} className="text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">From Gallery</p>
                  <p className="text-slate-500 text-xs">Choose video</p>
                </div>
              </label>

              {/* Camera Record Button */}
              <label 
                htmlFor="video-input-camera" 
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-colors ${
                  isMobileDevice 
                    ? 'border-slate-700 bg-slate-800/30 cursor-pointer hover:border-blue-500 hover:bg-slate-800/50' 
                    : 'border-slate-800 bg-slate-900/20 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isMobileDevice ? 'bg-slate-800' : 'bg-slate-900'
                }`}>
                  <Camera size={28} className={isMobileDevice ? "text-blue-400" : "text-slate-600"} />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">
                    {isMobileDevice ? 'Record Video' : 'Record'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {isMobileDevice ? 'Use camera' : 'Mobile only'}
                  </p>
                </div>
              </label>
            </div>

            {/* Helper text */}
            <p className="text-center text-xs text-slate-500 mt-4">
              {videos.length === 0 
                ? 'Upload single or multiple videos for analysis' 
                : `${videos.length}/3 videos added • You can add ${3 - videos.length} more`}
            </p>
          </div>
        )}

        {/* Info Card */}
        {videos.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6">
            <div className="flex gap-3">
              <div className="mt-1">
                <Target size={20} className="text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold text-blue-300 text-sm mb-1">
                  {isMultiVideo ? 'Multi-Angle Analysis' : 'Tips for Best Results'}
                </h4>
                <ul className="text-blue-200 text-xs space-y-1 leading-relaxed">
                  {isMultiVideo ? (
                    <>
                      <li>• Different angles provide comprehensive insights</li>
                      <li>• Front, side, and diagonal views recommended</li>
                      <li>• All videos should show same bowling action</li>
                    </>
                  ) : (
                    <>
                      <li>• Capture full body in frame</li>
                      <li>• Use side or diagonal angle</li>
                      <li>• Ensure good lighting</li>
                      <li>• Stable camera (no shaking)</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        {videos.length > 0 && (
          <div className="mt-auto space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isUploading}
              loading={isUploading}
              onClick={handleAnalyze}
              leftIcon={!isUploading && <Upload size={20} />}
              className="shadow-lg shadow-emerald-500/20"
            >
              {isUploading 
                ? 'Uploading...' 
                : `Analyze ${videos.length} Video${videos.length > 1 ? 's' : ''}`
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
