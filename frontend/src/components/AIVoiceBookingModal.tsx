import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMicrophone,
  HiOutlineSparkles,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineArrowRight,
  HiOutlineSpeakerWave,
  HiOutlineBolt,
  HiOutlineClock,
  HiOutlineCalendarDays
} from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';

interface ParsedVoiceData {
  category?: 'four-wheeler' | 'two-wheeler' | 'ev' | 'disabled';
  durationHours?: number;
  time?: string;
  date?: string;
  vehicleNumber?: string;
  rawTranscript: string;
}

interface AIVoiceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBooking?: (data: ParsedVoiceData) => void;
}

// Declare SpeechRecognition interface for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export default function AIVoiceBookingModal({ isOpen, onClose, onApplyBooking }: AIVoiceBookingModalProps) {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedVoiceData | null>(null);
  const [recognitionError, setRecognitionError] = useState('');
  const [aiReply, setAiReply] = useState('');

  // Voice output synthesizer
  const speakResponse = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }, []);

  // Smart NLP Intent & Entity Parser
  const parseVoiceIntent = useCallback((rawText: string): ParsedVoiceData => {
    const text = rawText.toLowerCase();
    const result: ParsedVoiceData = { rawTranscript: rawText };

    // 1. Category extraction
    if (text.includes('ev') || text.includes('electric') || text.includes('tesla') || text.includes('charging')) {
      result.category = 'ev';
    } else if (text.includes('bike') || text.includes('scooter') || text.includes('two wheeler') || text.includes('motorcycle')) {
      result.category = 'two-wheeler';
    } else if (text.includes('vip') || text.includes('accessible') || text.includes('disabled') || text.includes('handicap')) {
      result.category = 'disabled';
    } else {
      result.category = 'four-wheeler';
    }

    // 2. Duration extraction
    if (text.includes('full day') || text.includes('24 hour') || text.includes('whole day')) {
      result.durationHours = 24;
    } else if (text.includes('4 hour') || text.includes('four hour')) {
      result.durationHours = 4;
    } else if (text.includes('1 hour') || text.includes('one hour')) {
      result.durationHours = 1;
    } else {
      result.durationHours = 2; // default
    }

    // 3. Time extraction (e.g., "10 am", "2 pm", "14:00", "8 o'clock")
    const timeMatch = text.match(/(\d{1,2})\s*(am|pm|o'clock|:00)?/);
    if (timeMatch) {
      let hr = parseInt(timeMatch[1], 10);
      const isPm = text.includes('pm') || text.includes('evening') || text.includes('night');
      if (isPm && hr < 12) hr += 12;
      if (!isPm && hr === 12) hr = 0;
      if (hr >= 8 && hr <= 21) {
        result.time = `${String(hr).padStart(2, '0')}:00`;
      }
    }

    // 4. Date extraction
    const now = new Date();
    if (text.includes('tomorrow')) {
      const tomorrow = new Date(now.getTime() + 86400000);
      result.date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    } else {
      result.date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // 5. Vehicle Number Plate extraction (e.g. "GJ 01 AB 1234" or "MH 12 AB 3456")
    const plateMatch = rawText.match(/([A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,3}[ -]?[0-9]{3,4})/i);
    if (plateMatch) {
      result.vehicleNumber = plateMatch[1].toUpperCase().replace(/\s+/g, '-');
    }

    return result;
  }, []);

  // Web Speech API handler
  const startListening = () => {
    const win = window as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      setRecognitionError('Speech recognition is not supported in this browser. Please type or use Google Chrome.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError('');
        setTranscript('');
        setParsedData(null);
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);

        if (event.results[current].isFinal) {
          const parsed = parseVoiceIntent(text);
          setParsedData(parsed);

          const categoryName = parsed.category === 'ev' ? 'Fast EV Charging' : parsed.category === 'two-wheeler' ? 'Two Wheeler' : 'Four Wheeler';
          const reply = `Got it! Reserving a ${categoryName} bay for ${parsed.durationHours} hours.`;
          setAiReply(reply);
          speakResponse(reply);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setRecognitionError('Microphone permission denied. Please allow microphone access.');
        } else {
          setRecognitionError('Could not recognize voice. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Demo simulate voice command for desktop testing without microphone
  const handleSimulateVoice = (samplePhrase: string) => {
    setTranscript(samplePhrase);
    setIsListening(false);
    const parsed = parseVoiceIntent(samplePhrase);
    setParsedData(parsed);
    const categoryName = parsed.category === 'ev' ? 'Fast EV Charging' : parsed.category === 'two-wheeler' ? 'Two Wheeler' : 'Four Wheeler';
    const reply = `Understood! Prepared ${categoryName} slot booking for ${parsed.durationHours} hours.`;
    setAiReply(reply);
    speakResponse(reply);
  };

  const handleApply = () => {
    if (parsedData) {
      if (onApplyBooking) {
        onApplyBooking(parsedData);
      }
      onClose();
      navigate('/dashboard/book-parking', {
        state: {
          category: parsedData.category,
          duration: parsedData.durationHours,
          time: parsedData.time,
          date: parsedData.date,
          vehicleNumber: parsedData.vehicleNumber
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <HiOutlineSparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Voice Command Booking</h2>
              <p className="text-xs text-cyan-400">Natural Language Voice Booking Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Animated Visual */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="relative flex items-center justify-center">
            {isListening && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="absolute w-28 h-28 rounded-full bg-pink-500/30 blur-md"
                />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  className="absolute w-24 h-24 rounded-full border-2 border-cyan-400"
                />
              </>
            )}

            <button
              onClick={startListening}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl transition-all shadow-2xl z-10 ${
                isListening
                  ? 'bg-gradient-to-tr from-pink-500 to-rose-600 text-white shadow-pink-500/50 scale-110'
                  : 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 hover:scale-105'
              }`}
            >
              <HiOutlineMicrophone className="w-9 h-9" />
            </button>
          </div>

          <p className="text-xs font-bold tracking-wide uppercase text-gray-300">
            {isListening ? '🎙️ Listening... Speak your request' : 'Tap Microphone to Speak'}
          </p>
        </div>

        {/* Live Transcript Bubble */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 min-h-[70px] flex items-center justify-center text-center">
          {transcript ? (
            <p className="text-sm font-mono text-cyan-200 font-semibold italic">"{transcript}"</p>
          ) : (
            <p className="text-xs text-gray-500">
              Try saying: "Book an EV slot for 2 hours tomorrow at 10 AM for car GJ-01-AB-1234"
            </p>
          )}
        </div>

        {recognitionError && (
          <p className="text-xs text-red-400 text-center">{recognitionError}</p>
        )}

        {/* Quick Sample Voice Prompts for Instant 1-Click Testing */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-gray-400 block">Quick Test Prompts (1-Click):</span>
          <div className="flex flex-wrap gap-2">
            {[
              'Book EV slot for 2 hours tomorrow at 10 AM',
              'Reserve four wheeler for 4 hours at 2 PM',
              'Book bike slot for 1 hour for GJ-01-XY-9999'
            ].map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSimulateVoice(sample)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-white/10 text-gray-300 transition text-left"
              >
                🗣️ "{sample}"
              </button>
            ))}
          </div>
        </div>

        {/* Parsed NLP Entity Cards */}
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <HiOutlineCheck className="w-4 h-4 text-emerald-400" /> AI Intent Detected
              </span>
              <span className="text-[10px] text-gray-400 font-mono">100% Confidence</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">Category</span>
                <strong className="text-white uppercase font-mono">{parsedData.category}</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">Duration</span>
                <strong className="text-cyan-300 font-mono">{parsedData.durationHours} Hours</strong>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5">
                <span className="text-[10px] text-gray-400 block">Arrival Time</span>
                <strong className="text-pink-300 font-mono">{parsedData.time || 'Next Hour'}</strong>
              </div>
            </div>

            {aiReply && (
              <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                <HiOutlineSpeakerWave className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {aiReply}
              </p>
            )}

            <button
              onClick={handleApply}
              className="btn-neon w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 mt-2"
            >
              <span>Apply to Booking Workstation</span>
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
