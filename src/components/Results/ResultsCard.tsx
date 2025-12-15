import { Trophy, TrendingUp, Target } from 'lucide-react';

interface ResultsCardProps {
  score: number;
  bowlerName?: string;
  date?: string;
}

export default function ResultsCard({ score, bowlerName, date }: ResultsCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-orange-600';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 80) return { text: 'Excellent', icon: Trophy };
    if (score >= 60) return { text: 'Good', icon: TrendingUp };
    return { text: 'Needs Improvement', icon: Target };
  };

  const performance = getPerformanceLevel(score);
  const Icon = performance.icon;

  return (
    <div className={`bg-gradient-to-br ${getScoreColor(score)} rounded-2xl p-8 text-white shadow-2xl`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm opacity-90">Overall Performance</p>
          {bowlerName && <h3 className="text-xl font-bold mt-1">{bowlerName}</h3>}
        </div>
        <Icon size={32} />
      </div>

      <div className="flex items-end gap-4">
        <div className="text-7xl font-bold">{score.toFixed(0)}</div>
        <div className="text-3xl opacity-80 mb-2">/100</div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-semibold">{performance.text}</span>
        {date && <span className="text-sm opacity-75">{date}</span>}
      </div>
    </div>
  );
}
