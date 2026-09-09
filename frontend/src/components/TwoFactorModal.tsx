import { useState, type FC, type FormEvent } from 'react';
import { ShieldCheck, QrCode, Key, X, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { authApi } from '../services/api';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  onSuccess: () => void;
}

export const TwoFactorModal: FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  isEnabled,
  onSuccess,
}) => {
  const [step, setStep] = useState<'init' | 'scan' | 'backup_codes'>('init');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.setupTwoFactor();
      setQrCodeUrl(res.qrCodeUrl);
      setSecret(res.secret);
      setStep('scan');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to initiate 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authApi.confirmTwoFactor(code);
      if (res.backupCodes && res.backupCodes.length > 0) {
        setBackupCodes(res.backupCodes);
        setStep('backup_codes');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; data?: { serverTime?: string } };
      setError(
        errorObj.data?.serverTime
          ? `${errorObj.message || 'Invalid code.'} — Server time is ${new Date(errorObj.data.serverTime).toLocaleTimeString()}. Make sure your phone clock is set to Automatic (Network time).`
          : errorObj.message || 'Invalid code. Check your Authy / Authenticator app.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.regenerateBackupCodes();
      setBackupCodes(res.backupCodes || []);
      setStep('backup_codes');
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to regenerate backup codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setError('');
    try {
      await authApi.disableTwoFactor();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `PARKSMART 2FA EMERGENCY BACKUP RECOVERY CODES\nGenerated: ${new Date().toLocaleString()}\n\nEach code can only be used once if you lose access to your authenticator app:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes in a secure password manager.`;
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'parksmart-2fa-backup-codes.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl max-w-md w-full max-h-[calc(100vh-2rem)] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text)]">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-[var(--text-secondary)]">Security & Emergency Recovery</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'backup_codes' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <p className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Save Your Emergency Backup Codes
              </p>
              <p className="text-xs text-gray-300 mt-1">
                If you lose access to your phone or authenticator app, you can use these one-time codes to sign in. Each code works once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] font-mono text-center text-xs font-bold text-cyan-300">
              {backupCodes.map((c, idx) => (
                <div key={idx} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  {c}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyAllBackupCodes}
                className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {codesCopied ? 'Copied!' : 'Copy All'}
              </button>
              <button
                type="button"
                onClick={downloadBackupCodes}
                className="flex-1 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-400 border border-cyan-500/30 transition flex items-center justify-center gap-1.5"
              >
                Download (.txt)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20"
            >
              I Have Saved My Backup Codes
            </button>
          </div>
        ) : isEnabled ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-semibold text-sm">2FA is Currently Active</p>
                <p className="text-xs opacity-80">Your account is secured with Authy / TOTP Authenticator.</p>
              </div>
            </div>

            <button
              onClick={handleRegenerateCodes}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-semibold transition"
            >
              {loading ? 'Generating...' : 'Regenerate Backup Recovery Codes'}
            </button>

            <button
              onClick={handleDisable}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-sm font-semibold transition"
            >
              {loading ? 'Disabling...' : 'Disable 2FA Security'}
            </button>
          </div>
        ) : step === 'init' ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-2 border border-cyan-500/20">
              <QrCode className="w-8 h-8" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Secure your account using <strong>Authy</strong>, <strong>Google Authenticator</strong>, or <strong>Microsoft Authenticator</strong> on your smartphone.
            </p>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Generating Code...' : 'Setup Authy / Authenticator App'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl text-center border border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-2">1. Scan this QR Code in <strong>Authy</strong> or <strong>Authenticator App</strong>:</p>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 mx-auto rounded-lg border border-cyan-500/30 p-1 bg-white" />
              ) : (
                <div className="w-44 h-44 mx-auto flex items-center justify-center text-xs text-[var(--text-muted)]">Loading QR...</div>
              )}
              <div className="mt-3 text-left bg-[var(--input-bg)] p-2.5 rounded-lg border border-[var(--border)] flex items-center justify-between">
                <div className="overflow-hidden">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono">Secret Key</span>
                  <span className="font-mono text-xs text-[var(--text)] font-semibold truncate block">{secret}</span>
                </div>
                <button
                  type="button"
                  onClick={copySecret}
                  className="p-1.5 hover:bg-[var(--border)] rounded-md text-cyan-500 transition shrink-0"
                  title="Copy Key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <span className="text-[10px] text-emerald-500 block mt-1">Copied key to clipboard!</span>}
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">
                2. Enter 6-digit Code from Authy/Authenticator App:
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-center text-lg font-mono tracking-widest font-bold text-[var(--text)] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/20"
              >
                {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                Code rejected? Make sure your phone clock is set to Automatic (Network time) — TOTP codes are time-sensitive.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorModal;
