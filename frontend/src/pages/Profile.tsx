import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUserCircle, HiOutlineEnvelope, HiOutlineDevicePhoneMobile, HiOutlineLockClosed } from 'react-icons/hi2';
import { useAuth, type User } from '../context/AuthContext';
import { BikeScooter } from '../components/vehicles';
import { authApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import TwoFactorModal from '../components/TwoFactorModal';
import { formatIndianLicensePlate, isValidIndianLicensePlate, handlePlateKeyDown } from '../utils/plateFormatter';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);

  const [newPlate, setNewPlate] = useState('');
  const [newVehicleType, setNewVehicleType] = useState<'4-wheeler' | '2-wheeler' | 'ev' | 'accessible'>('4-wheeler');
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);

  // Primary vehicle direct edit state
  const [isEditingPrimary, setIsEditingPrimary] = useState(false);
  const [primaryPlateInput, setPrimaryPlateInput] = useState('');
  const [primaryTypeInput, setPrimaryTypeInput] = useState<'4-wheeler' | '2-wheeler' | 'ev' | 'accessible'>('4-wheeler');
  const [savingPrimaryLoading, setSavingPrimaryLoading] = useState(false);

  useEffect(() => {
    authApi.getMe()
      .then((res) => {
        if (res.user) {
          updateUser(res.user as Partial<User>);
        }
      })
      .catch(() => {});
  }, [updateUser]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if (user.vehicleNumber) {
        setPrimaryPlateInput(formatIndianLicensePlate(user.vehicleNumber));
      }
      if (user.vehicleType) {
        setPrimaryTypeInput((user.vehicleType as any) || '4-wheeler');
      }
    }
  }, [user]);

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = async () => {
    setProfileLoading(true);
    try {
      const res = await authApi.updateProfile({ name, email, phone });
      if (res.user) updateUser(res.user as Partial<User>);
      toast('Profile updated successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast(message, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const getVehiclePlate = (v: string | { plate: string; type?: string }) => typeof v === 'string' ? v : v.plate;
  const getVehicleType = (v: string | { plate: string; type?: string }) => typeof v === 'string' ? '4-wheeler' : (v.type || '4-wheeler');

  const getVehicleTypeBadge = (type: string) => {
    switch (type) {
      case '2-wheeler':
        return { label: 'Two Wheeler', icon: '🛵', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'ev':
        return { label: 'EV Charging', icon: '⚡', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
      case 'accessible':
        return { label: 'Accessible', icon: '♿', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case '4-wheeler':
      default:
        return { label: 'Four Wheeler', icon: '🚗', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
    }
  };

  // Aggregated unique vehicles list
  const allVehicles = ((): { plate: string; type: string; isPrimary: boolean }[] => {
    const list: { plate: string; type: string; isPrimary: boolean }[] = [];
    const seen = new Set<string>();

    if (user?.vehicleNumber) {
      const p = formatIndianLicensePlate(user.vehicleNumber);
      if (p) {
        list.push({ plate: p, type: user.vehicleType || '4-wheeler', isPrimary: true });
        seen.add(p);
      }
    }

    if (Array.isArray(user?.vehicles)) {
      user.vehicles.forEach((v) => {
        const plate = formatIndianLicensePlate(getVehiclePlate(v));
        const type = getVehicleType(v);
        if (plate && !seen.has(plate)) {
          list.push({ plate, type, isPrimary: plate === formatIndianLicensePlate(user?.vehicleNumber || '') });
          seen.add(plate);
        }
      });
    }

    return list;
  })();

  const handleSavePrimaryVehicle = async () => {
    const cleanPlate = formatIndianLicensePlate(primaryPlateInput.trim());
    if (!cleanPlate || !isValidIndianLicensePlate(cleanPlate)) {
      toast('Please enter a valid Indian license plate number (e.g. GJ-01-AB-1234)', 'error');
      return;
    }

    setSavingPrimaryLoading(true);
    try {
      const res = await authApi.updateProfile({
        vehicleNumber: cleanPlate,
        vehicleType: primaryTypeInput,
      });
      if (res.user) {
        updateUser(res.user as Partial<User>);
        toast(`⭐ Primary vehicle saved: ${cleanPlate} (${getVehicleTypeBadge(primaryTypeInput).label})`, 'success');
        setIsEditingPrimary(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update primary vehicle';
      toast(message, 'error');
    } finally {
      setSavingPrimaryLoading(false);
    }
  };

  const handleSetAsPrimary = async (plate: string) => {
    try {
      const res = await authApi.updateProfile({ setPrimaryVehicle: plate });
      if (res.user) {
        updateUser(res.user as Partial<User>);
        toast(`⭐ Vehicle ${plate} is now your Primary Registered Vehicle!`, 'success');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set primary vehicle';
      toast(message, 'error');
    }
  };

  const handleAddVehicle = async () => {
    const cleanPlate = formatIndianLicensePlate(newPlate.trim());
    if (!cleanPlate || !isValidIndianLicensePlate(cleanPlate)) {
      toast('Please enter a valid Indian license plate number (e.g. GJ-01-AB-1234)', 'error');
      return;
    }

    const primary = formatIndianLicensePlate(user?.vehicleNumber || '');
    if (cleanPlate === primary) {
      toast(`⚠️ Vehicle ${cleanPlate} is already your Primary Registered Vehicle!`, 'error');
      return;
    }

    if (allVehicles.some((v) => v.plate === cleanPlate)) {
      toast(`⚠️ Vehicle ${cleanPlate} is already registered in your Garage!`, 'error');
      return;
    }

    setAddVehicleLoading(true);
    try {
      const res = await authApi.updateProfile({ addVehicle: cleanPlate, addVehicleType: newVehicleType });
      if (res.user) {
        updateUser(res.user as Partial<User>);
        toast(`✅ Vehicle ${cleanPlate} (${getVehicleTypeBadge(newVehicleType).label}) added to your garage!`, 'success');
        setNewPlate('');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add vehicle';
      toast(message, 'error');
    } finally {
      setAddVehicleLoading(false);
    }
  };

  const handleRemoveVehicle = async (plate: string) => {
    try {
      const res = await authApi.updateProfile({ removeVehicle: plate });
      if (res.user) {
        updateUser(res.user as Partial<User>);
        toast(`Vehicle ${plate} removed from garage`, 'success');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove vehicle';
      toast(message, 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast('Current password is required', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast(message, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="relative">
        <div className="absolute right-0 top-0 opacity-15 hidden sm:block">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <BikeScooter className="w-24 h-auto" color="#ec4899" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold neon-text">My Profile</h1>
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account details</p>
      </div>

      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #ec4899)' }}>
          <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{initials}</span>
        </div>
      </motion.div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <HiOutlineUserCircle className="w-4 h-4 inline mr-1.5 text-[#06b6d4]" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-neon w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <HiOutlineEnvelope className="w-4 h-4 inline mr-1.5 text-[#ec4899]" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-neon w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              <HiOutlineDevicePhoneMobile className="w-4 h-4 inline mr-1.5 text-orange-400" />
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input-neon w-full"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={profileLoading}
            className="btn-neon w-full py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 mt-2"
          >
            {profileLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </div>

      {/* MY VEHICLE GARAGE (REGISTERED VEHICLES) */}
      <div className="glass-card p-6 rounded-2xl space-y-5 border border-cyan-500/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            My Vehicle Garage (Registered Vehicles)
          </h3>
          <span className="text-xs text-cyan-400 font-mono font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            {allVehicles.length} Vehicles Total
          </span>
        </div>

        {/* PRIMARY REGISTERED VEHICLE CARD */}
        {user?.vehicleNumber && !isEditingPrimary ? (
          <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/40">
                  ⭐ Primary Vehicle (Signup Default)
                </span>
                {(() => {
                  const badge = getVehicleTypeBadge(user.vehicleType || '4-wheeler');
                  return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                  );
                })()}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPrimaryPlateInput(formatIndianLicensePlate(user.vehicleNumber || ''));
                  setPrimaryTypeInput((user.vehicleType as any) || '4-wheeler');
                  setIsEditingPrimary(true);
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-500/30 transition"
              >
                ✏️ Edit Primary
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-mono font-extrabold text-xl text-white tracking-wider">
                {user.vehicleNumber}
              </p>
              <span className="text-[11px] text-gray-400 font-sans">
                Auto-selected for Quick Pass &amp; ANPR Gate
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>⭐</span> {user?.vehicleNumber ? 'Edit Primary Vehicle' : 'Set Primary Registered Vehicle'}
              </span>
              {user?.vehicleNumber && (
                <button
                  type="button"
                  onClick={() => setIsEditingPrimary(false)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Vehicle Type Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: '4-wheeler', label: 'Four Wheeler', icon: '🚗' },
                { id: '2-wheeler', label: 'Two Wheeler', icon: '🛵' },
                { id: 'ev', label: 'EV Charging', icon: '⚡' },
                { id: 'accessible', label: 'Accessible', icon: '♿' },
              ].map((t) => {
                const active = primaryTypeInput === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPrimaryTypeInput(t.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold shadow-sm'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={13}
                value={primaryPlateInput}
                onChange={(e) => setPrimaryPlateInput(formatIndianLicensePlate(e.target.value))}
                onKeyDown={(e) => {
                  handlePlateKeyDown(e, primaryPlateInput, setPrimaryPlateInput);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSavePrimaryVehicle();
                  }
                }}
                placeholder="e.g. GJ-01-AB-1234"
                className="input-neon flex-1 px-3 py-2 text-xs font-mono uppercase rounded-xl tracking-wider font-bold"
              />
              <button
                type="button"
                onClick={handleSavePrimaryVehicle}
                disabled={savingPrimaryLoading || !primaryPlateInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg disabled:opacity-50 transition whitespace-nowrap"
              >
                {savingPrimaryLoading ? 'Saving...' : 'Save Primary'}
              </button>
            </div>
          </div>
        )}

        {/* ALL GARAGE VEHICLES LIST */}
        {allVehicles.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400">All Saved Garage Vehicles:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allVehicles.map((v) => {
                const badge = getVehicleTypeBadge(v.type);
                return (
                  <div
                    key={v.plate}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition ${
                      v.isPrimary
                        ? 'bg-cyan-950/80 border-cyan-400/60 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{badge.icon}</span>
                      <div>
                        <span className="font-bold text-white text-sm block">{v.plate}</span>
                        <span className="text-[10px] text-gray-400 font-sans">{badge.label}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {v.isPrimary ? (
                        <span className="text-[10px] px-2 py-0.5 bg-cyan-500/30 text-cyan-300 rounded-md font-sans font-bold border border-cyan-400/40">
                          ⭐ Primary
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSetAsPrimary(v.plate)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-sans font-semibold transition"
                            title="Set as your primary car"
                          >
                            Set Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicle(v.plate)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition"
                            title="Remove vehicle from garage"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADD NEW VEHICLE FORM */}
        <div className="pt-3 border-t border-white/10 space-y-3">
          <label className="block text-xs font-semibold text-gray-300">
            + Register Another Vehicle to Garage (Car 2 / Bike / EV):
          </label>

          {/* Vehicle Type Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: '4-wheeler', label: 'Four Wheeler', icon: '🚗' },
              { id: '2-wheeler', label: 'Two Wheeler', icon: '🛵' },
              { id: 'ev', label: 'EV Charging', icon: '⚡' },
              { id: 'accessible', label: 'Accessible', icon: '♿' },
            ].map((t) => {
              const active = newVehicleType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNewVehicleType(t.id as any)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/20 font-bold'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={13}
              value={newPlate}
              onChange={(e) => setNewPlate(formatIndianLicensePlate(e.target.value))}
              onKeyDown={(e) => {
                handlePlateKeyDown(e, newPlate, setNewPlate);
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddVehicle();
                }
              }}
              placeholder="e.g. GJ-01-XY-9999"
              className="input-neon flex-1 px-3 py-2 text-xs font-mono uppercase rounded-xl tracking-wider font-bold"
            />
            <button
              onClick={handleAddVehicle}
              disabled={addVehicleLoading || !newPlate.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 disabled:opacity-50 transition whitespace-nowrap"
            >
              {addVehicleLoading ? 'Saving...' : '+ Add to Garage'}
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">
          <HiOutlineLockClosed className="w-4 h-4 inline mr-1.5 text-[#06b6d4]" />
          Change Password
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="input-neon w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="input-neon w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="input-neon w-full"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={passwordLoading}
            className="w-full py-3 btn-outline font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {passwordLoading ? (
              <span className="animate-spin w-5 h-5 border-2 border-[#06b6d4] border-t-transparent rounded-full" />
            ) : null}
            Update Password
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={handleSave}
          disabled={profileLoading}
          className="w-full sm:w-auto px-8 py-3 btn-neon font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          {profileLoading ? (
            <span className="animate-spin w-5 h-5 border-2 border-[#06b6d4] border-t-transparent rounded-full" />
          ) : null}
          Save Changes
        </button>
      </motion.div>

      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-cyan-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              <HiOutlineLockClosed className="w-5 h-5 text-cyan-400" />
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Protect your account using Authy or Google Authenticator App
            </p>
          </div>
          <button
            onClick={() => setIs2FaModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition"
          >
            {user?.twoFactorEnabled ? 'Manage 2FA' : 'Enable Authy 2FA'}
          </button>
        </div>
      </div>

      <TwoFactorModal
        isOpen={is2FaModalOpen}
        onClose={() => setIs2FaModalOpen(false)}
        isEnabled={Boolean(user?.twoFactorEnabled)}
        onSuccess={() => {
          updateUser({ twoFactorEnabled: !user?.twoFactorEnabled });
          toast('2FA status updated successfully', 'success');
        }}
      />

      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-[#06b6d4]">
        <h3 className="font-semibold mb-3">Account Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Account Type</span>
            <span className="font-medium capitalize">{user?.role || 'User'}</span>
          </div>
          <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Email</span>
            <span className="font-medium">{user?.email || ''}</span>
          </div>
          <div className="flex justify-between py-2">
            <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
            <span className="font-medium">{user?.phone || ''}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
