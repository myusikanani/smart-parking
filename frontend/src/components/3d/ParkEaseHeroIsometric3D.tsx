import { useState, useEffect } from 'react';

export default function ParkEaseHeroIsometric3D() {
  const [carProgress, setCarProgress] = useState(0);
  const [hoveredBay, setHoveredBay] = useState<string | null>(null);

  // Smooth cyclic car driving motion along the green navigation trajectory
  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();
    const cycleDuration = 6500; // 6.5s loop

    const updateCar = (now: number) => {
      const elapsed = (now - startTime) % cycleDuration;
      setCarProgress(elapsed / cycleDuration);
      animationFrameId = requestAnimationFrame(updateCar);
    };

    animationFrameId = requestAnimationFrame(updateCar);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Compute car position along the isometric spline:
  // Points: (Entrance 80, 360) -> (Mid road 240, 310) -> (Turn 390, 240) -> (Turn 320, 180) -> (Target Bay C1B 215, 145)
  const getCarPosAndAngle = (p: number) => {
    let x: number, y: number, angle: number;
    if (p < 0.28) {
      // Segment 1: Drive in along lower lane
      const t = p / 0.28;
      x = 80 + t * (250 - 80);
      y = 360 + t * (300 - 360);
      angle = -20;
    } else if (p < 0.52) {
      // Segment 2: Curve up right aisle
      const t = (p - 0.28) / 0.24;
      x = 250 + t * (390 - 250);
      y = 300 + t * (230 - 300);
      angle = -28;
    } else if (p < 0.76) {
      // Segment 3: Curve left into upper row
      const t = (p - 0.52) / 0.24;
      x = 390 + t * (260 - 390);
      y = 230 + t * (165 - 230);
      angle = -150;
    } else {
      // Segment 4: Pull into Bay C1B & hold
      const t = Math.min((p - 0.76) / 0.15, 1);
      x = 260 + t * (215 - 260);
      y = 165 + t * (142 - 165);
      angle = -155;
    }
    return { x, y, angle };
  };

  const car = getCarPosAndAngle(carProgress);

  return (
    <div className="relative w-full h-full min-h-[440px] lg:min-h-[520px] max-w-[620px] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#0b162e] via-[#070e1e] to-[#040812] border border-[#00D2FF]/40 shadow-[0_0_60px_rgba(0,210,255,0.25)] flex flex-col justify-between p-4 select-none">
      
      {/* Background Cyber Grid Pattern */}
      <div className="absolute inset-0 cyber-grid-floor opacity-40 pointer-events-none" />

      {/* Top HUD Row: Live Radar Beacon & Dual Floating Price Badges */}
      <div className="relative z-20 flex items-start justify-between gap-2 pointer-events-none">
        
        {/* Live Radar Allocation Pill */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 bg-[#071124]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#00D2FF]/40 text-[11px] font-space text-[#00D2FF] shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-ping" />
            <span className="font-bold tracking-wide">FLOOR 1 // 3D DECK</span>
          </div>
          <div className="text-[10px] font-mono text-gray-400 pl-2">
            Target Bay: <strong className="text-[#00FFA3]">#C1B (Available)</strong>
          </div>
        </div>

        {/* Floating Real Price Badges (₹30/hr & ₹25/hr) */}
        <div className="flex flex-col gap-2 items-end">
          <div className="bg-[#09152b]/95 border border-[#00FFA3]/70 px-3.5 py-1.5 rounded-xl shadow-[0_0_20px_rgba(0,255,163,0.35)] backdrop-blur-xl flex items-center gap-2">
            <span className="text-[10px] font-space text-emerald-300 font-semibold uppercase">Four-Wheeler</span>
            <span className="text-sm font-extrabold text-[#00FFA3] font-mono">₹30 / hr</span>
          </div>
          <div className="bg-[#09152b]/95 border border-[#00D2FF]/60 px-3.5 py-1.5 rounded-xl shadow-[0_0_20px_rgba(0,210,255,0.25)] backdrop-blur-xl flex items-center gap-2">
            <span className="text-[10px] font-space text-cyan-300 font-semibold uppercase">EV Fast Charge</span>
            <span className="text-sm font-extrabold text-[#00D2FF] font-mono">₹25 / hr</span>
          </div>
        </div>

      </div>

      {/* =========================================================================
          HIGH-FIDELITY 3D ISOMETRIC PARKING DECK (AERODYNAMIC CURVED CARS)
          ========================================================================= */}
      <div className="relative flex-1 w-full flex items-center justify-center my-auto min-h-[360px]">
        <svg
          viewBox="0 0 600 440"
          className="w-full h-full max-h-[440px] drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* High Intensity Glow Filter */}
            <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Soft Ambient Glow */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Neon Green Path Gradient */}
            <linearGradient id="neonGreenPath" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#00FFA3" stopOpacity="0.95" />
              <stop offset="85%" stopColor="#00FFA3" stopOpacity="1" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="1" />
            </linearGradient>

            {/* Luxury Metallic Car Body Gradients */}
            <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="45%" stopColor="#00D2FF" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <linearGradient id="blueSedanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>

            <linearGradient id="evGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064E3B" />
            </linearGradient>

            <linearGradient id="amberSportsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="60%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#92400E" />
            </linearGradient>

            <linearGradient id="charcoalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="60%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient id="bayTargetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.05" />
            </linearGradient>

            <linearGradient id="deckFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0e1b36" />
              <stop offset="100%" stopColor="#080f1e" />
            </linearGradient>

            <linearGradient id="deckSideGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#050a14" />
              <stop offset="100%" stopColor="#0b1730" />
            </linearGradient>
          </defs>

          {/* 1. Isometric Slab Side Extrusions (3D Depth) */}
          <polygon
            points="50,220 300,370 300,395 50,245"
            fill="url(#deckSideGrad)"
            stroke="#00D2FF"
            strokeWidth="0.8"
            strokeOpacity="0.3"
          />
          <polygon
            points="300,370 550,220 550,245 300,395"
            fill="#040810"
            stroke="#00D2FF"
            strokeWidth="0.8"
            strokeOpacity="0.2"
          />

          {/* 2. Top Isometric Deck Floor Plane */}
          <polygon
            points="300,70 550,220 300,370 50,220"
            fill="url(#deckFloorGrad)"
            stroke="#00D2FF"
            strokeWidth="2"
            strokeOpacity="0.5"
          />

          {/* 3. Isometric Grid Perspective Lines */}
          <g stroke="#00D2FF" strokeWidth="0.75" strokeOpacity="0.15">
            {/* Diagonals Left to Right */}
            <line x1="100" y1="190" x2="350" y2="340" />
            <line x1="150" y1="160" x2="400" y2="310" />
            <line x1="200" y1="130" x2="450" y2="280" />
            <line x1="250" y1="100" x2="500" y2="250" />
            {/* Diagonals Right to Left */}
            <line x1="500" y1="190" x2="250" y2="340" />
            <line x1="450" y1="160" x2="200" y2="310" />
            <line x1="400" y1="130" x2="150" y2="280" />
            <line x1="350" y1="100" x2="100" y2="250" />
          </g>

          {/* 4. Driveway Center Lane Divider Lines (Dashed Neon) */}
          <path
            d="M 120 285 L 290 330 L 440 240 L 290 150"
            fill="none"
            stroke="#00D2FF"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            strokeOpacity="0.4"
          />

          {/* =================================================================
              PARKING BAYS ROW A (Top/Left Row)
              ================================================================= */}
          
          {/* Bay C1A (Four-Wheeler - Occupied by 3D Volumetric Blue Sports Sedan) */}
          <g onMouseEnter={() => setHoveredBay('C1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="140,165 200,130 250,160 190,195"
              fill={hoveredBay === 'C1A' ? '#00D2FF22' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="175" y="160" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">C1A</text>
            
            {/* 3D Realistic Isometric Luxury Sedan in Bay C1A */}
            <g transform="translate(195, 160) rotate(-22)">
              {/* 1. Ground Contact Multi-Stage Shadow */}
              <ellipse cx="0" cy="14" rx="34" ry="12" fill="#000000" opacity="0.65" filter="url(#softGlow)" />
              <ellipse cx="0" cy="11" rx="26" ry="8" fill="#000000" opacity="0.85" />

              {/* 2. 4 3D Isometric Wheels with Glowing Cyan Calipers */}
              <g transform="translate(-18, 12)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#38BDF8" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
              </g>
              <g transform="translate(-8, 17)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#38BDF8" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
              </g>
              <g transform="translate(14, -2)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#38BDF8" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
              </g>
              <g transform="translate(24, 3)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#38BDF8" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#38BDF8" />
              </g>

              {/* 3. Lower Chassis (Side Extrusion for 3D Volume) */}
              <path d="M -24 8 L 8 20 L 28 8 L -4 -4 Z" fill="#040b17" stroke="#0284C7" strokeWidth="0.8" />
              <path d="M -24 8 L -24 3 L 8 15 L 8 20 Z" fill="#0284C7" />
              <path d="M 8 20 L 8 15 L 28 3 L 28 8 Z" fill="#0369A1" />

              {/* 4. Main Hood & Upper Bodywork */}
              <path d="M -24 3 L 8 15 L 28 3 L -4 -9 Z" fill="url(#blueSedanGrad)" stroke="#38BDF8" strokeWidth="1.2" />

              {/* 5. 3D Slanted Greenhouse Cabin & Windshield */}
              <polygon points="-10,2 4,8 14,2 0,-4" fill="#020617" stroke="#38BDF8" strokeWidth="0.9" />
              <polygon points="-8,1 -1,4 5,-1 -2,-3" fill="#38BDF8" opacity="0.4" />

              {/* 6. Dual Projector LED Headlights */}
              <circle cx="-21" cy="4.5" r="2" fill="#FFFFFF" />
              <circle cx="-16" cy="7.5" r="2" fill="#FFFFFF" />

              {/* 7. Neon Red Brake Light Bar */}
              <line x1="22" y1="5" x2="27" y2="2" stroke="#EF4444" strokeWidth="2.5" filter="url(#softGlow)" />
            </g>
          </g>

          {/* Bay C1B (THE TARGET FOUR-WHEELER BAY - Glowing Green Target with Cones) */}
          <g onMouseEnter={() => setHoveredBay('C1B')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            {/* Bay Floor Highlight */}
            <polygon
              points="205,125 265,90 315,120 255,155"
              fill="url(#bayTargetGrad)"
              stroke="#00FFA3"
              strokeWidth="2.5"
              filter="url(#laserGlow)"
            />
            {/* Bay Label */}
            <text x="240" y="120" fill="#00FFA3" fontSize="10" fontWeight="bold" fontFamily="monospace">C1B</text>

            {/* Target Reticle Floor Ring */}
            <ellipse
              cx="260"
              cy="122"
              rx="24"
              ry="14"
              fill="none"
              stroke="#00FFA3"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              filter="url(#laserGlow)"
              className="animate-spin origin-center"
              style={{ transformOrigin: '260px 122px' }}
            />

            {/* 4 Glowing Neon Green Traffic Cones at Bay Corners */}
            <g transform="translate(205, 125)">
              <polygon points="-4,2 0,-12 4,2" fill="#00FFA3" filter="url(#softGlow)" />
              <ellipse cx="0" cy="2" rx="4" ry="2" fill="#00FFA3" />
            </g>
            <g transform="translate(265, 90)">
              <polygon points="-4,2 0,-12 4,2" fill="#00FFA3" filter="url(#softGlow)" />
              <ellipse cx="0" cy="2" rx="4" ry="2" fill="#00FFA3" />
            </g>
            <g transform="translate(315, 120)">
              <polygon points="-4,2 0,-12 4,2" fill="#00FFA3" filter="url(#softGlow)" />
              <ellipse cx="0" cy="2" rx="4" ry="2" fill="#00FFA3" />
            </g>
            <g transform="translate(255, 155)">
              <polygon points="-4,2 0,-12 4,2" fill="#00FFA3" filter="url(#softGlow)" />
              <ellipse cx="0" cy="2" rx="4" ry="2" fill="#00FFA3" />
            </g>

            {/* Floating Real Price Tag Stem & Badge for Bay C1B (₹30/hr) */}
            <g transform="translate(285, 80)">
              <line x1="0" y1="35" x2="0" y2="8" stroke="#00FFA3" strokeWidth="1.5" strokeDasharray="2 2" filter="url(#softGlow)" />
              <circle cx="0" cy="35" r="3" fill="#00FFA3" filter="url(#laserGlow)" />
              <rect x="-38" y="-12" width="76" height="20" rx="6" fill="#071828" stroke="#00FFA3" strokeWidth="1.5" filter="url(#laserGlow)" />
              <text x="0" y="2" fill="#00FFA3" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">BAY C1B ₹30/h</text>
            </g>
          </g>

          {/* Bay E1A (EV Fast Charge Bay - Occupied by 3D Emerald Sports EV) */}
          <g onMouseEnter={() => setHoveredBay('E1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="270,85 330,50 380,80 320,115"
              fill={hoveredBay === 'E1A' ? '#10B98122' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="305" y="80" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">E1A</text>
            
            {/* 3D Realistic Isometric Emerald EV in Bay E1A */}
            <g transform="translate(325, 80) rotate(-22)">
              {/* 1. Ground Contact Multi-Stage Shadow */}
              <ellipse cx="0" cy="14" rx="34" ry="12" fill="#000000" opacity="0.65" filter="url(#softGlow)" />
              <ellipse cx="0" cy="11" rx="26" ry="8" fill="#000000" opacity="0.85" />

              {/* 2. 4 3D Isometric Wheels with Glowing Emerald Calipers */}
              <g transform="translate(-18, 12)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
              </g>
              <g transform="translate(-8, 17)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
              </g>
              <g transform="translate(14, -2)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
              </g>
              <g transform="translate(24, 3)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
              </g>

              {/* 3. Lower Chassis */}
              <path d="M -24 8 L 8 20 L 28 8 L -4 -4 Z" fill="#040b17" stroke="#059669" strokeWidth="0.8" />
              <path d="M -24 8 L -24 3 L 8 15 L 8 20 Z" fill="#059669" />
              <path d="M 8 20 L 8 15 L 28 3 L 28 8 Z" fill="#064E3B" />

              {/* 4. Main Hood & Upper Bodywork */}
              <path d="M -24 3 L 8 15 L 28 3 L -4 -9 Z" fill="url(#evGreenGrad)" stroke="#00FFA3" strokeWidth="1.2" />

              {/* 5. 3D Slanted Greenhouse Cabin & Windshield */}
              <polygon points="-10,2 4,8 14,2 0,-4" fill="#020617" stroke="#00FFA3" strokeWidth="0.9" />
              <polygon points="-8,1 -1,4 5,-1 -2,-3" fill="#34D399" opacity="0.4" />

              {/* 6. Dual Projector LED Headlights */}
              <circle cx="-21" cy="4.5" r="2" fill="#FFFFFF" />
              <circle cx="-16" cy="7.5" r="2" fill="#FFFFFF" />

              {/* 7. EV Charging Pulse Halo & Neon Red Brake Bar */}
              <circle cx="18" cy="8" r="3.5" fill="#00FFA3" filter="url(#laserGlow)" className="animate-ping" />
              <line x1="22" y1="5" x2="27" y2="2" stroke="#EF4444" strokeWidth="2.5" filter="url(#softGlow)" />
            </g>
          </g>

          {/* =================================================================
              PARKING BAYS ROW B (Bottom/Right Row)
              ================================================================= */}

          {/* Bay B1A (Two-Wheeler / Open with ₹10 Price Tag) */}
          <g onMouseEnter={() => setHoveredBay('B1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="220,290 280,255 330,285 270,320"
              fill={hoveredBay === 'B1A' ? '#00D2FF33' : '#0a1832'}
              stroke="#00D2FF"
              strokeWidth="1.5"
              filter="url(#softGlow)"
            />
            <text x="260" y="285" fill="#00D2FF" fontSize="9" fontWeight="bold" fontFamily="monospace">B1A</text>

            {/* Floating Price Tag for Bay B1A (₹10/hr) */}
            <g transform="translate(290, 235)">
              <line x1="0" y1="45" x2="0" y2="8" stroke="#00D2FF" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="0" cy="45" r="3" fill="#00D2FF" />
              <rect x="-34" y="-12" width="68" height="20" rx="6" fill="#071828" stroke="#00D2FF" strokeWidth="1.5" filter="url(#softGlow)" />
              <text x="0" y="2" fill="#00D2FF" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">BIKE ₹10/h</text>
            </g>
          </g>

          {/* Bay C1C (Occupied by 3D Amber Sports Sedan) */}
          <g onMouseEnter={() => setHoveredBay('C1C')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="285,250 345,215 395,245 335,280"
              fill={hoveredBay === 'C1C' ? '#F59E0B22' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="325" y="245" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">C1C</text>
            
            {/* 3D Realistic Isometric Amber Sports Sedan in Bay C1C */}
            <g transform="translate(340, 245) rotate(-22)">
              {/* 1. Ground Contact Multi-Stage Shadow */}
              <ellipse cx="0" cy="14" rx="34" ry="12" fill="#000000" opacity="0.65" filter="url(#softGlow)" />
              <ellipse cx="0" cy="11" rx="26" ry="8" fill="#000000" opacity="0.85" />

              {/* 2. 4 3D Isometric Wheels with Glowing Amber Calipers */}
              <g transform="translate(-18, 12)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#F59E0B" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#F59E0B" />
              </g>
              <g transform="translate(-8, 17)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#F59E0B" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#F59E0B" />
              </g>
              <g transform="translate(14, -2)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#F59E0B" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#F59E0B" />
              </g>
              <g transform="translate(24, 3)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#F59E0B" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#F59E0B" />
              </g>

              {/* 3. Lower Chassis */}
              <path d="M -24 8 L 8 20 L 28 8 L -4 -4 Z" fill="#040b17" stroke="#D97706" strokeWidth="0.8" />
              <path d="M -24 8 L -24 3 L 8 15 L 8 20 Z" fill="#D97706" />
              <path d="M 8 20 L 8 15 L 28 3 L 28 8 Z" fill="#92400E" />

              {/* 4. Main Hood & Upper Bodywork */}
              <path d="M -24 3 L 8 15 L 28 3 L -4 -9 Z" fill="url(#amberSportsGrad)" stroke="#FBBF24" strokeWidth="1.2" />

              {/* 5. 3D Slanted Greenhouse Cabin & Windshield */}
              <polygon points="-10,2 4,8 14,2 0,-4" fill="#020617" stroke="#FBBF24" strokeWidth="0.9" />
              <polygon points="-8,1 -1,4 5,-1 -2,-3" fill="#FDE047" opacity="0.4" />

              {/* 6. Dual Projector LED Headlights */}
              <circle cx="-21" cy="4.5" r="2" fill="#FFFFFF" />
              <circle cx="-16" cy="7.5" r="2" fill="#FFFFFF" />

              {/* 7. Neon Red Brake Light Bar */}
              <line x1="22" y1="5" x2="27" y2="2" stroke="#EF4444" strokeWidth="2.5" filter="url(#softGlow)" />
            </g>
          </g>

          {/* Bay BUF-1A (Dedicated Emergency Buffer Slot - Occupied by 3D Executive Charcoal Sedan) */}
          <g onMouseEnter={() => setHoveredBay('BUF-1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="350,210 410,175 460,205 400,240"
              fill={hoveredBay === 'BUF-1A' ? '#47556922' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="390" y="205" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">BUF-1</text>
            
            {/* 3D Realistic Isometric Charcoal Executive Sedan in Bay BUF-1A */}
            <g transform="translate(405, 205) rotate(-22)">
              {/* 1. Ground Contact Multi-Stage Shadow */}
              <ellipse cx="0" cy="14" rx="34" ry="12" fill="#000000" opacity="0.65" filter="url(#softGlow)" />
              <ellipse cx="0" cy="11" rx="26" ry="8" fill="#000000" opacity="0.85" />

              {/* 2. 4 3D Isometric Wheels with Cyan Glowing Calipers */}
              <g transform="translate(-18, 12)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00D2FF" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00D2FF" />
              </g>
              <g transform="translate(-8, 17)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00D2FF" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00D2FF" />
              </g>
              <g transform="translate(14, -2)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00D2FF" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00D2FF" />
              </g>
              <g transform="translate(24, 3)">
                <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00D2FF" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#00D2FF" />
              </g>

              {/* 3. Lower Chassis */}
              <path d="M -24 8 L 8 20 L 28 8 L -4 -4 Z" fill="#040b17" stroke="#475569" strokeWidth="0.8" />
              <path d="M -24 8 L -24 3 L 8 15 L 8 20 Z" fill="#334155" />
              <path d="M 8 20 L 8 15 L 28 3 L 28 8 Z" fill="#1E293B" />

              {/* 4. Main Hood & Upper Bodywork */}
              <path d="M -24 3 L 8 15 L 28 3 L -4 -9 Z" fill="url(#charcoalGrad)" stroke="#94A3B8" strokeWidth="1.2" />

              {/* 5. 3D Slanted Greenhouse Cabin & Windshield */}
              <polygon points="-10,2 4,8 14,2 0,-4" fill="#020617" stroke="#94A3B8" strokeWidth="0.9" />
              <polygon points="-8,1 -1,4 5,-1 -2,-3" fill="#CBD5E1" opacity="0.35" />

              {/* 6. Dual Projector LED Headlights */}
              <circle cx="-21" cy="4.5" r="2" fill="#FFFFFF" />
              <circle cx="-16" cy="7.5" r="2" fill="#FFFFFF" />

              {/* 7. Neon Red Brake Light Bar */}
              <line x1="22" y1="5" x2="27" y2="2" stroke="#EF4444" strokeWidth="2.5" filter="url(#softGlow)" />
            </g>
          </g>

          {/* =================================================================
              5. GLOWING NEON GREEN ENTRY TRAJECTORY (SPLINE PATH)
              ================================================================= */}
          <path
            d="M 80 360 C 180 340, 240 310, 300 280 C 370 240, 400 210, 350 175 C 310 145, 260 145, 220 140"
            fill="none"
            stroke="#00FFA3"
            strokeWidth="8"
            strokeOpacity="0.25"
            filter="url(#laserGlow)"
            strokeLinecap="round"
          />

          <path
            d="M 80 360 C 180 340, 240 310, 300 280 C 370 240, 400 210, 350 175 C 310 145, 260 145, 220 140"
            fill="none"
            stroke="url(#neonGreenPath)"
            strokeWidth="3.5"
            strokeDasharray="14 6"
            className="animate-road-flow-fast"
            filter="url(#laserGlow)"
            strokeLinecap="round"
          />

          {/* Entrance Sensor Gate Post (Left) */}
          <g transform="translate(75, 360)">
            <line x1="0" y1="0" x2="0" y2="-24" stroke="#00D2FF" strokeWidth="2.5" />
            <circle cx="0" cy="-24" r="3.5" fill="#00FFA3" filter="url(#laserGlow)" />
            <line x1="0" y1="-12" x2="25" y2="-4" stroke="#FF3366" strokeWidth="2" strokeDasharray="3 2" />
          </g>

          {/* =================================================================
              6. 3D REALISTIC ISOMETRIC VEHICLE ENGINE
              ================================================================= */}
          <g transform={`translate(${car.x}, ${car.y}) rotate(${car.angle})`}>
            {/* 1. Ground Contact Shadow */}
            <ellipse cx="0" cy="14" rx="34" ry="12" fill="#000000" opacity="0.65" filter="url(#laserGlow)" />

            {/* 2. 3D Isometric Wheels (Tires with glowing rims) */}
            {/* Front-Left Wheel */}
            <g transform="translate(-18, 12)">
              <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
            </g>
            {/* Front-Right Wheel */}
            <g transform="translate(-8, 17)">
              <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
            </g>
            {/* Rear-Left Wheel */}
            <g transform="translate(14, -2)">
              <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
            </g>
            {/* Rear-Right Wheel */}
            <g transform="translate(24, 3)">
              <rect x="-4" y="-3" width="8" height="6" rx="2" fill="#0b0f19" stroke="#00FFA3" strokeWidth="1" />
              <circle cx="0" cy="0" r="1.5" fill="#00FFA3" />
            </g>

            {/* 3. Lower Chassis (Side extrusion for 3D body height) */}
            <path
              d="M -24 8 L 8 20 L 28 8 L -4 -4 Z"
              fill="#040b17"
              stroke="#00D2FF"
              strokeWidth="0.8"
            />
            <path
              d="M -24 8 L -24 3 L 8 15 L 8 20 Z"
              fill="#0284C7"
            />
            <path
              d="M 8 20 L 8 15 L 28 3 L 28 8 Z"
              fill="#0369A1"
            />

            {/* 4. Main Hood & Upper Bodywork (Smooth Sport Profile) */}
            <path
              d="M -24 3 L 8 15 L 28 3 L -4 -9 Z"
              fill="url(#carBodyGrad)"
              stroke="#00FFA3"
              strokeWidth="1.2"
            />

            {/* 5. 3D Slanted Greenhouse Cabin & Windshield */}
            <polygon
              points="-10,2 4,8 14,2 0,-4"
              fill="#020617"
              stroke="#38BDF8"
              strokeWidth="0.9"
            />
            {/* Sky Reflection on Glass */}
            <polygon
              points="-8,1 -1,4 5,-1 -2,-3"
              fill="#38BDF8"
              opacity="0.4"
            />

            {/* 6. Dual Projector LED Headlights & Volumetric Beams */}
            <circle cx="-21" cy="4.5" r="2" fill="#FFFFFF" filter="url(#laserGlow)" />
            <circle cx="-16" cy="7.5" r="2" fill="#FFFFFF" filter="url(#laserGlow)" />
            <polygon
              points="-21,4.5 -75,-15 -55,25 -16,7.5"
              fill="#00FFA3"
              opacity="0.25"
            />

            {/* 7. Neon Red Brake Light Bar */}
            <line x1="22" y1="5" x2="27" y2="2" stroke="#EF4444" strokeWidth="2.5" filter="url(#softGlow)" />
          </g>

        </svg>
      </div>

      {/* Bottom Live Telemetry HUD Bar */}
      <div className="relative z-20 flex items-center justify-between text-[11px] font-mono text-gray-200 bg-[#071022]/95 border border-[#00D2FF]/30 px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg pointer-events-none">
        <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
          WebSocket: Live Sync
        </span>
        <span className="text-gray-400 hidden sm:inline">
          Latency: <strong className="text-[#00FFA3]">12ms</strong>
        </span>
        <span className="text-[#00FFA3] font-bold">
          3 Floors Connected
        </span>
      </div>

    </div>
  );
}
