import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
} from 'react-icons/hi2';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import { adminApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface WaitingEntry {
  id: string;
  position: number;
  user: string;
  email: string;
  category: string;
  requestedDate: string;
  status: 'waiting' | 'approved' | 'expired';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const categoryLabel = (cat: string) => {
  const map: Record<string, string> = {
    'two-wheeler': '2 Wheeler',
    'four-wheeler': '4 Wheeler',
    ev: 'EV',
    disabled: 'Disabled',
  };
  return map[cat] || cat;
};

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    waiting: { className: 'badge-orange', label: 'Waiting' },
    approved: { className: 'badge-green', label: 'Approved' },
    expired: { className: 'badge-gray', label: 'Expired' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
};

const WaitingListAdmin = () => {
  const [list, setList] = useState<WaitingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    adminApi.getWaitingList()
      .then((res) => {
        if (!mounted) return;
        const mapped = (res.waitingList || []).map((w: Record<string, unknown>, idx: number) => ({
          id: String(w._id || w.id),
          position: Number(w.position ?? idx + 1),
          user: String(w.userName || w.user || ''),
          email: String(w.email || ''),
          category: String(w.category || 'four-wheeler'),
          requestedDate: String(w.requestedDate || w.createdAt || ''),
          status: (w.status || 'waiting') as WaitingEntry['status'],
        }));
        setList(mapped);
      })
      .catch(() => { if (mounted) setList([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleApprove = (id: string) => {
    setList((prev) => prev.filter((w) => w.id !== id));
  };

  const handleRemove = (id: string) => {
    setList((prev) => prev.filter((w) => w.id !== id));
  };

  const handleClearAll = () => {
    if (!confirm('Clear all waiting list entries?')) return;
    setList([]);
  };

  const totalWaiting = list.length;
  const avgWaitDays = 3;

  const columns = [
    { key: 'position', label: '#', sortable: true },
    { key: 'user', label: 'User', sortable: true },
    {
      key: 'category', label: 'Category', sortable: true,
      render: (item: Record<string, unknown>) => categoryLabel(item.category as string),
    },
    { key: 'requestedDate', label: 'Requested Date', sortable: true },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (item: Record<string, unknown>) => statusBadge(item.status as string),
    },
    {
      key: 'actions', label: 'Actions',
      render: (item: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleApprove(item.id as string)}
            className="btn-neon px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
            title="Approve"
          >
            <HiOutlineCheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRemove(item.id as string)}
            className="btn-danger px-3 py-1.5 rounded-lg text-xs font-semibold"
            title="Remove"
          >
            <HiOutlineXCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
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
          <h1 className="text-2xl font-bold neon-text">Waiting List</h1>
          <p className="text-gray-400 mt-1">Manage the parking slot waiting list</p>
        </div>
        <button
          onClick={handleClearAll}
          className="btn-danger flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <HiOutlineTrash className="w-4 h-4" />
          Clear All
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <>
            <div className="stat-card animate-pulse h-24 rounded-xl" />
            <div className="stat-card animate-pulse h-24 rounded-xl" />
          </>
        ) : (
          <>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlineUserGroup className="w-5 h-5 text-cyan-400" />} title="Total Waiting" value={totalWaiting} change="+5" changeType="increase" />
            </div>
            <div className="stat-card rounded-xl p-4">
              <StatCard icon={<HiOutlineClock className="w-5 h-5 text-pink-400" />} title="Average Wait Time" value={`${avgWaitDays} days`} change="-1 day" changeType="decrease" />
            </div>
          </>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="glass-card rounded-xl">
          <DataTable
            columns={columns}
            data={list as unknown as Record<string, unknown>[]}
            pageSize={10}
            searchable
            searchKeys={['user', 'email']}
            loading={loading}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WaitingListAdmin;
