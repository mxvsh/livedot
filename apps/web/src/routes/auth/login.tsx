import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button, Form, Input, Label, TextField, FieldError, Surface } from "@heroui/react";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

const PROVIDER_LABELS: Record<string, string> = {
  github: "GitHub",
  google: "Google",
};

type Step = "login" | "forgot" | "forgot-sent" | "reset";

function LoginPage() {
  const navigate = useNavigate();
  const { setUser, providers, cloud, check, checked } = useAuthStore();
  const [step, setStep] = useState<Step>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (!checked) check();
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    try {
      const { user } = await api.login(email, password);
      setUser(user);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const value = formData.get("value")?.toString() || "";
    try {
      if (cloud) {
        await api.forgotPasswordEmail(value);
        setForgotEmail(value);
        setStep("forgot-sent");
      } else {
        await api.forgotPassword(value);
        setForgotEmail(value);
        setStep("reset");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const otp = formData.get("otp")?.toString() || "";
    const newPassword = formData.get("newPassword")?.toString() || "";
    try {
      await api.resetPassword(forgotEmail, otp, newPassword);
      setStep("login");
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: string) {
    await authClient.signIn.social({
      provider: provider as any,
      callbackURL: window.location.origin + "/",
    });
  }

  function goBack() {
    setStep("login");
    setError("");
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

          {step === "login" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Livedot</h1>
              <p className="text-muted text-sm mb-6">Sign in to your dashboard.</p>

              {providers.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {providers.map((provider) => (
                    <Button
                      key={provider}
                      variant="outline"
                      className="w-full"
                      onPress={() => handleOAuth(provider)}
                      data-umami-event="sign-in-oauth"
                      data-umami-event-provider={provider}
                    >
                      Continue with {PROVIDER_LABELS[provider] ?? provider}
                    </Button>
                  ))}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-divider" />
                    <span className="text-xs text-muted">or</span>
                    <div className="flex-1 h-px bg-divider" />
                  </div>
                </div>
              )}

              <Form className="flex flex-col gap-4" onSubmit={handleLogin}>
                <TextField isRequired name="email" type="email" variant="secondary">
                  <Label>Email</Label>
                  <Input placeholder="you@example.com" autoFocus />
                  <FieldError />
                </TextField>

                <TextField isRequired name="password" type="password" variant="secondary">
                  <Label>Password</Label>
                  <Input placeholder="Password" />
                  <FieldError />
                </TextField>

                {error && <p className="text-danger text-sm">{error}</p>}

                <Button type="submit" isDisabled={loading} className="w-full" data-umami-event="sign-in">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </Form>

              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  onClick={() => { setStep("forgot"); setError(""); }}
                  className="text-xs text-muted hover:text-foreground w-full text-center transition-colors"
                >
                  Forgot password?
                </button>
                <p className="text-xs text-muted text-center">
                  Don't have an account?{" "}
                  <Link to="/auth/signup" className="text-foreground hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}

          {step === "forgot" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Reset password</h1>
              <p className="text-muted text-sm mb-6">
                {cloud
                  ? "Enter your email and we'll send you a reset link."
                  : "Enter your username to receive an OTP in the server console."}
              </p>

              <Form className="flex flex-col gap-4" onSubmit={handleForgot}>
                <TextField isRequired name="value" type="email" variant="secondary">
                  <Label>Email</Label>
                  <Input placeholder="you@example.com" autoFocus />
                  <FieldError />
                </TextField>

                {error && <p className="text-danger text-sm">{error}</p>}

                <Button type="submit" isDisabled={loading} className="w-full">
                  {loading ? "Sending..." : cloud ? "Send Reset Link" : "Send OTP"}
                </Button>
              </Form>

              <button onClick={goBack} className="mt-4 text-xs text-muted hover:text-foreground w-full text-center transition-colors">
                Back to sign in
              </button>
            </>
          )}

          {step === "forgot-sent" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Check your email</h1>
              <p className="text-muted text-sm mb-6">
                We sent a password reset link to <span className="text-foreground">{forgotEmail}</span>. Click it to set a new password.
              </p>
              <button onClick={goBack} className="text-xs text-muted hover:text-foreground w-full text-center transition-colors">
                Back to sign in
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Enter OTP</h1>
              <p className="text-muted text-sm mb-6">Check your server console for the OTP code.</p>

              <Form className="flex flex-col gap-4" onSubmit={handleReset}>
                <TextField isRequired name="otp" variant="secondary">
                  <Label>OTP Code</Label>
                  <Input placeholder="123456" autoFocus />
                  <FieldError />
                </TextField>

                <TextField isRequired name="newPassword" type="password" minLength={6} variant="secondary">
                  <Label>New Password</Label>
                  <Input placeholder="Min 6 characters" />
                  <FieldError />
                </TextField>

                {error && <p className="text-danger text-sm">{error}</p>}

                <Button type="submit" isDisabled={loading} className="w-full">
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </Form>

              <button onClick={goBack} className="mt-4 text-xs text-muted hover:text-foreground w-full text-center transition-colors">
                Back to sign in
              </button>
            </>
          )}
        </Surface>
      </motion.div>
    </div>
  );
}
