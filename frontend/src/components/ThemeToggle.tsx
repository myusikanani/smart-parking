import { motion } from 'framer-motion';
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi2';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className="p-2 rounded-xl border border-white/10 glass text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-200 relative overflow-hidden flex items-center justify-center cursor-pointer"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? (
          <HiOutlineSun className="w-5 h-5 text-amber-400" />
        ) : (
          <HiOutlineMoon className="w-5 h-5 text-indigo-400" />
        )}
      </motion.div>
    </motion.button>
  );
}
