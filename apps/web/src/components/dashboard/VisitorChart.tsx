import { motion } from "motion/react";
import type { HistoryPoint } from "@livedot/shared";

interface Props {
  websiteName: string;
  count: number;
  connected: boolean;
  history: HistoryPoint[];
}

const W = 200;
const H = 48;
const PAD_TOP = 4;
const PAD_BOT = 2;

function buildPath(points: HistoryPoint[], close: boolean): string {
  if (points.length === 0) return "";

  const max = Math.max(...points.map((p) => p.count), 1);
  const yRange = H - PAD_TOP - PAD_BOT;

  const coords = points.map((p, i) => {
    const x = (i / Math.max(points.length - 1, 1)) * W;
    const y = PAD_TOP + yRange - (p.count / max) * yRange;
    return { x, y };
  });

  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    d += ` L${coords[i].x},${coords[i].y}`;
  }

  if (close) {
    d += ` L${W},${H} L0,${H} Z`;
  }

  return d;
}

export default function VisitorChart({ websiteName, count, connected, history }: Props) {
  const linePath = buildPath(history, false);
  const areaPath = buildPath(history, true);

  return (
    <motion.div
      initial={{ y: -12, scale: 0.97 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: -12, scale: 0.97 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-3 left-3 z-40 md:top-4 md:left-4"
      style={{ width: 240, willChange: "transform" }}
    >
      <div
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden px-3.5 pt-3 pb-2"
        style={{ backfaceVisibility: "hidden" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0">
            <p className="text-xs text-foreground/80 font-medium truncate">{websiteName}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? "bg-[#96E421] animate-pulse" : "bg-zinc-500"
              }`}
            />
            <span className="text-xs text-muted/50">10m</span>
          </div>
        </div>

        {/* Sparkline */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: 48 }}
        >
          <defs>
            <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#96E421" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#96E421" stopOpacity="0" />
            </linearGradient>
            <filter id="line-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {history.length > 1 && (
            <>
              <path d={areaPath} fill="url(#area-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke="#96E421"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#line-glow)"
              />
              {/* Current value dot */}
              {(() => {
                const max = Math.max(...history.map((p) => p.count), 1);
                const last = history[history.length - 1];
                const yRange = H - PAD_TOP - PAD_BOT;
                const cx = W;
                const cy = PAD_TOP + yRange - (last.count / max) * yRange;
                return <circle cx={cx} cy={cy} r="2.5" fill="#96E421" opacity="0.9" />;
              })()}
            </>
          )}

          {history.length <= 1 && (
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#96E421" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
          )}
        </svg>
      </div>
    </motion.div>
  );
}
