import type { VisitorSession, HistoryPoint, ActivityEvent } from "@livedot/shared";

export interface StoreAdapter {
  // ── Sessions ──
  getSession(websiteId: string, sessionId: string): Promise<VisitorSession | null> | VisitorSession | null;
  setSession(session: VisitorSession): Promise<void> | void;
  deleteSession(websiteId: string, sessionId: string): Promise<void> | void;
  getSessionsForWebsite(websiteId: string): Promise<VisitorSession[]> | VisitorSession[];
  getActiveWebsiteIds(): Promise<Set<string>> | Set<string>;

  // ── History ──
  getHistory(websiteId: string): Promise<HistoryPoint[]> | HistoryPoint[];
  pushHistory(websiteId: string, point: HistoryPoint, maxLength: number): Promise<void> | void;
  deleteHistory(websiteId: string): Promise<void> | void;
  getHistoryWebsiteIds(): Promise<Set<string>> | Set<string>;

  // ── Events ──
  getEvents(websiteId: string): Promise<[string, ActivityEvent[]][]> | [string, ActivityEvent[]][];
  addEvent(websiteId: string, event: ActivityEvent, maxPerSession: number): Promise<void> | void;
  deleteSessionEvents(websiteId: string, sessionId: string): Promise<void> | void;
  deleteWebsiteEvents(websiteId: string): Promise<void> | void;
  getEventWebsiteIds(): Promise<Set<string>> | Set<string>;
  getLatestEventTimestamp(websiteId: string, sessionId: string): Promise<number> | number;
}

export type { VisitorSession, HistoryPoint, ActivityEvent };
