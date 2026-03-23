import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";

export const Route = createFileRoute("/embed/chart")({
  component: EmbedChart,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
    accent: (search.accent as string) ?? "#96E421",
  }),
});

const W = 400;
const H = 120;
const PAD_TOP = 8;
const PAD_BOT = 4;

function buildPath(points: { count: number }[], close: boolean): string {
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

function EmbedChart() {
  const { website, token, bg, accent } = Route.useSearch();
  const { count, connected, history } = useWebSocket(website || null, token || undefined);

  if (!website || !token) {
    return null;
  }

  const linePath = buildPath(history, false);
  const areaPath = buildPath(history, true);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: connected ? accent : "#71717a",
              }}
            />
            <span style={{ fontSize: 24, fontWeight: 700, color: "#fafafa" }}>{count}</span>
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>visitors</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 120 }}>
          <defs>
            <linearGradient id="embed-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
            <filter id="embed-line-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {history.length > 1 ? (
            <>
              <path d={areaPath} fill="url(#embed-area-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke={accent}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#embed-line-glow)"
              />
              {(() => {
                const max = Math.max(...history.map((p) => p.count), 1);
                const last = history[history.length - 1];
                const yRange = H - PAD_TOP - PAD_BOT;
                const cx = W;
                const cy = PAD_TOP + yRange - (last.count / max) * yRange;
                return <circle cx={cx} cy={cy} r="3" fill={accent} opacity="0.9" />;
              })()}
            </>
          ) : (
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke={accent} strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
          )}
        </svg>
      </div>
    </div>
  );
}
