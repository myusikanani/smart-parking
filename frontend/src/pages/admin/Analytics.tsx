import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminApi } from '../../services/api';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import { ElectricCar } from '../../components/vehicles';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const hourLabels = ['6A', '7A', '8A', '9A', '10A', '11A', '12P', '1P', '2P', '3P', '4P', '5P', '6P', '7P'];

const getHeatColor = (value: number) => {
  if (value >= 80) return 'bg-blue-400';
  if (value >= 65) return 'bg-blue-300';
  if (value >= 50) return 'bg-blue-200';
  if (value >= 35) return 'bg-blue-100';
  return 'bg-slate-100';
};

const COLORS = ['#06b6d4', '#ec4899', '#f97316', '#10b981'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [peakHours, setPeakHours] = useState<Record<string, unknown>[]>([]);
  const [vehicleDistribution, setVehicleDistribution] = useState<Record<string, unknown>[]>([]);
  const [bookingTrend, setBookingTrend] = useState<Record<string, unknown>[]>([]);
  const [occupancyGrid, setOccupancyGrid] = useState<Record<string, unknown>[]>([]);
  const [averageDuration, setAverageDuration] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getAnalytics()
      .then((res) => {
        if (!mounted) return;
        const d = res.analytics || {};
        setPeakHours((d.peakHours as Record<string, unknown>[]) || []);
        setVehicleDistribution((d.vehicleDistribution as Record<string, unknown>[]) || []);
        setBookingTrend((d.bookingTrend as Record<string, unknown>[]) || []);
        setOccupancyGrid((d.occupancyGrid as Record<string, unknown>[]) || []);
        setAverageDuration((d.averageDuration as Record<string, unknown>[]) || []);
      })
      .catch(() => { if (mounted) {} })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleExport = () => {
    const data = {
      peakHours,
      vehicleDistribution,
      bookingTrend,
      averageDuration,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <ElectricCar className="w-20 h-auto" color="#10b981" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Analytics</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Deep dive into parking system analytics</p>
          </div>
          <button onClick={handleExport} className="btn-neon flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
            <HiOutlineArrowDownTray className="w-4 h-4" />
            Export
          </button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Peak Hour Bookings', value: loading ? '...' : String(peakHours.reduce((sum: number, h: Record<string, unknown>) => sum + Number(h.bookings || 0), 0)), color: 'rgba(6,182,212,0.3)' },
            { label: 'Vehicle Categories', value: loading ? '...' : String(vehicleDistribution.length), color: 'rgba(236,72,153,0.3)' },
            { label: '30-Day Trend', value: loading ? '...' : String(bookingTrend.length) + ' days', color: 'rgba(16,185,129,0.3)' },
            { label: 'Avg Duration Categories', value: loading ? '...' : String(averageDuration.length), color: 'rgba(249,115,22,0.3)' },
          ].map((stat, i) => (
            <div key={i} className="stat-card glass-card">
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Peak Hours (7 AM - 9 PM)</h2>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peakHours as Record<string, unknown>[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(203,213,225,0.8)', background: '#ffffff', color: '#1e293b' }} />
                    <Bar dataKey="bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Vehicle Category Distribution</h2>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={vehicleDistribution as Record<string, unknown>[]} cx="50%" cy="50%" outerRadius={110} paddingAngle={3} dataKey="value">
                      {(vehicleDistribution as { color?: string }[]).map((e, i) => (
                        <Cell key={i} fill={e.color || COLORS[i] || '#6B7280'} stroke="rgba(10,10,15,0.8)" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(203,213,225,0.8)', background: '#ffffff', color: '#1e293b' }} />
                    <Legend wrapperStyle={{ color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Booking Trend (Last 30 Days)</h2>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bookingTrend as Record<string, unknown>[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(203,213,225,0.8)', background: '#ffffff', color: '#1e293b' }} />
                    <Line type="monotone" dataKey="bookings" stroke="#ec4899" strokeWidth={2} dot={{ r: 4, fill: '#ec4899' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Average Duration per Category</h2>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={averageDuration as Record<string, unknown>[]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" unit=" hrs" />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(203,213,225,0.8)', background: '#ffffff', color: '#1e293b' }} />
                    <Bar dataKey="hours" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Occupancy Heatmap (Days vs Hours)</h2>
            {loading ? (
              <div className="h-[300px] glass animate-pulse rounded-lg" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-xs font-medium text-cyan-400 text-left">Day</th>
                      {hourLabels.map((h) => (
                        <th key={h} className="px-1 py-1 text-xs font-medium text-cyan-400 text-center">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(occupancyGrid as { day: string; hours: number[] }[]).map((row) => (
                      <tr key={row.day}>
                        <td className="px-2 py-1.5 text-sm font-medium whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>{row.day}</td>
                        {row.hours.map((val, i) => (
                          <td key={i} className="p-0.5">
                            <div
                              className={`w-full h-8 rounded-md ${getHeatColor(val)} flex items-center justify-center text-[10px] font-bold text-white/90`}
                              title={`${val}% occupied`}
                            >
                              {val}%
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Analytics;
