# OnMyWay Feature Insights

> 최초 작성: 2026-08-02
> 최종 갱신: 2026-08-07
> 목적: 장소 검색·경로 주변 검색 기능의 제품 요구사항, 외부 서비스 조사, 기술 결정을 지속적으로 누적한다.

## 1. 상태 표기

- **결정됨**: 제품 또는 구현 방향으로 합의한 내용
- **후보**: 유효하지만 실측·비용 검증 후 선택할 내용
- **미검증**: 공식 문서만으로 확정할 수 없거나 실제 데이터 품질 테스트가 필요한 내용
- **권장 실험**: 짧은 프로토타입으로 검증할 항목

## 2. 핵심 제품 요구사항

### 결정됨: 카테고리가 아닌 자유 텍스트 검색

사용자는 미리 정의된 카테고리를 선택하는 대신 어떤 언어로든 검색어를 입력할 수 있어야 한다.

예시:

- `맥도날드 dt`
- `McDonald's drive through`
- `マクドナルド ドライブスルー`
- `강남 가는 길에 주차 가능한 조용한 카페`

검색 시스템은 입력 언어와 표현을 그대로 보존하면서 다음 의도를 구분해야 한다.

- 브랜드·장소명: `맥도날드`
- 속성: `DT`, 드라이브스루, 주차 가능, 24시간
- 지역·경로 조건: 현재 위치 주변, 목적지 주변, 경로상
- 선호 조건: 조용한, 평점 높은, 우회가 적은

카카오·TMAP의 문자열 검색 파라미터는 자유 문자열을 받지만, 임의 언어의 의미·별칭·오탈자·속성을 이해하는 검색 엔진이라고 간주해서는 안 된다. `맥도날드 dt`가 데이터에 등록된 문자열과 일치할 수는 있으나 DT 시설 여부를 보장하지 않는다.

### 결정됨: 음성 인식은 자유 텍스트 검색의 보조 입력 방식

검색창은 키보드뿐 아니라 음성으로도 같은 자유 텍스트 검색을 시작할 수 있어야 한다. 음성 인식 결과는 별도 검색 규칙으로 처리하지 않고 `VOICE` 입력 출처와 locale을 붙인 transcript로 변환해 기존 `SearchIntent` 파이프라인에 전달한다.

제품 원칙:

- microphone 버튼에서 듣기·처리·확인·오류 상태를 명확히 표시한다.
- 인식 transcript를 검색 전에 보여주고 수정·확인할 기회를 제공해 오인식과 불필요한 지도 API 호출을 줄인다.
- 한국어·영어·일본어를 포함한 사용자 locale과 다국어 브랜드명을 검증한다.
- 권한 거부, 네트워크 오류, 미지원 기기에서도 텍스트 검색은 항상 동작해야 한다.
- 원본 음성은 기본 저장하지 않고 transcript와 정밀 위치가 analytics·일반 로그에 원문으로 남지 않게 한다.
- 음성 인식 공급자는 `SpeechRecognitionAdapter` 뒤에 격리해 iOS·Android 시스템 기능과 cloud STT를 정확도·지연·비용·개인정보 기준으로 교체할 수 있게 한다.
- native SDK가 필요하면 OTA로 추가할 수 없으므로 해당 SDK와 권한 문구가 포함된 store binary가 필요하다.
- 첫 Google vertical slice는 텍스트 검색으로 검증하되 submit 계약을 입력 방식과 분리하고, 실제 음성 인식은 후속 제품 단계에서 remote feature flag로 활성화한다.
- 음성 입력만으로 활성 주행 중 안전이 보장된다고 간주하지 않는다. 완전 hands-free, CarPlay, Android Auto는 별도의 안전성·플랫폼 정책 gate를 거친다.

## 3. 권장 검색 파이프라인

1. 원문 쿼리와 입력 언어를 보존한다.
2. LLM 또는 규칙 기반 파서가 브랜드, 속성, 지역, 경로 조건을 구조화한다.
3. 원문, 한국어 정규화 표현, 브랜드 별칭을 검색 공급자에 병렬 요청한다.
4. 공급자 Place/POI ID를 우선 사용하고 좌표·전화번호·정규화 이름으로 교차 중복 제거한다.
5. DT·주차·영업시간 같은 속성은 상세 API 또는 신뢰 가능한 별도 데이터로 검증한다.
6. 직선거리 대신 경로까지의 거리, 실제 우회 거리와 추가 소요시간으로 재정렬한다.
## 4. 서비스별 검색·상세정보 비교

| 서비스 | 자유 문자열 검색 | 공식 경로 주변 검색 | 공개 API 상세정보 | 평점·리뷰 |
|---|---|---|---|---|
| 네이버 지역검색 | 지원하나 국내 지역검색 중심 | 없음 | 이름, 카테고리, 설명, 주소, 좌표, 링크 | 제공 안 함 |
| 카카오 Local | `query` 지원, 좌표·반경·사각영역 결합 가능 | 없음 | ID, 이름, 카테고리, 전화, 주소, 좌표, 기준점 거리, 장소 URL | 제공 안 함 |
| TMAP POI | `searchKeyword` 지원 | `findPoiRoute` 제공 | POI ID, 주소, 좌표, 전화, 카테고리, 입구, 일부 주차·시설 정보 | 일반 리뷰 제공 안 함 |
| Google Places | 다국어 text query와 다양한 장소 필드 | Search Along Route 제공 | 영업시간, 전화, 웹사이트, 가격대, 사진, 주차·예약·접근성 등 | 평점, 리뷰 수, 제한된 대표 리뷰 |
| Google Maps Grounding Lite MCP | 자연어 `text_query` 지원 | 전용 도구 없음 | 자연어 요약, Place ID, 좌표, Maps 링크 중심 | raw 상세 객체 전체 제공 목적은 아님 |

### 앱 화면과 공개 API 구분

네이버지도·카카오맵 앱 또는 웹 페이지에 보이는 영업시간, 사진, 평점, 리뷰가 공개 개발자 API에 포함된다는 뜻은 아니다. 현재 공개 API만으로 네이버·카카오 사용자 리뷰를 가져올 수 없다. 브라우저 자동화나 크롤링은 기술적으로 가능할 수 있지만 약관, robots 정책, 로그인·동적 렌더링, DOM 변경, 개인정보와 운영 안정성 위험이 있으므로 핵심 데이터 공급 방식으로 채택하지 않는다.

### 상세정보 풍부도

현재 공개 API 기준 대략적인 순서는 `Google > TMAP > Kakao > Naver`다. 단, 국내 POI 최신성·현지 상호명 품질은 별도 실측이 필요하다. Google 고급 필드는 요청한 field mask에 따라 더 높은 SKU 비용이 발생할 수 있다.

## 5. 경로 주변 장소 검색

### 공급자 기능

- **네이버**: 공개 지역검색 API에 좌표 반경 검색이나 Search Along Route가 없다.
- **카카오**: `x`, `y`, `radius` 또는 `rect` 기반 검색은 가능하지만 polyline 경로 검색은 없다. 반경은 최대 20km다.
- **TMAP**: `POST /tmap/poi/findPoiRoute`가 `lineString`, `scoreradius`, 키워드·카테고리 및 정렬 옵션을 받는다.
- **Google**: Routes API의 encoded polyline을 Places Text Search의 Search Along Route에 전달할 수 있다.

### 현재 백엔드 구현

관련 코드:

- `OnMyWay_BE_V3/src/modules/map/map.service.ts`
- `OnMyWay_BE_V3/src/helpers/selectVertices.ts`
- `OnMyWay_BE_V3/src/apis/kakaoPlaceSearch.ts`
- `OnMyWay_BE_V3/src/config/consts.ts`

현재 흐름은 다음과 같다.

1. Kakao Mobility에서 `RECOMMEND`, `DISTANCE`, `TIME` 우선순위 경로를 조회한다.
2. 경로 polyline의 좌표 배열을 평균 인덱스 간격으로 샘플링한다.
3. 각 샘플 좌표에서 카카오 Local 키워드 반경 검색을 병렬 실행한다.
4. 장소명과 주소 기반으로 결과를 중복 제거한다.
5. 여러 원형 검색 결과의 합집합을 경로 주변 결과처럼 반환한다.

이는 카카오가 제공하는 경로 검색 API가 아니라 애플리케이션에서 만든 근사 방식이다.
### 현재 구현의 확인된 한계

- 좌표 간 실제 거리 대신 `totalDistance / (path.length - 1)` 평균값과 배열 인덱스로 샘플링한다.
- polyline과 장소 사이의 실제 point-to-polyline 거리를 계산하지 않는다.
- 카카오 결과의 장소 ID와 기준점 거리 등 재랭킹에 필요한 필드를 버린다.
- `sort=distance`를 사용하지 않는다.
- 응답 메타의 `total_count`를 개별 장소의 `priority`처럼 저장한다.
- 추가 조회에서 `page`를 증가시키지 않아 첫 페이지를 사실상 반복할 수 있다.
- 실제 우회 거리와 추가 소요시간을 계산하지 않는다.
- “검색점 약 10개 이하”라는 의도를 DTO 검증으로 강제하지 않는다.
- `radius`가 없을 때 선택에는 20km 기본값을 쓰지만 이후 `radius.toString()`을 호출하는 경로는 입력값 부재 시 안전하지 않다.

### 개선 후보

- 단기: 거리 기반 polyline resampling, `page`·`sort=distance` 적용, 장소 ID 보존, point-to-polyline 거리 필터링
- 중기: 상위 후보에 대해서만 우회 경로를 계산해 추가 거리·시간으로 재정렬
- 대안 A: 국내 POI 품질을 유지하면서 TMAP `findPoiRoute` 도입
- 대안 B: Google Routes + Places Search Along Route 도입
- 대안 C: 여러 공급자의 후보를 통합하고 국내·글로벌 결과를 교차 검증

## 6. MCP 조사

### Google 공식 MCP

#### Maps Grounding Lite

Google이 운영하는 공식 Remote MCP 엔드포인트가 있다.

- 엔드포인트: `https://mapstools.googleapis.com/mcp`
- 도구: `search_places`, `compute_routes`, `lookup_weather`, `resolve_names`, `resolve_maps_urls`
- `search_places`: 필수 `text_query`, 언어·지역 코드, 최대 50km 원형 location bias 지원
- `compute_routes`: DRIVE/WALK 거리·시간 제공. 턴바이턴 내비게이션이나 완전한 실시간 교통 API 대체재는 아니다.
- 도구별 프로젝트 쿼터: 공식 문서 기준 300 QPM
- Search Along Route 전용 MCP 도구는 확인되지 않았다. 이 기능은 직접 Places API를 사용한다.

공식 출처:

