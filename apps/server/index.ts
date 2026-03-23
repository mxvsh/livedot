import { Hono } from "hono";
import type { Server } from "bun";
import { createLogger } from "@livedot/logger";
import { env } from "./env";

const log = createLogger("server");
import { db } from "@livedot/db";
import { websites } from "@livedot/db/schema";
import { auth } from "./auth";
import { authRoutes } from "./routes/auth";
import { websiteRoutes } from "./routes/websites";
import { eventRoutes } from "./routes/events";
import { wsHandler, type WSData } from "./ws";
import { startTick } from "./sessions";
import { supportedRecentWindow } from "@livedot/shared/recent";

import { websiteCache } from "./website-cache";
export { websiteCache };

async function loadWebsiteCache() {
  const { getUserLimits } = await import("./limits");
  const all = await db
    .select({ id: websites.id, url: websites.url, userId: websites.userId, shareToken: websites.shareToken })
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
        shareToken: w.shareToken,
      });
    } catch {
      websiteCache.set(w.id, {
        hostname: "",
        maxConcurrent: limits.maxConnectionsPerSite,
        eventRetentionMs: limits.eventRetentionMs,
        historyMax: limits.historyMax,
        shareToken: w.shareToken,
      });
    }
  }
}

export async function reloadWebsiteCache() {
  websiteCache.clear();
  await loadWebsiteCache();
}

loadWebsiteCache().catch((err) => log.error(err, "Failed to load website cache"));

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

      const token = url.searchParams.get("token");
      const recent = supportedRecentWindow(url.searchParams.get("recent"));

      // Token-based auth for embeds
      if (token) {
        const cached = websiteCache.get(websiteId);
        if (!cached?.shareToken || cached.shareToken !== token) {
          return new Response("Invalid share token", { status: 401 });
        }
        const upgraded = server.upgrade<WSData>(req, {
          data: { websiteId, userId: "__embed__", recent },
        });
        if (!upgraded) {
          return new Response("WebSocket upgrade failed", { status: 400 });
        }
        return undefined;
      }

      // Session-based auth for dashboard
      return auth.api.getSession({ headers: req.headers }).then((session) => {
        if (!session) {
          return new Response("Unauthorized", { status: 401 });
        }
        const upgraded = server.upgrade<WSData>(req, {
          data: { websiteId, userId: session.user.id, recent },
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

log.info(`Server running at ${server.url}`);
