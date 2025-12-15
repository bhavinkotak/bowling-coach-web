import { Badge } from '../Common';

interface ComparisonViewProps {
  parameterName: string;
  userSnapshotUrl: string;
  userScore: number;
  userMeasurement?: string;
  referenceMeasurement?: string;
  referenceSnapshotUrl?: string; // Optional: Use professional reference image
}

export function ComparisonView({
  parameterName,
  userSnapshotUrl,
  userScore,
  userMeasurement,
  referenceMeasurement,
  referenceSnapshotUrl,
}: ComparisonViewProps) {
  const formattedName = parameterName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Determine overlay color based on score
  const overlayColor = userScore >= 80 ? 'green' : userScore >= 60 ? 'yellow' : 'red';
  const overlayColorClass = {
    red: 'bg-red-500/20 border-red-500',
    yellow: 'bg-yellow-500/20 border-yellow-500',
    green: 'bg-green-500/20 border-green-500',
  }[overlayColor];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white">{formattedName}</h3>
          <Badge
            variant={userScore >= 80 ? 'success' : userScore >= 60 ? 'warning' : 'danger'}
            size="lg"
            className="text-lg px-3 py-1"
          >
            {Math.round(userScore)}
          </Badge>
        </div>
      </div>

      {/* Split Screen Comparison */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-slate-200">
        {/* User's Frame */}
        <div className="p-4">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase">Your Form</span>
          </div>
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <img
              src={userSnapshotUrl}
              alt={`Your ${formattedName}`}
              className="w-full h-full object-contain"
            />
            {/* Overlay indicating issue severity */}
            <div className={`absolute inset-0 border-4 pointer-events-none ${overlayColorClass}`} />
            
            {/* Measurement Display */}
            {userMeasurement && (
              <div className={`absolute bottom-2 left-2 right-2 ${overlayColor === 'red' ? 'bg-red-600' : overlayColor === 'yellow' ? 'bg-yellow-600' : 'bg-green-600'} text-white px-3 py-1.5 rounded-full text-center text-sm font-bold`}>
                {userMeasurement}
              </div>
            )}
          </div>
        </div>

        {/* Reference/Ideal Frame */}
        <div className="p-4 bg-slate-50">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Ideal Form</span>
          </div>
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
            {referenceSnapshotUrl ? (
              <img
                src={referenceSnapshotUrl}
                alt={`Reference ${formattedName}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm px-4 text-center">
                Professional reference coming soon
              </div>
            )}
            
            {/* Green overlay for ideal reference */}
            {referenceSnapshotUrl && (
              <div className="absolute inset-0 border-4 border-emerald-500 bg-emerald-500/10 pointer-events-none" />
            )}
            
            {/* Ideal Measurement Display */}
            {referenceMeasurement && (
              <div className="absolute bottom-2 left-2 right-2 bg-emerald-600 text-white px-3 py-1.5 rounded-full text-center text-sm font-bold">
                {referenceMeasurement}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explanation Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            {userScore >= 80 ? '✓' : userScore >= 60 ? '⚠️' : '❌'}
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-700">
              {userScore >= 80 ? (
                <>Your <span className="font-semibold">{formattedName}</span> shows excellent form, closely matching professional standards.</>
              ) : userScore >= 60 ? (
                <>Your <span className="font-semibold">{formattedName}</span> is good but has room for refinement. Focus on the differences highlighted above.</>
              ) : (
                <>Your <span className="font-semibold">{formattedName}</span> needs attention. Compare the red-highlighted areas with the ideal green overlay to improve.</>
              )}
            </p>
            {userMeasurement && referenceMeasurement && (
              <p className="text-xs text-slate-500 mt-1">
                Measured: {userMeasurement} | Target: {referenceMeasurement}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
