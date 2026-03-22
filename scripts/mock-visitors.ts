/**
 * Mock visitor simulator for Latty
 *
 * Usage: bun scripts/mock-visitors.ts --project <PROJECT_ID> --count 50
 *
 * Simulates N visitors from real cities around the world,
 * sending beacons every 25s just like the real tracker.
 */

const CITIES = [
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
  { name: "Seoul", lat: 37.5665, lng: 126.978 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792 },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
  { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
  { name: "Moscow", lat: 55.7558, lng: 37.6173 },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456 },
  { name: "Johannesburg", lat: -26.2041, lng: 28.0473 },
  { name: "Lima", lat: -12.0464, lng: -77.0428 },
  { name: "Riyadh", lat: 24.7136, lng: 46.6753 },
  { name: "Kuala Lumpur", lat: 3.139, lng: 101.6869 },
  { name: "Manila", lat: 14.5995, lng: 120.9842 },
  { name: "Bogota", lat: 4.711, lng: -74.0721 },
  { name: "Santiago", lat: -33.4489, lng: -70.6693 },
  { name: "Karachi", lat: 24.8607, lng: 67.0011 },
  { name: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321 },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { name: "Barcelona", lat: 41.3874, lng: 2.1686 },
  { name: "Rome", lat: 41.9028, lng: 12.4964 },
  { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
  { name: "Auckland", lat: -36.8485, lng: 174.7633 },
];

// Parse args
const args = process.argv.slice(2);
let projectId = "";
let count = 20;
let endpoint = "http://localhost:3000";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project" || args[i] === "-p") projectId = args[++i] || "";
  if (args[i] === "--count" || args[i] === "-c") count = parseInt(args[++i] || "20");
  if (args[i] === "--endpoint" || args[i] === "-e") endpoint = args[++i] || endpoint;
}

if (!projectId) {
  console.error("Usage: bun scripts/mock-visitors.ts --project <PROJECT_ID> [--count 20] [--endpoint http://localhost:3000]");
  process.exit(1);
}

// Generate stable visitors
interface MockVisitor {
  sessionId: string;
  city: (typeof CITIES)[number];
  lat: number;
  lng: number;
  pages: string[];
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const visitors: MockVisitor[] = [];
const pages = ["/", "/about", "/pricing", "/docs", "/blog", "/contact", "/signup", "/features"];

for (let i = 0; i < count; i++) {
  const rng = seededRandom(i + 1);
  const city = CITIES[i % CITIES.length]!;
  // Small jitter around city center so dots don't stack exactly
  const lat = city.lat + (rng() - 0.5) * 0.5;
  const lng = city.lng + (rng() - 0.5) * 0.5;

  visitors.push({
    sessionId: `mock-${i.toString().padStart(4, "0")}`,
    city,
    lat,
    lng,
    pages: pages.sort(() => rng() - 0.5).slice(0, 1 + Math.floor(rng() * 3)),
  });
}

console.log(`Simulating ${count} visitors for project ${projectId}`);
console.log(`Endpoint: ${endpoint}`);
console.log(`Cities: ${[...new Set(visitors.map((v) => v.city.name))].join(", ")}`);
console.log(`Press Ctrl+C to stop\n`);

// Send events directly to the sessions module via the API
// But since the API resolves IP → geo, and we want specific locations,
// we'll hit a special mock endpoint or inject directly.
// For simplicity, we'll POST to /api/event but also include lat/lng.
// The server ignores lat/lng from the body, so we need a different approach.
//
// Best approach: bypass the API and connect via WebSocket to see results,
// while directly calling the server's internal session store.
// But since this is a standalone script, let's add a mock mode to the event endpoint.

// Actually, the simplest way: POST events with a special header that includes coords.
// Let's just modify the event handler to accept optional lat/lng in the body for dev.

async function sendBeacon(visitor: MockVisitor) {
  const page = visitor.pages[Math.floor(Math.random() * visitor.pages.length)];
  try {
    await fetch(`${endpoint}/api/event`, {
      method: "POST",
      body: JSON.stringify({
        projectId,
        sessionId: visitor.sessionId,
        url: `https://example.com${page}`,
        _mockLat: visitor.lat,
        _mockLng: visitor.lng,
      }),
    });
  } catch {
    // Server might not be running yet
  }
}

// Initial burst — stagger over 3 seconds
for (let i = 0; i < visitors.length; i++) {
  setTimeout(() => {
    sendBeacon(visitors[i]!);
    console.log(`  → ${visitors[i]!.city.name} (${visitors[i]!.sessionId})`);
  }, (i / visitors.length) * 3000);
}

// Keep alive — send beacons every 25 seconds
setInterval(() => {
  for (const visitor of visitors) {
    sendBeacon(visitor);
  }
  console.log(`\n↻ Sent ${visitors.length} beacons`);
}, 25_000);
