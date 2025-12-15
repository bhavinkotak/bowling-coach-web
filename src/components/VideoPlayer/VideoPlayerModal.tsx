import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Download, Share2, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';
import './VideoPlayer.css';

export interface VideoClip {
  id: string;
  url: string;
  snapshot?: string;
  duration: number;
  parameterName: string;
  score: number;
  phase?: string;
  metrics?: Array<{ label: string; value: string; unit?: string }>;
}

interface VideoPlayerModalProps {
  clip: VideoClip | null;
  onClose: () => void;
  isOpen: boolean;
  autoplay?: boolean;
  showMetrics?: boolean;
  alternateAngles?: Array<{ angle: string; url: string; snapshot?: string }>;
  onAngleChange?: (angle: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  clip,
  onClose,
  isOpen,
  autoplay = true,
  showMetrics: initialShowMetrics = true,
  alternateAngles,
  onAngleChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [loop, setLoop] = useState(true);
  const [showMetrics, setShowMetrics] = useState(initialShowMetrics);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && clip) {
      document.body.style.overflow = 'hidden';
      setIsPlaying(autoplay);
      setCurrentTime(0);
      setIsLoaded(false);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, clip, autoplay]);

  useEffect(() => {
    if (videoRef.current && isOpen && autoplay && isLoaded) {
      videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
    }
  }, [isOpen, autoplay, isLoaded]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(5);
          break;
        case 'm':
          handleMuteToggle();
          break;
        case 'f':
          handleFullscreenToggle();
          break;
        case 'l':
          setLoop(prev => !prev);
          break;
        case ',':
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - (1/30));
          }
          break;
        case '.':
          if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + (1/30));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, duration]);

  if (!isOpen || !clip) return null;

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoaded(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = newSpeed;
    setSpeed(newSpeed);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreenToggle = () => {
    const container = document.querySelector('.video-modal');
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = clip.url;
    link.download = `${clip.parameterName.replace(/\s+/g, '_')}_${clip.score}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${clip.parameterName} Analysis`,
        text: `Score: ${clip.score}/100`,
        url: clip.url
      }).catch((error) => console.log('Error sharing:', error));
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="video-header">
          <div className="title-section">
            <h2 className="video-title">{clip.parameterName}</h2>
            <span className="score-badge">{clip.score}/100</span>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={handleShare} title="Share">
              <Share2 size={18} />
            </button>
            <button className="header-btn" onClick={handleDownload} title="Download">
              <Download size={18} />
            </button>
            <button className="close-btn" onClick={onClose} title="Close (Esc)">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="video-player-container">
          <video
            ref={videoRef}
            src={clip.url}
            poster={clip.snapshot}
            loop={loop}
            muted={isMuted}
            className="video-player"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={handlePlayPause}
          />

          {/* Metrics Overlay */}
          {showMetrics && clip.metrics && clip.metrics.length > 0 && (
            <div className="metrics-overlay">
              {clip.metrics.map((metric, idx) => (
                <div key={idx} className="metric">
                  <span className="metric-label">{metric.label}:</span>
                  <span className="metric-value">
                    {metric.value}{metric.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Play Overlay */}
          {!isPlaying && isLoaded && (
            <button className="play-overlay" onClick={handlePlayPause}>
              <Play size={48} fill="white" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="video-controls">
          {/* Progress Bar */}
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="progress-bar"
              style={{
                background: `linear-gradient(to right, #667eea ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%)`
              }}
            />
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="controls-row">
            {/* Playback Controls */}
            <div className="control-group">
              <button className="control-btn" onClick={() => skipTime(-5)} title="Rewind 5s (←)">
                <ChevronLeft size={20} />
              </button>
              <button className="control-btn control-btn-large" onClick={handlePlayPause} title="Play/Pause (Space)">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button className="control-btn" onClick={() => skipTime(5)} title="Forward 5s (→)">
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Speed & Features */}
            <div className="control-group">
              <select 
                className="speed-select"
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                title="Playback Speed"
              >
                {speedOptions.map(s => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>

              <button
                className={`control-btn ${loop ? 'active' : ''}`}
                onClick={() => setLoop(!loop)}
                title="Loop (L)"
              >
                <RotateCcw size={20} />
              </button>

              <button
                className="control-btn"
                onClick={() => setShowMetrics(!showMetrics)}
                title="Toggle Metrics"
              >
                <span className="metrics-icon">📊</span>
              </button>
            </div>

            {/* Volume & Fullscreen */}
            <div className="control-group">
              <button className="control-btn" onClick={handleMuteToggle} title="Mute (M)">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button className="control-btn" onClick={handleFullscreenToggle} title="Fullscreen (F)">
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="video-metadata">
          {clip.phase && (
            <div className="meta-item">
              <span className="meta-label">Phase:</span>
              <span className="meta-value">{clip.phase}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">Duration:</span>
            <span className="meta-value">{formatTime(clip.duration)}</span>
          </div>
        </div>

        {/* Alternate Angles (if provided) */}
        {alternateAngles && alternateAngles.length > 0 && (
          <div className="alternate-angles">
            <h4>Alternate Angles</h4>
            <div className="angles-list">
              {alternateAngles.map((alt) => (
                <button
                  key={alt.angle}
                  className="angle-btn"
                  onClick={() => onAngleChange?.(alt.angle)}
                >
                  <img src={alt.snapshot || clip.snapshot} alt={alt.angle} />
                  <span>{alt.angle}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayerModal;
