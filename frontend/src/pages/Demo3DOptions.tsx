import { useState, useEffect, useRef, type FC, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DashboardHero3D from '../components/3d/DashboardHero3D';
import DashboardHero3D_A from '../components/3d/DashboardHero3D_A';
import DashboardHero3D_B from '../components/3d/DashboardHero3D_B';
import DashboardHero3D_C from '../components/3d/DashboardHero3D_C';
import Modal from '../components/ui/Modal';

/**
 * Preview-only route: /demo-3d
 * Shows the current User Dashboard hero next to the 3 redesign options
 * (A: refresh, B: new concept, C: interactive) so a choice can be made
 * before anything is wired into the real /dashboard page.
 *
 * Each WebGL section is lazy-mounted via IntersectionObserver so mobile
 * devices never run four GPU contexts at once.
 */
const LazyMount: FC<{ children: ReactNode; minHeight: number }> = ({ children, minHeight }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible ? children : null}
    </div>
  );
};

export default function Demo3DOptions() {
  const navigate = useNavigate();
  const [passOpen, setPassOpen] = useState(false);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-10 space-y-10" style={{ backgroundColor: 'var(--bg)' }}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">User Dashboard 3D Hero — Demo Options</h1>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
          Preview-only page. Nothing here is live on <code className="text-cyan-400">/dashboard</code> yet —
          jyare option pasand karo tyare j main dashboard ma implement karisu.
        </p>
      </div>

      {/* CURRENT (baseline) */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-gray-300 border border-white/10">CURRENT</span>
          <h2 className="text-lg font-bold text-white">Baseline — already live on /dashboard</h2>
        </div>
        <LazyMount minHeight={340}>
          <DashboardHero3D />
        </LazyMount>
      </motion.section>

      {/* OPTION A */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">OPTION A</span>
          <h2 className="text-lg font-bold text-white">Refresh — same concept, cinematic camera, symmetric HUD, PBR shine</h2>
        </div>
        <LazyMount minHeight={340}>
          <DashboardHero3D_A />
        </LazyMount>
      </motion.section>

      {/* OPTION B */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">OPTION B</span>
          <h2 className="text-lg font-bold text-white">New concept — floating "Digital Key Card" (pass + vehicle + QR combined)</h2>
        </div>
        <LazyMount minHeight={340}>
          <DashboardHero3D_B />
        </LazyMount>
      </motion.section>

      {/* OPTION C */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">OPTION C</span>
          <h2 className="text-lg font-bold text-white">Interactive — click the car to open the pass, click the card to browse slots</h2>
        </div>
        <LazyMount minHeight={340}>
          <DashboardHero3D_C
            onOpenPass={() => setPassOpen(true)}
            onViewSlots={() => navigate('/available-parking')}
          />
        </LazyMount>
        <p className="text-xs text-gray-500 mt-2">Try it: hover/click the car, or the pink "Nearby Slots" card above.</p>
      </motion.section>

      <Modal isOpen={passOpen} onClose={() => setPassOpen(false)} title="Digital Parking Pass (demo)">
        <div className="p-4 text-sm text-gray-300 space-y-2">
          <p>This is where the real <code className="text-cyan-400">ParkingPass</code> component would render —</p>
          <p className="text-white font-semibold">Slot A-01 · Floor 2 · Valid till 6:00 PM</p>
        </div>
      </Modal>
    </div>
  );
}
