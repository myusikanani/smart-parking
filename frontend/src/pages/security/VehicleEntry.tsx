import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineIdentification,
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

interface EntryLog {
  id: number;
  bookingId: string;
  vehicleNumber: string;
  slot: string;
  driverName: string;
  time: string;
}

interface BookingData {
  bookingId: string;
  vehicleNumber: string;
  slot: string;
  userName: string;
}

const SecurityVehicleEntry = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bookingId, setBookingId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('--');
  const [slotNumber, setSlotNumber] = useState('--');
  const [driverName, setDriverName] = useState('--');
  const [entryTime, setEntryTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [entryLogs, setEntryLogs] = useState<EntryLog[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [entryLoading, setEntryLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setEntryTime(
      currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    );
  }, [currentTime]);

  const handleLookup = async () => {
    const id = bookingId.trim();
    if (!id) return;
    setLookupLoading(true);
    setError('');
    setBookingData(null);
    try {
      const data = await bookingApi.getById(id);
      if (data.success) {
        const b = data.booking as Record<string, unknown>;
        const bData: BookingData = {
          bookingId: (b.bookingId as string) || id,
          vehicleNumber: (b.vehicleNumber as string) || '--',
          slot: (b.slot as string) || (b.slotNumber as string) || '--',
          userName: (b.userName as string) || ((b.user as Record<string, unknown>)?.name as string) || (b.user as string) || '--',
        };
        setBookingData(bData);
        setVehicleNumber(bData.vehicleNumber);
        setSlotNumber(bData.slot);
        setDriverName(bData.userName);
      } else {
        setError('Booking not found');
      }
    } catch {
      setError('Booking not found or API error');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAllowEntry = async () => {
    const id = bookingId.trim();
    if (!id) return;
    setEntryLoading(true);
    setError('');
    try {
      const data = await bookingApi.markEntry(id);
      if (data.success) {
        setSuccess(true);
        const log: EntryLog = {
          id: Date.now(),
          bookingId: id,
          vehicleNumber,
          slot: slotNumber,
          driverName,
          time: 'Just now',
        };
        setEntryLogs((prev) => [log, ...prev]);
      } else {
        setError('Failed to mark entry');
      }
    } catch {
      setError('Failed to process entry');
    } finally {
      setEntryLoading(false);
    }
  };

  const handleRejectEntry = () => {
    setBookingId('');
    setVehicleNumber('--');
    setSlotNumber('--');
    setDriverName('--');
    setBookingData(null);
    setSuccess(false);
    setError('');
  };

  const handleReset = () => {
    setBookingId('');
    setVehicleNumber('--');
    setSlotNumber('--');
    setDriverName('--');
    setBookingData(null);
    setSuccess(false);
    setError('');
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (success) {
    return (
      <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold neon-text">Vehicle Entry</h1>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(currentTime)}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">{entryTime}</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card-glow rounded-xl p-8 text-center border border-green-500/20">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                <HiOutlineCheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Entry Verified Successfully</h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Vehicle has been granted access</p>
              <div className="max-w-sm mx-auto space-y-2 rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Vehicle:</span>
                  <span className="font-medium text-gray-200">{vehicleNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Slot:</span>
                  <span className="font-medium text-gray-200">{slotNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Driver:</span>
                  <span className="font-medium text-gray-200">{driverName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-secondary)' }}>Time:</span>
                  <span className="font-medium text-gray-200">{entryTime}</span>
                </div>
              </div>
              <button onClick={handleReset} className="btn-outline px-6 py-2 rounded-xl text-sm font-semibold">
                Process Next Entry
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card rounded-xl p-5">
              <h2 className="text-lg font-semibold neon-text mb-4">Today's Entry Log</h2>
              {entryLogs.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-secondary)' }}>No entries yet this session</p>
            ) : (
              <div className="space-y-2">
                {entryLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border-l-4 border-green-500 transition-colors" style={{ backgroundColor: 'var(--glass-bg)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <HiOutlineCheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {log.vehicleNumber} <span style={{ color: 'var(--text-secondary)' }}>- Slot {log.slot}</span>
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{log.driverName} &middot; {log.time}</p>
                        </div>
                      </div>
                      <span className="badge-green">Entry</span>
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
                <CarSedan className="w-20 h-auto" color="#10b981" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Vehicle Entry</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{formatDate(currentTime)}</p>
          </div>
          <div className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl">
            <HiOutlineClock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-gray-200">{entryTime}</span>
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
            <h2 className="text-lg font-semibold neon-text mb-6">Entry Verification Form</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Booking ID</label>
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Vehicle Number</label>
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
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Slot Number</label>
                <div className="relative">
                  <HiOutlineCheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    value={slotNumber}
                    onChange={(e) => setSlotNumber(e.target.value)}
                    className="input-neon w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="input-neon w-full px-4 py-2.5 rounded-xl text-sm"
                />
              </div>
            </div>

            {lookupLoading && (
              <div className="mt-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-400">
                Looking up booking...
              </div>
            )}

            {bookingData && !lookupLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20"
              >
                <p className="text-sm text-green-400">
                  Booking found: {bookingData.vehicleNumber} - Slot {bookingData.slot} ({bookingData.userName})
                </p>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAllowEntry}
                disabled={!bookingData || entryLoading || lookupLoading}
                className="btn-neon-green flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              >
                <HiOutlineCheckCircle className="w-5 h-5" />
                {entryLoading ? 'Processing...' : 'Verify & Allow Entry'}
              </button>
              <button
                onClick={handleRejectEntry}
                className="btn-danger flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              >
                <HiOutlineXCircle className="w-5 h-5" />
                Reject Entry
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-lg font-semibold neon-text mb-4">Recent Entry Log</h2>
            {entryLogs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No entries yet this session</p>
            ) : (
              <div className="space-y-2">
                {entryLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl border-l-4 border-green-500 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <HiOutlineCheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {log.vehicleNumber} <span className="text-gray-400">- Slot {log.slot}</span>
                        </p>
                        <p className="text-xs text-gray-400">{log.driverName} &middot; {log.time}</p>
                      </div>
                    </div>
                    <span className="badge-green">Entry</span>
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

export default SecurityVehicleEntry;
