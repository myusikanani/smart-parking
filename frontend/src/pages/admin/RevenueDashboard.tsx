import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentArrowDown,
  HiOutlineTableCells,
} from 'react-icons/hi2';
import StatCard from '../../components/StatCard';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminApi } from '../../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className || ''}`} />
);

const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b'];

const RevenueDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthlyData, setMonthlyData] = useState<Record<string, unknown>[]>([]);
  const [categoryData, setCategoryData] = useState<Record<string, unknown>[]>([]);
  const [paymentData, setPaymentData] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getRevenue()
      .then((res) => {
        if (!mounted) return;
        const d = res.revenue || {};
        setTotalRevenue(Number(d.totalRevenue ?? d.total ?? 0));
        setMonthlyRevenue(Number(d.monthlyRevenue ?? d.monthly ?? 0));
        setTodayRevenue(Number(d.todayRevenue ?? d.today ?? 0));
        setMonthlyData((d.monthlyData as Record<string, unknown>[]) || []);
        setCategoryData((d.categoryData as Record<string, unknown>[]) || []);
        setPaymentData((d.paymentData as Record<string, unknown>[]) || []);
      })
      .catch(() => { if (mounted) {} })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const rows = [
      ['Metric', 'Amount (INR)'],
      ['Total Revenue', totalRevenue],
      ['Monthly Revenue', monthlyRevenue],
      ['Today Revenue', todayRevenue],
      [],
      ['Month', 'Revenue (INR)'],
      ...monthlyData.map(m => [String(m.month || ''), String(m.amount || m.revenue || '')]),
      [],
      ['Category', 'Revenue (INR)'],
      ...categoryData.map(c => [String(c.name || c.category || ''), String(c.value || c.amount || '')]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ParkEase_Revenue_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold neon-text">Revenue Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your parking revenue and payments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="btn-neon-amber flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white text-sm hover:scale-105 transition-transform"
          >
            <HiOutlineDocumentArrowDown className="w-4 h-4" />
            Print / PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm hover:border-cyan-400 hover:text-cyan-300"
          >
            <HiOutlineTableCells className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard icon={<HiOutlineBanknotes className="w-5 h-5" />} title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} change="+24%" changeType="increase" />
            <StatCard icon={<HiOutlineArrowTrendingUp className="w-5 h-5" />} title="Monthly Revenue" value={`₹${monthlyRevenue.toLocaleString()}`} change="+10.2%" changeType="increase" />
            <StatCard icon={<HiOutlineCurrencyDollar className="w-5 h-5" />} title="Today's Revenue" value={`₹${todayRevenue.toLocaleString()}`} change="+18%" changeType="increase" />
          </>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold neon-text mb-4">Revenue Over Time</h2>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#e5e7eb' }} />
                    <Area type="monotone" dataKey="amount" stroke="#06b6d4" fill="url(#revenueGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass-card p-5">
            <h2 className="text-lg font-semibold neon-text mb-4">Revenue by Category</h2>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#e5e7eb' }} />
                    <Legend formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold neon-text mb-4">Payment Methods</h2>
          {loading ? (
            <Skeleton className="h-48" />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="method" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', color: '#e5e7eb' }} />
                  <Bar dataKey="amount" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RevenueDashboard;
