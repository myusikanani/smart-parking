import { motion } from 'framer-motion';
import { wheelSpin } from '../../lib/animations';

interface Props {
  className?: string;
  color?: string;
  animate?: boolean;
}

const CarSedan = ({ className = '', color = '#06b6d4', animate = false }: Props) => (
  <motion.svg
    viewBox="0 0 260 120"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...(animate ? { initial: { x: 200, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: 'spring', stiffness: 60, damping: 12 } } : {})}
  >
    <defs>
      <linearGradient id="carBody" x1="20" y1="40" x2="240" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor={color} />
        <stop offset="1" stopColor={color} stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="carRoof" x1="80" y1="15" x2="180" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor={color} stopOpacity="0.8" />
        <stop offset="1" stopColor={color} stopOpacity="0.4" />
      </linearGradient>
      <filter id="carGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <motion.g filter="url(#carGlow)">
      <path
        d="M30 75 Q30 65 40 60 L70 55 Q80 30 100 22 L160 20 Q180 22 190 55 L220 60 Q235 65 240 75 L240 85 Q240 95 230 95 L40 95 Q30 95 30 85 Z"
        fill="url(#carBody)"
        stroke={color}
        strokeWidth="2"
      />

      <path
        d="M80 55 Q85 28 105 20 L155 18 Q175 20 185 55"
        fill="url(#carRoof)"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.7"
      />

      <path d="M100 55 L108 25 L155 23 L165 55" fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />

      <rect x="82" y="28" width="22" height="22" rx="3" fill={color} stroke={color} strokeWidth="1" opacity="0.4" />
      <rect x="110" y="26" width="35" height="24" rx="3" fill={color} stroke={color} strokeWidth="1" opacity="0.4" />
      <rect x="150" y="28" width="22" height="22" rx="3" fill={color} stroke={color} strokeWidth="1" opacity="0.4" />

      <circle cx="65" cy="95" r="18" stroke={color} strokeWidth="3" fill="#0a0a0f" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <circle cx="65" cy="95" r="10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
        <line x1="65" y1="85" x2="65" y2="105" stroke={color} strokeWidth="1" opacity="0.4" />
        <line x1="55" y1="95" x2="75" y2="95" stroke={color} strokeWidth="1" opacity="0.4" />
      </motion.g>

      <circle cx="205" cy="95" r="18" stroke={color} strokeWidth="3" fill="#0a0a0f" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <circle cx="205" cy="95" r="10" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
        <line x1="205" y1="85" x2="205" y2="105" stroke={color} strokeWidth="1" opacity="0.4" />
        <line x1="195" y1="95" x2="215" y2="95" stroke={color} strokeWidth="1" opacity="0.4" />
      </motion.g>

      <rect x="28" y="72" width="12" height="8" rx="3" fill="#fbbf24" opacity="0.9" />
      <rect x="230" y="72" width="12" height="8" rx="3" fill="#ef4444" opacity="0.9" />

      <rect x="30" y="80" width="8" height="5" rx="2" fill="#06b6d4" opacity="0.8" />
      <rect x="232" y="80" width="8" height="5" rx="2" fill="#ef4444" opacity="0.8" />

      <path d="M100 58 L165 58" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="130" cy="65" r="4" fill={color} opacity="0.2" />
    </motion.g>
  </motion.svg>
);

export default CarSedan;
