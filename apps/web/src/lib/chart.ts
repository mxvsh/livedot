import type { HistoryPoint } from "@livedot/shared";

const DEFAULT_MAX_POINTS = 30;

export function aggregateHistoryPoints(history: HistoryPoint[], maxPoints = DEFAULT_MAX_POINTS): HistoryPoint[] {
  if (history.length <= maxPoints) return history;

  const bucketSize = Math.ceil(history.length / maxPoints);
  const aggregated: HistoryPoint[] = [];

  for (let i = 0; i < history.length; i += bucketSize) {
    const bucket = history.slice(i, i + bucketSize);
    if (bucket.length === 0) continue;

    const total = bucket.reduce((sum, point) => sum + point.count, 0);
    const last = bucket[bucket.length - 1]!;

    aggregated.push({
      time: last.time,
      count: Math.round(total / bucket.length),
    });
  }

  return aggregated;
}
