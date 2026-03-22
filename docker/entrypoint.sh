#!/bin/sh
set -e

mkdir -p "$(dirname "${DATABASE_PATH:-/data/livedot.db}")"

# start bun server in background
bun run apps/server/index.ts &

# start caddy in foreground
exec caddy run --config /etc/caddy/Caddyfile
