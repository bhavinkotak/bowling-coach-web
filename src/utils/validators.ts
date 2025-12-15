import type { VideoValidationResult } from '../types';

/**
 * Maximum file size: 500MB
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * Allowed video formats
 */
const ALLOWED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi'];

/**
 * Minimum and maximum video duration in seconds
 */
const MIN_DURATION = 3;
const MAX_DURATION = 120;

/**
 * Validate file size
 */
export function validateFileSize(file: File): VideoValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (500MB). Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file format
 */
export function validateFileFormat(file: File): VideoValidationResult {
  const isValidMimeType = ALLOWED_FORMATS.includes(file.type);
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  
  if (!isValidMimeType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload MP4, MOV, or AVI files only.',
    };
  }
  
  return { valid: true };
}

/**
 * Validate video duration
 * Returns a promise since we need to load video metadata
 */
export function validateVideoDuration(file: File): Promise<VideoValidationResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);
      
      if (duration < MIN_DURATION) {
        resolve({
          valid: false,
          error: `Video too short. Minimum duration is ${MIN_DURATION} seconds. Your video is ${duration} seconds.`,
        });
      } else if (duration > MAX_DURATION) {
        resolve({
          valid: false,
          error: `Video too long. Maximum duration is ${MAX_DURATION} seconds (2 minutes). Your video is ${duration} seconds.`,
        });
      } else {
        resolve({ valid: true });
      }
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      resolve({
        valid: false,
        error: 'Could not read video file. Please ensure it is a valid video.',
      });
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get video duration without validation
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Could not read video duration'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Validate email format
 */
export function validateEmail(email: string): VideoValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
    };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): VideoValidationResult {
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number',
    };
  }
  
  return { valid: true };
}

/**
 * Validate complete video file (size + format + duration)
 */
export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  // Check file size
  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;
  
  // Check file format
  const formatResult = validateFileFormat(file);
  if (!formatResult.valid) return formatResult;
  
  // Check duration
  const durationResult = await validateVideoDuration(file);
  if (!durationResult.valid) return durationResult;
  
  return { valid: true };
}
