import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  FieldError,
  Description,
} from "@heroui/react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = "profile" | "usage" | "password";

const PROVIDER_LABELS: Record<string, string> = { github: "GitHub", google: "Google", credential: "Email & Password" };

function fmt(n: number) {
  return n.toLocaleString();
}

export default function ProfileModal({ isOpen, onOpenChange }: Props) {
  const { user } = useAuthStore();
  const hasPassword = user?.providers?.includes("credential") ?? true;
  const [tab, setTab] = useState<Tab>("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<{ eventsUsed: number; eventsLimit: number } | null>(null);

  useEffect(() => {
    if (isOpen && tab === "usage") {
      api.getUsage().then(setUsage).catch(() => {});
    }
  }, [isOpen, tab]);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError("");
      setSuccess("");
      setTab("profile");
    }
    onOpenChange(open);
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword")?.toString() || "";
    const newPassword = formData.get("newPassword")?.toString() || "";
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess("Password updated.");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: "profile", label: "Profile" },
    { key: "usage", label: "Usage" },
    { key: "password", label: "Password", disabled: !hasPassword },
  ];

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[420px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>My Account</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex gap-1 p-1 rounded-xl bg-default mb-4">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { if (t.disabled) return; setTab(t.key); setError(""); setSuccess(""); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      tab === t.key ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    } ${t.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "profile" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted">Username</p>
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                  </div>
                  {user?.email && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-muted">Email</p>
                      <p className="text-sm font-medium text-foreground">{user.email}</p>
                    </div>
                  )}
                  {user?.providers && user.providers.filter(p => p !== "credential").length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-muted">Connected accounts</p>
                      <div className="flex flex-wrap gap-2">
                        {user.providers.filter(p => p !== "credential").map(p => (
                          <span key={p} className="text-xs px-2 py-1 rounded-md bg-default text-foreground capitalize">
                            {PROVIDER_LABELS[p] ?? p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "usage" && (
                <div className="flex flex-col gap-4">
                  {!usage ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted">Events this month</span>
                          <span className="text-foreground font-medium">
                            {fmt(usage.eventsUsed)}
                            {usage.eventsLimit > 0 && <span className="text-muted"> / {fmt(usage.eventsLimit)}</span>}
                          </span>
                        </div>
                        {usage.eventsLimit > 0 && (
                          <>
                            <div className="h-2 rounded-full bg-default overflow-hidden">
                              <div
                                className="h-full rounded-full bg-accent transition-all"
                                style={{ width: `${Math.min(100, (usage.eventsUsed / usage.eventsLimit) * 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted mt-1">
                              {fmt(Math.max(0, usage.eventsLimit - usage.eventsUsed))} remaining
                            </p>
                          </>
                        )}
                        {usage.eventsLimit === 0 && (
                          <p className="text-xs text-muted">Unlimited (Community Edition)</p>
                        )}
                      </div>
                      <p className="text-xs text-muted">Resets on the 1st of each month.</p>
                    </>
                  )}
                </div>
              )}

              {tab === "password" && (
                <Form className="flex flex-col gap-4" onSubmit={handleChangePassword}>
                  <TextField isRequired name="currentPassword" type="password" variant="secondary">
                    <Label>Current Password</Label>
                    <Input placeholder="Enter current password" className="ring-inset" />
                    <FieldError />
                  </TextField>

                  <TextField isRequired name="newPassword" type="password" minLength={6} variant="secondary">
                    <Label>New Password</Label>
                    <Input placeholder="Min 6 characters" className="ring-inset" />
                    <Description>At least 6 characters</Description>
                    <FieldError />
                  </TextField>

                  {error && <p className="text-danger text-sm">{error}</p>}
                  {success && <p className="text-success text-sm">{success}</p>}

                  <Button type="submit" isDisabled={loading} className="w-full">
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </Form>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
