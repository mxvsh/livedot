import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { websites } from "@livedot/db/schema";
import { requireAuth } from "../middleware/auth";
import { websiteCache } from "../website-cache";
import { getUserLimits } from "../limits";

function cacheEntryFromLimits(url: string, limits: { maxConnectionsPerSite: number; eventRetentionMs: number; historyMax: number }) {
  try {
    const hostname = url ? new URL(url).hostname : "";
    return { hostname, maxConcurrent: limits.maxConnectionsPerSite, eventRetentionMs: limits.eventRetentionMs, historyMax: limits.historyMax };
  } catch {
    return { hostname: "", maxConcurrent: limits.maxConnectionsPerSite, eventRetentionMs: limits.eventRetentionMs, historyMax: limits.historyMax };
  }
}

export const websiteRoutes = new Hono()
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

    websiteCache.set(website.id, cacheEntryFromLimits(website.url, limits));
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
    websiteCache.set(updated.id, cacheEntryFromLimits(updated.url, limits));
    return c.json(updated);
  })

  .delete("/websites/:id", async (c) => {
    const id = c.req.param("id");
    await db.delete(websites).where(eq(websites.id, id));
    websiteCache.delete(id);
    return c.json({ ok: true });
  });
