import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineShoppingCart,
  HiOutlineBolt,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineQrCode,
  HiOutlineArrowRightOnRectangle,
  HiOutlineExclamationTriangle,
  HiOutlineCheck,
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineCreditCard,
  HiOutlineMicrophone,
  HiOutlineChevronDown,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { slotApi, bookingApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import { CarSedan, ElectricCar, BikeScooter, AccessibleCar } from '../components/vehicles';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import InteractiveFloorMap from '../components/InteractiveFloorMap';
import type { ParkingSlotItem } from '../components/InteractiveFloorMap';
import AIVoiceBookingModal from '../components/AIVoiceBookingModal';

interface Slot {
  id: string;
  number: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled' | string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
  floor?: number;
  pricePerHour?: number;
  pricePerDay?: number;
  pricePerMonth?: number;
  isEmergencyBuffer?: boolean;
  features?: string[];
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

const BookParking = () => {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const isLoggedIn = Boolean(user && token);

  // 3-STEP WIZARD STATE (Step 1: Vehicle & Schedule -> Step 2: Bay Selection -> Step 3: Review & Pay)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
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
  const [vehicleNumber, setVehicleNumber] = useState((user?.vehicleNumber || 'MH-12-AB-3456').trim().toUpperCase());
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Collapsed Vehicle Garage State
  const [garageOpen, setGarageOpen] = useState(false);
  const [newPlateInput, setNewPlateInput] = useState('');
  const [addingVehicleLoading, setAddingVehicleLoading] = useState(false);
  const [addVehicleMsg, setAddVehicleMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [localVehicles, setLocalVehicles] = useState<string[]>(() => {
    if (user?.vehicles && Array.isArray(user.vehicles)) {
      return user.vehicles.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
    }
    return [];
  });

  // Sync with user?.vehicles whenever user changes
  useEffect(() => {
    if (user?.vehicles && Array.isArray(user.vehicles)) {
      const serverVehicles = user.vehicles.map((v) => String(v).trim().toUpperCase()).filter(Boolean);
      setLocalVehicles((prev) => Array.from(new Set([...prev, ...serverVehicles])));
    }
  }, [user?.vehicles]);

  // Fetch freshest user profile & garage vehicles on page mount
  useEffect(() => {
    if (token) {
      authApi.getMe()
        .then((res) => {
          if (res.user) {
            updateUser(res.user as unknown as Partial<User>);
            if (Array.isArray(res.user.vehicles)) {
              const freshList = (res.user.vehicles as string[]).map((v) => String(v).trim().toUpperCase()).filter(Boolean);
              setLocalVehicles(freshList);
            }
          }
        })
        .catch(() => {});
    }
  }, [token, updateUser]);

  const primaryPlate = useMemo(() => {
    return (user?.vehicleNumber || 'MH-12-AB-3456').trim().toUpperCase();
  }, [user?.vehicleNumber]);

  // Secondary garage vehicles (all saved vehicles excluding the primary car)
  const garageVehicles = useMemo(() => {
    const rawList = [
      ...(Array.isArray(user?.vehicles) ? user.vehicles : []),
      ...localVehicles,
    ];
    const primary = primaryPlate;
    const secondary = rawList
      .map((v) => (v ? String(v).trim().toUpperCase() : ''))
      .filter((v) => v && v !== primary);
    return Array.from(new Set(secondary));
  }, [user?.vehicles, localVehicles, primaryPlate]);

  useEffect(() => {
    if (user?.vehicleNumber && (!vehicleNumber || vehicleNumber === 'MH-12-AB-3456')) {
      setVehicleNumber(user.vehicleNumber.trim().toUpperCase());
    }
  }, [user?.vehicleNumber, vehicleNumber]);

  const handleApplyVoiceBooking = (data: { category?: 'four-wheeler' | 'two-wheeler' | 'ev' | 'disabled'; durationHours?: number; time?: string; date?: string; vehicleNumber?: string }) => {
    if (data.category) setCategory(data.category);
    if (data.durationHours) setSelectedHours(data.durationHours);
    if (data.time) setSelectedTime(data.time);
    if (data.date) setDate(data.date);
    if (data.vehicleNumber) setVehicleNumber(data.vehicleNumber.trim().toUpperCase());
  };

  const handleAddNewVehicle = async () => {
    const cleanPlate = newPlateInput.trim().toUpperCase();
    if (!cleanPlate) {
      toast('Please enter a valid license plate number', 'error');
      setAddVehicleMsg({ type: 'error', text: 'Please enter a valid license plate.' });
      return;
    }

    // 1. If user typed Primary Car (MH-12-AB-3456)
    if (cleanPlate === primaryPlate) {
      setVehicleNumber(primaryPlate);
      setNewPlateInput('');
      toast(`⭐ "${cleanPlate}" is your Primary Registered Car! Selected for booking.`, 'info');
      setAddVehicleMsg({ type: 'info', text: `"${cleanPlate}" is your Primary Vehicle and has been selected for booking.` });
      return;
    }

    // 2. If user typed an already saved Garage Car
    if (garageVehicles.includes(cleanPlate)) {
      setVehicleNumber(cleanPlate);
      setNewPlateInput('');
      toast(`🚗 "${cleanPlate}" is already in your Garage! Selected for booking.`, 'info');
      setAddVehicleMsg({ type: 'info', text: `"${cleanPlate}" is already in your Garage and has been selected for booking.` });
      return;
    }

    setAddingVehicleLoading(true);
    setAddVehicleMsg(null);
    // Optimistically add to local state instantly
    setLocalVehicles((prev) => Array.from(new Set([...prev, cleanPlate])));
    setVehicleNumber(cleanPlate);
    setNewPlateInput('');

    try {
      const res = await authApi.updateProfile({ addVehicle: cleanPlate });
      if (res.user) {
        updateUser(res.user as unknown as Partial<User>);
        if (Array.isArray(res.user.vehicles)) {
          const freshList = (res.user.vehicles as string[]).map((v) => String(v).trim().toUpperCase()).filter(Boolean);
          setLocalVehicles(freshList);
        }
      }
      toast(`🚗 Vehicle ${cleanPlate} added to your garage & selected for booking!`, 'success');
      setAddVehicleMsg({ type: 'success', text: `✓ Vehicle "${cleanPlate}" added to your garage and selected for this reservation!` });
    } catch (err: unknown) {
      // Revert optimistic addition on error
      setLocalVehicles((prev) => prev.filter((v) => v !== cleanPlate));
      setVehicleNumber(primaryPlate);
      const message = err instanceof Error ? err.message : 'Failed to register vehicle.';
      toast(message, 'error');
      setAddVehicleMsg({ type: 'error', text: message });
    } finally {
      setAddingVehicleLoading(false);
    }
  };

  const handleRemoveGarageVehicle = async (plate: string) => {
    // Optimistically remove from local state
    setLocalVehicles((prev) => prev.filter((v) => v !== plate));
    if (vehicleNumber === plate) {
      setVehicleNumber(primaryPlate);
    }
    try {
      const res = await authApi.updateProfile({ removeVehicle: plate });
      if (res.user) {
        updateUser(res.user as unknown as Partial<User>);
        if (Array.isArray(res.user.vehicles)) {
          const freshList = (res.user.vehicles as string[]).map((v) => String(v).trim().toUpperCase()).filter(Boolean);
          setLocalVehicles(freshList);
        }
      }
      toast(`Vehicle ${plate} removed from your garage`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove vehicle.';
      toast(message, 'error');
    }
  };

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
          isEmergencyBuffer: Boolean(s.isEmergencyBuffer || String(s.number || '').startsWith('BUF') || (Array.isArray(s.features) && s.features.includes('emergency_buffer'))),
          features: Array.isArray(s.features) ? (s.features as string[]) : [],
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

  const isEmergencySlot = (s: Slot) => {
    return Boolean(
      s.isEmergencyBuffer ||
      s.number?.startsWith('BUF') ||
      (s.features && s.features.includes('emergency_buffer'))
    );
  };

  const selectedSlot = useMemo(
    () =>
      slots.find((s) => s.id === selectedSlotId && !isEmergencySlot(s)) ||
      slots.find((s) => s.status === 'available' && !isEmergencySlot(s) && s.category === category) ||
      slots.find((s) => s.status === 'available' && !isEmergencySlot(s)),
    [slots, selectedSlotId, category]
  );

  // Price Calculation — mirrors backend formula exactly:
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
      setConfirmError('Please select an available parking bay from Step 2.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setConfirmError('Please enter your vehicle license plate number.');
      return;
    }

    setConfirmLoading(true);
    setConfirmError('');

    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const endDateObj = new Date(startDateObj.getTime() + selectedHours * 60 * 60 * 1000);

      const slotIdToSend = String(selectedSlot.id || (selectedSlot as unknown as Record<string, unknown>)._id || selectedSlot.number || '');
      const cleanVehiclePlate = vehicleNumber.trim().toUpperCase();

      const res = await bookingApi.create({
        slotId: slotIdToSend,
        vehicleNumber: cleanVehiclePlate,
        startTime: startDateObj.toISOString(),
        endTime: endDateObj.toISOString(),
        category,
        amount: Number(totalPrice),
      });

      // Auto-save this vehicle to user's garage if it's new
      if (
        isLoggedIn &&
        cleanVehiclePlate &&
        cleanVehiclePlate !== primaryPlate &&
        !garageVehicles.includes(cleanVehiclePlate)
      ) {
        authApi.updateProfile({ addVehicle: cleanVehiclePlate })
          .then((pRes) => {
            if (pRes.user) updateUser(pRes.user as unknown as Partial<User>);
          })
          .catch(() => {});
      }

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* 1. COMPACT HERO BANNER & AI VOICE COMMAND */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge-neon text-[10px] font-mono px-2 py-0.5">Instant Pass Access</span>
            <span className="text-xs text-cyan-400 font-medium flex items-center gap-1">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              ANPR Barrier Whitelisted
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🅿️</span>
            <span>Reserve Your Parking Bay</span>
          </h1>
          <p className="text-xs text-gray-400 max-w-xl">
            Streamlined 3-step reservation with smart slot conflict resolution and 1-click garage car switching.
          </p>
        </div>

        {/* AI Voice Command Assistant Pill CTA */}
        <button
          type="button"
          onClick={() => setVoiceModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 hover:from-pink-500/30 hover:to-purple-600/30 border border-pink-500/40 text-pink-300 hover:text-pink-200 font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          <HiOutlineMicrophone className="w-4 h-4 text-pink-400 animate-pulse" />
          <span>AI Voice Booking 🎙️</span>
        </button>
      </div>

      {/* 2. PROGRESS STEP INDICATOR (DECLUTTERED WIZARD NAVIGATION) */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs font-semibold">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-4 sm:py-2.5 rounded-xl transition-all ${
              currentStep === 1
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : currentStep > 1
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'text-gray-500 bg-white/5 border border-transparent'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              currentStep === 1 ? 'bg-cyan-400 text-slate-950' : currentStep > 1 ? 'bg-emerald-400 text-slate-950' : 'bg-gray-700 text-gray-300'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span className="hidden sm:inline">1. Vehicle & Schedule</span>
            <span className="sm:hidden">1. Details</span>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-4 sm:py-2.5 rounded-xl transition-all ${
              currentStep === 2
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-bold'
                : currentStep > 2
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                : 'text-gray-500 bg-white/5 border border-transparent'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              currentStep === 2 ? 'bg-cyan-400 text-slate-950' : currentStep > 2 ? 'bg-emerald-400 text-slate-950' : 'bg-gray-700 text-gray-300'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span className="hidden sm:inline">2. Choose Bay on Map</span>
            <span className="sm:hidden">2. Select Bay</span>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => {
              if (selectedSlot) setCurrentStep(3);
              else toast('Please select an available parking bay first', 'info');
            }}
            className={`flex items-center justify-center sm:justify-start gap-2 p-2 sm:px-4 sm:py-2.5 rounded-xl transition-all ${
              currentStep === 3
                ? 'bg-pink-500/20 text-pink-300 border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.25)] font-bold'
                : 'text-gray-500 bg-white/5 border border-transparent'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
              currentStep === 3 ? 'bg-pink-400 text-slate-950' : 'bg-gray-700 text-gray-300'
            }`}>
              3
            </span>
            <span className="hidden sm:inline">3. Review & Pay</span>
            <span className="sm:hidden">3. Confirm</span>
          </button>
        </div>
      </div>

      {/* 3. STEP CONTENT SWITCHER */}
      <AnimatePresence mode="wait">
        {/* ========================================================================= */}
        {/* STEP 1: VEHICLE TYPE, COMPACT GARAGE & SCHEDULE */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* CATEGORY SELECTION CARDS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Select Vehicle Category:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
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
            </div>

            {/* COMPACT & COLLAPSIBLE VEHICLE GARAGE SELECTOR */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl space-y-3 border border-cyan-500/25">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚗</span>
                  <span className="text-xs font-bold text-gray-200">Selected Vehicle for Booking:</span>
                  <span className="font-mono font-extrabold text-xs text-cyan-300 bg-cyan-950/90 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                    {vehicleNumber}
                  </span>
                  {vehicleNumber === primaryPlate && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                      ⭐ Primary
                    </span>
                  )}
                  {garageVehicles.includes(vehicleNumber) && (
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded font-mono font-bold">
                      🚗 Garage Car
                    </span>
                  )}
                </div>

                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => setGarageOpen(!garageOpen)}
                    className="text-xs font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-xl border border-pink-500/30 transition flex items-center gap-1.5"
                  >
                    <span>{garageOpen ? 'Close Garage ▲' : 'Change Car / + Add Car ▾'}</span>
                    <span className="text-[10px] text-gray-400">({1 + garageVehicles.length} saved)</span>
                  </button>
                )}
              </div>

              {/* EXPANDABLE GARAGE CAR SELECTION & ADD CAR */}
              {garageOpen && isLoggedIn && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-3 border-t border-white/10 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Primary Car Card */}
                    <div
                      onClick={() => setVehicleNumber(primaryPlate)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all ${
                        vehicleNumber === primaryPlate
                          ? 'bg-cyan-950/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">⭐ Primary Car</span>
                        {vehicleNumber === primaryPlate && <span className="text-cyan-400 font-bold">✓ Selected</span>}
                      </div>
                      <p className="font-mono font-bold text-white text-sm mt-1">{primaryPlate}</p>
                    </div>

                    {/* Garage Cars Cards */}
                    {garageVehicles.map((v, idx) => {
                      const isSelected = vehicleNumber === v;
                      return (
                        <div
                          key={v}
                          onClick={() => setVehicleNumber(v)}
                          className={`cursor-pointer p-3 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-pink-950/90 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] ring-1 ring-pink-400'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-mono font-bold text-pink-300 uppercase">🚗 Garage Car #{idx + 2}</span>
                            <div className="flex items-center gap-1.5">
                              {isSelected && <span className="text-pink-400 font-bold">✓ Selected</span>}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveGarageVehicle(v);
                                }}
                                className="text-gray-500 hover:text-red-400 text-xs ml-1"
                                title="Remove vehicle"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <p className="font-mono font-bold text-white text-sm mt-1">{v}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Car Input */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newPlateInput}
                      onChange={(e) => {
                        setNewPlateInput(e.target.value.toUpperCase());
                        setAddVehicleMsg(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewVehicle();
                        }
                      }}
                      placeholder="e.g. MH-12-AB-3406 or GJ-01-XY-9999"
                      className="input-neon flex-1 px-3.5 py-2 text-xs font-mono uppercase rounded-xl tracking-wider"
                    />
                    <button
                      type="button"
                      disabled={addingVehicleLoading || !newPlateInput.trim()}
                      onClick={handleAddNewVehicle}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                    >
                      {addingVehicleLoading ? 'Saving...' : '+ Add & Select'}
                    </button>
                  </div>

                  {addVehicleMsg && (
                    <p className={`text-xs p-2 rounded-lg ${
                      addVehicleMsg.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {addVehicleMsg.text}
                    </p>
                  )}
                </motion.div>
              )}

              {!isLoggedIn && (
                <div className="pt-2">
                  <label className="block text-[11px] text-gray-400 mb-1">Enter License Plate:</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. MH-12-AB-3456"
                    className="input-neon w-full px-3.5 py-2 text-xs font-mono uppercase rounded-xl tracking-wider"
                  />
                </div>
              )}
            </div>

            {/* DATE, TIME & DURATION CARD */}
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1.5">
                    <HiOutlineCalendarDays className="w-4 h-4 text-cyan-400" />
                    Select Arrival Date
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

              {/* Duration Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Select Parking Duration:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {durationPresets.map((dp) => (
                    <button
                      key={dp.hours}
                      type="button"
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

                {/* Dynamic Pass Validity Banner */}
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
            </div>

            {/* STEP 1 CTA: ADVANCE TO STEP 2 */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue to Bay Selection (Map)</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: INTERACTIVE 2D FLOOR MAP BAY SELECTION */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top Navigation Bar for Step 2 */}
            <div className="flex items-center justify-between pb-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-cyan-400 bg-white/5 px-3 py-1.5 rounded-xl transition"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                <span>← Back to Vehicle & Time</span>
              </button>

              <div className="text-right">
                <span className="text-xs text-gray-400 font-medium">Selected Slot: </span>
                <span className="font-mono font-bold text-cyan-300">
                  {selectedSlot ? `Bay #${selectedSlot.number} (Floor ${selectedSlot.floor || 1})` : 'None Selected'}
                </span>
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
                pricePerDay: s.pricePerDay || 150,
                isEmergencyBuffer: Boolean(s.isEmergencyBuffer || s.number?.startsWith('BUF') || s.features?.includes('emergency_buffer')),
                features: s.features,
              }))}
              selectedSlotId={selectedSlotId}
              onSelectSlot={(slot) => {
                if (slot.isEmergencyBuffer || slot.number?.startsWith('BUF')) {
                  toast(
                    `🛡️ Bay ${slot.number} is a System Reserved Emergency Buffer Slot. It is automatically assigned by the Smart Conflict Engine in overstay emergencies (₹0 fee).`,
                    'info'
                  );
                  return;
                }
                setSelectedSlotId(slot._id);
                if (slot.category) {
                  setCategory(slot.category);
                }
              }}
            />

            {/* STEP 2 BOTTOM BAR: CONFIRM SELECTION & ADVANCE TO STEP 3 */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <div>
                <span className="text-xs text-gray-400 block">Bay Selected for Booking:</span>
                <p className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400">🅿️ Bay #{selectedSlot?.number || 'C1A'}</span>
                  <span className="text-gray-400 font-normal text-xs">
                    (Floor {selectedSlot?.floor || 1}) &bull; ₹{hourlyRate}/hr &bull; Total: <span className="text-emerald-400 font-bold">₹{totalPrice}</span>
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition"
                >
                  Change Time
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!selectedSlot}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <span>Confirm Bay & Review Summary ➔</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: CONSOLIDATED REVIEW & INSTANT PAYMENT */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {/* Top Back Action */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-cyan-400 bg-white/5 px-3 py-1.5 rounded-xl transition"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                <span>← Back to Bay Selection</span>
              </button>
              <span className="badge-neon text-xs">Step 3 of 3</span>
            </div>

            {/* CONSOLIDATED BOOKING SUMMARY CARD */}
            <div className="glass-card-glow p-6 sm:p-8 rounded-3xl space-y-5 border border-cyan-500/40 relative shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <HiOutlineBanknotes className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Booking Summary & Verification</h2>
                    <p className="text-xs text-gray-400">Review all details before initiating instant gate pass</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ready to Confirm
                </span>
              </div>

              {!isLoggedIn && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <HiOutlineLockClosed className="w-4 h-4 flex-shrink-0 text-amber-400" />
                  <span>Log in required to complete reservation and generate your gate QR key.</span>
                </div>
              )}

              {/* Itemized Review List */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <HiOutlineMapPin className="w-4 h-4 text-cyan-400" /> Reserved Bay
                  </span>
                  <span className="font-extrabold text-cyan-300 font-mono">
                    {selectedSlot ? `Bay #${selectedSlot.number} (Floor ${selectedSlot.floor || 1})` : 'None Selected'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Vehicle Category</span>
                  <span className="font-semibold text-white capitalize">
                    {category.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Vehicle License Plate</span>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                    🚗 {vehicleNumber || 'MH-12-AB-3456'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Date & Start Time</span>
                  <span className="font-semibold text-white">
                    {date} @ {selectedTime}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Duration & Validity</span>
                  <span className="font-semibold text-white">
                    {selectedHours} Hours ({selectedTime} ➔ {calculatedEndTime})
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400">Hourly Rate</span>
                  <span className="font-mono text-gray-200">₹{hourlyRate.toFixed(2)} / hr</span>
                </div>

                {/* Total Calculation */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-xs text-gray-400">Total Payable Amount</p>
                    <p className="text-3xl font-black neon-text-cyan">₹{totalPrice}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
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

              {/* PAYMENT ACTION BUTTON */}
              <button
                onClick={handleBookingSubmit}
                disabled={confirmLoading || !selectedSlot}
                className="w-full btn-neon-pink py-4 rounded-2xl font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-pink-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {confirmLoading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Processing Reservation...
                  </>
                ) : !isLoggedIn ? (
                  <>
                    <HiOutlineLockClosed className="w-5 h-5" />
                    Log In to Complete Reservation
                  </>
                ) : (
                  <>
                    <HiOutlineCreditCard className="w-5 h-5" />
                    PROCEED TO PAY — ₹{totalPrice}
                  </>
                )}
              </button>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-gray-400 hover:text-cyan-400 underline"
                >
                  Edit Vehicle or Schedule details
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* AI Voice Command Assistant Modal */}
      <AIVoiceBookingModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onApplyBooking={handleApplyVoiceBooking}
      />
    </div>
  );
};

export default BookParking;
