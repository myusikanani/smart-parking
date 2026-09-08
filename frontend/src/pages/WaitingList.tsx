import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUserGroup, HiOutlineClock, HiOutlineXCircle, HiOutlineArrowRightOnRectangle, HiOutlinePlusCircle } from 'react-icons/hi2';
import { bookingApi } from '../services/api';
import { CarSedan } from '../components/vehicles';

const categories = [
  { id: 'two-wheeler', label: 'Two Wheeler' },
  { id: 'four-wheeler', label: 'Four Wheeler' },
  { id: 'ev', label: 'EV' },
  { id: 'disabled', label: 'Disabled' },
];

const WaitingList = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('four-wheeler');
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [position, setPosition] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await bookingApi.getMyBookings();
        const bookings = (res.bookings || []) as Record<string, unknown>[];
        const cancelledExpired = bookings.filter(b =>
          (b.status as string) === 'cancelled' || (b.status as string) === 'expired'
        );
        setPosition(Math.min(cancelledExpired.length + 1, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      await bookingApi.joinWaitingList(category);
      setJoined(true);
      setPosition(prev => prev || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join waiting list');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = () => {
    setIsLeaving(true);
    setJoined(false);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const waitTimes: Record<string, string> = {
    'two-wheeler': '15 min',
    'four-wheeler': '35 min',
    'ev': '25 min',
    'disabled': '10 min',
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold neon-text">Waiting List</h1>
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Track your position in the queue</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-64 glass-card rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <div className="relative">
        <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <CarSedan className="w-24 h-auto" color="#10b981" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold neon-text">Waiting List</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Track your position in the queue</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {joined ? (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`glass-card-glow p-6 rounded-2xl text-center ${isLeaving ? 'opacity-50' : ''}`}>
            <div className="w-20 h-20 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-4">
              <HiOutlineUserGroup className="w-10 h-10 text-[#06b6d4]" />
            </div>
            <p className="text-5xl font-bold neon-text-cyan mb-2">#{position}</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              You are #{position} in line for{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>
                {categories.find(c => c.id === category)?.label}
              </span>{' '}
              slots
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineClock className="w-4 h-4 text-[#06b6d4]" />
              <span>Estimated wait time: <strong style={{ color: 'var(--text)' }}>{waitTimes[category]}</strong></span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 mt-6">
            <div className="glass-card p-4 w-full">
              <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <HiOutlineClock className="w-4 h-4 text-[#06b6d4]" />
                <span>Estimated wait: <strong style={{ color: 'var(--text)' }}>{waitTimes[category]}</strong></span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <HiOutlineUserGroup className="w-4 h-4 text-[#ec4899]" />
                <span>Category: <strong style={{ color: 'var(--text)' }}>{categories.find(c => c.id === category)?.label}</strong></span>
              </div>
            </div>
            <button
              onClick={handleLeave}
              disabled={isLeaving}
              className="btn-danger w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <HiOutlineXCircle className="w-5 h-5" />
                Leave Waiting List
              </span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="glass-card p-6 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-4">
              <HiOutlinePlusCircle className="w-8 h-8 text-[#06b6d4]" />
            </div>
            <h2 className="text-lg font-semibold text-center mb-2">Join Waiting List</h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
              Select a category to join the queue
            </p>

            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input-neon w-full"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="btn-neon w-full flex items-center justify-center gap-2"
            >
              {joining ? (
                <span className="animate-spin w-5 h-5 border-2 border-[#06b6d4] border-t-transparent rounded-full" />
              ) : (
                <HiOutlinePlusCircle className="w-5 h-5" />
              )}
              Join Waiting List
            </button>
          </div>
        </motion.div>
      )}

      <div className="text-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-outline inline-flex items-center gap-2"
        >
          <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  );
};

export default WaitingList;
