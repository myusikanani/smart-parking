import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineTruck,
  HiOutlineShoppingCart,
  HiOutlineBolt,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineLockClosed,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUserPlus,
  HiOutlineViewColumns,
  HiOutlineSquares2X2,
  HiOutlineRectangleGroup,
  HiOutlineMapPin,
  HiOutlineArrowRight
} from 'react-icons/hi2';
import { slotApi, layoutApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InteractiveFloorMap from '../components/InteractiveFloorMap';
import type { ParkingSlotItem } from '../components/InteractiveFloorMap';
import { socketService } from '../services/socketService';
import ThreeDParkingCanvas from '../components/ThreeDParkingCanvas';
import type { ThreeDSlotData, ThreeDLayoutItem, MovingVehicle } from '../components/ThreeDParkingCanvas';
import { getAISmartSlotRecommendation } from '../utils/aiRecommendation';

interface Slot {
  _id: string;
  number: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled' | string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
  floor: number;
  pricePerHour: number;
  pricePerDay?: number;
  features?: string[];
  x?: number;
  z?: number;
}

const categories = [
  { id: 'all', label: 'All Vehicles', icon: HiOutlineSquares2X2 },
  { id: 'four-wheeler', label: '4 Wheeler (Car)', icon: HiOutlineShoppingCart, desc: 'Cars & SUVs', price: '₹30/hr' },
  { id: 'two-wheeler', label: '2 Wheeler (Bike)', icon: HiOutlineTruck, desc: 'Bikes & Scooters', price: '₹10/hr' },
  { id: 'ev', label: 'EV Charging', icon: HiOutlineBolt, desc: 'Fast Electric Charge', price: '₹25/hr' },
  { id: 'disabled', label: 'Accessible (VIP)', icon: HiOutlineUser, desc: 'VIP Reserved', price: '₹15/hr' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const AvailableSlotsPublic = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [layoutItemsByFloor, setLayoutItemsByFloor] = useState<Record<number, ThreeDLayoutItem[]>>({});

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('available');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [highlightedSlotId, setHighlightedSlotId] = useState<string | null>(null);
  const [remoteMatchIds, setRemoteMatchIds] = useState<string[]>([]);
  const [movingVehicles, setMovingVehicles] = useState<MovingVehicle[]>([]);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await slotApi.getAll();
      const raw = (res.slots || []) as unknown as Record<string, unknown>[];
      const mapped: Slot[] = raw.map((s) => ({
        _id: String(s._id || s.id || ''),
        number: String(s.number || ''),
        category: String(s.category || 'four-wheeler'),
        status: String(s.status || 'available'),
        floor: Number(s.floor) || 1,
        pricePerHour: Number(s.pricePerHour) || (s.category === 'two-wheeler' ? 10 : s.category === 'ev' ? 25 : 30),
        pricePerDay: Number(s.pricePerDay) || 150,
        features: (s.features as string[]) || ['cctv', 'covered'],
        x: s.x !== undefined && s.x !== null ? Number(s.x) : undefined,
        z: s.z !== undefined && s.z !== null ? Number(s.z) : undefined,
      }));
      setSlots(mapped);

      // Load the real admin-designed layout (gates/lanes/zones) for every floor
      const floors = Array.from(new Set(mapped.map((s) => s.floor)));
      const layouts: Record<number, ThreeDLayoutItem[]> = {};
      await Promise.all(
        floors.map(async (floor) => {
          try {
            const res2 = await layoutApi.getByFloor(floor);
            const items = (res2.layout?.items || []) as Record<string, unknown>[];
            layouts[floor] = items
              .filter((it) => it.type !== 'slot')
              .map((it) => ({
                id: String(it.id || `${it.type}-${floor}`),
                type: String(it.type) as ThreeDLayoutItem['type'],
                x: Number(it.x) || 0,
                z: Number(it.z) || 0,
                rotation: Number(it.rotation) || 0,
                width: it.width !== undefined ? Number(it.width) : undefined,
                length: it.length !== undefined ? Number(it.length) : undefined,
                floor,
              }));
          } catch {
            // Layout is optional decoration — ignore floors without one
          }
        })
      );
      setLayoutItemsByFloor(layouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();

    socketService.connect();
    socketService.onSlotUpdate(({ slotId, status }) => {
      setSlots((prev) =>
        prev.map((s) => (s._id === slotId || s.number === slotId ? { ...s, status } : s))
      );
    });

    // Feature 8: animate the car driving in/out on realtime gate events
    let motionSeq = 0;
    socketService.onVehicleMotion(({ slotId, phase }) => {
      motionSeq += 1;
      setMovingVehicles((prev) => [
        ...prev,
        { id: `${slotId}-${phase}-${Date.now()}-${motionSeq}`, slotId, phase },
      ]);
    });

    return () => {
      socketService.off('slot-updated');
      socketService.off('vehicle-motion');
    };
  }, []);

  // Smart Search: query the backend so vehicle numbers & booking IDs also
  // resolve to physical slots (client filter alone can't do that).
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setRemoteMatchIds([]);
      setHighlightedSlotId(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await aiApi.searchSlots(q);
        const ids = (res.results || []).map((r) => String(r.id));
        setRemoteMatchIds(ids);
        // Pull any matched slots missing locally (e.g. occupied bays found by plate)
        const missing = (res.results || []).filter(
          (r) => !slots.some((s) => s._id === String(r.id))
        );
        if (missing.length) {
          setSlots((prev) => [
            ...prev,
            ...missing.map((r) => ({
              _id: String(r.id),
              number: String(r.number || ''),
              category: 'four-wheeler',
              status: String(r.status || 'available'),
              floor: Number(r.floor) || 1,
              pricePerHour: Number(r.price) || 30,
            })),
          ]);
        }
        setHighlightedSlotId(ids.length ? ids[0] : null);
      } catch {
        // Backend search unavailable — client-side filtering still applies
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Filtered Slots computation
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchesSearch =
        slot.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        slot.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        remoteMatchIds.includes(slot._id);
      // While searching we show every status so occupied bays found by
      // vehicle plate / booking id remain visible.
      const matchesStatus = searchQuery.trim() ? true : selectedStatus === 'all' || slot.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || slot.category === selectedCategory;
      const matchesFloor = selectedFloor === 'all' || String(slot.floor) === selectedFloor;
      return matchesSearch && matchesCategory && matchesFloor && matchesStatus;
    });
  }, [slots, searchQuery, selectedCategory, selectedFloor, selectedStatus, remoteMatchIds]);

  // Statistics
  const totalSlots = slots.length;
  const availableCount = slots.filter((s) => s.status === 'available').length;
  const evAvailable = slots.filter((s) => s.category === 'ev' && s.status === 'available').length;
  const bikeAvailable = slots.filter((s) => s.category === 'two-wheeler' && s.status === 'available').length;

  const handleSlotAction = (slot: Slot) => {
    if (user) {
      navigate('/book-parking', { state: { slotId: slot._id } });
    } else {
      navigate('/login', { state: { from: '/book-parking', slotId: slot._id } });
    }
  };

  const [mapMode, setMapMode] = useState<'3d' | '2d'>('3d');

  // Convert slots to 3D Canvas format — prefer the REAL x/z coordinates saved
  // by the Admin Layout Designer; fall back to a deterministic per-floor grid
  // only for seeded slots that were never placed on the map.
  const threeDSlots: ThreeDSlotData[] = useMemo(() => {
    const hasRealCoords = slots.some((s) => (s.x ?? 0) !== 0 || (s.z ?? 0) !== 0);
    const floorIndexCounters: Record<number, number> = {};
    return slots.map((s) => {
      let x = s.x ?? 0;
      let z = s.z ?? 0;
      if (!hasRealCoords || ((s.x ?? 0) === 0 && (s.z ?? 0) === 0)) {
        const idx = floorIndexCounters[s.floor] ?? 0;
        floorIndexCounters[s.floor] = idx + 1;
        x = (idx % 6) * 4 - 10;
        z = Math.floor(idx / 6) * 6 - 6;
      }
      return {
        id: s._id,
        number: s.number,
        category: s.category,
        status: s.status,
        floor: s.floor,
        pricePerHour: s.pricePerHour,
        x,
        z,
      };
    });
  }, [slots]);

  // AI Slot Recommendation Computation (Feature 4)
  const aiRecommendation = useMemo(() => {
    const formattedForAI = threeDSlots.map((s) => ({
      id: s.id,
      number: s.number,
      category: s.category,
      status: s.status,
      floor: s.floor,
      x: s.x,
      z: s.z,
    }));
    return getAISmartSlotRecommendation(formattedForAI, selectedCategory === 'all' ? 'four-wheeler' : selectedCategory);
  }, [threeDSlots, selectedCategory]);

  const getLocationHint = (slot: Slot) => {
    if (slot.category === 'ev') return `Floor ${slot.floor} · Zone B (EV Charging Plug)`;
    if (slot.category === 'two-wheeler') return `Floor ${slot.floor} · Zone C (2-Wheeler Strip)`;
    if (slot.category === 'disabled') return `Floor ${slot.floor} · Zone A (Near Elevator & Ramp)`;
    return `Floor ${slot.floor} · Zone A (Standard Bay)`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        
        {/* 1. HERO TITLE & STATS DASHBOARD */}
        <motion.div variants={itemVariants} className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
              <HiOutlineSparkles className="w-3.5 h-3.5" />
              <span>Real-Time Campus Slot Directory</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">
              Find Exact <span className="neon-text">Available Parking Spots</span>
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              Check live bay availability, floor locations, EV charging status, and hourly rates in real time.
            </p>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)] relative z-10">
            <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase block">Open Slots</span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                {availableCount} <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </span>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase block">EV Chargers</span>
              <span className="text-2xl font-extrabold text-cyan-400 font-mono mt-0.5">
                {evAvailable} Free
              </span>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase block">2-Wheeler Bays</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5">
                {bikeAvailable} Free
              </span>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase block">Total Capacity</span>
              <span className="text-2xl font-extrabold text-[var(--text)] font-mono mt-0.5">
                {totalSlots} Bays
              </span>
            </div>
          </div>
        </motion.div>

        {/* FEATURE 4: AI SMART SLOT RECOMMENDATION CARD BANNER */}
        {aiRecommendation.recommendedSlotNumber && (
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-cyan-950/60 border-2 border-blue-500/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden"
          >
            <div className="space-y-1.5 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-xs border border-blue-400/40">
                ⭐ AI Recommended Parking Slot
              </div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                Optimal Bay: <span className="text-blue-400 font-mono text-2xl font-black">{aiRecommendation.recommendedSlotNumber}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {aiRecommendation.reasons.map((r, idx) => (
                  <span key={idx} className="text-[11px] font-semibold text-cyan-200 bg-cyan-500/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const recSlot = slots.find((s) => s.number === aiRecommendation.recommendedSlotNumber || s._id === aiRecommendation.recommendedSlotId);
                if (recSlot) handleSlotAction(recSlot);
              }}
              className="btn-neon px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/30 whitespace-nowrap z-10"
            >
              Reserve AI Choice <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* 2. 3D INTERACTIVE PARKING MAP VISUALIZER (FEATURE 1 & 3) */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
              <HiOutlineRectangleGroup className="w-5 h-5 text-cyan-400" />
              Interactive Campus Parking Layout Map
            </h3>

            {/* 3D vs 2D Toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
              <button
                onClick={() => setMapMode('3d')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  mapMode === '3d' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-[var(--text-secondary)]'
                }`}
              >
                🎮 3D WebGL Map
              </button>
              <button
                onClick={() => setMapMode('2d')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  mapMode === '2d' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-[var(--text-secondary)]'
                }`}
              >
                🗺️ 2D Plan
              </button>
            </div>
          </div>

          {mapMode === '3d' ? (
            <ThreeDParkingCanvas
              slots={threeDSlots}
              recommendedSlotId={aiRecommendation.recommendedSlotId}
              highlightedSlotId={highlightedSlotId}
              layoutItems={
                selectedFloor === 'all'
                  ? Object.values(layoutItemsByFloor).flat()
                  : layoutItemsByFloor[Number(selectedFloor)] || []
              }
              activeFloor={selectedFloor === 'all' ? undefined : Number(selectedFloor)}
              movingVehicles={movingVehicles}
              onMotionComplete={(id) =>
                setMovingVehicles((prev) => prev.filter((v) => v.id !== id))
              }
              onSelectSlot={(s) => {
                const matched = slots.find((sl) => sl._id === s.id || sl.number === s.number);
                if (matched) handleSlotAction(matched);
              }}
            />
          ) : (
            <InteractiveFloorMap
              slots={slots.map((s) => ({
                _id: s._id,
                number: s.number,
                category: s.category,
                floor: s.floor,
                status: s.status as ParkingSlotItem['status'],
                pricePerHour: s.pricePerHour,
              }))}
              selectedSlotId={null}
              onSelectSlot={(slot) => handleSlotAction(slot as unknown as Slot)}
              onRefresh={fetchSlots}
            />
          )}
        </motion.div>

        {/* 3. SEARCH & SMART FILTER BAR */}
        <motion.div variants={itemVariants} className="glass-card p-6 rounded-3xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search slot number (e.g. A-01, B-02, EV)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-cyan-500 shadow-sm"
              />
            </div>

            {/* Filter Controls Group */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              
              {/* Floor Filter */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
                <span className="px-2 text-[11px] font-bold text-[var(--text-secondary)] uppercase">Floor:</span>
                {['all', '1', '2', '3'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFloor(f)}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      selectedFloor === f
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {f === 'all' ? 'All' : `F${f}`}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
                {['available', 'all'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1 rounded-lg font-semibold transition capitalize ${
                      selectedStatus === st
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                    }`}
                  >
                    {st === 'available' ? 'Available Only' : 'All Status'}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-[var(--text-secondary)]'
                  }`}
                  title="Grid View"
                >
                  <HiOutlineSquares2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-[var(--text-secondary)]'
                  }`}
                  title="List View"
                >
                  <HiOutlineViewColumns className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Vehicle Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[var(--border)]">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* 4. SLOT DIRECTORY (GRID / LIST VIEW) */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card h-36 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
              {error}
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="p-10 text-center text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)]">
              No matching parking slots found for your selected search and filters.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSlots.map((slot) => {
                const isAvail = slot.status === 'available';
                return (
                  <div
                    key={slot._id}
                    className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                      isAvail
                        ? 'bg-[var(--bg-card)] border-emerald-500/30 hover:border-emerald-400 hover:shadow-xl shadow-sm'
                        : 'bg-[var(--bg-elevated)] border-red-500/20 opacity-60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 font-mono font-extrabold text-sm flex items-center justify-center border border-cyan-500/20">
                          {slot.number}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-[var(--text)] block capitalize">
                            {slot.category.replace('-', ' ')}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                            <HiOutlineMapPin className="w-3 h-3 text-cyan-400" /> Floor {slot.floor}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono tracking-wider uppercase border ${
                        isAvail
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30'
                      }`}>
                        {slot.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        📍 {getLocationHint(slot)}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="text-[var(--text-secondary)] text-[11px]">Hourly Rate:</span>
                        <span className="font-bold text-sm text-[var(--text)] font-mono">₹{slot.pricePerHour}/hr</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => isAvail && handleSlotAction(slot)}
                      disabled={!isAvail}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                        isAvail
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] cursor-not-allowed'
                      }`}
                    >
                      {isAvail ? (
                        <>
                          Reserve This Bay <HiOutlineArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        'Bay Occupied'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW TABLE */
            <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                  <tr>
                    <th className="p-3.5">Slot Number</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Floor & Location</th>
                    <th className="p-3.5">Hourly Rate</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredSlots.map((slot) => {
                    const isAvail = slot.status === 'available';
                    return (
                      <tr key={slot._id} className="hover:bg-cyan-500/5 transition">
                        <td className="p-3.5 font-mono font-bold text-sm text-cyan-400">{slot.number}</td>
                        <td className="p-3.5 capitalize font-medium text-[var(--text)]">{slot.category.replace('-', ' ')}</td>
                        <td className="p-3.5 text-[var(--text-secondary)]">Floor {slot.floor} &middot; {getLocationHint(slot)}</td>
                        <td className="p-3.5 font-mono font-bold text-[var(--text)]">₹{slot.pricePerHour}/hr</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isAvail ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {slot.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => isAvail && handleSlotAction(slot)}
                            disabled={!isAvail}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              isAvail
                                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] cursor-not-allowed'
                            }`}
                          >
                            {isAvail ? 'Book Bay' : 'Occupied'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* 5. CALL TO ACTION BANNER FOR UNREGISTERED USERS */}
        {!user && (
          <motion.div variants={itemVariants} className="glass-card p-8 rounded-3xl border border-cyan-500/40 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-400 shadow-lg shadow-cyan-500/20">
              <HiOutlineLockClosed className="w-7 h-7" />
            </div>

            <div className="max-w-xl mx-auto space-y-1">
              <h2 className="text-2xl font-extrabold text-[var(--text)]">Ready to Lock Your Parking Spot?</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Sign in to select your exact bay on the live map, generate your entry QR code, and enjoy 100% paperless parking.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              <button
                onClick={() => navigate('/login', { state: { from: '/book-parking' } })}
                className="btn-neon w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                Sign In to Reserve
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-outline w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <HiOutlineUserPlus className="w-4 h-4 text-pink-400" />
                Register New Driver Account
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AvailableSlotsPublic;
