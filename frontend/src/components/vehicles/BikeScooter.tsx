import { motion } from 'framer-motion';
import { wheelSpin } from '../../lib/animations';

interface Props {
  className?: string;
  color?: string;
  animate?: boolean;
}

const BikeScooter = ({ className = '', color = '#06b6d4', animate = false }: Props) => (
  <motion.svg
    viewBox="0 0 200 120"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...(animate ? { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: 'spring', stiffness: 80, damping: 15 } } : {})}
  >
    <defs>
      <linearGradient id="bikeBody" x1="60" y1="30" x2="160" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor={color} />
        <stop offset="1" stopColor={color} stopOpacity="0.6" />
      </linearGradient>
      <filter id="bikeGlow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <motion.g filter="url(#bikeGlow)">
      <ellipse cx="45" cy="90" rx="22" ry="22" stroke={color} strokeWidth="3" fill="none" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <line x1="45" y1="68" x2="45" y2="112" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="23" y1="90" x2="67" y2="90" stroke={color} strokeWidth="1.5" opacity="0.5" />
      </motion.g>
    </motion.g>

    <motion.g filter="url(#bikeGlow)">
      <ellipse cx="155" cy="90" rx="22" ry="22" stroke={color} strokeWidth="3" fill="none" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <line x1="155" y1="68" x2="155" y2="112" stroke={color} strokeWidth="1.5" opacity="0.5" />
        <line x1="133" y1="90" x2="177" y2="90" stroke={color} strokeWidth="1.5" opacity="0.5" />
      </motion.g>
    </motion.g>

    <path d="M45 90 L85 45 L120 50 L140 60 L155 90" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

    <path d="M85 45 L95 30 L115 28" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

    <path d="M85 45 L80 55 L70 70" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />

    <path d="M120 50 L140 60" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />

    <rect x="88" y="38" width="20" height="10" rx="2" fill={color} opacity="0.3" />

    <path d="M110 50 L135 55" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />

    <rect x="90" y="25" width="25" height="8" rx="4" fill={color} opacity="0.8" />

    <circle cx="100" cy="42" r="3" fill={color} opacity="0.6" />

    <path d="M130 58 L150 55" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" fill="none" />
  </motion.svg>
);

export default BikeScooter;
