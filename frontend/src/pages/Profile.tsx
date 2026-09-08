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
