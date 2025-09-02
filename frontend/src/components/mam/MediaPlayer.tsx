'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Download,
  Loader2,
  AlertCircle,
  Keyboard,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { useMediaPlayer } from '@/lib/player/use-media-player';
import { KEYBOARD_SHORTCUTS_HELP } from '@/lib/player/keyboard-shortcuts';
import { cn } from '@/lib/utils';

interface Annotation {
  id: string;
  time: number;
  text: string;
  author: string;
  createdAt: string;
}

interface MediaPlayerProps {
  src: string;
  type: 'video' | 'audio';
  title?: string;
  thumbnailsUrl?: string;
  annotations?: Annotation[];
  autoplay?: boolean;
  muted?: boolean;
  className?: string;
  onAnnotationAdd?: (time: number, text: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onError?: (error: string) => void;
}

export function MediaPlayer({ 
  src, 
  type, 
  title,
  thumbnailsUrl,
  annotations = [], 
  autoplay = false,
  muted = false,
  className,
  onAnnotationAdd: _onAnnotationAdd,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onError,
}: MediaPlayerProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<{ url: string; time: number } | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    mediaRef,
    containerRef,
    state,
    togglePlayPause,
    seek,
    seekBackward,
    seekForward,
    frameStepBackward,
    frameStepForward,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setPlaybackRate,
    setQuality,
    getThumbnail,
    formatTime,
    handleKeyDown,
  } = useMediaPlayer({
    src,
    type,
    autoplay,
    muted,
    thumbnailsUrl,
    onTimeUpdate,
    onDurationChange,
    onPlayStateChange,
    onError,
  });

