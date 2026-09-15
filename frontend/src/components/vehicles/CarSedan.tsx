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
        <stop offset="1" stopColor={color} stopOpacity="0.6" />
      </linearGradient>
      <linearGradient id="carRoof" x1="80" y1="15" x2="180" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0a0f1d" />
        <stop offset="1" stopColor="#040711" />
      </linearGradient>
      <filter id="carGlow">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <motion.g filter="url(#carGlow)">
      {/* Ground Contact Shadow */}
      <ellipse cx="130" cy="100" rx="105" ry="12" fill="#000000" opacity="0.6" />

      {/* Aerodynamic Low-Slung Sports Sedan Body Profile (Taycan / e-tron GT style) */}
      <path
        d="M 22 82 C 22 74, 32 68, 48 64 L 75 58 C 90 32, 115 22, 142 20 L 175 22 C 205 26, 222 56, 235 62 L 244 72 C 248 78, 246 88, 236 90 L 40 90 C 28 90, 22 88, 22 82 Z"
        fill="url(#carBody)"
        stroke={color}
        strokeWidth="1.8"
      />

      {/* Aerodynamic Side Skirts & Body Crease */}
      <path d="M 45 66 C 85 64, 175 64, 235 68" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
      <path d="M 40 82 L 235 82" stroke={color} strokeWidth="1.2" opacity="0.5" />

      {/* Sleek Panoramic Greenhouse Canopy & Windshield */}
      <path
        d="M 82 56 C 92 30, 114 24, 142 23 L 172 24 C 196 28, 210 48, 218 56 Z"
        fill="url(#carRoof)"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.95"
      />

      {/* Cyan Sky & Horizon Glass Reflection */}
      <path
        d="M 88 53 C 96 33, 112 27, 138 26 L 150 26 C 128 32, 110 44, 102 53 Z"
        fill="#38bdf8"
        opacity="0.4"
      />

      {/* Pillar Dividers */}
      <line x1="145" y1="24" x2="148" y2="56" stroke={color} strokeWidth="1.2" opacity="0.5" />
      <line x1="185" y1="26" x2="192" y2="56" stroke={color} strokeWidth="1.2" opacity="0.5" />

      {/* Front Wheel & Alloy Rim */}
      <circle cx="68" cy="90" r="17" stroke={color} strokeWidth="2.5" fill="#090d16" />
      <circle cx="68" cy="90" r="11" stroke="#38bdf8" strokeWidth="1" fill="#0f172a" opacity="0.8" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <circle cx="68" cy="90" r="6" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="68" y1="79" x2="68" y2="101" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <line x1="57" y1="90" x2="79" y2="90" stroke={color} strokeWidth="1.2" opacity="0.6" />
      </motion.g>

      {/* Rear Wheel & Alloy Rim */}
      <circle cx="202" cy="90" r="17" stroke={color} strokeWidth="2.5" fill="#090d16" />
      <circle cx="202" cy="90" r="11" stroke="#38bdf8" strokeWidth="1" fill="#0f172a" opacity="0.8" />
      <motion.g {...(animate ? wheelSpin : {})}>
        <circle cx="202" cy="90" r="6" stroke={color} strokeWidth="1.5" fill="none" />
        <line x1="202" y1="79" x2="202" y2="101" stroke={color} strokeWidth="1.2" opacity="0.6" />
        <line x1="191" y1="90" x2="213" y2="90" stroke={color} strokeWidth="1.2" opacity="0.6" />
      </motion.g>

      {/* Front Xenon LED Projector Headlight */}
      <path d="M 23 76 L 36 74 L 33 80 Z" fill="#ffffff" filter="url(#carGlow)" />
      <circle cx="28" cy="76" r="2.5" fill="#ffffff" />

      {/* Continuous Red LED Rear Light Bar */}
      <path d="M 238 72 L 244 76 L 241 80" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" filter="url(#carGlow)" />

      {/* Flush Door Handle */}
      <rect x="115" y="66" width="12" height="2" rx="1" fill="#ffffff" opacity="0.6" />
      <rect x="165" y="66" width="12" height="2" rx="1" fill="#ffffff" opacity="0.6" />
    </motion.g>
  </motion.svg>
);

export default CarSedan;
