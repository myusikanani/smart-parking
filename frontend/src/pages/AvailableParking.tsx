import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineTruck,
  HiOutlineShoppingCart,
  HiOutlineBolt,
  HiOutlineUser,
  HiOutlineViewColumns,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineMapPin,
  HiOutlineBuildingStorefront,
  HiOutlineFunnel,
  HiOutlineArrowsUpDown,
} from 'react-icons/hi2';
import { slotApi, locationApi } from '../services/api';
import type { ParkingLocationItem } from '../services/api';
import Modal from '../components/ui/Modal';
import NearbyParkingFinder from '../components/NearbyParkingFinder';

interface Slot {
  id: string;
  number: string;
  locationId?: string;
  locationName?: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled' | string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
  floor: number;
  pricePerHour: number;
  features?: string[];
}

const categoryIcons: Record<string, typeof HiOutlineTruck> = {
  'two-wheeler': HiOutlineTruck,
  'four-wheeler': HiOutlineShoppingCart,
  ev: HiOutlineBolt,
  disabled: HiOutlineUser,
};

const categoryColors: Record<string, string> = {
  'two-wheeler': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'four-wheeler': 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  ev: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  disabled: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
};

const statusBadge: Record<string, string> = {
  available: 'badge-green',
  occupied: 'badge-red',
  reserved: 'badge-orange',
  maintenance: 'badge-gray',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const AvailableParking = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLocParam = searchParams.get('locationId') || 'all';

  const [locations, setLocations] = useState<ParkingLocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocParam);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'floor-asc' | 'slot-asc'>('price-asc');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSlotModal, setSelectedSlotModal] = useState<Slot | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const slotSectionRef = useRef<HTMLDivElement>(null);

  // Fetch Locations list
  useEffect(() => {
    locationApi
      .getAll({ all: 'true' })
      .then((res) => setLocations(res.locations || []))
      .catch((err) => console.error('Error fetching locations:', err));
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedLocationId !== 'all') params.locationId = selectedLocationId;

      const response = await slotApi.getAll(params);
      const raw = (response?.slots ?? []) as unknown as Record<string, unknown>[];
      const mapped: Slot[] = raw.map((s) => {
        const cat = String(s.category || 'four-wheeler');
        let price = Number(s.pricePerHour);
        if (!price || isNaN(price)) {
          if (cat === 'two-wheeler') price = 15;
          else if (cat === 'ev') price = 40;
          else if (cat === 'disabled') price = 20;
          else price = 30;
        }
        const locObj = s.locationId as Record<string, unknown> | undefined;
        return {
          id: String(s._id || s.id || ''),
          number: String(s.number || ''),
          locationId: locObj?._id ? String(locObj._id) : undefined,
          locationName: locObj?.name ? String(locObj.name) : String(s.location || ''),
          category: cat,
          status: String(s.status || 'available'),
          floor: Number(s.floor) || 1,
          pricePerHour: price,
          features:
            (s.features as string[]) ||
            (cat === 'ev'
              ? ['50kW Fast Charging', 'CCTV Covered']
              : cat === 'disabled'
              ? ['Elevator Ramp', 'VIP Reserved']
              : ['24/7 Security', 'Covered Spot']),
        };
      });
      setSlots(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch parking slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedLocationId]);

  const handleLocationChange = (locId: string) => {
    setSelectedLocationId(locId);
    if (locId === 'all') {
      searchParams.delete('locationId');
    } else {
      searchParams.set('locationId', locId);
    }
    setSearchParams(searchParams);
  };

  const handleSelectFromNearby = (loc: ParkingLocationItem) => {
    handleLocationChange(loc._id);
    if (slotSectionRef.current) {
      slotSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    if (activePreset === presetKey) {
      setActivePreset(null);
      setCategoryFilter('all');
      setFloorFilter('all');
      setStatusFilter('all');
      setSortBy('price-asc');
      setSearch('');
      return;
    }

    setActivePreset(presetKey);
    if (presetKey === 'ev') {
      setCategoryFilter('ev');
      setStatusFilter('available');
      setFloorFilter('all');
    } else if (presetKey === 'entrance') {
      setFloorFilter('1');
      setStatusFilter('available');
      setCategoryFilter('all');
    } else if (presetKey === 'budget') {
      setCategoryFilter('all');
      setFloorFilter('all');
      setStatusFilter('available');
      setSortBy('price-asc');
    } else if (presetKey === 'accessible') {
      setCategoryFilter('disabled');
      setStatusFilter('available');
      setFloorFilter('all');
    }
  };

  const filtered = useMemo(() => {
    return slots
      .filter((slot) => {
        if (
          search &&
          !slot.number.toLowerCase().includes(search.toLowerCase()) &&
          !slot.category.toLowerCase().includes(search.toLowerCase()) &&
          !(slot.locationName && slot.locationName.toLowerCase().includes(search.toLowerCase()))
        ) {
          return false;
        }
        if (categoryFilter !== 'all' && slot.category !== categoryFilter) return false;
        if (floorFilter !== 'all' && String(slot.floor) !== floorFilter) return false;
        if (statusFilter !== 'all' && slot.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.pricePerHour - b.pricePerHour;
        if (sortBy === 'price-desc') return b.pricePerHour - a.pricePerHour;
        if (sortBy === 'floor-asc') return a.floor - b.floor;
        if (sortBy === 'slot-asc') return a.number.localeCompare(b.number);
        return 0;
      });
  }, [slots, search, categoryFilter, floorFilter, statusFilter, sortBy]);

  const availableCount = slots.filter((s) => s.status === 'available').length;
  const currentLocationDoc = locations.find((l) => l._id === selectedLocationId);

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === 'available') {
      setSelectedSlotModal(slot);
    } else {
      navigate(`/parking/${slot.id}`);
    }
  };

  const handleProceedToBook = (slot: Slot) => {
    navigate('/book-parking', {
      state: {
        preSelectedSlotId: slot.id,
        category: slot.category,
        locationId: slot.locationId || selectedLocationId !== 'all' ? selectedLocationId : undefined,
      },
    });
  };

  const filterSelectClass =
    'px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-secondary)] focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.15)] focus:outline-none transition-all';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 pb-16">
      {/* 1. FIND PARKING NEAR YOU (GPS / AREA SEARCH WITH SMART RECOMMENDATION) */}
      <NearbyParkingFinder
        selectedLocationId={selectedLocationId !== 'all' ? selectedLocationId : undefined}
        onSelectLocation={handleSelectFromNearby}
      />

      {/* 2. SPECIFIC FACILITY BAYS CONSOLE */}
      <div ref={slotSectionRef} className="space-y-6 pt-4">
        <motion.div
          variants={itemVariants}
          className="glass-card-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30 relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-2">
                <HiOutlineBuildingStorefront className="w-4 h-4 text-cyan-400" />
                <span>
                  {currentLocationDoc ? `${currentLocationDoc.name} (${currentLocationDoc.area})` : 'All Facilities & Bays'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Live Parking Bay <span className="neon-text">Explorer</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
                Filter by vehicle type, floor location, max price, or use AI quick presets to find the best available parking bay.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-3 rounded-2xl glass border border-emerald-500/30 text-right">
                <p className="text-2xl font-extrabold text-emerald-400">{availableCount}</p>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Open Spots Now</p>
              </div>
              <button
                onClick={() => navigate('/book-parking')}
                className="btn-neon px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"
              >
                <span>Book a Bay</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Quick Presets */}
        <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <HiOutlineSparkles className="w-4 h-4 text-amber-400" />
              Quick Presets
            </p>
            {activePreset && (
              <button
                onClick={() => handleApplyPreset(activePreset)}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Clear Preset
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => handleApplyPreset('entrance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activePreset === 'entrance'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'glass hover:border-cyan-500/50 text-cyan-300'
              }`}
            >
              <span>🚪</span> Floor 1 (Ground)
            </button>

            <button
              onClick={() => handleApplyPreset('ev')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activePreset === 'ev'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'glass hover:border-emerald-500/50 text-emerald-300'
              }`}
            >
              <span>⚡</span> EV Fast Charging
            </button>

            <button
              onClick={() => handleApplyPreset('budget')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activePreset === 'budget'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'glass hover:border-amber-500/50 text-amber-300'
              }`}
            >
              <span>💰</span> Lowest Rates
            </button>

            <button
              onClick={() => handleApplyPreset('accessible')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activePreset === 'accessible'
                  ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'glass hover:border-purple-500/50 text-purple-300'
              }`}
            >
              <span>♿</span> VIP Accessible
            </button>
          </div>
        </motion.div>

        {/* Filter Controls Bar with Location Switcher */}
        <motion.div variants={itemVariants} className="glass-card p-4 rounded-2xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Facility Selector */}
            <div className="lg:col-span-2">
              <select
                value={selectedLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className={`${filterSelectClass} w-full font-semibold text-cyan-300`}
              >
                <option value="all">🏢 All Locations & Malls</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name} ({l.area})
                  </option>
                ))}
              </select>
            </div>

            {/* Text Search */}
            <div className="relative lg:col-span-2">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="Search bay number (e.g. A-C1A)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-neon w-full pl-10 pr-4 py-2.5 text-sm rounded-xl"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="all">All Categories</option>
              <option value="four-wheeler">Four Wheeler (Car)</option>
              <option value="two-wheeler">Two Wheeler (Bike)</option>
              <option value="ev">EV Charging</option>
              <option value="disabled">Accessible / VIP</option>
            </select>

            {/* Floor Filter */}
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-gray-400">
            <span>
              Showing <strong className="text-white">{filtered.length}</strong> bays
            </span>

            <div className="flex items-center gap-2">
              <span className="mr-1">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>

              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}
                >
                  <HiOutlineSquares2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}
                >
                  <HiOutlineViewColumns className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Slot Grid View */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-44 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center glass rounded-3xl">
            <HiOutlineBuildingStorefront className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No parking bays found</h3>
            <p className="text-xs text-gray-400 mt-1">
              Try choosing another facility or adjusting your category/floor filters.
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3'
            }
          >
            {filtered.map((slot) => {
              const Icon = categoryIcons[slot.category] || HiOutlineShoppingCart;
              const colorClass = categoryColors[slot.category] || 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';

              return (
                <motion.div
                  key={slot.id}
                  layout
                  onClick={() => handleSlotClick(slot)}
                  className={`glass-card group p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between border ${
                    slot.status === 'available'
                      ? 'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'
                      : 'opacity-70 border-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Bay {slot.number}</p>
                          <p className="text-xs text-gray-400">Floor {slot.floor}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge[slot.status] || 'badge-gray'}`}>
                        {slot.status}
                      </span>
                    </div>

                    {slot.locationName && (
                      <p className="text-[11px] text-gray-400 truncate mb-2 flex items-center gap-1">
                        <HiOutlineBuildingStorefront className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{slot.locationName}</span>
                      </p>
                    )}

                    <div className="mt-2 p-2 rounded-xl bg-gray-900/60 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Hourly Rate:</span>
                      <span className="font-extrabold text-cyan-400">₹{slot.pricePerHour}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      {slot.status === 'available' ? '✓ Instant Book' : '🔒 Occupied'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProceedToBook(slot);
                      }}
                      disabled={slot.status !== 'available'}
                      className="btn-neon px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-30"
                    >
                      Book Now
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slot Details Modal */}
      {selectedSlotModal && (
        <Modal isOpen={Boolean(selectedSlotModal)} onClose={() => setSelectedSlotModal(null)} title={`Bay ${selectedSlotModal.number} Details`}>
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-2">
              {selectedSlotModal.locationName && (
                <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                  <HiOutlineBuildingStorefront className="w-4 h-4" />
                  {selectedSlotModal.locationName}
                </p>
              )}
              <p className="text-white font-bold">Bay Number: {selectedSlotModal.number}</p>
              <p className="text-gray-300">Floor: Level {selectedSlotModal.floor}</p>
              <p className="text-gray-300 capitalize">Category: {selectedSlotModal.category.replace('-', ' ')}</p>
              <p className="text-emerald-400 font-bold">Rate: ₹{selectedSlotModal.pricePerHour} / Hour</p>
            </div>

            <button
              onClick={() => {
                const s = selectedSlotModal;
                setSelectedSlotModal(null);
                handleProceedToBook(s);
              }}
              className="btn-neon w-full py-3 rounded-xl font-bold text-sm"
            >
              Proceed to Reserve Bay
            </button>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default AvailableParking;
