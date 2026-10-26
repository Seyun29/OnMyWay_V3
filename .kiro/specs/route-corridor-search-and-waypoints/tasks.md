# Implementation Plan — Route Corridor Search & Waypoints

- [x] 1. Replace the pixel-width corridor with buffered geometry
  - [x] 1.1 `createRouteBufferPolygons`: coordinate validation, ≤500-point sampling, `@turf/buffer` in km, outer/holes output
  - [x] 1.2 `MapPolygon` primitive for Naver and Google (ring winding normalized for Naver)
  - [x] 1.3 `SearchRadiusIndicator`: memoized geometry, fill + ring boundaries, z-index contract
  - [x] 1.4 Show before search, hide with results, show again on "search again"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Audit the radius end to end against the public release
  - Confirm the slider, dynamic min/max, 0.5 km step and km → m conversion survived the migration
  - Fix the Google adapter that ignored the radius after the provider-neutral refactor
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Backend waypoint insertion
  - Shared `buildStopByCandidates` for both adapters, parallel routing, shortest duration wins
  - Always return a strategy when any candidate succeeds
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Waypoint UX
  - Max 2 permanent waypoints, coordinate dedupe, discard temporary stopby, return to route selection, fresh search screen
  - _Requirements: 3.4, 3.5_

- [x] 5. Region-aware navigation handoff
  - [x] 5.1 Client geofence (`routeRegion.ts`) mirroring the backend policy
  - [x] 5.2 Naver `nmap://route/car` for Korean routes with store fallback
  - [x] 5.3 Google Maps universal URL for overseas routes with ordered waypoints and `avoid=tolls`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Document behaviour and styling
  - `docs/HOW_IT_WORKS.md` (algorithms, provider choice, handoff) and `docs/SEARCH_RADIUS_INDICATOR_STYLE_GUIDE.md`
  - _Requirements: 1.2, 4.1_

- [ ] 7. Align the slider maximum with the 20 km payload clamp and type the along-route payload
  - _Requirements: 2.1_

- [ ] 8. Visual verification of 1 / 3 / 20 km corridors on both renderers and both platforms
  - _Requirements: 1.3, 1.6_

- [ ] 9. Optional: `MapDirectionalPath` end-of-route arrow shared by both renderers
  - _Requirements: 1.3_
