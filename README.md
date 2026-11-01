# OnMyWay · 주행 중 경로 주변 검색 도우미

주행 중 경로 주변의 장소를 키워드로 검색하고, 경유지 후보를 들렀을 때 몇 분이 더 걸리는지 비교해 주는 서비스다.
2024년 V1 기획부터 개발·출시·운영까지 직접 했고, 2026년 8월 Kiro를 활용해 V3로 현대화했다.

<p>
  <a href="https://apps.apple.com/pl/app/on-my-way-%EA%B2%BD%EB%A1%9C-%EC%A3%BC%EB%B3%80-%EC%9E%A5%EC%86%8C-%EA%B2%80%EC%83%89%EC%9D%84-%ED%95%9C%EB%88%88%EC%97%90/id6503656527"><img height="44" alt="App Store에서 다운로드" src="https://img.shields.io/badge/App_Store-Download-0D96F6?style=for-the-badge&logo=apple&logoColor=white"></a>
  &nbsp;
  <a href="https://play.google.com/store/apps/details?id=com.omw.omw_front"><img height="44" alt="Google Play에서 다운로드" src="https://img.shields.io/badge/Google_Play-Download-34A853?style=for-the-badge&logo=googleplay&logoColor=white"></a>
</p>

- **App Store**: <https://apps.apple.com/pl/app/on-my-way-%EA%B2%BD%EB%A1%9C-%EC%A3%BC%EB%B3%80-%EC%9E%A5%EC%86%8C-%EA%B2%80%EC%83%89%EC%9D%84-%ED%95%9C%EB%88%88%EC%97%90/id6503656527>
- **Google Play**: <https://play.google.com/store/apps/details?id=com.omw.omw_front>

<img width="360" alt="OnMyWay 앱 화면" src="https://github.com/user-attachments/assets/06806b05-ce76-46f7-915b-67d33f3513fc">

> **현재 상태 (2026-11-01 기준)**: iOS 3.0.0이 2026-08-23 App Store에 출시됐고, 백엔드는 Railway에서 Docker 컨테이너로 운영 중이다.
> Android 3.0.0은 서명된 AAB까지 준비됐고, Google Play는 아직 2.1.2를 제공한다.

## 현재 아키텍처 (V3)

```text
React Native 0.86 app (iOS · Android)
  ├ Map renderer: Naver Map | Google Map
  ├ Accept-Language: ko | en  (every request)
  └ EAS Update (OTA)
          │ HTTPS
          ▼
NestJS 11 · Docker container (Railway)
  MapController                 inbound adapter (HTTP)
    └ Use cases ×6              address · place · route · along-route search · place detail · detour
        └ Ports ×5              Geocoding · PlaceSearch · Route · RoutePlaceSearch · PlaceDetail
            ├ KakaoMapAdapter   → Kakao Local · Mobility
            └ GoogleMapAdapter  → Google Geocoding · Places (New) · Routes
  MarketConfig (policy) → resolver picks an adapter per request
```

### 지도 제공자 구조 (Ports & Adapters)

V2까지는 서비스 코드가 Kakao API를 직접 호출했다. V3에서는 [`OnMyWay_BE_V3/src/modules/map/`](OnMyWay_BE_V3/src/modules/map) 안을 다음처럼 나눴다.

- **Use case**: 주소·장소·경로·경로 주변 검색·장소 상세·우회 시간. 제공자 SDK 타입을 모르고 port에만 의존한다.
- **Port**: 제공자 중립 모델과 5개 interface(`GeocodingProvider`, `PlaceSearchProvider`, `RouteProvider`, `RoutePlaceSearchProvider`, `PlaceDetailProvider`).
- **Adapter**: `KakaoMapAdapter`와 `GoogleMapAdapter`가 port를 구현한다. 제공자 오류는 고정된 오류 코드로 바꿔서 내보낸다.
- **Policy**: 어떤 adapter를 쓸지는 [`market-config.ts`](OnMyWay_BE_V3/src/modules/map/providers/market-config.ts) 한곳에 선언하고, resolver는 그 결과를 adapter에 연결하기만 한다.

지도 제공자를 교체하거나 추가할 때는 adapter를 만들어 정책과 모듈에 등록하면 되고, use case와 controller 코드는 그대로다.

