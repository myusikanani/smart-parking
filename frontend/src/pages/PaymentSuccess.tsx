import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineEye, HiOutlineHome, HiOutlineReceiptPercent } from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';
import { bookingApi } from '../services/api';
import PaymentReceiptModal, { ReceiptTxn } from '../components/PaymentReceiptModal';

interface BookingShape extends Record<string, unknown> {
  _id?: string;
  id?: string;
  slot?: Record<string, unknown>;
  vehicleNumber?: string;
  startTime?: string;
  endTime?: string;
  amount?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  updatedAt?: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as { booking?: BookingShape; amount?: number } | undefined;

  const [booking, setBooking] = useState<BookingShape | undefined>(state?.booking);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Refresh-safe: reload the paid booking when router state is missing.
  useEffect(() => {
    if (state?.booking) return;
    const id = searchParams.get('bookingId');
    if (!id) return;
    let mounted = true;
    bookingApi.getById(id)
      .then((res) => { if (mounted && res.success && res.booking) setBooking(res.booking as BookingShape); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [state, searchParams]);

  const amountPaid = Number(booking?.amount ?? state?.amount ?? 0);
  const txn: ReceiptTxn = {
    transactionId: String(booking?.razorpayPaymentId || ''),
    razorpayPaymentId: String(booking?.razorpayPaymentId || ''),
    razorpayOrderId: String(booking?.razorpayOrderId || ''),
    bookingId: String(booking?._id || booking?.id || ''),
    amount: amountPaid,
    status: 'paid',
    method: 'Razorpay',
    slotNumber: String((booking?.slot as Record<string, unknown> | undefined)?.number || ''),
    location: String((booking?.slot as Record<string, unknown> | undefined)?.location || ''),
    vehicleNumber: String(booking?.vehicleNumber || ''),
    startTime: booking?.startTime,
    endTime: booking?.endTime,
    updatedAt: String(booking?.updatedAt || new Date().toISOString()),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto space-y-6 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-28 h-28 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto"
        style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.3), 0 0 80px rgba(16, 185, 129, 0.15)' }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 15 }}
        >
          <HiOutlineCheckCircle className="w-14 h-14 text-[#10b981]" />
        </motion.div>
      </motion.div>

      <div className="relative">
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.2 }}
          className="flex justify-center mb-2"
        >
          <CarSedan className="w-40 h-auto vehicle-glow-green" color="#10b981" />
        </motion.div>
      </div>

      <div>
        <h1 className="text-3xl font-bold neon-text">Payment Successful!</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Your booking is confirmed and your digital QR pass is active
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl text-left">
        <div className="space-y-3">
          {[
            ['Transaction ID', txn.transactionId || '—'],
            ['Razorpay Payment ID', txn.razorpayPaymentId || '—'],
            ['Amount Paid', `₹${amountPaid.toFixed(2)}`],
            ['Payment Date/Time', new Date(txn.updatedAt || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })],
            ['Booking ID', txn.bookingId || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{k}</span>
              <span className="font-mono font-medium text-sm break-all text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => navigate('/qr-code', { state: { booking } })}
          className="w-full py-3 btn-neon font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <HiOutlineEye className="w-5 h-5" />
          View Digital QR Pass
        </button>
        <button
          onClick={() => navigate('/booking-confirmation', { state: { booking } })}
          className="w-full py-3 btn-outline font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <HiOutlineEye className="w-5 h-5" />
          View Booking Details
        </button>
        <button
          onClick={() => setReceiptOpen(true)}
          className="w-full py-3 btn-outline font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <HiOutlineReceiptPercent className="w-5 h-5" />
          View / Download Receipt
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 text-gray-400 hover:text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <HiOutlineHome className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>

      <PaymentReceiptModal open={receiptOpen} onClose={() => setReceiptOpen(false)} txn={txn} />
    </motion.div>
  );
};

export default PaymentSuccess;
