# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine AS base

FROM base AS builder

WORKDIR /app

# copy npm package and lockfile + install dependencies
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci

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

RUN npm run build

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

# telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# run app
CMD ["node", "server.js"]