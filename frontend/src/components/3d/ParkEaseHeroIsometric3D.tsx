import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Realistic low-poly styled vehicle for isometric scene
function SceneCar({
  color = '#00f0ff',
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  headlights = true,
  isDriving = false,
}: {
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  headlights?: boolean;
  isDriving?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Chassis Body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.5, 0.45, 3.0]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={isDriving ? color : '#000000'}
          emissiveIntensity={isDriving ? 0.3 : 0}
        />
      </mesh>

      {/* Cabin / Roof & Glass */}
      <mesh position={[0, 0.72, -0.15]} castShadow>
        <boxGeometry args={[1.25, 0.4, 1.7]} />
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Windshield front glass glow */}
      <mesh position={[0, 0.7, 0.72]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[1.15, 0.35]} />
        <meshBasicMaterial color="#38bdf8" opacity={0.6} transparent />
      </mesh>

      {/* Wheels */}
      {[
        [-0.8, 0.22, 0.9],
        [0.8, 0.22, 0.9],
        [-0.8, 0.22, -0.9],
        [0.8, 0.22, -0.9],
      ].map((wheelPos, i) => (
        <mesh key={i} position={wheelPos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.2, 16]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.9} metalness={0.2} />
        </mesh>
      ))}

      {/* Headlights */}
      {headlights && (
        <>
          <mesh position={[-0.55, 0.38, 1.51]}>
            <boxGeometry args={[0.22, 0.1, 0.05]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.55, 0.38, 1.51]}>
            <boxGeometry args={[0.22, 0.1, 0.05]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <pointLight position={[0, 0.4, 2.2]} color="#ffffff" intensity={isDriving ? 2.5 : 1.2} distance={6} />
        </>
      )}

      {/* Taillights */}
      <mesh position={[-0.55, 0.42, -1.51]}>
        <boxGeometry args={[0.25, 0.08, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.55, 0.42, -1.51]}>
        <boxGeometry args={[0.25, 0.08, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {isDriving && (
        <pointLight position={[0, 0.4, -1.8]} color="#ef4444" intensity={1.5} distance={4} />
      )}

      {/* Underglow for Driving car */}
      {isDriving && (
        <pointLight position={[0, 0.05, 0]} color={color} intensity={2.2} distance={3} />
      )}
    </group>
  );
}

// Glowing Navigation Path with animated moving pulse
function NavigationGreenTrack() {
  const lineMeshRef = useRef<THREE.Mesh>(null);

  // Define curved trajectory waypoint coordinates from entrance to slot A-02
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.05, 6),
      new THREE.Vector3(-4, 0.05, 5.5),
      new THREE.Vector3(0, 0.05, 4.5),
      new THREE.Vector3(2.5, 0.05, 2.5),
      new THREE.Vector3(3.5, 0.05, -0.5),
      new THREE.Vector3(2.5, 0.05, -3.2),
      new THREE.Vector3(-0.5, 0.05, -3.8),
      new THREE.Vector3(-3.2, 0.05, -3.8),
    ]);
  }, []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
  }, [curve]);

  useFrame(({ clock }) => {
    if (lineMeshRef.current) {
      const mat = lineMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.75 + Math.sin(clock.getElapsedTime() * 4) * 0.25;
    }
  });

  return (
    <group>
      <mesh ref={lineMeshRef} geometry={tubeGeometry}>
        <meshBasicMaterial color="#10b981" transparent opacity={0.9} />
      </mesh>
      {/* Outer wide neon glow ribbon */}
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 0.28, 8, false)}>
        <meshBasicMaterial color="#059669" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// Animated car moving continuously along the green path
function AnimatedDrivingCar() {
  const carGroupRef = useRef<THREE.Group>(null);
  const [status, setStatus] = useState<'navigating' | 'parked'>('navigating');

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.05, 6),
      new THREE.Vector3(-4, 0.05, 5.5),
      new THREE.Vector3(0, 0.05, 4.5),
      new THREE.Vector3(2.5, 0.05, 2.5),
      new THREE.Vector3(3.5, 0.05, -0.5),
      new THREE.Vector3(2.5, 0.05, -3.2),
      new THREE.Vector3(-0.5, 0.05, -3.8),
      new THREE.Vector3(-3.2, 0.05, -3.8),
    ]);
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 8; // seconds per parking loop
    const progress = (time % cycleDuration) / cycleDuration;

    if (carGroupRef.current) {
      if (progress < 0.8) {
        // Driving into bay
        const t = progress / 0.8;
        const currentPos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);

        carGroupRef.current.position.set(currentPos.x, currentPos.y, currentPos.z);
        // Look in direction of motion (tangent vector)
        const angle = Math.atan2(tangent.x, tangent.z);
        carGroupRef.current.rotation.y = angle;
        if (status !== 'navigating') setStatus('navigating');
      } else {
        // Parked in slot for a brief moment
        const finalPos = curve.getPointAt(1.0);
        carGroupRef.current.position.set(finalPos.x, finalPos.y, finalPos.z);
        carGroupRef.current.rotation.y = Math.PI / 2;
        if (status !== 'parked') setStatus('parked');
      }
    }
  });

  return (
    <group ref={carGroupRef}>
      <SceneCar color="#10b981" isDriving={true} />
      {status === 'parked' && (
        <Html position={[0, 1.8, 0]} center distanceFactor={15}>
          <div className="bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)] backdrop-blur-md animate-pulse whitespace-nowrap">
            ✓ Bay A-02 Parked
          </div>
        </Html>
      )}
    </group>
  );
}

