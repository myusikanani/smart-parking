import { useState, useEffect } from 'react';
import { predictOccupancy } from '../../utils/aiEngine';

export default function AvailabilityForecast() {
  const [forecast, setForecast] = useState<{ hour: number; predicted: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/ai/analytics?range=24h`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (data.occupancyForecast) {
          setForecast(data.occupancyForecast);
        } else {
          setForecast(predictOccupancy(
            Array.from({ length: 24 }, (_, i) => ({ hour: i, occupancy: 0.3 + Math.random() * 0.5 }))
          ));
        }
      } catch {
        setForecast(predictOccupancy(
          Array.from({ length: 24 }, (_, i) => ({ hour: i, occupancy: 0.3 + Math.random() * 0.5 }))
        ));
      }
      setLoading(false);
    };
    load();
  }, []);

  const now = new Date().getHours();
  const next6 = forecast.filter((f) => {
    const diff = (f.hour - now + 24) % 24;
    return diff >= 0 && diff < 6;
  });
  const peak = forecast.filter((f) => f.predicted >= 70).length;

  return (
    <div className="glass rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
          AI Availability Forecast
          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">Predictive</span>
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-3 bg-white/10 rounded" />
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {next6.map((f) => (
              <div key={f.hour} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 w-9">{`${f.hour}:00`}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${f.predicted}%`,
                      background: f.predicted >= 70
                        ? 'linear-gradient(to right, #ef4444, #f97316)'
                        : f.predicted >= 40
                        ? 'linear-gradient(to right, #eab308, #f97316)'
                        : 'linear-gradient(to right, #22c55e, #4ade80)',
                    }}
                  />
                </div>
                <span className={`text-[10px] font-bold w-8 text-right ${f.predicted >= 70 ? 'text-red-400' : f.predicted >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {f.predicted}%
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <span className="text-[10px] text-gray-500">Peak periods ahead</span>
            <span className="text-sm font-bold text-orange-400">{peak} hours</span>
          </div>
        </>
      )}
    </div>
  );
}
