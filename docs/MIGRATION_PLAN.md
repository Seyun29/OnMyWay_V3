# OnMyWay V3 마이그레이션 & 개발환경 셋업 가이드

> 작성일: 2026-08-01
> 최종 갱신: 2026-08-15
> 대상: AUTH 기능 legacy 이관, 의존성 제거, 버전 업그레이드, CI/CD 제거, .env 재구성, macOS RN 개발환경 셋업

## 지금부터 실행 순서

1. **Expo account/organization과 EAS project를 Free plan으로 준비한다.** 아직 결제하지 않고 project owner와 실제 project ID만 확정한다.
2. **Expo SDK 57 modules와 `expo-updates`를 bare RN native 프로젝트에 통합한다.** RN `0.86.2`와 SDK 57 호환성을 기준으로 exact dependency, Metro, Android, iOS 설정을 반영하되 Store identity와 signing은 변경하지 않는다.
3. **`development`/`preview`/`production` channel과 runtime 정책을 구성한다.** 먼저 `fingerprint`를 검증하고 local Gradle/Xcode build와 OTA publication의 runtime이 일치하지 않으면 명시적 runtime을 사용한다.
4. **Free plan에서 preview OTA를 실제 iOS/Android release build로 검증한다.** embedded bundle, 재시작 적용, offline/update-server 장애, 이전 update와 embedded update rollback까지 확인한다.
5. **현재 V3 candidate 17에는 end-to-end update code signing을 적용하지 않고 Free plan으로 시작한다.** 현재는 회원·결제·B2B 계약이 없고 소규모 consumer beta 단계이므로 `$199/월` 보안 기능을 release blocker로 두지 않는다. 대신 Expo 2FA, 최소 publish 권한, preview 선검증, runtime 격리, rollback을 필수로 적용한다. 향후 결제·계정·B2B/enterprise 계약·대규모 사용자 또는 별도 공급망 보안 요구가 생기면 signing certificate를 포함한 새 Store binary와 Production plan을 도입한다.
6. **OTA gate 통과 후 Android API 35+·iOS 실제 기기 smoke와 Store 테스트 트랙을 진행한다.** Railway production 배포는 개발 완료 후 별도 release gate로 수행한다.

