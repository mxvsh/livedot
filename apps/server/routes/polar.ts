import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { db } from "@livedot/db";
import { user } from "@livedot/db/schema";
import { createLogger } from "@livedot/logger";
import { env } from "../env";
import { polar, planFromProductId } from "../polar";
import { getSessionFromRequest } from "../middleware/auth";
import { reloadWebsiteCache } from "../index";

const log = createLogger("polar");

export const polarRoutes = new Hono()

  // Create a checkout session for upgrading
  .post("/polar/checkout", async (c) => {
    if (!polar) return c.json({ error: "Billing not configured" }, 503);

    const session = await getSessionFromRequest(c.req.raw);
    if (!session) return c.json({ error: "Unauthorized" }, 401);

    const { plan } = await c.req.json();
    const productId = Object.entries(
      await import("../polar").then(m => m.PRODUCT_PLAN_MAP)
    ).find(([, p]) => p === plan)?.[0];

    if (!productId) return c.json({ error: "Invalid plan" }, 400);

    const found = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    log.info({ productId, userId: session.user.id, email: found[0]?.email }, "Creating checkout");

    try {
      const result = await polar.checkouts.create({
        products: [productId],
        customerEmail: found[0]?.email ?? undefined,
        externalCustomerId: session.user.id,
        successUrl: `${env.APP_URL}/?upgraded=1`,
      });

      log.info({ checkoutId: result.id }, "Checkout created");
      return c.json({ url: result.url });
    } catch (err: any) {
      log.error({ err: err?.message, stack: err?.stack }, "Checkout error");
      return c.json({ error: err?.message ?? "Failed to create checkout" }, 500);
    }
  })

  // Polar webhook — handles subscription lifecycle
  .post("/polar/webhook", async (c) => {
    if (!env.POLAR_WEBHOOK_SECRET) return c.json({ error: "Webhook not configured" }, 503);

    const rawBody = await c.req.text();
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((v, k) => { headers[k] = v; });

    let event: ReturnType<typeof validateEvent>;
    try {
      event = validateEvent(rawBody, headers, env.POLAR_WEBHOOK_SECRET);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        log.warn("Webhook signature verification failed");
        return c.json({ error: "Invalid signature" }, 403);
      }
      throw err;
    }

    // Handle subscription events
    if (
      event.type === "subscription.created" ||
      event.type === "subscription.updated" ||
      event.type === "subscription.active"
    ) {
      const sub = event.data;
      const userId = sub.customer.externalId;
      if (!userId) {
        log.warn({ customerId: sub.customer.id }, "No externalId on customer — skipping");
        return c.json({ ok: true });
      }

      const isActive = sub.status === "active" || sub.status === "trialing";
      const plan = isActive ? planFromProductId(sub.productId) : null;

      if (plan) {
        await db.update(user).set({ plan }).where(eq(user.id, userId));
        log.info({ userId, plan }, "User plan updated");
        await reloadWebsiteCache();
      }
    }

    if (
      event.type === "subscription.canceled" ||
      event.type === "subscription.revoked"
    ) {
      const sub = event.data;
      const userId = sub.customer.externalId;
      if (userId) {
        await db.update(user).set({ plan: "free" }).where(eq(user.id, userId));
        log.info({ userId }, "User downgraded to free");
        await reloadWebsiteCache();
      }
    }

    return c.json({ ok: true });
  });
