import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  Button,
  Card,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  FieldError,
  Surface,
} from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Delete02Icon,
  ArrowRight01Icon,
  Logout01Icon,
  Add01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import { api, type Website } from "@/lib/api";
import WebsiteLiveCount from "@/components/WebsiteLiveCount";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Website | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getWebsites();
      setWebsites(data);
    } finally {
      setLoading(false);
    }
  }

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
      load();
    });
  }, [navigate]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const url = formData.get("url")?.toString().trim() || "";
    if (!name) {
      setCreating(false);
      return;
    }
    try {
      await api.createWebsite(name, url);
      await load();
      setModalOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await api.deleteWebsite(deleteTarget.id);
    setDeleteTarget(null);
    load();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-5 rounded-md" />
            <span className="text-sm font-semibold text-foreground">Livedot</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onPress={async () => {
              await api.logout();
              navigate({ to: "/login" });
            }}
            className="text-muted"
          >
            <HugeiconsIcon icon={Logout01Icon} size={14} />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-10 pb-12">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                Websites
              </h1>
              <p className="text-muted text-sm">
                Add a website and start tracking live visitors.
              </p>
            </div>
            {websites.length > 0 && <Button onPress={() => setModalOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New Website
            </Button>}
          </div>

          {/* Create website modal */}
          <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-[400px]">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Icon className="bg-default text-foreground">
                      <HugeiconsIcon icon={Add01Icon} size={20} />
                    </Modal.Icon>
                    <Modal.Heading>New Website</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <Form
                      id="create-website-form"
                      className="flex flex-col gap-4"
                      onSubmit={handleCreate}
                    >
                      <TextField variant="secondary" isRequired name="name" className="w-full">
                        <Label>Website name</Label>
                        <Input placeholder="My Website" autoFocus className="ring-inset" />
                        <FieldError />
                      </TextField>
                      <TextField variant="secondary" name="url" className="w-full">
                        <Label>URL</Label>
                        <Input placeholder="https://example.com" className="ring-inset" />
                        <FieldError />
                      </TextField>
                    </Form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="outline"
                      slot="close"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      form="create-website-form"
                      isDisabled={creating}
                      className="flex-1"
                    >
                      <HugeiconsIcon icon={PlusSignIcon} size={16} />
                      {creating ? "Creating..." : "Create"}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>

          {/* Website list */}
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
                <Card
                  key={website.id}
                  className="group cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: "/websites/$websiteId",
                      params: { websiteId: website.id },
                    })
                  }
                >
                  <Card.Header>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <Card.Title>
                          {website.name}
                        </Card.Title>
                        <Card.Description className="text-xs mt-1 flex items-center gap-2">
                          <span className="font-mono text-muted/60">{website.id.slice(0, 8)}</span>
                          {website.url && (
                            <>
                              <span className="text-muted/30">·</span>
                              <span>{website.url}</span>
                            </>
                          )}
                        </Card.Description>
                      </div>
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <WebsiteLiveCount websiteId={website.id} />
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(website);
                          }}
                        >
                          <Button
                            variant="ghost"
                            className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={16} />
                          </Button>
                        </div>
                        <span className="text-muted transition-transform duration-200 group-hover:translate-x-1">
                          <HugeiconsIcon
                            icon={ArrowRight01Icon}
                            size={18}
                          />
                        </span>
                      </div>
                    </div>
                  </Card.Header>
                </Card>
              ))}
            </div>
          )}

          {/* Delete confirmation */}
          <AlertDialog isOpen={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.Header>
                    <AlertDialog.Icon variant="danger">
                      <HugeiconsIcon icon={Alert02Icon} size={20} />
                    </AlertDialog.Icon>
                    <AlertDialog.Heading>Delete Website</AlertDialog.Heading>
                    <AlertDialog.Description>
                      Are you sure you want to delete{" "}
                      <strong>{deleteTarget?.name}</strong>? This action cannot
                      be undone.
                    </AlertDialog.Description>
                  </AlertDialog.Header>
                  <AlertDialog.Footer>
                    <Button
                      variant="outline"
                      onPress={() => setDeleteTarget(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onPress={handleDelete}
                      className="flex-1"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                      Delete
                    </Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
      </div>
    </div>
  );
}
