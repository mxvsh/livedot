export interface PlanConfig {
  maxWebsites: number;     // 0 = unlimited
  eventsPerMonth: number;  // 0 = unlimited
  eventRetentionMs: number; // 0 = unlimited
  historyMax: number;      // 0 = unlimited (number of 5s samples)
}

export const PLANS = {
  ce:   { maxWebsites: 0, eventsPerMonth: 0,           eventRetentionMs: 0,                  historyMax: 0 },
  free: { maxWebsites: 1,  eventsPerMonth: 10_000,     eventRetentionMs: 10 * 60_000,        historyMax: 120 },
  pro:  { maxWebsites: 5,  eventsPerMonth: 100_000,    eventRetentionMs: 24 * 3_600_000,     historyMax: 17_280 },
  max:  { maxWebsites: 20, eventsPerMonth: 1_000_000,  eventRetentionMs: 7 * 86_400_000,     historyMax: 120_960 },
} as const satisfies Record<string, PlanConfig>;

export type PlanId = keyof typeof PLANS;

export function getPlan(planId: string): PlanConfig {
  return PLANS[planId as PlanId] ?? PLANS.free;
}

export function resolveUserLimits(plan: PlanConfig, overrides?: Partial<PlanConfig>): PlanConfig {
  if (!overrides) return plan;
  return {
    maxWebsites: overrides.maxWebsites ?? plan.maxWebsites,
    eventsPerMonth: overrides.eventsPerMonth ?? plan.eventsPerMonth,
    eventRetentionMs: overrides.eventRetentionMs ?? plan.eventRetentionMs,
    historyMax: overrides.historyMax ?? plan.historyMax,
  };
}

/** Display-friendly plan name */
export function planLabel(planId: string): string {
  switch (planId) {
    case "ce": return "Community";
    case "free": return "Free";
    case "pro": return "Pro";
    case "max": return "Max";
    default: return planId;
  }
}
