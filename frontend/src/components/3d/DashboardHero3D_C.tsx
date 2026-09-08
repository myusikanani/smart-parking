import { useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Float, Html, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';
import { isMobileDevice } from '../ThreeDParkingCanvas';

/**
 * OPTION C — "Interactive 3D"
 * Same podium composition as Option A, but the vehicle and HUD cards are
 * now real click targets:
 *  - click the car        -> onOpenPass()   (would open the ParkingPass modal)
 *  - click "Nearby Slots"  -> onViewSlots()  (would navigate to /available-parking)
 * A hover-glow + cursor change signals clickability. This file is wired with
 * demo callbacks so it's self-contained for preview.
 */
function SceneC({
  onOpenPass,
  onViewSlots,
}: {
  onOpenPass: () => void;
  onViewSlots: () => void;
}) {
  const vehicleRef = useRef<THREE.Group>(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (vehicleRef.current) {
      const bob = hoveredVehicle ? 0.28 : 0.15;
      vehicleRef.current.position.y = Math.sin(t * 1.5) * bob + 0.2;
      vehicleRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }
  });

  const handleVehicleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onOpenPass();
  };

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 15]} intensity={2.0} castShadow />
      <pointLight position={[0, 5, 0]} intensity={2.5} color="#06b6d4" />
      <pointLight position={[-8, 6, -5]} intensity={1.5} color="#10b981" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.5, 4.8, 0.3, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[4.6, 4.85, 64]} />
        <meshBasicMaterial color={hoveredVehicle ? '#22d3ee' : '#06b6d4'} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* CLICKABLE VEHICLE */}
      <group
        ref={vehicleRef}
        position={[0, 0.2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredVehicle(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHoveredVehicle(false); document.body.style.cursor = 'auto'; }}
        onClick={handleVehicleClick}
      >
        <RealisticVehicle type="tesla" color={hoveredVehicle ? '#22d3ee' : '#06b6d4'} isDriving={false} headlightsOn />
        <Html position={[0, 2.3, 0]} center distanceFactor={18}>
          <div
            className={`px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2 text-xs font-mono font-bold text-white whitespace-nowrap transition-all ${
              hoveredVehicle ? 'bg-cyan-500/90 border border-cyan-300 scale-105' : 'bg-slate-900/90 border border-cyan-500/40'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{hoveredVehicle ? 'CLICK TO VIEW PASS' : 'SLOT #A-01 · RESERVED'}</span>
          </div>
        </Html>
      </group>

      {/* Side HUD cards are hidden on small screens where they collide */}
      {!isMobileDevice && (
        <Float speed={2} floatIntensity={0.6}>
          <group position={[-5.2, 2.0, 1]}>
            <Html center distanceFactor={16}>
              <div className="glass-card p-3 rounded-2xl border border-emerald-500/30 text-xs shadow-2xl backdrop-blur-2xl w-44">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">Live Battery / EV</span>
                <p className="text-sm font-bold text-white mt-0.5">84% Charged</p>
                <p className="text-[10px] text-gray-400">50kW Rapid Charger connected</p>
              </div>
            </Html>
          </group>
        </Float>
      )}

      {/* CLICKABLE "NEARBY SLOTS" CARD */}
      {!isMobileDevice && (
        <Float speed={2.5} floatIntensity={0.8}>
          <group position={[5.2, 1.8, -1]}>
            <Html
              center
              distanceFactor={16}
              onPointerOver={() => { setHoveredCard(true); document.body.style.cursor = 'pointer'; }}
              onPointerOut={() => { setHoveredCard(false); document.body.style.cursor = 'auto'; }}
            >
              <div
                onClick={onViewSlots}
                className={`glass-card p-3 rounded-2xl border text-xs shadow-2xl backdrop-blur-2xl w-44 cursor-pointer transition-all ${
                  hoveredCard ? 'border-pink-400 scale-105' : 'border-pink-500/30'
                }`}
              >
                <span className="text-[10px] uppercase font-mono text-pink-400 font-bold block">Nearby Slots</span>
                <p className="text-sm font-bold text-white mt-0.5">12 Available</p>
                <p className="text-[10px] text-gray-400">{hoveredCard ? 'Click to browse →' : 'Within 2 floors'}</p>
              </div>
            </Html>
          </group>
        </Float>
      )}

      {!isMobileDevice && (
        <Sparkles count={70} scale={[10, 6, 10]} size={2.2} speed={0.25} opacity={0.55} color="#10b981" />
      )}
      {!isMobileDevice && (
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={12} blur={2} far={6} color="#000814" />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={Math.PI / 4}
        autoRotate
        autoRotateSpeed={1.2}
      />
    </>
  );
}

export function DashboardHero3D_C({
  fill = false,
  onOpenPass,
  onViewSlots,
}: {
  fill?: boolean;
  onOpenPass?: () => void;
  onViewSlots?: () => void;
}) {
  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950 ${
        fill ? 'h-full min-h-[320px]' : 'h-[320px] sm:h-[380px]'
      }`}
    >
      <Canvas camera={{ position: [0, 6, 12], fov: 45 }} dpr={isMobileDevice ? [1, 1.5] : [1, 2]}>
        <SceneC onOpenPass={onOpenPass ?? (() => {})} onViewSlots={onViewSlots ?? (() => {})} />
      </Canvas>
    </div>
  );
}

export default DashboardHero3D_C;
