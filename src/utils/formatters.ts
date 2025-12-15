/**
 * Format parameter name from snake_case to Title Case
 */
export function formatParameterName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get emoji icon for parameter based on name
 */
export function getParameterIcon(name: string): string {
  const lower = name.toLowerCase();
  
  if (lower.includes('run') || lower.includes('approach')) return '🏃';
  if (lower.includes('jump') || lower.includes('gather')) return '⬆️';
  if (lower.includes('foot') || lower.includes('contact')) return '🦶';
  if (lower.includes('leg') || lower.includes('brace')) return '💪';
  if (lower.includes('arm') || lower.includes('delay')) return '🎯';
  if (lower.includes('hip') || lower.includes('shoulder')) return '🤸';
  if (lower.includes('chest') || lower.includes('drive')) return '🚀';
  if (lower.includes('head') || lower.includes('position')) return '👤';
  
  return '🎳'; // Default cricket icon
}

/**
 * Get Tailwind color class for score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

/**
 * Get background color class for score
 */
export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format upload speed in bytes/second to human-readable format
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 KB/s';
  
  const mbps = bytesPerSecond / (1024 * 1024);
  
  if (mbps >= 1) {
    return `${mbps.toFixed(2)} MB/s`;
  }
  
  const kbps = bytesPerSecond / 1024;
  return `${kbps.toFixed(2)} KB/s`;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
}
