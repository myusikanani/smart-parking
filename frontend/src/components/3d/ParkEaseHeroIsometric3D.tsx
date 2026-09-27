import { useState, useEffect, useRef, useMemo, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
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

// ---------------------------------------------------------------------------
// 3D RADAR SWEEP SCAN VEHICLE SCENE (Three.js WebGL Engine)
// ---------------------------------------------------------------------------

/**
 * 3D Isometric Cyberpunk Vehicle with dynamic neon headlights, taillights,
 * metallic chassis, and suspension float.
 */
const RadarCarMesh: FC<{ activeStepIndex: number; isPlaying: boolean }> = ({ activeStepIndex, isPlaying }) => {
  const groupRef = useRef<THREE.Group>(null);
  const chassisColor = useMemo(() => {
    if (activeStepIndex === 0) return '#084b63'; // Scanning cyan-teal
    if (activeStepIndex === 1) return '#0d5c58'; // Clearance emerald-teal
    if (activeStepIndex === 2) return '#0a5270'; // Spline navigation cyan
    return '#0d634f'; // Docked mint-green
  }, [activeStepIndex]);

  // Gentle idle suspension / wheel turn
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    if (isPlaying) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.45, 0]}>
      {/* 1. Main Car Chassis (Lower Body) */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.44, 2.9]} />
        <meshStandardMaterial
          color={chassisColor}
          metalness={0.7}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 2. Aerodynamic Roof / Cabin Glass (Dark Tinted Midnight) */}
      <mesh position={[0, 0.62, -0.15]} castShadow>
        <boxGeometry args={[1.25, 0.38, 1.65]} />
        <meshStandardMaterial
          color="#030d17"
          metalness={0.95}
          roughness={0.1}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* 3. Front Headlights (Neon Cyan Glow) */}
      <mesh position={[-0.52, 0.24, 1.44]}>
        <boxGeometry args={[0.28, 0.12, 0.06]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#00D2FF"
          emissiveIntensity={2.5}
        />
      </mesh>
      <mesh position={[0.52, 0.24, 1.44]}>
        <boxGeometry args={[0.28, 0.12, 0.06]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#00D2FF"
          emissiveIntensity={2.5}
        />
      </mesh>

      {/* 4. Rear Full-Width Neon Taillight Bar (Red / Electric Amber) */}
      <mesh position={[0, 0.26, -1.44]}>
        <boxGeometry args={[1.36, 0.08, 0.06]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ff2244"
          emissiveIntensity={3.2}
        />
      </mesh>

      {/* 5. Four Tires (Cylinders) */}
      {[
        [-0.75, 0.02, 0.85],  // Front Left
        [0.75, 0.02, 0.85],   // Front Right
        [-0.75, 0.02, -0.85], // Rear Left
        [0.75, 0.02, -0.85],  // Rear Right
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.18, 20]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.4} />
          </mesh>
          {/* Wheel Rims (Glowing Cyan Hubcap) */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[pos[0] > 0 ? 0.095 : -0.095, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#06b6d4"
              emissiveIntensity={1.2}
              metalness={0.9}
            />
          </mesh>
        </group>
      ))}

      {/* 6. Vehicle Underglow Neon Ambient Point Light */}
      <pointLight
        position={[0, -0.1, 0]}
        intensity={2.8}
        distance={4.5}
        color={activeStepIndex === 3 ? '#00FFA3' : '#00D2FF'}
      />
    </group>
  );
};

/**
 * Vertical 360° Rotating Radar Slicing Scan Plane with Glowing Perimeter
 */
