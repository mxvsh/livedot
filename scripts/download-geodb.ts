#!/usr/bin/env bun
/**
 * Downloads GeoLite2-City.mmdb from MaxMind.
 * Requires a free MaxMind license key: https://www.maxmind.com/en/geolite2/signup
 *
 * Usage:
 *   MAXMIND_LICENSE_KEY=your_key bun scripts/download-geodb.ts
 *   bun scripts/download-geodb.ts --key your_key
 */
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const key =
  process.env.MAXMIND_LICENSE_KEY ??
  process.argv.find((a, i) => process.argv[i - 1] === "--key");

if (!key) {
  console.error("Error: MAXMIND_LICENSE_KEY env var or --key <key> required");
  process.exit(1);
}

const outDir = resolve(__dirname, "../apps/server/geo");
const tarPath = resolve(outDir, "geo.tar.gz");
const outFile = resolve(outDir, "GeoLite2-City.mmdb");

await mkdir(outDir, { recursive: true });

const url = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${key}&suffix=tar.gz`;

console.log("Downloading GeoLite2-City...");
const res = await fetch(url);
if (!res.ok) {
  console.error(`Download failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

await Bun.write(tarPath, res);
console.log("Extracting...");

// Extract to temp dir then find the .mmdb (avoids --wildcards which isn't supported on macOS)
const tmpDir = resolve(outDir, "_tmp");
await mkdir(tmpDir, { recursive: true });
const proc = Bun.spawn(["tar", "-xzf", tarPath, "-C", tmpDir], { stdout: "inherit", stderr: "inherit" });
await proc.exited;

const glob = new Bun.Glob("**/*.mmdb");
for await (const file of glob.scan(tmpDir)) {
  await Bun.write(outFile, Bun.file(resolve(tmpDir, file)));
  break;
}
Bun.spawn(["rm", "-rf", tmpDir]);

await Bun.file(tarPath).exists() && Bun.spawn(["rm", "-f", tarPath]);

console.log(`Done → ${outFile}`);
