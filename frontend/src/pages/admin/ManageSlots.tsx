import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlinePlusCircle,
  HiOutlinePencilSquare,
  HiOutlinePower,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheck,
} from 'react-icons/hi2';
import { slotApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

interface AdminSlot {
  id: string;
  number: string;
  floor: number;
  category: 'two-wheeler' | 'four-wheeler' | 'ev' | 'disabled';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
}

const emptySlot: AdminSlot = {
  id: '', number: '', floor: 1, category: 'four-wheeler', status: 'available',
  hourlyRate: 5, dailyRate: 30, monthlyRate: 300,
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
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold border ${colors[cat] || 'text-gray-400 border-gray-500/40'}`}>
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
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>{s.label}</span>;
};

const ManageSlots = () => {
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editSlot, setEditSlot] = useState<AdminSlot>(emptySlot);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const fetchSlots = () => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (floorFilter !== 'all') params.floor = floorFilter;
    if (statusFilter !== 'all') params.status = statusFilter;
    slotApi.getAll(params)
      .then((res) => {
        const mapped = (res.slots || []).map((s: Record<string, unknown>) => ({
          id: String(s._id || s.id),
          number: String(s.number || ''),
          floor: Number(s.floor ?? 1),
          category: (s.category || 'four-wheeler') as AdminSlot['category'],
          status: (s.status || 'available') as AdminSlot['status'],
          hourlyRate: Number(s.hourlyRate ?? 0),
          dailyRate: Number(s.dailyRate ?? 0),
          monthlyRate: Number(s.monthlyRate ?? 0),
        }));
        setSlots(mapped);
      })
      .catch((err) => setError(err?.message || 'Failed to load slots'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlots(); }, [categoryFilter, floorFilter, statusFilter]);

  const openAdd = () => {
    setEditSlot(emptySlot);
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
    const payload: Record<string, unknown> = {
      number: editSlot.number,
      floor: editSlot.floor,
      category: editSlot.category,
      status: editSlot.status,
      hourlyRate: editSlot.hourlyRate,
      dailyRate: editSlot.dailyRate,
      monthlyRate: editSlot.monthlyRate,
    };
    const promise = isNew ? slotApi.create(payload) : slotApi.update(editSlot.id, payload);
    promise
      .then(() => { setShowModal(false); fetchSlots(); })
      .catch((err) => setError(err?.message || 'Failed to save slot'))
      .finally(() => setSaving(false));
  };

  const handleToggleStatus = (slot: AdminSlot) => {
    const newStatus = slot.status === 'maintenance' ? 'available' : 'maintenance';
    slotApi.updateStatus(slot.id, newStatus)
      .then(() => fetchSlots())
      .catch((err) => setError(err?.message || 'Failed to toggle status'));
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    slotApi.delete(id)
      .then(() => fetchSlots())
      .catch((err) => setError(err?.message || 'Failed to delete slot'));
  };

  const filteredSlots = useMemo(() => slots, [slots]);

  const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
    <button
      onClick={() => setter(value)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#06b6d4" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Manage Slots</h1>
            <p className="text-gray-400 mt-1">View and manage all parking slots</p>
          </div>
          <button onClick={openAdd} className="btn-neon flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm">
            <HiOutlinePlusCircle className="w-4 h-4" />
            Add Slot
          </button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="glass p-4 rounded-xl">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Category:</span>
                {[{ label: 'All', value: 'all' }, { label: 'Four Wheeler', value: 'four-wheeler' }, { label: 'Two Wheeler', value: 'two-wheeler' }, { label: 'EV', value: 'ev' }, { label: 'Disabled', value: 'disabled' }].map((f) => (
                  <span key={f.value}>{filterBtn(f.label, f.value, categoryFilter, setCategoryFilter)}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Floor:</span>
                {[{ label: 'All', value: 'all' }, { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }].map((f) => (
                  <span key={f.value}>{filterBtn(f.label, f.value, floorFilter, setFloorFilter)}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Status:</span>
                {[{ label: 'All', value: 'all' }, { label: 'Available', value: 'available' }, { label: 'Occupied', value: 'occupied' }, { label: 'Reserved', value: 'reserved' }, { label: 'Maintenance', value: 'maintenance' }].map((f) => (
                  <span key={f.value}>{filterBtn(f.label, f.value, statusFilter, setStatusFilter)}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSlots.map((slot) => {
              const glowMap: Record<string, string> = {
                available: '0 0 20px rgba(16,185,129,0.3), inset 0 0 20px rgba(16,185,129,0.05)',
                occupied: '0 0 20px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.05)',
                reserved: '0 0 20px rgba(6,182,212,0.3), inset 0 0 20px rgba(6,182,212,0.05)',
                maintenance: '0 0 10px rgba(255,255,255,0.05)',
              };
              const borderMap: Record<string, string> = {
                available: 'border-green-500/40',
                occupied: 'border-red-500/40',
                reserved: 'border-cyan-500/40',
                maintenance: 'border-white/10',
              };
              return (
                <div
                  key={slot.id}
                  className={`glass-card group transition-all hover:scale-[1.02] ${borderMap[slot.status] || 'border-white/10'}`}
                  style={{ boxShadow: glowMap[slot.status] || glowMap.maintenance }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {categoryIcon(slot.category)}
                      <div>
                        <p className="text-sm font-bold text-white">Slot {slot.number}</p>
                        <p className="text-xs text-gray-400">Floor {slot.floor}</p>
                      </div>
                    </div>
                    {statusBadge(slot.status)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
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
                  <div className="flex items-center gap-1">
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

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card-glow p-6 w-full max-w-md max-h-[85vh] overflow-y-auto mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{isNew ? 'Add Slot' : 'Edit Slot'}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Slot Number</label>
                  <input type="text" value={editSlot.number} onChange={(e) => setEditSlot({ ...editSlot, number: e.target.value })}
                    className="input-neon w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Floor</label>
                  <input type="number" value={editSlot.floor} onChange={(e) => setEditSlot({ ...editSlot, floor: Number(e.target.value) })}
                    className="input-neon w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <select value={editSlot.category} onChange={(e) => setEditSlot({ ...editSlot, category: e.target.value as AdminSlot['category'] })}
                    className="input-neon w-full text-sm">
                    <option value="four-wheeler">Four Wheeler</option>
                    <option value="two-wheeler">Two Wheeler</option>
                    <option value="ev">EV</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                  <select value={editSlot.status} onChange={(e) => setEditSlot({ ...editSlot, status: e.target.value as AdminSlot['status'] })}
                    className="input-neon w-full text-sm">
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Hourly ($)</label>
                    <input type="number" value={editSlot.hourlyRate} onChange={(e) => setEditSlot({ ...editSlot, hourlyRate: Number(e.target.value) })}
                      className="input-neon w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Daily ($)</label>
                    <input type="number" value={editSlot.dailyRate} onChange={(e) => setEditSlot({ ...editSlot, dailyRate: Number(e.target.value) })}
                      className="input-neon w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Monthly ($)</label>
                    <input type="number" value={editSlot.monthlyRate} onChange={(e) => setEditSlot({ ...editSlot, monthlyRate: Number(e.target.value) })}
                      className="input-neon w-full text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowModal(false)} className="btn-outline px-4 py-2 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-neon px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ManageSlots;
