import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

/**
 * OPTION A — "Refresh current concept"
 * Same vehicle-podium idea as the original DashboardHero3D, but with:
 *  - a lower, more cinematic camera angle
 *  - softer 3-point lighting (less flat / more PBR-ish shine on the car)
 *  - 3 HUD cards arranged in a perfectly symmetric triangle around the car
 *    instead of the original's 2-cards-on-one-axis layout
 */
function SceneA() {
  const vehicleRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (vehicleRef.current) {
      vehicleRef.current.position.y = Math.sin(t * 1.5) * 0.12 + 0.2;
      vehicleRef.current.rotation.y = Math.sin(t * 0.4) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.6;
    }
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[8, 14, 10]} intensity={1.8} castShadow />
      <directionalLight position={[-8, 6, -6]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[0, 4, 4]} intensity={1.8} color="#06b6d4" />
      <pointLight position={[0, 3, -4]} intensity={1.2} color="#10b981" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 4.8, 0.3, 48]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.15} />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[4.6, 4.85, 64]} />
        <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.75} />
      </mesh>

      <group ref={vehicleRef} position={[0, 0.2, 0]}>
        <RealisticVehicle type="tesla" color="#06b6d4" isDriving={false} headlightsOn={true} />
        <Html position={[0, 2.2, 0]} center distanceFactor={18}>
          <div className="bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2 text-xs font-mono font-bold text-white whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>SLOT #A-01 · RESERVED</span>
          </div>
        </Html>
      </group>

      {/* 3 HUD cards, symmetric triangle at 0°/120°/240° */}
      <Float speed={2} floatIntensity={0.5}>
        <group position={[0, 2.0, 5.2]}>
          <Html center distanceFactor={16}>
            <div className="glass-card p-3 rounded-2xl border border-emerald-500/30 text-xs shadow-2xl backdrop-blur-2xl w-40">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">Battery</span>
              <p className="text-sm font-bold text-white mt-0.5">84% Charged</p>
            </div>
          </Html>
        </group>
      </Float>
      <Float speed={2.3} floatIntensity={0.6}>
        <group position={[-4.5, 2.0, -2.6]}>
          <Html center distanceFactor={16}>
            <div className="glass-card p-3 rounded-2xl border border-cyan-500/30 text-xs shadow-2xl backdrop-blur-2xl w-40">
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold block">Session</span>
              <p className="text-sm font-bold text-white mt-0.5">01h 42m</p>
            </div>
          </Html>
        </group>
      </Float>
      <Float speed={1.8} floatIntensity={0.5}>
        <group position={[4.5, 2.0, -2.6]}>
          <Html center distanceFactor={16}>
            <div className="glass-card p-3 rounded-2xl border border-pink-500/30 text-xs shadow-2xl backdrop-blur-2xl w-40">
              <span className="text-[10px] uppercase font-mono text-pink-400 font-bold block">Nearby</span>
              <p className="text-sm font-bold text-white mt-0.5">12 Slots</p>
            </div>
          </Html>
        </group>
      </Float>

      <Sparkles count={60} scale={[10, 5, 10]} size={2} speed={0.25} opacity={0.5} color="#10b981" />
      <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={12} blur={2} far={6} color="#000814" />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.4}
        minPolarAngle={Math.PI / 3.2}
        autoRotate
        autoRotateSpeed={1}
      />
    </>
  );
}

export function DashboardHero3D_A({ fill = false }: { fill?: boolean }) {
  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950 ${
        fill ? 'h-full min-h-[320px]' : 'h-[320px] sm:h-[380px]'
      }`}
    >
      <Canvas camera={{ position: [0, 4.5, 11], fov: 40 }}>
        <SceneA />
      </Canvas>
    </div>
  );
}

export default DashboardHero3D_A;
