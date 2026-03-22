import { useState } from "react";
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

type Tab = "profile" | "password";

export default function ProfileModal({ isOpen, onOpenChange }: Props) {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("profile");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[420px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Profile</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex gap-1 p-1 rounded-xl bg-default mb-4">
                {(["profile", "password"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                      tab === t ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {t === "profile" ? "Profile" : "Change Password"}
                  </button>
                ))}
              </div>

              {tab === "profile" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted">Username</p>
                    <p className="text-sm font-medium text-foreground">{user?.username}</p>
                  </div>
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
                    <Input placeholder="Min 6 characters"  className="ring-inset" />
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

              {tab === "profile" && (error || success) && (
                <>
                  {error && <p className="text-danger text-sm mt-2">{error}</p>}
                  {success && <p className="text-success text-sm mt-2">{success}</p>}
                </>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
