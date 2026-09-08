import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineDocumentArrowDown,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import { adminApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ipAddress: string;
  actionType: 'login' | 'logout' | 'booking_create' | 'booking_cancel' | 'slot_change' | 'payment' | 'user_update';
  live: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getAuditLogs()
      .then((res) => {
        if (!mounted) return;
        const mapped = (res.logs || []).map((l: Record<string, unknown>) => ({
          id: String(l._id || l.id),
          timestamp: String(l.timestamp || ''),
          user: String(l.user || ''),
          action: String(l.action || ''),
          details: String(l.details || ''),
          ipAddress: String(l.ipAddress || l.ip || ''),
          actionType: (l.actionType || l.type || 'login') as AuditEntry['actionType'],
          live: Boolean(l.live ?? true),
        }));
        setLogs(mapped);
      })
      .catch(() => { if (mounted) setLogs([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let data = logs;
    if (dateFilter) data = data.filter((a) => a.timestamp.startsWith(dateFilter));
    if (userFilter) data = data.filter((a) => a.user.toLowerCase().includes(userFilter.toLowerCase()));
    if (actionFilter !== 'all') data = data.filter((a) => a.actionType === actionFilter);
    return data;
  }, [logs, dateFilter, userFilter, actionFilter]);

  const columns = useMemo(() => [
    {
      key: 'timestamp', label: 'Timestamp', sortable: true,
      render: (item: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          {Boolean(item.live) && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live" />}
          <span style={{ color: 'var(--text-secondary)' }}>{String(item.timestamp)}</span>
        </div>
      ),
    },
    { key: 'user', label: 'User', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'details', label: 'Details' },
    { key: 'ipAddress', label: 'IP Address' },
  ], []);

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'booking_create', label: 'Booking Created' },
    { value: 'booking_cancel', label: 'Booking Cancelled' },
    { value: 'slot_change', label: 'Slot Change' },
    { value: 'payment', label: 'Payment' },
    { value: 'user_update', label: 'User Update' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 grid-bg min-h-screen p-6">
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative">
          <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <CarSedan className="w-20 h-auto" color="#06b6d4" />
            </motion.div>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold neon-text">Audit Logs</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass border border-green-500/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400">Live</span>
            </div>
          </div>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Track all system activities and changes</p>
        </div>
        <button className="btn-neon-amber flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold">
          <HiOutlineDocumentArrowDown className="w-4 h-4" />
          Export
        </button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Date:</span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input-neon text-sm rounded-lg px-3 py-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>User:</span>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filter by user..."
                className="input-neon text-sm rounded-lg px-3 py-1.5 w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineFunnel className="w-4 h-4 text-cyan-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="input-neon text-sm rounded-lg px-3 py-1.5"
              >
                {actionTypes.map((at) => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
            </div>
            {(dateFilter || userFilter || actionFilter !== 'all') && (
              <button
                onClick={() => { setDateFilter(''); setUserFilter(''); setActionFilter('all'); }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Clear filters
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
            searchKeys={['user', 'action', 'details', 'ipAddress']}
            loading={loading}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuditLogs;
