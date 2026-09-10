import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUserCircle, HiOutlineEnvelope, HiOutlineDevicePhoneMobile, HiOutlineLockClosed } from 'react-icons/hi2';
import { useAuth, type User } from '../context/AuthContext';
import { BikeScooter } from '../components/vehicles';
import { authApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import TwoFactorModal from '../components/TwoFactorModal';

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
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
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

  const handleAddVehicle = async () => {
    const cleanPlate = newPlate.trim().toUpperCase();
    if (!cleanPlate) {
      toast('Please enter a valid license plate number', 'error');
      return;
    }

    const primary = (user?.vehicleNumber || '').trim().toUpperCase();
    if (cleanPlate === primary) {
      toast(`⚠️ Vehicle ${cleanPlate} is already your Primary Registered Car!`, 'error');
      return;
    }

    if (user?.vehicles && user.vehicles.map(v => v.trim().toUpperCase()).includes(cleanPlate)) {
      toast(`⚠️ Vehicle ${cleanPlate} is already registered in your Garage!`, 'error');
      return;
    }

    setAddVehicleLoading(true);
    try {
      const res = await authApi.updateProfile({ addVehicle: cleanPlate });
      if (res.user) {
        updateUser(res.user as Partial<User>);
        toast(`🚗 Vehicle ${cleanPlate} added to your garage!`, 'success');
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

      {/* MY VEHICLE GARAGE (REGISTERED CARS) */}
      <div className="glass-card p-6 rounded-2xl space-y-4 border border-cyan-500/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            My Vehicle Garage (Registered Cars)
          </h3>
          <span className="text-xs text-cyan-400 font-mono font-bold">
            {(user?.vehicles?.length || (user?.vehicleNumber ? 1 : 0))} Cars Total
          </span>
        </div>

        {/* Primary Car Badge */}
        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/40">
              ⭐ Primary Vehicle (Default)
            </span>
            <p className="font-mono font-bold text-sm text-white mt-1">
              {user?.vehicleNumber || 'MH-12-AB-3456'}
            </p>
          </div>
          <span className="text-[11px] text-gray-400 font-sans">Default for ANPR &amp; Pass</span>
        </div>

        {/* Other Garage Vehicles */}
        {user?.vehicles && user.vehicles.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-400">All Registered Cars in Account:</label>
            <div className="flex flex-wrap gap-2">
              {user.vehicles.map((v) => (
                <div
                  key={v}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono font-bold text-cyan-200"
                >
                  <span>🚗 {v}</span>
                  {v === user.vehicleNumber ? (
                    <span className="text-[9px] px-1 bg-cyan-500/30 text-cyan-300 rounded font-sans">Primary</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(v)}
                      className="ml-1 text-gray-400 hover:text-red-400 text-xs transition"
                      title="Remove car from garage"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Vehicle Form */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <label className="block text-xs font-semibold text-gray-300">
            + Register Another Car to Garage (Car 2 / Car 3):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              placeholder="e.g. GJ-01-XY-9999"
              className="input-neon flex-1 px-3 py-2 text-xs font-mono uppercase rounded-xl"
            />
            <button
              onClick={handleAddVehicle}
              disabled={addVehicleLoading || !newPlate.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-pink-500/25 disabled:opacity-50 transition"
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
