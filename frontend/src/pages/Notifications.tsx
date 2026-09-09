import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineCreditCard,
  HiOutlineQrCode,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { bookingApi } from '../services/api';
import { BikeScooter } from '../components/vehicles';

interface Notification {
  id: string;
  icon: typeof HiOutlineBell;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  type: 'booking' | 'payment' | 'alert' | 'info';
  targetUrl: string;
  actionText: string;
  bookingData?: Record<string, unknown>;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
};

const notificationFromBooking = (booking: Record<string, unknown>): Notification | null => {
  const status = String(booking.status || 'pending');
  const paymentStatus = String(booking.paymentStatus || 'pending');
  const slot = (booking.slot as Record<string, unknown>)?.number as string || 'N/A';
  const bId = String(booking._id || booking.id || '');
  const dateStr = (booking.updatedAt as string) || (booking.createdAt as string) || new Date().toISOString();
  const ts = new Date(dateStr).getTime();

  if (paymentStatus === 'pending' || status === 'pending') {
    return {
      id: `n-${bId}-pending`,
      icon: HiOutlineCreditCard,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-l-amber-500',
      title: 'Payment Pending',
      message: `Complete checkout for Slot #${slot} before hold expires.`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: false,
      type: 'payment',
      targetUrl: `/dashboard/payments?bookingId=${bId}`,
      actionText: 'Pay Now',
      bookingData: booking,
    };
  }

  if (status === 'confirmed') {
    return {
      id: `n-${bId}-confirmed`,
      icon: HiOutlineQrCode,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-l-cyan-500',
      title: 'Booking Confirmed • QR Pass Ready',
      message: `Slot #${slot} reserved. Your digital entry gate pass is active.`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: false,
      type: 'booking',
      targetUrl: '/qr-code',
      actionText: 'View Pass',
      bookingData: booking,
    };
  }

  if (status === 'active') {
    return {
      id: `n-${bId}-entry`,
      icon: HiOutlineCheckCircle,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-l-emerald-500',
      title: 'Vehicle Inside Parking Bay',
      message: `Vehicle checked in at Slot #${slot}. Session currently active.`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: false,
      type: 'alert',
      targetUrl: '/qr-code',
      actionText: 'Exit Key',
      bookingData: booking,
    };
  }

  if (status === 'completed') {
    return {
      id: `n-${bId}-exit`,
      icon: HiOutlineCheckCircle,
      iconColor: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-l-gray-600',
      title: 'Parking Completed',
      message: `Parking session at Slot #${slot} has ended successfully.`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: true,
      type: 'info',
      targetUrl: '/booking-history',
      actionText: 'Receipt',
      bookingData: booking,
    };
  }

  return {
    id: `n-${bId}-info`,
    icon: HiOutlineInformationCircle,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500',
    title: `Booking Status: ${status.toUpperCase()}`,
    message: `Slot #${slot} status changed to ${status}.`,
    time: timeAgo(dateStr),
    timestamp: ts,
    read: true,
    type: 'info',
    targetUrl: '/booking-history',
    actionText: 'Details',
    bookingData: booking,
  };
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const Notifications = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await bookingApi.getMyBookings();
        const bookings = (res.bookings || []) as Record<string, unknown>[];
        const derived = bookings
          .map(notificationFromBooking)
          .filter(Boolean) as Notification[];
        derived.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(derived);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = tab === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n: Notification) => {
    // Mark clicked item as read
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    // Redirect to corresponding page with state
    navigate(n.targetUrl, {
      state: {
        booking: n.bookingData,
        bookingId: n.bookingData?._id || n.bookingData?.id,
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6 pb-12"
    >
      <div className="flex items-center justify-between">
        <div className="relative">
          <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <BikeScooter className="w-24 h-auto" color="#ec4899" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold neon-text flex items-center gap-2">
            <HiOutlineBell className="w-6 h-6 text-[#06b6d4]" />
            Notifications
          </h1>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up! No unread notifications'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-[#06b6d4] hover:text-[#22d3ee] font-medium transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 p-1 w-fit rounded-xl backdrop-blur-sm border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            tab === 'all'
              ? 'glass-card-glow'
              : 'glass hover:text-white'
          }`}
          style={{ color: tab === 'all' ? 'var(--text)' : 'var(--text-secondary)' }}
        >
          All
        </button>
        <button
          onClick={() => setTab('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            tab === 'unread'
              ? 'glass-card-glow'
              : 'glass hover:text-white'
          }`}
          style={{ color: tab === 'unread' ? 'var(--text)' : 'var(--text-secondary)' }}
        >
          Unread
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full badge-orange">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="glass-card p-4 flex items-start gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: 'var(--glass-bg)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded w-1/3" style={{ backgroundColor: 'var(--glass-bg)' }} />
                <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--glass-bg)' }} />
                <div className="h-2 rounded w-1/6" style={{ backgroundColor: 'var(--glass-bg)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <HiOutlineExclamationTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 text-sm">{error}</p>
          <button
            className="btn-outline mt-4 inline-flex items-center gap-2"
            onClick={() => {
              setError('');
              setLoading(true);
              bookingApi.getMyBookings()
                .then(res => {
                  const bookings = (res.bookings || []) as Record<string, unknown>[];
                  const derived = bookings.map(notificationFromBooking).filter(Boolean) as Notification[];
                  derived.sort((a, b) => b.timestamp - a.timestamp);
                  setNotifications(derived);
                })
                .catch(err => setError(err instanceof Error ? err.message : 'Failed to load notifications'))
                .finally(() => setLoading(false));
            }}
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 glass-card rounded-2xl p-8"
        >
          <div className="w-16 h-16 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <HiOutlineBell className="w-8 h-8" />
          </div>
          <p className="neon-text text-lg font-semibold">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">Updates about your bookings, payment receipts, and passes will show here.</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          <AnimatePresence>
            {filtered.map(n => {
              const Icon = n.icon;
              return (
                <motion.div
                  key={n.id}
                  variants={itemVariants}
                  layout
                  onClick={() => handleNotificationClick(n)}
                  className={`glass-card p-4 flex items-center justify-between gap-4 border-l-4 ${n.borderColor} hover:bg-white/5 transition-all duration-200 cursor-pointer group shadow-md hover:shadow-cyan-500/10`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${n.iconColor} ${n.bgColor} flex-shrink-0 mt-0.5 border border-white/10 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">{n.title}</h3>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#06b6d4] flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs mt-0.5 text-gray-300 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1 font-mono">{n.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-semibold text-cyan-400 group-hover:text-cyan-200 bg-cyan-500/10 group-hover:bg-cyan-500/20 px-3 py-1.5 rounded-xl border border-cyan-500/30 transition-all">
                    <span>{n.actionText}</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Notifications;
