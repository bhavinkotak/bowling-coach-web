// Core type definitions for the Cricket Bowling Coach app

// BIOMECHANICS-BASED CLASSIFICATION:
// Only 2 bowling styles that have different biomechanics: pace vs spin
// Handedness matters for camera angle interpretation and body side detection
export type BowlingStyle = 'pace' | 'spin';  // Biomechanically distinct techniques
export type BowlingArm = 'right' | 'left';   // Handedness affects analysis interpretation

// Legacy type for backward compatibility
export type BowlerType = 'fast' | 'medium' | 'spin';
export type CameraAngle = 'front' | 'side' | 'diagonal';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  isGuest?: boolean;
  // NEW: More accurate bowling profile
  bowlingStyle?: BowlingStyle;  // 'pace' or 'spin' - biomechanically different
  bowlingArm?: BowlingArm;      // 'right' or 'left' - affects analysis interpretation
  // LEGACY: Keep for backward compatibility with existing data
  bowlerType?: BowlerType;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface ParameterFeedback {
  issues: string[];
  strengths: string[];
}

// Keyframe marker for video timeline
export interface KeyframeMarker {
  timestamp: number; // Time in seconds
  frameIndex: number; // Frame number in video
  label: string; // Display label (e.g., "Release Point")
  parameterName: string; // Backend parameter key (e.g., "release_point")
}

// Video clip metadata
export interface VideoClip {
  url: string; // Path to clip file
  startTime: number; // Start timestamp in seconds
  endTime: number; // End timestamp in seconds
  duration: number; // Clip duration in seconds
  frameCount?: number; // Number of frames in clip
}

export interface ParameterScore {
  score: number;
  feedback?: ParameterFeedback | string;
  clips?: string[] | Record<string, VideoClip>; // Can be URLs or detailed clip data
  snapshots?: string[] | Record<string, string>; // Can be URLs
  keyframe?: KeyframeMarker; // Associated keyframe for timeline
}

export interface AnalysisResult {
  // Frontend format (camelCase)
  analysisId?: string;
  sequenceNumber?: number; // Permanent sequential number (never changes, even after deletions)
  status: AnalysisStatus;
  progress?: number; // Progress percentage (0-100) during processing
  stage?: string; // Current processing stage
  overallScore?: number;
  createdAt?: string; // ISO date string
  bowlerType?: string; // Type of bowler (fast, pace, spin)
  bowlingArmDetected?: string; // Auto-detected bowling arm (right, left)
  parameters?: Record<string, ParameterScore | number>; // Can be score number or full ParameterScore object
  parameterFeedback?: Record<string, ParameterFeedback>;
  feedback?: {
    parameterFeedback?: Record<string, ParameterFeedback>;
  };
  videoInfo?: {
    parameterClips?: Record<string, any>;
    parameterSnapshots?: Record<string, any>;
  };
  annotatedUrl?: string; // URL to annotated video with pose overlays
  annotated_url?: string; // Backend format (snake_case)
  
  // Backend format (snake_case) - for compatibility
  analysis_id?: string;
  sequence_number?: number; // Backend format
  overall_score?: number;
  created_at?: string; // ISO date string from backend
  bowler_type?: string; // Backend format
  bowling_arm_detected?: string; // Backend format
  analysis?: Record<string, number>; // Backend returns scores as numbers in 'analysis' field
  video_info?: {
    parameter_clips?: Record<string, string>;
    parameter_snapshots?: Record<string, string>;
    duration?: number;
    fps?: number;
    resolution?: number[];
    quality_score?: number;
  };
  video_metadata?: {
    parameter_clips?: Record<string, string>;
    parameter_snapshots?: Record<string, string>;
    duration?: number;
    fps?: number;
    resolution?: number[];
    quality_score?: number;
  };
  
  error?: string;
  message?: string;
}

export interface VideoUpload {
  id: string;
  file: File;
  angle?: CameraAngle;
  duration?: number;
  progress: number;
  status?: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
}

export interface MultiVideoAnalysisResult {
  analysis_id: string;
  analysisId?: string; // Alias for compatibility
  status: AnalysisStatus;
  overall_score?: number;
  overallScore?: number; // Alias for compatibility
  parameters: Array<{
    parameter_name: string;
    score: number;
    feedback: string;
    clips?: Record<string, string>;
  }>;
  consolidated_analysis?: {
    overall_score: number;
    parameters: Record<string, ParameterScore>;
  };
  videos_analyzed?: number;
  videoCount?: number; // Alias for compatibility
  created_at?: string;
  completed_at?: string;
  user_id?: string;
  videos?: any[];
  gallery?: any;
  performance?: any;
  angle_coverage_analysis?: any;
  progress?: number;
  state?: string;
  timestamp?: string;
  // Legacy fields for backward compatibility
  results?: {
    [angle: string]: AnalysisResult;
  };
  aggregated?: {
    overallScore: number;
    parameters: Record<string, ParameterScore>;
  };
  bestAngle?: CameraAngle;
  error?: string;
  message?: string;
}

export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
  speed?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
}
