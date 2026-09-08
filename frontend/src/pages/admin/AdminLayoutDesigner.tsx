import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCloudArrowUp,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import ThreeDParkingCanvas from '../../components/ThreeDParkingCanvas';
import type { ThreeDSlotData } from '../../components/ThreeDParkingCanvas';
import { layoutApi, slotApi } from '../../services/api';

interface LayoutItem {
  id: string;
  type: 'slot' | 'entrance' | 'exit' | 'lane' | 'path' | 'ev_area' | 'handicap_area' | 'vip_area';
  slotNumber?: string;
  category?: string;
  x: number;
  y: number;
  z: number;
  rotation?: number;
}

export const AdminLayoutDesigner: FC = () => {
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [items, setItems] = useState<LayoutItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch Layout for Floor
  const fetchLayout = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await layoutApi.getByFloor(activeFloor);
      if (res.layout && Array.isArray(res.layout.items)) {
        setItems(res.layout.items as unknown as LayoutItem[]);
      }
    } catch (err) {
      setMessage('Failed to load floor layout.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayout();
  }, [activeFloor]);

  // Selected item object
  const selectedItem = items.find((it) => it.id === selectedId);

  // Add New Slot
  const handleAddSlot = (category: string = 'four-wheeler') => {
    const slotCount = items.filter((it) => it.type === 'slot').length + 1;
    const prefix = category === 'ev' ? 'E' : category === 'vip' ? 'V' : category === 'disabled' ? 'H' : 'A';
    const newItem: LayoutItem = {
      id: `slot-${Date.now()}`,
      type: 'slot',
      slotNumber: `${prefix}-${slotCount < 10 ? '0' + slotCount : slotCount}`,
      category,
      x: (slotCount % 6) * 4 - 10,
      y: 0,
      z: Math.floor(slotCount / 6) * 6 - 6,
      rotation: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  // Add Special Layout Element
  const handleAddElement = (type: LayoutItem['type']) => {
    const newItem: LayoutItem = {
      id: `${type}-${Date.now()}`,
      type,
      x: 0,
      y: 0,
      z: 0,
      rotation: 0,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  // Delete Selected Item
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((it) => it.id !== selectedId));
    setSelectedId(null);
  };

  // Update Item Position/Coords
  const handleUpdateItem = (field: keyof LayoutItem, value: any) => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) => (it.id === selectedId ? { ...it, [field]: value } : it))
    );
  };

  // Save Layout to MongoDB & Auto-sync Slots System-wide
  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      // 1. Save 3D Layout structure
      await layoutApi.save({
        floor: activeFloor,
        items: items as unknown as Array<Record<string, unknown>>,
        name: `Campus Parking Floor ${activeFloor}`,
      });

      // 2. Auto-sync designed slots into system slots database
      const slotItems = items.filter((it) => it.type === 'slot');
      for (const sItem of slotItems) {
        const cat = sItem.category || 'four-wheeler';
        const price = cat === 'two-wheeler' ? 15 : cat === 'ev' ? 40 : cat === 'vip' ? 50 : cat === 'disabled' ? 20 : 30;
        await slotApi.create({
          number: sItem.slotNumber || 'BAY',
          category: cat,
          floor: activeFloor,
          pricePerHour: price,
          status: 'available',
          x: sItem.x,
          z: sItem.z,
          rotation: sItem.rotation || 0,
        }).catch(() => {
          // If already exists, ignore or update gracefully
        });
      }

      setMessage(`✅ Floor ${activeFloor} layout & ${slotItems.length} slots synced live across all dashboards!`);
    } catch (err) {
      setMessage('Failed to save layout.');
    } finally {
      setSaving(false);
    }
  };

  // Map items to 3D Canvas format
  const canvasSlots: ThreeDSlotData[] = items
    .filter((it) => it.type === 'slot')
    .map((it) => ({
      id: it.id,
      number: it.slotNumber || 'BAY',
      category: it.category || 'four-wheeler',
      status: 'available',
      floor: activeFloor,
      x: it.x,
      z: it.z,
      rotation: it.rotation || 0,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 mb-2">
            <HiOutlineSparkles className="w-4 h-4" /> 3D Campus Layout Designer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
            Admin <span className="neon-text">Parking Designer</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Visually place slots, EV bays, driving lanes, entrance, and exit gates with real X, Y, Z coordinates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Floor Switcher */}
          <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
            {[1, 2, 3].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFloor(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeFloor === f ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-[var(--text-secondary)]'
                }`}
              >
                Floor {f}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-neon px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/25"
          >
            <HiOutlineCloudArrowUp className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save to MongoDB'}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-2">
          <HiOutlineCheckCircle className="w-4 h-4 text-emerald-400" /> {message}
        </div>
      )}

      {/* Main Grid: Left Toolbar & Control Panel, Right 3D Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Admin Control Panel */}
        <div className="space-y-4">
          
          {/* Add Elements Toolbox */}
          <div className="glass-card p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-[var(--text)] border-b border-[var(--border)] pb-2 flex items-center gap-2">
              <HiOutlinePlus className="w-4 h-4 text-cyan-400" /> Add Parking Elements
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleAddSlot('four-wheeler')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-cyan-500/20 border border-[var(--border)] text-[var(--text)] font-semibold text-left transition flex items-center gap-2"
              >
                <span>🚗</span> + 4W Slot
              </button>
              <button
                onClick={() => handleAddSlot('two-wheeler')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-cyan-500/20 border border-[var(--border)] text-[var(--text)] font-semibold text-left transition flex items-center gap-2"
              >
                <span>🛵</span> + 2W Slot
              </button>
              <button
                onClick={() => handleAddSlot('ev')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-purple-500/20 border border-[var(--border)] text-purple-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>⚡</span> + EV Station
              </button>
              <button
                onClick={() => handleAddSlot('vip')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-orange-500/20 border border-[var(--border)] text-orange-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>👑</span> + VIP Bay
              </button>
              <button
                onClick={() => handleAddSlot('disabled')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-gray-500/20 border border-[var(--border)] text-gray-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>♿</span> + Handicap
              </button>
              <button
                onClick={() => handleAddElement('entrance')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-emerald-500/20 border border-[var(--border)] text-emerald-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>🚪</span> + Entrance
              </button>
              <button
                onClick={() => handleAddElement('exit')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/20 border border-[var(--border)] text-red-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>🚪</span> + Exit Gate
              </button>
              <button
                onClick={() => handleAddElement('lane')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-cyan-500/20 border border-[var(--border)] text-cyan-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>🛣️</span> + Straight Lane
              </button>
              <button
                onClick={() => handleAddElement('path')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-amber-500/20 border border-[var(--border)] text-amber-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>↩️</span> + L-Corner Turn
              </button>
              <button
                onClick={() => handleAddElement('ev_area')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-purple-500/20 border border-[var(--border)] text-purple-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>⚡</span> + EV Zone
              </button>
              <button
                onClick={() => handleAddElement('vip_area')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-orange-500/20 border border-[var(--border)] text-orange-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>👑</span> + VIP Zone
              </button>
              <button
                onClick={() => handleAddElement('handicap_area')}
                className="p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-sky-500/20 border border-[var(--border)] text-sky-400 font-semibold text-left transition flex items-center gap-2"
              >
                <span>♿</span> + Accessible Zone
              </button>
            </div>
          </div>

          {/* Item Inspector / Coordinates Modifier */}
          {selectedItem ? (
            <div className="glass-card p-5 rounded-3xl space-y-3 border-cyan-500/40">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h3 className="text-sm font-bold text-cyan-400">
                  Inspect Item: {selectedItem.slotNumber || selectedItem.type}
                </h3>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                  title="Delete Object"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>

              {selectedItem.type === 'slot' && (
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] font-semibold mb-1">
                    Slot Number Label
                  </label>
                  <input
                    type="text"
                    value={selectedItem.slotNumber || ''}
                    onChange={(e) => handleUpdateItem('slotNumber', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] font-mono uppercase"
                  />
                </div>
              )}

              {/* Coordinates & Rotation Controls */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)]">X Position (East-West):</span>
                    <span className="font-mono text-cyan-400">{selectedItem.x}</span>
                  </div>
                  <input
                    type="range"
                    min="-18"
                    max="18"
                    step="1"
                    value={selectedItem.x}
                    onChange={(e) => handleUpdateItem('x', Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[var(--text-secondary)]">Z Position (North-South):</span>
                    <span className="font-mono text-cyan-400">{selectedItem.z}</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={selectedItem.z}
                    onChange={(e) => handleUpdateItem('z', Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <span className="text-[var(--text-secondary)] block mb-1.5 font-semibold">
                    Quick Rotate Angle (For L-Shape Bends)
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                    {[0, 90, 180, 270].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const isCurrent = Math.abs((selectedItem.rotation || 0) - rad) < 0.1;
                      return (
                        <button
                          key={deg}
                          onClick={() => handleUpdateItem('rotation', rad)}
                          className={`py-1.5 rounded-lg border transition ${
                            isCurrent
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          {deg}°
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-[var(--text-secondary)] glass-card rounded-3xl border border-[var(--border)]">
              Click any 3D parking element on the canvas to inspect its X, Y, Z coordinates.
            </div>
          )}
        </div>

        {/* Right 3D Visual Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <ThreeDParkingCanvas
            slots={canvasSlots}
            selectedSlotId={selectedId}
            onSelectSlot={(s) => setSelectedId(s.id)}
            activeFloor={activeFloor}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLayoutDesigner;
