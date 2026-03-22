import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import type { Server } from "bun";
import { db } from "@latty/db";
import { websites } from "@latty/db/schema";
import { authRoutes } from "./routes/auth";
import { websiteRoutes } from "./routes/websites";
import { eventRoutes } from "./routes/events";
import { wsHandler, type WSData } from "./ws";
import { validateSession } from "./middleware/auth";
import { startSweep } from "./sessions";

// Cache valid website IDs
export const websiteIdCache = new Set<string>();

async function loadWebsiteCache() {
  const all = await db.select({ id: websites.id }).from(websites);
  for (const w of all) websiteIdCache.add(w.id);
}

loadWebsiteCache().catch(console.error);

// Hono app
const app = new Hono();

// Event route first — no auth required (public tracker endpoint)
app.route("/api", eventRoutes);
app.route("/api", authRoutes);
app.route("/api", websiteRoutes);

// Serve tracker script
const trackerScript = Bun.file(
  new URL("../../../packages/tracker/src/tracker.js", import.meta.url).pathname
);

app.get("/t.js", async (c) => {
  return c.body(await trackerScript.text(), 200, {
    "Content-Type": "application/javascript",
    "Cache-Control": "public, max-age=3600",
    "Access-Control-Allow-Origin": "*",
  });
});

// Prod: serve Vite build
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "../../apps/web/dist" }));
  app.get("/*", serveStatic({ path: "../../apps/web/dist/index.html" }));
}

// Server reference for WebSocket publishing
let _server: Server | null = null;
export function getServer() {
  return _server;
}

// Start Bun server with Hono + WebSocket
const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      const websiteId = url.searchParams.get("website");
      if (!websiteId) {
        return new Response("Missing website parameter", { status: 400 });
      }

      // Parse cookie manually for the upgrade path
      const cookies = req.headers.get("cookie") || "";
      const sessionMatch = cookies.match(/(?:^|;\s*)session=([^;]*)/);
      const sessionId = sessionMatch?.[1];

      // We need to validate synchronously for upgrade, so we handle it async
      return validateSession(sessionId).then((user) => {
        if (!user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const upgraded = server.upgrade<WSData>(req, {
          data: { websiteId, userId: user.id },
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
startSweep(getServer);

console.log(`Server running at ${server.url}`);
