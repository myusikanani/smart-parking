import type { FC } from 'react';
import { motion } from 'framer-motion';
import { QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { CarSedan, ElectricCar, BikeScooter, AccessibleCar } from './vehicles';

interface ThreeDTicketPassProps {
  slotNumber: string;
  floor: number;
  category: string;
  vehicleNumber: string;
  date: string;
  startTime: string;
  hours: number;
  totalPrice: string;
}

export const ThreeDTicketPass: FC<ThreeDTicketPassProps> = ({
  slotNumber,
  floor,
  category,
  vehicleNumber,
  date,
  startTime,
  hours,
  totalPrice,
}) => {
  // Calculate End Time
  const calculateEndTime = () => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const startObj = new Date();
    startObj.setHours(h, m, 0, 0);
    const endObj = new Date(startObj.getTime() + hours * 60 * 60 * 1000);
    return endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formattedStartTime = () => {
    if (!startTime) return '';
    const [h, m] = startTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderIcon = () => {
    switch (category) {
      case 'two-wheeler':
        return <BikeScooter className="w-14 h-auto drop-shadow-lg" color="#f59e0b" />;
      case 'ev':
        return <ElectricCar className="w-16 h-auto drop-shadow-lg" color="#10b981" />;
      case 'disabled':
        return <AccessibleCar className="w-16 h-auto drop-shadow-lg" color="#a855f7" />;
      default:
        return <CarSedan className="w-16 h-auto drop-shadow-lg" color="#06b6d4" />;
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto select-none perspective-800">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-cyan-500/20 rounded-3xl blur-[40px] pointer-events-none" />

      {/* 3D TICKET PASS CONTAINER WITH CUTOUT NOTCHES */}
      <motion.div
        initial={{ rotateY: -10, scale: 0.95 }}
        animate={{ rotateY: 0, scale: 1 }}
        whileHover={{ rotateY: 5, scale: 1.02 }}
        transition={{ duration: 0.5 }}
        className="relative w-full bg-slate-950/90 border-2 border-cyan-500/40 rounded-3xl p-6 shadow-[0_20px_50px_rgba(6,182,212,0.3)] backdrop-blur-2xl text-white overflow-hidden"
      >
        {/* Ticket Side Cutout Notches */}
        <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-[var(--bg)] border-r-2 border-cyan-500/40 rounded-full shadow-inner z-30 -translate-y-1/2" />
        <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-[var(--bg)] border-l-2 border-cyan-500/40 rounded-full shadow-inner z-30 -translate-y-1/2" />

        {/* 1. TOP TICKET HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono text-[10px] font-extrabold tracking-widest text-cyan-300 uppercase">
              PARKSMART GATE PASS
            </span>
          </div>
          <div className="flex items-center gap-1 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-400/40 text-[9px] font-mono text-cyan-300 font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" /> RFID ACTIVE
          </div>
        </div>

        {/* 2. BAY & VEHICLE VISUAL SECTION */}
        <div className="py-4 flex items-center justify-between border-b border-dashed border-cyan-500/30">
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400 block font-semibold">RESERVED BAY</span>
            <span className="text-3xl font-extrabold font-mono text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">
              {slotNumber || 'BAY A-01'}
            </span>
            <span className="text-[11px] text-gray-300 block font-medium mt-0.5">
              Floor {floor || 1} &middot; Zone A
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            {renderIcon()}
            <span className="text-[9px] font-bold text-cyan-300 uppercase mt-1 tracking-wider">
              {category.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* 3. METALLIC LICENSE PLATE BADGE */}
        <div className="my-3 py-2 px-3 bg-slate-900 border-2 border-amber-500/40 rounded-xl flex items-center justify-between shadow-inner">
          <span className="text-[9px] uppercase font-mono text-amber-400 font-bold">VEHICLE PLATE</span>
          <span className="text-sm font-mono font-extrabold text-white tracking-widest">
            {vehicleNumber || 'GJ-01-AB-1234'}
          </span>
        </div>

        {/* 4. DATE & TIME SLOTS */}
        <div className="grid grid-cols-2 gap-2 py-2 text-xs border-b border-cyan-500/30">
          <div>
            <span className="text-[10px] text-gray-400 block font-mono">ENTRY DATE</span>
            <span className="font-bold text-white text-xs">{date || 'Today'}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block font-mono">DURATION</span>
            <span className="font-bold text-cyan-400 text-xs">
              {formattedStartTime()} ➔ {calculateEndTime()} ({hours}h)
            </span>
          </div>
        </div>

        {/* 5. ANIMATED QR CODE SCANNER PREVIEW */}
        <div className="py-4 flex items-center justify-between">
          <div className="relative w-20 h-20 bg-white p-1.5 rounded-xl border-2 border-cyan-400 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <QrCode className="w-full h-full text-slate-950" />
            {/* Animated Laser Scanner Line */}
            <motion.div
              animate={{ y: [-35, 35, -35] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#06b6d4]"
            />
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-400 block">TOTAL AMOUNT</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              ₹{totalPrice}
            </span>
            <span className="text-[9px] font-mono text-emerald-300 block bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
              ✓ INSTANT PASS
            </span>
          </div>
        </div>

        {/* 6. SECURITY WATERMARK FOOTER */}
        <div className="pt-2 border-t border-cyan-500/30 flex items-center justify-between text-[9px] text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> TOTP Encrypted
          </span>
          <span>AUTHY 2FA PROTECTED</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ThreeDTicketPass;
