import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSparkles,
  HiOutlineCheckBadge,
  HiOutlineCheck,
  HiOutlineCreditCard,
  HiOutlineBuildingOffice2,
  HiOutlineTruck,
  HiOutlineBolt,
  HiOutlineShieldCheck,
  HiOutlineQrCode,
  HiOutlineArrowRight,
  HiOutlineXMark,
  HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import { subscriptionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Subscription {
  _id: string;
  planType: 'silver' | 'gold_vip' | 'corporate_fleet';
  planName: string;
  price: number;
  billingCycle: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  vehicleNumbers: string[];
  dedicatedSlot?: string;
  rfidTag?: string;
  anprWhitelisted?: boolean;
}

export default function MonthlySubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Subscribe modal state
  const [selectedPlan, setSelectedPlan] = useState<'silver' | 'gold_vip' | 'corporate_fleet' | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [vehicleInput, setVehicleInput] = useState(user?.vehicleNumber || 'MH-12-AB-3456');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState('');

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await subscriptionApi.getMy();
      if (res.success && Array.isArray(res.subscriptions)) {
        setSubscriptions(res.subscriptions as unknown as Subscription[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const activeSub = subscriptions.find((s) => s.status === 'active');

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    setError('');
    try {
      const vehicleList = vehicleInput
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter(Boolean);

      const res = await subscriptionApi.create({
        planType: selectedPlan,
        vehicleNumbers: vehicleList.length > 0 ? vehicleList : [user?.vehicleNumber || 'MH-12-AB-3456'],
        billingCycle
      });

      if (res.success) {
        setSubscribeSuccess(`Pass Activated: Subscribed to ${res.subscription.planName || 'Monthly Pass'}!`);
        setTimeout(() => {
          setSelectedPlan(null);
          setSubscribeSuccess('');
          fetchSubscriptions();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSub = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel auto-renewal for this pass?')) return;
    try {
      await subscriptionApi.cancel(id);
      fetchSubscriptions();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cancellation failed');
    }
  };

  const plans = [
    {
      id: 'silver' as const,
      name: 'Silver Monthly Pass',
      badge: 'Individual Driver',
      monthlyPrice: 2499,
      annualPrice: 23990,
      icon: HiOutlineCheckBadge,
      color: 'from-slate-700 to-slate-900 border-slate-600',
      accent: 'text-slate-300',
      features: [
        '10 Hours / Day Unlimited Parking Access',
        'Standard Bay Allocation (Any Floor)',
        '1 Registered Vehicle Plate',
        'Priority Barrier Gate QR Access',
        'Instant WhatsApp Digital Pass'
      ]
    },
    {
      id: 'gold_vip' as const,
      name: 'Gold Executive VIP Pass',
      badge: 'Most Popular ⭐',
      monthlyPrice: 3999,
      annualPrice: 38990,
      icon: HiOutlineBolt,
      color: 'from-amber-500/20 via-slate-900 to-cyan-950/40 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      accent: 'text-amber-400',
      popular: true,
      features: [
        '24/7 Unlimited Parking Access',
        'Dedicated Reserved VIP Bay (e.g. Bay VIP-01)',
        'Free 11kW Fast EV Charging Included',
        'ANPR Fast-Lane Automatic Barrier Opening',
        'Up to 2 Registered Garage Vehicles',
        'Zero Overstay Penalty Guarantee'
      ]
    },
    {
      id: 'corporate_fleet' as const,
      name: 'Corporate Fleet Pass',
      badge: 'Enterprise Pool 🏢',
      monthlyPrice: 24999,
      annualPrice: 239990,
      icon: HiOutlineBuildingOffice2,
      color: 'from-purple-900/30 via-slate-900 to-indigo-950/40 border-purple-500/40',
      accent: 'text-purple-400',
      features: [
        'Company Fleet Pool (Up to 15 Vehicles)',
        'Dedicated Executive Parking Zone',
        'ANPR Camera Whitelist for All Employee Cars',
        'Monthly Centralized GST Invoicing',
        'Dedicated Corporate Concierge & Support'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. HEADER HERO */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-cyan-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            <span>Smart Subscriptions &amp; Fast-Pass Membership</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Monthly Passes &amp; <span className="neon-text">Corporate Subscriptions</span>
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Eliminate daily parking tickets. Enjoy automated ANPR fast-lane barrier access, guaranteed dedicated VIP bays, and multi-car corporate fleet plans.
          </p>
        </div>
      </div>

      {/* 2. ACTIVE SUBSCRIPTION CARD (IF USER HAS ACTIVE PASS) */}
      {activeSub && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-purple-950/80 border-2 border-cyan-400/60 shadow-2xl space-y-4 relative overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-md">
                <HiOutlineShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">
                    Active Membership Pass
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h2 className="text-2xl font-bold text-white">{activeSub.planName}</h2>
              </div>
            </div>

            <button
              onClick={() => handleCancelSub(activeSub._id)}
              className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-xl transition"
            >
              Cancel Auto-Renew
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 block text-[10px]">RFID Tag ID</span>
              <strong className="text-cyan-300 font-mono text-sm">{activeSub.rfidTag || 'RFID-ACTIVE'}</strong>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 block text-[10px]">Dedicated Slot</span>
              <strong className="text-pink-300 font-mono text-sm">{activeSub.dedicatedSlot || 'Standard Floor Bay'}</strong>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 block text-[10px]">ANPR Fast Barrier</span>
              <strong className="text-emerald-400 font-mono text-sm">WHITELISTED ✓</strong>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-gray-400 block text-[10px]">Valid Until</span>
              <strong className="text-white font-mono text-sm">
                {new Date(activeSub.endDate).toLocaleDateString()}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-300">
            <span className="text-gray-400 font-semibold">Whitelisted Vehicles:</span>
            {activeSub.vehicleNumbers.map((v) => (
              <span key={v} className="font-mono bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded border border-cyan-400/30 font-bold">
                🚗 {v}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3. BILLING TOGGLE (MONTHLY VS ANNUAL) */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-cyan-400' : 'text-gray-400'}`}>
          Monthly Billing
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          className="w-14 h-7 rounded-full bg-slate-800 p-1 border border-white/20 transition relative"
        >
          <div
            className={`w-5 h-5 rounded-full bg-cyan-400 transition-transform ${
              billingCycle === 'annual' ? 'translate-x-7 bg-pink-400' : ''
            }`}
          />
        </button>
        <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'annual' ? 'text-pink-400' : 'text-gray-400'}`}>
          Annual Billing
          <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-1.5 py-0.2 rounded-full font-extrabold">
            SAVE 20%
          </span>
        </span>
      </div>

      {/* 4. SUBSCRIPTION TIER CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const isCurrentPlan = activeSub?.planType === plan.id;

          return (
            <div
              key={plan.id}
              className={`glass-card p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
                plan.popular ? 'border-amber-500/60 shadow-2xl scale-[1.02]' : 'border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-lg">
                  ★ RECOMMENDED FOR DRIVERS ★
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-400">{plan.badge}</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-extrabold text-white">₹{price.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-4 border-t border-white/10">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <HiOutlineCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action CTA */}
              <div className="pt-6">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-xs cursor-default"
                  >
                    ✓ Currently Active Pass
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                      plan.popular
                        ? 'btn-neon shadow-lg shadow-cyan-500/30'
                        : 'btn-outline hover:bg-white/10'
                    }`}
                  >
                    <span>Subscribe to Pass</span>
                    <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. SUBSCRIBE MODAL */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-white text-base">Confirm Pass Activation</h3>
                  <p className="text-xs text-cyan-400">
                    {plans.find((p) => p.id === selectedPlan)?.name} ({billingCycle})
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1">
                    Registered Vehicle Plate(s) (comma separated for multi-vehicle):
                  </label>
                  <input
                    type="text"
                    value={vehicleInput}
                    onChange={(e) => setVehicleInput(e.target.value.toUpperCase())}
                    placeholder="e.g. GJ-01-AB-1234, MH-12-XY-9999"
                    className="input-neon w-full px-4 py-2.5 font-mono uppercase rounded-xl"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    These vehicles will be whitelisted on all ANPR barrier entrance cameras.
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
                  <span className="text-gray-300">Total Payable:</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    ₹{billingCycle === 'annual'
                      ? plans.find((p) => p.id === selectedPlan)?.annualPrice.toLocaleString()
                      : plans.find((p) => p.id === selectedPlan)?.monthlyPrice.toLocaleString()}
                  </span>
                </div>

                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                {subscribeSuccess && (
                  <p className="text-xs text-emerald-400 font-bold text-center">{subscribeSuccess}</p>
                )}

                <button
                  disabled={subscribing}
                  onClick={handleSubscribe}
                  className="btn-neon w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                >
                  {subscribing ? 'Activating RFID Pass...' : 'Confirm & Activate Membership'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
