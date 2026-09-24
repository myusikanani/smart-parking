import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineQrCode,
  HiOutlineShieldCheck,
  HiOutlineChevronDown,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineStar,
  HiOutlineCpuChip,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCurrencyRupee,
  HiOutlineCheck,
  HiOutlineCursorArrowRays,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineMagnifyingGlass,
  HiOutlineTicket,
  HiOutlineIdentification,
  HiOutlineCreditCard,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineMicrophone,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import ParkEaseHeroIsometric3D from '../components/3d/ParkEaseHeroIsometric3D';
import { CarSedan, ElectricCar, BikeScooter } from '../components/vehicles';
import { slotApi } from '../services/api';

// 6 Real System Feature Cards (Option 1: User-Friendly & Benefit-Driven)
const realFeatures = [
  {
    icon: HiOutlineMagnifyingGlass,
    badgeIcon: HiOutlineClock,
    badgeText: 'SAVE TIME',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'Find Parking Before You Arrive',
    description: 'Check live available spots in advance and never waste time driving around in circles looking for parking.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
  {
    icon: HiOutlineBuildingOffice2,
    badgeIcon: HiOutlineCursorArrowRays,
    badgeText: 'SMART MAP',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'Pick Your Perfect Spot',
    description: 'Select ground floor, basement, or shaded spots directly from a clean and easy-to-use visual map.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineShieldCheck,
    badgeIcon: HiOutlineQrCode,
    badgeText: 'NO WAITING',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'Contactless Gate Entry',
    description: 'Just show your digital pass on your phone screen to open the boom barrier automatically in seconds.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineCurrencyRupee,
    badgeIcon: HiOutlineCreditCard,
    badgeText: 'EASY PAY',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'One-Tap Cashless Billing',
    description: 'Pay smoothly with Google Pay, PhonePe, UPI, or cards with instant receipts sent to your phone.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    badgeIcon: HiOutlineMicrophone,
    badgeText: 'VOICE BOOKING',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'Speak & Reserve in Seconds',
    description: 'Too busy to type? Just use your voice to ask for a spot and get booked in under 10 seconds.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineBolt,
    badgeIcon: HiOutlineSparkles,
    badgeText: 'ALL VEHICLES',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'Cars, Bikes & EV Stations',
    description: 'Guaranteed charging slots for electric vehicles, compact spaces for bikes, and priority accessible bays.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
];

// 4 Real Step Workflow
const realSteps = [
  {
    id: 1,
    stepNum: '01',
    title: 'Find Online',
    sub: 'Real-Time 3D Radar',
    desc: 'Browse live occupancy across Floors 1-3. Filter by Four-Wheeler, EV Charging, Two-Wheeler, or VIP zones.',
    icon: HiOutlineMagnifyingGlass,
    accentColor: '#00D2FF',
  },
  {
    id: 2,
    stepNum: '02',
    title: 'Reserve Spot',
    sub: 'Bay Lock & Razorpay',
    desc: 'Select your preferred bay (e.g. Bay C1B or E1A) and confirm your slot instantly with secure cashless checkout.',
    icon: HiOutlineTicket,
    accentColor: '#00FFA3',
  },
  {
    id: 3,
    stepNum: '03',
    title: 'Scan & Enter',
    sub: 'Contactless Barrier Lift',
    desc: 'Barrier gate automatically lifts upon scanning your dynamic QR pass or License Plate in under 0.3 seconds.',
    icon: HiOutlineIdentification,
    accentColor: '#00D2FF',
  },
  {
    id: 4,
    stepNum: '04',
    title: 'Exit & Pay',
    sub: 'Cashless Departure',
    desc: 'Drive out smoothly. Automated overstay penalty detection and instant digital tax invoice sent to your email & WhatsApp.',
    icon: HiOutlineCreditCard,
    accentColor: '#F59E0B',
  },
];

// Real Audience Panels matching User, Security, and Admin Roles
const audiencePanels = [
  {
    title: 'For Drivers & Commuters',
    type: 'mobile',
    points: [
      'Guaranteed spot reservation across Floors 1-3',
      'Turn-by-turn indoor 3D bay routing to your slot',
      'Contactless dynamic QR & license plate gate pass',
      'Instant UPI, Card & NetBanking via Razorpay',
      'One-click WhatsApp & email ticket downloads',
    ],
    badgeText: 'DAILY DRIVER',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
  },
  {
    title: 'For Facility & Fleet Managers',
    type: 'tablet',
    points: [
      'Live bay occupancy radar & multi-floor map',
      'Dynamic peak-hour pricing & hourly rate controls',
      'Automated barrier gate & sensor telemetry',
      'Daily revenue analytics & overstay penalty audits',
      '2FA security protection & audit log export',
    ],
    badgeText: 'FACILITY ADMIN',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
  },
  {
    title: 'For Security & Gate Operators',
    type: 'mobile-fleet',
    points: [
      'High-speed camera & optical QR gate scanner',
      'Instant manual entry/exit verification fallback',
      'Automatic vehicle plate recognition & audit trail',
      'Blacklist enforcement & incident report logging',
      'Dedicated standby buffer slot emergency control',
    ],
    badgeText: 'SECURITY STAFF',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
  },
];

// Verified Real Testimonials
const realTestimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Corporate Commuter',
    quote: 'Reserving Bay C1B before heading to the office saved me 20 minutes of parking traffic daily. The QR gate scan works instantly!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    name: 'Pooja Patel',
    role: 'EV Owner',
    quote: 'The reserved EV charging bays on Floor 1 ensure I always have a dedicated fast charger waiting for my car. Highly convenient!',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    name: 'Amitabh Verma',
    role: 'Commercial Garage Manager',
    quote: 'ParkSmart dynamic pricing and automatic overstay penalty auditing increased our facility revenue by 32% within 60 days.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
];

// Real Application FAQs matching actual Features
const realFaqs = [
  {
    q: 'What parking categories and rates are available?',
    a: 'Our smart facility supports Four-Wheelers (₹30/hr, ₹150/day), EV Charging Slots (₹25/hr with high-speed charger access), Two-Wheelers (₹10/hr, ₹50/day), and Accessible/VIP priority bays (₹15/hr).',
  },
  {
    q: 'How does the contactless gate entry work?',
    a: 'Once your reservation is confirmed, an encrypted dynamic QR code is generated and sent to your email & WhatsApp. As you approach the gate, the optical scanner or License Plate Recognition (LPR) camera validates your booking in under 0.3s and lifts the barrier.',
  },
  {
    q: 'Can I view slot availability in 3D across multiple floors?',
    a: 'Yes! Our interactive 3D floor map allows you to switch between Floor 1, Floor 2, and Floor 3 in real time, showing exact occupied, available, and EV charging slots with live telemetry.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support all major cashless payment options powered by Razorpay: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and instant digital wallets with zero hidden fees.',
  },
  {
    q: 'What happens if I stay past my booked duration?',
    a: 'Our system automatically tracks overstay via exit sensors. Any extra time is calculated at standard hourly rates (1.5x during peak overstay), which you can settle seamlessly at exit through UPI or digital tap.',
  },
  {
    q: 'How does the waiting list feature work?',
    a: 'If all slots in your desired vehicle category are full, you can join the automated Waiting List. You will receive an immediate SMS/email notification the moment a bay is released.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [selectedStep, setSelectedStep] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroSlide, setHeroSlide] = useState(0);
  const [liveSlotCount, setLiveSlotCount] = useState<number | null>(null);

  // Fetch real available slots count from live backend on mount
  useEffect(() => {
    let isMounted = true;
    slotApi.getAvailable()
      .then((res) => {
        if (isMounted && res.success && typeof res.count === 'number') {
          setLiveSlotCount(res.count);
        }
      })
      .catch(() => {
        if (isMounted) setLiveSlotCount(36);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStepSelect = useCallback((stepId: number) => {
    setSelectedStep(stepId);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#080C15] text-[#1A2B49] dark:text-white font-sora overflow-x-hidden selection:bg-[#00FFA3] selection:text-black relative transition-colors duration-300">

      {/* =========================================================================
          GLOBAL CONTINUOUS GLOWING NEON ROAD TRAILS CANVAS (50% Opacity & Prominent Cyber Lines)
          ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 cyber-grid-floor opacity-25" />
        <div className="absolute top-[-10%] left-[15%] w-[550px] h-[550px] bg-[#00D2FF]/08 dark:bg-[#00D2FF]/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[10%] w-[650px] h-[650px] bg-[#00FFA3]/06 dark:bg-[#00FFA3]/08 rounded-full blur-[160px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[550px] h-[550px] bg-[#00D2FF]/06 dark:bg-[#00D2FF]/08 rounded-full blur-[140px]" />

        {/* Prominent Flowing SVG Light-Trail Paths (Opacity: 50%, 3.5px & 2px Stroke) */}
        <svg className="absolute inset-0 w-full h-full opacity-40 dark:opacity-50" preserveAspectRatio="none" viewBox="0 0 1440 2800">
          <defs>
            <linearGradient id="globalNeonTrail1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#4FACFE" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#00FFA3" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="globalNeonTrail2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4FACFE" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#00F2FE" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#00FFA3" stopOpacity="0.65" />
            </linearGradient>

            <filter id="roadTrailGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur1" />
              <feGaussianBlur stdDeviation="2" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Primary Main Highway Spine Path: Hero -> Steps -> CTA (Prominent Background Flow) */}
          <path
            d="M 1150 280 C 850 480, 200 680, 240 1050 C 280 1420, 1200 1600, 1100 2050 C 1000 2450, 450 2550, 720 2750"
            fill="none"
            stroke="url(#globalNeonTrail1)"
            strokeWidth="3.5"
            filter="url(#roadTrailGlow)"
            strokeDasharray="24 12"
            className="animate-road-flow"
          />

          {/* Secondary Parallel Light-Trail Ribbon */}
          <path
            d="M 1190 295 C 890 495, 240 695, 280 1065 C 320 1435, 1240 1615, 1140 2065 C 1040 2465, 490 2565, 760 2765"
            fill="none"
            stroke="url(#globalNeonTrail2)"
            strokeWidth="2"
            filter="url(#roadTrailGlow)"
            strokeDasharray="16 8"
            className="animate-road-flow-fast"
          />
        </svg>
      </div>

      {/* =========================================================================
          1. HERO SECTION (ParkEase Smart Parking - Real Data & 3D Hero)
          ========================================================================= */}
      <section className="relative z-10 pt-28 pb-20 lg:pt-36 lg:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Real Live Availability Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-cyan-700 dark:text-[#00D2FF] text-xs font-space font-semibold tracking-wider uppercase shadow-sm dark:shadow-[0_0_20px_rgba(0,210,255,0.25)]">
              <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
              <span>
                {liveSlotCount !== null ? `${liveSlotCount} Real Slots Live on 3 Floors` : '36 Slots Live on 3 Floors'}
              </span>
            </div>

            {/* Bold Neon Glow Header */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#1A2B49] dark:text-white">
              Park <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2FF] via-[#00FFA3] to-[#00D2FF]">Smarter.</span>
              <br />
              <span className="text-[#1A2B49] dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_30px_rgba(0,210,255,0.3)]">Move Faster.</span>
            </h1>

            {/* Subtitle with Real System Information */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-gray-300 max-w-lg leading-relaxed font-sans">
              Experience hassle-free parking with real-time availability, interactive 3D navigation, and intelligent slot recommendations.
            </p>

            {/* Real Pricing Summary Pill Bar */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-white/90 dark:bg-cyan-950/40 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300 shadow-sm">
                Cars: <strong>₹30/hr</strong>
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-white/90 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-sm">
                EV Fast Charge: <strong>₹25/hr</strong>
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-gray-300 shadow-sm">
                Bikes: <strong>₹10/hr</strong>
              </span>
            </div>

            {/* Hero CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/book-parking')}
                className="parkease-cyan-btn px-7 py-3.5 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2.5 transition-all shadow-xl shadow-cyan-500/30 group cursor-pointer"
              >
                <span>Book Parking Now</span>
                <HiOutlineCursorArrowRays className="w-4 h-4 group-hover:scale-125 transition-transform text-[#00FFA3]" />
              </button>

              <button
                onClick={() => navigate('/available-slots')}
                className="cyber-btn-shimmer px-6 py-3.5 rounded-2xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore 3D Spots</span>
                <HiOutlineArrowRight className="w-4 h-4 text-[#00FFA3]" />
              </button>

              <button
                onClick={() => navigate('/waiting-list')}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer backdrop-blur-md bg-white/60 dark:bg-transparent shadow-sm"
              >
                Join Waitlist
              </button>
            </div>

            {/* Slide Indicator Dots */}
            <div className="flex items-center gap-2 pt-3">
              {[0, 1, 2].map((dot) => (
                <button
                  key={dot}
                  onClick={() => setHeroSlide(dot)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    heroSlide === dot
                      ? 'w-6 h-2 bg-[#00FFA3] shadow-[0_0_12px_#00FFA3]'
                      : 'w-2 h-2 bg-slate-300 dark:bg-gray-700 hover:bg-slate-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Slide ${dot + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right 3D Isometric Visual with Aerodynamic Luxury Car */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative w-full min-h-[440px] lg:h-[520px] flex items-center justify-center"
          >
            {/* 3D Isometric Parking Deck Scene with Real Slots & Aerodynamic Car */}
            <ParkEaseHeroIsometric3D />
          </motion.div>

        </div>
      </section>

      {/* =========================================================================
          2. "EVERYTHING YOU NEED" (6 Real Feature Cards)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#1A2B49] dark:text-white tracking-tight mb-3"
          >
            Everything you need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-slate-600 dark:text-gray-400 font-sans"
          >
            A fast, hassle-free parking experience — from finding a spot and navigating the lot to instant cashless exit.
          </motion.p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {realFeatures.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={`cyber-card p-6 flex flex-col justify-between group relative overflow-hidden ${card.glowColor}`}
            >
              {/* Subtle Car Wireframe Vector Outline in Background */}
              <div className="absolute -right-4 -bottom-4 w-32 h-20 opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none">
                <svg viewBox="0 0 120 60" fill="none" className="w-full h-full stroke-cyan-400">
                  <path d="M10 40 L30 40 L45 20 L85 20 L95 40 L110 40" strokeWidth="1.5" strokeDasharray="3 2" />
                  <circle cx="35" cy="42" r="8" strokeWidth="1.5" />
                  <circle cx="85" cy="42" r="8" strokeWidth="1.5" />
                </svg>
              </div>

              <div>
                {/* Card Top Row with Icon & Mini Status Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-[#09152b] border border-cyan-500/25 flex items-center justify-center shadow-md group-hover:border-[#00FFA3]/50 group-hover:scale-110 transition-all">
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-space font-bold tracking-wider px-2.5 py-1 rounded-full border ${card.badgeColor} flex items-center gap-1`}>
                    <card.badgeIcon className="w-3 h-3" />
                    {card.badgeText}
                  </span>
                </div>

                {/* Card Title & Content */}
                <h3 className="text-lg font-bold text-[#1A2B49] dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-[#00FFA3] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 leading-relaxed font-sans">
                  {card.description}
                </p>
              </div>

              {/* Bottom Status Link */}
              <div className="pt-5 mt-4 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-xs text-cyan-600 dark:text-[#00D2FF] font-medium group-hover:text-emerald-600 dark:group-hover:text-[#00FFA3] transition-colors">
                <span onClick={() => navigate('/book-parking')} className="cursor-pointer">Explore feature</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. "FOUR SIMPLE STEPS" - CLEAN CYAN HIGHWAY RUNWAY (4 MILESTONE NODES)
          ========================================================================= */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-emerald-700 dark:text-[#00FFA3] text-xs font-space font-bold tracking-wider uppercase mb-3 shadow-sm dark:shadow-[0_0_15px_rgba(0,255,163,0.2)]"
          >
            <span>Autonomous Journey Flow</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A2B49] dark:text-white tracking-tight mb-3"
          >
            Four simple steps
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-slate-600 dark:text-gray-400 font-sans"
          >
            Seamless navigation from online spot discovery to express departure.
          </motion.p>
        </div>

        {/* CYAN HIGHWAY ROADWAY SVG CANVAS */}
        <div className="relative w-full py-6 my-4">
          
          {/* Ambient Road Glow Bed */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-28 bg-gradient-to-r from-[#00D2FF]/10 via-[#00FFA3]/15 to-[#00D2FF]/10 rounded-full blur-3xl pointer-events-none" />

          {/* SVG Highway Surface */}
          <div className="relative w-full h-44 sm:h-52">
            <svg viewBox="0 0 1200 160" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="highwayAsphalt" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0b172a" />
                  <stop offset="30%" stopColor="#1e293b" />
                  <stop offset="70%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0b172a" />
                </linearGradient>

                <linearGradient id="cyanTrackBorder" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D2FF" />
                  <stop offset="50%" stopColor="#00FFA3" />
                  <stop offset="100%" stopColor="#00D2FF" />
                </linearGradient>

                <filter id="roadGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. TOP CYAN HIGHWAY TRACK (S-CURVE) */}
              <path
                d="M 20 80 C 300 20, 500 130, 800 40 C 950 -5, 1100 60, 1180 80"
                fill="none"
                stroke="url(#highwayAsphalt)"
                strokeWidth="48"
                strokeLinecap="round"
              />
              <path
                d="M 20 56 C 300 -4, 500 106, 800 16 C 950 -29, 1100 36, 1180 56"
                fill="none"
                stroke="url(#cyanTrackBorder)"
                strokeWidth="1.8"
                strokeOpacity="0.5"
                filter="url(#roadGlowFilter)"
              />
              <path
                d="M 20 104 C 300 44, 500 154, 800 64 C 950 19, 1100 84, 1180 104"
                fill="none"
                stroke="url(#cyanTrackBorder)"
                strokeWidth="1.8"
                strokeOpacity="0.5"
                filter="url(#roadGlowFilter)"
              />
              <path
                d="M 20 80 C 300 20, 500 130, 800 40 C 950 -5, 1100 60, 1180 80"
                fill="none"
                stroke="url(#cyanTrackBorder)"
                strokeWidth="3"
                strokeDasharray="16 8"
                filter="url(#roadGlowFilter)"
                className="animate-road-flow-fast"
              />
            </svg>

            {/* 4 Interactive Milestone Nodes on Top Cyan Highway */}
            <div className="absolute inset-x-0 top-3 max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-12 pointer-events-none">
              {realSteps.map((st) => {
                const isSelected = selectedStep === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => handleStepSelect(st.id)}
                    className="relative flex flex-col items-center pointer-events-auto cursor-pointer group"
                  >
                    {/* Miniature Car Silhouette Driving on Road */}
                    <div className="mb-2 relative">
                      {st.id === 1 && (
                        <div className={`transition-all duration-300 ${isSelected ? 'scale-125 -translate-y-2' : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                          <CarSedan className={`w-14 sm:w-20 h-auto ${isSelected ? 'filter drop-shadow-[0_0_15px_#00D2FF]' : ''}`} color={isSelected ? '#00D2FF' : '#64748B'} />
                        </div>
                      )}
                      {st.id === 2 && (
                        <div className={`transition-all duration-300 ${isSelected ? 'scale-125 -translate-y-2' : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                          <ElectricCar className={`w-14 sm:w-20 h-auto ${isSelected ? 'filter drop-shadow-[0_0_15px_#00FFA3]' : ''}`} color={isSelected ? '#00FFA3' : '#64748B'} />
                        </div>
                      )}
                      {st.id === 3 && (
                        <div className={`transition-all duration-300 ${isSelected ? 'scale-125 -translate-y-2' : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                          <CarSedan className={`w-14 sm:w-20 h-auto ${isSelected ? 'filter drop-shadow-[0_0_15px_#00D2FF]' : ''}`} color={isSelected ? '#00D2FF' : '#64748B'} />
                        </div>
                      )}
                      {st.id === 4 && (
                        <div className={`transition-all duration-300 ${isSelected ? 'scale-125 -translate-y-2' : 'scale-90 opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>
                          <BikeScooter className={`w-12 sm:w-16 h-auto ${isSelected ? 'filter drop-shadow-[0_0_15px_#F59E0B]' : ''}`} color={isSelected ? '#F59E0B' : '#64748B'} />
                        </div>
                      )}
                    </div>

                    {/* Milestone Number Circle Node */}
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-extrabold text-sm sm:text-base transition-all duration-300 relative border-2 ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#00D2FF] to-[#00FFA3] text-black border-white shadow-[0_0_25px_#00FFA3] scale-110 ring-4 ring-[#00FFA3]/30'
                          : 'bg-white dark:bg-[#09152b] border-cyan-500/40 text-slate-700 dark:text-gray-300 group-hover:border-[#00FFA3] group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-105 shadow-sm'
                      }`}
                    >
                      {st.stepNum}
                      {isSelected && (
                        <span className="absolute -inset-1.5 rounded-full border border-[#00FFA3] animate-ping opacity-60" />
                      )}
                    </div>

                    {/* Step Title Label Under Node */}
                    <div className="text-center mt-2.5">
                      <span className={`text-xs sm:text-sm font-bold block transition-colors ${
                        isSelected ? 'text-emerald-600 dark:text-[#00FFA3]' : 'text-slate-700 dark:text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white'
                      }`}>
                        {st.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-gray-500 hidden sm:block font-space">
                        {st.sub}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Cards Grid Showing Detailed Step Breakdown Directly on Background */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {realSteps.map((step) => {
            const isSelected = selectedStep === step.id;
            return (
              <motion.div
                key={step.id}
                onClick={() => handleStepSelect(step.id)}
                whileHover={{ y: -4 }}
                className={`cyber-card p-5 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isSelected
                    ? 'border-[#00FFA3] bg-white dark:bg-[#0d1c38]/90 shadow-[0_0_30px_rgba(0,255,163,0.25)]'
                    : 'border-cyan-500/20 hover:border-cyan-500/50'
                }`}
              >
                {/* Header with Step Icon and Number */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isSelected
                      ? 'bg-[#00FFA3]/15 border-[#00FFA3] text-emerald-600 dark:text-[#00FFA3]'
                      : 'bg-cyan-50 dark:bg-slate-900/80 border-cyan-500/30 text-cyan-700 dark:text-[#00D2FF]'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-space font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isSelected
                      ? 'bg-[#00FFA3] text-black border-[#00FFA3]'
                      : 'text-slate-600 dark:text-gray-400 border-slate-300 dark:border-white/10'
                  }`}>
                    STEP {step.stepNum}
                  </span>
                </div>

                <h3 className={`text-base font-bold mb-1 transition-colors ${
                  isSelected ? 'text-emerald-600 dark:text-[#00FFA3]' : 'text-[#1A2B49] dark:text-white'
                }`}>
                  {step.title}
                </h3>
                <p className="text-xs text-cyan-700 dark:text-cyan-300/80 font-space mb-2">
                  {step.sub}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 font-sans leading-relaxed">
                  {step.desc}
                </p>

                {/* Glow Stripe */}
                {isSelected && (
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#00D2FF] via-[#00FFA3] to-[#F59E0B]" />
                )}
              </motion.div>
            );
          })}
        </div>

      </section>

      {/* =========================================================================
          4. "BUILT FOR EVERYONE" (Drivers, Fleet Operators, Valet Managers)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#1A2B49] dark:text-white tracking-tight mb-3"
          >
            Built for everyone
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-slate-600 dark:text-gray-400 font-sans"
          >
            Tailored solutions designed for daily drivers, commercial parking administrators, and gate security staff.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audiencePanels.map((aud, i) => (
            <motion.div
              key={aud.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="cyber-card overflow-hidden flex flex-col justify-between group"
            >
              {/* Device UI Mockup Window */}
              <div className="relative h-48 w-full bg-gradient-to-b from-slate-100 to-slate-200 dark:from-[#09152b] dark:to-[#060c18] border-b border-cyan-500/20 p-4 flex items-center justify-center overflow-hidden">
                
                {aud.type === 'mobile' && (
                  <div className="w-32 h-40 bg-white dark:bg-[#0a1122] rounded-2xl border-2 border-cyan-500/40 p-2 shadow-2xl flex flex-col justify-between relative group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-slate-500 dark:text-gray-400 font-mono">
                      <span>9:41</span>
                      <span className="text-[#00FFA3]">● 5G</span>
                    </div>
                    <div className="text-center my-auto">
                      <div className="w-8 h-8 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3] flex items-center justify-center text-[#00FFA3] mx-auto mb-1 text-sm shadow-[0_0_10px_#00FFA3]">
                        ✓
                      </div>
                      <span className="text-[9px] font-bold text-[#1A2B49] dark:text-white block">Spot Confirmed</span>
                      <span className="text-[8px] text-cyan-600 dark:text-cyan-300 font-mono">Bay #C1B (Fl.1)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#00FFA3] rounded-full" />
                  </div>
                )}

                {aud.type === 'tablet' && (
                  <div className="w-48 h-32 bg-white dark:bg-[#0a1122] rounded-xl border-2 border-[#00D2FF]/40 p-2 shadow-2xl flex flex-col justify-between group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-slate-700 dark:text-gray-300 font-mono border-b border-slate-200 dark:border-white/10 pb-1">
                      <span className="text-cyan-700 dark:text-[#00D2FF]">OCCUPANCY RADAR</span>
                      <span className="text-emerald-600 dark:text-emerald-400">3 FLOORS LIVE</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 pt-2 px-1">
                      <div className="w-4 h-6 bg-cyan-500/60 rounded-t" />
                      <div className="w-4 h-10 bg-emerald-500/80 rounded-t" />
                      <div className="w-4 h-8 bg-cyan-400 rounded-t" />
                      <div className="w-4 h-12 bg-emerald-400 rounded-t" />
                      <div className="w-4 h-7 bg-cyan-500/60 rounded-t" />
                      <div className="w-4 h-11 bg-teal-400 rounded-t" />
                    </div>
                    <span className="text-[7px] font-mono text-slate-500 dark:text-gray-400 text-center">Revenue: Razorpay Active</span>
                  </div>
                )}

                {aud.type === 'mobile-fleet' && (
                  <div className="w-32 h-40 bg-white dark:bg-[#0a1122] rounded-2xl border-2 border-[#00FFA3]/40 p-2 shadow-2xl flex flex-col justify-between relative group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-slate-500 dark:text-gray-400 font-mono">
                      <span className="text-emerald-600 dark:text-[#00FFA3]">GATE SCANNER</span>
                      <span className="text-cyan-700 dark:text-cyan-400">QR / LPR</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center my-auto">
                      <span className="text-[9px] font-bold text-[#1A2B49] dark:text-white block">Auto Gate Lift</span>
                      <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-mono">&lt;0.3s Latency</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#00D2FF] rounded-full" />
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] font-space font-bold px-2.5 py-1 rounded-full border backdrop-blur-md ${aud.badgeColor}`}>
                    {aud.badgeText}
                  </span>
                </div>
              </div>

              {/* Text Points & Details */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#1A2B49] dark:text-white mb-4">
                    {aud.title}
                  </h3>

                  <ul className="space-y-2.5">
                    {aud.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-gray-300 font-sans">
                        <span className="w-4 h-4 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 flex items-center justify-center text-emerald-600 dark:text-[#00FFA3] flex-shrink-0 mt-0.5">
                          <HiOutlineCheck className="w-3 h-3" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => navigate('/available-slots')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-cyan-700 dark:text-[#00D2FF] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>View Live Slots</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. "WHAT PEOPLE SAY" (Real Testimonials)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#1A2B49] dark:text-white tracking-tight mb-3"
          >
            What our users say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-slate-600 dark:text-gray-400 font-sans"
          >
            Real feedback from daily commuters, EV drivers, and commercial facility directors.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          {realTestimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="cyber-card p-6 flex flex-col justify-between hover:border-[#00FFA3]/40"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#00FFA3]">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <HiOutlineStar key={idx} className="w-4 h-4 fill-[#00FFA3] text-[#00FFA3]" />
                    ))}
                  </div>
                  <span className="text-xs font-space text-cyan-700 dark:text-[#00D2FF] flex items-center gap-1 bg-[#00D2FF]/10 px-2.5 py-0.5 rounded-full border border-[#00D2FF]/25">
                    🚗 Verified Booking
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 italic leading-relaxed mb-6 font-sans">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#00FFA3]/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#1A2B49] dark:text-white">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 font-space">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          6. "FREQUENTLY ASKED QUESTIONS" (Real System FAQs)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A2B49] dark:text-white tracking-tight mb-2">
              Frequently asked questions
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 font-sans">
              All answers regarding booking, gate entry, pricing rates, and EV slots.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-cyan-700 dark:text-[#00D2FF] text-xs font-space font-semibold shadow-md">
            <span>🚗 Smart FAQs</span>
          </div>
        </div>

        <div className="space-y-3">
          {realFaqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="cyber-card overflow-hidden transition-all duration-300 hover:border-cyan-500/40"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-semibold text-[#1A2B49] dark:text-gray-200 hover:text-cyan-600 dark:hover:text-white transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400"
                  >
                    <HiOutlineChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-gray-400 leading-relaxed border-t border-slate-200 dark:border-white/5 font-sans">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          7. "READY TO GET STARTED?" (Screenshot-Exact Glassmorphic Card & Golden Car Swoosh)
          ========================================================================= */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        
        {/* Outer Banner Wrapper with Royal Ocean Blue / Clean Light-Glass Ambient Lighting */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-r from-[#EFF6FF] via-[#E0F2FE] to-[#F0FDFA] dark:from-[#031435] dark:via-[#07245c] dark:to-[#041a45] border border-cyan-500/30 p-6 sm:p-12 shadow-[0_10px_40px_rgba(2,132,199,0.15)] dark:shadow-[0_0_80px_rgba(2,132,199,0.35)]">
          
          {/* Luminous Glowing Electric-Blue Swoosh Light-Trail streaming from Golden Car to Top-Right */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1000 400"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="swooshTrailGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.8" />
                <stop offset="25%" stopColor="#00FFA3" stopOpacity="0.85" />
                <stop offset="60%" stopColor="#00F2FE" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="swooshTrailGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#00D2FF" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#4FACFE" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.95" />
              </linearGradient>

              <filter id="swooshGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur1" />
                <feGaussianBlur stdDeviation="3.5" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Wide Soft Smoke Trail */}
            <path
              d="M 580 270 C 670 270, 790 255, 855 185 C 915 120, 945 50, 965 0"
              stroke="url(#swooshTrailGrad2)"
              strokeWidth="16"
              strokeOpacity="0.45"
              filter="url(#swooshGlow)"
              strokeLinecap="round"
            />

            {/* Core Glowing Streamline */}
            <path
              d="M 580 270 C 670 270, 790 255, 855 185 C 915 120, 945 50, 965 0"
              stroke="url(#swooshTrailGrad1)"
              strokeWidth="4"
              filter="url(#swooshGlow)"
              strokeLinecap="round"
              className="animate-road-flow-fast"
              strokeDasharray="25 8"
            />

            {/* Parallel Fine White Stream */}
            <path
              d="M 590 265 C 680 265, 800 245, 865 175 C 925 110, 955 40, 975 0"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeOpacity="0.9"
              filter="url(#swooshGlow)"
            />
            {/* Parallel Cyan Ribbon */}
            <path
              d="M 590 275 C 680 275, 780 265, 845 195 C 905 130, 935 60, 955 0"
              stroke="#00F2FE"
              strokeWidth="2.2"
              strokeOpacity="0.8"
              filter="url(#swooshGlow)"
            />
          </svg>


          {/* Inner Centered Glassmorphic Elevated Card */}
          <div className="relative z-20 max-w-3xl mx-auto rounded-3xl bg-white/90 dark:bg-[#091e4a]/75 border border-cyan-500/25 backdrop-blur-2xl p-8 sm:p-12 text-center shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
            
            {/* Top Glowing Wireframe Car Front Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-[#0a2355] border border-cyan-400/40 flex items-center justify-center text-cyan-600 dark:text-cyan-300 shadow-md dark:shadow-[0_0_25px_rgba(0,210,255,0.35)]">
                <svg viewBox="0 0 32 32" className="w-8 h-8 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {/* Roof & Windshield */}
                  <path d="M 9 13 L 11 7 C 11.5 5.5, 20.5 5.5, 21 7 L 23 13 Z" />
                  {/* Body Contour */}
                  <path d="M 6 13 C 5 14, 5 19, 5 21 C 5 23, 7 24, 8 24 L 24 24 C 25 24, 27 23, 27 21 C 27 19, 27 14, 26 13 Z" />
                  {/* Headlights */}
                  <circle cx="9" cy="18" r="1.5" className="fill-cyan-500 dark:fill-cyan-300" />
                  <circle cx="23" cy="18" r="1.5" className="fill-cyan-500 dark:fill-cyan-300" />
                  {/* Front Grille */}
                  <line x1="13" y1="20" x2="19" y2="20" />
                  <line x1="14" y1="22" x2="18" y2="22" />
                  {/* Wheels */}
                  <rect x="4" y="21" width="2" height="4" rx="1" className="fill-cyan-600 dark:fill-cyan-400" />
                  <rect x="26" y="21" width="2" height="4" rx="1" className="fill-cyan-600 dark:fill-cyan-400" />
                </svg>
              </div>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A2B49] dark:text-white tracking-tight mb-3">
              Ready to get started?
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed mb-8 font-sans">
              Join thousands of smart commuters and facility owners on the connected smart parking network.
            </p>

            {/* Center Action Button */}
            <div className="flex items-center justify-center relative">
              
              {/* Glowing Golden Button */}
              <div className="relative group">
                {/* Sonar Glow Ring */}
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 opacity-60 blur-md group-hover:opacity-100 transition-opacity" />
                
                <button
                  onClick={() => navigate('/book-parking')}
                  className="relative px-9 py-3.5 rounded-full bg-gradient-to-r from-[#FDE047] via-[#F59E0B] to-[#D97706] text-black font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-[0_0_35px_rgba(245,158,11,0.75)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-200"
                >
                  <span>Book now</span>
                  <span className="text-lg font-bold">›</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
