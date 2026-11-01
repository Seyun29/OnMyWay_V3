# OnMyWay 아키텍처

> 최종 갱신: 2026-08-10
> 이 문서는 실제 코드 기준의 현재 아키텍처를 기록한다. 구현이 바뀌면 같은 변경에서 이 문서를 함께 수정한다.

## 1. 시스템 개요

```text
┌─────────────────────────────┐        ┌──────────────────────────────────┐
│  OnMyWay_FE_V3 (RN 0.86.2)  │        │  OnMyWay_BE_V3 (NestJS 11.1.28)  │
│                             │  HTTP  │                                  │
│  src/api/* ── axiosInstance ├───────►│  MapController (/map/*)          │
│  BASE_URL: Platform.OS 자동 │        │        │                         │
│  (iOS localhost / Android   │        │        │                         │
│   10.0.2.2, :SERVER_PORT)   │        │        │                         │
│                             │        │        ▼                         │
│  지도 렌더링: Naver Map SDK │        │  MapService (use case, 중립)     │
│  상세 화면: Kakao place_url │        │        │ @Inject(port tokens)    │
│  WebView (legacy)           │        │        ▼                         │
└─────────────────────────────┘        │  Provider Ports                  │
                                       │  ├ GeocodingProvider             │
                                       │  ├ PlaceSearchProvider           │
                                       │  ├ RouteProvider                 │
                                       │  ├ RoutePlaceSearchProvider      │
                                       │  └ PlaceDetailProvider          │
                                       │        │ MapModule composition   │
                                       │        ▼                         │
                                       │  ┌──────────────┬─────────────┐  │
                                       │  │ GoogleMap    │ KakaoMap    │  │
                                       │  │ Adapter      │ Adapter     │  │
                                       │  └──────┬───────┴──────┬──────┘  │
                                       └─────────┼──────────────┼─────────┘
                                                 ▼              ▼
                                   Google Maps Platform   Kakao Local/Mobility
                                   (Geocoding, Places     (Local API,
                                    New, Routes)           kakaomobility directions)
```

## 2. BE Provider Port 구조

위치: `OnMyWay_BE_V3/src/modules/map/providers/`

| 파일                                | 역할                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `map-provider.port.ts`              | provider-neutral 모델(`Coordinate`, `PlaceResult`, `RouteResult` 등)과 5개 port interface           |
| `market-config.ts`                  | 기능·언어·좌표 지역별 provider, 기본 언어·region hint·단위 정책의 선언적 기준                         |
| `map-request-context.ts`            | `Accept-Language`를 `ProviderContext`의 language·region·units 요청 context로 정규화                   |
| `../use-cases/*.use-case.ts`        | 주소·장소·경로·경로상 장소·장소 상세·우회시간 application orchestration                              |
| `kakao-map.adapter.ts`              | 기존 Kakao Local/Mobility 구현 전체 (4 port 모두 구현), 모든 경로 우선순위 실패 시 명시적 오류 반환 |
| `google-map.adapter.ts`             | Google Geocoding·Places API (New) Text Search·Routes API 구현 (4 port 모두 구현)                    |
| `language-map-provider.resolver.ts` | 언어별 주소·장소·경로상 검색 provider 선택                                                          |
| `route-map-provider.resolver.ts`    | 경로/stopby 전용 선택: 입력 좌표 중 하나라도 한국이면 Kakao only, 모두 해외면 Google only                           |
| `route-region.ts`                   | 출발지·목적지·경유지·stopby 좌표의 한국 routing geofence 판정과 좌표 유효성 검사                                  |
| `route-not-found.error.ts`          | 성공한 upstream 응답의 빈 Google route만 나타내는 내부 typed error                                                  |
| `map-provider.error.ts`             | quota·인증·timeout·unavailable·invalid response를 안정된 public error code와 HTTP status로 정규화                 |
| `polyline.ts`                       | Google encoded polyline encode/decode (precision 1e5)                                                               |
| `stop-by-candidates.ts`             | stopby FRONT/MIDDLE/REAR 후보 생성 (양 adapter 공유)                                                                |

