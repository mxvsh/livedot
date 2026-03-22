import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
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
  const knownIds = useRef<Set<string> | null>(null);

  async function load(isInitial = false) {
    setLoading(true);
    try {
      const data = await api.getWebsites();
      if (isInitial) {
        // On first load, mark all as known so they all animate
        knownIds.current = null;
      }
      setWebsites(data);
      // After setting, store current IDs as known
      // On initial load knownIds is null — set it so all animate
      // On subsequent loads, don't reset — new IDs will be missing and animate
      if (knownIds.current === null) {
        knownIds.current = new Set();
      }
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
      load(true);
    });
  }, [navigate]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setCreating(false);
      return;
    }
    try {
      await api.createWebsite(name);
      // Don't reset knownIds so only the new one animates
      await load(false);
      setModalOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this website?")) return;
    await api.deleteWebsite(id);
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
              {websites.map((website, i) => {
                const isNew = !knownIds.current?.has(website.id);
                if (isNew) knownIds.current?.add(website.id);
                return (
                <motion.div
                  key={website.id}
                  initial={isNew ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: isNew ? i * 0.06 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Card
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
                          <Card.Description className="font-mono text-xs mt-1">
                            {website.id}
                          </Card.Description>
                        </div>
                        <div className="flex items-center gap-3 ml-3 shrink-0">
                          <WebsiteLiveCount websiteId={website.id} />
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(website.id);
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
                </motion.div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