- [Maps Grounding Lite MCP reference](https://developers.google.com/maps/ai/grounding-lite/reference/mcp)
- [Google 공식 MCP 서버 목록](https://github.com/google/mcp)

#### Maps Platform Code Assist

`https://mapscodeassist.googleapis.com/mcp`도 Google 공식 Remote MCP지만, 장소를 검색하는 런타임 API가 아니라 Google Maps Platform 문서와 구현 지침을 찾는 개발 지원 도구다. `retrieve-instructions`, `retrieve-google-maps-platform-docs`를 제공한다.

### 국내 지도 MCP 상태

2026-08-02 조사 기준 네이버·카카오·TMAP이 직접 운영한다고 확인된 장소 검색 MCP는 없다. 확인된 것은 공식 REST API를 감싼 커뮤니티 프로젝트다. “공식 MCP 없음”은 공개 자료 기준이며 향후 변경될 수 있다.

- [KiMCP: 네이버·카카오·TMAP 통합](https://github.com/zeikar/kimcp)
- [mcp-naver-maps](https://github.com/yunkee-lee/mcp-naver-maps)
- [mcp-server-kakao-map](https://github.com/cgoinglove/mcp-server-kakao-map)
- [kakao-navigation-mcp-server](https://github.com/CaChiJ/kakao-navigation-mcp-server)

커뮤니티 MCP 소스 자체는 대체로 무료 오픈소스지만, 실행 인프라와 하위 지도 API 호출료는 별도다. 저장·캐시·표시·attribution 조건도 각 API 약관을 따른다.
## 7. 가격 비교

> 아래 금액과 쿼터는 2026-08-02 공식 공개 자료를 기준으로 한 스냅샷이다. 실제 도입 전 결제 계정, 국가, 계약, 월간 구간, field mask와 최신 가격표를 다시 확인해야 한다. MCP 요청 1회와 하위 API 요청 수가 항상 1:1이라고 가정하지 않는다.

### Google Maps Platform

첫 번째 공개 가격 구간의 정가이며 단위는 USD/1,000 billable events다.

| SKU | 월 무료 사용량 | 첫 유료 구간 |
|---|---:|---:|
| Maps Grounding Lite | 10,000 | $7 |
| Text Search Pro | 5,000 | $32 |
| Nearby Search Pro | 5,000 | $32 |
| Place Details Pro | 5,000 | $17 |
| Text Search Enterprise | 1,000 | $35 |
| Text Search Enterprise + Atmosphere | 1,000 | $40 |
| Place Details Enterprise | 1,000 | $20 |
| Place Details Enterprise + Atmosphere | 1,000 | $25 |
| Compute Routes Essentials | 10,000 | $5 |

출처: [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

Google Grounding Lite MCP는 별도 오픈소스 래퍼 비용이 아니라 Grounding Lite SKU로 과금된다. Places 직접 호출은 요청한 필드에 따라 Pro·Enterprise·Atmosphere SKU가 달라질 수 있으므로 최소 field mask를 사용해야 한다.

### Kakao Developers

첫 번째 활성화 앱에 무료 쿼터가 적용되며 전체 월 300만 건 제한과 API별 일간 쿼터가 함께 적용된다.

| API | 일간 무료 쿼터 | 초과 단가 |
|---|---:|---:|
| 키워드 장소 검색 | 100,000 | 2원/건 |
| 카테고리 장소 검색 | 100,000 | 2원/건 |
| 주소·좌표 변환 | 각각 100,000 | 0.5원/건 |
| 대중교통·도보·자전거 경로 | 각각 1,000 | 10원/건 |
| 정적 지도 | 1,000 | 2원/건 |
| 지도 SDK | 300,000 | 0.1원/건 |

출처: [Kakao Developers 쿼터 및 유료 이용](https://developers.kakao.com/docs/ko/getting-started/quota)

카카오의 2026-07-21 신규 공개 API는 대중교통·도보·자전거 경로와 정적 지도다. 이는 장소 상세 필드나 리뷰 API의 확장이 아니다. 현재 프로젝트의 자동차 경로는 별도 Kakao Mobility API이므로 해당 상품의 최신 계약·가격을 따로 확인한다.

### Naver

- Naver Developers 지역검색 API: 공식 문서상 일 25,000회 호출 한도
- 공개 지역검색 문서에서 일반 초과 종량 단가는 확인하지 못함
- Naver Cloud Maps의 지도, Directions, Geocoding은 별도 상품·종량제

출처:

- [네이버 지역검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [Naver Cloud 요금 계산기](https://www.ncloud.com/charge/calc/ko)

### TMAP

공식 계산기에서 Free/Lite/Premium 구조와 POI 검색의 Free 일 20,000건, Lite 일 50,000건이 노출된다. 검색 결과에는 Lite 월 2,200,000원(VAT 포함) 문구도 있으나 상품·API별 적용 범위가 혼재되어 있다.

**미검증:** `findPoiRoute`가 포함되는 정확한 요금 그룹과 초과 종량 단가는 도입 전 TMAP 공식 콘솔 또는 영업 문의로 확인한다. 커뮤니티 게시물의 단가를 제품 비용 산정에 사용하지 않는다.

출처: [TMAP API 요금 계산기](https://openapi.sk.com/products/calc?svcSeq=4&menuSeq=5)
## 8. 추천 아키텍처

### 1차 구현 기준: Google 우선, provider-neutral 확장

1. V3 첫 구현은 Google Maps SDK, Places API (New), Routes API, Geocoding API만 연결한다.
2. 자유 텍스트를 `SearchIntent`로 구조화하고 Google query·FieldMask로 compile한다.
3. Routes encoded polyline과 Places Search Along Route로 경로상 후보를 조회한다.
4. 상위 후보의 `routingSummaries` 또는 waypoint 경로를 이용해 실제 추가 소요시간으로 재정렬한다.
5. Google 응답의 Place ID, attribution, 필드 상태 `KNOWN | UNKNOWN | UNSUPPORTED`를 보존한다.
6. use case는 `RouteProvider`, `PlaceSearchProvider`, `RoutePlaceSearchProvider`, `PlaceDetailProvider`, `GeocodingProvider` 포트만 참조하고 Google DTO를 노출하지 않는다.
7. Kakao·TMAP·Naver adapter와 provider 선택 UI는 첫 구현 범위에서 제외하되, 이후 adapter 추가만으로 확장할 수 있게 composition root와 `MarketConfig`를 분리한다.

이 기준은 가장 완전한 경로상 검색·영업시간·주차·평점 필드를 먼저 검증하면서 구현 범위를 줄인다. 한국 POI 품질이 부족할 경우에도 use case와 화면을 다시 작성하지 않고 Kakao 또는 TMAP adapter를 추가할 수 있어야 한다.

### MCP와 직접 API의 역할

- MCP: LLM 에이전트가 자연어로 장소·경로 도구를 호출하는 인터페이스에 적합
- 직접 API: 모바일 제품의 결정적 응답 스키마, 캐시, 랭킹, 비용 제어, Search Along Route에 적합
- 권장: 프로덕션 검색 백엔드는 직접 API를 중심으로 하고 MCP는 탐색형 AI 기능이나 프로토타입에 사용

## 9. 권장 실험

동일한 서울·수도권 경로와 다음 다국어 쿼리 세트를 각 공급자에 실행한다.

- `맥도날드 dt`
- `McDonald's drive through`
- `マクドナルド ドライブスルー`
- `주차 가능한 24시간 카페`
- `quiet cafe with parking`

측정 항목:

- top 10 precision과 누락률
- 브랜드 별칭·다국어 일관성
- DT·주차·영업시간 속성의 실제 정확도
- 국내 POI 최신성
- 평균·p95 지연시간
- 한 번의 사용자 검색당 공급자 호출 수와 예상 비용
- 경로 이탈 거리와 추가 소요시간

## 10. 열린 질문

- DT·주차 같은 시설 속성의 신뢰 가능한 기준 데이터는 무엇인가?
- 리뷰를 제품 핵심 기능으로 유지할 것인가, 원문 페이지 연결로 제한할 것인가?
- Google 데이터의 표시·캐시·attribution 조건을 현재 네이버 지도 UI와 함께 충족할 수 있는가?
- TMAP `findPoiRoute`가 자체 polyline 근사 검색보다 국내 경로에서 유의미하게 정확한가?
- 한 검색당 허용 가능한 API 비용과 p95 응답시간은 얼마인가?
- 결과 정렬의 최우선 기준은 관련도, 우회시간, 평점, 개인화 중 무엇인가?

## 11. 문서 갱신 원칙

새 조사나 결정이 생기면 이 문서를 함께 갱신한다. 변경 시 최종 갱신일, 공식 출처, 상태(결정됨·후보·미검증·권장 실험)를 기록하며, 앱 화면에서 보이는 기능과 공개 API에서 계약상 사용할 수 있는 필드를 구분한다.
## 12. Google Search Along Route 상세 및 전체 이전 비용

> 조사 기준: 2026-08-02. Google 공식 문서 최종 갱신일은 2026-07-28이다.

### Search Along Route의 실제 동작

Google Places API Text Search (New)는 Routes API가 반환한 encoded polyline을 `searchAlongRouteParameters.polyline.encodedPolyline`으로 받아 전체 경로 주변 장소를 검색한다. 결과는 고정 반경 안의 장소로 제한되는 것이 아니라 검색어 관련도와 출발지부터 목적지까지의 최소 우회시간에 편향된다.

권장 호출 흐름:

1. Routes API `computeRoutes`로 출발지→목적지 경로와 encoded polyline을 받는다.
2. Text Search (New)에 `textQuery`, polyline, 필요 시 `minRating`과 현재 진행 위치인 `routingParameters.origin`을 전달한다.
3. `rating`, `userRatingCount`로 앱에서 재정렬한다.
4. 필요할 때만 `reviews`와 `routingSummaries`를 요청한다.
5. 원 경로 시간·거리와 각 결과의 2개 leg를 비교해 실제 우회시간·거리를 계산한다.

`리뷰 좋은 간장게장집`은 검색할 수 있지만 “리뷰 좋은”을 검색어에만 맡기지 않는다. `간장게장집`과 `minRating`(0~5, 0.5 단위)을 분리하고, 응답의 평점·평가 수를 함께 사용해 재정렬하는 편이 예측 가능하다. 평가 수 최소값 필터나 평점순 정렬은 애플리케이션에서 처리한다.

### 공식 MCP와 결합 가능성

Maps Grounding Lite 공식 MCP의 `search_places`는 자유 텍스트와 원형 location bias를 지원하지만 encoded polyline 입력은 지원하지 않는다. `compute_routes`도 Grounding Lite 용도의 제한된 경로 도구이며 Search Along Route polyline 전달 도구가 아니다.

따라서 공식 MCP 도구만 연결해서 Search Along Route를 완성할 수는 없다. 다음 중 하나가 필요하다.

- 백엔드가 Routes API + Places Text Search API를 직접 호출
- 두 API를 감싼 `search_places_along_route` 커스텀 MCP 도구 구현
- LLM은 검색어 구조화에만 사용하고 실제 검색·비용·필드 제어는 백엔드가 담당

프로덕션 권장안은 직접 API 호출을 핵심 경로로 두고, 필요하면 같은 서비스 함수를 커스텀 MCP 도구로도 노출하는 것이다. Grounding Lite MCP를 추가 호출하면 기능상 필수는 아니지만 별도 Grounding Lite 사용량이 발생한다.

### 검색·데이터·granularity 제한

- Text Search는 페이지당 1~20개, 기본 20개를 반환한다.
- `nextPageToken`으로 최대 3페이지, 전체 최대 60개다. 제한은 변경될 수 있다.
- 다음 페이지도 별도 API 요청이며 과금 이벤트가 추가된다.
- 응답 필드는 FieldMask로 지정하며 기본 필드가 없다. 누락하면 오류다.
- 이름·주소·좌표는 Pro, 평점·평가 수·영업시간은 Enterprise, 리뷰·주차·routing summary는 Enterprise + Atmosphere를 유발한다.
- Place 객체의 리뷰 원문은 최대 5개다. 전체 리뷰 목록을 가져오는 API가 아니다.
- 리뷰·검색 결과는 동일 요청에도 항상 완전히 같다고 보장되지 않는다.
- 전체 경로가 기본 검색 범위이며 현재 위치를 `routingParameters.origin`으로 지정해 이미 지난 구간의 영향도를 줄일 수 있다.
- 경로 corridor 폭이나 “경로에서 정확히 N미터” 같은 반경을 지정하는 파라미터는 없다. 경로 검색은 strict restriction이 아니라 bias다.
- `locationBias` 또는 `locationRestriction`을 polyline과 조합할 수 있지만 최소 우회 기반 편향 자체는 유지된다.
- Search Along Route는 encoded polyline만 받는다. Routes API의 `OVERVIEW`와 `HIGH_QUALITY`는 입력 경로 점의 정밀도를 조절하지만 검색 corridor 폭을 조절하지 않는다.
- Places API의 Search Along Route에서는 대중교통 경로를 지원하지 않는다.
- 출발지와 목적지가 같거나 매우 가까우면 최소 우회 계산 특성상 결과가 없을 수 있다.
- `routingSummaries`는 각 장소에 대해 출발지→장소, 장소→목적지의 두 leg를 반환한다. 원 경로와의 차이는 앱에서 계산한다.

공식 출처:

- [Search along route](https://developers.google.com/maps/documentation/places/web-service/search-along-route)
- [Search Along Route 개요](https://developers.google.com/maps/documentation/places/web-service/sar-overview)
- [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Search Along Route와 routing summary 결합](https://developers.google.com/maps/documentation/places/web-service/routing-summary-sar)
- [Routes polyline 품질](https://developers.google.com/maps/documentation/routes/traffic_on_polylines)
- [Places API 정책 및 리뷰 제한](https://developers.google.com/maps/documentation/places/web-service/policies)

### Google 전체 이전 시 주요 SKU

| 기능 | SKU | 월 무료 사용량 | 첫 유료 구간(USD/1,000건) |
|---|---|---:|---:|
| Android/iOS 지도, map ID 없음 | Maps SDK | 무제한 | 무료 |
| Android/iOS 지도, map ID 사용 | Dynamic Maps | 10,000 | $7 |
| 일반 경로 | Compute Routes Essentials | 10,000 | $5 |
| 교통 반영 경로 | Compute Routes Pro | 5,000 | $10 |
| 이름·주소·좌표 경로 검색 | Text Search Pro | 5,000 | $32 |
| 평점·평가 수·영업시간 포함 | Text Search Enterprise | 1,000 | $35 |
| 리뷰·주차·우회 summary 포함 | Text Search Enterprise + Atmosphere | 1,000 | $40 |
| 선택 장소 리뷰 포함 상세 | Place Details Enterprise + Atmosphere | 1,000 | $25 |
| 장소 사진 1회 로드 | Place Details Photos | 1,000 | $7 |
| 공식 MCP 검색 1회 | Maps Grounding Lite | 10,000 | $7 |
| 턴바이턴 내비게이션 목적지 1개 | Navigation Request | 1,000 | $25 |

Google 공식 가격표에서 네이티브 `Maps SDK` SKU는 월 무료 사용량이 Unlimited로 표시된다. 지도 표시 자체와 Places·Routes·Geocoding 호출은 별도 SKU이므로, 실제 비용은 주로 장소 검색과 경로 계산에서 발생한다. Web `Dynamic Maps`, Map Tiles, Navigation SDK 등 다른 상품을 추가하면 별도 과금된다.

### 월간 검색 세션 비용 예시

가정:

- 검색 세션마다 교통 반영 경로 1회
- Search Along Route 1페이지 1회
- map ID 없는 네이티브 Maps SDK
- 상세 화면 진입률 20%
- Autocomplete, 사진, 턴바이턴 내비게이션, LLM 비용, 세금과 환율 차이는 제외

| 월 검색 세션 | Lean: 평점·평가 수까지 | Rich: 리뷰·우회 summary + 20% 상세 |
|---:|---:|---:|
| 1,000 | $0 | $0 |
| 5,000 | $140 | $160 |
| 10,000 | $365 | $435 |
| 100,000 | $4,415 | $5,385 |

계산 방식:

- Lean: Compute Routes Pro + Text Search Enterprise
- Rich: Compute Routes Pro + Text Search Enterprise + Atmosphere + 20% Place Details Enterprise + Atmosphere
- 5,000 세션 Lean은 Text Search Enterprise의 무료 1,000건을 제외한 4,000건 × $35/1,000 = $140이다.
- 10,000 세션 Rich는 Routes $50 + Text Search $360 + 상세 $25 = $435다.
- 결과 2·3페이지를 항상 읽으면 Text Search 비용은 각각 약 2배·3배가 된다.
- 검색 결과에서 받은 필드를 재사용해 별도 Place Details를 생략하면 Rich 비용에서 상세 비용을 뺄 수 있다.

추가 비용 예시:

- Web Dynamic Maps 100,000회 로드: 무료 10,000회 제외 후 약 $630. 현재 네이티브 Maps SDK 비용과는 별개다.
- 사진 20,000회 로드: 무료 1,000회 제외 후 약 $133
- Grounding Lite MCP 100,000회 추가 호출: 무료 10,000회 제외 후 약 $630
- Navigation SDK 목적지 100,000개: 무료 1,000개 제외 후 약 $2,475

결론적으로 현재 OnMyWay 기능 범위에서는 지도 SDK보다 Places Text Search가 비용의 대부분을 차지한다. 비용 최적화 우선순위는 페이지 수 제한, 최소 FieldMask, 검색 응답 재사용, 리뷰·routing summary의 지연 로딩, 공식 MCP 중복 호출 방지 순서다.

가격 출처:

- [Google Maps Platform 가격표](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform SKU 과금 조건](https://developers.google.com/maps/billing-and-pricing/sku-details)

## 13. Google Maps 전체 마이그레이션 검토

> 조사 기준: 2026-08-02. 이 섹션은 Google 단일 공급자로 이전할 수 있는지를 평가한 기록이다. **2026-08-07 현재 구현 기준은 23장의 언어 기반 검색·좌표 지역 기반 경로 전략이며, 이 장의 Google-only 단계보다 23장을 우선한다.**

### 당시 Google 단일화 평가안: 제거할 기능과 필수 데이터

- OpenAI 리뷰 요약 기능과 관련 API·환경변수·의존성을 제거한다.
- 당시 단일화안에서는 Kakao Place 웹 내부 엔드포인트를 사용하는 리뷰·사진·영업정보 크롤링을 제거 대상으로 평가했다. 최신 결정은 22장처럼 코드를 optional `LegacyKakaoWebEnricher`로 격리 보존하되 production 기본값을 OFF로 두는 것이다.
- Google 리뷰 원문과 사진은 이번 마이그레이션의 필수 범위가 아니다.
- 장소별 **주차 여부, 현재 영업 여부, 정규·현재 영업시간**은 필수다.
- 장소 속성 값이 누락된 경우 `false`로 간주하지 않고 `UNKNOWN`으로 표현한다.

### 기능별 이전 가능성

| 현재 기능 | Google 대체 기능 | 판단 및 차이 |
|---|---|---|
| 네이버 지도 표시·마커·polyline | Maps SDK for Android/iOS | 이전 가능. RN에서는 Google 공식 네이티브 SDK를 직접 연결하거나 New Architecture 호환 RN bridge를 선택해야 한다. |
| 좌표 → 주소 | Geocoding API reverse geocoding | 이전 가능. `language=ko`, `region=kr` 적용. |
| 출발지·목적지 검색 | Places Autocomplete (New), Text Search (New) | 이전 가능. Place ID를 내부 참조로 사용한다. |
| 키워드 장소 검색 | Places Text Search (New), Nearby Search (New) | 이전 가능. `textQuery`, type, location bias/restriction을 사용한다. |
| 자동차 경로·polyline | Routes API `computeRoutes` | 이전 가능. 교통 반영, 회피 옵션, 대체 경로와 encoded polyline을 받을 수 있다. |
| 추천·시간·거리 경로 3종 | Routes API 대체 경로, shorter-distance route | 대부분 가능하지만 Kakao `RECOMMEND/TIME/DISTANCE`와 의미가 1:1로 같지는 않다. Google 응답을 기준으로 UI 명칭을 재정의한다. |
| 경로상 장소 검색 | Places Text Search Search Along Route | 직접 대체 가능. Routes polyline을 전달하므로 현재 다중 원형 Kakao 검색과 `selectVertices` 근사 로직을 제거할 수 있다. |
| 경유 추가 시간 | Search Along Route `routingSummaries` 또는 Routes API intermediate waypoint | 이전 가능. 원 경로와 장소 경유 두 leg의 시간·거리를 비교한다. |
| 여러 기존 경유지 중 삽입 위치 | Routes waypoint optimization 또는 후보 순서별 계산 | 가능하지만 대체 경로·교통 최적화와 함께 쓸 때 제한이 있으므로 현재 FRONT/MIDDLE/REAR 동작을 테스트로 고정한 후 치환한다. |
| 현재 영업 여부 | Text Search `openNow`, `currentOpeningHours`, `businessStatus` | 가능. 검색 필터와 화면 표시를 분리한다. |
| 정규 영업시간 | `regularOpeningHours` | 가능. 휴일·임시 변경은 `currentOpeningHours`를 우선한다. |
| 주차 여부 | `parkingOptions` | 가능. 무료/유료 주차장·노상·차고·발레 등의 세부 boolean을 제공하지만 한국 POI fill rate는 실측 필수다. |
| 즐겨찾기·최근 검색 | 기존 AsyncStorage | Google과 무관하게 유지 가능. |
| 리뷰 요약·크롤링 | 제거 | 대체하지 않는다. 필요한 경우 Google Maps 상세 링크만 제공한다. |

공식 기능 근거:

- [Search Along Route](https://developers.google.com/maps/documentation/places/web-service/search-along-route)
- [Search Along Route + routing summaries](https://developers.google.com/maps/documentation/places/web-service/routing-summary-sar)
- [Routes API 경로 계산](https://developers.google.com/maps/documentation/routes/compute_route_directions)
- [대체 경로](https://developers.google.com/maps/documentation/routes/alternative-routes)
- [짧은 거리 경로](https://developers.google.com/maps/documentation/routes/shorter-distance-routes)
- [경유지 순서 최적화](https://developers.google.com/maps/documentation/routes/opt-way)
- [Place Details 필드](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Text Search `openNow`](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Places REST Place 리소스](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)

### 2026-08-07 재확인: `routes: []`과 한국 coverage

Google 공식 문서를 다시 확인한 결과, 성공 HTTP 응답에서 빈 `routes`가 오는 현상은 한국에만 국한되지 않는다.

- [Routes 응답 해설](https://developers.google.com/maps/documentation/routes/understand-route-response)은 주소 문자열이나 Plus Code로 지정한 위치가 존재하지 않거나 검색되지 않으면 `geocodingResults`는 채워질 수 있지만 계산할 경로가 없어 `routes`가 비어 있다고 명시한다. 따라서 `HTTP 200 + routes: []`는 인증·quota 오류와 다른 정상적인 no-route 응답이다.
- 반대로 누락된 API key나 필수 파라미터는 [Routes 오류 처리 문서](https://developers.google.com/maps/documentation/routes/handle-errors)처럼 `403 PERMISSION_DENIED`, `400 INVALID_ARGUMENT` 등의 구조화된 오류로 반환된다. 이를 빈 경로와 동일하게 취급하면 안 된다.
- 현재 앱은 주소 문자열이 아니라 위도·경도를 전달하므로, “주소를 찾지 못함”은 국내 재현의 주원인이 아니다.

한국에는 별도의 coverage 제약이 있다. 2026-07-31 갱신된 [Google Maps Platform 국가별 coverage](https://developers.google.com/maps/coverage)의 `KR / South Korea` 행에서 Driving Directions는 `—`이며, 범례상 이는 기능이 제공되지 않거나 데이터 품질·가용성이 낮음을 뜻한다. 같은 표에서 기본 지도와 geocoding은 제공되므로 장소·주소가 검색되는 것과 자동차 경로가 비는 것은 모순이 아니다. Google의 [FAQ](https://developers.google.com/maps/faq)는 운전 경로 제공 국가를 이 coverage 표로 판단하고, 가용성이 데이터 공급자 계약에 따라 바뀔 수 있다고 설명한다.

따라서 현재 결론은 다음과 같다.

1. 빈 `routes`는 일반적으로도 가능한 no-route 신호다.
2. 우리 앱의 유효한 한국 좌표에서 반복되는 빈 응답은 현재 공식 coverage와 일치하는 **한국 Driving Directions 미지원/낮은 가용성 영향**으로 보는 것이 가장 타당하다.
3. 지도 데이터 반출 관련 조건부 승인이나 향후 서비스 확대 발표는 실제 Routes API 활성화와 같은 의미가 아니다. 공식 coverage와 실제 fixture가 모두 바뀔 때까지 한국 경로에 Google을 사용하지 않는다.
4. 현재 route 요청에는 국가 코드나 주소 문자열이 없으므로 출발지·목적지·모든 경유지 좌표를 로컬 routing geofence로 판정한다. 하나라도 한국이면 Google을 호출하지 않고 Kakao만 사용하며, 모두 해외면 Google만 사용한다.
5. coverage 변경 감지를 위해 서울·수도권·지방·고속도로 fixture를 정기적으로 다시 호출하되, Google 성공률과 경로 품질 gate를 통과하기 전에는 지역별 provider 정책을 바꾸지 않는다.

#### Kakao 자동차 길찾기 route 수와 현재 3개 카드

[Kakao Mobility 자동차 길찾기 공식 문서](https://developers.kakaomobility.com/docs/navi-api/directions/)와 [영문 공식 계약](https://developers.kakaomobility.com/affiliate-en/navi-api/directions)을 기준으로 다음을 확인했다.

- 한 요청의 `routes`는 배열이지만 고정 3개가 아니다. 기본값인 `alternatives=false`에서는 대안 경로를 요청하지 않으며 일반적인 성공 응답은 요청한 priority의 경로 1개다.
- `alternatives=true`이면 하나 이상의 대안 경로가 올 수 있지만 문서는 고정 개수를 보장하지 않는다.
- priority는 `RECOMMEND`, `TIME`, `DISTANCE`, `MAIN_ROAD`, `NO_TRAFFIC_INFO` 총 5종이다.
- 현재 OnMyWay의 3개 카드는 Kakao 한 번의 응답에서 3개를 꺼내는 구조가 아니라, 제품에서 선택한 `RECOMMEND`, `DISTANCE`, `TIME`을 `alternatives=false`로 각각 한 번씩 병렬 호출한 결과다. 따라서 최대 3개이며 일부 priority 요청이 실패하면 성공한 카드만 표시된다.
- FE 라벨은 응답 순번이 아니라 각 결과의 `priority` 값으로 `추천 경로`, `최단 거리`, `최단 시간`을 결정하므로 세 의미는 올바르게 연결된다.
- `MAIN_ROAD`와 `NO_TRAFFIC_INFO`는 API가 지원하지만 현재 제품의 세 카드 정의에는 포함하지 않는다.
- stopby 계산에서도 사용자가 선택한 카드의 priority가 BE DTO와 provider port를 거쳐 Kakao/Google 재계산에 적용되도록 계약을 명시했다.

> 위 Kakao·Google 공식 문서 내용은 라이선스 준수를 위해 원문을 인용하지 않고 요약·재서술했다.

### 마이그레이션 결론

기능 계약 수준에서는 Google이 해당 국가에서 지원하는 기능을 provider-neutral port로 이전할 수 있다. 다만 **현재 한국 Driving Directions는 공식 coverage상 사용할 수 없거나 가용성이 낮으므로**, 한국 자동차 경로의 전체 Google 이전은 불가능하다. Search Along Route도 입력 polyline이 필요하기 때문에 한국에서는 Kakao 경로로 polyline을 확보하거나 별도 한국 provider를 사용해야 한다.

도입 범위를 확대하기 전 다음 두 항목을 통과해야 한다.

1. **한국 경로 품질 게이트:** 서울·수도권·지방·고속도로에서 경로, 소요시간, 유료도로 회피, 진입점 정확도를 Kakao 결과와 비교한다. 공식 [Google Maps Platform 국가별 지원표](https://developers.google.com/maps/coverage)는 기능 지원 여부를 보여주지만 실제 국내 품질을 보장하지 않는다.
2. **필수 속성 fill-rate 게이트:** 카페·식당·주유소·편의점 등 최소 300개 장소에서 `parkingOptions`, `currentOpeningHours`, `regularOpeningHours`의 비어 있지 않은 비율과 정확도를 측정한다. 필드가 API에 존재해도 모든 한국 장소에 값이 있는 것은 아니다.

권장 통과 기준:

- 영업시간 fill rate ≥ 85%
- 현재 영업 여부 표본 정확도 ≥ 95%
- 주차정보 fill rate ≥ 70% 또는 핵심 카테고리별 별도 기준 충족
- 검색 결과 상위 10개 장소 precision ≥ 80%
- Kakao 대비 경로 시간 오차 중앙값 ≤ 10%, 치명적 진입·회차 오류 0건

주차 fill rate가 기준에 미달하면 Google 전체 이전을 취소하기보다 `GOOGLE + UNKNOWN + 사용자 제보/공공데이터` 보강 모델을 검토한다. 확인되지 않은 주차를 “주차 불가”로 표시해서는 안 된다.

### 비용상 중요 인사이트

리뷰와 사진을 제거해도 주차정보 `parkingOptions` 자체가 Enterprise + Atmosphere 등급을 유발한다. 따라서 이번 범위의 비용 상한은 리뷰가 아니라 주차 필드가 결정한다. 검색 결과마다 Place Details를 N회 호출하기보다 Search Along Route 한 요청의 FieldMask에 다음을 포함해 재사용하는 방식을 우선 실험한다.

```text
places.id
places.displayName
places.formattedAddress
places.location
places.googleMapsUri
places.businessStatus
places.currentOpeningHours
places.regularOpeningHours
places.parkingOptions
routingSummaries
```

사용자가 “현재 영업 중”을 요구할 때만 `openNow: true`를 검색 조건으로 보내고, 일반 검색은 폐점·휴무 장소도 결과에 남긴 뒤 현재 상태를 표시한다. 최소 FieldMask와 한 페이지 우선 정책으로 비용을 제한한다.

### 한국어 쿼리와 응답 언어

#### Places API

한국어 `textQuery`를 그대로 보낼 수 있다. 검색어 해석 언어와 응답 표시 언어는 별개다.

```json
{
  "textQuery": "강남 가는 길에 주차 가능한 카페",
  "languageCode": "ko",
  "regionCode": "KR"
}
```

- `languageCode: "ko"`: 장소명·주소 등 응답의 선호 언어를 한국어로 요청한다.
- `regionCode: "KR"`: 검색·주소 표현의 지역 기준을 대한민국으로 지정한다.
- Places API에서 `languageCode`를 생략하면 기본값은 영어다.
- 한국어 데이터가 없는 이름·주소는 현지 언어, 원문 또는 음역이 섞일 수 있으므로 모든 문자열이 반드시 번역된다고 가정하지 않는다.
- 한국어 쿼리 + 영어 응답(`languageCode: "en"`), 영어 쿼리 + 한국어 응답(`languageCode: "ko"`)도 가능하다.

근거: [Text Search 언어 처리](https://developers.google.com/maps/documentation/places/web-service/text-search), [Place Details 지역화](https://developers.google.com/maps/documentation/places/web-service/place-details)

#### Routes API

`languageCode: "ko"`, `units: "METRIC"`을 지정하고 필요한 localized field를 FieldMask에 포함하면 거리·시간과 경로 안내 표현을 한국어/미터법으로 받을 수 있다. 언어 설정은 수치형 `duration`, `distanceMeters` 자체가 아니라 안내 문구와 localized values에 영향을 준다. [Routes localized values](https://developers.google.com/maps/documentation/routes/localized-values), [Route response 이해](https://developers.google.com/maps/documentation/routes/understand-route-response)

#### 모바일 지도 SDK

지도 타일의 라벨 언어는 Places/Routes 요청의 `languageCode`와 별개다. 네이티브 지도는 기기·앱 locale과 해당 지역 지도 데이터의 지원 언어에 따라 표시된다. API 응답은 한국어인데 지도 라벨 일부는 영문·현지명일 수 있으므로 별도 UI 테스트가 필요하다.

### Google Maps Grounding Lite MCP의 한국어 동작

MCP의 `search_places`도 한국어 `text_query`를 받을 수 있고 `language_code: "ko"`, `region_code: "KR"`를 명시할 수 있다. 공식 문서상 `language_code`를 생략하면 결과 언어는 영어다. [MCP search_places reference](https://developers.google.com/maps/ai/grounding-lite/reference/mcp/search_places)

중요한 구분:

- MCP는 장소 데이터를 반환하는 **도구 인터페이스**다.
- 최종 자연어 문장은 MCP가 아니라 MCP를 호출한 호스트 LLM이 작성한다.
- 따라서 MCP 도구 결과를 한국어로 요청하고, 시스템/사용자 프롬프트에서도 “한국어로 답변”을 지정해야 최종 답변까지 안정적으로 한국어가 된다.
- Place ID·좌표·거리 같은 구조화 값은 언어와 무관하다.
- Grounding Lite MCP에는 Search Along Route encoded polyline을 직접 전달하는 전용 도구가 없으므로 본 앱의 핵심 검색은 직접 Routes + Places API로 구현한다.

권장 사용 구분:

```text
모바일 앱의 결정적 검색/경로/필드/비용 제어 → 직접 Google API
대화형 여행 도우미·프로토타입·탐색형 질문 → Maps Grounding Lite MCP
```

MCP를 직접 API 앞에 추가로 호출하면 같은 사용자 행동에 별도 과금과 지연이 생길 수 있으므로 기본 검색 흐름에는 넣지 않는다.

### 목표 아키텍처

```text
React Native
  └─ Google Maps native SDK bridge
       ├─ 지도·마커·polyline 표시
       └─ 기기 위치

NestJS Backend
  ├─ GooglePlacesAdapter
  │    ├─ Autocomplete / Text Search
  │    ├─ Search Along Route
  │    └─ 필수 상세 필드
  ├─ GoogleRoutesAdapter
  │    ├─ 기본·대체·짧은 거리 경로
  │    └─ 경유 경로 및 우회시간
  ├─ GoogleGeocodingAdapter
  └─ OnMyWay use cases
       ├─ FindRoutes
       ├─ SearchPlacesAlongRoute
       └─ CalculateDetour
```

Maps SDK 키는 Android package/SHA 인증서와 iOS bundle ID로 제한한다. Places·Routes·Geocoding용 `omw-server` 키는 모바일 앱에 포함하지 않고 BE에서만 사용하며 세 API만 허용한다. 개발 중에는 localhost BE에서 사용하고, 개발 완료 후 같은 키를 Railway Variables에 등록한다. 환경별 키는 나누지 않으며 application restriction은 Railway 배포·static outbound IP 필요성을 확인한 뒤 재검토한다.

### 당시 단계별 실행 계획 (23장의 현재 정책으로 대체됨)

1. **계약 고정:** 현재 경로 검색, 경로상 검색, 우회시간의 request/response fixture와 characterization test를 작성한다.
2. **Provider 분리:** `MapService`에서 Kakao 호출을 `RouteProvider`, `PlaceProvider`, `GeocodingProvider` interface 뒤로 이동한다.
3. **Google BE PoC:** 같은 interface의 Google adapter를 만들고 서울·수도권·지방 표본을 양쪽 provider로 비교한다.
4. **데이터 게이트:** 필수 주차·영업정보 fill rate와 비용을 측정해 전체 이전 여부를 결정한다.
5. **경로상 검색 분기:** Google은 Search Along Route, TMAP은 `findPoiRoute`, Kakao는 개선된 corridor 근사를 같은 `RoutePlaceSearchProvider` 계약으로 구현한다.
6. **FE renderer 분리:** RN 0.86 새 템플릿에서 `MapRenderer` abstraction을 도입하고 Google·Kakao·필요 시 Naver bridge를 독립 적용한다.
7. **크롤링 격리·AI 제거:** `openAiGetReviewSummary`와 관련 endpoint·UI·env·dependency를 삭제하고, 기존 Kakao 웹 내부 호출은 production 기본 OFF인 optional `LegacyKakaoWebEnricher`로 격리한다.
8. **언어/환경 고정:** 모든 BE 요청에 `ko`/`KR`/`METRIC` 기본값을 중앙 config로 적용하고 필요 시 사용자 locale로 override한다.
9. **회귀 테스트:** Android/iOS에서 provider별 검색→경로→경로상 장소→주차/영업시간→경유시간 플로우를 같은 contract suite로 검증한다.
10. **초기 전환:** 첫 runtime은 Google adapter만 등록하고 `defaultProvider=GOOGLE`, `allowedProviders=[GOOGLE]`로 고정한다. Kakao 코드는 핵심 경로에서 분리하되 후속 adapter 참고용으로 보존할 수 있다.

### 자연어 검색과 OpenAI 제거의 관계

OpenAI 리뷰 요약을 제거해도 Google Places의 `textQuery`는 한국어 자유 텍스트 검색에 사용할 수 있다. 첫 버전은 LLM 없이 다음 조합으로 구현한다.

- 원문 전체를 `textQuery`로 전달
- `영업 중`은 `openNow: true`로 변환
- `주차 가능`은 응답의 `parkingOptions`로 필터링
- `가는 길`은 Search Along Route로 처리
- 최대 우회시간은 `routingSummaries`를 이용해 앱에서 필터링

“조용한”, “아이와 가기 좋은”처럼 Google의 구조화 필드로 직접 검증하기 어려운 표현은 검색 관련도에만 맡기고 확정 속성처럼 표시하지 않는다. 향후 별도 자연어 파서가 필요해져도 검색 provider 및 리뷰 요약 기능과 분리한다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*

## 14. 실제 니즈와 비즈니스 모델 검토

> 작성 기준: 2026-08-02. 시장 규모를 임의로 추정하지 않고 현재 제품 행동, 대체재, Google API 원가와 검증 가능한 가설을 기준으로 판단한다.

### 핵심 판단

- **니즈는 존재한다.** 운전 중 “가는 길에, 지금 열려 있고, 주차 가능하며, 우회가 적은 장소”를 찾는 작업은 일반 주변 검색보다 조건이 복잡하다.
- **범용 소비자용 독립 앱으로는 니즈 빈도가 낮다.** 대부분의 사용자는 기존 지도·내비게이션에서 장소를 검색하고 수동으로 경유지를 추가하는 불편을 감수할 수 있다.
- Search Along Route와 자연어 검색 자체는 Google도 제공하는 기능이므로 장기적인 차별점이 아니다.
- 제품 가치는 `장소 검색`이 아니라 **검증된 필수 조건 + 실제 우회시간 + 사용자 상황에 맞는 순위**에 있어야 한다.
- 초기에는 범용 지도 앱과 경쟁하지 말고 반복 빈도와 문제 강도가 높은 한 세그먼트에 집중한다.

추천 포지셔닝:

> **“우회 5분 안에, 지금 열고 주차 가능한 곳을 찾아주는 경로 검색”**

피해야 할 포지셔닝:

> “또 하나의 지도 앱”, “자연어로 검색하는 지도”, “경로 주변 장소 검색 앱”

### 실제 사용 가능성이 높은 세그먼트

| 세그먼트 | 반복 빈도 | 문제 강도 | 지불 가능성 | 판단 |
|---|---:|---:|---:|---|
| 일반 출퇴근 운전자 | 낮음 | 낮음~중간 | 낮음 | 범용 타깃으로 부적합 |
| 아이 동반 가족·반려동물 동반 운전자 | 중간 | 높음 | 중간 | B2C 초기 후보 |
| 장거리·로드트립 운전자 | 낮음~중간 | 높음 | 제휴 전환 가능 | 여행·주차·예약 모델 후보 |
| EV 운전자 | 중간~높음 | 높음 | 중간 | 충전기 실시간 데이터 확보 시 후보 |
| 영업·AS·현장 서비스 기사 | 높음 | 높음 | 높음 | B2B/B2B2C 최우선 후보 |
| 렌터카·관광 모빌리티 이용자 | 일회성 | 높음 | 사업자가 지불 가능 | SDK/화이트라벨 후보 |
| 화물·상용차 운전자 | 높음 | 매우 높음 | 높음 | 데이터 요구가 달라 별도 제품 필요 |

초기 우선순위:

1. **B2C wedge:** 아이·반려동물 동반 또는 장거리 운전자의 주차·영업 중·화장실·최대 우회시간 검색
2. **B2B 검증:** 렌터카, 여행 앱, 현장 서비스, 차량 관제 앱에 경로 기반 POI API/SDK 제공
3. EV·상용차는 충전기 상태, 차량 높이·크기, 진입 제한 등 별도 데이터가 확보될 때 확장

### 제품 차별점과 방어력

자연어 검색과 Google API 연결만으로는 API wrapper에 가깝고 방어력이 약하다. 다음이 누적되어야 제품 자산이 된다.

- 실제 우회시간과 진행 방향을 반영한 자체 ranking
- 주차 입구, 도로 반대편, 유턴 필요 여부 등 운전 맥락
- 가족·반려동물·EV·상용차별 저장된 조건 profile
- 사용자가 선택·무시·재검색한 route-intent 데이터
- 사용자·사업자가 검증한 주차·영업·편의시설 정보
- 주차 예약, 충전, 식당 예약, drive-through 주문 등 실제 거래 연결
- 다른 모빌리티 앱에 삽입 가능한 API/SDK와 운영 노하우

Google Places 데이터는 약관상 자유롭게 영구 축적하거나 자체 장소 DB처럼 재판매하기 어렵다. 장기 방어력을 Google 데이터 자체에 두지 말고 ranking, 사용자 intent, 제휴 inventory와 자체 검증 데이터에 둔다. [Google Places 정책](https://developers.google.com/maps/documentation/places/web-service/policies)

### 수익모델 우선순위

#### 1. B2B2C API/SDK — 가장 현실적

대상:

- 렌터카·카셰어링
- 여행 일정·관광 앱
- 완성차·차량 인포테인먼트 공급사
- 현장 서비스·영업 차량 앱
- 보험·주차·충전 서비스

제공 가치:

```text
출발지 + 목적지 + 사용자 조건
→ 경로상 후보 장소
→ 현재 영업/주차 검증
→ 추가 소요시간 기준 순위
```

과금 후보:

- 월 기본료 + 검색 건수 종량제
- MAU 또는 차량 수 기반 요금
- 화이트라벨 앱 구축비 + 운영비
- SLA·분석 dashboard를 포함한 enterprise 계약

장점은 최종 사용자가 무료 지도를 기대하더라도, 파트너 사업자는 전환율·운영 효율·고객 경험을 위해 비용을 지불할 수 있다는 것이다. 단점은 초기 영업 기간과 integration 지원 비용이다.

#### 2. 거래·리드 제휴 — B2C와 가장 잘 맞음

가능한 거래:

- 주차장 예약
- EV 충전·세차
- 식당·카페 예약 및 선주문
- 숙박·관광 상품
- drive-through·픽업 주문

검색 시점은 사용 의도가 높으므로 generic display 광고보다 거래 제휴가 제품 경험과 잘 맞는다. 수익은 클릭이 아니라 예약·주문·방문 성과 기준으로 받는 모델이 바람직하다.

필수 조건:

- 실제 예약/주문 가능한 inventory
- 제휴 장소와 일반 결과를 섞을 때 `광고`·`제휴` 명확히 표시
- 수익 때문에 우회시간이나 관련도가 낮은 장소를 상위 노출하지 않음

#### 3. 특정 세그먼트 구독 — 조건부 가능

일반 사용자 구독은 가능성이 낮다. 다음처럼 반복 사용자가 분명할 때만 검증한다.

- 가족·반려동물 profile과 고급 필터
- 여러 경로·정기 경로 저장
- CarPlay/Android Auto 연동
- 다중 경유지 자동 계획
- 영업시간·주차 상태 변경 알림
- 팀·차량 간 장소 공유

무료 지도 대체재가 강하므로 단순 “광고 제거”나 검색 횟수만으로 유료화하지 않는다. fake-door 방식으로 결제 의향을 먼저 측정한다.

#### 4. 명확히 표시된 sponsored result — 규모 확보 후

사용자 검색 조건을 만족하고 organic 결과와 품질 차이가 크지 않은 장소만 후보로 허용한다. 운전 중 광고는 안전과 신뢰를 해칠 수 있으므로 초기 주수익원으로 삼지 않는다.

#### 5. 배너·전면 광고 — 조건부 후순위 / 위치 데이터 판매 — 비추천

- 배너와 전면 광고는 BM 후보에서 제외하지 않는다. 다만 retention과 핵심 flow가 검증된 뒤, 운전 안전·빈도 제한·동의·스토어 정책을 충족하는 placement에서만 실험한다.
- Google Places + Routes 호출 원가가 있으므로 광고 eCPM만으로 손익분기한다고 가정하지 않고 세션당 광고 순수익과 API 원가를 함께 측정한다.
- 운전 중 지도 조작, 경로 안내, 긴급 오류 복구를 가리는 광고는 금지한다. 전면 광고는 검색 완료 후 상세 진입 전처럼 사용자가 정차·계획 중인 자연스러운 전환 지점에서만 후보로 둔다.
- Plus/Trip Pass에는 배너·전면 광고 제거 또는 최소화를 entitlement 혜택으로 검토한다.
- 위치·이동 의도 데이터 판매는 개인정보·동의·신뢰 위험이 크므로 수익모델로 채택하지 않는다.

### Google API 원가가 주는 제약

현재 문서의 Rich 검색 가정은 경로 1회, Search Along Route 1회, 선택 장소 상세 20% 기준 월 10,000 검색 세션에서 약 `$435`다. Autocomplete, 사진, 세금, 환율은 제외된 값이다. [Google Maps Platform 가격표](https://developers.google.com/maps/billing-and-pricing/pricing)

따라서:

- 무료 B2C 사용량이 커질수록 단순 광고 모델은 위험하다.
- 검색 1회당 비용, 결과 선택률, navigation handoff, 제휴 전환당 수익을 함께 측정해야 한다.
- B2B 종량 가격은 Google 원가뿐 아니라 서버, 지원, 실패 재시도, 환율 변동과 목표 gross margin을 포함해야 한다.
- `parkingOptions`가 필수라서 저가 SKU만으로 제품 요구사항을 만족시키기 어렵다.
- Google 응답 캐싱·저장 정책 때문에 임의의 장기 캐시로 원가를 회피한다고 가정하지 않는다.

### 검증용 최소 제품

초기 MVP에는 다음만 넣는다.

1. 출발지·목적지
2. 자유 텍스트 장소 검색
3. `현재 영업 중`, `주차 가능`
4. 최대 우회시간 `5/10/15분`
5. 상위 5개 결과와 각각의 추가 시간
6. Google Maps 또는 외부 내비로 경유 시작
7. 즐겨찾기·최근 검색

초기에는 제외한다.

- 자체 턴바이턴 내비게이션
- 사진·리뷰·AI 요약
- 회원가입
- 소셜 기능
- 복잡한 추천 feed
- 사용 빈도가 검증되지 않은 세부 필터

### 수요 검증 계획

#### 1단계: 문제 인터뷰

세그먼트별 10명 이상에게 기능을 설명하기 전에 최근 실제 행동을 묻는다.

- 최근 운전 중 경유 장소를 찾은 상황은 언제였는가?
- 어떤 앱을 어떤 순서로 사용했는가?
- 가장 불편했던 정보는 무엇인가?
- 장소를 선택하고 경유지로 넣는 데 얼마나 걸렸는가?
- 잘못된 영업시간·주차정보로 실패한 경험이 있는가?
- 이 문제는 한 달에 몇 번 발생하는가?

“이 앱을 쓰겠는가?” 같은 가상 의향보다 과거 행동과 현재 우회 방법을 확인한다.

#### 2단계: concierge/프로토타입

전체 Google 마이그레이션 전에 3개 시나리오만 제공한다.

- 주차 가능하고 지금 여는 카페
- 화장실·식사가 가능한 장거리 휴식 장소
- 최대 10분 우회하는 목적 장소

사용자가 결과를 선택하고 내비로 넘기는 과정을 관찰한다.

#### 3단계: 계측 MVP

핵심 funnel:

```text
경로 입력
→ 조건 검색
→ 유효 결과 노출
→ 장소 상세/선택
→ 내비 경유 시작
→ 동일 사용자 재검색
```

측정 지표:

- 검색 완료율
- 유효 결과가 1개 이상 나온 비율
- 결과 선택률
- navigation handoff 비율
- 허용 우회시간 분포
- `UNKNOWN` 주차·영업정보 비율
- 검색당 API 원가
- 7일·30일 반복 사용률
- 사용자가 기존 지도 앱으로 돌아가는 이유

권장 실험 게이트이며 업계 표준값은 아니다.

- 결과 선택률 ≥ 30%
- navigation handoff ≥ 20%
- 핵심 세그먼트 30일 반복 사용 ≥ 20%
- 필수 정보 누락 때문에 검색이 실패하는 비율 ≤ 20%
- 인터뷰 대상의 절반 이상이 월 2회 이상 같은 문제를 실제 경험

#### 4단계: 수익 검증

- B2C: 제휴 예약 버튼 fake door 또는 실제 소규모 제휴로 전환 측정
- 구독: 고급 profile·정기 경로 기능의 가격 페이지에서 checkout 진입 측정
- B2B: 최소 10개 잠재 고객 인터뷰, 2~3개 유료 PoC 또는 구체적인 LOI 목표

### Go / Pivot / Stop 기준

**Go:** 한 세그먼트가 반복적으로 사용하고, 경유 시작 전환이 높으며, Google 원가보다 충분히 큰 거래 또는 B2B 가치가 확인됨.

**Pivot:** 사용자는 기능을 좋아하지만 월 사용 빈도가 낮음. 독립 B2C 앱보다 여행·렌터카·모빌리티 앱에 삽입되는 SDK/API로 이동.

**Stop 또는 대폭 축소:** 사용자가 대부분 기존 내비의 수동 경유지 추가로 충분하다고 답하거나, 주차·영업정보 fill rate가 낮아 핵심 약속을 지킬 수 없음.

### 현재 권장 사업 방향

1. 범용 지도 앱을 만들지 않는다.
2. B2C에서는 **가족/장거리 운전자의 “주차 + 영업 중 + 최대 우회시간”** 한 문제로 시작한다.
3. B2C MVP는 수요·ranking·데이터 품질 검증 채널로 사용한다.
4. 장기 수익모델은 **B2B2C API/SDK + 거래 제휴**를 우선한다.
5. 자연어 검색은 UX이고, 차별점은 검증 가능한 조건과 우회시간 ranking이다.
6. 전체 RN/Google 마이그레이션 전에 concierge 테스트와 Google 데이터 fill-rate PoC를 먼저 실행한다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*

## 15. Freemium + AI Route Assistant 멤버십 검토

> 작성 기준: 2026-08-02. “MCP 사용”은 내부 구현 방식이고 사용자가 구매하는 가치는 자연어 검색 자체가 아니라 복잡한 경유 의사결정의 자동화다.

### 결론

기본 기능 무료 + 고급 자연어·자동화 멤버십은 **검증할 가치가 있는 BM**이다. 다만 자연어 검색 하나만 paywall로 두면 약하다.

- Google Places `textQuery` 자체도 한국어 자유 텍스트를 이해하므로 자연어 입력만으로는 강한 유료 차별점이 아니다.
- Maps Grounding Lite MCP는 Search Along Route를 직접 수행하지 못하므로 멤버십 검색도 핵심 경로는 직접 Routes + Places API를 사용해야 한다.
- MCP는 날씨·장소 탐색·이름 해석·대화 맥락과 결합한 `AI Route Assistant` 구현에 선택적으로 사용한다.
- 주차 여부, 현재 영업 여부, 우회시간은 제품의 핵심 약속이므로 전부 유료로 잠그지 않는다. 무료 사용자가 핵심 가치를 경험하지 못하면 전환도 일어나지 않는다.
- 월 사용 빈도가 낮은 장거리 운전자에게는 월 구독보다 `Trip Pass`가 더 적합할 수 있다.

### 권장 무료/유료 경계

#### Free — 제품의 핵심 약속을 체험

- 출발지·목적지와 기본 경로
- 키워드·카테고리 검색
- `현재 영업 중`, `주차 가능`, 최대 우회시간 chip
- 경로상 상위 3~5개 결과
- 장소별 추가 소요시간
- 외부 내비로 경유 시작
- 최근 검색·기기 내 즐겨찾기
- 월간 또는 일간 합리적 rich search 한도

무료 검색 결과에서 주차·영업정보를 제거하지 않는다. 대신 페이지 수, 결과 수, 저장 profile, 고급 자동화를 제한한다.

#### Plus — 반복 조건과 비교 자동화

- 자연어 다중 조건 검색
  - `아이와 가는 길에 주차 편하고 지금 열려 있는 식당, 우회 10분 이하`
- 가족·반려동물·EV 등 저장 profile
- 결과가 없을 때 조건을 단계적으로 완화하고 이유 설명
- 여러 경로의 장소 후보·우회시간 비교
- 즐겨찾기·profile cloud sync
- 광고·sponsored result 최소화 또는 제거
- 월간 고급 검색 quota와 초과 시 명확한 안내

#### Pro/Trip — 일정 계획

- 다중 경유지 자동 순서 최적화
- 여러 장소를 포함한 당일·여행 일정 생성
- 날씨·영업시간을 반영한 출발 전 재계획
- 동승자와 경로 공유
- CarPlay/Android Auto 연동 후보
- 7일 또는 30일 Trip Pass

MCP는 이 중 대화 맥락, 날씨, 장소 이름 해석과 탐색에 사용할 수 있지만, 최종 장소 검증·경로·과금 가능한 핵심 결과는 직접 API가 결정한다.

### 상품 이름과 메시지

사용자에게 다음을 노출하지 않는다.

- MCP 멤버십
- API 고급 검색
- Atmosphere field 사용권

추천 메시지:

- `AI Route Assistant`
- `한 문장으로 경유지 찾기`
- `가족 조건을 저장하고 매번 자동 적용`
- `여러 후보의 실제 우회시간을 한 번에 비교`

사용자는 기술이 아니라 검색 단계 감소, 실패 방지, 시간 절약에 비용을 지불한다.

### 자연어 검색의 무료/유료 구분

완전히 다른 검색 엔진을 둘 필요는 없다.

```text
Free
  카페 + [영업 중] + [주차] + [10분 이내]

Plus
  아이랑 가는 길에 지금 열고 주차 편한 카페,
  화장실 있고 10분 이상 우회하지 않는 곳
```

두 흐름 모두 내부적으로 동일한 SearchIntent와 Google provider를 사용한다.

```ts
type SearchIntent = {
  query: string;
  openNow?: boolean;
  parkingRequired?: boolean;
  maxDetourMinutes?: number;
  attributes?: string[];
  sortBy?: 'RELEVANCE' | 'DETOUR';
};
```

Free는 사용자가 chip으로 구조화하고, Plus는 대화 입력을 구조화하며 profile·다중 단계 계획을 결합한다. 이렇게 해야 유료화 때문에 검색 품질이 두 갈래로 분기되는 것을 피할 수 있다.

### MCP 사용 원가와 membership quota

현재 공개 첫 가격 구간 기준:

- Maps Grounding Lite: `$7 / 1,000` billable events
- Search Along Route에서 주차정보 포함 Text Search Enterprise + Atmosphere: `$40 / 1,000`
- 교통 반영 Compute Routes Pro: `$10 / 1,000`

따라서 대략적인 유료 구간 원가는 검색 세션당:

```text
Routes + Places ≈ $0.05
MCP를 추가하면 ≈ $0.057
```

Autocomplete, 추가 페이지, 상세 조회, 서버, 세금과 환율은 별도다. [Google Maps Platform 가격표](https://developers.google.com/maps/billing-and-pricing/pricing)

MCP 자체는 원가의 가장 큰 부분이 아니다. `parkingOptions` 때문에 필요한 Places 상위 SKU가 더 큰 원가다. 하지만 사용량이 큰 회원에게 무제한을 제공하면 손실 가능성이 있으므로 다음이 필요하다.

- Plus 월간 AI/경로 검색 quota
- 추가 페이지 자동 호출 금지
- 동일 세션의 search result 재사용
- 같은 사용자 입력의 중복 submit 방지
- 비정상 자동화·공유 계정 rate limit
- quota 소진 후 기본 free 검색으로 graceful fallback

### 가격 실험안

최종 가격이 아니라 fake-door와 소규모 결제 실험의 시작점이다.

| 상품 | 후보 가격 | 대상 |
|---|---:|---|
| Free | 0원 | 핵심 기능 체험, 제한된 rich search |
| Plus Monthly | 월 4,900~7,900원 | 월 4회 이상 반복 운전자 |
| Plus Annual | 연간 할인 실험 | 가족·반려동물·업무 운전자 |
| Trip Pass | 7일 2,900~4,900원 | 여행·렌터카·명절 장거리 운전 |
| Team/Vehicle | 별도 B2B 가격 | 현장 서비스·영업 차량 |

월 구독과 Trip Pass를 동시에 테스트한다. 사용 빈도가 낮은데 월 구독만 제공하면 제품 만족도와 별개로 결제 전환이 낮게 나온다.

App Store/Play Store 수수료, 부가세, 환율과 고객지원 비용을 포함한 contribution margin을 계산한 후 가격을 확정한다.

### 멤버십이 성립하는 조건

자연어 입력이 아니라 다음 결과가 확인되어야 한다.

- 회원이 free보다 검색 완료 시간이 유의미하게 짧음
- 복잡한 조건 검색의 결과 선택률이 높음
- profile을 저장한 사용자의 반복 사용률이 높음
- 월 4회 이상 사용하는 핵심 세그먼트가 존재
- 유료 사용자의 월 API 원가가 순매출 대비 충분히 낮음
- Trip Pass 구매 후 실제 navigation handoff가 발생

권장 실험 지표이며 업계 표준값은 아니다.

- premium feature 진입률 ≥ 10%
- 가격 화면 진입률 ≥ 5%
- trial → paid ≥ 15%
- free → paid ≥ 2~5%
- Plus 회원 월 4회 이상 유효 검색
- 유료 contribution margin ≥ 60%
- 2개월차 유료 유지율 ≥ 60%

### 실패 가능성이 높은 설계

- 자연어 text box 하나만 유료화
- free에서 주차·영업시간을 완전히 제거
- “무제한 AI 검색”을 사용량 보호 없이 제공
- MCP 응답을 검증 없이 그대로 장소 추천으로 표시
- 가끔 여행하는 사용자에게 월 구독만 제공
- 구독을 먼저 구현하고 반복 사용률을 나중에 확인
- AI라는 이유로 organic ranking보다 sponsored 결과를 우선

### 권장 실험 순서

1. Free chip 검색과 Plus 자연어 검색이 같은 SearchIntent를 생성하도록 prototype을 만든다.
2. Plus 버튼에 fake-door를 달아 클릭률과 입력 문장을 수집한다.
3. 20~30명의 수동 concierge test로 자연어가 실제 단계를 줄이는지 측정한다.
4. 월 구독과 7일 Trip Pass 가격 화면을 A/B 테스트한다.
5. 결제 전환 전에 사용자별 실제 Google API 원가 분포를 계산한다.
6. 반복 사용 세그먼트가 확인되면 subscription을 구현하고, 일회성 사용자가 많으면 Trip Pass·제휴 모델을 우선한다.
7. B2C 전환이 낮아도 기업 고객의 API/SDK 수요가 확인되면 B2B2C로 전환한다.

### 최종 권장안

```text
Free:
  핵심 경로 검색 + 주차/영업/우회시간 + 제한된 사용량

Plus:
  AI Route Assistant + 저장 profile + 비교/자동화 + cloud sync

Trip Pass:
  여행 기간 고급 일정·다중 경유지 기능

B2B:
  동일 엔진을 API/SDK로 제공
```

이 BM은 자연어 검색을 paywall로 활용하되, 자연어 자체가 아니라 **조건 이해, 반복 설정 제거, 실패 방지, 다중 경로 의사결정 자동화**를 유료 가치로 만든다는 점이 핵심이다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*

## 16. 한국/글로벌 투트랙 제품 및 Go-to-Market 전략

> 작성 기준: 2026-08-02. “글로벌”을 전 세계 동시 출시로 정의하지 않는다. 공통 엔진을 유지하면서 한국과 영어권 1개 beachhead market을 병렬 검증하고, retention이 확인된 시장만 확장한다.

### 결정됨: 제품 운영 원칙

- OnMyWay는 한국과 글로벌 시장을 투트랙으로 운영한다.
- 지도·장소·경로의 공통 기반은 Google Maps Platform으로 통합하는 것을 우선 검증한다.
- 한국판과 글로벌판을 별도 코드베이스나 별도 앱으로 즉시 분리하지 않는다.
- 공통 domain/use case 위에 locale, market config, feature flag, navigation handoff와 마케팅만 시장별로 분리한다.
- 글로벌 1차 시장은 영어권 운전자 시장으로 제한하고, 유럽·비영어권 확대는 제품 반복 사용이 확인된 이후 진행한다.
- 사용자 위치·경로는 민감정보로 취급하며 한국 PIPA, 글로벌 GDPR/CCPA 등 시장별 개인정보 요구사항을 출시 전에 검토한다.

### 시장별 핵심 포지셔닝

| 구분 | 한국 | 글로벌 영어권 |
|---|---|---|
| 핵심 문구 | 가는 길에, 지금 열고 주차 가능한 곳 | Find the best stop on your route — open now, parking, minimal detour |
| 초기 고객 | 아이·반려동물 동반 가족, 장거리·명절 운전자 | road trip, family, pet, RV/camper, rental-car users |
| 핵심 필터 | 주차, 영업 중, 우회시간, 화장실 | open now, parking, detour, restroom, pet/family friendly |
| 거리 단위 | km/m, 분 | locale에 따라 miles/km, minutes |
| 내비 연결 | Google 우선, 필요 시 TMAP/카카오 딥링크 fallback 검토 | Google Maps 우선, Apple Maps/Waze 선택 후보 |
| 검색 언어 | 한국어 + 영어 브랜드명 | 영어 우선, 사용자 locale 확장 |
| 시즌 | 설·추석·휴가철·벚꽃·단풍 | summer road trip, Thanksgiving, Christmas, spring break |
| 핵심 채널 | 자동차·캠핑·육아·반려동물 커뮤니티 | Reddit, Facebook Groups, TikTok/YouTube Shorts, road-trip creators |

### 글로벌 초기 시장 선택

`GLOBAL` 하나로 묶어 전 세계 광고를 집행하지 않는다. 다음 조건으로 beachhead를 선정한다.

- Google Places의 주차·영업시간 fill rate
- 자동차 장거리 이동 비중과 road-trip 문화
- 영어 단일 언어로 시작 가능한가
- Google Maps/내비 사용 습관
- Places/Routes 실제 경로 품질
- 앱 결제와 제휴 partner 접근성
- 개인정보·소비자 보호·세금 대응 비용

초기 후보는 미국·캐나다·호주·뉴질랜드 영어권이다. 동시에 출시하지 말고 표본 데이터와 organic waitlist 반응이 가장 좋은 한 시장을 한국과 함께 운영한다. 미국은 수요가 크지만 광고 경쟁과 지원 범위도 크므로 주 또는 여행 corridor 단위로 더 좁히는 방안이 유효하다.

초기 글로벌 niche 예시:

- US family road trip
- pet-friendly road trip stops
- RV/camper parking-friendly stops
- rental-car travel stops

유럽은 언어, 통화, 규제, 환경구역, 국가별 도로·주차 관행이 달라 1차 글로벌 범위에서 제외한다.

### 제품 구조: 하나의 엔진, 시장별 config

```ts
type Market = 'KR' | 'GLOBAL_EN';

type MarketConfig = {
  locale: string;
  regionCode: string;
  units: 'METRIC' | 'IMPERIAL';
  currency: string;
  navigationTargets: NavigationTarget[];
  enabledAttributes: PlaceAttribute[];
  legalDocumentVersion: string;
  subscriptionProducts: string[];
};
```

예시:

```text
KR
  locale=ko-KR
  regionCode=KR
  units=METRIC
  navigationTargets=Google, TMAP/Kakao fallback 후보

GLOBAL_EN_US
  locale=en-US
  regionCode=US
  units=IMPERIAL
  navigationTargets=Google, Apple, Waze 후보
```

시장별로 달라져야 할 항목:

- 언어·주소·단위·통화·시간대
- place type과 속성 label
- 주차의 의미와 데이터 표현
- navigation handoff
- subscription product ID와 지역 가격
- 개인정보 동의·보관 정책
- 고객지원·스토어 설명·스크린샷
- analytics consent와 마케팅 attribution

공통으로 유지할 항목:

- SearchIntent
- Search Along Route
- detour 계산과 ranking
- place availability의 `AVAILABLE/UNAVAILABLE/UNKNOWN`
- Free/Plus/Trip entitlement 구조
- API 비용·quota·rate-limit 로직

### 글로벌화에서 중요한 UX

번역만으로 글로벌 제품이 되지 않는다.

- `10분 우회`는 공통이지만 거리는 km/miles를 자동 변환한다.
- `parking available`은 주차장, 노상, garage, valet을 시장별로 구분한다.
- 영업시간은 장소 timezone과 12/24시간제를 따른다.
- 주소 형식과 전화·통화 연결 방식을 locale에 맞춘다.
- 사용자의 검색어 언어와 앱 UI 언어가 달라도 Places `languageCode`와 `regionCode`를 별도로 제어한다.
- “restroom”, “bathroom”, “toilet”, `화장실`처럼 시장별 표현 alias를 유지한다.
- Google 데이터가 누락된 속성은 번역과 무관하게 `UNKNOWN`으로 표시한다.

### 획득 전략의 기본 원칙

1. 유료 광고 전에 organic niche에서 문제 강도와 반복 사용을 확인한다.
2. 앱 기능을 설명하지 말고 실제 전후 차이를 짧은 영상으로 보여준다.
3. 범용 “지도 앱” 키워드 대신 상황형 high-intent query를 공략한다.
4. 공유 가능한 결과 card와 route deep link로 product-led acquisition loop를 만든다.
5. 한국과 글로벌의 CAC·activation·retention·API 원가를 합산하지 않고 별도 cohort로 관리한다.
6. install 수가 아니라 `navigation handoff`와 반복 검색을 북극성 지표 후보로 삼는다.

### Pre-launch: 수요 포착

한국어/영어 landing page를 별도로 만든다.

한국 메시지 예시:

```text
가는 길에 주차 가능한 카페,
10분 이상 돌아가지 않고 찾기
```

영어 메시지 예시:

```text
Find an open, parking-friendly stop
without adding more than 10 minutes.
```

landing page 구성:

- 10~15초 실제 사용 영상
- 출발지·목적지·조건 → 결과와 추가시간
- `Join Korea beta` / `Join US beta`처럼 waitlist 분리
- 가족, pet, road-trip 중 사용 목적 수집
- iOS/Android와 CarPlay/Android Auto 관심도 수집
- Plus/Trip Pass fake-door 가격 실험

waitlist는 이메일 수보다 segment, 월간 문제 빈도와 예정 여행 날짜가 중요하다.

### 콘텐츠 마케팅

#### 공통 포맷

- `기존 지도에서 7번 탭하던 검색을 한 문장으로`
- `경로에서 3분 vs 18분 우회하는 카페 비교`
- `영업 중이지만 주차가 없는 장소를 자동 제외`
- 실제 road-trip route challenge
- 사용자가 제출한 “좋았던 경유지” 사례

장소 DB를 대량 복제한 SEO 페이지는 Google 데이터 저장·표시 정책과 얇은 콘텐츠 문제를 만들 수 있다. 대신 사용법, 여행 corridor guide, 자체 편집 콘텐츠와 interactive tool 중심으로 운영한다. [Google Places 정책](https://developers.google.com/maps/documentation/places/web-service/policies)

#### 한국 채널

- YouTube Shorts, Instagram Reels, TikTok
- 자동차·캠핑·차박 커뮤니티
- 지역 육아·가족 여행·반려동물 커뮤니티
- 명절 귀성·휴가철 route demo
- 여행·자동차 micro creator
- 렌터카·주차·충전·캠핑 파트너 공동 콘텐츠

커뮤니티에는 광고 문구를 반복 게시하지 않고 실제 경로 문제를 해결하는 beta 모집 또는 무료 도구 형태로 접근한다.

#### 글로벌 채널

- TikTok, YouTube Shorts, Instagram Reels
- Reddit의 road trip, travel, parenting, pet, RV 관련 커뮤니티
- Facebook road-trip/RV/pet travel group
- Product Hunt는 초기 기술 관심과 피드백 채널로만 사용하며 핵심 소비자 채널로 간주하지 않는다.
- road-trip·family travel·pet travel micro creator
- rental-car, campsite, parking, EV partner newsletter

각 커뮤니티 규칙을 준수하고 일방적 링크 게시보다 문제 사례와 도구를 먼저 제공한다.

### ASO와 검색 수요 포착

한국 키워드 후보:

- 경로 주변 검색
- 가는 길 카페
- 주차 가능한 카페
- 경유지 추천
- 장거리 운전 휴게소
- 지금 영업 중

영어 키워드 후보:

- stops along my route
- places along route
- road trip stop finder
- restaurants on my route
- open now with parking
- minimal detour stops
- pet friendly road trip stops

App Store/Play Store 제목과 설명을 직역하지 않고 시장별 문제 문장과 screenshot을 사용한다. 실제 search volume과 경쟁도는 스토어 도구·광고 keyword planner로 출시 전 검증한다.

### Product-led growth loop

공유 card 예시:

```text
OnMyWay에서 찾은 경유지
현재 영업 중 · 주차 가능 · 경로 +4분
[경로 열기]
```

```text
Found with OnMyWay
Open now · Parking available · +4 min detour
[Open route]
```

공유 링크는 앱 미설치 사용자에게 web preview를 보여주고 설치 후 같은 route/search intent를 복원한다. 가족·동승자와 장소를 결정하는 행위가 자연스러운 referral loop가 된다.

추가 loop 후보:

- 여행 route를 공개 가능한 template로 공유
- 동승자 투표
- Plus 회원의 family profile 초대
- creator의 curated stop list를 route intent로 열기

Google 장소 원본 데이터를 자체 콘텐츠처럼 재배포하지 않고 attribution과 데이터 정책을 준수한다.

### Creator/partner 전략

대형 influencer보다 문제 상황이 명확한 micro creator를 우선한다.

- 아이와 여행
- 반려견 동반 여행
- 차박·캠핑·RV
- 렌터카 해외여행
- 장거리 출퇴근·현장 업무

제공할 creator kit:

- 실제 route demo link
- 고유 referral code
- follower용 Trip Pass
- `5분 이내 경유지 찾기` challenge template
- 조회수가 아닌 activated user/navigation handoff 기준 성과 측정

파트너 우선순위:

1. 주차·충전·예약 inventory 파트너
2. 렌터카·여행 일정 앱
3. 캠핑장·관광 시설
4. 현장 서비스·영업 차량 SaaS
5. 완성차·인포테인먼트는 장기 대상

### 유료 획득 전략

retention 확인 전 broad app-install campaign을 하지 않는다.

순서:

1. organic 콘텐츠와 niche community로 100~300명 beta
2. activation·navigation handoff·30일 반복 사용 검증
3. high-intent search keyword에 소액 광고
4. 성과가 좋은 persona/creative만 app-install 또는 conversion campaign으로 확장
5. paid CAC를 첫 결제뿐 아니라 90일 contribution margin과 비교

광고 creative는 기능 목록보다 실제 query와 결과를 보여준다.

```text
Bad: AI 기반 스마트 지도 검색
Good: Find a parking-friendly cafe with less than a 5-minute detour
```

### 출시 단계

#### Stage 0 — Data/route gate

- 한국과 글로벌 후보 시장의 Places 필수 field fill rate 측정
- 경로·주차·영업시간 정확도 비교
- 글로벌 후보 중 1개 beachhead 선정

#### Stage 1 — Closed beta

- KR 100명 + GLOBAL 100명을 별도 모집
- 가족/반려동물/road-trip persona로 제한
- 수동 인터뷰와 session replay/이벤트 분석

#### Stage 2 — Public MVP

- Free 핵심 검색
- Plus fake-door 또는 제한된 trial
- 한국/영어 Store listing과 landing page 분리
- 공유 route card와 referral 구현

#### Stage 3 — Monetization validation

- 한국: Plus Monthly와 Trip Pass 비교
- 글로벌: Trip Pass, Plus Monthly, creator affiliate 비교
- 주차/예약 제휴 전환 실험
- B2B API/SDK 유료 PoC 병행

#### Stage 4 — Expansion

- beachhead market retention과 contribution margin 통과 후 다음 영어권 국가 추가
- 비영어권은 번역이 아니라 data quality, local search alias, 법률, support 준비 후 추가

### 시장별 funnel과 핵심 지표

공통 funnel:

```text
Landing visit
→ Install
→ First route
→ First valid result
→ Place selected
→ Navigation handoff
→ Repeat search
→ Membership/Trip Pass/partner conversion
```

반드시 시장별로 나누어 측정한다.

- landing → install
- install → first route activation
- valid result rate
- place selection rate
- navigation handoff rate
- search당 Google API 원가
- D7/D30 repeat usage
- share/referral rate
- free → trial → paid
- Trip Pass attach rate
- creator/partner별 activated CAC
- 한국/글로벌별 support ticket 원인

초기 권장 게이트이며 업계 표준값은 아니다.

| 지표 | 초기 목표 |
|---|---:|
| install → first valid result | ≥ 50% |
| valid result → place selection | ≥ 30% |
| place selection → navigation handoff | ≥ 60% |
| D30 핵심 segment 반복 사용 | ≥ 20% |
| 공유 사용자 중 신규 activation | ≥ 10% |
| paid CAC 회수 | 3개월 이내 |
| 필수 정보 부족 실패 | ≤ 20% |

### 한국/글로벌 운영 리스크

- 한국에서 Google 경로·주차 데이터가 기대 이하일 수 있다.
- 글로벌이라는 이유로 국가별 data quality 차이를 무시할 수 없다.
- 위치·경로 analytics는 최소 수집, 짧은 보관, 명시적 동의가 필요하다.
- 지역별 구독 가격과 App Store/Play Store 세금·수수료가 다르다.
- 번역·고객지원·법률 대응이 시장 수보다 빠르게 복잡해질 수 있다.
- Google API 원가와 환율이 글로벌 무료 사용량에 비례해 증가한다.
- 지도 provider 의존성을 줄이기 위해 provider interface와 비용·오류 관측을 유지한다.

### 최종 권장 Go-to-Market

```text
공통 제품:
  경로 + 주차/영업 + 실제 우회시간 + Free/Plus/Trip

한국 wedge:
  가족·반려동물·명절/장거리 운전

글로벌 beachhead:
  영어권 family/pet road trip 한 시장

획득:
  짧은 실제 route demo → niche community/creator → 공유 route loop

수익:
  Plus/Trip Pass 실험 + 주차/예약 제휴 + B2B API/SDK
```

처음부터 전 세계 사용자를 사는 것이 아니라, 한국과 영어권 한 시장에서 동일한 핵심 문제가 반복되는지 비교하고 승리하는 persona와 시장에 집중한다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*
## 13. 유사 서비스·경쟁 제품 조사

> 조사 기준: 2026-08-02. 소비자 앱/웹에서 실제로 공개된 기능을 기준으로 하며, 공급자의 공개 API 범위와 소비자 앱 기능은 별도로 판단한다.

### 경쟁 서비스 판정 기준

- **직접 경쟁**: 출발지→목적지 경로를 만들고 해당 경로 주변의 들를 장소를 발견하는 것이 핵심 흐름
- **기능 경쟁**: 범용 지도·내비게이션 안에서 경로상 검색을 제공
- **인접 경쟁**: 여행 일정, 고속도로 출구, 주유·충전 등 특정 상황에서 같은 요구를 해결
- **실제 우회시간**: 직선거리나 route corridor가 아니라 원래 경로 대비 추가 도로 주행시간을 후보 단계에서 제공
- **자연어**: 단순 키워드·카테고리가 아니라 여러 조건을 포함한 자유 문장을 해석

### 핵심 결론

1. **한국의 가장 가까운 기능 경쟁자는 TMAP**이다. `주행중 어디갈까`가 현재 경로 인근의 맛집·카페·드라이브스루를 자동 추천하며, TMAP AI는 복합 자연어와 경유지 명령을 지원한다.
2. **글로벌 최대 경쟁자는 Google Maps + Ask Maps**다. Ask Maps는 복합 질문, 경로상 추천, 커뮤니티 리뷰 기반 팁, ETA와 경로 연결을 한 제품에 묶었다. 2026-03 기준 미국·인도 모바일에서 롤아웃 중이며 한국 제공은 확인되지 않았다.
3. **가장 직접적인 독립 앱은 `by the ways`**다. 전 세계 경로상 명소 탐색, 대안 경로 비교, 다중 경유지, 실제 우회시간 필터를 제공하지만 자유문장 AI와 강한 리뷰 데이터는 확인되지 않았다.
4. **Roadtrippers는 가장 완성된 로드트립 플랫폼**이다. 경로 주변 거리 corridor, 장소 콘텐츠·평점, Autopilot AI, 일정·예약·RV 기능을 결합하지만 후보별 실제 `+N분`보다 경로에서 떨어진 거리로 범위를 정한다.
5. **한국에서 임의 자연어 → 경로상 일반 POI → 리뷰 신뢰도 → 후보별 정확한 +N분 → 원탭 경유를 모두 확인 가능한 서비스는 아직 없다.** 이 조합이 OnMyWay의 현재 차별화 기회다.
6. `On the way`, `On the Way`, `Along the Way`라는 유사 앱 이름이 이미 존재하므로 출시 전 상표·앱스토어 검색명·도메인·SEO 검토가 필요하다.

### 직접 및 주요 기능 경쟁 비교

| 서비스 | 주요 지역·플랫폼 | 경로상 탐색 | 자연어·AI | 장소 리뷰·평점 | 후보별 실제 우회시간 | 가격·제약 |
|---|---|---|---|---|---|---|
| Google Maps + Ask Maps | 글로벌 Maps; Ask Maps는 2026-03 미국·인도 Android/iOS부터 | 경로상 검색·경유지 추가, Ask Maps의 “along the way” 추천 | 강함. 복합 현실 조건을 대화식으로 처리 | 매우 강함. 3억+ 장소와 5억+ 기여자 데이터 활용 발표 | Maps 경로상 검색에서 detour time을 제공하는 플랫폼이 있으나 지역·UI별 노출 검증 필요 | 소비자 앱 무료. 한국 Ask Maps 제공 미확인 |
| TMAP | 한국 Android/iOS·차량 연동 | `주행중 어디갈까`: 현재 주행 경로 인근 맛집·카페·DT 자동 추천 | 강함. “내 주변 카페 들렀다가 집으로 가자” 같은 복합 명령 | 방문 데이터, 리뷰, 영업·주차 정보. 숫자 평균평점 범위는 미확인 | 후보 목록의 원 경로 대비 `+N분` 표시는 공식 자료에서 미확인 | 기본 무료 |
| by the ways (`On the way`) | iOS/Android, 공식 설명상 글로벌 | 전체 경로의 관광·카페·숙소·숨은 장소, 대안 경로·다중 stop | 카테고리·필터 중심, 생성형 자유문장 미확인 | 큐레이션은 강하나 통합 사용자 리뷰 범위 미확인 | 강점. 실제 detour time 표시와 시간 기준 필터 명시 | 무료 다운로드+인앱 구매, 고정 공개 가격 미확인 |
| Roadtrippers | Web/iOS/Android; 미국·캐나다·호주·뉴질랜드 콘텐츠 강점 | 사용자가 route shade를 거리 단위로 조절해 경로 주변 POI 탐색 | Premium Autopilot AI가 stop 또는 하루 일정을 추천 | 자체 장소 콘텐츠·사용자 평점 | 거리 corridor이며 후보별 실제 detour 증분은 아님 | Basic $35.99/년, Pro $49.99/년, Premium $59.99/년; 플랜별 stop 제한 |
| inRoute | iPhone/iPad/Mac/CarPlay | 경로상 검색, X km/시간 뒤 지점과 주유·숙소·식당 탐색 | 생성형 AI 없음 | 장소 리뷰 통합 미확인 | 후보별 detour보다 waypoint까지 시간·거리 | 무료 8개 위치, Pro 최대 150 stop; 미국 기준 $5.99/월 또는 $59.99/년 |
| Furkot | Web/PWA, 글로벌 | 검색 범위를 전체 지도·선택 stop·along route로 지정 | 생성형 AI 없음 | 외부 여행·예약 데이터 인덱스 | stop 추가 후 전체 시간 재계산, 후보별 증분 미확인 | 기본 무료, Furkot Pass $14/년 |
| HERE WeGo | iOS/Android/Web, 글로벌 | 주행 전·중 gas, parking, food 등을 along route 또는 목적지 주변 검색 | 키워드·카테고리 | 리뷰 범위 미확인 | stop 추가 후 ETA 재계산 | 무료 |
| Roadie | Web/iOS/Android, 글로벌 | restaurants, sights, campsites 등 places along route | AI 없음 | 리뷰 범위 미확인 | stop 간 거리·시간만 확인 | 무료 사용 가능 |
| Google Maps Platform API 기반 자체 구현 | Web/mobile backend | Routes polyline + Places Search Along Route | LLM 또는 커스텀 MCP 결합 가능 | 평점·평가 수·최대 5개 리뷰 | routing summary로 직접 계산 가능 | API 종량제; 12장 비용 참고 |

공식·주요 출처:

- [Google Ask Maps 공식 발표](https://blog.google/products-and-platforms/products/maps/ask-maps-immersive-navigation/)
- [Google Maps 경로상 장소 검색 API](https://developers.google.com/maps/documentation/places/web-service/search-along-route)
- [TMAP 어디갈까 공식 소개](https://www.tmapmobility.com/service/place/where)
- [TMAP 앱 설명](https://play.google.com/store/apps/details?id=com.skt.tmap.ku&hl=ko)
- [TMAP 주행중 어디갈까 출시 보도](https://www.yna.co.kr/view/AKR20260519125100017)
- [by the ways 앱](https://play.google.com/store/apps/details?id=com.bytheways.routeapp&hl=en)
- [Roadtrippers 경로 탐색 공식 도움말](https://support.roadtrippers.com/hc/en-us/articles/200632079-Planning-a-Trip-on-Our-Website)
- [Roadtrippers 멤버십](https://support.roadtrippers.com/hc/en-us/articles/360000831566-What-features-are-included-with-Roadtrippers-memberships)
- [inRoute](https://inroute.com/)
- [Furkot](https://trips.furkot.com/)
- [HERE WeGo routing FAQ](https://help.here.com/faq/routing_and_navigation)

### 국내 범용 지도·내비 비교

| 서비스 | 경로상 장소 검색 | 자연어 | 리뷰 | 실제 우회시간 | 평가 |
|---|---|---|---|---|---|
| TMAP | 확인. 자동 추천형이며 맛집·카페·DT 중심 | LLM 음성·복합 명령 확인 | 확인 | 후보별 증분 미확인 | 국내 최강 기능 경쟁자 |
| 아틀란 3D | `경로상 추천`으로 맛집·DT·주유·충전 등 | 통합 키워드, 생성형 AI 미확인 | 메뉴·영업시간·블로그 정보, 자체 평점 미확인 | 미확인 | 카테고리형 직접 경쟁 |
| 네이버지도 | 주행 중 검색 후 경유지 추가 가능하나 일반 POI가 경로 corridor로 필터되는지는 미확인 | 지도 앱 내 대화형 경로 검색 미확인 | 방문자·블로그 리뷰 강함 | 미확인 | 리뷰 경쟁자, 경로 검색은 부분적 |
| 카카오맵 | 다중 경유지는 지원하나 현재 경로상 일반 POI 검색은 미확인 | AI메이트 로컬이 위치·가격·메뉴·주차 등 복합 조건 처리; 경로 문맥 연동 미확인 | 별점·사진·텍스트 후기 강함 | 미확인 | 자연어·리뷰 경쟁자 |
| 카카오내비 | 주변 주유소 등 일부 운전 중 검색 | 명령형 음성 검색, LLM 자유대화 미확인 | 내비 화면 리뷰 범위 미확인 | 미확인 | 제한적 기능 경쟁 |
| 원내비 | 주변 주유소·약국·은행·주차장, 경로상 휴게소 | 음성 상호·주소·주변 검색과 경유지 변경 | 미확인 | 미확인 | 카테고리형 기능 경쟁 |
| 맵피·아이나비 에어 | 일반 내비·주변 정보는 확인 | 미확인 | 미확인 | 미확인 | 최신 경로 corridor 기능 실기기 검증 필요 |

국내 출처:

- [네이버지도 주행 중 경유지 도움말](https://help.naver.com/service/5637/contents/8269?osType=MOBILE&lang=ko)
- [카카오맵 AI메이트 로컬 발표](https://www.kakaocorp.com/page/detail/11619)
- [카카오맵 후기 안내](https://kakaomap.tistory.com/358)
- [원내비 공식](https://navi.kt.com/)
- [아틀란 공식](https://www.atlan.co.kr/products/pnd/atlanHybrid.do)

### 글로벌 범용 지도·내비 비교

| 서비스 | 경로 중 장소 탐색 | 자연어·AI | 리뷰 | 경유지·우회 | 핵심 한계 |
|---|---|---|---|---|---|
| Google Maps | Search along route, Add stops | Ask Maps 지원 지역에서 강함 | Google 리뷰·사진·AI 요약 | 다중 stop, 일부 UI에서 detour 표시 | Ask Maps·내비 기능의 지역 차이 |
| Apple Maps | 안내 중 food·gas 등 stop 추가, 최대 14 stops | Siri/키워드, 생성형 장소검색 미확인 | 국가별 Ratings & Photos 및 파트너 데이터 | 추가 후 ETA 재계산 | 후보별 정확한 증분시간 공식 확인 부족 |
| Waze | 운행 중 food·gas·parking 검색 | 키워드·음성, 생성형 AI 없음 | 장소 리뷰보다 교통·유가 커뮤니티 중심 | 중간 stop 1개 중심 | 일반 POI 발견·리뷰가 약함 |
| HERE WeGo | along route/at destination 검색 | 키워드·카테고리 | 미확인 | 경유지 추가 | 자연어·리뷰·detour가 약함 |
| Sygic | 오프라인 지도와 경로상 POI | 카테고리 | 범위 미확인 | stop·ETA 재계산 | 구독·지역별 차이, AI 없음 |
| TomTom GO | route에 POI 표시·검색 | 키워드·카테고리 | 일반 리뷰 약함 | stop 후 재계산 | 후보별 detour 미확인 |
| MapQuest | 다중 stop과 주변 business | 일반 검색 | 제한적 | route 최적화 | 엄격한 경로 corridor보다 주변 검색 성격 |

출처:

- [Apple Maps 경유지 도움말](https://support.apple.com/guide/iphone/change-or-add-stops-to-your-route-iph837d13d03/ios)
- [Waze 경유지 도움말](https://support.google.com/waze/answer/6262564)
- [Sygic POI](https://www.sygic.com/what-is/point-of-interest-poi)
- [TomTom GO 도움말](https://help.tomtom.com/hc/en-gb/articles/31031674105362-Get-started-with-the-GO-Expert-app)
- [MapQuest Route Planner](https://www.mapquest.com/routeplanner)

### 여행 일정·로드트립 인접 경쟁

| 서비스 | 강점 | OnMyWay와의 차이 |
|---|---|---|
| Wanderlog | 자유형 AI 일정, 협업, 예약·예산, 일별 route optimizer | 이미 선택한 장소의 일정 최적화가 중심이며 route corridor 탐색·후보별 detour는 약함 |
| AAA TripTik | 북미 도로여행, 호텔·주유·관광·할인·공사정보 | 회원 서비스와 콘텐츠 중심, 자연어·후보별 우회시간 없음 |
| iExit | 미국 Interstate 진행 방향의 다음 출구별 음식·주유·숙박, Yelp 정보 | 미국 고속도로 출구 전용이며 임의 polyline 검색이 아님 |
| Roadtrippers | 여행 콘텐츠와 AI·일정·예약의 결합 | 일상적인 “가는 길에 잠깐 들르기”보다 장거리 여행 계획 중심 |
| Furkot | 일정, 숙박, 급유, 예산과 깊은 설정 | 사용 난도가 높고 소비자 자연어 탐색이 없음 |

### 수직 전문 경쟁

| 서비스 | 분야·지역 | 경로상 기능 | 리뷰·신뢰 데이터 | OnMyWay에 주는 시사점 |
|---|---|---|---|---|
| 오일나우 | 한국 주유소 | 경로에서 약 5분 이내 주유소를 가격·거리·서비스로 비교 | 운전자 제보·서비스 평점 | `우회시간 budget` UX의 국내 검증 사례 |
| 오피넷 | 한국 주유소·LPG | 출발지–목적지 경로별 주유소 | 공인 가격·시설 데이터 | 리뷰 없이도 신뢰 가능한 구조화 데이터가 강점 |
| 충전왕 | 한국 EV | 가는 길 충전소, 우회거리·통행료·충전시간·요금 고려 | 충전 상태·가격 중심 | 우회비용을 시간 외 금액까지 확장 가능 |
| ABRP | 글로벌 EV | 차량·배터리·SOC·충전망을 반영해 충전 stop 자동 배치 | 충전기 신뢰도·live availability | 경로상 검색을 실제 의사결정 최적화로 발전시킨 사례 |
| PlugShare | 글로벌 EV | 현재 경로의 호환 충전소만 표시 | 리뷰·체크인·사진·PlugScore 강함 | 범용 장소에도 검증된 방문 신호가 중요 |
| iExit | 미국 Interstate | 진행 방향의 다음 출구 서비스 | Yelp 평점·리뷰·유가 | 고속도로에서는 corridor보다 출구·진행방향 모델이 유용 |
| ROAD PLUS | 한국 고속도로 | 노선상 휴게소·주유·충전·교통 | 공공 운영정보 | 고속도로 POI는 일반 장소와 별도 랭킹 필요 |

출처:

- [오일나우](https://www.oilnow.co.kr/)
- [오피넷](https://www.opinet.co.kr/)
- [충전왕](https://ev.enlighten.kr/)
- [ABRP](https://abetterrouteplanner.com/home)
- [PlugShare Trip Planner](https://www.plugshare.com/trip-planner.html)
- [iExit](https://www.iexitapp.com/)
- [ROAD PLUS](https://www.roadplus.co.kr/useguide/servicearea/selectServiceAreaList.do)

### 경쟁 제품의 네 가지 대표 패턴

1. **범용 지도형 — Google Maps, TMAP, Apple Maps**
   - 장점: 지도·POI·내비·사용자 데이터가 한 제품에 있음
   - 약점: 고급 검색 UX가 지역·계정·주행 상태에 따라 달라지고 사용자가 랭킹 이유를 알기 어려움
2. **로드트립 planner형 — Roadtrippers, Furkot, inRoute**
   - 장점: 긴 여행, 다중 stop, 일정·숙박·연료 계획
   - 약점: 일상적인 즉시 검색에는 무겁고 실제 detour보다 거리 corridor에 의존
3. **가벼운 along-route 탐색형 — by the ways, Roadie, HERE WeGo**
   - 장점: 경로 주변 장소 발견이 단순하고 명확함
   - 약점: 리뷰·자연어·개인화가 약함
4. **수직 최적화형 — 오일나우, ABRP, PlugShare, iExit**
   - 장점: 가격, 배터리, 출구, 실시간 상태처럼 의사결정 변수를 깊게 반영
   - 약점: 장소 카테고리가 제한됨

### OnMyWay의 경쟁 우위 후보

#### 1. 정확한 detour budget

사용자가 `경로에서 5km`가 아니라 `원래 경로보다 10분 이내`를 지정하게 한다. 강, 고속도로 IC, 일방통행 때문에 직선거리가 짧아도 우회가 큰 문제를 해결한다.

#### 2. 자연어의 구조화와 투명한 랭킹

예: `서울 가는 길에 10분 이상 안 돌아가고 리뷰 많은 간장게장집`

- 음식: 간장게장
- 최대 우회시간: 10분
- 품질: 평점과 평가 수의 신뢰도
- 위치: 남은 경로
- 정렬 설명: `우회 +6분 · 평점 4.4 · 평가 820개`

Google·TMAP처럼 결과만 추천하는 것보다 왜 이 결과가 나왔는지 설명한다.

#### 3. 공급자 중립적 메타 검색

국내에서는 카카오·네이버·TMAP, 해외에서는 Google을 조합하고, 결과의 출처·원문 링크·attribution을 명확히 표시한다. 단, 각 공급자의 저장·결합·표시 약관 검토가 선행되어야 한다.

#### 4. 일상 검색과 여행 계획의 중간 지점

Roadtrippers보다 가볍고 Google Maps보다 검색 조건을 명시적으로 제어하는 제품으로 포지셔닝한다. 한 번의 경유부터 여러 stop의 짧은 반나절 계획까지 확장한다.

#### 5. 리뷰 신뢰도

평점만 쓰지 않고 평가 수, 최근성, 실제 방문 신호, 공급자 간 일치, 광고·협찬 여부를 분리한다. PlugShare의 체크인과 TMAP의 실제 주행 데이터가 좋은 참고 모델이다.

### 주요 위협

- Google Ask Maps가 한국을 포함해 글로벌 확대되면 자연어·리뷰·경로 데이터 우위를 한 번에 활용할 수 있다.
- TMAP이 `주행중 어디갈까`에 자유문장 route query와 후보별 detour를 추가하면 국내 차별점이 빠르게 줄어든다.
- 네이버·카카오가 리뷰 데이터와 자사 AI 검색을 내비 경로 문맥에 연결할 가능성이 있다.
- 독립 앱은 지도·리뷰 데이터 비용 때문에 무료 범용 지도와 가격 경쟁이 어렵다.

### 권장 포지셔닝

> **“목적지까지 가는 길을 거의 벗어나지 않고, 내가 말한 조건에 맞는 검증된 장소를 찾는다.”**

단순 `경로 주변 검색`보다 다음 조합을 전면에 둔다.

- 자유문장 검색
- 남은 경로 기준
- 정확한 추가시간
- 리뷰 신뢰도
- 결과별 추천 이유
- 한 번의 탭으로 경유지 추가

### 경쟁 제품 실기기 벤치마크 계획

동일한 계정·시간대에서 다음 경로와 쿼리를 테스트한다.

경로:

- 서울→부산: 고속도로·휴게소·IC 민감도
- 서울→강릉: 대안 경로와 관광 POI
- 강남→인천공항: 도시·고속도로 혼합
- 30분 이내 도심 경로: 일상 검색

쿼리:

- `리뷰 좋은 간장게장집`
- `10분 이상 안 돌아가는 주차 가능한 카페`
- `맥도날드 DT`
- `아이와 가기 좋고 지금 문 연 식당`
- `quiet cafe with parking`
- `マクドナルド ドライブスルー`

대상:

- TMAP
- Google Maps/Ask Maps 지원 계정
- 네이버지도
- 카카오맵 AI메이트
- 아틀란
- by the ways
- Roadtrippers

기록 항목:

- 쿼리 입력 가능 여부와 언어
- 결과 개수·정확도·중복
- 남은 경로만 반영하는지
- corridor 폭 또는 detour budget 제어
- 후보별 `+N분` 표시
- 평점·평가 수·리뷰·영업시간·주차 표시
- 경유지 추가 후 실제 ETA 차이
- 결과 설명·광고 표시
- 응답시간과 유료 벽

### 조사 한계

- 소비자 앱 기능은 OS, 앱 버전, 지역, 계정 A/B 실험에 따라 다를 수 있다.
- “미확인”은 기능이 반드시 없다는 뜻이 아니라 공식 공개 자료에서 확인하지 못했다는 뜻이다.
- 구독 가격은 국가·세금·프로모션에 따라 달라질 수 있다.
- Google Ask Maps는 2026-03 공식 발표 기준 미국·인도부터 롤아웃 중이다.
- TMAP `주행중 어디갈까`는 2026-05 공개 보도로 확인했으며 공식 `어디갈까` 페이지는 주변 탐색 기능을 중심으로 설명한다.
- by the ways와 오래된 `On the Way`·`Along the Way` 앱은 실제 지역별 설치 가능성과 유지보수 상태를 스토어에서 추가 확인해야 한다.
## 17. Airbnb·Tripadvisor 등 전략적 인수 가능성과 Exit-ready 제품 전략

> 작성 기준: 2026-08-02. 특정 회사의 인수 의사나 거래 가능성을 예측하는 문서가 아니다. 공개된 제품 방향과 OnMyWay가 만들 수 있는 전략적 자산을 비교해 현실적인 조건을 정의한다.

### 결론

Airbnb나 Tripadvisor 계열로의 전략적 exit는 **이론적으로 가능하지만 현재 제품 형태로는 가능성이 낮다.** 두 회사가 필요로 하는 문제 영역과 OnMyWay의 방향은 겹치지만, 경로 검색·자연어 입력·Google Places 연결만으로는 인수보다 내부 구현이 더 쉽기 때문이다.

인수 후보가 될 수 있는 모습은 다음과 같다.

```text
단순 소비자 지도 앱 X
Google Maps API wrapper X
자연어 경유지 검색 기능 X

여행자의 숙소·일정·이동 경로를 이해하고
경로상 장소·경험·서비스를 실제 예약/구매로 연결하며
그 전환 효과가 검증된 route-commerce / in-trip orchestration engine O
```

따라서 `Airbnb에 매각` 자체를 제품 목표로 두기보다 다음 자산을 만드는 것을 목표로 한다.

1. 여행 중 경로 의도를 이해하는 기술과 데이터
2. 우회시간·영업·주차·예약 가능성을 함께 반영하는 ranking
3. 장소 발견에서 실제 예약·주문·내비게이션까지 이어지는 전환
4. 여러 여행·렌터카·모빌리티 앱에 삽입 가능한 API/SDK
5. 특정 시장과 persona에서 반복 사용·매출을 입증한 독립 사업

이 자산이 충분하면 Airbnb·Tripadvisor뿐 아니라 Booking/Expedia 계열, 렌터카, 주차·충전, 차량·내비게이션, 여행 일정 플랫폼도 잠재적 전략 파트너 또는 인수 후보가 된다.

### 공개 전략과의 적합성

#### Airbnb

Airbnb는 숙소만 제공하는 앱에서 서비스와 Experiences를 함께 예약하는 여행 플랫폼으로 범위를 넓혔다. 2025년에는 homes·services·experiences를 한 앱에서 연결하는 구조를 공개했고, 2026년에는 AI 기반 검색과 여행 계획 도구를 강화하고 있다.

- [Airbnb 2025 Summer Release](https://news.airbnb.com/airbnb-2025-summer-release/)
- [Airbnb 2026 Summer Release](https://news.airbnb.com/airbnb-2026-summer-release/)
- [Airbnb Q4 2025 financial results](https://news.airbnb.com/airbnb-q4-2025-financial-results/)

Airbnb와 맞는 OnMyWay의 역할은 숙소 검색이 아니라 **숙박 전후의 이동과 현지 소비를 연결하는 것**이다.

예시:

```text
Airbnb 숙소 예약 완료
→ 공항/렌터카 지점에서 숙소까지 경로 생성
→ 체크인 전 가능한 식사·장보기·체험 추천
→ 영업시간과 예약 시간을 고려해 최소 우회 순서 결정
→ Experiences·Services 예약 또는 파트너 거래
```

Airbnb가 OnMyWay를 인수할 이유가 생기려면 다음 중 하나 이상을 직접 만드는 것보다 사는 편이 빨라야 한다.

- 이동 경로와 숙소·체험 일정을 결합하는 검증된 orchestration 엔진
- Experiences 또는 Services attach rate를 유의미하게 높인 실험 결과
- 특정 국가·여행 persona에서 확보한 강한 사용자 기반
- Airbnb가 쉽게 재구축하기 어려운 route-intent 데이터와 ranking
- 여행 일정·이동 분야의 우수한 팀과 IP

Airbnb의 GamePlanner.AI 인수 사례는 AI 역량과 팀도 전략적 인수 대상이 될 수 있음을 보여준다. 그러나 이는 일반적인 소규모 지도 앱이 자동으로 인수 후보가 된다는 뜻은 아니다. [Airbnb의 GamePlanner.AI 인수 발표](https://news.airbnb.com/airbnb-has-acquired-gameplanner-ai/)

#### Tripadvisor·Viator

Tripadvisor는 2026년 공개 자료에서 Experiences 중심·AI 활용 방향을 강조하고, 브랜드·도달 범위·데이터를 Experiences 성장에 활용하려는 전략을 제시했다.

- [Tripadvisor 2025 Annual Report / 2026 Proxy](https://ir.tripadvisor.com/static-files/f2b92757-1bf4-4937-a7ee-bf6acf69aceb)
- [Tripadvisor Q1 2026 results](https://ir.tripadvisor.com/static-files/2c3d7951-c21e-481f-8c42-0cdb27449115)

역사적으로 Tripadvisor는 단순 기능보다 거래 가능한 공급과 운영 기술을 보유한 회사를 인수했다.

- Viator: 투어·액티비티 예약 자산 — [인수 발표](https://ir.tripadvisor.com/news-releases/news-release-details/tripadvisor-finalizes-acquisition-viator)
- Bókun: 투어·액티비티 사업자용 예약·운영 소프트웨어 — [인수 발표](https://ir.tripadvisor.com/news-releases/news-release-details/tripadvisor-acquires-bokun-leading-software-provider-bring)

따라서 Tripadvisor/Viator와 가장 잘 맞는 모습은 다음과 같다.

```text
여행자의 현재 경로·남은 시간·우회 허용 범위
+ Viator형 예약 가능한 Experiences inventory
→ 지금 일정에 실제로 삽입 가능한 체험 추천
→ 예약 전환과 이동 경로 연결
```

Tripadvisor의 리뷰를 다시 보여주는 앱보다, 리뷰·콘텐츠 탐색을 **당일 또는 이동 중 예약으로 전환하는 계층**이 더 전략적이다. 다만 Tripadvisor가 비용 구조와 포트폴리오 단순화를 함께 추진 중인 만큼, 매출이나 명확한 전략적 효과가 없는 초기 소비자 앱을 인수할 가능성은 높게 가정하지 않는다.

### 현실적인 exit 형태

#### 1. 기능·팀 중심 tuck-in acquisition

- 조건: 작은 팀이지만 경로 의도·AI planning 기술이 우수하고 빠르게 통합 가능
- 필요한 것: 깨끗한 IP, provider-independent architecture, 우수한 기술팀, 빠른 PoC
- 한계: 가장 작은 거래 형태가 될 수 있으며 제품 브랜드가 유지되지 않을 가능성이 큼

#### 2. 제품·사용자 기반 인수

- 조건: 한 국가 또는 persona에서 높은 반복 사용과 organic acquisition을 보유
- 필요한 것: 강한 D30 retention, 낮은 CAC, 경로 공유 loop, 높은 navigation/booking 전환
- 장점: 기술뿐 아니라 수요 검증과 distribution을 함께 판매
- 한계: 독립 앱이 충분히 성장하면 특정 인수자에 대한 의존보다 자체 사업 가치가 중요해짐

#### 3. B2B route-commerce 플랫폼 인수

- 조건: 여행·렌터카·모빌리티 파트너가 API/SDK를 사용하고 실제 매출 발생
- 필요한 것: 다년 또는 반복 계약, 안정적인 API, 시장별 데이터 품질, 거래 attribution
- 장점: 가장 방어력이 높고 여러 잠재 인수자와 협상 가능
- 권장: OnMyWay가 장기적으로 목표로 삼을 형태

#### 4. 공급·거래 네트워크 인수

- 조건: 주차·체험·충전·식당 등 예약 가능한 독점 또는 우수 inventory 확보
- 필요한 것: 공급자 계약, 실시간 가용성, 예약·정산 시스템
- 한계: 자본과 운영 부담이 크므로 초기 자체 구축보다 파트너 integration이 현실적

### 인수자가 사지 않을 가능성이 높은 모습

- Google Search Along Route를 그대로 노출하는 앱
- 자연어 검색 화면만 있고 반복 사용 데이터가 없는 앱
- 사용자 수는 많지만 예약·내비게이션·거래 전환을 측정하지 않는 앱
- 한국과 글로벌을 동시에 넓게 출시해 어느 시장에서도 retention이 약한 앱
- Google 데이터 외에 자체 ranking·intent·파트너 자산이 없는 앱
- 리뷰와 장소 데이터를 약관 범위 밖으로 저장해 법적·계약상 위험이 있는 앱
- founder 개인 계정, 불명확한 오픈소스 라이선스, 노출된 시크릿 등 실사 위험이 큰 코드베이스

### Exit-ready 제품 정의

OnMyWay를 다음과 같이 재정의한다.

> **숙소·목적지까지의 이동 경로에 현재 가능한 장소·경험·서비스를 삽입하고, 최소 우회로 예약과 방문까지 연결하는 여행 실행 엔진**

핵심 입력:

```text
origin + destination + route
trip context + available time
traveler profile + constraints
bookable inventory + availability
```

핵심 출력:

```text
검증된 경로상 후보
실제 추가 시간과 가능한 방문 시간
예약 가능 여부와 가격
최적 삽입 순서
예약/주문/navigation handoff
```

기술적 차별점:

- `SearchIntent`와 trip context의 구조화
- route-aware candidate generation
- 영업시간·예약 시간·주차·이동시간 constraint solver
- detour + relevance + conversion ranking
- 후보가 없을 때 조건을 안전하게 완화하는 정책
- 시장별 데이터 신뢰도와 `UNKNOWN` 처리
- 공급자 장애·비용에 대응하는 provider abstraction

사업적 차별점:

- 사용자 선택·무시·재검색에서 얻는 route-intent signal
- 숙소→장소→체험→예약으로 이어지는 attribution
- 특정 persona와 corridor에 대한 높은 전환율
- 파트너 inventory와 API/SDK integration
- 시장별 운영·데이터 품질 노하우

### 앱을 어떻게 바꿔야 하는가

#### 유지할 것

- 출발지→목적지 경로상 검색
- 현재 영업·주차·추가 우회시간
- Free 핵심 경험
- 한국/글로벌 공통 엔진과 시장 설정
- 공유 route card와 deep link

#### 강화할 것

1. **Trip context**
   - 숙소 체크인·체크아웃 시간
   - 렌터카 수령·반납 시간
   - 동행자, 아이, 반려동물, 짐, 차량 조건
   - 예정 체험·식사·항공 시간

2. **Bookable action**
   - 결과를 보여주는 데서 끝내지 않고 예약·주문·티켓·주차로 연결
   - 클릭이 아니라 예약 완료와 실제 navigation handoff까지 attribution

3. **Itinerary insertion**
   - 장소 하나를 찾는 기능에서 일정의 빈 시간에 삽입하는 기능으로 확장
   - 영업시간과 예약 슬롯을 만족하는 후보만 추천

4. **Partner surface**
   - 소비자 앱과 동일한 엔진을 API/SDK로 제공
   - 렌터카·숙박·여행 일정 앱이 자체 UI에서 호출 가능
   - white-label과 embedded widget 지원 후보

5. **검증 가능한 ranking**
   - 단순 관련도보다 실제 우회시간, 예약 가능성, 도착 가능 시간, 선택 확률을 최적화
   - sponsored 결과가 organic 품질을 훼손하지 않도록 분리

#### 당분간 만들지 않을 것

- 자체 턴바이턴 내비게이션
- Tripadvisor와 경쟁하는 대규모 리뷰 DB
- Airbnb와 경쟁하는 숙소 marketplace
- 모든 국가의 여행 콘텐츠
- 범용 AI 여행 챗봇
- inventory 없이 일정 문장만 생성하는 기능

### 제품·아키텍처 요구사항

```text
Consumer App
  ├─ Free route-stop search
  ├─ AI Route Assistant
  ├─ trip context / itinerary
  └─ booking + navigation handoff

OnMyWay Core
  ├─ SearchIntent / TripContext
  ├─ Route-aware retrieval
  ├─ Constraint & insertion engine
  ├─ Ranking / experimentation
  └─ attribution events

Provider Layer
  ├─ Maps / Places / Routes
  ├─ Experiences / reservations
  ├─ parking / charging / food
  └─ navigation targets

Partner Platform
  ├─ REST API / SDK
  ├─ partner configuration
  ├─ usage / conversion dashboard
  └─ billing / SLA / audit
```

인수 실사를 고려해 초기부터 다음을 지킨다.

- 모든 소스·데이터·모델·디자인의 IP 소유권 명확화
- 오픈소스 라이선스와 third-party API 약관 inventory 유지
- 프로덕션 시크릿을 저장소와 분석 이벤트에서 제거
- 개인정보 최소 수집, 동의·삭제·보관기간 구현
- 시장·provider·partner별 unit economics 계측
- 주요 ranking 변경과 실험 결과 기록
- 특정 인수자 전용 구조가 아닌 독립적인 provider/partner interface 유지

### 인수 가능성을 높이는 증거

아래 수치는 인수 조건이나 업계 표준이 아니라 다음 단계 진입을 위한 내부 검증 기준 후보다.

#### 소비자 제품

- 핵심 persona의 D30 반복 사용 ≥ 20~30%
- valid result → place selection ≥ 30%
- place selection → navigation handoff ≥ 60%
- route 공유를 통한 신규 activation ≥ 10%
- organic 또는 creator 채널에서 재현 가능한 낮은 CAC

#### 거래

- 추천 결과에서 예약 가능한 상품 클릭과 완료를 end-to-end 측정
- 특정 persona·시장·corridor에서 반복 가능한 booking attach rate 확인
- partner에게 순증 예약 또는 전환율 상승을 A/B test로 증명
- Google·LLM·결제 비용을 제외한 contribution margin 양수

#### B2B

- 최소 2~3개 유료 PoC
- 서로 다른 파트너에서도 재사용 가능한 API/SDK
- 한 파트너에 종속되지 않은 반복 매출
- SLA, 실패율, p95 latency, 데이터 품질 dashboard

절대 MAU 숫자 하나보다 다음 문장이 데이터로 성립하는지가 중요하다.

> “OnMyWay를 적용하면 이동 중 관련 경험의 예약 전환이 증가하고, 여행자가 경유지를 결정하는 시간이 감소한다.”

### 단계별 전략

#### 0~6개월: 핵심 효용 검증

- Google 경로·필수 장소 필드의 한국/영어권 품질 gate 통과
- family/pet road-trip 한 persona에 집중
- 경로상 검색→선택→navigation handoff를 완전 계측
- 공유 route card와 waitlist로 organic 수요 검증
- 자체 리뷰·내비게이션·숙소 marketplace는 만들지 않음

#### 6~12개월: 여행 거래 연결

- 한 영어권 beachhead와 한국에서 반복 사용 비교
- 예약 가능한 주차·체험·식당·충전 중 1~2개 vertical integration
- 숙소 주소와 체크인 시간을 trip context로 받는 기능
- creator route와 Trip Pass 실험
- booking/affiliate attribution 구축

#### 12~24개월: 파트너 플랫폼화

- 렌터카·여행 일정·숙박 파트너 대상 API/SDK
- `숙소/렌터카 예약 → 경로 계획 → 경험 예약` 공동 PoC
- 파트너별 전환 상승과 unit economics 검증
- provider·inventory를 교체 가능한 구조로 유지
- 반복 매출과 복수 파트너 확보 후 전략적 제휴·투자·M&A 대화 검토

### 접근 순서

Airbnb나 Tripadvisor에 처음부터 “인수해 달라”고 접근하지 않는다.

1. 공개 API·affiliate 또는 일반 파트너 프로그램으로 거래 가설 검증
2. 소규모 여행·렌터카·숙박 사업자와 integration 사례 확보
3. 공동 마케팅 또는 embedded API PoC
4. 순증 예약·체류 중 소비·고객 만족 개선 자료 확보
5. 사업개발·전략적 투자·파트너십 대화
6. 복수의 잠재 파트너가 생긴 뒤에만 M&A를 선택지로 검토

특정 회사 하나만을 위해 제품을 만들면 협상력이 사라진다. Airbnb와 Tripadvisor 모두에게 유용하되, 어느 회사가 인수하지 않아도 독립적으로 매출을 만드는 구조가 가장 좋은 exit 전략이다.

### 최종 판단

- **가능성:** 전략적 적합성은 있으나 현재 상태의 인수 가능성은 낮다.
- **가장 가까운 적합성:** Tripadvisor/Viator형 Experiences 발견→예약 전환 계층.
- **Airbnb 적합성:** 숙소·Services·Experiences를 여행 이동 일정에 삽입해 attach rate를 높이는 계층.
- **권장 목표:** 소비자 앱 자체의 매각보다 `route-commerce engine + 사용자 intent + 거래 전환 + B2B API/SDK` 구축.
- **핵심 원칙:** exit를 쫓지 말고 독립적으로 가치 있는 사업을 만들되, 데이터·IP·아키텍처·계약을 언제든 실사 가능한 상태로 유지한다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*
## 18. 회원 기반·커뮤니티 주도 사용자 획득 전략

> 작성 기준: 2026-08-02. 목표는 가입자 숫자를 부풀리는 것이 아니라 반복 사용하는 회원, 직접 다시 도달할 수 있는 채널, 추천과 거래로 이어지는 사용자 관계를 만드는 것이다.

### 결론: 회원을 모으면 인수될 수 있는가

**활성 회원 기반은 분명 전략적 자산이지만, 회원 수만으로 인수가 만들어지지는 않는다.** 인수자가 평가하는 것은 계정 수나 누적 설치 수보다 다음 항목이다.

- 특정 문제를 반복해서 해결하는 활성 사용자
- 가입 후 30일 이상 유지되는 cohort
- 광고비 없이 다시 방문하는 organic·referral loop
- 이메일·push·앱 계정처럼 회사가 동의를 받아 직접 관리하는 관계
- 검색 의도가 예약·구매·내비게이션으로 전환되는 데이터
- 사용자를 모으는 비용보다 장기 가치가 큰 unit economics
- 개인정보·동의·삭제와 데이터 권리가 정리된 회원 기반

예를 들어 10만 개의 비활성 계정보다 매월 여행을 계획하고 경로를 공유하며 예약까지 수행하는 1만 명이 더 가치 있을 수 있다. 구매한 이메일 목록, 이벤트 경품 가입자, 설치 후 한 번도 쓰지 않은 사용자는 실사 과정에서 높은 가치를 받기 어렵다.

커뮤니티만 외부 플랫폼에 존재하는 경우에도 한계가 있다. 카카오톡·Discord·Facebook·Reddit 회원은 해당 플랫폼의 사용자이지 OnMyWay가 소유한 고객 관계가 아니다. 외부 커뮤니티는 발견 채널로 사용하고, 최종적으로는 명시적 동의를 받은 앱 계정·이메일·push·저장 경로로 관계를 전환해야 한다.

### 회원 기반의 네 단계

```text
Audience
  콘텐츠를 보거나 waitlist에 등록한 사람

Community
  반복적으로 문제·경로·피드백을 공유하는 사람

Product member
  앱에서 경로·profile을 저장하고 반복 검색하는 사람

Commercial member
  Plus/Trip Pass를 결제하거나 예약·제휴 거래를 수행하는 사람
```

인수 가치가 커지는 방향은 audience의 크기가 아니라 `Community → Product member → Commercial member` 전환이다.

### 커뮤니티에서 직접 활동해야 하는가

초기에는 **창업자가 직접 활동하는 것이 가장 효율적**이다. 다만 링크를 반복 게시하거나 앱을 홍보하는 활동이 아니라 사용자의 실제 문제를 이해하고 해결하는 활동이어야 한다.

권장 원칙:

- 커뮤니티 한 곳에서 먼저 신뢰를 만든다.
- 게시물의 70%는 문제 해결 정보, 20%는 대화·피드백, 10% 이하만 제품 소개로 운영한다.
- `앱 설치해 주세요`보다 실제 경로를 받아 결과를 만들어 주는 concierge 방식으로 시작한다.
- 커뮤니티 규칙과 광고·affiliate 표시 기준을 준수한다.
- 반복되는 질문을 제품 요구사항과 콘텐츠로 전환한다.
- 사용자의 위치·경로·여행 일정은 공개 게시판에 올리도록 강요하지 않는다.

초기 한국 커뮤니티 후보:

- 아이와 여행·지역 육아
- 반려견 동반 여행
- 캠핑·차박·장거리 운전
- 렌터카·제주 여행
- 명절 귀성·고속도로 이용자

글로벌 beachhead 후보:

- family road trip
- pet-friendly travel
- RV/camper travel
- rental-car travel
- 특정 road-trip corridor 커뮤니티

처음부터 여러 커뮤니티에 동일한 글을 뿌리지 않는다. 한 persona와 한 문제를 선택해 30~50명의 design partner를 확보하는 것이 우선이다.

### 가장 좋은 획득 구조

단순히 App Store에 등록한 뒤 검색 노출을 기다리는 방식은 초기 제품에 거의 충분하지 않다. 권장 funnel은 다음과 같다.

```text
문제 상황형 콘텐츠·커뮤니티 답변
→ 설치 없이 볼 수 있는 route preview/landing page
→ 사용자가 자신의 경로·조건 입력
→ 일부 결과와 실제 추가시간 확인
→ 같은 경로를 앱에서 계속 보기
→ 설치 후 route/search intent 복원
→ 첫 valid result와 navigation handoff
→ 경로 저장·공유 시 회원 전환
→ 반복 사용 후 Plus/Trip Pass 제안
```

핵심은 **설치를 첫 요청으로 두지 않는 것**이다. 사용자가 자신의 문제에 대한 결과를 먼저 본 다음 설치하도록 만든다.

### 설치 전 가치 제공

가장 강한 acquisition asset은 작은 웹 도구다.

예시:

- `서울→강릉 가는 길에 주차 가능한 카페 찾기`
- `Find an open stop with parking and less than a 10-minute detour`
- 명절·휴가철 특정 corridor route demo
- 사용자 경로를 입력하면 상위 1~2개 결과와 추가시간 preview

웹 preview에서 전체 결과 저장, 경로 공유, 실시간 재검색을 위해 앱을 설치하게 한다. 설치 후 deferred deep link 또는 복원 token으로 사용자가 입력한 경로와 조건을 그대로 복원한다. 스토어를 거치면서 입력이 사라지면 설치 전환과 activation이 모두 떨어진다.

### 콘텐츠와 SNS 전략

SNS는 브랜드 소식보다 **문제 해결 전후를 증명하는 채널**로 사용한다.

좋은 콘텐츠:

- 기존 지도에서 7번 조작한 검색을 한 번에 해결하는 영상
- 경로상 3분 우회와 18분 우회 장소 비교
- 주차정보가 없거나 영업이 끝난 후보를 제외하는 과정
- 실제 가족·반려동물 road trip route challenge
- 사용자가 보낸 경로를 30초 안에 개선하는 시리즈
- `5분 이상 우회하지 않는 카페`처럼 결과가 명확한 영상

약한 콘텐츠:

- 기능 목록만 나열
- `AI 기반 혁신 지도` 같은 추상적 메시지
- 지도 화면만 보여주는 데모
- 매일 앱 다운로드를 요청하는 게시물
- 실제 데이터 없이 생성한 여행 추천 목록

권장 채널 순서:

1. 문제와 persona가 이미 모인 niche community
2. Shorts/Reels/TikTok의 짧은 route demo
3. family/pet/road-trip micro creator
4. 사용자가 공유하는 route card·deep link
5. high-intent 검색 광고와 스토어 검색
6. broad app-install 광고는 retention 검증 후

대형 influencer 한 명보다 소규모 creator 10~20명에게 실제 route demo, follower용 Trip Pass, referral code를 제공하는 편이 초기 학습에 유리하다. 성과는 조회수가 아니라 first valid result, navigation handoff, D30 반복 사용, 결제로 평가한다.

### Product-led acquisition loop

공유할 이유가 제품 안에 있어야 한다.

```text
현재 영업 중 · 주차 가능 · 경로 +4분
[동승자에게 공유]
```

공유 받은 사람은:

1. 앱 없이 web preview를 본다.
2. 장소·추가시간·선택 이유를 확인한다.
3. 투표하거나 다른 후보를 제안한다.
4. 앱 설치 후 동일 경로를 복원한다.
5. 가족/여행 그룹에 참여한다.

후보 기능:

- route card와 universal/app link
- 동승자 후보 투표
- 가족·여행 그룹
- 저장 profile 초대
- creator route template
- referral로 양쪽에 제한된 Trip Pass 또는 Plus trial 제공

현금성 무제한 referral은 부정 사용을 유발할 수 있으므로 activation·navigation handoff 또는 유료 전환이 확인된 추천만 보상한다.

### 회원 기능 원칙

첫 검색 전에 회원가입을 강제하지 않는다.

권장 흐름:

```text
Guest
  경로 입력 → 검색 → 결과 선택 → 내비 실행

Progressive registration
  경로 저장 / profile 저장 / 공유 그룹 참여 / 결제
  → Apple·Google·email link로 간단 가입

Member
  기기 간 sync + 저장 profile + 경로 history

Subscriber
  AI Route Assistant + 비교·자동화 + cloud sync + quota
```

필수 회원 기능:

- Sign in with Apple·Google·email magic link 후보
- guest 데이터의 안전한 계정 병합
- 가족·반려동물·차량 profile
- 즐겨찾기·최근 경로·여행 그룹 sync
- 회원 초대·referral attribution
- push/email 수신 동의의 분리
- 세션·기기 관리
- 데이터 내보내기와 앱 내 계정 삭제

Apple은 계정을 생성할 수 있는 앱에 앱 내부 계정 삭제 시작 기능을 요구한다. Google Play도 앱과 web resource를 통한 계정 삭제 요청 및 관련 데이터 처리를 요구한다.

- [Apple 앱 내 계정 삭제 지침](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Google Play 계정 삭제 요구사항](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)

### 결제·구독 구조

권장 entitlement:

```text
FREE
  핵심 경로 검색 + 주차/영업/우회시간 + 제한된 rich search

PLUS
  AI Route Assistant + profile + 비교 + 자동화 + cloud sync

TRIP_PASS
  7일 또는 30일 여행 기간의 고급 일정·다중 경유 기능
```

디지털 기능 구독은 iOS의 App Store in-app purchase와 Android의 Google Play Billing을 기본으로 설계한다. 지역별 외부 결제 예외는 자주 바뀌므로 예외를 제품의 기본 전제로 삼지 않고 출시 전 최신 정책과 법률을 재검토한다. 실제 주차·식당·체험처럼 현실에서 소비되는 거래는 파트너 checkout과 스토어 정책 적용 범위를 별도로 검토한다.

- [Apple auto-renewable subscriptions](https://developer.apple.com/app-store/subscriptions/)
- [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/)
- [Google Play subscription 관리](https://support.google.com/googleplay/android-developer/answer/140504?hl=en)

필수 구현:

- 스토어 transaction/영수증 서버 검증
- App Store·Google Play 서버 알림/webhook
- 서버 기준 entitlement
- 구매 복원
- 중복 이벤트 idempotency
- 갱신·만료·취소·환불·grace period·결제 실패 처리
- 시장별 상품 ID·가격·통화
- 계정 삭제와 구독 취소가 별도일 수 있음을 명확히 안내
- 카드정보를 자체 서버에 저장하지 않음

Paywall은 사용자가 첫 valid result와 핵심 가치를 경험한 뒤에 노출한다. 앱 실행 직후의 회원가입·구독 화면은 초기 activation을 약화시킬 가능성이 크다.

### 90일 실행안

#### 1~2주: acquisition 기반

- 한국/영어 landing page
- persona별 waitlist와 예정 여행 날짜 수집
- route preview prototype
- install·activation·navigation handoff analytics
- universal/app link와 route 복원 설계

#### 3~6주: founder-led community

- persona 하나와 커뮤니티 1~2곳 선택
- 30~50명 design partner 모집
- 실제 경로를 수동으로 해결하는 concierge test
- 주 2~3개의 before/after route demo
- 이탈 이유와 반복 사용 상황 인터뷰

#### 7~10주: product loop

- 공유 route card와 투표
- guest → 저장 시 progressive registration
- micro creator 10명 내외의 소규모 실험
- referral별 activation·navigation handoff 계측

#### 11~12주: monetization signal

- Plus/Trip Pass fake-door
- 가격 페이지와 결제 의향 측정
- 첫 valid result 이후 paywall A/B test
- 반복 사용 persona와 비활성 회원 분리
- retention이 확인된 채널만 확대

### 획득 dashboard

```text
Content/community impression
→ Landing/route preview
→ App store view
→ Install
→ First route
→ First valid result
→ Navigation handoff
→ Registration
→ D7/D30 repeat
→ Share/referral
→ Trial/paid/booking
```

시장·persona·creator·community별로 다음을 분리한다.

- route preview → store 전환
- store view → install
- install → first valid result
- time to first value
- navigation handoff
- guest → member
- D7/D30 반복 사용
- member 중 월간 경로 검색자 비율
- referral activation
- trial·paid·renewal·cancel
- 검색당 API 원가와 회원 contribution margin

인수 관점에서 보고할 회원 수는 `total registered users`보다 다음이 유효하다.

```text
Monthly Active Route Planners
Repeat Navigation Users
Referring Members
Paying/Booking Members
Partner-attributed Transactions
```

### 피해야 할 접근

- 앱스토어 출시를 acquisition 전략으로 간주
- 회원가입을 첫 화면에서 강제
- 경품으로 관계없는 가입자를 대량 모집
- follower·install·리뷰 구매
- 커뮤니티 규칙을 무시한 반복 홍보
- 기능이 없는 상태에서 Discord·카페 자체를 먼저 크게 운영
- 무료 핵심 가치를 제거하고 바로 구독 요구
- 한 번의 여행 사용자에게 월 구독만 강요
- 사용자 동의 없이 위치·경로를 마케팅에 재사용

### 최종 권장안

```text
1. family/pet road-trip 한 persona 선택
2. founder가 niche community에서 실제 경로 문제 해결
3. 설치 전 route preview로 가치 증명
4. 앱 설치 후 같은 경로를 즉시 복원
5. 저장·공유 시 회원 전환
6. route card와 micro creator로 referral loop 구축
7. 반복 사용 후 Plus 또는 Trip Pass 제안
8. active member·거래 전환을 B2B 파트너와 인수 후보에게 증명
```

회원 기반은 exit를 위한 숫자가 아니라 **검증된 수요, 직접적인 distribution, route-intent, 반복 매출**의 결합이어야 한다. 이 구조를 만들면 인수가 일어나지 않더라도 독립 사업으로 남고, 그 독립성이 오히려 전략적 협상력을 높인다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*
## 19. 여행계획·동선 플랫폼 확장 후보

> 작성 기준: 2026-08-02. 상태는 **조건부 후보**다. 현재 경로상 장소 검색의 반복 사용과 거래 전환이 검증된 뒤 진행하며, 단순 AI 일정 생성 기능으로 범위를 넓히지 않는다.

### 핵심 판단

여행계획·동선 앱으로의 확장은 OnMyWay와 잘 맞는다. 현재 제품이 해결하는 것은 `출발지→목적지 사이에 어디를 들를 것인가`이고, 여행계획은 이를 다음 수준으로 확장한 문제다.

```text
현재 OnMyWay
  하나의 경로에서 최적 경유지 찾기

당일 계획
  여러 장소의 방문 순서와 시간 최적화

다일 여행
  숙소·날짜·예약을 기준으로 일자별 동선 구성

여행 중 실행
  교통·날씨·휴무·지연에 따른 실시간 재계획
```

그러나 `AI가 유명 장소를 조합해 일정 문장을 생성하는 앱`으로 가면 경쟁이 매우 심하고 차별화가 약하다. Google·OTA·LLM 서비스가 쉽게 제공할 수 있으며, 일정이 실제로 가능한지 보장하지 못하면 신뢰를 잃는다.

OnMyWay가 가져갈 포지션은 다음과 같다.

> **영감을 주는 여행 추천기가 아니라, 영업시간·예약·이동시간·주차·동행자 조건을 만족하는 실행 가능한 여행 동선 엔진**

### 시장에서의 차별화 방향

기존 여행계획 제품은 대체로 다음 중 하나에 강하다.

- 예약 confirmation과 일정을 모으는 organizer
- 장소를 지도에 저장하고 일자별로 수동 배치하는 planner
- road trip 경로와 관광지를 추천하는 도구
- AI가 자연어 일정 초안을 만드는 도구
- 여행 후기·콘텐츠에서 장소를 발견하는 플랫폼

OnMyWay는 다음 결합에 집중한다.

```text
route-aware planning
+ 실제 이동·우회시간
+ 장소 영업·주차 상태
+ 예약 가능 시간
+ 사용자/동행자 profile
+ 여행 중 재계획
+ 예약·내비게이션 실행
```

Roadtrippers처럼 road-trip 경로와 경유지에 특화된 제품은 범용 여행계획보다 뚜렷한 사용 맥락을 만들 수 있다. Roadtrippers는 공식 사이트에서 실제 trip 데이터를 기반으로 한 계획 기능과 유료 기능을 운영한다. [Roadtrippers](https://roadtrippers.com/)

### 확장 순서

#### 1단계: Route Mode — 현재 핵심

- 출발지·목적지
- 경로상 장소 검색
- 주차·영업·추가 우회시간
- 외부 내비게이션 handoff
- 경로 저장·공유

#### 2단계: Day Trip Mode

- 여러 경유지 선택
- 시간 제한과 영업시간을 반영한 방문 순서
- 출발·도착 희망 시간
- 식사·휴식·체험 category별 slot
- 동승자 투표와 공동 편집
- 일정이 불가능할 때 원인과 완화 옵션 표시

#### 3단계: Multi-day Trip Mode

- 여행 날짜와 숙소
- 숙소 또는 다음 도시를 anchor로 일자별 장소 cluster
- 이동수단·예산·동행자 profile
- 예약된 항공·숙소·체험을 고정 일정으로 반영
- 일자별 총 이동시간과 여유시간
- 예약 confirmation import·calendar export 후보

#### 4단계: In-trip Replanning

- 교통 지연
- 비·폭염·한파 등 날씨
- 임시 휴무·영업시간 변경
- 예약 지연 또는 취소
- 사용자의 피로·일정 단축 요청

자동으로 전체 계획을 바꾸지 않고 변경 이유, 영향, 대안을 보여준 뒤 사용자가 승인하게 한다.

### 제품 데이터 모델 후보

```ts
type Trip = {
  id: string;
  market: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  travelers: TravelerProfile[];
  dayPlans: DayPlan[];
  constraints: TripConstraint[];
  status: 'DRAFT' | 'BOOKED' | 'IN_PROGRESS' | 'COMPLETED';
};

type ItineraryItem = {
  placeId: string;
  source: 'USER' | 'RECOMMENDED' | 'RESERVATION';
  fixedTime?: string;
  durationMinutes: number;
  openingHoursStatus: 'VERIFIED' | 'UNKNOWN';
  reservation?: ReservationRef;
};
```

핵심 domain:

- `Trip`: 여행 전체와 시장·시간대
- `DayPlan`: 한 날짜의 출발·종료 지점과 일정
- `ItineraryItem`: 장소·예약·활동
- `RouteSegment`: 일정 사이 이동수단·거리·시간
- `Constraint`: 예산·최대 이동·영업·접근성·동행자 조건
- `Reservation`: 외부 예약과 변경·취소 상태
- `TravelerGroup`: 공동 편집·권한·투표

계획 생성은 LLM 단독으로 처리하지 않는다.

```text
LLM/규칙
  자연어 요구를 constraint로 구조화

Candidate retrieval
  장소·체험·예약 가능 후보 생성

Constraint solver
  시간창·이동·영업·예약 충돌 검사

Route optimizer
  방문 순서와 이동 비용 계산

Validator
  실행 가능성·UNKNOWN·정책 검증

Explanation
  추천 이유와 trade-off를 사용자에게 설명
```

### BM 1: Trip Pass — 가장 자연스러운 초기 상품

여행계획은 사용 빈도가 계절적이기 때문에 월 구독만 제공하면 전환이 약할 수 있다. 한 번의 여행에 맞춘 Pass가 현재 OnMyWay와 가장 잘 맞는다.

후보 구성:

- 7일 또는 30일 이용
- multi-day 계획
- 경유지·일정 수 상향
- 여행 중 재계획
- 공동 편집
- offline/export
- 예약·영업 변경 알림 후보

가격은 결론이 아니라 시장별 실험 대상으로 둔다. 기존 Trip Pass 후보 범위에서 여행 기간·API 원가·스토어 수수료·지원 비용을 반영해 검증한다.

### BM 2: Plus 구독

반복 여행자에게 제공한다.

- 연중 여러 trip
- 가족·반려동물·차량 profile
- 과거 여행 복제
- 여러 경로·일정 비교
- 고급 협업
- cloud history
- AI Route Assistant와 자동 재계획 quota

대상:

- 가족 여행을 자주 하는 사용자
- 캠핑·RV·로드트립 사용자
- 장거리 여행 creator
- 반복 출장·현장 이동 사용자

월간 이용 빈도가 낮다면 Monthly보다 Annual 또는 Trip Pass를 우선한다.

### BM 3: 예약·거래 commission

여행계획은 사용자의 구매 의도가 가장 구체화되는 시점이므로 거래 모델과 잘 맞는다.

가능한 항목:

- 숙소
- Experiences·관광 티켓
- 렌터카
- 주차
- 식당·픽업 주문
- EV 충전
- 캠핑장
- 여행 보험 후보

중요한 것은 추천 목록에 affiliate 링크를 붙이는 것이 아니라 계획상 실제 가능한 상품만 제시하는 것이다.

```text
일정에 들어갈 수 있음
+ 이동시간 충족
+ 영업/예약 가능
+ 사용자 조건 충족
→ 예약 후보
```

제휴 수익 때문에 관련도나 동선이 나쁜 상품을 우선하면 planner 전체에 대한 신뢰를 잃는다. 제휴·sponsored 여부를 명확히 표시하고 organic ranking과 분리한다.

### BM 4: B2B itinerary API/SDK

장기적으로 가장 전략적일 수 있다.

대상:

- OTA·여행 일정 플랫폼
- 렌터카·카셰어링
- 숙박·리조트
- 관광청·DMO
- 항공·공항 서비스
- 캠핑·RV 플랫폼
- 차량 인포테인먼트
- 여행사·투어 운영사

제공 형태:

```text
예약 정보 + 여행자 조건 + 날짜
→ 실행 가능한 일자별 동선
→ 예약 가능한 빈 시간
→ 경로상 추가 구매 후보
→ 여행 중 재계획
```

과금 후보:

- trip 생성 건수
- active itinerary 또는 traveler 수
- API 호출량
- 월 기본료 + 사용량
- white-label 구축·운영비
- 예약 전환 revenue share

### BM 5: Creator·community marketplace 후보

creator가 검증한 route template를 만들고 사용자가 자신의 날짜·숙소·조건에 맞게 변환하는 방식이다.

- 가족 여행 일정
- 반려견 동반 route
- 캠핑·RV corridor
- 렌터카 해외 road trip
- 지역 전문가의 1~3일 일정

수익 후보:

- 유료 template
- creator revenue share
- template에서 발생한 Trip Pass·예약 commission

다만 초기부터 marketplace를 만들지 않는다. 먼저 creator route가 실제 activation과 예약 전환을 높이는지 수동으로 검증한다.

### 비용과 unit economics

여행계획은 단일 경로 검색보다 비용이 커질 수 있다.

- 여러 날짜·경로의 Routes 호출
- 많은 후보에 대한 Places 필드
- 일정 재계산
- LLM 의도 해석·설명
- 날씨·예약 availability
- push와 고객지원

비용 제어 원칙:

- trip별 계산 budget
- 전체 후보를 한 번에 상세 조회하지 않음
- 사용자가 선택한 날짜·지역부터 lazy calculation
- 변경된 day/segment만 부분 재계산
- LLM이 경로·영업시간을 추측하지 않음
- deterministic solver 결과를 설명하는 용도로 LLM 사용
- Free·Trip Pass·Plus별 waypoint·replan quota

affiliate commission만으로 무료 사용자의 모든 planning 비용을 충당할 수 있다고 가정하지 않는다. 검색당 원가, trip당 원가, 예약 attach rate, 취소율과 순수 commission을 함께 측정한다.

### Exit 옵션

#### Airbnb

숙소 예약 후 체크인 전후의 Experiences·Services를 일정에 삽입하고 attach rate를 높이는 엔진으로 적합하다. 단순 일정 생성보다 Airbnb inventory의 추가 거래를 증명해야 한다.

#### Tripadvisor·Viator

여행 inspiration·리뷰를 실행 가능한 일자별 체험 예약으로 전환하는 계층으로 가장 직접적인 적합성이 있다.

#### Booking Holdings·Expedia 계열

숙소·항공·렌터카·액티비티 예약을 하나의 trip object와 실행 동선으로 연결하는 전략적 가치가 있을 수 있다.

#### Road-trip·RV 플랫폼

Roadtrippers/Roadpass와 같은 road travel ecosystem은 경로 최적화, 캠핑·RV profile, 경유 거래와 직접 맞는다. Roadtrippers가 Roadpass Digital에 인수된 사례는 전문 road-trip 제품도 전략적 결합 대상이 될 수 있음을 보여주는 참고 사례다. 거래 정보는 [Crunchbase의 Roadtrippers 인수 기록](https://www.crunchbase.com/acquisition/roadpassdigital-acquires-roadtrippers--bd793c17)을 참고하되, 본 제품의 미래 거래 가능성을 보장하는 근거로 사용하지 않는다.

#### 렌터카·자동차·지도 플랫폼

- 렌터카: 예약 이후 전체 road-trip 경험과 부가 매출
- 완성차·인포테인먼트: 차량 안에서 실행 가능한 trip plan
- 지도·내비게이션: multi-day intent와 경로상 거래 계층
- 주차·충전: 여행 전 수요와 예약 연결

#### Corporate travel 후보

출장 예약 confirmation, 일정 충돌, 공항 이동과 경비 흐름으로 확장하면 기업 여행·expense 플랫폼도 후보가 될 수 있다. 그러나 leisure와 요구사항이 크게 다르므로 초기 범위에서는 제외한다.

### 인수 가치가 생기는 자산

- 날짜·숙소·예약·경로를 연결한 `trip graph`
- 실행 가능한 계획을 만드는 constraint/replanning engine
- 계획 → 예약 → 이동 → 방문의 attribution
- 가족·반려동물·RV 등 반복 사용 profile
- creator·동승자 collaboration network
- 파트너 inventory와 API/SDK 계약
- 시장별 동선·예약 전환 데이터
- 높은 trip completion과 반복 사용

반대로 생성된 일정 문장, Google 장소 목록, LLM prompt만으로는 방어력이 약하다.

### Phase 진입 gate

여행계획 기능이 매력적으로 보여도 현재 핵심을 검증하기 전에 확장하지 않는다. 다음은 내부 후보 기준이며 업계 표준이 아니다.

- 핵심 route-stop persona D30 반복 사용 ≥ 20%
- valid result → 선택 → navigation handoff funnel 안정화
- 사용자가 한 여행에서 2개 이상의 경유지·날짜·저장 기능을 반복 요청
- 경로 저장 또는 공유 사용률이 충분히 관찰됨
- Trip Pass fake-door 또는 가격 페이지에서 결제 신호 확인
- 한국과 영어권 beachhead에서 Places·Routes 필수 데이터 gate 통과
- 단일 검색과 trip 전체의 API 원가를 측정 가능

통과하지 못하면 범용 planner로 확장하지 않고 현재 route-stop 또는 B2B API에 집중한다.

### 권장 실행 순서

```text
1. Route Mode의 반복 사용 검증
2. 당일 다중 경유지와 공동 투표
3. Trip Pass로 한 여행 단위 결제 검증
4. 숙소 anchor 기반 1~3일 일정
5. 예약 가능한 Experiences·주차·렌터카 연결
6. 여행 중 실시간 재계획
7. 동일 엔진을 itinerary API/SDK로 제공
8. 파트너 전환 상승 입증 후 전략적 제휴·M&A 검토
```

### 최종 판단

- **제품 적합성:** 높음. 현재 경로상 검색의 자연스러운 상위 문제다.
- **즉시 실행 여부:** 보류. 핵심 route-stop retention과 거래 전환을 먼저 검증한다.
- **피해야 할 방향:** 범용 AI 일정 생성기, 콘텐츠 복제, 너무 이른 숙소 marketplace.
- **권장 BM:** Trip Pass → Plus/Annual → 예약 commission → B2B itinerary API/SDK 순으로 검증.
- **exit 가치:** 사용자 수보다 trip graph, constraint engine, booking attribution, partner distribution에서 발생한다.

여행계획 확장은 OnMyWay의 방향을 바꾸는 별도 제품이 아니라, `경로상 한 장소`에서 `하루`, `여러 날`, `여행 실행 전체`로 문제 범위를 단계적으로 넓히는 옵션으로 유지한다.

*웹 출처 내용은 라이선스 준수를 위해 요약·재서술했다.*
## 20. 핵심 Pain Point와 마케팅 메시지 전략

> 작성 기준: 2026-08-02. 사용자가 제공한 프로젝트 배경 이미지와 실제 반복 사용 경험을 바탕으로 정리했다. 운전 중 화면 조작을 권장하지 않으며, 제품 사용은 출발 전·안전한 정차 상태·동승자 조작을 기본으로 표현한다.

### 이미지에서 확인되는 핵심 문제

기존 지도 앱의 장소 검색은 대부분 `현재 지도 중심점 또는 특정 지점 주변`을 기준으로 한다. 그러나 OnMyWay 사용자가 원하는 검색 범위는 하나의 점이 아니라 **출발지에서 목적지까지의 전체 경로**다.

현재 사용자의 실제 작업은 다음과 같다.

```text
1. 출발지와 목적지로 경로 확인
2. 장소를 찾기 위해 경로 화면을 벗어남
3. 경로 중간으로 추정되는 지점으로 지도 이동
4. 키워드 검색
5. 결과가 적합하지 않으면 다른 지점으로 이동
6. 같은 키워드를 다시 검색
7. 각 결과가 원래 경로에서 얼마나 떨어졌는지 기억으로 비교
8. 장소를 경유지로 넣어본 뒤에야 추가시간 확인 가능
9. 마음에 들지 않으면 과정을 반복
```

이 과정의 pain point는 단순히 검색 횟수가 많다는 것이 아니다.

- 경로를 보면서 검색할 수 없다.
- 검색할 지점을 사용자가 추측해야 한다.
- 검색 중심점이 바뀔 때마다 결과 집합이 달라진다.
- 서로 다른 검색 결과를 한 목록에서 비교하기 어렵다.
- 직선거리와 실제 우회시간의 차이를 알 수 없다.
- 도로 반대편·유턴·진입 문제를 장소 카드만으로 판단할 수 없다.
- 여러 번 지도와 경로를 오가면서 결정 피로가 생긴다.
- 이동 중이라면 반복 조작이 안전상 더 큰 문제가 된다.

### 제품의 핵심 Job-to-be-Done

> **이미 정한 경로를 유지한 채, 가는 길 전체에서 원하는 장소를 찾고, 실제로 얼마나 돌아가는지 비교해 결정하고 싶다.**

이를 가장 짧게 표현하면 다음과 같다.

```text
Point-based search → Route-based search
주변 검색 → 경로 검색
거리 비교 → 실제 추가시간 비교
여러 번 검색 → 한 번에 비교
```

OnMyWay가 판매하는 것은 장소 검색이 아니라 **경로를 잃지 않고 경유 결정을 내리는 방식**이다.

### 소유해야 할 카테고리 문장

가장 권장하는 표현:

> **주변 검색 말고, 경로 검색.**

보조 설명:

> 출발지와 목적지를 정하면 가는 길 전체에서 원하는 장소를 찾고, 경유하면 몇 분이 더 걸리는지 한눈에 비교합니다.

이 문장은 다음 장점이 있다.

- 기존 지도와 다른 검색 단위를 즉시 설명한다.
- AI·MCP·Search Along Route 같은 기술 용어가 없다.
- 한국과 글로벌에서 같은 개념으로 번역 가능하다.
- 향후 여행계획 기능으로 확장해도 유지할 수 있다.

영문 후보:

> **Search your route, not the map.**

> Find the right stop along the way—and see the detour before you go.

### 메시지 우선순위

#### 1순위: 문제 공감

- 가는 길에 찾으려고 지도를 계속 옮겨본 적 있나요?
- 경로 중간마다 같은 검색어를 반복하지 마세요.
- 이 장소가 정말 가는 길인지, 들르면 몇 분 더 걸리는지 바로 알 수 있어야 합니다.

#### 2순위: 제품 약속

- 가는 길 전체에서 한 번에 검색
- 경로는 그대로, 검색만
- 여러 지점 검색 결과를 한 화면에서 비교
- 장소마다 실제 추가 우회시간 표시

#### 3순위: 신뢰 근거

- 출발지→목적지의 실제 경로 기준
- 현재 영업 여부와 주차정보
- `+4분`, `+11분`처럼 결정 가능한 단위
- 외부 내비게이션으로 바로 연결

`AI`, `LLM`, `MCP`, `Google API`는 첫 메시지에 넣지 않는다. 사용자는 기술이 아니라 반복 검색 제거와 잘못된 경유 방지에 관심이 있다.

### 권장 Hero copy

#### 안 A: 카테고리 정의형 — 최우선

```text
주변 검색 말고, 경로 검색.

가는 길 전체에서 원하는 장소를 찾고
경유하면 몇 분 더 걸리는지 바로 비교하세요.

[내 경로에서 찾아보기]
```

#### 안 B: Pain point 직설형

```text
가는 길에 찾으려고
지도를 여러 번 옮기고 있나요?

OnMyWay는 경로 전체를 한 번에 검색하고
각 장소의 추가시간을 보여줍니다.

[반복 검색 없이 찾아보기]
```

#### 안 C: 결정 중심형

```text
이 카페, 정말 가는 길일까?

장소까지의 거리가 아니라
경유했을 때 늘어나는 시간을 비교하세요.

[+몇 분인지 확인하기]
```

#### 안 D: 장거리·가족 persona

```text
아이와 가는 길,
주차 가능하고 지금 여는 곳만.

경로에서 벗어나지 않고
가장 덜 돌아가는 장소를 찾으세요.
```

### 짧은 마케팅 문구 후보

- `경로는 그대로, 검색만 하세요.`
- `가는 길 전체가 검색 범위가 됩니다.`
- `이 장소, 들르면 몇 분 더 걸릴까요?`
- `같은 검색을 지도 중간마다 반복하지 마세요.`
- `거리보다 중요한 건 실제 추가시간.`
- `가는 길에 있는 곳만, 덜 돌아가는 순서대로.`
- `검색 결과를 지도에서 기억하지 말고, +시간으로 비교하세요.`
- `출발지와 목적지 사이, 가장 좋은 한 곳.`
- `Find stops along the way, ranked by detour.`
- `Know the detour before you choose.`

`최적`, `가장 빠른`, `정확한` 같은 절대 표현은 실제 ranking과 데이터 정확도를 검증하기 전에는 사용하지 않는다. 대신 `실제 경로 기준`, `예상 추가시간`, `비교`처럼 증명 가능한 표현을 사용한다.

### Pain point 시각화 활용 원칙

이 이미지는 기존 지도 앱의 기능 정확성을 비교하는 자료가 아니라, 사용자가 겪는 작업 흐름을 보여주는 **problem narrative 참고 자료**로만 사용한다.

```text
기존 방식
경로 확인 → 검색을 위해 경로 화면 이탈 → 중간 지점 추측 → 반복 검색
→ 서로 다른 결과를 기억으로 비교 → 경유지로 넣은 뒤 추가시간 확인

OnMyWay
경로 선택 → 키워드 한 번 입력 → 전체 경로의 후보와 예상 추가시간 비교
```

소비자 메시지에서는 서비스별 기능표나 V1 세부 기능보다 `기존 6~9단계의 반복 작업이 OnMyWay에서 2~3단계로 줄어든다`는 전후 차이에 집중한다.

### 15초 영상 구성

```text
0~3초
서울→강릉 경로와 문구:
“가는 길에 주차 가능한 카페를 찾으려면?”

3~7초
기존 지도에서 중간 지점 이동→검색→다시 이동→재검색
“어디서 검색해야 하지?”

7~10초
서로 다른 검색 결과와 경로가 사라진 화면
“어느 곳이 덜 돌아가는지도 모릅니다.”

10~14초
OnMyWay에서 경로 전체 검색
A 카페 +4분 / B 카페 +11분 / C 카페 +18분

14~15초
“주변 검색 말고, 경로 검색.”
[내 경로에서 찾아보기]
```

영상은 말보다 실제 화면 조작 횟수와 `+4분` 결과를 보여주는 것이 중요하다.

### App Store screenshot 순서

1. `주변 검색 말고, 경로 검색`
2. `가는 길 전체에서 한 번에 찾기`
3. `장소마다 예상 추가시간 비교`
4. `현재 영업·주차 가능 여부 확인`
5. `선택한 장소를 내비게이션으로 연결`
6. `가족·반려동물 조건 저장` — 구현 이후

첫 screenshot에 AI나 기능 목록을 넣지 않는다. 사용자가 2초 안에 차이를 이해해야 한다.

### 커뮤니티 게시물 방식

광고형 게시물:

```text
경로 주변 검색 앱을 만들었습니다. 다운로드해 주세요.
```

문제 검증형 게시물:

```text
장거리 운전할 때 가는 길에 카페나 식당을 찾으려고
지도 중간중간을 옮기며 같은 검색을 반복한 적 있으신가요?

저는 이 과정이 너무 불편해서
출발지와 목적지를 넣으면 경로 전체에서 검색하고,
각 장소에 들렀을 때 +몇 분인지 비교하는 도구를 만들고 있습니다.

최근 실제로 경유지를 찾았던 경로와
가장 불편했던 정보를 알려주시면 그 사례로 테스트해보겠습니다.
```

먼저 사용 경험과 경로 사례를 받고, 요청한 사용자에게 web preview 또는 beta를 제공한다. 커뮤니티 규칙에 따라 광고·beta 모집임을 명확히 표시한다.

### Persona별 문구

#### 가족

> 아이와 가는 길, 주차 가능하고 지금 여는 곳만. 가장 덜 돌아가는 장소를 비교하세요.

#### 반려동물

> 반려견과 들를 수 있는 곳, 경로에서 몇 분 벗어나는지까지.

#### Road trip

> 다음 휴식 장소를 감으로 고르지 마세요. 경로상 후보와 실제 추가시간을 비교하세요.

#### 렌터카 여행

> 낯선 도시에서도 숙소 가는 길에 필요한 곳을 한 번에.

#### 현장 업무

> 다음 방문지 사이에서 필요한 장소를 찾고, 일정에 미치는 시간을 바로 확인하세요.

### Founder story 활용

사용자가 실제로 이 문제를 자주 겪고 OnMyWay를 많이 사용한다는 사실은 강한 founder-problem fit 신호다. 이를 origin story로 활용할 수 있다.

```text
“장거리 운전 때마다 지도 중간으로 화면을 옮겨
같은 검색어를 여러 번 입력했습니다.
결과를 찾아도 경유하면 몇 분이 더 걸리는지 알 수 없었습니다.
그래서 지점 주변이 아니라 경로 전체를 검색하는 OnMyWay를 만들었습니다.”
```

다만 `나에게 필요하다`를 `시장 전체가 필요하다`로 바로 일반화하지 않는다. founder story는 가설의 출발점이고 다음 데이터로 확장성을 검증한다.

- 동일한 반복 검색 경험을 가진 사용자 비율
- 최근 한 달의 실제 발생 횟수
- 기존 지도에서 평균 검색 지점·검색 횟수
- OnMyWay 사용 후 결정까지 걸린 시간 감소
- 결과 선택과 navigation handoff
- D7/D30 반복 사용
- 사용자가 스스로 설명하는 가장 큰 절약 요소

### 제품 analytics로 pain point 증명

측정 후보:

```text
기존 방식 인터뷰/사용성 테스트
  검색 중심점 이동 횟수
  동일 키워드 재검색 횟수
  경로 화면↔검색 화면 전환 횟수
  최종 경유 결정 시간

OnMyWay
  검색 1회당 유효 결과율
  장소별 +시간 확인률
  결과 비교 후 선택률
  navigation handoff
  반복 검색 감소
  동일 사용자의 재사용
```

마케팅 문구도 이 데이터를 기반으로 강화한다.

예시:

- `지도 이동 5번을 경로 검색 1번으로` — 실제 테스트 통과 후
- `경유지 결정 시간을 평균 N분 단축` — 충분한 표본 확보 후
- `사용자의 N%가 첫 검색에서 경유지를 선택` — 분석 기준 명시 후

### 안전 메시지

Pain point가 운전 중 발생하더라도 광고가 운전 중 화면 조작을 유도해서는 안 된다.

- 기본 사용 상황은 출발 전, 안전한 정차 후, 동승자 조작으로 표현한다.
- 주행 중 사용이 필요한 경우 향후 음성·CarPlay·Android Auto 등 안전한 인터페이스를 별도 검토한다.
- 영상에서 운전자가 휴대전화를 직접 조작하는 장면을 사용하지 않는다.
- `운전 중 바로 검색` 대신 `이동 중 들를 곳을 출발 전 빠르게 결정`처럼 표현한다.

### 최종 메시지 체계

```text
Category
  주변 검색이 아니라 경로 검색

Problem
  지도 중간마다 같은 검색을 반복하고도 실제 우회시간을 모름

Promise
  경로 전체에서 한 번에 찾고 +몇 분인지 비교

Proof
  주차·영업·실제 경로 기반 결과

CTA
  내 경로에서 찾아보기
```

초기에는 이 한 메시지를 모든 채널에서 반복한다. 여행계획, AI Assistant, 멤버십, 글로벌 기능을 한 광고에 함께 넣지 않는다. 사용자가 먼저 `경로 검색`이라는 차이를 기억하게 한 뒤 세부 기능을 설명한다.


## 21. OTA 업데이트·릴리스 안전 전략

> 조사·가격 확인 기준: 2026-08-02. 상태는 **결정됨**이다. OTA는 출시 후 검토 항목이 아니라 **첫 프로덕션 iOS/Android 바이너리 제출 전 필수 기능**이다. 요금·스토어 정책은 변경될 수 있으므로 실제 출시 직전에 공식 페이지를 다시 확인한다.

### 결정됨: EAS Update를 첫 프로덕션 배포 전에 도입

OnMyWay V3의 기본안은 **EAS Update + `expo-updates`**다. 기존 `react-native-code-push`와 `appcenter*`는 제거하고 복원하지 않는다. Microsoft App Center의 CodePush 등 대부분 기능은 2025-03-31 종료됐으며, standalone CodePush 서버를 직접 운영하는 방법이 남아 있어도 이를 기본안으로 삼지 않는다.

이 결정이 출시 전 필수인 이유는 OTA 수신 클라이언트가 네이티브 바이너리에 포함돼야 하기 때문이다. 첫 출시 바이너리에 `expo-updates`, update URL, project ID, channel과 `runtimeVersion`이 없으면 출시 후 OTA만으로 기능을 추가할 수 없다. 결국 새 바이너리를 다시 빌드해 스토어 심사를 거쳐야 한다.

```text
첫 프로덕션 바이너리
  embedded JS bundle
  + expo-updates native client
  + EAS project/update URL
  + production channel
  + runtimeVersion
  + signing 검증 설정

출시 후
  호환되는 JS/assets hotfix → OTA
  native/권한/SDK 변경 → 새 스토어 바이너리
```

### 대안 비교

| 선택지 | 기존 bare RN 적용 | 운영 부담 | 보안·롤백 체계 | 판단 |
|---|---:|---:|---:|---|
| EAS Update + `expo-updates` | 가능 | 낮음~중간 | channel, rollout, rollback, runtime compatibility 제공 | **기본 권장** |
| standalone CodePush 서버 | 가능 | 높음 | 서버·스토리지·인증·가용성·클라이언트 유지보수를 직접 책임 | 기본안 아님 |
| Expo protocol 자체 update 서버 | 가능 | 높음 | 유연하지만 manifest·asset hosting·서명·롤백·관측성을 직접 운영 | 규제·비용·통제 요구가 생길 때만 검토 |
| OTA 없음 | 해당 없음 | 단기적으로 낮음 | 긴급 JS hotfix도 스토어 심사 필요 | 첫 출시 요건 불충족 |

자체 호스팅은 SaaS 비용을 줄이는 단순 대체재가 아니다. 다음 비용이 EAS 요금보다 낮은지 함께 계산해야 한다.

- 고가용 update API와 asset CDN
- 인증·게시 권한·감사 로그
- manifest와 asset 무결성·서명 검증
- runtime별 호환성 라우팅
- 점진 배포·중단·rollback 도구
- 장애 대응, 모니터링, 백업과 유지보수 인력

### OTA로 가능한 변경과 불가능한 변경

| 변경 유형 | OTA 가능 여부 | 배포 방식 |
|---|---:|---|
| JS/TS bundle 버그 수정 | 가능 | 호환 runtime에 OTA |
| 문구·레이아웃·일부 비즈니스 로직 | 가능 | 정책·runtime 확인 후 OTA |
| 기존 native bundle이 지원하는 이미지·폰트 등 정적 asset | 가능 | OTA |
| Swift/Objective-C/Kotlin/Java 변경 | 불가 | 새 스토어 바이너리 |
| 새 native module 또는 native dependency 변경 | 불가 | 새 스토어 바이너리 |
| React Native·Expo SDK·지도 SDK 업그레이드 | 불가 | 새 스토어 바이너리 |
| `Info.plist`, entitlement, `AndroidManifest.xml`, 권한 변경 | 불가 | 새 스토어 바이너리 |
| 앱의 핵심 목적 변경·스토어 심사 우회 | 사용 금지 | 정식 스토어 심사 |

OTA 가능 여부는 파일 확장자만으로 판단하지 않는다. JS 코드가 새 native API를 호출하거나 새 권한을 전제로 하면 native 변경과 같은 새 바이너리가 필요하다.

### Runtime compatibility가 핵심 안전장치

OTA bundle과 설치된 네이티브 바이너리의 native runtime이 다르면 startup crash 또는 기능 손상이 발생할 수 있다. `runtimeVersion`은 업데이트가 호환되는 바이너리에만 전달되도록 하는 계약이다.

권장안:

1. V3에서는 EAS의 `fingerprint` 정책을 우선 검증한다.
2. fingerprint 도입이 어렵다면 네이티브 의존성이 바뀔 때마다 명시적 runtime version을 올린다.
3. 같은 production channel에서도 서로 다른 runtime은 각자 호환되는 update만 받게 한다.
4. CI가 native dependency, native source, 권한·manifest 변경을 감지하면 OTA-only release를 차단한다.
5. release metadata에 app version, build number, runtime version, update group, git commit을 함께 기록한다.

`appVersion`만 runtime 기준으로 사용하면 앱 버전 변경 없이 native dependency가 달라지는 경우를 놓칠 수 있다. 반대로 매 commit마다 runtime을 바꾸면 OTA 재사용성이 떨어지므로 native compatibility 변화에 맞춰 관리해야 한다.

### Channel·environment 설계

최소 환경은 다음처럼 분리한다.

| 환경 | 목적 | 게시 권한 | 대상 |
|---|---|---|---|
| `development` | 개발 client와 내부 실험 | 개발자 | 개발 기기 |
| `preview` 또는 `staging` | release candidate·QA·실기기 검증 | CI와 제한된 release 담당자 | 내부 tester |
| `production` | 실제 사용자 배포 | 최소 인원·2인 검토 | 스토어 release 사용자 |

권장 흐름:

```text
commit/tag
  → preview update 게시
  → iOS/Android 실제 release build 설치
  → cold start·재시작·오프라인·핵심 검색 smoke test
  → release 승인
  → 동일 검증 update를 production으로 승격
  → 5% → 25% → 100% rollout
  → 오류율·startup crash·valid result·navigation handoff 감시
```

개발자가 로컬에서 production으로 직접 게시하는 흐름은 긴급 상황을 포함해 기본 경로로 두지 않는다. 긴급 게시도 ticket 또는 release record, 두 번째 검토자와 사후 기록을 남긴다.

### Rollout·rollback·오류 복구

필수 운영 기준:

- production update는 가능하면 `5% → 25% → 100%`로 점진 배포한다.
- 각 단계는 최소 관찰 시간과 startup crash·JS error·핵심 funnel 임계치를 가져야 한다.
- 자동 rollback이 모든 오류를 판별한다고 가정하지 않는다.
- 이전 정상 update를 runtime별 최소 1개 유지한다.
- 잘못된 update가 아직 일부 사용자에게만 배포됐다면 rollout을 즉시 중단한다.
- 이미 받은 사용자에는 검증된 이전 코드 또는 수정 update를 다시 게시할 수 있는 runbook을 둔다.
- update 서버 장애·network timeout·손상된 manifest 상황에서 embedded bundle로 앱이 시작되는지 실기기에서 확인한다.
- startup 직후 필수 migration처럼 되돌리기 어려운 작업은 OTA에서 피하고 backward-compatible하게 설계한다.
- OTA와 서버 API 배포 순서를 조율하고, 최소 한 버전 이전 앱과 서버 호환성을 유지한다.

Rollback은 데이터 schema·server contract까지 자동으로 되돌리는 기능이 아니다. OTA 코드가 비가역적인 로컬 데이터 migration이나 서버 mutation을 수행했다면 bundle rollback만으로 복구되지 않을 수 있다.

### Signing·권한·비밀 관리

- update signing private key는 Git 저장소, 앱 bundle, 일반 CI log에 두지 않는다.
- KMS 또는 접근 통제된 비밀 저장소를 사용하고 복구·교체 절차를 문서화한다.
- production publish token은 최소 권한·짧은 수명 또는 정기 rotation을 적용한다.
- preview publisher와 production promoter 권한을 분리한다.
- production 게시에는 2인 검토와 감사 가능한 release record를 둔다.
- signing certificate 교체 시 기존 설치 앱이 새 update를 검증할 수 있는 rotation 절차를 먼저 검증한다.
- 사용자 기기의 앱에 포함되는 공개 certificate는 비밀이 아니지만 private key는 절대 포함하지 않는다.

EAS의 end-to-end code signing을 사용할 경우 현재 공개 가격표상 Production 또는 Enterprise 요금제가 필요하다. 이는 Store binary signing이나 TLS를 대체하는 기능이 아니라, 게시자가 별도 private key로 OTA update에 서명하고 설치 앱이 내장 certificate로 update를 검증하는 추가 공급망 보안이다.

#### OnMyWay 적용 결정 (2026-08-13)

- **V3 candidate 17과 초기 consumer beta에는 end-to-end update signing을 적용하지 않는다.** Free plan의 일반 EAS Update로 시작하며 `$199/월` Production plan을 release blocker로 두지 않는다.
- 회원·로그인·결제 기능이 생긴다는 사실만으로 유료 EAS plan이나 end-to-end update signing이 필수가 되지는 않는다. 인증·권한·구매 영수증 검증·entitlement는 client bundle을 신뢰하지 않고 서버와 Store webhook을 기준으로 처리해야 하며, 이는 OTA signing과 별개의 보안 경계다.
- 정밀 위치정보 보호도 update signing이 아니라 TLS, 저장 최소화, 로그 redaction, 접근 통제와 보관기간 정책으로 관리한다.
- 미적용 기간에는 Expo account 2FA, 최소 publish 권한, production channel 접근 제한, preview 선검증, runtime 격리, release 기록, staged rollout과 rollback을 필수로 적용한다.
- 다음 조건 중 하나가 생기면 재검토한다: B2B/enterprise 고객의 signed artifact 요구, 규제·감사·보안 계약, EAS 계정이 침해돼도 별도 signing key 없이는 update를 게시하지 못하게 해야 하는 threat model, 대규모 사용자·사업 영향. 회원·결제 기능 존재만으로 자동 승격하지 않는다.
- 나중에 signing을 켜려면 certificate를 native binary에 포함하고 새 runtime을 발급해야 하므로 새 App Store/Play binary가 필요하다. 기존 candidate 17에 넣지 않는 결정은 되돌릴 수 있지만 OTA만으로 signing을 추가할 수는 없다.

유료 signing을 사용하지 않는 대안은 Free/Starter의 일반 EAS Update, 보안 관련 client 변경을 Store binary로만 배포, 또는 Expo Updates Protocol 자체 hosting이다. 자체 hosting은 SaaS 비용 대신 update server·CDN·서명·권한·가용성·rollback 운영을 직접 책임지므로 초기 OnMyWay 기본안으로 삼지 않는다.

### EAS Update 가격과 현재 권장안

> 2026-08-13 [Expo 공식 가격표](https://expo.dev/pricing)와 [billing FAQ](https://docs.expo.dev/billing/faq/) 재확인 기준. 요금과 포함량은 변경될 수 있으므로 결제·출시 직전에 다시 확인한다. 아래 최신 표가 이 장 상단의 2026-08-02 가격 조사보다 우선한다.

| 요금제 | 월 기본료 | 포함 OTA MAU | bandwidth | storage | end-to-end signing | OnMyWay 판단 |
|---|---:|---:|---:|---:|---:|---|
| Free | $0 | 1,000 hard quota | 100 GiB | 20 GiB | 없음 | native 통합, preview·rollback 검증과 초기 beta |
| Starter | $19 + usage | 3,000 포함; 3,001~200,000은 $0.005/MAU | 100 GiB 후 $0.10/GiB | 20 GiB 후 $0.05/GiB | 없음 | Free 한도를 넘는 consumer 운영 |
| Production | $199 + usage | 50,000 포함; 50,001~200,000은 $0.005/MAU | 1 TiB 후 $0.10/GiB | 1 TiB 후 $0.05/GiB | 지원 | 자체 update 서명과 production 운영을 함께 요구할 때 |
| Enterprise | 별도 계약 | 1,000,000 후 종량 | 40 TiB 후 $0.10/GiB | 10 TiB 후 $0.05/GiB | 지원 | 대규모·SLA·조직 compliance 요구가 생길 때 |

Expo의 OTA MAU는 해당 결제 기간에 update를 한 번 이상 다운로드한 고유 설치다. 같은 사용자가 같은 달에 여러 update를 받아도 MAU는 한 번만 계산되지만 bandwidth는 누적된다. update를 받지 않은 Store 설치자는 MAU에 포함되지 않는다.

Free에는 초과 과금이 없고 월 1,000 MAU에서 제한된다. 공식 FAQ는 quota를 소진하면 Starter로 upgrade하도록 안내하며 한도는 다음 달 초에 초기화된다. 1,000명을 넘는 순간 설치 앱 전체가 중단되는 것은 아니다. 이미 설치된 embedded bundle 또는 이전에 받은 정상 update로 앱은 계속 실행되도록 구성한다. 다만 quota 이후 어떤 설치가 update를 받는지에 대한 deterministic 순서는 공식 계약에 없으므로, 1,000명을 초과할 가능성이 있으면 일부 사용자의 update 전달을 기대하지 말고 게시 전 Starter로 올린다.

비용 예시(대역폭·세금 제외): Starter에서 10,000 OTA MAU는 `$19 + 7,000 × $0.005 = $54/월`, 50,000 OTA MAU는 `$19 + 47,000 × $0.005 = $254/월`이다. 같은 50,000 MAU는 Production의 포함량 안이라 `$199/월`이므로 약 39,000 OTA MAU부터는 bandwidth 차이를 제외해도 Production이 더 저렴해질 수 있다.

#### 현재 비용 결정

1. **지금은 Free `$0/월`로 시작한다.** Expo project는 생성됐지만 로컬 EAS CLI가 로그인되지 않아 아직 연결되지 않았다.
2. **EAS Build는 당장 구매하지 않는다.** 기존 Gradle/Xcode build와 Store signing을 유지하고 EAS Update만 standalone으로 사용한다.
3. **OTA 대상이 1,000 MAU를 넘기 전에 Starter `$19/월`으로 올린다.** Free는 hard quota이고 Starter부터 초과 MAU 종량 과금이 가능하다.
4. **자체 end-to-end update signing이 별도 보안 요구로 확정될 때만 Production을 선택한다.** 회원·결제 기능 존재만으로 `$199/월`을 지불하지 않는다.
5. **사용량이 약 39,000 OTA MAU에 접근하면 Starter 종량 총액과 Production 포함량을 다시 비교한다.**

최소 월 비용 시나리오는 `Free $0`, 소규모 beta는 `Starter $19 + 초과 사용량`, 자체 end-to-end signing을 적용한 production 기준선은 `Production $199 + 초과 사용량`이다. 환율·세금, Apple/Google 개발자 계정, Google Maps API, Railway, 오류 모니터링, KMS/CI 비용은 별도다.

MAU와 bandwidth를 따로 봐야 한다. 앱 bundle·asset 크기, 월 update 횟수, 재다운로드율이 bandwidth 원가를 결정한다. 큰 이미지나 폰트를 자주 OTA에 포함하면 사용자 수가 작아도 전송량이 커질 수 있다.

출시 예산은 다음을 분리한다.

```text
OTA plan 기본료와 초과 MAU/대역폭/저장공간
+ 선택적 EAS Build 또는 기존 local build 운영 비용
+ App Store/Google Play 계정 비용
+ Google Maps API와 production backend 비용
+ 오류 모니터링·로그 비용
+ signing key/KMS·CI 운영 비용
```

### 스토어 정책 경계

OTA는 스토어 심사를 우회하는 기능으로 운영하지 않는다.

- Apple: 앱 심사 당시의 핵심 목적·기능을 바꾸거나 임의 실행 코드를 내려받는 방식으로 사용하지 않는다. JS/assets hotfix도 최신 App Review Guidelines를 release checklist에서 확인한다.
- Google Play: Play 외부에서 앱 자체나 native executable code를 교체·갱신하지 않는다. OTA는 설치된 native runtime과 호환되는 JS/assets 수정으로 제한하고, 정책 위반 가능성이 있는 큰 기능은 새 Play build로 제출한다.
- 개인정보 수집, 결제, 위치 권한, 계정 기능 등 심사에 중요한 동작이 달라지면 JS로 구현 가능해 보여도 스토어 새 버전과 정책 검토를 우선한다.
- OTA release note와 변경 이력을 보존해 어떤 사용자가 어떤 runtime/update를 받았는지 추적 가능하게 한다.

이는 법률 자문이 아니라 기술·release 운영 원칙이다. 출시 시점의 국가별 규정과 최신 스토어 정책을 별도로 검토한다.

### CI/CD는 store release와 OTA publication을 분리

두 pipeline은 산출물과 실패 영향이 다르다.

#### Store release pipeline

- native source·dependency·권한 변경 검증
- iOS/Android 서명 build
- runtimeVersion과 embedded bundle 생성
- App Store Connect·Google Play 제출
- 스토어 단계적 출시와 binary rollback 전략

#### OTA publication pipeline

- JS/TS lint·typecheck·targeted test
- native compatibility 변경 없음 검증
- preview update 게시
- release build smoke test
- production 승인·promotion
- 점진 rollout·관측·중단·rollback

두 pipeline 모두 동일한 commit과 release metadata를 사용해야 한다. `어떤 binary가 어떤 update를 받을 수 있는가`를 대시보드나 runbook에서 즉시 확인할 수 있어야 한다.

### 첫 프로덕션 출시 acceptance gate

다음 항목을 모두 통과하기 전에는 첫 production 바이너리를 제출하지 않는다.

- [ ] 기존 CodePush/App Center package·wrapper·native 설정·키 제거
- [ ] iOS/Android release build에 `expo-updates`와 올바른 production channel 포함
- [ ] update URL, project ID, runtimeVersion, embedded bundle 확인
- [ ] development·preview·production 분리 및 production 게시 권한 최소화
- [ ] preview OTA 설치·cold start·재시작·오프라인·핵심 검색 smoke test 통과
- [ ] production staged rollout 설정 또는 수동 단계별 runbook 준비
- [ ] iOS/Android에서 rollback과 embedded bundle error recovery 리허설 통과
- [ ] update signing, private key 보관·복구·rotation 절차 확인
- [ ] native 변경이 OTA-only pipeline을 통과하지 못하도록 CI gate 적용
- [ ] Apple/Google 최신 정책 검토 기록
- [ ] release owner, 긴급 중단·rollback 담당자와 사용자 공지 기준 지정

### 최종 판단

- **가능한가:** 가능하다. EAS Update는 기존 bare React Native 프로젝트에 통합할 수 있다.
- **언제 해야 하는가:** RN 0.86 새 템플릿과 native 설정을 구성하는 Phase 3에 넣고, 첫 production store build 전에 끝낸다.
- **무엇을 복원하지 않는가:** 종료된 Microsoft App Center CodePush와 기존 키·wrapper를 복원하지 않는다.
- **기본안:** EAS Update + `expo-updates`, runtime fingerprint, 환경별 channel, staged rollout, rollback rehearsal.
- **출시 차단 조건:** 실제 release build에서 preview→production OTA와 rollback을 검증하지 못하면 출시하지 않는다.
- **운영 원칙:** OTA는 CI/CD의 부가 기능이 아니라 production release pipeline의 일부다.

### 공식 출처

- [Microsoft App Center retirement](https://learn.microsoft.com/en-us/appcenter/retirement)
- [EAS Update: CodePush에서 마이그레이션](https://docs.expo.dev/eas-update/codepush/)
- [기존 React Native 앱에 EAS Update 통합](https://docs.expo.dev/eas-update/integration-in-existing-native-apps/)
- [EAS Update runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [EAS Update code signing](https://docs.expo.dev/eas-update/code-signing/)
- [Expo 자체 update 서버](https://docs.expo.dev/distribution/custom-updates-server/)
- [EAS pricing](https://expo.dev/pricing)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Device and Network Abuse 정책](https://support.google.com/googleplay/android-developer/answer/16559646?hl=en)

*웹 출처 내용은 라이선스 준수를 위해 장문 인용 없이 요약·재서술했다.*
## 21. Pain Point·자연어 검색·글로벌 여행 채널 전략

> 작성 기준: 2026-08-02. 채널 유행을 따라가기보다 OnMyWay의 전후 차이를 가장 짧게 증명하고, 실제 route activation과 반복 사용으로 이어지는 채널을 선택한다. 자연어 검색·Google 기반 글로벌 기능은 실제 구현과 시장별 품질 검증이 완료된 범위만 광고한다.

### 핵심 결론

OnMyWay의 pain point는 글보다 영상으로 이해하기 쉽다.

```text
기존 지도
지도 이동 → 검색 → 다른 지점 이동 → 재검색 → 결과 기억 → 경유시간 재확인

OnMyWay
경로 선택 → 한 문장 검색 → 전체 경로 후보와 +시간 비교
```

따라서 채널 우선순위는 다음과 같다.

1. **Reels·TikTok·YouTube Shorts:** 전후 차이를 직접 보여주는 주 acquisition creative
2. **Reddit·네이버 카페·Facebook Group 등 niche community:** 문제 검증·beta 모집·고의도 사용자 확보
3. **여행·가족·반려동물·road-trip micro creator:** 실제 여행 시나리오와 신뢰 확보
4. **검색·ASO·웹 route preview:** 이미 문제를 검색하는 사용자의 intent 포착
5. **Threads·X·LinkedIn:** founder story, build-in-public, 파트너·초기 팬 확보
6. **정적 SNS post/carousel:** 핵심 개념 설명과 저장·공유 보조

한 채널에 모든 메시지를 넣지 않는다. `경로 검색`, `한 문장 검색`, `해외 road trip`을 별도 creative로 제작하고 성과를 비교한다.

### 채널별 역할

| 채널 | 가장 잘하는 역할 | 적합한 콘텐츠 | 주의점 |
|---|---|---|---|
| Instagram Reels | 한국·글로벌 visual discovery | 10~20초 전후 demo, 가족·여행 사례 | 예쁜 여행 영상보다 제품 차이가 먼저 보여야 함 |
| TikTok | 빠른 creative test·UGC | `지도에서 5번 검색 vs 한 문장` challenge | 조회수와 실제 activation을 구분 |
| YouTube Shorts | 검색 노출·재활용 | Reels/TikTok 우수 영상을 재편집 | 채널별 CTA와 설명을 별도 최적화 |
| Reddit | 영어권 고의도 niche feedback | 실제 문제 서술, route 사례 요청, beta | 링크 홍보보다 커뮤니티 기여 우선 |
| 네이버 카페·국내 커뮤니티 | 한국 persona 집중 검증 | 명절·아이·반려동물·캠핑 경로 사례 | 운영 규칙과 광고 표기 준수 |
| Facebook Groups | family·pet·RV·지역 road trip | 실제 route 해결, 공동 beta | 반복 링크 게시 금지 |
| Threads/X | founder-led narrative | 왜 만들었는지, 개발 과정, 사용자 사례 | 소비자 install의 주 채널로 과대평가하지 않음 |
| Instagram carousel | 개념 교육·저장 | 기존 7단계 vs OnMyWay 2단계 | 영상보다 보조 수단 |
| Search/ASO | 명확한 문제 의도 포착 | `stops along my route`, `가는 길 카페` | 출시 전 keyword volume 검증 |
| Creator | 신뢰·실제 사용 맥락 | 여행 하나를 OnMyWay로 계획·실행 | follower보다 activated user로 평가 |

### 1순위: Short-form video

이 제품은 정적인 설명보다 실제 조작을 보여줘야 한다.

#### Creative A — 핵심 pain point

```text
Hook
“가는 길에 카페 찾으려고 지도를 계속 옮겨본 적 있나요?”

기존 방식
중간 지점 이동 → 검색 → 결과 없음 → 다시 이동 → 재검색

OnMyWay
서울→강릉 경로 + `주차 가능한 카페`
→ A +4분 / B +11분 / C +18분

End card
“주변 검색 말고, 경로 검색.”
```

#### Creative B — 자연어 검색

```text
Hook
“필터를 하나씩 누르지 말고, 원하는 걸 그대로 말하세요.”

입력
“아이랑 부산 가는 길에
지금 열려 있고 주차 편한 식당,
10분 이상 돌아가지 않는 곳”

결과
조건이 구조화되고 경로상 후보가 +시간과 함께 표시

End card
“한 문장으로, 가는 길에 맞는 한 곳.”
```

사용자에게 `LLM 검색`이라고 말하지 않는다. `한 문장 검색`, `AI Route Assistant`, `조건을 한 번에`처럼 결과 중심으로 표현한다.

#### Creative C — 글로벌·해외 road trip

```text
Hook
“해외 렌터카 여행에서 길도 모르는데,
가는 길 카페를 어디서 검색해야 할까요?”

입력
“LAX에서 Joshua Tree 가는 길에
open now, parking 있고
10분 이상 우회하지 않는 coffee shop”

결과
영어 장소·주소·miles·추가시간 표시

End card
“Search your route, wherever the trip takes you.”
```

`전 세계 어디서나 정확하다`고 표현하지 않는다. Google Places·Routes 품질과 필수 필드가 검증된 국가·corridor부터 캠페인을 실행한다.

#### Creative D — 여행계획 확장 teaser

```text
“숙소 가는 길에 장보기와 저녁 식사를 넣으면?”

숙소 체크인 시간 + 경로 + 조건
→ 가능한 방문 순서와 추가시간
```

실제 기능 출시 전에는 `coming soon`·waitlist로 명확히 표시한다.

### 하나의 영상에 모든 기능을 넣지 않는 이유

다음 메시지를 한 영상에 동시에 넣으면 기억에 남지 않는다.

- 경로 주변 검색
- 자연어 LLM
- Google Maps
- 글로벌 여행
- 여행계획
- 주차·영업시간
- 멤버십

각 creative는 한 가지 약속만 갖는다.

```text
Pain creative
  반복 검색 제거

Natural-language creative
  여러 조건을 한 문장으로

Global creative
  낯선 해외 경로에서도 같은 방식

Trip creative
  한 장소가 아니라 하루 동선
```

광고에서 Google Maps는 기술 신뢰의 보조 근거이지 메인 가치가 아니다. Google 브랜드·지도 데이터를 표시할 때는 최신 attribution·브랜드 정책을 준수한다.

### Reddit·커뮤니티 접근법

Reddit은 바로 install을 요구하는 채널이 아니라 문제를 검증하고 고의도 사용자를 모집하는 채널로 사용한다.

좋은 게시물 구조:

```text
1. 실제 경험
“I kept moving the map and repeating the same search on a road trip.”

2. 구체적인 손실
“I still couldn't tell which result would add 5 minutes versus 25.”

3. 만든 해결책
“I built a route-based search that ranks stops by detour.”

4. 질문
“How do you solve this today, and which route should I test?”

5. 선택적 beta
실제로 문제를 경험한 사용자에게만 링크 제공
```

피해야 할 방식:

- 여러 subreddit에 같은 링크 복사
- 제목부터 앱 홍보
- 커뮤니티와 무관한 범용 소개
- 가짜 사용자 후기
- subreddit 규칙을 확인하지 않은 self-promotion

국내 커뮤니티도 같은 원칙을 적용한다. 먼저 사용자가 최근 겪은 경로를 받고, 그 경로를 OnMyWay로 해결한 결과를 댓글이나 후속 게시물로 보여준다.

### Threads·X의 역할

Threads는 제품 사용 시연보다 founder story와 build-in-public에 적합하다.

콘텐츠 예시:

- `이 앱을 만든 이유`: 반복 검색 경험
- 이번 주 실제 사용자 경로와 개선 전후
- `+거리`가 아니라 `+시간`을 보여주는 이유
- 한국과 미국의 같은 검색 결과 차이
- 주차정보가 `UNKNOWN`일 때 false로 표시하지 않는 이유
- 사용자 인터뷰에서 발견한 예상 밖의 문제

목표는 대량 install보다 다음이다.

- 초기 팬
- beta interview
- creator 연결
- 여행·렌터카 파트너
- 개발·제품 피드백

### Instagram carousel·정적 post

영상의 보조 콘텐츠로 사용한다.

권장 6장:

```text
1. 가는 길에 카페 찾으려고 지도를 몇 번 옮기나요?
2. 기존 지도는 특정 지점 주변을 검색합니다.
3. 그래서 중간 지점을 추측하고 같은 검색을 반복합니다.
4. 그래도 실제 경유시간은 비교하기 어렵습니다.
5. OnMyWay는 전체 경로를 검색하고 +시간으로 비교합니다.
6. 주변 검색 말고, 경로 검색. [경로 demo]
```

저장·공유 가능한 문제 설명 콘텐츠이며, 설치 CTA보다 web route demo를 우선 연결한다.

### 글로벌 마케팅은 국가가 아니라 시나리오로 시작

`Global travel app`처럼 넓게 광고하지 않는다. 하나의 국가·corridor·persona를 선택한다.

후보 campaign:

- US family road trip: LA → Joshua Tree
- US/Canada pet-friendly road trip
- Australia rental-car coastal route
- New Zealand camper trip
- 한국인의 미국 렌터카 여행
- 외국인의 한국 렌터카·제주 여행

각 campaign에서 현지 표현을 사용한다.

```text
한국
주차 가능 · 영업 중 · 10분 이내 우회

미국
parking · open now · under 10 min detour · miles

RV
RV-friendly parking · vehicle restrictions · campground
```

번역한 광고 한 개를 여러 국가에 배포하지 않는다. 검색 예문·단위·주차 의미·내비게이션 target·스토어 screenshot을 현지화한다.

### 자연어 검색의 마케팅 원칙

자연어 기능을 과장하지 않는다.

좋은 표현:

- `원하는 조건을 한 문장으로`
- `영업 중, 주차, 최대 우회시간을 한 번에`
- `조건을 이해하고 경로에서 찾기`
- `No filters. Just say what you need.`

피해야 할 표현:

- `무엇이든 이해하는 AI`
- `완벽한 장소를 보장`
- `전 세계 모든 장소 검색`
- `AI가 알아서 최적의 여행을 완성`

구조화 필드로 검증되지 않는 `조용한`, `아이에게 완벽한` 같은 조건은 확정 사실처럼 표시하지 않는다. 결과가 없을 때 조건을 완화했다면 무엇을 완화했는지 설명한다.

### 앱 설치로 이어지는 funnel

SNS에서 바로 App Store로 보내는 것보다 route preview를 중간에 둔다.

```text
Short video / community / creator
→ 같은 시나리오의 web route preview
→ 사용자가 출발지·목적지·문장 입력
→ 상위 결과 일부와 +시간 확인
→ “앱에서 전체 결과 보기”
→ store
→ 설치 후 기존 route/query 복원
→ first valid result
→ navigation handoff
→ 저장·공유·회원 전환
```

채널별 campaign link에 다음을 포함한다.

- market
- persona
- creative ID
- creator/community source
- route template
- query template

설치 수만 보면 어떤 pain point가 전환을 만들었는지 알 수 없다.

### CTA 후보

Pain point:

- `내 경로에서 찾아보기`
- `+몇 분인지 확인하기`
- `반복 검색 없이 찾기`

자연어:

- `원하는 조건을 말해보기`
- `한 문장으로 경유지 찾기`

글로벌:

- `Try this road trip route`
- `Find a stop along your route`
- `See the detour before you go`

`앱 다운로드`는 행동의 기술적 단계일 뿐 사용자가 원하는 결과가 아니므로 메인 CTA로 사용하지 않는다.

### Micro creator 전략

대형 travel influencer보다 상황이 명확한 creator를 우선한다.

- 아이와 여행
- 반려동물 동반 여행
- 해외 렌터카
- 캠핑·RV
- 장거리 road trip
- 제주 여행

실험 방식:

1. creator가 실제 예정 경로 하나를 제공한다.
2. OnMyWay로 기존 방식과 결과를 비교한다.
3. creator가 자신의 말로 pain point를 설명한다.
4. follower는 동일 route template를 web에서 연다.
5. follower용 Trip Pass 또는 Plus trial을 제공한다.
6. 조회수가 아니라 activation·navigation handoff·D30·paid를 측정한다.

스크립트를 그대로 읽게 하기보다 creator가 실제로 불편을 느낀 경로만 콘텐츠로 만든다.

### 첫 30일 채널 실험

#### 1주차: creative 제작

- Pain point 영상 3개
- 자연어 검색 영상 3개
- 글로벌 road-trip 영상 3개
- 각 영상의 첫 2초 hook만 다르게 한 variation
- 한국어·영어 landing/route preview

#### 2주차: organic 배포

- Reels·TikTok·Shorts 동시 테스트
- 한국 커뮤니티 1~2곳에서 route 사례 모집
- 영어권 Reddit/Facebook niche 1~2곳에서 문제 인터뷰
- Threads에서 founder story 연재

#### 3주차: creator test

- micro creator 5~10명
- 각자 실제 경로 한 개
- route template·referral link 제공
- creator별 first valid result와 D7 측정

#### 4주차: 승자만 확대

- 3초 유지율이 아니라 route preview·activation이 높은 creative 선정
- 승자 creative에만 소액 paid budget
- retention이 낮은 persona는 광고를 늘리지 않음
- 자연어·global creative의 cohort를 core pain creative와 분리 비교

### 채널 평가 지표

#### 콘텐츠 지표

- 2초·3초 hold
- 영상 완료율
- 저장·공유
- profile/landing click

#### acquisition 지표

- landing → route 입력
- route preview → store view
- store view → install
- install → first valid result
- time to first value

#### 제품 지표

- 결과 선택
- navigation handoff
- 경로 저장·공유
- guest → member
- D7/D30 반복 사용
- Plus/Trip Pass 전환
- 검색·회원당 API 원가

조회수가 낮아도 `first valid result`와 D30이 높은 채널이 더 좋은 채널이다.

### 안전·신뢰 고려

- 운전자가 주행 중 휴대전화를 조작하는 creative를 사용하지 않는다.
- 출발 전, 안전한 정차 상태, 동승자 사용으로 연출한다.
- 자연어 결과가 구조화 필드로 검증됐는지 구분한다.
- 해외 campaign은 실제 국가별 Places·Routes·주차·영업정보 품질 gate 통과 후 진행한다.
- 예상 추가시간은 교통·경로 조건에 따라 변할 수 있음을 UI에서 표현한다.
- Google 지도·장소 attribution과 브랜드 정책을 준수한다.

### 최종 권장 채널 조합

```text
Main acquisition
  Reels + TikTok + Shorts의 실제 before/after demo

High-intent validation
  Reddit + 국내 niche community + Facebook Groups

Trust/distribution
  family/pet/road-trip micro creator

Founder/partner channel
  Threads + X + LinkedIn

Conversion layer
  web route preview + deep link + localized store page

Paid growth
  organic winner creative와 retention 통과 cohort만 확대
```

초기 대표 메시지는 계속 `주변 검색 말고, 경로 검색`으로 유지한다. 자연어 검색은 `한 문장으로 조건 입력`, 글로벌은 `낯선 해외 경로에서도 같은 방식`이라는 두 번째·세 번째 creative로 확장한다.


## 22. 국내·Google 지도 공급자 비교와 확장 후보 기록

> 작성 기준: 2026-08-04. 이 장의 공급자 비교와 adapter 격리 원칙은 유효하지만, `AUTO/KAKAO/GOOGLE`을 첫 버전부터 모두 구현하는 계획은 보류했다. **2026-08-05 최종 실행 기준은 23장이다: Google을 먼저 구현하고 provider-neutral 포트만 선반영한다.** Kakao와 TMAP은 Google의 한국 품질이 부족하거나 사업상 필요할 때 추가하는 후속 adapter 후보다.

### 비교에서 유지할 확장 원칙

- 첫 버전은 한국과 글로벌 모두 Google 하나로 시작한다.
- 앱의 제품 기능은 provider SDK와 분리된 공통 `SearchIntent`·도메인 모델·use case로 구현한다.
- `AUTO`, `KAKAO`, `GOOGLE` 선택권은 두 번째 adapter가 준비된 뒤 활성화할 후속 후보로 남긴다.
- 후속 `AUTO` 정책은 Kakao·Google·TMAP 실측 gate를 통과한 결과로 정하고 원격 feature flag로 변경 가능하게 한다.
- Google은 상세 필드와 자연어·경로 검색 기능이 풍부하지만 국내 POI coverage·현지 상호·주차·영업시간 fill rate를 계속 측정한다.
- Kakao는 후속 국내 POI adapter 후보로 유지하되 공개 API가 제공하지 않는 영업시간·사진·평점·리뷰를 제공한다고 표현하지 않는다.
- 기존 Kakao 웹 내부 endpoint 호출은 별도 `LegacyKakaoWebEnricher`로 격리할 수 있지만, 2026-08-04 실측에서 활성 장소 ID에도 404를 반환했으므로 production 기본 경로와 필수 데이터 공급원으로 사용하지 않는다.
- TMAP `findPoiRoute`는 공식 polyline 경로 반경 검색이 실제 동작했으므로 후속 한국 경로 검색 adapter 후보로 유지한다.

### 지도 SDK·검색 API·소비자 앱의 구분

`네이버지도 SDK`, `Kakao Maps SDK`, `Google Maps SDK`는 주로 지도 타일·마커·polyline·카메라를 표시한다. 소비자 지도 앱 화면에 보이는 사진·평점·리뷰·영업시간이 SDK나 공개 검색 API에 포함된다는 뜻은 아니다.

```text
Map renderer
  지도 타일, 마커, polyline, 카메라, 사용자 위치

Place/route APIs
  검색, 좌표, 경로, POI 상세, 경로상 후보

Consumer place page
  공급자 앱·웹에서 보여주는 사진, 리뷰, 소식, 메뉴 등
  ≠ 공개 API 계약
```

제품 설계와 비교표에서 이 세 층을 항상 분리한다.

### 기능 비교표

| 기능 | NAVER Maps·지역검색 | Kakao Local·Mobility | TMAP API | Google Places·Routes |
|---|---|---|---|---|
| 모바일 지도 SDK | 지원 | 지원 | 지원 | 지원 |
| 자유 문자열 입력 | 지역 검색 `query` | Local `query` | POI `searchKeyword` | Places `textQuery` |
| 자유문장 의미 이해 | 낮음. 키워드 검색 중심 | 낮음. 지역어 일부 분석, 임의 속성 문장 보장 없음 | 낮음. 명칭·업종·주소·전화 중심 | 상대적으로 높음. 다국어 text search와 구조화 필드 결합 |
| 다국어 별칭·오탈자 | 보장 없음 | 보장 없음 | 보장 없음 | 상대적으로 강하지만 한국 품질 실측 필요 |
| 중심 좌표·반경 검색 | 지역검색 API에는 없음 | `x`, `y`, 최대 20km `radius` | 중심 좌표, 1~33km 반경 및 전국 검색 | Nearby location restriction, Text Search bias/restriction |
| 사각 지도 영역 검색 | 없음 | `rect` 지원 | 별도 공간·주변 검색 기능 | location restriction/bias |
| 공식 polyline 경로 검색 | 없음 | 없음 | `findPoiRoute` 지원 | Search Along Route 지원 |
| corridor 폭·방향 제어 | 없음 | 앱에서 여러 원으로 근사 | `scoreradius`, `all/right` 지원 | 명시적 폭 지정 불가, 최소 우회시간 기반 bias |
| 검색 결과 수 | 지역검색 최대 5개 | 페이지당 최대 15개, 노출 가능 최대 45개 | 통합/주변 검색은 요청 count 지원, endpoint별 한도 확인 필요 | 페이지당 최대 20개, 전체 최대 60개 |
| 장소 ID | 공개 지역검색 응답에 전용 Place ID 없음 | `id` | `id`, `pkey` | Place resource name·Place ID |
| 기본 상세 | 이름, 카테고리, 설명, 주소, 좌표, 링크 | 이름, 카테고리, 전화, 주소, 좌표, 거리, 장소 URL | 전화, 주소, 카테고리, 입구점, 설명, 일부 메뉴·시설 | 전화, 주소, 웹사이트, 가격대, 접근성·예약 등 FieldMask 기반 |
| 영업시간 | 제공 안 함 | 공개 Local API에서 제공 안 함 | `additionalInfo`·`useTime`에 일부 존재하나 fill rate 낮음 | `currentOpeningHours`, `regularOpeningHours` |
| 현재 영업 여부 | 제공 안 함 | 공개 Local API에서 제공 안 함 | 일반 POI 상세에서 일관된 필드 확인 안 됨 | `openNow`, `businessStatus`, current hours |
| 주차 | 제공 안 함 | 공개 Local API에서 제공 안 함 | 경로 POI의 `parkYn`과 일부 주차 필드, 상세 `parkFlag` | `parkingOptions` 세부 필드, 한국 fill rate 검증 필요 |
| 사진 | 제공 안 함 | 공개 Local API에서 제공 안 함 | 테스트한 일반 POI 상세에 사진 필드 없음 | Place Photos 별도 호출·과금 |
| 별점·평가 수 | 제공 안 함 | 제공 안 함 | 일반 POI 상세에 공개 평점·리뷰 필드 확인 안 됨 | `rating`, `userRatingCount` |
| 리뷰 원문 | 제공 안 함 | 제공 안 함 | 제공 안 함 | 장소당 대표 리뷰 최대 5개 |
| 리뷰 수 기반 기능 | `sort=comment` 가능하지만 count 값은 미제공 | 없음 | 방문 수를 대체 신호로 사용할 수 있으나 리뷰 수는 아님 | 평점·평가 수 필터·앱 측 ranking 가능 |
| 경유 추가시간 | Directions와 후보를 앱에서 결합해야 함 | Kakao Mobility 후보별 재계산 | Routes에 후보 waypoint를 넣어 재계산 | `routingSummaries` 또는 Routes waypoint |
| 공급자 원문 상세 연결 | 네이버 링크 | `place_url` | POI·TMAP 연결 정책 확인 | `googleMapsUri` |
| 상세 데이터 비용 | 별도 상품·쿼터 확인 | Kakao Developers/Mobility 계약 확인 | 상품별 쿼터·계약 확인 | FieldMask에 따라 Pro·Enterprise·Atmosphere SKU |
| OnMyWay 적합성 | 지도 UI·주소·경로 보조 | 국내 기본 POI와 Kakao mode 후보 | 한국 경로·경로상 검색의 강한 후보 | 글로벌 기본 및 풍부한 상세의 강한 후보 |

### 실측 결과 스냅샷

#### TMAP live API

저장소의 기존 TMAP 자격 증명으로 읽기 전용 테스트를 수행했으며 값은 출력하지 않았다. 이 키는 클라이언트 소스에 하드코딩돼 있으므로 폐기하고 서버 전용 키로 재발급해야 한다.

| 테스트 | 결과 |
|---|---|
| 통합 POI `맥도날드 dt` | HTTP 200, DT 매장 5개 |
| 통합 POI `리뷰 좋은 간장게장집` | HTTP 204 |
| 통합 POI `주차 가능한 카페` | HTTP 204 |
| 통합 POI `McDonalds drive through` | HTTP 204 |
| 경로 POI `카페` | HTTP 200, 요청한 10~20개 반환 |
| 경로 POI `맥도날드 dt`·복합 자연어 | HTTP 204 |
| 자동차 경로 → `findPoiRoute` → 후보 경유 재계산 | 모두 HTTP 200 |

TMAP은 `맥도날드 dt`처럼 데이터 명칭과 맞는 조합은 검색할 수 있지만, `리뷰 좋은`, `주차 가능한` 같은 자연어 조건을 구조적으로 해석하지 않는다. `카페`처럼 핵심 검색어만 보내고 주차·방문 신호를 별도 필터로 적용해야 한다.

서울시청→강남역에서 동일한 최소시간 경로 옵션을 사용한 테스트:

```text
기본 경로: 47.7분
후보 1 경유: +14.0분
후보 2 경유: +20.1분
후보 3 경유: +6.5분
```

추천 경로 옵션을 섞은 초기 테스트에서는 경유 경로가 다른 대안을 선택해 음수 차이가 나타났다. 실제 `+N분`은 동일한 최소시간/교통 시각/유료도로/차종 조건으로 기본·경유 경로를 계산해야 한다.

TMAP 데이터 fill rate 표본:

| 표본 | 결과 |
|---|---:|
| 카페 상세 10개 중 영업시간 포함 | 2/10 |
| 카페 상세 10개 중 `parkFlag` 값 존재 | 0/10 |
| 카페 상세 10개 중 홈페이지 존재 | 3/10 |
| 카페 상세의 사진 필드 | 0/10 |
| 카페 상세의 평점·리뷰 필드 | 0/10 |
| 경로 카페 20개 중 `parkYn=Y` | 6/20 |
| 경로 카페 20개 중 구체적 주차 대수 | 0/20 |

경로 POI의 `parkYn`은 활용 가능성이 있지만 상세 endpoint의 동일 필드와 충족률이 일관되지 않았다. 공급자별 필드명 존재와 실제 값 존재를 구분해 측정한다.

#### Kakao 공식 API와 기존 웹 내부 호출

현재 저장소의 Kakao REST 키는 placeholder이므로 공식 Local live 검색은 실행하지 못했다. 공식 문서와 현재 코드를 기준으로 Kakao Local의 ID·전화·카테고리·거리·`place_url` 필드를 확인했으며, 현재 백엔드는 이 중 상당수를 버리고 있다.

기존 앱이 사용한 다음 웹 내부 endpoint를 활성 Kakao 장소 ID 여러 개로 호출했다.

```text
/place.map.kakao.com/main/v/{placeId}          → HTTP 404
/place.map.kakao.com/{placeId}                 → HTTP 200 HTML
```

일반 장소 페이지에는 영업시간·사진·시설·메뉴·블로그 리뷰 등이 렌더링됐지만 이는 공개 API 응답이 아니다. 따라서 Kakao mode의 계약은 다음처럼 정의한다.

```text
공식 Kakao Local·Mobility 응답     → 구조화 데이터로 사용
공식 place_url                     → WebView/외부 상세 페이지 연결
LegacyKakaoWebEnricher             → production 기본 OFF, 실패 허용 실험 adapter
영업시간·사진·평점·리뷰 미확인     → UNKNOWN
```

#### Google

Google은 기존 12장 조사대로 Search Along Route, routing summary, 영업시간, 주차, 사진, 평점, 평가 수와 제한된 대표 리뷰를 공식 API로 제공한다. 그러나 필드의 존재가 한국 장소에서의 높은 충족률을 보장하지 않으므로 다음을 live PoC에서 측정해야 한다.

- 한국어·영어·브랜드 별칭 검색 precision
- 서울·수도권·지방·고속도로 POI recall
- `parkingOptions`, current/regular opening hours fill rate
- 현지 상호·주소·입구점 정확도
- Kakao/TMAP 대비 경로 시간과 진입점 차이
- FieldMask별 세션 원가

### 자연어 검색은 provider 밖에서 구현

사용자 문장을 공급자 API에 그대로 전달하는 것만으로 동일한 동작을 만들 수 없다.

```text
입력
  "가는 길에 리뷰 좋고 주차 가능한 간장게장집"

SearchIntent
  coreQuery: "간장게장"
  scope: ALONG_ROUTE
  hardFilters: [PARKING]
  softPreferences: [HIGH_REVIEW_CONFIDENCE]
  maxDetourMinutes: 사용자 설정
  locale: ko-KR
```

Provider compiler:

| provider | 검색 실행 |
|---|---|
| Kakao | 핵심어로 Local corridor 근사 → 공식 필드와 별도 검증 데이터로 필터 → 상위 후보 Kakao Mobility 재계산 |
| TMAP | 핵심어로 `findPoiRoute` → `parkYn` 필터 → 방문 신호 임시 ranking → 상위 후보 Routes 재계산 |
| Google | Text Search Search Along Route → `parkingOptions`, rating, count, routing summary 적용 |

`리뷰 좋은`을 TMAP 방문 수나 provider score로 대체할 수는 있지만 이를 실제 리뷰 평점으로 표시하지 않는다. 공급자가 지원하지 않는 조건은 `UNSUPPORTED`, 장소에 값이 없는 경우는 `UNKNOWN`, 검증된 값만 `KNOWN`으로 반환한다.

### 후속 확장 시 사용자 선택 모델

```text
AUTO
  market·coverage·건강상태·비용 정책으로 provider 선택
  provider를 결과 화면에 표시
  장애 fallback 시 사용자에게 공급자 변경을 알림

KAKAO
  Kakao Mobility + Kakao Local
  경로상 검색은 개선된 corridor 근사
  풍부한 상세는 공식 place_url 연결
  LegacyKakaoWebEnricher는 선택 계약에 포함하지 않음

GOOGLE
  Google Routes + Places
  Search Along Route와 공식 상세 필드 사용
  FieldMask·페이지·사진 호출에 따른 비용 표시·제어

TMAP_EXPERIMENTAL
  TMAP Routes + findPoiRoute + POI Detail
  한국 경로 품질·주차 신호가 gate를 통과하면 AUTO 내부 후보 또는 향후 사용자 옵션으로 승격
```

사용자가 `KAKAO`를 선택했는데 일부 필드가 없다는 이유로 Google 데이터를 조용히 섞지 않는다. 혼합 enrichment가 필요하면 별도의 `HYBRID` 정책으로 명시하고 출처·attribution·비용·라이선스를 검토한다.

### Provider-neutral 도메인 계약

권장 interface 예시:

```ts
type ProviderId = 'KAKAO' | 'GOOGLE' | 'TMAP';
type ProviderMode = 'AUTO' | 'MANUAL';
type FieldState = 'KNOWN' | 'UNKNOWN' | 'UNSUPPORTED';

interface ProviderContext {
  mode: ProviderMode;
  provider?: ProviderId;
  market: 'KR' | 'GLOBAL_EN';
  locale: string;
  units: 'METRIC' | 'IMPERIAL';
}

interface PlaceField<T> {
  state: FieldState;
  value?: T;
  source: ProviderId;
  observedAt: string;
}

interface PlaceSearchProvider {
  search(intent: SearchIntent, context: ProviderContext): Promise<PlaceCandidate[]>;
}

interface RoutePlaceSearchProvider {
  searchAlongRoute(
    route: NormalizedRoute,
    intent: SearchIntent,
    context: ProviderContext,
  ): Promise<PlaceCandidate[]>;
}
```

추가 원칙:

- 내부 place key는 provider ID와 분리하고 원본 `(provider, providerPlaceId)`를 보존한다.
- Google Place ID, Kakao ID, TMAP ID를 서로 같은 ID namespace로 취급하지 않는다.
- provider 전환 시 기존 route와 후보를 재사용하지 않고 새 provider에서 다시 계산한다.
- cache key에 provider, locale, region, query, route fingerprint, field mask를 포함한다.
- UI는 `KNOWN/UNKNOWN/UNSUPPORTED`를 구분하고 누락값을 `false`로 바꾸지 않는다.
- 결과 카드와 상세 화면에 데이터 출처와 필수 attribution을 표시한다.
- analytics와 API 원가를 provider·market·FieldMask·검색 유형별로 분리한다.

### Map renderer 분리

장소·경로 provider와 화면 renderer를 코드 수준에서 분리한다.

```text
MapRenderer
  GoogleMapRenderer
  KakaoMapRenderer
  NaverMapRenderer (필요 시)

RouteProvider
  GoogleRoutesAdapter
  KakaoMobilityAdapter
  TmapRoutesAdapter

RoutePlaceSearchProvider
  GoogleSearchAlongRouteAdapter
  KakaoCorridorSearchAdapter
  TmapFindPoiRouteAdapter
```

기술적으로 분리 가능하더라도 TMAP POI를 Kakao/Naver 지도 위에 표시하거나 Google 데이터를 국내 지도 위에 표시할 때 적용되는 약관·저장·attribution 조건을 출시 전에 확인한다. 허용 범위가 불명확하면 같은 provider bundle로 renderer·route·place를 묶는다.

### 기존 크롤링 로직의 처리

사용자 요구에 따라 코드를 즉시 삭제하지 않고 격리 보존할 수 있으나 다음 gate를 둔다.

- `LegacyKakaoWebEnricher`라는 별도 adapter로 이동한다.
- 공식 Kakao adapter와 같은 interface를 구현하지 않고 optional enrichment interface만 구현한다.
- production 기본값은 OFF다.
- endpoint 404, schema 변경, timeout, robots·약관 위반 가능성에 즉시 중단 가능한 kill switch를 둔다.
- 실패해도 핵심 검색·경로·장소 카드가 정상 동작해야 한다.
- 원본 리뷰·개인정보를 장기 저장하지 않는다.
- production 활성화 전 Kakao 이용약관·법률·보안 검토와 최소 30일 안정성 실측을 통과한다.
- 위 gate를 통과하지 못하면 코드를 제거하고 `place_url` 연결만 유지한다.

현재 실측 상태에서는 production 활성화 gate를 통과하지 못했다. 따라서 “Kakao 선택”은 **Kakao 공식 API + 장소 페이지 연결**을 의미하며 크롤링 성공을 약속하지 않는다.

### 후속 다중 provider 활성화 gate

- [ ] Kakao·Google adapter가 동일한 provider contract test 통과
- [ ] `AUTO | KAKAO | GOOGLE` 선택과 재실행 UX 검증
- [ ] 사용자 선택을 profile 또는 기기 설정에 저장
- [ ] provider 변경 시 route·candidate·cache가 섞이지 않음
- [ ] 한국 300개 이상 장소에서 provider별 필수 필드 fill rate 비교
- [ ] 서울·수도권·지방·고속도로에서 경로와 경로상 검색 품질 비교
- [ ] 각 provider의 `+N분` 계산 조건과 오차 검증
- [ ] 데이터 출처·attribution·원문 상세 링크 표시
- [ ] cross-provider display와 캐시·저장 약관 검토
- [ ] provider별 API 원가와 rate-limit fallback 검증
- [ ] Kakao legacy enricher가 OFF여도 모든 핵심 flow 통과
- [ ] legacy endpoint 장애가 production 오류율에 영향을 주지 않음

### 당시 다중 공급자 확장안

```text
한국
  UI: 실측·약관에 따라 Kakao 또는 Google renderer
  기본 mode: AUTO
  사용자 선택: KAKAO | GOOGLE
  경로상 검색 강화 후보: TMAP findPoiRoute
  Kakao rich detail: 공식 place_url 연결
  Legacy crawler: 격리·기본 OFF

글로벌 영어권
  기본 mode: GOOGLE
  Google Routes + Places Search Along Route
```

이 구조는 Google의 풍부한 필드와 글로벌 확장성을 활용하면서도, 한국에서 Google POI가 부족할 때 Kakao를 제품 전체 재작성 없이 선택할 수 있게 한다. 동시에 비공식 크롤링이 중단돼도 핵심 기능이 유지된다.

### 공식 출처

- [NAVER 지역 검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [NAVER Cloud Maps 개요](https://api.ncloud-docs.com/docs/application-maps-overview)
- [Kakao Local REST API](https://developers.kakao.com/docs/latest/ko/local/dev-guide)
- [TMAP POI 통합 검색](https://tmap-skopenapi.readme.io/reference/%EC%9E%A5%EC%86%8C%ED%86%B5%ED%95%A9%EA%B2%80%EC%83%89)
- [TMAP POI 상세 검색](https://tmap-skopenapi.readme.io/reference/%EB%AA%85%EC%B9%ADpoi-%EC%83%81%EC%84%B8-%EA%B2%80%EC%83%89)
- [TMAP POI 경로 반경 검색](https://tmap-skopenapi.readme.io/reference/%EB%AA%85%EC%B9%ADpoi-%EA%B2%BD%EB%A1%9C-%EB%B0%98%EA%B2%BD%EA%B2%80%EC%83%89)
- [TMAP 자동차 경로안내](https://tmap-skopenapi.readme.io/reference/%EC%9E%90%EB%8F%99%EC%B0%A8-%EA%B2%BD%EB%A1%9C%EC%95%88%EB%82%B4)
- [Google Places Search Along Route](https://developers.google.com/maps/documentation/places/web-service/search-along-route)
- [Google Places Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Google Places Place 리소스](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places)
- [Google Routes API](https://developers.google.com/maps/documentation/routes/compute_route_directions)
- [Google Maps Platform 가격표](https://developers.google.com/maps/billing-and-pricing/pricing)

*웹 출처 내용은 라이선스 준수를 위해 장문 인용 없이 요약·재서술했다.*

## 23. 현재 구현 기준: 언어 기반 검색 + 좌표 지역 기반 경로

> 최초 결정: 2026-08-05. 최종 갱신: 2026-08-07. 이 장이 지도 데이터 provider 우선순위와 광고 구현 방향의 최신 기준이며, 8장·13장·22장과 이 장의 이전 Google-only 제안이 충돌하면 아래 기준을 우선한다.

### 제품·기술 결정

- 현재 FE 지도 화면은 모든 언어에서 `react-native-nmap` 기반 Naver renderer를 유지한다. Google/Kakao는 지도 타일이 아니라 데이터 API provider다.
- 주소·장소·경로상 검색은 앱 언어로 선택한다: `ko`/`ko-*`는 Kakao, `en`은 Google이다.
- route/stopby는 언어와 분리한다. 출발지·목적지·모든 기존 경유지·새 stopby 중 한국 routing geofence 좌표가 하나라도 있으면 Kakao만, 모두 해외면 Google만 호출한다.
- 어느 방향도 provider 간 fallback하지 않는다. 한국 경로의 Kakao 오류와 해외 경로의 Google no-route/운영 오류는 선택된 provider의 실패로 전파한다.
- Kakao 3-card UI는 한 응답에서 고정 3개를 받는 구조가 아니다. `alternatives=false`로 `RECOMMEND`, `DISTANCE`, `TIME`을 각각 호출하고 성공한 `routes[0]`을 최대 3개 취합한다. 공식 추가 priority `MAIN_ROAD`, `NO_TRAFFIC_INFO`는 현재 제품 범위에서 제외한다.
- use case와 도메인 모델은 Google/Kakao SDK·REST DTO를 직접 참조하지 않고 provider port와 resolver 뒤에서 동작한다. 사용자가 provider를 직접 고르는 UI는 노출하지 않는다.
- 기존 Kakao 크롤링은 핵심 경로에서 제거하고 필요 시 `LegacyKakaoWebEnricher`로 격리 보존한다. 공식 Kakao/Google adapter의 의존성은 아니다.

### 현재 provider 경계

```text
Application use cases (MapService)
  ReverseGeocode
  SearchPlaces
  FindRoutes
  SearchPlacesAlongRoute
  CalculateDetour
       │
       ▼
Request-scoped resolvers
  LanguageMapProviderResolver  (주소·장소·경로상 검색)
  RouteMapProviderResolver     (route·stopby 좌표 지역)
       │
       ▼
Provider ports
  GeocodingProvider
  PlaceSearchProvider
  RouteProvider
  RoutePlaceSearchProvider
  PlaceDetailProvider          (후속)
       │
       ▼
Adapters
  KakaoMapAdapter
  GoogleMapAdapter
```

현재 wire 응답은 `AddressResult`, `PlaceResult`, `RouteResult`, `StopByRouteResult`로 정규화한다. 후속 상세 모델에는 `(provider, providerResourceId)`, attribution, 원문 링크, 관측 시각과 `KNOWN | UNKNOWN | UNSUPPORTED` 상태를 보존한다. Google FieldMask·encoded polyline·Kakao 원본 DTO는 adapter 밖으로 노출하지 않는다.

FE는 현재 Naver renderer를 유지하되 RN 0.86 이식에서 `MapRenderer` port를 도입한다. 지도 화면과 검색 화면이 특정 provider 네이티브 타입을 상태 저장소나 BE request에 저장하지 않게 한다. 아직 구현하지 않은 `MarketConfig`의 목표 정책은 다음과 같다.

```ts
{
  searchProviderByLanguage: {ko: 'KAKAO', en: 'GOOGLE'},
  routeProviderByRegion: {southKorea: 'KAKAO', other: 'GOOGLE'},
  fallbackPolicy: 'FAIL_EXPLICITLY',
}
```

provider 생성은 composition root 한 곳에서 수행한다. 오류는 선택된 provider, no-route, quota, 인증, 입력 오류로 구분해 표시·관측하며 다른 provider로 조용히 전환하지 않는다.

### 광고 BM: 추후 활성화하되 지금 확장 지점 확보

광고 수익 후보는 네 종류다.

1. 경로 조건을 만족하는 `SPONSORED_RESULT` 또는 제휴 장소
2. 화면 하단·결과 목록의 `BANNER`
3. 자연스러운 화면 전환 시점의 `INTERSTITIAL`
4. 예약·주문·주차·충전 성과에 따른 `AFFILIATE/CPA`

배너·전면 광고는 배제하지 않지만 첫 provider-neutral 검색 vertical slice에는 실제 광고 SDK를 넣지 않는다. 대신 아래 포트, placement와 이벤트 계약을 먼저 정의해 나중에 AdMob 등 광고 adapter를 추가해도 검색·지도 화면을 다시 작성하지 않게 한다.

```ts
type AdPlacement =
  | 'HOME_BOTTOM_BANNER'
  | 'RESULTS_INLINE_BANNER'
  | 'PLACE_DETAIL_BANNER'
  | 'POST_SEARCH_INTERSTITIAL';

interface AdProvider {
  load(placement: AdPlacement): Promise<void>;
  show(placement: AdPlacement): Promise<'SHOWN' | 'SKIPPED' | 'FAILED'>;
}
```

`AdPolicy`는 entitlement, 동의 상태, 앱 foreground 상태, 활성 주행 여부, 마지막 노출 시각, 세션당 빈도와 remote kill switch를 입력으로 받아 노출 여부를 결정한다. 광고 SDK를 화면 컴포넌트에서 직접 호출하지 않는다.

광고 placement 원칙:

- 배너 후보: 홈 하단, 검색 결과 목록 중간, 장소 상세 하단
- 전면 후보: 사용자가 검색 결과를 확인한 뒤 다음 계획 단계로 이동하는 자연스러운 전환 지점
- 금지: 앱 시작 직후, 위치 권한 요청 전후, 오류·복구 화면, 활성 경로 안내 중, 지도·경로·긴급 조작을 가리는 위치
- 전면 광고는 한 검색마다 강제하지 않고 세션·시간 빈도 제한과 `close` 가능 여부를 검증한다.
- Free에서만 배너·전면 광고를 실험하고 Plus/Trip Pass는 제거 또는 최소화를 기본 후보로 둔다.
- 광고·제휴·organic 결과를 UI와 analytics에서 분리하고 sponsored 결과가 검색 hard filter나 최대 우회시간을 우회하지 못하게 한다.
- 개인화 광고는 사용자 동의, 연령, ATT, 한국 PIPA 및 출시 시장 개인정보 규정과 최신 스토어 정책을 검토한 후에만 활성화한다.

필수 계측은 `ad_request`, `ad_loaded`, `ad_impression`, `ad_click`, `ad_closed`, `ad_failed`, `search_completed`, `result_selected`, `navigation_handoff`다. 광고 eCPM만 보지 않고 `광고 순수익 - Google API 비용 - 결제/제휴 비용`과 광고 노출 cohort의 검색 완료율·navigation handoff·retention 하락을 함께 본다.

### 바로 착수할 provider-neutral vertical slice

1. 구현된 언어 기반 검색 resolver와 좌표 지역 기반 route resolver를 한국·해외 fixture로 검증한다.
2. Kakao 3개 priority 호출의 부분 성공·정렬·FE label 매핑을 실제 외부 API와 시뮬레이터에서 확인한다.
3. `PlaceDetailProvider`와 Google Place Details adapter를 추가한다.
4. `parkingOptions`, current/regular opening hours, rating, user rating count를 Lean/Core/Rich FieldMask로 나누고 비용·fill-rate gate를 둔다.
5. 자연어 원문을 provider-neutral `SearchIntent`로 구조화하고 지원 가능한 query/filter로 compile한다.
6. 각 후보의 실제 `+N분`을 선택 route priority로 계산하고 `UNKNOWN`을 `false`로 바꾸지 않는다.
7. FE에 provider-neutral place detail view model을 연결하고 현재 Naver renderer 의존과 분리한다.
8. `맥도날드 dt`, `리뷰 좋은 간장게장집`, `주차 가능한 카페`를 포함한 한국어·영어 query로 Android/iOS smoke test를 수행한다.
9. 광고는 `AdProvider` no-op 구현과 placement placeholder/event schema까지만 만들고 실제 SDK·광고 단위는 수익 실험 시 연결한다.
10. 첫 프로덕션 바이너리 전 EAS Update·runtime·rollback gate를 통과한다.

### 개발자가 준비할 항목

#### 지금 필수

- 결제가 연결된 Google Cloud 프로젝트와 프로젝트 ID
- 활성화할 API: Maps SDK for Android, Maps SDK for iOS, Places API (New), Routes API, Geocoding API
- Android 앱 package name과 debug/Upload/Play App Signing certificate SHA-1
- iOS bundle ID와 Apple 개발 Team 설정
- 환경별로 나누지 않은 용도별 키 3종
  - `omw-android`: Android package + 필요한 SHA-1 application restriction, Maps SDK for Android만 API restriction
  - `omw-ios`: bundle ID application restriction, Maps SDK for iOS만 API restriction
  - `omw-server`: Places API (New)·Routes API·Geocoding API만 API restriction, application restriction은 우선 없음
- 개발 중 BE는 localhost `3005`에서 `omw-server`를 사용하고, Railway 배포와 Variables 등록은 개발 완료 후 진행
- Google Cloud budget alert와 API별 quota 상한
- `ko-KR/KR/METRIC` 기본값, 테스트할 출발지·목적지 경로 5개 이상과 자유 텍스트 query 목록
- 키 값은 채팅·문서·Git에 붙이지 않고 로컬 `.env` 또는 비밀 저장소에만 저장

#### 개발 중 결정 가능

- Cloud-based map styling이 필요할 때만 Android/iOS Map ID 생성
- production BE의 egress IP 또는 사용할 비밀 저장소
- Google Maps attribution·Places 저장 정책을 반영한 개인정보처리방침/이용약관 URL
- EAS/Expo 계정과 project ID, Apple/Google Store 계정, signing key 관리 방식

#### 광고 실험 직전에 준비

- 사용할 광고 네트워크 선정. Google AdMob을 선택하면 AdMob 계정, Android/iOS app ID와 placement별 ad unit ID
- 개발·QA용 test ad unit과 production ad unit 분리
- ATT·동의 관리 플랫폼, 개인정보처리방침, 연령 정책과 스토어 광고 정책 검토
- banner/interstitial frequency cap, remote kill switch, Free/Plus entitlement 정책

### 문서 동기화 기준

`FEATURE_INSIGHTS.md`는 결정 근거·BM·비교·정책을, `MIGRATION_PLAN.md`는 실제 작업 순서·환경변수·완료 조건을, `PROJECT_CONFIGURATION.md`는 현재 Store identity·signing·toolchain·복원 기준을 관리한다. 세 문서의 현재 공통 기준은 다음과 같다.

```text
주소·장소·경로상 검색  앱 언어 기반: 한국어(ko)는 KAKAO, 영어(en)는 GOOGLE
route·stopby           입력 좌표 기반: 한국 좌표 하나 이상 KAKAO only, 모두 해외 GOOGLE only
provider fallback      없음
지도 renderer          현재 Naver 유지; RN 0.86 이식에서 abstraction 도입
Kakao route 카드       RECOMMEND/DISTANCE/TIME 개별 호출을 최대 3개 취합
Google 키 구조         환경 분리 없이 Android/iOS/server 용도별 3개
개발 BE                localhost:3005
배포                    개발 완료 후 Railway, server key를 Variables에 등록
확장 방식              provider ports + resolver + adapter + contract tests
사용자 provider 선택   없음
광고 초기 구현         no-op port + placement/event contract
광고 후속 구현         banner/interstitial/sponsored/affiliate adapter
OTA                     첫 production 전에 필수
```

*웹 출처 내용은 라이선스 준수를 위해 장문 인용 없이 요약·재서술했다.*


## 24. 지도 플랫폼별 비용 비교와 Google 월간 예산

> 조사·계산 기준: 2026-08-05. Google 공식 가격표는 2026-07-28 갱신본이다. 실제 청구액은 billing account, 계약 할인, 사용 구간, 세금, 환율, 요청 FieldMask와 일별 트래픽 편차에 따라 달라진다. 아래 계산은 제품 의사결정용 추산이며 콘솔 견적·실청구를 대체하지 않는다.

### 비용 비교 원칙

플랫폼별 호출 1회를 같은 기능으로 간주하면 안 된다.

- Google Search Along Route 1회는 경로 전체, 장소 필드와 routing summary를 함께 받을 수 있다.
- Kakao는 공식 polyline 장소 검색이 없어 경로 샘플 좌표마다 Local 검색을 반복하고 후보별 경로를 다시 계산해야 한다.
- TMAP은 `findPoiRoute`가 있지만 영업시간·평점·리뷰·사진 fill rate가 Google과 다르다.
- NAVER 지역검색은 좌표 반경·경로 검색이 없고 결과도 최대 5개라 동일 기능을 직접 구성할 수 없다.

따라서 가격과 함께 호출 증폭, 기능 충족률, 별도 데이터 보강비를 비교한다.

### Google 관련 SKU 스냅샷

단위는 USD/1,000 billable events이며 첫 번째 유료 구간 가격이다.

| SKU | 월 무료 사용량 | 첫 유료 구간 |
|---|---:|---:|
| Maps SDK | Unlimited | 무료 |
| Autocomplete Requests | 10,000 | $2.83 |
| Geocoding | 10,000 | $5 |
| Place Details Essentials | 10,000 | $5 |
| Compute Routes Essentials | 10,000 | $5 |
| Compute Routes Pro | 5,000 | $10 |
| Text Search Pro | 5,000 | $32 |
| Text Search Enterprise | 1,000 | $35 |
| Text Search Enterprise + Atmosphere | 1,000 | $40 |
| Place Details Enterprise + Atmosphere | 1,000 | $25 |
| Place Details Photos | 1,000 | $7 |
| Navigation Request | 1,000 | $25 |

OnMyWay에서 `parkingOptions`와 `routingSummaries`를 검색 응답에 포함하면 Text Search Enterprise + Atmosphere를 기준으로 예산을 잡는다. rating·영업시간까지만 사용하는 Lean 검색은 Text Search Enterprise 기준이다. FieldMask 하나가 SKU를 바꿀 수 있으므로 코드에 목적별 FieldMask preset을 둔다.

### Google 검색 세션 가정

한 번의 검색 세션을 다음처럼 정의한다.

```text
Autocomplete 요청             평균 2회
출발지·목적지 Details Essentials 평균 2회
Compute Routes Pro            1회
Places Search Along Route     1페이지 1회
선택 장소 상세/사진           Rich UI에서 각각 세션의 20%
네이티브 Maps SDK             공식 가격표상 Unlimited
```

세 가지 예산 모델:

- **Lean:** Routes Pro + Text Search Enterprise + Autocomplete + 출발지·목적지 Place Details Essentials. 평점·영업시간까지, 주차·routing summary 제외
- **Core V3:** Routes Pro + Text Search Enterprise + Atmosphere + Autocomplete + 출발지·목적지 Place Details Essentials. 주차·routing summary 포함, 검색 응답 재사용
- **Rich UI:** Core V3 + 사용자 20%가 Place Details Enterprise + Atmosphere와 사진 1장을 추가 조회

### Google 월 비용 추산

| 월 검색 세션 | Lean | Core V3 | Rich UI | Rich UI 원화 참고값 |
|---:|---:|---:|---:|---:|
| 1,000 | $0 | $0 | $0 | 약 0원 |
| 5,000 | $140.00 | $160.00 | $160.00 | 약 224,000원 |
| 10,000 | $443.30 | $488.30 | $520.30 | 약 728,000원 |
| 50,000 | $2,869.70 | $3,114.70 | $3,402.70 | 약 4,764,000원 |
| 100,000 | $5,746.70 | $6,241.70 | $6,849.70 | 약 9,590,000원 |

원화 참고값은 `1 USD = 1,400원` 가정이며 VAT·해외결제 수수료·환율 변동을 제외했다. BE 인프라, 로그·모니터링, LLM, 광고 SDK, EAS, Store 계정 비용도 제외했다.

10,000 세션 Rich UI 계산 예:

```text
Text Search E+A      (10,000 - 1,000) × $40/1,000 = $360.00
Routes Pro           (10,000 - 5,000) × $10/1,000 =  $50.00
Autocomplete         (20,000 - 10,000) × $2.83/1,000 = $28.30
Location Details     (20,000 - 10,000) × $5/1,000 =   $50.00
Place Details E+A    (2,000 - 1,000) × $25/1,000 =   $25.00
Photo                (2,000 - 1,000) ×  $7/1,000 =    $7.00
합계                                                     $520.30
```

주의:

- Search Along Route 2페이지를 항상 요청하면 검색 SKU 이벤트가 거의 2배, 3페이지면 거의 3배가 된다.
- 후보 5개의 상세정보를 각각 다시 요청하면 Place Details가 세션당 최대 5회로 증폭된다.
- 검색 응답 FieldMask에서 이미 받은 필드는 상세 화면에서 재사용하고, 사진은 사용자가 상세를 열 때만 요청한다.
- traffic·고급 route 기능이 필요 없다면 Routes Essentials로 낮출 수 있지만 제품 정확도 gate를 먼저 통과해야 한다.
- Navigation SDK를 직접 붙이면 목적지 기준 별도 Navigation Request 비용이 발생한다. 초기 외부 내비 handoff에는 포함하지 않는다.

### Kakao 비용 모델

2026-08-05 공식 Kakao Developers 쿼터 기준:

| 항목 | 무료 일간 쿼터 | 추가 쿼터 단가 |
|---|---:|---:|
| 지도 Android/iOS SDK | 300,000 | 0.1원/건 |
| 키워드 장소 검색 | 100,000 | 2원/건 |
| 카테고리 장소 검색 | 100,000 | 2원/건 |
| 주소·좌표 변환 | 각각 100,000 | 0.5원/건 |
| 자동차 길찾기 | 10,000 | Kakao Developers 공개 추가 단가표에 없음 |
| 다중 경유지 길찾기 | 5,000 | 별도 권한·계약 확인 |

전체 API 무료 월간 쿼터는 3,000,000건이며, 지도 무료 쿼터는 개발자 계정의 첫 활성화 앱에만 적용된다.

현재 OnMyWay Kakao 근사 방식에서 세션당 `Local 검색 10회 + 기본/후보 경로 6회`를 가정하면:

- 장소 검색 추가 쿼터만 종량 적용될 경우 약 `10 × 2원 = 20원/세션`
- 트래픽이 고르게 분산되면 자동차 길찾기 일 10,000건이 약 `1,666 검색 세션/일`, 월 약 50,000세션 부근에서 먼저 병목
- 자동차 경로 초과 비용은 공개 Kakao맵 추가 단가표만으로 확정할 수 없으므로 Kakao Mobility 계약 견적 필요
- 영업시간·주차·평점·리뷰를 공식 Local API가 제공하지 않아 별도 데이터 비용이 생길 수 있음

따라서 Kakao는 무료 구간 안에서는 매우 저렴할 수 있지만 Google Core V3와 기능 동등한 총비용은 아니다.

### TMAP 비용 모델

공식 요금 계산기에는 Free/Lite/Premium 구조가 노출된다.

- POI 검색: Free 일 20,000건, Lite 일 50,000건
- Lite: 월 2,200,000원(VAT 포함) 안내
- Premium: 사용량 기반 후불 구조

실측한 경로 검색 flow는 `기본 경로 1 + findPoiRoute 1 + 후보 5개 경유 재계산 = 약 7회` 호출이다. `findPoiRoute`, 자동차 경로, POI 상세이 정확히 어느 요금 그룹·초과 단가에 포함되는지는 계산기에서 선택한 상품 구성과 계약에 따라 확인해야 한다.

TMAP은 공식 경로상 POI 검색 덕분에 Kakao보다 호출 증폭이 적을 수 있지만, 테스트 표본에서 영업시간·주차·사진·평점 fill rate가 Google보다 낮았다. 정확한 월 비용은 TMAP 콘솔에서 위 7-call 세션 모델로 견적을 저장한 뒤 문서에 반영한다.

### NAVER 비용 모델

NAVER Developers 지역검색 API는 일 25,000회 한도가 있지만 좌표 반경·polyline 경로 검색이 없고 결과가 최대 5개여서 OnMyWay 핵심 기능을 단독 제공하지 못한다. 지도 렌더링·Directions·Geocoding은 NAVER Cloud Maps 종량 구간 요금제이며, 새로운 Maps 상품은 공식 계산기/콘솔에서 예상 사용량을 입력해 확인해야 한다.

공개 정적 페이지에서 최신 신규 Maps의 모든 구간 단가를 안정적으로 추출하지 못했으므로 과거 단가를 현재 가격으로 기재하지 않는다. NAVER를 후속 provider로 결정할 때 다음 호출 모델로 공식 견적을 다시 산출한다.

```text
지도 load 1회
기본 Directions 1회
후보 5개 경유 Directions 5회
Geocoding/Reverse Geocoding 0~2회
장소 검색은 별도 지역검색 또는 검색 상품 확인
```

NAVER 역시 공식 Search Along Route와 rich Places 상세가 없어 Google과 기능 동등한 단가 비교가 아니다.

### 플랫폼 종합 비교

| 플랫폼 | 동일 기능 충족도 | 무료·저비용 강점 | 비용 불확실성 | 현재 판단 |
|---|---|---|---|---|
| Google | 가장 높음. Search Along Route, 주차·영업시간·평점·routing summary | Maps SDK 무료, SKU별 월 무료 구간 | FieldMask·페이지·상세·사진에 따라 비용 급증 | **초기 구현 기준. Core V3 10k 세션 약 $488** |
| Kakao | 국내 POI·경로 강점, rich detail 부족, 경로상 검색은 앱 근사 | 높은 일간 무료 쿼터, Local 초과 2원/건 | Kakao Mobility 자동차 경로 계약·보강 데이터 비용 | 후속 국내 adapter 후보 |
| TMAP | 공식 `findPoiRoute`와 국내 경로 강점, rich detail 낮음 | POI Free/Lite 구간 | API 그룹별 계약·경로 초과 단가 확인 필요 | 후속 경로 adapter 후보 |
| NAVER | 지도·국내 검색 강점, 경로상 검색·rich detail 부족 | 지역검색 일 25,000회 | 신규 Cloud Maps 구간 견적과 장소 검색 조합 | renderer/보조 provider 후보 |

### 비용 통제 결정

1. 첫 Google 버전은 Search Along Route 1페이지, 상위 5개 결과로 제한한다.
2. `LEAN`, `CORE`, `RICH_DETAIL` FieldMask preset을 코드와 analytics에 기록한다.
3. 사진·리뷰·별도 Place Details는 사용자 상세 진입 시 lazy load한다.
4. 검색 응답에서 받은 필드는 정책 범위 안에서 같은 세션에 재사용한다.
5. 세션별 `autocompleteCount`, `routeCount`, `searchPageCount`, `detailCount`, `photoCount`, 예상 SKU 비용을 기록한다.
6. Cloud Billing budget alert는 월 예산의 50%·75%·90%·100%에 설정한다.
7. 개발 key와 production key의 quota를 분리하고, 비정상 호출 시 remote feature flag로 rich field·추가 페이지·사진을 끌 수 있게 한다.
8. 광고 수익성은 매출만 보지 않고 `광고 순수익 - Google API 비용`으로 계산한다.

권장 초기 월 예산 gate:

| 단계 | 월 검색 세션 상한 | Google 예상 | 권장 조치 |
|---|---:|---:|---|
| 개발/내부 QA | 500 | 대부분 무료 구간 | dev key quota 제한 |
| Closed beta | 1,000 | Core/Rich 약 $0 | 실호출과 예상 SKU 대조 |
| 초기 beta 확장 | 5,000 | Core 약 $160 | 월 예산 $250 이상 확보 |
| 초기 운영 | 10,000 | Core 약 $488, Rich 약 $520 | 월 예산 $800 이상 + alert |
| 성장 검증 | 50,000 | Core 약 $3,115, Rich 약 $3,403 | volume tier·계약 할인 검토 |

### 공식 출처

- [Google Maps Platform 가격표](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform SKU 과금 조건](https://developers.google.com/maps/billing-and-pricing/sku-details)
- [Kakao Developers 쿼터와 추가 요금](https://developers.kakao.com/docs/ko/getting-started/quota)
- [NAVER Cloud Maps](https://www.ncloud.com/product/applicationService/maps)
- [NAVER Cloud 요금 계산기](https://www.ncloud.com/charge/calc/ko)
- [NAVER 지역검색 API](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [TMAP API 요금 계산기](https://openapi.sk.com/products/calc?svcSeq=4&menuSeq=5)

*웹 출처 내용은 라이선스 준수를 위해 장문 인용 없이 요약·재서술했다.*