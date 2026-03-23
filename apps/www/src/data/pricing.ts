import { PLANS, planLabel, type PlanConfig, type PlanId } from "@livedot/shared/plans";

export type BillingMode = "Open source" | "Cloud";

export type PricingPlan = {
  id: PlanId;
  label: string;
  config: PlanConfig;
  mode: BillingMode;
  headline: string;
  summary: string;
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
};

const orderedPlanIds: PlanId[] = ["ce", "free", "pro", "max"];

const planDetails: Record<PlanId, Omit<PricingPlan, "id" | "label" | "config">> = {
  ce: {
    mode: "Open source",
    headline: "Self-managed infrastructure for teams that run it themselves.",
    summary: "Deploy Livedot on your own stack and control how far you want to scale sites, event volume, retention, and history.",
    ctaLabel: "View on GitHub",
    ctaHref: "https://github.com/mxvsh/livedot",
  },
  free: {
    mode: "Cloud",
    headline: "A lightweight cloud tier for one site.",
    summary: "Use it to try the live map, validate setup, and monitor one property with short retention.",
    ctaLabel: "Start Free",
    ctaHref: "https://cloud.livedot.dev",
  },
  pro: {
    mode: "Cloud",
    headline: "More headroom for growing products.",
    summary: "Built for teams that need more monthly event volume, deeper retention, and room for a few sites.",
    ctaLabel: "Open Cloud",
    ctaHref: "https://cloud.livedot.dev",
    featured: true,
  },
  max: {
    mode: "Cloud",
    headline: "High-capacity limits for larger traffic.",
    summary: "Built for teams monitoring more sites, heavier event volume, and a full week of retained live traffic.",
    ctaLabel: "Talk to Us",
    ctaHref: "mailto:hello@livedot.dev",
  },
};

export const formatCount = (value: number, unit: string) => {
  if (value === 0) return `Self-managed ${unit}`;
  const singular = unit.endsWith("s") ? unit.slice(0, -1) : unit;
  const label = value === 1 ? singular : unit;
  return `${new Intl.NumberFormat("en-US").format(value)} ${label}`;
};

export const formatRetention = (eventRetentionMs: number) => {
  if (eventRetentionMs === 0) return "Self-managed event retention";

  const minutes = eventRetentionMs / 60_000;
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} of event retention`;

  const hours = eventRetentionMs / 3_600_000;
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} of event retention`;

  const days = eventRetentionMs / 86_400_000;
  return `${days} ${days === 1 ? "day" : "days"} of event retention`;
};

export const formatHistory = (historyMax: number) => {
  if (historyMax === 0) return "Self-managed live traffic history";

  const totalSeconds = historyMax * 5;
  if (totalSeconds < 3600) {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} of live traffic`;
  }

  if (totalSeconds < 86_400) {
    const hours = Math.round(totalSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} of live traffic`;
  }

  const days = Math.round(totalSeconds / 86_400);
  return `${days} ${days === 1 ? "day" : "days"} of live traffic`;
};

export const pricingPlans: PricingPlan[] = orderedPlanIds.map((id) => ({
  id,
  label: planLabel(id),
  config: PLANS[id],
  ...planDetails[id],
}));

export const cloudPricingPlans = pricingPlans.filter((plan) => plan.mode === "Cloud");
export const selfHostedPlan = pricingPlans.find((plan) => plan.id === "ce")!;
