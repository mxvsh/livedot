export interface VisitorSession {
  sessionId: string;
  websiteId: string;
  lat: number;
  lng: number;
  pageUrl: string;
  lastSeen: number;
}

export type WSMessage =
  | { type: "snapshot"; sessions: VisitorSession[] }
  | { type: "upsert"; session: VisitorSession }
  | { type: "remove"; sessionId: string };