| 조건 | 주소·장소·경로 주변 검색 | 경로·경유지 |
| --- | --- | --- |
| 앱 언어 한국어 | Kakao | 좌표 기준 |
| 앱 언어 영어 | Google | 좌표 기준 |
| 경로 좌표 중 하나라도 한국 | (언어 기준 유지) | Kakao만 |
| 경로 좌표가 모두 해외 | (언어 기준 유지) | Google만 |

### 배포와 운영

- **백엔드**: multi-stage Docker 이미지를 Railway에 배포한다. `/health` health check(120초)를 통과해야 트래픽이 넘어가고, 실패하면 최대 10회 재시작한다. `OnMyWay_BE_V3/` 아래가 바뀐 commit만 재배포한다.
- **앱**: EAS Build로 스토어 바이너리를 만들고, JS 변경은 EAS Update(OTA)로 배포한다. runtime version을 명시해서 네이티브 코드가 다른 바이너리에는 OTA가 가지 않게 했다.

더 자세한 내용은 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)(구조)와 [`docs/HOW_IT_WORKS.md`](docs/HOW_IT_WORKS.md)(검색·경로·길안내 동작 방식)에 있다.

## 주요 기능

V1부터의 핵심 기능은 경로 주변 장소 검색과 우회 시간 비교다. V3에서 아래 기능을 더했다.

- **한국어·영어 지원.** 첫 실행 때 기기 언어로 정하고, 이후에는 앱 설정을 따른다. 모든 요청에 `Accept-Language`로 서버에 전달한다.
- **해외 경로.** 경로의 모든 지점이 해외면 Google Routes, 하나라도 한국이면 Kakao로 경로를 만든다.
- **지도 선택.** Naver Map 또는 Google Map. 화면에 보이는 지도와 데이터 제공자는 서로 독립이다.
- **검색 반경 표시.** 선택한 경로를 반경(km)만큼 넓힌 영역을 지도에 옅게 그려서, 검색 전에 범위를 보고 조정할 수 있다.
- **경유지 자동 삽입.** 찾은 장소를 기존 경유지의 앞·사이·뒤에 넣어 보는 계산을 병렬로 돌려 가장 빠른 위치를 고른다.
- **장소 상세.** 영업 여부, 영업시간, 주차, 평점을 사용자가 연 장소에 대해서만 한 번 조회한다.
- **길안내 연결.** 한국 경로는 Naver Map, 해외 경로는 Google Maps로 경유지 순서를 유지한 채 넘긴다.

## 설계 결정

1. **한국 경로는 Kakao만 쓴다.** 유효한 한국 좌표에도 Google Routes가 빈 경로를 반환했고, Google 커버리지 표에도 한국 자동차 길찾기는 미지원으로 나온다. 그래서 경로 제공자는 언어가 아니라 좌표로 정한다. 한국 판정은 서버의 geofence(제주·서해 섬·울릉도·독도 포함)가 한다.
2. **제공자 간 자동 fallback은 두지 않는다.** 실패를 다른 제공자로 덮으면 결과의 출처가 불분명해지고 비용·약관 문제가 생긴다. 오류는 다섯 가지 고정 코드(quota, auth, timeout, unavailable, invalid response)로 매핑하고, 제공자의 원본 응답은 클라이언트나 로그로 내보내지 않는다.
3. **모름은 없음이 아니다.** 주차 정보가 없는 장소에 "주차 불가"를 띄우면 틀린 정보다. 선택 필드는 모두 `KNOWN`, `UNKNOWN`, `UNSUPPORTED` 중 하나를 갖는다.
4. **요청 필드가 비용을 정한다.** Google Places 요금은 FieldMask에 따라 달라지고, 주차 필드 하나만으로도 상위 SKU로 올라간다. 상세 정보는 사용자가 고른 장소에 대해서만 조회하고 목록 전체에는 조회하지 않는다. Google 경로 주변 검색은 검색 지점 10개, 지점당 3페이지로 제한해서 한 번 검색이 30회 요청을 넘지 않는다.
5. **OTA는 첫 바이너리부터 넣었다.** CodePush가 종료됐고, OTA 클라이언트 없이 나간 바이너리에 나중에 넣으려면 스토어 심사를 한 번 더 받아야 한다. 업데이트 코드 서명(월 $199 플랜)은 계정·결제 기능이 없는 동안 보류했다. 대신 runtime version을 명시해서 네이티브 코드가 다른 바이너리에는 JS 업데이트가 가지 않게 했다.
6. **업그레이드는 새 템플릿에서 시작했다.** 마이너 버전 13단계와 New Architecture 전환이 겹쳐 제자리 업그레이드는 위험했다. 0.86 템플릿을 새로 만들고 `src/`를 옮겼다.
7. **서명이 다르면 출시를 멈춘다.** 첫 EAS 빌드가 새로 생성된 키로 서명돼 나왔다. production 빌드를 멈추고 기존 Play upload key를 등록해 서명이 일치하는지 확인한 뒤에야 진행했다. 기존 사용자가 재설치 없이 업데이트할 수 있어야 하기 때문이다.
8. **인프라를 줄였다.** V2의 ECS 구성(서비스 2개, 내부 ALB, NAT, RDS, Jenkins)은 인턴십 과제에서 고가용성을 검증하려고 만든 것이다. 외부 지도 API 앞에 있는 stateless 서버에는 health check와 빠른 롤백이 되는 컨테이너 하나면 충분해서 Railway로 옮겼다.

