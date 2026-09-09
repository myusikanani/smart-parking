import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const LockClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = ({ show }: { show: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-cyan-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    {show ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    )}
  </svg>
);

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlToken = searchParams.get('token');
    const urlCode = searchParams.get('code');

    if (urlEmail) setEmail(urlEmail);
    if (urlToken) setToken(urlToken);
    if (urlCode) setCode(urlCode);
  }, [searchParams]);

  const calculateStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }
    if (!token && !code.trim()) {
      setError('Please enter the 6-digit reset code sent to your email');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authApi.resetPassword({
        email: email.trim(),
        token: token || undefined,
        code: code.trim() || undefined,
        newPassword
      });

      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password. Please check your code and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircleIcon />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-emerald-400">Password Reset!</h1>
            <p className="text-gray-300 mt-3 max-w-sm mx-auto">
              Your account password has been successfully updated and your security state restored.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn-neon w-full py-3 px-4 text-center font-semibold rounded-xl"
              >
                Sign In With New Password
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold neon-text">Reset Password</h1>
              <p className="text-gray-400 mt-2 text-sm">
                Enter your reset verification code and choose a new password
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <EnvelopeIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Email address"
                  className="input-neon pl-11 text-sm"
                  required
                />
              </div>

              {!token && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <KeyIcon />
                  </span>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="6-digit reset code (e.g. 582910)"
                    maxLength={6}
                    className="input-neon pl-11 tracking-widest font-mono text-sm"
                    required
                  />
                </div>
              )}

              {token && (
                <div className="p-2.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-xs flex items-center justify-between">
                  <span>🔒 Direct reset token verified</span>
                  <button
                    type="button"
                    onClick={() => setToken('')}
                    className="text-gray-400 hover:text-white underline text-[11px]"
                  >
                    Use 6-digit code instead
                  </button>
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <LockClosedIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="New password (min 6 characters)"
                  className="input-neon pl-11 pr-11 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>

              {/* Password strength bar */}
              {newPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength <= 25
                          ? 'w-1/4 bg-red-500'
                          : strength <= 50
                          ? 'w-2/4 bg-amber-500'
                          : strength <= 75
                          ? 'w-3/4 bg-blue-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Strength</span>
                    <span>
                      {strength <= 25 ? 'Weak' : strength <= 50 ? 'Fair' : strength <= 75 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <LockClosedIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Confirm new password"
                  className="input-neon pl-11 text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full py-3 px-4 text-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl mt-2 text-sm"
              >
                {loading ? 'Restoring Account...' : 'Set New Password & Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm space-y-2">
              <p>
                <Link
                  to={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                  className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Didn't get a code? Request new code
                </Link>
              </p>
              <p>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ResetPassword;
