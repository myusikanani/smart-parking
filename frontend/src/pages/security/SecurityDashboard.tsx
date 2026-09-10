import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineUserGroup,
  HiOutlineShieldExclamation,
  HiOutlineQrCode,
  HiOutlineMagnifyingGlass,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSpeakerWave,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlineExclamationTriangle,
  HiOutlineTicket,
  HiOutlineMegaphone,
  HiOutlineShieldCheck,
  HiOutlineCamera,
} from 'react-icons/hi2';
import { createWorker, type Worker } from 'tesseract.js';
import StatCard from '../../components/StatCard';
import { securityApi, paymentApi } from '../../services/api';
import SecurityHero3D from '../../components/3d/SecurityHero3D';
import BlacklistModal from './BlacklistModal';
import IncidentModal from './IncidentModal';
import WalkinPassModal from './WalkinPassModal';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

// Same loader used by the Payment page — loads the script only once
const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface ActivityLog {
  id: string | number;
  type: 'entry' | 'exit';
  vehicleNumber: string;
  slot: string;
  time: string;
  driverName?: string;
  status: 'granted' | 'denied';
}

interface ScanResult {
  status: 'granted' | 'denied';
  message: string;
  paymentRequired?: boolean;
  bookingDetails?: {
    slotNumber: string;
    vehicleNumber: string;
    userName: string;
    startTime: string;
    endTime: string;
    bookingId: string;
    overstayFee?: number;
  };
}

// Web Audio API Beep Generator for QR Scanner feedback
const playBeep = (isSuccess: boolean) => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSuccess ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(isSuccess ? 880 : 220, ctx.currentTime);
    if (isSuccess) {
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
    }

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isSuccess ? 0.2 : 0.3));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isSuccess ? 0.2 : 0.3));
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
};

