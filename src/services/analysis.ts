import apiClient from './api';
import axios from 'axios';
import type { 
  AnalysisResult, 
  MultiVideoAnalysisResult, 
  BowlerType, 
  CameraAngle
} from '../types';

export interface VideoData {
  uri: File | string;
  name: string;
  expectedAngle?: CameraAngle;
}

class AnalysisService {
  /**
   * Detect camera angle from a video file using AI
   */
  async detectCameraAngle(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{
    detected_angle: CameraAngle;
    confidence: number;
    message: string;
    quality_scores?: Record<string, string>;
  }> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await apiClient.post('/detect_angle', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data;
  }

  /**
   * Upload and analyze a single video
   * Note: bowling_arm is now auto-detected from video, not user-provided
   */
  async uploadAndAnalyze(
    file: File,
    userId: string,
    bowlerType: BowlerType,
    bowlerName?: string,
    onProgress?: (progress: number) => void,
    bowlingStyle?: string
  ): Promise<{ analysisId: string; message?: string }> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('bowler_name', bowlerName || 'Anonymous');
    formData.append('bowler_type', bowlerType);
    formData.append('user_id', userId);
    
    // Add bowling style if provided (bowling_arm is auto-detected by backend)
    console.log('📤 uploadAndAnalyze - bowling params:', JSON.stringify({ bowlingStyle }));
    if (bowlingStyle) {
      formData.append('bowling_style', bowlingStyle);
    }

    const response = await apiClient.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    // Backend returns analysis_id (snake_case), convert to analysisId (camelCase)
    return {
      analysisId: response.data.analysis_id,
      message: response.data.message
    };
  }

  /**
   * Upload and analyze multiple videos (multi-angle)
   * Note: bowling_arm is now auto-detected from video, not user-provided
   */
  async uploadAndAnalyzeMultiple(
    videos: VideoData[],
    userId: string,
    bowlerType: BowlerType,
    bowlingStyle: string,
    onProgress?: (progress: number) => void
  ): Promise<{ analysisId: string; videosAnalyzed: number; message?: string }> {
    console.log('📤 uploadAndAnalyzeMultiple START - videos:', videos.length);
    console.log('📤 uploadAndAnalyzeMultiple - bowling params:', JSON.stringify({ bowlingStyle }));
    
    const formData = new FormData();

    // Add all videos and their angles
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`📤 Processing video ${i + 1}/${videos.length}:`, {
        name: video.name,
        uriType: typeof video.uri,
        isFile: video.uri instanceof File,
        hasExpectedAngle: !!video.expectedAngle
      });
      
      // Handle both File objects and URIs
      let file: File | Blob;
      if (video.uri instanceof File) {
        console.log(`✅ Video ${i + 1} is a File object, size: ${video.uri.size} bytes`);
        file = video.uri;
      } else {
        // Convert URI to Blob if needed
        console.log(`🔄 Video ${i + 1} is a URI, fetching blob...`);
        try {
          const response = await fetch(video.uri as string);
          file = await response.blob();
          console.log(`✅ Video ${i + 1} blob fetched, size: ${file.size} bytes`);
        } catch (fetchError) {
          console.error(`❌ Failed to fetch video ${i + 1}:`, fetchError);
          throw new Error(`Failed to fetch video ${i + 1}: ${fetchError}`);
        }
      }
      
