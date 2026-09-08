import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineBanknotes,
  HiOutlineCalendarDays,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUturnLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentArrowDown,
  HiOutlineEye,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { paymentApi } from '../../services/api';
import StatCard from '../../components/StatCard';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

interface TxnRow {
  bookingId: string;
  transactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  status: string;
  method: string;
  vehicleNumber: string;
  slotNumber: string;
  location: string;
  userName?: string;
  userEmail?: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  refunded: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

const fmt = (v?: string) => (v ? new Date(v).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');

interface Detail {
  payment: TxnRow & { zone?: string; penaltyAmount?: number; startTime?: string; endTime?: string; createdAt?: string };
  booking: { bookingId: string; bookingDate: string; startTime: string; endTime: string; duration?: number; status: string; entryTime?: string; exitTime?: string };
  user: { name: string; email: string; phone?: string; memberSince?: string } | null;
}

const PaymentManagement = () => {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const currentFilters = useCallback(() => ({ q, status, from, to }), [q, status, from, to]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await paymentApi.list({ ...currentFilters(), page: p, limit: 20 });
      setTxns((res.transactions || []) as unknown as TxnRow[]);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setPages(res.pages || 1);
    } catch { /* keep previous list on error */ }
    finally { setLoading(false); }
  }, [currentFilters]);

