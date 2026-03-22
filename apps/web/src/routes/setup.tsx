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
  Description,
  Surface,
} from "@heroui/react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

function SetupPage() {
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
      await api.setup(username, password);
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
          <img src="/logo.png" alt="Livedot logo" className="mb-4 w-10 h-10 rounded-xl" />
          
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Welcome to Livedot
          </h1>
          <p className="text-muted text-sm mb-6">
            Create your admin account to get started.
          </p>
          <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField isRequired name="username" variant="secondary">
              <Label>Username</Label>
              <Input placeholder="admin" autoFocus />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              name="password"
              type="password"
              minLength={6}
              variant="secondary"
            >
              <Label>Password</Label>
              <Input placeholder="Min 6 characters" />
              <Description>At least 6 characters</Description>
              <FieldError />
            </TextField>

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button type="submit" isDisabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </Form>
        </Surface>
      </motion.div>
    </div>
  );
}
