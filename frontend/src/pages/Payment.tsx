import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineReceiptPercent,
  HiOutlineQrCode,
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';
import { paymentApi, bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentReceiptModal, { ReceiptTxn } from '../components/PaymentReceiptModal';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface BookingData {
  _id?: string;
  id?: string;
  slot?: Record<string, unknown> | string;
  slotId?: string;
  slotNumber?: string;
  vehicleNumber?: string;
  startTime?: string;
  endTime?: string;
  amount?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  reservationExpiresAt?: string;
}

interface Txn extends ReceiptTxn {
  _id?: string;
  status?: string;
}

type PayStage = 'idle' | 'creating' | 'processing' | 'failed';
type TabType = 'pay' | 'history';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  processing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  refunded: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const fmt = (v?: string) =>
  v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const initialTab: TabType = searchParams.get('tab') === 'history' ? 'history' : 'pay';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Pay Now tab state
  const stateBooking = (location.state as { booking?: BookingData })?.booking || null;
  const [pendingBookings, setPendingBookings] = useState<BookingData[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(stateBooking);
  const [loadingPending, setLoadingPending] = useState(true);
  const [stage, setStage] = useState<PayStage>('idle');
  const [payError, setPayError] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  // Payment History tab state
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [receiptTxn, setReceiptTxn] = useState<Txn | null>(null);

  // Load Razorpay Script on mount
  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  // Fetch pending bookings cleanly without circular dependency
  const loadPendingBookings = useCallback(async (forcedTargetId?: string) => {
    try {
      const res = await bookingApi.getMyBookings('pending');
      if (res.success && Array.isArray(res.bookings)) {
        const pBookings = (res.bookings as BookingData[]).filter(
          (b) => b.status === 'pending' && b.paymentStatus !== 'paid'
        );
        setPendingBookings(pBookings);

        const targetId = forcedTargetId || searchParams.get('bookingId') || stateBooking?._id || stateBooking?.id;
        if (targetId) {
          const matched = pBookings.find((b) => (b._id || b.id) === targetId);
          if (matched) {
            setSelectedBooking(matched);
          } else {
            try {
              const singleRes = await bookingApi.getById(targetId);
              if (singleRes.success && singleRes.booking) {
                setSelectedBooking(singleRes.booking as BookingData);
              } else if (pBookings.length > 0) {
                setSelectedBooking(pBookings[0]);
              }
            } catch (_) {
              if (pBookings.length > 0) setSelectedBooking(pBookings[0]);
            }
          }
        } else if (pBookings.length > 0) {
          setSelectedBooking((prev) => prev || pBookings[0]);
        }
      }
    } catch (_) {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  }, [searchParams, stateBooking]);

  // Fetch payment history
  const loadPaymentHistory = useCallback(async () => {
    try {
      const res = await paymentApi.my();
      if (res.success && Array.isArray(res.transactions)) {
        setTxns((res.transactions || []) as Txn[]);
      }
    } catch (_) {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const queryBookingId = searchParams.get('bookingId');
  useEffect(() => {
    loadPendingBookings(queryBookingId || undefined);
    loadPaymentHistory();
  }, [queryBookingId, loadPendingBookings, loadPaymentHistory]);

  // Sync tab with search params
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'history') {
      newParams.set('tab', 'history');
    } else {
      newParams.delete('tab');
    }
    setSearchParams(newParams, { replace: true });
  };

  // If a bookingId is clicked in history to pay
  const handleSelectPendingToPay = (b: BookingData) => {
    setSelectedBooking(b);
    setPayError('');
    setStage('idle');
    handleTabChange('pay');
  };

  // Derived fields from selected booking
  const bookingId = selectedBooking?._id || selectedBooking?.id || '';
  const isPaid = selectedBooking?.paymentStatus === 'paid';
  const isRefunded = selectedBooking?.paymentStatus === 'refunded';

  const slotNumber =
    (typeof selectedBooking?.slot === 'object' && selectedBooking?.slot !== null
      ? ((selectedBooking.slot as Record<string, unknown>).number as string)
      : undefined) ||
    selectedBooking?.slotNumber ||
    selectedBooking?.slotId ||
    (typeof selectedBooking?.slot === 'string' && !/^[0-9a-fA-F]{24}$/.test(selectedBooking.slot)
      ? selectedBooking.slot
      : '') ||
    'Reserved Slot';

  const parkingLocation =
    (typeof selectedBooking?.slot === 'object' && selectedBooking?.slot !== null
      ? ((selectedBooking.slot as Record<string, unknown>).location as string)
      : undefined) || 'City Center Hub (Downtown)';

  const startTime = selectedBooking?.startTime || '';
  const endTime = selectedBooking?.endTime || '';
  const dateStr = startTime ? new Date(startTime).toLocaleDateString('en-CA') : 'N/A';
  const startStr = startTime
    ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';
  const endStr = endTime
    ? new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    : '';

  let durationText = '';
  let durationHours = 1;
  if (startTime && endTime) {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    durationHours = Math.max(1, Math.round(diffMs / 3600000));
    durationText =
      durationHours >= 24 ? `${Math.floor(durationHours / 24)} day(s)` : `${durationHours} Hour(s)`;
  }

  const subtotal = selectedBooking?.amount
    ? Number(selectedBooking.amount)
    : (() => {
        const pricePerHour =
          (typeof selectedBooking?.slot === 'object' && selectedBooking?.slot !== null
            ? ((selectedBooking.slot as Record<string, unknown>).pricePerHour as number)
            : undefined) || 30;
        return Math.max(pricePerHour * durationHours, 30);
      })();

  const convenienceFee = 0;
  const total = subtotal + convenienceFee;

  const handlePay = async () => {
    if (!bookingId) {
      setPayError('Missing booking reference — please select a booking to proceed.');
      return;
    }

    setPayError('');

    try {
      setStage('creating');
      const orderRes = await paymentApi.createOrder(bookingId);
      if (!orderRes.success) {
        setStage('failed');
        setPayError(orderRes.message || 'Could not start payment. Please try again.');
        return;
      }

      // Launch official Razorpay modal in Test Mode
      const keyId =
        (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) || orderRes.keyId;

      if (scriptReady && window.Razorpay && keyId) {
        setStage('processing');
        const razorpay = new window.Razorpay({
          key: keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          order_id: orderRes.orderId,
          name: 'ParkEase',
          description: `Payment for slot ${slotNumber}`,
          theme: { color: '#ec4899' },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await paymentApi.verify({
                bookingId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success && verifyRes.booking) {
                navigate('/payment-success', {
                  state: { booking: verifyRes.booking, amount: total },
                  replace: true,
                });
              } else {
                setStage('failed');
                setPayError(
                  verifyRes.message === 'Payment already verified'
                    ? 'This booking is already paid.'
                    : 'Payment verification failed. You can safely retry.'
                );
              }
            } catch (e) {
              setStage('failed');
              setPayError(
                e instanceof Error ? e.message : 'Payment verification failed. You can retry safely.'
              );
            }
          },
          modal: {
            ondismiss: () => {
              setStage('idle');
              setPayError('Payment was cancelled or closed. You can click Pay Now to retry.');
            },
          },
        });
        razorpay.open();
      } else {
        // Razorpay Test Mode fallback
        setStage('processing');
        const testPaymentId = `pay_test_${Date.now()}`;
        const testSignature = `test_sig_${Date.now()}`;
        const verifyRes = await paymentApi.verify({
          bookingId,
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: testSignature,
        });
        if (verifyRes.success && verifyRes.booking) {
          navigate('/payment-success', {
            state: { booking: verifyRes.booking, amount: total },
            replace: true,
          });
        } else {
          setStage('failed');
          setPayError(verifyRes.message || 'Payment verification failed.');
        }
      }
    } catch (err) {
      setStage('failed');
      setPayError(err instanceof Error ? err.message : 'Payment could not be started. Please try again.');
    }
  };

  const busy = stage === 'creating' || stage === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* HEADER WITH TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold neon-text">Payment</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/30">
              Razorpay Test Mode
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Complete your booking checkout and view past payment receipts
          </p>
        </div>

        {/* TAB TOGGLES */}
        <div className="inline-flex p-1 rounded-2xl glass-card border border-cyan-500/20 self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('pay')}
            className={`relative px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'pay' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {activeTab === 'pay' && (
              <motion.div
                layoutId="activePaymentTab"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 -z-10 shadow-lg shadow-pink-500/20"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <HiOutlineCreditCard className="w-4 h-4" />
            Pay Now
            {pendingBookings.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-extrabold">
                {pendingBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('history')}
            className={`relative px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'history' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {activeTab === 'history' && (
              <motion.div
                layoutId="activePaymentTab"
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 -z-10 shadow-lg shadow-cyan-500/20"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <HiOutlineBanknotes className="w-4 h-4" />
            Payment History
          </button>
        </div>
      </div>

      {/* TAB CONTENT: PAY NOW */}
      <AnimatePresence mode="wait">
        {activeTab === 'pay' && (
          <motion.div
            key="tab-pay"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {loadingPending ? (
              <div className="glass-card rounded-2xl p-16 text-center">
                <span className="animate-spin inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
                <p className="mt-4 text-sm text-gray-400">Loading your pending bookings…</p>
              </div>
            ) : !selectedBooking || (pendingBookings.length === 0 && !selectedBooking._id) ? (
              /* EMPTY STATE: NO PENDING PAYMENTS */
              <div className="glass-card rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
                  <HiOutlineShieldCheck className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">No pending payments</h2>
                  <p className="mt-2 text-sm text-gray-400">
                    You don't have any bookings awaiting payment. All your reservations are confirmed or completed.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => navigate('/dashboard/book-parking')}
                    className="w-full sm:w-auto px-6 py-3 btn-neon font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <HiOutlineSparkles className="w-4 h-4" />
                    Book a Slot
                  </button>
                  <button
                    onClick={() => handleTabChange('history')}
                    className="w-full sm:w-auto px-6 py-3 btn-outline font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    <HiOutlineBanknotes className="w-4 h-4" />
                    View Payment History
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE PAY NOW CHECKOUT */
              <div className="space-y-6">
                {/* SELECTOR IF MULTIPLE PENDING BOOKINGS */}
                {pendingBookings.length > 1 && (
                  <div className="glass-card p-4 rounded-2xl border border-amber-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <HiOutlineClock className="w-4 h-4" />
                        <span>Pending Reservations ({pendingBookings.length})</span>
                      </div>
                      <span className="text-[11px] text-gray-400">Click to switch booking</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {pendingBookings.map((b) => {
                        const isCur = (b._id || b.id) === bookingId;
                        const sNum =
                          typeof b.slot === 'object' && b.slot !== null
                            ? (b.slot as Record<string, unknown>).number
                            : b.slotNumber || 'Slot';
                        return (
                          <button
                            key={b._id || b.id}
                            onClick={() => handleSelectPendingToPay(b)}
                            className={`p-3 rounded-xl text-left text-xs transition-all border ${
                              isCur
                                ? 'bg-pink-500/10 border-pink-500 text-white shadow-md shadow-pink-500/10'
                                : 'bg-black/20 border-white/10 text-gray-300 hover:border-cyan-500/50'
                            }`}
                          >
                            <div className="flex justify-between font-bold">
                              <span>Slot {String(sNum)}</span>
                              <span className="text-cyan-400">₹{Number(b.amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1 font-mono truncate">
                              {b.vehicleNumber || '—'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* LEFT: BOOKING SUMMARY */}
                  <div className="lg:col-span-2">
                    <div className="glass-card p-6 rounded-2xl h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-base text-white">Booking Summary</h3>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${STATUS_STYLES.pending}`}>
                            PAYMENT REQUIRED
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Booking ID</span>
                            <span className="font-mono font-medium break-all text-right">{bookingId || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Location</span>
                            <span className="font-medium text-right">{parkingLocation}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Slot</span>
                            <span className="font-bold text-cyan-400">{slotNumber}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Vehicle Plate</span>
                            <span className="font-mono font-bold">{selectedBooking?.vehicleNumber || '—'}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Date</span>
                            <span className="font-medium">{dateStr}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Time</span>
                            <span className="font-medium">{startStr} - {endStr}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs sm:text-sm">
                            <span style={{ color: 'var(--text-muted)' }}>Duration</span>
                            <span className="font-medium">{durationText}</span>
                          </div>

                          <div className="border-t pt-3 mt-3 space-y-2.5" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span style={{ color: 'var(--text-muted)' }}>Base Parking Amount</span>
                              <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span style={{ color: 'var(--text-muted)' }}>Convenience Charge</span>
                              <span className="text-emerald-400 font-semibold">FREE</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4 flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-bold text-sm">Total Payable</span>
                        <span className="font-bold text-2xl neon-text-cyan">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: RAZORPAY CHECKOUT CARD */}
                  <div className="lg:col-span-3">
                    <div className="glass-card p-6 sm:p-7 rounded-2xl h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                              <HiOutlineCreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-base">Pay Securely</h3>
                              <p className="text-xs text-gray-400">Razorpay Test Checkout</p>
                            </div>
                          </div>
                          <div className="hidden sm:block">
                            <CarSedan className="w-20 h-auto opacity-70" color="#ec4899" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          {isRefunded ? (
                            <p className="text-sky-400 text-sm">This payment was refunded. No further action is needed.</p>
                          ) : (
                            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                              Clicking Pay Now opens the official Razorpay Checkout modal. You can test payment using UPI, Test Cards, Netbanking, or Wallets in Test Mode.
                              {!scriptReady && <span className="block mt-1 text-amber-400">Loading secure checkout…</span>}
                            </p>
                          )}

                          {stage === 'processing' && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-300 text-xs sm:text-sm">
                              <span className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full flex-shrink-0" />
                              Verifying payment signature with backend…
                            </div>
                          )}

                          {stage === 'failed' && payError && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs sm:text-sm">
                              <HiOutlineExclamationTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-red-400 font-bold">Payment Notice</p>
                                <p className="text-red-300/80 mt-0.5">{payError}</p>
                                {payError.toLowerCase().includes('no longer awaiting payment') ||
                                payError.toLowerCase().includes('expired') ||
                                payError.toLowerCase().includes('cancelled') ||
                                payError.toLowerCase().includes('already been paid') ||
                                selectedBooking?.status === 'expired' ||
                                selectedBooking?.status === 'cancelled' ? (
                                  <button
                                    onClick={() => navigate('/dashboard/book-parking')}
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-neon text-xs font-bold"
                                  >
                                    <HiOutlineSparkles className="w-4 h-4" />
                                    Book a New Slot
                                  </button>
                                ) : (
                                  <button
                                    onClick={handlePay}
                                    disabled={busy}
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-neon-pink text-xs font-bold disabled:opacity-50"
                                  >
                                    <HiOutlineArrowPath className="w-4 h-4" />
                                    Retry Payment
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {!isPaid && !isRefunded && stage !== 'failed' && (
                            <>
                              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span>256-bit encrypted checkout handled securely by Razorpay</span>
                              </div>

                              <button
                                disabled={busy || !scriptReady}
                                onClick={handlePay}
                                className="w-full py-4 btn-neon-pink font-bold text-base rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all"
                              >
                                {busy ? (
                                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  <HiOutlineShieldCheck className="w-5 h-5" />
                                )}
                                {stage === 'creating'
                                  ? 'Preparing Checkout…'
                                  : stage === 'processing'
                                  ? 'Verifying Payment…'
                                  : `PAY NOW — ₹${total.toFixed(2)}`}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-[11px] text-center mb-2" style={{ color: 'var(--text-muted)' }}>
                          Secured by Razorpay Payments
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs font-bold">
                          <span className="neon-text-cyan tracking-wider">RAZORPAY</span>
                          <span className="text-gray-400">UPI</span>
                          <span className="text-gray-400">VISA</span>
                          <span className="text-gray-400">MASTERCARD</span>
                          <span className="text-gray-400">NETBANKING</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB CONTENT: PAYMENT HISTORY */}
        {activeTab === 'history' && (
          <motion.div
            key="tab-history"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {loadingHistory ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="glass-card h-24 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : txns.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
                <HiOutlineBanknotes className="w-14 h-14 mx-auto text-cyan-400/40" />
                <div>
                  <h3 className="font-bold text-lg">No transactions yet</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Your parking payments and receipts will appear here once you make a booking.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/book-parking')}
                  className="btn-neon px-6 py-2.5 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
                >
                  <HiOutlineSparkles className="w-4 h-4" />
                  Book a Slot
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {txns.map((t, idx) => {
                  const isTxnPaid = t.status === 'paid';
                  const isTxnPending = t.status === 'pending';
                  const isTxnFailed = t.status === 'failed';

                  return (
                    <motion.div
                      key={t._id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      className="glass-card p-4 sm:p-5 rounded-2xl hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* LEFT: AMOUNT & BADGE */}
                        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1 sm:w-36 flex-shrink-0">
                          <span className="text-xl font-bold neon-text-cyan">
                            ₹{Number(t.amount ?? 0).toFixed(2)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wider border ${
                              STATUS_STYLES[t.status || 'pending'] || STATUS_STYLES.pending
                            }`}
                          >
                            {(t.status === 'paid' ? 'SUCCESSFUL' : t.status || 'PENDING').toUpperCase()}
                          </span>
                        </div>

                        {/* MIDDLE: DETAILS */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                          <div>
                            <span className="text-gray-500">Booking ID: </span>
                            <span className="font-mono text-gray-300 break-all">{t.bookingId || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Razorpay Payment ID: </span>
                            <span className="font-mono text-cyan-300 break-all">{t.razorpayPaymentId || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Razorpay Order ID: </span>
                            <span className="font-mono text-gray-400 break-all">{t.razorpayOrderId || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Slot: </span>
                            <span className="font-bold text-white">{t.slotNumber || '—'}</span>
                            {t.location ? <span className="text-gray-400 text-[11px]"> ({t.location})</span> : ''}
                          </div>
                          <div>
                            <span className="text-gray-500">Vehicle: </span>
                            <span className="font-mono font-semibold text-white">{t.vehicleNumber || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Date/Time: </span>
                            <span className="text-gray-300">{fmt(t.updatedAt)}</span>
                          </div>
                        </div>

                        {/* RIGHT: ACTION BUTTONS */}
                        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                          {isTxnPaid && (
                            <>
                              <button
                                onClick={() => setReceiptTxn(t)}
                                title="View Receipt"
                                className="px-3 py-2 rounded-xl btn-outline text-xs font-semibold flex items-center gap-1.5"
                              >
                                <HiOutlineReceiptPercent className="w-4 h-4 text-cyan-400" />
                                Receipt
                              </button>
                              <button
                                onClick={() =>
                                  navigate('/qr-code', { state: { bookingId: t.bookingId } })
                                }
                                title="View QR Pass"
                                className="px-3 py-2 rounded-xl btn-neon text-xs font-semibold flex items-center gap-1.5"
                              >
                                <HiOutlineQrCode className="w-4 h-4" />
                                QR Pass
                              </button>
                            </>
                          )}

                          {(isTxnPending || isTxnFailed) && (
                            <button
                              onClick={() =>
                                handleSelectPendingToPay({
                                  _id: t.bookingId,
                                  id: t.bookingId,
                                  amount: t.amount,
                                  slotNumber: t.slotNumber,
                                  vehicleNumber: t.vehicleNumber,
                                  startTime: t.startTime,
                                  endTime: t.endTime,
                                })
                              }
                              className="px-4 py-2 rounded-xl btn-neon-pink text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20"
                            >
                              <HiOutlineArrowPath className="w-4 h-4" />
                              Pay Now
                              <HiOutlineChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentReceiptModal open={!!receiptTxn} onClose={() => setReceiptTxn(null)} txn={receiptTxn} />
    </motion.div>
  );
};

export default Payment;
