import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEmbedBranding } from "@/components/embed/useEmbedBranding";

export const Route = createFileRoute("/embed/live")({
  component: EmbedLive,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
    accent: (search.accent as string) ?? "#96E421",
    branding: (search.branding as string) ?? "",
    scale: Number(search.scale ?? 0.85),
  }),
});

function EmbedLive() {
  const { website, token, bg, accent, branding, scale } = Route.useSearch();
  const { count, connected } = useWebSocket(website || null, token || undefined);
  const explicitBranding = branding === "1" || branding === "true";
  const showBranding = useEmbedBranding(website, token, explicitBranding);
  const size = Number.isFinite(scale) ? Math.min(Math.max(scale, 0.55), 1.4) : 0.85;

  if (!website || !token) {
    return null;
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12 * size,
        padding: `${12 * size}px ${14 * size}px`,
        borderRadius: 18 * size,
        backgroundColor: bg === "transparent" ? "rgba(10, 10, 10, 0.45)" : bg,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          width: 10 * size,
          height: 10 * size,
          borderRadius: "50%",
          background: connected ? accent : "#71717a",
          boxShadow: connected ? `0 0 0 ${6 * size}px color-mix(in srgb, ${accent} 20%, transparent)` : "none",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 34 * size, lineHeight: 1, fontWeight: 750, color: "#fafafa", letterSpacing: "-0.04em" }}>
        {count}
      </span>
      {showBranding && (
        <a
          href="https://livedot.dev"
          target="_blank"
          rel="noreferrer"
          aria-label="Open Livedot"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8 * size,
            padding: `0 ${10 * size}px`,
            height: 28 * size,
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            style={{ width: 18 * size, height: 18 * size, borderRadius: 6 * size, display: "block" }}
          />
          <span style={{ fontSize: 11 * size, fontWeight: 600, color: "rgba(255, 255, 255, 0.72)", whiteSpace: "nowrap" }}>
            Powered by Livedot
          </span>
        </a>
      )}
    </div>
  );
}
