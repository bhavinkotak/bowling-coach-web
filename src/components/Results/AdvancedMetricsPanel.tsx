import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Gauge, 
  Shield, 
  Target, 
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  Info
} from 'lucide-react';

interface AdvancedMetrics {
  arm_circumduction_speed?: {
    peak_angular_velocity: number;
    average_angular_velocity: number;
    classification: string;
    adjusted_for_slow_motion?: boolean;
    camera_angle_quality?: string;
  };
  bowling_legality?: {
    is_legal: boolean | null;
    extension_degrees: number | null;
    classification: string;
    feedback?: string;
    icc_limit: number;
    confidence: string;
    camera_angle_quality?: string;
    angle_at_arm_horizontal?: number | null;
    angle_at_release?: number | null;
    _debug_frames?: {
      arm_horizontal_frame: number;
      release_frame: number;
      back_foot_frame: number;
    };
  };
  shoulder_angle_at_release?: {
    shoulder_angle: number;
    classification?: string;
    performance_indicator: boolean;
    interpretation?: string;
    camera_angle_quality?: string;
  };
  wrist_whip_velocity?: {
    peak_velocity: number;
    average_velocity: number;
    classification: string;
    interpretation?: string;
    camera_angle_quality?: string;
  };
  error?: string;
}

interface QualityGates {
  bowling_action_legal?: boolean;
  elbow_extension_warning?: boolean;
  arm_speed_adequate?: boolean;
  wrist_whip_effective?: boolean;
}

interface AdvancedMetricsPanelProps {
  advancedMetrics?: AdvancedMetrics | null;
  qualityGates?: QualityGates | null;
  isEnabled?: boolean;
}

const classificationColors: Record<string, string> = {
  elite: 'text-purple-400',
  professional: 'text-blue-400',
  excellent: 'text-green-400',
  optimal: 'text-green-400',
  good: 'text-green-500',
  acceptable: 'text-yellow-400',
  average: 'text-yellow-500',
  borderline: 'text-orange-400',
  developing: 'text-orange-500',
  needs_work: 'text-red-400',
  illegal: 'text-red-500',
  unknown: 'text-slate-400',
};

const classificationBadgeColors: Record<string, string> = {
  elite: 'bg-purple-500/20 border-purple-500',
  professional: 'bg-blue-500/20 border-blue-500',
  excellent: 'bg-green-500/20 border-green-500',
  optimal: 'bg-green-500/20 border-green-500',
  good: 'bg-green-500/20 border-green-500',
  acceptable: 'bg-yellow-500/20 border-yellow-500',
  average: 'bg-yellow-500/20 border-yellow-500',
  borderline: 'bg-orange-500/20 border-orange-500',
  developing: 'bg-orange-500/20 border-orange-500',
  needs_work: 'bg-red-500/20 border-red-500',
  illegal: 'bg-red-500/20 border-red-500',
};

