import React, { useRef, useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';

// Fallback error boundary in case of WebGL limitations
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}
class WebGLErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL Scene fallback engaged:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <IsometricVectorFallback />;
    }
    return this.props.children;
  }
}

// Vector fallback component that looks identical to the isometric lot
function IsometricVectorFallback() {
  return (
    <div className="relative w-full h-full min-h-[420px] bg-[#070e1c] flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 600 450" className="w-full h-full max-w-[500px]">
        <defs>
          <linearGradient id="fallbackGreenPath" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#00D2FF" />
            <stop offset="50%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id="fallbackGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Isometric Ground Grid */}
        <polygon points="300,40 560,180 300,320 40,180" fill="#091428" stroke="#00D2FF" strokeWidth="1.5" strokeOpacity="0.3" />

        {/* Parking Slots Lines */}
        <line x1="120" y1="140" x2="220" y2="90" stroke="#1E293B" strokeWidth="2" />
        <line x1="170" y1="170" x2="270" y2="120" stroke="#1E293B" strokeWidth="2" />
        <line x1="220" y1="200" x2="320" y2="150" stroke="#00FFA3" strokeWidth="2" strokeDasharray="4 2" />
        <line x1="380" y1="120" x2="480" y2="170" stroke="#1E293B" strokeWidth="2" />

        {/* Parked Cars */}
        <polygon points="150,115 190,95 240,120 200,140" fill="#0284C7" />
        <polygon points="400,140 440,120 490,145 450,165" fill="#EAB308" />

        {/* Active Glowing Green Path */}
        <path
          d="M 100 240 Q 200 250 260 210 T 310 160"
          fill="none"
          stroke="url(#fallbackGreenPath)"
          strokeWidth="6"
          filter="url(#fallbackGlow)"
          strokeLinecap="round"
        />

        {/* Navigating Car */}
        <g transform="translate(250, 180) rotate(-25)">
          <rect x="-18" y="-10" width="36" height="20" rx="4" fill="#00FFA3" filter="url(#fallbackGlow)" />
          <rect x="-10" y="-7" width="20" height="14" rx="2" fill="#0F172A" />
        </g>
      </svg>
    </div>
  );
}

// 3D Realistic low-poly styled vehicle
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
          emissiveIntensity={isDriving ? 0.4 : 0}
        />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 0.72, -0.15]} castShadow>
        <boxGeometry args={[1.25, 0.4, 1.7]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Windshield */}
      <mesh position={[0, 0.7, 0.72]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[1.15, 0.35]} />
        <meshBasicMaterial color="#38bdf8" opacity={0.7} transparent />
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
          <pointLight position={[0, 0.4, 2.2]} color="#ffffff" intensity={isDriving ? 3 : 1.5} distance={7} />
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
        <pointLight position={[0, 0.4, -1.8]} color="#ef4444" intensity={2} distance={4} />
      )}

      {/* Neon Underglow for Driving car */}
      {isDriving && (
        <pointLight position={[0, 0.05, 0]} color={color} intensity={3} distance={4} />
      )}
    </group>
  );
}

// Glowing Navigation Path
function NavigationGreenTrack() {
  const lineMeshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.06, 6),
      new THREE.Vector3(-4, 0.06, 5.5),
      new THREE.Vector3(0, 0.06, 4.5),
      new THREE.Vector3(2.5, 0.06, 2.5),
      new THREE.Vector3(3.5, 0.06, -0.5),
      new THREE.Vector3(2.5, 0.06, -3.2),
      new THREE.Vector3(-0.5, 0.06, -3.8),
      new THREE.Vector3(-3.5, 0.06, -3.8),
    ]);
  }, []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.16, 8, false);
  }, [curve]);

  useFrame(({ clock }) => {
    if (lineMeshRef.current) {
      const mat = lineMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 + Math.sin(clock.getElapsedTime() * 5) * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={lineMeshRef} geometry={tubeGeometry}>
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.95} />
      </mesh>
      {/* Outer Wide Neon Ribbon */}
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 0.35, 8, false)}>
        <meshBasicMaterial color="#00D2FF" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Animated car moving along the green path
function AnimatedDrivingCar() {
  const carGroupRef = useRef<THREE.Group>(null);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.05, 6),
      new THREE.Vector3(-4, 0.05, 5.5),
      new THREE.Vector3(0, 0.05, 4.5),
      new THREE.Vector3(2.5, 0.05, 2.5),
      new THREE.Vector3(3.5, 0.05, -0.5),
      new THREE.Vector3(2.5, 0.05, -3.2),
      new THREE.Vector3(-0.5, 0.05, -3.8),
      new THREE.Vector3(-3.5, 0.05, -3.8),
    ]);
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 7;
    const progress = (time % cycleDuration) / cycleDuration;

    if (carGroupRef.current) {
      if (progress < 0.8) {
        const t = progress / 0.8;
        const currentPos = curve.getPointAt(t);
        const tangent = curve.getTangentAt(t);

        carGroupRef.current.position.set(currentPos.x, currentPos.y, currentPos.z);
        const angle = Math.atan2(tangent.x, tangent.z);
        carGroupRef.current.rotation.y = angle;
      } else {
        const finalPos = curve.getPointAt(1.0);
        carGroupRef.current.position.set(finalPos.x, finalPos.y, finalPos.z);
        carGroupRef.current.rotation.y = Math.PI / 2;
      }
    }
  });

  return (
    <group ref={carGroupRef}>
      <SceneCar color="#00FFA3" isDriving={true} />
    </group>
  );
}

