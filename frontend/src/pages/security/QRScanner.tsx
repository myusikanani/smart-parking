import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { createWorker, type Worker } from 'tesseract.js';
import {
  HiOutlineQrCode,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineShieldExclamation,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineSpeakerWave,
  HiOutlineLightBulb,
  HiOutlineBolt,
  HiOutlineCamera,
  HiOutlineExclamationTriangle,
  HiOutlineTicket,
  HiOutlinePhoto,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { securityApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';
import BlacklistModal from './BlacklistModal';
import IncidentModal from './IncidentModal';
import WalkinPassModal from './WalkinPassModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface ScanRecord {
  id: number;
  bookingId: string;
  slotNumber?: string;
  vehicleNumber?: string;
  type: 'entry' | 'exit';
  status: 'success' | 'failed';
  time: string;
}

interface ScanResult {
  bookingId: string;
  status: 'success' | 'failed';
  message: string;
  type?: 'entry' | 'exit';
  booking?: Record<string, unknown>;
  blacklisted?: boolean;
  blacklistDetails?: Record<string, unknown>;
  vehicleNumber?: string;
  unbookedVehicle?: boolean;
}

// Web Audio API Beep & Siren Generator
const playBeep = (isSuccess: boolean, isBlacklisted: boolean = false) => {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isBlacklisted) {
      // Urgent siren warble for blacklist alert
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      return;
    }

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
    // Ignore audio context autoplay errors
  }
};

