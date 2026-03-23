import type { Server } from "bun";
import type { VisitorSession, WSMessage, HistoryPoint, ActivityEvent } from "@livedot/shared";

export { type VisitorSession, type WSMessage, type HistoryPoint, type ActivityEvent };

// Key: `${websiteId}:${sessionId}`
const activeSessions = new Map<string, VisitorSession>();

// Key: websiteId → last 360 samples (5s intervals × 360 = 30 minutes)
const historyStore = new Map<string, HistoryPoint[]>();
const HISTORY_MAX = 360;
const SESSION_TIMEOUT = 10_000;

// Key: websiteId → Map<sessionId, ActivityEvent[]>
const eventStore = new Map<string, Map<string, ActivityEvent[]>>();
const MAX_EVENTS_PER_SESSION = 50;
const EVENT_RETENTION = 30 * 60_000; // 30 minutes

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

export function upsertSession(session: VisitorSession, server: Server | null, maxConcurrent = 1000) {
  const key = `${session.websiteId}:${session.sessionId}`;
  const prev = activeSessions.get(key);
  const isNew = !prev;

  if (isNew && getSessionsForWebsite(session.websiteId).length >= maxConcurrent) {
    return;
  }

  activeSessions.set(key, session);

  // Track activity events
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
      const count = getSessionsForWebsite(websiteId).length;
      const history = historyStore.get(websiteId) ?? [];
      history.push({ time: now, count });
      if (history.length > HISTORY_MAX) history.splice(0, history.length - HISTORY_MAX);
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

    // ── 3. Clean stale events (sessions gone > 30 min) ──
    for (const [websiteId, websiteEvents] of eventStore) {
      for (const [sessionId, events] of websiteEvents) {
        const latest = events[0]?.timestamp ?? 0;
        if (now - latest > EVENT_RETENTION) {
          websiteEvents.delete(sessionId);
        }
      }
      if (websiteEvents.size === 0) eventStore.delete(websiteId);
    }
  }

  tick();
  setInterval(tick, 5_000);
}
