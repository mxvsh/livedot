import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button, Form, Input, Label, TextField, FieldError, Surface } from "@heroui/react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { registrationOpen, checked, check, setUser } = useAuthStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [doneEmail, setDoneEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!checked) check();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    const name = formData.get("name")?.toString() || "";
    try {
      const result = await api.register(email, password, name || undefined);
      if (result.emailVerificationRequired) {
        setDoneEmail(email);
        setDone(true);
      } else {
        if (result.user) setUser(result.user);
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
              <h1 className="text-2xl font-bold text-foreground mb-1">Check your email</h1>
              <p className="text-muted text-sm mb-6">
                We sent a verification link to <span className="text-foreground">{doneEmail}</span>. Click it to activate your account.
              </p>
              <Button
                variant="outline"
                className="w-full mb-2"
                isDisabled={resendLoading || resendSent}
                onPress={async () => {
                  setResendLoading(true);
                  setError("");
                  try {
                    await api.resendVerification(doneEmail);
                    setResendSent(true);
                    setTimeout(() => setResendSent(false), 30000);
                  } catch (err: any) {
                    setError(err.message ?? "Failed to resend. Try again.");
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendSent ? "Email sent!" : resendLoading ? "Sending..." : "Resend email"}
              </Button>
              {error && <p className="text-danger text-sm mb-2">{error}</p>}
              <Link to="/auth/login" className="text-xs text-muted hover:text-foreground transition-colors">
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
              <p className="text-muted text-sm mb-6">Sign up for Livedot.</p>

              {!registrationOpen && (
                <p className="text-danger text-xs text-center mb-4">Registration is closed.</p>
              )}

              <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <TextField name="name" variant="secondary">
                  <Label>Name</Label>
                  <Input placeholder="Your name" autoFocus />
                  <FieldError />
                </TextField>

                <TextField isRequired name="email" type="email" variant="secondary">
                  <Label>Email</Label>
                  <Input placeholder="you@example.com" />
                  <FieldError />
                </TextField>

                <TextField isRequired name="password" type="password" minLength={6} variant="secondary">
                  <Label>Password</Label>
                  <Input placeholder="Min 6 characters" />
                  <FieldError />
                </TextField>

                {error && <p className="text-danger text-sm">{error}</p>}

                <Button type="submit" isDisabled={loading} className="w-full">
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </Form>

              <p className="mt-4 text-xs text-muted text-center">
                Already have an account?{" "}
                <Link to="/auth/login" className="text-foreground hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Surface>
      </motion.div>
    </div>
  );
}
