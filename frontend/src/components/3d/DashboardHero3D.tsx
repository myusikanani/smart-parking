import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

function DashboardSceneContent() {
  const vehicleRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Subtle floating vehicle gentle oscillation & wheel angle
    if (vehicleRef.current) {
      vehicleRef.current.position.y = Math.sin(t * 1.5) * 0.15 + 0.2;
      vehicleRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 15]} intensity={2.0} castShadow />
      <pointLight position={[0, 5, 0]} intensity={2.5} color="#06b6d4" />
      <pointLight position={[-8, 6, -5]} intensity={1.5} color="#10b981" />

      {/* GLOWING PARKING PEDESTAL PLATFORM */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[4.2, 64]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.15} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <cylinderGeometry args={[4.2, 4.4, 0.15, 48]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.25} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* PULSING OUTER NEON RING */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[4.25, 4.45, 64]} />
        <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* FLOATING REALISTIC PARKED VEHICLE WITH METALLIC SHINE */}
      <group ref={vehicleRef} position={[0, 0.2, 0]}>
        <RealisticVehicle type="tesla" color="#06b6d4" isDriving={false} headlightsOn={true} />
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={Math.PI / 4}
        autoRotate={true}
        autoRotateSpeed={1.2}
      />
    </>
  );
}

export function DashboardHero3D() {
  return (
    <div className="relative w-full h-[320px] sm:h-[380px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-xl bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/50 dark:from-[#09152b] dark:via-[#0c1e3d] dark:to-slate-950">
      <Canvas gl={{ alpha: true }} camera={{ position: [0, 4.5, 10], fov: 42 }}>
        <DashboardSceneContent />
      </Canvas>
    </div>
  );
}

export default DashboardHero3D;
