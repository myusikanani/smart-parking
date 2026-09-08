import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';

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

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset link. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <CheckCircleIcon />
              </div>
            </div>
            <h1 className="text-3xl font-bold neon-text-cyan">Check your email</h1>
            <p className="text-gray-400 mt-3 max-w-sm mx-auto">
              We've sent a password reset link to{' '}
              <span className="font-medium text-white">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Didn't receive the email?{' '}
              <button
                type="button"
                onClick={() => setSent(false)}
                className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Try again
              </button>
            </p>
            <div className="mt-8">
              <Link
                to="/login"
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Back to sign in
              </Link>
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
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold neon-text">Forgot Password?</h1>
              <p className="text-gray-400 mt-2">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
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
                  className="input-neon pl-11"
                />
                {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full py-3 px-4 text-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-xl"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Back to sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default ForgotPassword;
