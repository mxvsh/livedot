import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { websites } from "@livedot/db/schema";
import { requireAuth } from "../middleware/auth";
import { websiteCache } from "../index";

export const websiteRoutes = new Hono()
  .use(requireAuth)

  .get("/websites", async (c) => {
    const user = c.get("user");
    const userWebsites = await db
      .select()
      .from(websites)
      .where(eq(websites.userId, user.id));
    return c.json(userWebsites);
  })

  .post("/websites", async (c) => {
    const user = c.get("user");
    const { name, url } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ error: "Name is required" }, 400);
    }

    const [website] = await db
      .insert(websites)
      .values({ name: name.trim(), url: url?.trim() || "", userId: user.id })
      .returning();

    try {
      const hostname = website.url ? new URL(website.url).hostname : "";
      websiteCache.set(website.id, hostname);
    } catch {
      websiteCache.set(website.id, "");
    }
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

    try {
      const hostname = updated.url ? new URL(updated.url).hostname : "";
      websiteCache.set(updated.id, hostname);
    } catch {
      websiteCache.set(updated.id, "");
    }
    return c.json(updated);
  })

  .delete("/websites/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    await db.delete(websites).where(eq(websites.id, id));
    websiteCache.delete(id);

    return c.json({ ok: true });
  });
