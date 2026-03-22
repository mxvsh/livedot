import { Hono } from "hono";
import { count, eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { user, account } from "@livedot/db/schema";
import { auth } from "../auth";
import { env } from "../env";
import { getSessionFromRequest } from "../middleware/auth";
import { getUserLimits, setUserMetadata } from "../limits";

const otpStore = new Map<string, { otp: string; expires: number }>();

async function getUserCount() {
  const result = await db.select({ count: count() }).from(user);
  return result[0]?.count ?? 0;
}

export const authRoutes = new Hono()
  .get("/meta", async (c) => {
    const providers: string[] = [];
    if (env.LIVEDOT_CLOUD) {
      if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) providers.push("github");
      if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.push("google");
    }
    const userCount = await getUserCount();
    const registrationOpen = userCount < env.DEFAULT_MAX_USER_SIGNUP;
    return c.json({ cloud: env.LIVEDOT_CLOUD, providers, registrationOpen });
  })

  .get("/status", async (c) => {
    const userCount = await getUserCount();
    const session = await getSessionFromRequest(c.req.raw);

    return c.json({
      needsSetup: userCount === 0,
      authenticated: !!session,
      user: session ? { id: session.user.id, username: session.user.username ?? session.user.name } : null,
    });
  })

  .post("/setup", async (c) => {
    const userCount = await getUserCount();
    if (userCount >= env.DEFAULT_MAX_USER_SIGNUP) {
      return c.json({ error: "Max user limit reached" }, 400);
    }

    const { username, password } = await c.req.json();
    if (!username || !password || password.length < 6) {
      return c.json({ error: "Username and password (min 6 chars) required" }, 400);
    }

    try {
      const res = await auth.api.signUpEmail({
        asResponse: true,
        body: { email: `${username}@livedot.local`, password, name: username, username },
        headers: c.req.raw.headers,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return c.json({ error: (body as any).message ?? "Setup failed" }, 400);
      }

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) c.header("set-cookie", setCookie);

      const data = await res.json();
      const userId = data.user?.id;
      if (userId) await setUserMetadata(userId, { maxWebsites: env.DEFAULT_MAX_WEBSITES });
      return c.json({ ok: true, user: { id: userId, username } });
    } catch (err: any) {
      const message = err?.body?.message ?? err?.message ?? "Setup failed";
      return c.json({ error: message }, 400);
    }
  })

  .post("/login", async (c) => {
    const { username, password } = await c.req.json();

    try {
      const res = await auth.api.signInEmail({
        asResponse: true,
        body: { email: `${username}@livedot.local`, password },
        headers: c.req.raw.headers,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return c.json({ error: (body as any).message ?? "Invalid credentials" }, 401);
      }

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) c.header("set-cookie", setCookie);

      const data = await res.json();
      return c.json({ ok: true, user: { id: data.user?.id, username } });
    } catch (err: any) {
      const message = err?.body?.message ?? err?.message ?? "Invalid credentials";
      return c.json({ error: message }, 401);
    }
  })

  .post("/change-password", async (c) => {
    const { currentPassword, newPassword } = await c.req.json();
    if (!newPassword || newPassword.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);

    const res = await auth.api.changePassword({
      asResponse: true,
      body: { currentPassword, newPassword, revokeOtherSessions: false },
      headers: c.req.raw.headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return c.json({ error: (body as any).message ?? "Failed to change password" }, res.status as any);
    }

    return c.json({ ok: true });
  })

  .post("/forgot-password", async (c) => {
    const { username } = await c.req.json();
    const found = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
    if (!found.length) return c.json({ error: "User not found" }, 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(username, { otp, expires: Date.now() + 10 * 60 * 1000 });
    console.log(`\n[Livedot] Password reset OTP for "${username}": ${otp}\n`);
    return c.json({ ok: true });
  })

  .post("/reset-password", async (c) => {
    const { username, otp, newPassword } = await c.req.json();
    if (!newPassword || newPassword.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);

    const stored = otpStore.get(username);
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return c.json({ error: "Invalid or expired OTP" }, 400);
    }

    const found = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
    if (!found.length) return c.json({ error: "User not found" }, 404);

    const hash = await Bun.password.hash(newPassword, "argon2id");
    await db.update(account)
      .set({ password: hash })
      .where(eq(account.userId, found[0].id));

    otpStore.delete(username);
    return c.json({ ok: true });
  })

  .post("/logout", async (c) => {
    await auth.api.signOut({ headers: c.req.raw.headers });
    return c.json({ ok: true });
  });
