import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Button, Form, Input, Label, TextField, FieldError, Surface } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch() as { token?: string };
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) { setError("Invalid or missing reset token."); return; }
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword")?.toString() || "";
    const confirm = formData.get("confirm")?.toString() || "";
    if (newPassword !== confirm) { setError("Passwords do not match."); setLoading(false); return; }
    try {
      await authClient.resetPassword({ newPassword, token });
      setDone(true);
      setTimeout(() => navigate({ to: "/auth/login" }), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Surface className="rounded-3xl p-8" variant="default">
          <img src="/logo.svg" alt="Livedot logo" className="mb-4 w-10 h-10 rounded-xl" />

          {done ? (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Password reset!</h1>
              <p className="text-muted text-sm">Your password has been updated. Redirecting to sign in...</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">New password</h1>
              <p className="text-muted text-sm mb-6">Choose a new password for your account.</p>

              <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <TextField isRequired name="newPassword" type="password" minLength={6} variant="secondary">
                  <Label>New Password</Label>
                  <Input placeholder="Min 6 characters" autoFocus />
                  <FieldError />
                </TextField>

                <TextField isRequired name="confirm" type="password" minLength={6} variant="secondary">
                  <Label>Confirm Password</Label>
                  <Input placeholder="Repeat password" />
                  <FieldError />
                </TextField>

                {error && <p className="text-danger text-sm">{error}</p>}

                <Button type="submit" isDisabled={loading || !token} className="w-full">
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </Form>
            </>
          )}
        </Surface>
      </motion.div>
    </div>
  );
}
