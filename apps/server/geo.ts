import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import { createLogger } from "@livedot/logger";

const log = createLogger("geo");
const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH =
  process.env.GEOIP_DB_PATH ??
  resolve(__dirname, "./geo/GeoLite2-City.mmdb");

// Try to load GeoLite2 — fall back to fast-geoip if not present
let mmdbReader: import("mmdb-lib").Reader<Record<string, any>> | null = null;

if (existsSync(DB_PATH)) {
  const { Reader } = await import("mmdb-lib");
  mmdbReader = new Reader(readFileSync(DB_PATH));
  log.info("Using GeoLite2-City (high accuracy)");
} else {
  log.warn("GeoLite2-City.mmdb not found — using fast-geoip (lower accuracy)");
  log.info("For better accuracy run: MAXMIND_LICENSE_KEY=<key> bun geo:download");
}

let publicIp: string | null = null;

async function getPublicIp(): Promise<string | null> {
  if (publicIp) return publicIp;
  try {
    const res = await fetch("https://api.ipify.org?format=text");
    publicIp = (await res.text()).trim();
    return publicIp;
  } catch {
    return null;
  }
}

function isPrivateIp(ip: string) {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "0.0.0.0" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  );
}

export async function resolveGeo(
  ip: string
): Promise<{ lat: number; lng: number } | null> {
  let resolvedIp = ip;

  if (isPrivateIp(ip)) {
    const pub = await getPublicIp();
    if (!pub) return null;
    resolvedIp = pub;
  }

  if (mmdbReader) {
    try {
      const result = mmdbReader.get(resolvedIp) as any;
      const lat = result?.location?.latitude;
      const lng = result?.location?.longitude;
      if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
    } catch {}
  }

  // Fallback to fast-geoip
  const geoip = await import("fast-geoip");
  const result = await geoip.default.lookup(resolvedIp);
  if (!result?.ll) return null;
  return { lat: result.ll[0], lng: result.ll[1] };
}
