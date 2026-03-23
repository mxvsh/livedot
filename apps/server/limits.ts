import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { user } from "@livedot/db/schema";
import { env } from "./env";
import { getPlan, resolveUserLimits, type PlanConfig, type PlanId } from "@livedot/shared/plans";

export function defaultPlan(): PlanId {
  return env.LIVEDOT_CLOUD ? "free" : "ce";
}

export async function getUserLimits(userId: string): Promise<PlanConfig> {
  const found = await db
    .select({ plan: user.plan, metadata: user.metadata })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const row = found[0];
  const plan = getPlan(row?.plan ?? defaultPlan());
  const meta = row?.metadata as Partial<PlanConfig> | undefined;
  return resolveUserLimits(plan, meta);
}

export async function setUserMetadata(userId: string, data: Record<string, unknown>) {
  const found = await db.select({ metadata: user.metadata }).from(user).where(eq(user.id, userId)).limit(1);
  const existing = (found[0]?.metadata as Record<string, unknown>) ?? {};
  await db.update(user).set({ metadata: { ...existing, ...data } }).where(eq(user.id, userId));
}
