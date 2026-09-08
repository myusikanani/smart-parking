import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineArrowsRightLeft,
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import { securityApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface LogEntry {
  time: string;
  type: 'Entry' | 'Exit';
  vehicleNumber: string;
  slot: string;
  bookingId: string;
  verifiedBy: string;
  [key: string]: unknown;
}

type FilterType = 'All' | 'Entry' | 'Exit';

const TodaysLogs = () => {
  const [filter, setFilter] = useState<FilterType>('All');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, entries: 0, exits: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await securityApi.getTodayLogs();
        if (data.success) {
          const rawLogs = (data.logs || []) as Record<string, unknown>[];
          const mapped: LogEntry[] = rawLogs.map((l) => {
            const timeVal = l.exitTime || l.entryTime || l.updatedAt || l.createdAt || '';
            const timeStr = timeVal ? new Date(String(timeVal)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const slotStr = (l.slot as Record<string, unknown>)?.number ? String((l.slot as Record<string, unknown>).number) : (l.slot as string) || '--';
            const driverStr = (l.user as Record<string, unknown>)?.name ? String((l.user as Record<string, unknown>).name) : (l.verifiedBy as string) || 'Security';
            return {
              time: timeStr,
              type: (l.status === 'completed' || l.exitTime ? 'Exit' : 'Entry') as 'Entry' | 'Exit',
              vehicleNumber: (l.vehicleNumber as string) || '--',
              slot: slotStr,
              bookingId: (l.bookingId as string) || (l._id as string) || '--',
              verifiedBy: driverStr,
            };
          });
          setLogs(mapped);
          setStats({
            total: (data.totalMovements as number) || mapped.length,
            entries: (data.entries as number) || mapped.filter((l) => l.type === 'Entry').length,
            exits: (data.exits as number) || mapped.filter((l) => l.type === 'Exit').length,
          });
        } else {
          setError('Failed to load logs');
        }
      } catch {
        setError('Failed to load today\'s logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (filter === 'All') return logs;
    return logs.filter((l) => l.type === filter);
  }, [filter, logs]);

  const columns = [
    { key: 'time', label: 'Time', sortable: true },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (row: LogEntry) => (
        row.type === 'Entry'
          ? <span className="badge-green">Entry</span>
          : <span className="badge-pink">Exit</span>
      ),
    },
    { key: 'vehicleNumber', label: 'Vehicle Number', sortable: true },
    { key: 'slot', label: 'Slot', sortable: true },
    { key: 'bookingId', label: 'Booking ID', sortable: true },
    { key: 'verifiedBy', label: 'Verified By', sortable: true },
  ];

  const tabs: { label: string; value: FilterType; count: number; icon?: ReactNode }[] = [
    { label: 'All', value: 'All', count: stats.total, icon: <HiOutlineArrowsRightLeft className="w-4 h-4" /> },
    { label: 'Entry', value: 'Entry', count: stats.entries, icon: <HiOutlineArrowRightOnRectangle className="w-4 h-4" /> },
    { label: 'Exit', value: 'Exit', count: stats.exits, icon: <HiOutlineArrowLeftOnRectangle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#06b6d4" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Today's Logs</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Complete record of all vehicle movements</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10">
            <HiOutlineArrowPath className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium text-cyan-400">{loading ? 'Refreshing...' : 'Auto-refresh'}</span>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="glass-card p-4 rounded-xl border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { icon: <HiOutlineArrowsRightLeft className="w-5 h-5" />, label: 'Total Movements', value: stats.total, glow: 'rgba(6,182,212,0.3)' },
            { icon: <HiOutlineArrowRightOnRectangle className="w-5 h-5" />, label: 'Entries', value: stats.entries, glow: 'rgba(16,185,129,0.3)' },
            { icon: <HiOutlineArrowLeftOnRectangle className="w-5 h-5" />, label: 'Exits', value: stats.exits, glow: 'rgba(236,72,153,0.3)' },
          ].map((s, i) => (
            <div key={i} className="stat-card glass-card">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-cyan-400"
                  style={{ boxShadow: `0 0 15px ${s.glow}, inset 0 0 15px ${s.glow}`, background: 'rgba(6,182,212,0.08)' }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{loading ? '...' : s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {loading && logs.length === 0 ? (
          <motion.div variants={itemVariants}>
            <div className="glass-card rounded-xl p-8">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--glass-bg)' }} />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === tab.value
                      ? 'btn-neon'
                      : 'glass-card hover:text-white'
                  }`}
                  style={{ color: filter === tab.value ? undefined : 'var(--text-secondary)' }}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter === tab.value ? 'bg-white/20' : ''
                  }`}
                  style={filter !== tab.value ? { backgroundColor: 'var(--glass-bg)' } : undefined}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="glass-card rounded-xl">
              <DataTable
                columns={columns}
                data={filteredData}
                searchKeys={['vehicleNumber', 'bookingId', 'verifiedBy']}
                pageSize={10}
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TodaysLogs;
