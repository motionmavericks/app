/**
 * Keyboard shortcuts for media player
 * 
 * J/K/L: Rewind/Pause/Forward
 * Space: Play/Pause
 * Left/Right arrows: Seek backward/forward
 * Up/Down arrows: Volume control
 * M: Mute/Unmute
 * F: Fullscreen toggle
 * Numbers 1-9: Seek to percentage
 * ,/.: Frame step backward/forward
 */

export interface KeyboardShortcutHandlers {
  togglePlayPause: () => void;
  seekBackward: (seconds?: number) => void;
  seekForward: (seconds?: number) => void;
  frameStepBackward: () => void;
  frameStepForward: () => void;
  volumeUp: () => void;
  volumeDown: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  seekToPercentage: (percentage: number) => void;
  changePlaybackRate: (direction: 'up' | 'down') => void;
}

export function useKeyboardShortcuts(
  handlers: KeyboardShortcutHandlers,
  enabled = true
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't handle shortcuts if user is typing in an input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const isShiftPressed = event.shiftKey;
    const isCtrlPressed = event.ctrlKey || event.metaKey;

    switch (key) {
      // J/K/L controls
      case 'j':
        event.preventDefault();
        handlers.seekBackward(10);
        break;
      case 'k':
        event.preventDefault();
        handlers.togglePlayPause();
        break;
      case 'l':
        event.preventDefault();
        handlers.seekForward(10);
        break;

      // Space for play/pause
      case ' ':
        event.preventDefault();
        handlers.togglePlayPause();
        break;

      // Arrow keys
      case 'arrowleft':
        event.preventDefault();
        if (isShiftPressed) {
          handlers.frameStepBackward();
        } else {
          handlers.seekBackward(isCtrlPressed ? 30 : 5);
        }
        break;
      case 'arrowright':
        event.preventDefault();
        if (isShiftPressed) {
          handlers.frameStepForward();
        } else {
          handlers.seekForward(isCtrlPressed ? 30 : 5);
        }
        break;
      case 'arrowup':
        event.preventDefault();
        handlers.volumeUp();
        break;
      case 'arrowdown':
        event.preventDefault();
        handlers.volumeDown();
        break;

      // Mute/Fullscreen
      case 'm':
        event.preventDefault();
        handlers.toggleMute();
        break;
      case 'f':
        event.preventDefault();
        handlers.toggleFullscreen();
        break;

      // Frame stepping
      case ',':
        event.preventDefault();
        handlers.frameStepBackward();
        break;
      case '.':
        event.preventDefault();
        handlers.frameStepForward();
        break;

      // Playback rate
      case '<':
        event.preventDefault();
        handlers.changePlaybackRate('down');
        break;
      case '>':
        event.preventDefault();
        handlers.changePlaybackRate('up');
        break;

      // Number keys for seeking to percentage
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        const percentage = parseInt(key) * 10; // 1 = 10%, 2 = 20%, etc.
        handlers.seekToPercentage(percentage);
        break;
      case '0':
        event.preventDefault();
        handlers.seekToPercentage(0);
        break;

      default:
        break;
    }
  };

  return { handleKeyDown };
}

export const KEYBOARD_SHORTCUTS_HELP = [
  { key: 'Space / K', action: 'Play/Pause' },
  { key: 'J', action: 'Rewind 10s' },
  { key: 'L', action: 'Forward 10s' },
  { key: '← →', action: 'Seek 5s' },
  { key: 'Ctrl + ← →', action: 'Seek 30s' },
  { key: 'Shift + ← →', action: 'Frame step' },
  { key: '↑ ↓', action: 'Volume' },
  { key: 'M', action: 'Mute/Unmute' },
  { key: 'F', action: 'Fullscreen' },
  { key: '1-9', action: 'Jump to %' },
  { key: ', .', action: 'Frame step' },
  { key: '< >', action: 'Playback rate' },
];