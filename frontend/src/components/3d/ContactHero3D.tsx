import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

function ContactSceneContent() {
  const mapRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (mapRef.current) {
      mapRef.current.rotation.y = Math.sin(t * 0.2) * 0.1;
    }

    // Floating pulsating 3D location pin animation
    if (pinRef.current) {
      pinRef.current.position.y = 2.5 + Math.sin(t * 2.5) * 0.2;
    }
  });

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[15, 25, 20]} intensity={1.8} castShadow />
      <pointLight position={[0, 8, 0]} intensity={3} color="#06b6d4" />
      <pointLight position={[0, 4, 4]} intensity={2} color="#ec4899" />

      <group ref={mapRef}>
        {/* 3D CITY MAP BASE BOARD */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[24, 18, 0.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* ROAD NETWORK LINES ON MAP */}
        {/* Main Horizontal Highway */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <planeGeometry args={[23, 3]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Vertical Cross Road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <planeGeometry args={[3, 17]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* GLOWING 3D ROUTE TRAJECTORY LINES (USER -> DESTINATION) */}
        {[-8, -5, -2, 1, 4, 7].map((x, i) => (
          <mesh key={i} position={[x, 0.2, x * 0.3]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>
        ))}

        {/* MOVING VEHICLE NAVIGATING THE MAP ROUTE */}
        <RealisticVehicle type="tesla" color="#06b6d4" position={[-6, 0.2, -1.8]} isDriving={true} speed={1.5} />

        {/* ANIMATED 3D LOCATION PIN AT HQ */}
        <group ref={pinRef} position={[4, 2.5, 0]}>
          <Float speed={3} floatIntensity={0.4}>
            {/* Pin Cone */}
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.6, 1.4, 16]} />
              <meshStandardMaterial color="#ec4899" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Top Sphere Pin Head */}
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.5, 24, 24]} />
              <meshBasicMaterial color="#f43f5e" />
            </mesh>
          </Float>

          {/* Location Pin Beacon Wave Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]}>
            <ringGeometry args={[0.5, 1.2, 32]} />
            <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} transparent opacity={0.6} />
          </mesh>

          {/* HQ Address HTML Tag */}
          <Html position={[0, 1.6, 0]} center distanceFactor={18}>
            <div className="bg-slate-900/95 border border-pink-500/40 px-3 py-1.5 rounded-2xl shadow-2xl backdrop-blur-xl text-center font-mono animate-bounce whitespace-nowrap">
              <span className="text-[10px] font-extrabold text-pink-400 block uppercase">
                📍 PARKING HQ GATE 1
              </span>
              <span className="text-xs font-bold text-white">742 Innovation Drive</span>
            </div>
          </Html>
        </group>
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

export function ContactHero3D() {
  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950">
      <Canvas camera={{ position: [0, 14, 20], fov: 42 }}>
        <ContactSceneContent />
      </Canvas>
    </div>
  );
}

export default ContactHero3D;
