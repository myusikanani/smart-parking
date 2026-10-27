import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlinePlusCircle,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineArrowRight
} from 'react-icons/hi2';
import { bookingApi } from '../services/api';
import { CarSedan, BikeScooter, ElectricCar, AccessibleCar } from '../components/vehicles';

interface WaitingStatusData {
  category: string;
  isJoined: boolean;
  position: number;
  totalWaiting: number;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  isFull: boolean;
  estimatedWaitMinutes: number;
  earliestWaitMinutes: number;
  earliestSlotNumber: string;
}

const categories = [
  { id: 'four-wheeler', label: 'Four Wheeler', icon: CarSedan, emoji: '🚗' },
  { id: 'two-wheeler', label: 'Two Wheeler', icon: BikeScooter, emoji: '🛵' },
  { id: 'ev', label: 'EV Charging', icon: ElectricCar, emoji: '⚡' },
  { id: 'disabled', label: 'Accessible / VIP', icon: AccessibleCar, emoji: '♿' },
];

const WaitingList = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('four-wheeler');
  const [statusData, setStatusData] = useState<WaitingStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadWaitingStatus = useCallback(async (cat: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await bookingApi.getWaitingList(cat);
      if (res) {
        setStatusData(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch waiting status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWaitingStatus(category);
  }, [category, loadWaitingStatus]);

  const handleJoin = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await bookingApi.joinWaitingList(category);
      setSuccessMsg(`✓ You have joined queue position #${res.position || 1}!`);
      await loadWaitingStatus(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join waiting list');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await bookingApi.leaveWaitingList(category);
      setSuccessMsg('✓ Left waiting list queue');
      await loadWaitingStatus(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave queue');
    } finally {
      setActionLoading(false);
    }
  };

  const currentCategoryObj = categories.find((c) => c.id === category) || categories[0];
  const CategoryIcon = currentCategoryObj.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-xl mx-auto space-y-6"
    >
      {/* Page Title & Visual Mascot */}
      <div className="relative flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-1.5">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            <span>Smart Queue Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold neon-text">Waiting List</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time queue tracking & auto bay release prediction
          </p>
        </div>
        <div className="hidden sm:block opacity-30">
          <CategoryIcon className="w-20 h-auto" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map((cat) => {
          const isSelected = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.id);
                setSuccessMsg('');
              }}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-semibold">
          {successMsg}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="animate-pulse glass-card p-8 rounded-3xl space-y-4">
          <div className="h-6 bg-white/10 rounded-xl w-1/2 mx-auto" />
          <div className="h-16 bg-white/10 rounded-2xl w-1/3 mx-auto" />
          <div className="h-8 bg-white/10 rounded-xl w-3/4 mx-auto" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {statusData && (
            <div className="space-y-4">
              {/* LIVE AVAILABILITY BANNER */}
              {statusData.availableSlots > 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-lg shadow-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0">
                      <HiOutlineCheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        {statusData.availableSlots} Bays Available Right Now!
                      </h4>
                      <p className="text-xs text-gray-400">
                        Total {statusData.totalSlots} bays in system. No wait needed for {currentCategoryObj.label}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard/book-parking')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md flex-shrink-0"
                  >
                    <span>Book Now</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
                  <span className="font-semibold">⚠️ All {statusData.totalSlots} {currentCategoryObj.label} bays are currently occupied.</span>
                  <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">100% Full</span>
                </div>
              )}

              {/* MAIN QUEUE STATUS CARD */}
              <div className="glass-card-glow p-6 sm:p-8 rounded-3xl text-center space-y-4 border border-cyan-500/30">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto text-cyan-300 shadow-inner">
                  <HiOutlineUserGroup className="w-8 h-8" />
                </div>

                {statusData.isJoined ? (
                  <div>
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest block mb-1">
                      Active Queue Position
                    </span>
                    <p className="text-6xl font-extrabold neon-text-cyan my-1 tracking-tight">
                      #{statusData.position}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-300 font-medium">
                      You are <strong className="text-white">#{statusData.position}</strong> in line for{' '}
                      <span className="text-cyan-300">{currentCategoryObj.label}</span> slots.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">
                      Next Available Queue Spot
                    </span>
                    <p className="text-6xl font-extrabold text-white my-1 tracking-tight">
                      #{statusData.position}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-300">
                      Join the queue to be notified as soon as a bay becomes free.
                    </p>
                  </div>
                )}

                {/* DYNAMIC TELEMETRY GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-left">
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold uppercase">
                      <HiOutlineClock className="w-3.5 h-3.5 text-pink-400" /> Wait Time
                    </span>
                    <strong className="text-sm font-mono text-pink-300 block">
                      {statusData.isFull
                        ? `${statusData.estimatedWaitMinutes} min`
                        : statusData.availableSlots > 0
                        ? '0 min (Instant)'
                        : `${statusData.earliestWaitMinutes} min`}
                    </strong>
                    <span className="text-[9px] text-gray-500 block">based on departures</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold uppercase">
                      <HiOutlineBolt className="w-3.5 h-3.5 text-cyan-400" /> Next Free Bay
                    </span>
                    <strong className="text-sm font-mono text-cyan-300 block">
                      {statusData.earliestSlotNumber || 'Bay A-01'}
                    </strong>
                    <span className="text-[9px] text-gray-500 block">earliest ending slot</span>
                  </div>

                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 col-span-2 sm:col-span-1 space-y-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-semibold uppercase">
                      <HiOutlineUserGroup className="w-3.5 h-3.5 text-emerald-400" /> Drivers in Queue
                    </span>
                    <strong className="text-sm font-mono text-emerald-300 block">
                      {statusData.totalWaiting} {statusData.totalWaiting === 1 ? 'driver' : 'drivers'}
                    </strong>
                    <span className="text-[9px] text-gray-500 block">for {currentCategoryObj.label}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2">
                  {statusData.isJoined ? (
                    <button
                      onClick={handleLeave}
                      disabled={actionLoading}
                      className="btn-danger w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                    >
                      <HiOutlineXCircle className="w-4 h-4" />
                      <span>Leave Waiting List</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={actionLoading}
                      className="btn-neon w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
                    >
                      <HiOutlinePlusCircle className="w-4 h-4" />
                      <span>Join Waiting List Queue (#{statusData.position})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Back to Dashboard Navigation */}
      <div className="text-center pt-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline px-6 py-2.5 rounded-xl inline-flex items-center gap-2 text-xs font-semibold"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    </motion.div>
  );
};

export default WaitingList;
