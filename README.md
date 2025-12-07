![Ralloc logo](public/icon-light.png#gh-light-mode-only)
![Ralloc logo](public/icon-dark.png#gh-dark-mode-only)

# Ralloc

[![Deploy status](https://github.com/tomasvana10/ralloc/actions/workflows/deploy.yml/badge.svg)](https://github.com/tomasvana10/ralloc/actions/workflows/deploy.yml)
[![Release version](https://img.shields.io/github/v/release/tomasvana10/ralloc?sort=semver)](https://github.com/tomasvana10/ralloc/releases)
[![MIT license](https://img.shields.io/github/license/tomasvana10/ralloc)](https://github.com/tomasvana10/ralloc/blob/main/LICENSE)

Ralloc is a web-based tool designed for fast, ephemeral group allocation.

- [Issues](https://github.com/tomasvana10/ralloc/issues)
- [Wiki](https://github.com/tomasvana10/ralloc/wiki)

## Installation and self-hosting

If you are interested in self-hosting Ralloc, follow these steps.

Requirements: [`pnpm`](https://pnpm.io/installation)

1. Clone the repository using `git clone https://github.com/tomasvana10/ralloc`
2. `cd ralloc`
3. Install all dependencies with `pnpm i` if you are using docker. Otherwise, run `pnpm i --dev`.
4. Prevent `redis` background replications from failling under low memory conditions by running `sysctl vm.overcommit_memory=1`.
5. Create however many OAuth applications you want (Ralloc currently uses Google and GitHub).
6. Set up the environment by running `./scripts/setup`. This script will also inform you how Ralloc can be started in development/production.
7. Add your OAuth providers by running `./scripts/add-provider`.

## Todo

### Important

- [ ] (!!!) Write tests
- [ ] (!!) Use renovate for dependency management (after writing tests)
- [ ] Create `CONTRIBUTING.md`
- [ ] Create /about and/or /faq
- [ ] Create support/help page (on the website or on github)
- [ ] Create privacy and usage related markdown documents
- [ ] Implement forced group session expiry (and listen to expiring keys potentially?)
- [ ] Improve page metadata in general and possibly add sitemap
- [ ] `generateMetadata` for group sessions (potentially a custom opengraph/twitter image?)
- [ ] Implement UI features for adding, removing and clearing group members (server-side + hook related stuff is already done)
- [X] (!!!) TOKEN BUCKET RATE LIMITS FOR: websocket AND REST api
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