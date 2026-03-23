export interface VisitorSession {
  sessionId: string;
  websiteId: string;
  lat: number;
  lng: number;
  pageUrl: string;
  lastSeen: number;
}

export interface HistoryPoint {
  time: number;
  count: number;
}

export type ActivityEvent =
  | { type: "join"; sessionId: string; pageUrl: string; timestamp: number }
  | { type: "navigate"; sessionId: string; pageUrl: string; timestamp: number }
  | { type: "leave"; sessionId: string; timestamp: number }
  | { type: "event"; sessionId: string; eventName: string; pageUrl: string; timestamp: number };

export type WSMessage =
  | { type: "snapshot"; sessions: VisitorSession[]; history: HistoryPoint[]; events: [string, ActivityEvent[]][] }
  | { type: "upsert"; session: VisitorSession }
  | { type: "remove"; sessionId: string }
  | { type: "event"; sessionId: string; eventName: string; pageUrl: string; timestamp: number }
  | { type: "history"; history: HistoryPoint[] };
