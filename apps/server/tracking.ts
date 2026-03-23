import { getClient } from "@umami/api-client";
import { createLogger } from "@livedot/logger";
import { env } from "./env";

const log = createLogger("tracking");

let client: ReturnType<typeof getClient> | null = null;

function getTracker() {
  if (!env.UMAMI_URL || !env.UMAMI_WEBSITE_ID || !env.UMAMI_API_TOKEN) return null;
  if (!client) {
    client = getClient();
    client.setConfig({ hostUrl: env.UMAMI_URL, apiKey: env.UMAMI_API_TOKEN });
  }
  return client;
}

export async function trackEvent(eventName: string, data?: Record<string, string | number | boolean>) {
  const tracker = getTracker();
  if (!tracker) return;
  try {
    await tracker.sendEvent({
      websiteId: env.UMAMI_WEBSITE_ID!,
      name: eventName,
      data,
    });
    log.debug({ eventName, data }, "Event tracked");
  } catch (err) {
    log.warn({ err, eventName }, "Failed to track event");
  }
}
