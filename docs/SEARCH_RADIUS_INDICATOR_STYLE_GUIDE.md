# Search Radius Indicator Styling Guide

> 기준일: 2026-08-17
> 대상: `@mj-studio/react-native-naver-map@2.9.0`, `react-native-maps@1.29.0`
> 목적: Naver/Google renderer에서 동일한 “경로 주변 검색 영역”을 표현한다.

## 1. 목표 시각 표현

현재 제품 방향은 선택 경로를 `radiusKm`만큼 지리적으로 확장한 검색 corridor를 매우 연한 반투명 색으로 채우고, 외곽 경계를 얇은 반투명 polyline으로 표시하는 것이다.

```text
지도 base
  -> 매우 연한 반투명 분홍색 radius fill
  -> 얇은 반투명 분홍색 boundary
  -> 선택 경로 초록색 centerline
  -> 장소 marker
```

`LineString`을 km 단위로 buffer한 Polygon/MultiPolygon을 `MapPolygon`으로 채우고, 모든 ring을 `MapPath` 경계선으로 별도 렌더링한다. 검은 border와 gradient는 사용하지 않는다.

주의: 실제 장소 검색은 sampled vertex 주변 요청과 거리 후필터로 수행되므로 이 경계는 검색 반경의 지리적 시각화이지만 provider가 결과를 반드시 반환하는 보장 영역은 아니다.

## 2. 현재 코드 위치

| 책임 | 파일/컴포넌트 | 현재 역할 |
| --- | --- | --- |
| 표시 여부와 입력값 | `OnMyWay_FE_V3/src/components/maps/naverMap.tsx`의 `NaverMap` | 검색 결과 전에는 indicator 표시, 결과 화면에서는 숨김. route와 radiusKm 전달 |
| buffer geometry | `OnMyWay_FE_V3/src/config/helpers/routeBuffer.ts`의 `createRouteBufferPolygons` | route를 km 단위로 buffer하고 Polygon/MultiPolygon을 outer/holes 구조로 변환 |
| indicator 스타일 | `OnMyWay_FE_V3/src/components/paths/candidatePaths.tsx`의 `SearchRadiusIndicator` | 약 8% alpha fill과 폭 1px boundary를 함께 렌더링 |
| Naver/Google 분기 | `OnMyWay_FE_V3/src/components/maps/mapPrimitives.tsx`의 `MapPath` | Google `Polyline` 또는 Naver `NaverMapPathOverlay` 렌더링 |
| 반경 UI 상태 | `OnMyWay_FE_V3/src/components/keywordSearchBox.tsx`의 `KeywordSearchBox` | slider 값을 km 단위로 갱신 |
| 지도 renderer 선택 | `OnMyWay_FE_V3/src/components/maps/omwMapView.tsx` | Naver Map과 Google Map view 전환 |

현재 호출 흐름은 다음과 같다.

```text
KeywordSearchBox.searchRadiusKm
  -> NaverMap
  -> SearchRadiusIndicator
  -> createRouteBufferPolygons
  -> Polygon/MultiPolygon outer + holes
  -> MapPolygon fill + MapPath boundary[]
  -> Google Polygon/Polyline | NaverMapPolygonOverlay/PathOverlay
```

## 3. 넓은 corridor 방식을 제거한 이유

이전 구현은 km 반경을 화면 pixel 폭으로 환산하고 투명 path 4개를 겹쳐 영역처럼 표시했다. 다음 문제 때문에 현재 구현에서는 제거했다.

1. 실제 지리 polygon이 아니라 굵은 centerline이어서 정확한 반경 경계가 아니었다.
2. SDK별 line join/cap과 alpha 합성 차이로 Naver와 Google의 결과가 달랐다.
3. 확대·축소와 최대 폭 clamp에 따라 시각적 km가 달라졌다.
4. 여러 투명 레이어가 겹치면서 예상보다 진하거나 띠 경계가 보일 수 있었다.
5. 넓은 overlay가 지도 도로명과 장소 정보를 가렸다.
6. route 전체를 여러 번 그려 불필요한 렌더링 비용이 발생했다.

현재 구현은 실제 km buffer geometry를 계산하고 내부를 약 8% alpha로만 채운 뒤 경계 ring을 별도 polyline으로 그려, 검색 반경을 명확히 표시하면서 지도 가림을 최소화한다.
## 4. SDK별 스타일 지원 범위

### Naver Map

`NaverMapPathOverlay`는 `width`(dp/pt), `color`, `outlineWidth`, `outlineColor`, progress와 pattern을 제공한다. 폭 방향 gradient/blur는 제공하지 않는다.

`NaverMapPolygonOverlay`는 `color`, `outlineWidth`, `outlineColor`, holes를 제공한다. polygon ring은 닫혀 있어야 하고 외곽 ring은 시계 방향이어야 한다. fill gradient는 제공하지 않는다.

