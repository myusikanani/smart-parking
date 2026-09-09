import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlinePhone,
  HiOutlineBuildingOffice2,
  HiOutlineUser,
  HiOutlineTruck,
  HiOutlineCheckCircle
} from 'react-icons/hi2';
import Badge from './ui/Badge';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Booking } from '../types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const statusVariant: Record<string, BadgeVariant> = {
  confirmed: 'info',
  active: 'success',
  completed: 'neutral',
  expired: 'warning',
  cancelled: 'danger',
};

const paymentVariant: Record<string, BadgeVariant> = {
  pending: 'warning',
  paid: 'success',
  refunded: 'info',
  failed: 'danger',
};

interface ParkingPassProps {
  booking: Booking;
}

const ParkingPass = ({ booking }: ParkingPassProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>(booking.qrCode || '');
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keep live time updated for real-time grace window state changes
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Dynamic rotating QR fetcher
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let isMounted = true;

    const fetchDynamicQR = async () => {
      const bId = booking.id || (booking as unknown as { _id?: string })._id;
      if (!bId) return;

      try {
        setIsRotating(true);
        const res = await bookingApi.getDynamicQR(bId);
        if (isMounted && res.success && res.dynamicQrCode) {
          setDynamicQrUrl(res.dynamicQrCode);
          setSecondsLeft(res.expiresIn || 30);
        }
      } catch {
        if (isMounted && booking.qrCode) {
          setDynamicQrUrl(booking.qrCode);
        }
      } finally {
        if (isMounted) setIsRotating(false);
      }
    };

    fetchDynamicQR();

    timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchDynamicQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [booking.id, booking.qrCode]);

  // Extract display values
  const rawBooking = booking as unknown as Record<string, unknown>;
  const slotObj = (rawBooking.slot as Record<string, unknown>) || {};
  const slotNum = String(booking.slotNumber || slotObj.number || 'A-01');
  const floorNum = Number(slotObj.floor || 1);
  const categoryStr = String(booking.category || slotObj.category || 'Four Wheeler')
    .replace('-', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const userObj = typeof rawBooking.user === 'object' && rawBooking.user !== null ? (rawBooking.user as Record<string, unknown>) : null;
  const driverName: string = String(booking.userName || userObj?.name || user?.name || 'Registered Driver');

  const startTimeObj = new Date(booking.startTime);
  const endTimeObj = new Date(booking.endTime);

  const formatTime = (d: Date) =>
    isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (d: Date) =>
    isNaN(d.getTime()) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const startTimeStr = formatTime(startTimeObj);
  const endTimeStr = formatTime(endTimeObj);
  const dateStr = formatDate(startTimeObj);

  // 15-Minute Grace Period Timing Logic
  const earlyArrivalMs = startTimeObj.getTime() - 15 * 60 * 1000;
  const graceExpiryMs = startTimeObj.getTime() + 15 * 60 * 1000;
  const nowMs = currentTime.getTime();

  const isBeforeEarlyWindow = nowMs < earlyArrivalMs && booking.status === 'confirmed';
  const isWithinActiveWindow = nowMs >= earlyArrivalMs && nowMs <= graceExpiryMs;
  const isGraceExpired = (nowMs > graceExpiryMs || booking.status === 'expired') && booking.status !== 'active' && booking.status !== 'completed';
  const isCurrentlyParked = booking.status === 'active';

  const earlyTimeStr = formatTime(new Date(earlyArrivalMs));
  const graceExpiryTimeStr = formatTime(new Date(graceExpiryMs));

  const progressPercent = (secondsLeft / 30) * 100;

  return (
    <div className="rounded-2xl overflow-hidden neon-border-glow shadow-2xl">
      {/* Header with vibrant smart parking gradient */}
      <div className="bg-gradient-to-br from-cyan-600 via-indigo-600 to-emerald-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-base">P</span>
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-wide block">
                ParkSmart Gate Pass
              </span>
              <span className="text-[10px] text-cyan-200 tracking-wider font-semibold">
                DIGITAL RFID &amp; QR ACCESS
              </span>
            </div>
          </div>
          <Badge variant={statusVariant[booking.status] || 'neutral'}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>

        {/* Slot Bay Banner */}
        <div className="mb-4 p-3.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/15 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-300">Reserved Bay</p>
            <p className="text-xl font-black font-mono text-white tracking-wide">{slotNum}</p>
            <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
              <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-cyan-300" />
              Floor {floorNum} • {categoryStr}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/70">Vehicle Plate</p>
            <p className="text-sm font-bold font-mono text-cyan-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
              {booking.vehicleNumber}
            </p>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs">
            <p className="text-white/70 flex items-center gap-1 mb-0.5">
              <HiOutlineUser className="w-3.5 h-3.5 text-cyan-300" />
              Booked By
            </p>
            <p className="font-bold text-white truncate">{driverName}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs">
            <p className="text-white/70 flex items-center gap-1 mb-0.5">
              <HiOutlineTruck className="w-3.5 h-3.5 text-cyan-300" />
              Vehicle Type
            </p>
            <p className="font-bold text-white">{categoryStr}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs">
            <p className="text-white/70 mb-0.5">Entry Date</p>
            <p className="font-bold text-white">{dateStr}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-xs">
            <p className="text-white/70 mb-0.5">Duration</p>
            <p className="font-bold text-cyan-200 font-mono">
              {startTimeStr} → {endTimeStr}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket perforations */}
      <div className="relative">
        <div className="absolute left-0 top-0 w-6 h-6 bg-[var(--bg)] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute right-0 top-0 w-6 h-6 bg-[var(--bg)] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="border-t-2 border-dashed border-white/10" />
      </div>

      {/* QR Content Section with 15-Min Lifecycle State Management */}
      <div className="glass-card border-0 rounded-none p-6 space-y-4">
        {/* State A: Currently Parked (Active Session) */}
        {isCurrentlyParked && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Vehicle Currently Parked at {slotNum}</p>
              <p className="text-emerald-300 text-[11px]">Show this QR code at the exit gate barrier when leaving.</p>
            </div>
          </div>
        )}

        {/* State B: Before 15m Early Entry Window (e.g. 7:10 AM for 8:00 AM slot) */}
        {isBeforeEarlyWindow && (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-cyan-200">
              <HiOutlineClock className="w-4 h-4 text-cyan-400" />
              Scheduled Slot: {startTimeStr}
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Your digital entry pass will activate at <strong>{earlyTimeStr}</strong> (15 minutes early access enabled). You can enter anytime between <strong>{earlyTimeStr}</strong> and <strong>{graceExpiryTimeStr}</strong>.
            </p>
          </div>
        )}

        {/* State C: Inside Valid Active 15-Minute Window */}
        {isWithinActiveWindow && !isCurrentlyParked && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Gate Entry Active
            </span>
            <span className="text-[11px] text-gray-300 font-mono">
              Grace window ends at {graceExpiryTimeStr}
            </span>
          </div>
        )}

        {/* Dynamic Anti-Screenshot Badge (Only shown when QR is active) */}
        {!isGraceExpired && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <HiOutlineShieldCheck className="w-4 h-4" />
              Dynamic Anti-Fraud Protection
            </span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
              <HiOutlineArrowPath className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-cyan-400' : ''}`} />
              {secondsLeft}s
            </span>
          </div>
        )}

        {/* QR Code Display OR Grace Expiry Suggestion Card */}
        {!isGraceExpired ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.35)] overflow-hidden">
              <motion.div
                animate={{ y: [0, 120, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent pointer-events-none z-10"
              />
              <img
                src={
                  dynamicQrUrl ||
                  booking.qrCode ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    booking.qrToken || booking.id || 'PARKSMART-PASS'
                  )}`
                }
                alt="Dynamic Entry Pass QR Code"
                className="w-36 h-36 object-contain"
              />
            </div>

            <div className="w-36 mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                style={{ width: `${progressPercent}%` }}
                transition={{ ease: 'linear', duration: 1 }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              QR rotates every 30s • Scan at boom barrier camera
            </p>
          </div>
        ) : (
          /* STATE D: GRACE PERIOD EXPIRED (>15 MIN AFTER START TIME) - CLEAN SUGGESTION CARD */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <HiOutlineExclamationTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-amber-300">15-Minute Entry Window Expired</h3>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Your slot reservation at <strong>{slotNum}</strong> was scheduled for <strong>{startTimeStr}</strong>. The 15-minute gate check-in grace period expired at <strong>{graceExpiryTimeStr}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-left text-xs space-y-1.5 text-gray-300">
              <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                💡 Next Steps &amp; Suggestions:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-400">
                <li>This parking slot has been released to waiting drivers to prevent congestion.</li>
                <li>You can reserve a new slot immediately or explore other available bays on the live map.</li>
                <li>If you have arrived at the gate, please consult the security desk for assistance.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/book-parking')}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔄 Reserve a New Slot Now</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/booking-history')}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                >
                  📜 View Bookings
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center gap-1 transition-colors"
                >
                  <HiOutlinePhone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Support Desk</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <p className="text-xs font-semibold text-gray-400 tracking-wider font-mono">
            PASS ID: {(booking.id || 'BK-LIVE').slice(0, 8).toUpperCase()}
          </p>
          <Badge variant={paymentVariant[booking.paymentStatus] || 'success'}>
            {(booking.paymentStatus || 'paid').toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ParkingPass;