export default function AdvancedMetricsPanel({ 
  advancedMetrics, 
  qualityGates,
  isEnabled = true 
}: AdvancedMetricsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isEnabled) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-400">Advanced Metrics</h3>
          </div>
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
            Premium Feature
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Upgrade to access advanced biomechanical analysis including arm speed, bowling legality checks, and more.
        </p>
      </div>
    );
  }

  if (!advancedMetrics || advancedMetrics.error) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-semibold text-slate-400">Advanced Metrics</h3>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          {advancedMetrics?.error || 'Advanced metrics not available for this analysis.'}
        </p>
      </div>
    );
  }

  const { 
    arm_circumduction_speed, 
    bowling_legality, 
    shoulder_angle_at_release,
    wrist_whip_velocity 
  } = advancedMetrics;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Advanced Metrics</h3>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
            Premium
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick status indicators */}
          {qualityGates && (
            <div className="flex items-center gap-2">
              {qualityGates.bowling_action_legal !== undefined && (
                <div className={`flex items-center gap-1 text-xs ${qualityGates.bowling_action_legal ? 'text-green-400' : 'text-red-400'}`}>
                  {qualityGates.bowling_action_legal ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Legal</span>
                </div>
              )}
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Quality Gates Summary */}
          {qualityGates && (
            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Quality Gates
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QualityGateIndicator
                  label="Bowling Legal"
                  passed={qualityGates.bowling_action_legal}
                  warning={qualityGates.elbow_extension_warning}
                />
                <QualityGateIndicator
                  label="Arm Speed"
                  passed={qualityGates.arm_speed_adequate}
                />
                <QualityGateIndicator
                  label="Wrist Whip"
                  passed={qualityGates.wrist_whip_effective}
                />
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Arm Circumduction Speed */}
            {arm_circumduction_speed && (
              <MetricCard
                icon={<Zap className="w-5 h-5 text-yellow-400" />}
                title="Arm Speed"
                subtitle="Circumduction Angular Velocity"
                mainValue={`${arm_circumduction_speed.peak_angular_velocity.toFixed(0)}°/s`}
                mainLabel="Peak Velocity"
                secondaryValue={`${arm_circumduction_speed.average_angular_velocity.toFixed(0)}°/s avg`}
                classification={arm_circumduction_speed.classification}
                note={arm_circumduction_speed.adjusted_for_slow_motion ? 'Adjusted for slow motion' : undefined}
                cameraAngleQuality={arm_circumduction_speed.camera_angle_quality}
              />
            )}

            {/* Bowling Legality */}
            {bowling_legality && (
              <div className="space-y-2">
                <MetricCard
                  icon={
                    bowling_legality.is_legal === true ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : bowling_legality.is_legal === false ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )
                  }
                  title="Bowling Legality"
                  subtitle="ICC 15° Elbow Extension Rule"
                  mainValue={
                    bowling_legality.extension_degrees !== null 
                      ? `${bowling_legality.extension_degrees}°` 
                      : 'N/A'
                  }
                  mainLabel={`Extension (limit: ${bowling_legality.icc_limit}°)`}
                  secondaryValue={bowling_legality.is_legal ? '✅ Legal' : bowling_legality.is_legal === false ? '❌ Illegal' : 'Unknown'}
                  classification={bowling_legality.classification}
                  note={bowling_legality.feedback}
                  confidence={bowling_legality.confidence}
                  cameraAngleQuality={bowling_legality.camera_angle_quality}
                />
                {/* Debug Info: Angle measurements */}
                {(bowling_legality.angle_at_arm_horizontal !== undefined || bowling_legality._debug_frames) && (
                  <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-cyan-400">Debug: Angle Measurements</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {bowling_legality.angle_at_arm_horizontal !== null && bowling_legality.angle_at_arm_horizontal !== undefined && (
                        <div className="bg-slate-800/50 rounded p-2">
                          <div className="text-slate-400">@ Arm Horizontal</div>
                          <div className="text-white font-mono text-lg">{bowling_legality.angle_at_arm_horizontal.toFixed(1)}°</div>
                          {bowling_legality._debug_frames && (
                            <div className="text-slate-500 text-[10px]">Frame #{bowling_legality._debug_frames.arm_horizontal_frame}</div>
                          )}
                        </div>
                      )}
                      {bowling_legality.angle_at_release !== null && bowling_legality.angle_at_release !== undefined && (
                        <div className="bg-slate-800/50 rounded p-2">
                          <div className="text-slate-400">@ Ball Release</div>
                          <div className="text-white font-mono text-lg">{bowling_legality.angle_at_release.toFixed(1)}°</div>
                          {bowling_legality._debug_frames && (
                            <div className="text-slate-500 text-[10px]">Frame #{bowling_legality._debug_frames.release_frame}</div>
                          )}
                        </div>
                      )}
                    </div>
                    {bowling_legality.angle_at_arm_horizontal != null && bowling_legality.angle_at_release != null && (
                      <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
                        <span className="font-mono">
                          Extension = {bowling_legality.angle_at_release!.toFixed(1)}° - {bowling_legality.angle_at_arm_horizontal!.toFixed(1)}° = {(bowling_legality.angle_at_release! - bowling_legality.angle_at_arm_horizontal!).toFixed(1)}°
                        </span>
                        {(bowling_legality.angle_at_release! - bowling_legality.angle_at_arm_horizontal!) < 0 && (
                          <span className="ml-2 text-yellow-400">(flexion, clamped to 0)</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shoulder Angle at Release */}
            {shoulder_angle_at_release && (
              <MetricCard
                icon={<Target className="w-5 h-5 text-blue-400" />}
                title="Shoulder Angle"
                subtitle="Arm-Trunk Separation"
                mainValue={`${shoulder_angle_at_release.shoulder_angle}°`}
                mainLabel="Angle at Release"
                classification={shoulder_angle_at_release.classification}
                note={shoulder_angle_at_release.interpretation}
                cameraAngleQuality={shoulder_angle_at_release.camera_angle_quality}
              />
            )}

            {/* Wrist Whip Velocity */}
            {wrist_whip_velocity && (
              <MetricCard
                icon={<Zap className="w-5 h-5 text-purple-400" />}
                title="Wrist Whip"
                subtitle="Velocity During Delivery"
                mainValue={wrist_whip_velocity.peak_velocity.toFixed(2)}
                mainLabel="Peak Velocity"
                secondaryValue={`${wrist_whip_velocity.average_velocity.toFixed(2)} avg`}
                classification={wrist_whip_velocity.classification}
                note={wrist_whip_velocity.interpretation}
                cameraAngleQuality={wrist_whip_velocity.camera_angle_quality}
              />
            )}
          </div>

          {/* Benchmark Info */}
          <div className="bg-slate-900/50 rounded-lg p-4 text-xs border border-slate-700">
            <p className="mb-2 text-slate-300">
              <strong className="text-slate-200">Arm Speed Benchmarks:</strong>{' '}
              Elite: &gt;5000°/s | Professional: 4000-5000°/s | Good: 3000-4000°/s
            </p>
            <p className="text-slate-300">
              <strong className="text-slate-200">ICC Rule:</strong>{' '}
              Elbow extension must not exceed 15° from arm-horizontal to ball release.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  mainValue: string;
  mainLabel: string;
  secondaryValue?: string;
  classification?: string;
  note?: string;
  confidence?: string;
  cameraAngleQuality?: string;
}

function MetricCard({
  icon,
  title,
  subtitle,
  mainValue,
  mainLabel,
  secondaryValue,
  classification,
  note,
  confidence,
  cameraAngleQuality,
}: MetricCardProps) {
  const qualityColors: Record<string, string> = {
    excellent: 'text-green-400',
    good: 'text-blue-400',
    moderate: 'text-yellow-400',
    poor: 'text-orange-400',
    very_poor: 'text-red-400',
  };
  
  return (
    <div className="bg-slate-900/50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h4 className="text-sm font-medium text-white">{title}</h4>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {classification && (
          <span 
            className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
              classificationBadgeColors[classification] || 'bg-slate-500/20 border-slate-500'
            } ${classificationColors[classification] || 'text-slate-400'}`}
          >
            {classification.replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{mainValue}</span>
          {secondaryValue && (
            <span className="text-sm text-slate-400">{secondaryValue}</span>
          )}
        </div>
        <p className="text-xs text-slate-500">{mainLabel}</p>
      </div>

      {(note || confidence || cameraAngleQuality) && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          {note && <p className="text-xs text-slate-400">{note}</p>}
          {confidence && (
            <p className="text-xs text-slate-500 mt-1">
              Confidence: <span className="capitalize">{confidence}</span>
            </p>
          )}
          {cameraAngleQuality && cameraAngleQuality !== 'unknown' && (
            <p className="text-xs text-slate-500 mt-1">
              Camera angle quality: <span className={`capitalize ${qualityColors[cameraAngleQuality] || 'text-slate-400'}`}>{cameraAngleQuality.replace('_', ' ')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface QualityGateIndicatorProps {
  label: string;
  passed?: boolean;
  warning?: boolean;
}

function QualityGateIndicator({ label, passed, warning }: QualityGateIndicatorProps) {
  if (passed === undefined) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      warning 
        ? 'bg-orange-500/10 border-orange-500/30' 
        : passed 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
    }`}>
      {warning ? (
        <AlertTriangle className="w-4 h-4 text-orange-400" />
      ) : passed ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
      <span className={`text-xs ${
        warning 
          ? 'text-orange-400' 
          : passed 
            ? 'text-green-400' 
            : 'text-red-400'
      }`}>
        {label}
      </span>
    </div>
  );
}
