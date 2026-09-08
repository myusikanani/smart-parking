import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from 'react-icons/hi2';

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease';
  className?: string;
}

const StatCard = ({ icon, title, value, change, changeType, className = '' }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.02 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className={`stat-card p-5 ${className}`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
        {icon}
      </div>
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
          changeType === 'increase'
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
        }`}
      >
        {changeType === 'increase' ? (
          <HiOutlineArrowTrendingUp className="w-3.5 h-3.5" />
        ) : (
          <HiOutlineArrowTrendingDown className="w-3.5 h-3.5" />
        )}
        {change}
      </span>
    </div>
    <p className="text-sm font-medium text-gray-400">{title}</p>
    <p className="text-2xl font-extrabold neon-text-cyan mt-1">{value}</p>
  </motion.div>
);

export default StatCard;
