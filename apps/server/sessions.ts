import type { Server } from "bun";
import type { VisitorSession, WSMessage, HistoryPoint, ActivityEvent } from "@livedot/shared";
import { websiteCache } from "./website-cache";

export { type VisitorSession, type WSMessage, type HistoryPoint, type ActivityEvent };

// Key: `${websiteId}:${sessionId}`
const activeSessions = new Map<string, VisitorSession>();

const SESSION_TIMEOUT = 10_000;

// Key: websiteId → history samples
const historyStore = new Map<string, HistoryPoint[]>();

// Key: websiteId → Map<sessionId, ActivityEvent[]>
const eventStore = new Map<string, Map<string, ActivityEvent[]>>();
const MAX_EVENTS_PER_SESSION = 50;

function getLimitsForWebsite(websiteId: string) {
  const cached = websiteCache.get(websiteId);
  return {
    maxConcurrent: cached?.maxConcurrent ?? 0,
    eventRetentionMs: cached?.eventRetentionMs ?? 0,
    historyMax: cached?.historyMax ?? 0,
  };
}

function addEvent(websiteId: string, event: ActivityEvent) {
  let websiteEvents = eventStore.get(websiteId);
  if (!websiteEvents) {
    websiteEvents = new Map();
    eventStore.set(websiteId, websiteEvents);
  }
  const existing = websiteEvents.get(event.sessionId) ?? [];
  websiteEvents.set(event.sessionId, [event, ...existing].slice(0, MAX_EVENTS_PER_SESSION));
}

export function recordCustomEvent(websiteId: string, event: ActivityEvent) {
  addEvent(websiteId, event);
}

export function getEventsForWebsite(websiteId: string): [string, ActivityEvent[]][] {
  const websiteEvents = eventStore.get(websiteId);
  if (!websiteEvents) return [];
  return [...websiteEvents];
}

export function upsertSession(session: VisitorSession, server: Server | null, maxConcurrent = 0) {
  const key = `${session.websiteId}:${session.sessionId}`;
  const prev = activeSessions.get(key);
  const isNew = !prev;

  if (isNew && maxConcurrent > 0 && getSessionsForWebsite(session.websiteId).length >= maxConcurrent) {
    return;
  }

  activeSessions.set(key, session);

  if (isNew) {
    addEvent(session.websiteId, { type: "join", sessionId: session.sessionId, pageUrl: session.pageUrl, timestamp: Date.now() });
  } else if (prev.pageUrl !== session.pageUrl) {
    addEvent(session.websiteId, { type: "navigate", sessionId: session.sessionId, pageUrl: session.pageUrl, timestamp: Date.now() });
  }

  const msg: WSMessage = { type: "upsert", session };
  server?.publish(`website:${session.websiteId}`, JSON.stringify(msg));
}

export function getSessionsForWebsite(websiteId: string): VisitorSession[] {
  const sessions: VisitorSession[] = [];
  for (const [key, session] of activeSessions) {
    if (key.startsWith(`${websiteId}:`)) {
      sessions.push(session);
    }
  }
  return sessions;
}

export function getHistoryForWebsite(websiteId: string): HistoryPoint[] {
  return historyStore.get(websiteId) ?? [];
}

function getActiveWebsiteIds(): Set<string> {
  const ids = new Set<string>();
  for (const [key] of activeSessions) {
    ids.add(key.split(":")[0]);
  }
  return ids;
}

// Single tick: sample history, sweep sessions, clean stale events
export function startTick(getServer: () => Server | null) {
  function tick() {
    const now = Date.now();
    const server = getServer();

    // ── 1. Sample history ──
    const activeIds = getActiveWebsiteIds();
    for (const id of historyStore.keys()) activeIds.add(id);

    for (const websiteId of activeIds) {
      const { historyMax } = getLimitsForWebsite(websiteId);
      const count = getSessionsForWebsite(websiteId).length;
      const history = historyStore.get(websiteId) ?? [];
      history.push({ time: now, count });
      // historyMax 0 = unlimited
      if (historyMax > 0 && history.length > historyMax) {
        history.splice(0, history.length - historyMax);
      }
      historyStore.set(websiteId, history);

      const msg: WSMessage = { type: "history", history };
      server?.publish(`website:${websiteId}`, JSON.stringify(msg));

      if (count === 0 && history.every((h) => h.count === 0)) {
        historyStore.delete(websiteId);
      }
    }

    // ── 2. Sweep expired sessions ──
    for (const [key, session] of activeSessions) {
      if (now - session.lastSeen > SESSION_TIMEOUT) {
        activeSessions.delete(key);
        addEvent(session.websiteId, { type: "leave", sessionId: session.sessionId, timestamp: now });
        const msg: WSMessage = { type: "remove", sessionId: session.sessionId };
        server?.publish(`website:${session.websiteId}`, JSON.stringify(msg));
      }
    }

    // ── 3. Clean stale events (per-website retention) ──
    for (const [websiteId, websiteEvents] of eventStore) {
      const { eventRetentionMs } = getLimitsForWebsite(websiteId);
      if (eventRetentionMs === 0) continue; // unlimited retention
      for (const [sessionId, events] of websiteEvents) {
        const latest = events[0]?.timestamp ?? 0;
        if (now - latest > eventRetentionMs) {
          websiteEvents.delete(sessionId);
        }
      }
      if (websiteEvents.size === 0) eventStore.delete(websiteId);
    }
  }

  tick();
  setInterval(tick, 5_000);
}
