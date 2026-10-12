import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineBanknotes,
  HiOutlineDocumentArrowDown,
} from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import { adminApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface OverstayEntry {
  id: string;
  bookingId: string;
  user: string;
  slot: string;
  expectedEnd: string;
  actualEnd: string;
  overstayDuration: string;
  overstayMinutes: number;
  penalty: number;
  penaltyPaid: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const OverstayReport = () => {
  const [data, setData] = useState<OverstayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTotalPenalty] = useState(0);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getOverstayReport()
      .then((res) => {
        if (!mounted) return;
        setTotalPenalty(res.totalPenalty ?? 0);
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

        const parseTime = (val: unknown, fallback: string): string => {
          if (!val) return fallback;
          if (typeof val === 'string' && (val.includes(':') || val === 'Still Parked' || val === '-')) return val;
          try {
            const d = new Date(String(val));
            if (!isNaN(d.getTime())) {
              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            }
          } catch {
            // fallback
          }
          return String(val);
        };

        const mapped = (res.bookings || []).map((b: Record<string, unknown>) => {
          const rawId = String(b._id || b.id || '');
          const bId = b.bookingId
            ? String(b.bookingId)
            : rawId
              ? `BK-${rawId.slice(-6).toUpperCase()}`
              : 'BK-000000';

          const mins = Number(b.overstayMinutes ?? b.overstayDuration ?? 0);
          const durationStr = b.overstayDuration && typeof b.overstayDuration === 'string' && (b.overstayDuration.includes('m') || b.overstayDuration.includes('h'))
            ? String(b.overstayDuration)
            : `${mins} mins`;

          return {
            id: rawId || String(Math.random()),
            bookingId: bId,
            user: parseUserName(b.user, b.userName),
            slot: parseSlotNumber(b.slot, b.slotNumber),
            expectedEnd: parseTime(b.expectedEnd || b.endTime, '-'),
            actualEnd: parseTime(b.actualEnd || b.exitTime, 'Still Parked'),
            overstayDuration: durationStr,
            overstayMinutes: mins,
            penalty: Number(b.penalty ?? b.overstayPenalty ?? 0),
            penaltyPaid: Boolean(b.penaltyPaid || b.penaltyPaymentStatus === 'paid'),
          };
        });
        setData(mapped);
      })
      .catch(() => { if (mounted) setData([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(
    () => (dateFilter ? data.filter((d) => d.bookingId.includes(dateFilter.slice(-2))) : data),
    [data, dateFilter],
  );

  const totalOverstays = data.length;
  const avgDuration = data.length
    ? Math.round(data.reduce((s, d) => s + d.overstayMinutes, 0) / data.length)
    : 0;
  const totalPenaltyCollected = data.filter((d) => d.penaltyPaid).reduce((s, d) => s + d.penalty, 0);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const columns = useMemo(() => [
    { key: 'bookingId', label: 'Booking ID', sortable: true },
    { key: 'user', label: 'User', sortable: true },
    { key: 'slot', label: 'Slot', sortable: true },
    { key: 'expectedEnd', label: 'Expected End', sortable: true },
    { key: 'actualEnd', label: 'Actual End', sortable: true },
    { key: 'overstayDuration', label: 'Overstay Duration', sortable: true },
    {
      key: 'penalty', label: 'Penalty', sortable: true,
      render: (item: Record<string, unknown>) => <span className="neon-text-cyan">₹{String(item.penalty ?? 0)}</span>,
    },
    {
      key: 'penaltyPaid', label: 'Status', sortable: true,
      render: (item: Record<string, unknown>) => (
        item.penaltyPaid ? <span className="badge-green">Paid</span> : <span className="badge-orange">Unpaid</span>
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
          <h1 className="text-2xl font-bold neon-text">Overstay Report</h1>
          <p className="text-gray-400 mt-1">Monitor and manage overstay violations</p>
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
              <StatCard icon={<HiOutlineClock className="w-5 h-5 text-cyan-400" />} title="Total Overstays" value={totalOverstays} change="+4" changeType="increase" />
            </div>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlineArrowTrendingUp className="w-5 h-5 text-pink-400" />} title="Average Duration" value={formatDuration(avgDuration)} change="+8 min" changeType="increase" />
            </div>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlineBanknotes className="w-5 h-5 text-green-400" />} title="Total Penalty Collected" value={`₹${totalPenaltyCollected}`} change="+₹52" changeType="increase" />
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

export default OverstayReport;
