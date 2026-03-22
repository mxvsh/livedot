import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button, Surface } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { api, type Website } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import Navbar from "@/components/layout/Navbar";
import WebsiteCard from "@/components/websites/WebsiteCard";
import CreateWebsiteModal from "@/components/websites/CreateWebsiteModal";
import EditWebsiteModal from "@/components/websites/EditWebsiteModal";
import SnippetModal from "@/components/websites/SnippetModal";
import DeleteWebsiteDialog from "@/components/websites/DeleteWebsiteDialog";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { user, needsSetup, checked, check } = useAuthStore();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Website | null>(null);
  const [editTarget, setEditTarget] = useState<Website | null>(null);
  const [snippetTarget, setSnippetTarget] = useState<Website | null>(null);

  async function load(showSpinner = false) {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.getWebsites();
      setWebsites(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      if (!checked) await check();
      const state = useAuthStore.getState();
      if (state.needsSetup) {
        navigate({ to: "/auth/register" });
      } else if (!state.user) {
        navigate({ to: "/auth/login" });
      } else {
        load(true);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-10 pb-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-xl font-bold text-foreground mb-1">Websites</h1>
            <p className="text-muted text-sm">
              Add a website and start tracking live visitors.
            </p>
          </div>
          {websites.length > 0 && (
            <Button onPress={() => setModalOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New Website
            </Button>
          )}
        </div>

        {websites.length === 0 ? (
          <Surface className="text-center py-16 rounded-3xl">
            <p className="text-muted text-sm mb-4">
              No websites yet. Add one to get started.
            </p>
            <Button onPress={() => setModalOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New Website
            </Button>
          </Surface>
        ) : (
          <div className="space-y-4">
            {websites.map((website) => (
              <WebsiteCard
                key={website.id}
                website={website}
                onSnippet={setSnippetTarget}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        <CreateWebsiteModal
          isOpen={modalOpen}
          onOpenChange={setModalOpen}
          onCreated={load}
        />
        <EditWebsiteModal
          website={editTarget}
          onClose={() => setEditTarget(null)}
          onEdited={load}
        />
        <SnippetModal
          website={snippetTarget}
          onClose={() => setSnippetTarget(null)}
        />
        <DeleteWebsiteDialog
          website={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={load}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8 flex items-center justify-center">
        <span className="text-xs text-muted/50">
          livedot{import.meta.env.VITE_VERSION ? ` (${import.meta.env.VITE_VERSION})` : ""}
        </span>
      </div>
    </div>
  );
}
