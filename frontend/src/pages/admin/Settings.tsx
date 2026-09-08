import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineBuildingOffice2,
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineKey,
  HiOutlineClock,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';
import { slotApi } from '../../services/api';
import { CarSedan } from '../../components/vehicles';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type Tab = 'general' | 'pricing' | 'notifications';

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-white/10'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : ''}`} />
  </button>
);

const Settings = () => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [parkingName, setParkingName] = useState('SmartPark Central');
  const [address, setAddress] = useState('123 Main Street, Downtown');
  const [totalFloors, setTotalFloors] = useState(4);
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [hourlyRate, setHourlyRate] = useState(5);
  const [dailyRate, setDailyRate] = useState(30);
  const [monthlyRate, setMonthlyRate] = useState(300);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(5);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [overstayPenalty, setOverstayPenalty] = useState(10);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    slotApi.getAll({ limit: '1' })
      .then((res) => {
        if (res.slots && res.slots.length > 0) {
          const floors = [...new Set(res.slots.map((s: Record<string, unknown>) => Number(s.floor)))].length;
          setTotalFloors(Math.max(floors, totalFloors));
          const first = res.slots[0] as Record<string, unknown>;
          if (first.hourlyRate) setHourlyRate(Number(first.hourlyRate));
          if (first.dailyRate) setDailyRate(Number(first.dailyRate));
          if (first.monthlyRate) setMonthlyRate(Number(first.monthlyRate));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'general', label: 'General' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ backgroundColor: 'var(--bg)' }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-4xl">
        <motion.div variants={itemVariants} className="relative">
          <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <CarSedan className="w-20 h-auto" color="#06b6d4" />
            </motion.div>
          </div>
          <h1 className="text-2xl font-bold neon-text">Settings</h1>
          <p className="text-gray-400 mt-1">Manage system configuration and preferences</p>
        </motion.div>

        {saved && (
          <motion.div variants={itemVariants} className="flex items-center gap-2 p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 text-sm">
            <HiOutlineCheckCircle className="w-4 h-4" />
            Settings saved successfully
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'glass-card-glow text-white'
                    : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {activeTab === 'general' && (
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <HiOutlineBuildingOffice2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">General Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Parking Name</label>
                  <input type="text" value={parkingName} onChange={(e) => setParkingName(e.target.value)} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Total Floors</label>
                  <input type="number" value={totalFloors} onChange={(e) => setTotalFloors(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Open Time</label>
                    <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Close Time</label>
                    <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="btn-neon px-5 py-2 rounded-lg text-sm font-semibold">Save Changes</button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'pricing' && (
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <HiOutlineKey className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">Pricing Settings</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Hourly Rate (₹)</label>
                  <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Daily Rate (₹)</label>
                  <input type="number" value={dailyRate} onChange={(e) => setDailyRate(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Monthly Rate (₹)</label>
                  <input type="number" value={monthlyRate} onChange={(e) => setMonthlyRate(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    <span className="flex items-center gap-1"><HiOutlineKey className="w-3 h-3" />QR Expiry (minutes)</span>
                  </label>
                  <input type="number" value={qrExpiry} onChange={(e) => setQrExpiry(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    <span className="flex items-center gap-1"><HiOutlineClock className="w-3 h-3" />Grace Period (minutes)</span>
                  </label>
                  <input type="number" value={gracePeriod} onChange={(e) => setGracePeriod(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    <span className="flex items-center gap-1"><HiOutlineShieldCheck className="w-3 h-3" />Overstay Penalty (₹/hr)</span>
                  </label>
                  <input type="number" value={overstayPenalty} onChange={(e) => setOverstayPenalty(Number(e.target.value))} className="input-neon w-full text-sm rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="btn-neon-pink px-5 py-2 rounded-lg text-sm font-semibold">Save Changes</button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div variants={itemVariants}>
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <HiOutlineBell className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">Notification Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <HiOutlineEnvelope className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Email Alerts</p>
                      <p className="text-xs text-gray-400">Receive booking confirmations and alerts via email</p>
                    </div>
                  </div>
                  <Toggle enabled={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <HiOutlineDevicePhoneMobile className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">SMS Alerts</p>
                      <p className="text-xs text-gray-400">Receive booking updates and reminders via SMS</p>
                    </div>
                  </div>
                  <Toggle enabled={smsAlerts} onChange={() => setSmsAlerts(!smsAlerts)} />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="btn-outline px-5 py-2 rounded-lg text-sm font-semibold">Save Changes</button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Settings;
