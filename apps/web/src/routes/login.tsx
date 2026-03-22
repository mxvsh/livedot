import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Button,
  Form,
  Input,
  Label,
  TextField,
  FieldError,
  Surface,
} from "@heroui/react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username")?.toString() || "";
    const password = formData.get("password")?.toString() || "";
    try {
      await api.login(username, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
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
          <h1 className="text-2xl font-bold text-foreground mb-1">Livedot</h1>
          <p className="text-muted text-sm mb-6">
            Sign in to your dashboard.
          </p>
          <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField isRequired name="username" variant="secondary">
              <Label>Username</Label>
              <Input placeholder="Username" autoFocus />
              <FieldError />
            </TextField>

            <TextField isRequired name="password" type="password" variant="secondary">
              <Label>Password</Label>
              <Input placeholder="Password" />
              <FieldError />
            </TextField>

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button type="submit" isDisabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Form>
        </Surface>
      </motion.div>
    </div>
  );
}