### Google Map (`react-native-maps`)

`Polyline`은 `strokeColor`, `strokeWidth`, `lineCap`, `lineJoin`, `strokeColors`를 제공한다. 하지만 라이브러리 문서가 보장하는 gradient polyline은 iOS MapKit 한정이므로 현재처럼 Google provider를 사용하는 iOS/Android 공통 디자인에 의존하면 안 된다.

`Polygon`은 양 플랫폼에서 `fillColor`, `strokeColor`, `strokeWidth`, holes와 z-index를 지원한다. polygon 자체의 gradient/blur fill은 제공하지 않는다.

결론적으로 **Naver + Google 공통 gradient API는 없다.** 공통 feather 효과는 서로 다른 크기와 alpha의 overlay를 겹쳐서 만들어야 한다.

## 5. Arrowhead path 검토

첨부 이미지처럼 선택 경로 끝에 큰 화살촉 하나를 표시하는 것은 가능하지만, 두 renderer의 네이티브 지원이 다르다.

- Naver: `NaverMapArrowheadPathOverlay`가 경로 끝 arrowhead를 기본 제공한다. `width`, `color`, `outlineWidth`, `outlineColor`, `headSizeRatio`를 지원한다.
- Google: 현재 고정된 `react-native-maps@1.29.0`의 Google `Polyline`에는 arrowhead/end-cap icon prop이 없다. 지원 범위는 stroke, width, line cap/join, dash pattern 등이다.

두 지도에서 첨부 이미지와 같은 시각을 맞추는 권장안은 공통 `MapDirectionalPath`를 만드는 것이다.

```text
MapDirectionalPath
  -> 기존 MapPath
  -> route 끝 92~96% 지점과 직전 점으로 bearing 계산
  -> 화면 px 크기의 회전 arrow marker 1개
  -> Naver Marker | Google Marker
```

이 방식은 Naver native arrowhead 대신 두 지도 모두 같은 SVG marker를 사용하므로 크기·색상·목적지 marker와의 간격을 동일하게 맞출 수 있다. Naver는 native arrowhead, Google만 marker를 쓰는 hybrid 방식도 가능하지만 두 SDK의 화살촉 모양과 배율이 달라질 수 있다. 반복 화살표가 필요하면 route를 샘플링해 여러 marker를 놓아야 하므로 렌더링 비용이 증가한다.

화살표는 선택 경로의 진행 방향에만 적용하고 검색 반경 fill/boundary에는 적용하지 않는다. 현재 선택 경로 구현은 아직 `MapPath` 그대로이며 이 섹션은 적용 전 검토 결과다.

## 6. 구현 선택지

### A. Buffer Polygon + boundary Polyline 방식 — 현재 적용

선택 route를 GeoJSON `LineString`으로 만들고 `radiusKm`만큼 buffer한 뒤, 반환된 Polygon/MultiPolygon은 매우 연하게 채우고 각 ring은 renderer-neutral `MapPath` 경계선으로 렌더링한다.

```text
fill color: #F552A814
boundary color: #F552A84D
boundary width: 1
outline: transparent / 0
zIndex: fill -2, boundary 0
```

장점:

- slider의 실제 km 반경을 지도 좌표로 표현한다.
- Naver와 Google에서 같은 geometry와 style token을 사용한다.
- 약 8% alpha의 fill로 내부 반경을 구분하면서 지도 정보를 보존한다.

단점:

- slider 변경 시 buffer geometry를 다시 계산해야 한다.
- 긴 route는 입력 좌표 sampling이 필요하다.

### B. Buffer Polygon fill 방식 — 현재 미적용

