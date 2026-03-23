import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "@livedot/db";
import * as schema from "@livedot/db/schema";
import { env } from "./env";
import { defaultPlan } from "./limits";

const socialProviders: Record<string, any> = {};

if (env.LIVEDOT_CLOUD) {
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    socialProviders.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
}


export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: { enabled: !env.LIVEDOT_CLOUD },
  plugins: [username()],
  socialProviders,
  trustedOrigins: ["http://localhost:5173"],
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const result = await db.select({ count: count() }).from(schema.user);
          const userCount = result[0]?.count ?? 0;
          if (userCount >= env.DEFAULT_MAX_USER_SIGNUP) {
            throw new Error("Registration is closed");
          }
        },
        after: async (user) => {
          await db.update(schema.user).set({ plan: defaultPlan() }).where(eq(schema.user.id, user.id));
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: env.NODE_ENV === "production",
      maxAge: 60 * 5,
    },
  },
});

export type Auth = typeof auth;

export const enabledProviders = Object.keys(socialProviders);
