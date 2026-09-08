import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineEye,
  HiOutlineCreditCard,
  HiOutlineQrCode,
} from 'react-icons/hi2';
import Button from '../components/ui/Button';
import DataTable from '../components/DataTable';
import { bookingApi } from '../services/api';
import { CarSedan } from '../components/vehicles';

interface BookingRecord extends Record<string, unknown> {
  id: string;
  slotNumber?: string;
  slot?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  amount: number;
  paymentStatus?: string;
  payment?: string;
  category: string;
  time?: string;
  vehicleNumber?: string;
  vehicle?: string;
}

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    pending: { className: 'badge-orange', label: 'Pending Payment' },
    active: { className: 'badge-green', label: 'Active' },
    confirmed: { className: 'badge-neon', label: 'Confirmed' },
    completed: { className: 'badge-gray', label: 'Completed' },
    cancelled: { className: 'badge-red', label: 'Cancelled' },
    expired: { className: 'badge-orange', label: 'Expired' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ' + s.className}>{s.label}</span>;
};

const paymentBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    paid: { className: 'badge-green', label: 'Paid' },
    pending: { className: 'badge-orange', label: 'Pending' },
    refunded: { className: 'badge-neon', label: 'Refunded' },
    failed: { className: 'badge-red', label: 'Failed' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return <span className={'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ' + s.className}>{s.label}</span>;
};

const tabs = ['All', 'Active', 'Completed', 'Cancelled'];
const TAB_STATUS_MAP: Record<string, string | undefined> = {
  All: undefined,
  Active: 'active',
  Completed: 'completed',
  Cancelled: 'cancelled',
};

const BookingHistory = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const statusFilter = TAB_STATUS_MAP[activeTab];
        const res = await bookingApi.getMyBookings(statusFilter);
        const mapped = ((res.bookings || []) as Record<string, unknown>[]).map(b => {
          const slotNum = (b.slotNumber as string) || (typeof b.slot === 'object' && b.slot !== null ? String((b.slot as { number?: string }).number || '') : String(b.slot || 'A-01'));
          return {
            ...b,
            id: String(b._id || b.id || ''),
            rawSlot: b.slot,
            slot: slotNum ? `Slot #${slotNum}` : 'Slot #A-01',
            date: b.startTime ? (b.startTime as string).split('T')[0] : '',
            time: b.startTime && b.endTime
              ? `${(b.startTime as string).split('T')[1]?.slice(0, 5) || ''}-${(b.endTime as string).split('T')[1]?.slice(0, 5) || ''}`
              : '',
            vehicle: (b.vehicleNumber as string) || (b.vehicle as string) || '',
            payment: (b.paymentStatus as string) || (b.payment as string) || '',
          };
        });
        setBookings(mapped as unknown as BookingRecord[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab]);

  const filtered = useMemo(() => {
    return bookings;
  }, [bookings]);

  const columns = useMemo(() => [
    { key: 'id', label: 'Booking ID', sortable: true },
    { key: 'slot', label: 'Slot', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item: Record<string, unknown>) => statusBadge(item.status as string),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (item: Record<string, unknown>) => <span style={{ color: 'var(--text)' }}>₹{String(item.amount ?? '')}</span>,
    },
    {
      key: 'payment',
      label: 'Payment',
      sortable: true,
      render: (item: Record<string, unknown>) => paymentBadge(item.payment as string),
    },
    {
      key: 'actions',
      label: '',
      render: (item: Record<string, unknown>) => (
        <div className="flex items-center gap-2 flex-wrap">
          {item.status === 'pending' && item.paymentStatus !== 'paid' && (
            <Button
              variant="ghost"
              onClick={() => navigate(`/dashboard/payments?bookingId=${item._id}`)}
            >
              <HiOutlineCreditCard className="w-4 h-4 mr-1 text-pink-400" />
              Pay Now
            </Button>
          )}
          {item.paymentStatus === 'paid' && !!item.qrCode && (
            <Button
              variant="ghost"
              onClick={() => navigate('/qr-code', { state: { bookingId: item.id } })}
            >
              <HiOutlineQrCode className="w-4 h-4 mr-1 text-cyan-400" />
              View QR
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id as string)}
          >
            <HiOutlineEye className="w-4 h-4 mr-1 text-cyan-400" />
            {expandedRow === item.id ? '✕ Close' : '👁️ View Details'}
          </Button>
        </div>
      ),
    },
  ], [expandedRow]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--glass-bg)' }} />
          <div className="h-4 w-72 rounded mt-2 animate-pulse" style={{ backgroundColor: 'var(--glass-bg)' }} />
        </div>
        <div className="flex gap-2 p-1 w-fit">
          {tabs.map(t => (
            <div key={t} className="h-9 w-20 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--glass-bg)' }} />
          ))}
        </div>
        <div className="glass-card p-4 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--glass-bg)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold neon-text">Booking History</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>View all your past and upcoming bookings</p>
        </div>
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => setActiveTab('All')}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="relative">
        <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
          <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 5 }}>
            <CarSedan className="w-28 h-auto" color="#06b6d4" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold neon-text">Booking History</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>View all your past and upcoming bookings</p>
      </div>

      <div className="flex gap-2 p-1 w-fit rounded-xl" style={{ backgroundColor: 'var(--glass-bg)' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setExpandedRow(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'glass-card-glow text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] border border-cyan-500/30'
                : 'glass hover:text-white hover:border-white/10'
            }`}
            style={activeTab !== tab ? { color: 'var(--text-secondary)' } : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-card">
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={5}
          searchKeys={['id', 'slot', 'vehicle', 'category']}
        />
      </div>

      <AnimatePresence>
        {expandedRow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-5 overflow-hidden"
          >
            {(() => {
              const booking = bookings.find(b => b.id === expandedRow);
              if (!booking) return null;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Category</p>
                    <p className="text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>{booking.category?.replace('-', ' ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Time</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{booking.time || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Vehicle</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{(booking.vehicle as string) || '-'}</p>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingHistory;