2026-08-13 [Expo 공식 가격](https://expo.dev/pricing) 기준 최소 검증 비용은 Free `$0/월`이다. Starter는 `$19/월`, 자체 end-to-end update code signing을 제공하는 최소 공개 plan은 Production `$199/월`이다. 상세 포함량과 초과 비용은 `FEATURE_INSIGHTS.md`의 OTA 가격 섹션을 기준으로 한다.

---

## 0. 목표 요약

| 항목             | 현재 (V2)                         | 목표 (V3)                                                                                                                        |
| ---------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| AUTH 서버        | Spring Boot 게이트웨이 + JWT 인증 | `legacy/`로 이관, 서비스에서 제외                                                                                                |
| FE → 서버 호출   | FE → AUTH(8080) → BE 프록시       | FE → BE 직접 호출                                                                                                                |
| CI/CD            | Jenkinsfile (ECR/ECS 배포)        | 제거 (추후 재구축)                                                                                                               |
| 환경변수         | 유실됨 / 일부 하드코딩            | `.env.example` 기반 재구성                                                                                                       |
| FE               | RN 0.73.6, React 18.2             | RN 0.86.x, React 19 (New Architecture)                                                                                           |
| Android 대상 API | 프로덕션 최고 Android 14 / API 34 | **2026-08-31 전 Android 15 / API 35 이상 프로덕션 게시**                                                                         |
| OTA 업데이트     | 종료된 App Center CodePush 의존   | **첫 프로덕션 배포 전 EAS Update + `expo-updates` 필수 도입**                                                                    |
| BE               | NestJS 11.1.28, Express 5.2.1, Node 22.13.0 | 완료: NestJS 11/Node 22/Express 5 기준 유지                                                                                         |
| 지도 공급자      | Kakao/Naver/TMAP legacy 혼재      | **주소·장소·경로상 검색은 언어 기준; route/stopby는 한국 좌표 포함 시 Kakao only, 모두 해외면 Google only**; provider port 유지 |
| 광고             | 명시적 abstraction 없음           | no-op `AdProvider`·placement 계약 선반영, 배너/전면 광고는 후속 활성화                                                           |

### 기존 Store 기준선 (authoritative)

- [x] published Android/iOS 버전 `2.1.2`, Android `versionCode 16`, iOS build `16`
- [x] Play Console이 프로덕션의 규정을 준수하지 않는 가장 높은 대상 API를 Android 14 / API 34로 확인
- [x] Android application ID `com.omw.omw_front`; iOS bundle ID `com.omw.onmywayapp`; Apple Team ID `63SCY9KWZL`
- [x] 기준 소스: `temp/onmyway/omw_front`, ref `release/v2.1.2`, commit `74abb3607bbf21a57b26d433fc97ee51f5ed416e`
- [x] 다음 local candidate의 Android `versionCode`와 iOS build를 각각 `17`로 설정
- [x] ignored temp source의 release keystore SHA-1과 Play Upload certificate 일치 확인; fingerprint는 문서나 Git에 기록하지 않음
- [ ] production Maps Android restriction에는 upload SHA-1이 아니라 Play App Signing SHA-1 사용
- [x] keystore·비밀번호·인증서 등 credentials를 Git 밖에서 관리
- [ ] candidate는 reference only이며, encrypted backup을 만든 뒤까지 `temp`를 삭제하지 않음

### 🚨 0-A. Google Play 대상 API 긴급 대응 (출시 차단, 기한 2026-08-31)

> Play Console 경고: 앱이 Android 15(API 35) 이상을 타겟팅하지 않으면 2026-08-31부터 앱의 대상 API보다 높은 Android 버전을 사용하는 신규 사용자에게 앱이 제공되지 않는다. 로컬 빌드 성공이나 테스트 트랙 업로드만으로는 해결되지 않으며, 규정 준수 AAB를 **프로덕션에 게시**하고 정책 상태가 해제된 것을 확인해야 한다.

전체 V3 마이그레이션이 기한 내 완료되지 않을 가능성에 대비해 이 작업을 독립적인 긴급 릴리스 트랙으로 운영한다. 우선순위는 **기존 V2 최소 변경 컴플라이언스 릴리스**이며, V3가 아래 gate를 모두 만족해 더 일찍 준비된 경우에만 V3 릴리스로 대체한다. 대상 API 대응을 지도 공급자 전환, 회원 기능, OTA 구축 등 다른 V3 범위에 종속시키지 않는다.

- [ ] Play Console의 `App Bundle 보기`에서 현재 프로덕션 artifact의 `targetSdk`와 영향받는 기기 범위를 다시 확인하고 증적 보존
- [x] Android SDK Platform 36와 Build Tools를 설치하고 `compileSdkVersion 36`, `targetSdkVersion 36`으로 변경
- [x] RN 0.86 기반 V3 release candidate 경로 선택
- [x] Android Gradle Plugin·Gradle·Kotlin·JDK 및 native dependency 호환성을 local release AAB build로 확인
- [x] application ID `com.omw.omw_front`, upload key, 기존 사용자 upgrade path를 유지하고 `versionCode 17` 적용; Play App Signing 연결은 Store 업로드 시 재확인
- [ ] Android 15/API 35 이상 실기기 또는 에뮬레이터에서 앱 시작, 위치 권한, 지도 표시, 장소 검색, 경로 검색, 백 동작, 알림·foreground service 사용 여부를 회귀 검증
- [ ] API 35의 edge-to-edge UI 영향과 상태/내비게이션 바 겹침을 전 화면에서 확인하고 수정
- [ ] internal/closed testing에서 서명·설치·업그레이드·핵심 flow smoke test 및 Play pre-launch report 통과
- [ ] staged rollout 여유를 고려해 **2026-08-31보다 충분히 먼저** 프로덕션 제출·심사·게시 완료
- [ ] Play Console에서 대상 API 경고 해제와 높은 Android 버전 신규 사용자의 앱 검색·설치 가능 상태 확인
- [ ] 출시 후 startup crash, ANR, 위치·지도·검색 오류율을 모니터링하고 rollback 가능한 직전 정상 artifact 보존

**완료 gate:** API 35+ production artifact 게시, Play Console 경고 해제, 신규 설치 및 기존 `2.1.2` 업그레이드 검증이 모두 완료되어야 이 항목을 닫는다. Google의 현재 요구사항은 [Target API level requirements for Google Play apps](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)를 기준으로 하며, 제출 직전 Play Console 표시가 더 엄격하면 그 값을 우선한다.

---

## 1단계: AUTH → legacy 이관

### 1-1. 디렉터리 이동

```bash
mkdir -p legacy
git mv OnMyWay_AUTH_V2 legacy/OnMyWay_AUTH_V2
```

루트 `README.md`의 아키텍처 설명에서 AUTH를 legacy로 표기 변경.

### 1-2. FE에서 제거할 AUTH 의존 코드

AUTH 서버에 의존하는 코드는 전부 FE에 있다. (즐겨찾기/최근검색은 AsyncStorage 로컬 저장이라 서버 의존 없음 → 그대로 유지)

| 파일                                   | 조치                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/api/auth.ts`                      | 삭제 (login / register / refresh / logout 전부 AUTH 서버 호출)                         |
| `src/api/axios.ts`                     | `axiosInstance`의 accessToken request 인터셉터 제거. `axiosDefault` 하나로 통합해도 됨 |
| `src/atoms/userState.ts`               | 삭제 (로그인 상태 atom)                                                                |
| `src/components/drawer/drawerView.tsx` | 로그인/회원가입/로그아웃 UI 및 `userState` 사용부 제거                                 |
| `src/screens/HomeScreen/index.tsx`     | `import {login, logout, register} from '../../api/auth'` 제거                          |
| AsyncStorage                           | `accessToken`, `refreshToken`, `username` 키 사용부 제거                               |

### 1-3. BE에서 제거할 것

BE는 AUTH 서버와 코드 의존이 없다. 정리만 하면 됨:

- `package.json`에서 미사용 의존성 제거: `bcrypt`, `@types/bcrypt` (소스에서 사용처 없음 확인됨)
- `@nestjs/mongoose`, `mongoose`도 주석 처리된 상태로 미사용 → 로깅용 MongoDB 계획이 없으면 제거

### 1-4. API 엔드포인트 변경

기존엔 AUTH가 `/map/**`을 BE로 프록시했다. AUTH 제거 후 FE가 BE를 직접 바라보게 변경:

- `OnMyWay_FE_V3/src/config/consts/api.ts`
  - 하드코딩된 ALB URL(`http://alb-omw-...:8080/`) 삭제
  - 주석 처리돼 있는 `export const BASE_URL = SERVER_BASEURL;` (@env) 방식으로 복원
- BE 라우트가 이미 `/map/*` prefix를 갖고 있으므로 경로 변경은 불필요

---

## 2단계: CI/CD 제거

```bash
git rm OnMyWay_BE_V3/Jenkinsfile
git rm legacy/OnMyWay_AUTH_V2/Jenkinsfile   # legacy 이관 후
```

- `Dockerfile`은 CI/CD와 무관하게 로컬 컨테이너 실행에 쓸 수 있으니 유지 권장 (불필요하면 함께 삭제)
- `main-pm2.json`(BE)은 pm2 프로덕션 실행용 → 배포 재구축 전까지는 불필요하지만 삭제 안 해도 무방

> 참고: 기존 Jenkinsfile/gradle.properties/appcenter-config 등에 시크릿이 커밋돼 있었다.
> 노출된 RDS 비밀번호, JWT 시크릿, keystore 비밀번호는 폐기(로테이션) 대상이다.

---

## 3단계: 환경변수 구조 재설계

`.env`는 유실됐으므로 `.env.example`을 기준으로 새로 발급/작성한다.
(각 프로젝트에 `.env.example`이 생성돼 있음 → `cp .env.example .env` 후 값 채우기)

### 3-1. BE (`OnMyWay_BE_V3/.env`)

| 변수                                | 용도                                                              | 발급처                                                    |
| ----------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| `PORT`                              | 서버 포트 (로컬 권장 3005; 3000·3001은 다른 로컬 프로젝트와 충돌) | -                                                         |
| `MODE`                              | `dev` 여부 (Swagger 노출 등 분기)                                 | -                                                         |
| `GOOGLE_MAPS_SERVER_API_KEY`        | 영어 설정의 Places API (New)·Routes API·Geocoding API 서버 호출   | [Google Cloud Console](https://console.cloud.google.com/) |
| `KAKAO_API_KEY`                     | 한국어 설정의 Kakao Local·Mobility API 서버 호출                  | [Kakao Developers](https://developers.kakao.com/)         |
| `SWAGGER_USER` / `SWAGGER_PASSWORD` | `/docs` basic auth                                                | 직접 지정                                                 |

서버 키는 모바일 앱에 포함하지 않는다. FE는 저장된 앱 언어를 `Accept-Language`로 보내고,
BE는 `ko`/`ko-*` 요청의 주소·장소·경로상 검색에 Kakao를, 그 외(현재 UI는 `en`)에는
Google을 사용한다. route/stopby는 언어가 아니라 좌표 기준이며 출발지·목적지·기존 경유지·
새 stopby 중 하나라도 한국 routing geofence 안이면 Kakao only, 모두 해외면 Google only다.
provider 간 fallback은 하지 않는다. 개발 중에는 localhost BE에서 두 서버 키를 사용하고 각
키의 API restriction을 필요한 API로 제한한다. Railway 배포는 개발 완료 후 진행하며 두 키를 Railway Variables에
등록한다.

정적 `DEFAULT_MAP_PROVIDER`와 port별 provider override는 더 이상 사용하지 않는다.
`TMAP_API_KEY`는 후속 adapter를 실제 활성화할 때만 추가한다. 버린 것: `MONGO_DB_URI`,
AUTH 관련 DB/JWT 설정, OpenAI 리뷰 요약 설정.

### 3-2. FE (`OnMyWay_FE_V3/.env` 및 native build config)

| 변수                          | 용도                                | 값/제한                                                                                                                              |
| ----------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `SERVER_PORT`                 | 로컬 BE 포트                        | `3005`. host는 `Platform.OS`로 자동 선택(iOS `localhost`, Android `10.0.2.2`)                                                        |
| `SERVER_BASEURL`              | 실기기·staging·production BE origin | 로컬 시뮬레이터에서는 비운다. Production은 `http://` 또는 `https://`를 포함한 전체 URL 필수; port 생략 시 scheme 기본값(80/443) 사용 |
| `APP_NAME`                    | 앱 이름                             | `OnMyWay`                                                                                                                            |
| `ANDROID_PACKAGE_NAME`        | Android application restriction     | 현재 `com.omw.omw_front`                                                                                                             |
| `IOS_BUNDLE_ID`               | iOS application restriction         | 현재 app target `com.omw.onmywayapp`                                                                                                 |
| `GOOGLE_MAPS_ANDROID_API_KEY` | Maps SDK for Android                | package + signing SHA-1 제한, Android SDK만 허용                                                                                     |
| `GOOGLE_MAPS_IOS_API_KEY`     | Maps SDK for iOS                    | bundle ID 제한, iOS SDK만 허용                                                                                                       |

모바일 SDK 키는 앱 바이너리에 포함되는 값이므로 비밀로 간주해 숨기는 대신 application/API restriction으로 오용을 막는다. 환경별로 키를 나누지 않고 `omw-android`에는 동일 package의 debug SHA-1과 Play App Signing SHA-1(필요 시 로컬 release용 Upload SHA-1)을 함께 등록하며, `omw-ios`에는 Store bundle ID를 등록한다.

버린 것: AUTH 게이트웨이 주소, 기존 App Center CodePush 키, 첫 구현에서 사용하지 않는 Naver/Kakao/TMAP 지도 키. 종료된 App Center 설정은 복원하지 않는다.

EAS Update용 `EXPO_PROJECT_ID`, update URL, channel, `runtimeVersion`과 signing 설정은 기존 App Center 키를 재사용하지 않고 별도로 생성·관리한다. 공개 설정과 배포 자격 증명을 구분하고, signing private key와 게시 토큰은 저장소 밖의 비밀 저장소에 둔다.

Google 키, EAS 토큰, signing key의 실제 값은 이 문서·채팅·Git에 기록하지 않는다.

---

## 4단계: 버전 업그레이드

### 4-1. BE: NestJS 11, Express 5, Node 22 (완료)

현재 기준은 NestJS `11.1.28`, Express `5.2.1`, Node `22.13.0`, TypeScript `5.9.3`이다.
Express 5 wildcard middleware는 `forRoutes('{*splat}')`로 전환했고 Swagger 11 nested array
schema, Jest `src/*` alias, Express `json`/`urlencoded`를 반영했다. 기존 unit 5 suites/5 tests와
`/health` e2e 1 test가 통과했다. 아래 항목은 향후 재마이그레이션 시 유지할 기준이다.

- `@nestjs/*` package는 `11.1.x` exact version으로 함께 정렬한다.
- Express 5 wildcard route는 이름 있는 wildcard 문법을 사용한다.
- Swagger nested array는 explicit `type: array`/`items` schema로 기술한다.
- 마이그레이션 가이드: https://docs.nestjs.com/migration-guide

### 4-2. FE: RN 0.73.6 → 0.86.x

13개 마이너 버전 점프 + New Architecture 전환이라 **in-place 업그레이드보다 새 템플릿 생성 후 `src/` 이식을 권장**한다. 이유:

- 0.76부터 New Architecture 기본, 0.84부터 Hermes V1 기본 → `android/`, `ios/` 네이티브 템플릿이 대폭 변경됨
- 어차피 CodePush 제거, 지도 라이브러리 교체 등 네이티브 설정을 다시 잡아야 함

#### 라이브러리 호환성 판단

| 기존                                                                     | 판단                                                                   | 대체                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `react-native-nmap` (zerocho fork)                                       | ❌ 첫 Google 버전에서 제거                                             | Google Maps SDK를 `MapRenderer` 뒤에 연결. Naver adapter는 후속 필요 시 추가               |
| `react-native-code-push`, `appcenter*`                                   | ❌ **Microsoft App Center의 CodePush 등 대부분 기능 종료(2025-03-31)** | 기존 패키지·wrapper·키 제거. **첫 프로덕션 배포 전 EAS Update + `expo-updates` 필수 도입** |
| `nativewind` 2.x                                                         | ⚠️ RN 0.86 미지원                                                      | nativewind 4.x로 업그레이드 (tailwindcss 3.4+)                                             |
| `recoil`                                                                 | ⚠️ 유지보수 중단됨                                                     | 당장은 동작하나 `zustand` 또는 `jotai`로 교체 권장                                         |
| `react-navigation` 6.x                                                   | ⚠️                                                                     | 7.x로 업그레이드                                                                           |
| `react-native-splash-screen`                                             | ⚠️ 미유지보수                                                          | `react-native-bootsplash` 권장                                                             |
| reanimated, gesture-handler, screens, safe-area-context, svg, webview 등 | ✅                                                                     | 최신 버전으로 상향만 하면 됨                                                               |
| `pnpm-lock.yaml` + `yarn.lock` 혼재                                      | 🧹                                                                     | 하나만 선택 (RN 생태계 호환성은 yarn/npm이 무난, pnpm 쓰려면 `node-linker=hoisted` 설정)   |

#### 진행 절차

```bash
# 1. 새 프로젝트 생성 (RN 0.86, 커뮤니티 CLI)
npx @react-native-community/cli init OnMyWayFE --version 0.86.0

# 2. 기존 코드 이식
#    - src/ 디렉터리 복사
#    - App.tsx, index.js 병합 (CodePush wrapper 제거)
#    - babel.config.js: react-native-dotenv, nativewind 4 방식으로 재설정
#    - tailwind.config.js, tsconfig.json paths 이식
#    - assets (svg, 폰트) + react-native-svg-transformer 설정 이식

# 3. 네이티브 설정 재적용
#    - Android: Google Maps SDK key, package/SHA-1 제한, 위치 권한
#    - iOS: Google Maps SDK key, bundle ID 제한, 위치 권한 문구
#    - 앱 아이콘 / 스플래시

# 4. AUTH 의존 제거 상태로 이식 (1단계 목록 참조)

# 5. 첫 프로덕션 배포 전에 OTA 클라이언트 내장
#    - expo-updates 설치 및 Android/iOS native 설정
#    - EAS project/update URL 연결
#    - development / preview / production channel 분리
#    - runtimeVersion 정책 설정 및 embedded bundle 확인
```

### 4-3. 출시 전 필수: OTA 업데이트 체계

> **출시 차단 조건:** 첫 프로덕션 바이너리에 EAS Update 클라이언트와 올바른 runtime/channel 설정이 없으면 스토어에 제출하지 않는다. 배포 후 OTA를 추가하려면 새 바이너리를 다시 심사·배포해야 한다.

#### 결정

- 종료된 `react-native-code-push`와 App Center를 복원하지 않는다.
- bare React Native에도 통합 가능한 **EAS Update + `expo-updates`**를 기본안으로 사용한다.
- 독립 실행형 CodePush 서버나 자체 Expo update 서버는 운영·보안·가용성 책임을 직접 질 명확한 이유가 있을 때만 대안으로 검토한다.
- OTA publication pipeline과 App Store/Google Play 바이너리 release pipeline을 분리하되, 둘을 하나의 release governance 아래 둔다.

#### OTA와 스토어 배포 경계

| 변경                                                                              |       OTA | 스토어 새 바이너리 |
| --------------------------------------------------------------------------------- | --------: | -----------------: |
| JS/TS bundle, 문구, 레이아웃, 호환되는 정적 asset, 일부 비즈니스 로직             |      가능 |               선택 |
| Swift/Objective-C/Kotlin/Java, 새 native module, native dependency·SDK 업그레이드 |      불가 |               필수 |
| 권한, entitlement, `Info.plist`, `AndroidManifest.xml` 변경                       |      불가 |               필수 |
| 앱의 핵심 목적을 바꾸거나 스토어 심사를 우회하는 대규모 기능 변경                 | 사용 금지 |               필수 |

#### 필수 운영 안전장치

1. `development`, `preview`/`staging`, `production` channel을 분리한다.
2. `runtimeVersion`은 EAS fingerprint 정책 또는 명시적 버전으로 관리해 네이티브 호환 바이너리에만 업데이트를 전달한다.
3. preview에서 실제 설치·재시작·오프라인·실패 복구를 검증한 update만 production으로 승격한다.
4. production은 가능하면 `5% → 25% → 100%`로 점진 배포하고 오류율·startup crash·핵심 funnel을 관찰한다.
5. 즉시 rollback 절차와 이전 정상 update를 최소 1개 보존하고, embedded bundle로의 error recovery를 실기기에서 확인한다.
6. 게시 권한을 최소화하고 production publish는 2인 검토와 감사 로그를 적용한다.
7. update signing private key는 저장소 밖 KMS/비밀 저장소에 보관한다. End-to-end code signing이 필요하면 이를 지원하는 EAS Production 이상 요금제를 출시 비용에 반영한다.

#### 출시 전 검증 gate

- [ ] iOS/Android release build에 `expo-updates`, update URL, project ID, production channel, runtime version 포함
- [ ] preview channel OTA 설치 후 앱 재시작·핵심 검색 flow smoke test 통과
- [ ] 잘못된 update를 가정한 production rollback 리허설 통과
- [ ] native 변경이 포함된 update가 호환되지 않는 runtime에 전달되지 않음을 확인
- [ ] embedded bundle/error recovery 및 업데이트 서버 장애 시 앱 시작 확인
- [ ] production 게시 권한·2인 검토·감사 로그·signing key 보관 정책 확인
- [ ] Apple/Google 최신 정책 검토와 release checklist 기록

상세 판단·가격·정책 출처는 `FEATURE_INSIGHTS.md`의 **21. OTA 업데이트·릴리스 안전 전략**을 기준으로 한다.

---

## 5단계: macOS RN 개발환경 셋업 (이 맥북 최초 세팅)

### 5-1. 공통 도구

```bash
# Homebrew (없다면)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node (nvm 권장 - BE/FE 버전 분리 관리)
brew install nvm
nvm install 22        # Node 22 LTS
corepack enable       # pnpm 활성화

# Watchman (RN 파일 감시)
brew install watchman
```

### 5-2. iOS

```bash
# 1. App Store에서 Xcode 설치 (16.x 이상, 용량 큼 - 먼저 받아두기)
# 2. Command Line Tools 및 시뮬레이터 설정
xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
# Xcode 실행 → Settings → Platforms 에서 iOS 시뮬레이터 런타임 다운로드

# 3. CocoaPods (RN 0.86에서도 사용)
brew install cocoapods
```

### 5-3. Android

```bash
# 1. JDK 17 (Azul Zulu 권장)
brew install --cask zulu@17
# ~/.zshrc 에 추가:
#   export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# 2. Android Studio 설치
brew install --cask android-studio
# Android Studio 실행 → SDK Manager 에서:
#   - Android SDK Platform (최신 + RN 0.86 targetSdk 버전)
#   - Android SDK Build-Tools, Platform-Tools, Emulator, CMake/NDK

# 3. ~/.zshrc 에 추가:
#   export ANDROID_HOME=$HOME/Library/Android/sdk
#   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# 4. AVD Manager에서 에뮬레이터 하나 생성 (예: Pixel 8, 최신 API)
```

### 5-4. 실행 순서 (일상 개발 루프)

```bash
# 터미널 1: BE
cd OnMyWay_BE_V3
cp .env.example .env   # 최초 1회, 값 채우기
pnpm install
pnpm start:dev         # http://localhost:3005

# 터미널 2: FE Metro 번들러
cd OnMyWay_FE_V3
cp .env.example .env   # 최초 1회
npm install            # (또는 선택한 패키지 매니저)
npm start

# 터미널 3: 앱 빌드/실행
npm run ios            # iOS 시뮬레이터 (최초엔 cd ios && pod install 필요)
npm run android        # Android 에뮬레이터
```

> 로컬 개발에서는 `SERVER_PORT`만 BE `PORT`와 맞추면 되고, host는 `Platform.OS`로 자동 선택된다.
> 실기기나 원격 서버를 쓸 때만 `SERVER_BASEURL`에 전체 URL을 지정한다.
> `.env` 변경 후에는 Metro 캐시 리셋 필요: `npm start -- --reset-cache`

---

## 6. TODO (진행 상황 & 로드맵)

> 최종 갱신: 2026-08-15

### ✅ 완료 (Phase 0: 구조 정리 & 로컬 환경)

- [x] AUTH → `legacy/` 이동, 루트 README 갱신
- [x] FE의 AUTH 의존 코드 제거 (auth/favorites/history API, userState, 로그인 UI, 토큰 인터셉터)
- [x] Jenkinsfile 제거 (BE, AUTH)
- [x] BE: bcrypt / mongoose 미사용 의존성 제거 → 빌드 검증 완료
- [x] `.env.example` 작성 (BE, FE) + 로컬 `.env` 생성
- [x] macOS RN 개발환경 셋업 완료
  - watchman, Android cmdline-tools, SDK 34, NDK 25, CMake, AVD(omw_pixel/Pixel 7/API 34)
  - `~/.zshrc`에 ANDROID_HOME 설정, `android/local.properties` 생성
- [x] Android 디버그 빌드 성공 (`-PreactNativeArchitectures=arm64-v8a` 필수, Apple Silicon)
- [x] E2E 스모크 테스트: 에뮬레이터 앱 → BE(3001) 요청 도달 확인
  - Kakao API는 401 (플레이스홀더 키) — 실제 키만 넣으면 동작
- [x] Phase 0 변경사항 커밋 (`v3/phase0-restructure`)

### 🔜 즉시 (Phase 1: Google 개발 자격 증명·계약 준비)

- [x] 결제가 연결된 Google Cloud 프로젝트와 project ID 준비
- [x] Maps SDK for Android, Maps SDK for iOS, Places API (New), Routes API, Geocoding API 활성화
- [x] Android package name과 debug/Upload/Play App Signing certificate SHA-1 확정
- [x] iOS bundle ID와 Apple 개발 Team 설정 확정
- [x] 용도별 Google 키 3개 생성 및 제한
  - [x] `omw-android`: package + debug/Play App Signing SHA-1 application restriction, Maps SDK for Android만 허용
  - [x] `omw-ios`: bundle ID application restriction, Maps SDK for iOS만 허용
  - [x] `omw-server`: Places API (New)·Routes API·Geocoding API만 허용; 개발 중 localhost BE에서 사용하고 개발 완료 후 Railway Variables에 등록
- [x] Google Cloud budget alert 설정
- [x] API별 quota 상한 설정
- [x] `.env.example`을 Kakao/Google provider 변수로 갱신하고 실제 값은 로컬 `.env`에만 저장
- [ ] 한국 테스트 fixture 준비: 서울·수도권·지방·고속도로 경로 5개 이상, `맥도날드 dt`, `리뷰 좋은 간장게장집`, `주차 가능한 카페` 포함
- [ ] Places FieldMask를 Lean/Rich 단계로 정의하고 검색 세션당 예상 비용 상한 설정
- [ ] Google attribution, Places 저장·캐시 정책과 개인정보처리방침 반영 항목 검토
- [ ] 노출된 과거 시크릿 로테이션: RDS 비번, JWT 시크릿(legacy), Naver Client ID, TMAP 하드코딩 키, keystore 비번, App Center secret 폐기

> Kakao·TMAP·Naver 키는 첫 Google 버전 개발의 선행조건이 아니다. 후속 provider adapter 착수 시 별도 발급한다.

### 🔧 Phase 2: 기존 버전 리팩토링

업그레이드 전 시작한 동작 고정·provider 분리 작업을 계속 추적한다. BE toolchain 업그레이드는 완료되었으며 아래 미완료 항목과 독립적으로 유지한다.

- [ ] FE/BE 공통 코드 위생 정리
  - [x] 활성 FE/BE authored source의 `TODO`/`FIXME`/`HACK`/`TBU` marker를 전수 정리하고 실제 남은 작업을 이 문서의 완료 조건이 있는 backlog로 이동
  - [x] `console.log`/`console.debug`/`console.info`/`console.warn`/`console.error`, 임시 `Logger.debug`, request·response 전체 dump 제거
  - [x] 운영 HTTP 로그를 method·matched route·status·duration으로 제한
  - [ ] production/staging/development 환경별 Nest log level 정책 정의
  - [x] 토큰·API key·비밀번호·개인정보·정밀 위치정보 및 외부 API 전체 payload가 로그에 남지 않도록 request/adapter 로그 redaction
  - [x] FE/BE lint에 `no-console: error`를 적용하고 BE 운영 로그는 Nest `Logger`로 제한
- [ ] FE 리팩토링
  - [x] authored FE의 `@ts-nocheck`/`@ts-ignore`/`@ts-expect-error` 제거 및 실제 타입 오류 해결
  - [x] 죽은 코드 제거: CodePush/App Center native/package 설정, DeviceInfo 잔재 없음 확인, `TestScreen` 제거
  - [ ] api 레이어 정리: axiosDefault/axiosInstance 통합, 공통 에러 처리
  - [x] 컴포넌트 오타/네이밍 정리 (`mainBotttomSheet` → `mainBottomSheet`)
  - [ ] provider-neutral bounds/fit API를 추가해 거리별 zoom bucket과 반복 보정을 교체. Naver/Google 각각 short/long route, 0/1/2 waypoint, header·route-card padding, 사용자 camera 이동을 simulator/device에서 검증하면 완료
  - [ ] header transition/font/shadow, marker z-index, bottom-sheet place-name/parking badge, PlaceInput keyboard avoidance를 iOS/Android runtime matrix에서 확인하고 공통 style로 정리
  - [ ] 최근 장소 정렬·개별 삭제 UX와 변경 없는 검색 submit 생략 동작의 제품 기준을 정하고 구현
  - [x] hard-coded ANAM center를 제거하고 nullable center를 실제 위치 또는 route geometry로 초기화; 위치 실패 시 재시도 UI 제공
  - [ ] cold start·위치 거부·재시도와 두 renderer의 center/route camera를 실제 runtime에서 검증
- [ ] BE 리팩토링
  - [x] `AppModule`에 등록되지 않고 활성 `MapModule`로 대체된 legacy Kakao controller/service/DTO 제거
  - [x] 기존 Kakao geocoding/place/route/search-along-route 구현을 provider port와 `KakaoMapAdapter` 뒤로 이동하고 `MapService` 직접 의존 제거
  - [x] `RouteProvider`, `PlaceSearchProvider`, `RoutePlaceSearchProvider`, `GeocodingProvider` interface와 `ProviderId = GOOGLE | KAKAO | TMAP | NAVER` 도입
  - [x] `PlaceDetailProvider`와 provider-neutral 상세 모델 도입 (`GET /map/place-detail`, Google adapter + FE bottom sheet 보강 연결 완료)
  - [x] `ProviderContext`가 Accept-Language를 language/region/units context로 정규화하고 `MarketConfig`가 기능별 language provider와 좌표 기반 route provider 정책을 선언적으로 해석
  - [x] Google 호출을 `GoogleMapAdapter`로 격리하고 언어 기반 non-route resolver와 좌표 지역 기반 route resolver를 composition root에 등록
  - [x] `MapService`를 thin facade로 축소하고 `GetAddress`, `FindRoutes`, `SearchPlaces`, `SearchPlacesAlongRoute`, `GetPlaceDetails`, `CalculateDetour` use case로 분해
  - [x] 장소 모델에 `provider`, `provider_place_id`, 원본 attribution URL을 보존하고 place-detail optional field 상태를 `KNOWN | UNKNOWN | UNSUPPORTED`로 명시
  - [ ] FE 상세 UI에서 provider별 attribution 표시 규칙을 적용하고 Store/runtime 시각 검증
  - [ ] provider·locale·region·query·route fingerprint·FieldMask를 cache key에 포함해 향후 공급자 결과가 섞이지 않게 구성
  - [ ] 경로 검색·경로상 검색·우회시간 계산 contract test를 provider-neutral suite로 만들고 Kakao/Google adapter에 적용
  - [x] Kakao category group code를 literal union으로 제한하고 DTO Swagger enum/validation에 연결
  - [ ] 경로상 검색 vertex sampling을 road class·geometry 기반으로 개선하고 정확도·요청 수·quota budget으로 검증
  - [ ] Kakao route option과 좌표 문자열 모델을 provider input/compiler로 통합
  - [ ] 빈 config 파일 정리 (development.json / production.json)
  - [ ] README 재작성 (TBU 제거, 실제 셋업/실행 문서화)
- [ ] 제거·격리 확정 기능
  - [x] OpenAI 리뷰 요약 endpoint·UI·환경변수·의존성 제거
  - [ ] Kakao Place 웹 내부 endpoint 직접 호출을 앱 UI와 핵심 use case에서 제거
  - [ ] 기존 크롤링 코드를 보존해야 한다면 `LegacyKakaoWebEnricher` adapter로 격리하고 production 기본 비활성·kill switch·짧은 timeout·무결과 fallback 적용
  - [ ] `LegacyKakaoWebEnricher` 실패가 장소 검색·경로 검색을 실패시키지 않게 하고, 약관 검토와 안정성 gate를 통과하기 전 사용자 선택 provider로 노출 금지
  - [ ] Kakao 상세 화면은 공식 `place_url` WebView/외부 링크를 기본 fallback으로 사용하고 크롤링 결과를 필수 데이터로 간주하지 않음
- [ ] 잠금파일 정리: FE는 yarn.lock만 유지(pnpm-lock 삭제), BE는 pnpm 유지

### 🚀 Phase 3: 버전 업그레이드 + provider-neutral vertical slice

- [x] BE: NestJS `11.1.28`, Node `22.13.0`, Express `5.2.1`, TypeScript `5.9.3` 전환; wildcard routing·Swagger schema·기존 unit/e2e 복구 검증
- [ ] Google adapter 구현
  - [x] Text Search·Search Along Route (Places API New; Autocomplete는 후속)
  - [x] Routes 기본·짧은 거리·경유 경로와 encoded polyline (단, 한국 driving 미지원으로 현재 비활성)
  - [x] Geocoding reverse geocoding
  - [x] `ko`/`KR`/`METRIC` 고정과 Lean FieldMask 적용 (`MarketConfig` 주입은 후속)
  - [x] stopby 후보별 waypoint 경로 재계산으로 `+N분` 계산 (현재 Kakao route로 동작)
  - [x] Google HTTP/geocoding 오류를 quota·authentication·timeout·unavailable·invalid response 공통 code로 정규화하고 raw upstream message/payload 비노출
  - [x] route 필수 duration/distance/polyline 누락을 `MAP_PROVIDER_INVALID_RESPONSE`로 처리하고 좌표 없는 place 결과 제외
  - [x] place detail optional 영업시간·rating·rating count·parking 누락을 `null`(UNKNOWN)로 보존
  - [x] provider-neutral 장소 모델에 필드별 `KNOWN | UNKNOWN | UNSUPPORTED` 상태와 attribution을 명시
- [x] 언어 기반 provider 선택
  - [x] 최초 설치 후 첫 실행에서 기기 locale(`ko*`/그 외)로 앱 언어를 정해 AsyncStorage에 저장하고, 이후 드로어 수동 선택값을 유지
  - [x] FE 공통 client가 저장된 앱 언어를 `Accept-Language`로 전송
  - [x] 한국어(`ko`/`ko-*`)는 Kakao 주소·장소·경로상 검색 사용
  - [x] 그 외(현재 UI는 영어 `en`)는 Google 주소·장소·경로상 검색 사용
  - [x] route/stopby는 언어와 분리해 한국 좌표 하나 이상이면 Kakao only, 모두 해외면 Google only로 선택하고 provider fallback 제거
  - [x] Google adapter의 Geocoding·Places·Routes 언어를 request context로 전달
  - [x] 사용자 provider 직접 선택 UI 대신 앱 언어 선택과 사용 provider 안내 제공
  - [x] use case(`MapService`)는 non-route 언어 resolver와 좌표 지역 기반 route resolver에 위임
  - [x] 지도 타일 renderer를 드로어 `지도 설정`으로 선택(국내 지도=Naver, 구글맵=react-native-maps Google provider). 최초 앱 언어 기본값을 저장하고 이후 수동 선택을 유지하며, 앱 언어를 수동 변경할 때만 새 언어 기본값으로 재설정
- [ ] Google 한국 품질 gate
  - [ ] 서울·수도권·지방·고속도로에서 경로·POI·Search Along Route 정확도 확인
  - [ ] 주차·현재/정규 영업시간·평점의 fill rate와 `UNKNOWN` 비율 계측
  - [ ] `맥도날드 dt`, `리뷰 좋은 간장게장집`, 다국어 query의 precision·비용·p95 측정
- [ ] FE: RN 0.73.6 → 0.86.x — native compile/runtime/OTA gate 진행 중
  - [x] RN `0.86.2`, React `19.2.3`, New Architecture/Hermes와 Android/iOS 최신 native template 이식
  - [x] 기존 CodePush/App Center package·wrapper·native 설정·키 제거
  - [x] Expo SDK 57/`expo-updates` exact dependency, EAS project/update URL, Android/iOS native client 연결
  - [x] EAS `development`/`preview`/`production` profile의 environment/channel 매핑과 Android Preview cloud build 확인
  - [x] local/cloud fingerprint 차이로 fingerprint 정책을 폐기하고 명시적 `runtimeVersion` `2.1.2-17` 적용
  - [x] 기존 Play Upload Key를 EAS Android default credential로 등록하고 새 Preview APK와 Production AAB signer 일치 확인
  - [x] Android Production AAB를 `production` environment/channel·runtime `2.1.2-17`로 생성하고 embedded Railway origin 확인
  - [x] candidate 17에는 end-to-end update signing을 구성하지 않기로 결정
  - [ ] OTA 게시 권한을 최소화하고 production publish에 2인 검토 적용
  - [ ] Preview/Production 크래시 리포팅 구축
    - [ ] Sentry React Native SDK 또는 동등한 서비스의 RN 0.86/Expo 57 호환 exact version을 선정하고 AppCenter를 복원하지 않은 채 Android/iOS에 연결
    - [ ] `preview`/`production` environment와 app version/build, platform, EAS channel/runtime/update ID를 tag하되 실제 project identifier와 update URL은 전송하지 않음
    - [ ] 처리되지 않은 JS/native crash, React error boundary, 필요한 handled exception을 수집하고 alert 기준과 담당자 대응 runbook 정의
    - [ ] 정밀 위치·전체 경로·검색어 원문·API key·Authorization header·외부 API 전체 payload를 `beforeSend`/breadcrumb에서 제거하고 Session Replay·screenshot은 초기 비활성
    - [ ] Store build마다 iOS dSYM과 Android R8 mapping/native symbols를 보존·업로드하고, 모든 OTA update의 source map을 동일 release/update에 연결
    - [ ] Preview 실제 기기에서 식별 가능한 비치명 test error와 통제된 crash를 각각 1회 발생시켜 원본 파일/줄 symbolication, environment 분리, alert 수신 확인
    - [ ] TestFlight crash feedback, Play Console Android vitals와 Sentry event를 release checklist에서 교차 확인하고 production 모니터링 gate로 사용
  - [x] Android release embedded bundle 확인
  - [ ] iOS Release embedded bundle과 양 플랫폼 업데이트 서버 장애·startup error recovery 검증
  - [ ] preview → production OTA smoke test와 rollback 리허설 통과
  - [x] provider-neutral `MapRenderer` abstraction에 Naver/Google renderer 연결
  - [x] renderer 선택과 Kakao/Google 데이터 API provider 정책 분리
  - [ ] 검색 submit 계약을 입력 방식과 분리해 첫 vertical slice의 text 입력과 후속 `VOICE` transcript가 동일한 자유 텍스트 검색 파이프라인을 사용
  - [x] 설정 화면은 데이터 provider 직접 선택 대신 앱 언어와 독립적인 지도 renderer 선택만 제공
  - [x] NativeWind 4, React Navigation 7, Reanimated 4/Worklets, Recoil package 제거 후 Zustand facade로 이식
  - [x] iOS minimum deployment target `16.4` 정렬, Expo Pod/workspace/scheme/plist 검증 및 unsigned generic simulator `xcodebuild` compile
  - [ ] iOS simulator/device runtime smoke
  - [x] Android debug APK/release AAB local build
  - [x] fresh release manifest/AAB metadata 확인: 기존 Store identity, `2.1.2 (17)`, min SDK 24, target SDK 36, Expo update metadata·embedded bundle·fingerprint asset 포함
  - [ ] Android/iOS device 핵심 flow runtime smoke
- [ ] **출시 gate: 위 OTA 항목이 완료되지 않으면 첫 프로덕션 바이너리 제출 금지**
- [ ] iOS/Android 핵심 플로우 테스트: 검색, 경로, 경로상 장소, 주차, 현재 영업 여부, 영업시간, 우회시간

### ✨ Phase 4: V3 제품·회원·멤버십 기능

- [ ] 회원 기반 구축
  - [ ] 로그인 없이 첫 검색까지 가능한 guest mode
  - [ ] 경로·profile 저장 또는 결제 시점의 progressive registration
  - [ ] Sign in with Apple, Google, email magic link 지원 후보 검증
  - [ ] 가족·반려동물·차량 profile, 즐겨찾기, 최근 경로, 기기 간 sync
  - [ ] access/refresh token rotation, 세션·기기 관리, rate limit과 보안 이벤트 기록
  - [ ] 앱 내 계정 삭제, web 삭제 요청, 데이터 내보내기와 보관기간 정책
- [ ] entitlement·결제 기반 구축
  - [ ] `FREE`, `PLUS`, `TRIP_PASS` entitlement를 서버의 단일 기준으로 관리
  - [ ] iOS StoreKit/App Store와 Google Play Billing 상품 구성
  - [ ] 구매 복원, 영수증/transaction 서버 검증, webhook·스토어 알림 동기화
  - [ ] 중복 webhook idempotency, 환불·취소·만료·grace period·결제 재시도 처리
  - [ ] 지역별 상품 ID·통화·가격·세금·스토어 수수료와 entitlement 매핑
  - [ ] 카드정보를 직접 저장하지 않고 디지털 기능은 출시 지역의 최신 스토어 정책 준수
- [ ] 구독·상품 실험
  - [ ] Plus Monthly/Annual, 7일 Trip Pass 상품과 market별 가격 실험
  - [ ] 첫 valid result와 navigation handoff 전에는 paywall을 노출하지 않는 원칙
  - [ ] trial·intro offer·creator code·referral reward와 구매 복원 UX
  - [ ] 사용자별 AI/rich search quota, 초과 시 Free 검색 fallback
  - [ ] paywall view → trial → paid → renewal → cancel cohort와 contribution margin 계측
- [ ] Provider-neutral 지도·장소·경로 공통 엔진 유지
  - [x] Kakao/Google adapter를 공통 port 뒤에 두고 앱이 provider 원본 DTO를 알지 않게 구성
  - [ ] TMAP/Naver 등 후속 adapter는 동일 port와 contract suite를 통과한 뒤 feature flag로 추가
  - [ ] 외부 내비게이션 handoff는 Google Maps부터 구현하고 Apple Maps·Waze·TMAP·Kakao를 후속 target으로 분리
- [ ] 광고 확장 기반
  - [ ] `AdProvider` port와 no-op adapter 도입. 첫 vertical slice에는 실제 광고 SDK를 설치하지 않음
  - [ ] `HOME_BOTTOM_BANNER`, `RESULTS_INLINE_BANNER`, `PLACE_DETAIL_BANNER`, `POST_SEARCH_INTERSTITIAL` placement 정의
  - [ ] `AdPolicy`에 entitlement·동의·활성 주행 여부·frequency cap·remote kill switch 반영
  - [ ] 광고 SDK를 화면에서 직접 호출하지 않고 placement component와 adapter로 격리
  - [ ] `ad_request/load/impression/click/close/fail`과 검색·navigation funnel을 함께 계측
  - [ ] 활성 주행·권한·오류·복구 화면에는 배너/전면 광고를 노출하지 않음
  - [ ] Free 광고와 Plus/Trip Pass 광고 제거 정책을 remote config로 제어
- [ ] Free 구조화 검색
  - [ ] 원문을 `SearchIntent`로 변환한 뒤 provider capability에 맞는 query·filter로 compile
  - [ ] 초기 Google compiler: `textQuery`, `openNow`, `parkingOptions`, Search Along Route, `routingSummaries`
  - [ ] 지원하지 않거나 비어 있는 속성은 `UNKNOWN`으로 반환하고 확인되지 않은 값을 `false`로 바꾸지 않음
- [ ] 음성 인식 검색 입력
  - [ ] `SearchInputSource = TEXT | VOICE`와 공통 submit 계약을 정의해 음성 transcript도 기존 자유 텍스트 `SearchIntent` 파이프라인으로 전달
  - [ ] iOS·Android 시스템 음성 인식과 cloud STT 후보를 정확도·지연·비용·오프라인 지원·개인정보 기준으로 비교하고 `SpeechRecognitionAdapter` 뒤에 격리
  - [ ] 검색창 microphone 진입점과 `IDLE | LISTENING | PROCESSING | REVIEW | ERROR` 상태, 중지·취소·재시도 UX 구현
  - [ ] 인식 transcript를 검색 전에 표시해 사용자가 수정·확인할 수 있게 하고 오인식으로 인한 불필요한 Places 요청 방지
  - [ ] 앱·기기 locale을 기본 인식 언어로 사용하되 한국어·영어·일본어와 다국어 브랜드명 입력 검증
  - [ ] microphone·speech recognition 권한은 기능 사용 시점에 요청하고 거부·제한·미지원 시 텍스트 검색을 항상 유지
  - [ ] 원본 음성을 기본 저장하지 않고 transcript·정밀 위치·권한 상태가 analytics와 일반 로그에 원문으로 남지 않도록 개인정보·보관 정책 적용
  - [ ] permission request/result, recognition success/failure, transcript edit, search submit은 원문 없는 이벤트로 계측하고 STT 비용·p95 latency·오인식률 관찰
  - [ ] 활성 주행 중 화면 조작을 유도하지 않고, 완전 hands-free·CarPlay·Android Auto는 별도 안전성·플랫폼 정책 gate로 분리
  - [ ] native module이 필요하면 OTA로 추가할 수 없으므로 SDK 포함 store binary와 권한 문구를 사전 준비하고 remote feature flag·kill switch 적용
- [ ] Plus `AI Route Assistant`
  - [ ] 자연어 다중 조건 → Free와 동일한 provider-neutral `SearchIntent`로 변환
  - [ ] 가족·반려동물·EV profile, 조건 자동 완화, 복수 경로 비교
  - [ ] Google Maps Grounding Lite MCP는 Google provider의 탐색형 흐름에만 사용하고 기본 검색과 중복 호출하지 않음
- [ ] Trip Pass: 다중 경유지·여행 일정·영업시간/날씨 기반 재계획 후보 검증
- [ ] 검색 결과 개인화·우회시간 ranking 개선
- [ ] 즐겨찾기·profile cloud sync 후보 검증
- [ ] 사용자별 quota, rate limit, 검색당 API 원가 계측과 graceful fallback 구현

### 🌏 Phase 5: 한국/글로벌 투트랙 출시·사용자 획득

공통 코드베이스와 검색 엔진을 유지하고 `KR`과 `GLOBAL_EN` 시장 설정만 분리한다. 글로벌은 전 세계 동시 출시가 아니라 영어권 beachhead 1개부터 시작한다.

- [ ] 시장 설정(`MarketConfig`) 도입
  - [ ] locale, region code, metric/imperial, 통화, 시간대, 주소 형식
  - [ ] 주소·장소·경로상 검색의 언어별 provider와 route/stopby의 좌표 지역별 provider를 기능별 정책으로 선언
  - [ ] 현재 정책을 `ko → KAKAO`, `en → GOOGLE`, `한국 좌표 포함 route → KAKAO`, `모두 해외 route → GOOGLE`, `fallback 없음`으로 표현
  - [ ] provider contract·품질·약관 gate와 무관한 `AUTO`나 사용자 provider 선택은 노출하지 않음
  - [ ] 검색 속성 label·alias, navigation target, provider별 attribution·상세 링크
  - [ ] Free/Plus/Trip 상품 ID·지역 가격·광고 placement·feature flag
- [ ] 한국어/영어 검색과 응답 검증
  - [ ] `ko-KR`/`KR`/`METRIC`
  - [ ] 선택한 영어권 locale/region/units
  - [ ] 주차·영업정보 누락을 `UNKNOWN`으로 일관되게 표시
- [ ] 시장별 출시 자산
  - [ ] 한국어·영어 landing page와 분리된 beta waitlist
  - [ ] 시장별 App Store/Play Store 설명·스크린샷·ASO 키워드
  - [ ] 10~15초 실제 route demo와 Free/Plus/Trip fake-door
- [ ] Closed beta
  - [ ] KR 100명: 가족·반려동물·장거리 운전자
  - [ ] GLOBAL 100명: 선택한 beachhead의 family/pet road-trip 사용자
  - [ ] 시장별 인터뷰, valid result, navigation handoff, D7/D30 반복 사용 측정
- [ ] Product-led acquisition
  - [ ] 주차·영업·추가 우회시간이 표시된 공유 route card
  - [ ] web preview → 앱 설치 → 기존 route/search intent 복원 deep link
  - [ ] 동승자 공유·투표와 referral attribution 후보 검증
- [ ] Organic acquisition
  - [ ] 한국 자동차·캠핑·육아·반려동물 커뮤니티와 micro creator beta
  - [ ] 글로벌 road-trip·family·pet·RV 커뮤니티와 micro creator beta
  - [ ] 문제 해결형 short-form 콘텐츠와 creator referral code 운영
- [ ] Monetization validation
  - [ ] Plus Monthly와 7일 Trip Pass 가격 실험
  - [ ] 주차·예약·렌터카 제휴 전환 실험
  - [ ] Free cohort에서 banner/interstitial placement·frequency A/B test와 검색 완료율·retention 영향 측정
  - [ ] 광고 순수익에서 Google API 원가를 차감한 세션 contribution margin 측정
  - [ ] B2B API/SDK 유료 PoC 병행
- [ ] 시장별 analytics·원가 관리
  - [ ] acquisition → valid result → 선택 → navigation handoff → 반복 사용 → 결제 funnel
  - [ ] CAC, API 원가, retention, contribution margin을 한국/글로벌 cohort로 분리
  - [ ] retention 확인 전 broad app-install 광고 금지, high-intent 키워드부터 소액 검증
- [ ] 출시 전 privacy/legal 준비
  - [ ] 위치·경로 데이터 최소 수집, 보관 기간, 삭제, 동의 정책
  - [ ] 한국 PIPA 및 선택 시장의 GDPR/CCPA 등 적용 범위 검토
  - [ ] Google attribution·Places 데이터 저장/표시 정책 검증
- [ ] beta 지표와 contribution margin 통과 후에만 다음 국가 확장
- [ ] 배포/CI-CD 재구축
  - [ ] store release pipeline: native 변경 감지, 서명된 iOS/Android build, 스토어 심사·단계적 출시
  - [ ] OTA publication pipeline: preview 자동 게시 → smoke test → 승인된 production promotion
  - [ ] production OTA는 5% → 25% → 100% 점진 배포와 오류율 gate 적용
  - [ ] update·runtimeVersion·binary build 간 추적 가능한 release metadata와 감사 로그 보존
  - [ ] 긴급 rollback 담당자·권한·runbook과 이전 정상 update 보존 정책 확정
- [ ] **첫 프로덕션 출시 최종 gate**
  - [ ] Maps SDK for Android, Maps SDK for iOS, Places API (New), Routes API, Geocoding API 각각의 production 할당량을 예상 peak·오류 재시도·남용 시나리오 기준으로 검토하고 승인
  - [ ] Google Maps Platform SKU별 실사용량·예상 월 청구액·무료 사용분을 재산정하고 Billing budget/threshold/알림 수신자 및 비용 이상 대응 runbook을 검증
  - [ ] quota는 프로젝트 단위 비용 안전장치이고 budget alert는 지출을 자동 차단하지 않음을 release 승인자가 확인
  - [ ] 실제 release build에서 preview → production OTA 수신 확인
  - [ ] iOS/Android 각각 rollback 및 embedded bundle fallback 리허설 통과
  - [ ] native 변경은 OTA가 아닌 새 store build로만 배포됨을 CI에서 검증
  - [ ] Apple/Google 최신 정책·개인정보·signing key·production 게시 권한 검토 완료

### 🤝 Phase 6: Route-commerce·전략적 파트너십

Airbnb·Tripadvisor 같은 특정 인수자에 맞춘 기능을 만드는 대신, 어느 여행 플랫폼에도 통합할 수 있고 독립 매출도 발생하는 여행 실행 엔진을 구축한다.

- [ ] `TripContext` 도입
  - [ ] 숙소 체크인·체크아웃, 렌터카 수령·반납, 예정 체험 시간을 경로 조건에 반영
  - [ ] 동행자·아이·반려동물·짐·차량 profile과 일정 제약 처리
- [ ] 장소 발견을 예약 가능한 행동으로 연결
  - [ ] 주차·체험·식당·충전 중 1~2개 inventory 파트너 integration
  - [ ] 노출 → 선택 → 예약 완료 → navigation handoff end-to-end attribution
  - [ ] 일정의 빈 시간과 영업/예약 슬롯을 만족하는 itinerary insertion
- [ ] 파트너 플랫폼
  - [ ] 소비자 앱과 동일한 엔진의 REST API/SDK 제공
  - [ ] 렌터카·여행 일정·숙박 파트너용 설정·사용량·전환 dashboard
  - [ ] 최소 2~3개 유료 PoC와 복수 파트너에서 재사용 가능한 계약·SLA 검증
- [ ] 전략적 가치 검증
  - [ ] 파트너 A/B test로 순증 예약·전환율 상승 증명
  - [ ] route-intent와 ranking 자산을 Google 원본 데이터와 분리
  - [ ] provider·partner 한 곳에 종속되지 않는 architecture 유지
- [ ] 실사 준비
  - [ ] 코드·디자인·데이터·모델 IP 소유권과 오픈소스 라이선스 inventory
  - [ ] third-party API 약관, 개인정보 동의·삭제·보관 정책, 시크릿 관리 점검
  - [ ] 시장·provider·partner별 unit economics와 실험 기록 유지
- [ ] 소규모 integration → 공동 PoC → 사업개발/전략적 투자 순으로 관계를 만들고, 독립 반복 매출과 복수 선택지가 생긴 뒤에만 M&A 검토

### 🧭 Phase 7 후보: 여행계획·다일 동선 플랫폼

> 조건부 확장이다. 현재 route-stop 핵심 제품의 반복 사용과 거래 전환을 먼저 검증하며, 범용 AI 일정 생성기가 아니라 실제 이동·영업·예약 제약을 만족하는 실행 가능한 계획을 만든다.

- [ ] Phase 진입 gate
  - [ ] 핵심 persona D30 반복 사용 ≥ 20%
  - [ ] 경로 저장·공유·다중 경유 요청이 반복적으로 관찰됨
  - [ ] navigation handoff와 Trip Pass/예약 전환의 수요 확인
  - [ ] 한국과 영어권 beachhead에서 장소·경로 데이터 품질 기준 통과
- [ ] Trip domain 도입
  - [ ] `Trip`, `DayPlan`, `ItineraryItem`, `RouteSegment`, `Reservation`, `Constraint`, `TravelerGroup` 모델
  - [ ] 날짜·시간대·숙소·이동수단·예산·동행자·영업시간·예약 슬롯 제약
  - [ ] 초안/예약됨/여행 중/완료 상태와 변경 이력
- [ ] 단계적 제품 확장
  - [ ] 당일 다중 경유지와 최적 방문 순서
  - [ ] 숙소를 기준으로 한 일자별 route cluster와 multi-day itinerary
  - [ ] 공동 편집·투표·초대·비용 분담 후보
  - [ ] 날씨·교통·휴무·지연에 따른 여행 중 재계획
  - [ ] 예약 confirmation import와 calendar/export 후보
- [ ] 신뢰성과 비용 제어
  - [ ] AI 생성 결과를 영업시간·이동시간·예약 가능성으로 deterministic validation
  - [ ] 불가능한 일정과 데이터 `UNKNOWN` 명시, 자동 변경 전 사용자 승인
  - [ ] trip별 Google/LLM 비용 budget, lazy calculation, 캐시·재계산 정책
- [ ] 여행계획 BM 실험
  - [ ] Free: 제한된 trip/day/waypoint와 기본 공동 편집
  - [ ] Trip Pass: 한 여행의 multi-day 계획·실시간 재계획·offline/export
  - [ ] Plus: 연중 여러 여행, profile·협업·자동화·cloud history
  - [ ] 숙소·체험·렌터카·주차·식당 예약 affiliate/commission
  - [ ] 여행사·렌터카·숙박·관광 플랫폼용 itinerary API/SDK와 white-label
  - [ ] sponsored 결과는 조건을 충족한 경우에만 명확히 표시
- [ ] 전략적 가치·exit 검증
  - [ ] trip graph와 constraint/replanning engine을 provider 원본 데이터와 분리
  - [ ] 계획 → 예약 → 이동 → 현장 행동의 end-to-end attribution
  - [ ] OTA·Experiences·road-trip·렌터카·지도/차량 플랫폼별 integration PoC
  - [ ] 파트너의 예약 attach rate·체류 중 소비·재방문 상승을 A/B test로 증명

이 Phase의 상세 제품 범위, BM, 리스크 및 exit 옵션은 `FEATURE_INSIGHTS.md`의 **19. 여행계획·동선 플랫폼 확장 후보**를 기준으로 한다.

상세 포지셔닝, 채널, funnel 및 초기 gate는 `FEATURE_INSIGHTS.md`의 **16. 한국/글로벌 투트랙 제품 및 Go-to-Market 전략**을 기준으로 한다. 전략적 인수 가능성과 exit-ready 제품 조건은 **17. Airbnb·Tripadvisor 등 전략적 인수 가능성과 Exit-ready 제품 전략**을, 회원·결제·커뮤니티 획득 전략은 **18. 회원 기반·커뮤니티 주도 사용자 획득 전략**을 기준으로 한다.

---

## 7. Bare React Native → EAS Update 검토

> 검토일: 2026-08-04
> 결론: **도입 가능**. Expo managed workflow나 Expo Go로 전환할 필요는 없다. 기존 bare native 프로젝트에 Expo Modules와 `expo-updates`를 설치할 수 있다. 다만 현재 CodePush native integration과 동시에 사용할 수 없으며, EAS Update가 포함된 새 Android/iOS 바이너리를 먼저 배포해야 한다.

### 7-1. 현재 FE 상태

`OnMyWay_FE_V3`는 React Native Community CLI 기반 bare 프로젝트다.

- React Native `0.73.6`, React `18.2.0`
- `android/`, `ios/`를 직접 관리
- `AppRegistry.registerComponent` 엔트리
- `expo`, `expo-modules-core`, `expo-updates`, EAS project config 없음
- Android Hermes 활성화, New Architecture 비활성화
- TMap 수동 native package와 Naver iOS Pod 등 custom native code 존재

Bare 구조 자체는 EAS Update의 제약이 아니다. Expo 공식 문서는 기존 React Native 프로젝트에 `expo-updates`를 설치하는 경로를 제공한다.

- [기존 React Native 앱에 expo-updates 설치](https://docs.expo.dev/bare/installing-updates/)
- [EAS Update 시작하기](https://docs.expo.dev/eas-update/getting-started/)
- [기존 native 앱 통합](https://docs.expo.dev/eas-update/integration-in-existing-native-apps/)

### 7-2. 현재 CodePush 상태

JS 레벨에서는 `CodePush(App)` wrapper가 주석 처리되어 있지만, native release bundle loader는 여전히 CodePush를 사용한다. 따라서 CodePush가 완전히 제거된 상태가 아니다.

현재 확인된 연결:

- `package.json`: `react-native-code-push`, AppCenter 패키지와 release script
- Android `settings.gradle`: `react-native-code-push` project include
- Android `app/build.gradle`: `codepush.gradle`
- Android `MainApplication.kt`: `CodePush.getJSBundleFile()`
- Android resources: CodePush deployment key
- iOS Pods: CodePush·AppCenter
- iOS `AppDelegate.mm`: release에서 `[CodePush bundleURL]`
- iOS `Info.plist`: CodePush deployment key
- iOS AppDelegate: AppCenter Analytics·Crashes 등록

CodePush와 `expo-updates`가 동시에 release JS bundle 위치를 결정하게 해서는 안 된다. EAS 전환 시 위 연결을 전부 제거하고 `expo-updates`를 유일한 OTA loader로 둔다.

저장소에 노출된 기존 CodePush/AppCenter key는 이미 공개된 값으로 간주해 폐기·회전 대상으로 관리한다.

### 7-3. 권장 도입 시점

현재 RN 0.73 프로젝트에 과거 Expo SDK 조합을 임시로 넣었다가 다시 RN 0.86으로 올리는 이중 마이그레이션은 권장하지 않는다.

권장 순서:

```text
1. 현재 V2 동작 characterization test
2. CodePush/AppCenter 제거
3. RN 0.86 새 bare template로 src 이식
4. Expo SDK 57 / Expo Modules 통합
5. expo-updates와 EAS project 구성
6. development/preview build에서 update 검증
7. EAS Update runtime을 포함한 새 store binary 배포
8. 이후 JS·asset 변경을 EAS Update로 배포
```

2026-07-29 기준 Expo SDK 57은 React Native 0.86과 React 19.2.3을 대상으로 한다. 현재 V3 목표와 일치한다. RN 0.82 이후 New Architecture는 항상 활성화되므로 RN 0.86 전환 전에 모든 native library의 New Architecture 호환성을 확인한다.

- [Expo SDK 57 / React Native 버전 매핑](https://docs.expo.dev/versions/v57.0.0)
- [Expo Modules를 RN 0.86에 설치](https://docs.expo.dev/bare/installing-expo-modules/)
- [Expo New Architecture 안내](https://docs.expo.dev/guides/new-architecture/)

### 7-4. 목표 구조

```text
React Native 0.86 bare app
  ├─ android/·ios/ 직접 관리
  ├─ custom native modules / Google Maps bridge
  ├─ Expo SDK 57 modules
  ├─ expo-updates
  └─ EAS Update
       ├─ preview channel
       └─ production channel
```

- Expo Go는 사용하지 않는다. custom native module이 포함된 development build를 사용한다.
- EAS Build는 필수는 아니지만 credentials·channel·build profile 관리 편의를 위해 권장한다.
- 로컬 Xcode/Gradle로 만든 store binary도 `expo-updates` native 설정이 포함되어 있으면 EAS Update를 받을 수 있다.
- CNG/prebuild로 전환할 필요는 없다. 초기에는 bare native files를 계속 관리한다.

### 7-5. 설치·구성 상태와 다음 gate

2026-08-14 실제 확인 결과:

- 사용자가 EAS CLI 로그인을 완료했고, 기존 Expo cloud project를 FE local project에 연결했다. 실제 identifier, credential, token, update URL은 문서·채팅에 기록하지 않는다.
- `install-expo-modules@0.16.0` 자동 installer가 RN `0.86.2`를 인식하지 못해 Expo SDK 57 manual bare integration을 적용했다.
- exact dependency `expo 57.0.12`, `expo-updates 57.0.13`, `babel-preset-expo 57.0.0`, Reanimated/Worklets 호환 버전을 설치하고 Metro·Babel·Android·iOS native 설정을 연결했다.
- 사용자가 iOS minimum `16.4`를 승인했고 app/test/Pods target을 정렬했다. RN prebuilt AppDelegate header 불일치는 `RCT_USE_PREBUILT_RNCORE=0` source fallback으로 해결했다.
- Android release AAB와 iOS unsigned generic simulator Debug compile이 성공했다. Android embedded bundle/fingerprint asset과 iOS `Expo.plist` 포함을 확인했다.

다음 실행 순서:

1. local Gradle/Xcode Store build에 `development`/`preview`/`production` channel을 공식 request header 방식으로 embed한다.
2. iOS Release 산출물의 embedded `main.jsbundle`과 update metadata를 확인한다.
3. preview release 설치에서 update download/restart, offline startup, update-server 장애, incompatible runtime rejection, rollback과 embedded recovery를 검증한다.
4. 실제 iOS/Android runtime에서 지도·검색·경로 flow와 Android API 35+ edge-to-edge를 확인한다.

EAS login·interactive credential 작업과 실제 OTA publish는 사용자가 로컬 terminal에서 직접 수행한다. production publish와 Store upload는 위 gate 전 수행하지 않는다.

React Native CLI 프로젝트는 Expo가 권장하는 root registration과 module name `main`을 Android/iOS에 함께 적용한다.

```ts
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
```

현재 SVG transformer·dotenv·NativeWind·Reanimated Metro/Babel 설정은 Expo 기본 설정으로 덮어쓰지 않고 병합한다.

app config 개념 예시:

```json
{
  "expo": {
    "name": "OnMyWay",
    "slug": "onmyway",
    "runtimeVersion": "<APP_VERSION>-<NATIVE_BUILD>",
    "updates": {
      "url": "https://u.expo.dev/<EAS_PROJECT_ID>"
    },
    "extra": {
      "eas": {
        "projectId": "<EAS_PROJECT_ID>"
      }
    }
  }
}
```

실제 project ID와 native request header/channel은 `eas init`·`eas update:configure` 결과를 사용하고 임의로 작성하지 않는다.

### 7-6. runtimeVersion 정책

EAS Update는 JS bundle과 native runtime의 호환성을 `runtimeVersion`으로 제한한다. native code와 맞지 않는 OTA를 보내면 startup crash가 발생할 수 있으므로 가장 중요한 안전장치다.

bare app에는 native dependency와 native file 변경을 감지하는 `fingerprint` policy를 우선 검토한다. 단순한 `appVersion` policy를 사용한다면 native 변경마다 앱 버전과 runtime을 확실히 올리는 운영 규칙이 필요하다.

- [Runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [EAS Update 동작 방식](https://docs.expo.dev/eas-update/how-it-works/)
- [CodePush에서 EAS Update로 마이그레이션](https://docs.expo.dev/eas-update/codepush/)

### 7-7. OTA 가능·불가능 범위

EAS Update 가능:

- JS/TS 로직
- React component·화면·스타일
- API 호출·feature flag
- JS bundle에 포함되는 이미지·폰트 등 asset
- native interface가 이미 바이너리에 포함된 범위의 동작

새 store build 필요:

- RN·Expo SDK 버전 변경
- native dependency 추가·업데이트
- Google Maps SDK/bridge 변경
- Android Manifest·Gradle·권한·intent 변경
- iOS Pod·Info.plist·entitlement·capability 변경
- 앱 아이콘·launch screen 등 native resource 변경
- native API surface가 달라지는 변경

OTA로 앱의 핵심 목적을 바꾸거나 스토어 검토를 우회하지 않는다. 각 스토어의 최신 정책 범위 안에서 bug fix와 기존 기능의 JS·asset 업데이트에 사용한다.

### 7-8. channel·환경 전략

```text
development
  custom development build, 로컬 Metro 중심

preview
  내부 QA용 binary + preview channel

production
  Store binary + production channel
```

- preview에서 Android/iOS smoke test를 통과한 update만 production으로 승격한다.
- API endpoint·Google project·analytics 환경을 channel에만 암묵적으로 의존시키지 않고 명시적 build profile/config로 분리한다.
- `.env` 값은 JS bundle에 들어갈 수 있으므로 서버 key나 비밀값을 넣지 않는다.
- 서버용 Google Places·Routes key는 계속 BE에만 둔다.
- production은 staged rollout·rollback 절차와 crash monitoring을 준비한다.
- 종료된 AppCenter Analytics/Crashes 대체 관측 도구는 별도로 선정한다.

### 7-9. 최초 전환의 중요한 제한

기존 CodePush 기반 바이너리는 EAS Update를 이해하지 못한다. 따라서:

1. CodePush/AppCenter를 제거하고 `expo-updates`가 포함된 앱 버전을 Store에 제출한다.
2. 사용자가 해당 버전으로 업데이트한다.
3. 그 버전부터 EAS Update를 받을 수 있다.

기존 설치 사용자에게 EAS Update를 직접 보낼 수는 없다. 최초 전환은 반드시 native binary release가 필요하다.

### 7-10. 검증 체크리스트

- [ ] Android debug/development build가 Metro로 실행됨
- [ ] Android preview release가 embedded bundle로 첫 실행됨
- [ ] Android preview channel OTA 다운로드·재시작·rollback 검증
- [ ] iOS development/preview에서 동일 검증
- [ ] offline 상태에서 마지막 정상 bundle로 시작
- [ ] 잘못된 runtime update가 대상 binary에 전달되지 않음
- [ ] JS error·asset 누락 시 fallback 동작 확인
- [ ] production staged rollout과 긴급 rollback runbook 작성
- [ ] sourcemap 업로드와 release별 crash 추적
- [ ] CodePush/AppCenter native 참조·key·script·Pod 완전 제거 확인

---

## 8. 로컬 개발 실행 치트시트

```bash
# 터미널 1: BE (포트 3005 — 3000·3001은 다른 로컬 프로젝트가 점유)
corepack pnpm --dir OnMyWay_BE_V3 run start:dev

# 터미널 2: 에뮬레이터
$ANDROID_HOME/emulator/emulator -avd omw_pixel

# 터미널 3: Metro
cd OnMyWay_FE_V3 && npx react-native start   # .env 변경 시 --reset-cache

# 터미널 4: 빌드/설치 (Apple Silicon은 arm64 플래그 필수)
cd OnMyWay_FE_V3/android
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.omw.omw_front/.MainActivity
```

- FE `.env`: `SERVER_PORT=3005`만 설정하면 iOS/Android 모두 자동 동작 (`SERVER_BASEURL`은 비워둠)
- BE Swagger: `http://localhost:3005/docs` (basic auth 값은 BE `.env`의 `SWAGGER_USER`/`SWAGGER_PASSWORD` 참조)

---

## 9. 개발 착수 기준과 사용자 준비 체크리스트

> 기준일: 2026-08-07. `FEATURE_INSIGHTS.md` 23장과 동기화된 현재 실행 기준이다.

### 9-1. 구현 범위 고정

```text
주소·장소·경로상 검색  ko=KAKAO, en=GOOGLE
route·stopby           한국 좌표 하나 이상=KAKAO only, 모두 해외=GOOGLE only
provider fallback      없음
지도 renderer          드로어 지도 설정에서 선택(기본: ko=Naver, en=Google)
BE adapters            KakaoMapAdapter + GoogleMapAdapter
장소 상세              BE `GET /map/place-detail` 구현(Google place id); FE 연결 후속
사용자 provider 선택   없음
광고 초기 구현         AdProvider port + no-op adapter + placement/event contract
OTA                     첫 production binary 전에 필수
```

다음 경계를 유지한다.

- controller는 provider 이름이 아니라 use case를 호출한다.
- use case는 provider port와 request-scoped resolver만 참조한다.
- provider request/response, FieldMask와 polyline 변환은 adapter 내부에 둔다.
- FE 화면은 특정 provider 네이티브 DTO를 전역 상태에 저장하지 않고 공통 view model을 사용한다.
- composition root에는 Kakao/Google adapter와 언어 기반 non-route resolver, 좌표 지역 기반 route resolver를 등록한다.
- 선택된 provider 실패 시 다른 provider로 조용히 fallback하지 않는다.
- 광고 화면은 SDK를 직접 import하지 않고 `AdSlot` → `AdProvider`로 호출한다.

### 9-2. 사용자가 지금 준비할 것

- [x] Google Cloud 프로젝트와 billing 연결
- [x] Maps SDK for Android/iOS, Places API (New), Routes API, Geocoding API 활성화
- [x] Android package, debug/Upload/Play App Signing SHA-1 확인
- [x] iOS bundle ID와 Apple Team 확인
- [x] Android/iOS/server 용도별 Google 키 제한 적용
- [x] Kakao Local·Mobility server key를 Git에서 제외된 BE 환경변수로 관리
- [x] API quota 상한 설정
- [ ] Google Cloud budget alert 설정
- [ ] 한국·해외 route와 혼합 waypoint geofence fixture 확정
- [ ] 자유 검색·Place Details 검증 query 목록 확정
- [ ] 키는 로컬 `.env` 또는 비밀 저장소에 넣고 문서·채팅·Git에는 값 자체를 남기지 않음

개발 착수에 아직 필요하지 않은 것은 TMAP/Naver 신규 API key, AdMob app/ad unit ID, production 광고 동의 플랫폼, Map ID와 cloud styling 설정이다. 후속 adapter·광고·지도 스타일링 task 직전에 준비한다. AdMob 등 native 광고 SDK는 OTA로 추가할 수 없으므로 production 실험에는 해당 SDK가 포함된 새 store binary가 필요하다.

### 9-3. 구현 순서

1. 좌표 geofence와 Kakao/Google route provider 선택 fixture 보존
2. 실제 외부 API와 시뮬레이터에서 Kakao 3-card partial success·priority label 검증
3. `PlaceDetailProvider`와 Google Place Details adapter 구현
4. Lean/Core/Rich FieldMask, fill-rate와 검색당 비용 gate 정의
5. provider-neutral `SearchIntent` parser와 query/filter compiler 구현
6. FE provider-neutral 장소 상세 view model 연결
7. RN 0.86 이식에서 `MapRenderer` abstraction과 목표 renderer 연결
8. EAS Update preview/production runtime·rollback 검증
9. 광고 no-op port·placement·event schema 추가
10. beta 계측 뒤 광고 SDK·provider 확장 여부 결정

### 9-4. 다음 vertical slice 완료 조건

- [ ] `SearchIntent`가 원문과 검증 가능한 영업·주차·우회 조건을 분리
- [ ] Google Place Details가 최소 FieldMask로 영업시간·주차·평점과 필드 상태 반환
- [ ] Kakao/Google 결과를 공통 장소 상세 view model로 표시
- [ ] 선택 route priority로 장소별 추가 소요시간 계산
- [ ] `UNKNOWN`을 `false`로 표시하지 않음
- [ ] provider attribution·원문 링크 표시
- [ ] Android/iOS에서 한국어·영어 자연어 query smoke test
- [ ] 한국 포함 route는 Kakao only, 모두 해외 route는 Google only임을 fixture로 검증
- [ ] API key가 앱 용도별로 제한되고 server key가 모바일 bundle에 없음
- [ ] 검색 세션별 Places·Routes 호출 수와 예상 비용 계측
- [ ] `AdProvider` no-op 상태에서 모든 핵심 flow 정상 동작
- [ ] lint/typecheck/build와 핵심 contract 검증 통과

### 9-5. 문서 책임 분리

- `FEATURE_INSIGHTS.md`: provider 정책 결정 근거, provider 비교, 광고 BM·안전·정책, 후속 확장 gate
- `MIGRATION_PLAN.md`: 실제 작업 순서, 환경변수, 사용자 준비물, 완료 조건
- `PROJECT_CONFIGURATION.md`: 현재 Store identity, signing 위치, 환경변수 계약, toolchain·dependency 및 새 Mac 복원 기준
- `ARCHITECTURE.md`: 현재 코드 기준 구조, provider port/adapter 구성, wire 계약
- `PROGRESS_LOG.md`: 날짜별 진행 기록

향후 공통 결정이 바뀌면 관련 문서의 최종 갱신일과 기준을 같은 변경에서 함께 수정한다.

---

## 10. API 비용 예산·운영 gate

> 기준일: 2026-08-05. 가격 근거와 플랫폼별 상세 비교는 `FEATURE_INSIGHTS.md` 24장을 단일 기준으로 사용한다.

### Google 초기 예산 모델

한 검색 세션은 평균 Autocomplete 2회, 출발지·목적지 Place Details Essentials 2회, Routes Pro 1회, Search Along Route 1페이지 1회로 계산한다.

| 월 세션 | Core V3 예상 | Rich UI 예상 |    운영 예산 권장 하한 |
| ------: | -----------: | -----------: | ---------------------: |
|   1,000 |           $0 |           $0 |     실호출 계측만 수행 |
|   5,000 |         $160 |         $160 |                $250/월 |
|  10,000 |         $488 |         $520 |                $800/월 |
|  50,000 |       $3,115 |       $3,403 | $4,500/월 및 할인 문의 |
| 100,000 |       $6,242 |       $6,850 | $9,000/월 및 계약 검토 |

`Core V3`는 출발지·목적지 좌표를 위한 Place Details Essentials 2회와 Text Search Enterprise + Atmosphere의 주차·routing summary를 포함하고 검색 응답을 상세 화면에서 재사용한다. `Rich UI`는 사용자 20%가 별도 Place Details와 사진을 각각 한 번 호출하는 가정이다. 세금·환율·BE·LLM·EAS 비용은 제외한다.

### 구현 체크리스트

- [ ] `FieldMaskPreset = LEAN | CORE | RICH_DETAIL` 정의
- [ ] Search Along Route 기본 `pageSize`를 최대 20, 제품 노출은 상위 5개로 제한
- [ ] 자동 2·3페이지 조회 금지. 사용자의 명시적 추가 요청에서만 호출
- [ ] 검색 응답에 이미 포함된 필드는 같은 세션의 상세 화면에서 재사용
- [ ] 사진·리뷰·추가 Place Details는 lazy load
- [ ] request마다 provider, endpoint, SKU 추정, FieldMask preset, page, latency와 성공 여부 기록
- [ ] 세션마다 autocomplete·route·search·detail·photo 호출 수와 예상 비용 집계
- [ ] Google Cloud budget alert 50%·75%·90%·100% 설정
- [x] Android/iOS/server 용도별 key와 API별 quota 상한 적용
- [ ] 비용 이상 시 remote flag로 사진·리뷰·추가 페이지·rich field를 순서대로 비활성화
- [ ] 월말 실제 Cloud Billing export와 앱 추정 비용 오차 확인
- [ ] 광고 BM은 `광고 순수익 - API 비용` contribution margin으로 평가

### 출시 비용 gate

- [ ] Closed beta 시작 전 월 1,000세션 quota와 budget alert 설정
- [ ] 5,000세션 확장 전 검색당 평균 호출 수와 Core 비용이 추산의 ±20% 이내인지 확인
- [ ] 10,000세션 확장 전 월 Google 예산 최소 $800 또는 동등 원화 확보
- [ ] 50,000세션 확장 전 Google volume tier·계약 할인과 Kakao/TMAP 후속 adapter 비용 재비교
- [ ] 어떤 단계에서도 API quota 초과를 자동 무제한 결제로 해결하지 않고 기능 degradation 정책 적용

### 플랫폼 재평가 시 필요한 견적 입력

```text
Google
  Autocomplete 2 + Routes 1 + Search Along Route 1 + Detail/Photo 20%

Kakao
  Local 검색 약 10 + 기본/후보 자동차 경로 약 6

TMAP
  기본 경로 1 + findPoiRoute 1 + 후보 경유 경로 약 5

NAVER
  지도 load 1 + 기본/후보 Directions 약 6 + Geocoding 0~2
```

공급자 선택은 호출 단가만이 아니라 경로상 검색 지원, 주차·영업시간·평점 fill rate, 호출 증폭과 계약 비용을 함께 비교한다.