const RotatingScanPlane: FC<{ isPlaying: boolean; speed?: number }> = ({ isPlaying, speed = 1.6 }) => {
  const planeRef = useRef<THREE.Group>(null);
  const pulseDiscRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!planeRef.current) return;
    const t = clock.getElapsedTime();
    if (isPlaying) {
      planeRef.current.rotation.y = t * speed;
    }
    if (pulseDiscRef.current) {
      pulseDiscRef.current.scale.setScalar(1 + Math.sin(t * 4) * 0.03);
    }
  });

  return (
    <group ref={planeRef} position={[0, 0.65, 0]}>
      {/* 1. Main Vertical Holographic Slicing Disc (Semi-transparent Radar Plane) */}
      <mesh ref={pulseDiscRef} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.04, 3.2]} />
        <meshBasicMaterial
          color="#00FFA3"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Slicing Ellipse / Vertical Fan Plane */}
      <mesh rotation={[0, 0, 0]}>
        <circleGeometry args={[2.0, 48]} />
        <meshStandardMaterial
          color="#00D2FF"
          transparent
          opacity={0.28}
          roughness={0.1}
          metalness={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Bright Laser Perimeter Line */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[1.96, 2.02, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

/**
 * Floor Radial Radar Target Rings & Expanding Ripple Pulse Waves
 */
const RadialRadarFloor: FC<{ isPlaying: boolean; activeStepIndex: number }> = ({ isPlaying, activeStepIndex }) => {
  const ripple1Ref = useRef<THREE.Mesh>(null);
  const ripple2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!isPlaying) return;
    const t = clock.getElapsedTime();

    // Pulse Wave 1 (Looping 0 to 1)
    if (ripple1Ref.current) {
      const p1 = (t * 0.7) % 1;
      ripple1Ref.current.scale.setScalar(1 + p1 * 0.85);
      const mat = ripple1Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (1 - p1) * 0.55);
    }

    // Pulse Wave 2 (Offset by 0.5s)
    if (ripple2Ref.current) {
      const p2 = (t * 0.7 + 0.5) % 1;
      ripple2Ref.current.scale.setScalar(1 + p2 * 0.85);
      const mat = ripple2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (1 - p2) * 0.55);
    }
  });

  const ringColor = activeStepIndex === 3 ? '#00FFA3' : '#00D2FF';

  return (
    <group position={[0, 0.02, 0]}>
      {/* 1. Main Static Target Boundary Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[2.3, 2.38, 64]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Inner Concentric Radar Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.34, 48]} />
        <meshBasicMaterial
          color={ringColor}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Expanding Ripple Wave 1 */}
      <mesh ref={ripple1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.32, 2.38, 64]} />
        <meshBasicMaterial
          color="#00FFA3"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Expanding Ripple Wave 2 */}
      <mesh ref={ripple2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.32, 2.38, 64]} />
        <meshBasicMaterial
          color="#00D2FF"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 5. Radar Target Disc Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[2.32, 48]} />
        <meshBasicMaterial
          color="#041a29"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * Isometric Cyber Grid Floor & Neon Coordinate Markers
 */
const IsometricCyberFloor: FC = () => {
  return (
    <group position={[0, -0.01, 0]}>
      {/* Base Dark Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial
          color="#020813"
          roughness={0.85}
          metalness={0.3}
        />
      </mesh>

      {/* High-Tech Isometric Grid Helper */}
      <gridHelper
        args={[24, 24, '#00D2FF', '#08253d']}
        position={[0, 0.005, 0]}
      />
    </group>
  );
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT: ParkEaseHeroIsometric3D
// ---------------------------------------------------------------------------

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
      {/* ========================================================================= */}
      {/* 1. REAL-TIME 3D RADAR SCANNER WEBGL CANVAS LAYER */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
        <Canvas
          shadows
          camera={{ position: [5.2, 3.8, 5.2], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full"
        >
          {/* Ambient & Directional Lighting */}
          <ambientLight intensity={0.8} color="#93c5fd" />
          <directionalLight
            position={[8, 12, 6]}
            intensity={1.8}
            color="#ffffff"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight
            position={[-8, 6, -6]}
            intensity={0.9}
            color="#00FFA3"
          />

          {/* 3D Scene Elements */}
          <Float speed={isPlaying ? 1.5 : 0} rotationIntensity={0.1} floatIntensity={0.2}>
            {/* Cyberpunk Isometric Vehicle */}
            <RadarCarMesh activeStepIndex={activeStepIndex} isPlaying={isPlaying} />

            {/* 360° Rotating Vertical Slicing Radar Scan Plane */}
            <RotatingScanPlane isPlaying={isPlaying} speed={1.8} />

            {/* Radial Radar Target Floor Rings & Expanding Pulse Waves */}
            <RadialRadarFloor isPlaying={isPlaying} activeStepIndex={activeStepIndex} />
          </Float>

          {/* Isometric Cyber Grid Floor */}
          <IsometricCyberFloor />
        </Canvas>

        {/* Cinematic Vignette & Cyber Glow Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/75 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/75 via-transparent to-[#030712]/75 pointer-events-none" />

        {/* Floating Holographic LiDAR Crosshair Particles */}
        <div className="absolute left-[35%] top-[45%] w-24 h-24 border border-cyan-400/25 rounded-full pointer-events-none animate-pulse" />
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP HUD HEADER: TELEMETRY & LIVE RADAR STATUS */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 3. CENTER HOLOGRAPHIC STATUS CARD (ACTIVE ACTION SEQUENCE) */}
      {/* ========================================================================= */}
      <div className="relative z-20 my-auto py-4 flex flex-col items-center justify-center text-center pointer-events-none">
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

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION TIMELINE CONTROLLER */}
      {/* ========================================================================= */}
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
