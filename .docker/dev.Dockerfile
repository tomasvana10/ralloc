# syntax=docker.io/docker/dockerfile:1

FROM node:20-alpine

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

# telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# run app
CMD npm run dev