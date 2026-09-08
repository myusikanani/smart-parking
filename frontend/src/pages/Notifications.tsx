import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
} from 'react-icons/hi2';
import { bookingApi } from '../services/api';
import { BikeScooter } from '../components/vehicles';

interface Notification {
  id: string;
  icon: typeof HiOutlineBell;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  type: 'booking' | 'payment' | 'alert' | 'info';
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
  const status = booking.status as string;
  const slot = (booking.slot as Record<string, unknown>)?.number as string || 'N/A';
  const dateStr = (booking.updatedAt as string) || (booking.createdAt as string) || new Date().toISOString();
  const ts = new Date(dateStr).getTime();

  if (status === 'confirmed') {
    return {
      id: `n-${booking._id || booking.id}-confirmed`,
      icon: HiOutlineCheckCircle,
      iconColor: 'text-[#06b6d4]',
      title: 'Booking Confirmed',
      message: `Slot ${slot} has been confirmed`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: false,
      type: 'booking',
    };
  }
  if (status === 'active') {
    return {
      id: `n-${booking._id || booking.id}-entry`,
      icon: HiOutlineExclamationTriangle,
      iconColor: 'text-[#10b981]',
      title: 'Vehicle Entered',
      message: `Vehicle entered slot ${slot}`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: false,
      type: 'alert',
    };
  }
  if (status === 'completed') {
    return {
      id: `n-${booking._id || booking.id}-exit`,
      icon: HiOutlineCheckCircle,
      iconColor: 'text-gray-500',
      title: 'Vehicle Exited',
      message: `Parking session at slot ${slot} has ended`,
      time: timeAgo(dateStr),
      timestamp: ts,
      read: true,
      type: 'info',
    };
  }
  return {
    id: `n-${booking._id || booking.id}-info`,
    icon: HiOutlineInformationCircle,
    iconColor: 'text-blue-400',
    title: `Booking ${status}`,
    message: `Slot ${slot} status updated to ${status}`,
    time: timeAgo(dateStr),
    timestamp: ts,
    read: true,
    type: 'info',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
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
          <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No unread notifications'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-[#06b6d4] hover:text-[#22d3ee] font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-2 p-1 w-fit rounded-xl backdrop-blur-sm border" style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
          <button className="btn-outline mt-4 inline-flex items-center gap-2" onClick={() => {
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
          }}>
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-[#06b6d4]/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineBell className="w-8 h-8 text-[#06b6d4]" />
          </div>
          <p className="neon-text text-lg font-semibold">No notifications</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <AnimatePresence>
            {filtered.map(n => {
              const Icon = n.icon;
              return (
                <motion.div
                  key={n.id}
                  variants={itemVariants}
                  layout
                  className={`glass-card p-4 flex items-start gap-4 border-l-4 ${
                    n.read
                      ? 'border-l-gray-700'
                      : 'border-l-[#06b6d4]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${n.iconColor} flex-shrink-0`} style={{ backgroundColor: 'var(--glass-bg)' }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>{n.title}</h3>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-[#06b6d4] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{n.time}</p>
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
