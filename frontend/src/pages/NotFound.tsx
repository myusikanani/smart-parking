import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineLifebuoy } from 'react-icons/hi2';

const shapes = [
  { size: 80, x: '10%', y: '20%', delay: 0, duration: 4, color: 'bg-cyan-500/15 border-cyan-500/20' },
  { size: 50, x: '80%', y: '15%', delay: 0.5, duration: 3.5, color: 'bg-pink-500/15 border-pink-500/20' },
  { size: 60, x: '20%', y: '70%', delay: 1, duration: 5, color: 'bg-emerald-500/15 border-emerald-500/20' },
  { size: 40, x: '75%', y: '75%', delay: 0.3, duration: 4.5, color: 'bg-pink-500/15 border-pink-500/20' },
  { size: 70, x: '50%', y: '10%', delay: 0.8, duration: 3.8, color: 'bg-cyan-500/15 border-cyan-500/20' },
  { size: 45, x: '85%', y: '50%', delay: 0.2, duration: 4.2, color: 'bg-emerald-500/15 border-emerald-500/20' },
];

const NotFound = () => (
  <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center overflow-hidden relative">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
    </div>

    {shapes.map((shape, i) => (
      <motion.div
        key={i}
        className={`absolute rounded-full border ${shape.color}`}
        style={{ width: shape.size, height: shape.size, left: shape.x, top: shape.y }}
        animate={{ y: [0, -30, 0], rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: shape.duration, delay: shape.delay, ease: 'easeInOut' }}
      />
    ))}

    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative z-10 text-center px-4"
    >
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="text-[10rem] sm:text-[14rem] font-black leading-none tracking-tight neon-text"
      >
        404
      </motion.h1>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="text-3xl sm:text-4xl font-bold mt-4 mb-4"
      >
        Page Not Found
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        className="text-lg text-gray-400 max-w-md mx-auto mb-10 leading-relaxed"
      >
        The page you are looking for does not exist.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link to="/" className="btn-neon px-8 py-3 flex items-center gap-2 text-sm">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <HiOutlineLifebuoy className="w-4 h-4" />
          Contact Support
        </Link>
      </motion.div>
    </motion.div>
  </div>
);

export default NotFound;
