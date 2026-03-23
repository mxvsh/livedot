import type { Server } from "bun";
import type { VisitorSession, WSMessage, HistoryPoint, ActivityEvent } from "@livedot/shared";
import type { StoreAdapter } from "@livedot/store";
import { MemoryStore } from "@livedot/store";
import { createLogger } from "@livedot/logger";
import { websiteCache } from "./website-cache";
import { env } from "./env";

const log = createLogger("store");

export { type VisitorSession, type WSMessage, type HistoryPoint, type ActivityEvent };

const SESSION_TIMEOUT = 10_000;
const MAX_EVENTS_PER_SESSION = 50;

// ── Store initialization ──

let store: StoreAdapter;

if (env.REDIS_URL) {
  const { RedisStore } = await import("@livedot/store/redis");
  store = new RedisStore(env.REDIS_URL);
  log.info("Using Redis");
} else {
  store = new MemoryStore();
  log.info("Using in-memory");
}

export { store };

// ── Helpers ──

function getLimitsForWebsite(websiteId: string) {
  const cached = websiteCache.get(websiteId);
  return {
    maxConcurrent: cached?.maxConcurrent ?? 0,
    eventRetentionMs: cached?.eventRetentionMs ?? 0,
    historyMax: cached?.historyMax ?? 0,
  };
}

export async function recordCustomEvent(websiteId: string, event: ActivityEvent) {
  await store.addEvent(websiteId, event, MAX_EVENTS_PER_SESSION);
}

export async function getEventsForWebsite(websiteId: string): Promise<[string, ActivityEvent[]][]> {
  return store.getEvents(websiteId);
}

export async function getSessionsForWebsite(websiteId: string): Promise<VisitorSession[]> {
  return store.getSessionsForWebsite(websiteId);
}

export async function getHistoryForWebsite(websiteId: string): Promise<HistoryPoint[]> {
  return store.getHistory(websiteId);
}

export async function upsertSession(session: VisitorSession, server: Server | null, maxConcurrent = 0) {
  const prev = await store.getSession(session.websiteId, session.sessionId);
  const isNew = !prev;

  if (isNew && maxConcurrent > 0) {
    const current = await store.getSessionsForWebsite(session.websiteId);
    if (current.length >= maxConcurrent) return;
  }

  await store.setSession(session);

  if (isNew) {
    await store.addEvent(session.websiteId, { type: "join", sessionId: session.sessionId, pageUrl: session.pageUrl, timestamp: Date.now() }, MAX_EVENTS_PER_SESSION);
  } else if (prev.pageUrl !== session.pageUrl) {
    await store.addEvent(session.websiteId, { type: "navigate", sessionId: session.sessionId, pageUrl: session.pageUrl, timestamp: Date.now() }, MAX_EVENTS_PER_SESSION);
  }

  const msg: WSMessage = { type: "upsert", session };
  server?.publish(`website:${session.websiteId}`, JSON.stringify(msg));
}

// ── Tick: sample history, sweep sessions, clean events ──

export function startTick(getServer: () => Server | null) {
  async function tick() {
    const now = Date.now();
    const server = getServer();

    // ── 1. Sample history ──
    const activeIds = await store.getActiveWebsiteIds();
    const historyIds = await store.getHistoryWebsiteIds();
    for (const id of historyIds) activeIds.add(id);

    for (const websiteId of activeIds) {
      const { historyMax } = getLimitsForWebsite(websiteId);
      const sessions = await store.getSessionsForWebsite(websiteId);
      const count = sessions.length;

      await store.pushHistory(websiteId, { time: now, count }, historyMax);
      const history = await store.getHistory(websiteId);

      const msg: WSMessage = { type: "history", history };
      server?.publish(`website:${websiteId}`, JSON.stringify(msg));

      if (count === 0 && history.every((h) => h.count === 0)) {
        await store.deleteHistory(websiteId);
      }
    }

    // ── 2. Sweep expired sessions ──
    for (const websiteId of activeIds) {
      const sessions = await store.getSessionsForWebsite(websiteId);
      for (const session of sessions) {
        if (now - session.lastSeen > SESSION_TIMEOUT) {
          await store.deleteSession(websiteId, session.sessionId);
          await store.addEvent(websiteId, { type: "leave", sessionId: session.sessionId, timestamp: now }, MAX_EVENTS_PER_SESSION);
          const msg: WSMessage = { type: "remove", sessionId: session.sessionId };
          server?.publish(`website:${websiteId}`, JSON.stringify(msg));
        }
      }
    }

    // ── 3. Clean stale events (per-website retention) ──
    const eventWebsiteIds = await store.getEventWebsiteIds();
    for (const websiteId of eventWebsiteIds) {
      const { eventRetentionMs } = getLimitsForWebsite(websiteId);
      if (eventRetentionMs === 0) continue; // unlimited

      const events = await store.getEvents(websiteId);
      let remaining = 0;
      for (const [sessionId] of events) {
        const latest = await store.getLatestEventTimestamp(websiteId, sessionId);
        if (now - latest > eventRetentionMs) {
          await store.deleteSessionEvents(websiteId, sessionId);
        } else {
          remaining++;
        }
      }
      if (remaining === 0) await store.deleteWebsiteEvents(websiteId);
    }
  }

  tick();
  setInterval(tick, 5_000);
}
