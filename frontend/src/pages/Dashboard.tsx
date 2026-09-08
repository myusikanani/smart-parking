import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineWallet,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserCircle,
  HiOutlineListBullet,
  HiOutlineQrCode,
  HiOutlineMapPin,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
  HiOutlineMagnifyingGlass,
  HiOutlineCube,
} from 'react-icons/hi2';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CarSedan } from '../components/vehicles';
import DashboardHero3D from '../components/3d/DashboardHero3D';
import Modal from '../components/ui/Modal';
import ParkingPass from '../components/ParkingPass';
import type { Booking } from '../types';

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    active: { className: 'badge-green', label: 'Active' },
    confirmed: { className: 'badge-neon', label: 'Confirmed' },
    completed: { className: 'badge-gray', label: 'Completed' },
    cancelled: { className: 'badge-red', label: 'Cancelled' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
};

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: '🌅' };
  if (hour < 18) return { text: 'Good Afternoon', icon: '☀️' };
  return { text: 'Good Evening', icon: '🌙' };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const mockAnalytics = [
  { month: 'Jan', spend: 45, bookings: 3 },
  { month: 'Feb', spend: 80, bookings: 5 },
  { month: 'Mar', spend: 65, bookings: 4 },
  { month: 'Apr', spend: 110, bookings: 7 },
  { month: 'May', spend: 95, bookings: 6 },
  { month: 'Jun', spend: 140, bookings: 9 },
  { month: 'Jul', spend: 120, bookings: 8 },
];

