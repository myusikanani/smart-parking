import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import {
  HiOutlineQrCode,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

export default function ParkEaseHeroIsometric3D() {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      id: 0,
      badge: '01. SCAN & VERIFY',
      title: 'Holographic Gate Scan',
      sub: 'ANPR + QR Barrier Clearance (0.2s)',
      status: 'AUTHENTICATED // GJ-01-AB-1234',
      statusColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/40',
      beamActive: true,
      gateOpen: false,
      carState: 'at_gate',
    },
    {
      id: 1,
      badge: '02. BARRIER LIFT',
      title: 'Auto Barrier Release',
      sub: 'Zero-Stop Contactless Entry',
      status: 'GATE OPEN // PROCEED TO LANE',
      statusColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40',
      beamActive: false,
      gateOpen: true,
      carState: 'entering',
    },
    {
      id: 2,
      badge: '03. SPLINE GUIDANCE',
      title: 'Luminous Path Navigation',
      sub: 'Neon Trail Directs to Bay V-04',
      status: 'GUIDING TO BAY #V-04',
      statusColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-400/50',
      beamActive: false,
      gateOpen: true,
      carState: 'navigating',
    },
    {
      id: 3,
      badge: '04. PARK & DOCK',
      title: 'Docked in Reserved Bay',
      sub: 'EV Fast Charging & Security Sync',
      status: 'BAY #V-04 // DOCKED & SECURED',
      statusColor: 'text-[#00FFA3] bg-emerald-950/90 border-[#00FFA3]/50',
      beamActive: false,
      gateOpen: true,
      carState: 'parked',
    },
  ];

  // 60FPS Continuous Progress Loop (8 seconds total cycle)
  useEffect(() => {
    if (!isPlaying) return;
    const CYCLE_DURATION = 8000;
    let animationFrameId: number;
    let startTime = performance.now() - progress * CYCLE_DURATION;

    const tick = (now: number) => {
      const elapsed = (now - startTime) % CYCLE_DURATION;
      const p = elapsed / CYCLE_DURATION;
      setProgress(p);

      if (p < 0.25) setActiveStepIndex(0);
      else if (p < 0.50) setActiveStepIndex(1);
      else if (p < 0.75) setActiveStepIndex(2);
      else setActiveStepIndex(3);

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, progress]);

  const activeStep = steps[activeStepIndex];

  return (
    <div
      className={`relative w-full h-full min-h-[460px] lg:min-h-[540px] max-w-[640px] mx-auto rounded-3xl overflow-hidden transition-all duration-300 border flex flex-col justify-between p-4 sm:p-5 select-none ${
        isDark
          ? 'bg-[#030712] border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.2)] text-white'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500/40 shadow-[0_15px_40px_rgba(6,182,212,0.2)] text-white'
      }`}
    >
      {/* 1. BACKGROUND RENDER LAYER (FUTURISTIC ISOMETRIC 3D SMART ENTRANCE) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/hero_smart_parking_isometric.jpg"
          alt="Futuristic Isometric Smart Parking Visualizer"
          className="w-full h-full object-cover object-center opacity-90 transition-transform duration-1000 scale-100"
        />
        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/80 via-transparent to-[#030712]/80" />

        {/* Dynamic Holographic Scan Beam Animation */}
        {activeStep.beamActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="absolute left-[28%] top-[42%] w-48 h-36 bg-gradient-to-r from-cyan-400/20 via-cyan-400/40 to-transparent blur-md transform -rotate-12 pointer-events-none"
          />
        )}

        {/* Luminous Neon Spline Trail Animation Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="neonSplineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#00D2FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
            </linearGradient>
            <filter id="splineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dynamic Spline Pulse */}
          <path
            d="M 330 450 C 450 430, 600 370, 660 300 C 720 230, 800 240, 820 180"
            fill="none"
            stroke="url(#neonSplineGrad)"
            strokeWidth={activeStepIndex >= 1 ? '5' : '1'}
            strokeDasharray={activeStepIndex >= 2 ? 'none' : '12 8'}
            strokeDashoffset={-progress * 150}
            filter="url(#splineGlow)"
            opacity={activeStepIndex >= 1 ? 0.95 : 0.25}
            className="transition-all duration-700"
          />
        </svg>
      </div>

      {/* 2. TOP HUD HEADER: TELEMETRY & LIVE RADAR STATUS */}
      <div className="relative z-20 flex flex-wrap items-start justify-between gap-3 pointer-events-none">
        {/* Live Radar Allocation Pill */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-center gap-2 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-cyan-400/40 bg-slate-900/90 text-cyan-300 text-[11px] font-mono shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-ping" />
            <span className="font-extrabold tracking-wide uppercase">AUTONOMOUS GATE // FLOOR 1</span>
          </div>
          <div className="text-[10px] font-mono text-gray-300 pl-2 flex items-center gap-1.5">
            <span>Target Bay:</span>
            <strong className="text-[#00FFA3] font-bold bg-[#00FFA3]/10 px-1.5 py-0.5 rounded border border-[#00FFA3]/30">
              #V-04 Reserved
            </strong>
          </div>
        </div>

        {/* Live Rates & Telemetry Pills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="backdrop-blur-xl bg-slate-900/90 border border-emerald-500/40 px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
            <HiOutlineSparkles className="w-3.5 h-3.5 text-[#00FFA3]" />
            <span>Four-Wheeler: <strong>₹30/hr</strong></span>
          </div>
          <div className="backdrop-blur-xl bg-slate-900/90 border border-cyan-500/40 px-3 py-1 rounded-xl shadow-lg flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
            <HiOutlineBolt className="w-3.5 h-3.5 text-cyan-400" />
            <span>EV Fast Charge: <strong>₹25/hr</strong></span>
          </div>
        </div>
      </div>

      {/* 3. CENTER HOLOGRAPHIC STATUS CARD (ACTIVE ACTION SEQUENCE) */}
      <div className="relative z-20 my-auto py-8 flex flex-col items-center justify-center text-center pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep.id}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -15 }}
            transition={{ duration: 0.35 }}
            className="backdrop-blur-2xl bg-slate-950/85 border border-cyan-400/50 p-4 sm:p-5 rounded-2xl shadow-[0_0_35px_rgba(0,210,255,0.35)] max-w-sm w-full space-y-2 pointer-events-auto"
          >
            {/* Step Tag */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {activeStep.badge}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                Step {activeStepIndex + 1} of 4
              </span>
            </div>

            {/* Title & Sub */}
            <div>
              <h4 className="text-base font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                {activeStepIndex === 0 && <HiOutlineQrCode className="w-5 h-5 text-cyan-400 animate-bounce" />}
                {activeStepIndex === 1 && <HiOutlineShieldCheck className="w-5 h-5 text-emerald-400" />}
                {activeStepIndex === 2 && <HiOutlineSparkles className="w-5 h-5 text-cyan-300" />}
                {activeStepIndex === 3 && <HiOutlineBolt className="w-5 h-5 text-[#00FFA3]" />}
                <span>{activeStep.title}</span>
              </h4>
              <p className="text-xs text-gray-300 font-sans mt-0.5">{activeStep.sub}</p>
            </div>

            {/* Live Terminal Status Badge */}
            <div className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center justify-center gap-1.5 ${activeStep.statusColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              <span>{activeStep.status}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. BOTTOM ACTION TIMELINE CONTROLLER */}
      <div className="relative z-20 backdrop-blur-xl bg-slate-950/90 border border-cyan-500/30 p-3 rounded-2xl shadow-2xl space-y-2.5">
        {/* Sequence Progress Bar */}
        <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-[#00FFA3] to-cyan-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Step Buttons & Play/Pause Controls */}
        <div className="flex items-center justify-between gap-2">
          {/* 4 Step Selector Buttons */}
          <div className="grid grid-cols-4 gap-1 sm:gap-2 flex-1">
            {steps.map((s, idx) => {
              const active = idx === activeStepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveStepIndex(idx);
                    setProgress(idx * 0.25);
                  }}
                  className={`px-1.5 sm:px-2 py-1.5 rounded-xl text-[9px] sm:text-[10px] font-mono font-bold transition-all border text-center truncate ${
                    active
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400'
                      : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  <span className="hidden sm:inline">{s.badge.split(' ')[1]}</span>
                  <span className="sm:hidden">{idx + 1}. {s.badge.split(' ')[1].slice(0, 4)}</span>
                </button>
              );
            })}
          </div>

          {/* Play/Pause & Reset Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all text-xs"
              title={isPlaying ? 'Pause Animation' : 'Play Animation'}
            >
              {isPlaying ? <HiOutlinePause className="w-4 h-4" /> : <HiOutlinePlay className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setProgress(0);
                setActiveStepIndex(0);
              }}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all text-xs"
              title="Restart Sequence"
            >
              <HiOutlineArrowPath className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Footer Telemetry */}
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> WebSocket: Live Sync
          </span>
          <span>Barrier Latency: <strong className="text-cyan-300">12ms</strong></span>
          <span className="hidden sm:inline text-gray-400">3 Floors Connected</span>
        </div>
      </div>
    </div>
  );
}
