import { motion, AnimatePresence } from 'framer-motion';
import { estimateWaitTime } from '../../utils/aiEngine';
import type { SlotScore } from '../../utils/aiEngine';

interface AIRecommendationPanelProps {
  recommendations: SlotScore[];
  onSelectSlot: (slotId: string) => void;
  isLoading?: boolean;
  occupancyRate?: number;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#f97316';

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <motion.circle
          cx="22" cy="22" r={radius}
          fill="none" stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-xs font-bold text-white">{score}</span>
    </div>
  );
}

export default function AIRecommendationPanel({
  recommendations,
  onSelectSlot,
  isLoading,
  occupancyRate,
}: AIRecommendationPanelProps) {
  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-4 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-bold text-cyan-400">AI Analyzing</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded w-1/3" />
                <div className="h-2 bg-white/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/5 text-center">
        <div className="text-3xl mb-2">🔮</div>
        <p className="text-sm text-gray-400">No AI recommendations available</p>
        <p className="text-xs text-gray-500 mt-1">All slots are occupied or the system is still learning</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          AI Smart Pick
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
            {recommendations.length} options
          </span>
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {recommendations.slice(0, 5).map((rec, index) => (
          <motion.button
            key={rec.slotId}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => onSelectSlot(rec.slotId)}
            className="w-full mb-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center gap-3">
              <ScoreRing score={rec.score} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Slot {rec.number}</span>
                  {index === 0 && (
                    <span className="text-[10px] bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-1.5 py-0.5 rounded-md font-bold">
                      BEST
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rec.reasons.slice(0, 3).map((reason, ri) => (
                    <span
                      key={ri}
                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right">
                {occupancyRate !== undefined && (
                  <>
                    <div className="text-[10px] text-gray-500">Est. wait</div>
                    <div className="text-xs font-bold text-cyan-400">~{estimateWaitTime(occupancyRate)} min</div>
                  </>
                )}
                <div className="text-[10px] text-gray-500 mt-0.5">Confidence</div>
                <div className="text-xs font-bold text-gray-300">{Math.round(rec.confidence * 100)}%</div>
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