  // Hide controls after inactivity in fullscreen
  useEffect(() => {
    if (state.isFullscreen) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setControlsVisible(true);
        controlsTimeoutRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      };

      const handleMouseMove = () => resetTimeout();
      const handleKeyPress = () => resetTimeout();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('keydown', handleKeyPress);
      resetTimeout();

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('keydown', handleKeyPress);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, [state.isFullscreen]);

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Progress bar scrubbing
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    setScrubbing(true);
    handleProgressMove(e);
  };

  const handleProgressMove = (e: React.MouseEvent) => {
    if (!progressRef.current || !state.duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * state.duration;
    
    setScrubTime(time);
    
    // Show thumbnail preview if available
    const thumbnail = getThumbnail(time);
    if (thumbnail) {
      setThumbnailPreview({ url: thumbnail.url, time });
    }

    if (scrubbing) {
      seek(time);
    }
  };

  const handleProgressMouseUp = () => {
    if (scrubbing) {
      seek(scrubTime);
      setScrubbing(false);
    }
    setThumbnailPreview(null);
  };

  // Volume control
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  // Quality selection
  const handleQualityChange = (value: string) => {
    const level = value === 'auto' ? -1 : parseInt(value);
    setQuality(level);
  };

  // Playback rate selection
  const handlePlaybackRateChange = (value: string) => {
    setPlaybackRate(parseFloat(value));
  };

  // Get current annotations
  const currentAnnotations = annotations.filter(
    a => Math.abs(a.time - state.currentTime) < 0.5
  );

  // Buffer segments for progress bar
  const getBufferedSegments = () => {
    if (!state.buffered || !state.duration) return [];
    
    const segments = [];
    for (let i = 0; i < state.buffered.length; i++) {
      segments.push({
        start: (state.buffered.start(i) / state.duration) * 100,
        width: ((state.buffered.end(i) - state.buffered.start(i)) / state.duration) * 100,
      });
    }
    return segments;
  };

  if (state.error) {
    return (
      <div className={cn("relative bg-black rounded-lg overflow-hidden flex items-center justify-center p-8", className)}>
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
          <p className="text-sm text-gray-400">{state.error}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className={cn(
          "relative bg-black rounded-lg overflow-hidden group",
          state.isFullscreen && "fixed inset-0 z-50 rounded-none",
          className
        )}
        onMouseMove={() => state.isFullscreen && setControlsVisible(true)}
      >
        {/* Media Element */}
        {type === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            className="w-full h-full object-contain"
            playsInline
          />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gradient-to-br from-purple-600 to-blue-600">
            <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} />
            <div className="text-white text-center">
              <Volume2 className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl font-semibold">{title || 'Audio Playing'}</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {state.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Annotations Overlay */}
        {currentAnnotations.length > 0 && (
          <div className="absolute top-4 right-4 bg-black/75 text-white p-4 rounded-lg max-w-sm">
            {currentAnnotations.map(annotation => (
              <div key={annotation.id} className="mb-2">
                <p className="text-sm">{annotation.text}</p>
                <p className="text-xs text-gray-400 mt-1">— {annotation.author}</p>
              </div>
            ))}
          </div>
        )}

        {/* Thumbnail Preview */}
        {thumbnailPreview && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black border border-gray-600 rounded p-2">
            <img 
              src={thumbnailPreview.url} 
              alt="Thumbnail preview"
              className="w-32 h-18 object-cover rounded mb-1"
            />
            <p className="text-white text-xs text-center">
              {formatTime(thumbnailPreview.time)}
            </p>
          </div>
        )}

        {/* Controls */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300",
            (!controlsVisible && state.isFullscreen) && "opacity-0 pointer-events-none"
          )}
        >
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              ref={progressRef}
              className="relative h-2 bg-white/20 rounded-full cursor-pointer"
              onMouseDown={handleProgressMouseDown}
              onMouseMove={scrubbing ? handleProgressMove : undefined}
              onMouseUp={handleProgressMouseUp}
              onMouseLeave={() => {
                if (!scrubbing) setThumbnailPreview(null);
              }}
            >
              {/* Buffer Progress */}
              {getBufferedSegments().map((segment, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full bg-white/40 rounded-full"
                  style={{
                    left: `${segment.start}%`,
                    width: `${segment.width}%`,
                  }}
                />
              ))}
              
              {/* Current Progress */}
              <div
                className="absolute top-0 h-full bg-blue-600 rounded-full"
                style={{
                  width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%`,
                }}
              />
              
              {/* Scrub Indicator */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"
                style={{
                  left: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%`,
                  marginLeft: '-8px',
                }}
              />
              
              {/* Annotation Markers */}
              {annotations.map(annotation => (
                <div
                  key={annotation.id}
                  className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full"
                  style={{
                    left: `${state.duration ? (annotation.time / state.duration) * 100 : 0}%`,
                  }}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs text-white/75 mt-1">
              <span>{formatTime(state.currentTime)}</span>
              <span>{formatTime(state.duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {state.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{state.isPlaying ? 'Pause (K)' : 'Play (K)'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Skip Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => seekBackward(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rewind 10s (J)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => seekForward(10)}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forward 10s (L)</p>
                </TooltipContent>
              </Tooltip>

              {/* Frame Step Controls */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={frameStepBackward}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Frame backward (,)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={frameStepForward}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Frame forward (.)</p>
                </TooltipContent>
              </Tooltip>

              {/* Volume Controls */}
              <div className="flex items-center gap-2 ml-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {state.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mute (M)</p>
                  </TooltipContent>
                </Tooltip>
                
                <Slider
                  value={[state.isMuted ? 0 : state.volume]}
                  max={1}
                  step={0.05}
                  onValueChange={handleVolumeChange}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <Select value={state.playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
                <SelectTrigger className="w-16 text-white border-white/20 bg-transparent hover:bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.25">0.25x</SelectItem>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>

              {/* Quality Selection (HLS only) */}
              {state.isHLS && state.qualities.length > 0 && (
                <Select 
                  value={state.currentQuality === -1 ? 'auto' : state.currentQuality.toString()} 
                  onValueChange={handleQualityChange}
                >
                  <SelectTrigger className="w-20 text-white border-white/20 bg-transparent hover:bg-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    {state.qualities.map((quality) => (
                      <SelectItem key={quality.level} value={quality.level.toString()}>
                        {quality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Keyboard Shortcuts Help */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                    className="text-white hover:bg-white/20"
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts</p>
                </TooltipContent>
              </Tooltip>

              {/* Settings */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>

              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download</p>
                </TooltipContent>
              </Tooltip>

              {/* Fullscreen (Video only) */}
              {type === 'video' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      {state.isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fullscreen (F)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help Overlay */}
        {showKeyboardHelp && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <div className="bg-black/90 text-white p-6 rounded-lg max-w-md">
              <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {KEYBOARD_SHORTCUTS_HELP.map(({ key, action }, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="font-mono bg-gray-800 px-2 py-1 rounded text-xs">{key}</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowKeyboardHelp(false)}
                className="mt-4 w-full"
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}