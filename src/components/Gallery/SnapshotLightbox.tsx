import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Download, Share2 } from 'lucide-react';
import type { Snapshot } from './SnapshotGallery';

interface SnapshotLightboxProps {
  snapshot: Snapshot | null;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (snapshot: Snapshot) => void;
  onDownload?: (snapshot: Snapshot) => void;
}

export const SnapshotLightbox: React.FC<SnapshotLightboxProps> = ({
  snapshot,
  isOpen,
  onClose,
  onShare,
  onDownload
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Touch gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !snapshot) return null;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Touch gesture handlers for mobile
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setTouchStart({ ...center, distance });
      setInitialZoom(zoom);
    } else if (e.touches.length === 1 && zoom > 1) {
      // Pan gesture
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / touchStart.distance;
      const newZoom = Math.min(Math.max(initialZoom * scale, 1), 3);
      setZoom(newZoom);
      
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Pan
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStart(null);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '0.0s';
    return `${seconds.toFixed(1)}s`;
  };

  const handleShare = () => {
    if (onShare && snapshot) {
      onShare(snapshot);
    } else if (navigator.share) {
      navigator.share({
        title: `${snapshot.parameterName} Analysis`,
        text: `Score: ${snapshot.score}/100 at ${formatTime(snapshot.timestamp)}`,
        url: snapshot.url
      }).catch((error) => console.log('Error sharing:', error));
    }
  };

  const handleDownload = () => {
    if (onDownload && snapshot) {
      onDownload(snapshot);
    } else {
      // Default download behavior
      const link = document.createElement('a');
      link.href = snapshot.url;
      link.download = `${snapshot.parameterName.replace(/\s+/g, '_')}_${snapshot.score}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div 
      className="lightbox-overlay"
      onClick={onClose}
    >
      {/* Header */}
      <div className="lightbox-header" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-title">
          <h3>{snapshot.parameterName}</h3>
          <span className="lightbox-score">{snapshot.score}/100</span>
        </div>
        
        <div className="lightbox-actions">
          <button
            className="lightbox-btn"
            onClick={handleShare}
            title="Share"
          >
            <Share2 size={20} />
          </button>
          <button
            className="lightbox-btn"
            onClick={handleDownload}
            title="Download"
          >
            <Download size={20} />
          </button>
          <button
            className="lightbox-btn"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={snapshot.url}
          alt={snapshot.parameterName}
          className="lightbox-image"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
        />
      </div>

      {/* Controls */}
      <div className="lightbox-controls" onClick={(e) => e.stopPropagation()}>
        <div className="zoom-controls">
          <button
            className="control-btn"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            title="Zoom Out (-)"
          >
            <ZoomOut size={20} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="control-btn"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            title="Zoom In (+)"
          >
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="lightbox-footer" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-metadata">
          <span className="metadata-item">
            At {formatTime(snapshot.timestamp)}
          </span>
          {snapshot.phase && (
            <>
              <span className="metadata-divider">•</span>
              <span className="metadata-item">{snapshot.phase} phase</span>
            </>
          )}
        </div>
        
        {snapshot.metrics && snapshot.metrics.length > 0 && (
          <div className="lightbox-metrics">
            {snapshot.metrics.map((metric, idx) => (
              <div key={idx} className="lightbox-metric">
                <span className="metric-label">{metric.label}:</span>
                <span className="metric-value">
                  {metric.value}{metric.unit || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SnapshotLightbox;
