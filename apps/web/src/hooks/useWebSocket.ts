import { useState, useEffect, useRef, useCallback } from "react";
import type { VisitorSession, WSMessage } from "@latty/shared";

export type { VisitorSession, WSMessage };

export function useWebSocket(projectId: string | null) {
  const [sessions, setSessions] = useState<Map<string, VisitorSession>>(
    new Map()
  );
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!projectId) return;

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${location.host}/ws?project=${projectId}`
    );
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as WSMessage;

      if (msg.type === "snapshot") {
        const map = new Map<string, VisitorSession>();
        for (const s of msg.sessions) map.set(s.sessionId, s);
        setSessions(map);
      } else if (msg.type === "upsert") {
        setSessions((prev) => {
          const next = new Map(prev);
          next.set(msg.session.sessionId, msg.session);
          return next;
        });
      } else if (msg.type === "remove") {
        setSessions((prev) => {
          const next = new Map(prev);
          next.delete(msg.sessionId);
          return next;
        });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();
  }, [projectId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { sessions, connected, count: sessions.size };
}
