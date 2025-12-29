# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

FROM base AS builder

# warning to self: corepack will no longer be included in node >25
RUN corepack enable

WORKDIR /app

# install dependencies
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY packages/core/package.json ./packages/core/
RUN pnpm install --frozen-lockfile

# copy required files
COPY apps/web ./apps/web
COPY packages/core ./packages/core
COPY tsconfig.base.json .

# https://github.com/vercel/next.js/discussions/14030
# build-time environment variables
ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
# prevents error during building
ARG REDIS_URL=redis://dummy_url:6379
ENV REDIS_URL=${REDIS_URL}

RUN pnpm --filter @ralloc/web build

FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/web/public ./public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# run app
CMD ["node", "apps/web/server.js"]