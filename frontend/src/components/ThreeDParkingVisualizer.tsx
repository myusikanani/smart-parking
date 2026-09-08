import { useState, type FC } from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, QrCode, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { CarSedan, ElectricCar, BikeScooter } from './vehicles';

export const ThreeDParkingVisualizer: FC = () => {
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [hoveredSpot, setHoveredSpot] = useState<number | null>(null);

  const parkingSpots = [
    { id: 1, name: 'A-01', type: 'car', status: 'occupied', color: '#06b6d4' },
    { id: 2, name: 'A-02', type: 'available', status: 'available', price: '₹30/h' },
    { id: 3, name: 'A-03', type: 'ev', status: 'charging', color: '#10b981' },
    { id: 4, name: 'B-01', type: 'available', status: 'available', price: '₹30/h' },
    { id: 5, name: 'B-02', type: 'car', status: 'occupied', color: '#ec4899' },
    { id: 6, name: 'B-03', type: 'bike', status: 'occupied', color: '#f59e0b' },
  ];

  return (
    <div className="relative w-full max-w-xl mx-auto p-2 select-none">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-[90px]" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500/15 rounded-full blur-[90px]" />
      </div>

      {/* MAIN THEME-ADAPTIVE INTERACTIVE APP SHOWCASE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl backdrop-blur-2xl transition-all"
      >
        {/* Top Floating App Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <h4 className="font-extrabold text-sm text-[var(--text)] flex items-center gap-1.5">
                Campus Floor {activeFloor} &middot; Real-Time Radar Grid
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)]">Sensors sync every second via IoT WebSockets</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
            {[1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFloor(f)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeFloor === f
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                F{f}
              </button>
            ))}
          </div>
        </div>

        {/* PARKING BAYS INTERACTIVE PREVIEW */}
        <div className="grid grid-cols-3 gap-3.5 pt-5 pb-2">
          {parkingSpots.map((spot) => {
            const isHovered = hoveredSpot === spot.id;
            const isAvail = spot.status === 'available';
            return (
              <div
                key={spot.id}
                onMouseEnter={() => setHoveredSpot(spot.id)}
                onMouseLeave={() => setHoveredSpot(null)}
                className={`relative aspect-[4/3] rounded-2xl border-2 transition-all duration-300 p-2.5 flex flex-col justify-between ${
                  isHovered
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/20 scale-[1.03]'
                    : isAvail
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400'
                    : 'border-pink-500/30 bg-pink-500/10 text-pink-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-[var(--text)]">{spot.name}</span>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isAvail ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-pink-500 shadow-[0_0_8px_#ec4899]'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-center my-1">
                  {spot.status === 'charging' ? (
                    <div className="flex flex-col items-center">
                      <ElectricCar className="w-14 h-auto" color="#10b981" />
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5 mt-0.5">
                        <Zap className="w-3 h-3 fill-emerald-400 animate-bounce" /> EV Charging
                      </span>
                    </div>
                  ) : spot.type === 'car' ? (
                    <CarSedan className="w-14 h-auto" color={spot.color} />
                  ) : spot.type === 'bike' ? (
                    <BikeScooter className="w-11 h-auto" color={spot.color} />
                  ) : (
                    <div className="text-center py-1">
                      <span className="text-[10px] font-extrabold text-emerald-400 block uppercase tracking-wider">AVAILABLE</span>
                      <span className="text-[11px] font-bold text-[var(--text)]">{spot.price}</span>
                    </div>
                  )}
                </div>

                <div className="text-[9px] font-mono font-bold text-center tracking-widest uppercase opacity-80 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                  {spot.status}
                </div>
              </div>
            );
          })}
        </div>

        {/* Driving Corridor Indicator */}
        <div className="mt-3 py-2 border-y border-dashed border-[var(--border)] bg-cyan-500/5 text-center text-[10px] font-mono text-cyan-400 tracking-widest uppercase flex items-center justify-between px-3">
          <span>➔ MAIN GATE 1</span>
          <span>DRIVE SLOWLY ➔</span>
          <span>EXIT GATE 2 ➔</span>
        </div>
      </motion.div>

      {/* FLOATING FEATURE BADGES AROUND THE SHOWCASE CARD */}
      {/* Top Left Badge */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute -top-3 -left-3 bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2.5 z-20"
      >
        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">ANPR Scanner</span>
          <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1">
            99.8% License Match <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </span>
        </div>
      </motion.div>

      {/* Top Right Badge */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="hidden sm:flex absolute top-6 -right-3 bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-2xl shadow-xl backdrop-blur-xl items-center gap-2.5 z-20"
      >
        <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center border border-pink-500/30">
          <QrCode className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">Gate Pass</span>
          <span className="text-xs font-bold text-pink-400">Instant QR Code</span>
        </div>
      </motion.div>

      {/* Bottom Right Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute -bottom-3 right-4 bg-[var(--bg-card)] border border-[var(--border)] p-2 sm:p-3 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-2.5 z-20"
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
          <Zap className="w-4 h-4 fill-emerald-400" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">EV Bays</span>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
            50kW Charging <Sparkles className="w-3 h-3 text-amber-400" />
          </span>
        </div>
      </motion.div>

      {/* Bottom Left Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="hidden md:flex absolute -bottom-2 -left-2 bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-2xl shadow-xl backdrop-blur-xl items-center gap-2.5 z-20"
      >
        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] block">Capacity</span>
          <span className="text-xs font-bold text-cyan-400">482 / 500 Open</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ThreeDParkingVisualizer;