- `MapService`는 controller wire contract를 보존하는 thin facade다. 실제 orchestration은 `GetAddressUseCase`, `SearchPlacesUseCase`, `FindRoutesUseCase`, `SearchPlacesAlongRouteUseCase`, `GetPlaceDetailsUseCase`, `CalculateDetourUseCase`가 담당하며 provider SDK 타입을 참조하지 않는다.
- `ProviderContext`가 요청 header를 language/region/units로 정규화하고, `MarketConfig`가 기능별 언어 policy와 좌표 기반 route policy를 해석한다. resolver는 policy 결과를 adapter instance로 연결할 뿐 자체 선택 규칙을 갖지 않는다.
- Controller 경로와 기존 route 응답 shape는 유지한다. FE가 이미 보내던 stopby `priority`를 DTO/port의 명시적 optional field로 승격했다.
- 성공 응답은 전역 `SuccessInterceptor`가 `{success: true, data}`로 감싼다.

## 3. Provider 선택 (요청 언어 + 경로 좌표 기준)

위치:

- FE header: `OnMyWay_FE_V3/src/api/axios.ts`
- BE context/policy: `providers/map-request-context.ts`, `providers/market-config.ts`
- non-route resolver: `providers/language-map-provider.resolver.ts`
- route resolver/geofence: `providers/route-map-provider.resolver.ts`, `providers/route-region.ts`

FE의 공통 axios client가 앱 언어를 모든 BE 요청의 `Accept-Language`에 담는다. 최초
설치 후 첫 실행에서는 기기 locale이 `ko`로 시작하면 `ko`, 그 외 모든 locale은 `en`을
선택해 AsyncStorage에 저장한다. 이후에는 드로어의 수동 선택값을 사용한다. BE `ProviderContext`는 요청마다
header를 `MapRequestContext`로 정규화하고 `MarketConfig`의 기본 언어·region hint·metric 단위를 적용한다. 주소·장소·경로상 검색은
`LanguageMapProviderResolver`가 `MarketConfig`의 기능별 언어 policy 결과에 맞는 adapter를 고른다. 경로·stopby는 언어가 아니라
출발지·목적지·모든 기존 경유지·새 stopby 좌표를 검사해 provider를 확정한다.

| 조건                             | 주소·장소·경로상 검색            | 경로·stopby | fallback |
| -------------------------------- | -------------------------------- | ----------- | -------- |
| 앱 언어 `ko` 또는 `ko-*`         | Kakao                            | 좌표 기준   | 없음     |
| 그 외/미지정 (현재 UI는 `en`)    | Google                           | 좌표 기준   | 없음     |
| 경로 좌표 중 하나라도 한국       | 위 언어 정책 유지                | Kakao only  | 없음     |
| 경로의 모든 좌표가 한국 geofence 밖 | 위 언어 정책 유지             | Google only | 없음     |

- routing geofence는 행정경계 원본이 아니라 주요 국내 도로 영역과 제주·서해 주요 섬·울릉도·독도를 포함한 로컬 판정이다. API wire에는 국가 코드가 없으므로 좌표로 판정한다.
- 잘못된 좌표는 provider 호출 전에 `400 Invalid route coordinate`로 거절한다.
- 한국이 포함된 경로에서 Kakao가 실패해도 Google로 fallback하지 않는다. 모두 해외인 경로에서 Google이 no-route 또는 운영 오류를 반환해도 Kakao를 호출하지 않는다.
- Kakao 기본 경로 조회는 `alternatives=false`로 `RECOMMEND`, `DISTANCE`, `TIME`을 각각 한 번 호출해 최대 3개 부분 성공을 반환한다. API가 지원하는 `MAIN_ROAD`, `NO_TRAFFIC_INFO`는 현재 UI 범위에서 제외한다.
- stopby 재계산은 사용자가 선택한 route `priority`와 toll 회피 값을 그대로 사용한다.
- adapter 인스턴스에는 언어나 지역 상태를 저장하지 않으므로 동시 요청 간 context가 섞이지 않는다.
- 이전 `DEFAULT_MAP_PROVIDER` 및 port별 provider override 환경변수는 더 이상 사용하지 않는다.

