import { motion } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { HiOutlineXCircle, HiOutlineArrowPath, HiOutlineCreditCard, HiOutlineLifebuoy } from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Pull the booking reference from the URL or router state so Retry resumes
  // the real Razorpay flow on the existing Payment page (no fake success).
  const stateBooking = (location.state as { booking?: { _id?: string; id?: string } })?.booking || null;
  const bookingId =
    searchParams.get('bookingId') || stateBooking?._id || stateBooking?.id || '';

  const handleRetry = () => {
    navigate(bookingId ? `/dashboard/payments?bookingId=${bookingId}` : '/dashboard/payments', { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-lg mx-auto space-y-6 text-center"
    >
      <div className="relative">
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.2 }}
          className="flex justify-center mb-2"
        >
          <CarSedan className="w-32 h-auto opacity-30" color="#ef4444" />
        </motion.div>
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-28 h-28 rounded-full bg-red-500/20 flex items-center justify-center mx-auto"
        style={{ boxShadow: '0 0 40px rgba(239, 68, 68, 0.3), 0 0 80px rgba(239, 68, 68, 0.15)' }}
      >
        <motion.div
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <HiOutlineXCircle className="w-14 h-14 text-red-400" />
        </motion.div>
      </motion.div>

      <div>
        <h1 className="text-3xl font-bold text-red-400">Payment Failed</h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Something went wrong with your transaction. Please try again.
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-center gap-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          <HiOutlineLifebuoy className="w-4 h-4 text-[#ec4899]" />
          <span>Need help? Contact support at support@parksmart.com</span>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 btn-neon font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <HiOutlineArrowPath className="w-5 h-5" />
            Retry Payment
          </button>
          <button
            onClick={() => navigate(bookingId ? `/dashboard/payments?bookingId=${bookingId}` : '/dashboard/payments')}
            className="w-full py-3 btn-outline font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <HiOutlineCreditCard className="w-5 h-5" />
            Payment Options
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium hover:text-[#06b6d4] transition-colors" style={{ color: 'var(--text-secondary)' }}
      >
        Back to Dashboard
      </button>
    </motion.div>
  );
};

export default PaymentFailed;
