import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import './Gallery.css';

export interface Snapshot {
  id: string;
  url: string;
  timestamp: number;
  parameterName: string;
  score: number;
  metrics?: Array<{ label: string; value: string; unit?: string }>;
  phase?: string;
}

interface SnapshotGalleryProps {
  snapshots: Snapshot[];
  onClipOpen?: (snapshot: Snapshot) => void;
  onSnapshotClick?: (snapshot: Snapshot) => void;
  className?: string;
}

export const SnapshotGallery: React.FC<SnapshotGalleryProps> = ({ 
  snapshots, 
  onClipOpen,
  onSnapshotClick,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="snapshot-gallery-empty">
        <p className="text-slate-500 text-center py-8">No snapshots available</p>
      </div>
    );
  }

  const current = snapshots[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0.0s';
    return `${seconds.toFixed(1)}s`;
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`snapshot-gallery ${className}`}>
      {/* Main Snapshot Display */}
      <div className="gallery-container">
        <div className="snapshot-card">
          {/* Image Wrapper */}
          <div 
            className="snapshot-image-wrapper"
            onClick={() => onSnapshotClick?.(current)}
          >
            <img 
              src={current.url} 
              alt={`${current.parameterName} at ${formatTime(current.timestamp)}`}
              className="snapshot-image"
              loading="lazy"
            />
            
            {/* Overlay Badge (Top Right) */}
            <div className="snapshot-badge">
              <span className="param-name">{current.parameterName}</span>
              <div className={`score-ring ${getScoreBgColor(current.score)}`}>
                <span className="score-value">{current.score}</span>
                <span className="score-max">/100</span>
              </div>
            </div>

            {/* Metrics Overlay (Bottom Left) */}
            {current.metrics && current.metrics.length > 0 && (
              <div className="metrics-overlay">
                {current.metrics.slice(0, 3).map((metric, idx) => (
                  <div key={idx} className="metric-item">
                    <span className="metric-label">{metric.label}:</span>
                    <span className="metric-value">
                      {metric.value}{metric.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Snapshot Info */}
          <div className="snapshot-info">
            <p className="timestamp">
              At {formatTime(current.timestamp)}
              {current.phase && ` • ${current.phase} phase`}
            </p>
            
            <div className="action-buttons">
              <button 
                className="btn-primary"
                onClick={() => onClipOpen?.(current)}
              >
                <Play size={16} />
                <span>Watch Clip</span>
              </button>
              <button 
                className="btn-secondary"
                onClick={() => onSnapshotClick?.(current)}
              >
                Expand
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {snapshots.length > 1 && (
        <div className="gallery-nav">
          <button 
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="nav-btn"
            aria-label="Previous snapshot"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="indicator-dots">
            {snapshots.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`dot ${i === currentIndex ? 'active' : ''}`}
                aria-label={`Go to snapshot ${i + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            disabled={currentIndex === snapshots.length - 1}
            className="nav-btn"
            aria-label="Next snapshot"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      {/* Counter */}
      <div className="gallery-counter">
        <span className="text-sm text-slate-600">
          {currentIndex + 1} / {snapshots.length}
        </span>
      </div>
    </div>
  );
};

export default SnapshotGallery;
