# Implementation Plan — Backend Runtime & Container Deployment

- [x] 1. Remove the gateway path and dead dependencies
  - Move the Spring auth server to `legacy/`, point the app at the API directly (drop the hard-coded ALB URL)
  - Remove `bcrypt`, `mongoose`, Jenkinsfiles, the OpenAI client and its endpoint
  - Rebuild `.env.example` for BE and FE with names and placeholders only
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Upgrade to NestJS 11 / Express 5 / Node 22
  - Exact `@nestjs/*` `11.1.28`, Express `5.2.1`, TypeScript `5.9.3`
  - `forRoutes('{*splat}')`, explicit Swagger array schemas, Jest `src/*` alias
  - Unit 5/5 and e2e `/health` 1/1 passing
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Safe logging
  - HTTP middleware logs method, matched route, status and duration
  - Kakao Axios errors normalized without raw dumps. `no-console: error`
  - _Requirements: 6.1, 6.2_

- [x] 4. Port contract
  - `PORT` first, `3005` fallback, bind `0.0.0.0`. TLS at the platform proxy
  - _Requirements: 3.1, 3.2_

- [x] 5. Multi-stage Docker image
  - Node `22.13.0-alpine`, pinned pnpm, frozen lockfile, prune to production, non-root `node`, `HEALTHCHECK`, `CMD node dist/main.js`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Railway production deployment
  - `railway.json` with Dockerfile builder, watch paths, `/health` 120 s, `ON_FAILURE` × 10
  - Variables set in Railway. Public HTTPS domain created and embedded in production app bundles
  - `/health` returns `200`
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Seal secret variables in Railway after keeping a safe copy elsewhere
  - _Requirements: 5.3_

- [ ] 8. External uptime monitor (Railway checks health only during deploys)
  - _Requirements: 5.2_

- [ ] 9. Production smoke of address, place, route, along-route, place detail and first/second waypoint, and record a CPU / memory / latency baseline
  - _Requirements: 5.4_

- [ ] 10. CI gate (lint, build, tests) required before auto-deploy on the release branch
  - _Requirements: 1.4, 5.1_

- [ ] 11. Environment-specific Nest log levels for development, staging and production
  - _Requirements: 6.1_