### 한국 경로의 경로상 검색

한국 좌표가 포함된 route 계산은 앱 언어와 무관하게 Kakao only다. 하지만 선택된 route의
path를 사용하는 `/map/search-on-path`는 non-route 정책을 따르므로 앱 언어로 provider를
결정한다.

| 앱 언어 | route 계산 | 경로상 장소 검색 |
| ------- | ---------- | ---------------- |
| `ko`    | Kakao      | Kakao Local API: path를 반경 기준 vertex로 샘플링한 뒤 각 지점의 원형 검색 결과를 dedupe·정렬 |
| `en`    | Kakao      | Google Places Search Along Route: Kakao path를 encoded polyline으로 변환해 1회 검색(`pageSize: 20`, 한국 좌표면 `regionCode: KR`) |

따라서 영어 모드의 한국 경로는 **Kakao route + Google 경로상 장소 검색** 조합이다. 지도
renderer(Naver/Google) 선택은 이 데이터 provider 결정에 영향을 주지 않는다.

### FE 언어 선택, 저장, 세션 경계

위치:

- dictionary/translator: `OnMyWay_FE_V3/src/i18n/dictionaries.ts`
- Recoil hook: `OnMyWay_FE_V3/src/hooks/useTranslation.ts`
- transient reset: `OnMyWay_FE_V3/src/hooks/useResetMapSession.ts`
- navigation boundary: `OnMyWay_FE_V3/App.tsx`

최초 설치 후 첫 실행에서만 기기 locale을 기본값으로 사용한다. `ko` prefix면 `ko`, 그 외
모든 기기 언어는 `en`을 선택하고 AsyncStorage `language` key에 즉시 저장한다. 이후 앱
실행에서는 저장값이 authoritative source이며 기기 언어가 바뀌어도 자동으로 덮어쓰지
않는다. 드로어에서 사용자가 `한국어`/`English`를 직접 바꿀 수 있다.

수동 언어 변경 시 language와 해당 언어의 기본 renderer(`ko`→Naver, `en`→Google)를
함께 저장한다. request language를 갱신하고 transient 지도 상태를 초기화한 뒤 Recoil
언어와 renderer를 바꾼다. 이후 사용자는 renderer만 별도로 다시 변경할 수 있다.

`RecoilRoot`, `LanguageInitializer`, 전역 `Toast`는 언어 key 밖에 유지한다. 기존
`useRecoilState`/`useRecoilValue` 호출 이름은 `src/state/atom.ts`의 Zustand 5 compatibility
facade가 제공하며 `recoil` package 의존성은 없다. 오직
`RootStackNavigation`만 `languageState-mapRendererState` key를 부여한
`MapSessionBoundary` 안에서 remount한다. 언어와 renderer 상태 외 다음 transient atom만
기본값으로 되돌린다: `navigationState`, `whichNavState`, `onSelectRouteState`,
`curPlaceState`, `selectedPlaceIndexState`, `modalState`, `listModalState`, `drawerState`,
`loadingState`, `mapCenterState`, `lastCenterState`, `headerRoughState`,
`headerHeightState`. `mapCenterState`와 `lastCenterState`의 reset 값은 `null`이며 임의 좌표로
대체하지 않는다. 일반 지도는 실제 위치 조회가 성공한 뒤 center를 채우고, 실패하면 native
map을 mount하지 않은 채 번역된 재시도 UI를 표시한다. 초기화할 때 진행 중 toast도 숨긴다.

`axiosDefault`와 `axiosInstance`는 요청 시작 시 언어를 config에 캡처하고 같은 값으로
`Accept-Language`를 설정한다. 성공 응답이 돌아왔을 때 현재 request language가 다르면
식별 가능한 cancellation 오류로 응답을 폐기한다. API wrapper는 이 의도적 취소를 로그,
alert, toast 없이 처리하므로 이전 언어 응답이 새 세션 상태를 덮어쓰지 않는다.

### FE 지도 renderer 선택

위치:

