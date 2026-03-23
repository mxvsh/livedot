import { createFileRoute } from "@tanstack/react-router";
import { useWebSocket } from "@/hooks/useWebSocket";
import Map from "@/components/dashboard/Map";

export const Route = createFileRoute("/embed/map")({
  component: EmbedMap,
  validateSearch: (search: Record<string, unknown>) => ({
    website: (search.website as string) ?? "",
    token: (search.token as string) ?? "",
    bg: (search.bg as string) ?? "transparent",
  }),
});

function EmbedMap() {
  const { website, token, bg } = Route.useSearch();
  const { sessions } = useWebSocket(website || null, token || undefined);

  if (!website || !token) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: bg, overflow: "hidden" }}>
      <Map sessions={Array.from(sessions.values())} />
    </div>
  );
}
