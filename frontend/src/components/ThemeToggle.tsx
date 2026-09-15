import { motion } from 'framer-motion';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={toggle}
      className={`p-2 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center cursor-pointer border ${
        isDark
          ? 'bg-slate-900/80 border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,210,255,0.4)]'
          : 'bg-white/90 border-cyan-500/40 text-amber-500 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(0,255,163,0.35)] shadow-sm'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {isDark ? (
          <HiOutlineMoon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,210,255,0.7)]" />
        ) : (
          <HiOutlineSun className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        )}
      </motion.div>
    </motion.button>
  );
}

