import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";
import Map from "@/components/dashboard/Map";
import BrandingBadge from "@/components/embed/BrandingBadge";
import { useEmbedBranding } from "@/components/embed/useEmbedBranding";

export const Route = createFileRoute("/embed/map")({
  component: EmbedMap,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
    branding: (search.branding as string) ?? "",
  }),
});

function EmbedMap() {
  const { website, token, bg, branding } = Route.useSearch();
  const { sessions } = useWebSocket(website || null, token || undefined);
  const explicitBranding = branding === "1" || branding === "true";
  const showBranding = useEmbedBranding(website, token, explicitBranding);

  if (!website || !token) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: bg, overflow: "hidden", position: "relative" }}>
      <Map sessions={Array.from(sessions.values())} showAvatars={false} />
      {showBranding && <BrandingBadge />}
    </div>
  );
}
