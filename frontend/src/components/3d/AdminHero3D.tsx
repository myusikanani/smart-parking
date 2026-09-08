import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

function AdminSceneContent() {
  const gridGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (gridGroupRef.current) {
      gridGroupRef.current.rotation.y = t * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[15, 25, 20]} intensity={2.0} castShadow />
      <pointLight position={[0, 10, 0]} intensity={3} color="#06b6d4" />
      <pointLight position={[10, 5, 10]} intensity={2} color="#ec4899" />
      <pointLight position={[-10, 5, -10]} intensity={2} color="#10b981" />

      {/* HOLOGRAPHIC GRID GROUND DECK */}
      <group ref={gridGroupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <circleGeometry args={[14, 64]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* HOLOGRAPHIC CONCENTRIC RINGS */}
        {[4, 8, 12].map((radius, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[radius - 0.1, radius, 64]} />
            <meshBasicMaterial color={i === 1 ? '#ec4899' : '#06b6d4'} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* 3D HOLOGRAPHIC BAR CHARTS (OCCUPANCY METRICS) */}
        {[-8, -4, 0, 4, 8].map((x, i) => {
          const barHeight = 2.5 + Math.sin(i * 1.5) * 1.5;
          return (
            <group key={i} position={[x, barHeight / 2, -6]}>
              <mesh>
                <boxGeometry args={[1.2, barHeight, 1.2]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? '#06b6d4' : '#10b981'}
                  transparent
                  opacity={0.7}
                  metalness={0.8}
                />
              </mesh>
              {/* Top Cap glow */}
              <mesh position={[0, barHeight / 2 + 0.05, 0]}>
                <boxGeometry args={[1.3, 0.1, 1.3]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          );
        })}

        {/* ANIMATED VEHICLE OCCUPANCY INDICATORS */}
        <RealisticVehicle type="tesla" color="#06b6d4" position={[-5, 0.1, 2]} rotation={[0, Math.PI / 3, 0]} />
        <RealisticVehicle type="audi" color="#10b981" position={[5, 0.1, 3]} rotation={[0, -Math.PI / 4, 0]} />
        <RealisticVehicle type="porsche" color="#ec4899" position={[0, 0.1, 6]} rotation={[0, Math.PI, 0]} />

        {/* HOLOGRAPHIC NODE LABELS */}
        <Html position={[-5, 3.2, 2]} center distanceFactor={20}>
          <div className="bg-cyan-500 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-mono font-extrabold shadow-xl">
            ZONE A &middot; 94% FULL
          </div>
        </Html>
        <Html position={[5, 3.2, 3]} center distanceFactor={20}>
          <div className="bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-mono font-extrabold shadow-xl">
            ZONE B &middot; 42% OPEN
          </div>
        </Html>
      </group>

      <Float speed={2} floatIntensity={0.5}>
        <group position={[0, 6, 0]}>
          <mesh>
            <octahedronGeometry args={[1.2]} />
            <meshBasicMaterial color="#06b6d4" wireframe />
          </mesh>
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={Math.PI / 4}
        autoRotate={true}
        autoRotateSpeed={1.0}
      />
    </>
  );
}

export function AdminHero3D() {
  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950">
      <Canvas camera={{ position: [0, 12, 20], fov: 42 }}>
        <AdminSceneContent />
      </Canvas>
    </div>
  );
}

export default AdminHero3D;
