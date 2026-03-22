#!/usr/bin/env bun
/**
 * Downloads GeoLite2-City.mmdb from MaxMind.
 * Requires a free MaxMind license key: https://www.maxmind.com/en/geolite2/signup
 *
 * Usage:
 *   MAXMIND_LICENSE_KEY=your_key bun scripts/download-geodb.ts
 *   bun scripts/download-geodb.ts --key your_key
 */
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { extract } from "tar";

const __dirname = dirname(fileURLToPath(import.meta.url));

const key =
  process.env.MAXMIND_LICENSE_KEY ??
  process.argv.find((a, i) => process.argv[i - 1] === "--key");

if (!key) {
  console.error("Error: MAXMIND_LICENSE_KEY env var or --key <key> required");
  console.error("Get a free key at: https://www.maxmind.com/en/geolite2/signup");
  process.exit(1);
}

const outDir = resolve(__dirname, "../apps/server/geo");
const outFile = resolve(outDir, "GeoLite2-City.mmdb");

await mkdir(outDir, { recursive: true });

const url = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${key}&suffix=tar.gz`;

console.log("Downloading GeoLite2-City...");
const res = await fetch(url);
if (!res.ok) {
  console.error(`Download failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

// Stream tar.gz → extract the .mmdb file
const tmpTar = resolve(outDir, "geo.tar.gz");
const file = createWriteStream(tmpTar);
await pipeline(res.body as any, file);

console.log("Extracting...");
await extract({
  file: tmpTar,
  cwd: outDir,
  filter: (path) => path.endsWith(".mmdb"),
  strip: 1,
});

// Cleanup tar
await Bun.file(tmpTar).exists() && Bun.spawn(["rm", tmpTar]);

console.log(`Done → ${outFile}`);
