import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineShoppingCart,
  HiOutlineBolt,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineQrCode,
  HiOutlineArrowRightOnRectangle,
  HiOutlineExclamationTriangle,
  HiOutlineCheck,
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineUserPlus,
  HiOutlineCreditCard,
} from 'react-icons/hi2';
import { slotApi, bookingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CarSedan, ElectricCar, BikeScooter, AccessibleCar } from '../components/vehicles';
import Modal from '../components/ui/Modal';
import InteractiveFloorMap from '../components/InteractiveFloorMap';
import type { ParkingSlotItem } from '../components/InteractiveFloorMap';
import ThreeDTicketPass from '../components/ThreeDTicketPass';

interface Slot {
  id: string;
  number: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled' | string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
  floor?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerMonth?: number;
}

const categories = [
  { id: 'four-wheeler', label: 'Four Wheeler', icon: HiOutlineShoppingCart, desc: 'Cars & SUVs', price: '₹30.00/hr' },
  { id: 'two-wheeler', label: 'Two Wheeler', icon: HiOutlineTruck, desc: 'Bikes & Scooters', price: '₹15.00/hr' },
  { id: 'ev', label: 'EV Charging', icon: HiOutlineBolt, desc: 'Fast Electric Charge', price: '₹40.00/hr' },
  { id: 'disabled', label: 'Accessible', icon: HiOutlineUser, desc: 'VIP Reserved', price: '₹20.00/hr' },
];

