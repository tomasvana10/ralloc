# syntax=docker/dockerfile:1

FROM node:25-trixie-slim

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

CMD ["pnpm", "--filter", "@ralloc/ws", "dev"]