const SecurityDashboard = () => {
  const [gateMode, setGateMode] = useState<'entry' | 'exit'>('entry');
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({
    entries: 0,
    exits: 0,
    occupancy: 0,
    pendingVerifications: 0,
    blacklistedCount: 0,
    openIncidentsCount: 0
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [penaltyError, setPenaltyError] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  // Security Module States
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyType, setEmergencyType] = useState('panic_lockdown');
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [emergencySubmitting, setEmergencySubmitting] = useState(false);
  const [liveAlertBanner, setLiveAlertBanner] = useState<string | null>(null);

  // Load Razorpay checkout script once (used for overstay penalty collection)
  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  // Reusable Universal QR & Plate Scanner states
  const [scannerType, setScannerType] = useState<'qr' | 'plate_ocr'>('qr');
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState('');
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'perm' | 'scanning' | 'detected'>('idle');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // OCR Pipeline States & Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);
  const ocrWorkerRef = useRef<Worker | null>(null);
  const ocrLoopActiveRef = useRef(false);
  const [ocrTelemetry, setOcrTelemetry] = useState<{ text: string; confidence: number; isProcessing: boolean }>({
    text: '',
    confidence: 0,
    isProcessing: false,
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      ocrLoopActiveRef.current = false;
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(err => console.warn(err));
      }
      if (activeMediaStreamRef.current) {
        activeMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate();
      }
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await securityApi.getDashboard();
      if (data.success && data.stats) {
        const s = data.stats as Record<string, unknown>;
        setStats({
          entries: Number(s.todayEntries ?? s.entries ?? 0),
          exits: Number(s.todayExits ?? s.exits ?? 0),
          occupancy: Number(s.currentOccupancy ?? s.occupancy ?? 0),
          pendingVerifications: Number(s.pendingVerifications ?? 0),
          blacklistedCount: Number(s.blacklistedCount ?? 0),
          openIncidentsCount: Number(s.openIncidentsCount ?? 0)
        });
      }
    } catch {
      // Fallback default stats for smooth demo
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleTriggerEmergency = async () => {
    setEmergencySubmitting(true);
    try {
      await securityApi.triggerEmergencySOS({ emergencyType, notes: emergencyNotes });
      setEmergencyActive(true);
      setLiveAlertBanner(`EMERGENCY SOS BROADCAST ACTIVATED (${emergencyType.toUpperCase()}) — Security team alerted & gates opened!`);
      setEmergencyModalOpen(false);
      if (soundEnabled) playBeep(false);
    } catch (err) {
      console.error('Emergency trigger error:', err);
    } finally {
      setEmergencySubmitting(false);
    }
  };

  // Initialize or retrieve Tesseract OCR Worker
  const getOcrWorker = async () => {
    if (ocrWorkerRef.current) return ocrWorkerRef.current;
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      tessedit_pageseg_mode: '7' as unknown as import('tesseract.js').PSM,
    });
    ocrWorkerRef.current = worker;
    return worker;
  };

  // Core Plate OCR Recognition Pipeline
  const processImageForPlateOCR = async (imageSource: CanvasImageSource, sourceWidth: number, sourceHeight: number): Promise<boolean> => {
    try {
      const worker = await getOcrWorker();
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      ctx.drawImage(imageSource, 0, 0, sourceWidth, sourceHeight);

      // Contrast enhancement & Grayscale (adaptive for glare and shadows)
      const imgData = ctx.getImageData(0, 0, sourceWidth, sourceHeight);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const contrast = 1.25;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        const boosted = Math.min(255, Math.max(0, factor * (v - 128) + 128));
        d[i] = boosted;
        d[i + 1] = boosted;
        d[i + 2] = boosted;
      }
      ctx.putImageData(imgData, 0, 0);

      setOcrTelemetry((prev) => ({ ...prev, isProcessing: true }));
      const result = await worker.recognize(canvas);
      const raw = result.data.text || '';
      const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Regex matching for standard plates: State(2) + Num(1-2) + Series(1-3) + Num(4)
      const plateRegex = /[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}/;
      const match = cleaned.match(plateRegex);
      const extractedPlate = match ? match[0] : (cleaned.length >= 4 && cleaned.length <= 14 ? cleaned : '');

      setOcrTelemetry({
        text: extractedPlate || cleaned,
        confidence: Math.round(result.data.confidence || 0),
        isProcessing: false,
      });

      if (extractedPlate && extractedPlate.length >= 4) {
        setScannerStatus('detected');
        if (soundEnabled) playBeep(true);
        stopScanner();
        handleValidateAccess(extractedPlate);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('OCR processing error:', err);
      setOcrTelemetry((prev) => ({ ...prev, isProcessing: false }));
      return false;
    }
  };

  // Run Real-Time Frame Grabber & Optical Recognition Loop
  const runPlateOcrLoop = async () => {
    while (ocrLoopActiveRef.current && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) {
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }

      // Extract ROI: center 80% width, 45% height
      const roiWidth = Math.floor(video.videoWidth * 0.8);
      const roiHeight = Math.floor(video.videoHeight * 0.45);
      const roiX = Math.floor((video.videoWidth - roiWidth) / 2);
      const roiY = Math.floor((video.videoHeight - roiHeight) / 2);

      const canvas = canvasRef.current;
      canvas.width = roiWidth;
      canvas.height = roiHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, roiX, roiY, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight);
        const recognized = await processImageForPlateOCR(canvas, roiWidth, roiHeight);
        if (recognized) {
          break;
        }
      }

      // 300ms frame interval for smooth responsiveness
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  // Start QR Camera Scanner
  const startQRScanner = async () => {
    setCameraPermissionError('');
    if (!window.isSecureContext) {
      setScannerActive(false);
      setScannerStatus('idle');
      setCameraPermissionError(
        'Camera requires a secure connection. Open this dashboard over HTTPS (e.g. https://<server-ip>:4173) or localhost, then allow camera access.'
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionError('This browser does not expose a camera API (mediaDevices unavailable).');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setScannerActive(false);
      setScannerStatus('idle');
      setCameraPermissionError(
        'Camera permission denied or no camera available. Allow camera access in your browser settings and retry.'
      );
      return;
    }
    setScannerStatus('perm');
    setScannerActive(true);
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        qrScannerRef.current = html5QrCode;
        setScannerStatus('scanning');

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (vw: number, vh: number) => {
              const side = Math.min(250, Math.floor(Math.min(vw, vh) * 0.7));
              return { width: side, height: side };
            }
          },
          (decodedText) => {
            setScannerStatus('detected');
            if (soundEnabled) playBeep(true);
            stopScanner();
            handleValidateAccess(decodedText);
          },
          () => {
            // silent frame mismatch handler
          }
        );
      } catch (err) {
        console.error('Camera Scanner start error:', err);
        setScannerActive(false);
        setScannerStatus('idle');
        setCameraPermissionError(
          'Camera permission denied or camera is unavailable. Please check your browser permission settings to enable camera access.'
        );
      }
    }, 300);
  };

  // Start AI Number Plate OCR Scanner
  const startPlateOcrScanner = async () => {
    setCameraPermissionError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionError('Camera API unavailable.');
      return;
    }

    try {
      setScannerStatus('perm');
      setScannerActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      activeMediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerStatus('scanning');
      ocrLoopActiveRef.current = true;
      runPlateOcrLoop();
    } catch (err) {
      console.error('Plate OCR stream error:', err);
      setScannerActive(false);
      setScannerStatus('idle');
      setCameraPermissionError('Failed to initialize license plate camera stream.');
    }
  };

  const startScanner = () => {
    if (scannerType === 'qr') {
      startQRScanner();
    } else {
      startPlateOcrScanner();
    }
  };

  const stopScanner = async () => {
    ocrLoopActiveRef.current = false;
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.warn('Scanner stop warning:', err);
      }
      qrScannerRef.current = null;
    }

    if (activeMediaStreamRef.current) {
      activeMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      activeMediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerActive(false);
    setScannerStatus('idle');
  };

  // Manual Frame Capture
  const handleCaptureFrame = async () => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return;
    const video = videoRef.current;
    setOcrTelemetry((prev) => ({ ...prev, isProcessing: true }));
    const found = await processImageForPlateOCR(video, video.videoWidth, video.videoHeight);
    if (!found) {
      setCameraPermissionError('Plate not clearly recognized in current frame. Please hold steady or adjust lighting.');
    }
  };

  const handleValidateAccess = async (searchQuery?: string) => {
    const raw = (searchQuery || manualInput).trim();
    if (!raw) return;
    // Preserve UUID-shaped QR tokens verbatim (case-sensitive backend match);
    // uppercase everything else (plates / booking ids).
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const query = UUID_RE.test(raw) ? raw : raw.toUpperCase();

    setLoading(true);
    setScanResult(null);

    try {
      const res = await securityApi.scanQR(query, gateMode);
      if (res.success && res.allowed) {
        if (soundEnabled) playBeep(true);
        const b = res.booking as Record<string, unknown>;
        const startStr = b.startTime ? new Date(String(b.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const endStr = b.endTime ? new Date(String(b.endTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        setScanResult({
          status: 'granted',
          message: res.message || (gateMode === 'entry' ? 'ACCESS GRANTED: Valid Parking Booking' : 'EXIT GRANTED: Session Completed'),
          paymentRequired: Boolean(res.paymentRequired),
          bookingDetails: {
            slotNumber: String(b.slotNumber || (b.slot as Record<string, unknown>)?.number || 'A-01'),
            vehicleNumber: String(b.vehicleNumber || ''),
            userName: String(b.userName || (b.user as Record<string, unknown>)?.name || 'Driver'),
            startTime: startStr,
            endTime: endStr,
            bookingId: String(b.id || b._id || ''),
            overstayFee: b.overstayPenalty ? Number(b.overstayPenalty) : undefined
          }
        });
      } else {
        if (soundEnabled) playBeep(false);
        setScanResult({
          status: 'denied',
          message: res.message || 'ACCESS DENIED: Verification failed.'
        });
      }
    } catch (err: unknown) {
      if (soundEnabled) playBeep(false);
      const errMsg = err instanceof Error ? err.message : 'ACCESS DENIED: Invalid or expired QR code/booking.';
      setScanResult({
        status: 'denied',
        message: errMsg.includes('DENIED') ? errMsg : `ACCESS DENIED: ${errMsg}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!scanResult || !scanResult.bookingDetails) return;

    // NOTE: securityApi.scanQR already processed the entry/exit on the backend
    // (booking status, timestamps, slot state). This handler only opens the
    // barrier and records the local activity log — no second processing call,
    // so a QR is processed exactly once per scan.
    setLoading(true);

    try {
      // Trigger barrier opening animation
      setBarrierOpen(true);
      if (soundEnabled) playBeep(true);

      const newLog: ActivityLog = {
        id: Date.now(),
        type: gateMode,
        vehicleNumber: scanResult.bookingDetails.vehicleNumber,
        slot: scanResult.bookingDetails.slotNumber,
        driverName: scanResult.bookingDetails.userName,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: 'granted',
      };

      setLogs((prev) => [newLog, ...prev]);
      if (gateMode === 'entry') {
        setStats((s) => ({ ...s, entries: s.entries + 1, occupancy: Math.min(100, s.occupancy + 2) }));
      } else {
        setStats((s) => ({ ...s, exits: s.exits + 1, occupancy: Math.max(0, s.occupancy - 2) }));
      }

      setTimeout(() => {
        setBarrierOpen(false);
        setScanResult(null);
        setManualInput('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Collect overstay penalty via Razorpay Test Mode, then complete the exit.
  // The booking is NOT completed until this payment is verified by the backend.
  const handleCollectPenalty = async () => {
    if (!scanResult?.bookingDetails) return;
    const bId = scanResult.bookingDetails.bookingId;
    const penalty = scanResult.bookingDetails.overstayFee || 0;
    if (!bId || penalty <= 0) return;

    setLoading(true);
    setPenaltyError('');

    try {
      const orderRes = await paymentApi.createOrder(bId, 'penalty');
      if (!orderRes.success) {
        setPenaltyError(orderRes.message || 'Could not start penalty payment.');
        setLoading(false);
        return;
      }

      let verifyRes;
      if (scriptReady && window.Razorpay && !orderRes.isTestMode) {
        // Real Razorpay checkout (Test keys configured)
        await new Promise<void>((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: orderRes.keyId,
            amount: orderRes.amount,
            currency: orderRes.currency,
            order_id: orderRes.orderId,
            name: 'ParkSmart',
            description: `Overstay penalty — ${scanResult?.bookingDetails?.vehicleNumber || 'vehicle'}`,
            theme: { color: '#f59e0b' },
            handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              verifyRes = paymentApi.verify({
                bookingId: bId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                type: 'penalty',
              });
              resolve();
            },
            modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          });
          razorpay.open();
        });
      } else {
        // Razorpay Test Mode / Simulation
        verifyRes = paymentApi.verify({
          bookingId: bId,
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: `test_sig_${Date.now()}`,
          type: 'penalty',
        });
      }

      const result = await verifyRes;
      if (!result?.success) {
        setPenaltyError('Penalty payment verification failed. Please retry.');
        setLoading(false);
        return;
      }

      // Payment verified — exit completed on backend, open the barrier
      setBarrierOpen(true);
      if (soundEnabled) playBeep(true);

      const newLog: ActivityLog = {
        id: Date.now(),
        type: 'exit',
        vehicleNumber: scanResult.bookingDetails.vehicleNumber,
        slot: scanResult.bookingDetails.slotNumber,
        driverName: scanResult.bookingDetails.userName,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: 'granted',
      };
      setLogs((prev) => [newLog, ...prev]);
      setStats((s) => ({ ...s, exits: s.exits + 1, occupancy: Math.max(0, s.occupancy - 2) }));

      setTimeout(() => {
        setBarrierOpen(false);
        setScanResult(null);
        setManualInput('');
      }, 3000);
    } catch (err) {
      if (err instanceof Error && err.message === 'Payment cancelled') {
        setPenaltyError('Payment cancelled — exit remains blocked until the penalty is paid.');
      } else {
        setPenaltyError(err instanceof Error ? err.message : 'Penalty collection failed. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* LIVE EMERGENCY SOS BANNER */}
      {liveAlertBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl shadow-red-500/50 border border-red-400 flex items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white text-xl">🚨</div>
            <div>
              <h4 className="font-extrabold text-sm tracking-wide">ACTIVE SECURITY BROADCAST</h4>
              <p className="text-xs text-red-100">{liveAlertBanner}</p>
            </div>
          </div>
          <button
            onClick={() => setLiveAlertBanner(null)}
            className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-xs font-bold text-white transition"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* 1. GATE CONTROL HEADER */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4 glass-card p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Gate Access Control Desk</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">Real-time QR verification, license plate lookup, and barrier gate control</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'
            }`}
            title="Toggle Audio Beep Feedback"
          >
            <HiOutlineSpeakerWave className="w-5 h-5" />
          </button>

          <div className="text-right">
            <p className="font-mono text-lg font-bold text-cyan-300 tracking-wider">{formatTime(time)}</p>
            <p className="text-[11px] text-gray-400">{formatDate(time)}</p>
          </div>
        </div>
      </motion.div>

      {/* RAPID SECURITY ACTION TOOLBAR */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setEmergencyModalOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-red-700 via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-500 shadow-lg shadow-red-600/30 border border-red-500/40 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiOutlineExclamationTriangle className="w-5 h-5 animate-bounce" />
          <span>EMERGENCY SOS 🚨</span>
        </button>

        <button
          onClick={() => setBlacklistOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-slate-900/80 hover:bg-slate-800/90 border border-red-500/30 hover:border-red-500/60 shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiOutlineShieldExclamation className="w-5 h-5 text-red-400" />
          <span>Watchlist ({stats.blacklistedCount})</span>
        </button>

        <button
          onClick={() => setIncidentOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-slate-900/80 hover:bg-slate-800/90 border border-amber-500/30 hover:border-amber-500/60 shadow-lg transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiOutlineMegaphone className="w-5 h-5 text-amber-400" />
          <span>Incidents ({stats.openIncidentsCount})</span>
        </button>

        <button
          onClick={() => setWalkinOpen(true)}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/25 border border-cyan-400/30 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <HiOutlineTicket className="w-5 h-5" />
          <span>+ Walk-in Spot Pass</span>
        </button>
      </motion.div>

      {/* 3D SURVEILLANCE & ALPR HUD CANVAS */}
      <motion.div variants={itemVariants}>
        <SecurityHero3D />
      </motion.div>

      {/* 2. STATS ROW */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<HiOutlineArrowRightOnRectangle className="w-5 h-5 text-emerald-400" />}
          title="Today Entries"
          value={String(stats.entries)}
        />
        <StatCard
          icon={<HiOutlineArrowLeftOnRectangle className="w-5 h-5 text-orange-400" />}
          title="Today Exits"
          value={String(stats.exits)}
        />
        <StatCard
          icon={<HiOutlineUserGroup className="w-5 h-5 text-cyan-400" />}
          title="Live Occupancy"
          value={`${stats.occupancy}%`}
        />
        <StatCard
          icon={<HiOutlineShieldExclamation className="w-5 h-5 text-pink-400" />}
          title="Pending Queue"
          value={String(stats.pendingVerifications)}
        />
      </motion.div>

      {/* 3. CORE GATE ACCESS CONTROL WORKSTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SCANNER & VERIFICATION WORKSTATION */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-5">
          {/* MODE TOGGLE: ENTRY GATE VS EXIT GATE */}
          <div className="glass-card p-2 rounded-2xl flex items-center gap-2">
            <button
              onClick={() => { setGateMode('entry'); setScanResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all ${
                gateMode === 'entry'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              ENTRY GATE MODE 🟢
            </button>
            <button
              onClick={() => { setGateMode('exit'); setScanResult(null); }}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all ${
                gateMode === 'exit'
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HiOutlineArrowLeftOnRectangle className="w-5 h-5" />
              EXIT GATE MODE 🔴
            </button>
          </div>

          {/* SCANNER HARDWARE MODE: QR CODE VS AI LICENSE PLATE OCR */}
          <div className="glass-card p-1.5 rounded-2xl flex items-center gap-2">
            <button
              onClick={() => {
                if (scannerActive) stopScanner();
                setScannerType('qr');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                scannerType === 'qr'
                  ? 'btn-neon text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HiOutlineQrCode className="w-5 h-5" />
              📱 QR Code Pass
            </button>
            <button
              onClick={() => {
                if (scannerActive) stopScanner();
                setScannerType('plate_ocr');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                scannerType === 'plate_ocr'
                  ? 'btn-neon text-white shadow-lg bg-gradient-to-r from-emerald-600 to-cyan-600'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HiOutlineCamera className="w-5 h-5 text-emerald-400" />
              🚘 AI License Plate OCR
            </button>
          </div>

          {/* SCANNER & PLATE LOOKUP CONTROL BOX */}
          <div className="glass-card p-5 sm:p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {scannerType === 'qr' ? (
                  <HiOutlineQrCode className="w-5 h-5 text-cyan-400" />
                ) : (
                  <HiOutlineCamera className="w-5 h-5 text-emerald-400" />
                )}
                {scannerType === 'qr' ? 'Scan Customer QR Pass' : 'Real-Time AI License Plate Scanner'}
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                {scannerType === 'qr' ? 'QR Viewfinder' : 'Live ALPR Vision'}
              </span>
            </div>

            {/* Viewfinder Container */}
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-950/40 border border-white/10 relative overflow-hidden">
              {scannerActive ? (
                <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden bg-black flex flex-col justify-between">
                  {/* QR Viewfinder Container */}
                  <div id="qr-reader" className={`w-full h-full ${scannerType === 'qr' ? 'block' : 'hidden'}`} />
                  
                  {/* AI Plate OCR Video Element */}
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className={`w-full h-full object-cover ${scannerType === 'plate_ocr' ? 'block' : 'hidden'}`}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* AI Holographic Target Reticle for License Plates */}
                  {scannerType === 'plate_ocr' && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 z-10">
                      <div className="relative w-full max-w-[280px] h-24 border-2 border-dashed border-emerald-400/80 rounded-xl bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.3)] flex flex-col items-center justify-between p-2">
                        <div className="w-full flex justify-between">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-black/60 px-1.5 py-0.5 rounded">
                            AI ALPR TARGET
                          </span>
                          <span className="text-[10px] font-mono text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded">
                            {ocrTelemetry.confidence}% CONF
                          </span>
                        </div>
                        {ocrTelemetry.text && (
                          <div className="text-center font-mono font-black text-sm tracking-wider text-emerald-300 bg-black/80 px-3 py-1 rounded-lg border border-emerald-500/40">
                            {ocrTelemetry.text}
                          </div>
                        )}
                        <span className="text-[9px] text-gray-300">Align vehicle number plate in box</span>
                      </div>
                    </div>
                  )}

                  {/* Overlay scanning animation and status banners */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-md" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-md" />
                    </div>
                    
                    <div className="self-center bg-cyan-950/90 text-cyan-400 text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 animate-pulse flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      {scannerStatus === 'perm'
                        ? 'Allow Camera Access'
                        : scannerStatus === 'scanning'
                        ? scannerType === 'qr'
                          ? 'Scanning QR Pass...'
                          : 'AI Reading License Plate...'
                        : 'Target Detected!'}
                    </div>
                    
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-md" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-md" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center space-y-4">
                  {scannerType === 'qr' ? (
                    <HiOutlineQrCode className="w-16 h-16 text-cyan-400/30 mx-auto animate-pulse" />
                  ) : (
                    <HiOutlineCamera className="w-16 h-16 text-emerald-400/30 mx-auto animate-pulse" />
                  )}
                  <p className="text-sm text-gray-400">
                    {window.isSecureContext
                      ? scannerType === 'qr'
                        ? 'QR Camera Standby — tap "Start Camera QR Scanner"'
                        : 'AI Plate Scanner Standby — tap "Start AI Plate Scanner"'
                      : 'Camera unavailable on this connection — open over HTTPS to enable scanning'}
                  </p>
                </div>
              )}

              <div className="w-full mt-4 flex gap-3 flex-wrap">
                {!scannerActive ? (
                  <button
                    onClick={startScanner}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:opacity-90 text-white shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <HiOutlineCamera className="w-5 h-5" /> Start {scannerType === 'qr' ? 'QR Pass Scanner' : 'AI Plate Scanner'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopScanner}
                      className="flex-1 py-3 px-6 rounded-xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center gap-2 transition-all"
                    >
                      🛑 Stop Camera Scanner
                    </button>
                    {scannerType === 'plate_ocr' && (
                      <button
                        onClick={handleCaptureFrame}
                        className="py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-95 text-white shadow-lg flex items-center justify-center gap-2"
                      >
                        <HiOutlineSparkles className="w-5 h-5" /> Capture Now
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {cameraPermissionError && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-start gap-2">
                <HiOutlineShieldExclamation className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Camera Permission Denied</p>
                  <p className="text-xs mt-1 text-red-300/80">{cameraPermissionError}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Enter QR Token, Booking ID or Vehicle Plate..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateAccess()}
                  className="input-neon w-full pl-11 text-sm font-mono"
                />
              </div>
              <button
                onClick={() => handleValidateAccess()}
                disabled={loading || !manualInput}
                className="btn-neon px-6 py-3 rounded-xl text-sm font-bold whitespace-nowrap disabled:opacity-50"
              >
                {loading ? 'Validating...' : 'Verify Access'}
              </button>
            </div>

          </div>

          {/* INSTANT RESULT VERIFICATION CARD (GREEN = GRANTED, RED = DENIED) */}
          <AnimatePresence mode="wait">
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className={`rounded-2xl p-6 border shadow-2xl relative overflow-hidden ${
                  scanResult.status === 'granted'
                    ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-900/40 border-emerald-500/50 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-red-950/80 via-slate-900 to-pink-950/40 border-red-500/50 shadow-red-500/20'
                }`}
              >
                {/* STATUS BADGE HEADER */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    {scanResult.status === 'granted' ? (
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_#10b981]">
                        <HiOutlineCheckCircle className="w-8 h-8" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_#ef4444]">
                        <HiOutlineXCircle className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <span className={`text-xs font-extrabold uppercase tracking-widest ${
                        scanResult.status === 'granted' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {scanResult.status === 'granted' ? 'ACCESS GRANTED 🟢' : 'ACCESS DENIED 🔴'}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{scanResult.message}</h3>
                    </div>
                  </div>
                </div>

                {/* BOOKING DETAILS BODY */}
                {scanResult.bookingDetails ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-xs text-gray-400">Assigned Slot</p>
                        <p className="text-xl font-extrabold text-cyan-300 mt-0.5">
                          {scanResult.bookingDetails.slotNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Vehicle Number</p>
                        <p className="text-sm font-bold font-mono text-white mt-1">
                          {scanResult.bookingDetails.vehicleNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Driver Name</p>
                        <p className="text-sm font-bold text-white mt-1">
                          {scanResult.bookingDetails.userName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Booking Time</p>
                        <p className="text-xs font-semibold text-gray-300 mt-1">
                          {scanResult.bookingDetails.startTime} - {scanResult.bookingDetails.endTime}
                        </p>
                      </div>
                    </div>

                    {/* OVERSTAY PENALTY COLLECTION (exit blocked until paid) */}
                    {scanResult.paymentRequired && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                            <HiOutlineExclamationTriangle className="w-5 h-5" />
                            Overstay Penalty Due
                          </div>
                          <span className="text-xl font-extrabold text-amber-300">
                            ₹{scanResult.bookingDetails.overstayFee}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Vehicle overstayed its booked window. Collect the additional amount via Razorpay before
                          allowing exit — the booking stays ACTIVE until payment is verified.
                        </p>
                        {penaltyError && (
                          <p className="text-xs text-red-400">{penaltyError}</p>
                        )}
                        <button
                          onClick={handleCollectPenalty}
                          disabled={loading || barrierOpen}
                          className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30"
                        >
                          {loading ? 'Processing Payment…' : `Collect ₹${scanResult.bookingDetails.overstayFee} & Allow Exit`}
                        </button>
                      </div>
                    )}

                    {/* GATE ALLOW ACTION BUTTON */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {barrierOpen ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm animate-pulse">
                            <HiOutlineLockOpen className="w-5 h-5" />
                            Barrier Opening... Gate Unlocked!
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <HiOutlineLockClosed className="w-4 h-4 text-cyan-400" />
                            Barrier Locked & Ready
                          </div>
                        )}
                      </div>

                      {!scanResult.paymentRequired && (
                        <button
                          onClick={handleGrantAccess}
                          disabled={barrierOpen}
                          className={`px-7 py-3 rounded-xl font-extrabold text-sm uppercase tracking-wider shadow-lg transition-all ${
                            gateMode === 'entry'
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30'
                              : 'bg-pink-500 hover:bg-pink-400 text-white shadow-pink-500/30'
                          }`}
                        >
                          {barrierOpen
                            ? 'Opening Gate Barrier...'
                            : gateMode === 'entry'
                            ? 'Confirm & Allow Entry'
                            : 'Confirm & Allow Exit'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-300 pt-1">
                    Please instruct the driver to make a valid booking via the driver app or contact the parking desk.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* BARRIER & QUICK CONTROLS SIDEBAR */}
        <motion.div variants={itemVariants} className="space-y-5">
          {/* BARRIER GATE STATUS CARD */}
          <div className="glass-card p-5 rounded-2xl text-center space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
              <span>Main Entrance Barrier</span>
              <span className="text-cyan-400 font-mono">Gate ID: G1</span>
            </div>

            <div className="py-4">
              {barrierOpen ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_#10b981]"
                >
                  <HiOutlineLockOpen className="w-10 h-10 animate-bounce" />
                </motion.div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-3xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <HiOutlineLockClosed className="w-10 h-10" />
                </div>
              )}
            </div>

            <div>
              <p className={`text-base font-extrabold uppercase ${barrierOpen ? 'text-emerald-400' : 'text-gray-300'}`}>
                {barrierOpen ? 'BARRIER OPENING' : 'BARRIER CLOSED'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Automated servo barrier control</p>
            </div>

            <button
              onClick={() => {
                setBarrierOpen(!barrierOpen);
                if (soundEnabled) playBeep(!barrierOpen);
              }}
              className="w-full btn-outline py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              {barrierOpen ? 'Emergency Close Barrier' : 'Emergency Manual Open'}
            </button>
          </div>

          {/* ZONE OCCUPANCY RADAR SUMMARY */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4 text-cyan-400" />
              Zone Parking Availability
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <span className="text-gray-300">Ground Floor (Standard)</span>
                <span className="font-bold text-pink-400">82% Full</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <span className="text-gray-300">Basement Zone (EV Charge)</span>
                <span className="font-bold text-emerald-400">45% Available</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                <span className="text-gray-300">VIP & Accessible Zone</span>
                <span className="font-bold text-cyan-400">60% Available</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. TODAY'S LIVE GATE MOVEMENTS LOG */}
      <motion.div variants={itemVariants} className="glass-card p-5 sm:p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-cyan-400" />
              Today's Live Gate Movements
            </h2>
            <p className="text-xs text-gray-400">Real-time log of vehicles entering and exiting the campus</p>
          </div>
          <span className="badge-neon text-xs font-mono">{logs.length} Scans Today</span>
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Gate Mode</th>
                  <th className="pb-3">Vehicle Plate</th>
                  <th className="pb-3">Driver Name</th>
                  <th className="pb-3">Slot</th>
                  <th className="pb-3 text-right">Time</th>
                  <th className="pb-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        log.type === 'entry' ? 'badge-green' : 'badge-orange'
                      }`}>
                        {log.type === 'entry' ? 'ENTRY 🟢' : 'EXIT 🔴'}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-cyan-300">
                      {log.vehicleNumber}
                    </td>
                    <td className="py-3 text-gray-300">
                      {log.driverName || 'Driver'}
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {log.slot}
                    </td>
                    <td className="py-3 text-right font-mono text-xs text-gray-400">
                      {log.time}
                    </td>
                    <td className="py-3 text-center">
                      <span className="badge-neon text-xs">Granted</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500">
            <HiOutlineTruck className="w-12 h-12 mx-auto opacity-30 mb-2" />
            <p className="text-sm font-semibold">No gate scans recorded yet today</p>
            <p className="text-xs text-gray-400">Validated QR scans and manual plate entries will appear here automatically.</p>
          </div>
        )}
      </motion.div>

      {/* SECURITY MODALS */}
      <BlacklistModal
        isOpen={blacklistOpen}
        onClose={() => setBlacklistOpen(false)}
        onUpdateCount={(count) => setStats(s => ({ ...s, blacklistedCount: count }))}
      />

      <IncidentModal
        isOpen={incidentOpen}
        onClose={() => setIncidentOpen(false)}
        onUpdateCount={(count) => setStats(s => ({ ...s, openIncidentsCount: count }))}
      />

      <WalkinPassModal
        isOpen={walkinOpen}
        onClose={() => setWalkinOpen(false)}
        onSuccess={() => {
          fetchDashboard();
          setStats(s => ({ ...s, entries: s.entries + 1, occupancy: Math.min(100, s.occupancy + 2) }));
        }}
      />

      {/* EMERGENCY SOS MODAL */}
      <AnimatePresence>
        {emergencyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl shadow-red-500/40 text-white space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-600/30 text-red-400 border border-red-500/50">
                  <HiOutlineExclamationTriangle className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-wide text-white">TRIGGER EMERGENCY SOS</h3>
                  <p className="text-xs text-red-300">Broadcasts alert to all guard stations & unlocks barriers</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Emergency Protocol Type</label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="panic_lockdown">🚨 Security Lockdown / Threat</option>
                    <option value="fire_evacuation">🔥 Fire / Evacuation (All Gates Open)</option>
                    <option value="police_pursuit">🚔 Police Pursuit / Stolen Vehicle Block</option>
                    <option value="medical_emergency">🚑 Medical / Ambulance Priority Access</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Situation Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    placeholder="e.g. Smoke detected near Basement Zone B. Open Gate 1 immediately."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={emergencySubmitting}
                  onClick={handleTriggerEmergency}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/40 transition disabled:opacity-50"
                >
                  {emergencySubmitting ? 'Broadcasting...' : 'ACTIVATE SOS 🚨'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SecurityDashboard;