  useEffect(() => {
    let mounted = true;
    paymentApi.stats()
      .then((res) => { if (mounted && res.success) setStats(res.stats || {}); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const openDetail = async (bookingId: string) => {
    setDetailLoading(true);
    try {
      const res = await paymentApi.detail(bookingId);
      if (res.success) setDetail(res as unknown as Detail);
    } catch { /* ignore */ }
    finally { setDetailLoading(false); }
  };

  const exportCsv = async () => {
    try {
      const url = paymentApi.exportUrl(currentFilters());
      const token = localStorage.getItem('token');
      const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `parksmart-payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* ignore */ }
  };

  const resetFilters = () => { setQ(''); setStatus(''); setFrom(''); setTo(''); };

  const cards = [
    { label: "Today's Revenue", value: `₹${Number(stats.todayRevenue ?? 0).toLocaleString('en-IN')}`, icon: HiOutlineBanknotes, cls: 'text-cyan-400' },
    { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`, icon: HiOutlineCalendarDays, cls: 'text-emerald-400' },
    { label: 'Successful', value: stats.successfulPayments ?? 0, icon: HiOutlineCheckBadge, cls: 'text-emerald-400' },
    { label: 'Pending', value: stats.pendingPayments ?? 0, icon: HiOutlineClock, cls: 'text-amber-400' },
    { label: 'Failed', value: stats.failedPayments ?? 0, icon: HiOutlineExclamationTriangle, cls: 'text-red-400' },
    { label: 'Refunded', value: stats.refundedPayments ?? 0, icon: HiOutlineArrowUturnLeft, cls: 'text-sky-400' },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold neon-text">Payment Management</h1>
          <p className="text-gray-400 mt-1">Monitor and manage all parking transactions</p>
        </div>
        <button onClick={exportCsv} className="btn-neon flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm">
          <HiOutlineDocumentArrowDown className="w-4 h-4" />
          Export CSV
        </button>
      </motion.div>

      {/* SUMMARY CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} title={c.label} value={String(c.value)} change="" changeType="increase" icon={<c.icon className={`w-7 h-7 ${c.cls}`} />} />
        ))}
      </motion.div>

      {/* FILTERS */}
      <motion.div variants={itemVariants} className="glass-card p-4 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
              placeholder="Search txn / payment id / user / vehicle…"
              className="input-neon w-full pl-10 text-sm"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-neon w-full text-sm">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-neon w-full text-sm" title="From date" />
          <div className="flex gap-2">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-neon w-full text-sm" title="To date" />
            <button onClick={() => load(1)} className="btn-neon px-4 rounded-xl text-sm font-bold whitespace-nowrap">Go</button>
            {(q || status || from || to) && (
              <button onClick={resetFilters} title="Clear filters" className="btn-outline px-3 rounded-xl text-sm">
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* TRANSACTIONS TABLE */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : txns.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No transactions match your filters.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                    <th className="px-4 py-3">Transaction</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Date/Time</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {txns.map((t) => (
                    <tr key={t.bookingId} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs break-all max-w-[180px]">{t.transactionId}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate max-w-[180px]">{t.razorpayPaymentId || t.razorpayOrderId || t.bookingId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.userName || '—'}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[160px]">{t.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{t.slotNumber || '—'}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[140px]">{t.location}</div>
                      </td>
                      <td className="px-4 py-3 font-bold neon-text-cyan whitespace-nowrap">₹{Number(t.amount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${STATUS_STYLES[t.status] || STATUS_STYLES.pending}`}>
                          {(t.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{t.method}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(t.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openDetail(t.bookingId)} className="btn-outline p-2 rounded-lg" title="View payment details">
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-white/5">
              {txns.map((t) => (
                <div key={t.bookingId} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-xs break-all">{t.transactionId}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{fmt(t.updatedAt)}</div>
                    </div>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${STATUS_STYLES[t.status] || STATUS_STYLES.pending}`}>
                      {(t.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <div><span className="text-gray-500 text-xs">Amount&nbsp;</span><span className="font-bold neon-text-cyan">₹{Number(t.amount).toFixed(2)}</span></div>
                    <div><span className="text-gray-500 text-xs">Slot&nbsp;</span>{t.slotNumber || '—'}</div>
                    <div className="col-span-2 truncate"><span className="text-gray-500 text-xs">User&nbsp;</span>{t.userName || '—'}</div>
                    <div className="col-span-2 truncate"><span className="text-gray-500 text-xs">Razorpay&nbsp;</span><span className="font-mono text-xs">{t.razorpayPaymentId || t.razorpayOrderId || '—'}</span></div>
                  </div>
                  <button onClick={() => openDetail(t.bookingId)} className="w-full btn-outline py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5">
                    <HiOutlineEye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-sm">
                <span className="text-gray-400 text-xs">Page {page} of {pages} · {total} transactions</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => load(page - 1)} className="btn-outline px-3 py-1.5 rounded-lg text-xs disabled:opacity-40">Prev</button>
                  <button disabled={page >= pages} onClick={() => load(page + 1)} className="btn-outline px-3 py-1.5 rounded-lg text-xs disabled:opacity-40">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* PAYMENT DETAIL MODAL */}
      {detailLoading && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <span className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      )}
      {detail && !detailLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold neon-text">Payment Details</h3>
              <button onClick={() => setDetail(null)} className="btn-outline p-2 rounded-lg"><HiOutlineXMark className="w-4 h-4" /></button>
            </div>

            {[
              { title: 'Payment Information', rows: [
                ['Transaction ID', detail.payment.transactionId],
                ['Razorpay Payment ID', detail.payment.razorpayPaymentId || '—'],
                ['Razorpay Order ID', detail.payment.razorpayOrderId || '—'],
                ['Amount', `₹${Number(detail.payment.amount).toFixed(2)}`],
                ['Method', detail.payment.method],
                ['Status', (detail.payment.status || '').toUpperCase()],
                ['Paid At', fmt(detail.payment.updatedAt)],
              ]},
              { title: 'Booking Information', rows: [
                ['Booking ID', detail.booking.bookingId],
                ['Location', detail.payment.location || '—'],
                ['Slot', `${detail.payment.slotNumber}${detail.payment.zone ? ` (Zone ${detail.payment.zone})` : ''}`],
                ['Booking Date', fmt(detail.booking.bookingDate)],
                ['Start Time', fmt(detail.booking.startTime)],
                ['End Time', fmt(detail.booking.endTime)],
                ['Booking Status', (detail.booking.status || '').toUpperCase()],
              ]},
              ...(detail.user ? [{ title: 'User Information', rows: [
                ['Name', detail.user.name],
                ['Email', detail.user.email],
                ['Phone', detail.user.phone || '—'],
                ['Member Since', fmt(detail.user.memberSince)],
              ]}] : []),
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">{section.title}</h4>
                <div className="rounded-xl border border-white/10 divide-y divide-white/5 text-sm">
                  {section.rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 px-3 py-2">
                      <span className="text-gray-400 flex-shrink-0">{k}</span>
                      <span className="font-mono text-right break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-gray-500 text-center">Read-only record. Successful transaction amounts cannot be modified.</p>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentManagement;
