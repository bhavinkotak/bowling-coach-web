import React, { useState } from 'react';
import { Info } from 'lucide-react';
import './MultiVideo.css';

export interface AngleSelection {
  parameterName: string;
  bestAngle: string;
  reason: string;
  confidence: number;
  allAngles?: Array<{ 
    angle: string; 
    confidence: number;
    available: boolean;
  }>;
}

interface AngleSelectionBannerProps {
  selections: AngleSelection[];
  showAlternates?: boolean;
  onToggleAlternates?: (show: boolean) => void;
  className?: string;
}

export const AngleSelectionBanner: React.FC<AngleSelectionBannerProps> = ({
  selections,
  showAlternates: controlledShowAlternates,
  onToggleAlternates,
  className = ''
}) => {
  const [internalShowAlternates, setInternalShowAlternates] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  const showAlternates = controlledShowAlternates ?? internalShowAlternates;

  const handleToggleAlternates = (checked: boolean) => {
    if (onToggleAlternates) {
      onToggleAlternates(checked);
    } else {
      setInternalShowAlternates(checked);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.85) return '#4ade80'; // green
    if (confidence >= 0.7) return '#facc15'; // yellow
    if (confidence >= 0.5) return '#fb923c'; // orange
    return '#f87171'; // red
  };

  const getAngleBadgeColor = (angle: string): string => {
    const colors: Record<string, string> = {
      'front': '#ef4444', // red
      'side': '#eab308', // yellow
      'back': '#22c55e', // green
      'diagonal': '#3b82f6', // blue
      'overhead': '#8b5cf6', // purple
    };
    return colors[angle.toLowerCase()] || '#667eea';
  };

  const getAngleIcon = (angle: string): string => {
    const icons: Record<string, string> = {
      'front': '🔴',
      'side': '🟡',
      'back': '🟢',
      'diagonal': '🔵',
      'overhead': '🟣',
    };
    return icons[angle.toLowerCase()] || '📹';
  };

  if (!selections || selections.length === 0) {
    return null;
  }

  return (
    <div className={`angle-banner ${className}`}>
      {/* Header */}
      <div className="banner-header">
        <h3>📊 Best Angles Selected</h3>
        <p>Our algorithm automatically selected the best camera angle for each parameter based on visibility & measurement accuracy.</p>
      </div>

      {/* Angle Selection Table */}
      <div className="angle-table">
        <div className="table-header">
          <div className="col-parameter">Parameter</div>
          <div className="col-angle">Best Angle</div>
          <div className="col-reason">Reason</div>
          <div className="col-confidence">Confidence</div>
        </div>

        <div className="table-body">
          {selections.map((selection, idx) => (
            <div key={idx} className="table-row">
              <div className="col-parameter" data-label="Parameter">
                {selection.parameterName}
              </div>

              <div className="col-angle" data-label="Best Angle">
                <div 
                  className="angle-badge"
                  style={{ 
                    background: getAngleBadgeColor(selection.bestAngle)
                  }}
                >
                  <span className="angle-icon">{getAngleIcon(selection.bestAngle)}</span>
                  <span className="angle-label">{selection.bestAngle.toUpperCase()}</span>
                </div>
              </div>

              <div className="col-reason" data-label="Reason">
                <span className="reason-text">{selection.reason}</span>
                <button
                  className="info-icon"
                  onMouseEnter={() => setHoveredInfo(`${idx}`)}
                  onMouseLeave={() => setHoveredInfo(null)}
                  onClick={() => setHoveredInfo(hoveredInfo === `${idx}` ? null : `${idx}`)}
                  title={selection.reason}
                  aria-label={`More info about ${selection.parameterName}`}
                >
                  <Info size={14} />
                </button>
                {hoveredInfo === `${idx}` && (
                  <div className="info-tooltip">
                    <div className="tooltip-arrow" />
                    <p className="tooltip-title">Why {selection.bestAngle}?</p>
                    <p className="tooltip-text">{selection.reason}</p>
                    {selection.allAngles && selection.allAngles.length > 0 && (
                      <>
                        <p className="tooltip-subtitle">All angles evaluated:</p>
                        <ul className="tooltip-list">
                          {selection.allAngles.map((angle, i) => (
                            <li key={i}>
                              {getAngleIcon(angle.angle)} {angle.angle}: {Math.round(angle.confidence * 100)}%
                              {angle.angle === selection.bestAngle && ' ⭐'}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="col-confidence" data-label="Confidence">
                <div className="confidence-container">
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ 
                        width: `${selection.confidence * 100}%`,
                        background: getConfidenceColor(selection.confidence)
                      }}
                    />
                  </div>
                  <span 
                    className="confidence-text"
                    style={{ color: getConfidenceColor(selection.confidence) }}
                  >
                    {Math.round(selection.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle for Alternates */}
      {selections.some(s => s.allAngles && s.allAngles.length > 1) && (
        <div className="toggle-section">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showAlternates}
              onChange={(e) => handleToggleAlternates(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-text">Show all angles for each parameter</span>
          </label>
        </div>
      )}

      {/* Alternate Angles Grid */}
      {showAlternates && (
        <div className="alternate-angles">
          <h4>Alternate Angles</h4>
          <div className="angles-grid">
            {selections.map((selection, idx) => (
              selection.allAngles && selection.allAngles.length > 1 && (
                <div key={idx} className="angle-group">
                  <h5>{selection.parameterName}</h5>
                  <div className="angle-options">
                    {selection.allAngles.map((angle, i) => (
                      <button
                        key={i}
                        className={`angle-btn ${angle.angle === selection.bestAngle ? 'best' : ''} ${!angle.available ? 'unavailable' : ''}`}
                        disabled={!angle.available}
                        title={angle.available ? `${angle.angle}: ${Math.round(angle.confidence * 100)}% confidence` : `${angle.angle} not available`}
                      >
                        <span className="angle-btn-icon">{getAngleIcon(angle.angle)}</span>
                        <span className="angle-btn-label">{angle.angle}</span>
                        {angle.angle === selection.bestAngle && (
                          <span className="best-label">★</span>
                        )}
                        {angle.available && (
                          <span className="angle-confidence-mini">
                            {Math.round(angle.confidence * 100)}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="banner-stats">
        <div className="stat-item">
          <span className="stat-label">Parameters Analyzed:</span>
          <span className="stat-value">{selections.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Average Confidence:</span>
          <span className="stat-value">
            {Math.round(
              selections.reduce((sum, s) => sum + s.confidence, 0) / selections.length * 100
            )}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default AngleSelectionBanner;
