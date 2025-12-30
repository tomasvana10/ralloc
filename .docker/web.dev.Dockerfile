# syntax=docker/dockerfile:1

FROM node:24-alpine

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

# disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# run app
CMD ["pnpm", "--filter", "@ralloc/web", "dev"]