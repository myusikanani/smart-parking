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

// 6 Feature Cards in Gujarati & English
const featureCards = [
  {
    icon: HiOutlineCpuChip,
    badgeIcon: HiOutlineBolt,
    badgeText: 'IoT સેન્સર્સ',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'IoT Device (સેન્સર્સ)',
    gujTitle: 'IoT સેન્સર્સ',
    description: 'હાઇ-ફ્રિકવન્સી અલ્ટ્રાસોનિક અને ઓપ્ટિકલ સેન્સર્સ રીયલ-ટાઇમમાં ખાલી સ્લોટ ડિટેક્ટ કરે છે અને ઓટોમેટિક બેરિયર ગેટ ઓપન કરે છે.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    badgeIcon: HiOutlineSparkles,
    badgeText: '24/7 સપોર્ટ',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: '24/7 સપોર્ટ (AI & Helpline)',
    gujTitle: '24/7 સપોર્ટ',
    description: 'ચોવીસેય કલાક ઓટોમેટેડ AI સહાયક અને તાત્કાલિક માનવ હેલ્પલાઇન સપોર્ટ દ્વારા તમારી દરેક મુશ્કેલીનું ત્વરિત નિવારણ.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineShieldCheck,
    badgeIcon: HiOutlineQrCode,
    badgeText: 'ટિકિટલેસ સુરક્ષા',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'સુરક્ષા & ટિકિટલેસ એન્ટ્રી',
    gujTitle: 'સુરક્ષા & ટિકિટલેસ',
    description: 'પેપર ટિકિટની ઝંઝટ વિના, હાઇ-સ્પીડ લાયસન્સ પ્લેટ રેકગ્નિશન (LPR) અને ડાયનેમિક QR કોડ સ્કેનિંગથી 100% કોન્ટેક્ટલેસ એન્ટ્રી.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineMapPin,
    badgeIcon: HiOutlineCursorArrowRays,
    badgeText: 'GPS નેવિગેશન',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'રીયલ-ટાઇમ અપડેટ્સ & GPS',
    gujTitle: 'રીયલ-ટાઇમ અપડેટ્સ',
    description: 'લાઇવ સ્લોટ અવેલેબિલિટી સાથે ટર્ન-બાય-ટર્ન ઇનડોર 3D નેવિગેશન જે તમને સીધા તમારા રિઝર્વ્ડ પાર્કિંગ સ્પોટ સુધી દોરી જાય છે.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
  {
    icon: HiOutlineCurrencyDollar,
    badgeIcon: HiOutlineBolt,
    badgeText: 'AI પ્રાઇસિંગ',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
    title: 'AI પાવર્ડ મેનેજમેન્ટ',
    gujTitle: 'AI પાવર્ડ રેટ્સ',
    description: 'પારદર્શક ડિજિટલ પ્રાઇસિંગ, ઑફ-પીક ડિસ્કાઉન્ટ્સ અને કેશલેસ ડિજિટલ વોલેટ પેમેન્ટ સાથે ઓટોમેટેડ ઈ-બિલિંગ સુવિધા.',
    iconColor: 'text-[#00D2FF]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,210,255,0.25)] hover:border-[#00D2FF]/40',
  },
  {
    icon: HiOutlineGlobeAmericas,
    badgeIcon: HiOutlineShieldCheck,
    badgeText: 'Analytic રિપોર્ટ',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
    title: 'Analytic રિપોર્ટ & કવરેજ',
    gujTitle: 'Analytic રિપોર્ટ',
    description: 'સમગ્ર શહેરમાં મલ્ટી-ગેરેજ કવરેજ અને ઓપરેટર્સ માટે લાઈવ ઓક્યુપન્સી, રેવન્યુ અને વ્હીકલ એનાલિટિક્સના વિસ્તૃત રિપોર્ટ્સ.',
    iconColor: 'text-[#00FFA3]',
    glowColor: 'hover:shadow-[0_0_25px_rgba(0,255,163,0.25)] hover:border-[#00FFA3]/40',
  },
];

// 4 Simple Steps Timeline
const roadmapSteps = [
  {
    id: 1,
    num: '1',
    title: 'એપ ડાઉનલોડ કરો',
    sub: 'Download App / Select Spot',
    tag: 'સ્ટેપ ૦૧: સ્પોટ પસંદગી',
    shortDesc: 'તમારું ડેસ્ટિનેશન અને વાહન પ્રકાર પસંદ કરો.',
    details: '3D મેપ પર લાઇવ ઉપલબ્ધ સ્લોટ્સ જુઓ અને એક ક્લિકમાં એડવાન્સ બુકિંગ કરીને ડિજિટલ QR પાસ મેળવો.',
    icon: HiOutlineArrowDownTray,
  },
  {
    id: 2,
    num: '2',
    title: 'સાઇન અપ કરો',
    sub: 'Sign Up / Get to Node',
    tag: 'સ્ટેપ ૦૨: GPS નેવિગેશન',
    shortDesc: 'ટર્ન-બાય-ટર્ન ઇનડોર રૂટને અનુસરો.',
    details: 'સ્માર્ટ જીપીએસ નેવિગેશન તમને ટ્રાફિક વિના સીધા જ પાર્કિંગ એન્ટ્રન્સ ગેટ સેન્સર સુધી પહોંચાડે છે.',
    icon: HiOutlineUserPlus,
  },
  {
    id: 3,
    num: '3',
    title: 'પાર્કિંગ બુક કરો',
    sub: 'Book Parking / Start & Slide',
    tag: 'સ્ટેપ ૦૩: કોન્ટેક્ટલેસ એન્ટ્રી',
    shortDesc: 'ઓટોમેટિક બેરિયર ઓપન થતાં અંદર પ્રવેશો.',
    details: 'IoT કેમેરા અથવા QR સ્કેનર 0.3 સેકન્ડમાં વેરિફાય કરે છે અને ગ્રીન લેસર પાથ તમને તમારા સ્લોટ સુધી દોરી જાય છે.',
    icon: HiOutlineCalendarDays,
  },
  {
    id: 4,
    num: '4',
    title: 'પાર્કિંગ સ્પોટ પર જાઓ',
    sub: 'Go to Spot / Scan & Pay',
    tag: 'સ્ટેપ ૦૪: એક્સપ્રેસ એક્ઝિટ',
    shortDesc: 'કેશલેસ પેમેન્ટ અને સીધો એક્ઝિટ.',
    details: 'સ્પોટ પર પહોંચીને પાર્ક કરો અને પરત ફરતી વખતે ઓટો-વોલેટ અથવા કોન્ટેક્ટલેસ પેમેન્ટ સાથે સરળતાથી બહાર નીકળો.',
    icon: HiOutlineMapPin,
  },
];

// Built for Everyone Audience Cards (Drivers, Operators, Business/Fleet)
const audienceCards = [
  {
    title: 'Drivers (ડ્રાઇવર્સ માટે)',
    type: 'mobile',
    points: [
      'પહોંચતા પહેલા ગેરંટીડ સ્પોટ રિઝર્વેશન',
      'ઇનડોર ટર્ન-બાય-ટર્ન 3D બે નેવિગેશન',
      'કોન્ટેક્ટલેસ QR કોડ અને LPR ગેટ એન્ટ્રી',
      'ઇન્સ્ટન્ટ ડિજિટલ વોલેટ પેમેન્ટ અને રિસિપ્ટ',
      'લાઇવ બુકિંગ હિસ્ટ્રી અને પાસ ડાઉનલોડ',
    ],
    badgeText: 'DAILY DRIVER',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
  },
  {
    title: 'Operators (ઓપરેટર્સ માટે)',
    type: 'tablet',
    points: [
      'રીયલ-ટાઇમ બે ઓક્યુપન્સી રડાર ડેશબોર્ડ',
      'ઓટોમેટેડ બેરિયર ગેટ અને સેન્સર કંટ્રોલ્સ',
      'ડાયનેમિક ડિમાન્ડ-બેઝ્ડ પ્રાઇસિંગ અલ્ગોરિધમ',
      'સચોટ નંબર પ્લેટ (LPR) વેરિફિકેશન લોગ્સ',
      'ઓટોમેટેડ દૈનિક રેવન્યુ અને ઓવરસ્ટે રિપોર્ટ્સ',
    ],
    badgeText: 'FACILITY MANAGER',
    badgeColor: 'text-[#00D2FF] bg-[#00D2FF]/10 border-[#00D2FF]/30',
  },
  {
    title: 'Business & Fleet (બિઝનેસ માટે)',
    type: 'mobile-fleet',
    points: [
      'મલ્ટી-વ્હીકલ કોર્પોરેટ એકાઉન્ટ્સ અને પાસ',
      'ડિસ્કાઉન્ટેડ માસિક/વાર્ષિક સબ્સ્ક્રિપ્શન',
      'ડેડિકેટેડ પ્રાયોરિટી EV ચાર્જિંગ સ્ટેશન્સ',
      'એક્સપ્રેસ VIP ગેટ લેન દ્વારા ઝીરો વેઇટિંગ',
      '24/7 સમર્પિત એન્ટરપ્રાઇઝ સપોર્ટ મેનેજર',
    ],
    badgeText: 'ENTERPRISE FLEET',
    badgeColor: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/30',
  },
];

// Testimonials in Gujarati
const testimonials = [
  {
    name: 'ડેવિડ વાન્સ (David Vance)',
    role: 'કોમર્શિયલ ફ્લીટ ઓનર',
    quote: 'ParkEase થી અમારી ફ્લીટનું કામ ખૂબ સરળ બની ગયું છે. ડ્રાઇવરોને પાર્કિંગ શોધવામાં સમય નથી બગડતો અને તમામ પેમેન્ટ ઓટોમેટિક થઈ જાય છે.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    name: 'સારાહ ચેન (Sarah Chen)',
    role: 'ડેઇલી સિટી કમ્યુટર',
    quote: 'ઇનડોર 3D નેવિગેશન અદ્ભુત છે! હું ઘરેથી જ સ્લોટ બુક કરીને સીધી પહોંચી જાઉં છું, ટિકિટ લીધા વિના ગેટ આપોઆપ ખુલી જાય છે.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
  {
    name: 'માર્કસ બ્રોડી (Marcus Brody)',
    role: 'મોલ ફેસિલિટી ડિરેક્ટર',
    quote: 'અમારા મોલમાં ParkEase સેન્સર્સ અને ડાયનેમિક પ્રાઇસિંગ લગાવ્યા પછી પાર્કિંગની આવકમાં 28% નો વધારો થયો છે. સિસ્ટમ 100% વિશ્વસનીય છે.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 5,
  },
];

// Frequently Asked Questions in Gujarati
const faqs = [
  {
    q: 'ParkEase શું છે અને તે કેવી રીતે કામ કરે છે?',
    a: 'ParkEase એ એક સ્માર્ટ IoT આધારિત ઓટોનોમસ પાર્કિંગ પ્લેટફોર્મ છે. તે સેન્સર્સ અને AI કેમેરા દ્વારા રીયલ-ટાઇમમાં ખાલી સ્લોટ્સ બતાવે છે અને તમને સીધા પાર્કિંગ સ્પોટ સુધી નેવિગેટ કરે છે.',
  },
  {
    q: 'પાર્કિંગ સ્પોટ કેવી રીતે બુક કરવું?',
    a: 'તમે "સર્ચ પાર્કિંગ" પર ક્લિક કરીને તમારું મનપસંદ લોકેશન અને સમય પસંદ કરી શકો છો. બુકિંગ કન્ફર્મ થતાં જ તમારા મોબાઇલમાં સુરક્ષિત ડિજિટલ QR પાસ મળી જશે.',
  },
  {
    q: 'કોન્ટેક્ટલેસ એન્ટ્રી કેવી રીતે થશે?',
    a: 'ગેટ પર પહોંચતા જ AI કેમેરા તમારી નંબર પ્લેટ સ્કેન કરશે અથવા તમે QR કોડ સ્કેન કરશો, એટલે 0.3 સેકન્ડમાં બેરિયર આપોઆપ ખુલી જશે.',
  },
  {
    q: 'પાર્કિંગ ચાર્જ / કિંમત કેટલી છે?',
    a: 'કિંમત લાઈવ ઓક્યુપન્સી અને સમયગાળા અનુસાર પારદર્શક હોય છે. બુકિંગ કરતા પહેલા તમને ચોક્કસ રકમ બતાવવામાં આવે છે જેમાં કોઈ છુપો ચાર્જ હોતો નથી.',
  },
  {
    q: 'શું બુકિંગ કેન્સલ અથવા સમય વધારી શકાય?',
    a: 'હા! તમે તમારા યુઝર ડેશબોર્ડમાંથી બુકિંગ શરૂ થવાના 30 મિનિટ પહેલાં કેન્સલ કરી શકો છો અથવા સરળતાથી સમય લંબાવી શકો છો.',
  },
  {
    q: 'શું ઇલેક્ટ્રિક વાહન (EV) ચાર્જિંગ સુવિધા ઉપલબ્ધ છે?',
    a: 'હા! EV સ્લોટ બુક કરતી વખતે હાઇ-સ્પીડ ચાર્જિંગ સ્ટેશન તમારા વાહન માટે તમારા સમગ્ર બુકિંગ સમય દરમિયાન રિઝર્વ રહે છે.',
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

      {/* Perspective 3D Grid Background in Hero Area */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 cyber-grid-floor opacity-35" />
        <div className="absolute top-[-10%] left-[15%] w-[550px] h-[550px] bg-[#00D2FF]/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[10%] w-[650px] h-[650px] bg-[#00FFA3]/08 rounded-full blur-[160px]" />
        <div className="absolute bottom-[20%] left-[5%] w-[550px] h-[550px] bg-[#00D2FF]/08 rounded-full blur-[140px]" />
      </div>

      {/* =========================================================================
          1. HERO SECTION (ParkEase Smart Parking - English & Gujarati Layout)
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
            {/* Animated Gradient UX Lock Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-space font-semibold tracking-wider uppercase shadow-[0_0_20px_rgba(0,210,255,0.25)]">
              <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-ping" />
              <span>એનિમેટેડ ગ્રેડિયન્ટ UX લૉક // Animated gradient splash</span>
            </div>

            {/* Bold Neon Glow Header */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Park<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D2FF] via-[#00FFA3] to-[#00D2FF]">Ease</span>
              <br />
              <span className="text-white drop-shadow-[0_0_30px_rgba(0,210,255,0.3)]">Smart Parking</span>
            </h1>

            {/* Subtitle in English & Gujarati */}
            <div className="space-y-1">
              <p className="text-base sm:text-lg text-gray-300 max-w-lg leading-relaxed font-sans">
                Real-time parking solutions at your fingertips...
              </p>
              <p className="text-xs sm:text-sm text-cyan-400/90 font-medium">
                તમારી આંગળીના ટેરવે સ્માર્ટ IoT સેન્સર્સ અને રીયલ-ટાઇમ 3D નેવિગેશન સાથે સરળ પાર્કિંગ.
              </p>
            </div>

            {/* CTA Buttons Row Matching Mockup */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/book-parking')}
                className="parkease-cyan-btn px-7 py-3.5 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2.5 transition-all shadow-xl shadow-cyan-500/30 group cursor-pointer"
              >
                <span>સર્ચ પાર્કિંગ (Search Parking)</span>
                <HiOutlineCursorArrowRays className="w-4 h-4 group-hover:scale-125 transition-transform text-[#00FFA3]" />
              </button>

              <button
                onClick={() => navigate('/register')}
                className="cyber-btn-shimmer px-6 py-3.5 rounded-2xl text-sm sm:text-base font-semibold transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>જોડાઓ (Join / Explore)</span>
                <HiOutlineArrowRight className="w-4 h-4 text-[#00FFA3]" />
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

          {/* Right 3D Isometric Visual with Vehicles, Routes, and Price Tags */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative"
          >
            {/* 3D Isometric Parking Lot Scene with Moving Car & HUD */}
            <ParkEaseHeroIsometric3D />

            {/* Glowing Neon Trail flowing toward bottom-left */}
            <div className="absolute -bottom-10 -left-12 w-64 h-24 pointer-events-none opacity-70 hidden md:block">
              <svg viewBox="0 0 200 80" fill="none" className="w-full h-full">
                <path
                  d="M180 10 C120 20, 60 60, 10 75"
                  stroke="url(#neon-laser-grad-2)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="neon-laser-grad-2" x1="180" y1="10" x2="10" y2="75" gradientUnits="userSpaceOnUse">
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
          2. "EVERYTHING YOU NEED" (6 Cards in Gujarati & English)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            Everything you need (તમને જરૂરી તમામ સુવિધાઓ)
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            કાર પાર્કિંગને સરળ, ઝડપી અને સંપૂર્ણપણે પેપરલેસ બનાવવા માટેની આધુનિક સિસ્ટમ.
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
                <span>વધુ વિગતો (Learn More)</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. "FOUR SIMPLE STEPS" (Timeline with Gujarati & English Steps)
          ========================================================================= */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            Four simple steps (સરળ ૪ સ્ટેપ્સ)
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            લેસર-ગાઇડેડ સીમલેસ યુઝર પ્રોસેસ: એપ ડાઉનલોડથી લઈને સ્પોટ પર પાર્ક કરવા સુધી.
          </motion.p>
        </div>

        {/* Stepper Navigation Buttons (1, 2, 3, 4) with Laser Line */}
        <div className="relative mb-12 max-w-4xl mx-auto">
          {/* Background Connecting Laser Line */}
          <div className="absolute top-6 left-8 right-8 h-1 bg-slate-800 rounded-full z-0 hidden sm:block">
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

        {/* Step Preview Box with Preview Cards & 4-Car Track */}
        <div className="relative max-w-5xl mx-auto bg-gradient-to-b from-[#0a152d] via-[#070e20] to-[#050a14] rounded-3xl p-6 sm:p-10 border border-[#00D2FF]/25 shadow-[0_0_40px_rgba(0,210,255,0.15)] overflow-hidden">
          
          {/* Step 1 & 2 Interactive Glass Preview Cards directly below tabs */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl cyber-card transition-all ${activeStep === 1 ? 'border-[#00FFA3]/60 shadow-[0_0_20px_rgba(0,255,163,0.2)]' : 'opacity-70'}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#081830] border border-[#00FFA3]/30 flex items-center justify-center text-[#00FFA3] text-xl shadow-md">
                  👆
                </div>
                <div>
                  <span className="text-[10px] font-space text-[#00FFA3] font-bold block">સ્ટેપ ૦૧ // SPOT SELECTION</span>
                  <h4 className="text-sm font-bold text-white">એપ ડાઉનલોડ & સ્પોટ પસંદગી</h4>
                  <p className="text-[11px] text-gray-400">Bay A-02 સ્લોટ પર વન-ક્લિક 3D બુકિંગ.</p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-2xl cyber-card transition-all ${activeStep === 2 ? 'border-[#00D2FF]/60 shadow-[0_0_20px_rgba(0,210,255,0.2)]' : 'opacity-70'}`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#081830] border border-[#00D2FF]/30 flex items-center justify-center text-[#00D2FF] text-xl shadow-md">
                  🚗
                </div>
                <div>
                  <span className="text-[10px] font-space text-[#00D2FF] font-bold block">સ્ટેપ ૦૨ // GATE RADAR</span>
                  <h4 className="text-sm font-bold text-white">GPS રૂટિંગ & ઓટો ચેક-ઇન</h4>
                  <p className="text-[11px] text-gray-400">લાયસન્સ પ્લેટ સ્કેનિંગથી 0.3 સેકન્ડમાં ગેટ ઓપન.</p>
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
                      સ્ટેપ {step.num}
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
                  <span className="text-[#00FFA3]">સ્ટેપ {activeStep}:</span> {roadmapSteps[activeStep - 1].title} ({roadmapSteps[activeStep - 1].sub})
                </h4>
                <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed font-sans">
                  {roadmapSteps[activeStep - 1].details}
                </p>
              </div>

              <button
                onClick={() => navigate('/book-parking')}
                className="px-5 py-2.5 rounded-xl bg-[#00FFA3]/15 hover:bg-[#00FFA3]/25 border border-[#00FFA3]/40 text-[#00FFA3] text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>સ્ટેપ {activeStep} શરૂ કરો</span>
                <HiOutlineArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* =========================================================================
          4. "BUILT FOR EVERYONE" (Drivers, Operators, Business & Fleet)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          >
            Built for everyone (દરેક માટે તૈયાર)
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            દૈનિક ડ્રાઇવર્સ, પાર્કિંગ ગેરેજ ઓપરેટર્સ અને કોર્પોરેટ ફ્લીટ મેનેજર્સ માટે ખાસ ડિઝાઇન કરેલા સોલ્યુશન્સ.
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
                      <span className="text-[9px] font-bold text-white block">સ્પોટ બુક થઈ ગયું</span>
                      <span className="text-[8px] text-cyan-300 font-mono">Bay #A-02</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#00FFA3] rounded-full" />
                  </div>
                )}

                {aud.type === 'tablet' && (
                  <div className="w-48 h-32 bg-[#0a1122] rounded-xl border-2 border-[#00D2FF]/40 p-2 shadow-2xl flex flex-col justify-between group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-gray-300 font-mono border-b border-white/10 pb-1">
                      <span className="text-[#00D2FF]">રડાર એનાલિટિક્સ</span>
                      <span className="text-emerald-400">94% ભરેલું</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-14 pt-2 px-1">
                      <div className="w-4 h-6 bg-cyan-500/60 rounded-t" />
                      <div className="w-4 h-10 bg-emerald-500/80 rounded-t" />
                      <div className="w-4 h-8 bg-cyan-400 rounded-t" />
                      <div className="w-4 h-12 bg-emerald-400 rounded-t" />
                      <div className="w-4 h-7 bg-cyan-500/60 rounded-t" />
                      <div className="w-4 h-11 bg-teal-400 rounded-t" />
                    </div>
                    <span className="text-[7px] font-mono text-gray-400 text-center">આવક: +28.4% આજે</span>
                  </div>
                )}

                {aud.type === 'mobile-fleet' && (
                  <div className="w-32 h-40 bg-[#0a1122] rounded-2xl border-2 border-[#00FFA3]/40 p-2 shadow-2xl flex flex-col justify-between relative group-hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-between text-[8px] text-gray-400 font-mono">
                      <span className="text-[#00FFA3]">VIP પાસ</span>
                      <span className="text-cyan-400">EV ચાલુ</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-center my-auto">
                      <span className="text-[9px] font-bold text-white block">એન્ટરપ્રાઇઝ પાસ</span>
                      <span className="text-[8px] text-emerald-400 font-mono">12 વાહનો લિંક્ડ</span>
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
                    <span>વિગતો જુઓ (Explore Solutions)</span>
                    <HiOutlineArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          5. "WHAT PEOPLE SAY" (Testimonials with Gujarati Reviews)
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
            What people say (ગ્રાહકોના અનુભવો)
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base text-gray-400 font-sans"
          >
            40+ કનેક્ટેડ પાર્કિંગ ગેરેજના હજારો સંતુષ્ટ ડ્રાઇવરો અને ઓપરેટર્સનો વિશ્વાસ.
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
                    🚗 વેરિફાઇડ યુઝર
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
          6. "FREQUENTLY ASKED QUESTIONS" (Expandable Accordion in Gujarati)
          ========================================================================= */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Frequently asked questions (સામાન્ય પ્રશ્નો)
            </h2>
            <p className="text-sm text-gray-400 font-sans">
              ParkEase વિશે વારંવાર પૂછાતા મહત્વપૂર્ણ પ્રશ્નો અને તેના ઉત્તરો.
            </p>
          </div>
          
          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#00D2FF]/10 border border-[#00D2FF]/30 text-[#00D2FF] text-xs font-space font-semibold shadow-md">
            <span>🚗 Car Help FAQ</span>
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
              Ready to Get Started?
            </h2>
            <p className="text-sm sm:text-base text-gray-300 font-sans">
              તમારા દૈનિક પાર્કિંગ અનુભવને સ્માર્ટ AI સેન્સર્સ સાથે ફાસ્ટ-ટ્રેક કરો.
            </p>

            <div className="pt-3">
              <button
                onClick={() => navigate('/book-parking')}
                className="parkease-gold-btn px-10 py-4 rounded-2xl text-base sm:text-lg font-bold inline-flex items-center gap-2 cursor-pointer shadow-[0_0_35px_rgba(245,158,11,0.5)]"
              >
                <span>Book Now (હમણાં બુક કરો 🚗)</span>
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
