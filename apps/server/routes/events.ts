import { Hono } from "hono";
import { cors } from "hono/cors";
import { and, eq } from "drizzle-orm";
import { db } from "@livedot/db";
import { websiteUsage } from "@livedot/db/schema";
import { createLogger } from "@livedot/logger";
import { websiteCache } from "../website-cache";
import { getServer } from "../index";
import { resolveGeo } from "../geo";
import { upsertSession, recordCustomEvent, store } from "../sessions";
import { env } from "../env";

const log = createLogger("events");

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function userMonthKey(userId: string) { return `user:${userId}:${currentMonth()}`; }
function websiteMonthKey(websiteId: string) { return `website:${websiteId}:${currentMonth()}`; }

async function incrementEventCount(userId: string, websiteId: string): Promise<number> {
  const [uCount] = await Promise.all([
    store.incrementCounter(userMonthKey(userId)),
    store.incrementCounter(websiteMonthKey(websiteId)),
  ]);
  return uCount;
}

export async function getEventCount(userId: string): Promise<number> {
  return store.getCounter(userMonthKey(userId));
}

// On startup: seed store from DB for current month (only needed for MemoryStore)
async function seedFromDB() {
  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(websiteUsage)
      .where(and(eq(websiteUsage.year, now.getFullYear()), eq(websiteUsage.month, now.getMonth() + 1)));

    // Only seed if store has no data yet (avoids double-counting on Redis)
    for (const row of rows) {
      const wKey = websiteMonthKey(row.websiteId);
      const existing = await store.getCounter(wKey);
      if (existing === 0) {
        // MemoryStore: set directly; RedisStore: SET NX
        if ("setCounter" in store) {
          (store as any).setCounter(wKey, row.eventCount);
          (store as any).setCounter(userMonthKey(row.userId),
            (await store.getCounter(userMonthKey(row.userId))) + row.eventCount);
        }
      }
    }
    log.info({ rows: rows.length }, "Seeded event counts from DB");
  } catch (err) {
    log.error(err, "Failed to seed event counts from DB");
  }
}

// Flush store counts to DB every 60s for analytics
async function flushCountsToDB() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const counts = await store.getCountersByPattern(`website:`)
    .then(m => new Map([...m].filter(([k]) => k.includes(`:${currentMonth()}`))));

  for (const [key, count] of counts) {
    // key: website:<websiteId>:<YYYY-MM>
    const parts = key.split(":");
    const websiteId = parts[1];
    if (!websiteId) continue;
    const cached = websiteCache.get(websiteId);
    if (!cached) continue;
    try {
      await db.insert(websiteUsage)
        .values({ websiteId, userId: cached.userId, year, month, eventCount: count, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: [websiteUsage.websiteId, websiteUsage.year, websiteUsage.month],
          set: { eventCount: count, updatedAt: new Date() },
        });
    } catch (err) {
      log.error(err, "Failed to flush event count");
    }
  }
}

seedFromDB();
setInterval(() => { flushCountsToDB().catch(() => {}); }, 60_000);

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
        if (cached.eventsPerMonth > 0 && await getEventCount(cached.userId) >= cached.eventsPerMonth) {
          return c.body(null, 204);
        }
        await incrementEventCount(cached.userId, websiteId);
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
        if (cached.eventsPerMonth > 0 && await getEventCount(cached.userId) >= cached.eventsPerMonth) {
          return c.body(null, 204); // silently drop
        }
        await incrementEventCount(cached.userId, websiteId);
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
