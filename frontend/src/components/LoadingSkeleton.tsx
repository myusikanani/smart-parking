interface LoadingSkeletonProps {
  variant?: 'card' | 'table-row' | 'chart' | 'text';
  rows?: number;
}

const textWidths = ['75%', '60%', '85%', '70%', '55%', '90%', '65%', '80%'];

const chartHeights = [40, 65, 45, 80, 55, 90, 70, 50, 75, 60, 85, 95];

const LoadingSkeleton = ({ variant = 'text', rows = 1 }: LoadingSkeletonProps) => {
  const base = 'animate-pulse bg-white/5';

  if (variant === 'card') {
    return (
      <div className="glass-card p-5">
        <div className={`${base} w-11 h-11 rounded-xl mb-3`} />
        <div className={`${base} w-24 h-3 mb-2 rounded-xl`} />
        <div className={`${base} w-32 h-6 mb-2 rounded-xl`} />
        <div className={`${base} w-16 h-4 rounded-xl`} />
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className={`${base} h-4 flex-1 rounded-xl`} />
            <div className={`${base} h-4 w-20 rounded-xl`} />
            <div className={`${base} h-4 w-24 rounded-xl`} />
            <div className={`${base} h-4 w-16 rounded-xl`} />
            <div className={`${base} h-7 w-20 rounded-xl`} />
          </div>
        ))}
      </>
    );
  }

  if (variant === 'chart') {
    return (
      <div className="glass-card p-5">
        <div className={`${base} w-32 h-4 mb-4 rounded-xl`} />
        <div className="flex items-end gap-2 h-40">
          {chartHeights.map((h, i) => (
            <div key={i} className={`${base} flex-1 rounded-t-xl`} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${base} h-3 rounded-xl`} style={{ width: textWidths[i % textWidths.length] }} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
