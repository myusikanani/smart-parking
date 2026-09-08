import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

function SecuritySceneContent() {
  const cctvRef = useRef<THREE.Group>(null);
  const laserRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Sweeping motion for CCTV Surveillance Camera
    if (cctvRef.current) {
      cctvRef.current.rotation.y = Math.sin(t * 1.2) * 0.4;
    }

    // Sweeping laser scanner light cone opacity & scale
    if (laserRef.current) {
      laserRef.current.rotation.y = t * 1.5;
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 15]} intensity={1.8} castShadow />
      <pointLight position={[0, 8, 0]} intensity={3} color="#06b6d4" />
      <pointLight position={[0, 4, 4]} intensity={2.5} color="#ef4444" />

      {/* ASPHALT ROAD ENTRY BAY */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[25, 20]} />
        <meshStandardMaterial color="#090d16" roughness={0.8} />
      </mesh>

      {/* DRIVING LANE MARKINGS */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[5, 20]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* VEHICLE CURRENTLY UNDER ANPR SCANNING */}
      <group position={[0, 0.05, 1]}>
        <RealisticVehicle type="tesla" color="#06b6d4" headlightsOn={true} />

        {/* 3D TARGET LOCK RECOGNITION HUD */}
        <Html position={[0, 1.8, 1.8]} center distanceFactor={16}>
          <div className="bg-slate-900/95 border-2 border-cyan-400 p-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col items-center gap-1 text-center font-mono animate-pulse">
            <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest">
              🎯 ALPR SCANNER ACTIVE
            </span>
            <span className="text-sm font-extrabold text-white bg-slate-950 px-2 py-0.5 rounded-md border border-cyan-500/40">
              MH-12-AB-3456
            </span>
            <span className="text-[9px] text-emerald-400 font-bold">MATCH CONFIRMED 99.9%</span>
          </div>
        </Html>
      </group>

      {/* 3D HIGH-TECH CCTV SURVEILLANCE CAMERA MODEL */}
      <group position={[-5, 4.5, 4]} rotation={[0, Math.PI / 4, 0]}>
        {/* Camera Mount Pole */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 2.5]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>

        {/* Rotating Camera Body */}
        <group ref={cctvRef} position={[0, 2, 0]}>
          <mesh rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.6, 0.5, 1.4]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Camera Lens */}
          <mesh position={[0, -0.05, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} />
          </mesh>

          {/* Glowing Red Surveillance Record LED */}
          <mesh position={[0.2, 0.15, 0.72]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Sweeping Laser Scanner Cone */}
          <mesh ref={laserRef} position={[0, -2, 2]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[2.5, 5, 32]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.18} wireframe />
          </mesh>
        </group>
      </group>

      {/* 3D SECURITY SHIELD BADGE MODEL */}
      <group position={[5, 4.2, -3]}>
        <mesh>
          <boxGeometry args={[1.5, 1.8, 0.2]} />
          <meshStandardMaterial color="#10b981" metalness={0.9} roughness={0.1} />
        </mesh>
        <Html center distanceFactor={18}>
          <div className="bg-emerald-500 text-slate-950 font-mono font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap">
            🛡️ ENCRYPTION LOCK ACTIVE
          </div>
        </Html>
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
        autoRotate={true}
        autoRotateSpeed={0.8}
      />
    </>
  );
}

export function SecurityHero3D() {
  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950">
      <Canvas camera={{ position: [0, 10, 16], fov: 45 }}>
        <SecuritySceneContent />
      </Canvas>
    </div>
  );
}

export default SecurityHero3D;
