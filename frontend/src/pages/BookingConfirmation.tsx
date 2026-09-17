import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiOutlineQrCode,
  HiOutlineHome,
  HiOutlineBuildingStorefront,
  HiOutlineMapPin,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
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
  const slotObj = (booking?.slot as Record<string, unknown>) || {};
  const slot = slotObj?.number || booking?.slotNumber || 'A-1';
  const locObj = (booking?.locationId as Record<string, unknown>) || (slotObj?.locationId as Record<string, unknown>) || null;
  const facilityName = String(locObj?.name || 'ParkSmart Prime');
  const facilityArea = String(locObj?.area || 'Surat');
  const facilityAddress = String(locObj?.address || '');
  const locLat = locObj?.latitude;
  const locLng = locObj?.longitude;
  const mapsUrl = locLat && locLng
    ? `https://www.google.com/maps/dir/?api=1&destination=${locLat},${locLng}`
    : facilityAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(facilityAddress + ', ' + facilityArea)}`
    : null;

  const date = booking?.startTime ? new Date(String(booking.startTime)).toLocaleDateString() : '2026-07-02';
  const time = booking?.startTime && booking?.endTime
    ? `${new Date(String(booking.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(String(booking.endTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '—';
  const amount = booking?.totalAmount || booking?.amount || 30;

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
            <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <HiOutlineBuildingStorefront className="w-4 h-4 text-cyan-400" /> Facility & Area
            </span>
            <div className="text-right">
              <span className="font-bold text-white block">{facilityName}</span>
              <span className="text-xs text-cyan-400 font-mono">📍 {facilityArea}</span>
            </div>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Reserved Bay</span>
            <span className="font-mono font-bold text-cyan-300">Bay #{String(slot)} (Floor {Number(slotObj?.floor || 1)})</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Date</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{String(date)}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Time Window</span>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{String(time)}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
            <span className="font-semibold text-emerald-400 font-mono">₹{String(amount)}</span>
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
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all"
          >
            <HiOutlineMapPin className="w-4 h-4 text-cyan-200" />
            <span>Open Driving Directions in Google Maps</span>
            <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
          </a>
        )}

        <button
          className="btn-neon w-full py-3 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
          onClick={() => navigate('/qr-code', { state: { booking } })}
        >
          <HiOutlineQrCode className="w-5 h-5" />
          View Digital Entry Pass (QR)
        </button>
        <button
          className="btn-outline w-full py-3 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2"
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
