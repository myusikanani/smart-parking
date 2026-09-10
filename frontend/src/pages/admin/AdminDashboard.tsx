import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSquare2Stack,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineBookmarkSquare,
  HiOutlineBanknotes,
  HiOutlineArrowRight,
  HiOutlineChartBar,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUserMinus,
  HiOutlineQueueList,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChevronDown,
  HiOutlinePlusCircle,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../../services/api';
import { CarSedan, ElectricCar } from '../../components/vehicles';
import AdminHero3D from '../../components/3d/AdminHero3D';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f97316', '#a855f7'];

interface UsageCategoryItem {
  name?: string;
  category?: string;
  value?: number;
  count?: number;
  color?: string;
  [key: string]: unknown;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [revenueData, setRevenueData] = useState<Record<string, unknown>[]>([]);
  const [usageData, setUsageData] = useState<UsageCategoryItem[]>([]);
  const [peakHoursData, setPeakHoursData] = useState<Record<string, unknown>[]>([]);
  const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);
  const [heroExpanded, setHeroExpanded] = useState(() => {
    return sessionStorage.getItem('admin_hero_collapsed') !== 'true';
  });
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState('');

  const handleToggleHero = () => {
    setHeroExpanded((prev) => {
      const next = !prev;
      if (!next) {
        sessionStorage.setItem('admin_hero_collapsed', 'true');
      } else {
        sessionStorage.removeItem('admin_hero_collapsed');
      }
      return next;
    });
  };

  const fetchDashboard = () => {
    setLoading(true);
    adminApi.getDashboard()
      .then((res) => {
        const d = res.stats || {};
        setStats(d);
        setRevenueData((d.revenueData as Record<string, unknown>[]) || []);
        setUsageData((d.usageData as UsageCategoryItem[]) || []);
        setPeakHoursData((d.peakHoursData as Record<string, unknown>[]) || []);
        setRecentActivity((d.recentActivity as Record<string, unknown>[]) || []);
      })
      .catch(() => {
        setStats({});
      })
      .finally(() => { setLoading(false); });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRunRecovery = async () => {
    setRecoveryLoading(true);
    setRecoveryMsg('');
    try {
      const res = await adminApi.triggerRecovery();
      setRecoveryMsg(`✅ Sweep complete: ${res.recoveredOrphanedSlots || 0} orphaned slots freed!`);
      fetchDashboard();
    } catch {
      setRecoveryMsg('❌ Recovery sweep failed.');
    } finally {
      setRecoveryLoading(false);
      setTimeout(() => setRecoveryMsg(''), 4000);
    }
  };

  const s = stats || {};
  const totalSlotsVal = Number(s.totalSlots ?? 0);
  const occupiedVal = Number(s.occupied ?? s.occupiedSlots ?? 0);
  const availableVal = Number(s.available ?? s.availableSlots ?? 0);
  const reservedVal = Number(s.reserved ?? s.reservedSlots ?? 0);
  const noShowCount = Number(s.noShowCount ?? 0);
  const overstayCount = Number(s.overstayCount ?? 0);
  const waitingListCount = Number(s.waitingListCount ?? 0);

  const statCards = [
    { icon: <HiOutlineSquare2Stack className="w-5 h-5" />, title: 'Total Slots', value: totalSlotsVal, change: 'Capacity', changeType: 'increase' as const, glow: 'rgba(6,182,212,0.3)', route: '/admin/slots' },
    { icon: <HiOutlineTruck className="w-5 h-5" />, title: 'Occupied', value: occupiedVal, change: `${Math.round((occupiedVal / (totalSlotsVal || 1)) * 100)}% load`, changeType: 'increase' as const, glow: 'rgba(236,72,153,0.3)', route: '/admin/slots?status=occupied' },
    { icon: <HiOutlineCheckCircle className="w-5 h-5" />, title: 'Available', value: availableVal, change: `${availableVal} free`, changeType: 'decrease' as const, glow: 'rgba(16,185,129,0.3)', route: '/admin/slots?status=available' },
    { icon: <HiOutlineBookmarkSquare className="w-5 h-5" />, title: 'Reserved', value: reservedVal, change: `${reservedVal} active`, changeType: 'increase' as const, glow: 'rgba(6,182,212,0.3)', route: '/admin/slots?status=reserved' },
  ];

  const usageWithColors: UsageCategoryItem[] = usageData.map((d, i) => ({
    ...d,
    color: d.color || COLORS[i % COLORS.length] || '#6B7280',
  }));

  const hasRevenueData = revenueData.length > 0 && revenueData.some((d: Record<string, unknown>) => Number(d.revenue ?? d.amount ?? 0) > 0);
  const hasUsageData = usageWithColors.length > 0 && usageWithColors.some((d: UsageCategoryItem) => Number(d.value ?? d.count ?? 0) > 0);
  const hasPeakData = peakHoursData.length > 0 && peakHoursData.some((d: Record<string, unknown>) => Number(d.bookings ?? d.count ?? 0) > 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* 1. HEADER ROW */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold neon-text tracking-wide">Dashboard</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Real-time overview of occupancy, revenue, and system operations</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-sm shadow-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
            <HiOutlineShieldCheck className="w-3.5 h-3.5" /> System Healthy & Online
          </span>
        </div>
      </motion.div>

      {/* 2. COLLAPSIBLE 3D HERO DECK */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <button
          onClick={handleToggleHero}
          className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-cyan-500/5 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-gray-200 group-hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-cyan-400" /> 3D Holographic Control Center Deck
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              WebGL 3D
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-400 group-hover:text-cyan-300 flex items-center gap-1">
            {heroExpanded ? 'Collapse 3D Deck' : 'Expand 3D Deck'}
            <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${heroExpanded ? 'rotate-180 text-cyan-400' : ''}`} />
          </span>
        </button>
        <AnimatePresence>
          {heroExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-white/5"
            >
              <AdminHero3D />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 3. FOUR COMPACT KPI METRIC CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <CarSedan className="w-20 h-auto" color="#06b6d4" />
        </div>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card h-20 animate-pulse rounded-2xl" />
            ))
          : statCards.map((sc, i) => (
              <div
                key={i}
                onClick={() => navigate(sc.route)}
                className="stat-card glass-card group cursor-pointer hover:border-cyan-500/40 p-3.5 rounded-2xl transition-all"
                title={`View ${sc.title}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-cyan-400"
                      style={{ boxShadow: `0 0 12px ${sc.glow}, inset 0 0 12px ${sc.glow}`, background: 'rgba(6,182,212,0.08)' }}
                    >
                      {sc.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-gray-400">{sc.title}</p>
                      <p className="text-base font-bold text-gray-100">{sc.value}</p>
                      <p className="text-[10px] font-semibold text-cyan-400">{sc.change}</p>
                    </div>
                  </div>
                  <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
      </motion.div>

      {/* 4. TWO-COLUMN: REVENUE LINE CHART + USAGE DONUT CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Line Chart */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-4 rounded-2xl h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  <HiOutlineBanknotes className="w-4 h-4 text-cyan-400" /> Revenue Trend (7 Days)
                </h2>
                <p className="text-[11px] text-gray-400">Daily earnings trajectory across all bookings</p>
              </div>
              <button
                onClick={() => navigate('/admin/revenue')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold hover:underline"
              >
                Full Revenue <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="h-[220px] glass animate-pulse rounded-xl" />
            ) : hasRevenueData ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData as Record<string, unknown>[]}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.25)" />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.25)" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid rgba(6,182,212,0.4)', background: '#0f172a', color: '#f8fafc', fontSize: '12px' }}
                      formatter={(val: unknown) => [`₹${Number(val || 0).toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fill="url(#revenueFill)" dot={{ r: 3, fill: '#06b6d4' }} activeDot={{ r: 5, fill: '#ec4899' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <HiOutlineBanknotes className="w-8 h-8 text-cyan-400 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-gray-300">No Revenue Data in Past 7 Days</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Paid bookings and passes will build this live graph.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Usage Donut Chart */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-4 rounded-2xl h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  <HiOutlineChartBar className="w-4 h-4 text-pink-400" /> Parking Usage by Category
                </h2>
                <p className="text-[11px] text-gray-400">Distribution of parking bay inventory</p>
              </div>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold hover:underline"
              >
                Analytics <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="h-[220px] glass animate-pulse rounded-xl" />
            ) : hasUsageData ? (
              <div className="space-y-1">
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={usageWithColors} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                        {usageWithColors.map((entry, i) => (
                          <Cell key={i} fill={(entry as { color: string }).color} stroke="rgba(10,10,15,0.8)" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid rgba(6,182,212,0.4)', background: '#0f172a', color: '#f8fafc', fontSize: '12px' }}
                        formatter={(val: unknown) => [`${Number(val || 0)} Slots`, 'Total Bays']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Compact inline legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-white/5">
                  {usageWithColors.map((u, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-300">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (u as { color: string }).color }} />
                      <span>{String(u.name || u.category)}: <b className="text-gray-100 font-mono">{Number(u.value || u.count || 0)}</b></span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <HiOutlineChartBar className="w-8 h-8 text-pink-400 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-gray-300">No Category Breakdown Available</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Add parking slots in Manage Slots to view breakdown.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 5. FULL-WIDTH PEAK HOURS BAR CHART */}
      <motion.div variants={itemVariants}>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4 text-cyan-400" /> Peak Traffic Hours Load (6:00 AM - 10:00 PM)
              </h2>
              <p className="text-[11px] text-gray-400">Hourly vehicle arrival patterns and occupancy velocity</p>
            </div>
            <button
              onClick={() => navigate('/admin/ai-analytics')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold hover:underline"
            >
              AI Forecasts <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="h-[180px] glass animate-pulse rounded-xl" />
          ) : hasPeakData ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData as Record<string, unknown>[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.25)" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="rgba(148,163,184,0.25)" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid rgba(6,182,212,0.4)', background: '#0f172a', color: '#f8fafc', fontSize: '12px' }}
                    formatter={(val: unknown) => [`${Number(val || 0)} Bookings`, 'Traffic']}
                  />
                  <Bar dataKey="bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
              <HiOutlineClock className="w-8 h-8 text-amber-400 mb-2 opacity-60" />
              <p className="text-xs font-semibold text-gray-300">No Hourly Booking Traffic Yet</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Booking logs and gate scans will populate hourly traffic volume.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 6. TWO-COLUMN: RECENT ACTIVITY + NEEDS ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-4 rounded-2xl h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  <HiOutlineClipboardDocumentList className="w-4 h-4 text-cyan-400" /> Recent Activity
                </h2>
                <p className="text-[11px] text-gray-400">Latest reservations, gate entries, and checkouts</p>
              </div>
              <button
                onClick={() => navigate('/admin/audit-logs')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold hover:underline"
              >
                Audit Trail <HiOutlineArrowTopRightOnSquare className="w-3 h-3" />
              </button>
            </div>
            {loading ? (
              <div className="h-[180px] glass animate-pulse rounded-xl" />
            ) : recentActivity.length > 0 ? (
              <div className="space-y-2 mt-1">
                {recentActivity.slice(0, 4).map((a) => (
                  <div
                    key={String(a.id)}
                    onClick={() => navigate('/admin/bookings')}
                    className="flex items-center justify-between py-2 px-3 rounded-xl border-l-2 border-cyan-500 cursor-pointer hover:bg-cyan-500/10 transition-colors bg-white/[0.02]"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate text-gray-200">{String(a.action)}</p>
                      <p className="text-[10px] text-gray-400">{String(a.user)} &middot; {String(a.time)}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-neon">
                      {String(a.type)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                <HiOutlineClipboardDocumentList className="w-8 h-8 text-cyan-400 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-gray-300">No Recent Activity</p>
                <p className="text-[10px] text-gray-500 mt-0.5">New driver actions and bookings will stream live here.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Needs Attention Card */}
        <motion.div variants={itemVariants}>
          <div className="glass-card p-4 rounded-2xl h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-400" /> Needs Attention
                </h2>
                <p className="text-[11px] text-gray-400">Flagged incidents and pending operational queues</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Action Items
              </span>
            </div>

            <div className="space-y-2 mt-1">
              {/* No-Shows */}
              <div
                onClick={() => navigate('/admin/no-show')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold">
                    <HiOutlineUserMinus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-200">No-Show Incidents</p>
                    <p className="text-[10px] text-gray-400">Expired slots without driver check-in</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${noShowCount > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-gray-500'}`}>
                    {noShowCount}
                  </span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>

              {/* Overstay */}
              <div
                onClick={() => navigate('/admin/overstay')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <HiOutlineClock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-200">Overstay Flagged</p>
                    <p className="text-[10px] text-gray-400">Vehicles exceeding allotted slot time</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${overstayCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-500'}`}>
                    {overstayCount}
                  </span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>

              {/* Waiting List */}
              <div
                onClick={() => navigate('/admin/waiting-list')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                    <HiOutlineQueueList className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-200">Waiting List Queue</p>
                    <p className="text-[10px] text-gray-400">Drivers waiting for full capacity bays</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${waitingListCount > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-500'}`}>
                    {waitingListCount}
                  </span>
                  <HiOutlineArrowRight className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 7. QUICK OPERATIONS ROW (3 FOCUSED ACTIONS) */}
      <motion.div variants={itemVariants}>
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono flex items-center gap-1.5">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-cyan-400" /> Quick Operations
            </h2>
            {recoveryMsg && (
              <span className="text-xs font-semibold text-cyan-300 animate-fade-in">
                {recoveryMsg}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Add Slot */}
            <button
              onClick={() => navigate('/admin/slots')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all hover:scale-[1.01]"
            >
              <HiOutlinePlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Add / Manage Slot</span>
            </button>

            {/* Action 2: Today's Bookings */}
            <button
              onClick={() => navigate('/admin/bookings')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500/20 transition-all hover:scale-[1.01]"
            >
              <HiOutlineCalendarDays className="w-4 h-4 text-pink-400" />
              <span>Today's Bookings ({Number(s.todayBookings ?? 0)})</span>
            </button>

            {/* Action 3: Run Recovery Sweep */}
            <button
              onClick={handleRunRecovery}
              disabled={recoveryLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <HiOutlineArrowPath className={`w-4 h-4 text-emerald-400 ${recoveryLoading ? 'animate-spin' : ''}`} />
              <span>{recoveryLoading ? 'Running Sweep...' : 'Run Recovery Sweep'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
