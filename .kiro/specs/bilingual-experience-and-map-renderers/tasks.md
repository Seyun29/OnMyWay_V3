# Implementation Plan — Bilingual Experience & Map Renderers

- [x] 1. Typed dictionaries and translation hook
  - Flat `ko` / `en` dictionaries, interpolation, `useTranslation`
  - Convert rendered text, toasts, alerts, placeholders, route labels and durations
  - _Requirements: 1.4_

- [x] 2. Language persistence and drawer selector
  - First launch from device locale (`ko*` → `ko`, else `en`), stored under `language`
  - Stored value wins on later launches. Manual switch in the drawer with a provider notice
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Request language and stale-response cancellation
  - `axiosDefault` / `axiosInstance` capture language per request and set `Accept-Language`
  - Late responses from the previous language become a silent cancellation
  - Category chips as stable ids. Korean and English queries through the same `query` field
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Session reset boundary
  - Reset the 13 transient atoms and toasts. Remount only `RootStackNavigation` keyed by `language-renderer`
  - Clear the slow-search notice timer on unmount
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Renderer selection
  - [x] 5.1 Drawer `지도 설정` toggle, persisted under `mapRenderer`, default from the first language
  - [x] 5.2 Manual language change resets the renderer to that language's default
  - [x] 5.3 Native key injection: Gradle manifest placeholders (Android), build-phase plist injection (iOS), never in source files
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Renderer-neutral map primitives
  - `OmwMapView`, `MapMarker`, `MapPath`, `MapPolygon` across the four map screens
  - Google camera events converted to the Naver event shape
  - _Requirements: 5.1, 5.2_

- [x] 7. Renderer parity fixes
  - [x] 7.1 Stop Google marker press propagation so the bottom modal stays open
  - [x] 7.2 Route outline on Google with two stacked polylines
  - [x] 7.3 iOS Fabric custom PNG markers via persistent `react-native-maps` patch (dry run + offline reinstall verified)
  - [x] 7.4 English start / waypoint / end marker assets
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 8. Remove the hard-coded map center
  - Nullable `mapCenterState` / `lastCenterState`, geometry-based initial camera, retry UI on location failure
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 9. Translated header actions
  - Replace Korean outline-glyph SVGs with icon-only SVG + translated RN `Text`, equal width and accessible buttons
  - _Requirements: 1.4_

- [ ] 10. Renderer-neutral bounds/fit camera contract
  - Replace distance zoom buckets with `fitToCoordinates`-style bounds plus header and route-card padding
  - Verify short/long routes and 0/1/2 waypoints on both renderers
  - _Requirements: 5.2, 6.2_

- [ ] 11. Visual verification matrix on simulator and device
  - Marker size, anchor and z-index, route outline, bottom-sheet badges, keyboard avoidance, header transitions
  - _Requirements: 5.3, 5.4, 5.5_
