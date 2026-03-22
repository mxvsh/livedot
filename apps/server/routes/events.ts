import { Hono } from "hono";
import { cors } from "hono/cors";
import { websiteIdCache, getServer } from "../index";
import { resolveGeo } from "../geo";
import { upsertSession } from "../sessions";

export const eventRoutes = new Hono()
  .use("/event", cors({ origin: "*" }))

  .post("/event", async (c) => {
    try {
      const text = await c.req.text();
      const { websiteId, sessionId, url, _mockLat, _mockLng } = JSON.parse(text);

      if (!websiteId || !sessionId) {
        return c.body(null, 400);
      }

      if (!websiteIdCache.has(websiteId)) {
        return c.body(null, 404);
      }

      const server = getServer();

      // Dev mock: accept coordinates directly from mock script
      let geo: { lat: number; lng: number } | null = null;
      if (typeof _mockLat === "number" && typeof _mockLng === "number") {
        geo = { lat: _mockLat, lng: _mockLng };
      } else {
        const ip = server?.requestIP(c.req.raw);
        geo = await resolveGeo(ip?.address ?? "127.0.0.1");
      }

      if (geo) {
        upsertSession(
          {
            sessionId,
            websiteId,
            lat: geo.lat,
            lng: geo.lng,
            pageUrl: url || "",
            lastSeen: Date.now(),
          },
          server
        );
      }

      return c.body(null, 204);
    } catch {
      return c.body(null, 400);
    }
  });
