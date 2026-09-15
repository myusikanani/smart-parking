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
          
          {/* Bay C1A (Four-Wheeler - Occupied by Aerodynamic Blue Sedan) */}
          <g onMouseEnter={() => setHoveredBay('C1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="140,165 200,130 250,160 190,195"
              fill={hoveredBay === 'C1A' ? '#00D2FF22' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="175" y="160" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">C1A</text>
            
            {/* Sleek Curved Luxury Sedan in C1A */}
            <g transform="translate(195, 160) rotate(-22)">
              <ellipse cx="0" cy="5" rx="26" ry="10" fill="#000000" opacity="0.6" />
              {/* Tires */}
              <rect x="-18" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#00D2FF" strokeWidth="0.6" />
              <rect x="11" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#00D2FF" strokeWidth="0.6" />
              {/* Curvature Body */}
              <path
                d="M -24 3 C -26 -1, -20 -7, -8 -9 C 3 -10, 15 -6, 23 1 C 26 4, 21 11, 14 12 C 0 14, -15 12, -24 3 Z"
                fill="url(#blueSedanGrad)"
                stroke="#38BDF8"
                strokeWidth="1"
              />
              {/* Tinted Roof Glass */}
              <path
                d="M -12 -1 C -14 -6, -5 -7, 1 -7 C 9 -7, 14 -4, 12 0 C 6 3, -3 3, -12 -1 Z"
                fill="#030814"
                stroke="#38BDF8"
                strokeWidth="0.6"
              />
              {/* LED Headlight Beam */}
              <circle cx="-22" cy="1" r="1.8" fill="#FFFFFF" />
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

          {/* Bay E1A (EV Fast Charge Bay - Occupied by Emerald Sports EV) */}
          <g onMouseEnter={() => setHoveredBay('E1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="270,85 330,50 380,80 320,115"
              fill={hoveredBay === 'E1A' ? '#10B98122' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="305" y="80" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">E1A</text>
            
            {/* Sleek Curved EV in E1A */}
            <g transform="translate(325, 80) rotate(-22)">
              <ellipse cx="0" cy="5" rx="26" ry="10" fill="#000000" opacity="0.6" />
              {/* Tires */}
              <rect x="-18" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#00FFA3" strokeWidth="0.6" />
              <rect x="11" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#00FFA3" strokeWidth="0.6" />
              {/* Body */}
              <path
                d="M -24 3 C -26 -1, -20 -7, -8 -9 C 3 -10, 15 -6, 23 1 C 26 4, 21 11, 14 12 C 0 14, -15 12, -24 3 Z"
                fill="url(#evGreenGrad)"
                stroke="#00FFA3"
                strokeWidth="1"
              />
              {/* Panoramic Roof */}
              <path
                d="M -12 -1 C -14 -6, -5 -7, 1 -7 C 9 -7, 14 -4, 12 0 C 6 3, -3 3, -12 -1 Z"
                fill="#030814"
                stroke="#00FFA3"
                strokeWidth="0.6"
              />
              {/* Green EV Charging Halo */}
              <circle cx="15" cy="5" r="3" fill="#00FFA3" filter="url(#laserGlow)" />
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

          {/* Bay C1C (Occupied by Amber Sports Coupe) */}
          <g onMouseEnter={() => setHoveredBay('C1C')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="285,250 345,215 395,245 335,280"
              fill={hoveredBay === 'C1C' ? '#F59E0B22' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="325" y="245" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">C1C</text>
            
            {/* Amber Sports Coupe */}
            <g transform="translate(340, 245) rotate(-22)">
              <ellipse cx="0" cy="5" rx="26" ry="10" fill="#000000" opacity="0.6" />
              <rect x="-18" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#F59E0B" strokeWidth="0.6" />
              <rect x="11" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#F59E0B" strokeWidth="0.6" />
              <path
                d="M -24 3 C -26 -1, -20 -7, -8 -9 C 3 -10, 15 -6, 23 1 C 26 4, 21 11, 14 12 C 0 14, -15 12, -24 3 Z"
                fill="url(#amberSportsGrad)"
                stroke="#FBBF24"
                strokeWidth="1"
              />
              <path
                d="M -12 -1 C -14 -6, -5 -7, 1 -7 C 9 -7, 14 -4, 12 0 C 6 3, -3 3, -12 -1 Z"
                fill="#030814"
                stroke="#FBBF24"
                strokeWidth="0.6"
              />
            </g>
          </g>

          {/* Bay BUF-1A (Dedicated Emergency Buffer Slot - Occupied by Executive Charcoal Sedan) */}
          <g onMouseEnter={() => setHoveredBay('BUF-1A')} onMouseLeave={() => setHoveredBay(null)} className="cursor-pointer">
            <polygon
              points="350,210 410,175 460,205 400,240"
              fill={hoveredBay === 'BUF-1A' ? '#47556922' : '#0a172e'}
              stroke="#00D2FF"
              strokeWidth="1.2"
              strokeOpacity="0.4"
            />
            <text x="390" y="205" fill="#00D2FF" fontSize="9" fontFamily="monospace" opacity="0.6">BUF-1</text>
            
            <g transform="translate(405, 205) rotate(-22)">
              <ellipse cx="0" cy="5" rx="26" ry="10" fill="#000000" opacity="0.6" />
              <rect x="-18" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#00D2FF" strokeWidth="0.6" />
              <rect x="11" y="4" width="7" height="4" rx="1.5" fill="#0f172a" stroke="#00D2FF" strokeWidth="0.6" />
              <path
                d="M -24 3 C -26 -1, -20 -7, -8 -9 C 3 -10, 15 -6, 23 1 C 26 4, 21 11, 14 12 C 0 14, -15 12, -24 3 Z"
                fill="#334155"
                stroke="#64748B"
                strokeWidth="1"
              />
              <path
                d="M -12 -1 C -14 -6, -5 -7, 1 -7 C 9 -7, 14 -4, 12 0 C 6 3, -3 3, -12 -1 Z"
                fill="#030814"
                stroke="#64748B"
                strokeWidth="0.6"
              />
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
              6. SLEEK ISOMETRIC LUXURY SPORTS CAR (AERODYNAMIC CURVED PROFILE)
              ================================================================= */}
          <g transform={`translate(${car.x}, ${car.y}) rotate(${car.angle})`}>
            {/* Ground Contact Multi-Stage Drop Shadow */}
            <ellipse cx="0" cy="8" rx="36" ry="14" fill="#000000" opacity="0.75" filter="url(#softGlow)" />
            <ellipse cx="0" cy="5" rx="30" ry="10" fill="#000000" opacity="0.9" />

            {/* Glowing Neon Underglow */}
            <ellipse cx="0" cy="0" rx="34" ry="14" fill="#00FFA3" opacity="0.45" filter="url(#laserGlow)" />

            {/* 4 Visible Isometric Alloy Wheels/Tires with Glowing Calipers */}
            <rect x="-24" y="6" width="10" height="5" rx="2" fill="#0f172a" stroke="#00FFA3" strokeWidth="0.8" />
            <rect x="14" y="6" width="10" height="5" rx="2" fill="#0f172a" stroke="#00FFA3" strokeWidth="0.8" />
            <rect x="-22" y="-12" width="9" height="4" rx="1.5" fill="#0f172a" stroke="#00D2FF" strokeWidth="0.6" opacity="0.8" />
            <rect x="13" y="-10" width="9" height="4" rx="1.5" fill="#0f172a" stroke="#00D2FF" strokeWidth="0.6" opacity="0.8" />

            {/* Aerodynamic Luxury Body Profile (Smooth Cubic Bezier Curves) */}
            <path
              d="M -32 4 C -34 -2, -26 -10, -10 -12 C 4 -13, 20 -8, 30 2 C 34 6, 28 14, 18 16 C 0 18, -20 16, -32 4 Z"
              fill="url(#carBodyGrad)"
              stroke="#00FFA3"
              strokeWidth="1.2"
            />

            {/* Tinted Panoramic Roof & Windshield with Cyan Sky Reflection */}
            <path
              d="M -16 -2 C -18 -8, -6 -10, 2 -10 C 12 -10, 18 -6, 16 0 C 8 4, -4 4, -16 -2 Z"
              fill="#040d1a"
              stroke="#38BDF8"
              strokeWidth="0.9"
            />

            {/* Front LED Projector Headlights with Light Cone Beam */}
            <circle cx="-30" cy="1" r="2.5" fill="#FFFFFF" filter="url(#laserGlow)" />
            <circle cx="-25" cy="7" r="2" fill="#FFFFFF" filter="url(#laserGlow)" />
            <path d="M -30 1 L -90 -20 L -80 25 Z" fill="#00FFA3" opacity="0.28" />

            {/* Rear Taillight Light Strip */}
            <path d="M 24 6 C 28 8, 29 11, 25 13" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" filter="url(#softGlow)" />
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
