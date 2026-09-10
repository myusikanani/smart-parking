import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticVehicle } from './RealisticVehicle';

export interface Waypoint {
  id: number;
  position: [number, number, number];
  instruction: string;
  icon: 'straight' | 'left' | 'right' | 'arrive';
  distanceMeters: number;
  pillarLabel?: string;
}

interface Navigation3DSceneProps {
  currentStepIndex: number;
  carProgress: number; // 0 to 1 along current segment or total path
  targetSlotNumber?: string;
  cameraMode?: 'follow' | 'bird_eye' | 'free';
  vehicleType?: 'tesla' | 'audi' | 'porsche' | 'suv';
}

export const DEFAULT_WAYPOINTS: Waypoint[] = [
  {
    id: 1,
    position: [0, 0, 18],
    instruction: 'Enter Main Security Gate & Continue Straight',
    icon: 'straight',
    distanceMeters: 25,
    pillarLabel: 'GATE-01'
  },
  {
    id: 2,
    position: [0, 0, 8],
    instruction: 'Drive straight down Central Boulevard past EV Charging Zone',
    icon: 'straight',
    distanceMeters: 20,
    pillarLabel: 'PIL-A1'
  },
  {
    id: 3,
    position: [0, 0, -2],
    instruction: 'Turn Left into Lane 2 at Pillar B-04',
    icon: 'left',
    distanceMeters: 15,
    pillarLabel: 'PIL-B4'
  },
  {
    id: 4,
    position: [-8, 0, -2],
    instruction: 'Drive along Lane 2 towards Bay Zone A',
    icon: 'straight',
    distanceMeters: 12,
    pillarLabel: 'PIL-C2'
  },
  {
    id: 5,
    position: [-8, 0, -8],
    instruction: 'Turn Right into Reserved Bay A-04',
    icon: 'right',
    distanceMeters: 6,
    pillarLabel: 'BAY-A04'
  },
  {
    id: 6,
    position: [-12, 0, -8],
    instruction: 'You have arrived at your Reserved Slot A-04',
    icon: 'arrive',
    distanceMeters: 0,
    pillarLabel: 'DEST'
  }
];

