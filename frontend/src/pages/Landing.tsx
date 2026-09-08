import { useState, useRef, useCallback } from 'react';
import { motion, useInView, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import {
  HiOutlineQrCode,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineCalendarDays,
  HiOutlineChartBarSquare,
  HiOutlinePhoneArrowUpRight,
  HiOutlineUser,
  HiOutlineBuildingOffice2,
  HiOutlineShieldExclamation,
  HiOutlineStar,
  HiOutlineChevronDown,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineFaceSmile,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { CarSedan, BikeScooter, ElectricCar } from '../components/vehicles';
import LandingHero3D from '../components/3d/LandingHero3D';
import ThreeDParkingVisualizer from '../components/ThreeDParkingVisualizer';
import LiveAvailabilityBar from '../components/LiveAvailabilityBar';

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v)}${suffix}`);
  if (inView) motionValue.set(end);
  return (
    <motion.span ref={ref} className="tabular-nums">
      {display}
    </motion.span>
  );
}

const features = [
  { icon: HiOutlineQrCode, title: 'QR Code Access', description: 'Generate and scan unique QR codes for seamless parking entry and exit without physical tickets.' },
  { icon: HiOutlineClock, title: 'Real-Time Availability', description: 'Live parking slot availability with instant updates so you never waste time searching.' },
  { icon: HiOutlineDocumentText, title: 'Paperless System', description: 'Fully digital experience eliminating paper tickets, receipts, and manual paperwork.' },
  { icon: HiOutlineShieldCheck, title: 'Secure Entry/Exit', description: 'Advanced authentication and license plate recognition for maximum security.' },
  { icon: HiOutlineCalendarDays, title: 'Booking History', description: 'Complete history of your parking sessions with detailed receipts and analytics.' },
  { icon: HiOutlineChartBarSquare, title: 'Admin Dashboard', description: 'Comprehensive dashboard with analytics, user management, and system controls.' },
];

const steps = [
  { icon: HiOutlineCalendarDays, title: 'Book Online', description: 'Reserve your parking spot in advance through the web or mobile app.' },
  { icon: HiOutlineQrCode, title: 'Get QR Code', description: 'Receive a unique QR code via email or app for contactless entry.' },
  { icon: HiOutlinePhoneArrowUpRight, title: 'Scan & Enter', description: 'Scan your QR at the gate and the barrier opens automatically.' },
  { icon: HiOutlineShieldCheck, title: 'Scan & Exit', description: 'Scan again at exit, payment is processed, and you are on your way.' },
];

const stats = [
  { icon: HiOutlineMapPin, end: 500, suffix: '+', label: 'Parking Slots', color: 'text-cyan-400' },
  { icon: HiOutlineUsers, end: 10000, suffix: '+', label: 'Happy Users', color: 'text-pink-400' },
  { icon: HiOutlineFaceSmile, end: 98, suffix: '%', label: 'Satisfaction', color: 'text-green-400' },
  { icon: HiOutlineGlobeAlt, end: 50, suffix: '+', label: 'Locations', color: 'text-cyan-400' },
];

const benefits = [
  {
    icon: HiOutlineUser,
    title: 'For Users',
    points: ['Easy online booking', 'Contactless entry/exit', 'Real-time slot availability', 'Digital payment & receipts', 'Booking history access'],
    color: 'text-cyan-400',
  },
  {
    icon: HiOutlineBuildingOffice2,
    title: 'For Owners',
    points: ['Automated operations', 'Revenue analytics', 'Reduced staffing costs', 'Dynamic pricing tools', 'Maintenance alerts'],
    color: 'text-pink-400',
  },
  {
    icon: HiOutlineShieldExclamation,
    title: 'For Security',
    points: ['License plate recognition', 'Real-time monitoring', 'Audit trail & logs', 'Access control system', 'Incident reporting'],
    color: 'text-green-400',
  },
];

const testimonials = [
  { quote: 'This system transformed how we manage parking. The QR code access is seamless and our users love the convenience.', name: 'Sarah Chen', role: 'Facility Manager, TechPark' },
  { quote: 'Real-time availability has eliminated the frustration of circling for spots. A game-changer for our daily commute.', name: 'Mark Rivera', role: 'Regular Commuter' },
  { quote: 'The admin dashboard gives us incredible insight into usage patterns. We optimized pricing based on real data.', name: 'Priya Patel', role: 'Operations Director, CityPark' },
];

const faqs = [
  { q: 'How do I book a parking spot?', a: 'Simply create an account, select your desired location and time slot, and complete the payment. Your QR code will be sent via email and available in your dashboard.' },
  { q: 'Can I cancel or modify my booking?', a: 'Yes, you can cancel or modify bookings up to 1 hour before the scheduled start time through your account dashboard. Refunds follow our cancellation policy.' },
  { q: 'How does the QR code scanning work?', a: 'At entry and exit gates, hold your QR code up to the scanner. The system instantly validates your booking and opens the barrier automatically.' },
  { q: 'Is my payment information secure?', a: 'Absolutely. We use industry-standard encryption and PCI-compliant payment processing. Your payment details are never stored on our servers.' },
  { q: 'What if I lose my QR code?', a: 'You can regenerate your QR code anytime from your account dashboard or contact support for assistance. We recommend saving it to your digital wallet.' },
  { q: 'Do you offer monthly subscriptions?', a: 'Yes, we offer flexible monthly and annual subscription plans for frequent users. Check our pricing page for details and discounts.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [carAnimKey, setCarAnimKey] = useState(0);
  const [carStartX, setCarStartX] = useState('0%');
  const [carEndX, setCarEndX] = useState('0%');
  const [celebrating, setCelebrating] = useState(false);

  const handleStepClick = useCallback((index: number) => {
    setExpandedStep(index);
    setCelebrating(false);
    if (index === 0) {
      setCarStartX('0%');
      setCarEndX('25%');
      setCarAnimKey((k) => k + 1);
      setActiveStep(1);
    } else if (index === 1) {
      setCarStartX('25%');
      setCarEndX('50%');
      setCarAnimKey((k) => k + 1);
      setActiveStep(2);
    } else if (index === 2) {
      setCarStartX('50%');
      setCarEndX('75%');
      setCarAnimKey((k) => k + 1);
      setActiveStep(3);
    } else {
      setCarStartX('75%');
      setCarEndX('100%');
      setCarAnimKey((k) => k + 1);
      setActiveStep(4);
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1500);
    }
  }, []);

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            className="absolute top-20 left-[10%] w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-32 right-[15%] w-96 h-96 bg-pink-500/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
            className="absolute top-[40%] left-[55%] w-48 h-48 bg-green-500/10 rounded-3xl blur-[80px]"
          />
        </div>

        {/* Structured Bottom Road Strip Animation */}
        <div className="absolute bottom-4 left-0 right-0 pointer-events-none opacity-20 border-b border-dashed border-cyan-500/30 pb-2">
          <motion.div
            initial={{ x: '-20%' }}
            animate={{ x: '110vw' }}
            transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
            className="flex items-center gap-12"
          >
            <CarSedan className="w-28 h-auto" color="#06b6d4" />
            <ElectricCar className="w-24 h-auto" color="#10b981" />
            <BikeScooter className="w-20 h-auto" color="#ec4899" />
          </motion.div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}>
            <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } } }}>
              <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest text-cyan-400 glass rounded-full border border-cyan-500/30">
                Next-Gen Parking Solution
              </span>
            </motion.div>
            <motion.h1 variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } } }} className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
              Park<span className="neon-text">Ease</span><br />Smart Parking
            </motion.h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } } }} className="text-lg sm:text-xl max-w-lg mb-8 leading-relaxed text-gray-400">
              Real-time parking solutions for modern cities. Save time, fuel and the environment.
            </motion.p>
            <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } } }} className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/book-parking')}
                className="px-8 py-4 font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 shadow-xl shadow-indigo-600/30 flex items-center gap-2"
              >
                Book Parking
              </button>
              <button
                onClick={() => navigate('/available-slots')}
                className="px-8 py-4 font-bold rounded-2xl border border-white/20 hover:border-cyan-400 text-white transition-all duration-300 glass flex items-center gap-2"
              >
                Explore ▶
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <LandingHero3D />
            <div className="absolute top-6 right-6 z-20 space-y-3 pointer-events-none">
              <div className="bg-slate-950/90 border border-emerald-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-xl font-mono text-center w-40">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Available Spaces</span>
                <span className="text-2xl font-extrabold text-emerald-400">128 ⬆</span>
              </div>
              <div className="bg-slate-950/90 border border-cyan-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-xl font-mono text-center w-40">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Today's Bookings</span>
                <span className="text-2xl font-extrabold text-cyan-400">320 ⬆</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} className="w-5 h-8 rounded-full border-2 border-cyan-500/50 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-cyan-400" />
          </motion.div>
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 neon-text-cyan">Everything you need</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              A comprehensive parking management platform built for the modern world.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="glass-card p-6 h-full group hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-shadow duration-300">
                    <f.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-cyan-400">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ backgroundColor: 'var(--section-alt)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 neon-text-pink">Four simple steps</h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Click each step to watch the car drive. The description opens below.
              </p>
            </div>

            <div className="relative">
              <div className="hidden lg:block absolute top-8 left-[5%] right-[5%] h-1.5 rounded-full" style={{ backgroundColor: 'var(--glass-bg)' }}>
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-pink-500 to-green-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  animate={{
                    width: activeStep === 0 ? '0%' : activeStep === 1 ? '25%' : activeStep === 2 ? '50%' : activeStep === 3 ? '75%' : '100%'
                  }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                />
                <motion.div
                  key={carAnimKey}
                  initial={{ left: carStartX }}
                  animate={{ left: carEndX }}
                  transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                >
                  <CarSedan className="w-12 h-auto vehicle-glow-cyan" color="#06b6d4" />
                </motion.div>
                {celebrating && (
                  <>
                    {[...Array(14)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, scale: 0 }}
                        animate={{
                          opacity: [1, 1, 0],
                          scale: [0, 1.2, 0.5],
                          x: (Math.random() - 0.5) * 200,
                          y: (Math.random() - 0.5) * 80
                        }}
                        transition={{ duration: 1, delay: i * 0.04, ease: 'easeOut' }}
                        className="absolute -top-2 text-sm"
                        style={{ left: carEndX, color: ['#06b6d4', '#ec4899', '#10b981', '#f59e0b'][i % 4] }}
                      >
                        {['✦', '◆', '●', '★'][i % 4]}
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              <div className="grid lg:grid-cols-4 gap-8 lg:gap-6">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className="relative flex flex-col items-center text-center"
                  >
                    <button
                      onClick={() => handleStepClick(i)}
                      className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-pink-500 to-green-500 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-6 hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer"
                    >
                      <motion.span
                         className="font-bold text-lg text-white"
                        animate={activeStep === i + 1 ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {i + 1}
                      </motion.span>
                    </button>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                      <s.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>{s.title}</h3>

                    <AnimatePresence>
                      {expandedStep === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{s.description}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="glass-card-glow p-4 sm:p-8 text-center hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <div className={`text-2xl sm:text-4xl lg:text-5xl font-bold mb-1 ${s.color}`}>
                    <CountUp end={s.end} suffix={s.suffix} />
                  </div>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--section-alt)' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 neon-text-green">Built for everyone</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Tailored experiences for every stakeholder in the ecosystem.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="glass-card p-8 h-full hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                    <b.icon className={`w-7 h-7 ${b.color}`} />
                  </div>
                   <h3 className="text-xl font-semibold mb-5" style={{ color: 'var(--text)' }}>{b.title}</h3>
                  <ul className="space-y-3">
                    {b.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 text-sm text-gray-400">
                        <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 neon-text-cyan">What people say</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Trusted by thousands of users and businesses worldwide.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="glass-card border-l-4 border-l-cyan-500 p-8 h-full flex flex-col">
                  <div className="mb-6">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <HiOutlineStar key={j} className="w-4 h-4 inline-block text-cyan-400 fill-cyan-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed flex-1 italic mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                       <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--section-alt)' }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 neon-text-pink">Frequently asked questions</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Got questions? We have answers.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className={`glass transition-all duration-300 ${openFaq === i ? 'shadow-[0_0_20px_rgba(6,182,212,0.15)]' : ''}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left p-5"
                  >
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm sm:text-base pr-4" style={{ color: 'var(--text)' }}>{faq.q}</span>
                      <motion.div
                        animate={{ rotate: openFaq === i ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <HiOutlineChevronDown className="w-5 h-5 text-cyan-400" />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <p className="mt-4 text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-card-glow p-12 sm:p-16 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                initial={{ x: '120%' }}
                whileInView={{ x: '-120%' }}
                viewport={{ once: true }}
                transition={{ duration: 6, ease: 'linear' }}
                className="absolute top-1/3 opacity-20"
              >
                <CarSedan className="w-48 h-auto" color="#06b6d4" />
              </motion.div>
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight neon-text mb-4">Ready to get started?</h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
                Join thousands of satisfied users and transform your parking experience today.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="btn-neon px-8 py-4 font-semibold rounded-xl flex items-center gap-2 mx-auto transition-all duration-300"
              >
                Register Now <HiOutlineArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
};

export default Landing;
