import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineTicket,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlinePrinter,
  HiOutlineQrCode,
  HiOutlineTruck,
  HiOutlineCurrencyRupee
} from 'react-icons/hi2';
import { securityApi } from '../../services/api';

interface WalkinPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialVehicleNumber?: string;
}

export default function WalkinPassModal({ isOpen, onClose, onSuccess, initialVehicleNumber }: WalkinPassModalProps) {
  const [vehicleNumber, setVehicleNumber] = useState(initialVehicleNumber || '');
  const [vehicleType, setVehicleType] = useState('four-wheeler');
  const [durationHours, setDurationHours] = useState(2);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialVehicleNumber) {
      setVehicleNumber(initialVehicleNumber);
    }
  }, [isOpen, initialVehicleNumber]);
  const [issuedPass, setIssuedPass] = useState<{
    bookingId: string;
    vehicleNumber: string;
    slotNumber: string;
    category: string;
    entryTime: string;
    endTime: string;
    duration: number;
    amount: number;
    qrCode: string;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await securityApi.createWalkinPass({
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        durationHours: Number(durationHours) || 2,
        driverName: driverName.trim() || 'Walk-in Guest',
        driverPhone: driverPhone.trim() || 'N/A'
      });

      if (res.success && res.pass) {
        setIssuedPass(res.pass as unknown as typeof issuedPass);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Failed to issue pass');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error generating pass';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setIssuedPass(null);
    setVehicleNumber('');
    setDriverName('');
    setDriverPhone('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <HiOutlineTicket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  Walk-in / Spot Guest Pass
                </h2>
                <p className="text-xs text-slate-400">
                  Generate instant gate pass for drivers without mobile app
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {!issuedPass ? (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vehicle Number Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="GJ-01-AB-1234"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-base text-white font-mono tracking-wider uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Vehicle Category
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="four-wheeler">🚗 Four-Wheeler (Car)</option>
                      <option value="two-wheeler">🏍️ Two-Wheeler (Bike)</option>
                      <option value="ev">⚡ EV (Electric)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Duration (Hours)
                    </label>
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={4}>4 Hours</option>
                      <option value={8}>8 Hours</option>
                      <option value={24}>Full Day (24h)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Driver Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Ramesh Bhai"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
                  >
                    <HiOutlineTicket className="w-5 h-5" />
                    {loading ? 'Allocating Slot...' : 'Issue Spot Pass & Open Gate'}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Printable Ticket Card */
              <div className="space-y-4 text-center">
                <div className="p-5 rounded-2xl bg-slate-800/80 border border-cyan-500/30 text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <HiOutlineCheckCircle className="w-4 h-4" /> PASS ISSUED & ACTIVE
                  </div>

                  <div className="font-mono text-2xl font-black text-white tracking-widest">
                    {issuedPass.vehicleNumber}
                  </div>

                  <div className="inline-block p-3 bg-white rounded-xl shadow-inner my-1">
                    <img
                      src={issuedPass.qrCode}
                      alt="Spot Pass QR"
                      className="w-36 h-36 mx-auto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 text-left bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                    <div>
                      <span className="text-slate-500 block">Allocated Slot</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">
                        Slot {issuedPass.slotNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Category</span>
                      <span className="text-sm font-bold text-white capitalize">
                        {issuedPass.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Duration</span>
                      <span className="font-semibold text-white">{issuedPass.duration} Hour(s)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Amount Collected</span>
                      <span className="font-bold text-emerald-400">₹{issuedPass.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  >
                    <HiOutlinePrinter className="w-5 h-5" />
                    Print Slip
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20"
                  >
                    Issue Another Pass
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
