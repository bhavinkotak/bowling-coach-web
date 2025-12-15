import { useState, useCallback } from 'react';
import { useUploadStore } from '../stores/uploadStore';
import AnalysisService from '../services/analysis';
import type { BowlerType, CameraAngle, VideoUpload } from '../types';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (analysisId: string) => void;
  onError?: (error: Error) => void;
}

export function useUpload() {
  const { addUpload, updateUpload, removeUpload, setCurrentUpload } = useUploadStore();
  const [isUploading, setIsUploading] = useState(false);

  const uploadSingleVideo = useCallback(
    async (
      file: File,
      userId: string,
      bowlerType: BowlerType,
      bowlerName?: string,
      options: UploadOptions = {},
      bowlingStyle?: string,
      bowlingArm?: string
    ) => {
      const uploadId = `upload-${Date.now()}`;
      
      const videoUpload: VideoUpload = {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading',
      };

      addUpload(videoUpload);
      setCurrentUpload(videoUpload);
      setIsUploading(true);

      try {
        console.log('🚀 Starting upload:', { userId, bowlerType, bowlerName, fileName: file.name, bowlingStyle, bowlingArm });
        
        const onUploadProgress = (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log('📤 Upload progress:', progress + '%');
          updateUpload(uploadId, { progress, status: 'uploading' });
          options.onProgress?.(progress);
        };

        const result = await AnalysisService.uploadAndAnalyze(
          file,
          userId,
          bowlerType,
          bowlerName,
          onUploadProgress,
          bowlingStyle
        );
        
        console.log('✅ Upload response:', result);

        // Update to processing status after upload completes
        updateUpload(uploadId, { progress: 100, status: 'processing' });
        setIsUploading(false);

        // IMMEDIATELY navigate to processing page after upload succeeds
        if (options.onSuccess) {
          console.log('🎯 Navigating to processing page with analysisId:', result.analysisId);
          options.onSuccess(result.analysisId);
        }

        // Then continue polling in background (the ProcessingPage will also poll)
        // This is just to update the upload store
        try {
          console.log('🔄 Starting background progress polling for:', result.analysisId);
          await AnalysisService.pollAnalysisProgress(
            result.analysisId,
            (analysisProgress) => {
              console.log('📊 Background analysis progress update:', analysisProgress + '%');
              updateUpload(uploadId, { 
                progress: analysisProgress, 
                status: 'processing' 
              });
            }
          );
          console.log('✅ Background polling completed');
          updateUpload(uploadId, { progress: 100, status: 'completed' });
        } catch (pollError) {
          console.warn('⚠️ Background polling failed:', pollError);
          updateUpload(uploadId, { status: 'error' });
        }

        return result;
      } catch (error) {
        console.error('❌ Upload failed:', error);
        updateUpload(uploadId, { status: 'error' });
        setIsUploading(false);
        
        if (options.onError) {
          options.onError(error as Error);
        }
        throw error;
      }
    },
    [addUpload, updateUpload, setCurrentUpload]
  );

  const uploadMultipleVideos = useCallback(
    async (
      videos: { file: File; angle?: CameraAngle }[],
      userId: string,
      bowlerType: BowlerType,
      bowlingStyle: string,
      options: UploadOptions = {}
    ) => {
      setIsUploading(true);

      try {
        const onProgress = (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          options.onProgress?.(progress);
        };

        const videoData = videos.map((v) => ({
          uri: v.file,
          name: v.file.name,
          expectedAngle: v.angle,
        }));

        const result = await AnalysisService.uploadAndAnalyzeMultiple(
          videoData,
          userId,
          bowlerType,
          bowlingStyle,
          onProgress
        );

        setIsUploading(false);
        
        if (options.onSuccess) {
          options.onSuccess(result.analysisId);
        }

        return result;
      } catch (error) {
        setIsUploading(false);
        
        if (options.onError) {
          options.onError(error as Error);
        }
        throw error;
      }
    },
    []
  );

  const cancelUpload = useCallback(
    (uploadId: string) => {
      removeUpload(uploadId);
    },
    [removeUpload]
  );

  return {
    isUploading,
    uploadSingleVideo,
    uploadMultipleVideos,
    cancelUpload,
  };
}
