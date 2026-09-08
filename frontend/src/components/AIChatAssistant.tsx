import { useState, useRef, useEffect, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThreeDCarGlitterSymbol from './ThreeDCarGlitterSymbol';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  action?: { label: string; link: string };
}

export const AIChatAssistant: FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "👋 Hi there! I'm **ParkEase AI Assistant**. How can I help you find or book parking today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const quickQuestions = [
    { label: '⚡ EV Charging Slots', query: 'show ev charging slots' },
    { label: '🛵 2-Wheeler Rates', query: 'what are two wheeler rates' },
    { label: '🚗 Book a Slot', query: 'how to book a slot' },
    { label: '🔐 Authy 2FA Setup', query: 'how to setup 2fa authy' },
  ];

  const handleSend = (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateAIResponse(queryText);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 700);
  };

  const generateAIResponse = (query: string): Message => {
    const q = query.toLowerCase();
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (q.includes('ev') || q.includes('charging') || q.includes('electric')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '⚡ We have 50kW EV Fast Charging stations available on Basement B1 (Slots E1A-E3C). Rates are ₹25/hr.',
        timestamp: ts,
        action: { label: 'View Available EV Slots', link: '/available-slots' },
      };
    }

    if (q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('two wheeler') || q.includes('bike')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '💰 **ParkEase Pricing Structure**:\n• 2-Wheeler: ₹10/hr (₹50/day)\n• 4-Wheeler: ₹30/hr (₹150/day)\n• EV Charging: ₹25/hr (₹120/day)\n• Accessible/VIP: ₹15/hr (₹80/day)',
        timestamp: ts,
        action: { label: 'Check Live Rates', link: '/available-slots' },
      };
    }

    if (q.includes('book') || q.includes('reserve') || q.includes('slot')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🚗 You can pick your preferred floor and slot on our interactive 2D floor map. Scan your QR code at the gate for instant barrier opening.',
        timestamp: ts,
        action: { label: 'Book Parking Now', link: '/available-slots' },
      };
    }

    if (q.includes('2fa') || q.includes('authy') || q.includes('security') || q.includes('authenticator')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🔐 You can secure your account using **Authy** or **Google Authenticator**. Go to Profile > Enable Authy 2FA to scan your 6-digit TOTP QR code.',
        timestamp: ts,
        action: { label: 'Manage Profile & 2FA', link: '/profile' },
      };
    }

    if (q.includes('qr') || q.includes('code') || q.includes('pass') || q.includes('gate')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '🎟️ Once your booking is confirmed, your unique QR Code Entry Pass is automatically generated and emailed to you. Show it to the security camera at the gate.',
        timestamp: ts,
        action: { label: 'View My Booking Pass', link: '/qr-code' },
      };
    }

    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: "🤖 I'm here to assist with campus parking availability, booking, QR passes, pricing, and Authy 2FA setup. Would you like to check live open slots?",
      timestamp: ts,
      action: { label: 'Browse Open Slots', link: '/available-slots' },
    };
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: "✨ Chat cleared! How else can I assist you with your parking today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button (FAB) - 3D Car Model on Glittery Dish */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group p-2.5 rounded-full bg-gradient-to-br from-slate-950/90 via-cyan-950/80 to-emerald-950/90 border-2 border-cyan-400/50 shadow-[0_10px_30px_rgba(6,182,212,0.5)] flex items-center justify-center font-bold backdrop-blur-xl hover:border-cyan-300 hover:shadow-[0_12px_35px_rgba(52,211,153,0.6)] transition-all"
        >
          <ThreeDCarGlitterSymbol size="md" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-slate-950" />
          <div className="absolute right-full mr-3 hidden group-hover:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-xs text-white font-semibold shadow-2xl whitespace-nowrap backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
            <span>Ask ParkEase AI</span>
          </div>
        </motion.button>
      )}

      {/* Floating Chat Box Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-[calc(100vw-2rem)] max-w-[360px] sm:w-[380px] sm:max-w-none h-[520px] max-h-[calc(100dvh-3rem)] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-transparent border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] overflow-hidden">
                  <ThreeDCarGlitterSymbol size="sm" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text)] flex items-center gap-1.5">
                    ParkEase AI Assistant
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  <p className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online &middot; Ready to help
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition"
                  title="Clear Chat"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--border)] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="p-2.5 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {quickQuestions.map((qq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qq.query)}
                  className="px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-500/40 transition whitespace-nowrap font-medium"
                >
                  {qq.label}
                </button>
              ))}
            </div>

            {/* Chat Body / Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                        : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-tl-none shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    {msg.action && (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          navigate(msg.action!.link);
                        }}
                        className="mt-2.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/40 font-bold text-[11px] flex items-center gap-1.5 transition"
                      >
                        {msg.action.label} <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)] mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] w-20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask AI anything about parking..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatAssistant;
