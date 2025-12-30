# syntax=docker/dockerfile:1

FROM node:25-trixie-slim AS base
FROM base as builder

RUN npm install -g pnpm

WORKDIR /app

# install dependencies
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json .npmrc* ./
COPY apps/ws/package.json ./apps/ws/
COPY packages/core/package.json ./packages/core/

RUN pnpm install --frozen-lockfile

# copy required files
COPY apps/ws ./apps/ws
COPY packages/core ./packages/core
COPY tsconfig.base.json . 

RUN pnpm --filter @ralloc/ws build

FROM base as runner

WORKDIR /app

# don't run production as root
RUN addgroup --system --gid 1002 wsgroup
RUN adduser --system --uid 1002 ws
USER ws

COPY --from=builder /app/node_modules/.pnpm/uWebSockets.js*/node_modules/uWebSockets.js ./node_modules/uWebSockets.js
COPY --from=builder /app/apps/ws/dist ./dist
COPY --from=builder /app/packages/core/src/db/lua /packages/core/src/db/lua

CMD ["node", "dist/index.js"]