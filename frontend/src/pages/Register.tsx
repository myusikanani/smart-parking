import { useState, useMemo, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUser, HiOutlineShieldExclamation } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const strengthConfig = [
  { label: 'Weak', color: 'bg-cyan-500', width: '33%', active: (s: number) => s > 0 },
  { label: 'Medium', color: 'bg-pink-500', width: '66%', active: (s: number) => s > 1 },
  { label: 'Strong', color: 'bg-green-500', width: '100%', active: (s: number) => s > 2 },
];

const getStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;
  return score;
};

const Register = () => {
  const [role, setRole] = useState<'user' | 'admin' | 'security'>('user');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');
  const [twoFACode, setTwoFACode] = useState(['', '', '', '', '', '']);
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (show2FASetup && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [show2FASetup]);

  const strength = useMemo(() => getStrength(password), [password]);

  const roles = [
    { id: 'user' as const, label: 'User', desc: 'Book & manage parking', icon: HiOutlineUser, color: 'cyan' },
    { id: 'security' as const, label: 'Security', desc: 'Scan & monitor entry', icon: HiOutlineShieldExclamation, color: 'green' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = 'Full name is required';

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{7,15}$/.test(phone)) {
      errs.phone = 'Invalid phone number';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) errs.terms = 'You must agree to the terms';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...twoFACode];
    newCode[index] = value;
    setTwoFACode(newCode);
    setTwoFAError('');

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !twoFACode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
      const newCode = [...twoFACode];
      newCode[index - 1] = '';
      setTwoFACode(newCode);
    }
  };

  const handleCodePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setTwoFACode(newCode);

    const nextEmpty = newCode.findIndex(c => c === '');
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    codeInputRefs.current[focusIndex]?.focus();
  };

  const handleTwoFASubmit = async () => {
    const code = twoFACode.join('');
    if (code.length !== 6) {
      setTwoFAError('Enter all 6 digits');
      return;
    }

    setTwoFALoading(true);
    setTwoFAError('');
    try {
      await verifyTwoFactor(pendingUserId, code);
      navigate('/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setTwoFAError(message);
      setTwoFACode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleTwoFABack = () => {
    setShow2FASetup(false);
    setQrCodeUrl('');
    setSecretKey('');
    setPendingUserId('');
    setTwoFACode(['', '', '', '', '', '']);
    setTwoFAError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await register(fullName, email, phone, password, role);
      if (result.requiresTwoFactorSetup) {
        setQrCodeUrl(result.qrCodeUrl || '');
        setSecretKey(result.secret || '');
        setPendingUserId(result.userId || '');
        setShow2FASetup(true);
        setLoading(false);
        return;
      }
      if (role === 'security') navigate('/security');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrors({ ...errors, form: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {!show2FASetup ? (
          <motion.div
            key="register-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold neon-text">Create Account</h1>
              <p className="text-gray-400 mt-2">Join ParkEase today</p>
            </div>

            <div className="flex gap-2 mb-6">
              {roles.map(r => {
                const Icon = r.icon;
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? r.color === 'cyan'
                          ? 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : r.color === 'pink'
                            ? 'bg-pink-500/15 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                            : 'bg-green-500/15 border-green-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? (r.color === 'cyan' ? 'text-cyan-400' : r.color === 'pink' ? 'text-pink-400' : 'text-green-400') : 'text-gray-500'}`} />
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{r.label}</span>
                    <span className="text-[10px] text-gray-500 hidden sm:block">{r.desc}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="input-neon pl-11"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <EnvelopeIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="input-neon pl-11"
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <PhoneIcon />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="input-neon pl-11"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="input-neon pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

              {password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5 h-2">
                    {strengthConfig.map(({ color, width, active }) => (
                      <div
                        key={width}
                        className={`h-full rounded-full transition-all duration-300 ${active(strength) ? color : 'bg-white/10'}`}
                        style={{ width }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Password strength:{' '}
                    <span className="font-medium text-gray-400">
                      {strengthConfig.find((_, i) => i === Math.min(strength, 3) - 1)?.label || 'Weak'}
                    </span>
                  </p>
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <LockIcon />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="input-neon pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-600 accent-cyan-500 focus:ring-cyan-500"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  />
                  <span className="text-sm text-gray-400">
                    I agree to{' '}
                    <span className="font-medium text-cyan-400">
                      Terms & Conditions
                    </span>
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-xs text-red-400">{errors.terms}</p>
                )}
              </div>

              {errors.form && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {errors.form}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full py-3 px-4 text-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="twofa-setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/15 border border-pink-500/30 mb-4">
                <ShieldCheckIcon />
              </div>
              <h1 className="text-3xl font-bold text-pink-400">Setup 2FA</h1>
              <p className="text-gray-400 mt-2">Scan QR code in Authy app and enter the 6-digit code</p>
            </div>

            <div className="flex justify-center mb-6">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl border border-pink-500/30" />
              ) : (
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 text-sm">
                  QR Code
                </div>
              )}
            </div>

            {secretKey && (
              <div className="text-center mb-6">
                <p className="text-xs text-gray-400 mb-1">Or enter this key manually in Authy:</p>
                <p className="text-sm font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-2 inline-block tracking-wider">
                  {secretKey}
                </p>
              </div>
            )}

            <div className="flex justify-center gap-2 sm:gap-3 mb-6">
              {twoFACode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeInputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onPaste={handleCodePaste}
                  className="w-9 sm:w-12 h-12 sm:h-14 text-center text-xl font-bold input-neon rounded-xl"
                />
              ))}
            </div>

            {twoFAError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {twoFAError}
              </div>
            )}

            <button
              onClick={handleTwoFASubmit}
              disabled={twoFALoading || twoFACode.join('').length !== 6}
              className="btn-neon w-full py-3 px-4 text-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl mb-4"
            >
              {twoFALoading ? 'Verifying...' : 'Verify & Complete Setup'}
            </button>

            <button
              onClick={handleTwoFABack}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to registration
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default Register;
