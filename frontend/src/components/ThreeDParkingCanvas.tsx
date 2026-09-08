import { useRef, useState, useEffect, useMemo, type FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// Shared small-screen detection for mobile performance tuning (lower DPR,
// fewer floating HTML labels). Computed once per module load.
export const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;

export interface ThreeDSlotData {
  id: string;
  number: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled' | 'vip' | string;
  status: 'available' | 'occupied' | 'reserved' | 'recommended' | string;
  floor: number;
  pricePerHour?: number;
  x: number;
  z: number;
  rotation?: number;
}

// Non-slot layout elements designed in the Admin Layout Designer
// (Feature 2): entrance/exit gates, driving lanes, walking paths, and
// special zones (EV / handicap / VIP areas).
export interface ThreeDLayoutItem {
  id: string;
  type: 'entrance' | 'exit' | 'lane' | 'path' | 'ev_area' | 'handicap_area' | 'vip_area';
  x: number;
  z: number;
  rotation?: number;
  width?: number;
  length?: number;
  floor?: number;
}

// A vehicle currently animating into or out of a slot (Feature 8).
export interface MovingVehicle {
  id: string; // unique per animation instance
  slotId: string;
  phase: 'entering' | 'exiting';
  category?: string;
}

interface ThreeDParkingCanvasProps {
  slots: ThreeDSlotData[];
  selectedSlotId?: string | null;
  recommendedSlotId?: string | null;
  onSelectSlot?: (slot: ThreeDSlotData) => void;
  activeFloor?: number;
  heatmapMode?: boolean;
  // Optional custom layout (falls back to the default campus ground+lane if omitted)
  layoutItems?: ThreeDLayoutItem[];
  // Smart Search (Feature 7): highlight a matched slot distinctly from the AI pick
  highlightedSlotId?: string | null;
  // Admin Layout Designer drag & drop (Feature 2)
  draggableIds?: string[];
  onItemDrag?: (id: string, x: number, z: number) => void;
  onDragEnd?: (id: string, x: number, z: number) => void;
  // Real-time vehicle entry/exit animation (Feature 8)
  movingVehicles?: MovingVehicle[];
  onMotionComplete?: (id: string) => void;
}

// Slot Color Resolver according to specification
export const getSlotColor = (slot: ThreeDSlotData, isRecommended: boolean, heatmapMode: boolean = false): string => {
  if (heatmapMode) {
    if (slot.status === 'occupied') return '#ef4444'; // Red - High Usage
    if (slot.status === 'reserved') return '#f59e0b'; // Yellow - Medium Usage
    return '#10b981'; // Green - Low Usage
  }

  if (isRecommended) return '#3b82f6'; // Blue - AI Recommended

  switch (slot.category) {
    case 'ev':
      return slot.status === 'occupied' ? '#ef4444' : '#a855f7'; // Purple -> EV
    case 'vip':
      return slot.status === 'occupied' ? '#ef4444' : '#f97316'; // Orange -> VIP
    case 'disabled':
      return slot.status === 'occupied' ? '#ef4444' : '#64748b'; // Gray -> Disabled
    default:
      if (slot.status === 'occupied') return '#ef4444'; // Red -> Occupied
      if (slot.status === 'reserved') return '#f59e0b'; // Yellow -> Reserved
      return '#10b981'; // Green -> Available
  }
};

// Default gate coordinates used when no custom layout has been designed yet,
// and as the animation start/end point for vehicle motion.
const DEFAULT_ENTRANCE: [number, number] = [-17, 0];
const DEFAULT_EXIT: [number, number] = [17, 0];

// 3D Sedan Car Model
const ThreeDCar: FC<{ color: string; position: [number, number, number]; rotation?: number }> = ({
  color,
  position,
  rotation = 0,
}) => {
  const meshRef = useRef<THREE.Group>(null);

  return (
    <group ref={meshRef} position={position} rotation={[0, rotation, 0]}>
      {/* Car Base Body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.7, 0.5, 3.2]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Car Cabin */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[1.4, 0.45, 1.8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Headlights */}
      <mesh position={[-0.6, 0.45, 1.55]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.6, 0.45, 1.55]}>
        <boxGeometry args={[0.3, 0.15, 0.1]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      {/* Wheels */}
      {[-0.85, 0.85].map((x, i) =>
        [-1, 1].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.25, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        ))
      )}
    </group>
  );
};

