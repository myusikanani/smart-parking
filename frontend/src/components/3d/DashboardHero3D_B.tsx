import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

/**
 * OPTION B — "New scene concept: Digital Key Card"
 * A completely different hero idea: instead of a car parked on a podium,
 * a large floating glass "digital key card" (like the ParkingPass boarding-pass
 * card) hovers centre-stage with the vehicle nested inside/behind it, a QR
 * glyph, and the live QR-pass metadata baked directly into the 3D scene.
 * More "product hero" than "parking lot diorama".
 */
function SceneB() {
  const cardRef = useRef<THREE.Group>(null);
  const qrRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cardRef.current) {
      cardRef.current.position.y = Math.sin(t * 1.1) * 0.2;
      cardRef.current.rotation.y = Math.sin(t * 0.35) * 0.25;
    }
    if (qrRef.current) {
      qrRef.current.rotation.z = t * 0.4;
    }
  });

  return (
    <>
      <ambientLight intensity={1.3} />
      <directionalLight position={[6, 12, 8]} intensity={1.6} />
      <pointLight position={[0, 3, 6]} intensity={2.2} color="#06b6d4" />
      <pointLight position={[-6, 2, -4]} intensity={1.4} color="#ec4899" />

      {/* Floating glass "key card" plate */}
      <group ref={cardRef} position={[0, 0.6, 0]}>
        <mesh rotation={[0, 0.15, 0]}>
          <boxGeometry args={[7.2, 4.2, 0.15]} />
          <meshPhysicalMaterial
            color="#0b1220"
            metalness={0.3}
            roughness={0.15}
            transmission={0.35}
            transparent
            opacity={0.55}
          />
        </mesh>
        {/* Card border glow */}
        <mesh rotation={[0, 0.15, 0]} position={[0, 0, -0.01]}>
          <boxGeometry args={[7.3, 4.3, 0.02]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} />
        </mesh>

        {/* Vehicle nested inside, small scale, floating in front of the card */}
        <group position={[-1.6, -0.3, 1.4]} rotation={[0, 0.5, 0]} scale={0.55}>
          <RealisticVehicle type="tesla" color="#06b6d4" headlightsOn />
        </group>

        {/* QR glyph block on the right of the card */}
        <mesh ref={qrRef} position={[2.3, 0.2, 0.6]}>
          <boxGeometry args={[1.3, 1.3, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <Html position={[2.3, 0.2, 0.65]} center distanceFactor={13}>
          <div className="w-16 h-16 bg-white rounded-md grid grid-cols-4 grid-rows-4 gap-[2px] p-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className={`${[0, 3, 5, 6, 9, 10, 12, 15].includes(i) ? 'bg-slate-950' : 'bg-white'} rounded-[1px]`} />
            ))}
          </div>
        </Html>

        {/* Pass metadata */}
        <Html position={[-2.2, 1.1, 0.6]} distanceFactor={16}>
          <div className="text-left w-52">
            <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold tracking-widest">ParkSmart Digital Pass</span>
            <p className="text-lg font-extrabold text-white mt-0.5">Slot A-01 · Floor 2</p>
            <p className="text-[11px] text-gray-400 mt-1">Valid till 6:00 PM · Tap to open</p>
          </div>
        </Html>
      </group>

      <Sparkles count={70} scale={[9, 5, 6]} size={2.4} speed={0.3} opacity={0.55} color="#06b6d4" />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.45} scale={12} blur={2.5} far={5} color="#000814" />

      <Float speed={1.6} floatIntensity={0.4}>
        <group position={[0, -1.9, -1]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[3.6, 3.8, 64]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 2.8}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </>
  );
}

export function DashboardHero3D_B({ fill = false }: { fill?: boolean }) {
  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950 ${
        fill ? 'h-full min-h-[320px]' : 'h-[320px] sm:h-[380px]'
      }`}
    >
      <Canvas camera={{ position: [0, 1.5, 10], fov: 42 }}>
        <SceneB />
      </Canvas>
    </div>
  );
}

export default DashboardHero3D_B;
