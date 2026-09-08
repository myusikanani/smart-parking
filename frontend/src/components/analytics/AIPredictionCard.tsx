import { motion } from 'framer-motion';

interface AIPredictionCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  subtitle?: string;
  loading?: boolean;
}

export default function AIPredictionCard({
  title, value, change, icon, trend = 'neutral', color = 'cyan', subtitle, loading,
}: AIPredictionCardProps) {
  const colors: Record<string, string> = {
    cyan: 'from-cyan-500 to-blue-500',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-500 to-orange-500',
    purple: 'from-purple-500 to-pink-500',
    red: 'from-red-500 to-rose-500',
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-4 border border-white/5 animate-pulse">
        <div className="h-3 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-8 bg-white/10 rounded w-2/3 mb-2" />
        <div className="h-3 bg-white/5 rounded w-1/3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>

      <div className={`text-2xl font-bold bg-gradient-to-r ${colors[color] || colors.cyan} bg-clip-text text-transparent`}>
        {value}
      </div>

      <div className="flex items-center gap-2 mt-1">
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
            {Math.abs(change)}%
          </span>
        )}
        {subtitle && <span className="text-[10px] text-gray-500">{subtitle}</span>}
      </div>
    </motion.div>
  );
}
