#!/bin/sh
set -e

mkdir -p "$(dirname "${DATABASE_PATH:-/data/livedot.db}")"

exec bun run apps/server/index.ts
