import geoip from "fast-geoip";

let publicIp: string | null = null;

// Fetch this machine's public IP once for dev fallback
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

  // In dev, local IPs have no geo — use the machine's public IP instead
  if (isPrivateIp(ip)) {
    const pub = await getPublicIp();
    if (!pub) return null;
    resolvedIp = pub;
  }

  const result = await geoip.lookup(resolvedIp);
  if (!result?.ll) return null;
  return { lat: result.ll[0], lng: result.ll[1] };
}
