import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineLockClosed,
  HiOutlineCheck
} from 'react-icons/hi2';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const termsSections = [
  {
    id: 'reservation',
    title: '1. Slot Reservation & Hold Policy',
    icon: HiOutlineClock,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    titleColor: 'text-slate-900 dark:text-cyan-200',
    bgColor: 'bg-cyan-50/70 dark:bg-cyan-950/30',
    borderColor: 'border-cyan-200/80 dark:border-cyan-500/30',
    points: [
      'Slot holds are valid for 10 minutes from initiation. If payment is not completed within 10 minutes, the hold expires and the slot is automatically released to other users.',
      'A confirmed booking guarantees entry only for the vehicle number registered during the booking process.',
      'Early entry is permitted up to 15 minutes before the booked slot time, subject to slot availability.'
    ]
  },
  {
    id: 'overstay',
    title: '2. Overstay & Penalty Policy',
    icon: HiOutlineExclamationTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    titleColor: 'text-slate-900 dark:text-amber-200',
    bgColor: 'bg-amber-50/70 dark:bg-amber-950/30',
    borderColor: 'border-amber-200/80 dark:border-amber-500/30',
    points: [
      'Vehicles parked beyond their scheduled end time will be flagged as "Overstay".',
      'Overstay charges will be levied at the standard hourly rate plus an automated penalty fee of ₹50/hour.',
      'Continuous overstay exceeding 6 hours without prior notice may result in vehicle towing at the owner\'s expense.'
    ]
  },
  {
    id: 'cancellation',
    title: '3. Cancellation & Refund Policy',
    icon: HiOutlineCreditCard,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    titleColor: 'text-slate-900 dark:text-emerald-200',
    bgColor: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200/80 dark:border-emerald-500/30',
    points: [
      'Cancellations made 30 minutes or more before the booking start time are eligible for a 100% instant refund.',
      'Cancellations made within 30 minutes of start time will receive a 70% refund (30% retention fee).',
      'No refunds are issued for "No-Show" bookings where the vehicle did not check in within 45 minutes of the start time.'
    ]
  },
  {
    id: 'safety',
    title: '4. Facility Rules & Vehicle Safety',
    icon: HiOutlineTruck,
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-slate-900 dark:text-blue-200',
    bgColor: 'bg-blue-50/70 dark:bg-blue-950/30',
    borderColor: 'border-blue-200/80 dark:border-blue-500/30',
    points: [
      'The speed limit inside all parking facilities is strictly 10 km/h. Hazard lights must be used when navigating ramps.',
      'ParkSmart premises are under 24/7 CCTV surveillance and Automated Number Plate Recognition (ANPR).',
      'ParkSmart provides secure access authorization. Vehicle contents, valuables, and personal belongings remain the sole responsibility of the vehicle owner.'
    ]
  },
  {
    id: 'account',
    title: '5. Account Security & 2FA',
    icon: HiOutlineLockClosed,
    iconColor: 'text-purple-600 dark:text-pink-400',
    titleColor: 'text-slate-900 dark:text-pink-200',
    bgColor: 'bg-purple-50/70 dark:bg-pink-950/30',
    borderColor: 'border-purple-200/80 dark:border-pink-500/30',
    points: [
      'Users are responsible for maintaining the confidentiality of their account password and 2FA backup recovery codes.',
      'Accounts with repeated failed login attempts will be temporarily locked for 2 hours to safeguard against brute-force attacks.',
      'Single-use emergency backup codes must be stored securely and regenerated if compromised.'
    ]
  }
];

export default function TermsAndConditionsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null;

  const handleAccept = () => {
    if (onAccept) onAccept();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-cyan-500/30 rounded-2xl shadow-2xl dark:shadow-[0_0_40px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 border border-cyan-300 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400">
                <HiOutlineShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Terms & Conditions</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">ParkSmart Platform & Facility Agreement</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
              title="Close"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-sm">
            {/* Notice Banner */}
            <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 text-xs sm:text-sm text-cyan-950 dark:text-cyan-200 leading-relaxed font-medium">
              📌 <strong>Important:</strong> By registering an account with ParkSmart / ParkEase, you agree to comply with our digital parking terms, slot reservation holds, facility speed limits, and fee policies outlined below.
            </div>

            {termsSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className={`p-4 rounded-xl border ${section.bgColor} ${section.borderColor} transition-all`}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <Icon className={`w-5 h-5 ${section.iconColor}`} />
                    <h3 className={`font-bold text-sm ${section.titleColor}`}>{section.title}</h3>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    {section.points.map((pt, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div className="pt-2 text-xs text-slate-500 dark:text-gray-500 text-center font-medium">
              Last updated: September 2026 • ParkSmart Automated Parking Systems Ltd.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={handleAccept}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <HiOutlineCheck className="w-4 h-4" />
                I Agree & Accept
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
