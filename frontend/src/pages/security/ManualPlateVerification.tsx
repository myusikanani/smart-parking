import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import {
  HiOutlineTruck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineIdentification,
  HiOutlineUser,
  HiOutlineExclamationCircle,
  HiOutlineCamera,
  HiOutlineShieldExclamation,
  HiOutlineXMark,
  HiOutlineSparkles
} from 'react-icons/hi2';
import { securityApi, bookingApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface BookingResult {
  id: string;
  userName: string;
  slot: string;
  time: string;
  status: string;
  vehicleNumber: string;
}

interface BlacklistAlert {
  vehicleNumber: string;
  reason: string;
  severity: 'warning' | 'danger' | 'police_wanted';
  notes?: string;
}

const ManualPlateVerification = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<BookingResult[] | null>(null);
  const [blacklistAlert, setBlacklistAlert] = useState<BlacklistAlert | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // Camera ANPR Mode states
  const [cameraActive, setCameraActive] = useState(false);
  const [scanningPlate, setScanningPlate] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCameraANPR = async () => {
    setError('');
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setError('Unable to access device camera. Please check permissions or type manually.');
      setCameraActive(false);
    }
  };

  const stopCameraANPR = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCapturePlate = async () => {
    if (!videoRef.current) return;
    setScanningPlate(true);
    setError('');

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // High-contrast filter
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const boosted = v > 125 ? 255 : 0;
          d[i] = boosted;
          d[i + 1] = boosted;
          d[i + 2] = boosted;
        }
        ctx.putImageData(imgData, 0, 0);

        const worker = await createWorker('eng');
        await worker.setParameters({
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
          tessedit_pageseg_mode: '7' as unknown as import('tesseract.js').PSM,
        });

        const res = await worker.recognize(canvas);
        await worker.terminate();

        const detected = (res.data.text || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').trim();
        if (detected.length >= 4) {
          setSearchQuery(detected);
          stopCameraANPR();
          handleSearch(detected);
        } else {
          setError('Could not clearly read license plate text. Please adjust camera position or type plate manually.');
        }
      }
    } catch (err) {
      console.warn('OCR error:', err);
      setError('OCR extraction failed. Please try again or type manually.');
    } finally {
      setScanningPlate(false);
    }
  };

  const handleSearch = async (overrideQuery?: string) => {
    const query = (overrideQuery || searchQuery).trim().toUpperCase();
    if (!query) return;
    setLoading(true);
    setError('');
    setResults(null);
    setBlacklistAlert(null);
    setSearched(true);
    try {
      const data = await securityApi.manualVerify(query);
      if (data.blacklistAlert) {
        setBlacklistAlert(data.blacklistAlert as unknown as BlacklistAlert);
      }
      if (data.success && data.bookings) {
        const bookings = (data.bookings || []) as Record<string, unknown>[];
        const mapped: BookingResult[] = bookings.map((b) => ({
          id: (b.bookingId as string) || (b._id as string) || '--',
          userName: (b.userName as string) || ((b.user as Record<string, unknown>)?.name as string) || '--',
          slot: ((b.slot as Record<string, unknown>)?.number as string) || (b.slotNumber as string) || (b.slot as string) || '--',
          time: (b.startTime as string) || (b.time as string) || (b.createdAt as string) || '--',
          status: (b.status as string) || 'Unknown',
          vehicleNumber: (b.vehicleNumber as string) || query,
        }));
        setResults(mapped);
      } else {
        setResults([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed. Please try again.';
      setError(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEntry = async (bookingId: string) => {
    setActionLoading(bookingId + '-entry');
    try {
      await bookingApi.markEntry(bookingId);
      setResults((prev) =>
        (prev || []).map((r) => (r.id === bookingId ? { ...r, status: 'Entry Done' } : r)),
      );
    } catch {
      setError('Failed to verify entry for ' + bookingId);
    } finally {
      setActionLoading('');
    }
  };

  const handleVerifyExit = async (bookingId: string) => {
    setActionLoading(bookingId + '-exit');
    try {
      await bookingApi.markExit(bookingId);
      setResults((prev) =>
        (prev || []).map((r) => (r.id === bookingId ? { ...r, status: 'Exit Done' } : r)),
      );
    } catch {
      setError('Failed to verify exit for ' + bookingId);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
        <motion.div variants={itemVariants}>
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#06b6d4" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Manual & AI Camera Plate Verification</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
              Search vehicle license plates, run AI Camera ANPR scans, and verify gate passes
            </p>
          </div>
        </motion.div>

        {/* BLACKLIST WARNING BANNER */}
        {blacklistAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl shadow-red-500/40 border border-red-400 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/20 text-white">
                <HiOutlineShieldExclamation className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-wide">
                  WATCHLIST ALERT: VEHICLE {blacklistAlert.vehicleNumber} IS FLAGGED!
                </h3>
                <p className="text-xs text-red-100">
                  Reason: <span className="font-bold uppercase">{blacklistAlert.reason}</span> | Severity: <span className="font-bold uppercase">{blacklistAlert.severity}</span>
                </p>
                {blacklistAlert.notes && (
                  <p className="text-xs text-red-200 mt-0.5 font-medium">{blacklistAlert.notes}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setBlacklistAlert(null)}
              className="p-2 text-white hover:bg-black/20 rounded-lg transition"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* SEARCH & CAMERA ANPR CONTROLS */}
        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Vehicle License Plate Number
                </label>
                <div className="relative">
                  <HiOutlineTruck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="e.g., MH-12-AB-3456 or DL-01-XX-9999"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                    className="input-neon w-full pl-11 pr-4 py-3 text-base rounded-xl uppercase font-mono tracking-wider"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cameraActive ? stopCameraANPR : startCameraANPR}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition"
                >
                  <HiOutlineCamera className="w-5 h-5" />
                  {cameraActive ? 'Close Camera' : 'Camera ANPR'}
                </button>

                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="btn-neon flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                >
                  <HiOutlineMagnifyingGlass className="w-5 h-5" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* LIVE CAMERA VIEW FOR ANPR */}
            <AnimatePresence>
              {cameraActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 relative overflow-hidden"
                >
                  <div className="relative w-full max-w-lg aspect-video mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* OCR Scanner Target Reticle */}
                    <div className="absolute inset-8 border-2 border-dashed border-cyan-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between text-[10px] text-cyan-300 font-mono">
                        <span>[ ANPR CAMERA ACTIVE ]</span>
                        <span>ALIGN NUMBER PLATE</span>
                      </div>
                      <motion.div
                        animate={{ y: [0, 80, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                        className="w-full h-0.5 bg-cyan-400 shadow-[0_0_10px_#06b6d4]"
                      />
                      <div className="text-right text-[10px] text-cyan-300 font-mono">
                        AI OCR READY
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 mt-3">
                    <button
                      onClick={handleCapturePlate}
                      disabled={scanningPlate}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition hover:scale-105 disabled:opacity-50"
                    >
                      <HiOutlineSparkles className="w-5 h-5" />
                      {scanningPlate ? 'Extracting Plate Number...' : 'Capture & Scan License Plate'}
                    </button>
                    <button
                      onClick={stopCameraANPR}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="glass-card p-4 rounded-xl border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          {loading && (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <HiOutlineMagnifyingGlass className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold neon-text mb-1">Searching Records...</h3>
            </div>
          )}

          {!loading && searched && results && results.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <HiOutlineMagnifyingGlass className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold neon-text mb-1">No Active Booking Found</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No active or confirmed reservations for "{searchQuery}". You can issue a Walk-in Pass from the Security Dashboard.
              </p>
            </div>
          )}

          {!loading && searched && results && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Found {results.length} booking record{results.length > 1 ? 's' : ''} for "{searchQuery}"
              </p>
              {results.map((result) => (
                <div key={result.id} className="glass-card rounded-2xl p-5 border border-cyan-500/20 shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-cyan-400">
                        <HiOutlineTruck className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-bold font-mono tracking-wider text-white">{result.vehicleNumber}</span>
                          <span className="badge-neon">{result.status}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1 font-mono">
                            <HiOutlineIdentification className="w-3.5 h-3.5 text-cyan-400" />
                            {result.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <HiOutlineUser className="w-3.5 h-3.5 text-cyan-400" />
                            {result.userName}
                          </span>
                          <span className="text-cyan-300 font-bold">Slot {result.slot}</span>
                          <span>{new Date(result.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyEntry(result.id)}
                        disabled={actionLoading === result.id + '-entry' || result.status === 'Entry Done' || result.status === 'active'}
                        className="btn-neon flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                      >
                        <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
                        {actionLoading === result.id + '-entry' ? 'Verifying...' : 'Verify Entry 🟢'}
                      </button>
                      <button
                        onClick={() => handleVerifyExit(result.id)}
                        disabled={actionLoading === result.id + '-exit' || result.status === 'Exit Done' || result.status === 'completed'}
                        className="btn-outline flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 text-pink-400 border-pink-500/30 hover:bg-pink-500/10"
                      >
                        <HiOutlineArrowLeftOnRectangle className="w-4 h-4" />
                        {actionLoading === result.id + '-exit' ? 'Verifying...' : 'Verify Exit 🔴'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !searched && (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <HiOutlineMagnifyingGlass className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold neon-text mb-1">Search or Scan Vehicle Plate</h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Enter a vehicle license plate number or use the Camera ANPR scanner to instantly pull up active bookings and check against the security watchlist.
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ManualPlateVerification;
