import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineForward,
  HiOutlineBackward,
  HiOutlineCamera,
  HiOutlineCube,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineChevronRight,
  HiOutlineBuildingOffice2,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineInformationCircle
} from 'react-icons/hi2';
import { Navigation3DScene, DEFAULT_WAYPOINTS, type Waypoint } from '../components/3d/Navigation3DScene';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/api';

export default function TurnByTurnNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Navigation target slot
  const locationState = location.state as { booking?: Record<string, unknown>; slotNumber?: string; floor?: number } | null;
  const [targetSlot, setTargetSlot] = useState<string>(locationState?.slotNumber || (locationState?.booking?.slot as Record<string, unknown>)?.number as string || 'A-04');
  const [targetFloor, setTargetFloor] = useState<number>(locationState?.floor || Number((locationState?.booking?.slot as Record<string, unknown>)?.floor) || 1);

  // Mode: 3d_simulator (Virtual Room Mode) or live_ar (Live Camera AR Mode)
  const [navMode, setNavMode] = useState<'3d_simulator' | 'live_ar'>('3d_simulator');

  // Simulation & Step Progress
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [carProgress, setCarProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Live Camera AR state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [gyroData, setGyroData] = useState<{ alpha: number; beta: number; gamma: number }>({ alpha: 0, beta: 0, gamma: 0 });
  const [hasGyro, setHasGyro] = useState<boolean>(false);

  const waypoints = DEFAULT_WAYPOINTS;
  const activeWp = waypoints[currentStep] || waypoints[0];

  // Auto-fetch user's latest paid booking if not provided in route state
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!locationState?.slotNumber && !locationState?.booking) {
        try {
          const res = await bookingApi.getMyBookings();
          if (isMounted && res.success && Array.isArray(res.bookings) && res.bookings.length > 0) {
            const activeBooking = res.bookings.find((b: Record<string, unknown>) => b.status === 'confirmed' || b.status === 'active');
            if (activeBooking) {
              const slotNum = (activeBooking.slot as Record<string, unknown>)?.number || activeBooking.slotNumber;
              if (slotNum) setTargetSlot(String(slotNum));
              const fl = (activeBooking.slot as Record<string, unknown>)?.floor;
              if (fl) setTargetFloor(Number(fl));
            }
          }
        } catch {
          // fallback to default A-04
        }
      }
    })();
    return () => { isMounted = false; };
  }, [locationState]);

  // Voice Guidance (SpeechSynthesis)
  const speakInstruction = useCallback((text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }, [voiceEnabled]);

  useEffect(() => {
    if (activeWp) {
      speakInstruction(activeWp.instruction);
    }
  }, [currentStep, activeWp, speakInstruction]);

  // Auto-drive simulation loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCarProgress((prev) => {
        const next = prev + 0.04 * simSpeed;
        if (next >= 1) {
          if (currentStep < waypoints.length - 1) {
            setCurrentStep((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return 1;
          }
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, simSpeed, waypoints.length]);

  // Device orientation (Gyroscope for AR mode)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHasGyro(true);
        setGyroData({
          alpha: Math.round(e.alpha || 0),
          beta: Math.round(e.beta || 0),
          gamma: Math.round(e.gamma || 0)
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Camera start / stop for Live AR mode
  useEffect(() => {
    if (navMode === 'live_ar') {
      let stream: MediaStream | null = null;
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
            setCameraError('');
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setCameraError('Camera not available. Showing Simulated AR Horizon.');
          setCameraActive(false);
        });

      return () => {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      };
    } else {
      setCameraActive(false);
    }
  }, [navMode]);

  // Step Controls
  const handleNextStep = () => {
    if (currentStep < waypoints.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setCarProgress(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setCarProgress(0);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCarProgress(0);
    setIsPlaying(false);
  };

  // Calculated Stats
  const remainingDistance = useMemo(() => {
    let dist = 0;
    for (let i = currentStep; i < waypoints.length; i++) {
      dist += waypoints[i].distanceMeters;
    }
    return dist;
  }, [currentStep, waypoints]);

  const estimatedSeconds = Math.round(remainingDistance / 1.4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. TOP HEADER & BACK BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition border border-white/10"
          >
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400">
                <HiOutlineSparkles className="w-3.5 h-3.5" /> In-Parking Wayfinding
              </span>
              <span className="text-xs text-gray-400 font-mono">Floor {targetFloor}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
              Turn-by-Turn <span className="neon-text">3D / AR Navigation</span>
            </h1>
          </div>
        </div>

        {/* MODE SWITCHER TABS */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg">
          <button
            onClick={() => setNavMode('3d_simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              navMode === '3d_simulator'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <HiOutlineCube className="w-4 h-4" />
            3D Virtual Simulator
          </button>
          <button
            onClick={() => setNavMode('live_ar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              navMode === 'live_ar'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <HiOutlineCamera className="w-4 h-4" />
            Live Camera AR
          </button>
        </div>
      </div>

      {/* 2. ROOM TESTING INFO BANNER */}
      <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-cyan-300">
        <div className="flex items-center gap-2.5">
          <HiOutlineInformationCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Room & Desktop Testing Ready:</strong> You can test full turn-by-turn wayfinding inside your room! Use <strong>3D Simulator</strong> for automated virtual driving, or <strong>Live Camera AR</strong> to project 3D neon arrows on your room floor.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono bg-cyan-500/20 px-2 py-0.5 rounded text-[11px] font-bold text-cyan-200">
            Target: Bay {targetSlot}
          </span>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION WORKSTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2-COLS: 3D CANVAS OR LIVE CAMERA AR STREAM */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative w-full h-[450px] sm:h-[520px] rounded-3xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
            {navMode === '3d_simulator' ? (
              /* MODE 1: 3D VIRTUAL SIMULATOR */
              <div className="w-full h-full relative">
                <Navigation3DScene
                  currentStepIndex={currentStep}
                  carProgress={carProgress}
                  targetSlotNumber={targetSlot}
                  vehicleType="tesla"
                />

                {/* 3D HUD OVERLAY */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  {/* Real-time Turn Banner */}
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto max-w-md bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 p-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-white"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-xl font-bold">
                      {activeWp.icon === 'left' ? '↰' : activeWp.icon === 'right' ? '↱' : activeWp.icon === 'arrive' ? '★' : '↑'}
                    </div>
                    <div>
                      <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                        Step {currentStep + 1} of {waypoints.length}
                      </p>
                      <p className="text-sm font-bold text-white line-clamp-1">{activeWp.instruction}</p>
                    </div>
                  </motion.div>

                  {/* Audio Voice Toggle */}
                  <button
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="pointer-events-auto p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800 transition"
                  >
                    {voiceEnabled ? <HiOutlineSpeakerWave className="w-5 h-5 text-cyan-400" /> : <HiOutlineSpeakerXMark className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>

                {/* Bottom Left Telemetry */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-none">
                  <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-cyan-300">
                    SPEED: <span className="text-white font-bold">{isPlaying ? '14 km/h' : '0 km/h'}</span>
                  </div>
                  <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-300">
                    REMAINING: <span className="text-white font-bold">{remainingDistance} m</span>
                  </div>
                </div>
              </div>
            ) : (
              /* MODE 2: LIVE CAMERA AR MODE */
              <div className="w-full h-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
                {/* Real Live Camera Feed */}
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Camera Fallback / Dark Grid Backdrop if no camera */}
                {!cameraActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-3 animate-pulse">
                      <HiOutlineCamera className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Simulated AR Horizon Active</p>
                    <p className="text-xs text-gray-400 max-w-sm">{cameraError || 'Point your phone at the floor to project AR navigational arrows.'}</p>
                  </div>
                )}

                {/* HOLOGRAPHIC AR OVERLAY */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
                  {/* Top AR Header Banner */}
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-950/80 backdrop-blur-md border border-pink-500/40 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold font-mono">AR WAYFINDING TRACKER</span>
                      {hasGyro && <span className="text-[10px] text-pink-300 font-mono">GYRO: {gyroData.alpha}°</span>}
                    </div>

                    <button
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="pointer-events-auto p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/20 text-white"
                    >
                      {voiceEnabled ? <HiOutlineSpeakerWave className="w-5 h-5 text-pink-400" /> : <HiOutlineSpeakerXMark className="w-5 h-5 text-gray-400" />}
                    </button>
                  </div>

                  {/* Center Holographic 3D Directional AR Arrow */}
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                        scale: [1, 1.05, 1],
                        rotateX: 45
                      }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                      className="relative flex flex-col items-center"
                    >
                      {/* 3D Hologram Neon Arrow */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pink-500/40 to-cyan-500/40 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)] backdrop-blur-sm">
                        <span className="text-4xl text-white font-extrabold drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                          {activeWp.icon === 'left' ? '↰' : activeWp.icon === 'right' ? '↱' : activeWp.icon === 'arrive' ? '★' : '↑'}
                        </span>
                      </div>
                      {/* Ground Projected Ring */}
                      <div className="w-32 h-10 rounded-[100%] border-2 border-dashed border-cyan-400/80 bg-cyan-500/20 -mt-4 blur-[1px] animate-pulse" />
                    </motion.div>

                    {/* Step Instruction Card */}
                    <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 px-4 py-2.5 rounded-2xl text-center max-w-sm shadow-2xl">
                      <p className="text-xs font-bold text-cyan-300">{activeWp.instruction}</p>
                      <p className="text-[11px] text-gray-300 font-mono mt-0.5">
                        Distance to next checkpoint: <strong className="text-white">{activeWp.distanceMeters}m</strong>
                      </p>
                    </div>
                  </div>

                  {/* Bottom AR Target Beacon */}
                  <div className="flex items-center justify-between">
                    <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-white">
                      DESTINATION: <strong className="text-pink-400">BAY {targetSlot}</strong>
                    </div>
                    <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-emerald-400 font-bold">
                      {remainingDistance} METERS REMAINING
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIMULATION & PLAYBACK CONTROLS */}
          <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/30'
                    : 'btn-neon'
                }`}
              >
                {isPlaying ? (
                  <>
                    <HiOutlinePause className="w-4 h-4" /> Pause Auto-Drive
                  </>
                ) : (
                  <>
                    <HiOutlinePlay className="w-4 h-4" /> Start Auto-Drive
                  </>
                )}
              </button>

              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 border border-white/10"
                title="Previous Step"
              >
                <HiOutlineBackward className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextStep}
                disabled={currentStep >= waypoints.length - 1}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-30 border border-white/10"
                title="Next Step / Scan Beacon"
              >
                <HiOutlineForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                title="Reset Route"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
            </div>

            {/* SPEED MULTIPLIER BUTTONS */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-semibold mr-1">Speed:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    simSpeed === spd
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 1-COL: WAYPOINT TIMELINE & BAY INFO */}
        <div className="space-y-4">
          {/* TARGET BAY CARD */}
          <div className="glass-card p-5 rounded-2xl border border-cyan-500/30 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Assigned Destination</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                RESERVED
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white font-mono">BAY {targetSlot}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Floor {targetFloor} • Zone A (North Entry)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">Total Distance</span>
                <strong className="text-cyan-300 font-mono text-sm">{remainingDistance} m</strong>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Est. Drive Time</span>
                <strong className="text-pink-300 font-mono text-sm">~{estimatedSeconds} sec</strong>
              </div>
            </div>
          </div>

          {/* TURN-BY-TURN STEP TIMELINE */}
          <div className="glass-card p-5 rounded-2xl space-y-4 max-h-[440px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Route Waypoints</h3>
              <span className="text-[10px] text-cyan-400 font-mono">
                {currentStep + 1}/{waypoints.length} Completed
              </span>
            </div>

            <div className="space-y-3 relative">
              {waypoints.map((wp, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      setCurrentStep(idx);
                      setCarProgress(0);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-cyan-500 text-slate-950 font-extrabold'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold line-clamp-2 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {wp.instruction}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono">
                        <span>{wp.distanceMeters} m</span>
                        {wp.pillarLabel && (
                          <span className="px-1.5 py-0.2 rounded bg-white/5 text-cyan-300 border border-white/10">
                            {wp.pillarLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
