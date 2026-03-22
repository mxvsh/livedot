import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { api, type Project } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import Map from "@/components/Map";
import LiveCount from "@/components/LiveCount";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStatus().then((status) => {
      if (status.needsSetup) {
        navigate({ to: "/setup" });
        return;
      }
      if (!status.authenticated) {
        navigate({ to: "/login" });
        return;
      }
      api.getProjects().then((data) => {
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
        setLoading(false);
      });
    });
  }, [navigate]);

  const { sessions, connected, count } = useWebSocket(selectedProjectId);
  const sessionArray = Array.from(sessions.values());

  async function handleLogout() {
    await api.logout();
    navigate({ to: "/login" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      <div className="relative z-10 flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold text-lg">Latty</span>
          {projects.length > 0 && (
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <LiveCount count={count} connected={connected} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/projects" })}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Projects
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-zinc-400 mb-3">
                No projects yet. Create one to start tracking.
              </p>
              <button
                onClick={() => navigate({ to: "/projects" })}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg px-5 py-2.5 transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        ) : (
          <Map sessions={sessionArray} />
        )}
      </div>
    </div>
  );
}
