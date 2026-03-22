import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@latty/db";
import { projects } from "@latty/db/schema";
import { requireAuth } from "../middleware/auth";
import { projectIdCache } from "../index";

export const projectRoutes = new Hono()
  .use(requireAuth)

  .get("/projects", async (c) => {
    const user = c.get("user");
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id));
    return c.json(userProjects);
  })

  .post("/projects", async (c) => {
    const user = c.get("user");
    const { name } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ error: "Name is required" }, 400);
    }

    const [project] = await db
      .insert(projects)
      .values({ name: name.trim(), userId: user.id })
      .returning();

    projectIdCache.add(project.id);
    return c.json(project);
  })

  .delete("/projects/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    await db.delete(projects).where(eq(projects.id, id));
    projectIdCache.delete(id);

    return c.json({ ok: true });
  });