## Kiro 활용

V1·V2 코드는 AI 도구 없이 직접 작성했다. V3 전환은 Kiro로 진행했고, 규칙과 작업 단위를 [`.kiro/`](.kiro)에 남겼다.

- **Steering** ([`steering/`](.kiro/steering)): 제품 원칙, 버전 고정, 레이어 규칙, 지도 제공자 정책, 릴리스 안전, 완료 기준
- **Spec** ([`specs/`](.kiro/specs)): 5개 작업 단위를 requirements → design → tasks로 진행 (플랫폼 마이그레이션, 제공자 중립 지도 엔진, 다국어·지도 렌더러, 경로 반경 검색·경유지, 백엔드 배포)
- **Hooks** ([`hooks/`](.kiro/hooks)): 코드가 바뀌면 문서·진행 로그 갱신 확인, 비밀값 검사, 지도 모듈이 바뀌면 정책 검사와 백엔드 lint·build·test 실행
- **Human-in-the-loop**: Kiro가 코드를 옮기는 동안 정책 결정(위 8가지)과 서명·스토어 제출·비밀값 관리는 직접 했다.
- **검증 루프**: 단계마다 lint, typecheck, build, 실제 API 호출로 확인하고, 무엇을 검증했고 무엇을 못 했는지 [`docs/PROGRESS_LOG.md`](docs/PROGRESS_LOG.md)에 날짜별로 남겼다. 예를 들어 공개 버전과 비교하는 감사에서, 제공자 리팩터링 중 Google 경로 주변 검색 요청에서 검색 반경이 빠진 회귀를 찾아 고쳤다.

## 버전 히스토리

### V1 (2024.02~07) — 알고리즘·핵심 기능 구현

- React Native(iOS·Android) 앱과 NestJS 서버로 구성했다. 서버는 단일 EC2에서 PM2로 운영하고 앞단에 Cloudflare를 뒀다. 배포는 GitHub Actions, 앱 OTA 업데이트는 CodePush를 썼다.
- 2024년 6월 4일 v1.0.0을 출시하고, 6월에만 v1.0.6까지 여섯 번 업데이트했다(주차 필터, 카테고리 검색, TMap 길안내 연결).
- 경로 위 최대 20개 지점에서 Kakao 반경 검색을 실행했다. 순차 호출을 `Promise.allSettled` 병렬 호출로 바꿔 서울–부산 검색을 5.8초에서 3.5초로 줄였다.
- iOS·Android 합산 500건 이상 다운로드를 기록했고, 2024 고려대학교 캡스톤디자인 경진대회에서 대상을 받았다.
- 코드: `OnMyWay_BE_V3`, `OnMyWay_FE_V3`의 git history

### V2 (2024.07~08) — 고가용성 아키텍처 전환 (LG CNS 인턴십 과제)

