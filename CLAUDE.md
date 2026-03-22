# Latty

Self-hosted, real-time website visitor tracker. Shows live visitors as glowing dots on a dark world map.

## Stack

- **Monorepo**: Bun workspaces (`apps/` + `packages/`)
- **Backend**: Hono on Bun.serve() with WebSocket pub/sub (`apps/server`)
- **Frontend**: Vite + React 19 + TanStack Router + Tailwind 4 + HeroUI (`apps/web`)
- **DB**: Drizzle ORM + bun:sqlite (dev) / D1 (prod) (`packages/db`)
- **Shared types**: `packages/shared`
- **Tracker snippet**: `packages/tracker` — embeddable `<script>` tag
- **Icons**: `@hugeicons/core-free-icons` + `@hugeicons/react`
- **Animations**: `motion` (framer-motion)
- **Font**: Poppins

## Architecture

- Users create "websites", get a tracking snippet (`data-website="<id>"`)
- Tracker sends beacons to `/api/event` every 25s
- Server resolves IP → lat/lng via `fast-geoip`, stores sessions in-memory
- WebSocket broadcasts upsert/remove to dashboard subscribers per website
- Sessions expire after 30s of inactivity (5s sweep interval)
- Auth: username/password with Argon2id, session cookies

## Key Commands

- `bun run dev` — starts both server (:3000) and web (:5173)
- `bun run dev:server` / `bun run dev:web` — individual
- `bunx drizzle-kit push` — sync DB schema
- `bun scripts/mock-visitors.ts --website <ID> --count 200` — simulate visitors

## Routes

- `/` — website list (centered, max-w-2xl)
- `/websites/$websiteId` — full-screen map with floating tab switcher + dock
- `/login` — sign in
- `/setup` — first-run admin account creation

## API Endpoints

- `POST /api/event` — tracker ingestion (public, no auth)
- `GET/POST /api/websites` — CRUD (auth required)
- `DELETE /api/websites/:id`
- `GET /api/status` / `POST /api/setup` / `POST /api/login` / `POST /api/logout`
- `GET /ws?website=<id>` — WebSocket for live session updates

## Conventions

- Use Bun everywhere — no Node.js, no npm/pnpm
- Dark mode only (no light mode)
- Entity naming: "website" not "project"
- HeroUI components for forms, cards, modals, tooltips, buttons
- Hugeicons for all icons
- Motion for animations (entrance, tab switches, number counting)
