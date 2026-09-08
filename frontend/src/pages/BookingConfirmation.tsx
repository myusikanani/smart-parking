import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineQrCode, HiOutlineHome } from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    const state = window.history.state;
    const bookingData = state?.usr?.booking;
    if (bookingData) {
      setBooking(bookingData);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const bookingId = booking?.bookingId || booking?.id || 'BK-2F3A9C';
  const slot = (booking?.slot as Record<string, unknown>)?.number || 'A-1';
  const date = booking?.startTime ? new Date(String(booking.startTime)).toLocaleDateString() : '2026-07-02';
  const time = booking?.startTime && booking?.endTime
    ? `${new Date(String(booking.startTime)).toLocaleTimeString()} - ${new Date(String(booking.endTime)).toLocaleTimeString()}`
    : '10:00 AM - 12:00 PM';
  const amount = booking?.totalAmount || 25;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto space-y-6 text-center"
    >
      <div className="relative">
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <CarSedan className="w-48 h-auto vehicle-glow-cyan" color="#06b6d4" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 15 }}
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            >
              <HiOutlineCheckCircle className="w-6 h-6 text-cyan-400" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div>
        <h1 className="text-2xl font-bold neon-text">Booking Confirmed!</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Your parking slot has been reserved</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 text-left rotate-3d-card"
      >
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Booking ID</span>
            <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>{String(bookingId)}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Slot</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{String(slot)}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Date</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{String(date)}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Time</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{String(time)}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>₹{String(amount)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span className="badge-neon inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
              Confirmed
            </span>
          </div>
        </div>
      </motion.div>

      <div className="space-y-3">
        <button
          className="btn-neon w-full py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          onClick={() => navigate('/qr-code', { state: { booking } })}
        >
          <HiOutlineQrCode className="w-5 h-5" />
          View QR Code
        </button>
        <button
          className="btn-outline w-full py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          onClick={() => navigate('/dashboard')}
        >
          <HiOutlineHome className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  );
};

export default BookingConfirmation;