// A car that smoothly drives from the gate to its slot (or the reverse),
// then disappears and reports completion so the parent can clear it.
const AnimatedVehicle: FC<{
  vehicle: MovingVehicle;
  targetSlot?: ThreeDSlotData;
  onComplete: (id: string) => void;
}> = ({ vehicle, targetSlot, onComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const done = useRef(false);
  const DURATION = 1.4; // seconds

  const gate = vehicle.phase === 'entering' ? DEFAULT_ENTRANCE : DEFAULT_EXIT;
  const slotPos: [number, number] = targetSlot ? [targetSlot.x, targetSlot.z] : [0, 0];
  const from = vehicle.phase === 'entering' ? gate : slotPos;
  const to = vehicle.phase === 'entering' ? slotPos : gate;

  useFrame((_, delta) => {
    if (!groupRef.current || done.current) return;
    elapsed.current += delta;
    const t = Math.min(1, elapsed.current / DURATION);
    // ease-in-out
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const x = from[0] + (to[0] - from[0]) * eased;
    const z = from[1] + (to[1] - from[1]) * eased;
    groupRef.current.position.set(x, 0.1, z);

    if (t >= 1) {
      done.current = true;
      onComplete(vehicle.id);
    }
  });

  if (!targetSlot) return null;

  return (
    <group ref={groupRef} position={[from[0], 0.1, from[1]]}>
      <ThreeDCar color={vehicle.category === 'ev' ? '#10b981' : vehicle.category === 'vip' ? '#f97316' : '#06b6d4'} position={[0, 0, 0]} />
    </group>
  );
};

// 3D EV Charging Station Pillar
const ThreeDEVStation: FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.4, 1.6, 0.4]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.2, 0.21]}>
        <planeGeometry args={[0.25, 0.3]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
};

// 3D Parking Bay Item
const ThreeDParkingBay: FC<{
  slot: ThreeDSlotData;
  isSelected: boolean;
  isRecommended: boolean;
  isHighlighted: boolean;
  heatmapMode: boolean;
  draggable: boolean;
  onSelect?: (slot: ThreeDSlotData) => void;
  onDragStart?: (id: string) => void;
}> = ({ slot, isSelected, isRecommended, isHighlighted, heatmapMode, draggable, onSelect, onDragStart }) => {
  const color = getSlotColor(slot, isRecommended, heatmapMode);
  const posX = slot.x;
  const posZ = slot.z;
  const rotation = slot.rotation || 0;
  // On small screens only render floating HTML labels for important slots
  // (selected / AI pick / search match) to keep the DOM light.
  const showLabel = !isMobileDevice || isRecommended || isHighlighted || isSelected;

  return (
    <group position={[posX, 0, posZ]} rotation={[0, rotation, 0]}>
      {/* Ground Parking Slot Box */}
      <mesh
        position={[0, 0.05, 0]}
        onPointerDown={(e) => {
          if (draggable) {
            e.stopPropagation();
            onDragStart?.(slot.id);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(slot);
        }}
        onPointerOver={() => { document.body.style.cursor = draggable ? 'grab' : 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[2.2, 0.08, 4.2]} />
        <meshStandardMaterial
          color={color}
          opacity={isSelected ? 0.9 : 0.4}
          transparent
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Outer Border Line */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[2.3, 0.02, 4.3]} />
        <meshBasicMaterial color={isSelected ? '#38bdf8' : color} wireframe />
      </mesh>

      {/* AI Recommended Glowing Ring (blue) */}
      {isRecommended && (
        <Float speed={3} rotationIntensity={0} floatIntensity={0.5}>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.8, 32]} />
            <meshBasicMaterial color="#3b82f6" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        </Float>
      )}

      {/* Smart Search match ring (amber) — distinct from the AI-recommended ring */}
      {isHighlighted && !isRecommended && (
        <Float speed={5} rotationIntensity={0} floatIntensity={0.4}>
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.8, 32]} />
            <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
        </Float>
      )}

      {/* Occupied Vehicle */}
      {slot.status === 'occupied' && (
        <ThreeDCar
          color={slot.category === 'ev' ? '#10b981' : slot.category === 'vip' ? '#f97316' : '#06b6d4'}
          position={[0, 0.1, 0]}
        />
      )}

      {/* EV Charging Station Pillar */}
      {slot.category === 'ev' && <ThreeDEVStation position={[1.3, 0, -1.8]} />}

      {/* Floating 3D HTML Label */}
      {showLabel && (
      <Html position={[0, 1.8, 0]} center distanceFactor={25}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(slot);
          }}
          className={`cursor-pointer px-2.5 py-1 rounded-xl text-[10px] font-extrabold font-mono flex items-center gap-1.5 shadow-xl transition-all ${
            isRecommended
              ? 'bg-blue-600 text-white border-2 border-blue-400 animate-bounce scale-110 shadow-[0_0_20px_rgba(59,130,246,0.8)]'
              : isHighlighted
              ? 'bg-amber-500 text-slate-950 border-2 border-amber-300 animate-bounce scale-110 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
              : isSelected
              ? 'bg-cyan-500 text-slate-950 border-2 border-white font-bold scale-110'
              : slot.status === 'occupied'
              ? 'bg-slate-900/90 text-red-400 border border-red-500/40'
              : 'bg-slate-900/90 text-emerald-400 border border-emerald-500/40 hover:scale-105'
          }`}
        >
          <span>{slot.number}</span>
          {isRecommended && <span>⭐ AI</span>}
          {isHighlighted && !isRecommended && <span>🔍</span>}
          {slot.category === 'ev' && <span>⚡</span>}
          {slot.category === 'vip' && <span>👑</span>}
          {slot.category === 'disabled' && <span>♿</span>}
        </div>
      </Html>
      )}
    </group>
  );
};

