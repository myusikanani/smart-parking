import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUser, HiOutlineShieldCheck, HiOutlineShieldExclamation } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { api, authApi } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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

const Login = () => {
  const [role, setRole] = useState<'user' | 'admin' | 'security'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [twoFARequired, setTwoFARequired] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [twoFACode, setTwoFACode] = useState(['', '', '', '', '', '']);
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeLoading, setEmailCodeLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [secretCopied, setSecretCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [serverDrift, setServerDrift] = useState<number | null>(null);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (twoFARequired && codeInputRefs.current[0]) {
      codeInputRefs.current[0].focus();
    }
  }, [twoFARequired]);

  useEffect(() => {
    if (!twoFARequired) return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [twoFARequired]);

  useEffect(() => {
    if (!twoFARequired) return;
    let cancelled = false;
    api
      .get<{ timestamp: string }>('/health')
      .then((health) => {
        if (cancelled) return;
        setServerDrift(Date.now() - new Date(health.timestamp).getTime());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [twoFARequired]);

  const roles = [
    { id: 'user' as const, label: 'User', desc: 'Book parking', icon: HiOutlineUser, color: 'cyan' },
    { id: 'admin' as const, label: 'Admin', desc: 'Manage system', icon: HiOutlineShieldCheck, color: 'pink' },
    { id: 'security' as const, label: 'Security', desc: 'Scan entry', icon: HiOutlineShieldExclamation, color: 'green' },
  ];

  const handleRoleSelect = (rId: 'user' | 'admin' | 'security') => {
    setRole(rId);
    if (rId === 'admin') {
      setEmail('admin@parksmart.com');
      setPassword('password123');
    } else if (rId === 'security') {
      setEmail('security@parksmart.com');
      setPassword('password123');
    } else {
      setEmail('john@example.com');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresTwoFactorSetup || result.requiresTwoFactor) {
        setPendingUserId(result.userId || '');
        if (result.qrCodeUrl) setQrCodeUrl(result.qrCodeUrl);
        if (result.secret) setSecretKey(result.secret);
        setTwoFARequired(true);
        setError('');
        setLoading(false);
        return;
      }
      const user = result.user;
      if (user?.role === 'admin') navigate('/admin');
      else if (user?.role === 'security') navigate('/security');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
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
    const code = useBackupCode ? backupCodeInput.trim() : twoFACode.join('');
    if (useBackupCode) {
      if (!code) {
        setTwoFAError('Please enter your 8-character backup recovery code');
        return;
      }
    } else if (code.length !== 6) {
      setTwoFAError('Enter all 6 digits');
      return;
    }

    setTwoFALoading(true);
    setTwoFAError('');
    try {
      await verifyTwoFactor(pendingUserId, code);
      navigate('/admin');
    } catch (err: unknown) {
      const data = (err as { data?: { serverTime?: string } }).data;
      const message = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setTwoFAError(
        data?.serverTime
          ? `${message} — Server time is ${new Date(data.serverTime).toLocaleTimeString()}. Make sure your phone clock is set to Automatic (Network time).`
          : message
      );
      if (!useBackupCode) {
        setTwoFACode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (!pendingUserId) return;
    setEmailCodeLoading(true);
    setTwoFAError('');
    try {
      await authApi.sendTwoFactorEmailCode(pendingUserId);
      setEmailCodeSent(true);
    } catch (err: unknown) {
      setTwoFAError(err instanceof Error ? err.message : 'Failed to send email code.');
    } finally {
      setEmailCodeLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey).then(() => {
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    });
  };

  const handleTwoFABack = () => {
    setTwoFARequired(false);
    setPendingUserId('');
    setTwoFACode(['', '', '', '', '', '']);
    setTwoFAError('');
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {!twoFARequired ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold neon-text">Welcome Back</h1>
              <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
            </div>

            <div className="flex gap-2 mb-6">
              {roles.map(r => {
                const Icon = r.icon;
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
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

            <form onSubmit={handleSubmit} className="space-y-5">
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
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 accent-cyan-500 focus:ring-cyan-500"
                    style={{ backgroundColor: 'var(--input-bg)' }}
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full py-3 px-4 text-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Register
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="two-fa-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/15 border border-pink-500/30 mb-3">
                <ShieldCheckIcon />
              </div>
              <h1 className="text-2xl font-bold text-pink-400">Admin Two-Factor Auth</h1>
              <p className="text-xs text-gray-400 mt-1">
                {qrCodeUrl ? 'Scan QR Code with Authy, then enter your 6-digit TOTP code' : 'Enter the 6-digit code from your Authy or Authenticator app'}
              </p>
            </div>

            {qrCodeUrl && (
              <div className="mb-6 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/20 text-center space-y-2">
                <span className="text-xs text-pink-400 font-bold uppercase tracking-wider block">
                  1. Scan in Authy / Authenticator App
                </span>
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-36 h-36 mx-auto rounded-xl border-2 border-pink-500/40 p-1 bg-white" />
                {secretKey && (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-[11px] text-gray-400 font-mono">
                      Secret: <span className="text-pink-300 font-bold select-all">{secretKey}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="text-[10px] font-semibold text-pink-300 hover:text-pink-200 underline decoration-dotted underline-offset-2"
                    >
                      {secretCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  Can't scan? Add the secret manually in Authy, or use the email code option below.
                </p>
              </div>
            )}

            {!useBackupCode ? (
              <>
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

                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs text-gray-400">
                    Code refreshes in <span className="text-cyan-300 font-bold">{timeLeft}s</span> — open your Authy app for the current code
                  </span>
                </div>
              </>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-semibold text-cyan-300 mb-2">
                  Emergency Backup Recovery Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. A4B7-K92P"
                  value={backupCodeInput}
                  onChange={(e) => {
                    setBackupCodeInput(e.target.value.toUpperCase());
                    setTwoFAError('');
                  }}
                  className="input-neon w-full py-3 px-4 text-center font-mono font-bold tracking-widest text-lg"
                  maxLength={9}
                />
                <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                  Use one of the 8-character backup recovery codes generated during 2FA setup.
                </p>
              </div>
            )}

            {twoFAError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                {twoFAError}
              </div>
            )}

            {serverDrift !== null && !useBackupCode && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs text-center ${
                  Math.abs(serverDrift) > 60000
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {Math.abs(serverDrift) > 60000 ? (
                  <>
                    ⚠️ Your device clock is{' '}
                    <strong>{Math.abs(Math.round(serverDrift / 1000))} seconds</strong>{' '}
                    {serverDrift > 0 ? 'ahead of' : 'behind'} the server — this is why codes are
                    rejected. On your phone: <strong>Settings → Date &amp; Time → enable "Set
                    automatically" (Network time)</strong>.
                  </>
                ) : (
                  <>
                    🕐 Server time:{' '}
                    <strong>{new Date(Date.now() - serverDrift).toLocaleTimeString()}</strong> — this
                    PC is in sync.
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleTwoFASubmit}
              disabled={twoFALoading || (!useBackupCode && twoFACode.join('').length !== 6) || (useBackupCode && !backupCodeInput.trim())}
              className="btn-neon w-full py-3 px-4 text-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl mb-3"
            >
              {twoFALoading ? 'Verifying...' : useBackupCode ? 'Verify Backup Recovery Code' : 'Verify Code'}
            </button>

            <div className="space-y-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setTwoFAError('');
                }}
                className="w-full py-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                {useBackupCode ? '← Use 6-Digit Authenticator / Email Code' : '🔑 Lost phone? Use Backup Recovery Code'}
              </button>

              {!useBackupCode && (
                emailCodeSent ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center">
                    ✅ A 6-digit code was sent to your email (demo: in server console).
                  </div>
                ) : (
                  <button
                    onClick={handleSendEmailCode}
                    disabled={emailCodeLoading}
                    className="w-full py-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/10 transition disabled:opacity-50"
                  >
                    {emailCodeLoading ? 'Sending...' : '📧 Authy code not working? Email me a code'}
                  </button>
                )
              )}
            </div>

            <button
              onClick={handleTwoFABack}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Back to login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default Login;