- 공용 컨테이너: `OnMyWay_FE_V3/src/components/maps/omwMapView.tsx`
- 공용 마커/경로: `OnMyWay_FE_V3/src/components/maps/mapPrimitives.tsx`
- 상태/기본값: `src/atoms/mapRendererState.ts`, `src/config/mapRenderer.ts`

지도 타일 renderer는 드로어의 `지도 설정`에서 `국내 지도`(Naver, `@mj-studio/react-native-naver-map`)와
`구글맵`(`react-native-maps` `PROVIDER_GOOGLE`) 중 선택한다. 최초 설치 후 첫 실행의
기본값은 최초 앱 언어 기준(한국어→Naver, 영어→Google)이며 AsyncStorage `mapRenderer`
key에 즉시 저장한다. 이후에는 사용자가 지정한 renderer를 앱 재시작과 기기 언어 변경에도
유지한다. 사용자가 앱 언어를 수동 변경할 때만 해당 언어 기본 renderer로 재설정하며,
그 뒤 renderer를 다시 별도로 변경할 수 있다. renderer 변경도 transient 지도 세션을
초기화하고 `RootStackNavigation`을 `언어-renderer` key로 remount한다.

4개 지도 화면(naverMap, selectRouteMap, selectMap, showMap)과 마커·경로 컴포넌트는
Naver/Google 타입을 직접 쓰지 않고 `OmwMapView`, `MapMarker`, `MapPath` 공용 계약만
사용한다. zoom 값은 두 SDK 모두 web mercator 계열이라 공유하며, Google 쪽은
`onRegionChangeComplete`에서 zoom과 coveringRegion을 계산해 Naver와 같은 이벤트
shape로 변환한다. Google Polyline은 outline을 지원하지 않아 단색 선으로 근사한다.

center 초기화도 renderer와 분리한다. 일반 지도는 실제 위치, 경로 선택 지도는
start/waypoint/end 평균 geometry, 지도 직접 선택 화면은 last center → global center →
실제 위치 순서로 초기화한다. 경로 결과가 오면 현재는 거리별 zoom bucket과
coveringRegion 반복 보정으로 모든 지점을 화면 안에 넣는다. Naver/Google 공통
bounds/`fitToCoordinates` + header·route-card padding 계약으로 교체하는 작업과 실제
short/long route·0/1/2 waypoint 시각 검증은 runtime backlog다.

renderer 선택은 지도 타일에만 적용된다. 주소·장소·경로 **데이터 API provider**(언어 기반
Kakao/Google, 좌표 기반 route provider)는 renderer와 독립적으로 동작한다.

native key 배선(값은 Git 밖 `.env`에만 저장):

- Android: `app/build.gradle`이 FE `.env`의 Android Google/Naver 값을 manifest placeholder로 주입한다.
- iOS: `Inject Map API Configuration` build phase가 iOS Google/Naver 값을 build artifact Info.plist에만 주입하고 AppDelegate가 Google 값을 `GMSServices`에 전달한다.
- RN `0.86.2` 기준 `react-native-maps` `1.29.0`, `@mj-studio/react-native-naver-map` `2.9.0`, GoogleMaps pod `9.4.0`, NMapsMap pod `3.23.2`를 사용한다. New Architecture와 Hermes가 활성화되어 있다.
- iOS app/project/test minimum deployment target은 CocoaPods와 동일한 `15.1`이다. unsigned generic iOS Simulator compile은 통과했으며 실제 simulator/device runtime smoke는 아직 남아 있다.

## 3-1. FE BASE_URL 해석 규칙

위치: `OnMyWay_FE_V3/src/config/consts/api.ts`

```text
개발 build:
  SERVER_BASEURL 없음 → http://{host}:{SERVER_PORT ?? 3005}
                          host = Android ? 10.0.2.2 : localhost

실기기·staging·production build:
  SERVER_BASEURL 있음 → http:// 또는 https:// absolute URL을 trailing slash 없이 사용
  production에서 없음 → 시작 시 명시적 configuration error
```

