import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineArrowDownTray, HiOutlineEnvelope, HiOutlineHome, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { bookingApi } from '../services/api';
import ParkingPass from '../components/ParkingPass';
import { CarSedan } from '../components/vehicles';
import type { Booking } from '../types';

const QRCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [noPass, setNoPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    let mounted = true;
    const state = location.state as Record<string, unknown> | null;

    // SECURITY: a QR pass exists ONLY for backend-verified paid bookings.
    // Unpaid / failed / expired bookings must never render a scannable pass.
    const isPaidWithQR = (b: Record<string, unknown>) =>
      b.paymentStatus === 'paid' && !!b.qrCode && !!b.qrToken;

    const normalizeBooking = (b: Record<string, unknown>): Booking => ({
      ...b,
      id: String(b._id || b.id || ''),
    } as unknown as Booking);

    const loadPass = async () => {
      setLoading(true);
      setNoPass(false);
      try {
        if (state?.booking) {
          const raw = state.booking as Record<string, unknown>;
          if (isPaidWithQR(raw)) {
            if (mounted) setBooking(normalizeBooking(raw));
            return;
          }
          // Booking passed but not paid yet (or no QR) — never fabricate one.
          if (mounted) setNoPass(true);
          return;
        }

        if (state?.bookingId) {
          const res = await bookingApi.getById(state.bookingId as string);
          const raw = res.booking as unknown as Record<string, unknown> | undefined;
          if (mounted && raw && isPaidWithQR(raw)) {
            setBooking(normalizeBooking(raw));
            return;
          }
          if (mounted) setNoPass(true);
          return;
        }

        // Opened directly from menu: show the latest PAID booking that has a
        // real server-generated QR. Never fall back to fabricated/demo passes.
        const res = await bookingApi.getMyBookings();
        if (mounted && res.bookings && res.bookings.length > 0) {
          const paid = (res.bookings as Array<Record<string, unknown>>).find(isPaidWithQR);
          if (paid) {
            setBooking(normalizeBooking(paid));
            return;
          }
          setNoPass(true);
          return;
        }

        if (mounted) setNoPass(true);
      } catch (err) {
        console.error('QR Load error:', err);
        if (mounted) setNoPass(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPass();
    return () => { mounted = false; };
  }, [location.state]);

  const handleDownload = () => {
    if (!booking || !booking.qrCode) return;

    // Fetch image as blob for direct download
    fetch(booking.qrCode)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ParkEase-QRPass-${(booking.id || 'GATE').slice(0, 8).toUpperCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        window.open(booking.qrCode, '_blank');
      });
  };

  const handleEmailQR = async () => {
    if (!booking || emailing) return;
    setEmailing(true);
    setEmailError('');
    try {
      await bookingApi.emailQR(booking.id);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Could not email the QR pass. Please try again.');
    } finally {
      setEmailing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-8 glass-card text-center space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-cyan-400 font-semibold">Generating Entry QR Pass...</p>
      </div>
    );
  }

  if (!booking || noPass) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto glass-card p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <HiOutlineExclamationTriangle className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">No Active QR Pass</h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          A secure entry pass is generated only after your payment is verified.
          Complete the payment for your booking to get your QR code.
        </p>
        <div className="space-y-3">
          <button onClick={() => navigate('/book-parking')} className="btn-neon w-full py-3 px-6 rounded-xl font-semibold">
            Book &amp; Pay Now
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:text-white transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <HiOutlineHome className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto space-y-6"
    >
      <div className="text-center relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-4 right-0 opacity-20 hidden sm:block"
        >
          <CarSedan className="w-24 h-auto" color="#06b6d4" />
        </motion.div>
        <h1 className="text-2xl font-bold neon-text">Entry Pass</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Show this QR code at the entry gate</p>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <ParkingPass booking={booking} />
      </motion.div>

      <div className="space-y-3">
        <button
          className="btn-neon w-full py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          onClick={handleDownload}
        >
          <HiOutlineArrowDownTray className="w-5 h-5" />
          Download QR
        </button>
        <button
          className="btn-outline w-full py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
          onClick={handleEmailQR}
          disabled={emailing}
        >
          <HiOutlineEnvelope className="w-5 h-5" />
          {emailing ? 'Sending…' : emailSent ? 'Sent to your email ✓' : 'Email QR'}
        </button>
        {emailError && (
          <p className="text-xs text-red-400 text-center">{emailError}</p>
        )}
        <button
          className="w-full py-3 px-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:text-white transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onClick={() => navigate('/dashboard')}
        >
          <HiOutlineHome className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>
    </motion.div>
  );
};

export default QRCode;
