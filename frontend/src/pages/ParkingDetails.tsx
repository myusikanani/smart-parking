import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineTruck,
  HiOutlineShoppingCart,
  HiOutlineBolt,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineBolt as HiOutlineBoltIcon,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { slotApi } from '../services/api';
import { CarSedan, BikeScooter, ElectricCar } from '../components/vehicles';
import type { ParkingSlot } from '../types';

const categoryIcons: Record<string, typeof HiOutlineTruck> = {
  'two-wheeler': HiOutlineTruck,
  'four-wheeler': HiOutlineShoppingCart,
  'ev': HiOutlineBolt,
  'disabled': HiOutlineUser,
};

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  available: 'success',
  occupied: 'danger',
  reserved: 'warning',
  maintenance: 'neutral',
};

const features = [
  '24/7 CCTV Surveillance',
  'Well-lit Parking Area',
  'Covered Parking',
  'Security Guard on Duty',
  'Easy Access Entry/Exit',
];

const ParkingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<ParkingSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlot = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await slotApi.getById(id);
      const data = response?.slot ?? null;
      setSlot(data as unknown as ParkingSlot | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parking slot');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlot();
  }, [id]);

  const backBtn = (
    <button onClick={() => navigate(-1)} className="text-sm hover:text-cyan-400 transition-colors" style={{ color: 'var(--text-secondary)' }}>
      &larr; Back
    </button>
  );

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {backBtn}
        <div className="glass-card p-6">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl" style={{ backgroundColor: 'var(--glass-bg)' }} />
              <div className="space-y-2">
                <div className="h-6 w-32 rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
                <div className="h-4 w-48 rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-xl glass">
                  <div className="h-4 w-12 rounded mx-auto mb-2" style={{ backgroundColor: 'var(--glass-bg)' }} />
                  <div className="h-7 w-16 rounded mx-auto" style={{ backgroundColor: 'var(--glass-bg)' }} />
                </div>
              ))}
            </div>
            <div className="h-40 rounded-xl" style={{ backgroundColor: 'var(--glass-bg)' }} />
            <div className="space-y-2">
              <div className="h-4 w-24 rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
              <div className="h-4 w-full rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
              <div className="h-4 w-3/4 rounded" style={{ backgroundColor: 'var(--glass-bg)' }} />
            </div>
            <div className="h-12 rounded-xl" style={{ backgroundColor: 'var(--glass-bg)' }} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {backBtn}
        <div className="glass-card p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchSlot}>Try Again</Button>
        </div>
      </motion.div>
    );
  }

  if (!slot) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {backBtn}
        <div className="glass-card p-6 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Parking slot not found</p>
        </div>
      </motion.div>
    );
  }

  const Icon = categoryIcons[slot.category];
  const isEV = slot.category === 'ev';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {backBtn}

      <div className="glass-card-glow rounded-2xl p-6 border border-cyan-500/30 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 hidden sm:block">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            {slot.category === 'two-wheeler' ? (
              <BikeScooter className="w-32 h-auto" color="#ec4899" />
            ) : slot.category === 'ev' ? (
              <ElectricCar className="w-36 h-auto" color="#10b981" />
            ) : (
              <CarSedan className="w-36 h-auto" color="#06b6d4" />
            )}
          </motion.div>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Icon className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Slot {slot.number}</h1>
            <p className="capitalize mt-1" style={{ color: 'var(--text-secondary)' }}>{slot.category.replace('-', ' ')} &middot; Floor {slot.floor}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Badge variant={statusVariant[slot.status]}>
            {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center relative overflow-hidden border-t-2 border-cyan-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Hourly</p>
          <p className="text-2xl font-bold text-cyan-400">₹{slot.pricePerHour}</p>
        </div>
        <div className="glass-card p-4 text-center relative overflow-hidden border-t-2 border-pink-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Daily</p>
          <p className="text-2xl font-bold text-pink-400">₹{slot.pricePerDay}</p>
        </div>
        <div className="glass-card p-4 text-center relative overflow-hidden border-t-2 border-green-500">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monthly</p>
          <p className="text-2xl font-bold text-green-400">₹{slot.pricePerMonth}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Pricing Breakdown</h3>
        <div className="glass-card rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--glass-bg)' }}>
                <th className="text-left px-4 py-3 font-medium text-cyan-400">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-cyan-400">Price</th>
                <th className="text-left px-4 py-3 font-medium text-cyan-400">Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              <tr>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>1 Hour</td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>₹{slot.pricePerHour}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>-</td>
              </tr>
              <tr>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>4 Hours</td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>₹{slot.pricePerHour * 4}</td>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>-</td>
              </tr>
              <tr>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Full Day</td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>₹{slot.pricePerDay}</td>
                <td className="px-4 py-3 text-green-400">Save ₹{slot.pricePerHour * 24 - slot.pricePerDay}</td>
              </tr>
              <tr>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>Monthly</td>
                <td className="px-4 py-3" style={{ color: 'var(--text)' }}>₹{slot.pricePerMonth}</td>
                <td className="px-4 py-3 text-green-400">Save ₹{slot.pricePerDay * 30 - slot.pricePerMonth}/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Features &amp; Amenities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineCheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              {f}
            </div>
          ))}
          {isEV && (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineBoltIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              EV Charging Station
            </div>
          )}
        </div>
      </div>

      <button
        className="btn-neon-pink w-full py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
        onClick={() => navigate('/book-parking', { state: { slot } })}
      >
        <HiOutlineShieldCheck className="w-5 h-5" />
        Book Now
      </button>
    </motion.div>
  );
};

export default ParkingDetails;