- 로컬 BE 기본 포트와 Nest fallback은 `3005`다. FE `SERVER_PORT`와 BE `PORT`를 일치시킨다.
- production BE는 Railway 등 배포 플랫폼이 주입한 내부 `PORT`를 사용하고 `0.0.0.0`에 bind한다.
- 외부 `http/https`와 기본 포트 `80/443`, TLS 종료는 reverse proxy가 담당한다. FE는 `SERVER_BASEURL`에 설정한 scheme을 그대로 사용한다.
- `10.0.2.2`는 Android 에뮬레이터가 호스트 맥을 가리키는 주소이고, iOS 시뮬레이터는 호스트와 `localhost`를 공유한다.
- `.env` 변경은 build-time에 인라인되므로 Metro 캐시 리셋이 필요하다.

## 4. FE ↔ BE wire 계약 (고정)

모든 지도 endpoint 요청은 `Accept-Language: ko|en`을 포함한다. 기존 경로·요청 DTO·응답
shape는 변경하지 않았다.

| Endpoint               | Method | 요청 핵심                                                             | 응답 data                                                                           |
| ---------------------- | ------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/map/get-address`     | GET    | `x`(lng), `y`(lat)                                                    | `{road_address?, address}[]`                                                        |
| `/map/keyword-search`  | GET    | `query`, `x?`, `y?`, `radius?`, `size?`                               | `{provider, provider_place_id?, attribution, place_name?, address_name, road_address_name?, place_url?, x:number, y:number}[]` |
| `/map/driving-route`   | GET    | `origin`/`destination`="lng,lat", `waypoints?`(" \| " 연결), `avoid?` | `{priority, duration(s), distance(m), path:{latitude,longitude}[]}[]`               |
| `/map/search-on-path`  | POST   | `{query, path:[[x,y]...], totalDistance, radius}`                     | keyword-search와 동일 shape                                                         |
| `/map/stopby-duration` | GET    | driving-route + `stopby`                                              | `{strategy?, duration(s), path}`                                                    |
| `/map/place-detail`    | GET    | `id`(provider place id; 현재 Google만 발급)                            | `{provider, attribution, field_status, id, place_name?, address_name?, place_url?, open, opening_hours, parking, rating, rating_count}` — null은 UNKNOWN |

- `카테고리 : <라벨>` magic query는 두 adapter 모두 해석한다. Google 영어 요청은 기존
  한국어 category label도 영어 검색어로 변환한다.
- route/stopby는 선택된 단일 provider 안에서 `Promise.allSettled` 기반 부분 성공을 유지한다. provider 간 fallback은 없다.
- `PlaceInputHeader`의 현위치/즐겨찾기/지도 선택 action은 icon-only SVG와 번역된 RN `Text`를 조합한다. 기존 한글 outline glyph SVG는 삭제하지 않지만 active TS/TSX에서 사용하지 않는다.

## 5. Google adapter 세부

- `languageCode`는 요청 context를 사용한다.
- `regionCode`는 좌표 기반으로 유도한다: 요청 좌표(reverse geocode의 x/y, 검색의
  locationBias 중심, 경로상 검색의 첫/중간/끝 vertex 샘플)가 한국 routing geofence 안이면
  `KR`, 해외면 미지정(Google 자체 추론). 좌표가 없는 텍스트 검색만 언어 fallback
  (`ko`→`KR`, `en`→미지정)을 사용한다. region은 필터가 아니라 순위 bias·주소 표기 힌트다.
- 단위는 현재 언어와 무관하게 `METRIC`을 유지한다.
- Places Text Search FieldMask: displayName, formattedAddress, shortFormattedAddress, location, googleMapsUri (Lean 단계)
- Routes: `TRAFFIC_AWARE`(RECOMMEND) / `TRAFFIC_AWARE_OPTIMAL`(TIME) / `requestedReferenceRoutes=[SHORTER_DISTANCE]`(DISTANCE, 경유지 없을 때만 — Google이 경유지+reference route 조합을 미지원)
- Search Along Route: FE가 보낸 path를 encoded polyline으로 변환해 전달
- 오류는 `MapProviderException`으로 정규화한다. public `error`는 `MAP_PROVIDER_QUOTA_EXCEEDED`(503), `MAP_PROVIDER_AUTHENTICATION_FAILED`(기본 502), `MAP_PROVIDER_TIMEOUT`(504), `MAP_PROVIDER_UNAVAILABLE`(기본 502), `MAP_PROVIDER_INVALID_RESPONSE`(기본 502) 중 하나이며 외부 provider의 raw message·payload는 client나 로그에 전달하지 않는다.
- 성공 응답의 빈 `routes`만 adapter 내부에서 `RouteNotFoundError`로 변환한다. 필수 route duration/distance/polyline 누락은 빈 경로로 위장하지 않고 `MAP_PROVIDER_INVALID_RESPONSE`로 처리한다. 해외 좌표 경로는 이 오류들을 그대로 전파하며 route resolver가 Kakao를 호출하지 않는다.

## 6. FE 유의 사항

- 상세 bottom sheet와 추가 정보 보강은 Kakao `place_url`의 숫자 ID에 의존한다.
  Google `place_url`(googleMapsUri)에는 숫자 ID가 없으므로 두 지점에 가드를 적용했다:
  - `mainBottomSheet.tsx`: placeId 없으면 Kakao 보강 skip
  - `keywordSearchBox.tsx`: placeId 없으면 원본 place 그대로 사용
- Google 결과의 상세 bottom sheet는 `place_id`로 BE `/map/place-detail`을 호출해
  영업 여부·주차·평점·평점 수를 보강한다(`src/api/getPlaceDetail.ts`). `null`(UNKNOWN)은
  undefined로 두어 badge를 만들지 않으며 false로 표시하지 않는다. 상세 보강 실패는 기본
  정보 표시를 막지 않는다. 비용 제어를 위해 검색 목록 전체가 아니라 사용자가 선택한
  장소만 1회 조회한다. WebView 상세 링크는 googleMapsUri를 연다.
- 장소 전환 시 이전 장소의 보강 상태를 초기화해 provider가 섞여도 stale badge가
  나타나지 않는다.
- 비활성 OpenAI 리뷰 요약 UI, Kakao 리뷰 scraper, FE API wrapper, BE `/map/get-review-summary`
  endpoint와 OpenAI client/config는 제거했다. 장소 상세와 검색 핵심 flow는 이 기능에 의존하지 않는다.

## 6-1. Place Detail (신규)

- `PlaceDetailProvider` port와 `GoogleMapAdapter.getPlaceDetail` 구현. Google Text Search
  FieldMask에 `places.id`를 추가해 `PlaceResult.place_id`(Google 결과에만 존재)로 노출한다.
- `GET /map/place-detail?id=...`은 provider place id 기반이며 현재 Google만 지원한다.
  Kakao 상세는 기존 FE `place_url` 경로를 유지한다.
- 응답의 `open`/`parking`/`rating`/`rating_count`/`opening_hours`에서 `null`은 UNKNOWN이며
  false로 강제 변환하지 않는다. 각 필드의 `field_status`는 `KNOWN | UNKNOWN | UNSUPPORTED`를
  명시하고, `attribution`은 provider와 원본 장소 URL을 보존한다. 현재 Google optional field
  누락은 `UNKNOWN`이며 지원하지 않는 provider capability에는 `UNSUPPORTED`를 사용한다.
  `parkingOptions` FieldMask는 Enterprise + Atmosphere SKU를
  유발하므로 변경 시 비용 문서를 함께 갱신한다.

## 7. 남은 아키텍처 작업 (backlog)

1. FE 상세 화면의 provider-neutral 데이터 렌더링 (`/map/place-detail` 연결 완료 이후 Kakao WebView 의존 제거)
2. provider-neutral `SearchIntent` parser (영업시간·주차·우회 조건 구조화)
3. provider별 attribution을 FE 상세 UI에 표시하고 provider-neutral contract suite 도입
4. Lean/Core/Rich FieldMask 단계와 fill-rate·비용 gate 운영
5. 좌표 기반 route provider 정책의 한국 geofence fixture·품질·비용 gate 운영
6. renderer 공통 bounds/fit + UI padding 계약을 도입하고 두 renderer에서 short/long route, 0/1/2 waypoint, marker z-index를 simulator/device로 검증
