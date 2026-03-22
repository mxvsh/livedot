FROM oven/bun:1-alpine AS base
WORKDIR /app

# prune monorepo
FROM base AS prune
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune server web --docker

# install all deps + build frontend
FROM base AS build
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
FROM base AS release
COPY --from=prod-deps /temp/node_modules/ node_modules/
COPY --from=build /app/apps/server/ apps/server/
COPY --from=build /app/packages/db/ packages/db/
COPY --from=build /app/packages/shared/ packages/shared/
COPY --from=build /app/package.json .
COPY --from=build /app/apps/web/dist/ apps/server/static/
COPY docker/entrypoint.sh .

USER bun
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/livedot.db
ENV PORT=5550
EXPOSE 5550/tcp
ENTRYPOINT ["./entrypoint.sh"]
