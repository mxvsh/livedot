import { Hono } from "hono";
import { cors } from "hono/cors";
import { websiteCache } from "../website-cache";
import { getServer } from "../index";
import { resolveGeo } from "../geo";
import { upsertSession, recordCustomEvent } from "../sessions";
import { env } from "../env";

// --- Monthly event counter: userId:YYYY-MM → count ---
const monthlyEventCount = new Map<string, number>();

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function userMonthKey(userId: string) {
  return `${userId}:${currentMonth()}`;
}

function incrementEventCount(userId: string): number {
  const key = userMonthKey(userId);
  const count = (monthlyEventCount.get(key) ?? 0) + 1;
  monthlyEventCount.set(key, count);
  return count;
}

export function getEventCount(userId: string): number {
  return monthlyEventCount.get(userMonthKey(userId)) ?? 0;
}

// --- Rate limiting: max 1 request per 3s per IP+websiteId ---
const rateMap = new Map<string, number>();

// Clean up stale entries every 30s
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of rateMap) {
    if (now - ts > 10_000) rateMap.delete(key);
  }
}, 30_000);

function isRateLimited(ip: string, websiteId: string): boolean {
  const key = `${ip}:${websiteId}`;
  const last = rateMap.get(key);
  const now = Date.now();
  if (last && now - last < 3_000) return true;
  rateMap.set(key, now);
  return false;
}

// --- Bot detection ---
const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|baiduspider|yandex|duckduck|sogou|ia_archiver|semrush|ahref|mj12bot|dotbot|petalbot|bytespider|gptbot|chatgpt/i;

function isBot(ua: string | null): boolean {
  return !ua || BOT_PATTERN.test(ua);
}

// --- Origin validation ---
function isValidOrigin(origin: string | null, registeredHostname: string): boolean {
  // No registered URL — skip origin check
  if (!registeredHostname) return true;
  if (!origin) return true; // Allow no-origin (e.g. server-side, dev)
  try {
    const originHostname = new URL(origin).hostname;
    return originHostname === registeredHostname;
  } catch {
    return false;
  }
}

export const eventRoutes = new Hono()
  .use("/event", cors({ origin: "*" }))

  .post("/event", async (c) => {
    try {
      const text = await c.req.text();
      const { websiteId, sessionId, url, eventName, _mockLat, _mockLng } = JSON.parse(text);

      if (!websiteId || !sessionId) {
        return c.body(null, 400);
      }

      if (!websiteCache.has(websiteId)) {
        return c.body(null, 404);
      }

      const server = getServer();
      const isDev = env.NODE_ENV !== "production";

      // Bot filter
      const ua = c.req.header("user-agent");
      if (!isDev && isBot(ua)) {
        return c.body(null, 204);
      }

      // Origin check
      const cached = websiteCache.get(websiteId)!;
      const origin = c.req.header("origin");
      if (!isDev && !isValidOrigin(origin, cached.hostname)) {
        return c.body(null, 403);
      }

      // Named events (data-livedot-event clicks): store + publish, no rate limit, no geo
      if (typeof eventName === "string" && eventName) {
        if (cached.eventsPerMonth > 0 && getEventCount(cached.userId) >= cached.eventsPerMonth) {
          return c.body(null, 204);
        }
        incrementEventCount(cached.userId);
        const timestamp = Date.now();
        recordCustomEvent(websiteId, { type: "event", sessionId, eventName, pageUrl: url || "", timestamp });
        const msg: import("@livedot/shared").WSMessage = {
          type: "event",
          sessionId,
          eventName,
          pageUrl: url || "",
          timestamp,
        };
        server?.publish(`website:${websiteId}`, JSON.stringify(msg));
        return c.body(null, 204);
      }

      // Rate limit (beacon only)
      const ip =
        c.req.header("cf-connecting-ip") ||
        c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
        server?.requestIP(c.req.raw)?.address ||
        "127.0.0.1";

      if (!isDev && isRateLimited(ip, websiteId)) {
        return c.body(null, 429);
      }

      // Dev mock: accept coordinates directly from mock script
      let geo: { lat: number; lng: number } | null = null;
      if (typeof _mockLat === "number" && typeof _mockLng === "number") {
        geo = { lat: _mockLat, lng: _mockLng };
      } else {
        geo = await resolveGeo(ip);
      }

      if (geo) {
        // Enforce monthly event limit
        if (cached.eventsPerMonth > 0 && getEventCount(cached.userId) >= cached.eventsPerMonth) {
          return c.body(null, 204); // silently drop
        }
        incrementEventCount(cached.userId);
        upsertSession(
          {
            sessionId,
            websiteId,
            lat: geo.lat,
            lng: geo.lng,
            pageUrl: url || "",
            lastSeen: Date.now(),
          },
          server,
        );
      }

      return c.body(null, 204);
    } catch {
      return c.body(null, 400);
    }
  });
