import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineBell,
  HiBars3,
  HiOutlineXMark, 
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import { CarSedan, BikeScooter, ElectricCar, ParkingCar } from '../components/vehicles';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const loggedIn = Boolean(user);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/available-slots', label: 'Available Slots' },
    { to: '/book-parking', label: 'Book Parking' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];
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
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-inter">
      <header className="glass-nav fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 relative overflow-hidden">
                <span className="text-white font-bold text-sm">P</span>
                <motion.div
                  initial={{ x: -20 }}
                  animate={{ x: 20 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatType: 'reverse' }}
                  className="absolute bottom-0 opacity-30"
                >
                  <CarSedan className="w-4 h-auto" color="#ffffff" />
                </motion.div>
              </div>
              <span className="text-xl font-bold neon-text">ParkEase</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === link.to
                      ? 'text-cyan-400 font-semibold shadow-[0_2px_0_0_theme(colors.cyan.500)]'
                      : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
                  className="relative p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  <HiOutlineBell className="w-5 h-5" />
                  <span className="badge-neon absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold rounded-full flex items-center justify-center">
                    3
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
                          <p className="text-sm font-medium">Booking #{i}</p>
                          <p className="text-xs text-gray-400">Your booking has been confirmed.</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {loggedIn ? (
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25">
                      {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'US'}
                    </div>
                    <HiOutlineChevronDown className="w-4 h-4 text-gray-500" />
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
                          to="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-cyan-500/5 transition-colors"
                        >
                          <HiOutlineUser className="w-4 h-4" /> Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-cyan-500/5 transition-colors"
                        >
                          <HiOutlineUser className="w-4 h-4" /> Profile
                        </Link>
                        <button
                          onClick={logout}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-cyan-500/5 text-pink-400 transition-colors"
                        >
                          <HiOutlineArrowRightOnRectangle className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-neon px-4 py-2 text-sm font-medium text-white rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
              >
                {mobileOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-white/5"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === link.to
                        ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
                        : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!loggedIn && (
                  <div className="flex gap-2 pt-2 border-t border-white/5">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center px-4 py-2 text-sm font-medium border border-white/10 rounded-xl hover:bg-cyan-500/10 text-cyan-400 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center btn-neon px-4 py-2 text-sm font-medium text-white rounded-xl"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-16 grid-bg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute bottom-[10%] left-0 right-0">
            <motion.div
              initial={{ x: '-15%' }}
              animate={{ x: '110vw' }}
              transition={{ repeat: Infinity, duration: 18, ease: 'linear', delay: 0 }}
            >
              <CarSedan className="w-44 h-auto opacity-[0.06]" color="#06b6d4" />
            </motion.div>
          </div>

          <div className="absolute bottom-[22%] left-0 right-0">
            <motion.div
              initial={{ x: '110vw' }}
              animate={{ x: '-15%' }}
              transition={{ repeat: Infinity, duration: 14, ease: 'linear', delay: 3 }}
            >
              <BikeScooter className="w-32 h-auto opacity-[0.05]" color="#ec4899" />
            </motion.div>
          </div>

          <div className="absolute bottom-[36%] left-0 right-0">
            <motion.div
              initial={{ x: '-15%' }}
              animate={{ x: '110vw' }}
              transition={{ repeat: Infinity, duration: 22, ease: 'linear', delay: 7 }}
            >
              <ElectricCar className="w-40 h-auto opacity-[0.05]" color="#10b981" />
            </motion.div>
          </div>

          <div className="absolute bottom-[52%] left-0 right-0">
            <motion.div
              initial={{ x: '110vw' }}
              animate={{ x: '-15%' }}
              transition={{ repeat: Infinity, duration: 26, ease: 'linear', delay: 1 }}
            >
              <CarSedan className="w-52 h-auto opacity-[0.03]" color="#ec4899" />
            </motion.div>
          </div>

          <div className="absolute bottom-[68%] left-0 right-0">
            <motion.div
              initial={{ x: '-15%' }}
              animate={{ x: '110vw' }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear', delay: 10 }}
            >
              <ParkingCar className="w-16 h-auto opacity-[0.04]" color="#06b6d4" direction="right" />
            </motion.div>
          </div>

          <div className="absolute bottom-[82%] left-0 right-0">
            <motion.div
              initial={{ x: '110vw' }}
              animate={{ x: '-15%' }}
              transition={{ repeat: Infinity, duration: 30, ease: 'linear', delay: 5 }}
            >
              <ElectricCar className="w-36 h-auto opacity-[0.03]" color="#10b981" />
            </motion.div>
          </div>
        </div>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
