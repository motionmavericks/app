'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { useKeyboardShortcuts, KeyboardShortcutHandlers } from './keyboard-shortcuts';

export interface QualityLevel {
  height: number;
  width: number;
  bitrate: number;
  name: string;
  level: number;
}

export interface MediaPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  buffered: TimeRanges | null;
  isLoading: boolean;
  error: string | null;
  qualities: QualityLevel[];
  currentQuality: number; // -1 for auto
  isHLS: boolean;
}

export interface ThumbnailPreview {
  time: number;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseMediaPlayerOptions {
  src: string;
  type: 'video' | 'audio';
  autoplay?: boolean;
  muted?: boolean;
  thumbnailsUrl?: string; // URL for thumbnail sprite/VTT file
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onError?: (error: string) => void;
}

export function useMediaPlayer({
  src,
  type,
  autoplay = false,
  muted = false,
  thumbnailsUrl,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onError,
}: UseMediaPlayerOptions) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [thumbnailData, setThumbnailData] = useState<ThumbnailPreview[]>([]);
  
  const [state, setState] = useState<MediaPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: muted ? 0 : 1,
    isMuted: muted,
    isFullscreen: false,
    playbackRate: 1,
    buffered: null,
    isLoading: true,
    error: null,
    qualities: [],
    currentQuality: -1, // Auto quality
    isHLS: false,
  });

  // Initialize HLS or regular video
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    // Set initial properties
    media.autoplay = autoplay;
    media.muted = muted;

    const isHLSSupported = Hls.isSupported();
    const isHLSUrl = src.includes('.m3u8') || src.includes('hls');

    if (isHLSUrl && isHLSSupported && type === 'video') {
      // Initialize HLS
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(media as HTMLVideoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          name: `${level.height}p`,
          level: index,
        }));

        setState(prev => ({
          ...prev,
          qualities: levels,
          isHLS: true,
          isLoading: false,
        }));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          const errorMessage = `HLS Error: ${data.type} - ${data.details}`;
          setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
          onError?.(errorMessage);
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (src.includes('.mp4') || src.includes('.webm') || !isHLSUrl) {
      // Regular video/audio
      media.src = src;
      setState(prev => ({ ...prev, isHLS: false, isLoading: false }));
    } else {
      const errorMessage = 'Unsupported media format';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      onError?.(errorMessage);
    }
  }, [src, type, autoplay, muted, onError]);

  // Load thumbnail data if provided
  useEffect(() => {
    if (!thumbnailsUrl) return;

    // For now, this is a placeholder - in a real implementation,
    // you'd parse WebVTT thumbnail files or sprite sheets
    // Example format: https://example.com/thumbnails.vtt
    const loadThumbnails = async () => {
      try {
        // This would parse a WebVTT file with thumbnail cues
        // For demo purposes, we'll create some mock data
        const mockThumbnails: ThumbnailPreview[] = [];
        setThumbnailData(mockThumbnails);
      } catch (error) {
        console.warn('Failed to load thumbnails:', error);
      }
    };

    loadThumbnails();
  }, [thumbnailsUrl]);

  // Media event listeners
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      const currentTime = media.currentTime;
      setState(prev => ({ ...prev, currentTime }));
      onTimeUpdate?.(currentTime);
    };

    const handleDurationChange = () => {
      const duration = media.duration;
      setState(prev => ({ ...prev, duration }));
      onDurationChange?.(duration);
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: media.duration,
        isLoading: false,
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onPlayStateChange?.(false);
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      onPlayStateChange?.(false);
    };

    const handleProgress = () => {
      setState(prev => ({ ...prev, buffered: media.buffered }));
    };

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: media.volume,
        isMuted: media.muted,
      }));
    };

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('ended', handleEnded);
    media.addEventListener('progress', handleProgress);
    media.addEventListener('volumechange', handleVolumeChange);
    media.addEventListener('loadstart', handleLoadStart);
    media.addEventListener('canplay', handleCanPlay);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('ended', handleEnded);
      media.removeEventListener('progress', handleProgress);
      media.removeEventListener('volumechange', handleVolumeChange);
      media.removeEventListener('loadstart', handleLoadStart);
      media.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onDurationChange, onPlayStateChange]);

  // Control functions
  const togglePlayPause = useCallback(async () => {
    const media = mediaRef.current;
    if (!media) return;

    try {
      if (state.isPlaying) {
        media.pause();
      } else {
        await media.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  }, [state.isPlaying]);

  const seek = useCallback((time: number) => {
    const media = mediaRef.current;
    if (!media || !state.duration) return;

    const clampedTime = Math.max(0, Math.min(time, state.duration));
    media.currentTime = clampedTime;
  }, [state.duration]);

  const seekBackward = useCallback((seconds = 10) => {
    seek(state.currentTime - seconds);
  }, [seek, state.currentTime]);

  const seekForward = useCallback((seconds = 10) => {
    seek(state.currentTime + seconds);
  }, [seek, state.currentTime]);

  const frameStepBackward = useCallback(() => {
    // Assume 30fps for frame stepping
    seek(state.currentTime - (1/30));
  }, [seek, state.currentTime]);

  const frameStepForward = useCallback(() => {
    // Assume 30fps for frame stepping
    seek(state.currentTime + (1/30));
  }, [seek, state.currentTime]);

  const setVolume = useCallback((volume: number) => {
    const media = mediaRef.current;
    if (!media) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    media.volume = clampedVolume;
    media.muted = clampedVolume === 0;
  }, []);

  const volumeUp = useCallback(() => {
    setVolume(state.volume + 0.1);
  }, [setVolume, state.volume]);

  const volumeDown = useCallback(() => {
    setVolume(state.volume - 0.1);
  }, [setVolume, state.volume]);

  const toggleMute = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = !media.muted;
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!state.isFullscreen) {
        await containerRef.current.requestFullscreen();
        setState(prev => ({ ...prev, isFullscreen: true }));
      } else {
        await document.exitFullscreen();
        setState(prev => ({ ...prev, isFullscreen: false }));
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [state.isFullscreen]);

  const seekToPercentage = useCallback((percentage: number) => {
    if (!state.duration) return;
    const time = (percentage / 100) * state.duration;
    seek(time);
  }, [seek, state.duration]);

  const setPlaybackRate = useCallback((rate: number) => {
    const media = mediaRef.current;
    if (!media) return;

    const clampedRate = Math.max(0.25, Math.min(4, rate));
    media.playbackRate = clampedRate;
    setState(prev => ({ ...prev, playbackRate: clampedRate }));
  }, []);

  const changePlaybackRate = useCallback((direction: 'up' | 'down') => {
    const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(state.playbackRate);
    const newIndex = direction === 'up' 
      ? Math.min(rates.length - 1, currentIndex + 1)
      : Math.max(0, currentIndex - 1);
    setPlaybackRate(rates[newIndex]);
  }, [setPlaybackRate, state.playbackRate]);

  const setQuality = useCallback((qualityLevel: number) => {
    if (!hlsRef.current) return;

    hlsRef.current.currentLevel = qualityLevel; // -1 for auto
    setState(prev => ({ ...prev, currentQuality: qualityLevel }));
  }, []);

  const getThumbnail = useCallback((time: number): ThumbnailPreview | null => {
    if (!thumbnailData.length) return null;
    
    // Find closest thumbnail
    let closest = thumbnailData[0];
    let minDiff = Math.abs(time - closest.time);
    
    for (const thumbnail of thumbnailData) {
      const diff = Math.abs(time - thumbnail.time);
      if (diff < minDiff) {
        minDiff = diff;
        closest = thumbnail;
      }
    }
    
    return closest;
  }, [thumbnailData]);

  // Keyboard shortcuts
  const keyboardHandlers: KeyboardShortcutHandlers = {
    togglePlayPause,
    seekBackward,
    seekForward,
    frameStepBackward,
    frameStepForward,
    volumeUp,
    volumeDown,
    toggleMute,
    toggleFullscreen,
    seekToPercentage,
    changePlaybackRate,
  };

  const { handleKeyDown } = useKeyboardShortcuts(keyboardHandlers, true);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setState(prev => ({ ...prev, isFullscreen }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return {
    // Refs
    mediaRef,
    containerRef,
    
    // State
    state,
    
    // Controls
    togglePlayPause,
    seek,
    seekBackward,
    seekForward,
    frameStepBackward,
    frameStepForward,
    setVolume,
    volumeUp,
    volumeDown,
    toggleMute,
    toggleFullscreen,
    seekToPercentage,
    setPlaybackRate,
    changePlaybackRate,
    setQuality,
    
    // Helpers
    getThumbnail,
    formatTime: (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return `${m}:${s.toString().padStart(2, '0')}`;
    },
    
    // Keyboard
    handleKeyDown,
  };
}