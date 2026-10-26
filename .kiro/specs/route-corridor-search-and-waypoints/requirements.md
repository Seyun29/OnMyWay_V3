# Requirements Document — Route Corridor Search & Waypoints

## Introduction

The core job of OnMyWay is to keep the chosen route on screen while the user searches along it, then
insert the chosen place at the cheapest position and hand the trip off to a navigation app. This spec
covers the visible search corridor, waypoint insertion and external navigation, which were reworked
or added in the 2026 migration.

## Requirements

### Requirement 1 — Visible search corridor

**User Story:** As a driver, I want to see which area around my route is being searched, so that I can widen or narrow the radius before searching.

#### Acceptance Criteria

1. WHEN a route is selected and no results are shown THEN the map SHALL draw the route buffered by `radiusKm` as a geographic Polygon/MultiPolygon.
2. The fill SHALL be `#F552A814` (~8% alpha) and every ring SHALL be drawn as a 1 px `#F552A84D` boundary. No black outline and no gradient.
3. Naver and Google renderers SHALL use the same geometry and style tokens.
4. WHEN results are displayed THEN the fill and boundary SHALL hide. WHEN the user re-enters search editing THEN they SHALL reappear.
5. The buffer input SHALL be sampled to at most 500 points with circle steps of 8. Slider changes SHALL be debounced by 120 ms for geometry only (the request radius is not delayed).
6. MultiPolygon parts SHALL render as separate rings, with no false connecting lines.

### Requirement 2 — Radius reaches the provider

#### Acceptance Criteria

1. The selected radius SHALL be sent to `/map/search-on-path` in metres whether or not the radius panel is open.
2. Kakao SHALL apply the radius to both vertex sampling and each place search.
3. Google SHALL apply the radius to vertex sampling, `locationBias.circle` (100–50,000 m) and a distance post-filter.

### Requirement 3 — Waypoint insertion

**User Story:** As a driver, I want a found place inserted where it adds the least time, so that I do not have to try every order myself.

#### Acceptance Criteria

1. WHEN a stopby is requested THEN the backend SHALL build insertion candidates: none → `FRONT`. One waypoint → `FRONT`, `REAR`. Two waypoints → `FRONT`, `MIDDLE`, `REAR`.
2. Candidates SHALL be routed in parallel with the selected route priority and toll option, and the shortest duration SHALL be returned with its `strategy` and path.
3. The backend SHALL always return an insertion strategy when any candidate succeeds.
4. The app SHALL allow at most 2 permanent waypoints and SHALL NOT add a place with the same coordinates twice.
5. WHEN "add as waypoint" completes THEN the temporary stopby route SHALL be discarded, the user SHALL return to route selection, and the search screen SHALL remount empty.

### Requirement 4 — External navigation handoff

**User Story:** As a driver, I want to start navigation in the app that actually works where I am driving.

#### Acceptance Criteria

1. WHEN any route point is inside the Korea geofence THEN only the Naver Map button SHALL show and it SHALL open `nmap://route/car`. IF the app is missing THEN the store page SHALL be offered.
2. WHEN all route points are abroad THEN only the Google Maps button SHALL show, using the universal `https://www.google.com/maps/dir/?api=1` URL with ordered `waypoints`, `travelmode=driving` and `dir_action=navigate`.
3. WHEN the selected route avoids tolls THEN the Google URL SHALL include `avoid=tolls`.
4. Waypoint order SHALL be origin → existing waypoints and the selected place in stopby strategy order → destination.
5. The client SHALL use the same geofence policy as the backend route resolver.
