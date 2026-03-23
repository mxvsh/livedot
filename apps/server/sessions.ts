import type { Server } from "bun";
import type { VisitorSession, WSMessage, HistoryPoint, ActivityEvent } from "@livedot/shared";
import type { StoreAdapter } from "@livedot/store";
import { MemoryStore } from "@livedot/store";
import { createLogger } from "@livedot/logger";
import {
  durationForRecent,
  resolutionForRecent,
  ROLLUP_RECENT_WINDOWS,
  type RollupRecentWindow,
  type SupportedRecentWindow,
} from "@livedot/shared/recent";
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

const HISTORY_SAMPLE_MS = 5_000;
const RAW_HISTORY_MAX = (10 * 60_000) / HISTORY_SAMPLE_MS;

function rawHistoryKey(websiteId: string) {
  return websiteId;
}

function rollupHistoryKey(websiteId: string, recent: SupportedRecentWindow) {
  return `${websiteId}::rollup:${recent}`;
}

function baseWebsiteIdFromHistoryKey(historyKey: string) {
  return historyKey.split("::rollup:")[0] ?? historyKey;
}

function historyChannel(websiteId: string, recent?: SupportedRecentWindow | null) {
  return recent ? `website:${websiteId}:history:${recent}` : `website:${websiteId}:history`;
}

function historySeriesLength(recent: RollupRecentWindow) {
  const resolutionMs = resolutionForRecent(recent)!;
  return Math.max(1, Math.ceil(durationForRecent(recent) / resolutionMs));
}

function bucketStart(time: number, resolutionMs: number) {
  return Math.floor(time / resolutionMs) * resolutionMs;
}

function updateBucketAverage(previousAverage: number, nextValue: number, sampleIndex: number) {
  if (sampleIndex <= 1) return nextValue;
  return Math.round(((previousAverage * (sampleIndex - 1)) + nextValue) / sampleIndex);
}

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

export async function getHistoryForWebsite(websiteId: string, recent?: SupportedRecentWindow | null): Promise<HistoryPoint[]> {
  const key = !recent || recent === "10m" ? rawHistoryKey(websiteId) : rollupHistoryKey(websiteId, recent);
  return store.getHistory(key);
}

async function deleteAllHistoryForWebsite(websiteId: string) {
  await store.deleteHistory(rawHistoryKey(websiteId));
  for (const recent of ROLLUP_RECENT_WINDOWS) {
    await store.deleteHistory(rollupHistoryKey(websiteId, recent));
  }
}

async function updateRollupHistory(websiteId: string, recent: RollupRecentWindow, point: HistoryPoint) {
  const resolutionMs = resolutionForRecent(recent)!;
  const maxLength = historySeriesLength(recent);
  const key = rollupHistoryKey(websiteId, recent);
  const history = await store.getHistory(key);
  const currentBucketStart = bucketStart(point.time, resolutionMs);
  const nextHistory = [...history];
  const last = nextHistory[nextHistory.length - 1];

  if (last && bucketStart(last.time, resolutionMs) === currentBucketStart) {
    const sampleIndex = Math.max(1, Math.floor((point.time - currentBucketStart) / HISTORY_SAMPLE_MS) + 1);
    nextHistory[nextHistory.length - 1] = {
      time: point.time,
      count: updateBucketAverage(last.count, point.count, sampleIndex),
    };
  } else {
    nextHistory.push({ time: point.time, count: point.count });
  }

  await store.setHistory(key, maxLength > 0 ? nextHistory.slice(-maxLength) : nextHistory);
}

async function updateRollupHistories(websiteId: string, point: HistoryPoint) {
  for (const recent of ROLLUP_RECENT_WINDOWS) {
    await updateRollupHistory(websiteId, recent, point);
  }
}

async function allStoredHistoryZero(websiteId: string, rawHistory: HistoryPoint[]) {
  if (!rawHistory.every((point) => point.count === 0)) return false;
  for (const recent of ROLLUP_RECENT_WINDOWS) {
    const history = await store.getHistory(rollupHistoryKey(websiteId, recent));
    if (!history.every((point) => point.count === 0)) return false;
  }
  return true;
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
    for (const id of historyIds) activeIds.add(baseWebsiteIdFromHistoryKey(id));

    for (const websiteId of activeIds) {
      const sessions = await store.getSessionsForWebsite(websiteId);
      const count = sessions.length;

      const point = { time: now, count };
      await store.pushHistory(rawHistoryKey(websiteId), point, RAW_HISTORY_MAX);
      const history = await store.getHistory(rawHistoryKey(websiteId));
      await updateRollupHistories(websiteId, point);

      server?.publish(historyChannel(websiteId), JSON.stringify({ type: "history", history } satisfies WSMessage));
      server?.publish(historyChannel(websiteId, "10m"), JSON.stringify({ type: "history", history } satisfies WSMessage));
      for (const recent of ROLLUP_RECENT_WINDOWS) {
        const rollup = await getHistoryForWebsite(websiteId, recent);
        server?.publish(historyChannel(websiteId, recent), JSON.stringify({ type: "history", history: rollup } satisfies WSMessage));
      }

      if (count === 0 && await allStoredHistoryZero(websiteId, history)) {
        await deleteAllHistoryForWebsite(websiteId);
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
  setInterval(tick, HISTORY_SAMPLE_MS);
}
