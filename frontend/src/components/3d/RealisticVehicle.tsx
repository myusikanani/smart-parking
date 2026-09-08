import { useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type VehicleModelType = 'tesla' | 'audi' | 'porsche' | 'suv' | 'bike';

interface RealisticVehicleProps {
  type?: VehicleModelType;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  isDriving?: boolean;
  speed?: number;
  headlightsOn?: boolean;
  brakeLightsOn?: boolean;
}

export const RealisticVehicle = memo(function RealisticVehicle({
  type = 'tesla',
  color = '#06b6d4',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  isDriving = false,
  speed = 1,
  headlightsOn = true,
  brakeLightsOn = false,
}: RealisticVehicleProps) {
  const wheelsGroupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (isDriving && wheelsGroupRef.current) {
      wheelsGroupRef.current.children.forEach((wheel) => {
        wheel.rotation.x += delta * 12 * speed;
      });
    }
  });

  const scaleArray: [number, number, number] = typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <group position={position} rotation={rotation} scale={scaleArray}>
      <group ref={bodyGroupRef}>
        {/* CAR BODY & STYLING BASED ON TYPE */}
        {type === 'tesla' && (
          <>
            {/* Sleek EV Sedan Lower Chassis */}
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.85, 0.55, 3.8]} />
              <meshStandardMaterial
                color={color}
                metalness={0.85}
                roughness={0.15}
                envMapIntensity={1.5}
              />
            </mesh>
            {/* Aerodynamic Glass Canopy */}
            <mesh position={[0, 0.95, -0.1]} castShadow>
              <boxGeometry args={[1.55, 0.5, 2.1]} />
              <meshPhysicalMaterial
                color="#0f172a"
                metalness={0.9}
                roughness={0.05}
                transmission={0.4}
                thickness={0.5}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Front Hood Slope accent */}
            <mesh position={[0, 0.55, 1.2]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[1.75, 0.2, 1.3]} />
              <meshStandardMaterial color={color} metalness={0.85} roughness={0.15} />
            </mesh>
          </>
        )}

        {type === 'porsche' && (
          <>
            {/* Low-slung Sports Car Body */}
            <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.9, 0.45, 3.9]} />
              <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Curved Cockpit */}
            <mesh position={[0, 0.82, -0.2]} castShadow>
              <cylinderGeometry args={[0.72, 0.85, 0.48, 16]} />
              <meshPhysicalMaterial color="#020617" metalness={0.95} roughness={0.05} />
            </mesh>
            {/* Rear Spoiler */}
            <mesh position={[0, 0.72, -1.8]}>
              <boxGeometry args={[1.7, 0.08, 0.35]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
          </>
        )}

        {type === 'suv' && (
          <>
            {/* Bold Premium SUV Body */}
            <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.0, 0.85, 4.2]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
            </mesh>
            {/* High Roof Cabin */}
            <mesh position={[0, 1.3, -0.1]} castShadow>
              <boxGeometry args={[1.75, 0.65, 2.5]} />
              <meshPhysicalMaterial color="#0f172a" metalness={0.8} roughness={0.1} />
            </mesh>
            {/* Roof Rails */}
            <mesh position={[-0.8, 1.68, -0.1]}>
              <boxGeometry args={[0.06, 0.08, 2.4]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh position={[0.8, 1.68, -0.1]}>
              <boxGeometry args={[0.06, 0.08, 2.4]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
          </>
        )}

        {type === 'audi' && (
          <>
            {/* Executive Fastback Body */}
            <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.88, 0.58, 4.0]} />
              <meshStandardMaterial color={color} metalness={0.88} roughness={0.12} />
            </mesh>
            {/* Slanted Glass Roof */}
            <mesh position={[0, 0.98, -0.15]} rotation={[-0.1, 0, 0]} castShadow>
              <boxGeometry args={[1.6, 0.52, 2.3]} />
              <meshPhysicalMaterial color="#090d16" metalness={0.9} roughness={0.05} />
            </mesh>
          </>
        )}

        {type === 'bike' && (
          <>
            {/* Sleek Electric Scooter / Bike Frame */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.4, 0.5, 1.8]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.8, 0.4]}>
              <cylinderGeometry args={[0.05, 0.05, 0.7]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
          </>
        )}

        {/* LED HEADLIGHTS & GLOW */}
        {headlightsOn && type !== 'bike' && (
          <group position={[0, 0.48, 1.95]}>
            {/* Left LED Matrix Strip */}
            <mesh position={[-0.68, 0, 0]}>
              <boxGeometry args={[0.35, 0.12, 0.08]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Right LED Matrix Strip */}
            <mesh position={[0.68, 0, 0]}>
              <boxGeometry args={[0.35, 0.12, 0.08]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Center LED Light Bar for Tesla / Audi EVs */}
            <mesh position={[0, 0.04, 0.02]}>
              <boxGeometry args={[1.1, 0.04, 0.06]} />
              <meshBasicMaterial color="#7dd3fc" />
            </mesh>
          </group>
        )}

        {/* REAR LED TAILLIGHTS */}
        {type !== 'bike' && (
          <group position={[0, 0.52, -1.95]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.7, 0.08, 0.06]} />
              <meshBasicMaterial color={brakeLightsOn ? '#ff0033' : '#ef4444'} />
            </mesh>
          </group>
        )}

        {/* DRIVING LICENSE PLATE */}
        {type !== 'bike' && (
          <mesh position={[0, 0.28, 1.93]}>
            <planeGeometry args={[0.55, 0.18]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
        )}
      </group>

      {/* WHEELS GROUP WITH SPINNING ANIMATION */}
      <group ref={wheelsGroupRef}>
        {type !== 'bike' ? (
          <>
            {[-0.95, 0.95].flatMap((x, i) =>
              [-1.15, 1.15].map((z, j) => (
                <group key={`${i}-${j}`} position={[x, 0.28, z]}>
                  {/* Tire Rubber */}
                  <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.28, 0.28, 0.22, 24]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.9} />
                  </mesh>
                  {/* Alloy Wheel Rim */}
                  <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.18, 0.18, 0.23, 12]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
                  </mesh>
                </group>
              ))
            )}
          </>
        ) : (
          <>
            {[-0.65, 0.65].map((z, j) => (
              <group key={j} position={[0, 0.25, z]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.25, 0.25, 0.12, 20]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.9} />
                </mesh>
              </group>
            ))}
          </>
        )}
      </group>

      {/* GROUND DYNAMIC SHADOW */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 4.2]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
});

export default RealisticVehicle;
