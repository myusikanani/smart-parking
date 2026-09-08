import { useState, useRef, useEffect } from 'react';
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
} from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';
import ThemeToggle from '../components/ThemeToggle';

const sidebarItems = [
  { to: '/', label: 'Home Website', icon: HiOutlineSparkles },
  { to: '/admin', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/admin/users', label: 'Manage Users', icon: HiOutlineUsers },
  { to: '/admin/slots', label: 'Manage Slots', icon: HiOutlineRectangleStack },
  { to: '/admin/bookings', label: 'Manage Bookings', icon: HiOutlineCalendarDays },
  { to: '/admin/payments', label: 'Payments', icon: HiOutlineCreditCard },
  { to: '/admin/revenue', label: 'Revenue', icon: HiOutlineCurrencyDollar },
  { to: '/admin/reports', label: 'Reports', icon: HiOutlineDocumentText },
  { to: '/admin/analytics', label: 'Analytics', icon: HiOutlineChartBar },
  { to: '/admin/no-show', label: 'No-Show Report', icon: HiOutlineUserMinus },
  { to: '/admin/overstay', label: 'Overstay Report', icon: HiOutlineClock },
  { to: '/admin/waiting-list', label: 'Waiting List', icon: HiOutlineQueueList },
  { to: '/admin/pricing', label: 'Pricing', icon: HiOutlineTag },
  { to: '/admin/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: HiOutlineClipboardDocumentList },
  { to: '/admin/layout-designer', label: 'Layout Designer', icon: HiOutlineRectangleStack },
  { to: '/admin/ai-analytics', label: 'AI Analytics', icon: HiOutlineChartBar },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 relative overflow-hidden">
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
              <span className="text-base font-bold neon-text">ParkEase</span>
            </Link>
          )}
          {collapsed && (
            <Link to="/admin" className="mx-auto">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 relative overflow-hidden">
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
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            {collapsed ? <HiOutlineChevronDoubleRight className="w-4 h-4" /> : <HiOutlineChevronDoubleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <header className="glass-nav sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                <HiOutlineBars3 className="w-5 h-5" />
              </button>
              <div className="relative hidden sm:block">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="input-neon pl-9 pr-4 py-2 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
                  className="relative p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  <HiOutlineBell className="w-5 h-5" />
                  <span className="badge-neon absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center">
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
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-card py-2 shadow-2xl"
                    >
                      <div className="px-4 py-2 border-b border-white/5">
                        <p className="text-sm font-semibold neon-text">Notifications</p>
                      </div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="px-4 py-3 hover:bg-cyan-500/5 cursor-pointer transition-colors">
                          <p className="text-sm font-medium">Alert #{i}</p>
                          <p className="text-xs text-gray-400">A new user has registered.</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 pl-2 border-l border-white/10 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 uppercase">
                    {user?.name?.slice(0, 2) || 'AD'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium leading-tight">{user?.name || 'Admin'}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">{user?.email || 'admin@parksmart.com'}</p>
                  </div>
                  <HiOutlineChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] glass-card py-2 shadow-2xl"
                    >
                      <Link
                        to="/admin/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-cyan-500/5 transition-colors"
                      >
                        <HiOutlineCog6Tooth className="w-4 h-4" /> Settings
                      </Link>
                      <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-cyan-500/5 text-pink-400 transition-colors"
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

        <main className="p-4 lg:p-6 overflow-y-auto grid-bg relative">
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
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
