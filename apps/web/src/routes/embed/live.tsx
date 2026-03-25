import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEmbedBranding } from "@/components/embed/useEmbedBranding";
import { useEmbedTheme, type EmbedTheme } from "@/components/embed/useEmbedTheme";
import BrandingBadge from "@/components/embed/BrandingBadge";

export const Route = createFileRoute("/embed/live")({
  component: EmbedLive,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
    accent: (search.accent as string) ?? "#96E421",
    branding: String(search.branding ?? ""),
    scale: Number(search.scale ?? 0.85),
    theme: (String(search.theme ?? "system") as EmbedTheme),
  }),
});

function EmbedLive() {
  const { website, token, bg, accent, branding, scale, theme } = Route.useSearch();
  const { count, connected } = useWebSocket(website || null, token || undefined);
  const explicitBranding = branding === "1" || branding === "true";
  const showBranding = useEmbedBranding(website, token, explicitBranding);
  const size = Number.isFinite(scale) ? Math.min(Math.max(scale, 0.55), 1.4) : 0.85;
  const t = useEmbedTheme(theme === "dark" || theme === "light" ? theme : "system");

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
        backgroundColor: bg === "transparent" ? t.bg : bg,
        border: `1px solid ${t.border}`,
        backdropFilter: "blur(18px)",
        boxShadow: "none",
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
      <span style={{ fontSize: 34 * size, lineHeight: 1, fontWeight: 750, color: t.text, letterSpacing: "-0.04em" }}>
        {count}
      </span>
      {showBranding && <BrandingBadge theme={t} variant="inline" size={size} />}
    </div>
  );
}
