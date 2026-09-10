import { useState, useEffect, type FC } from 'react';
import { Zap, Accessibility, Car, Bike, Check, RefreshCw, Sparkles, Layers, ShieldAlert, AlertTriangle } from 'lucide-react';
import { socketService } from '../services/socketService';

export interface ParkingSlotItem {
  _id: string;
  number: string;
  category: string;
  floor: number;
  status: 'available' | 'reserved' | 'occupied' | 'maintenance';
  pricePerHour: number;
  pricePerDay?: number;
  isEmergencyBuffer?: boolean;
  features?: string[];
}

interface InteractiveFloorMapProps {
  slots: ParkingSlotItem[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: ParkingSlotItem) => void;
  onRefresh?: () => void;
}

export const InteractiveFloorMap: FC<InteractiveFloorMapProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  onRefresh
}) => {
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [liveSlots, setLiveSlots] = useState<ParkingSlotItem[]>(slots);
  const [bufferTooltip, setBufferTooltip] = useState<string | null>(null);

  useEffect(() => {
    setLiveSlots(slots);
  }, [slots]);

  useEffect(() => {
    socketService.connect();
    socketService.onSlotUpdate(({ slotId, status }) => {
      setLiveSlots((prev) =>
        prev.map((s) => (s._id === slotId || s.number === slotId ? { ...s, status: status as ParkingSlotItem['status'] } : s))
      );
    });

    return () => {
      socketService.off('slot-updated');
    };
  }, []);

  const isBufferSlot = (slot: ParkingSlotItem) => {
    return Boolean(
      slot.isEmergencyBuffer ||
      slot.number.startsWith('BUF') ||
      (slot.features && slot.features.includes('emergency_buffer'))
    );
  };

  const floorSlots = liveSlots.filter(
    (s) =>
      s.floor === activeFloor &&
      (filterCategory === 'all' ||
        (filterCategory === 'buffer' ? isBufferSlot(s) : s.category === filterCategory && !isBufferSlot(s)))
  );

  const getSlotIcon = (slot: ParkingSlotItem) => {
    if (isBufferSlot(slot)) {
      return <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />;
    }
    switch (slot.category) {
      case 'ev':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'disabled':
        return <Accessibility className="w-4 h-4 text-blue-400" />;
      case 'two-wheeler':
        return <Bike className="w-4 h-4 text-amber-400" />;
      default:
        return <Car className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getSlotCardStyle = (slot: ParkingSlotItem, isSelected: boolean) => {
    if (isBufferSlot(slot)) {
      return 'border-amber-500/70 bg-gradient-to-br from-amber-500/15 via-orange-950/40 to-amber-900/20 text-amber-300 ring-1 ring-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-400 cursor-pointer';
    }
    if (isSelected) {
      return 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20';
    }
    switch (slot.status) {
      case 'available':
        return 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:border-emerald-400 cursor-pointer';
      case 'reserved':
        return 'border-amber-500/40 bg-amber-500/10 text-amber-400 cursor-not-allowed opacity-90';
      case 'occupied':
        return 'border-red-500/40 bg-red-500/10 text-red-400 cursor-not-allowed opacity-80';
      case 'maintenance':
        return 'border-gray-500/40 bg-gray-500/10 text-gray-400 cursor-not-allowed opacity-60';
      default:
        return 'border-[var(--border)] bg-[var(--bg-elevated)]';
    }
  };

  const handleSlotClick = (slot: ParkingSlotItem) => {
    if (isBufferSlot(slot)) {
      setBufferTooltip(
        `🛡️ Bay ${slot.number} is a System Reserved Emergency Buffer Slot. It is automatically assigned by the Smart Conflict Engine if an arriving user's original slot is blocked by an overstaying vehicle (at ₹0 charge). Regular users cannot book it directly.`
      );
      setTimeout(() => setBufferTooltip(null), 6000);
      onSelectSlot(slot);
      return;
    }
    if (slot.status === 'available') {
      onSelectSlot(slot);
    }
  };

  // Group slots into two rows for realistic parking bay visual design
  const topRowSlots = floorSlots.filter((_, idx) => idx % 2 === 0);
  const bottomRowSlots = floorSlots.filter((_, idx) => idx % 2 !== 0);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              Interactive Floor Map
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Click on available green bays to select. Amber/Gold hazard bays are reserved for Emergency Buffer & VIP Reassignment.
            </p>
          </div>
        </div>

        {/* Floor Switcher */}
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)]">
          {[1, 2, 3].map((floorNum) => (
            <button
              key={floorNum}
              onClick={() => setActiveFloor(floorNum)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeFloor === floorNum
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Floor {floorNum}
            </button>
          ))}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-cyan-400 hover:bg-cyan-500/10 transition"
              title="Refresh Slots"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter & Status Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Bays' },
            { id: 'four-wheeler', label: '4 Wheeler' },
            { id: 'two-wheeler', label: '2 Wheeler' },
            { id: 'ev', label: 'EV Charging' },
            { id: 'disabled', label: 'Accessible' },
            { id: 'buffer', label: '🛡️ Emergency Buffer' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-medium text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500/30 border border-emerald-500" /> Available
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500/30 border border-amber-500" /> Reserved
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-500/30 border border-red-500" /> Occupied
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-500/30 border border-amber-400 ring-1 ring-amber-400/40" />
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> Emergency Buffer (System Reserved)
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Buffer System Alert Banner if Clicked */}
      {bufferTooltip && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 shadow-lg animate-fadeIn">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-amber-300">🛡️ Emergency Buffer Bay Information</p>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">{bufferTooltip}</p>
          </div>
        </div>
      )}

      {/* Visual Floor Layout Canvas/Grid */}
      <div className="relative bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-6 overflow-x-auto min-h-[320px] flex flex-col justify-between">
        {/* Entrance & Exit Indicators */}
        <div className="absolute top-2 left-6 text-[10px] font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          ↓ IN / ENTRANCE
        </div>
        <div className="absolute top-2 right-6 text-[10px] font-mono font-bold tracking-wider text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
          ↑ OUT / EXIT
        </div>

        {/* Top Parking Row */}
        {floorSlots.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-gray-500 opacity-50" />
            <p className="font-semibold text-gray-300">No bays found on Floor {activeFloor} for selected filter</p>
            <button
              onClick={() => setFilterCategory('all')}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              View All Bays on Floor {activeFloor} →
            </button>
          </div>
        ) : (
          <>
            <div className="pt-8 pb-4">
              <div className="text-[10px] uppercase font-mono font-semibold text-[var(--text-muted)] mb-2 flex items-center justify-between">
                <span>North Parking Lane (Row A)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {topRowSlots.map((slot) => {
                  const isBuffer = isBufferSlot(slot);
                  const isSelected = selectedSlotId === slot._id || selectedSlotId === slot.number;
                  return (
                    <div
                      key={slot._id}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-3 rounded-xl border transition-all duration-200 relative flex flex-col justify-between min-h-[110px] ${getSlotCardStyle(
                        slot,
                        isSelected
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm">{slot.number}</span>
                        {getSlotIcon(slot)}
                      </div>

                      <div className="my-1">
                        <span className="text-[10px] block opacity-80 capitalize">
                          {isBuffer ? 'Emergency Buffer' : slot.category.replace('-', ' ')}
                        </span>
                        <span className="font-semibold text-xs">
                          {isBuffer ? '₹0 Conflict Cover' : `₹${slot.pricePerHour}/hr`}
                        </span>
                      </div>

                      {isSelected && !isBuffer && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {isBuffer ? (
                        <div className="text-[8px] font-mono uppercase tracking-wider font-extrabold text-center py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-400/40 mt-1">
                          🛡️ EMERGENCY BUFFER
                        </div>
                      ) : (
                        <div className="text-[9px] font-mono uppercase tracking-wider opacity-75 font-semibold text-center py-0.5 rounded bg-black/20 mt-1">
                          {slot.status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Central Driveway Lane */}
            <div className="my-3 py-2 border-y border-dashed border-[var(--border)] bg-cyan-500/5 text-center text-[10px] font-mono text-cyan-400/70 tracking-widest uppercase flex items-center justify-center gap-3">
              <span>➔ MAIN DRIVING LANE ➔ FLOOR {activeFloor} ➔ DRIVE SLOWLY ➔</span>
            </div>

            {/* Bottom Parking Row */}
            <div className="pt-2 pb-4">
              <div className="text-[10px] uppercase font-mono font-semibold text-[var(--text-muted)] mb-2">
                <span>South Parking Lane (Row B)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {bottomRowSlots.map((slot) => {
                  const isBuffer = isBufferSlot(slot);
                  const isSelected = selectedSlotId === slot._id || selectedSlotId === slot.number;
                  return (
                    <div
                      key={slot._id}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-3 rounded-xl border transition-all duration-200 relative flex flex-col justify-between min-h-[110px] ${getSlotCardStyle(
                        slot,
                        isSelected
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm">{slot.number}</span>
                        {getSlotIcon(slot)}
                      </div>

                      <div className="my-1">
                        <span className="text-[10px] block opacity-80 capitalize">
                          {isBuffer ? 'Emergency Buffer' : slot.category.replace('-', ' ')}
                        </span>
                        <span className="font-semibold text-xs">
                          {isBuffer ? '₹0 Conflict Cover' : `₹${slot.pricePerHour}/hr`}
                        </span>
                      </div>

                      {isSelected && !isBuffer && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {isBuffer ? (
                        <div className="text-[8px] font-mono uppercase tracking-wider font-extrabold text-center py-0.5 rounded bg-amber-500/25 text-amber-200 border border-amber-400/40 mt-1">
                          🛡️ EMERGENCY BUFFER
                        </div>
                      ) : (
                        <div className="text-[9px] font-mono uppercase tracking-wider opacity-75 font-semibold text-center py-0.5 rounded bg-black/20 mt-1">
                          {slot.status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveFloorMap;
