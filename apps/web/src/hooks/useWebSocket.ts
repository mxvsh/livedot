import { useCallback, useSyncExternalStore } from "react";
import { type VisitorSession, type WSMessage, type HistoryPoint, type ActivityEvent } from "@livedot/shared";

export type { VisitorSession, WSMessage, HistoryPoint, ActivityEvent };

// ─── Global connection store (lives outside React) ───

const MAX_EVENTS_PER_SESSION = 50;

interface Conn {
  ws: WebSocket | null;
  sessions: Map<string, VisitorSession>;
  connected: boolean;
  activityLog: Map<string, ActivityEvent[]>;
  history: HistoryPoint[];
  refCount: number;
  listeners: Set<() => void>;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  snapshot: Snapshot;
  _token?: string;
  _recent?: string;
}

interface Snapshot {
  sessions: Map<string, VisitorSession>;
  connected: boolean;
  count: number;
  activityLog: Map<string, ActivityEvent[]>;
  history: HistoryPoint[];
}

const EMPTY: Snapshot = {
  sessions: new Map(),
  connected: false,
  count: 0,
  activityLog: new Map(),
  history: [],
};

const conns = new Map<string, Conn>();

function notify(c: Conn) {
  c.snapshot = {
    sessions: c.sessions,
    connected: c.connected,
    count: c.sessions.size,
    activityLog: c.activityLog,
    history: c.history,
  };
  for (const fn of c.listeners) fn();
}

function addEvent(c: Conn, event: ActivityEvent) {
  const existing = c.activityLog.get(event.sessionId) ?? [];
  const next = new Map(c.activityLog);
  next.set(event.sessionId, [event, ...existing].slice(0, MAX_EVENTS_PER_SESSION));
  c.activityLog = next;
}

export interface UseWebSocketOptions {
  token?: string;
  recent?: string;
}

function normalizeOptions(tokenOrOptions?: string | UseWebSocketOptions): UseWebSocketOptions {
  if (typeof tokenOrOptions === "string") {
    return { token: tokenOrOptions };
  }
  return tokenOrOptions ?? {};
}

function connKey(websiteId: string, token?: string, recent?: string) {
  return [websiteId, token ?? "", recent ?? ""].join(":");
}

function openWS(websiteId: string, c: Conn, token?: string, recent?: string) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  let url = `${protocol}//${location.host}/ws?website=${websiteId}`;
  if (token) url += `&token=${encodeURIComponent(token)}`;
  if (recent) url += `&recent=${encodeURIComponent(recent)}`;
  const ws = new WebSocket(url);
  c.ws = ws;

  ws.onopen = () => {
    c.connected = true;
    notify(c);
  };

  ws.onmessage = (e) => {
    if (c.ws !== ws) return;
    const msg = JSON.parse(e.data) as WSMessage;

    if (msg.type === "snapshot") {
      c.sessions = new Map<string, VisitorSession>();
      for (const s of msg.sessions) c.sessions.set(s.sessionId, s);
      c.history = msg.history ?? [];
      // Load events from server
      c.activityLog = new Map(msg.events ?? []);
    } else if (msg.type === "history") {
      c.history = msg.history ?? [];
    } else if (msg.type === "upsert") {
      const isNew = !c.sessions.has(msg.session.sessionId);
      const prevUrl = c.sessions.get(msg.session.sessionId)?.pageUrl;

      c.sessions = new Map(c.sessions);
      c.sessions.set(msg.session.sessionId, msg.session);

      // Server tracks these too — mirror locally for instant UI update
      if (isNew) {
        addEvent(c, { type: "join", sessionId: msg.session.sessionId, pageUrl: msg.session.pageUrl, timestamp: Date.now() });
      } else if (prevUrl !== msg.session.pageUrl) {
        addEvent(c, { type: "navigate", sessionId: msg.session.sessionId, pageUrl: msg.session.pageUrl, timestamp: Date.now() });
      }
    } else if (msg.type === "remove") {
      addEvent(c, { type: "leave", sessionId: msg.sessionId, timestamp: Date.now() });
      c.sessions = new Map(c.sessions);
      c.sessions.delete(msg.sessionId);
    } else if (msg.type === "event") {
      addEvent(c, { type: "event", sessionId: msg.sessionId, eventName: msg.eventName, pageUrl: msg.pageUrl, timestamp: msg.timestamp });
    }

    notify(c);
  };

  ws.onclose = () => {
    c.connected = false;
    notify(c);
    if (c.ws === ws && c.refCount > 0) {
      c.reconnectTimer = setTimeout(() => openWS(websiteId, c, c._token, c._recent), 2000);
    }
  };

  ws.onerror = () => ws.close();
}

function sub(websiteId: string, listener: () => void, token?: string, recent?: string): () => void {
  const key = connKey(websiteId, token, recent);
  let c = conns.get(key);
  if (!c) {
    c = {
      ws: null,
      sessions: new Map(),
      connected: false,
      activityLog: new Map(),
      history: [],
      refCount: 0,
      listeners: new Set(),
      snapshot: EMPTY,
      _token: token,
      _recent: recent,
    };
    conns.set(key, c);
  }

  c.refCount++;
  c.listeners.add(listener);

  if (c.refCount === 1) openWS(websiteId, c, token, recent);

  return () => {
    c.listeners.delete(listener);
    c.refCount--;
    if (c.refCount === 0) {
      clearTimeout(c.reconnectTimer);
      c.ws?.close();
      c.ws = null;
      conns.delete(key);
    }
  };
}

function snap(websiteId: string, token?: string, recent?: string): Snapshot {
  return conns.get(connKey(websiteId, token, recent))?.snapshot ?? EMPTY;
}

// ─── React hook ───

export function useWebSocket(websiteId: string | null, tokenOrOptions?: string | UseWebSocketOptions) {
  const { token, recent } = normalizeOptions(tokenOrOptions);

  const subscribe = useCallback(
    (listener: () => void) => (websiteId ? sub(websiteId, listener, token, recent) : () => {}),
    [websiteId, token, recent]
  );

  const getSnapshot = useCallback(
    () => (websiteId ? snap(websiteId, token, recent) : EMPTY),
    [websiteId, token, recent]
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
