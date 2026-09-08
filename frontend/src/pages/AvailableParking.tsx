import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  HiOutlineFunnel,
  HiOutlineArrowsUpDown,
} from 'react-icons/hi2';
import { slotApi } from '../services/api';
import Modal from '../components/ui/Modal';

interface Slot {
  id: string;
  number: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled' | string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
  floor: number;
  pricePerHour: number;
  features?: string[];
}

const categoryIcons: Record<string, typeof HiOutlineTruck> = {
  'two-wheeler': HiOutlineTruck,
  'four-wheeler': HiOutlineShoppingCart,
  'ev': HiOutlineBolt,
  'disabled': HiOutlineUser,
};

const categoryColors: Record<string, string> = {
  'two-wheeler': 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  'four-wheeler': 'bg-pink-500/10 border-pink-500/30 text-pink-400',
  'ev': 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  'disabled': 'bg-purple-500/10 border-purple-500/30 text-purple-400',
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

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await slotApi.getAll();
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
        return {
          id: String(s._id || s.id || ''),
          number: String(s.number || ''),
          category: cat,
          status: String(s.status || 'available'),
          floor: Number(s.floor) || 1,
          pricePerHour: price,
          features: (s.features as string[]) || (cat === 'ev' ? ['50kW Fast Charging', 'CCTV Covered'] : cat === 'disabled' ? ['Elevator Ramp', 'VIP Reserved'] : ['24/7 Security', 'Covered Spot']),
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
  }, []);

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
        if (search && !slot.number.toLowerCase().includes(search.toLowerCase()) && !slot.category.toLowerCase().includes(search.toLowerCase())) {
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

  const handleSlotClick = (slot: Slot) => {
    if (slot.status === 'available') {
      setSelectedSlotModal(slot);
    } else {
      navigate(`/parking/${slot.id}`);
    }
  };

  const handleProceedToBook = (slot: Slot) => {
    navigate('/book-parking', { state: { preSelectedSlotId: slot.id, category: slot.category } });
  };

  const filterSelectClass =
    'px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-secondary)] focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.15)] focus:outline-none transition-all';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* 1. SMART SEARCH CONSOLE HEADER */}
      <motion.div variants={itemVariants} className="relative overflow-hidden glass-card-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-cyan-500/10 via-purple-500/5 to-transparent pointer-events-none blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300 mb-3">
              <HiOutlineSparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>AI Search Engine & Smart Recommender</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Smart Parking <span className="neon-text">Search Console</span>
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xl">
              Filter by vehicle type, floor location, max price, or use AI quick presets to find the best available parking bay in seconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl glass border border-emerald-500/30 text-right">
              <p className="text-2xl font-extrabold text-emerald-400">{availableCount}</p>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Open Spots Now</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/live-map')}
              className="btn-outline px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2"
            >
              <HiOutlineMapPin className="w-4 h-4 text-cyan-400" />
              View 3D Map
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. AI PRESET SMART RECOMMENDATION CHIPS */}
      <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <HiOutlineSparkles className="w-4 h-4 text-amber-400" />
            AI Recommended Quick Presets
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

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleApplyPreset('entrance')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              activePreset === 'entrance'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'glass hover:border-cyan-500/50 text-cyan-300'
            }`}
          >
            <span>🚪</span> Near Entrance (Floor 1)
          </button>

          <button
            onClick={() => handleApplyPreset('ev')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              activePreset === 'ev'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'glass hover:border-emerald-500/50 text-emerald-300'
            }`}
          >
            <span>⚡</span> Fast EV Charging Bays
          </button>

          <button
            onClick={() => handleApplyPreset('budget')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              activePreset === 'budget'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'glass hover:border-amber-500/50 text-amber-300'
            }`}
          >
            <span>💰</span> Budget Friendly (Lowest Rates)
          </button>

          <button
            onClick={() => handleApplyPreset('accessible')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              activePreset === 'accessible'
                ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'glass hover:border-purple-500/50 text-purple-300'
            }`}
          >
            <span>♿</span> VIP Accessible Spot
          </button>
        </div>
      </motion.div>

      {/* 3. MULTI-CRITERIA SEARCH & FILTER BAR */}
      <motion.div variants={itemVariants} className="glass-card p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search slot number (e.g. A-01, Floor 2)..."
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
            <option value="all">All Floor Levels</option>
            <option value="1">Floor 1 (Ground)</option>
            <option value="2">Floor 2 (EV Zone)</option>
            <option value="3">Floor 3 (VIP Deck)</option>
          </select>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <HiOutlineArrowsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`${filterSelectClass} w-full`}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="floor-asc">Floor: Ground First</option>
              <option value="slot-asc">Slot Number: A-Z</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-gray-400">
          <span>Showing <strong className="text-white">{filtered.length}</strong> matching bays</span>

          <div className="flex items-center gap-2">
            <span className="mr-1">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border border-white/10 rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="available" className="bg-slate-900">Available Only</option>
              <option value="occupied" className="bg-slate-900">Occupied Only</option>
              <option value="reserved" className="bg-slate-900">Reserved Only</option>
            </select>

            <div className="flex gap-1 glass rounded-lg p-1 ml-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}
                title="Grid View"
              >
                <HiOutlineSquares2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500'}`}
                title="Table Comparison View"
              >
                <HiOutlineViewColumns className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. RESULTS DISPLAY (GRID OR LIST) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card h-48 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl space-y-3">
          <HiOutlineFunnel className="w-12 h-12 text-cyan-400/40 mx-auto" />
          <h3 className="text-lg font-bold text-white">No parking bays matched your filter</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try resetting your search query, changing vehicle category, or selecting "All Statuses".
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('all');
              setFloorFilter('all');
              setStatusFilter('all');
              setActivePreset(null);
            }}
            className="btn-neon text-xs px-4 py-2 rounded-xl font-bold mt-2"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((slot) => {
            const Icon = categoryIcons[slot.category] || HiOutlineShoppingCart;
            const colorClass = categoryColors[slot.category] || 'bg-white/5 border-white/10 text-gray-400';
            const isAvail = slot.status === 'available';

            return (
              <div
                key={slot.id}
                onClick={() => handleSlotClick(slot)}
                className={`glass-card p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:border-cyan-500/50 flex flex-col justify-between ${
                  isAvail ? 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[slot.status] || 'badge-gray'}`}>
                      {slot.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-extrabold text-white">Slot #{slot.number}</h3>
                    <span className="text-xs font-bold text-gray-400">Floor {slot.floor}</span>
                  </div>

                  <p className="text-xs text-gray-400 capitalize mt-0.5">{slot.category.replace('-', ' ')}</p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {slot.features?.slice(0, 2).map((feat, fIdx) => (
                      <span key={fIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Rate</span>
                    <span className="font-extrabold neon-text-cyan text-lg">₹{slot.pricePerHour}/hr</span>
                  </div>
                  {isAvail ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleProceedToBook(slot); }}
                      className="btn-neon text-xs px-3.5 py-2 rounded-xl font-bold"
                    >
                      Reserve Now
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 font-medium">Details &rarr;</span>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs text-gray-400 font-semibold uppercase">
                  <th className="px-4 py-3">Slot #</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Amenities</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((slot) => (
                  <tr key={slot.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="px-4 py-3.5 font-extrabold text-cyan-300">Slot #{slot.number}</td>
                    <td className="px-4 py-3.5 text-gray-300 capitalize">{slot.category.replace('-', ' ')}</td>
                    <td className="px-4 py-3.5 text-gray-400">Floor {slot.floor}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        {slot.features?.map((f, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-emerald-400">₹{slot.pricePerHour}/hr</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[slot.status] || 'badge-gray'}`}>
                        {slot.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {slot.status === 'available' ? (
                        <button
                          onClick={() => handleProceedToBook(slot)}
                          className="btn-neon text-xs px-3.5 py-1.5 rounded-xl font-bold"
                        >
                          Book Now
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSlotClick(slot)}
                          className="btn-outline text-xs px-3 py-1 rounded-xl"
                        >
                          View Info
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* INSTANT SLOT RESERVATION POPUP MODAL */}
      {selectedSlotModal && (
        <Modal
          isOpen={Boolean(selectedSlotModal)}
          onClose={() => setSelectedSlotModal(null)}
          title={`Reserve Slot #${selectedSlotModal.number}`}
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Selected Bay</p>
                <p className="text-xl font-extrabold text-cyan-300">Slot #{selectedSlotModal.number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Hourly Rate</p>
                <p className="text-lg font-bold text-emerald-400">₹{selectedSlotModal.pricePerHour}/hr</p>
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1.5">
              <p>Category: <span className="text-white font-semibold capitalize">{selectedSlotModal.category}</span></p>
              <p>Floor Location: <span className="text-white font-semibold">Floor {selectedSlotModal.floor}</span></p>
              <p>Amenities: <span className="text-cyan-300 font-medium">{selectedSlotModal.features?.join(', ') || 'Covered, CCTV'}</span></p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleProceedToBook(selectedSlotModal)}
                className="btn-neon-pink flex-1 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <HiOutlineCheckCircle className="w-5 h-5" />
                Proceed to Reservation
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default AvailableParking;
