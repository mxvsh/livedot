import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";
import Map from "@/components/dashboard/Map";
import BrandingBadge from "@/components/embed/BrandingBadge";
import { useEmbedBranding } from "@/components/embed/useEmbedBranding";
import { useEmbedTheme, type EmbedTheme } from "@/components/embed/useEmbedTheme";

export const Route = createFileRoute("/embed/map")({
  component: EmbedMap,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
    branding: String(search.branding ?? ""),
    theme: (String(search.theme ?? "system") as EmbedTheme),
  }),
});

function EmbedMap() {
  const { website, token, bg, branding, theme } = Route.useSearch();
  const { sessions } = useWebSocket(website || null, token || undefined);
  const explicitBranding = branding === "1" || branding === "true";
  const showBranding = useEmbedBranding(website, token, explicitBranding);
  const t = useEmbedTheme(theme === "dark" || theme === "light" ? theme : "system");

  if (!website || !token) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: bg, overflow: "hidden", position: "relative" }}>
      <Map sessions={Array.from(sessions.values())} showAvatars={false} />
      {showBranding && <BrandingBadge theme={t} />}
    </div>
  );
}
