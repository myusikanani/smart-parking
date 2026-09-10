import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/api';
import {
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlineRectangleStack,
  HiOutlineListBullet,
  HiOutlineBanknotes,
  HiOutlineQrCode,
  HiOutlineQueueList,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,  
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { CarSedan } from '../components/vehicles';

interface NavNotif {
  id: string;
  title: string;
  message: string;
  targetUrl: string;
  badgeColor: string;
  bookingData?: Record<string, unknown>;
  icon: typeof HiOutlineBell;
}

const parkingNavItems = [
  { to: '/dashboard/book-parking', label: 'Book Parking', icon: HiOutlineCalendarDays, highlight: true },
  { to: '/available-parking', label: 'Available Slots', icon: HiOutlineRectangleStack },
  { to: '/dashboard/smart-search', label: 'Smart Search', icon: HiOutlineMagnifyingGlass },
];

const accountNavItems = [
  { to: '/booking-history', label: 'My Bookings', icon: HiOutlineListBullet },
  { to: '/dashboard/subscriptions', label: 'Monthly Passes', icon: HiOutlineCreditCard },
  { to: '/dashboard/payments', label: 'Payment', icon: HiOutlineBanknotes },
  { to: '/profile', label: 'My Profile & Garage', icon: HiOutlineUser },
];

const moreNavItems = [
  { to: '/dashboard/navigation', label: '3D/AR Navigation', icon: HiOutlineMapPin },
  { to: '/dashboard/live-map', label: 'Live 3D Map', icon: HiOutlineRectangleStack },
  { to: '/qr-code', label: 'Digital QR Pass', icon: HiOutlineQrCode },
  { to: '/waiting-list', label: 'Waiting List', icon: HiOutlineQueueList },
  { to: '/notifications', label: 'Notifications', icon: HiOutlineBell },
  { to: '/dashboard', label: 'Dashboard Home', icon: HiOutlineHome },
  { to: '/', label: 'Home Website', icon: HiOutlineSparkles },
];

const UserLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navNotifs, setNavNotifs] = useState<NavNotif[]>([]);

  // Automatically expand More if user is on a route belonging to More
  const isMoreRouteActive = moreNavItems.some((item) => location.pathname === item.to);
  const [moreOpen, setMoreOpen] = useState(isMoreRouteActive);

  useEffect(() => {
    if (isMoreRouteActive) {
      setMoreOpen(true);
    }
  }, [isMoreRouteActive]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchNavNotifs = useCallback(async () => {
    try {
      const res = await bookingApi.getMyBookings();
      if (res.success && Array.isArray(res.bookings)) {
        const list: NavNotif[] = [];
        res.bookings.forEach((b: Record<string, unknown>) => {
          const bId = String(b._id || b.id || '');
          const slotNum = (b.slot as Record<string, unknown>)?.number || b.slotNumber || 'Slot';
          const status = String(b.status || 'pending');
          const pStatus = String(b.paymentStatus || 'pending');

          if (pStatus === 'pending' || status === 'pending') {
            list.push({
              id: `nav-${bId}-pay`,
              title: 'Payment Pending',
              message: `Complete checkout for Slot #${slotNum}`,
              targetUrl: `/dashboard/payments?bookingId=${bId}`,
              badgeColor: 'text-amber-400',
              icon: HiOutlineCreditCard,
              bookingData: b,
            });
          } else if (status === 'confirmed') {
            list.push({
              id: `nav-${bId}-conf`,
              title: 'Booking Confirmed',
              message: `Digital pass ready for Slot #${slotNum}`,
              targetUrl: '/qr-code',
              badgeColor: 'text-cyan-400',
              icon: HiOutlineQrCode,
              bookingData: b,
            });
          } else if (status === 'active') {
            list.push({
              id: `nav-${bId}-act`,
              title: 'Vehicle Inside Parking',
              message: `Slot #${slotNum} session active`,
              targetUrl: '/qr-code',
              badgeColor: 'text-emerald-400',
              icon: HiOutlineCheckCircle,
              bookingData: b,
            });
          }
        });
        setNavNotifs(list);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNavNotifs();
  }, [fetchNavNotifs, location.pathname]);

  const handleNotifClick = (n: NavNotif) => {
    setNotifOpen(false);
    navigate(n.targetUrl, {
      state: {
        booking: n.bookingData,
        bookingId: n.bookingData?._id || n.bookingData?.id,
      },
    });
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/dashboard/smart-search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-gray-100 flex flex-col font-sans">
      {/* MOBILE BACKDROP */}
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

      {/* LEFT SIDEBAR NAVIGATION MENU */}
      <aside
        className={`glass-sidebar fixed top-0 left-0 z-50 h-full transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col justify-between`}
      >
        <div>
          {/* LOGO BAR */}
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
                <span className="text-lg font-bold neon-text truncate">ParkEase</span>
                <span className="badge-neon text-[10px] font-mono px-1.5 py-0.2">User</span>
              </Link>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors ml-auto"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? (
                <HiOutlineChevronDoubleRight className="w-4 h-4" />
              ) : (
                <HiOutlineChevronDoubleLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* GROUPED SIDEBAR NAVIGATION ITEMS */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] scrollbar-thin">
            {/* 1. PARKING SECTION */}
            <div className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-cyan-400/70 font-bold mb-1.5">
                  PARKING
                </p>
              )}
              {parkingNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/5'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* 2. ACCOUNT SECTION */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-mono uppercase tracking-wider text-gray-400/80 font-bold mb-1.5">
                  ACCOUNT
                </p>
              )}
              {accountNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/5'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* 3. MORE FEATURES (COLLAPSIBLE SECTION) */}
            <div className="space-y-1 pt-2 border-t border-white/5">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-pink-400/80 hover:text-pink-300 font-bold rounded-lg hover:bg-white/5 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <span>MORE FEATURES</span>
                    {isMoreRouteActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </span>
                  <HiOutlineChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : (
                <div className="h-px bg-white/10 my-1" />
              )}

              {(moreOpen || collapsed) && (
                <motion.div
                  initial={collapsed ? false : { opacity: 0, height: 0 }}
                  animate={collapsed ? false : { opacity: 1, height: 'auto' }}
                  className="space-y-1"
                >
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-pink-500/20 text-pink-300 font-semibold border-l-4 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                            : 'text-gray-400 hover:text-pink-300 hover:bg-pink-500/5'
                        }`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-pink-400' : ''}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </nav>
        </div>

        {/* LOGOUT BUTTON AT SIDEBAR BOTTOM */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-pink-400 hover:bg-pink-500/10 border border-pink-500/20 transition-all ${
              collapsed ? 'px-0' : ''
            }`}
            title={collapsed ? 'Logout' : undefined}
          >
            <HiOutlineArrowRightOnRectangle className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* TOP HEADER BAR */}
      <header
        className={`glass-nav fixed top-0 right-0 z-30 h-16 transition-all duration-300 flex items-center justify-between px-4 sm:px-6 ${
          collapsed ? 'lg:left-16' : 'lg:left-64'
        } left-0`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
          >
            {mobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>

          {/* QUICK SEARCH INPUT (HIDDEN ON BOOKING PAGE FOR MAXIMUM FOCUS) */}
          {!location.pathname.includes('/book-parking') && (
            <form onSubmit={handleSearch} className="hidden sm:flex items-center relative w-64 lg:w-80">
              <HiOutlineMagnifyingGlass className="absolute left-3 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="Search slot number or vehicle plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-neon w-full pl-9 pr-4 py-1.5 text-xs rounded-xl"
              />
            </form>
          )}
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* NOTIFICATION BELL */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
              className="relative p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              title="Notifications"
            >
              <HiOutlineBell className="w-5 h-5" />
              {navNotifs.length > 0 && (
                <span className="badge-neon absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {navNotifs.length > 9 ? '9+' : navNotifs.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] glass-card py-2 shadow-2xl z-50 divide-y divide-white/5"
                >
                  <div className="px-4 py-2 flex items-center justify-between">
                    <p className="text-sm font-semibold neon-text">Notifications</p>
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                    {navNotifs.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        No new notifications
                      </div>
                    ) : (
                      navNotifs.slice(0, 5).map((n) => {
                        const Icon = n.icon;
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className="px-4 py-3 hover:bg-cyan-500/10 cursor-pointer transition-colors flex items-start gap-3 text-left group"
                          >
                            <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400 mt-0.5 group-hover:bg-cyan-500/20 transition-colors">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${n.badgeColor} truncate`}>{n.title}</p>
                              <p className="text-[11px] text-gray-300 truncate mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* USER AVATAR DROPDOWN */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/25 uppercase">
                {user?.name?.slice(0, 2) || 'US'}
              </div>
              <span className="text-sm font-medium hidden md:block text-gray-200">{user?.name || 'User'}</span>
              <HiOutlineChevronDown className="w-4 h-4 text-gray-500" />
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
                    to="/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-cyan-500/5 text-gray-200 transition-colors"
                  >
                    <HiOutlineUser className="w-4 h-4 text-cyan-400" /> My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-cyan-500/5 text-pink-400 transition-colors"
                  >
                    <HiOutlineArrowRightOnRectangle className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CANVAS (PUSHED BY SIDEBAR WIDTH) */}
      <main
        className={`flex-1 pt-20 pb-12 transition-all duration-300 grid-bg relative overflow-hidden ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Footer />
      </div>
    </div>
  );
};

export default UserLayout;
