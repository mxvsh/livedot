import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";
import { aggregateHistoryPoints } from "@/lib/chart";
import { useEmbedBranding } from "@/components/embed/useEmbedBranding";

export const Route = createFileRoute("/embed/chart")({
  component: EmbedChart,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
    accent: (search.accent as string) ?? "#96E421",
    branding: String(search.branding ?? ""),
    scale: Number(search.scale ?? 0.9),
  }),
});

const W = 200;
const H = 48;
const PAD_TOP = 4;
const PAD_BOT = 2;

function buildPath(points: { count: number }[], close: boolean): string {
  if (points.length === 0) return "";

  const max = Math.max(...points.map((p) => p.count), 1);
  const yRange = H - PAD_TOP - PAD_BOT;

  const coords = points.map((p, i) => {
    const x = (i / Math.max(points.length - 1, 1)) * W;
    const y = PAD_TOP + yRange - (p.count / max) * yRange;
    return { x, y };
  });

  const first = coords[0]!;
  let d = `M${first.x},${first.y}`;
  for (let i = 1; i < coords.length; i++) {
    const coord = coords[i]!;
    d += ` L${coord.x},${coord.y}`;
  }

  if (close) {
    d += ` L${W},${H} L0,${H} Z`;
  }

  return d;
}

function EmbedChart() {
  const { website, token, bg, accent, branding, scale } = Route.useSearch();
  const { count, connected, history } = useWebSocket(website || null, { token: token || undefined, recent: "10m" });
  const explicitBranding = branding === "1" || branding === "true";
  const showBranding = useEmbedBranding(website, token, explicitBranding);
  const size = Number.isFinite(scale) ? Math.min(Math.max(scale, 0.6), 1.4) : 0.9;

  if (!website || !token) {
    return null;
  }

  const aggregatedHistory = aggregateHistoryPoints(history);
  const linePath = buildPath(aggregatedHistory, false);
  const areaPath = buildPath(aggregatedHistory, true);

  return (
    <div
      style={{
        width: "fit-content",
        background: bg === "transparent" ? "transparent" : bg,
        display: "inline-flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 240 * size,
          borderRadius: 24 * size,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          overflow: "hidden",
          padding: `${12 * size}px ${14 * size}px ${8 * size}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 * size }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12 * size, color: "rgba(250,250,250,0.8)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Live visitors
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 * size, marginLeft: 8 * size }}>
            <span
              style={{
                width: 6 * size,
                height: 6 * size,
                borderRadius: "50%",
                background: connected ? accent : "#71717a",
                boxShadow: connected ? `0 0 0 ${4 * size}px color-mix(in srgb, ${accent} 18%, transparent)` : "none",
              }}
            />
            <span style={{ fontSize: 12 * size, color: "rgba(161,161,170,0.75)" }}>10m</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 * size, marginBottom: 8 * size }}>
          <span style={{ fontSize: 28 * size, fontWeight: 750, color: "#fafafa", lineHeight: 1, letterSpacing: "-0.04em" }}>{count}</span>
          <span style={{ fontSize: 12 * size, color: "#a1a1aa" }}>visitors</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 48 * size }}>
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

          {aggregatedHistory.length > 1 ? (
            <>
              <path d={areaPath} fill="url(#embed-area-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke={accent}
                strokeWidth={1.5 * size}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#embed-line-glow)"
              />
              {(() => {
                const max = Math.max(...aggregatedHistory.map((p) => p.count), 1);
                const last = aggregatedHistory[aggregatedHistory.length - 1]!;
                const yRange = H - PAD_TOP - PAD_BOT;
                const cx = W;
                const cy = PAD_TOP + yRange - (last.count / max) * yRange;
                return <circle cx={cx} cy={cy} r={2.5 * size} fill={accent} opacity="0.9" />;
              })()}
            </>
          ) : (
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke={accent} strokeOpacity="0.15" strokeWidth={1 * size} strokeDasharray="4 4" />
          )}
        </svg>
        {showBranding && (
          <a
            href="https://livedot.dev"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 6 * size,
              fontSize: 10 * size,
              color: "rgba(255,255,255,0.48)",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            Powered by Livedot
          </a>
        )}
      </div>
    </div>
  );
}
