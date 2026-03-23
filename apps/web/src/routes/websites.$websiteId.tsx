import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tooltip } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { GlobeIcon, BrowserIcon } from "@hugeicons/core-free-icons";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import Map from "@/components/dashboard/Map";
import Dock from "@/components/dashboard/Dock";
import ActivityPanel from "@/components/dashboard/ActivityPanel";
import VisitorChart from "@/components/dashboard/VisitorChart";

export const Route = createFileRoute("/websites/$websiteId")({
  component: WebsiteDashboard,
});

function WebsiteDashboard() {
  const { websiteId } = Route.useParams();
  const navigate = useNavigate();
  const [websiteName, setWebsiteName] = useState("");
  const [activeTab, setActiveTab] = useState<"map" | "pages">("map");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { user, checked, check } = useAuthStore();

  useEffect(() => {
    (async () => {
      if (!checked) await check();
      const state = useAuthStore.getState();
      if (!state.user) {
        navigate({ to: "/auth/login" });
        return;
      }
      const websites = await api.getWebsites();
      const w = websites.find((w) => w.id === websiteId);
      if (w) setWebsiteName(w.name);
    })();
  }, [websiteId]);

  const { sessions, connected, count, activityLog, history } = useWebSocket(websiteId);
  const sessionArray = Array.from(sessions.values());

  const selectedSession = selectedSessionId ? sessions.get(selectedSessionId) ?? null : null;
  const selectedEvents = selectedSessionId ? (activityLog.get(selectedSessionId) ?? []) : [];

  // Deselect if session disappears
  useEffect(() => {
    if (selectedSessionId && !sessions.has(selectedSessionId)) {
      setSelectedSessionId(null);
    }
  }, [sessions, selectedSessionId]);

  return (
    <div className="h-screen w-screen relative">
      {/* Map (full screen) */}
      <Map
        sessions={sessionArray}
        selectedSessionId={selectedSessionId}
        onSessionSelect={setSelectedSessionId}
      />

      {/* Floating top bar */}
      <div className="fixed top-3 left-1/2 z-50 -translate-x-1/2 md:top-4">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-0.5 rounded-full border border-border bg-surface/90 p-1 shadow-xl backdrop-blur-xl"
        >
          <button
            onClick={() => setActiveTab("map")}
            className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "map"
                ? "text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {activeTab === "map" && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-full bg-surface-secondary"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <HugeiconsIcon icon={GlobeIcon} size={14} className="relative z-10" />
            <span className="relative z-10">Map</span>
          </button>
          <Tooltip delay={0}>
            <Tooltip.Trigger>
              <button
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-muted/50"
                disabled
              >
                <HugeiconsIcon icon={BrowserIcon} size={14} />
                Pages
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Tooltip.Arrow />
              Coming soon
            </Tooltip.Content>
          </Tooltip>
        </motion.div>
      </div>

      {/* Visitor chart top left */}
      <VisitorChart
        websiteName={websiteName}
        count={count}
        connected={connected}
        history={history}
      />

      {/* Activity panel (bottom left) — shown when a session is selected */}
      <AnimatePresence>
        {selectedSession && (
          <ActivityPanel
            key={selectedSession.sessionId}
            session={selectedSession}
            events={selectedEvents}
            onClose={() => setSelectedSessionId(null)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-3 left-3 z-40 md:bottom-4 md:left-4">
        <span className="text-xs text-muted/60">
          livedot {import.meta.env.VITE_VERSION ?? ""}
        </span>
      </div>

      <Dock websiteName={websiteName} count={count} connected={connected} />
    </div>
  );
}
