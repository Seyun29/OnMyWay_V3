# OnMyWay · Search places along your route

Pick an origin and a destination. OnMyWay searches the whole route for places and shows how many extra minutes each stop would add.

<p>
  <a href="https://apps.apple.com/pl/app/on-my-way-%EA%B2%BD%EB%A1%9C-%EC%A3%BC%EB%B3%80-%EC%9E%A5%EC%86%8C-%EA%B2%80%EC%83%89%EC%9D%84-%ED%95%9C%EB%88%88%EC%97%90/id6503656527"><img height="44" alt="Download on the App Store" src="https://img.shields.io/badge/App_Store-Download-0D96F6?style=for-the-badge&logo=apple&logoColor=white"></a>
  &nbsp;
  <a href="https://play.google.com/store/apps/details?id=com.omw.omw_front"><img height="44" alt="Get it on Google Play" src="https://img.shields.io/badge/Google_Play-Download-34A853?style=for-the-badge&logo=googleplay&logoColor=white"></a>
</p>

- **App Store**: <https://apps.apple.com/pl/app/on-my-way-%EA%B2%BD%EB%A1%9C-%EC%A3%BC%EB%B3%80-%EC%9E%A5%EC%86%8C-%EA%B2%80%EC%83%89%EC%9D%84-%ED%95%9C%EB%88%88%EC%97%90/id6503656527>
- **Google Play**: <https://play.google.com/store/apps/details?id=com.omw.omw_front>

<img width="360" alt="OnMyWay" src="https://github.com/user-attachments/assets/06806b05-ce76-46f7-915b-67d33f3513fc">

> I built and shipped OnMyWay by hand in 2024, and rebuilt it in August 2026.
> The original code (React Native 0.73, NestJS 10, a Spring Cloud auth server, AWS ECS + Jenkins) was migrated **with Kiro in about three weeks**
> to React Native 0.86, NestJS 11 and a Docker image deployed on Railway. I also added English support, overseas routes, Google Maps, a visible search radius and automatic waypoint insertion.
>
> **This repository is in post-launch operation.** iOS 3.0.0 went live on the App Store on 2026-08-23, and the backend runs as a Docker container on Railway.
> The new Android build is signed and ready as an AAB. Google Play still serves 2.1.2.

## Then and now

| | 2024 (written by hand) | 2026 (migrated with Kiro) |
| --- | --- | --- |
| App | React Native 0.73.6, React 18 | React Native 0.86.2, React 19 (New Architecture, Hermes) |
| State and styling | Recoil, NativeWind 2 | Zustand 5, NativeWind 4 |
| OTA updates | CodePush (App Center retired in March 2025) | EAS Update (`expo-updates`, Expo SDK 57) |
| Server | NestJS 10, Node 18 | NestJS 11, Express 5, Node 22 |
| Map data | Kakao | Kakao + Google Maps Platform (picked by language and coordinates) |
| Map tiles | Naver Map | Naver Map or Google Map, user's choice |
| Auth | Spring Security + Spring Cloud Gateway server | Removed. Favorites and recent searches live on the device, so the app no longer needed a login server |
| Deployment | Jenkins → ECR → ECS Fargate (later Kubernetes manifests) | Multi-stage Docker image → Railway (containerized deployment) |
| Removed | | OpenAI review summaries, Kakao web scraping, TMap native SDK, CodePush and App Center |

## What's new

- **English support.** The first launch picks the language from the device. After that, the app setting wins. Every request sends it to the server as `Accept-Language`.
- **Overseas routes.** If every route point is outside Korea, the route comes from Google Routes. If any point is in Korea, it comes from Kakao.
- **Choice of map.** Naver Map or Google Map. The map on screen and the data source are independent.
- **Visible search radius.** The selected route is buffered by the radius (km) and drawn lightly on the map, so you can see and adjust the search area before searching.
- **Automatic waypoint insertion.** A found place is tried before, between and after the existing waypoints in parallel, and the fastest position wins.
- **Place details.** Opening status, hours, parking and rating are fetched once, only for the place the user opens.
- **Navigation handoff.** Korean routes open Naver Map, overseas routes open Google Maps, with the waypoint order kept.

## Decisions

1. **Korean routes use Kakao only.** Google Routes returned empty routes for valid Korean coordinates, and Google's coverage table lists driving directions in Korea as unavailable. So the route provider is chosen by coordinates, not by language. A server-side geofence decides what counts as Korea (including Jeju, the western islands, Ulleungdo and Dokdo).
2. **No automatic fallback between providers.** Hiding a failure behind another provider makes the source of a result unclear and brings cost and terms-of-use problems. Errors are mapped to five fixed codes (quota, auth, timeout, unavailable, invalid response), and raw provider responses never reach the client or the logs.
3. **Unknown is not false.** Showing "no parking" for a place without parking data would be wrong. Every optional field carries `KNOWN`, `UNKNOWN` or `UNSUPPORTED`.
4. **The requested fields set the price.** Google Places pricing depends on the FieldMask, and the parking field alone moves a request to a higher SKU. Details are fetched only for the place the user picked, never for the whole list. Along-route search on Google is capped at 10 search points and 3 pages each, so one search never exceeds 30 requests.
5. **OTA shipped in the first binary.** CodePush is gone, and a binary without an OTA client would need another store review just to add one. Update code signing ($199/month plan) is on hold while the app has no accounts or payments. Instead, an explicit runtime version keeps JS updates away from binaries with different native code.
6. **The upgrade started from a fresh template.** Thirteen minor versions plus the New Architecture switch made an in-place upgrade risky, so I generated a new 0.86 template and moved `src/` into it.
7. **A signer mismatch stops the release.** The first EAS build came back signed with a newly generated key. I stopped the production build, registered the original Play upload key, confirmed the signatures matched, and only then continued. Existing users have to be able to update without reinstalling.
8. **Less infrastructure.** The 2024 ECS setup (two services, an internal ALB, NAT, RDS, Jenkins) was built to prove out high availability for an internship project. A stateless server in front of external map APIs only needs one container with a health check and quick rollback, so it moved to Railway.

