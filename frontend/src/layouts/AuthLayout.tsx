import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CarSedan, BikeScooter, ElectricCar } from '../components/vehicles';

interface AuthLayoutProps {
  children: ReactNode; 
}

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="min-h-screen flex font-inter bg-[var(--bg)]">
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 border-2 border-white/20 rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/15 rounded-full blur-xl" />
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-white/15 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/15 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/15 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/20 rounded-full" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ x: '120%' }}
          animate={{ x: '-120%' }}
          transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
          className="absolute top-[30%] opacity-30"
        >
          <CarSedan className="w-48 h-auto" color="#ffffff" />
        </motion.div>
        <motion.div
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ repeat: Infinity, duration: 10, ease: 'linear', delay: 3 }}
          className="absolute top-[55%] opacity-20"
        >
          <BikeScooter className="w-32 h-auto" color="#ffffff" />
        </motion.div>
        <motion.div
          initial={{ x: '120%' }}
          animate={{ x: '-120%' }}
          transition={{ repeat: Infinity, duration: 15, ease: 'linear', delay: 6 }}
          className="absolute top-[75%] opacity-20"
        >
          <ElectricCar className="w-40 h-auto" color="#ffffff" />
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-xl relative overflow-hidden">
            <span className="text-white font-bold text-xl">P</span>
            <motion.div
              initial={{ x: -10 }}
              animate={{ x: 10 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear', repeatType: 'reverse' }}
              className="absolute bottom-0 opacity-40"
            >
              <CarSedan className="w-4 h-auto" color="#ffffff" />
            </motion.div>
          </div>
          <span className="text-3xl font-bold text-white">ParkEase</span>
        </Link>
        <h2 className="text-2xl text-white/95 text-center max-w-md font-semibold">
          Smart Parking, Smarter City
        </h2>
        <p className="text-white/80 text-center mt-2 max-w-sm">
          Reserve your spot in advance, pay digitally, and never worry about parking again.
        </p>
        <div className="grid grid-cols-3 gap-6 mt-12">
          {['Reserve', 'Park', 'Pay'].map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white font-bold shadow-lg">
                0{i + 1}
              </div>
              <span className="text-white/80 text-sm mt-2">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-[var(--bg)]">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 lg:hidden mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-xl font-bold neon-text">ParkEase</span>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
