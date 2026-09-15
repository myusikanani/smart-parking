import { useRef, useMemo, Component, ReactNode, ErrorInfo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Fallback Error Boundary
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
    console.warn('WebGL scene fallback engaged:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#081224] text-cyan-400 font-mono text-sm p-4">
          3D Multi-Floor Parking Deck Active
        </div>
      );
    }
    return this.props.children;
  }
}

// 3D Styled Vehicle Component
function Car3D({
  color = '#00F2FE',
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
      {/* Main Body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.5, 0.45, 3.0]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.2}
          emissive={isDriving ? color : '#000000'}
          emissiveIntensity={isDriving ? 0.5 : 0}
        />
      </mesh>

      {/* Cabin Roof */}
      <mesh position={[0, 0.72, -0.15]} castShadow>
        <boxGeometry args={[1.25, 0.4, 1.7]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Front Windshield */}
      <mesh position={[0, 0.7, 0.72]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[1.15, 0.35]} />
        <meshBasicMaterial color="#38bdf8" opacity={0.85} transparent />
      </mesh>

      {/* 4 Wheels */}
      {[
        [-0.8, 0.22, 0.9],
        [0.8, 0.22, 0.9],
        [-0.8, 0.22, -0.9],
        [0.8, 0.22, -0.9],
      ].map((wheelPos, i) => (
        <mesh key={i} position={wheelPos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.2, 16]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.9} metalness={0.3} />
        </mesh>
      ))}

      {/* Glowing Headlights */}
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
          {isDriving && (
            <pointLight position={[0, 0.4, 2.2]} color="#ffffff" intensity={3.5} distance={8} />
          )}
        </>
      )}

      {/* Rear Taillights */}
      <mesh position={[-0.55, 0.42, -1.51]}>
        <boxGeometry args={[0.25, 0.08, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.55, 0.42, -1.51]}>
        <boxGeometry args={[0.25, 0.08, 0.05]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {isDriving && (
        <pointLight position={[0, 0.4, -1.8]} color="#ef4444" intensity={2.5} distance={5} />
      )}

      {/* Neon Underglow */}
      {isDriving && (
        <pointLight position={[0, 0.08, 0]} color={color} intensity={3.5} distance={5} />
      )}
    </group>
  );
}

// Glowing Navigation Green Trajectory Tube
function NavigationGreenTrack() {
  const lineMeshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8, 0.08, 6),
      new THREE.Vector3(-4, 0.08, 5.5),
      new THREE.Vector3(0, 0.08, 4.5),
      new THREE.Vector3(2.5, 0.08, 2.5),
      new THREE.Vector3(3.5, 0.08, -0.5),
      new THREE.Vector3(2.5, 0.08, -3.2),
      new THREE.Vector3(-0.5, 0.08, -3.8),
      new THREE.Vector3(-3.5, 0.08, -3.8),
    ]);
  }, []);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.16, 8, false);
  }, [curve]);

  useFrame(({ clock }) => {
    if (lineMeshRef.current) {
      const mat = lineMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.85 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
    }
  });

  return (
    <group>
      {/* Inner Vibrant Green Laser Core */}
      <mesh ref={lineMeshRef} geometry={tubeGeometry}>
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.95} />
      </mesh>
      {/* Outer Cyan Ribbon */}
      <mesh geometry={new THREE.TubeGeometry(curve, 64, 0.38, 8, false)}>
        <meshBasicMaterial color="#00D2FF" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// Animated Driving Car Moving Along Curve
function AnimatedDrivingCar() {
  const carGroupRef = useRef<THREE.Group>(null);

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

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cycleDuration = 6.5;
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
      <Car3D color="#00FFA3" isDriving={true} />
    </group>
  );
}

