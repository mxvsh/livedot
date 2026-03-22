import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

export async function getSessionFromRequest(req: Request) {
  return auth.api.getSession({ headers: req.headers });
}

export async function validateSession(sessionId: string | undefined) {
  // kept for ws upgrade path — look up via cookie header
  if (!sessionId) return null;
  const headers = new Headers({ cookie: `better-auth.session_token=${sessionId}` });
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await getSessionFromRequest(c.req.raw);

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", { id: session.user.id, username: session.user.username ?? session.user.name });
  await next();
});