## How Kiro was used

The 2024 code was written without AI tools. The 2026 migration was done with Kiro, and the rules and step-by-step work are documented in [`.kiro/`](.kiro).

- [`steering/`](.kiro/steering): product principles, pinned versions, layering rules, map provider policy, release safety, definition of done
- [`specs/`](.kiro/specs): five work units, each as requirements → design → tasks (platform migration, provider-neutral map engine, bilingual UI and map renderers, route corridor and waypoints, backend deployment)
- [`hooks/`](.kiro/hooks): docs check on code changes, secret scan, provider policy check with backend tests

While Kiro moved the code, I made the policy calls (the eight decisions above) and handled signing, store submissions and secrets myself. Every step was checked with lint, typecheck, build and live API calls, and what was and wasn't verified is logged by date in [`docs/PROGRESS_LOG.md`](docs/PROGRESS_LOG.md). One example: an audit against the public release caught a regression where the search radius was dropped from Google along-route requests during the provider refactor.

## The 2024 versions (written by hand)

| When | Setup | Code |
| --- | --- | --- |
| 2024.06 | First release. Single EC2 API server (NestJS, PM2) behind Cloudflare, GitHub Actions, CodePush | git history of `OnMyWay_BE_V3` and `OnMyWay_FE_V3` |
| 2024.08 | High-availability setup on ECS Fargate across 2 AZs, Spring auth and proxy server, Jenkins CI/CD | [`legacy/OnMyWay_AUTH_V2`](legacy/OnMyWay_AUTH_V2) |
| 2024.11 | API and auth servers rebuilt as Kubernetes manifests (Deployment, Service) | [`legacy/OnMyWay_K8S_V2`](legacy/OnMyWay_K8S_V2) · [Seyun29/OnMyWay_V3](https://github.com/Seyun29/OnMyWay_V3) |
| 2025.03 | Maintained up to 2.1.2 on both stores | |

- Planned in March 2024 and released v1.0.0 on June 4. Shipped six updates in June alone, up to v1.0.6 (parking filter, category search, TMap handoff).
- Along-route search picked up to 20 points on the route and ran a Kakao radius search at each one. Switching the sequential calls to parallel `Promise.allSettled` cut a Seoul–Busan search from 5.8 s to 3.5 s.
- Won the Grand Prize at the 2024 Korea University Capstone Design Competition.
- As the final project of my LG CNS internship, I moved the single server to ECS Fargate. A Spring Security filter chain validated JWTs, and Spring Cloud Gateway proxied and cached the slow API paths. In a 7,500-request JMeter test, the error rate went from 59.25% to 15.25%, average response time from 62.6 s to 7.2 s, and peak CPU from 99.7% to 35%. Place search still had a 34% error rate.
- The same two servers were then rebuilt as Kubernetes manifests: a Deployment (2 replicas) and a Service each for api and auth, with auth reaching api through Service DNS. The Service started as NodePort and was switched to LoadBalancer.

<img width="560" alt="2024 ECS Fargate architecture" src="https://github.com/user-attachments/assets/16607980-d5a2-4b9d-8b09-9e347c169aa4">

The full setup and load test results are in [`legacy/README.md`](legacy/README.md). All secrets in `legacy/` are masked.

> Naming: `OnMyWay_BE_V3` and `OnMyWay_FE_V3` are the current 2026 version (V3). Everything under `legacy/` is from 2024 (V2).

## Current architecture

```text
React Native 0.86 app                        NestJS 11 (Docker container on Railway)
  Accept-Language: ko | en      ──HTTPS──►     MapController
  Naver / Google map tiles                       └ use case → resolver → port
  EAS Update (OTA)                                   ├ KakaoMapAdapter  → Kakao Local · Mobility
                                                     └ GoogleMapAdapter → Geocoding · Places (New) · Routes
```

| Condition | Address, place and along-route search | Routes and waypoints |
| --- | --- | --- |
| App language Korean | Kakao | by coordinates |
| App language English | Google | by coordinates |
| Any route point in Korea | (language rule) | Kakao only |
| All route points abroad | (language rule) | Google only |

## Running locally

```bash
corepack enable
pnpm install          # backend and app dependencies, plus CocoaPods
pnpm dev:ios          # backend + Metro + iOS simulator (pnpm dev:android for Android)
```

Copy `.env.example` to `.env` in both `OnMyWay_BE_V3` and `OnMyWay_FE_V3` and fill in the keys. The local server runs on port `3005`.

## What's left

- Release the new version on Google Play (internal → closed → staged production rollout)
- Verify OTA on real devices: offline start, update server outage, rollback
- Crash reporting (Sentry), a shared contract test suite for both providers, natural-language filters (`SearchIntent`)
