# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine AS base

FROM base AS builder

# warning to self: corepack will no longer be included in node >25
RUN corepack enable

WORKDIR /app

# install dependencies
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile

# copy required files
COPY src ./src
COPY public ./public
COPY next.config.ts .
COPY tsconfig.json .
COPY postcss.config.mjs .

# https://github.com/vercel/next.js/discussions/14030
# build-time environment variables
ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}

RUN pnpm run build

FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# run app
CMD ["node", "server.js"]