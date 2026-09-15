import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineQrCode,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineCalendarDays,
  HiOutlineChevronDown,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineStar,
  HiOutlineCpuChip,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCurrencyDollar,
  HiOutlineGlobeAmericas,
  HiOutlineCheck,
  HiOutlineCursorArrowRays,
  HiOutlineSparkles,
  HiOutlineBolt,
  HiOutlineArrowDownTray,
  HiOutlineUserPlus,
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import ParkEaseHeroIsometric3D from '../components/3d/ParkEaseHeroIsometric3D';
import { CarSedan, ElectricCar, BikeScooter } from '../components/vehicles';

// 6 Feature Cards in 100% Clean English
const featureCards = [
  {
    icon: HiOutlineCpuChip,
    badgeIcon: HiOutlineBolt,
    badgeText: 'IoT SENSOR',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'IoT Device',
    description: 'High-frequency ultrasonic & optical bay sensors detect vehicle occupancy in 10ms, synchronizing with automated barrier gates.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    badgeIcon: HiOutlineSparkles,
    badgeText: '24/7 AI HELP',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: '24/7 Support',
    description: 'Continuous automated AI concierge and live operator fallback for automated lane clearances and instant roadside assistance.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineShieldCheck,
    badgeIcon: HiOutlineQrCode,
    badgeText: 'NO TICKETS',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'Ticketless Access',
    description: 'High-speed license plate recognition (LPR) & encrypted dynamic QR codes for 100% contactless gate entry and exit.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineMapPin,
    badgeIcon: HiOutlineCursorArrowRays,
    badgeText: 'LIVE GPS',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'Live Navigation',
    description: 'Turn-by-turn indoor 3D wayfinding directs your vehicle straight to your reserved bay without circling or guessing.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
  {
    icon: HiOutlineCurrencyDollar,
    badgeIcon: HiOutlineBolt,
    badgeText: 'FAIR RATES',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'Dynamic Rates',
    description: 'Transparent live pricing, off-peak discounts, and instant cashless digital wallet checkout with automated e-invoicing.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineGlobeAmericas,
    badgeIcon: HiOutlineShieldCheck,
    badgeText: 'NATIONWIDE',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'Nationwide Coverage',
    description: 'A unified smart parking grid connecting commercial towers, airports, shopping centers, and municipal garages.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
];

// 4 Simple Steps Timeline in 100% English
const roadmapSteps = [
  {
    id: 1,
    num: '1',
    title: 'Search Spot',
    sub: 'Online Booking & Time',
    tag: 'Step 01: Search Spot',
    shortDesc: 'Choose your destination & preferred parking bay.',
    details: 'Browse real-time bay availability on the 3D map, reserve your spot in advance, and receive an instant digital QR parking pass.',
    icon: HiOutlineArrowDownTray,
  },
  {
    id: 2,
    num: '2',
    title: 'Navigate',
    sub: 'GPS Indoor Routing',
    tag: 'Step 02: Navigation',
    shortDesc: 'Follow turn-by-turn indoor routing directly to the gate.',
    details: 'Autonomous GPS guidance navigates you directly to the entrance sensor node without circling or delays.',
    icon: HiOutlineUserPlus,
  },
  {
    id: 3,
    num: '3',
    title: 'Contactless Entry',
    sub: 'Automatic Barrier Gate',
    tag: 'Step 03: Contactless Entry',
    shortDesc: 'Drive through smoothly as the barrier automatically lifts.',
    details: 'IoT camera or QR scanner verifies your booking in <0.3s. The glowing laser trail lights up your assigned bay.',
    icon: HiOutlineCalendarDays,
  },
  {
    id: 4,
    num: '4',
    title: 'Express Exit',
    sub: 'Scan & Pay / Departure',
    tag: 'Step 04: Express Exit',
    shortDesc: 'Automatic cashless settlement and seamless departure.',
    details: 'Exit effortlessly with automatic wallet settlement or contactless tap with instant digital receipts.',
    icon: HiOutlineMapPin,
  },
];

// Built for Everyone Audience Cards (Drivers, Fleet Operators, Valet Managers)
const audienceCards = [
  {
    title: 'For Drivers',
    type: 'mobile',
    points: [
      'Guaranteed spot reservation before arrival',
      'Turn-by-turn indoor 3D bay guidance',
      'Contactless QR code & LPR gate entry',
      'Instant digital wallet payment & receipts',
      'Live booking history & pass re-downloads',
    ],
    badgeText: 'DAILY DRIVER',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
  },
  {
    title: 'For Fleet Operators',
    type: 'tablet',
    points: [
      'Real-time bay occupancy radar dashboard',
      'Automated barrier gate & sensor controls',
      'Dynamic demand-based pricing algorithms',
      'High-accuracy vehicle plate audit logs',
      'Automated daily revenue and overstay reports',
    ],
    badgeText: 'FLEET OPERATOR',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
  },
  {
    title: 'For Valet Managers',
    type: 'mobile-fleet',
    points: [
      'Multi-vehicle corporate accounts & passes',
      'Pre-paid discounted monthly subscriptions',
      'Reserved priority EV charging stations',
      'Express VIP gate lanes with zero delay',
      'Dedicated 24/7 enterprise concierge',
    ],
    badgeText: 'VALET & ENTERPRISE',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
  },
];

// Testimonials in English
const testimonials = [
  {
    name: 'David Vance',
    role: 'Commercial Fleet Owner',
    quote: 'ParkEase transformed our fleet operations. Drivers never waste time circling for spots, and all payments are unified automatically.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    role: 'Daily City Commuter',
    quote: 'The 3D turn-by-turn indoor routing is incredible. I reserve my spot in the morning and drive straight in without touching a ticket.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    name: 'Marcus Brody',
    role: 'Shopping Mall Facility Director',
    quote: 'Our garage revenue grew by 28% after deploying ParkEase dynamic pricing and automated sensor barriers. Highly recommended!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
];

// Frequently Asked Questions in English
const faqs = [
  {
    q: 'How can I reserve a parking spot in advance?',
    a: 'Simply click "Book Parking Now", select your desired garage location, choose your vehicle type, and pick a time slot. Once confirmed, you will instantly receive your encrypted digital QR parking pass.',
  },
  {
    q: 'What are the contactless entry options?',
    a: 'ParkEase supports both automatic License Plate Recognition (LPR) and high-speed QR code scanning at the gate. As you approach the barrier, the sensor validates your booking in under 0.3 seconds.',
  },
  {
    q: 'How does ParkEase dynamic pricing work?',
    a: 'Pricing is dynamically optimized based on real-time garage occupancy and off-peak hours. You always see the exact rate before booking, with zero hidden surcharges.',
  },
  {
    q: 'Why choose sensor-based over traditional parking?',
    a: 'Sensor-based parking eliminates 100% of paper tickets, reduces traffic congestion inside facilities by 60%, and guides you directly to an empty spot with turn-by-turn navigation.',
  },
  {
    q: 'What if I need to extend or cancel my session?',
    a: 'You can easily extend your session or cancel up to 30 minutes before your scheduled start time directly from the User Dashboard. Refunds are processed automatically.',
  },
  {
    q: 'Are EV charging slots guaranteed?',
    a: 'Yes! When you select an EV-enabled parking spot, the high-speed charging station is reserved exclusively for your vehicle during your entire booking window.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroSlide, setHeroSlide] = useState(0);

  const handleStepClick = useCallback((stepId: number) => {
    setActiveStep(stepId);
  }, []);

  return (
    <div className="min-h-screen bg-[#080C15] text-white font-sora overflow-x-hidden selection:bg-[#00FFA3] selection:text-black">

      {/* Global Glowing Light Trails Background Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 cyber-grid-floor opacity-35" />
        <div className="absolute top-[-10%] left-[15%] w-[550px] h-[550px] bg-[#00D2FF]/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[10%] w-[650px] h-[650px] bg-[#00FFA3]/08 rounded-full blur-[160px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[550px] h-[550px] bg-[#00D2FF]/08 rounded-full blur-[140px]" />

        {/* High-visibility SVG Neon Glow Light-Trail Paths (#00F2FE and #4FACFE) */}
        <svg className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="none" viewBox="0 0 1440 900">
          <defs>
            <linearGradient id="neonTrail1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#4FACFE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#00FFA3" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="neonTrail2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4FACFE" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#00F2FE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00FFA3" stopOpacity="0" />
            </linearGradient>
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Flowing curve from Hero right down to Steps left */}
          <path
            d="M 980 180 C 720 280, 420 460, 260 620 C 140 740, 200 860, 480 890"
            fill="none"
            stroke="url(#neonTrail1)"
            strokeWidth="3.5"
            filter="url(#neonBlur)"
            strokeDasharray="16 8"
          />
          <path
            d="M 1020 190 C 760 290, 460 470, 300 630 C 180 750, 240 870, 520 900"
            fill="none"
            stroke="url(#neonTrail2)"
            strokeWidth="1.5"
            filter="url(#neonBlur)"
          />
        </svg>
      </div>

      {/* =========================================================================
          1. HERO SECTION (ParkEase Smart Parking - 100% English)
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
            {/* Animated Gradient Splash Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-space font-semibold tracking-wider uppercase shadow-[0_0_20px_rgba(0,210,255,0.25)]">
              <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
              <span>Animated gradient splash</span>
            </div>

            {/* Bold Neon Glow Header */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2FF] via-[#00FFA3] to-[#00D2FF]">Ease</span>
              <br />
              <span className="text-white drop-shadow-[0_0_30px_rgba(0,210,255,0.3)]">Smart Parking</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-300 max-w-lg leading-relaxed font-sans">
              Effortless, intelligent parking management powered by real-time IoT sensors and 3D navigation.
            </p>

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
                <span>Explore Spots</span>
                <HiOutlineArrowRight className="w-4 h-4 text-[#00FFA3]" />
              </button>

              <button
                onClick={() => navigate('/waiting-list')}
                className="px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer backdrop-blur-md"
              >
                Join Waitlist
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2 pt-6">
              {[0, 1, 2].map((dot) => (
                <button
                  key={dot}
                  onClick={() => setHeroSlide(dot)}
                  className={`transition-all duration-300 rounded-full ${
                    heroSlide === dot
                      ? 'w-6 h-2 bg-[#00FFA3] shadow-[0_0_12px_#00FFA3]'
                      : 'w-2 h-2 bg-gray-700 hover:bg-gray-500'
                  }`}
                  aria-label={`Slide ${dot + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right 3D Isometric Visual with Explicit Sizing Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative w-full min-h-[440px] lg:h-[520px] flex items-center justify-center"
          >
            {/* 3D Isometric Parking Lot Scene with Moving Car & HUD */}
            <ParkEaseHeroIsometric3D />

            {/* Glowing Neon Trail flowing toward bottom-left */}
            <div className="absolute -bottom-10 -left-12 w-64 h-24 pointer-events-none opacity-80 hidden md:block">
              <svg viewBox="0 0 200 80" fill="none" className="w-full h-full">
                <path
                  d="M180 10 C120 20, 60 60, 10 75"
                  stroke="url(#neon-laser-grad-3)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="neon-laser-grad-3" x1="180" y1="10" x2="10" y2="75" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00FFA3" />
                    <stop offset="0.5" stopColor="#00D2FF" />
                    <stop offset="1" stopColor="#00D2FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

        </div>
      </section>

      {/* =========================================================================
          2. "EVERYTHING YOU NEED" (6 Feature Cards in English)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            Everything you need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            A comprehensive smart parking platform engineered for seamless, contactless urban mobility.
          </motion.p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, idx) => (
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
                  <div className="w-12 h-12 rounded-xl bg-[#09152b] border border-cyan-500/25 flex items-center justify-center shadow-lg group-hover:border-[#00FFA3]/50 group-hover:scale-110 transition-all">
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <span className={`text-[10px] font-space font-bold tracking-wider px-2.5 py-1 rounded-full border ${card.badgeColor} flex items-center gap-1`}>
                    <card.badgeIcon className="w-3 h-3" />
                    {card.badgeText}
                  </span>
                </div>

                {/* Card Title & Content */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#00FFA3] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-sans">
                  {card.description}
                </p>
              </div>

              {/* Bottom Status Link */}
              <div className="pt-5 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#00D2FF] font-medium group-hover:text-[#00FFA3] transition-colors">
                <span>Learn more</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. "FOUR SIMPLE STEPS" (Laser Guidance Path & 4-Car Highway Track)
          ========================================================================= */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            Four simple steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            Interactive laser-guided user journey. The seamless autonomous parking process.
          </motion.p>
        </div>

        {/* Stepper Navigation Buttons (1, 2, 3, 4) with Laser Connecting Line */}
        <div className="relative mb-12 max-w-4xl mx-auto">
          {/* Background Connecting Laser Line */}
          <div className="absolute top-6 left-8 right-8 h-1.5 bg-slate-800 rounded-full z-0 hidden sm:block">
            <motion.div
              className="h-full cyber-laser-line rounded-full"
              animate={{
                width: `${((activeStep - 1) / (roadmapSteps.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
            {roadmapSteps.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className="flex flex-col items-center text-center p-3 rounded-2xl transition-all cursor-pointer group"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-3 transition-all duration-300 relative ${
                      isActive
                        ? 'bg-gradient-to-br from-[#00D2FF] to-[#00FFA3] text-black shadow-[0_0_25px_#00FFA3] scale-110 ring-4 ring-[#00FFA3]/30'
                        : 'bg-[#0a1428] border border-cyan-500/25 text-gray-400 hover:border-[#00FFA3]/50 hover:text-white'
                    }`}
                  >
                    {step.num}
                    {isActive && (
                      <span className="absolute -inset-1 rounded-full border border-[#00FFA3] animate-ping opacity-50" />
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm font-bold tracking-wide transition-colors ${
                    isActive ? 'text-[#00FFA3]' : 'text-gray-400 group-hover:text-gray-200'
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-gray-500 hidden sm:block font-space">
                    {step.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Preview Box with Preview Cards & 4-Car Highway Track */}
        <div className="relative max-w-5xl mx-auto bg-gradient-to-b from-[#0a152d] via-[#070e20] to-[#050a14] rounded-3xl p-6 sm:p-10 border border-[#00D2FF]/25 shadow-[0_0_40px_rgba(0,210,255,0.15)] overflow-hidden">
          
          {/* Step 1 & 2 Interactive Glass Preview Cards directly below tabs */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl cyber-card transition-all ${activeStep === 1 ? 'border-[#00FFA3]/60 shadow-[0_0_20px_rgba(0,255,163,0.2)]' : 'opacity-70'}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#081830] border border-[#00FFA3]/30 flex items-center justify-center text-[#00FFA3] text-xl shadow-md">
                  👆
                </div>
                <div>
                  <span className="text-[10px] font-space text-[#00FFA3] font-bold block">STEP 01 // SPOT SELECTION</span>
                  <h4 className="text-sm font-bold text-white">Select Slot On Map</h4>
                  <p className="text-[11px] text-gray-400">Choose Bay A-02 with instant 3D reservation.</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl cyber-card transition-all ${activeStep === 2 ? 'border-[#00D2FF]/60 shadow-[0_0_20px_rgba(0,210,255,0.2)]' : 'opacity-70'}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#081830] border border-[#00D2FF]/30 flex items-center justify-center text-[#00D2FF] text-xl shadow-md">
                  🚗
                </div>
                <div>
                  <span className="text-[10px] font-space text-[#00D2FF] font-bold block">STEP 02 // GATE RADAR</span>
                  <h4 className="text-sm font-bold text-white">GPS Routing & Auto Check-in</h4>
                  <p className="text-[11px] text-gray-400">Barrier lifts automatically via LPR in 0.3s.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Curved Glowing Highway Lane with 4 Sequentially Positioned Cars */}
          <div className="relative w-full h-36 sm:h-44 bg-[#040812] rounded-2xl border border-cyan-500/20 flex items-center px-4 sm:px-12 overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 border-y border-dashed border-[#00D2FF]/30 bg-gradient-to-r from-cyan-950/20 via-blue-950/40 to-emerald-950/20" />
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#00D2FF] via-[#00FFA3] to-[#00D2FF] shadow-[0_0_12px_#00D2FF]" />

            <div className="relative z-10 w-full flex items-center justify-between">
              {roadmapSteps.map((step, index) => {
                const isActive = activeStep === step.id;
                return (
                  <motion.div
                    key={step.id}
                    animate={{
                      scale: isActive ? 1.25 : 0.95,
                      y: isActive ? -4 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => handleStepClick(step.id)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative">
                      {isActive && (
                        <motion.div
                          layoutId="activeCarGlow"
                          className="absolute -inset-4 bg-[#00FFA3]/25 rounded-full blur-lg"
                        />
                      )}

                      {index === 0 && <CarSedan className={`w-14 sm:w-20 h-auto transition-colors ${isActive ? 'text-[#00D2FF] filter drop-shadow-[0_0_12px_#00D2FF]' : 'text-slate-600 opacity-60'}`} color={isActive ? '#00D2FF' : '#475569'} />}
                      {index === 1 && <ElectricCar className={`w-14 sm:w-20 h-auto transition-colors ${isActive ? 'text-[#00FFA3] filter drop-shadow-[0_0_12px_#00FFA3]' : 'text-slate-600 opacity-60'}`} color={isActive ? '#00FFA3' : '#475569'} />}
                      {index === 2 && <CarSedan className={`w-14 sm:w-20 h-auto transition-colors ${isActive ? 'text-[#00D2FF] filter drop-shadow-[0_0_12px_#00D2FF]' : 'text-slate-600 opacity-60'}`} color={isActive ? '#00D2FF' : '#475569'} />}
                      {index === 3 && <BikeScooter className={`w-12 sm:w-16 h-auto transition-colors ${isActive ? 'text-[#00FFA3] filter drop-shadow-[0_0_12px_#00FFA3]' : 'text-slate-600 opacity-60'}`} color={isActive ? '#00FFA3' : '#475569'} />}
                    </div>

                    <span className={`text-xs font-space font-bold mt-2 px-2.5 py-0.5 rounded-full transition-colors ${
                      isActive ? 'bg-[#00FFA3] text-black shadow-[0_0_12px_#00FFA3]' : 'text-gray-500 bg-slate-900/60'
                    }`}>
                      Step 0{step.num}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Active Step Detailed Description Box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-6 rounded-2xl bg-[#070e1c]/90 border border-cyan-500/25 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span className="text-[#00FFA3]">Step {activeStep}:</span> {roadmapSteps[activeStep - 1].title} ({roadmapSteps[activeStep - 1].sub})
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed font-sans">
                  {roadmapSteps[activeStep - 1].details}
                </p>
              </div>

              <button
                onClick={() => navigate('/book-parking')}
                className="px-5 py-2.5 rounded-xl bg-[#00FFA3]/15 hover:bg-[#00FFA3]/25 border border-[#00FFA3]/40 text-[#00FFA3] text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Try Step {activeStep}</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </AnimatePresence>

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
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            Built for everyone
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            Tailored experiences for daily commuters, commercial garage operators, and enterprise fleets.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {audienceCards.map((aud, i) => (
            <motion.div
              key={aud.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="cyber-card overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative h-48 w-full bg-gradient-to-b from-[#09152b] to-[#060c18] border-b border-cyan-500/20 p-4 flex items-center justify-center overflow-hidden">
                
                {aud.type === 'mobile' && (
                  <div className="w-32 h-40 bg-[#0a1122] rounded-2xl border-2 border-cyan-500/40 p-2 shadow-2xl flex flex-col justify-between relative group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-gray-400 font-mono">
                      <span>9:41</span>
                      <span className="text-[#00FFA3]">● 5G</span>
                    </div>
                    <div className="text-center my-auto">
                      <div className="w-8 h-8 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3] flex items-center justify-center text-[#00FFA3] mx-auto mb-1 text-sm shadow-[0_0_10px_#00FFA3]">
                        ✓
                      </div>
                      <span className="text-[9px] font-bold text-white block">Spot Reserved</span>
                      <span className="text-[8px] text-cyan-300 font-mono">Bay #A-02</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#00FFA3] rounded-full" />
                  </div>
                )}

                {aud.type === 'tablet' && (
                  <div className="w-48 h-32 bg-[#0a1122] rounded-xl border-2 border-[#00D2FF]/40 p-2 shadow-2xl flex flex-col justify-between group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-gray-300 font-mono border-b border-white/10 pb-1">
                      <span className="text-[#00D2FF]">RADAR ANALYTICS</span>
                      <span className="text-emerald-400">94% OCCUPIED</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 pt-2 px-1">
                      <div className="w-4 h-6 bg-cyan-500/60 rounded-t" />
                      <div className="w-4 h-10 bg-emerald-500/80 rounded-t" />
                      <div className="w-4 h-8 bg-cyan-400 rounded-t" />
                      <div className="w-4 h-12 bg-emerald-400 rounded-t" />
                      <div className="w-4 h-7 bg-cyan-500/60 rounded-t" />
                      <div className="w-4 h-11 bg-teal-400 rounded-t" />
                    </div>
                    <span className="text-[7px] font-mono text-gray-400 text-center">Revenue: +28.4% Today</span>
                  </div>
                )}

                {aud.type === 'mobile-fleet' && (
                  <div className="w-32 h-40 bg-[#0a1122] rounded-2xl border-2 border-[#00FFA3]/40 p-2 shadow-2xl flex flex-col justify-between relative group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-gray-400 font-mono">
                      <span className="text-[#00FFA3]">VIP PASS</span>
                      <span className="text-cyan-400">EV ACTIVE</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center my-auto">
                      <span className="text-[9px] font-bold text-white block">Enterprise Pass</span>
                      <span className="text-[8px] text-emerald-400 font-mono">12 Vehicles Linked</span>
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

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    {aud.title}
                  </h3>

                  <ul className="space-y-2.5">
                    {aud.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300 font-sans">
                        <span className="w-4 h-4 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 flex items-center justify-center text-[#00FFA3] flex-shrink-0 mt-0.5">
                          <HiOutlineCheck className="w-3 h-3" />
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <button
                    onClick={() => navigate('/available-slots')}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-[#00D2FF] bg-[#00D2FF]/10 hover:bg-[#00D2FF]/20 border border-[#00D2FF]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Explore Solutions</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. "WHAT PEOPLE SAY" (Testimonials in English)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden flex items-center justify-around">
          <div className="w-64 h-32 stroke-cyan-400">
            <CarSedan className="w-full h-full" color="#00D2FF" />
          </div>
        </div>

        <div className="text-center max-w-2xl mx-auto mb-14 relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            What people say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            On-board drivers and commercial facility owners across 40+ connected facilities.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10">
          {testimonials.map((t, i) => (
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
                  <span className="text-xs font-space text-[#00D2FF] flex items-center gap-1 bg-[#00D2FF]/10 px-2.5 py-0.5 rounded-full border border-[#00D2FF]/25">
                    🚗 Verified Driver
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 italic leading-relaxed mb-6 font-sans">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#00FFA3]/40"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-[11px] text-gray-400 font-space">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          <span className="w-6 h-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_10px_#00FFA3]" />
          <span className="w-2 h-1.5 rounded-full bg-gray-700" />
          <span className="w-2 h-1.5 rounded-full bg-gray-700" />
        </div>
      </section>

      {/* =========================================================================
          6. "FREQUENTLY ASKED QUESTIONS" (FAQ Accordion in English)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Frequently asked questions
            </h2>
            <p className="text-sm text-gray-400 font-sans">
              Collection of ParkEase answers & autonomous policies.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-space font-semibold shadow-md">
            <span>🚗 Car Help</span>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
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
                  <span className="text-sm sm:text-base font-semibold text-gray-200 hover:text-white transition-colors">
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400"
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
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-white/5 font-sans">
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
          7. "READY TO GET STARTED?" (Glowing Blueprint Wireframe & Book Now CTA)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0a152d] via-[#091836] to-[#0a152d] border border-[#00D2FF]/30 p-10 sm:p-16 text-center shadow-[0_0_60px_rgba(0,210,255,0.2)]">
          
          {/* Detailed Glowing Blueprint / Wireframe Illustration of Car with Light Trails */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <svg
              viewBox="0 0 800 240"
              fill="none"
              className="w-full max-w-4xl h-auto"
            >
              <path
                d="M 100 180 C 130 180, 160 130, 240 120 C 300 80, 480 75, 580 120 C 650 125, 720 150, 750 180 Z"
                stroke="#00D2FF"
                strokeWidth="2.5"
                strokeDasharray="8 4"
              />
              <circle cx="210" cy="180" r="32" stroke="#00FFA3" strokeWidth="2" />
              <circle cx="630" cy="180" r="32" stroke="#00FFA3" strokeWidth="2" />
              <path
                d="M 280 120 C 330 90, 460 85, 540 120 Z"
                stroke="#00FFA3"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="absolute top-4 right-10 text-[#00FFA3] opacity-60 text-lg animate-pulse">
            ✦
          </div>
          <div className="absolute bottom-6 left-12 text-[#00D2FF] opacity-50 text-base animate-pulse">
            ✦
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-sm sm:text-base text-gray-300 font-sans">
              Fast-track your daily parking routine with AI-powered smart spots and zero waiting.
            </p>

            <div className="pt-3">
              <button
                onClick={() => navigate('/book-parking')}
                className="parkease-gold-btn px-10 py-4 rounded-2xl text-base sm:text-lg font-bold inline-flex items-center gap-2 cursor-pointer shadow-[0_0_35px_rgba(245,158,11,0.5)]"
              >
                <span>Book Now 🚗</span>
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
