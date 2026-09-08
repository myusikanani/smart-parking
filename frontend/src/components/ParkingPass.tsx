import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck, HiOutlineArrowPath } from 'react-icons/hi2';
import Badge from './ui/Badge';
import { bookingApi } from '../services/api';
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
  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>(booking.qrCode || '');
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [isRotating, setIsRotating] = useState<boolean>(false);

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
      } catch (err) {
        // Fallback gracefully to static QR code if network or demo fallback
        if (isMounted && booking.qrCode) {
          setDynamicQrUrl(booking.qrCode);
        }
      } finally {
        if (isMounted) setIsRotating(false);
      }
    };

    fetchDynamicQR();

    // Interval to count down seconds and refresh dynamic QR
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

  const progressPercent = (secondsLeft / 30) * 100;

  return (
    <div className="rounded-2xl overflow-hidden neon-border-glow shadow-2xl">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-cyan-600 via-indigo-600 to-emerald-600 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md">
              <span className="text-white font-extrabold text-sm">P</span>
            </div>
            <div>
              <span className="text-sm font-extrabold text-white tracking-wide block">
                ParkSmart
              </span>
              <span className="text-[10px] text-cyan-200 tracking-wider font-semibold">
                SECURE ACCESS PASS
              </span>
            </div>
          </div>
          <Badge variant={statusVariant[booking.status] || 'neutral'}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-white/70 mb-0.5">Name</p>
            <p className="text-sm font-bold text-white">{booking.userName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/70 mb-0.5">Slot</p>
            <p className="text-sm font-bold text-cyan-200 font-mono">Slot #{booking.slotNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/70 mb-0.5">Vehicle</p>
            <p className="text-sm font-bold text-white font-mono">{booking.vehicleNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/70 mb-0.5">Booking Time</p>
            <p className="text-sm font-bold text-white">{new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Ticket perforations */}
      <div className="relative">
        <div className="absolute left-0 top-0 w-6 h-6 bg-[var(--bg)] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute right-0 top-0 w-6 h-6 bg-[var(--bg)] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="border-t-2 border-dashed border-white/10" />
      </div>

      {/* Dynamic QR Display & Anti-Screenshot protection */}
      <div className="glass-card border-0 rounded-none p-6 space-y-4">
        {/* Anti-screenshot badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <span className="flex items-center gap-1.5 font-semibold">
            <HiOutlineShieldCheck className="w-4 h-4" />
            Dynamic Anti-Fraud Protection
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-300">
            <HiOutlineArrowPath className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-cyan-400' : ''}`} />
            {secondsLeft}s
          </span>
        </div>

        {/* Dynamic rotating QR code */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative p-3 bg-white rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.35)] overflow-hidden">
            {/* Live scanning line overlay */}
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

          {/* Progress bar countdown */}
          <div className="w-36 mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              style={{ width: `${progressPercent}%` }}
              transition={{ ease: 'linear', duration: 1 }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            QR automatically rotates every 30s to prevent screenshot fraud
          </p>
        </div>

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
