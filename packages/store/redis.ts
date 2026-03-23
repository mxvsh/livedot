import Redis from "ioredis";
import type { StoreAdapter } from "./interface";
import type { VisitorSession, HistoryPoint, ActivityEvent } from "@livedot/shared";

const P = "ld:";

export class RedisStore implements StoreAdapter {
  private redis: Redis;

  constructor(url: string) {
    this.redis = new Redis(url);
  }

  // ── Key helpers ──

  private sk(websiteId: string, sessionId: string) { return `${P}s:${websiteId}:${sessionId}`; }
  private siKey(websiteId: string) { return `${P}si:${websiteId}`; }
  private hk(websiteId: string) { return `${P}h:${websiteId}`; }
  private ek(websiteId: string, sessionId: string) { return `${P}e:${websiteId}:${sessionId}`; }
  private eiKey(websiteId: string) { return `${P}ei:${websiteId}`; }

  // ── Sessions ──

  async getSession(websiteId: string, sessionId: string): Promise<VisitorSession | null> {
    const raw = await this.redis.get(this.sk(websiteId, sessionId));
    return raw ? JSON.parse(raw) : null;
  }

  async setSession(session: VisitorSession): Promise<void> {
    const pipe = this.redis.pipeline();
    pipe.set(this.sk(session.websiteId, session.sessionId), JSON.stringify(session));
    pipe.sadd(this.siKey(session.websiteId), session.sessionId);
    await pipe.exec();
  }

  async deleteSession(websiteId: string, sessionId: string): Promise<void> {
    const pipe = this.redis.pipeline();
    pipe.del(this.sk(websiteId, sessionId));
    pipe.srem(this.siKey(websiteId), sessionId);
    await pipe.exec();
  }

  async getSessionsForWebsite(websiteId: string): Promise<VisitorSession[]> {
    const ids = await this.redis.smembers(this.siKey(websiteId));
    if (ids.length === 0) return [];
    const values = await this.redis.mget(...ids.map((id) => this.sk(websiteId, id)));
    return values.filter(Boolean).map((v) => JSON.parse(v!) as VisitorSession);
  }

  async getActiveWebsiteIds(): Promise<Set<string>> {
    const keys = await this.redis.keys(`${P}si:*`);
    const ids = new Set<string>();
    for (const key of keys) {
      const count = await this.redis.scard(key);
      if (count > 0) ids.add(key.slice(`${P}si:`.length));
    }
    return ids;
  }

  // ── History ──

  async getHistory(websiteId: string): Promise<HistoryPoint[]> {
    const raw = await this.redis.lrange(this.hk(websiteId), 0, -1);
    return raw.map((v) => JSON.parse(v) as HistoryPoint);
  }

  async pushHistory(websiteId: string, point: HistoryPoint, maxLength: number): Promise<void> {
    const key = this.hk(websiteId);
    const pipe = this.redis.pipeline();
    pipe.rpush(key, JSON.stringify(point));
    if (maxLength > 0) pipe.ltrim(key, -maxLength, -1);
    await pipe.exec();
  }

  async setHistory(websiteId: string, history: HistoryPoint[]): Promise<void> {
    const key = this.hk(websiteId);
    const pipe = this.redis.pipeline();
    pipe.del(key);
    if (history.length > 0) {
      pipe.rpush(key, ...history.map((point) => JSON.stringify(point)));
    }
    await pipe.exec();
  }

  async deleteHistory(websiteId: string): Promise<void> {
    await this.redis.del(this.hk(websiteId));
  }

  async getHistoryWebsiteIds(): Promise<Set<string>> {
    const keys = await this.redis.keys(`${P}h:*`);
    return new Set(keys.map((k) => k.slice(`${P}h:`.length)));
  }

  // ── Events ──

  async getEvents(websiteId: string): Promise<[string, ActivityEvent[]][]> {
    const sessionIds = await this.redis.smembers(this.eiKey(websiteId));
    const result: [string, ActivityEvent[]][] = [];
    for (const sessionId of sessionIds) {
      const raw = await this.redis.lrange(this.ek(websiteId, sessionId), 0, -1);
      if (raw.length > 0) {
        result.push([sessionId, raw.map((v) => JSON.parse(v) as ActivityEvent)]);
      }
    }
    return result;
  }

  async addEvent(websiteId: string, event: ActivityEvent, maxPerSession: number): Promise<void> {
    const key = this.ek(websiteId, event.sessionId);
    const pipe = this.redis.pipeline();
    pipe.lpush(key, JSON.stringify(event));
    pipe.ltrim(key, 0, maxPerSession - 1);
    pipe.sadd(this.eiKey(websiteId), event.sessionId);
    await pipe.exec();
  }

  async deleteSessionEvents(websiteId: string, sessionId: string): Promise<void> {
    const pipe = this.redis.pipeline();
    pipe.del(this.ek(websiteId, sessionId));
    pipe.srem(this.eiKey(websiteId), sessionId);
    await pipe.exec();
  }

  async deleteWebsiteEvents(websiteId: string): Promise<void> {
    const sessionIds = await this.redis.smembers(this.eiKey(websiteId));
    const pipe = this.redis.pipeline();
    for (const id of sessionIds) pipe.del(this.ek(websiteId, id));
    pipe.del(this.eiKey(websiteId));
    await pipe.exec();
  }

  async getEventWebsiteIds(): Promise<Set<string>> {
    const keys = await this.redis.keys(`${P}ei:*`);
    return new Set(keys.map((k) => k.slice(`${P}ei:`.length)));
  }

  async getLatestEventTimestamp(websiteId: string, sessionId: string): Promise<number> {
    const raw = await this.redis.lindex(this.ek(websiteId, sessionId), 0);
    if (!raw) return 0;
    return (JSON.parse(raw) as ActivityEvent).timestamp;
  }
}
