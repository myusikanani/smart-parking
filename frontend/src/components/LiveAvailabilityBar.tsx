import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LiveSlot {
  status: string;
}

export default function LiveAvailabilityBar() {
  const [counts, setCounts] = useState<{ available: number; occupied: number; total: number } | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval>;

    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/slots`);
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!active) return;
        const slots: LiveSlot[] = Array.isArray(data.slots) ? data.slots : [];
        setCounts({
          available: slots.filter((s) => s.status === 'available').length,
          occupied: slots.filter((s) => s.status === 'occupied').length,
          total: slots.length,
        });
        setOnline(true);
      } catch {
        if (!active) return;
        setOnline(false);
      }
    };

    load();
    timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const status = counts
    ? counts.available / counts.total > 0.5
      ? { label: 'Plenty of space', color: '#22c55e', pulse: 'bg-emerald-400' }
      : counts.available / counts.total > 0.2
        ? { label: 'Getting busy', color: '#eab308', pulse: 'bg-yellow-400' }
        : { label: 'Almost full', color: '#ef4444', pulse: 'bg-red-500' }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-3 border border-white/5 text-center"
    >
      {counts ? (
        <>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${status?.pulse} animate-pulse`} />
            <span className="text-xs font-bold" style={{ color: status?.color }}>{status?.label}</span>
            {online && (
              <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">LIVE</span>
            )}
          </div>
          <div className="flex justify-center gap-4 text-[11px]">
            <span className="text-gray-400">
              <span className="font-bold text-emerald-400">{counts.available}</span> open
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">
              <span className="font-bold text-red-400">{counts.occupied}</span> taken
            </span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-400">
              <span className="font-bold text-cyan-400">{counts.total}</span> total
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
          <span className="text-xs text-gray-500">{online ? 'Connecting to live feed…' : 'Live feed offline — demo data shown'}</span>
        </div>
      )}
    </motion.div>
  );
}
