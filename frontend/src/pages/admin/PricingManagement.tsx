import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCurrencyDollar,
  HiOutlineBolt,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { slotApi, adminApi } from '../../services/api';
import { ElectricCar } from '../../components/vehicles';

interface CategoryPricing {
  id: string;
  name: string;
  icon: string;
  color: string;
  hourlyRate: number;
  dailyRate: number;
  monthlyRate: number;
}

const defaultColors: Record<string, { icon: string; color: string; name: string }> = {
  'two-wheeler': { icon: '2W', color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30', name: 'Two Wheeler' },
  'four-wheeler': { icon: '4W', color: 'bg-pink-500/10 text-pink-400 border border-pink-500/30', name: 'Four Wheeler' },
  ev: { icon: 'EV', color: 'bg-green-500/10 text-green-400 border border-green-500/30', name: 'Electric Vehicle' },
  disabled: { icon: 'DA', color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30', name: 'Disabled' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const PricingManagement = () => {
  const [pricing, setPricing] = useState<CategoryPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [peakPricing, setPeakPricing] = useState(false);
  const [weekendSurcharge, setWeekendSurcharge] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    slotApi.getAll()
      .then((res) => {
        if (!mounted) return;
        const slots = res.slots || [];
        const byCategory: Record<string, { hourly: number[]; daily: number[]; monthly: number[] }> = {};
        slots.forEach((s: Record<string, unknown>) => {
          const cat = String(s.category || 'four-wheeler');
          if (!byCategory[cat]) byCategory[cat] = { hourly: [], daily: [], monthly: [] };
          byCategory[cat].hourly.push(Number(s.pricePerHour ?? 0));
          byCategory[cat].daily.push(Number(s.pricePerDay ?? 0));
          byCategory[cat].monthly.push(Number(s.pricePerMonth ?? 0));
        });
        const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
        const mapped: CategoryPricing[] = Object.entries(defaultColors).map(([id, meta]) => {
          const catData = byCategory[id];
          return {
            id,
            name: meta.name,
            icon: meta.icon,
            color: meta.color,
            hourlyRate: catData ? avg(catData.hourly) : (id === 'two-wheeler' ? 3 : id === 'four-wheeler' ? 5 : id === 'ev' ? 7 : 4),
            dailyRate: catData ? avg(catData.daily) : (id === 'two-wheeler' ? 18 : id === 'four-wheeler' ? 30 : id === 'ev' ? 40 : 25),
            monthlyRate: catData ? avg(catData.monthly) : (id === 'two-wheeler' ? 180 : id === 'four-wheeler' ? 300 : id === 'ev' ? 400 : 250),
          };
        });
        setPricing(mapped);
      })
      .catch(() => { if (mounted) setPricing([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const updateRate = (id: string, field: 'hourlyRate' | 'dailyRate' | 'monthlyRate', value: number) => {
    setPricing((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Backend contract: PUT /admin/pricing { category, pricePerHour, pricePerDay, pricePerMonth }
  const handleSaveAll = async () => {
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      for (const p of pricing) {
        await adminApi.updatePricing({
          category: p.id,
          pricePerHour: p.hourlyRate,
          pricePerDay: p.dailyRate,
          pricePerMonth: p.monthlyRate,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update pricing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 grid-bg min-h-screen p-6">
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <ElectricCar className="w-20 h-auto" color="#10b981" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold neon-text">Pricing Management</h1>
        <p className="text-gray-400 mt-1">Configure parking rates for all categories</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-white/5" />
                  <div className="h-4 w-24 bg-white/5 rounded" />
                  <div className="h-8 bg-white/5 rounded" />
                  <div className="h-8 bg-white/5 rounded" />
                  <div className="h-8 bg-white/5 rounded" />
                </div>
              </div>
            ))
          : pricing.map((cat) => (
              <div key={cat.id} className="glass-card rounded-xl p-5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${cat.id === 'two-wheeler' ? 'bg-cyan-500' : cat.id === 'four-wheeler' ? 'bg-pink-500' : cat.id === 'ev' ? 'bg-green-500' : 'bg-cyan-500'}`} />
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${cat.color}`}>
                    {cat.icon}
                  </span>
                  <h3 className="font-semibold text-gray-200">{cat.name}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><HiOutlineCurrencyDollar className="w-3 h-3" />Hourly Rate</span>
                      <span className="text-gray-600">₹</span>
                    </label>
                    <input
                      type="number"
                      value={cat.hourlyRate}
                      onChange={(e) => updateRate(cat.id, 'hourlyRate', Number(e.target.value))}
                      className="input-neon w-full text-sm rounded-lg px-3 py-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><HiOutlineCalendarDays className="w-3 h-3" />Daily Rate</span>
                      <span className="text-gray-600">₹</span>
                    </label>
                    <input
                      type="number"
                      value={cat.dailyRate}
                      onChange={(e) => updateRate(cat.id, 'dailyRate', Number(e.target.value))}
                      className="input-neon w-full text-sm rounded-lg px-3 py-2 font-medium"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span className="flex items-center gap-1"><HiOutlineCalendarDays className="w-3 h-3" />Monthly Rate</span>
                      <span className="text-gray-600">₹</span>
                    </label>
                    <input
                      type="number"
                      value={cat.monthlyRate}
                      onChange={(e) => updateRate(cat.id, 'monthlyRate', Number(e.target.value))}
                      className="input-neon w-full text-sm rounded-lg px-3 py-2 font-medium"
                    />
                  </div>
                  <button onClick={handleSaveAll} disabled={saving} className="btn-neon w-full py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ))}
      </motion.div>

      {saveError && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 p-3 rounded-xl glass border border-red-500/30 text-red-400 text-sm">
          <HiOutlineExclamationTriangle className="w-4 h-4" />
          {saveError}
        </motion.div>
      )}

      {saved && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 p-3 rounded-xl glass border border-green-500/30 text-green-400 text-sm">
          <HiOutlineCheckCircle className="w-4 h-4" />
          Pricing updated successfully
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold neon-text mb-4">Additional Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl glass border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                  <HiOutlineBolt className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-200">Peak Hour Pricing</p>
                  <p className="text-xs text-gray-400">Apply 25% surcharge during peak hours (8 AM - 10 AM, 5 PM - 7 PM)</p>
                </div>
              </div>
              <button
                onClick={() => setPeakPricing(!peakPricing)}
                className={`relative w-12 h-6 rounded-full transition-colors ${peakPricing ? 'bg-cyan-500' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${peakPricing ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl glass border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <HiOutlineCalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-200">Weekend Surcharge</p>
                  <p className="text-xs text-gray-400">Apply 15% surcharge on Saturdays and Sundays</p>
                </div>
              </div>
              <button
                onClick={() => setWeekendSurcharge(!weekendSurcharge)}
                className={`relative w-12 h-6 rounded-full transition-colors ${weekendSurcharge ? 'bg-pink-500' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${weekendSurcharge ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PricingManagement;
