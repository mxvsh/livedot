export interface WebsiteCacheEntry {
  hostname: string;
  maxConcurrent: number; // 0 = unlimited
  eventRetentionMs: number; // 0 = unlimited
  historyMax: number; // 0 = unlimited
}

// Cache website IDs → limits derived from owner's plan
export const websiteCache = new Map<string, WebsiteCacheEntry>();
