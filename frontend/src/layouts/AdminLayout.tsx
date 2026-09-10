import { useState, useRef, useEffect } from 'react';
import type { ComponentType } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineRectangleStack,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineChartBar, 
  HiOutlineUserMinus,
  HiOutlineClock,
  HiOutlineQueueList,
  HiOutlineTag,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineBell,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
  HiOutlineSparkles,
  HiOutlineCube,
} from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';
import ThemeToggle from '../components/ThemeToggle';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const overviewItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: HiOutlineHome },
];

const operationsItems: NavItem[] = [
  { to: '/admin/slots', label: 'Manage Slots', icon: HiOutlineRectangleStack },
  { to: '/admin/bookings', label: 'Manage Bookings', icon: HiOutlineCalendarDays },
  { to: '/admin/users', label: 'Manage Users', icon: HiOutlineUsers },
  { to: '/admin/waiting-list', label: 'Waiting List', icon: HiOutlineQueueList },
];

const moneyItems: NavItem[] = [
  { to: '/admin/payments', label: 'Payments', icon: HiOutlineCreditCard },
  { to: '/admin/revenue', label: 'Revenue', icon: HiOutlineCurrencyDollar },
  { to: '/admin/pricing', label: 'Pricing', icon: HiOutlineTag },
];

const moreItems: NavItem[] = [
  { to: '/admin/layout-designer', label: 'Layout Designer', icon: HiOutlineCube },
  { to: '/admin/ai-analytics', label: 'AI Analytics', icon: HiOutlineSparkles },
  { to: '/admin/reports', label: 'Reports', icon: HiOutlineDocumentText },
  { to: '/admin/analytics', label: 'Analytics', icon: HiOutlineChartBar },
  { to: '/admin/overstay', label: 'Overstay Report', icon: HiOutlineClock },
  { to: '/admin/no-show', label: 'No-Show Report', icon: HiOutlineUserMinus },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: HiOutlineClipboardDocumentList },
  { to: '/admin/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const isMoreActive = moreItems.some((it) => location.pathname === it.to);
  const [moreExpanded, setMoreExpanded] = useState(isMoreActive);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMoreActive) setMoreExpanded(true);
  }, [location.pathname, isMoreActive]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-0.5">
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
          {title}
        </div>
      )}
      {collapsed && <div className="my-2 border-t border-white/5" />}
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : undefined}
            className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
            {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-inter">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`glass-sidebar fixed top-0 left-0 z-50 h-full transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 relative overflow-hidden">
                <span className="text-white font-bold text-xs">P</span>
                <motion.div
                  initial={{ x: -8 }}
                  animate={{ x: 8 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatType: 'reverse' }}
                  className="absolute bottom-0 opacity-30"
                >
                  <CarSedan className="w-3 h-auto" color="#ffffff" />
                </motion.div>
              </div>
              <span className="text-sm font-bold neon-text tracking-wide">ParkSmart Admin</span>
            </Link>
          )}
          {collapsed && (
            <Link to="/admin" className="mx-auto">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 relative overflow-hidden">
                <span className="text-white font-bold text-xs">P</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            {collapsed ? <HiOutlineChevronDoubleRight className="w-4 h-4" /> : <HiOutlineChevronDoubleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-3.5rem)] scrollbar-thin">
          {renderNavGroup('Overview', overviewItems)}
          {renderNavGroup('Operations', operationsItems)}
          {renderNavGroup('Money', moneyItems)}

          {/* Collapsible MORE section */}
          <div className="pt-1">
            {!collapsed ? (
              <button
                onClick={() => setMoreExpanded(!moreExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/5 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 font-mono">
                  More Tools ({moreItems.length})
                </span>
                <HiOutlineChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${moreExpanded ? 'rotate-180 text-cyan-400' : ''}`}
                />
              </button>
            ) : (
              <div className="my-2 border-t border-white/5" />
            )}

            {(moreExpanded || collapsed) && (
              <div className="space-y-0.5 mt-0.5">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                      {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <header className="glass-nav sticky top-0 z-30 border-b border-white/5 bg-[var(--bg)]/80 backdrop-blur-md">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                <HiOutlineBars3 className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search slots, bookings, users..."
                  className="input-neon pl-9 pr-4 py-1.5 text-xs w-64 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
                  className="relative p-2 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                  title="Notifications"
                >
                  <HiOutlineBell className="w-4 h-4" />
                  <span className="badge-neon absolute top-1 right-1 w-3.5 h-3.5 text-[9px] font-bold rounded-full flex items-center justify-center">
                    5
                  </span>
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-card py-2 shadow-2xl z-50"
                    >
                      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                        <p className="text-xs font-semibold neon-text">System Alerts & Notifications</p>
                        <span className="text-[10px] text-cyan-400 font-mono">Live</span>
                      </div>
                      {[
                        { title: 'New Reservation', desc: 'Slot P1-02 reserved by John Doe', time: '2m ago' },
                        { title: 'Payment Received', desc: '₹60 paid via Razorpay (UPI)', time: '14m ago' },
                        { title: 'Emergency Buffer Ready', desc: 'BUF-1A and BUF-2A verified active', time: '1h ago' }
                      ].map((item, i) => (
                        <div key={i} className="px-4 py-2.5 hover:bg-cyan-500/5 cursor-pointer transition-colors border-b border-white/5 last:border-0">
                          <p className="text-xs font-semibold text-gray-200">{item.title}</p>
                          <p className="text-[11px] text-gray-400">{item.desc}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">{item.time}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 pl-2 border-l border-white/10 p-1 rounded-xl hover:bg-cyan-500/10 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/25 uppercase">
                    {user?.name?.slice(0, 2) || 'AD'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold leading-tight text-gray-200">{user?.name || 'Admin User'}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{user?.email || 'admin@parksmart.com'}</p>
                  </div>
                  <HiOutlineChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] glass-card py-2 shadow-2xl z-50"
                    >
                      <Link
                        to="/admin/settings"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                      >
                        <HiOutlineCog6Tooth className="w-4 h-4 text-cyan-400" /> Settings & Health
                      </Link>
                      <Link
                        to="/admin/audit-logs"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                      >
                        <HiOutlineClipboardDocumentList className="w-4 h-4 text-cyan-400" /> Audit Trail
                      </Link>
                      <div className="my-1 border-t border-white/5" />
                      <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs font-medium text-pink-400 hover:bg-pink-500/10 transition-colors"
                      >
                        <HiOutlineArrowRightOnRectangle className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 overflow-y-auto grid-bg relative min-h-[calc(100vh-3.5rem)]">
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
              initial={{ x: '110%' }}
              animate={{ x: '-110%' }}
              transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
              className="absolute top-[15%] opacity-[0.02]"
            >
              <CarSedan className="w-56 h-auto" color="#06b6d4" />
            </motion.div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
