import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineArrowDownTray, HiOutlineEnvelope, HiOutlineHome, HiOutlineExclamationTriangle, HiOutlineMapPin, HiOutlineChatBubbleLeftRight, HiOutlineXMark, HiOutlineCheck } from 'react-icons/hi2';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ParkingPass from '../components/ParkingPass';
import { CarSedan } from '../components/vehicles';
import type { Booking } from '../types';

const QRCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [noPass, setNoPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // WhatsApp Pass State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState(user?.phone || '9876543210');
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState('');

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

  const handleDownload = async () => {
    if (!booking) return;

    try {
      const raw = booking as unknown as Record<string, unknown>;
      const slotObj = (raw.slot as Record<string, unknown>) || {};
      const slotNum = String(booking.slotNumber || slotObj.number || 'A-01');
      const floorNum = Number(slotObj.floor || 1);
      const categoryStr = String(booking.category || slotObj.category || 'Four Wheeler')
        .replace('-', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const userObj = typeof raw.user === 'object' && raw.user !== null ? (raw.user as Record<string, unknown>) : null;
      const driverName = String(booking.userName || userObj?.name || user?.name || 'Registered Driver');
      const vehicleNum = String(booking.vehicleNumber || user?.vehicleNumber || 'MH-12-AB-3456');
      const passId = String(booking.id || raw._id || raw.id || 'GATE').slice(-8).toUpperCase();

      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);
      const timeFormat = (d: Date) => isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateFormat = (d: Date) => isNaN(d.getTime()) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      const dateStr = dateFormat(startDate);
      const timeStr = `${timeFormat(startDate)} → ${timeFormat(endDate)}`;

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1180;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark futuristic background
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, 800, 1180);

      // Card border
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 760, 1140);

      // Header Gradient
      const grad = ctx.createLinearGradient(20, 20, 780, 240);
      grad.addColorStop(0, '#0891b2');
      grad.addColorStop(0.5, '#4f46e5');
      grad.addColorStop(1, '#059669');
      ctx.fillStyle = grad;
      ctx.fillRect(20, 20, 760, 220);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('ParkEase Gate Pass', 50, 80);

      ctx.fillStyle = '#a5f3fc';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('DIGITAL RFID & QR PARKING ACCESS', 50, 110);

      // Confirmed Badge in Header
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(620, 50, 130, 36, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('CONFIRMED', 638, 74);

      // Bay & Plate Banner inside Header
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(50, 130, 700, 90, 16);
      ctx.fill();

      ctx.fillStyle = '#67e8f9';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('RESERVED BAY', 70, 155);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px monospace';
      ctx.fillText(`BAY ${slotNum}`, 70, 195);

      ctx.fillStyle = '#cffafe';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Floor ${floorNum} • ${categoryStr}`, 240, 195);

      // Plate Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(520, 145, 210, 60, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('VEHICLE PLATE', 535, 165);
      ctx.fillStyle = '#a5f3fc';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(vehicleNum, 535, 192);

      // Details Grid Box (4 tiles)
      const drawTile = (x: number, y: number, w: number, h: number, label: string, val: string, valColor = '#ffffff') => {
        ctx.fillStyle = '#131b2e';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 14);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(label.toUpperCase(), x + 16, y + 28);

        ctx.fillStyle = valColor;
        ctx.font = 'bold 17px sans-serif';
        ctx.fillText(val, x + 16, y + 56);
      };

      drawTile(50, 270, 335, 75, 'Driver Name', driverName);
      drawTile(415, 270, 335, 75, 'Vehicle Type', categoryStr);
      drawTile(50, 360, 335, 75, 'Entry Date', dateStr);
      drawTile(415, 360, 335, 75, 'Duration', timeStr, '#38bdf8');

      // Perforation line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 465);
      ctx.lineTo(750, 465);
      ctx.stroke();
      ctx.setLineDash([]);

      // Notches
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(20, 465, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(780, 465, 16, 0, Math.PI * 2);
      ctx.fill();

      // QR Container Box
      ctx.fillStyle = '#101828';
      ctx.beginPath();
      ctx.roundRect(50, 490, 700, 560, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Instructions Header
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ Verified Digital Entry Gate Pass', 400, 530);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText('Scan at boom barrier camera for barrier opening', 400, 555);

      // White background for QR code
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(260, 580, 280, 280, 24);
      ctx.fill();

      // Draw QR Image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src =
        booking.qrCode ||
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
          booking.qrToken || booking.id || 'PARKSMART-PASS'
        )}`;

      await new Promise((resolve) => {
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 275, 595, 250, 250);
          resolve(null);
        };
        qrImg.onerror = () => resolve(null);
      });

      // Footer bar inside QR Box
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PASS ID: ${passId}   •   STATUS: PAID`, 400, 915);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Valid 10m before arrival until 15m after slot time`, 400, 950);

      // Bottom Footer Copyright
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARKEASE SMART PARKING SYSTEM • OFFICIAL ENTRY PASS', 400, 1100);

      // Trigger Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ParkEase-ParkingPass-${passId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Download pass error:', err);
      // Fallback to direct QR image download
      if (booking.qrCode) {
        window.open(booking.qrCode, '_blank');
      }
    }
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

  const handleSendWhatsApp = async () => {
    if (!booking) return;
    setWhatsAppLoading(true);
    setWhatsAppError('');
    try {
      await bookingApi.sendWhatsAppTicket(booking.id, whatsAppPhone);
      setWhatsAppSuccess(true);
    } catch (err) {
      setWhatsAppError(err instanceof Error ? err.message : 'Could not send WhatsApp ticket.');
    } finally {
      setWhatsAppLoading(false);
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
        {/* 3D AR Navigation CTA */}
        <button
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white shadow-xl shadow-pink-500/25 transition-all transform hover:scale-[1.02]"
          onClick={() => navigate('/dashboard/navigation', { state: { booking } })}
        >
          <HiOutlineMapPin className="w-5 h-5 animate-pulse" />
          Start 3D / AR Turn-by-Turn Navigation ➔
        </button>

        {/* WhatsApp Pass Button */}
        <button
          className="w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/25 transition-all border border-emerald-400/40"
          onClick={() => setWhatsAppModalOpen(true)}
        >
          <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-emerald-200" />
          Send Instant Ticket to WhatsApp (Bot)
        </button>

        <button
          className="btn-neon w-full py-3.5 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          onClick={handleDownload}
        >
          <HiOutlineArrowDownTray className="w-5 h-5" />
          Download Parking Pass Card (PNG)
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

      {/* WHATSAPP TICKET PASS MODAL & LIVE BOT SIMULATOR */}
      <AnimatePresence>
        {whatsAppModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <HiOutlineChatBubbleLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">WhatsApp Instant Ticket Bot</h3>
                    <p className="text-[11px] text-emerald-400">Meta WhatsApp Cloud &amp; Twilio API</p>
                  </div>
                </div>
                <button
                  onClick={() => setWhatsAppModalOpen(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              {/* WhatsApp Chat Preview Bubble */}
              <div className="p-4 rounded-2xl bg-[#0b141a] border border-emerald-900/60 font-sans text-xs space-y-2 text-gray-200">
                <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                  <span>ParkSmart Verified Bot</span>
                  <span>Official Pass</span>
                </div>
                <div className="bg-[#1f2c34] p-3 rounded-xl border border-white/5 space-y-1.5 shadow-inner">
                  <p className="font-bold text-emerald-300">🎟️ PARKSMART OFFICIAL DIGITAL PASS</p>
                  <p>🚗 <strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                  <p>📍 <strong>Reserved Bay:</strong> Slot *{booking.slotNumber || 'A-04'}*</p>
                  <p>⏰ <strong>Validity:</strong> Active Session (QR Enabled)</p>
                  <p className="text-[10px] text-gray-400 mt-1">👉 Auto gate barrier access with TOTP security</p>
                </div>
              </div>

              {/* Phone Input & Action */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    Enter WhatsApp Mobile Number (E.164 format):
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-gray-300 flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={whatsAppPhone}
                      onChange={(e) => setWhatsAppPhone(e.target.value)}
                      placeholder="9876543210"
                      className="input-neon flex-1 px-4 py-2 text-xs font-mono rounded-xl"
                    />
                  </div>
                </div>

                {whatsAppError && (
                  <p className="text-xs text-red-400 text-center">{whatsAppError}</p>
                )}

                {whatsAppSuccess ? (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                    <HiOutlineCheck className="w-4 h-4" />
                    Ticket &amp; Directions sent to your WhatsApp!
                  </div>
                ) : (
                  <button
                    disabled={whatsAppLoading || !whatsAppPhone.trim()}
                    onClick={handleSendWhatsApp}
                    className="btn-neon w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {whatsAppLoading ? 'Dispatching via Meta API...' : '🚀 Send Pass to My WhatsApp'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QRCode;
