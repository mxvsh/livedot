import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { websites } from "@livedot/db/schema";
import { requireAuth } from "../middleware/auth";
import { websiteCache } from "../index";
import { env } from "../env";
import { getUserLimits } from "../limits";

function cacheEntry(w: { url: string; metadata: Record<string, unknown> | null }) {
  const maxConnections = (w.metadata as any)?.maxConnections ?? env.DEFAULT_MAX_CONNECTIONS;
  try {
    const hostname = w.url ? new URL(w.url).hostname : "";
    return { hostname, maxConcurrent: maxConnections };
  } catch {
    return { hostname: "", maxConcurrent: maxConnections };
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

    const { maxWebsites } = await getUserLimits(user.id);
    if (maxWebsites > 0) {
      const existing = await db.select({ id: websites.id }).from(websites).where(eq(websites.userId, user.id));
      if (existing.length >= maxWebsites) {
        return c.json({ error: `Website limit reached (max ${maxWebsites})` }, 400);
      }
    }

    const metadata = { maxConnections: env.DEFAULT_MAX_CONNECTIONS };
    const [website] = await db
      .insert(websites)
      .values({ name: name.trim(), url: url?.trim() || "", userId: user.id, metadata })
      .returning();

    websiteCache.set(website.id, cacheEntry(website));
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

    websiteCache.set(updated.id, cacheEntry(updated));
    return c.json(updated);
  })

  .delete("/websites/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    await db.delete(websites).where(eq(websites.id, id));
    websiteCache.delete(id);

    return c.json({ ok: true });
  });
