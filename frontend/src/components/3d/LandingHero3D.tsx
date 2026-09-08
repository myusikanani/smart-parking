import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';
import { isMobileDevice } from '../ThreeDParkingCanvas';

function LandingSceneContent() {
  const cityGroupRef = useRef<THREE.Group>(null);
  const trafficGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Subtle gentle city ambient rotation
    if (cityGroupRef.current) {
      cityGroupRef.current.rotation.y = Math.sin(t * 0.05) * 0.05;
    }

    // Traffic vehicle continuous loop motion along road circuit
    if (trafficGroupRef.current) {
      trafficGroupRef.current.children.forEach((car, index) => {
        const offset = index * 4;
        const posZ = ((t * 4 + offset) % 36) - 18;
        car.position.z = posZ;
      });
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[20, 30, 20]} intensity={1.8} castShadow />
      <pointLight position={[0, 15, 0]} intensity={2.5} color="#06b6d4" />
      <pointLight position={[-15, 8, -10]} intensity={1.8} color="#ec4899" />
      <pointLight position={[15, 8, 10]} intensity={1.5} color="#10b981" />

      <group ref={cityGroupRef}>
        {/* BASE ASPHALT ROAD & CAMPUS DECK */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[45, 35]} />
          <meshStandardMaterial color="#090d16" roughness={0.8} />
        </mesh>

        {/* DUAL MAIN DRIVING ROADWAYS */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.01, 0]}>
          <planeGeometry args={[4.5, 35]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.01, 0]}>
          <planeGeometry args={[4.5, 35]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* ROAD DASHED LANE MARKINGS */}
        {Array.from({ length: 12 }).map((_, i) => (
          <group key={i} position={[0, 0.03, -16 + i * 3]}>
            <mesh position={[-4, 0, 0]}>
              <boxGeometry args={[0.15, 0.02, 1.2]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[4, 0, 0]}>
              <boxGeometry args={[0.15, 0.02, 1.2]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        ))}

        {/* MULTI-LEVEL SMART PARKING DECK STRUCTURE */}
        <group position={[14, 0, 0]}>
          {/* Level 1 Foundation Deck */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[12, 0.6, 18]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Level 2 Upper Deck */}
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[12, 0.4, 18]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Deck Support Pillars */}
          {[-5, 5].map((x, i) =>
            [-8, 0, 8].map((z, j) => (
              <mesh key={`${i}-${j}`} position={[x, 2.0, z]}>
                <cylinderGeometry args={[0.3, 0.3, 3.2, 16]} />
                <meshStandardMaterial color="#0284c7" metalness={0.9} />
              </mesh>
            ))
          )}
          {/* Parked Cars on Structure */}
          <RealisticVehicle type="tesla" color="#06b6d4" position={[-3, 0.6, -4]} rotation={[0, Math.PI / 2, 0]} />
          <RealisticVehicle type="audi" color="#10b981" position={[3, 0.6, 2]} rotation={[0, -Math.PI / 2, 0]} />
          <RealisticVehicle type="porsche" color="#ec4899" position={[-3, 4.0, 0]} rotation={[0, Math.PI / 2, 0]} />
          <RealisticVehicle type="suv" color="#f59e0b" position={[3, 4.0, -4]} rotation={[0, -Math.PI / 2, 0]} />
        </group>

        {/* MODERN CITY SKYSCRAPER BUILDINGS */}
        <group position={[-16, 0, -5]}>
          <mesh position={[0, 8, -6]} castShadow>
            <boxGeometry args={[6, 16, 6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 11, 4]} castShadow>
            <boxGeometry args={[7, 22, 5]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.15} />
          </mesh>
        </group>

        {/* ROADSIDE ENVIRONMENT: TREES & LED LIGHT POSTS */}
        {[-14, -6, 2, 10].map((z, i) => (
          <group key={i}>
            {/* Green Eco Tree */}
            <mesh position={[-8, 1.2, z]}>
              <coneGeometry args={[1.0, 2.2, 8]} />
              <meshStandardMaterial color="#10b981" roughness={0.8} />
            </mesh>
            {/* LED Street Lamp */}
            <mesh position={[8, 1.8, z]}>
              <cylinderGeometry args={[0.08, 0.08, 3.6]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh position={[8, 3.6, z]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>
        ))}

        {/* MOVING TRAFFIC ON ROADS (thinned on mobile for performance) */}
        <group ref={trafficGroupRef}>
          <RealisticVehicle type="tesla" color="#06b6d4" position={[-4, 0.05, 0]} isDriving={true} speed={1.8} />
          {!isMobileDevice && (
            <>
              <RealisticVehicle type="audi" color="#ec4899" position={[4, 0.05, -12]} rotation={[0, Math.PI, 0]} isDriving={true} speed={1.5} />
              <RealisticVehicle type="suv" color="#10b981" position={[-4, 0.05, 12]} isDriving={true} speed={1.6} />
            </>
          )}
        </group>
      </group>

      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group position={[0, 10, -8]}>
          {/* Floating Live Smart Guidance Beacon */}
          <mesh>
            <torusGeometry args={[3.2, 0.08, 16, 100]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
          </mesh>
        </group>
      </Float>

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

export function LandingHero3D() {
  return (
    <div className="relative w-full h-[450px] sm:h-[550px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950">
      <Canvas camera={{ position: [-18, 16, 26], fov: 42 }} dpr={isMobileDevice ? [1, 1.5] : [1, 2]}>
        <LandingSceneContent />
      </Canvas>
    </div>
  );
}

export default LandingHero3D;
