import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { api, type Project } from "@/lib/api";

export const Route = createFileRoute("/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hostname = window.location.origin;

  async function load() {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.getStatus().then((status) => {
      if (!status.authenticated) {
        navigate({ to: "/login" });
        return;
      }
      load();
    });
  }, [navigate]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await api.createProject(name.trim());
    setName("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    await api.deleteProject(id);
    load();
  }

  function getSnippet(projectId: string) {
    return `<script defer src="${hostname}/t.js" data-project="${projectId}"></script>`;
  }

  function copySnippet(projectId: string) {
    navigator.clipboard.writeText(getSnippet(projectId));
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard
          </button>
        </div>
        <form onSubmit={handleCreate} className="flex gap-3 mb-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/40"
            required
          />
          <button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg px-5 py-2.5 transition-colors"
          >
            Create
          </button>
        </form>
        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-zinc-500">No projects yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-medium">{project.name}</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      ID: {project.id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <div className="bg-zinc-950 rounded-lg p-3 font-mono text-xs text-zinc-400 break-all">
                  {getSnippet(project.id)}
                </div>
                <button
                  onClick={() => copySnippet(project.id)}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {copiedId === project.id ? "Copied!" : "Copy snippet"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
