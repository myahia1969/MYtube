import { useEffect } from 'react';

interface UseVideoKeyboardShortcutsProps {
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  active?: boolean;
}

export function useVideoKeyboardShortcuts({
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onSeekForward,
  onSeekBackward,
  onVolumeUp,
  onVolumeDown,
  active = true,
}: UseVideoKeyboardShortcutsProps) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in comments, search, or other inputs
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName;
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        ) {
          return;
        }
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'KeyM':
          e.preventDefault();
          onToggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          onToggleFullscreen();
          break;
        case 'ArrowRight':
        case 'KeyL':
          if (onSeekForward) {
            e.preventDefault();
            onSeekForward();
          }
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          if (onSeekBackward) {
            e.preventDefault();
            onSeekBackward();
          }
          break;
        case 'ArrowUp':
          if (onVolumeUp) {
            e.preventDefault();
            onVolumeUp();
          }
          break;
        case 'ArrowDown':
          if (onVolumeDown) {
            e.preventDefault();
            onVolumeDown();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    onTogglePlay,
    onToggleMute,
    onToggleFullscreen,
    onSeekForward,
    onSeekBackward,
    onVolumeUp,
    onVolumeDown,
    active,
  ]);
}
