---
inclusion: always
---

# Product — OnMyWay

> **Search your route, not the map.**

OnMyWay is a route-based place search app. The user picks an origin and a destination, and the app
searches the *whole driving corridor* for places (cafés, parking, drive-throughs, …) and shows how many
extra minutes each stop would add. It is live on both stores and has been since June 2024.

| Store | Identifier | Notes |
| --- | --- | --- |
| App Store | `com.omw.onmywayapp` (App ID `6503656527`) | Existing app record. Never create a new one. |
| Google Play | `com.omw.omw_front` | Existing app record and upload key. Never regenerate the key. |

## Who it is for

- Korean drivers using the app in Korean (`ko`) — Kakao data, Naver map tiles by default.
- English users and overseas road trips (`en`) — Google Maps Platform data, Google map tiles by default.

## Core user flow

```text
origin + destination
  → up to 3 route cards (recommended / shortest distance / shortest time)
  → keyword or category search along the selected route, inside a visible search radius
  → place card (rating · open now · parking when known)
  → "add as waypoint" → best insertion position + new duration
  → hand off to Naver Map (Korea) or Google Maps (overseas)
```

## Product principles

1. **Unknown is not false.** A missing parking or opening-hours value is `UNKNOWN`, never "no parking".
2. **One provider per answer.** A result always comes from one known provider. No silent cross-provider fallback.
3. **Cost is a feature constraint.** Google Places pricing depends on the requested fields. Enrich only what the user selected.
4. **Location is sensitive.** Precise coordinates, routes and raw search text never go to logs or analytics.
5. **The route stays on screen.** Searching must not make the user leave the route they already chose.

## Out of scope (current release)

- Accounts and login. Favorites and recent searches live on the device (AsyncStorage).
- Own turn-by-turn navigation. Navigation is handed off to external apps.
- Review crawling and LLM review summaries. Both were removed in the 2026 migration.
- Ad SDKs. Only an `AdProvider` port and placement contract are planned.

## Vocabulary

| Term | Meaning |
| --- | --- |
| *provider* | Data source for geocoding, places and routes (`KAKAO`, `GOOGLE`). |
| *renderer* | Map tile SDK on the device (Naver Map or Google Map). Independent of the provider. |
| *stopby* | A candidate place the user wants to insert into the current route. |
| *strategy* | Where the stopby is inserted relative to existing waypoints: `FRONT`, `MIDDLE`, `REAR`. |
| *corridor* | The selected route buffered by the search radius (km). Drawn on the map before searching. |
| *runtime version* | The native compatibility key that decides which binaries can receive an OTA update. |
