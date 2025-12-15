import type { ParameterScore, ParameterFeedback } from '../../types';
import { formatParameterName, getParameterIcon, getScoreColor, getScoreBgColor } from '../../utils/formatters';

interface ParameterCardProps {
  parameterName: string;
  parameter: ParameterScore;
  onClick?: () => void;
  hideClipsInfo?: boolean; // Option to hide the "X clips available" section
}

export default function ParameterCard({ parameterName, parameter, onClick, hideClipsInfo = false }: ParameterCardProps) {
  const icon = getParameterIcon(parameterName);
  const displayName = formatParameterName(parameterName);
  const scoreColor = getScoreColor(parameter.score);
  const scoreBgColor = getScoreBgColor(parameter.score);

  // Handle feedback being either string or ParameterFeedback object
  const renderFeedback = () => {
    if (!parameter.feedback) return null;
    
    if (typeof parameter.feedback === 'string') {
      return <p className="text-sm text-gray-700 leading-relaxed">{parameter.feedback}</p>;
    }
    
    // It's a ParameterFeedback object
    const feedback = parameter.feedback as ParameterFeedback;
    return (
      <div className="space-y-2 text-sm">
        {feedback.issues && feedback.issues.length > 0 && (
          <div>
            <p className="font-medium text-red-700">Issues:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {feedback.issues.map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {feedback.strengths && feedback.strengths.length > 0 && (
          <div>
            <p className="font-medium text-green-700">Strengths:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {feedback.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Handle clips being either array or Record
  const getClipsCount = () => {
    if (!parameter.clips) return 0;
    if (Array.isArray(parameter.clips)) return parameter.clips.length;
    return Object.keys(parameter.clips).length;
  };
  
  const clipsCount = getClipsCount();
  const hasClips = clipsCount > 0;

  return (
    <div
      className={`card ${onClick ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
        </div>
        
        <div className={`px-3 py-1 rounded-full ${scoreBgColor}`}>
          <span className={`text-sm font-bold ${scoreColor}`}>
            {parameter.score.toFixed(1)}
          </span>
        </div>
      </div>

      {parameter.feedback && (
        <div className="space-y-2">
          {renderFeedback()}
        </div>
      )}

      {!hideClipsInfo && hasClips && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              {clipsCount} video clip{clipsCount > 1 ? 's' : ''} available
            </span>
            {onClick && (
              <span className="text-xs text-indigo-600 font-medium">
                Click to view →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
