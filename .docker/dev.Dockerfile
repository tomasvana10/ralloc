# syntax=docker.io/docker/dockerfile:1

FROM node:24-alpine

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

# disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# run app
CMD pnpm run dev