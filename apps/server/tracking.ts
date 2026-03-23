import umami from "@umami/node";
import { createLogger } from "@livedot/logger";
import { env } from "./env";

const log = createLogger("tracking");

let initialized = false;

function init() {
  if (initialized || !env.UMAMI_URL || !env.UMAMI_WEBSITE_ID) return false;
  umami.init({ websiteId: env.UMAMI_WEBSITE_ID, hostUrl: env.UMAMI_URL });
  initialized = true;
  return true;
}

export async function trackEvent(eventName: string, data?: Record<string, string | number | boolean>) {
  if (!init()) return;
  try {
    await umami.track(eventName, data);
    log.debug({ eventName, data }, "Event tracked");
  } catch (err) {
    log.warn({ err, eventName }, "Failed to track event");
  }
}