      formData.append('videos', file, video.name);
      if (video.expectedAngle) {
        formData.append('angles', video.expectedAngle);
      }
    }

    formData.append('user_id', userId);
    formData.append('bowler_type', bowlerType);
    formData.append('bowling_style', bowlingStyle);
    formData.append('video_count', videos.length.toString());

    console.log('📤 FormData prepared, starting POST request to /analyze_multiple');
    console.log('📤 API Base URL:', apiClient.defaults.baseURL);
    const response = await apiClient.post('/analyze_multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Upload progress: ${percent}%`);
          onProgress(percent);
        }
      },
    });

    console.log('✅ Upload response received:', JSON.stringify(response.data));
    console.log('✅ Response status:', response.status);
    console.log('✅ Response keys:', Object.keys(response.data));
    
    // Backend returns analysis_id (snake_case), convert to analysisId (camelCase)
    return {
      analysisId: response.data.analysis_id,
      videosAnalyzed: response.data.videos_count,
      message: response.data.message
    };
  }

  /**
   * Get analysis result for a single video
   */
  async getAnalysisResult(analysisId: string): Promise<AnalysisResult> {
    const response = await apiClient.get<AnalysisResult>(`/analysis/${analysisId}`);
    return response.data;
  }

  /**
   * Get results for multi-video analysis
   */
  async getMultiVideoResults(analysisId: string): Promise<MultiVideoAnalysisResult> {
    console.log('=== SERVICE: getMultiVideoResults called ===');
    console.log('Analysis ID:', analysisId);
    const response = await apiClient.get<any>(`/multi-analysis/${analysisId}`);
    const data = response.data;
    
    console.log('=== SERVICE: Backend response received ===');
    console.log('Has parameters?', data.parameters != null);
    console.log('Parameters length:', data.parameters?.length);
    if (data.parameters && data.parameters.length > 0) {
      console.log('First param name:', data.parameters[0].name);
      console.log('First param has clips?', data.parameters[0].clips != null);
      console.log('First param clip path:', data.parameters[0].clips?.path);
    }
    
    // Map backend response structure to frontend expected structure
    // Backend returns: overall_score, parameters, consolidated_analysis
    // Frontend expects: both new format (analysis_id, parameters array) and legacy format
    
    const result: MultiVideoAnalysisResult = {
      analysis_id: data.analysis_id || analysisId,
      analysisId: data.analysis_id || data.analysisId || analysisId,
      status: data.status,
      parameters: data.parameters || [],
      overall_score: data.overall_score,
      consolidated_analysis: data.consolidated_analysis,
      videoCount: data.videos_analyzed || data.videosAnalyzed || data.videoCount || 0,
      aggregated: {
        overallScore: data.overall_score || data.overallScore || 0,
        parameters: {}
      }
    };
    
    console.log('=== SERVICE: Result mapped ===');
    console.log('Result has parameters?', result.parameters != null);
    console.log('Result parameters length:', result.parameters?.length);
    
    // Map parameters array to Record<string, ParameterScore>
    if (data.parameters && Array.isArray(data.parameters)) {
      const paramRecord: Record<string, any> = {};
      data.parameters.forEach((param: any) => {
        if (param.name) {
          paramRecord[param.name] = {
            value: param.value,
            score: param.score,
            feedback: param.feedback,
            best_angle: param.best_angle,
            best_angle_quality: param.best_angle_quality,
            angle_scores: param.angle_scores,
            snapshot: param.snapshot,
            clips: param.clips
          };
        }
      });
      if (result.aggregated) {
        result.aggregated.parameters = paramRecord;
      }
    }
    
    console.log('✅ Mapped result:', JSON.stringify(result, null, 2));
    
    return result;
  }

  /**
   * Get multi-video analysis progress
   */
  async getMultiVideoProgress(analysisId: string): Promise<{
    stage: string;
    progress: number;
    message: string;
    status: string;
    timestamp: number;
  }> {
    const response = await apiClient.get(`/multi-analysis/${analysisId}/progress`);
    const data = response.data;
    
    // Map backend response to frontend expected format
    // Backend returns: current_stage, overall_progress
    // Frontend expects: stage, progress
    return {
      stage: data.current_stage || data.stage || 'uploading',
      progress: data.overall_progress || data.progress || 0,
      message: data.message || 'Processing...',
      status: data.status || 'processing',
      timestamp: data.last_updated || data.timestamp || Date.now() / 1000
    };
  }

  /**
   * Get analysis progress
   */
  async getAnalysisProgress(analysisId: string): Promise<{
    stage: string;
    progress: number;
    message: string;
    status?: string;
    timestamp: number;
    // Legacy fields for backward compatibility
    current_stage?: string;
    overall_progress?: number;
  }> {
    // Progress endpoint is under /api not /api/v2
    // Use axios directly with full URL to avoid baseURL issues
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2').replace('/api/v2', '/api');
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    
    if (token?.startsWith('guest_token_')) {
      const deviceId = localStorage.getItem('device_id');
      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${baseUrl}/analysis/${analysisId}/progress`, { headers });
    return response.data;
  }

  /**
   * Poll for analysis completion
   * @param analysisId - The analysis ID to poll
   * @param onProgress - Callback for progress updates
   * @param interval - Polling interval in ms (default: 2000)
   * @param maxDuration - Maximum time to poll in ms (default: 5 minutes)
   * @returns Promise that resolves when analysis is complete
   */
  async pollAnalysisProgress(
    analysisId: string,
    onProgress?: (progress: number, stage: string) => void,
    interval: number = 2000,
    maxDuration: number = 300000 // 5 minutes
  ): Promise<void> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check if we've exceeded max duration
          if (Date.now() - startTime > maxDuration) {
            console.warn('Analysis polling timeout - resolving anyway');
            resolve();
            return;
          }

          const progressData = await this.getAnalysisProgress(analysisId);
          
          // Handle both old and new response formats
          const progress = progressData.progress ?? progressData.overall_progress ?? 0;
          const stage = progressData.stage ?? progressData.current_stage ?? 'unknown';
          // Note: status field only exists on completion, infer from stage/progress
          const status = progressData.status ?? (progress >= 100 || stage === 'complete' ? 'completed' : 'processing');
          
          console.log('Progress poll:', progressData);
          console.log('Progress value:', progress, 'Status:', status, 'Stage:', stage);
          
          if (onProgress) {
            onProgress(progress, stage);
          }

          // Check if analysis is complete - progress reaches 100 or status/stage indicates completion
          if (status === 'completed' || stage === 'complete' || progress >= 100) {
            resolve();
          } else if (status === 'failed' && stage !== 'not_found') {
            // Real failure - reject
            reject(new Error(progressData.message || 'Analysis failed'));
          } else {
            // Continue polling (including 'not_found' - backend might be slow)
            setTimeout(poll, interval);
          }
        } catch (error) {
          console.error('Error polling progress:', error);
          // Don't fail on polling errors - just resolve and let user check manually
          resolve();
        }
      };

      // Start polling immediately
      poll();
    });
  }

  /**
   * Get recent analyses for a user
   */
  async getUserAnalyses(userId: string, limit: number = 10): Promise<{
    analyses: AnalysisResult[];
    totalCount: number;
    averageScore: number;
  }> {
    console.log('[AnalysisService] getUserAnalyses called with userId:', userId, 'limit:', limit);
    console.log('[AnalysisService] Making GET request to:', `/user/${userId}/analyses/recent`);
    
    const response = await apiClient.get<{ 
      analyses: AnalysisResult[];
      total_count: number;
      average_score: number;
    }>(`/user/${userId}/analyses/recent`, {
      params: { limit }
    });
    
    console.log('[AnalysisService] Response received:', response);
    console.log('[AnalysisService] Response status:', response.status);
    console.log('[AnalysisService] Response data:', response.data);
    console.log('[AnalysisService] Analyses array:', response.data.analyses);
    console.log('[AnalysisService] Total count:', response.data.total_count);
    console.log('[AnalysisService] Average score:', response.data.average_score);
    
    // Backend returns {analyses: [...], total_count: X, average_score: Y}
    return {
      analyses: response.data.analyses || [],
      totalCount: response.data.total_count || 0,
      averageScore: response.data.average_score || 0,
    };
  }

  /**
   * Delete an analysis and all associated files
   * Automatically detects if it's single-video or multi-video and calls the appropriate endpoint
   */
  async deleteAnalysis(analysisId: string): Promise<{
    message: string;
    analysis_id: string;
    files_deleted?: number;
    files_scheduled_for_cleanup?: number;
    directories_deleted?: number;
    errors?: string[];
  }> {
    // First, try to detect if it's multi-video or single-video
    try {
      // Try fetching as multi-video
      const multiResponse = await apiClient.get(`/multi-analysis/${analysisId}`);
      if (multiResponse.data) {
        const data = multiResponse.data;
        // Check if it's actually multi-video by looking for multi-video specific structure
        const isMultiVideo = (
          data.parameters && 
          Array.isArray(data.parameters) && 
          data.parameters.length > 0 && 
          (
            data.parameters[0].best_angle !== undefined ||
            data.video_count > 1 ||
            data.videoCount > 1
          )
        );
        
        if (isMultiVideo) {
          console.log('🗑️  Deleting multi-video analysis:', analysisId);
          // Get user_id from localStorage or auth
          const token = localStorage.getItem('authToken');
          let userId = 'guest';
          
          if (token && !token.startsWith('guest_token_')) {
            // Try to parse JWT token to get user_id
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              userId = payload.user_id || payload.sub || 'guest';
            } catch (e) {
              console.warn('Failed to parse token for user_id');
            }
          } else if (token) {
            // Guest token
            userId = token.replace('guest_token_', '');
          }
          
          // Delete multi-video analysis
          const response = await apiClient.delete(`/multi-analysis/${analysisId}?user_id=${userId}`);
          return {
            ...response.data,
            files_deleted: response.data.files_scheduled_for_cleanup || 0
          };
        }
      }
    } catch (e) {
      // If multi-video fetch fails, try single-video
      console.log('Not a multi-video analysis, trying single-video delete');
    }
    
    // Delete as single-video
    console.log('🗑️  Deleting single-video analysis:', analysisId);
    const response = await apiClient.delete(`/analysis/${analysisId}`);
    return response.data;
  }

  /**
   * Cancel a single video analysis that is currently processing
   * This will stop the backend processing and clean up temporary files
   */
  async cancelAnalysis(analysisId: string): Promise<{
    message: string;
    analysis_id: string;
    status: string;
    cancelled_at: string;
  }> {
    // Use axios directly to call the /api endpoint (not /api/v2)
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2').replace('/api/v2', '/api');
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};
    
    if (token?.startsWith('guest_token_')) {
      const deviceId = localStorage.getItem('device_id');
      if (deviceId) {
        headers['X-Device-ID'] = deviceId;
      }
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${baseUrl}/analysis/${analysisId}/cancel`, {}, { headers });
    return response.data;
  }

  /**
   * Cancel a multi-video analysis that is currently processing
   * This will stop the backend processing and clean up temporary files
   */
  async cancelMultiVideoAnalysis(analysisId: string): Promise<{
    message: string;
    analysis_id: string;
    status: string;
    cancelled_at: string;
  }> {
    // Multi-video cancel endpoint is under /api/v2
    const response = await apiClient.post(`/multi-analysis/${analysisId}/cancel`);
    return response.data;
  }
}

// Export singleton instance
const analysisService = new AnalysisService();
export default analysisService;