const peakHours = [
  { time: '08:00 AM', status: 'High', load: 85, color: 'text-pink-400' },
  { time: '12:00 PM', status: 'Moderate', load: 60, color: 'text-amber-400' },
  { time: '05:00 PM', status: 'Peak', load: 95, color: 'text-red-400' },
  { time: '09:00 PM', status: 'Low', load: 30, color: 'text-emerald-400' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPass, setSelectedPass] = useState<Booking | null>(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await bookingApi.getMyBookings();
        setBookings(res.bookings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = bookings.length;
  const activeBookings = bookings.filter(
    (b: Record<string, unknown>) => b.status === 'active' || b.status === 'confirmed'
  );
  const activeCount = bookings.filter((b: Record<string, unknown>) => b.status === 'active').length;
  const completedCount = bookings.filter(
    (b: Record<string, unknown>) => b.status === 'completed'
  ).length;
  const totalAmount = bookings.reduce(
    (sum: number, b: Record<string, unknown>) => sum + (Number(b.amount) || 0),
    0
  );

  const activeOrNextPass = activeBookings[0] as Record<string, unknown> | undefined;

  const recentRows = bookings.slice(0, 5).map((b: Record<string, unknown>) => ({
    id: b.id,
    slotNumber: b.slotNumber || 'A-01',
    date: String(b.startTime || '').split('T')[0] || new Date().toISOString().split('T')[0],
    status: b.status || 'confirmed',
    amount: b.amount || 15,
    category: b.category || 'four-wheeler',
    vehicleNumber: b.vehicleNumber || 'MH-12-AB-3456',
    rawBooking: b,
  }));

  const monthlyAnalytics = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last7: { monthName: string; monthNum: number; spend: number; bookings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last7.push({ monthName: months[idx], monthNum: idx, spend: 0, bookings: 0 });
    }

    bookings.forEach((b: Record<string, unknown>) => {
      if (!b.startTime) return;
      const d = new Date(String(b.startTime));
      if (isNaN(d.getTime())) return;
      const mIdx = d.getMonth();
      const match = last7.find((item) => item.monthNum === mIdx);
      if (match) {
        match.spend += Number(b.amount) || 0;
        match.bookings += 1;
      }
    });

    return last7.map((m) => ({
      month: m.monthName,
      spend: Math.round(m.spend),
      bookings: m.bookings,
    }));
  }, [bookings]);

  const greeting = getTimeOfDayGreeting();

  const handleOpenPass = (b: Record<string, unknown>) => {
    const formattedBooking: Booking = {
      id: String(b.id || 'BK-1001'),
      userId: String(user?.id || 'usr-1'),
      userName: String(user?.name || 'Driver'),
      slotId: String(b.slotId || 'slot-1'),
      slotNumber: String(b.slotNumber || 'A-01'),
      vehicleNumber: String(b.vehicleNumber || 'MH-12-AB-3456'),
      category: String(b.category || 'four-wheeler'),
      startTime: String(b.startTime || new Date().toISOString()),
      endTime: String(b.endTime || new Date().toISOString()),
      amount: Number(b.amount) || 15,
      status: (b.status as Booking['status']) || 'confirmed',
      qrCode: String(b.qrCode || 'QR-PASS-DEFAULT'),
      createdAt: String(b.createdAt || new Date().toISOString()),
      paymentStatus: (b.paymentStatus as Booking['paymentStatus']) || 'paid',
    };
    setSelectedPass(formattedBooking);
    setIsPassModalOpen(true);
  };

  const statCards = [
    {
      icon: <HiOutlineCalendarDays className="w-6 h-6" />,
      title: 'Total Bookings',
      value: total,
      subtext: 'Lifetime reservations',
      glow: 'rgba(6,182,212,0.3)',
      borderColor: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
    },
    {
      icon: <HiOutlineClock className="w-6 h-6" />,
      title: 'Active Sessions',
      value: activeCount,
      subtext: 'Vehicles currently parked',
      glow: 'rgba(16,185,129,0.3)',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      live: activeCount > 0,
    },
    {
      icon: <HiOutlineCheckCircle className="w-6 h-6" />,
      title: 'Completed',
      value: completedCount,
      subtext: 'Successful check-outs',
      glow: 'rgba(236,72,153,0.3)',
      borderColor: 'border-pink-500/30',
      iconBg: 'bg-pink-500/10 text-pink-400',
    },
    {
      icon: <HiOutlineWallet className="w-6 h-6" />,
      title: 'Total Spent',
      value: `₹${totalAmount.toFixed(2)}`,
      subtext: 'Total parking expenditure',
      glow: 'rgba(245,158,11,0.3)',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl glass animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card h-80 animate-pulse" />
          <div className="glass-card h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Failed to load dashboard</h2>
        <p className="text-sm text-gray-400 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-neon px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 1. HERO GREETING BANNER WITH 3D DASHBOARD CANVAS */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-7 relative overflow-hidden glass-card-glow p-6 sm:p-8 rounded-3xl h-full flex flex-col justify-center">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-300 mb-3">
              <span>{greeting.icon}</span>
              <span>{greeting.text}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, <span className="neon-text">{user?.name || 'Driver'}</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400">
              Manage your smart parking passes, view live slot availability, and track your parking sessions in real time.
            </p>

            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => navigate('/dashboard/book-parking')}
                className="btn-neon flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-cyan-500/20"
              >
                <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                Book New Slot
              </button>
              <button
                onClick={() => navigate('/available-parking')}
                className="btn-outline flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                <HiOutlineMapPin className="w-4 h-4 text-cyan-400" />
                View Parking Grid
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <DashboardHero3D />
        </div>
      </motion.div>

      {/* 2. ACTIVE DIGITAL PASS QUICK TICKET WIDGET */}
      <motion.div variants={itemVariants}>
        {activeOrNextPass ? (
          <div className="relative overflow-hidden rounded-2xl glass-card-glow p-5 sm:p-6 border border-cyan-500/40 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-pink-950/20">
            <div className="absolute right-0 top-0 w-32 h-full bg-cyan-500/5 backdrop-blur-3xl -skew-x-12 pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <HiOutlineQrCode className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                      Active Digital Pass
                    </span>
                    {statusBadge(String(activeOrNextPass.status))}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    Slot #{String(activeOrNextPass.slotNumber || 'A-01')} &middot;{' '}
                    <span className="font-mono text-cyan-300">
                      {String(activeOrNextPass.vehicleNumber || 'MH-12-AB-3456')}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                    <HiOutlineClock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {String(activeOrNextPass.startTime || '').split('T')[0]} &middot;{' '}
                      {String(activeOrNextPass.startTime || '').split('T')[1]?.slice(0, 5) || '10:00'} -{' '}
                      {String(activeOrNextPass.endTime || '').split('T')[1]?.slice(0, 5) || '12:00'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenPass(activeOrNextPass)}
                  className="btn-neon-pink flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  <HiOutlineQrCode className="w-4 h-4" />
                  Show Gate QR Pass
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <HiOutlineSparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">No active parking sessions right now</p>
                <p className="text-xs text-gray-400">Reserve your spot ahead of time to guarantee hassle-free entry.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/book-parking')}
              className="btn-neon text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap"
            >
              Reserve Parking Now
            </button>
          </div>
        )}
      </motion.div>

      {/* 3. STAT CARDS GRID */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`stat-card glass-card group hover:border-cyan-500/40 transition-all duration-300 ${stat.borderColor}`}
            style={{ boxShadow: `0 0 20px ${stat.glow}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconBg} border border-white/10 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              {stat.live && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Live</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium">{stat.title}</p>
            <p className="text-2xl font-bold text-white mt-0.5 tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </motion.div>

      {/* 4. CHARTS & PEAK HOURS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-5 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineArrowTrendingUp className="w-5 h-5 text-cyan-400" />
                Monthly Spending & Bookings
              </h2>
              <p className="text-xs text-gray-400">Overview of parking expenditure over recent months</p>
            </div>
            <span className="badge-neon text-xs font-mono">2026 Analytics</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyAnalytics}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="rgba(148,163,184,0.35)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(203,213,225,0.8)',
                    background: '#ffffff',
                    color: '#1e293b',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Peak Hours Forecast Widget */}
        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineChartBar className="w-5 h-5 text-pink-400" />
                Peak Hours Forecast
              </h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Check traffic intensity to plan your parking arrival time smoothly.
            </p>

            <div className="space-y-3.5">
              {peakHours.map((ph, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-300">{ph.time}</span>
                    <span className={ph.color}>{ph.status} ({ph.load}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ph.load > 80 ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : ph.load > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${ph.load}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-cyan-400 flex items-center justify-center gap-1.5">
              <HiOutlineShieldCheck className="w-4 h-4" />
              EV & Accessible slots reserved guaranteed
            </p>
          </div>
        </motion.div>
      </div>

      {/* 5. RECENT BOOKINGS TABLE & QUICK ACTIONS */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5 sm:p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineListBullet className="w-5 h-5 text-cyan-400" />
                Recent Booking Activity
              </h2>
              <p className="text-xs text-gray-400">Your latest parking sessions and payment history</p>
            </div>
            <button
              onClick={() => navigate('/booking-history')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All History &rarr;
            </button>
          </div>

          {recentRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3">Slot</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-cyan-500/5 transition-colors">
                      <td className="py-3.5 font-bold text-cyan-300">
                        Slot #{String(row.slotNumber)}
                      </td>
                      <td className="py-3.5 font-mono text-xs text-gray-300">
                        {String(row.vehicleNumber)}
                      </td>
                      <td className="py-3.5 text-xs text-gray-400">
                        {String(row.date)}
                      </td>
                      <td className="py-3.5">
                        {statusBadge(String(row.status))}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-emerald-400">
                        ₹{String(row.amount)}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleOpenPass(row.rawBooking)}
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                          title="View Digital Pass"
                        >
                          <HiOutlineQrCode className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <HiOutlineCalendarDays className="w-12 h-12 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">No booking records found</p>
              <p className="text-xs">Your future parking reservations will appear here.</p>
            </div>
          )}
        </div>

        {/* Quick Action Command Center */}
        <div className="glass-card p-5 sm:p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <HiOutlineSparkles className="w-5 h-5 text-amber-400" />
              Quick Actions
            </h2>
            <p className="text-xs text-gray-400 mb-5">Frequent user shortcuts & gate control</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard/book-parking')}
                className="w-full btn-neon flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
                  Book Parking Slot
                </span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/qr-code')}
                className="w-full btn-neon-pink flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineQrCode className="w-5 h-5" />
                  Gate QR Scanner Key
                </span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/available-slots')}
                className="w-full btn-outline flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineCube className="w-5 h-5 text-cyan-400" />
                  Live 3D Parking Map
                </span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/available-parking')}
                className="w-full btn-outline flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineMagnifyingGlass className="w-5 h-5 text-purple-400" />
                  Smart Search
                </span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/available-parking')}
                className="w-full btn-outline flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineMapPin className="w-5 h-5 text-cyan-400" />
                  Available Slots
                </span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="w-full btn-outline flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold"
              >
                <span className="flex items-center gap-2">
                  <HiOutlineUserCircle className="w-5 h-5 text-pink-400" />
                  My Vehicles & Profile
                </span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>

          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-cyan-950 border border-cyan-500/30 text-center space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              🎮 3D WebGL Live Deck Active
            </span>
            <p className="text-xs text-gray-300">
              Interactive 3D camera pan, rotate, and AI recommended bay highlights.
            </p>
            <Link
              to="/available-slots"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition"
            >
              Open Interactive 3D Map
            </Link>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-xs font-semibold text-cyan-300">Need Help or Support?</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Contact 24/7 Gate Operator Support via the Help Desk.</p>
          </div>
        </div>
      </motion.div>

      {/* 6. PASS MODAL POPUP */}
      {selectedPass && (
        <Modal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          title={`Digital Entry Ticket - Slot #${selectedPass.slotNumber}`}
        >
          <div className="pt-2">
            <ParkingPass booking={selectedPass} />
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default Dashboard;
