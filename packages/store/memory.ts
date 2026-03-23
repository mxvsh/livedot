import type { StoreAdapter } from "./interface";
import type { VisitorSession, HistoryPoint, ActivityEvent } from "@livedot/shared";

export class MemoryStore implements StoreAdapter {
  private sessions = new Map<string, VisitorSession>();
  private history = new Map<string, HistoryPoint[]>();
  private events = new Map<string, Map<string, ActivityEvent[]>>();

  private key(websiteId: string, sessionId: string) {
    return `${websiteId}:${sessionId}`;
  }

  // ── Sessions ──

  getSession(websiteId: string, sessionId: string): VisitorSession | null {
    return this.sessions.get(this.key(websiteId, sessionId)) ?? null;
  }

  setSession(session: VisitorSession): void {
    this.sessions.set(this.key(session.websiteId, session.sessionId), session);
  }

  deleteSession(websiteId: string, sessionId: string): void {
    this.sessions.delete(this.key(websiteId, sessionId));
  }

  getSessionsForWebsite(websiteId: string): VisitorSession[] {
    const prefix = `${websiteId}:`;
    const result: VisitorSession[] = [];
    for (const [key, session] of this.sessions) {
      if (key.startsWith(prefix)) result.push(session);
    }
    return result;
  }

  getActiveWebsiteIds(): Set<string> {
    const ids = new Set<string>();
    for (const [key] of this.sessions) {
      ids.add(key.split(":")[0]);
    }
    return ids;
  }

  // ── History ──

  getHistory(websiteId: string): HistoryPoint[] {
    return this.history.get(websiteId) ?? [];
  }

  pushHistory(websiteId: string, point: HistoryPoint, maxLength: number): void {
    const arr = this.history.get(websiteId) ?? [];
    arr.push(point);
    if (maxLength > 0 && arr.length > maxLength) {
      arr.splice(0, arr.length - maxLength);
    }
    this.history.set(websiteId, arr);
  }

  setHistory(websiteId: string, history: HistoryPoint[]): void {
    this.history.set(websiteId, [...history]);
  }

  deleteHistory(websiteId: string): void {
    this.history.delete(websiteId);
  }

  getHistoryWebsiteIds(): Set<string> {
    return new Set(this.history.keys());
  }

  // ── Events ──

  getEvents(websiteId: string): [string, ActivityEvent[]][] {
    const websiteEvents = this.events.get(websiteId);
    if (!websiteEvents) return [];
    return [...websiteEvents];
  }

  addEvent(websiteId: string, event: ActivityEvent, maxPerSession: number): void {
    let websiteEvents = this.events.get(websiteId);
    if (!websiteEvents) {
      websiteEvents = new Map();
      this.events.set(websiteId, websiteEvents);
    }
    const existing = websiteEvents.get(event.sessionId) ?? [];
    websiteEvents.set(event.sessionId, [event, ...existing].slice(0, maxPerSession));
  }

  deleteSessionEvents(websiteId: string, sessionId: string): void {
    this.events.get(websiteId)?.delete(sessionId);
  }

  deleteWebsiteEvents(websiteId: string): void {
    this.events.delete(websiteId);
  }

  getEventWebsiteIds(): Set<string> {
    return new Set(this.events.keys());
  }

  getLatestEventTimestamp(websiteId: string, sessionId: string): number {
    const events = this.events.get(websiteId)?.get(sessionId);
    return events?.[0]?.timestamp ?? 0;
  }
}
