import { useState } from 'react';
import type { FC } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineArrowTrendingUp,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ThreeDParkingCanvas from '../../components/ThreeDParkingCanvas';
import type { ThreeDSlotData } from '../../components/ThreeDParkingCanvas';

const weeklyData = [
  { day: 'Mon', occupancy: 65, revenue: 1450 },
  { day: 'Tue', occupancy: 72, revenue: 1820 },
  { day: 'Wed', occupancy: 85, revenue: 2300 },
  { day: 'Thu', occupancy: 78, revenue: 1980 },
  { day: 'Fri', occupancy: 92, revenue: 2850 },
  { day: 'Sat', occupancy: 88, revenue: 2600 },
  { day: 'Sun', occupancy: 60, revenue: 1300 },
];

const peakHoursData = [
  { hour: '08:00', load: 40 },
  { hour: '10:00', load: 85 },
  { hour: '12:00', load: 95 },
  { hour: '14:00', load: 78 },
  { hour: '16:00', load: 88 },
  { hour: '18:00', load: 90 },
  { hour: '20:00', load: 50 },
];

export const AIAnalyticsDashboard: FC = () => {
  const [activeFloor] = useState<number>(1);
  const [heatmapMode, setHeatmapMode] = useState(true);

  // Mock 3D slots for heatmap simulation
  const sampleSlots: ThreeDSlotData[] = [
    { id: '1', number: 'A-01', category: 'four-wheeler', status: 'occupied', floor: activeFloor, x: -10, z: -5 },
    { id: '2', number: 'A-02', category: 'four-wheeler', status: 'occupied', floor: activeFloor, x: -6, z: -5 },
    { id: '3', number: 'A-03', category: 'ev', status: 'available', floor: activeFloor, x: -2, z: -5 },
    { id: '4', number: 'A-04', category: 'vip', status: 'reserved', floor: activeFloor, x: 2, z: -5 },
    { id: '5', number: 'A-05', category: 'disabled', status: 'occupied', floor: activeFloor, x: 6, z: -5 },
    { id: '6', number: 'B-01', category: 'four-wheeler', status: 'available', floor: activeFloor, x: -10, z: 5 },
    { id: '7', number: 'B-02', category: 'four-wheeler', status: 'occupied', floor: activeFloor, x: -6, z: 5 },
    { id: '8', number: 'B-03', category: 'two-wheeler', status: 'available', floor: activeFloor, x: -2, z: 5 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Banner */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 mb-2">
            <HiOutlineSparkles className="w-4 h-4" /> AI Predictive Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
            AI Smart <span className="neon-text">Heatmap & Analytics</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Real-time occupancy heatmaps, peak hour traffic forecasts, and revenue projections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHeatmapMode(!heatmapMode)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              heatmapMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/20'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            🔥 {heatmapMode ? 'Heatmap Overlay Active' : 'Normal 3D Map'}
          </button>
        </div>
      </div>

      {/* AI PREDICTION CARD BANNER (FEATURE 6) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-3xl border-2 border-cyan-500/40 relative overflow-hidden bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-pink-950/40 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase font-bold text-cyan-400 tracking-widest flex items-center gap-1.5">
              <HiOutlineSparkles className="w-4 h-4 text-amber-400 animate-spin" /> Tomorrow's AI Traffic Forecast
            </span>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              Tomorrow Occupancy: <span className="text-cyan-300 font-mono text-3xl font-black">82%</span>
            </h2>
            <p className="text-xs text-gray-300">
              High Traffic Expected between <span className="text-amber-400 font-bold">11:00 AM - 03:00 PM</span>. Recommend opening Floor 2 EV bays early.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center gap-2 shadow-lg">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
            High Traffic Alert
          </div>
        </div>
      </motion.div>

      {/* FEATURE 5: AI HEATMAP 3D CANVAS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <HiOutlineSquares2X2 className="w-5 h-5 text-cyan-400" />
            Live 3D Occupancy Heatmap Visualizer
          </h3>
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Low Usage (&lt;40%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500" /> Med Usage (40-75%)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> High Usage (&gt;75%)</span>
          </div>
        </div>

        <ThreeDParkingCanvas
          slots={sampleSlots}
          activeFloor={activeFloor}
          heatmapMode={heatmapMode}
        />
      </div>

      {/* FEATURE 6: ANALYTICS CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Weekly Occupancy Trend */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <HiOutlineArrowTrendingUp className="w-5 h-5 text-cyan-400" />
            Weekly Occupancy Rate (%)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="occupancy" stroke="#06b6d4" fillOpacity={1} fill="url(#occupancyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Load */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-pink-400" />
            Peak Hours Load Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData}>
                <XAxis dataKey="hour" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="load" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;
