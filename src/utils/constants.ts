// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2',
  TIMEOUT: 60000,
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_VIDEO_FORMATS: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  ALLOWED_VIDEO_EXTENSIONS: ['.mp4', '.mov', '.avi'],
};

// Colors
export const COLORS = {
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#4338CA',
  
  success: '#22C55E',
  successLight: '#4ADE80',
  successDark: '#16A34A',
  
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  warningDark: '#F59E0B',
  
  error: '#EF4444',
  errorLight: '#F87171',
  errorDark: '#DC2626',
  
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
};

// Spacing
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

// Bowling Styles (Biomechanically Distinct)
// Pace vs Spin have fundamentally different techniques that affect analysis
export const BOWLING_STYLES = [
  { value: 'pace', label: 'Pace Bowler', emoji: '⚡', description: 'Fast/Medium - focuses on speed and bounce' },
  { value: 'spin', label: 'Spin Bowler', emoji: '🌀', description: 'Focuses on turn and flight' },
] as const;

// Bowling Arm (Handedness)
// Matters for camera angle interpretation and body side detection
export const BOWLING_ARMS = [
  { value: 'right', label: 'Right-Arm', emoji: '👉' },
  { value: 'left', label: 'Left-Arm', emoji: '👈' },
] as const;

// LEGACY: Keep for backward compatibility
export const BOWLER_TYPES = [
  { value: 'fast', label: 'Fast', emoji: '⚡' },
  { value: 'medium', label: 'Medium', emoji: '🎯' },
  { value: 'spin', label: 'Spin', emoji: '🌀' },
] as const;

// Camera Angles
export const CAMERA_ANGLES = [
  { value: 'front', label: 'Front View', emoji: '📹' },
  { value: 'side', label: 'Side View', emoji: '🎥' },
  { value: 'diagonal', label: 'Diagonal View', emoji: '📷' },
] as const;

// Parameter Icons Map
export const PARAMETER_ICONS: Record<string, string> = {
  // Action parameters
  front_arm_position: '💪',
  back_foot_contact: '👟',
  front_foot_contact: '🦶',
  release_point: '🎯',
  follow_through: '🏃',
  
  // Body alignment
  body_alignment: '🧍',
  shoulder_alignment: '💫',
  hip_rotation: '🔄',
  trunk_flexion: '🤸',
  
  // Technical
  arm_speed: '⚡',
  bowling_arm_angle: '📐',
  knee_flexion: '🦵',
  head_position: '👤',
  
  // Default
  default: '📊',
};

// Analysis Status
export const ANALYSIS_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Polling Configuration
export const POLLING_CONFIG = {
  INTERVAL: 2000, // 2 seconds
  MAX_ATTEMPTS: 120, // 4 minutes total
  TIMEOUT: 240000, // 4 minutes
};

// Score Thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  AVERAGE: 40,
  POOR: 0,
};

// Score Colors
export const SCORE_COLORS = {
  EXCELLENT: COLORS.success,
  GOOD: '#FBBF24',
  AVERAGE: '#F97316',
  POOR: COLORS.error,
};

// Processing Stages
export const PROCESSING_STAGES = [
  { key: 'uploading', label: 'Uploading Video', time: '0:05' },
  { key: 'validation', label: 'Validating Format & Quality', time: '0:03' },
  { key: 'pose_detection', label: 'Detecting Poses & Joints', time: '0:10' },
  { key: 'angle_detection', label: 'Measuring Biomechanical Angles', time: '0:08' },
  { key: 'analysis', label: 'Generating Report & Score', time: '0:05' },
  { key: 'complete', label: 'Analysis Complete', time: '0:00' },
];

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  DEVICE_ID: 'device_id',
  GUEST_TOKEN: 'guest_token',
  THEME: 'theme',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  UPLOAD: '/upload',
  PROCESSING: '/processing',
  RESULTS: '/results',
  MULTI_UPLOAD: '/multi-upload',
  MULTI_PROCESSING: '/multi-processing',
  MULTI_RESULTS: '/multi-results',
  PROFILE: '/profile',
} as const;

export default {
  API_CONFIG,
  COLORS,
  SPACING,
  BOWLER_TYPES,
  CAMERA_ANGLES,
  PARAMETER_ICONS,
  ANALYSIS_STATUS,
  POLLING_CONFIG,
  SCORE_THRESHOLDS,
  SCORE_COLORS,
  PROCESSING_STAGES,
  STORAGE_KEYS,
  ROUTES,
};
