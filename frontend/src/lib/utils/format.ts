export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatDuration(duration?: string | number): string {
  if (!duration) return '0:00';
  
  let seconds: number;
  
  if (typeof duration === 'string') {
    // Handle formats like "120s", "2:30", or raw numbers as strings
    if (duration.endsWith('s')) {
      seconds = parseInt(duration.slice(0, -1));
    } else if (duration.includes(':')) {
      const parts = duration.split(':').map(Number);
      if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else {
        seconds = parseInt(duration);
      }
    } else {
      seconds = parseInt(duration);
    }
  } else {
    seconds = duration;
  }

  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export function formatRelativeTime(date?: string | Date): string {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const targetDate = new Date(date);
  
  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }
  
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  } else {
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  }
}

export function formatDate(date?: string | Date): string {
  if (!date) return 'Unknown';
  
  const targetDate = new Date(date);
  
  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }
  
  return targetDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatPercentage(value?: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  
  return `${Math.round(value * 100)}%`;
}

export function formatResolution(dimensions?: { width: number; height: number }): string {
  if (!dimensions || !dimensions.width || !dimensions.height) {
    return 'Unknown';
  }
  
  return `${dimensions.width} × ${dimensions.height}`;
}

export function formatBitrate(bitrate?: number): string {
  if (!bitrate || bitrate === 0) return 'Unknown';
  
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  } else if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} Kbps`;
  } else {
    return `${bitrate} bps`;
  }
}