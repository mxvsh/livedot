import { z } from "zod";
import { createLogger } from "@livedot/logger";

const log = createLogger("env");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5550),
  DATABASE_PATH: z.string().optional(),

  // Cloud mode — enables OAuth providers
  LIVEDOT_CLOUD: z.enum(["true", "false"]).transform(v => v === "true").default("false"),

  // OAuth — only required when LIVEDOT_CLOUD=true
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Analytics (optional)
  UMAMI_URL: z.string().optional(),
  UMAMI_WEBSITE_ID: z.string().optional(),
  LIVEDOT_URL: z.string().optional(),
  LIVEDOT_WEBSITE_ID: z.string().optional(),

  // Store adapter — if set, uses Redis instead of in-memory
  REDIS_URL: z.string().optional(),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),

  // Email — SMTP (for cloud email verification)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default("noreply@livedot.dev"),
  APP_URL: z.string().optional().default("http://localhost:5173"),

  // Polar.sh billing (cloud only)
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_ORGANIZATION_ID: z.string().optional(),
  POLAR_WEBHOOK_SECRET: z.string().optional(),

  // Global limits
  DEFAULT_MAX_USER_SIGNUP: z.coerce.number().int().positive().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  log.error(parsed.error.flatten().fieldErrors, "Invalid environment variables");
  process.exit(1);
}

export const env = parsed.data;

