---
inclusion: fileMatch
fileMatchPattern: "OnMyWay_BE_V2/src/modules/map/**"
---

# Map Provider Policy

This policy is product behaviour, not an implementation detail. Changing it needs a decision in
`docs/FEATURE_INSIGHTS.md` (chapter 23) and an entry in `docs/PROGRESS_LOG.md`.

## Who answers what

| Feature | Decided by | `ko` / `ko-*` | anything else (UI sends `en`) |
| --- | --- | --- | --- |
| Reverse geocoding | `Accept-Language` | Kakao `coord2address` | Google Geocoding |
| Keyword / category search | `Accept-Language` | Kakao Local | Google Places Text Search (New) |
| Search along route | `Accept-Language` | Kakao Local, sampled vertices | Google Places, sampled vertices + `locationBias` |
| Driving route / stopby | **coordinates** | Kakao Mobility if *any* point is inside the Korea geofence | Google Routes if *all* points are outside |
| Place detail | place id | — | Google Place Details (New) |

- The geofence (`providers/route-region.ts`) is a routing area, not a legal border. It includes Jeju, the western islands, Ulleungdo and Dokdo. Invalid coordinates are rejected with `400` **before** any provider call.
- Why Korea is Kakao-only for routes: Google `computeRoutes` returned empty `routes` for valid Korean coordinates in local tests, and Google's coverage table lists Korean driving directions as unavailable. Do not route Korean trips through Google until both change.
- English mode on a Korean trip is valid: **Kakao route + Google along-route search**. The Kakao path is converted to an encoded polyline for Google.

## No fallback

- Never retry a failed request on the other provider. A Korean route that fails on Kakao is a failure. An overseas route without a Google result is a failure.
- Within one provider, partial success is fine: Kakao route cards call `RECOMMEND`, `DISTANCE` and `TIME` separately with `alternatives=false`, using `Promise.allSettled`. If all three fail, return an error, not an empty list.

## Errors

Normalize every provider error to `MapProviderException`. Raw upstream messages and payloads never reach the client or the logs.

| Public code | HTTP |
| --- | --- |
| `MAP_PROVIDER_QUOTA_EXCEEDED` | 503 |
| `MAP_PROVIDER_AUTHENTICATION_FAILED` | 502 |
| `MAP_PROVIDER_TIMEOUT` | 504 |
| `MAP_PROVIDER_UNAVAILABLE` | 502 |
| `MAP_PROVIDER_INVALID_RESPONSE` | 502 |

Only a *successful* Google response with an empty `routes` array becomes `RouteNotFoundError`. A missing duration, distance or polyline is `INVALID_RESPONSE`, not "no route".

## Data semantics

- Every place keeps `provider`, `provider_place_id` and `attribution`.
- Place detail fields carry `field_status: KNOWN | UNKNOWN | UNSUPPORTED`. `null` means UNKNOWN and is never coerced to `false`.
- Adapters are stateless. Request context (language, region, units) is passed per call, so concurrent requests never mix.

## Cost guardrails (Google)

- The FieldMask decides the SKU. `rating`, `userRatingCount` and `currentOpeningHours` put Text Search on Enterprise. `parkingOptions` adds Atmosphere. Update `docs/FEATURE_INSIGHTS.md` (chapter 24) whenever the mask changes.
- Along-route search: at most **10 vertices**, at most **3 pages** each (≤ 30 billable calls per user search). Post-filter results farther than `radius × 1.25` with Haversine distance.
- Place details are fetched **only for the place the user opened**, once. Never for the whole list.
- Result caps by route length: ≤30 km → 30, ≤70 km → km count, ≤150 km → 100, ≤200 km → 120, otherwise 150.
