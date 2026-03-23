export interface WebsiteCacheEntry {
  hostname: string;
  userId: string;
  eventsPerMonth: number; // 0 = unlimited
  eventRetentionMs: number; // 0 = unlimited
  historyMax: number; // 0 = unlimited
  shareToken: string | null;
}

// Cache website IDs → limits derived from owner's plan
export const websiteCache = new Map<string, WebsiteCacheEntry>();