// Generic renderer for admin-designed layout elements: entrance/exit gates,
// driving lanes, walking paths, and EV/handicap/VIP zones.
const ThreeDLayoutElement: FC<{
  item: ThreeDLayoutItem;
  draggable: boolean;
  onDragStart?: (id: string) => void;
}> = ({ item, draggable, onDragStart }) => {
  const handlers = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (draggable) {
        e.stopPropagation();
        onDragStart?.(item.id);
      }
    },
    onPointerOver: () => { document.body.style.cursor = draggable ? 'grab' : 'auto'; },
    onPointerOut: () => { document.body.style.cursor = 'auto'; },
  };

  if (item.type === 'entrance' || item.type === 'exit') {
    const isEntrance = item.type === 'entrance';
    return (
      <group position={[item.x, 0.05, item.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} {...handlers}>
          <planeGeometry args={[4, 3]} />
          <meshStandardMaterial color={isEntrance ? '#10b981' : '#ef4444'} transparent opacity={0.35} />
        </mesh>
        <Html center distanceFactor={22}>
          <div
            className={`font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 font-mono tracking-wider ${
              isEntrance ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
            }`}
          >
            {isEntrance ? '➔ ENTRANCE GATE' : 'EXIT GATE ➔'}
          </div>
        </Html>
      </group>
    );
  }

  if (item.type === 'lane') {
    return (
      <group position={[item.x, 0.02, item.z]} rotation={[0, item.rotation || 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} {...handlers}>
          <planeGeometry args={[item.width || 24, item.length || 5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        {/* Center Dashed Road Line */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[item.width || 24, 0.25]} />
          <meshBasicMaterial color="#06b6d4" opacity={0.8} transparent />
        </mesh>
      </group>
    );
  }

  if (item.type === 'path') {
    // L-Corner Turn Bend
    return (
      <group position={[item.x, 0.03, item.z]} rotation={[0, item.rotation || 0, 0]}>
        {/* Main Road Arm */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} {...handlers}>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* L-Shape Bending Arm */}
        <mesh position={[4, 0.01, 3.5]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} {...handlers}>
          <planeGeometry args={[10, 5]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <Html center distanceFactor={25}>
          <div className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 shadow-lg">
            ↩️ L-Corner Turn
          </div>
        </Html>
      </group>
    );
  }

  // Special zones: ev_area / handicap_area / vip_area
  const zoneStyle: Record<string, { color: string; label: string }> = {
    ev_area: { color: '#a855f7', label: '⚡ EV Zone' },
    handicap_area: { color: '#64748b', label: '♿ Accessible Zone' },
    vip_area: { color: '#f97316', label: '👑 VIP Zone' },
  };
  const style = zoneStyle[item.type];

  return (
    <group position={[item.x, 0.03, item.z]} rotation={[0, item.rotation || 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} {...handlers}>
        <planeGeometry args={[item.width || 8, item.length || 8]} />
        <meshStandardMaterial color={style.color} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[(item.width || 8) / 2 - 0.1, (item.width || 8) / 2, 32]} />
        <meshBasicMaterial color={style.color} side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
      <Html center distanceFactor={28}>
        <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80" style={{ color: style.color }}>
          {style.label}
        </div>
      </Html>
    </group>
  );
};

// 3D Campus Road & Driving Lanes (fallback used only when no custom
// layoutItems were provided, so pre-existing pages keep working unchanged).
const Campus3DGround: FC = () => {
  return (
    <group position={[0, -0.01, 0]}>
      {/* Asphalt Floor Deck */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#090d16" roughness={0.8} />
      </mesh>

      {/* Main Driving Lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[36, 4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Lane Dashed Center Line */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[-16 + i * 3.5, 0.04, 0]}>
          <boxGeometry args={[1.8, 0.02, 0.15]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      ))}

      {/* Entrance Arrow Indicator */}
      <group position={[DEFAULT_ENTRANCE[0], 0.05, DEFAULT_ENTRANCE[1]]}>
        <Html center distanceFactor={22}>
          <div className="bg-emerald-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 font-mono tracking-wider">
            ➔ ENTRANCE GATE
          </div>
        </Html>
      </group>

      {/* Exit Arrow Indicator */}
      <group position={[DEFAULT_EXIT[0], 0.05, DEFAULT_EXIT[1]]}>
        <Html center distanceFactor={22}>
          <div className="bg-red-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1 font-mono tracking-wider">
            EXIT GATE ➔
          </div>
        </Html>
      </group>
    </group>
  );
};

// Invisible ground plane used purely to capture pointer-move/up events while
// an item is being dragged, converting screen movement into world X/Z.
const DragCaptureGround: FC<{
  active: boolean;
  onMove: (x: number, z: number) => void;
  onRelease: () => void;
}> = ({ active, onMove, onRelease }) => {
  if (!active) return null;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerMove={(e) => {
        e.stopPropagation();
        onMove(e.point.x, e.point.z);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onRelease();
      }}
      onPointerLeave={() => onRelease()}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
};

// Camera Smooth Controller — cinematic tween to the selected slot instead of
// an instant snap (Feature 8: "Camera Zoom" animation).
const CameraController: FC<{ selectedSlot?: ThreeDSlotData | null; dragging: boolean }> = ({ selectedSlot, dragging }) => {
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (selectedSlot) {
      targetPos.current.set(selectedSlot.x, 0, selectedSlot.z);
    }
  }, [selectedSlot]);

  useFrame(() => {
    if (!controlsRef.current) return;
    // Smoothly ease the orbit target toward the desired focus point every frame.
    controlsRef.current.target.lerp(targetPos.current, 0.08);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={!dragging}
      enableZoom={!dragging}
      enableRotate={!dragging}
      maxPolarAngle={Math.PI / 2.1}
      minDistance={5}
      maxDistance={45}
    />
  );
};

export const ThreeDParkingCanvas: FC<ThreeDParkingCanvasProps> = ({
  slots,
  selectedSlotId,
  recommendedSlotId,
  onSelectSlot,
  activeFloor,
  heatmapMode = false,
  layoutItems,
  highlightedSlotId,
  draggableIds,
  onItemDrag,
  onDragEnd,
  movingVehicles,
  onMotionComplete,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Multi-floor support (Feature 1): only render items belonging to the
  // active floor. Items without a floor tag are treated as floor-agnostic
  // so existing single-floor callers keep working unchanged.
  const visibleSlots = useMemo(
    () => slots.filter((s) => activeFloor === undefined || s.floor === undefined || s.floor === activeFloor),
    [slots, activeFloor]
  );
  const visibleLayoutItems = useMemo(
    () => (layoutItems || []).filter((it) => activeFloor === undefined || it.floor === undefined || it.floor === activeFloor),
    [layoutItems, activeFloor]
  );

  const selectedSlot = visibleSlots.find((s) => s.id === selectedSlotId || s.number === selectedSlotId);

  const isDraggable = (id: string) => !!draggableIds?.includes(id);

  const handleDragMove = (x: number, z: number) => {
    if (!draggingId) return;
    onItemDrag?.(draggingId, Math.round(x), Math.round(z));
  };

  const handleDragRelease = () => {
    if (draggingId) {
      // Final coordinates were already applied continuously via onItemDrag;
      // this just signals the drag has ended (e.g. for a "saved" indicator).
      onDragEnd?.(draggingId, 0, 0);
    }
    setDraggingId(null);
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[550px] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl bg-slate-950">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3 py-1.5 rounded-2xl backdrop-blur-xl pointer-events-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-cyan-300">
            FLOOR {activeFloor ?? 1} 3D PARKING DECK
          </span>
        </div>

        {/* 3D Slot Legend */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900/90 border border-[var(--border)] px-3 py-1.5 rounded-2xl text-[10px] font-mono text-gray-300 backdrop-blur-xl pointer-events-auto">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Free</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Occupied</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> AI Best</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Search Match</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> EV</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> VIP</span>
        </div>
      </div>

      {draggingId && (
        <div className="absolute bottom-4 left-4 z-20 bg-cyan-500/90 text-slate-950 text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl shadow-lg">
          🖱️ Dragging item — release to drop
        </div>
      )}

      {/* THREE.JS CANVAS */}
      <Canvas camera={{ position: [0, 18, 22], fov: 45 }} dpr={isMobileDevice ? [1, 1.5] : [1, 2]}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 20, 15]} intensity={1.5} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.8} />

        {visibleLayoutItems.length > 0 ? (
          <>
            {/* Base asphalt deck still renders under custom layouts */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
              <planeGeometry args={[40, 30]} />
              <meshStandardMaterial color="#090d16" roughness={0.8} />
            </mesh>
            {visibleLayoutItems.map((item) => (
              <ThreeDLayoutElement
                key={item.id}
                item={item}
                draggable={isDraggable(item.id)}
                onDragStart={setDraggingId}
              />
            ))}
          </>
        ) : (
          <Campus3DGround />
        )}

        {/* 3D Parking Slots */}
        {visibleSlots.map((slot) => (
          <ThreeDParkingBay
            key={slot.id}
            slot={slot}
            isSelected={slot.id === selectedSlotId || slot.number === selectedSlotId}
            isRecommended={slot.id === recommendedSlotId || slot.number === recommendedSlotId}
            isHighlighted={!!highlightedSlotId && (slot.id === highlightedSlotId || slot.number === highlightedSlotId)}
            heatmapMode={heatmapMode}
            draggable={isDraggable(slot.id)}
            onSelect={onSelectSlot}
            onDragStart={setDraggingId}
          />
        ))}

        {/* Real-time vehicle entry/exit animation */}
        {(movingVehicles || []).map((v) => (
          <AnimatedVehicle
            key={v.id}
            vehicle={v}
            targetSlot={visibleSlots.find((s) => s.id === v.slotId || s.number === v.slotId)}
            onComplete={(id) => onMotionComplete?.(id)}
          />
        ))}

        <DragCaptureGround active={!!draggingId} onMove={handleDragMove} onRelease={handleDragRelease} />

        <CameraController selectedSlot={selectedSlot} dragging={!!draggingId} />
      </Canvas>
    </div>
  );
};

export default ThreeDParkingCanvas;
