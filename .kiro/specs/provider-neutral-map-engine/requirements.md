# Requirements Document — Provider-Neutral Map Engine

## Introduction

The 2024 backend called Kakao APIs directly from `MapService`. To support English users and overseas
trips, the backend must serve the same six endpoints from either Kakao or Google Maps Platform. Use cases
must not change when a provider is added, and the mobile wire contract must not change at all.

## Requirements

### Requirement 1 — Ports and adapters

**User Story:** As the maintainer, I want use cases that know nothing about Kakao or Google, so that adding or swapping a provider touches one adapter and the composition root.

#### Acceptance Criteria

1. The backend SHALL define ports `GeocodingProvider`, `PlaceSearchProvider`, `RouteProvider`, `RoutePlaceSearchProvider` and `PlaceDetailProvider` with provider-neutral models.
2. `KakaoMapAdapter` and `GoogleMapAdapter` SHALL implement the ports. Provider DTOs, FieldMasks and polyline encoding SHALL stay inside the adapters.
3. `MapService` SHALL be a thin facade over six use cases: `GetAddress`, `SearchPlaces`, `FindRoutes`, `SearchPlacesAlongRoute`, `GetPlaceDetails`, `CalculateDetour`.
4. Existing endpoint paths, request DTOs and response shapes SHALL remain unchanged. New fields SHALL only be optional additions.

### Requirement 2 — Language-based provider for search

**User Story:** As an English-speaking user, I want addresses and places in English, so that I can read the results abroad and in Korea.

#### Acceptance Criteria

1. WHEN a request arrives THEN `ProviderContext` SHALL normalize `Accept-Language` into `MapRequestContext { language, regionCode, units }`.
2. WHEN the first language token starts with `ko` THEN geocoding, place search and along-route search SHALL use Kakao.
3. WHEN the language is anything else or missing THEN those features SHALL use Google.
4. WHEN Google is used with Korean coordinates THEN `regionCode: KR` SHALL be sent as a ranking hint, not as a filter.

### Requirement 3 — Coordinate-based provider for routes

**User Story:** As a driver in Korea, I want routes that actually exist, even when the app is in English.

#### Acceptance Criteria

1. WHEN any of origin, destination, existing waypoints or the new stopby is inside the Korea routing geofence THEN routes and stopby SHALL use Kakao only.
2. WHEN all of those points are outside the geofence THEN routes and stopby SHALL use Google only.
3. IF a coordinate is malformed or out of range THEN the request SHALL be rejected with `400 Invalid route coordinate` before any provider call.
4. The geofence SHALL include the mainland road area, Jeju, the western islands, Ulleungdo and Dokdo.

### Requirement 4 — Explicit failure, no fallback

#### Acceptance Criteria

1. IF the selected provider fails THEN the system SHALL return that failure and SHALL NOT retry on another provider.
2. Provider errors SHALL be normalized to `MAP_PROVIDER_QUOTA_EXCEEDED` (503), `MAP_PROVIDER_AUTHENTICATION_FAILED` (502), `MAP_PROVIDER_TIMEOUT` (504), `MAP_PROVIDER_UNAVAILABLE` (502) or `MAP_PROVIDER_INVALID_RESPONSE` (502).
3. Raw upstream messages, headers and payloads SHALL NOT reach clients or logs.
4. WHEN Google returns a successful response with an empty `routes` array THEN it SHALL be treated as no-route. Missing duration, distance or polyline SHALL be treated as an invalid response.

### Requirement 5 — Route cards with partial success

#### Acceptance Criteria

1. WHEN Kakao is the route provider THEN `RECOMMEND`, `DISTANCE` and `TIME` SHALL each be requested once with `alternatives=false`, in parallel.
2. WHEN at least one priority succeeds THEN the successful cards SHALL be returned. WHEN all fail THEN an error SHALL be returned.
3. WHEN Google is the route provider THEN `TRAFFIC_AWARE`, `TRAFFIC_AWARE_OPTIMAL` and the `SHORTER_DISTANCE` reference route (only without waypoints) SHALL map to the same three cards.
4. Stopby recalculation SHALL reuse the priority and toll-avoidance option of the card the user selected.

### Requirement 6 — Place detail without false negatives

**User Story:** As a user, I want to know whether a place is open and has parking, and to see "unknown" when the data does not say.

#### Acceptance Criteria

1. `GET /map/place-detail?id=` SHALL return open status, opening hours, parking, rating and rating count for a Google place id.
2. Each optional field SHALL carry `KNOWN`, `UNKNOWN` or `UNSUPPORTED`. `null` SHALL NOT be converted to `false`.
3. Every place SHALL preserve `provider`, `provider_place_id` and `attribution` (original URL).
4. Details SHALL be requested only for the place the user opened, at most once per selection.

### Requirement 7 — Cost guardrails

#### Acceptance Criteria

1. Google along-route search SHALL sample at most 10 vertices and fetch at most 3 pages per vertex.
2. Results farther than `radius × 1.25` from the sampled vertex SHALL be removed (Haversine).
3. Final result counts SHALL be capped by route length (30 / km count up to 70 / 100 / 120 / 150).
4. Any FieldMask change that moves a SKU tier SHALL be documented with its price impact.
