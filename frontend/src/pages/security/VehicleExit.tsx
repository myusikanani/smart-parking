import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineIdentification,
  HiOutlineUser,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import { bookingApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface BookingDetails {
  id: string;
  userName: string;
  slot: string;
  entryTime: string;
  duration: string;
  amount: number;
  status: string;
}

interface ExitLog {
  id: number;
  bookingId: string;
  vehicleNumber: string;
  slot: string;
  time: string;
  amount: number;
}

const SecurityVehicleExit = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookingId, setBookingId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [exitLogs, setExitLogs] = useState<ExitLog[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setExitTime(
      currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    );
  }, [currentTime]);

  const handleLookup = async () => {
    const id = bookingId.trim();
    if (!id) return;
    setLookupLoading(true);
    setError('');
    setBookingDetails(null);
    try {
      const data = await bookingApi.getById(id);
      if (data.success) {
        const b = data.booking as Record<string, unknown>;
        const entryTimeStr = (b.entryTime as string) || (b.createdAt as string) || '';
        const entryDate = entryTimeStr ? new Date(entryTimeStr) : null;
        const now = new Date();
        let durationStr = '--';
        let amount = 0;
        if (entryDate) {
          const diffMs = now.getTime() - entryDate.getTime();
          const diffHrs = Math.floor(diffMs / 3600000);
          const diffMins = Math.floor((diffMs % 3600000) / 60000);
          durationStr = `${diffHrs}h ${diffMins}m`;
          const rate = (b.rate as number) || 50;
          amount = Math.max(rate, Math.ceil(diffMs / 3600000) * rate);
        }
        setBookingDetails({
          id: (b.bookingId as string) || id,
          userName: (b.userName as string) || ((b.user as Record<string, unknown>)?.name as string) || (b.user as string) || '--',
          slot: (b.slot as string) || (b.slotNumber as string) || '--',
          entryTime: entryDate ? entryDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--',
          duration: durationStr,
          amount,
          status: (b.status as string) || 'active',
        });
        setVehicleNumber((b.vehicleNumber as string) || '--');
      } else {
        setError('Booking not found');
      }
    } catch {
      setError('Booking not found or API error');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCompleteExit = async () => {
    const id = bookingId.trim();
    if (!id) return;
    setExitLoading(true);
    setError('');
    try {
      const data = await bookingApi.markExit(id);
      if (data.success) {
        setConfirmed(true);
        const log: ExitLog = {
          id: Date.now(),
          bookingId: id,
          vehicleNumber,
          slot: bookingDetails?.slot || '--',
          time: 'Just now',
          amount: bookingDetails?.amount || 0,
        };
        setExitLogs((prev) => [log, ...prev]);
      } else {
        setError('Failed to process exit');
      }
    } catch {
      setError('Failed to process exit');
    } finally {
      setExitLoading(false);
    }
  };

  const handleReset = () => {
    setBookingId('');
    setVehicleNumber('');
    setBookingDetails(null);
    setConfirmed(false);
    setError('');
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (confirmed) {
    return (
      <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold neon-text">Vehicle Exit</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(currentTime)}</p>
            </div>
            <div className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl">
              <HiOutlineClock className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-mono text-gray-200">{exitTime}</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card-glow rounded-xl p-8 text-center border border-green-500/20">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                <HiOutlineCheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Exit Processed Successfully</h2>
              <p className="text-gray-400 mb-6">Vehicle exit has been recorded</p>
              <div className="max-w-sm mx-auto space-y-2 rounded-xl p-4 mb-6 bg-white/5 border border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Booking:</span>
                  <span className="font-medium text-gray-200">{bookingDetails?.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Vehicle:</span>
                  <span className="font-medium text-gray-200">{vehicleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-200">{bookingDetails?.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="font-medium text-green-400">₹{bookingDetails?.amount}</span>
                </div>
              </div>
              <button onClick={handleReset} className="btn-neon-amber px-6 py-2 rounded-xl text-sm font-semibold">
                Process Next Exit
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-lg font-semibold neon-text mb-4">Recent Exit Log</h2>
              {exitLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No exits yet this session</p>
              ) : (
                <div className="space-y-2">
                  {exitLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border-l-4 border-orange-500 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <HiOutlineCheckCircle className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">
                            {log.vehicleNumber} <span className="text-gray-400">- Slot {log.slot}</span>
                          </p>
                          <p className="text-xs text-gray-400">{log.time} &middot; ₹{log.amount}</p>
                        </div>
                      </div>
                      <span className="badge-orange">Exit</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#ec4899" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Vehicle Exit</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(currentTime)}</p>
          </div>
          <div className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl">
            <HiOutlineClock className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-mono text-gray-200">{exitTime}</span>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="glass-card p-4 rounded-xl border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-lg font-semibold neon-text mb-6">Exit Processing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Booking ID</label>
                <div className="relative">
                  <HiOutlineIdentification className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="Enter booking ID"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    onBlur={handleLookup}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    className="input-neon w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Vehicle Number</label>
                <div className="relative">
                  <HiOutlineTruck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="input-neon w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Exit Time</label>
                <div className="relative">
                  <HiOutlineClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="input-neon w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {lookupLoading && (
              <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400">
                Looking up booking...
              </div>
            )}

            {bookingDetails && !lookupLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 p-4 rounded-xl glass-card-glow border border-cyan-500/20"
              >
                <h3 className="text-sm font-semibold neon-text mb-3">Booking Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <HiOutlineUser className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">User</p>
                      <p className="text-sm font-medium text-gray-200">{bookingDetails.userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">Slot</p>
                      <p className="text-sm font-medium text-gray-200">{bookingDetails.slot}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">Entry Time</p>
                      <p className="text-sm font-medium text-gray-200">{bookingDetails.entryTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineClock className="w-4 h-4 text-pink-400" />
                    <div>
                      <p className="text-xs text-gray-400">Duration</p>
                      <p className="text-sm font-medium text-gray-200">{bookingDetails.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HiOutlineCurrencyDollar className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="text-sm font-medium text-green-400">₹{bookingDetails.amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-neon">{bookingDetails.status}</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleCompleteExit}
                disabled={!bookingDetails || exitLoading || lookupLoading}
                className="btn-neon-amber flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              >
                <HiOutlineCheckCircle className="w-5 h-5" />
                {exitLoading ? 'Processing...' : 'Process Exit'}
              </button>
              <button
                onClick={handleLookup}
                className="btn-outline flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              >
                <HiOutlineCheckCircle className="w-5 h-5" />
                Complete Exit
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-semibold neon-text mb-4">Recent Exit Log</h2>
            {exitLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No exits yet this session</p>
            ) : (
              <div className="space-y-2">
                {exitLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border-l-4 border-orange-500 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <HiOutlineCheckCircle className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {log.vehicleNumber} <span className="text-gray-400">- Slot {log.slot}</span>
                        </p>
                        <p className="text-xs text-gray-400">{log.time} &middot; ₹{log.amount}</p>
                      </div>
                    </div>
                    <span className="badge-orange">Exit</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SecurityVehicleExit;
