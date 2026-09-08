import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineExclamationTriangle,
  HiOutlinePlusCircle,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineCamera,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText
} from 'react-icons/hi2';
import { securityApi } from '../../services/api';

interface Incident {
  _id: string;
  incidentId: string;
  vehicleNumber: string;
  slotNumber?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  photoUrl?: string;
  fineAmount?: number;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  reportedByName?: string;
  createdAt: string;
}

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCount?: (count: number) => void;
  initialVehicleNumber?: string;
}

export default function IncidentModal({ isOpen, onClose, onUpdateCount, initialVehicleNumber }: IncidentModalProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [slotNumber, setSlotNumber] = useState('');
  const [type, setType] = useState('vehicle_damage');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [fineAmount, setFineAmount] = useState<number | string>(0);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchIncidents();
      if (initialVehicleNumber) {
        setVehicleNumber(initialVehicleNumber);
        setShowAddForm(true);
      }
    }
  }, [isOpen, initialVehicleNumber]);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await securityApi.getIncidents();
      if (res.success && res.data) {
        const list = (res.data as unknown as Incident[]);
        setIncidents(list);
        if (onUpdateCount) {
          const openCount = list.filter(i => i.status === 'open' || i.status === 'investigating').length;
          onUpdateCount(openCount);
        }
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim() || !description.trim()) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await securityApi.createIncident({
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        slotNumber: slotNumber.trim() || 'N/A',
        type,
        severity,
        description,
        photoUrl,
        fineAmount: Number(fineAmount) || 0
      });
      if (res.success) {
        setFeedback(`Incident ${res.data.incidentId || ''} filed successfully.`);
        setVehicleNumber('');
        setSlotNumber('');
        setDescription('');
        setPhotoUrl('');
        setFineAmount(0);
        setShowAddForm(false);
        fetchIncidents();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to file incident';
      setFeedback(`Error: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'open' | 'investigating' | 'resolved' | 'escalated') => {
    try {
      await securityApi.updateIncident(id, { status: newStatus });
      setIncidents(prev => prev.map(item => item._id === id ? { ...item, status: newStatus } : item));
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-red-600/30 text-red-400 border border-red-500/40">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'resolved':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case 'investigating':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Investigating</span>;
      case 'escalated':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">Escalated</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Open</span>;
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
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <HiOutlineExclamationTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Incident & Vehicle Damage Logs
                </h2>
                <p className="text-xs text-slate-400">
                  Log vehicle scratches, illegal parking, barrier hits, and security events
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
          <div className="p-6 pb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Total Recorded Incidents ({incidents.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              {showAddForm ? 'Cancel' : 'Report New Incident'}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="mx-6 mb-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Plate *</label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="MH-12-AB-3456"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white uppercase font-mono tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Slot (Optional)</label>
                  <input
                    type="text"
                    value={slotNumber}
                    onChange={(e) => setSlotNumber(e.target.value.toUpperCase())}
                    placeholder="C1A"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="vehicle_damage">Vehicle Scratch / Damage</option>
                    <option value="illegal_parking">Illegal Parking / Blocked Way</option>
                    <option value="suspicious_activity">Suspicious Activity</option>
                    <option value="payment_evasion">Payment Evasion</option>
                    <option value="barrier_break">Barrier Gate Collision</option>
                    <option value="verbal_altercation">Altercation / Fight</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="low">Low (Minor log)</option>
                    <option value="medium">Medium (Requires attention)</option>
                    <option value="high">High (Fine required)</option>
                    <option value="critical">Critical (Immediate escalation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fine Amount (₹)</label>
                  <div className="relative">
                    <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      value={fineAmount}
                      onChange={(e) => setFineAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about damage, exact spot, driver remarks..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
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
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Save Incident Report'}
                </button>
              </div>
            </motion.form>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading incident reports...</div>
            ) : incidents.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No incidents recorded. Everything is normal!
              </div>
            ) : (
              incidents.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {item.incidentId}
                      </span>
                      <span className="text-sm font-bold text-white font-mono">{item.vehicleNumber}</span>
                      {item.slotNumber && item.slotNumber !== 'N/A' && (
                        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Slot {item.slotNumber}</span>
                      )}
                      {getSeverityBadge(item.severity)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      {item.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'resolved')}
                          className="text-xs px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-300">{item.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/40 flex-wrap gap-2">
                    <span>
                      Type: <span className="text-slate-200 capitalize">{item.type.replace(/_/g, ' ')}</span>
                    </span>
                    {item.fineAmount ? item.fineAmount > 0 ? (
                      <span className="text-amber-400 font-semibold">Fine: ₹{item.fineAmount}</span>
                    ) : null : null}
                    <span className="text-slate-500">
                      Reported by {item.reportedByName || 'Guard'} • {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
