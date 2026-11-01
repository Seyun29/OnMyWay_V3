# Requirements Document — Backend Runtime & Container Deployment

## Introduction

In 2024 the API ran on NestJS 10 / Node 18 behind a Spring Cloud auth gateway, deployed by Jenkins to
ECS Fargate (and later as Kubernetes manifests, see `legacy/`). Favorites and history were already
on-device, so the gateway no longer protected anything the app needed. This spec upgrades the runtime,
removes the gateway and the Jenkins/ECR/ECS pipeline, and ships the API as a Docker image on Railway.

## Requirements

### Requirement 1 — Runtime upgrade

#### Acceptance Criteria

1. The API SHALL run on NestJS `11.1.x` (exact, aligned across `@nestjs/*`), Express `5.2.1`, Node `22.13.0` and TypeScript `5.9.3`.
2. Express 5 wildcard middleware SHALL use named wildcards (`forRoutes('{*splat}')`).
3. Swagger nested arrays SHALL use explicit `type: array` / `items` schemas.
4. Existing unit tests (5 suites) and the `/health` e2e test SHALL pass after the upgrade.

### Requirement 2 — Simpler topology

**User Story:** As the maintainer, I want one service to operate, so that a solo project does not pay for two runtimes and a gateway.

#### Acceptance Criteria

1. The mobile app SHALL call the API directly. The Spring auth gateway SHALL be moved to `legacy/` and not deployed.
2. Unused dependencies (`bcrypt`, `mongoose`, the OpenAI client and config) SHALL be removed.
3. Jenkinsfiles and ECR/ECS deployment files SHALL be removed from the active code.

### Requirement 3 — Port and network contract

#### Acceptance Criteria

1. The API SHALL listen on `PORT` from the environment, falling back to `3005`, bound to `0.0.0.0`.
2. TLS and public ports 80/443 SHALL be handled by the platform proxy, not by Nest.

### Requirement 4 — Container image

#### Acceptance Criteria

1. The image SHALL be built in two stages from `node:22.13.0-alpine` with pnpm `10.15.1` and `--frozen-lockfile`.
2. The runtime stage SHALL contain only `package.json`, production `node_modules` and `dist`, owned by and running as the non-root `node` user.
3. The image SHALL declare a `HEALTHCHECK` against `/health` and start with `node dist/main.js` (no watchers, no PM2).
4. No secret SHALL be passed as a build `ARG`/`ENV` or copied from `.env`.

### Requirement 5 — Railway deployment

#### Acceptance Criteria

1. `railway.json` SHALL use the Dockerfile builder and watch only `/OnMyWay_BE_V3/**`, so FE- or docs-only commits do not redeploy the API.
2. Deploys SHALL pass the `/health` check within 120 s before traffic switches. Restart policy SHALL be `ON_FAILURE` with at most 10 retries.
3. Secrets (`GOOGLE_MAPS_SERVER_API_KEY`, `KAKAO_API_KEY`, `SWAGGER_USER`, `SWAGGER_PASSWORD`) SHALL live in Railway Variables. `PORT` SHALL be injected by Railway.
4. The production origin SHALL be served over HTTPS and embedded in production app bundles.

### Requirement 6 — Logs that are safe to keep

#### Acceptance Criteria

1. HTTP logs SHALL contain method, matched route pattern, status and duration only.
2. Provider errors SHALL be logged without raw responses, headers or request dumps.