// Helper to compute curve points for the route ribbon
function RouteRibbon({ waypoints, activeStep }: { waypoints: Waypoint[]; activeStep: number }) {
  const lineRef = useRef<THREE.Group>(null);

  const curvePoints = useMemo(() => {
    const vectors = waypoints.map((w) => new THREE.Vector3(w.position[0], 0.15, w.position[2]));
    const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.2);
    return curve.getPoints(80);
  }, [waypoints]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      // Pulse animation along the active route
      const t = clock.getElapsedTime() * 3;
      lineRef.current.children.forEach((child, i) => {
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.5 + Math.sin(t + i * 0.2) * 0.4;
        }
      });
    }
  });

  return (
    <group ref={lineRef}>
      {/* Route Ground Glowing Pathway */}
      {curvePoints.map((pt, idx) => {
        if (idx >= curvePoints.length - 1) return null;
        const nextPt = curvePoints[idx + 1];
        const isPassed = idx / curvePoints.length < activeStep / (waypoints.length - 1);
        return (
          <mesh
            key={idx}
            position={[
              (pt.x + nextPt.x) / 2,
              0.05,
              (pt.z + nextPt.z) / 2
            ]}
            rotation={[-Math.PI / 2, 0, Math.atan2(nextPt.x - pt.x, nextPt.z - pt.z)]}
          >
            <planeGeometry args={[1.2, pt.distanceTo(nextPt) + 0.05]} />
            <meshBasicMaterial
              color={isPassed ? '#10b981' : '#06b6d4'}
              transparent
              opacity={isPassed ? 0.7 : 0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}

      {/* Floating Animated Chevron Arrows */}
      {waypoints.map((w, idx) => (
        <group key={w.id} position={[w.position[0], 0.3, w.position[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 1.0, 32]} />
            <meshBasicMaterial
              color={idx <= activeStep ? '#10b981' : '#06b6d4'}
              transparent
              opacity={0.8}
            />
          </mesh>
          {w.pillarLabel && (
            <Text
              position={[0, 1.8, 0]}
              fontSize={0.5}
              color={idx === activeStep ? '#f43f5e' : '#38bdf8'}
              anchorX="center"
              anchorY="middle"
            >
              {w.pillarLabel}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
}

// 3D Parking Layout Environment (Floor, Pillars, Slots, Lighting)
function ParkingGarageEnvironment({ targetSlot }: { targetSlot: string }) {
  // Pillars grid
  const pillars = useMemo(() => {
    const list: [number, number, string][] = [];
    for (let x = -16; x <= 16; x += 8) {
      for (let z = -16; z <= 16; z += 8) {
        if (Math.abs(x) < 2 && Math.abs(z) < 18) continue; // Keep central road clear
        list.push([x, z, `P-${Math.abs(x)}${Math.abs(z)}`]);
      }
    }
    return list;
  }, []);

  // Parking Bays layout
  const bays = useMemo(() => {
    const list: { id: string; pos: [number, number, number]; isTarget: boolean; type: 'standard' | 'ev' | 'vip' | 'buffer' }[] = [];
    // West bays
    for (let z = -14; z <= 14; z += 4) {
      const isBuffer = z === 14;
      const isEv = z === -2 || z === 2;
      const bayName = isBuffer ? 'BUF-01' : isEv ? `EV-0${Math.abs(z)}` : `A-0${Math.abs(z)}`;
      list.push({
        id: bayName,
        pos: [-12, 0.02, z],
        isTarget: bayName === targetSlot || bayName === 'A-04',
        type: isBuffer ? 'buffer' : isEv ? 'ev' : 'standard'
      });
    }
    // East bays
    for (let z = -14; z <= 14; z += 4) {
      const isBuffer = z === 14;
      const bayName = isBuffer ? 'BUF-02' : `B-0${Math.abs(z)}`;
      list.push({
        id: bayName,
        pos: [12, 0.02, z],
        isTarget: bayName === targetSlot,
        type: isBuffer ? 'buffer' : 'standard'
      });
    }
    return list;
  }, [targetSlot]);

  return (
    <group>
      {/* Asphalt Floor Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Grid Floor Line Texture */}
      <gridHelper args={[44, 44, '#06b6d4', '#1e293b']} position={[0, 0.01, 0]} />

      {/* Pillars */}
      {pillars.map(([x, z, label], idx) => (
        <group key={idx} position={[x, 2.5, z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.2, 5, 1.2]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Yellow Safety Stripe on Pillar */}
          <mesh position={[0, -1.2, 0]}>
            <boxGeometry args={[1.22, 0.8, 1.22]} />
            <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.5} />
          </mesh>
          <Text position={[0, 0.5, 0.65]} fontSize={0.35} color="#38bdf8" anchorX="center" anchorY="middle">
            {label}
          </Text>
        </group>
      ))}

      {/* Parking Bays */}
      {bays.map((bay) => {
        const isBuf = bay.type === 'buffer';
        const groundColor = bay.isTarget ? '#10b981' : isBuf ? '#f59e0b' : bay.type === 'ev' ? '#06b6d4' : '#334155';
        const borderColor = bay.isTarget ? '#34d399' : isBuf ? '#fbbf24' : bay.type === 'ev' ? '#06b6d4' : '#64748b';
        return (
          <group key={bay.id} position={bay.pos}>
            {/* Bay Ground Rect */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4.5, 2.8]} />
              <meshBasicMaterial
                color={groundColor}
                transparent
                opacity={bay.isTarget ? 0.45 : isBuf ? 0.35 : 0.15}
              />
            </mesh>
            {/* Bay Border Outline */}
            <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(4.5, 2.8)]} />
              <lineBasicMaterial
                color={borderColor}
                linewidth={bay.isTarget || isBuf ? 3 : 1}
              />
            </lineSegments>

            {/* Slot Number Text on Floor */}
            <Text
              position={[0, 0.04, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={isBuf ? 0.45 : 0.6}
              color={bay.isTarget ? '#10b981' : isBuf ? '#fbbf24' : bay.type === 'ev' ? '#38bdf8' : '#94a3b8'}
              anchorX="center"
              anchorY="middle"
            >
              {isBuf ? `🛡️ ${bay.id} BUFFER` : bay.id}
            </Text>

            {/* Target Slot Beacon Glow */}
            {bay.isTarget && (
              <group position={[0, 2.5, 0]}>
                <mesh>
                  <cylinderGeometry args={[0.05, 1.8, 4, 16, 1, true]} />
                  <meshBasicMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
                <Text position={[0, 2.2, 0]} fontSize={0.7} color="#10b981" anchorX="center" anchorY="middle">
                  ★ RESERVED BAY ★
                </Text>
              </group>
            )}

            {/* Emergency Buffer Floating Shield Beacon */}
            {isBuf && (
              <group position={[0, 2.0, 0]}>
                <Text position={[0, 0.4, 0]} fontSize={0.4} color="#fbbf24" anchorX="center" anchorY="middle">
                  🛡️ VIP / EMERGENCY BUFFER 🛡️
                </Text>
                <Text position={[0, -0.1, 0]} fontSize={0.25} color="#fed7aa" anchorX="center" anchorY="middle">
                  (System Auto-Reassignment Only)
                </Text>
              </group>
            )}
          </group>
        );
      })}

      {/* Entry Gate Barrier */}
      <group position={[0, 1.5, 21]}>
        <mesh position={[-4, 0, 0]}>
          <boxGeometry args={[0.8, 3, 0.8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[4, 0, 0]}>
          <boxGeometry args={[0.8, 3, 0.8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        {/* Gate Barrier Beam */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[7.2, 0.15, 0.15]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        <Text position={[0, 2.2, 0]} fontSize={0.6} color="#38bdf8">
          ENTRY SECURITY GATE
        </Text>
      </group>
    </group>
  );
}

// Vehicle moving along interpolated waypoints
function NavigatingVehicle({
  waypoints,
  currentStepIndex,
  carProgress,
  vehicleType = 'tesla'
}: {
  waypoints: Waypoint[];
  currentStepIndex: number;
  carProgress: number;
  vehicleType?: 'tesla' | 'audi' | 'porsche' | 'suv';
}) {
  const vehicleGroupRef = useRef<THREE.Group>(null);

  const currentWp = waypoints[currentStepIndex] || waypoints[0];
  const nextWp = waypoints[Math.min(currentStepIndex + 1, waypoints.length - 1)];

  // Compute interpolated position & rotation
  const x = THREE.MathUtils.lerp(currentWp.position[0], nextWp.position[0], carProgress);
  const z = THREE.MathUtils.lerp(currentWp.position[2], nextWp.position[2], carProgress);

  const angle = Math.atan2(nextWp.position[0] - currentWp.position[0], nextWp.position[2] - currentWp.position[2]);

  return (
    <group ref={vehicleGroupRef} position={[x, 0, z]} rotation={[0, angle, 0]}>
      <RealisticVehicle
        type={vehicleType}
        color="#06b6d4"
        isDriving={true}
        speed={1.5}
        scale={0.9}
        headlightsOn={true}
      />
      {/* 3D Navigation Hologram Compass on top of Car */}
      <group position={[0, 2.2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0, -1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 0.6, 16]} />
          <meshBasicMaterial color="#ec4899" />
        </mesh>
      </group>
    </group>
  );
}

export const Navigation3DScene = memo(function Navigation3DScene({
  currentStepIndex = 0,
  carProgress = 0,
  targetSlotNumber = 'A-04',
  vehicleType = 'tesla'
}: Navigation3DSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 18, 26], fov: 45 }}
      shadows
      className="w-full h-full rounded-2xl bg-slate-950"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 15]} intensity={1.5} castShadow />
      <pointLight position={[-10, 8, -5]} intensity={1.2} color="#06b6d4" />
      <pointLight position={[10, 8, 5]} intensity={1.2} color="#ec4899" />

      {/* Orbit Controls with bounded angles */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={8}
        maxDistance={45}
      />

      {/* 3D Parking Layout */}
      <ParkingGarageEnvironment targetSlot={targetSlotNumber} />

      {/* Glowing Route Ribbon */}
      <RouteRibbon waypoints={DEFAULT_WAYPOINTS} activeStep={currentStepIndex} />

      {/* Animated Navigating Car */}
      <NavigatingVehicle
        waypoints={DEFAULT_WAYPOINTS}
        currentStepIndex={currentStepIndex}
        carProgress={carProgress}
        vehicleType={vehicleType}
      />
    </Canvas>
  );
});