- 단일 서버 병목과 장애 시 전체 중단 문제를 해결하고 회원 기능을 도입하려고, Spring Cloud로 JWT 인증·리버스 프록시 서버를 만들고 ECS Fargate 2개 AZ 구성으로 옮겼다. CI/CD는 Jenkins → ECR → ECS로 바꿨다.
- 실제 사용 흐름(JWT 인증 → 경로 생성 → 경로 주변 장소 검색) 시나리오로 JMeter 부하 테스트를 했다. 7,500건 전체 응답, 에러율 59.25% → 15.25%, 평균 응답 시간 62.6초 → 7.2초.
- 이후 같은 두 백엔드를 Kubernetes 매니페스트로 다시 구성했다([`legacy/OnMyWay_K8S_V2`](legacy/OnMyWay_K8S_V2)).
- 자세한 구조와 부하 테스트 결과: [`legacy/README.md`](legacy/README.md)

<img width="560" alt="V2 ECS Fargate 아키텍처" src="https://github.com/user-attachments/assets/16607980-d5a2-4b9d-8b09-9e347c169aa4">

### V3 (2026.08) — Kiro를 활용한 무중단 현대화

- 출시 2년 뒤 CodePush 서비스 종료(App Center, 2025.03)와 React Native 버전 지원 종료에 대응했다.
- React Native 0.73 → 0.86, NestJS 10 → 11로 전환하고, Expo SDK 57(`expo-updates`)과 EAS Update로 OTA 업데이트 경로를 복구했다.
- 해외 사용자를 위해 영어 지원과 Google Maps를 추가하고, Kakao API에 묶여 있던 지도 서비스를 Ports & Adapters 구조로 재설계했다.
- 약 3주 만에 개발과 검증을 마치고 출시했다.
- 구버전 앱 사용자를 위해 블루/그린 방식으로 무중단 배포했다. 새 버전 앱만 새 서버(Railway)를 바라보게 해서, 사용자의 앱 업데이트 속도에 맞춰 트래픽을 단계적으로 옮겼다.

| | V1·V2 (2024, 직접 작성) | V3 (2026, Kiro로 전환) |
| --- | --- | --- |
| 앱 | React Native 0.73.6, React 18 | React Native 0.86.2, React 19 (New Architecture, Hermes) |
| 상태 관리·스타일 | Recoil, NativeWind 2 | Zustand 5, NativeWind 4 |
| OTA 업데이트 | CodePush (App Center 2025.03 종료) | EAS Update (`expo-updates`, Expo SDK 57) |
| 서버 | NestJS 10, Node 18 | NestJS 11, Express 5, Node 22 |
| 지도 데이터 | Kakao | Kakao + Google Maps Platform (언어·좌표 기준 선택) |
| 지도 화면 | Naver Map | Naver Map 또는 Google Map (사용자 선택) |
| 인증 | Spring Security + Spring Cloud Gateway 서버 | 제거. 즐겨찾기와 최근 검색을 기기에 저장하므로 로그인 서버가 필요 없어졌다 |
| 배포 | Jenkins → ECR → ECS Fargate | multi-stage Docker 이미지 → Railway |
| 제거 | | OpenAI 리뷰 요약, Kakao 웹 스크래핑, TMap 네이티브 SDK, CodePush·App Center |

## 폴더 구조

```text
OnMyWay_BE_V3/   NestJS 11 API (V3)
OnMyWay_FE_V3/   React Native 0.86 app (V3)
.kiro/           Kiro steering · specs · hooks
docs/            아키텍처, 동작 방식, 배포 체크리스트, 진행 로그
legacy/          V2 (2024) 인증·프록시 서버와 인프라 구성
```

## 로컬 실행

```bash
corepack enable
pnpm install          # 백엔드·앱 의존성과 CocoaPods 설치
pnpm dev:ios          # 백엔드 + Metro + iOS 시뮬레이터 (Android는 pnpm dev:android)
```

`OnMyWay_BE_V3`와 `OnMyWay_FE_V3`에서 각각 `.env.example`을 `.env`로 복사하고 키를 채운다. 로컬 서버는 `3005` 포트에서 실행된다.

## 남은 작업

- Google Play에 Android 3.0.0 출시 (internal → closed → 단계적 production rollout)
- 실기기 OTA 검증: 오프라인 시작, 업데이트 서버 장애, 롤백
- Crash reporting(Sentry), 두 제공자 공통 contract test, 자연어 필터(`SearchIntent`)