const durationPresets = [
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '4 Hours', hours: 4 },
  { label: 'Full Day (24h)', hours: 24 },
];

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const BookParking = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const isLoggedIn = Boolean(user && token);

  // Form State
  // Default to the NEXT full hour within venue hours (08:00-21:00) so the page
  // never opens on a past window; late-evening visits roll to tomorrow 08:00.
  const fmtLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const initialSlot = (() => {
    const now = new Date();
    const h = now.getMinutes() > 0 ? now.getHours() + 1 : now.getHours();
    if (h >= 8 && h <= 21) return { date: fmtLocal(now), time: `${String(h).padStart(2, '0')}:00` };
    if (h < 8) return { date: fmtLocal(now), time: '08:00' };
    return { date: fmtLocal(new Date(now.getTime() + 86400e3)), time: '08:00' };
  })();
  const todayStr = fmtLocal(new Date());
  const [date, setDate] = useState(initialSlot.date);
  const [selectedTime, setSelectedTime] = useState(initialSlot.time);
  const [category, setCategory] = useState('four-wheeler');
  const [selectedHours, setSelectedHours] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState('MH-12-AB-3456');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Modal & Auth Check State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Slots State
  const [slots, setSlots] = useState<Slot[]>([]);
  const [, setLoadingSlots] = useState(false);
  const [, setSlotsError] = useState('');

  // Booking State
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Fetch slots based on selected window across all floors
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingSlots(true);
      setSlotsError('');
      try {
        const params: Record<string, string> = {};
        if (date) params.date = date;
        // Time-window aware availability: fetch slots free for the
        // selected date/time window (backend checks booking overlaps).
        if (date && selectedTime) {
          const windowStart = new Date(`${date}T${selectedTime}:00`);
          if (!isNaN(windowStart.getTime())) {
            const windowEnd = new Date(windowStart.getTime() + selectedHours * 60 * 60 * 1000);
            params.startTime = windowStart.toISOString();
            params.endTime = windowEnd.toISOString();
          }
        }
        const res = await slotApi.getAvailable(params);
        if (!isMounted) return;
        const rawSlots = (res.slots || []) as unknown as Record<string, unknown>[];
        const fetchedSlots: Slot[] = rawSlots.map((s) => ({
          id: String(s._id || s.id || ''),
          number: String(s.number || ''),
          category: String(s.category || 'four-wheeler'),
          status: String(s.status || 'available'),
          floor: Number(s.floor) || 1,
          pricePerHour: Number(s.pricePerHour) || 30,
          pricePerDay: Number(s.pricePerDay) || 150,
          pricePerMonth: Number(s.pricePerMonth) || 3000,
        }));
        setSlots(fetchedSlots);

        // Auto-select matching category slot if available, or first available slot
        const matchingCategorySlot = fetchedSlots.find((s) => s.category === category && s.status === 'available');
        const firstAvail = matchingCategorySlot || fetchedSlots.find((s) => s.status === 'available');
        if (firstAvail) {
          const isCurrentValid = fetchedSlots.some((s) => s.id === selectedSlotId && s.status === 'available');
          if (!isCurrentValid || matchingCategorySlot) {
            setSelectedSlotId(matchingCategorySlot ? matchingCategorySlot.id : firstAvail.id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setSlotsError(err instanceof Error ? err.message : 'Failed to load available slots');
        }
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    })();
    return () => { isMounted = false; };
  }, [category, date, selectedTime, selectedHours]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || slots.find((s) => s.status === 'available'),
    [slots, selectedSlotId]
  );

  // Price Calculation — mirrors backend formula exactly:
  // duration >= 24h → pricePerDay × ceil(duration/24), else pricePerHour × duration
  const hourlyRate = useMemo(() => {
    if (selectedSlot?.pricePerHour) return selectedSlot.pricePerHour;
    switch (category) {
      case 'two-wheeler': return 15;
      case 'ev': return 40;
      case 'disabled': return 20;
      default: return 30;
    }
  }, [selectedSlot, category]);

  const dailyRate = useMemo(() => selectedSlot?.pricePerDay || 150, [selectedSlot]);

  const totalPrice = useMemo(() => {
    if (selectedHours >= 24) {
      return (dailyRate * Math.ceil(selectedHours / 24)).toFixed(2);
    }
    return (hourlyRate * selectedHours).toFixed(2);
  }, [hourlyRate, dailyRate, selectedHours]);

  const calculatedEndTime = useMemo(() => {
    if (!selectedTime) return '';
    const [h, m] = selectedTime.split(':').map(Number);
    const startObj = new Date();
    startObj.setHours(h, m, 0, 0);
    const endObj = new Date(startObj.getTime() + selectedHours * 60 * 60 * 1000);
    return endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [selectedTime, selectedHours]);

  const handleBookingSubmit = async () => {
    // 1. Check if user is logged in
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!selectedSlot) {
      setConfirmError('Please select an available parking slot from the grid.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setConfirmError('Please enter your vehicle license plate number.');
      return;
    }

    setConfirmLoading(true);
    setConfirmError('');

    try {
      const startTimeStr = `${date}T${selectedTime}:00`;
      const startDateObj = new Date(startTimeStr);
      const endDateObj = new Date(startDateObj.getTime() + selectedHours * 60 * 60 * 1000);
      const endTimeStr = endDateObj.toISOString().slice(0, 16) + ':00';

      const slotIdToSend = String(selectedSlot.id || (selectedSlot as unknown as Record<string, unknown>)._id || selectedSlot.number || '');

      const res = await bookingApi.create({
        slotId: slotIdToSend,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        startTime: startTimeStr,
        endTime: endTimeStr,
        category,
        amount: Number(totalPrice),
      });

      // Proceed to Razorpay payment checkout step
      const createdBookingId = (res.booking as Record<string, unknown>)?._id || (res.booking as Record<string, unknown>)?.id || '';
      navigate(createdBookingId ? `/dashboard/payments?bookingId=${createdBookingId}` : '/dashboard/payments', {
        state: {
          booking: res.booking,
        },
      });
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setConfirmLoading(false);
    }
  };

  const renderVehicleIllustration = () => {
    switch (category) {
      case 'two-wheeler':
        return <BikeScooter className="w-20 h-auto" color="#ec4899" />;
      case 'ev':
        return <ElectricCar className="w-20 h-auto" color="#06b6d4" />;
      case 'disabled':
        return <AccessibleCar className="w-20 h-auto" color="#a855f7" />;
      default:
        return <CarSedan className="w-20 h-auto" color="#06b6d4" />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-12 rounded-3xl border border-cyan-500/30 text-center space-y-8 relative overflow-hidden shadow-2xl"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-64 h-64 bg-pink-500/15 rounded-full blur-[80px] pointer-events-none" />

          {/* Cute 3D Gate Lock & Keycard Visual */}
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            {/* Pulsing Back Rings */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/40"
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
              className="absolute inset-2 rounded-full border border-cyan-500/20"
            />

            {/* Cute Keycard Drop-Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="relative w-36 h-28 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-2xl p-3 shadow-[0_15px_30px_rgba(6,182,212,0.4)] flex flex-col justify-between text-slate-950 border border-white/40 z-10 rotate-6"
            >
              <div className="flex items-center justify-between text-[10px] font-extrabold font-mono uppercase">
                <span>PARK PASS</span>
                <HiOutlineQrCode className="w-5 h-5" />
              </div>
              <div className="text-center py-1">
                <CarSedan className="w-16 h-auto mx-auto drop-shadow-md" color="#ffffff" />
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span>VIP DRIVER</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              </div>
            </motion.div>

            {/* Floating Lock Badge */}
            <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-2xl bg-white/90 border border-cyan-500/40 flex items-center justify-center text-cyan-600 shadow-xl z-20">
              <HiOutlineLockClosed className="w-6 h-6" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="max-w-xl mx-auto space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400">
              <HiOutlineSparkles className="w-4 h-4" /> Driver Access Required
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)]">
              Unlock Your <span className="neon-text">Reserved Bay</span>
            </h1>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Please sign in or create an account to pick your exact slot on the map, generate your digital QR entry pass, and complete your reservation!
            </p>
          </div>

          {/* CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 max-w-md mx-auto relative z-10">
            <button
              onClick={() => navigate('/login', { state: { from: '/book-parking' } })}
              className="btn-neon w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              Sign In to Reserve
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-outline w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <HiOutlineUserPlus className="w-5 h-5 text-pink-400" />
              Create Account
            </button>
          </div>

          <div className="pt-4 border-t border-[var(--border)] max-w-xs mx-auto">
            <button
              onClick={() => navigate('/available-slots')}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition flex items-center justify-center gap-1 mx-auto"
            >
              Or Browse Live Available Slots First →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* 1. HEADER */}
        <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 hidden md:block">
            {renderVehicleIllustration()}
          </div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-2">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              <span>Interactive Parking Bay Reservation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Reserve Your <span className="neon-text">Parking Slot</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Pick your date, time duration, vehicle type, and select your preferred bay from the live 2D parking layout.
            </p>
          </div>
        </motion.div>

        {/* 2. MAIN 2-COLUMN BOOKING WORKSTATION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: FILTERS & 2D PARKING GRID */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            {/* CATEGORY SELECTION CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                      isSelected
                        ? 'glass-card-glow border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]'
                        : 'glass hover:border-white/20'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                      isSelected ? 'bg-cyan-500 text-white' : 'bg-white/5 text-cyan-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm text-white">{cat.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{cat.price}</p>
                  </button>
                );
              })}
            </div>

            {/* DATE & DURATION PICKER BOX */}
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <HiOutlineCalendarDays className="w-4 h-4 text-cyan-400" />
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-neon w-full px-4 py-2.5 text-sm rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <HiOutlineClock className="w-4 h-4 text-cyan-400" />
                    Start Arrival Time
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="input-neon w-full px-4 py-2.5 text-sm rounded-xl bg-white text-slate-900"
                  >
                    {timeSlots.map((t) => (
                      <option key={t} value={t} className="bg-white text-slate-900">
                        {t} {Number(t.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DURATION PRESET CHIPS */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Select Parking Duration:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {durationPresets.map((dp) => (
                    <button
                      key={dp.hours}
                      onClick={() => setSelectedHours(dp.hours)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        selectedHours === dp.hours
                          ? 'bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/30'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {dp.label}
                    </button>
                  ))}
                </div>

                {/* LIVE DYNAMIC VALIDITY TIME WINDOW BANNER */}
                <div className="mt-3 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs flex flex-wrap items-center justify-between gap-2 text-cyan-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">Pass Validity Window:</span>
                    <span className="font-mono text-white font-semibold">
                      {selectedTime} ➔ {calculatedEndTime} ({selectedHours}h)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/40 text-cyan-200">
                    Auto Gate Barrier Access
                  </span>
                </div>
              </div>

              {/* VEHICLE LICENSE PLATE INPUT */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Vehicle License Plate Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MH-12-AB-3456"
                  className="input-neon w-full px-4 py-2.5 text-sm font-mono tracking-wider rounded-xl uppercase"
                />
              </div>
            </div>

            {/* 2D INTERACTIVE PARKING LOT MAP GRID */}
            <InteractiveFloorMap
              slots={slots.map((s) => ({
                _id: s.id,
                number: s.number,
                category: s.category,
                floor: s.floor || 1,
                status: s.status as ParkingSlotItem['status'],
                pricePerHour: s.pricePerHour || 30,
              }))}
              selectedSlotId={selectedSlotId}
              onSelectSlot={(slot) => {
                setSelectedSlotId(slot._id);
                if (slot.category) {
                  setCategory(slot.category);
                }
              }}
            />
          </motion.div>

          {/* RIGHT COLUMN: STICKY LIVE RECEIPT & 3D PASS PREVIEW */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* CUTE 3D DIGITAL TICKET PASS PREVIEW */}
            <ThreeDTicketPass
              slotNumber={selectedSlot ? `BAY ${selectedSlot.number}` : 'BAY A-01'}
              floor={selectedSlot?.floor || 1}
              category={category}
              vehicleNumber={vehicleNumber}
              date={date}
              startTime={selectedTime}
              hours={selectedHours}
              totalPrice={totalPrice}
            />

            {/* LIVE SUMMARY RECEIPT CARD */}
            <div className="glass-card-glow p-6 rounded-3xl space-y-4 border border-cyan-500/30 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HiOutlineBanknotes className="w-5 h-5 text-emerald-400" />
                  Booking Summary
                </h2>
                <span className="badge-neon text-xs">Live Rate</span>
              </div>

              {!isLoggedIn && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <HiOutlineLockClosed className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>Log in required before completing slot reservation.</span>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Reserved Slot</span>
                  <span className="font-bold text-cyan-300">
                    {selectedSlot ? `Slot #${selectedSlot.number} (Floor ${selectedSlot.floor || 1})` : 'None Selected'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Date & Time</span>
                  <span className="font-semibold text-white">
                    {date} @ {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-semibold text-white">{selectedHours} Hours</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Hourly Rate</span>
                  <span className="font-mono text-gray-200">₹{hourlyRate.toFixed(2)} / hr</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Vehicle Plate</span>
                  <span className="font-mono text-cyan-300 font-bold">{vehicleNumber || 'MH-12-AB-3456'}</span>
                </div>

                {/* TOTAL ESTIMATION */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-xs text-gray-400">Total Payable</p>
                    <p className="text-2xl font-extrabold neon-text-cyan">₹{totalPrice}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <HiOutlineCheck className="w-3.5 h-3.5" />
                      Instant Entry Pass
                    </span>
                  </div>
                </div>
              </div>

              {confirmError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <HiOutlineExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{confirmError}</span>
                </div>
              )}

              <button
                onClick={handleBookingSubmit}
                disabled={confirmLoading || !selectedSlot}
                className="w-full btn-neon-pink py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {confirmLoading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing Reservation...
                  </>
                ) : !isLoggedIn ? (
                  <>
                    <HiOutlineLockClosed className="w-5 h-5" />
                    Log In to Reserve Slot
                  </>
                ) : (
                  <>
                    <HiOutlineCreditCard className="w-5 h-5" />
                    PROCEED TO PAY — ₹{totalPrice}
                  </>
                )}
              </button>
            </div>

            {/* DIGITAL TICKET LIVE PREVIEW TILE */}
            <div className="glass-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <HiOutlineQrCode className="w-4 h-4 text-cyan-400" />
                  Generated Ticket Preview
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">Auto-Generated</span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-pink-950/30 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-white">ParkEase Pass</span>
                  <span className="font-mono text-cyan-400">
                    {selectedSlot ? `#${selectedSlot.number}` : '#A-04'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Driver: {user?.name || 'Guest Driver'} &middot; {vehicleNumber || 'MH-12-AB-3456'}
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">QR Gate Key Ready</span>
                  <span className="text-emerald-400 font-bold">Confirmed</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* LOGIN REQUIRED MODAL POPUP */}
      <Modal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        title="Account Authentication Required"
      >
        <div className="space-y-4 py-2 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <HiOutlineLockClosed className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Please Log In First</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              You must be logged in to your ParkEase user account to finalize your parking slot reservation and receive your digital QR pass.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/login', { state: { from: '/book-parking' } })}
              className="btn-neon flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider"
            >
              Log In Now
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-outline flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider"
            >
              Create Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookParking;
