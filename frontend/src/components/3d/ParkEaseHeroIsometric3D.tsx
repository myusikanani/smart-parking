import { useRef, type FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';
import { useTheme } from '../../context/ThemeContext';
import { HiOutlineVideoCamera, HiOutlineSparkles } from 'react-icons/hi2';

// ---------------------------------------------------------------------------
// 3D SECURITY-STYLE ANPR SURVEILLANCE & GATE SCENE CONTENT
// ---------------------------------------------------------------------------
function SecurityGateSceneContent() {
  const cctvRef = useRef<THREE.Group>(null);
  const laserRef = useRef<THREE.Mesh>(null);
  const barrierArmRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Sweeping motion for CCTV Surveillance Camera (Smooth pan)
    if (cctvRef.current) {
      cctvRef.current.rotation.y = Math.sin(t * 1.2) * 0.45;
    }

    // 2. Continuous rotating laser cone scanner
    if (laserRef.current) {
      laserRef.current.rotation.y = t * 1.6;
    }

    // 3. Smart Gate Barrier periodic gentle clearance lift
    if (barrierArmRef.current) {
      const liftCycle = (Math.sin(t * 0.8) + 1) / 2; // 0 to 1
      barrierArmRef.current.rotation.z = (liftCycle > 0.4 ? (liftCycle - 0.4) / 0.6 : 0) * (Math.PI / 2.5);
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[12, 22, 16]} intensity={1.8} castShadow />
      <pointLight position={[0, 8, 0]} intensity={3} color="#06b6d4" />
      <pointLight position={[0, 4, 4]} intensity={2.2} color="#ef4444" />
      <pointLight position={[-4, 3, 2]} intensity={2.0} color="#10b981" />

      {/* ASPHALT ROAD ENTRY BAY */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[26, 22]} />
        <meshStandardMaterial color="#090d16" roughness={0.8} />
      </mesh>

      {/* DRIVING LANE ASPHALT STRIP */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[5.2, 22]} />
        <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.7} />
      </mesh>

      {/* ROAD LANE DASHED MARKINGS */}
      {[-8, -4, 0, 4, 8].map((z, idx) => (
        <group key={idx}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.4, 0.02, z]}>
            <planeGeometry args={[0.12, 2.2]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.4, 0.02, z]}>
            <planeGeometry args={[0.12, 2.2]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* GROUND HIGH-TECH CYBER GRID ACCENT */}
      <gridHelper args={[24, 24, '#06b6d4', '#1e293b']} position={[0, 0.005, 0]} />

      {/* REALISTIC 3D CYBERPUNK TESLA VEHICLE UNDER ANPR SCAN */}
      <group position={[0, 0.05, 0.8]}>
        <RealisticVehicle
          type="tesla"
          color="#06b6d4"
          headlightsOn={true}
          isDriving={false}
        />
      </group>

      {/* SMART GATE BARRIER POST & ANIMATED BARRIER ARM */}
      <group position={[3.2, 0, 0]}>
        {/* Gate Housing Pillar */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.7, 2.4, 0.7]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Glowing Indicator Ring on Post */}
        <mesh position={[0, 2.2, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.15, 24]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        {/* Moving Barrier Arm (Pivoting at pivot point) */}
        <group position={[-0.35, 1.8, 0]}>
          <mesh ref={barrierArmRef} position={[-2.3, 0, 0]}>
            <boxGeometry args={[4.6, 0.14, 0.14]} />
            <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* 3D HIGH-TECH CCTV SURVEILLANCE CAMERA MODEL (Security Dashboard Style) */}
      <group position={[-4.5, 4.2, 3.8]} rotation={[0, Math.PI / 4, 0]}>
        {/* Camera Mount Pole */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 3.2, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Sweeping Camera Body */}
        <group ref={cctvRef} position={[0, 2.2, 0]}>
          <mesh rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.65, 0.55, 1.45]} />
            <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Camera Lens */}
          <mesh position={[0, -0.05, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.35, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} />
          </mesh>

          {/* Blinking Red Surveillance Recording LED */}
          <mesh position={[0.22, 0.18, 0.76]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Sweeping Cyan Laser Scanner Cone (Scanning the car & lane) */}
          <mesh ref={laserRef} position={[0, -2.4, 2.4]} rotation={[0.42, 0, 0]}>
            <coneGeometry args={[2.8, 5.5, 32]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.22} wireframe />
          </mesh>
        </group>
      </group>

      {/* INTERACTIVE 360 ORBIT CONTROLS */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
        autoRotate={true}
        autoRotateSpeed={0.9}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT: ParkEaseHeroIsometric3D
// ---------------------------------------------------------------------------
export const ParkEaseHeroIsometric3D: FC = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`relative w-full h-[440px] sm:h-[480px] lg:h-[520px] max-w-[640px] mx-auto rounded-3xl overflow-hidden transition-all duration-300 border flex flex-col justify-between select-none ${
        isDark
          ? 'bg-[#030712] border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.2)] text-white'
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500/40 shadow-[0_15px_40px_rgba(6,182,212,0.2)] text-white'
      }`}
    >
      {/* 3D WEBGL CANVAS LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto">
        <Canvas
          shadows
          camera={{ position: [0, 9.5, 15.5], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <SecurityGateSceneContent />
        </Canvas>

        {/* Soft Cyber Ambient Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/90 via-transparent to-[#030712]/60 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/60 via-transparent to-[#030712]/60 pointer-events-none" />
      </div>

      {/* TOP MINIMAL STATUS BADGE (NO CLUNKY PLATES) */}
      <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-cyan-400/40 bg-slate-900/85 text-cyan-300 text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.3)] pointer-events-auto">
          <HiOutlineVideoCamera className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wide uppercase">AI GATE SURVEILLANCE // ACTIVE</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
        </div>

        <div className="hidden sm:flex items-center gap-1.5 backdrop-blur-xl px-3 py-1 rounded-full border border-emerald-500/30 bg-slate-900/80 text-emerald-300 text-[11px] font-mono pointer-events-auto">
          <HiOutlineSparkles className="w-3.5 h-3.5 text-[#00FFA3]" />
          <span>ANPR + Dynamic QR Scanner</span>
        </div>
      </div>

      {/* BOTTOM SUBTLE INTERACTIVE HINT */}
      <div className="relative z-10 p-4 flex items-center justify-between text-[11px] font-mono text-gray-400 pointer-events-none">
        <span className="text-gray-400/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Interactive 3D • Drag to rotate 360°</span>
        </span>
        <span className="text-cyan-400 font-semibold bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
          60 FPS WebGL
        </span>
      </div>
    </div>
  );
};

export default ParkEaseHeroIsometric3D;
