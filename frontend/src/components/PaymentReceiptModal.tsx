import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePrinter, HiOutlineXMark } from 'react-icons/hi2';

export interface ReceiptTxn {
  transactionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  bookingId?: string;
  amount?: number;
  status?: string;
  method?: string;
  slotNumber?: string;
  location?: string;
  vehicleNumber?: string;
  startTime?: string;
  endTime?: string;
  updatedAt?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  txn: ReceiptTxn | null;
}

const fmt = (v?: string) => (v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const PaymentReceiptModal = ({ open, onClose, txn }: Props) => {
  if (!txn) return null;
  const paid = (txn.status || '') === 'paid';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="receipt-print glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold neon-text">Payment Receipt</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ParkEase · Smart Parking</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  paid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : txn.status === 'refunded' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {(txn.status || 'PENDING').toUpperCase()}
                </span>
              </div>

              <div className="rounded-xl border border-white/10 divide-y divide-white/5 text-sm">
                {[
                  ['Transaction ID', txn.transactionId || '—'],
                  ['Razorpay Payment ID', txn.razorpayPaymentId || '—'],
                  ['Razorpay Order ID', txn.razorpayOrderId || '—'],
                  ['Booking ID', txn.bookingId || '—'],
                  ['Parking Location', txn.location || '—'],
                  ['Slot', txn.slotNumber || '—'],
                  ['Vehicle', txn.vehicleNumber || '—'],
                  ['Start', fmt(txn.startTime)],
                  ['End', fmt(txn.endTime)],
                  ['Payment Method', txn.method || 'Razorpay'],
                  ['Paid On', fmt(txn.updatedAt)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-3 py-2">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-mono text-right break-all">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-white/10 pt-3">
                <span className="font-bold">Amount Paid</span>
                <span className="text-2xl font-bold neon-text-cyan">₹{Number(txn.amount ?? 0).toFixed(2)}</span>
              </div>

              <p className="text-[11px] text-gray-500 text-center">
                This is a computer-generated receipt. Payment verified securely via Razorpay.
              </p>
            </div>

            <div className="flex gap-3 mt-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 btn-neon font-semibold rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <HiOutlinePrinter className="w-5 h-5" />
                Download / Print
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 btn-outline font-semibold rounded-xl flex items-center justify-center gap-2 text-sm"
              >
                <HiOutlineXMark className="w-5 h-5" />
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentReceiptModal;
