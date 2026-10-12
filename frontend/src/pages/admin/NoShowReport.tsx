import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineXCircle,
  HiOutlinePercentBadge,
  HiOutlineBanknotes,
  HiOutlineDocumentArrowDown,
} from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import { adminApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface NoShowEntry {
  id: string;
  bookingId: string;
  user: string;
  slot: string;
  date: string;
  noShowTime: string;
  penaltyStatus: 'waived' | 'charged' | 'pending';
  penaltyAmount: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const penaltyBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    charged: { className: 'badge-red', label: 'Charged' },
    waived: { className: 'badge-green', label: 'Waived' },
    pending: { className: 'badge-orange', label: 'Pending' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
};

const NoShowReport = () => {
  const [data, setData] = useState<NoShowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getNoShowReport()
      .then((res) => {
        if (!mounted) return;
        setPercentage(res.percentage ?? 0);
        const parseUserName = (u: unknown, uName: unknown): string => {
          if (typeof uName === 'string' && uName && uName !== '[object Object]') return uName;
          if (typeof u === 'string' && u && u !== '[object Object]') return u;
          if (u && typeof u === 'object') {
            const obj = u as Record<string, unknown>;
            return String(obj.name || obj.userName || obj.email || 'Driver');
          }
          return 'Driver';
        };

        const parseSlotNumber = (s: unknown, sNum: unknown): string => {
          if (typeof sNum === 'string' && sNum && sNum !== '[object Object]') return sNum;
          if (typeof s === 'string' && s && s !== '[object Object]') return s;
          if (s && typeof s === 'object') {
            const obj = s as Record<string, unknown>;
            return String(obj.number || obj.slotNumber || 'Bay');
          }
          return 'Bay';
        };

        const mapped = (res.bookings || []).map((b: Record<string, unknown>) => {
          const rawId = String(b._id || b.id || '');
          const bId = b.bookingId
            ? String(b.bookingId)
            : rawId
              ? `BK-${rawId.slice(-6).toUpperCase()}`
              : 'BK-000000';

          return {
            id: rawId || String(Math.random()),
            bookingId: bId,
            user: parseUserName(b.user, b.userName),
            slot: parseSlotNumber(b.slot, b.slotNumber),
            date: String(b.date || (b.startTime ? new Date(String(b.startTime)).toISOString().slice(0, 10) : '')),
            noShowTime: String(b.noShowTime || (b.startTime ? new Date(String(b.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '-')),
            penaltyStatus: (b.penaltyStatus || 'pending') as NoShowEntry['penaltyStatus'],
            penaltyAmount: Number(b.penaltyAmount ?? b.overstayPenalty ?? 10),
          };
        });
        setData(mapped);
      })
      .catch(() => { if (mounted) setData([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(
    () => (dateFilter ? data.filter((d) => d.date.includes(dateFilter)) : data),
    [data, dateFilter],
  );

  const totalNoShows = data.length;
  const lostRevenue = data.reduce((s, d) => s + (d.penaltyAmount || 50), 0);

  const columns = useMemo(() => [
    { key: 'bookingId', label: 'Booking ID', sortable: true },
    { key: 'user', label: 'User', sortable: true },
    { key: 'slot', label: 'Slot', sortable: true },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (item: Record<string, unknown>) => {
        const dStr = String(item.date || '');
        if (!dStr) return '-';
        try {
          const d = new Date(dStr);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          }
        } catch {
          // fallback
        }
        return dStr;
      },
    },
    { key: 'noShowTime', label: 'No-Show Time', sortable: true },
    {
      key: 'penaltyStatus',
      label: 'Penalty Status',
      sortable: true,
      render: (item: Record<string, unknown>) => penaltyBadge(item.penaltyStatus as string),
    },
    {
      key: 'penaltyAmount',
      label: 'Penalty',
      sortable: true,
      render: (item: Record<string, unknown>) => (
        <span className="neon-text-cyan">₹{String(item.penaltyAmount ?? 50)}</span>
      ),
    },
  ], []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 grid-bg min-h-screen p-6">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <CarSedan className="w-20 h-auto" color="#06b6d4" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold neon-text">No-Show Report</h1>
          <p className="text-gray-400 mt-1">Track and manage no-show violations</p>
        </div>
        <button className="btn-neon-amber flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
          <HiOutlineDocumentArrowDown className="w-4 h-4" />
          Export
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <div className="stat-card animate-pulse h-24 rounded-xl" />
            <div className="stat-card animate-pulse h-24 rounded-xl" />
            <div className="stat-card animate-pulse h-24 rounded-xl" />
          </>
        ) : (
          <>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlineXCircle className="w-5 h-5 text-cyan-400" />} title="Total No-Shows" value={totalNoShows} change="+3" changeType="increase" />
            </div>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlinePercentBadge className="w-5 h-5 text-pink-400" />} title="No-Show Percentage" value={`${percentage}%`} change="+0.8%" changeType="increase" />
            </div>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlineBanknotes className="w-5 h-5 text-green-400" />} title="Lost Revenue" value={`₹${lostRevenue}`} change="-₹20" changeType="decrease" />
            </div>
          </>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-400">Filter by date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-neon w-full sm:w-auto text-sm rounded-lg px-3 py-1.5"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="glass-card rounded-xl">
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            pageSize={10}
            searchable
            searchKeys={['user', 'bookingId', 'slot']}
            loading={loading}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NoShowReport;
