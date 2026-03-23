import { z } from "zod";

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

  // Global limits
  DEFAULT_MAX_USER_SIGNUP: z.coerce.number().int().positive().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

