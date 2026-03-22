import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { eq, count } from "drizzle-orm";
import { db } from "@livedot/db";
import { users, authSessions } from "@livedot/db/schema";
import { validateSession } from "../middleware/auth";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

async function getUserCount() {
  const result = await db.select({ count: count() }).from(users);
  return result[0]?.count ?? 0;
}

async function createSession(userId: string): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await db.insert(authSessions).values({ id, userId, expiresAt });
  return id;
}

function setSessionCookie(c: any, sessionId: string) {
  setCookie(c, "session", sessionId, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export const authRoutes = new Hono()
  .get("/status", async (c) => {
    const userCount = await getUserCount();
    const sessionId = getCookie(c, "session");
    const user = await validateSession(sessionId);

    return c.json({
      needsSetup: userCount === 0,
      authenticated: !!user,
      user: user ? { id: user.id, username: user.username } : null,
    });
  })

  .post("/setup", async (c) => {
    const userCount = await getUserCount();
    if (userCount > 0) {
      return c.json({ error: "Setup already completed" }, 400);
    }

    const { username, password } = await c.req.json();
    if (!username || !password || password.length < 6) {
      return c.json({ error: "Username and password (min 6 chars) required" }, 400);
    }

    const hash = await Bun.password.hash(password);
    const [user] = await db
      .insert(users)
      .values({ username, passwordHash: hash })
      .returning();

    const sessionId = await createSession(user.id);
    setSessionCookie(c, sessionId);

    return c.json({ ok: true, user: { id: user.id, username: user.username } });
  })

  .post("/login", async (c) => {
    const { username, password } = await c.req.json();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const valid = await Bun.password.verify(password, user.passwordHash);
    if (!valid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const sessionId = await createSession(user.id);
    setSessionCookie(c, sessionId);

    return c.json({ ok: true, user: { id: user.id, username: user.username } });
  })

  .post("/logout", async (c) => {
    const sessionId = getCookie(c, "session");
    if (sessionId) {
      await db.delete(authSessions).where(eq(authSessions.id, sessionId));
      deleteCookie(c, "session", { path: "/" });
    }
    return c.json({ ok: true });
  });
