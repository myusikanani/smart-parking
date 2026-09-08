import { useMemo, useRef, useEffect } from 'react';

interface HeatmapPoint {
  x: number;
  z: number;
  intensity: number;
  label?: string;
}

interface AIHeatmapProps {
  data: HeatmapPoint[];
  width?: number;
  height?: number;
  title?: string;
}

function heatmapColor(t: number): string {
  const r = Math.min(255, Math.floor(255 * t * 2));
  const g = Math.min(255, Math.floor(255 * (1 - Math.abs(t - 0.5) * 2)));
  const b = Math.min(255, Math.floor(255 * (1 - t) * 2));
  return `rgb(${r},${g},${b})`;
}

export default function AIHeatmap({ data, width = 400, height = 300, title = 'AI Heatmap' }: AIHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normalized = useMemo(() => {
    const maxI = Math.max(...data.map((d) => d.intensity), 1);
    return data.map((d) => ({ ...d, intensity: d.intensity / maxI }));
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || normalized.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
    bg.addColorStop(0, '#0a0a1a');
    bg.addColorStop(1, '#06060f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;
    const xs = normalized.map((d) => d.x);
    const zs = normalized.map((d) => d.z);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 1);
    const minZ = Math.min(...zs, 0);
    const maxZ = Math.max(...zs, 1);

    const gridSize = 20;
    const cellW = plotW / gridSize;
    const cellH = plotH / gridSize;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const cx = padding + (gx + 0.5) * cellW;
        const cz = padding + (gz + 0.5) * cellH;

        let totalIntensity = 0;
        for (const pt of normalized) {
          const px = padding + ((pt.x - minX) / (maxX - minX || 1)) * plotW;
          const pz = padding + ((pt.z - minZ) / (maxZ - minZ || 1)) * plotH;
          const dist = Math.sqrt((cx - px) ** 2 + (cz - pz) ** 2);
          const sigma = 30;
          totalIntensity += pt.intensity * Math.exp(-(dist * dist) / (2 * sigma * sigma));
        }

        const intensity = Math.min(1, totalIntensity);
        ctx.fillStyle = heatmapColor(intensity);
        ctx.globalAlpha = 0.6 + intensity * 0.4;
        ctx.fillRect(cx - cellW / 2, cz - cellH / 2, cellW, cellH);
        ctx.globalAlpha = 1;
      }
    }

    for (const pt of normalized) {
      const px = padding + ((pt.x - minX) / (maxX - minX || 1)) * plotW;
      const pz = padding + ((pt.z - minZ) / (maxZ - minZ || 1)) * plotH;

      const gradient = ctx.createRadialGradient(px, pz, 0, px, pz, 20);
      gradient.addColorStop(0, `rgba(255,255,255,${0.3 + pt.intensity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, pz, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,255,255,${0.3 + pt.intensity * 0.5})`;
      ctx.beginPath();
      ctx.arc(px, pz, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '10px monospace';
    for (const pt of normalized) {
      const px = padding + ((pt.x - minX) / (maxX - minX || 1)) * plotW;
      const pz = padding + ((pt.z - minZ) / (maxZ - minZ || 1)) * plotH;
      if (pt.label) {
        ctx.fillText(pt.label, px + 6, pz + 4);
      }
    }

    const gradientBar = ctx.createLinearGradient(0, 0, width, 0);
    gradientBar.addColorStop(0, '#22c55e');
    gradientBar.addColorStop(0.25, '#eab308');
    gradientBar.addColorStop(0.5, '#f97316');
    gradientBar.addColorStop(0.75, '#ef4444');
    gradientBar.addColorStop(1, '#7c3aed');
    ctx.fillStyle = gradientBar;
    ctx.fillRect(padding, height - 12, plotW, 6);
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('Low', padding - 2, height - 14);
    ctx.fillText('High', width - padding - 20, height - 14);
  }, [normalized, width, height]);

  return (
    <div className="relative">
      {title && (
        <div className="absolute top-3 left-3 z-10">
          <span className="text-xs font-bold text-cyan-400 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">{title}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl w-full h-auto border border-white/5"
      />
    </div>
  );
}
