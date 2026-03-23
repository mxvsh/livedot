import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import Map from "@/components/dashboard/Map";
import BrandingBadge from "@/components/embed/BrandingBadge";

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
  const [showBranding, setShowBranding] = useState(false);
  const explicitBranding = branding === "1" || branding === "true";

  useEffect(() => {
    if (!website || !token) {
      setShowBranding(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/embed/meta?website=${encodeURIComponent(website)}&token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { branding?: boolean } | null) => {
        if (!cancelled) setShowBranding(Boolean(data?.branding) || explicitBranding);
      })
      .catch(() => {
        if (!cancelled) setShowBranding(explicitBranding);
      });

    return () => {
      cancelled = true;
    };
  }, [website, token, explicitBranding]);

  if (!website || !token) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: bg, overflow: "hidden", position: "relative" }}>
      <Map sessions={Array.from(sessions.values())} />
      {showBranding && <BrandingBadge />}
    </div>
  );
}
