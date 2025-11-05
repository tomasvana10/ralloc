# ralloc

Todo:
- [ ] Document info for installation and usage on `README.md`
- [ ] i18n (probably)
- [ ] Create `CONTRIBUTING.md`
- [ ] Create support/help page (on the website or on github)
- [ ] Implement group control - UI, websockets, etc.
- [ ] [Containerise](https://github.com/vercel/next.js/tree/canary/examples/with-docker-compose) - include redis image
- [ ] Configure Cloudflare tunnel and security
- [ ] Add reverse mapping for the group a user is in (probably like `host:<hostId>:session:<userId>:<groupName>)
- [ ] Consider Lua scripting to ensure atomicity when joining/leaving a group
- [ ] Consider sliding window rate limits with redis based on user id
- [ ] Consider adding alternative authentication methods (`GitHub`)
- [ ] Revise Redis DB structure for optimisations and removal of redundant keys
- [X] Buy domain `ralloc.xyz`
- [X] Implement home and session viewer
- [X] Implement REST API for sessions
- [X] Add basic Google authentication 