// Target Bay C1B (Car Bay on Floor 1) Marker with Glowing Green Cones & Floor Reticle
function TargetBayMarker({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* 4 Neon Emerald Cones */}
      {[
        [-1.2, 0, -1.9],
        [1.2, 0, -1.9],
        [-1.2, 0, 1.9],
        [1.2, 0, 1.9],
      ].map((conePos, i) => (
        <group key={i} position={conePos as [number, number, number]}>
          <mesh position={[0, 0.45, 0]}>
            <coneGeometry args={[0.3, 0.9, 16]} />
            <meshStandardMaterial
              color="#00FFA3"
              emissive="#00FFA3"
              emissiveIntensity={1.8}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, 0.6, 0]} color="#00FFA3" intensity={2.5} distance={4} />
        </group>
      ))}

      {/* Rotating Floor Target Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[1.3, 1.55, 32]} />
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Isometric Parking Deck Scene with Real Slot Layout (Floor 1: C1A, C1B, E1A, B1A, D1A, BUF-1A)
function ParkingDeckScene() {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Main Parking Floor Slab at y = -0.5 */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[20, 0.8, 16]} />
        <meshStandardMaterial color="#0c1527" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Slab Perimeter Glowing Cyan Border */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[20.15, 0.06, 16.15]} />
        <meshStandardMaterial
          color="#00F2FE"
          emissive="#00F2FE"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Floor Base Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshBasicMaterial color="#0a1222" />
      </mesh>

      {/* Top Row Bay Dividers */}
      {[-7, -3.5, 0, 3.5, 7].map((x, i) => (
        <group key={`top-div-${i}`} position={[x, 0.04, -4]}>
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.04, 4.0]} />
            <meshStandardMaterial
              color="#00F2FE"
              emissive="#00F2FE"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.04, 4.0]} />
            <meshStandardMaterial
              color="#00F2FE"
              emissive="#00F2FE"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Bottom Row Bay Dividers */}
      {[-7, -3.5, 0, 3.5, 7].map((x, i) => (
        <group key={`bot-div-${i}`} position={[x, 0.04, 4]}>
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.04, 4.0]} />
            <meshStandardMaterial
              color="#00F2FE"
              emissive="#00F2FE"
              emissiveIntensity={0.6}
            />
          </mesh>
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[0.1, 0.04, 4.0]} />
            <meshStandardMaterial
              color="#00F2FE"
              emissive="#00F2FE"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Real Parked Vehicles in Actual Seed Slots */}
      {/* C1A - Four Wheeler (Parked) */}
      <Car3D color="#0284c7" position={[-7, 0, -4]} rotation={[0, 0, 0]} headlights={false} />
      
      {/* E1A - EV Slot (Parked with Emerald Accent) */}
      <Car3D color="#10b981" position={[0, 0, -4]} rotation={[0, 0, 0]} headlights={false} />
      
      {/* D1A - Accessible / VIP Standby (Parked) */}
      <Car3D color="#334155" position={[3.5, 0, -4]} rotation={[0, 0, 0]} headlights={false} />
      
      {/* BUF-1A - Emergency Buffer Slot (Parked) */}
      <Car3D color="#0ea5e9" position={[7, 0, -4]} rotation={[0, 0, 0]} headlights={false} />

      {/* Bottom Row Vehicles */}
      {/* B1A - Two Wheeler Row (Parked) */}
      <Car3D color="#64748b" position={[-7, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />
      
      {/* C1C - Four Wheeler (Parked) */}
      <Car3D color="#f59e0b" position={[-3.5, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />
      
      {/* E1B - EV Charging Slot (Parked) */}
      <Car3D color="#475569" position={[3.5, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />
      
      {/* C1D - Four Wheeler (Parked) */}
      <Car3D color="#0369a1" position={[7, 0, 4]} rotation={[0, Math.PI, 0]} headlights={false} />

      {/* Target Bay C1B - Assigned Car Slot (Floor 1) */}
      <TargetBayMarker position={[-3.5, 0, -3.8]} />

      {/* Glowing Green Navigation Route Tube */}
      <NavigationGreenTrack />

      {/* Dynamic Animated Driving Car */}
      <AnimatedDrivingCar />
    </group>
  );
}

export default function ParkEaseHeroIsometric3D() {
  return (
    <div className="relative w-full h-full min-h-[440px] lg:min-h-[520px] max-w-[620px] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-[#0b162e] via-[#070e1e] to-[#040812] border border-[#00D2FF]/40 shadow-[0_0_60px_rgba(0,210,255,0.25)] flex flex-col justify-between select-none group">
      
      {/* Background Cyber Grid Floor */}
      <div className="absolute inset-0 cyber-grid-floor opacity-40 pointer-events-none" />

      {/* Top Floating Badges (Real Rates from Database Schema: ₹30/hr Four-Wheeler & ₹25/hr EV Charging) */}
      <div className="absolute top-5 right-5 z-20 space-y-2 pointer-events-none">
        <div className="bg-[#0b1730]/95 border border-[#00FFA3]/70 px-4 py-1.5 rounded-2xl shadow-[0_0_25px_rgba(0,255,163,0.35)] backdrop-blur-xl text-right">
          <span className="text-[10px] font-space text-emerald-300 font-semibold tracking-wider block">Four-Wheeler Slot</span>
          <span className="text-base font-extrabold text-[#00FFA3] font-mono tracking-wide">₹30 / hr</span>
        </div>
        <div className="bg-[#0b1730]/95 border border-[#00D2FF]/60 px-4 py-1.5 rounded-2xl shadow-[0_0_20px_rgba(0,210,255,0.25)] backdrop-blur-xl text-right">
          <span className="text-[10px] font-space text-cyan-300 font-semibold tracking-wider block">EV Fast Charging</span>
          <span className="text-base font-extrabold text-[#00D2FF] font-mono tracking-wide">₹25 / hr</span>
        </div>
      </div>

      {/* Top-Left Live Sensor Badge with Real Floor Indicator */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#071124]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#00D2FF]/40 text-[11px] font-space text-[#00D2FF] shadow-[0_0_15px_rgba(0,210,255,0.2)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-ping" />
          <span className="font-bold tracking-wide">FLOOR 1 // 3D DECK</span>
        </div>
        <div className="text-[10px] font-mono text-gray-400 pl-2">
          Target Bay: <strong className="text-[#00FFA3]">#C1B (Available)</strong>
        </div>
      </div>

      {/* =========================================================================
          THREE.JS 3D ISOMETRIC PARKING CANVAS
          ========================================================================= */}
      <div className="relative w-full h-full min-h-[440px] flex-1">
        <WebGLErrorBoundary>
          <Canvas
            shadows
            dpr={[1, 2]}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            style={{ width: '100%', height: '100%', minHeight: '440px' }}
          >
            {/* Camera Settings */}
            <PerspectiveCamera
              makeDefault
              position={[16, 18, 16]}
              fov={42}
              near={0.1}
              far={1000}
            />
            
            {/* Orbit Controls with Strict Target [0, 0, 0] */}
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              maxPolarAngle={Math.PI / 2.2}
              minPolarAngle={Math.PI / 6}
              target={[0, 0, 0]}
            />

            {/* High-Intensity Lights */}
            <ambientLight intensity={2.5} />
            <directionalLight position={[15, 25, 15]} intensity={3.5} castShadow />
            <pointLight position={[-10, 10, -10]} intensity={1.5} color="#00ffff" />
            <pointLight position={[0, 8, 0]} intensity={2.5} color="#00FFA3" distance={25} />
            <pointLight position={[-3.5, 3, -3.8]} intensity={3.0} color="#00FFA3" distance={10} />

            {/* Parking Deck Scene */}
            <ParkingDeckScene />
          </Canvas>
        </WebGLErrorBoundary>
      </div>

      {/* Bottom Live Sensor Telemetry Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono text-gray-200 bg-[#071022]/95 border border-[#00D2FF]/30 px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg pointer-events-none">
        <span className="text-cyan-300 flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
          WebSocket: Live Sync
        </span>
        <span className="text-gray-400 hidden sm:inline">
          Latency: <strong className="text-[#00FFA3]">12ms</strong>
        </span>
        <span className="text-[#00FFA3] font-bold">
          3 Floors Connected
        </span>
      </div>

    </div>
  );
}
