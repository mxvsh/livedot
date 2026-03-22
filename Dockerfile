FROM oven/bun:1-alpine AS base
WORKDIR /app

# prune monorepo
FROM base AS prune
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune server web --docker

# install all deps + build frontend
FROM base AS build
ARG VERSION=dev
ENV VITE_VERSION=$VERSION
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
COPY tsconfig.json .
RUN bun run --filter web build

# install production deps only
FROM base AS prod-deps
RUN mkdir -p /temp
COPY --from=prune /app/out/json/ /temp/
RUN cd /temp && bun install --frozen-lockfile --production

# production
FROM caddy:2-alpine AS release
RUN apk add --no-cache libstdc++ libgcc
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY --from=prod-deps /temp/node_modules/ node_modules/
COPY --from=build /app/apps/server/ apps/server/
COPY --from=build /app/packages/db/ packages/db/
COPY --from=build /app/packages/shared/ packages/shared/
COPY --from=build /app/package.json .
COPY --from=build /app/apps/web/dist/ /srv/
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh .

ARG VERSION=dev
ENV NODE_ENV=production
ENV VERSION=$VERSION
ENV DATABASE_PATH=/data/livedot.db
ENV GEOIP_DB_PATH=/geo/GeoLite2-City.mmdb
ENV PORT=5550
EXPOSE 80
ENTRYPOINT ["./entrypoint.sh"]
