import { motion, AnimatePresence } from 'framer-motion';
import { BikeScooter, CarSedan, ElectricCar, AccessibleCar } from './vehicles';

interface Props {
  category: string;
  className?: string;
}

const vehicleMap: Record<string, { component: typeof CarSedan; color: string; label: string }> = {
  'two-wheeler': { component: BikeScooter, color: '#ec4899', label: 'Bike & Scooter' },
  'four-wheeler': { component: CarSedan, color: '#06b6d4', label: 'Car & SUV' },
  'ev': { component: ElectricCar, color: '#10b981', label: 'Electric Vehicle' },
  'disabled': { component: AccessibleCar, color: '#f59e0b', label: 'Accessible' },
};

const VehiclePreview3D = ({ category, className = '' }: Props) => {
  const vehicle = vehicleMap[category];
  if (!vehicle) return null;

  const Vehicle = vehicle.component;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={category}
        initial={{ opacity: 0, scale: 0.5, rotateY: -30, x: 50 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotateY: 30, x: -50 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className={`perspective-800 ${className}`}
      >
        <div className="relative preserve-3d">
          <motion.div
            animate={{ y: [0, -6, 0], rotateZ: [0, 0.5, 0, -0.5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="vehicle-glow-cyan"
          >
            <Vehicle
              className="w-full h-auto"
              color={vehicle.color}
              animate={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          >
            <div className="px-3 py-1 rounded-full glass text-xs font-semibold whitespace-nowrap"
              style={{ color: vehicle.color, borderColor: `${vehicle.color}33` }}>
              {vehicle.label}
            </div>
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px mx-auto"
            style={{ background: `linear-gradient(90deg, transparent, ${vehicle.color}66, transparent)` }}
          />

          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-2xl"
            style={{
              background: `radial-gradient(circle at center, ${vehicle.color}08, transparent 70%)`,
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VehiclePreview3D;
