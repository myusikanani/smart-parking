import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  gradient?: boolean;
}

const Card = ({ className = '', children, onClick, hoverable = false, gradient = false }: CardProps) => (
  <motion.div
    whileHover={
      hoverable
        ? { y: -6, scale: 1.02, boxShadow: '0 20px 40px rgba(6, 182, 212, 0.15)' }
        : undefined
    }
    whileTap={hoverable ? { scale: 0.98 } : undefined}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    onClick={onClick}
    className={`${gradient ? 'glass-card neon-border' : 'glass-card'} transition-all duration-300 ${
      onClick || hoverable ? 'cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </motion.div>
);

export default Card;
