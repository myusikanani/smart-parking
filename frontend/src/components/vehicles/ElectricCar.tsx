import { motion } from 'framer-motion';
import { wheelSpin } from '../../lib/animations';

interface Props {
  className?: string;
  color?: string;
  animate?: boolean;
}

const ElectricCar = ({ className = '', color = '#10b981', animate = false }: Props) => (
  <motion.svg
    viewBox="0 0 260 120"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...(animate ? { initial: { x: 200, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: 'spring', stiffness: 60, damping: 12 } } : {})}
  >
    <defs>
      <linearGradient id="evBody" x1="20" y1="40" x2="240" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor={color} />
        <stop offset="1" stopColor={color} stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="evRoof" x1="80" y1="15" x2="180" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06121e" />
        <stop offset="1" stopColor="#030811" />
      </linearGradient>
      <filter id="evGlow">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <motion.g filter="url(#evGlow)">
      {/* Ground Contact Shadow */}
      <ellipse cx="130" cy="100" rx="105" ry="12" fill="#000000" opacity="0.6" />

      {/* Aerodynamic Low-Slung Sports EV Body Profile */}
      <path
        d="M 22 82 C 22 74, 32 68, 48 64 L 75 58 C 90 32, 115 22, 142 20 L 175 22 C 205 26, 222 56, 235 62 L 244 72 C 248 78, 246 88, 236 90 L 40 90 C 28 90, 22 88, 22 82 Z"
        fill="url(#evBody)"
        stroke={color}
        strokeWidth="1.8"
      />

      {/* Cyber Neon Accents & EV Lighting Line */}
      <path d="M 45 66 C 85 64, 175 64, 235 68" stroke="#00FFA3" strokeWidth="1" opacity="0.5" />
      <path d="M 40 82 L 235 82" stroke={color} strokeWidth="1.2" opacity="0.5" />

      {/* Sleek Panoramic Canopy */}
      <path
        d="M 82 56 C 92 30, 114 24, 142 23 L 172 24 C 196 28, 210 48, 218 56 Z"
        fill="url(#evRoof)"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.95"
      />

      {/* Emerald Reflection Highlight */}
      <path
        d="M 88 53 C 96 33, 112 27, 138 26 L 150 26 C 128 32, 110 44, 102 53 Z"
        fill="#34D399"
        opacity="0.4"
      />

      {/* Pillar Dividers */}
      <line x1="145" y1="24" x2="148" y2="56" stroke={color} strokeWidth="1.2" opacity="0.5" />
      <line x1="185" y1="26" x2="192" y2="56" stroke={color} strokeWidth="1.2" opacity="0.5" />

      {/* Front Wheel & Alloy Rim */}
      <circle cx="68" cy="90" r="17" stroke={color} strokeWidth="2.5" fill="#090d16" />
      <circle cx="68" cy="90" r="11" stroke="#00FFA3" strokeWidth="1" fill="#0f172a" opacity="0.8" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <circle cx="68" cy="90" r="6" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="68" y1="79" x2="68" y2="101" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <line x1="57" y1="90" x2="79" y2="90" stroke={color} strokeWidth="1.2" opacity="0.6" />
      </motion.g>

      {/* Rear Wheel & Alloy Rim */}
      <circle cx="202" cy="90" r="17" stroke={color} strokeWidth="2.5" fill="#090d16" />
      <circle cx="202" cy="90" r="11" stroke="#00FFA3" strokeWidth="1" fill="#0f172a" opacity="0.8" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <circle cx="202" cy="90" r="6" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="202" y1="79" x2="202" y2="101" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <line x1="191" y1="90" x2="213" y2="90" stroke={color} strokeWidth="1.2" opacity="0.6" />
      </motion.g>

      {/* Front LED Projector Light */}
      <path d="M 23 76 L 36 74 L 33 80 Z" fill="#ffffff" filter="url(#evGlow)" />
      <circle cx="28" cy="76" r="2.5" fill="#ffffff" />

      {/* Continuous Neon Red Rear Light Bar */}
      <path d="M 238 72 L 244 76 L 241 80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" filter="url(#evGlow)" />

      {/* EV Charging Badge */}
      <rect x="125" y="64" width="16" height="8" rx="4" stroke={color} strokeWidth="1.2" fill={color} opacity="0.25" />
      <text x="133" y="70" textAnchor="middle" fill="#00FFA3" fontSize="5" fontWeight="bold">⚡</text>
    </motion.g>
  </motion.svg>
);

export default ElectricCar;
