import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSquare2Stack,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineBookmarkSquare,
  HiOutlineBanknotes,
  HiOutlineArrowRight,
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineUserMinus,
  HiOutlineQueueList,
  HiOutlineTag,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminApi } from '../../services/api';
import { CarSedan, ElectricCar } from '../../components/vehicles';
import AdminHero3D from '../../components/3d/AdminHero3D';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const COLORS = ['#06b6d4', '#ec4899', '#f97316', '#10b981', '#a855f7'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [revenueData, setRevenueData] = useState<Record<string, unknown>[]>([]);
  const [usageData, setUsageData] = useState<Record<string, unknown>[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<Record<string, unknown>[]>([]);
  const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getDashboard()
      .then((res) => {
        if (!mounted) return;
        const d = res.stats || {};
        setStats(d);
        setRevenueData((d.revenueData as Record<string, unknown>[]) || []);
        setUsageData((d.usageData as Record<string, unknown>[]) || []);
        setPeakHoursData((d.peakHoursData as Record<string, unknown>[]) || []);
        setRecentActivity((d.recentActivity as Record<string, unknown>[]) || []);
      })
      .catch(() => {
        if (mounted) setStats({});
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const s = stats || {};
  const totalSlotsVal = Number(s.totalSlots ?? 0);
  const occupiedVal = Number(s.occupied ?? s.occupiedSlots ?? 0);
  const availableVal = Number(s.available ?? s.availableSlots ?? 0);
  const reservedVal = Number(s.reserved ?? s.reservedSlots ?? 0);

  const statCards = [
    { icon: <HiOutlineSquare2Stack className="w-5 h-5" />, title: 'Total Slots', value: totalSlotsVal, change: 'Capacity', changeType: 'increase' as const, glow: 'rgba(6,182,212,0.3)', route: '/admin/slots' },
    { icon: <HiOutlineTruck className="w-5 h-5" />, title: 'Occupied', value: occupiedVal, change: `${Math.round((occupiedVal / (totalSlotsVal || 1)) * 100)}% load`, changeType: 'increase' as const, glow: 'rgba(236,72,153,0.3)', route: '/admin/slots?status=occupied' },
    { icon: <HiOutlineCheckCircle className="w-5 h-5" />, title: 'Available', value: availableVal, change: `${availableVal} free`, changeType: 'decrease' as const, glow: 'rgba(16,185,129,0.3)', route: '/admin/slots?status=available' },
    { icon: <HiOutlineBookmarkSquare className="w-5 h-5" />, title: 'Reserved', value: reservedVal, change: `${reservedVal} active`, changeType: 'increase' as const, glow: 'rgba(6,182,212,0.3)', route: '/admin/slots?status=reserved' },
  ];

  const usageWithColors = usageData.map((d, i) => ({
    ...d,
    color: (d as { color?: string }).color || COLORS[i % COLORS.length] || '#6B7280',
  }));

  const hasRevenueData = revenueData.length > 0 && revenueData.some((d: Record<string, unknown>) => Number(d.revenue ?? d.amount ?? 0) > 0);
  const hasUsageData = usageWithColors.length > 0 && usageWithColors.some((d: Record<string, unknown>) => Number(d.value ?? d.count ?? 0) > 0);
  const hasPeakData = peakHoursData.length > 0 && peakHoursData.some((d: Record<string, unknown>) => Number(d.bookings ?? d.count ?? 0) > 0);

  const quickActionItems = [
    { label: '3D Layout Designer', icon: HiOutlineCube, route: '/admin/layout-designer', highlight: true },
    { label: 'AI Analytics', icon: HiOutlineChartBar, route: '/admin/ai-analytics', highlight: true },
    { label: 'Manage Bookings', icon: HiOutlineCalendarDays, route: '/admin/bookings' },
    { label: 'Manage Slots', icon: HiOutlineSquare2Stack, route: '/admin/slots' },
    { label: 'Payments Ledger', icon: HiOutlineCreditCard, route: '/admin/payments' },
    { label: 'Revenue Dashboard', icon: HiOutlineCurrencyDollar, route: '/admin/revenue' },
    { label: 'Manage Users', icon: HiOutlineUsers, route: '/admin/users' },
    { label: 'Reports Hub', icon: HiOutlineDocumentText, route: '/admin/reports' },
    { label: 'Overstay Tracking', icon: HiOutlineClock, route: '/admin/overstay' },
    { label: 'No-Show Report', icon: HiOutlineUserMinus, route: '/admin/no-show' },
    { label: 'Waiting List', icon: HiOutlineQueueList, route: '/admin/waiting-list' },
    { label: 'Pricing Rates', icon: HiOutlineTag, route: '/admin/pricing' },
    { label: 'Audit Logs', icon: HiOutlineClipboardDocumentList, route: '/admin/audit-logs' },
    { label: 'System Settings', icon: HiOutlineCog6Tooth, route: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold neon-text">Dashboard Command Center</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Overview of your parking system and live holographic analytics</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 shadow-sm shadow-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Live WebGL Deck</span>
          </div>
        </motion.div>

        {/* 3D FUTURISTIC CONTROL CENTER HERO CANVAS */}
        <motion.div variants={itemVariants}>
          <AdminHero3D />
        </motion.div>

        {/* INTERACTIVE STAT CARDS (CLICKABLE) */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <CarSedan className="w-24 h-auto" color="#06b6d4" />
          </div>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card h-24 animate-pulse rounded-2xl" />
              ))
            : statCards.map((sc, i) => (
                <div
                  key={i}
                  onClick={() => navigate(sc.route)}
                  className="stat-card glass-card group rotate-3d-card cursor-pointer hover:border-cyan-500/40 transition-all"
                  title={`View ${sc.title}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-400"
                        style={{ boxShadow: `0 0 15px ${sc.glow}, inset 0 0 15px ${sc.glow}`, background: 'rgba(6,182,212,0.08)' }}
                      >
                        {sc.icon}
                      </div>
                      <div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sc.title}</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{sc.value}</p>
                        <p className={`text-xs font-medium ${sc.changeType === 'increase' ? 'text-green-400' : 'text-cyan-400'}`}>{sc.change}</p>
                      </div>
                    </div>
                    <HiOutlineArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
        </motion.div>

        {/* CHARTS GRID WITH CROSS-LINKS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Revenue Trend</h2>
                <button
                  onClick={() => navigate('/admin/revenue')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline"
                >
                  Full Revenue <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </button>
              </div>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : hasRevenueData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData as Record<string, unknown>[]}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.35)" />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.35)" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(6,182,212,0.4)', background: '#0f172a', color: '#f8fafc' }}
                      formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fill="url(#revenueFill)" dot={{ r: 4, fill: '#06b6d4' }} activeDot={{ r: 6, fill: '#ec4899' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                    <HiOutlineBanknotes className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-200">No Revenue Data in Past 7 Days</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">New paid bookings and extensions will automatically generate the live revenue graph here.</p>
                  <button onClick={() => navigate('/admin/payments')} className="mt-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    View Payments Ledger &rarr;
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Parking Usage</h2>
                <button
                  onClick={() => navigate('/admin/analytics')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline"
                >
                  Analytics <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </button>
              </div>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : hasUsageData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={usageWithColors} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                      {usageWithColors.map((entry, i) => (
                        <Cell key={i} fill={(entry as { color: string }).color} stroke="rgba(10,10,15,0.8)" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(6,182,212,0.4)', background: '#0f172a', color: '#f8fafc' }}
                      formatter={(val: unknown) => [`${Number(val || 0)} Slots`, 'Count']}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <HiOutlineChartBar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-200">No Category Breakdown Available</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">Add slots or categories in Slot Manager to populate vehicle distribution.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Recent Activity</h2>
                <button
                  onClick={() => navigate('/admin/audit-logs')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline"
                >
                  Audit Logs <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </button>
              </div>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((a) => (
                    <div
                      key={String(a.id)}
                      onClick={() => navigate('/admin/bookings')}
                      className="flex items-center justify-between py-2.5 px-3.5 rounded-xl border-l-2 border-cyan-500 cursor-pointer hover:bg-cyan-500/10 transition-colors"
                      style={{ backgroundColor: 'var(--glass-bg)' }}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{String(a.action)}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{String(a.user)} &middot; {String(a.time)}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold badge-neon">
                        {String(a.type)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 overflow-hidden">
                    <motion.div animate={{ x: [-20, 400, -20] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}>
                      <ElectricCar className="w-8 h-auto" color="#06b6d4" />
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                    <HiOutlineClipboardDocumentList className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-200">No Recent Activity Logged</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">Live entries, check-ins, and reservations will appear here in real-time.</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Peak Hours</h2>
                <button
                  onClick={() => navigate('/admin/ai-analytics')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline"
                >
                  AI Predictor <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                </button>
              </div>
              {loading ? (
                <div className="h-[300px] glass animate-pulse rounded-lg" />
              ) : hasPeakData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peakHoursData as Record<string, unknown>[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.35)" interval={0} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.35)" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(6,182,212,0.4)', background: '#0f172a', color: '#f8fafc' }}
                      formatter={(val: unknown) => [`${Number(val || 0)} Bookings`, 'Traffic']}
                    />
                    <Bar dataKey="bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                    <HiOutlineClock className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-gray-200">No Peak Hour Traffic Recorded</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">Hourly traffic patterns will build dynamically as drivers book and check in.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* FULL ADMIN MODULES QUICK LAUNCHER GRID */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Admin Modules & Quick Navigation</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {quickActionItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(item.route)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all duration-200 group ${
                      item.highlight
                        ? 'btn-neon text-white'
                        : 'glass-card hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold leading-tight line-clamp-2">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
