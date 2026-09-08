import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineShieldExclamation,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle
} from 'react-icons/hi2';
import { securityApi } from '../../services/api';

interface BlacklistEntry {
  _id: string;
  vehicleNumber: string;
  reason: string;
  severity: 'warning' | 'danger' | 'police_wanted';
  notes?: string;
  addedByName?: string;
  createdAt: string;
}

interface BlacklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCount?: (count: number) => void;
  initialVehicleNumber?: string;
}

export default function BlacklistModal({ isOpen, onClose, onUpdateCount, initialVehicleNumber }: BlacklistModalProps) {
  const [list, setList] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [reason, setReason] = useState('stolen');
  const [severity, setSeverity] = useState<'warning' | 'danger' | 'police_wanted'>('danger');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBlacklist();
      if (initialVehicleNumber) {
        setVehicleNumber(initialVehicleNumber);
        setShowAddForm(true);
      }
    }
  }, [isOpen, initialVehicleNumber]);

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await securityApi.getBlacklist();
      if (res.success && res.data) {
        const active = (res.data as unknown as BlacklistEntry[]);
        setList(active);
        if (onUpdateCount) onUpdateCount(active.length);
      }
    } catch (err) {
      console.error('Failed to load blacklist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await securityApi.addToBlacklist({
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        reason,
        severity,
        notes
      });
      if (res.success) {
        setFeedback(`Vehicle ${vehicleNumber.toUpperCase()} added to watchlist.`);
        setVehicleNumber('');
        setNotes('');
        setShowAddForm(false);
        fetchBlacklist();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add vehicle';
      setFeedback(`Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string, plate: string) => {
    if (!confirm(`Are you sure you want to remove ${plate} from active watchlist?`)) return;

    try {
      await securityApi.removeFromBlacklist(id);
      setList(prev => prev.filter(item => item._id !== id));
      if (onUpdateCount) onUpdateCount(Math.max(0, list.length - 1));
    } catch (err) {
      console.error('Failed to remove from blacklist:', err);
    }
  };

  const filtered = list.filter(item =>
    item.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
    item.reason.toLowerCase().includes(search.toLowerCase()) ||
    (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'police_wanted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-600 text-white animate-pulse">
            <HiOutlineExclamationTriangle className="w-3.5 h-3.5" /> POLICE WANTED
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
            DANGER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            WARNING
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <HiOutlineShieldExclamation className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  Vehicle Watchlist & Blacklist
                  <span className="text-xs px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                    {list.length} Flagged
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Monitored vehicles will trigger instant red alerts upon gate scanning
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="p-6 pb-3 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plate or reason..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              {showAddForm ? 'Cancel Add' : 'Flag New Vehicle'}
            </button>
          </div>

          {/* Add Form Accordion */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="mx-6 mb-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Plate Number *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="MH-12-AB-3456"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 uppercase font-mono tracking-wider focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reason *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="stolen">Stolen / Police FIR</option>
                    <option value="repeated_defaulter">Repeated Defaulter</option>
                    <option value="unpaid_penalties">Unpaid Penalties</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="vip_security_restriction">Security Restricted</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'warning' | 'danger' | 'police_wanted')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="police_wanted">Police Wanted (Hard Deny)</option>
                    <option value="danger">Danger (Hard Deny)</option>
                    <option value="warning">Warning (Guard Alert)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Incident Details</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Crime Branch FIR #102, Alert Gate 2 immediately"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Confirm Blacklist Entry'}
                </button>
              </div>
            </motion.form>
          )}

          {/* Table of Entries */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading watchlist records...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No blacklisted vehicles match your query.
              </div>
            ) : (
              filtered.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono font-bold text-white text-base tracking-wider">
                      {item.vehicleNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white capitalize">
                          {item.reason.replace(/_/g, ' ')}
                        </span>
                        {getSeverityBadge(item.severity)}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Added by {item.addedByName || 'Security'} • {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item._id, item.vehicleNumber)}
                    className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                    title="Remove from active watchlist"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    Unflag
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