// Glowing Green Cones and Target Marker for the assigned slot
function TargetSlotMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 4 Glowing Green Cones at corners */}
      {[
        [-1.1, 0, -1.8],
        [1.1, 0, -1.8],
        [-1.1, 0, 1.8],
        [1.1, 0, 1.8],
      ].map((conePos, i) => (
        <group key={i} position={conePos as [number, number, number]}>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.25, 0.8, 16]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#10b981"
              emissiveIntensity={1.2}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, 0.5, 0]} color="#10b981" intensity={1.5} distance={2.5} />
        </group>
      ))}

      {/* Target Floor Hologram Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.2, 1.35, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Parking Lot Ground, Grid Lines & Static Parked Cars
function IsometricLotContent() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Gentle subtle breathing rotation for 3D realism
      groupRef.current.rotation.y = Math.PI / 4 + Math.sin(clock.getElapsedTime() * 0.25) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Dark Asphalt Ground Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color="#090e1a" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Outer Ground Border Grid Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[21.6, 17.6]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Parking Slot Dividers (Row 1 - Top) */}
      {[-7, -3.5, 0, 3.5, 7].map((x, i) => (
        <group key={`top-slot-${i}`} position={[x, 0.02, -4]}>
          {/* Slot border lines */}
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.6]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.6]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Parking Slot Dividers (Row 2 - Bottom) */}
      {[-7, -3.5, 0, 3.5, 7].map((x, i) => (
        <group key={`bot-slot-${i}`} position={[x, 0.02, 4]}>
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.6]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.6]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}

      {/* Static Parked Cars in Slots */}
      <SceneCar color="#0284c7" position={[-7, 0, -4]} rotation={[0, 0, 0]} headlights={false} />
      <SceneCar color="#eab308" position={[0, 0, -4]} rotation={[0, 0, 0]} headlights={false} />
      <SceneCar color="#334155" position={[3.5, 0, -4]} rotation={[0, 0, 0]} headlights={false} />
      <SceneCar color="#0ea5e9" position={[7, 0, -4]} rotation={[0, 0, 0]} headlights={false} />

      <SceneCar color="#64748b" position={[-7, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />
      <SceneCar color="#38bdf8" position={[-3.5, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />
      <SceneCar color="#475569" position={[3.5, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />
      <SceneCar color="#0369a1" position={[7, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />

      {/* Slot A-02 is the target open slot (at x=-3.5, z=-3.8) */}
      <TargetSlotMarker position={[-3.5, 0, -3.8]} />

      {/* Glowing Green Navigation Route Path */}
      <NavigationGreenTrack />

      {/* Dynamic Animated Driving Car */}
      <AnimatedDrivingCar />
    </group>
  );
}

export default function ParkEaseHeroIsometric3D() {
  return (
    <div className="relative w-full aspect-square max-w-[540px] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a1224] to-[#060c18] border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] group">
      {/* Decorative Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#081020]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE SENSOR RADAR</span>
        </div>
        <div className="bg-[#081020]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          BAY A-02 OPEN
        </div>
      </div>

      {/* 3D Canvas Scene */}
      <Canvas shadows dpr={[1, 2]} className="w-full h-full cursor-grab active:cursor-grabbing">
        <PerspectiveCamera makeDefault position={[12, 14, 14]} fov={38} />
        <ambientLight intensity={1.2} />
        <directionalLight position={[15, 25, 15]} intensity={1.8} castShadow />
        <pointLight position={[0, 10, 0]} color="#00f0ff" intensity={2} distance={20} />
        <pointLight position={[-6, 6, -6]} color="#10b981" intensity={2.5} distance={15} />

        <IsometricLotContent />
      </Canvas>

      {/* Flowing Ambient Light Trails on Bottom Border */}
      <div className="absolute -bottom-6 -left-6 -right-6 h-16 bg-gradient-to-t from-cyan-500/20 to-transparent blur-xl pointer-events-none" />
      
      {/* Interactive Tooltip on Bottom */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono text-gray-400 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          AI Smart Pathfinding
        </span>
        <span className="text-cyan-400 font-bold">Auto-Assign: Active</span>
      </div>
    </div>
  );
}
