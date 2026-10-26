# Requirements Document — Bilingual Experience & Map Renderers

## Introduction

The 2024 app was Korean-only and drew every map with the Naver SDK. This spec adds Korean and English
UI, sends the app language to the backend on every request, and lets the user choose the map renderer
(Naver or Google) independently of the data provider. Switching language or renderer must never leave
results from the previous session on screen.

## Requirements

### Requirement 1 — Language selection and persistence

**User Story:** As a traveller, I want the app in my language on first launch and to keep my choice afterwards.

#### Acceptance Criteria

1. WHEN the app starts for the first time after install THEN it SHALL set the language to `ko` if the device locale starts with `ko`, otherwise `en`, and persist it under the `language` key.
2. WHEN the app starts later THEN the stored language SHALL be authoritative. A device language change or foreground return SHALL NOT overwrite it.
3. The drawer SHALL let the user switch between `한국어` and `English` at any time.
4. All rendered text, toasts, alerts, placeholders, route priority labels and durations SHALL come from typed `ko` / `en` dictionaries. User content (place names, favorites, history) SHALL NOT be translated.

### Requirement 2 — Request language and stale responses

#### Acceptance Criteria

1. Every backend request SHALL carry `Accept-Language` with the language captured when the request started.
2. IF a response arrives after the language changed THEN the client SHALL discard it as an intentional cancellation, without log, alert or toast.
3. Category chips SHALL use stable ids. Korean sends the existing `카테고리 : <label>` query and English sends a natural Google query, both in the same `query` field.

### Requirement 3 — Session reset boundary

#### Acceptance Criteria

1. WHEN the language or renderer changes THEN the 13 transient map atoms (navigation, selected route, current place, modals, drawer, loading, map centers, header state) SHALL reset to defaults and in-flight toasts SHALL hide.
2. Only `RootStackNavigation` SHALL remount, keyed by `language-renderer`. `RecoilRoot`, the language initializer and the global toast SHALL stay mounted.
3. Pending timers from the previous session (for example the slow along-route search notice) SHALL be cleared on unmount.

### Requirement 4 — Renderer choice independent of data

**User Story:** As a user abroad, I want Google map tiles even if my route data comes from another provider.

#### Acceptance Criteria

1. The drawer SHALL offer `국내 지도` (Naver) and `구글맵` (Google, `react-native-maps` `PROVIDER_GOOGLE`).
2. The first-launch default SHALL follow the first language (`ko` → Naver, `en` → Google) and persist under `mapRenderer`.
3. WHEN the user changes the language manually THEN the renderer SHALL reset to that language's default. The user MAY change the renderer again afterwards.
4. The renderer SHALL NOT influence which data provider answers a request.

### Requirement 5 — Renderer parity

#### Acceptance Criteria

1. All four map screens SHALL use `OmwMapView`, `MapMarker`, `MapPath` and `MapPolygon` only, never Naver or Google types directly.
2. Google camera events SHALL be converted to the Naver event shape (zoom + covering region).
3. WHEN a Google marker is pressed THEN the event SHALL NOT also trigger the map background handler that closes the bottom sheet.
4. Route lines SHALL show an outline on both renderers (Google uses two stacked polylines).
5. Custom PNG markers (start, waypoint, end, places) SHALL render on iOS Google maps under Fabric.
6. In English, start / waypoint / end markers SHALL use English marker assets.

### Requirement 6 — No fake map center

#### Acceptance Criteria

1. Map center state SHALL be nullable and SHALL NOT default to a hard-coded coordinate.
2. The main map SHALL center on the real location. The route map SHALL center on route geometry. The map picker SHALL use last center → global center → real location.
3. IF the location is unavailable THEN the native map SHALL NOT mount and a translated retry UI SHALL be shown.
