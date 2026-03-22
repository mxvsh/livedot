import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { user } from "@livedot/db/schema";
import { env } from "./env";

export interface UserLimits {
  maxWebsites: number; // 0 = unlimited
}

function cloudDefaults(): UserLimits {
  return { maxWebsites: env.DEFAULT_MAX_WEBSITES };
}

function selfHostedDefaults(): UserLimits {
  return { maxWebsites: env.DEFAULT_MAX_WEBSITES };
}

export function defaultLimits(): UserLimits {
  return env.LIVEDOT_CLOUD ? cloudDefaults() : selfHostedDefaults();
}

export async function getUserLimits(userId: string): Promise<UserLimits> {
  const found = await db.select({ metadata: user.metadata }).from(user).where(eq(user.id, userId)).limit(1);
  const meta = found[0]?.metadata as any;
  const defaults = defaultLimits();
  return {
    maxWebsites: meta?.maxWebsites ?? defaults.maxWebsites,
  };
}

export async function setUserMetadata(userId: string, data: Record<string, unknown>) {
  const found = await db.select({ metadata: user.metadata }).from(user).where(eq(user.id, userId)).limit(1);
  const existing = (found[0]?.metadata as Record<string, unknown>) ?? {};
  await db.update(user).set({ metadata: { ...existing, ...data } }).where(eq(user.id, userId));
}
