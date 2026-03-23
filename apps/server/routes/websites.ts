import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { user, websites } from "@livedot/db/schema";
import { requireAuth } from "../middleware/auth";
import { websiteCache } from "../website-cache";
import { getUserLimits } from "../limits";
import { trackEvent } from "../tracking";

function cacheEntryFromLimits(url: string, userId: string, limits: { eventsPerMonth: number; eventRetentionMs: number; historyMax: number }, shareToken: string | null = null) {
  try {
    const hostname = url ? new URL(url).hostname : "";
    return { hostname, userId, eventsPerMonth: limits.eventsPerMonth, eventRetentionMs: limits.eventRetentionMs, historyMax: limits.historyMax, shareToken };
  } catch {
    return { hostname: "", userId, eventsPerMonth: limits.eventsPerMonth, eventRetentionMs: limits.eventRetentionMs, historyMax: limits.historyMax, shareToken };
  }
}

export const websiteRoutes = new Hono()
  .get("/embed/meta", async (c) => {
    const websiteId = c.req.query("website");
    const token = c.req.query("token");

    if (!websiteId || !token) {
      return c.json({ error: "Missing website or token" }, 400);
    }

    const [website] = await db
      .select({ userId: websites.userId })
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1);

    const cached = websiteCache.get(websiteId);
    if (!website || !cached?.shareToken || cached.shareToken !== token) {
      return c.json({ error: "Invalid share token" }, 401);
    }

    const [owner] = await db
      .select({ plan: user.plan })
      .from(user)
      .where(eq(user.id, website.userId))
      .limit(1);

    return c.json({ branding: (owner?.plan ?? "free") === "free" });
  })

  .use(requireAuth)

  .get("/websites", async (c) => {
    const user = c.get("user");
    const userWebsites = await db.select().from(websites).where(eq(websites.userId, user.id));
    return c.json(userWebsites);
  })

  .post("/websites", async (c) => {
    const user = c.get("user");
    const { name, url } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ error: "Name is required" }, 400);
    }

    const limits = await getUserLimits(user.id);
    if (limits.maxWebsites > 0) {
      const existing = await db.select({ id: websites.id }).from(websites).where(eq(websites.userId, user.id));
      if (existing.length >= limits.maxWebsites) {
        return c.json({ error: `Website limit reached (max ${limits.maxWebsites})` }, 400);
      }
    }

    const [website] = await db
      .insert(websites)
      .values({ name: name.trim(), url: url?.trim() || "", userId: user.id })
      .returning();

    websiteCache.set(website.id, cacheEntryFromLimits(website.url, user.id, limits, website.shareToken));
    trackEvent("website_create");
    return c.json(website);
  })

  .patch("/websites/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const { name, url } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ error: "Name is required" }, 400);
    }

    const [updated] = await db
      .update(websites)
      .set({ name: name.trim(), url: url?.trim() || "" })
      .where(eq(websites.id, id))
      .returning();

    const limits = await getUserLimits(user.id);
    websiteCache.set(updated.id, cacheEntryFromLimits(updated.url, user.id, limits, updated.shareToken));
    return c.json(updated);
  })

  .delete("/websites/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(websites).where(eq(websites.id, id));
    websiteCache.delete(id);
    return c.json({ ok: true });
  })

  .post("/websites/:id/share", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const [website] = await db.select().from(websites).where(eq(websites.id, id)).limit(1);
    if (!website || website.userId !== user.id) return c.json({ error: "Not found" }, 404);

    const shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    await db.update(websites).set({ shareToken }).where(eq(websites.id, id));

    const cached = websiteCache.get(id);
    if (cached) cached.shareToken = shareToken;

    return c.json({ shareToken });
  })

  .delete("/websites/:id/share", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const [website] = await db.select().from(websites).where(eq(websites.id, id)).limit(1);
    if (!website || website.userId !== user.id) return c.json({ error: "Not found" }, 404);

    await db.update(websites).set({ shareToken: null }).where(eq(websites.id, id));

    const cached = websiteCache.get(id);
    if (cached) cached.shareToken = null;

    return c.json({ ok: true });
  });
