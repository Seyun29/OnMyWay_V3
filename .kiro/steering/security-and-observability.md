---
inclusion: always
---

# Security & Observability

## Secrets

- Real values live only in git-ignored `.env` files, `~/.gradle/gradle.properties` (`chmod 600`), EAS environments and Railway Variables.
- `.env.example` holds names and placeholders only.
- Never print a key, password, token, certificate fingerprint, project ID or update URL in docs, commits, chat or terminal output.
- Anything committed in the past is treated as exposed and must be rotated. The `legacy/` snapshots keep their structure, but every secret is masked as `<MASKED_...>`.

## API keys (one per purpose, not per environment)

| Key | Restriction | Allowed APIs |
| --- | --- | --- |
| `omw-android` | package `com.omw.omw_front` + debug / Play App Signing SHA-1 | Maps SDK for Android |
| `omw-ios` | bundle `com.omw.onmywayapp` | Maps SDK for iOS |
| `omw-server` | server only (never in the app bundle) | Places API (New), Routes API, Geocoding API |

Mobile SDK keys ship inside the binary, so they are protected by restrictions, not secrecy.
The Kakao REST key and the Google server key exist only on the backend.

## Logging

- HTTP logs contain **method, matched route pattern, status and duration**. Nothing else.
  No IP, headers, query strings, params or bodies.
- No precise coordinates, full routes, raw search text or provider payloads in logs, crash reports or analytics.
- `console.*` is banned in authored FE and BE code (`no-console: error`). The backend uses the Nest `Logger`.
- Swagger (`/docs`) sits behind basic auth (`SWAGGER_USER` / `SWAGGER_PASSWORD`).

## Health & runtime

- `GET /health` → `200 {"success":true,"data":"ok"}`. Used by the Docker `HEALTHCHECK` and the Railway deploy health check.
- The container runs as the non-root `node` user and binds `0.0.0.0:$PORT`. TLS ends at the platform proxy.
- Crash reporting (Sentry or equivalent) is a release TODO. When added, it must redact location, routes, queries and keys, tag environment, version, build, channel, runtime and update ID, and upload dSYM, R8 mapping and JS source maps.