const QRScanner = () => {
  // Gate & Scan Modes
  const [gateMode, setGateMode] = useState<'entry' | 'exit'>('entry');
  const [scannerType, setScannerType] = useState<'qr' | 'plate_ocr'>('qr');
  const [bookingId, setBookingId] = useState('');
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Auto-Scan (Continuous) Mode & Cooldown
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  // Hardware Torch state
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);

  // Scanner States
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState('');
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'perm' | 'scanning' | 'detected'>('idle');
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // OCR Pipeline States & Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ocrWorkerRef = useRef<Worker | null>(null);
  const ocrLoopActiveRef = useRef(false);
  const [ocrTelemetry, setOcrTelemetry] = useState<{ text: string; confidence: number; isProcessing: boolean }>({
    text: '',
    confidence: 0,
    isProcessing: false,
  });

  // Modal States for 1-Click Actions
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [actionVehiclePlate, setActionVehiclePlate] = useState('');

  // Clean up scanner and workers on unmount
  useEffect(() => {
    return () => {
      ocrLoopActiveRef.current = false;
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch((err) => console.warn(err));
      }
      if (activeMediaStreamRef.current) {
        activeMediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate();
      }
    };
  }, []);

  // Handle hardware torch toggle
  const toggleTorch = async () => {
    if (!activeMediaStreamRef.current) return;
    const track = activeMediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const newTorch = !torchEnabled;
      // @ts-expect-error - Torch is standard in modern mobile browsers
      await track.applyConstraints({ advanced: [{ torch: newTorch }] });
      setTorchEnabled(newTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Initialize or retrieve Tesseract OCR Worker
  const getOcrWorker = async () => {
    if (ocrWorkerRef.current) return ocrWorkerRef.current;
    const worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      tessedit_pageseg_mode: '7' as unknown as import('tesseract.js').PSM, // single line text
    });
    ocrWorkerRef.current = worker;
    return worker;
  };

  // Start QR Camera Scanner
  const startQRScanner = async () => {
    setCameraPermissionError('');
    if (!window.isSecureContext) {
      setCameraPermissionError('Camera requires a secure connection. Open over HTTPS or localhost.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionError('This browser does not expose a mediaDevices camera API.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      activeMediaStreamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setTorchSupported(Boolean(capabilities.torch));
      track.stop();
    } catch {
      setCameraPermissionError('Camera permission denied or no camera available. Please allow access.');
      return;
    }

    setScannerStatus('perm');
    setScannerActive(true);

    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-scanner-viewport');
        qrScannerRef.current = html5QrCode;
        setScannerStatus('scanning');

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: (vw: number, vh: number) => {
              const side = Math.min(250, Math.floor(Math.min(vw, vh) * 0.7));
              return { width: side, height: side };
            },
          },
          (decodedText) => {
            setScannerStatus('detected');
            if (soundEnabled) playBeep(true);
            stopScanner();
            handleVerify(decodedText);
          },
          () => {
            // Frame mismatch ignored
          }
        );
      } catch (err) {
        console.error('QR Scanner error:', err);
        setScannerActive(false);
        setScannerStatus('idle');
        setCameraPermissionError('Camera access denied or unavailable. Please enable permissions.');
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
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      setTorchSupported(Boolean(capabilities.torch));

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
        handleVerify(extractedPlate);
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

  // Handle Photo / Image Upload for License Plate OCR
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraPermissionError('');
    setOcrTelemetry({ text: 'Analyzing image file...', confidence: 0, isProcessing: true });

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const found = await processImageForPlateOCR(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
      if (!found) {
        setCameraPermissionError('Could not clearly read a license plate from the uploaded image. Please try a clearer photo or enter manually.');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setCameraPermissionError('Failed to load image file. Please try another picture.');
    };
    img.src = objectUrl;
    e.target.value = '';
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
    setTorchEnabled(false);
  };

  // Master Verification Handler (Processes QR Token or Vehicle License Plate)
  const handleVerify = useCallback(async (manualToken?: string) => {
    const token = (manualToken || bookingId).trim();
    if (!token) return;

    setScanning(true);
    setLastResult(null);

    try {
      const res = await securityApi.scanQR(token, gateMode);
      const isSuccess = Boolean(res.success && res.allowed);
      const isBlacklist = Boolean(res.blacklisted);

      if (soundEnabled) playBeep(isSuccess, isBlacklist);

      const b = (res.booking || {}) as Record<string, unknown>;
      const bId = String(b.bookingId || b._id || b.id || token);
      const slotNum = String(b.slotNumber || (b.slot as Record<string, unknown>)?.number || 'A-01');
      const vehicleNum = String(res.vehicleNumber || b.vehicleNumber || token);

      const newScan: ScanRecord = {
        id: Date.now(),
        bookingId: bId,
        slotNumber: slotNum,
        vehicleNumber: vehicleNum,
        type: gateMode,
        status: isSuccess ? 'success' : 'failed',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setScans((prev) => [newScan, ...prev]);
      setLastResult({
        bookingId: bId,
        status: isSuccess ? 'success' : 'failed',
        message: res.message || (isSuccess ? (gateMode === 'entry' ? 'ENTRY ALLOWED 🟢' : 'EXIT SUCCESSFUL 🟢') : 'Scan validation failed'),
        type: gateMode,
        booking: b,
        blacklisted: isBlacklist,
        blacklistDetails: res.blacklistDetails as Record<string, unknown> | undefined,
        vehicleNumber: vehicleNum,
        unbookedVehicle: Boolean(res.unbookedVehicle),
      });

      setBookingId('');

      // Auto-Scan Cooldown & Resume Handler
      if (autoScanEnabled) {
        setCooldownSeconds(2);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid or expired pass';
      const isBlacklisted = errMsg.includes('BLACKLISTED') || errMsg.includes('CRITICAL');
      if (soundEnabled) playBeep(false, isBlacklisted);

      const failedScan: ScanRecord = {
        id: Date.now(),
        bookingId: token,
        vehicleNumber: token,
        type: gateMode,
        status: 'failed',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setScans((prev) => [failedScan, ...prev]);
      setLastResult({
        bookingId: token,
        vehicleNumber: token,
        status: 'failed',
        message: errMsg.includes('DENIED') || errMsg.includes('CRITICAL') ? errMsg : `ACCESS DENIED: ${errMsg}`,
        type: gateMode,
        blacklisted: isBlacklisted,
      });

      setBookingId('');

      if (autoScanEnabled) {
        setCooldownSeconds(2);
      }
    } finally {
      setScanning(false);
    }
  }, [autoScanEnabled, bookingId, gateMode, soundEnabled]);

  // Auto-Scan 2-Second Cooldown Timer Ticker
  useEffect(() => {
    if (cooldownSeconds === null) return;
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds((prev) => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(timer);
    }

    if (cooldownSeconds === 0) {
      setCooldownSeconds(null);
      // Auto-resume scanner
      startScanner();
    }
  }, [cooldownSeconds]);

  return (
    <div className="min-h-screen grid-bg pb-12" style={{ backgroundColor: 'var(--bg)' }}>
      {/* 1-CLICK ACTION MODALS */}
      <BlacklistModal
        isOpen={blacklistModalOpen}
        onClose={() => setBlacklistModalOpen(false)}
        initialVehicleNumber={actionVehiclePlate}
      />
      <IncidentModal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        initialVehicleNumber={actionVehiclePlate}
      />
      <WalkinPassModal
        isOpen={walkinModalOpen}
        onClose={() => setWalkinModalOpen(false)}
        initialVehicleNumber={actionVehiclePlate}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
        {/* HEADER */}
        <motion.div variants={itemVariants} className="glass-card p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4">
          <div className="relative">
            <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                <CarSedan className="w-20 h-auto" color="#06b6d4" />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Universal AI Gate Scanner</h1>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              Dual-mode QR Code Pass reader & Real-Time License Plate OCR Scanner
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* TORCH TOGGLE */}
            {torchSupported && scannerActive && (
              <button
                onClick={toggleTorch}
                className={`p-2.5 rounded-xl border transition-all ${
                  torchEnabled ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/30' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title="Toggle Torch / Flashlight"
              >
                <HiOutlineLightBulb className="w-5 h-5" />
              </button>
            )}

            {/* AUTO-SCAN TOGGLE */}
            <button
              onClick={() => setAutoScanEnabled(!autoScanEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                autoScanEnabled
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title="Continuous Auto-Scan after 2s cooldown"
            >
              <HiOutlineBolt className={`w-4 h-4 ${autoScanEnabled ? 'text-cyan-400 animate-pulse' : ''}`} />
              Auto-Scan: {autoScanEnabled ? 'ON' : 'OFF'}
            </button>

            {/* SOUND TOGGLE */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition-colors ${
                soundEnabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'
              }`}
              title="Toggle Audio Feedback"
            >
              <HiOutlineSpeakerWave className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* SCANNER HARDWARE MODE: QR CODE VS AI LICENSE PLATE OCR */}
        <motion.div variants={itemVariants} className="glass-card p-1.5 rounded-2xl flex items-center gap-2">
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
        </motion.div>

        {/* GATE DIRECTION TOGGLE: ENTRY SCAN VS EXIT SCAN */}
        <motion.div variants={itemVariants} className="glass-card p-1.5 rounded-2xl flex items-center gap-2">
          <button
            onClick={() => {
              setGateMode('entry');
              setLastResult(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              gateMode === 'entry'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            ENTRY GATE 🟢
          </button>
          <button
            onClick={() => {
              setGateMode('exit');
              setLastResult(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              gateMode === 'exit'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HiOutlineArrowLeftOnRectangle className="w-5 h-5" />
            EXIT GATE 🔴
          </button>
        </motion.div>

        {/* SCANNER VIEWPORT */}
        <motion.div variants={itemVariants} className="flex flex-col items-center">
          <div className="glass-card rounded-2xl p-6 sm:p-8 w-full">
            <div className="flex flex-col items-center">
              {scannerActive ? (
                <div className="relative w-full max-w-md aspect-video sm:aspect-square rounded-2xl overflow-hidden mb-4 bg-black border-2 border-cyan-500/50 shadow-2xl">
                  {/* QR Viewport Container */}
                  <div id="qr-scanner-viewport" className={`w-full h-full ${scannerType === 'qr' ? 'block' : 'hidden'}`} />

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

                  {/* Status Badges on Viewport */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                      <div className="w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
                    </div>

                    <div className="self-center bg-cyan-950/90 text-cyan-400 text-xs px-4 py-1.5 rounded-full border border-cyan-500/30 animate-pulse flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      {scannerStatus === 'perm'
                        ? 'Allow Camera Access'
                        : scannerStatus === 'scanning'
                        ? scannerType === 'qr'
                          ? 'Scanning QR Pass...'
                          : 'AI Reading License Plate...'
                        : 'Target Detected!'}
                    </div>

                    <div className="flex justify-between">
                      <div className="w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
                      <div className="w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full max-w-[280px] aspect-square mx-auto rounded-2xl overflow-hidden mb-4 border-2 border-cyan-500/40 animate-pulse flex flex-col items-center justify-center bg-black/40 p-6 text-center">
                  {scannerType === 'qr' ? (
                    <HiOutlineQrCode className="w-20 h-20 text-cyan-400/30 mb-2" />
                  ) : (
                    <HiOutlineCamera className="w-20 h-20 text-emerald-400/30 mb-2" />
                  )}
                  <p className="text-xs font-semibold text-gray-300">
                    {scannerType === 'qr' ? 'QR Scanner Standby' : 'AI Plate OCR Standby'}
                  </p>
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-pink-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-pink-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  </div>
                </div>
              )}

              {/* COOLDOWN INDICATOR */}
              {cooldownSeconds !== null && (
                <div className="mb-3 px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <HiOutlineClock className="w-4 h-4" /> Next vehicle auto-scan in {cooldownSeconds}s...
                </div>
              )}

              <p className="text-xs text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                {scannerActive
                  ? scannerType === 'qr'
                    ? 'Position the customer QR pass inside the viewfinder'
                    : 'Point camera at the front or rear vehicle license plate'
                  : 'Camera is currently in standby mode'}
              </p>

              {/* HIDDEN FILE INPUT FOR UPLOADS */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
                {!scannerActive ? (
                  <>
                    <button
                      onClick={startScanner}
                      className="flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:opacity-90 text-white shadow-xl flex items-center justify-center gap-2"
                    >
                      <HiOutlineCamera className="w-5 h-5" /> Start {scannerType === 'qr' ? 'QR Pass Scanner' : 'AI Plate Scanner'}
                    </button>
                    {scannerType === 'plate_ocr' && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="py-3 px-5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 shadow-lg flex items-center justify-center gap-2"
                      >
                        <HiOutlinePhoto className="w-5 h-5" /> Upload Plate Image
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={stopScanner}
                      className="flex-1 py-3 px-5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-2"
                    >
                      🛑 Stop Camera
                    </button>
                    {scannerType === 'plate_ocr' && (
                      <button
                        onClick={handleCaptureFrame}
                        className="py-3 px-5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-95 text-white shadow-lg flex items-center justify-center gap-2"
                      >
                        <HiOutlineSparkles className="w-5 h-5" /> Capture Now
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* PERMISSION ERROR ALERT */}
        {cameraPermissionError && (
          <motion.div variants={itemVariants} className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-start gap-3">
            <HiOutlineShieldExclamation className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Camera Permission Denied</p>
              <p className="mt-1 text-red-300">{cameraPermissionError}</p>
            </div>
          </motion.div>
        )}

        {/* SCAN RESULT CARD & LIVE BOOM BARRIER ANIMATION */}
        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              variants={itemVariants}
            >
              <div
                className={`rounded-2xl p-6 border shadow-2xl ${
                  lastResult.status === 'success'
                    ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-900/40 border-emerald-500/50 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-red-950/90 via-slate-900 to-pink-950/40 border-red-500/50 shadow-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {lastResult.status === 'success' ? (
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_#10b981]">
                        <HiOutlineCheck className="w-8 h-8" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_#ef4444]">
                        <HiOutlineXMark className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <span
                        className={`text-xs font-extrabold uppercase tracking-widest ${
                          lastResult.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {lastResult.status === 'success'
                          ? lastResult.type === 'entry'
                            ? 'ENTRY ALLOWED 🟢'
                            : 'EXIT SUCCESSFUL 🟢'
                          : lastResult.blacklisted
                          ? '🚨 CRITICAL BLACKLIST ALERT'
                          : 'ACCESS DENIED 🔴'}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{lastResult.message}</h3>
                    </div>
                  </div>

                  {/* ANIMATED GATE BOOM BARRIER GRAPHIC */}
                  {lastResult.status === 'success' && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                      <div className="relative w-16 h-8 flex items-end">
                        <div className="w-3 h-6 bg-gray-400 rounded-sm" />
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: -65 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="w-14 h-2 bg-gradient-to-r from-red-500 via-white to-red-500 rounded-full origin-left -ml-1 -mb-1 shadow-lg"
                        />
                      </div>
                      <span className="text-xs font-bold text-emerald-300">BARRIER LIFTED</span>
                    </div>
                  )}
                </div>

                {/* SUCCESS DETAILS */}
                {lastResult.booking && lastResult.status === 'success' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-gray-400">Slot Allocated:</span>
                      <p className="font-bold text-cyan-300 text-sm mt-0.5">
                        {String(lastResult.booking.slotNumber || (lastResult.booking.slot as Record<string, unknown>)?.number || 'A-01')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Vehicle Plate:</span>
                      <p className="font-mono font-bold text-white text-sm mt-0.5">{String(lastResult.vehicleNumber || lastResult.booking.vehicleNumber || '--')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Driver / User:</span>
                      <p className="font-semibold text-gray-200 mt-0.5">
                        {String(lastResult.booking.userName || (lastResult.booking.user as Record<string, unknown>)?.name || 'Authorized Guest')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Booking Reference:</span>
                      <p className="font-mono text-gray-300 truncate mt-0.5">
                        {String(lastResult.booking.id || lastResult.booking._id || lastResult.bookingId).slice(0, 10)}
                      </p>
                    </div>
                  </div>
                )}

                {/* 1-CLICK ACTIONS FOR FAILED / UNBOOKED / BLACKLISTED SCANS */}
                {lastResult.status === 'failed' && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-400 font-medium mr-2">Quick Gate Actions:</span>

                    {/* 1-Click Blacklist Flag */}
                    <button
                      onClick={() => {
                        setActionVehiclePlate(lastResult.vehicleNumber || lastResult.bookingId);
                        setBlacklistModalOpen(true);
                      }}
                      className="btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border-red-500/40 hover:bg-red-500/20"
                    >
                      <HiOutlineShieldExclamation className="w-4 h-4" />
                      Flag / Add to Blacklist
                    </button>

                    {/* 1-Click Incident Report */}
                    <button
                      onClick={() => {
                        setActionVehiclePlate(lastResult.vehicleNumber || lastResult.bookingId);
                        setIncidentModalOpen(true);
                      }}
                      className="btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
                    >
                      <HiOutlineExclamationTriangle className="w-4 h-4" />
                      Log Security Incident
                    </button>

                    {/* 1-Click Issue Walk-in Pass */}
                    {gateMode === 'entry' && !lastResult.blacklisted && (
                      <button
                        onClick={() => {
                          setActionVehiclePlate(lastResult.vehicleNumber || lastResult.bookingId);
                          setWalkinModalOpen(true);
                        }}
                        className="btn-neon flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                      >
                        <HiOutlineTicket className="w-4 h-4" />
                        Issue Walk-in Pass
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MANUAL ENTRY INPUT */}
        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-base font-semibold neon-text mb-3">Manual Token or License Plate Search</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <HiOutlineQrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Enter QR token, Booking ID, or Vehicle Plate (e.g. GJ-01-AB-1234, MH-12-DE-5678)..."
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !scanning && handleVerify()}
                  className="input-neon w-full pl-11 pr-4 py-2.5 rounded-xl text-sm font-mono"
                />
              </div>
              <button
                onClick={() => handleVerify()}
                disabled={!bookingId.trim() || scanning}
                className="btn-neon px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 whitespace-nowrap"
              >
                {scanning ? 'Verifying...' : `Verify ${gateMode.toUpperCase()}`}
              </button>
            </div>
          </div>
        </motion.div>

        {/* RECENT SCANS LOG */}
        <motion.div variants={itemVariants}>
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold neon-text">Recent Session Scans</h2>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {scans.length} scans
              </span>
            </div>
            {scans.length === 0 ? (
              <p className="text-xs text-center py-6" style={{ color: 'var(--text-secondary)' }}>
                No scans recorded in this session yet
              </p>
            ) : (
              <div className="space-y-2">
                {scans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl transition-colors"
                    style={{ backgroundColor: 'var(--glass-bg)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          scan.status === 'success'
                            ? 'bg-green-500/10 border border-green-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        {scan.status === 'success' ? (
                          <HiOutlineCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <HiOutlineXMark className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-gray-200">
                          {scan.vehicleNumber && scan.vehicleNumber !== '--' ? scan.vehicleNumber : scan.bookingId}
                          {scan.slotNumber ? ` • ${scan.slotNumber}` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <HiOutlineClock className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                            {scan.time} • {scan.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={scan.status === 'success' ? 'badge-green' : 'badge-red'}>
                      {scan.status === 'success' ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QRScanner;
