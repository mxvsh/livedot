import { Hono } from "hono";
import type { Server } from "bun";
import { env } from "./env";
import { db } from "@livedot/db";
import { websites } from "@livedot/db/schema";
import { auth } from "./auth";
import { authRoutes } from "./routes/auth";
import { websiteRoutes } from "./routes/websites";
import { eventRoutes } from "./routes/events";
import { wsHandler, type WSData } from "./ws";
import { startTick } from "./sessions";

import { websiteCache } from "./website-cache";
export { websiteCache };

async function loadWebsiteCache() {
  const { getUserLimits } = await import("./limits");
  const all = await db
    .select({ id: websites.id, url: websites.url, userId: websites.userId })
    .from(websites);

  // Batch user lookups
  const userLimitsCache = new Map<string, Awaited<ReturnType<typeof getUserLimits>>>();
  for (const w of all) {
    if (!userLimitsCache.has(w.userId)) {
      userLimitsCache.set(w.userId, await getUserLimits(w.userId));
    }
    const limits = userLimitsCache.get(w.userId)!;
    try {
      const hostname = w.url ? new URL(w.url).hostname : "";
      websiteCache.set(w.id, {
        hostname,
        maxConcurrent: limits.maxConnectionsPerSite,
        eventRetentionMs: limits.eventRetentionMs,
        historyMax: limits.historyMax,
      });
    } catch {
      websiteCache.set(w.id, {
        hostname: "",
        maxConcurrent: limits.maxConnectionsPerSite,
        eventRetentionMs: limits.eventRetentionMs,
        historyMax: limits.historyMax,
      });
    }
  }
}

export async function reloadWebsiteCache() {
  websiteCache.clear();
  await loadWebsiteCache();
}

loadWebsiteCache().catch(console.error);

// Hono app
const app = new Hono();

// better-auth handler — catches all /api/auth/* routes
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// App routes
app.route("/api", eventRoutes);
app.route("/api", authRoutes);
app.route("/api", websiteRoutes);

// Serve tracker script
const trackerScript = Bun.file(new URL("./tracker.js", import.meta.url).pathname);

app.get("/t.js", async (c) => {
  return c.body(await trackerScript.text(), 200, {
    "Content-Type": "application/javascript",
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*",
  });
});

// Server reference for WebSocket publishing
let _server: Server | null = null;
export function getServer() {
  return _server;
}

// Start Bun server with Hono + WebSocket
const server = Bun.serve({
  port: env.PORT,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      const websiteId = url.searchParams.get("website");
      if (!websiteId) {
        return new Response("Missing website parameter", { status: 400 });
      }

      return auth.api.getSession({ headers: req.headers }).then((session) => {
        if (!session) {
          return new Response("Unauthorized", { status: 401 });
        }
        const upgraded = server.upgrade<WSData>(req, {
          data: { websiteId, userId: session.user.id },
        });
        if (!upgraded) {
          return new Response("WebSocket upgrade failed", { status: 400 });
        }
        return undefined;
      });
    }

    return app.fetch(req, { ip: server.requestIP(req) });
  },
  websocket: wsHandler,
});

_server = server;
startTick(getServer);

console.log(`Server running at ${server.url}`);
