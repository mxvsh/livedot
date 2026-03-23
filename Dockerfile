FROM oven/bun:1-alpine AS base
WORKDIR /app

# prune monorepo
FROM base AS prune
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune server web --docker

# install deps + build server only (no web build)
FROM base AS build-server
COPY --from=prune /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prune /app/out/full/ .
COPY tsconfig.json .

# build web frontend (only used in local Docker builds)
FROM base AS build-web
ARG APP_VERSION=dev
ENV VITE_VERSION=$APP_VERSION
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

# runtime base — server + prod deps, no web dist
FROM caddy:2-alpine AS runtime-base
RUN apk add --no-cache libstdc++ libgcc
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY --from=prod-deps /temp/node_modules/ node_modules/
COPY --from=build-server /app/apps/server/ apps/server/
COPY --from=build-server /app/packages/ packages/
COPY --from=build-server /app/package.json .
RUN bun install --production
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY docker/entrypoint.sh .
ARG APP_VERSION=dev
ENV NODE_ENV=production
ENV APP_VERSION=$APP_VERSION
ENV DATABASE_PATH=/data/livedot.db
ENV PORT=5550
EXPOSE 80

# local build — web built inside Docker
FROM runtime-base AS runtime
COPY --from=build-web /app/apps/web/dist/ /srv/
ENTRYPOINT ["./entrypoint.sh"]

# CI build — web dist pre-built and passed in via build context
FROM runtime-base AS runtime-ci
COPY apps/web/dist/ /srv/
ENTRYPOINT ["./entrypoint.sh"]
