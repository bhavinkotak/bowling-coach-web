import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './KeyboardShortcuts.css';

interface Shortcut {
  key: string;
  description: string;
  context?: string;
}

interface KeyboardShortcutsGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Detect if running on mobile device
const isMobile = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

interface ShortcutItem extends Shortcut {
  touchAlternative?: string;
}

const shortcuts: ShortcutItem[] = [
  // Gallery shortcuts
  { key: '←', description: 'Previous snapshot', context: 'Gallery', touchAlternative: 'Tap left arrow button' },
  { key: '→', description: 'Next snapshot', context: 'Gallery', touchAlternative: 'Tap right arrow button' },
  { key: 'Enter', description: 'Open snapshot in lightbox', context: 'Gallery', touchAlternative: 'Tap snapshot image' },
  
  // Lightbox shortcuts
  { key: 'Esc', description: 'Close lightbox/modal', context: 'Lightbox', touchAlternative: 'Tap X button or outside' },
  { key: '+', description: 'Zoom in', context: 'Lightbox', touchAlternative: 'Pinch out (2 fingers)' },
  { key: '-', description: 'Zoom out', context: 'Lightbox', touchAlternative: 'Pinch in (2 fingers)' },
  { key: '0', description: 'Reset zoom', context: 'Lightbox', touchAlternative: 'Double tap image' },
  
  // Video Player shortcuts
  { key: 'Space', description: 'Play/Pause video', context: 'Video Player', touchAlternative: 'Tap play/pause button' },
  { key: 'K', description: 'Play/Pause video (alt)', context: 'Video Player', touchAlternative: 'Tap play/pause button' },
  { key: '←', description: 'Rewind 5 seconds', context: 'Video Player', touchAlternative: 'Tap rewind button' },
  { key: '→', description: 'Forward 5 seconds', context: 'Video Player', touchAlternative: 'Tap forward button' },
  { key: ',', description: 'Previous frame (1/30s)', context: 'Video Player', touchAlternative: 'Tap previous frame button' },
  { key: '.', description: 'Next frame (1/30s)', context: 'Video Player', touchAlternative: 'Tap next frame button' },
  { key: 'M', description: 'Mute/Unmute', context: 'Video Player', touchAlternative: 'Tap mute button' },
  { key: 'F', description: 'Toggle fullscreen', context: 'Video Player', touchAlternative: 'Tap fullscreen button' },
  { key: 'L', description: 'Toggle loop', context: 'Video Player', touchAlternative: 'Tap loop button' },
  { key: '0-9', description: 'Jump to 0%-90% of video', context: 'Video Player', touchAlternative: 'Drag progress bar' },
  
  // Global shortcuts
  { key: '?', description: 'Show/hide this guide', context: 'Global', touchAlternative: 'Long press help icon' },
];

export const KeyboardShortcutsGuide: React.FC<KeyboardShortcutsGuideProps> = ({ 
  isOpen: controlledIsOpen,
  onClose 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  const isOpen = controlledIsOpen ?? internalIsOpen;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle guide with '?' or '/' key
      if (e.key === '?' || e.key === '/') {
        e.preventDefault();
        if (onClose) {
          onClose();
        } else {
          setInternalIsOpen(prev => !prev);
        }
      }
      
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        if (onClose) {
          onClose();
        } else {
          setInternalIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const isMobileDevice = isMobile();

  // Group shortcuts by context
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const context = shortcut.context || 'Other';
    if (!acc[context]) {
      acc[context] = [];
    }
    acc[context].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <div className="shortcuts-overlay" onClick={handleClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shortcuts-header">
          <h2>{isMobileDevice ? '👆 Touch Controls' : '⌨️ Keyboard Shortcuts'}</h2>
          <button 
            onClick={handleClose}
            className="close-btn"
            aria-label="Close shortcuts guide"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="shortcuts-content">
          {Object.entries(groupedShortcuts).map(([context, contextShortcuts]) => (
            <div key={context} className="shortcuts-section">
              <h3 className="section-title">{context}</h3>
              <div className="shortcuts-list">
                {contextShortcuts.map((shortcut, index) => (
                  <div key={index} className="shortcut-item">
                    {!isMobileDevice ? (
                      <>
                        <kbd className="shortcut-key">{shortcut.key}</kbd>
                        <span className="shortcut-description">{shortcut.description}</span>
                      </>
                    ) : (
                      <>
                        <span className="touch-gesture">👆</span>
                        <span className="shortcut-description">
                          {shortcut.touchAlternative || shortcut.description}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shortcuts-footer">
          <p className="footer-hint">
            {!isMobileDevice ? (
              <>Press <kbd>?</kbd> anytime to toggle this guide</>
            ) : (
              <>Tap help icon to show/hide this guide</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide;
