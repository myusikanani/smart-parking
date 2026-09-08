import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

function AboutSceneContent() {
  const nodeNetworkRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (nodeNetworkRef.current) {
      nodeNetworkRef.current.rotation.y = t * 0.1;
    }
  });

  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[15, 25, 20]} intensity={1.8} castShadow />
      <pointLight position={[0, 10, 0]} intensity={2.5} color="#06b6d4" />
      <pointLight position={[-10, 6, -8]} intensity={1.8} color="#10b981" />

      <group ref={nodeNetworkRef}>
        {/* GREEN ECO CAMPUS BASE */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <circleGeometry args={[13, 64]} />
          <meshStandardMaterial color="#0b132b" roughness={0.7} />
        </mesh>

        {/* CONNECTED INFRASTRUCTURE NODES & LINES */}
        {[-6, 0, 6].map((x, i) =>
          [-6, 0, 6].map((z, j) => (
            <group key={`${i}-${j}`} position={[x, 0.2, z]}>
              <mesh>
                <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
                <meshStandardMaterial color="#06b6d4" metalness={0.9} />
              </mesh>

              {/* Pulsing Beacon Light */}
              <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#10b981" />
              </mesh>
            </group>
          ))
        )}

        {/* ECO TREES & AUTONOMOUS VEHICLES */}
        <RealisticVehicle type="tesla" color="#06b6d4" position={[-4, 0.05, 0]} />
        <RealisticVehicle type="audi" color="#10b981" position={[4, 0.05, 2]} rotation={[0, Math.PI / 2, 0]} />

        {[-8, 8].map((x, i) => (
          <group key={i} position={[x, 1.2, -4]}>
            <mesh>
              <coneGeometry args={[1.2, 2.4, 8]} />
              <meshStandardMaterial color="#10b981" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* FLOATING INFRASTRUCTURE LABELS */}
        <Html position={[0, 3.5, 0]} center distanceFactor={18}>
          <div className="bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-xl text-center">
            <span className="text-[10px] font-mono font-extrabold text-cyan-400 block uppercase">
              🌐 Smart City IoT Mesh
            </span>
            <span className="text-xs font-bold text-white">500+ Connected Nodes</span>
          </div>
        </Html>
      </group>

      <Float speed={2} floatIntensity={0.6}>
        <group position={[0, 7, 0]}>
          <mesh>
            <torusKnotGeometry args={[1.2, 0.3, 100, 16]} />
            <meshStandardMaterial color="#ec4899" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </Float>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
        autoRotate={true}
        autoRotateSpeed={1.0}
      />
    </>
  );
}

export function AboutHero3D() {
  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950">
      <Canvas camera={{ position: [0, 12, 18], fov: 42 }}>
        <AboutSceneContent />
      </Canvas>
    </div>
  );
}

export default AboutHero3D;
