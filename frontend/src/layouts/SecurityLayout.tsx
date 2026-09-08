import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineQrCode,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowRightCircle,
  HiOutlineArrowLeftCircle,
  HiOutlineClipboardDocumentList,
  HiOutlinePencilSquare,
  HiOutlineBell,
  HiOutlineBars3,
  HiOutlineXMark, 
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { CarSedan } from '../components/vehicles';
import ThemeToggle from '../components/ThemeToggle';

const sidebarItems = [
  { to: '/', label: 'Home Website', icon: HiOutlineSparkles },
  { to: '/security', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/security/qr-scanner', label: 'QR Scanner', icon: HiOutlineQrCode },
  { to: '/security/vehicle-entry', label: 'Vehicle Entry', icon: HiOutlineArrowRightCircle },
  { to: '/security/vehicle-exit', label: 'Vehicle Exit', icon: HiOutlineArrowLeftCircle },
  { to: '/security/logs', label: "Today's Logs", icon: HiOutlineClipboardDocumentList },
  { to: '/security/manual-plate', label: 'Manual Plate', icon: HiOutlinePencilSquare },
];

const SecurityLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
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
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`glass-sidebar fixed top-0 left-0 z-50 h-full w-56 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 relative overflow-hidden">
              <span className="text-white font-bold text-xs">P</span>
              <motion.div
                initial={{ x: -6 }}
                animate={{ x: 6 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatType: 'reverse' }}
                className="absolute bottom-0 opacity-30"
              >
                <CarSedan className="w-2.5 h-auto" color="#ffffff" />
              </motion.div>
            </div>
            <span className="text-base font-bold neon-text">ParkEase</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:ml-56">
        <header className="glass-nav sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                <HiOutlineBars3 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  <HiOutlineBell className="w-5 h-5" />
                  <span className="badge-neon absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center">
                    2
                  </span>
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] glass-card py-2 shadow-2xl"
                    >
                      <div className="px-4 py-2 border-b border-white/5">
                        <p className="text-sm font-semibold neon-text">Notifications</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-cyan-500/5 cursor-pointer transition-colors">
                        <p className="text-sm font-medium">Vehicle Entered</p>
                        <p className="text-xs text-gray-400">KA-01-AB-1234 entered at Gate 2</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-cyan-500/5 cursor-pointer transition-colors">
                        <p className="text-sm font-medium">Vehicle Exited</p>
                        <p className="text-xs text-gray-400">KA-01-XY-5678 exited at Gate 1</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="p-2 rounded-lg text-gray-400 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                title="Logout"
              >
                <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shadow-lg shadow-cyan-500/25 uppercase">
                  {user?.name?.slice(0, 2) || 'SG'}
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.name || 'Security'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 grid-bg relative">
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
              initial={{ x: '-110%' }}
              animate={{ x: '110%' }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              className="absolute top-[20%] opacity-[0.02]"
            >
              <CarSedan className="w-48 h-auto" color="#ec4899" />
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

export default SecurityLayout;
