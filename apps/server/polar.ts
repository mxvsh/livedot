import { Polar } from "@polar-sh/sdk";
import { env } from "./env";

export const polar = env.POLAR_ACCESS_TOKEN
  ? new Polar({ accessToken: env.POLAR_ACCESS_TOKEN })
  : null;

// Map Polar product IDs → plan names
export const PRODUCT_PLAN_MAP: Record<string, string> = {
  "7526856f-b71f-4238-8b89-1b106a860fe5": "pro",
  "a6c8d69e-c958-4b2d-a362-b66f687eefe2": "max",
};

export function planFromProductId(productId: string): string | null {
  return PRODUCT_PLAN_MAP[productId] ?? null;
}
