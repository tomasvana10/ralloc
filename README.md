![Ralloc logo](apps/web/public/icon-light.png#gh-light-mode-only)
![Ralloc logo](apps/web/public/icon-dark.png#gh-dark-mode-only)

# Ralloc

[![Deploy status](https://github.com/tomasvana10/ralloc/actions/workflows/deploy.yml/badge.svg)](https://github.com/tomasvana10/ralloc/actions/workflows/deploy.yml)
[![Release version](https://img.shields.io/github/v/release/tomasvana10/ralloc?sort=semver)](https://github.com/tomasvana10/ralloc/releases)
[![MIT license](https://img.shields.io/github/license/tomasvana10/ralloc)](https://github.com/tomasvana10/ralloc/blob/main/LICENSE)

`Ralloc` is a web-based tool designed for fast group allocation.

- [Issues](https://github.com/tomasvana10/ralloc/issues)
- [Wiki](https://github.com/tomasvana10/ralloc/wiki)

## Purpose

`Ralloc` was designed to be a fast, intuitive tool to allow large quantities of people to allocate themselves to groups. 

It orchestrates group allocation sessions similar to Kahoot or Blooket, whereby a host provides some details and the service generates a unique join code, allowing clients to join anonymously (`Ralloc` also provides anonymous authentication on top of `OAuth`).

One issue that `Ralloc` directly solves (which was my inspiration for beginning its development) is the time-consuming process of manually providing cybersecurity students network router IP addresses (and tracking thereof) whenever they finish their theory lab work. Using the web-based tool, students can simply head to `ralloc.xyz`, enter the 6-digit session code (which can be showcased through a dedicated "advertisement" dialog by the host), and select a group, named as an IP address.

## Features

- Easily self-hostable through `Docker`.
- Supports `OAuth` and anonymous authentication.
- Rapid group creation through use of a generative expression, aka the "group seed" (e.g. `[group 1-500]`, `group [a-z][1-3]`, `group a, group c, group 67`).
- Disk-space efficient through utilisation of standalone `NextJS` builds.
- Supports group creation/deletion and removal of users from groups.
- Great user experience

## Installation and Self-Hosting

If you are interested in self-hosting `Ralloc`, follow these steps.

Requirements: [`pnpm`](https://pnpm.io/installation)

1. Clone the repository using `git clone https://github.com/tomasvana10/ralloc`
2. `cd ralloc`
3. If you are using docker, install dev dependencies using `pnpm i --dev`. Otherwise, install all dependencies using `pnpm i`.
4. Prevent `redis` background replications from failling under low memory conditions by running `sysctl vm.overcommit_memory=1`.
6. Set up the environment by running `./scripts/setup`. This script will also inform you how `Ralloc` can be started in development/production.
7. Add your OAuth providers by running `./scripts/add-provider`.

## Environment Variable Reference

### `apps/web`

`.env.local`: 
- Used solely for global authentication secret/id pairs and the `NextAuth` authentication secret.

`.env.development` and `.env.production`:
- Scoped authentication secret/id pairs
- `URL`: base `NextJS` url.
- `AUTH_URL`: `NextAuth` base URL for callbacks and redirects (same as `URL`).

`.env.production`:
- `AUTH_DOMAIN`: optional value for `NextAuth` to ensure cookies are preserved across subdomains.

### `apps/ws`

`.env.development` and `.env.production`:
- `WS_HOST`: hostname of the WebSocket server (default `0.0.0.0`).
- `WS_PORT`: port of the WebSocket server (default `6767`).
- `WS_URL`: URL of the WebSocket server.

### `packages/core`

`.env.development` and `.env.production`:
- `REDIS_URL`: URL of the redis database.
- `ENABLE_RATELIMITING`: A value of either `0` or `1` which determines if `next` API routes are protected by a token-bucket rate limiter.
- `ENABLE_GUEST_AUTH`: A value of either `0` or `1` which determines if the signing in as a "guest" is enabled. Signing in as a guest generates a random user ID, meaning the user cannot access their data once they sign out (and so it is deleted).


## Todo

### Important

- [ ] (!!!) Write tests
- [ ] (!!) Use renovate for dependency management (after writing tests)
- [ ] Create `CONTRIBUTING.md`
- [ ] Create /about and/or /faq
- [ ] Create support/help page (on the website or on github)
- [ ] Create privacy and usage related markdown documents
- [ ] Improve page metadata in general and possibly add sitemap
- [ ] `generateMetadata` for group sessions (potentially a custom opengraph/twitter image?)
- [X] (!!!) TOKEN BUCKET RATE LIMITS FOR: websocket AND REST api
- [X] (not planned) Implement forced group session expiry (and listen to expiring keys potentially?)
- [X] Implement UI features for adding, removing and clearing group members (server-side + hook related stuff is already done)
- [X] Create a logo
- [X] Implement group control - UI, websockets, etc.
- [X] Document info for installation and usage on `README.md`
- [X] Add redis publishers in REST api for **deletion** and **patching**, and redis subscribers in ws UPGRADE() (and send new sync payloads to all clients)
- [X] Lua scripting to ensure atomicity when joining/leaving a group
- [X] Revise Redis DB structure for optimisations and removal of redundant keys
- [X] Add reverse mapping for the group a user is in (probably like `host:<hostId>:session:<code>:user:<userId>:<groupName>`)
- [X] Add alternative authentication methods (`GitHub`)
- [x] [Containerise](https://github.com/vercel/next.js/tree/canary/examples/with-docker-compose) - include redis image
- [x] Configure Cloudflare tunnel and security
- [x] Buy domain `ralloc.xyz`
- [x] Implement home and session viewer
- [x] Implement REST API for sessions
- [x] Add basic Google authentication

### To consider
- [ ] i18n through `next-intl` (probably - consider using POEditor from the github education pack. aim to support japanese, czech, french and korean)
- [ ] Make a wiki
- [ ] Support joining multiple groups (probably not)
- [ ] Individual group freezing (should be pretty easy if I need to do it)
- [X] Support for deleting and adding groups