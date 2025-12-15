interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export default function SkeletonLoader({ 
  className = '', 
  variant = 'rectangular',
  width = '100%',
  height = '1rem'
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-slate-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Pre-built skeleton patterns
export function AnalysisCardSkeleton() {
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between mb-3">
      <div className="flex items-center gap-3 flex-1">
        <SkeletonLoader variant="rectangular" width="64px" height="64px" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="text" width="120px" height="14px" />
          <SkeletonLoader variant="text" width="80px" height="12px" />
          <div className="flex gap-2">
            <SkeletonLoader variant="rectangular" width="60px" height="20px" />
            <SkeletonLoader variant="rectangular" width="60px" height="20px" />
          </div>
        </div>
      </div>
      <SkeletonLoader variant="circular" width="32px" height="32px" />
    </div>
  );
}