선택 route를 GeoJSON `LineString`으로 만든 뒤 radiusKm만큼 buffer하여 `Polygon` 또는 `MultiPolygon`을 만든다. 예를 들어 [Turf `buffer`](https://turfjs.org/docs/api/buffer)는 line을 kilometer 단위로 확장할 수 있다.

```text
Route Coordinate[]
  -> GeoJSON LineString
  -> buffer(radiusKm, units: kilometers)
  -> simplify / invalid ring 제거
  -> outer ring winding 정규화
  -> MapPolygon
  -> Google Polygon | NaverMapPolygonOverlay
```

장점:

- zoom과 무관하게 실제 지도 좌표 기준 반경이 유지된다.
- 커브와 양 끝이 자연스러운 corridor가 된다.
- 첨부 이미지와 같은 영역 표현을 두 renderer에서 가장 유사하게 만들 수 있다.

단점:

- geometry 계산과 polygon renderer primitive가 추가로 필요하다.
- 긴 route는 simplify, memoization과 vertex 상한이 필요하다.
- MultiPolygon과 ring winding을 처리해야 한다.

## 7. 향후 면적형 indicator를 다시 도입할 경우

현재 구현은 단일 약 8% alpha fill이며 feather/gradient는 없다. 향후 외곽으로 흐려지는 표현이 필요하면 두 SDK 모두 polygon gradient를 직접 지원하지 않으므로 nested buffer polygon을 바깥쪽부터 그리는 방식을 검토한다.

```text
100% radius: 가장 연한 rose
 92% radius: 조금 더 진한 rose
 82% radius: 중간 rose
 70% radius: 중심부 rose
선택 route: green centerline
```

각 polygon의 border는 0으로 둔다. 작은 polygon이 위에 쌓이면서 중심은 약간 진하고 외곽은 자연스럽게 사라진다. 이는 Gaussian blur는 아니지만 두 SDK에서 가장 예측 가능한 공통 구현이다.

권장 layer 수는 3~4개다. 5개 이상은 시각 개선 대비 geometry와 렌더링 비용이 커진다.
## 8. 스타일 preset

### `radiusBoundary` — 현재 적용

| Token | 값 | 용도 |
| --- | --- | --- |
| `searchBoundaryColor` | `#F552A84D` | 약 30% alpha의 연한 분홍 경계선 |
| `searchBoundaryWidth` | `1` | 최소 두께의 radius ring |
| `outlineWidth` | `0` | 별도 외곽선 제거 |
| `outlineColor` | `transparent` | Naver 기본 검은 outline 방지 |
| `zIndex` | `0` | 경로와 marker보다 아래 배치 |
| `fillColor` | `#F552A814` | 약 8% alpha로 내부 반경 구분 |

아래 preset은 현재 적용하지 않는 과거/대안 설계다.

### `referenceBold` — 면적형 대안

| Token | 권장 시작값 | 용도 |
| --- | --- | --- |
| `corridorBase` | `#F052A0` | 주 search corridor 색상 |
| `corridorOpacity` | `0.52` | 지도 지명과 도로를 일부 보존하면서 분홍 영역을 명확히 표시 |
| `corridorBoundary` | `rgba(52, 31, 43, 0.82)` | 첨부 이미지의 어두운 외곽선 |
| `corridorBoundaryWidth` | Naver `1.5dp`, Google `2px` | 영역 경계 분리 |
| `routeColor` | `#20C933` | 선택 route centerline |
| `routeWidth` | `9~10` | 분홍 영역보다 위에 표시 |
| `routeOutline` | `rgba(255,255,255,0.72)` | route와 corridor 분리, 1px |
| `corridorZIndex` | `-2` | route와 marker보다 아래 |
| `routeZIndex` | `1` | corridor보다 위 |
| `markerZIndex` | `2+` | 모든 영역보다 위 |

이 preset은 첨부 이미지와 가장 가깝지만 지도 위 시각 점유율이 높다. 결과 marker가 표시되면 현재 정책대로 corridor를 숨긴다.

### `softFeather` — border 없는 현대화 버전

| Buffer radius | Fill (`#RRGGBBAA`) |
| ---: | --- |
| `100%` | `#F552A803` (약 1.2%) |
| `92%` | `#F552A804` (약 1.6%) |
| `82%` | `#F552A805` (약 2.0%) |
| `70%` | `#F552A806` (약 2.4%) |

- 모든 polygon의 border/stroke width는 `0`이고 outline color도 투명하게 둔다.
- centerline은 `#20C933`, width `9~10`, white outline `1`을 유지한다.
- 네 레이어가 모두 겹치는 중심부의 합성 불투명도도 약 7% 이하라 지도 정보가 선명하게 남는다.
- `#RRGGBBAA` 형식은 React Native `processColor`를 거치는 Naver native bridge와 Google Polyline에서 alpha 해석을 일관되게 한다.

최신 첨부 이미지를 시각 기준으로 삼는다면 `referenceBold`를 먼저 적용한다. 이전 요구인 “border 없이 바깥으로 흐려짐”이 우선이면 `softFeather`를 사용한다. 두 preset을 섞을 때는 외곽선과 feather 중 하나만 강조해야 한다.

## 9. 현재 컴포넌트 구조

```text
NaverMap
  -> SearchRadiusIndicator(path, radiusKm)
      -> createRouteBufferPolygons(path, radiusKm)
          -> @turf/buffer Polygon | MultiPolygon
          -> {outer, holes}[]
      -> MapPolygon fill + ring별 MapPath boundary
          -> Google Polygon/Polyline | Naver Polygon/Path overlay
```

각 책임은 다음처럼 제한한다.

- `NaverMap`: 표시 시점과 route/radius 전달만 담당한다.
- `SearchRadiusIndicator`: geometry memoization, fill/boundary style과 z-index를 담당한다.
- `routeBuffer.ts`: 좌표 검증, 최대 500개 sampling, km buffer와 outer/holes 변환을 담당한다.
- `MapPolygon`과 `MapPath`: Naver/Google renderer 분기만 담당한다.

## 10. 공통 MapPolygon 설계 — 현재 적용

```ts
type MapPolygonProps = {
  coordinates: Coordinate[];
  holes?: Coordinate[][];
  fillColor: string;
  strokeColor?: string;
  strokeWidth?: number;
  zIndex?: number;
};
```

- Google: `react-native-maps`의 `Polygon`으로 변환한다.
- Naver: `NaverMapPolygonOverlay`로 변환한다.
- Naver 외곽 ring은 시계 방향, hole은 반시계 방향으로 정규화한다.
- Turf 결과가 `MultiPolygon`이면 polygon별로 별도 overlay를 렌더링한다.
- `softFeather`는 동일 route를 서로 다른 radius로 buffer한 3~4개 polygon을 렌더링한다.
- `referenceBold`는 radius 100% polygon 1개와 선택적 boundary만 렌더링한다.
## 11. 성능 가이드

- buffer 입력 route는 최대 500개 좌표로 균등 sampling한다.
- slider 변경은 120ms debounce한 뒤 boundary geometry에 반영한다. 검색 API payload의 반경 값은 지연하지 않는다.
- `{path identity, debounced radiusKm}` 조합으로 geometry를 memoize한다.
- Turf의 원형 근사 `steps`는 8로 제한한다.
- Polygon/MultiPolygon의 ring은 각각 별도 path로 그려 떨어진 영역 사이의 가짜 연결선을 만들지 않는다.
- 긴 route에서는 JS thread 계산 시간을 측정하고 필요하면 worker/native 또는 BE precompute를 검토한다.
- marker와 centerline의 z-index는 boundary보다 항상 높게 유지한다.

## 12. 표시 상태 정책

| 상태 | Indicator | Marker |
| --- | --- | --- |
| route 선택 후 검색 전 | 표시 | 숨김 |
| 반경 slider 조작 중 | 실시간 또는 debounce 갱신 | 숨김 |
| 검색 요청 중 | 표시하되 추가 animation은 사용하지 않음 | 숨김 |
| 결과 표시 | 숨김 | 표시 |
| “눌러서 다시 검색” 진입 | 다시 표시 | 기존 marker 제거 |
| route 변경/해제 | 제거 | 제거 |

## 13. 튜닝 순서

1. 먼저 geometry가 zoom에 관계없이 동일한 km 반경인지 확인한다.
2. `referenceBold` 또는 `softFeather` 중 하나를 고른다.
3. corridor alpha를 조절한다. 색상보다 alpha를 먼저 바꾼다.
4. centerline width와 white outline을 조절한다.
5. 지도 label 가독성과 marker 대비를 확인한다.
6. Naver/Google, iOS/Android를 같은 좌표·zoom에서 screenshot 비교한다.

현재 코드에서 경계 색상과 두께를 조정하려면 `candidatePaths.tsx`의 `SEARCH_BOUNDARY_COLOR`, `SEARCH_BOUNDARY_WIDTH`를 바꾼다. buffer 정밀도와 최대 입력 좌표 수는 `routeBuffer.ts`의 `BUFFER_STEPS`, `MAX_ROUTE_POINTS`에서 조정한다.

## 14. 완료 기준

- 1km, 3km, 20km slider 값에 따라 경계가 120ms 이내에 실제 지도 좌표 기준으로 이동한다.
- Naver와 Google 모두 검색 전 동일한 얇은 반투명 분홍 boundary를 표시한다.
- 반경 내부는 약 8% alpha로 채워지고 gradient와 검은 outline은 없다.
- 경계선이 닫혀 있으며 Polygon/MultiPolygon component 사이에 가짜 연결선이 없다.
- 지도 도로명과 장소 label을 가리지 않는다.
- 검색 결과가 나타나면 boundary가 숨겨진다.
- 재검색 진입 시 marker가 제거되고 boundary가 다시 나타난다.
- slider 연속 조작 중 수용 가능한 frame 성능을 유지한다.

## 15. 참고 문서

- [React Native Naver Map 공식 문서](https://rnnavermap.mjstudio.net/)
- [React Native Naver Map 공식 저장소](https://github.com/mym0404/react-native-naver-map)
- [react-native-maps 공식 저장소와 Component API](https://github.com/react-native-maps/react-native-maps)
- [Turf buffer API](https://turfjs.org/docs/api/buffer)

외부 문서 내용은 라이선스 준수를 위해 요약·재서술했다. 실제 구현 전에는 현재 고정된 package 버전의 타입 정의를 최종 기준으로 사용한다.
