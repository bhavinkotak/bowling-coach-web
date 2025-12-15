import React from 'react';
import { BarChart3, TrendingUp, Award, Activity } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

interface MetricsPanelProps {
  metrics: Metric[];
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">{metric.label}</span>
            {metric.icon || <Activity size={16} className="text-slate-500" />}
          </div>
          
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-white">
              {metric.value}
            </span>
            
            {metric.change !== undefined && (
              <span
                className={`text-sm mb-1 ${
                  metric.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {metric.change >= 0 ? '+' : ''}
                {metric.change}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Predefined metric configurations
export const defaultMetrics = (analysisResult: any): Metric[] => [
  {
    label: 'Overall Score',
    value: analysisResult?.overallScore?.toFixed(0) || '-',
    icon: <Award size={16} className="text-yellow-500" />,
  },
  {
    label: 'Parameters',
    value: Object.keys(analysisResult?.parameters || {}).length,
    icon: <BarChart3 size={16} className="text-blue-500" />,
  },
  {
    label: 'Strong Areas',
    value: Object.values(analysisResult?.parameters || {}).filter(
      (p: any) => p.score >= 80
    ).length,
    icon: <TrendingUp size={16} className="text-green-500" />,
  },
  {
    label: 'Focus Areas',
    value: Object.values(analysisResult?.parameters || {}).filter(
      (p: any) => p.score < 60
    ).length,
    icon: <Activity size={16} className="text-orange-500" />,
  },
];
