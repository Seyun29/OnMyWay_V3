# Implementation Plan — Provider-Neutral Map Engine

- [x] 1. Extract provider ports from `MapService`
  - Define the neutral models, the port interfaces and DI symbol tokens
  - Move the existing Kakao implementation behind `KakaoMapAdapter` without changing controller DTOs or wire shapes
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Implement `GoogleMapAdapter`
  - [x] 2.1 Geocoding (reverse), Places Text Search (New), Search Along Route with encoded polyline
  - [x] 2.2 Routes `computeRoutes`: `TRAFFIC_AWARE` / `TRAFFIC_AWARE_OPTIMAL` / `SHORTER_DISTANCE` reference route
  - [x] 2.3 Lean FieldMask for search
  - _Requirements: 1.2, 5.3_

- [x] 3. Investigate empty Google routes in Korea
  - Reproduce `computeRoutes` returning no routes for valid Korean coordinates on localhost
  - Confirm with Google's coverage table (Korean driving directions not offered) and the response contract (`200` + empty `routes` is a valid no-route)
  - Decide: Korea routes stay on Kakao
  - _Requirements: 3.1_

- [x] 4. Language-based resolver for geocoding and search
  - FE sends `Accept-Language` on every request. BE picks Kakao for `ko*`, Google otherwise
  - Remove the static `DEFAULT_MAP_PROVIDER` and per-port override variables
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Coordinate-based resolver for routes and stopby
  - [x] 5.1 Local Korea geofence with island coverage and coordinate validation
  - [x] 5.2 Kakao only when any point is in Korea, Google only when all are abroad
  - [x] 5.3 Remove every cross-provider fallback in both directions
  - [x] 5.4 Promote the FE `priority` to an explicit DTO/port field and apply it to stopby recalculation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 5.4_

- [x] 6. Normalize provider errors
  - `MapProviderException` with the five public codes. Kakao Axios errors without raw response dumps
  - Required route fields → `INVALID_RESPONSE`. Places without coordinates are dropped
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 7. Place detail
  - [x] 7.1 `PlaceDetailProvider` port and `GoogleMapAdapter.getPlaceDetail` (Place Details New)
  - [x] 7.2 `GET /map/place-detail` and `places.id` exposed as `provider_place_id`
  - [x] 7.3 `field_status` per field and `attribution` on every place
  - [x] 7.4 FE fetches details only for the opened place and keeps UNKNOWN as "no badge"
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Declarative policy and thin facade
  - `ProviderContext` + `MarketConfig`. Split `MapService` into six use cases
  - Region hint derived from coordinates (`KR` inside the geofence, unset abroad)
  - _Requirements: 1.3, 2.1, 2.4_

- [x] 9. Kakao category codes as a literal union wired into DTO validation and Swagger enums
  - _Requirements: 1.4_

- [x] 10. Restore the search radius for Google along-route search
  - Audit against `release/v2.1.2` found the radius preserved in FE/DTO/port but unused in the Google request
  - Radius-based vertex sampling, 100–50,000 m circle bias, distance post-filter
  - _Requirements: 7.1, 7.2_

- [x] 11. Always return a stopby insertion strategy
  - _Requirements: 5.4_

- [ ] 12. Provider-neutral contract test suite for route, along-route and detour, run against both adapters
  - _Requirements: 1.1, 4.1, 5.2_

- [ ] 13. FieldMask presets `LEAN | CORE | RICH_DETAIL` with per-request SKU estimate, page count and latency telemetry
  - _Requirements: 7.4_

- [ ] 14. Cache keys including provider, locale, region, query, route fingerprint and FieldMask
  - _Requirements: 1.2_

- [ ] 15. `SearchIntent` parser (rule-based first) for open-now, rating, review count, late closing and parking
  - _Requirements: 6.2_

- [ ] 16. Road-class and geometry-aware vertex sampling validated by accuracy and request count
  - _Requirements: 7.1_
