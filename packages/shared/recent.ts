import type { HistoryPoint } from "./types";

const RECENT_RE = /^(\d+)([smhd])$/i;
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
export const SUPPORTED_RECENT_WINDOWS = ["10m", "1h", "24h", "7d"] as const;
export type SupportedRecentWindow = (typeof SUPPORTED_RECENT_WINDOWS)[number];
export const ROLLUP_RECENT_WINDOWS = ["1h", "24h", "7d"] as const;
export type RollupRecentWindow = (typeof ROLLUP_RECENT_WINDOWS)[number];

export function parseRecentWindow(value?: string | null): number | null {
  if (!value) return null;

  const match = value.trim().match(RECENT_RE);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) return null;

  switch (unit) {
    case "s": return amount * 1_000;
    case "m": return amount * 60_000;
    case "h": return amount * 3_600_000;
    case "d": return amount * 86_400_000;
    default: return null;
  }
}

export function filterHistoryByRecent(history: HistoryPoint[], recentMs?: number | null): HistoryPoint[] {
  if (!recentMs || history.length === 0) return history;

  const cutoff = history[history.length - 1]!.time - recentMs;
  return history.filter((point) => point.time >= cutoff);
}

export function supportedRecentWindow(value?: string | null): SupportedRecentWindow | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return SUPPORTED_RECENT_WINDOWS.find((window) => window === normalized) ?? null;
}

export function durationForRecent(recent: SupportedRecentWindow): number {
  switch (recent) {
    case "10m": return 10 * MINUTE;
    case "1h": return HOUR;
    case "24h": return 24 * HOUR;
    case "7d": return 7 * DAY;
  }
}

export function resolutionForRecent(recent: RollupRecentWindow | null | undefined): number | null {
  if (!recent) return null;
  switch (recent) {
    case "1h": return MINUTE;
    case "24h": return 10 * MINUTE;
    case "7d": return HOUR;
  }
}

export function aggregateHistoryByResolution(history: HistoryPoint[], resolutionMs?: number | null): HistoryPoint[] {
  if (!resolutionMs || history.length <= 1) return history;

  const buckets = new Map<number, { total: number; count: number; time: number }>();

  for (const point of history) {
    const bucketKey = Math.floor(point.time / resolutionMs) * resolutionMs;
    const existing = buckets.get(bucketKey);
    if (existing) {
      existing.total += point.count;
      existing.count += 1;
      existing.time = point.time;
    } else {
      buckets.set(bucketKey, { total: point.count, count: 1, time: point.time });
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => ({
      time: bucket.time,
      count: Math.round(bucket.total / bucket.count),
    }));
}
