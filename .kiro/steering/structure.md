---
inclusion: always
---

# Repository Structure

```text
.
├── OnMyWay_BE_V2/              NestJS 11 API (Docker image → Railway)
│   ├── src/modules/map/
│   │   ├── map.controller.ts   HTTP wire contract (/map/*). Do not change shapes casually.
│   │   ├── map.service.ts      Thin facade → use cases
│   │   ├── use-cases/          GetAddress, SearchPlaces, FindRoutes, SearchPlacesAlongRoute,
│   │   │                       GetPlaceDetails, CalculateDetour
│   │   └── providers/          Ports, adapters, resolvers, MarketConfig, geofence, errors
│   ├── Dockerfile              Multi-stage, non-root, HEALTHCHECK /health
│   └── railway.json            Config-as-code for Railway
├── OnMyWay_FE_V2/              React Native 0.86 app (bare + Expo modules)
│   ├── src/api/                Axios wrappers. Every call carries Accept-Language.
│   ├── src/components/maps/    OmwMapView, MapMarker, MapPath, MapPolygon (renderer-neutral)
│   ├── src/config/helpers/     routeBuffer, routeRegion, nmapLink, googleMapLink, …
│   ├── src/i18n/               Typed ko/en dictionaries
│   ├── src/state/atom.ts       Zustand-backed Recoil-compatible facade
│   ├── android/  ios/          Native projects (managed by hand, no prebuild)
│   ├── app.json  eas.json      Expo / EAS Update config
│   └── patches/                pnpm patches for native libraries
├── docs/                       Architecture, how-it-works, plans, configuration, progress log
├── legacy/                     2024 Spring auth gateway (ECS) and the Kubernetes version. Not deployed.
└── .kiro/                      Steering, specs and hooks for this repository
```

## Layering rules

### Backend

```text
Controller ──► MapService (facade) ──► Use case ──► Resolver ──► Port ──► Adapter ──► Kakao / Google
```

- Controllers call use cases through the facade. They never know provider names.
- Use cases depend on **ports and resolvers only**. No Google or Kakao DTO types above the adapter.
- FieldMasks, encoded polylines and raw provider DTOs stay inside the adapter.
- Providers are wired in one place: `MapModule` is the composition root.
- Policy lives in `MarketConfig` (language → provider, coordinates → route provider). Resolvers do not invent rules.

### Frontend

- Screens and map components use `OmwMapView` / `MapMarker` / `MapPath` / `MapPolygon`, never Naver or Google types directly.
- Global state never stores provider-native objects. Use the shared view models (`src/config/types`).
- API wrappers swallow the intentional *stale-language cancellation* silently (no log, alert or toast).

## Documentation ownership

| Document | Owns |
| --- | --- |
| `docs/ARCHITECTURE.md` | Current code structure, ports/adapters, wire contract |
| `docs/HOW_IT_WORKS.md` | Behaviour by condition: provider choice, algorithms, CURRENT vs PLANNED |
| `docs/MIGRATION_PLAN.md` | Work order, environment variables, completion criteria |
| `docs/PROJECT_CONFIGURATION.md` | Store identity, signing locations, toolchain, restore checklist |
| `docs/DEPLOYMENT_CHECKLIST.md` | Railway, EAS and store release gates |
| `docs/FEATURE_INSIGHTS.md` | Provider research, pricing, product decisions |
| `docs/PROGRESS_LOG.md` | Dated log of what changed and how it was verified (newest first) |

When behaviour changes, the owning document changes **in the same change**.