// Target Slot Marker with Glowing Cones
function TargetSlotMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        [-1.2, 0, -1.9],
        [1.2, 0, -1.9],
        [-1.2, 0, 1.9],
        [1.2, 0, 1.9],
      ].map((conePos, i) => (
        <group key={i} position={conePos as [number, number, number]}>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.28, 0.8, 16]} />
            <meshStandardMaterial
              color="#00FFA3"
              emissive="#00FFA3"
              emissiveIntensity={1.5}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, 0.6, 0]} color="#00FFA3" intensity={2} distance={3} />
        </group>
      ))}

      {/* Target Floor Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.3, 1.5, 32]} />
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Parking Lot Ground Plane and Adjacent Parked Cars
function IsometricLotContent() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.PI / 4 + Math.sin(clock.getElapsedTime() * 0.2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* Dark Asphalt Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#080e1b" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Parking Slot Dividers (Top Row) */}
      {[-7, -3.5, 0, 3.5, 7].map((x, i) => (
        <group key={`top-slot-${i}`} position={[x, 0.02, -4]}>
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.8]} />
            <meshBasicMaterial color="#00D2FF" opacity={0.4} transparent />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.8]} />
            <meshBasicMaterial color="#00D2FF" opacity={0.4} transparent />
          </mesh>
        </group>
      ))}

      {/* Parking Slot Dividers (Bottom Row) */}
      {[-7, -3.5, 0, 3.5, 7].map((x, i) => (
        <group key={`bot-slot-${i}`} position={[x, 0.02, 4]}>
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.8]} />
            <meshBasicMaterial color="#00D2FF" opacity={0.4} transparent />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.08, 0.02, 3.8]} />
            <meshBasicMaterial color="#00D2FF" opacity={0.4} transparent />
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

      {/* Target Slot (A-02) */}
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
    <div className="relative w-full h-full min-h-[440px] lg:min-h-[500px] max-w-[560px] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#0b1730] via-[#070f20] to-[#040914] border border-[#00D2FF]/40 shadow-[0_0_60px_rgba(0,210,255,0.25)] group">
      
      {/* Background Cyber Grid Floor Overlay */}
      <div className="absolute inset-0 cyber-grid-floor opacity-50 pointer-events-none" />

      {/* Top Floating Badges (€120 / €128 Price Badges matching Mockup image_30.png) */}
      <div className="absolute top-5 right-5 z-20 space-y-2 pointer-events-none">
        <div className="bg-[#0b1730]/95 border border-[#00FFA3]/60 px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(0,255,163,0.35)] backdrop-blur-xl text-right">
          <span className="text-[10px] font-space text-emerald-300 font-semibold tracking-wider block">Standard Space</span>
          <span className="text-base font-extrabold text-[#00FFA3] font-mono tracking-wide">120 €</span>
        </div>
        <div className="bg-[#0b1730]/95 border border-[#00D2FF]/50 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,210,255,0.25)] backdrop-blur-xl text-right">
          <span className="text-[10px] font-space text-cyan-300 font-semibold tracking-wider block">Reserved Spot</span>
          <span className="text-base font-extrabold text-[#00D2FF] font-mono tracking-wide">128 €</span>
        </div>
      </div>

      {/* Top-Left Live Sensor Badge */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#071124]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#00D2FF]/40 text-[11px] font-space text-[#00D2FF] shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
          <span>RADAR // LIVE ALLOCATION</span>
        </div>
      </div>

      {/* 3D Canvas Scene with Error Boundary */}
      <WebGLErrorBoundary>
        <Canvas
          shadows
          dpr={[1, 2]}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%', minHeight: '440px' }}
        >
          <PerspectiveCamera makeDefault position={[12, 14, 14]} fov={38} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[15, 25, 15]} intensity={2.0} castShadow />
          <pointLight position={[0, 10, 0]} color="#00D2FF" intensity={2.5} distance={25} />
          <pointLight position={[-6, 6, -6]} color="#00FFA3" intensity={3.0} distance={18} />
          <pointLight position={[6, 4, 6]} color="#FF3366" intensity={1.5} distance={14} />

          <IsometricLotContent />
        </Canvas>
      </WebGLErrorBoundary>

      {/* Bottom Live Sensor Telemetry Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono text-gray-200 bg-[#071022]/95 border border-[#00D2FF]/30 px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg pointer-events-none">
        <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
          Sensor Node: #4092
        </span>
        <span className="text-gray-400 hidden sm:inline">Latency: <strong className="text-[#00FFA3]">12ms</strong></span>
        <span className="text-[#00FFA3] font-bold">Availability: 94%</span>
      </div>

      {/* Flowing Ambient Light Glow on Bottom */}
      <div className="absolute -bottom-6 -left-6 -right-6 h-20 bg-gradient-to-t from-[#00D2FF]/25 to-transparent blur-2xl pointer-events-none" />
    </div>
  );
}
