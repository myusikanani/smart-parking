import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineEye,
  HiOutlineXCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineCalendarDays,
  HiOutlineUser,
  HiOutlineTruck,
  HiOutlineCreditCard,
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
} from 'react-icons/hi2';
import { adminApi, bookingApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface AdminBooking {
  id: string;
  user: string;
  email: string;
  slot: string;
  vehicle: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'active' | 'completed' | 'expired' | 'cancelled';
  payment: 'pending' | 'paid' | 'refunded' | 'failed';
  amount: number;
  category: string;
  floor: number;
  entryTime: string;
  exitTime: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    confirmed: { className: 'badge-green', label: 'Confirmed' },
    active: { className: 'badge-neon', label: 'Active' },
    completed: { className: 'badge-gray', label: 'Completed' },
    expired: { className: 'badge-orange', label: 'Expired' },
    cancelled: { className: 'badge-red', label: 'Cancelled' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
};

const paymentBadge = (payment: string) => {
  const map: Record<string, { className: string; label: string }> = {
    paid: { className: 'badge-green', label: 'Paid' },
    pending: { className: 'badge-orange', label: 'Pending' },
    refunded: { className: 'badge-gray', label: 'Refunded' },
    failed: { className: 'badge-red', label: 'Failed' },
  };
  const p = map[payment] || { className: 'badge-gray', label: payment };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.className}`}>{p.label}</span>;
};

const ManageBookings = () => {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusTab !== 'all') params.status = statusTab;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    adminApi.getAllBookings(params)
      .then((res) => {
        if (!mounted) return;
        const mapped = (res.bookings || []).map((b: Record<string, unknown>) => {
          const user = b.user as Record<string, unknown> | undefined;
          const slot = b.slot as Record<string, unknown> | undefined;
          return {
            id: String(b._id || b.id),
            user: String(user?.name || b.user || 'Unknown'),
            email: String(user?.email || ''),
            slot: String(slot?.number || b.slotNumber || b.slot || ''),
            vehicle: String(b.vehicleNumber || ''),
            date: b.startTime ? new Date(String(b.startTime)).toLocaleDateString('en-CA') : '',
            startTime: b.startTime ? new Date(String(b.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            endTime: b.endTime ? new Date(String(b.endTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            status: (b.status || 'confirmed') as AdminBooking['status'],
            payment: (b.paymentStatus || 'pending') as AdminBooking['payment'],
            amount: Number(b.amount ?? 0),
            category: String(slot?.category || 'four-wheeler'),
            floor: Number(slot?.floor ?? 1),
            entryTime: b.entryTime ? new Date(String(b.entryTime)).toLocaleString() : '',
            exitTime: b.exitTime ? new Date(String(b.exitTime)).toLocaleString() : '',
          };
        });
        setBookings(mapped);
      })
      .catch(() => { if (mounted) setBookings([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [statusTab, searchQuery, startDate, endDate]);

  const filteredBookings = useMemo(() => {
    let data = bookings;
    if (startDate) data = data.filter((b) => b.date >= startDate);
    if (endDate) data = data.filter((b) => b.date <= endDate);
    return data;
  }, [bookings, startDate, endDate]);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'expired', label: 'Expired' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const handleCancel = (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    bookingApi.cancel(id, 'Cancelled by admin')
      .then(() => {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b)));
      })
      .catch(() => {});
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 grid-bg min-h-screen p-6">
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <CarSedan className="w-20 h-auto" color="#06b6d4" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold neon-text">Manage Bookings</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>View and manage all parking bookings</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="glass-card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-1 glass rounded-lg p-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusTab(t.key)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    statusTab === t.key
                      ? 'btn-neon text-white'
                      : 'btn-outline'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto flex-wrap">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Search ID, user, vehicle, slot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-neon text-sm py-1.5 pl-8 w-full sm:w-56"
                />
              </div>
              <div className="flex items-center gap-2">
                <HiOutlineCalendarDays className="w-4 h-4 text-cyan-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-neon text-sm py-1.5"
                />
              </div>
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <div className="flex items-center gap-2">
                <HiOutlineCalendarDays className="w-4 h-4 text-cyan-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-neon text-sm py-1.5"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-cyan-500/20">
                {['', 'Booking ID', 'User', 'Slot', 'Date/Time', 'Status', 'Payment', 'Amount', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Loading bookings...</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>No bookings found</td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedRow(expandedRow === b.id ? null : b.id)}
                        className="p-1 hover:text-cyan-400 transition-colors"
                      >
                        {expandedRow === b.id ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-cyan-400">{b.id}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{b.user}</td>
                    <td className="px-4 py-3 text-sm">{b.slot}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span style={{ color: 'var(--text-secondary)' }}>{b.date}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.startTime} - {b.endTime}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusBadge(b.status)}</td>
                    <td className="px-4 py-3">{paymentBadge(b.payment)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-cyan-400">₹{b.amount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setExpandedRow(expandedRow === b.id ? null : b.id)}
                          className="p-1.5 rounded-lg hover:text-cyan-400 btn-outline transition-colors"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="p-1.5 rounded-lg hover:text-red-400 btn-danger transition-colors"
                        >
                          <HiOutlineXCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <AnimatePresence>
            {expandedRow && (() => {
              const booking = filteredBookings.find((b) => b.id === expandedRow);
              if (!booking) return null;
              return (
                <motion.tr
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td colSpan={9} className="px-4 py-4 glass border-l-4 border-cyan-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <HiOutlineUser className="w-5 h-5 text-cyan-400" />
                        <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>User</span>
                           <p className="text-sm font-medium text-gray-200">{booking.user}</p>
                           <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{booking.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <HiOutlineTruck className="w-5 h-5 text-pink-400" />
                        <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Vehicle</span>
                           <p className="text-sm font-medium text-gray-200">{booking.vehicle}</p>
                           <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{booking.category.replace('-', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <HiOutlineCalendarDays className="w-5 h-5 text-green-400" />
                        <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Date & Slot</span>
                           <p className="text-sm font-medium text-gray-200">{booking.date}</p>
                           <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Floor {booking.floor} - {booking.slot}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <HiOutlineCreditCard className="w-5 h-5 text-cyan-400" />
                        <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Payment</span>
                           <p className="text-sm font-medium text-gray-200">₹{booking.amount}</p>
                           <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{booking.payment}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <HiOutlineClock className="w-5 h-5 text-emerald-400" />
                        <div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Entry / Exit</span>
                           <p className="text-sm font-medium text-gray-200">{booking.entryTime || '—'}</p>
                           <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{booking.exitTime || 'Not exited yet'}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              );
            })()}
          </AnimatePresence>
          <div className="flex items-center justify-between px-4 py-3 border-t border-cyan-500/20">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Showing {filteredBookings.length} bookings
            </span>
          </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ManageBookings;
