import type { FC } from 'react';
import { motion } from 'framer-motion';

interface ThreeDCarGlitterSymbolProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isHovered?: boolean;
}

export const ThreeDCarGlitterSymbol: FC<ThreeDCarGlitterSymbolProps> = ({
  size = 'md',
  className = '',
}) => {
  // Dimensions based on size prop
  const sizeMap = {
    sm: { container: 'w-10 h-10', svg: 'w-8 h-8' },
    md: { container: 'w-16 h-16', svg: 'w-14 h-14' },
    lg: { container: 'w-24 h-24', svg: 'w-20 h-20' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${currentSize.container} ${className}`}>
      {/* 3D Scene Wrapper with Perspective */}
      <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: '800px' }}>
        
        {/* GLittery Dish Base (Platform beneath the car) */}
        <div className="absolute bottom-0 w-full h-[45%] flex items-center justify-center pointer-events-none">
          {/* Outer Pulsating Holographic Ring */}
          <motion.div
            animate={{
              scale: [0.95, 1.1, 0.95],
              opacity: [0.4, 0.8, 0.4],
              rotate: [0, 360],
            }}
            transition={{
              scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
              opacity: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 15, ease: 'linear' },
            }}
            className="absolute w-full h-full rounded-full border border-cyan-400/40 border-dashed shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            style={{ transform: 'rotateX(70deg)' }}
          />

          {/* Shiny Metallic Dish Base */}
          <div
            className="relative w-[90%] h-[80%] rounded-full bg-gradient-to-tr from-cyan-900/60 via-slate-900/90 to-emerald-900/70 border-2 border-cyan-300/60 shadow-[0_4px_20px_rgba(6,182,212,0.6),inset_0_0_12px_rgba(52,211,153,0.5)] overflow-hidden"
            style={{ transform: 'rotateX(70deg)' }}
          >
            {/* Dish Specular Reflection Line */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
          </div>

          {/* Glitter / Sparkle Particles around the Dish */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`glitter-${i}`}
              animate={{
                y: [0, -12, -2],
                x: [(i % 2 === 0 ? 1 : -1) * (i * 3), (i % 2 === 0 ? -1 : 1) * (i * 4)],
                opacity: [0, 1, 0],
                scale: [0.2, 1, 0.2],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.8 + i * 0.3,
                delay: i * 0.25,
                ease: 'easeInOut',
              }}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]"
              style={{
                left: `${15 + i * 14}%`,
                bottom: `${20 + (i % 3) * 10}%`,
              }}
            />
          ))}

          {/* Sparkle Star Icons */}
          <motion.span
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.2, 0.6], rotate: [0, 90, 180] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute top-0 right-1 text-cyan-300 text-[10px] font-bold drop-shadow-[0_0_6px_#38bdf8]"
          >
            ✦
          </motion.span>
          <motion.span
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.5, 1.1, 0.5], rotate: [180, 90, 0] }}
            transition={{ repeat: Infinity, duration: 2.3, delay: 0.7, ease: 'easeInOut' }}
            className="absolute bottom-1 left-1 text-emerald-300 text-[9px] font-bold drop-shadow-[0_0_6px_#34d399]"
          >
            ✦
          </motion.span>

          {/* Dynamic Car Shadow on Dish (shrinks when car jumps) */}
          <motion.div
            animate={{
              scale: [1, 0.55, 1, 0.85, 1],
              opacity: [0.75, 0.25, 0.75, 0.45, 0.75],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
            }}
            className="absolute bottom-1 w-[60%] h-[30%] bg-cyan-950/90 rounded-full blur-sm"
            style={{ transform: 'rotateX(75deg)' }}
          />
        </div>

        {/* 3D Wireframe Car Container - Small Jump & Continuous 360 Spin */}
        <motion.div
          animate={{
            y: [0, -12, 0, -4, 0], // Small Jump on the dish
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
            },
          }}
          className="relative z-10 flex items-center justify-center pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* 360 Degree Rotation Wrapper (Gol Gol Fare) */}
          <motion.div
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              rotateY: {
                repeat: Infinity,
                duration: 6, // Smooth 360-degree round and round rotation
                ease: 'linear',
              },
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className="flex items-center justify-center"
          >
            {/* SVG Wireframe 3D Supercar (Inspired directly by user's wireframe car image) */}
            <svg
              viewBox="0 0 200 100"
              className={`${currentSize.svg} drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Metallic Cyan Gradient */}
                <linearGradient id="wireframeBody" x1="0" y1="0" x2="200" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#22d3ee" stopOpacity="0.9" />
                  <stop offset="0.5" stopColor="#34d399" stopOpacity="0.75" />
                  <stop offset="1" stopColor="#0284c7" stopOpacity="0.9" />
                </linearGradient>

                {/* Cyber Grid Pattern for Car Shell (Wireframe Look) */}
                <pattern id="carMeshGrid" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#22d3ee" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>

                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#neonGlow)">
                {/* Car Main Body Shell (Wireframe Supercar Silhouette) */}
                <path
                  d="M15 62 C15 52 28 48 42 45 C55 30 75 18 105 16 C140 16 158 28 172 45 C186 48 192 55 192 64 C192 72 185 75 175 75 L30 75 C20 75 15 70 15 62 Z"
                  fill="url(#wireframeBody)"
                  fillOpacity="0.25"
                  stroke="#22d3ee"
                  strokeWidth="1.8"
                />

                {/* Wireframe Mesh Overlay on Body */}
                <path
                  d="M15 62 C15 52 28 48 42 45 C55 30 75 18 105 16 C140 16 158 28 172 45 C186 48 192 55 192 64 C192 72 185 75 175 75 L30 75 Z"
                  fill="url(#carMeshGrid)"
                  opacity="0.8"
                />

                {/* Double Bubble Roof Contour Lines */}
                <path
                  d="M62 43 C72 24 92 19 115 19 C138 19 150 26 158 43"
                  fill="none"
                  stroke="#67e8f9"
                  strokeWidth="1.5"
                />
                <path
                  d="M80 43 C88 27 104 22 122 22 C138 22 146 28 150 43"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Windshield & Side Windows Grid */}
                <path d="M72 43 L88 25 L125 24 L138 43 Z" fill="#22d3ee" fillOpacity="0.2" stroke="#67e8f9" strokeWidth="1" />
                <line x1="102" y1="24" x2="102" y2="43" stroke="#22d3ee" strokeWidth="1" strokeDasharray="1 2" />

                {/* Aerodynamic Hood Grid Lines (Wireframe Style from Image) */}
                <path d="M35 50 Q65 42 100 42 Q140 42 170 50" stroke="#38bdf8" strokeWidth="1.2" fill="none" />
                <path d="M25 58 C50 52 100 50 178 58" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 2" fill="none" />

                {/* Longitudinal Wireframe Lines */}
                <line x1="45" y1="46" x2="45" y2="65" stroke="#34d399" strokeWidth="0.8" opacity="0.7" />
                <line x1="70" y1="32" x2="70" y2="68" stroke="#34d399" strokeWidth="0.8" opacity="0.7" />
                <line x1="95" y1="18" x2="95" y2="70" stroke="#34d399" strokeWidth="0.8" opacity="0.7" />
                <line x1="120" y1="20" x2="120" y2="68" stroke="#34d399" strokeWidth="0.8" opacity="0.7" />
                <line x1="145" y1="32" x2="145" y2="66" stroke="#34d399" strokeWidth="0.8" opacity="0.7" />
                <line x1="168" y1="46" x2="168" y2="64" stroke="#34d399" strokeWidth="0.8" opacity="0.7" />

                {/* Side Air Intake Vent */}
                <path d="M128 50 L148 50 L142 62 L124 62 Z" fill="#042f2e" stroke="#22d3ee" strokeWidth="1" />

                {/* High Tech Alloy Wheels (Front & Rear Wireframe Rims) */}
                {/* Rear Wheel */}
                <g>
                  <circle cx="52" cy="68" r="16" fill="#020617" stroke="#22d3ee" strokeWidth="2.5" />
                  <circle cx="52" cy="68" r="11" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="52" cy="68" r="5" fill="#38bdf8" />
                  {/* Wheel Spokes */}
                  <line x1="52" y1="52" x2="52" y2="84" stroke="#67e8f9" strokeWidth="1.2" />
                  <line x1="36" y1="68" x2="68" y2="68" stroke="#67e8f9" strokeWidth="1.2" />
                  <line x1="41" y1="57" x2="63" y2="79" stroke="#67e8f9" strokeWidth="1" />
                  <line x1="41" y1="79" x2="63" y2="57" stroke="#67e8f9" strokeWidth="1" />
                </g>

                {/* Front Wheel */}
                <g>
                  <circle cx="152" cy="68" r="16" fill="#020617" stroke="#22d3ee" strokeWidth="2.5" />
                  <circle cx="152" cy="68" r="11" fill="none" stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="152" cy="68" r="5" fill="#38bdf8" />
                  {/* Wheel Spokes */}
                  <line x1="152" y1="52" x2="152" y2="84" stroke="#67e8f9" strokeWidth="1.2" />
                  <line x1="136" y1="68" x2="168" y2="68" stroke="#67e8f9" strokeWidth="1.2" />
                  <line x1="141" y1="57" x2="163" y2="79" stroke="#67e8f9" strokeWidth="1" />
                  <line x1="141" y1="79" x2="163" y2="57" stroke="#67e8f9" strokeWidth="1" />
                </g>

                {/* Headlights & Tail Lights Glowing Beams */}
                <path d="M185 56 L195 58 L188 64 Z" fill="#67e8f9" className="animate-pulse" />
                <circle cx="190" cy="60" r="3" fill="#ffffff" />
                
                {/* Tail Light Neon Strip */}
                <path d="M16 56 L20 64" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />

                {/* Front Grille Wireframe Mesh */}
                <path d="M176 62 Q186 64 190 66 L182 72 Q174 70 170 68 Z" fill="#0f172a" stroke="#22d3ee" strokeWidth="0.8" />
              </g>
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThreeDCarGlitterSymbol;
