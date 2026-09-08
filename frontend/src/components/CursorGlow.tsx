import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CursorGlow = () => {
  const [pos, setPos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <motion.div
        animate={{ x: pos.x - 200, y: pos.y - 200 }}
        transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.5 }}
      >
        <div className="w-[400px] h-[400px] rounded-full bg-cyan-500/[0.07] blur-[80px]" />
      </motion.div>
    </div>
  );
};

export default CursorGlow;
