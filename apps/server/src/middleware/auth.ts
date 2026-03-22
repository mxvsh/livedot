import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { users, authSessions } from "@livedot/db/schema";

export async function validateSession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const [session] = await db
    .select()
    .from(authSessions)
    .where(eq(authSessions.id, sessionId))
    .limit(1);

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(authSessions).where(eq(authSessions.id, sessionId));
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
}

export const requireAuth = createMiddleware(async (c, next) => {
  const sessionId = getCookie(c, "session");
  const user = await validateSession(sessionId);

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", user);
  await next();
});
