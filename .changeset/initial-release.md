---
"server": minor
"web": minor
"@livedot/db": minor
"@livedot/shared": minor
---

Initial beta release of Livedot — self-hosted, real-time website visitor tracker.

- Real-time visitor tracking with glowing dots on a dark world map
- WebSocket-based live dashboard with animated visitor count
- Website management with create, edit, delete, and tracking snippet
- Auth with Argon2id password hashing and session cookies
- Spam protection: origin validation, rate limiting, bot filtering
- Docker image with Caddy + Bun (multi-arch)
- Drizzle ORM with auto-migrations on startup
