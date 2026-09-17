import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlinePower,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineBuildingStorefront,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { slotApi, locationApi } from '../../services/api';
import type { ParkingLocationItem } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface AdminSlot {
  id: string;
  number: string;
  floor: number;
  locationId?: string;
  locationName?: string;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
}

const emptySlot: AdminSlot = {
  id: '',
  number: '',
  floor: 1,
  locationId: '',
  category: 'four-wheeler',
  status: 'available',
  hourlyRate: 30,
  dailyRate: 150,
  monthlyRate: 3000,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const categoryIcon = (cat: string) => {
  const colors: Record<string, string> = {
    'two-wheeler': 'text-purple-400 border-purple-500/40',
    'four-wheeler': 'text-pink-400 border-pink-500/40',
    ev: 'text-green-400 border-green-500/40',
    disabled: 'text-cyan-400 border-cyan-500/40',
  };
  const labels: Record<string, string> = {
    'two-wheeler': '2W',
    'four-wheeler': '4W',
    ev: 'EV',
    disabled: 'DA',
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border ${
        colors[cat] || 'text-gray-400 border-gray-500/40'
      }`}
    >
      {labels[cat] || cat}
    </span>
  );
};

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; label: string }> = {
    available: { className: 'badge-green', label: 'Available' },
    occupied: { className: 'badge-red', label: 'Occupied' },
    reserved: { className: 'badge-neon', label: 'Reserved' },
    maintenance: { className: 'badge-gray', label: 'Maintenance' },
  };
  const s = map[status] || { className: 'badge-gray', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
};

const ManageSlots = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLocParam = searchParams.get('locationId') || 'all';

  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [locations, setLocations] = useState<ParkingLocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState<AdminSlot>(emptySlot);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Load list of available locations
  useEffect(() => {
    locationApi
      .getAll({ all: 'true' })
      .then((res) => {
        setLocations(res.locations || []);
      })
      .catch((err) => console.error('Error fetching locations:', err));
  }, []);

  const fetchSlots = () => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (selectedLocationId !== 'all') params.locationId = selectedLocationId;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (floorFilter !== 'all') params.floor = floorFilter;
    if (statusFilter !== 'all') params.status = statusFilter;

    slotApi
      .getAll(params)
      .then((res) => {
        const mapped = (res.slots || []).map((s: Record<string, unknown>) => {
          const locObj = s.locationId as Record<string, unknown> | undefined;
          return {
            id: String(s._id || s.id),
            number: String(s.number || ''),
            floor: Number(s.floor ?? 1),
            locationId: locObj?._id ? String(locObj._id) : typeof s.locationId === 'string' ? s.locationId : undefined,
            locationName: locObj?.name ? String(locObj.name) : String(s.location || ''),
            category: (s.category || 'four-wheeler') as AdminSlot['category'],
            status: (s.status || 'available') as AdminSlot['status'],
            hourlyRate: Number(s.pricePerHour ?? s.hourlyRate ?? 30),
            dailyRate: Number(s.pricePerDay ?? s.dailyRate ?? 150),
            monthlyRate: Number(s.pricePerMonth ?? s.monthlyRate ?? 3000),
          };
        });
        setSlots(mapped);
      })
      .catch((err) => setError(err?.message || 'Failed to load slots'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedLocationId, categoryFilter, floorFilter, statusFilter]);

  const handleLocationChange = (locId: string) => {
    setSelectedLocationId(locId);
    if (locId === 'all') {
      searchParams.delete('locationId');
    } else {
      searchParams.set('locationId', locId);
    }
    setSearchParams(searchParams);
  };

  const openAdd = () => {
    setEditSlot({
      ...emptySlot,
      locationId: selectedLocationId !== 'all' ? selectedLocationId : locations[0]?._id || '',
    });
    setIsNew(true);
    setShowModal(true);
  };

  const openEdit = (slot: AdminSlot) => {
    setEditSlot({ ...slot });
    setIsNew(false);
    setShowModal(true);
  };

  const handleSave = () => {
    setSaving(true);
    const locItem = locations.find((l) => l._id === editSlot.locationId);
    const payload: Record<string, unknown> = {
      number: editSlot.number,
      floor: editSlot.floor,
      locationId: editSlot.locationId || undefined,
      location: locItem ? `${locItem.name} (${locItem.area})` : undefined,
      category: editSlot.category,
      status: editSlot.status,
      pricePerHour: editSlot.hourlyRate,
      pricePerDay: editSlot.dailyRate,
      pricePerMonth: editSlot.monthlyRate,
    };

    const promise = isNew ? slotApi.create(payload) : slotApi.update(editSlot.id, payload);
    promise
      .then(() => {
        setShowModal(false);
        fetchSlots();
      })
      .catch((err) => setError(err?.message || 'Failed to save slot'))
      .finally(() => setSaving(false));
  };

  const handleToggleStatus = (slot: AdminSlot) => {
    const newStatus = slot.status === 'maintenance' ? 'available' : 'maintenance';
    slotApi
      .updateStatus(slot.id, newStatus)
      .then(() => fetchSlots())
      .catch((err) => setError(err?.message || 'Failed to toggle status'));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    slotApi
      .delete(id)
      .then(() => fetchSlots())
      .catch((err) => setError(err?.message || 'Failed to delete slot'));
  };

  const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
    <button
      onClick={() => setter(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        current === value
          ? 'btn-neon'
          : 'text-gray-400 hover:text-white border border-white/10 hover:border-cyan-500/30 bg-white/[0.03] hover:bg-cyan-500/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#06b6d4" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text flex items-center gap-2">
              <HiOutlineBuildingStorefront className="w-7 h-7 text-cyan-400" />
              Manage Parking Slots
            </h1>
            <p className="text-gray-400 mt-1">
              View, add, and manage slot allocations across all facilities and floors.
            </p>
          </div>
          <button onClick={openAdd} className="btn-neon flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm">
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add Slot
          </button>
        </motion.div>

        {/* Location & Filter Selector */}
        <motion.div variants={itemVariants} className="glass p-4 rounded-2xl space-y-3">
          {/* Location Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-3 border-b border-gray-800">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <HiOutlineMapPin className="w-4 h-4" />
              Facility / Mall:
            </span>
            <select
              value={selectedLocationId}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="flex-1 max-w-md px-3.5 py-2 bg-gray-900 border border-cyan-500/30 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="all">🏢 All Locations & Malls (City-Wide)</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} — {l.area}
                </option>
              ))}
            </select>

            {selectedLocationId !== 'all' && (
              <button
                onClick={() => handleLocationChange('all')}
                className="text-xs text-gray-400 hover:text-white underline ml-auto"
              >
                Clear Location Filter
              </button>
            )}
          </div>

          {/* Category, Floor, Status Filters */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Category:</span>
              {[
                { label: 'All', value: 'all' },
                { label: '4W Car', value: 'four-wheeler' },
                { label: '2W Bike', value: 'two-wheeler' },
                { label: '⚡ EV', value: 'ev' },
                { label: '♿ VIP', value: 'disabled' },
              ].map((f) => (
                <span key={f.value}>{filterBtn(f.label, f.value, categoryFilter, setCategoryFilter)}</span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Floor:</span>
              {[
                { label: 'All', value: 'all' },
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3', value: '3' },
              ].map((f) => (
                <span key={f.value}>{filterBtn(f.label, f.value, floorFilter, setFloorFilter)}</span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Status:</span>
              {[
                { label: 'All', value: 'all' },
                { label: 'Available', value: 'available' },
                { label: 'Occupied', value: 'occupied' },
                { label: 'Reserved', value: 'reserved' },
                { label: 'Maintenance', value: 'maintenance' },
              ].map((f) => (
                <span key={f.value}>{filterBtn(f.label, f.value, statusFilter, setStatusFilter)}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </motion.div>
        )}

        {/* Slot Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-40 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="p-12 text-center glass rounded-2xl">
            <HiOutlineBuildingStorefront className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">No parking slots found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {selectedLocationId !== 'all'
                ? 'No slots exist for this selected location. Click "Add Slot" to create one.'
                : 'Try adjusting your filters or add a new slot.'}
            </p>
            <button onClick={openAdd} className="btn-neon mt-4 px-4 py-2 rounded-xl text-sm font-semibold">
              Add Slot
            </button>
          </div>
        ) : (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {slots.map((slot) => {
              const borderMap: Record<string, string> = {
                available: 'border-green-500/40',
                occupied: 'border-red-500/40',
                reserved: 'border-cyan-500/40',
                maintenance: 'border-white/10',
              };

              return (
                <div
                  key={slot.id}
                  className={`glass-card group transition-all hover:scale-[1.02] p-4 rounded-2xl flex flex-col justify-between ${
                    borderMap[slot.status] || 'border-white/10'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {categoryIcon(slot.category)}
                        <div>
                          <p className="text-sm font-bold text-white">Slot {slot.number}</p>
                          <p className="text-xs text-gray-400">Floor {slot.floor}</p>
                        </div>
                      </div>
                      {statusBadge(slot.status)}
                    </div>

                    {/* Facility Tag */}
                    {slot.locationName && (
                      <div className="mb-3 px-2 py-1 rounded-md bg-gray-800/60 border border-gray-750 text-[11px] text-gray-300 truncate flex items-center gap-1">
                        <HiOutlineBuildingStorefront className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{slot.locationName}</span>
                      </div>
                    )}

                    {/* Rates */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                      <div className="rounded-lg bg-white/[0.03] p-1.5">
                        <p className="text-[10px] text-gray-500">Hourly</p>
                        <p className="text-xs font-semibold text-cyan-400">₹{slot.hourlyRate}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-1.5">
                        <p className="text-[10px] text-gray-500">Daily</p>
                        <p className="text-xs font-semibold text-cyan-400">₹{slot.dailyRate}</p>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-1.5">
                        <p className="text-[10px] text-gray-500">Monthly</p>
                        <p className="text-xs font-semibold text-cyan-400">₹{slot.monthlyRate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => openEdit(slot)}
                      className="btn-outline flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium"
                    >
                      <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(slot)}
                      className="btn-outline flex items-center justify-center px-2 py-1.5 rounded-lg text-xs"
                      title={slot.status === 'maintenance' ? 'Restore' : 'Toggle Maintenance'}
                    >
                      {slot.status === 'maintenance' ? <HiOutlineCheck className="w-3.5 h-3.5" /> : <HiOutlinePower className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="btn-danger flex items-center justify-center px-2 py-1.5 rounded-lg text-xs"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card-glow p-6 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{isNew ? 'Add Parking Slot' : 'Edit Slot'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Location Picker */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Assigned Facility / Mall</label>
                  <select
                    value={editSlot.locationId || ''}
                    onChange={(e) => setEditSlot({ ...editSlot, locationId: e.target.value })}
                    className="input-neon w-full text-sm"
                  >
                    <option value="">-- Select Location / Mall --</option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name} ({l.area})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Slot Number</label>
                  <input
                    type="text"
                    required
                    value={editSlot.number}
                    onChange={(e) => setEditSlot({ ...editSlot, number: e.target.value })}
                    placeholder="e.g. A-C1A"
                    className="input-neon w-full text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Floor</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editSlot.floor}
                    onChange={(e) => setEditSlot({ ...editSlot, floor: Number(e.target.value) })}
                    className="input-neon w-full text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <select
                    value={editSlot.category}
                    onChange={(e) => setEditSlot({ ...editSlot, category: e.target.value as AdminSlot['category'] })}
                    className="input-neon w-full text-sm"
                  >
                    <option value="four-wheeler">Four Wheeler (Car)</option>
                    <option value="two-wheeler">Two Wheeler (Bike)</option>
                    <option value="ev">EV Charging</option>
                    <option value="disabled">Accessible (VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select
                    value={editSlot.status}
                    onChange={(e) => setEditSlot({ ...editSlot, status: e.target.value as AdminSlot['status'] })}
                    className="input-neon w-full text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Hourly (₹)</label>
                    <input
                      type="number"
                      value={editSlot.hourlyRate}
                      onChange={(e) => setEditSlot({ ...editSlot, hourlyRate: Number(e.target.value) })}
                      className="input-neon w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Daily (₹)</label>
                    <input
                      type="number"
                      value={editSlot.dailyRate}
                      onChange={(e) => setEditSlot({ ...editSlot, dailyRate: Number(e.target.value) })}
                      className="input-neon w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Monthly (₹)</label>
                    <input
                      type="number"
                      value={editSlot.monthlyRate}
                      onChange={(e) => setEditSlot({ ...editSlot, monthlyRate: Number(e.target.value) })}
                      className="input-neon w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-outline px-4 py-2 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-neon px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Slot'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageSlots;
