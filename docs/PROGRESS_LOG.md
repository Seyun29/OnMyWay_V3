# OnMyWay 진행 로그

> 최신 항목이 위. 작업이 끝날 때마다 같은 변경에서 이 로그를 갱신한다.
> 비밀값(키·비밀번호·fingerprint)은 기록하지 않는다.

## 2026-08-18 — EAS Android/iOS Production build·제출 준비

- FE project root의 `eas.json`에서 pnpm `10.15.1`, SDK 57, `preview`/`production` environment·channel과 명시적 runtime `2.1.2-17`을 사용해 cloud build를 복구했다.
- 첫 Android Preview APK에서 EAS가 생성한 remote keystore signer와 기존 Play Upload certificate 불일치를 발견해 Production build를 중단했다.
- 기존 upload keystore를 EAS default credential로 등록한 뒤 Preview APK를 재생성했고, 값 비공개 비교로 signer 일치를 확인했다.
- 같은 credential로 Android Production AAB `2.1.2 (17)` 생성과 signer 일치를 확인했다. embedded JS bundle은 Railway production origin을 포함하며 localhost·Android emulator 개발 origin을 포함하지 않는다. Google Play Service Account key가 아직 없어 EAS 제출은 대기 중이다.
- 첫 iOS `2.1.2 (17)` 제출은 닫힌 pre-release train으로 거부됐다. marketing version을 `2.1.3`, build를 `18`로 올려 재제출했으나 수출 규정 선언이 없어 TestFlight에서 보류됐다.
- native Info.plist와 Expo config에 면제 암호화 선언을 추가하고 iOS `2.1.3 (19)`를 재빌드·제출했다. App Store Connect 처리 결과 `VALID`, Internal TestFlight `IN_BETA_TESTING`이며 runtime은 Android와 동일한 `2.1.2-17`을 유지한다.
- Production OTA 게시, 실기기 smoke와 OTA recovery 검증, Store production rollout/App Review 제출은 수행하지 않았다.

## 2026-08-15 (4) — 검색 반경 기능 과거 대비 감사

- 공개 출시 기준 `release/v2.1.2`와 현재 FE를 비교해 경로상 검색의 반경 선택 UI가 삭제되지 않았음을 확인했다. 선택 경로가 있을 때 반경 버튼으로 slider를 열며, 동적 min/max와 0.5km step, km→m 변환 후 `/map/search-on-path` 전달이 유지된다.
- 반경 panel은 기본적으로 닫혀 있고 검색 결과 대안 UI에서는 교체되므로 런타임에서 기능이 사라진 것처럼 보일 수 있다. panel 표시 여부와 무관하게 현재 선택 반경은 요청에 항상 포함된다.
- provider-neutral 전환 이후 기존 HEAD의 Google Search Along Route 구현은 FE/DTO/port가 보존한 `radius`를 실제 Google 요청에서 사용하지 않았다. 현재 Google adapter 변경은 반경 기반 vertex sampling, 100~50,000m circle bias, 거리 후필터링으로 이를 복구한다. Kakao는 기존처럼 sampling과 장소검색 양쪽에 반경을 적용한다.
- 후속 정리 대상으로 UI가 20.5~25km를 표시할 수 있지만 payload는 20km로 clamp되는 불일치, FE 하드코딩/`any` payload, DTO의 설명과 실제 validation 불일치를 확인했다. 이번 감사에서는 추가 수정하지 않았다.

## 2026-08-15 (3) — Google marker press와 경로선 시각 parity

- Google marker press가 지도 press의 `marker-press` action으로도 전달되어 장소 marker가 연 bottom modal을 지도 배경 handler가 즉시 닫는 renderer 간 이벤트 차이를 확인했다.
- Google marker 이벤트의 propagation을 중단하고 Google MapView가 실제 지도 배경 press만 공통 `onMapClick`으로 전달하도록 방어해 Naver의 marker/map tap 분리 동작과 맞췄다.
- Google Polyline이 Naver PathOverlay의 outline을 직접 지원하지 않는 차이를 두 겹의 Polyline(외곽선 + 본선)으로 보완했다. 기존 route 색상·두께·z-index 계약은 유지한다.
- 사용자 제공 영어 navigation marker assets를 `markerList.navigation.en`으로 연결하고 앱 언어가 `en`일 때 출발·경유·도착 marker가 영어 PNG를 사용하도록 적용했다. 한국어 assets는 그대로 유지했으며 `marketEnd.png` 오타는 `markerEnd.png`로 정리했다.
- 기존 marker locale TODO는 구현 완료로 `ARCHITECTURE.md` backlog에서 제거했다. Naver/Google·iOS/Android의 실제 marker 크기·anchor·가독성 확인은 runtime gate에 포함한다.
- `pnpm typecheck`, 대상 ESLint, diagnostics, `git diff --check`가 통과했다. 현재 Debug 앱은 Metro 미실행으로 `No script URL provided` 상태여서, Metro 연결 후 Google 장소 marker tap→bottom modal 유지, 빈 지도 tap→modal 닫힘, 선택 경로의 흰 외곽선 시각 확인이 남아 있다.
- commit/push, production publish, Store upload는 수행하지 않았다.

## 2026-08-15 (2) — iOS Google custom PNG marker Fabric 복구 패치

- 보라색 기본 Google pin은 정상 표시되지만 출발·도착·경유·장소용 custom PNG child만 보이지 않는 재현으로 좌표·조건부 렌더링·marker 등록 문제를 제외했다.
- Google marker wrapper와 child image에 명시적 width/height를 적용하고 `tracksViewChanges`를 유지하며 image fade를 비활성화했다.
- `AIRGoogleMapMarker`의 실제 경로를 대조했다. custom child는 내부 `iconView`에 삽입되고 Google SDK가 그 view를 rasterize하며, `redraw`는 `GMSMarker.iconView`를 다시 연결한다.
- Fabric은 marker wrapper의 layout/finalize 후 PNG child를 mount한다. 따라서 wrapper layout 시점만 처리하면 아직 `iconView`가 없어 크기 전달이 누락될 수 있음을 확인했다.
- `react-native-maps@1.29.0` iOS Fabric wrapper가 wrapper layout과 child mount 직후 모두 내부 legacy marker/`iconView` 크기를 동기화하고 redraw하도록 pnpm 영구 patch를 보강했다. 원본 패키지 기준 patch dry-run과 `pnpm install --offline --frozen-lockfile` 재설치가 통과해 재현성도 확인했다.
- 프로젝트 내부 DerivedData 때문에 Expo fingerprint가 생성물을 재귀 스캔하던 원인을 확인했다. untracked `ios/build-marker-patch*` 4GB 이상을 제거하고 `.gitignore`에 재발 방지 규칙을 추가했으며 기존 source/migration 변경은 되돌리지 않았다.
- DerivedData를 `/tmp`로 분리한 iOS 26.5 arm64 simulator Debug build가 보강 전후 모두 성공했다. 최종 build에서 재설치로 생성된 `RNMapsGoogleMarkerView.mm`의 arm64 실제 compile, app bundle validate, simulator install 및 cold launch(PID 70896)까지 확인했다.
- 최종 `pnpm typecheck`, 대상 ESLint, diagnostics, patch reverse dry-run, `git diff --check`가 통과했다. 실행 중인 simulator에서 custom marker 표시·크기·anchor·z-index 및 선택 이미지 갱신은 사람이 확인해야 하는 최종 시각 gate로 남아 있다.
- Git 변경은 현재 tracked 53개 파일(`+3193/-848`)과 기존 migration 관련 untracked source/config로 구성된다. 빌드 생성물은 다시 나타나지 않았고 실행 중인 `xcodebuild` 프로세스도 없다.
- commit/push, production publish, Store upload는 수행하지 않았다.

## 2026-08-15 — 크래시 리포팅 TODO와 Store 업데이트 runbook 추가

- Preview/Production에서 JS/native/handled error를 수집할 크래시 리포팅 작업을 release TODO에 추가했다. Sentry 계열 도구를 기본 후보로 두되 dependency 설치와 계정/project 연결은 아직 수행하지 않았다.
- environment/version/build/channel/runtime/update tag, 개인정보·정밀 위치 redaction, iOS dSYM, Android R8 mapping/native symbols, Store/OTA source map 업로드와 실제 기기 symbolication 검증을 완료 조건으로 정의했다.
- 기존 Store app record와 identity/signing을 유지하는 Android Internal→Closed→Production, iOS TestFlight→App Review→phased release 절차를 `PROJECT_CONFIGURATION.md`에 추가했다.
- 현재 `2.1.2 (17)`은 Preview candidate이며, iOS production update 전에는 공개 `2.1.2`보다 높은 marketing version을 별도로 확정하도록 gate를 명시했다.
- 코드·dependency·credential은 변경하지 않았고 production publish, Store upload, commit/push는 수행하지 않았다.

## 2026-08-14 — Expo SDK 57 native integration compile 복구

- Expo SDK 57와 `expo-updates`를 RN `0.86.2` bare app의 Android/iOS native project에 연결했다.
- iOS minimum을 승인된 `16.4`로 정렬하고, RN prebuilt AppDelegate header 불일치를 공식 source fallback으로 우회했다.
- Android release AAB와 iOS unsigned generic simulator build가 통과했다. Android artifact에서 Store identity/version/SDK, update metadata, embedded bundle, non-empty fingerprint asset을 확인했다.
- `Expo.plist`가 iOS app resource에 포함됨을 확인했다. 실제 project identifier와 update URL은 기록하지 않는다.
- actual-device runtime, local Store build channel embedding, preview OTA, offline/server 장애, incompatible runtime, rollback/embedded recovery는 아직 release gate로 남아 있다.
- production publish, Store upload, 유료 plan 변경은 수행하지 않았다.

## 2026-08-13 — OTA 실행 순서·비용 기준 확정

### 결정

- Expo cloud project 생성 완료. 실제 project ID나 credential은 문서에 기록하지 않는다.
- 이 Mac의 EAS CLI는 `Not logged in` 상태라 local project 연결과 `update:configure`는 아직 수행하지 못했다. 사용자가 interactive terminal에서 로그인한 뒤 재개한다.
- `install-expo-modules@0.16.0` 자동 installer는 RN `0.86.2`를 인식하지 못해 변경 없이 중단됐다. Expo 공식 SDK 57 RN 0.86 manual integration으로 전환한다.
- 공식 manual guide는 iOS minimum `16.4`를 요구하지만 현재 Store 앱은 `15.1`이다. 기존 사용자 지원 범위를 검토하기 전 deployment target과 native dependency를 변경하지 않는다.
- Free는 월 1,000 OTA MAU hard quota이며 초과 과금이 없다. quota를 소진하면 Starter로 올려야 하고 한도는 다음 달 초기화된다. 앱은 update 실패 시 embedded/기존 정상 bundle로 계속 시작하도록 검증한다.
- Starter는 `$19/월`에 3,000 MAU, 이후 200,000까지 `$0.005/MAU`다. 회원·결제 기능 자체는 Free/Starter 사용을 막지 않으며 인증·영수증·entitlement는 서버 authoritative로 처리한다.
- 현재 권장은 candidate 17에 end-to-end signing을 적용하지 않는 것이다. Expo 2FA·최소 publish 권한·runtime 격리·rollback을 적용하고, B2B/enterprise signed artifact나 별도 공급망 요구가 생길 때 새 Store binary로 도입한다.

### 문서 갱신

- `MIGRATION_PLAN.md`: 지금부터 실행할 6단계와 비용 의사결정 추가
- `FEATURE_INSIGHTS.md`: 최신 plan별 MAU·bandwidth·storage·signing 및 비용 시나리오 갱신
- `PROJECT_CONFIGURATION.md`: 즉시 다음 작업, non-CNG 원칙, Store identity 보존 기준 추가

### 미실행

- `expo`/`expo-updates` dependency 설치와 native 설정은 아직 수행하지 않음
- Expo account/project 생성, 유료 plan 결제, signing key 생성, OTA publish는 수행하지 않음
- iOS/Android actual device smoke와 Store 업로드는 여전히 남아 있음

## 2026-08-10 — release metadata + logging + NestJS 11 + provider hardening

### 완료

- Android fresh release manifest/AAB를 다시 생성해 Store identity `com.omw.omw_front`, `2.1.2 (17)`, min SDK 24, target SDK 36, release cleartext 비활성화를 확인
- fresh release payload에 제거 대상 AppCenter/CodePush/TMap native SDK manifest·entry가 없음을 확인. TMAP package query와 `tmap://` URL은 외부 앱 handoff용이라 유지
- BE Kakao Axios 오류를 raw response/header/request dump 없이 공통 메시지와 upstream HTTP status로 정규화하고 non-Axios 오류도 안전하게 500으로 변환
- HTTP middleware 로그를 method, matched route pattern, status, duration으로 제한해 IP, header, query string, params, body를 기록하지 않게 변경
- FE/BE authored source의 `console.log/debug/info/warn/error`를 모두 제거하고 양쪽 ESLint에 `no-console: error` 적용. FE는 기존 null fallback·toast·alert를 유지
- `AppModule`에 등록되지 않고 활성 provider-neutral `MapModule`로 대체된 BE legacy Kakao controller/service/DTO와 dead commented 구현 제거
- iOS app/test target의 직접 `-lc++`를 모두 제거하고 Pods xcconfig 상속만 사용
- hard-coded ANAM center를 제거하고 `mapCenterState`/`lastCenterState`를 nullable로 전환. 일반 지도는 실제 위치, 경로 선택 지도는 route geometry, 지도 직접 선택은 last/global/현재 위치 순으로 초기화하며 center가 없으면 native map 대신 loading/retry UI를 표시
- BE를 NestJS `11.1.28`, Express `5.2.1`, TypeScript `5.9.3`로 전환하고 Express 5 wildcard, Swagger 11 nested array schema, Jest alias와 기존 unit/e2e 계약을 복구
- Google adapter 오류를 `MapProviderException`의 quota/authentication/timeout/unavailable/invalid-response code로 정규화. route 필수 필드 누락과 place 좌표 누락을 명시적으로 처리하고 상세 optional field의 `null`(UNKNOWN)을 유지
- `ProviderContext`가 header를 language/region/units로 정규화하고 `MarketConfig`가 기능별 언어 provider·좌표 기반 route provider 정책을 선언적으로 결정하도록 분리. `MapService`는 6개 application use case에 위임하는 thin facade로 축소
- 검색 장소에 provider·provider place id·원본 attribution을 보존하고 place-detail optional field마다 `KNOWN | UNKNOWN | UNSUPPORTED` 상태를 추가. 기존 필드와 `null` semantics는 유지해 FE wire 호환성을 보존
- 활성 FE/BE authored source의 `TODO`/`FIXME`/`HACK`/`TBU` marker를 0건으로 정리. 완료된 주석은 삭제하고 route camera, UI parity, history UX, sampling/model 작업은 완료 조건과 함께 `MIGRATION_PLAN.md`/`ARCHITECTURE.md` backlog로 이동
- Kakao category group code를 literal union으로 제한하고 keyword/search-on-path DTO의 Swagger enum·runtime validation, provider input, Kakao API query type에 연결

### 검증 완료

- BE `corepack pnpm lint`: 오류·경고 없음
- BE `corepack pnpm build`: 통과
- BE `corepack pnpm test --runInBand`: 5 suites/5 tests 통과
- BE `corepack pnpm test:e2e --runInBand`: `/health` 1 test 통과
- FE `corepack pnpm lint`, `corepack pnpm typecheck`: 통과
- FE `corepack pnpm test --runInBand`: 1 suite/1 test 통과
- active FE/BE source marker 재검색: 0건
- iOS `plutil -lint ios/omw_front.xcodeproj/project.pbxproj`: 통과
- iOS unsigned generic simulator compile 재통과; duplicate `-lc++` warning 없음
- Android `./gradlew :app:processReleaseMainManifest :app:bundleRelease --console=plain`: 통과
- Android SDK XML tool-version 및 Gradle 10 예정 deprecation warning은 release blocker가 아닌 후속 toolchain 정리 항목으로 유지

### 아직 완료로 간주하지 않는 항목

- iOS/Android simulator·device runtime smoke, 실제 API·지도 시각 검증, route camera fit·marker z-index·header/keyboard UI parity, Store 업로드는 실행하지 않음
- provider attribution FE 표시와 provider-neutral contract suite는 아직 미구현
- production/배포/Railway/EAS 설정은 변경하지 않음

## 2026-08-09 (5) — RN 0.86 native 이식 + Phase 2 cleanup 재개 체크포인트

### 완료

- FE를 React Native `0.86.2`/React `19.2.3`, New Architecture/Hermes 기준으로 이식하고 NativeWind 4, React Navigation 7, Zustand compatibility facade, Reanimated 4/Worklets, Google/Naver renderer 최신 패키지로 정렬
- Android를 compile/target SDK 36, min SDK 24, build `2.1.2 (17)`로 갱신. Store application ID `com.omw.omw_front`와 Git 밖 `MYAPP_UPLOAD_*` release signing 계약 유지
- iOS를 RN 0.86 Swift factory AppDelegate로 전환. bundle `com.omw.onmywayapp`, Team `63SCY9KWZL`, `2.1.2 (17)` 유지; Google Maps와 `RNBootSplash.initWithStoryboard("LaunchScreen", ...)` 배선 확인
- AppCenter/CodePush와 Android/iOS TMap native bridge·SDK를 제거. TMAP은 credential-free app URL handoff로 변경되어 현재 최종 목적지만 전달하며, Naver 길찾기의 다중 지점 전달은 유지
- Jest를 RN 0.86 test Babel 경로와 deterministic native mocks로 복구하고 App preference hydration/root render smoke test 추가
- 모든 authored FE `@ts-nocheck`/`@ts-ignore`/`@ts-expect-error` 제거. 장소 좌표·bottom sheet props·filter/Naver deep-link helper를 명시적으로 타입화
- 비활성 OpenAI 리뷰 요약 FE UI/scraper/API와 BE endpoint/client/config를 제거
- `TestScreen` 제거, `mainBotttomSheet.tsx`를 `mainBottomSheet.tsx`로 rename

### 검증 완료

- FE `corepack pnpm test`: 1 suite/1 test 통과
- FE `corepack pnpm lint`: 오류·경고 없음
- FE `corepack pnpm typecheck`: 통과
- BE `corepack pnpm build`: 통과
- `react-native config`: RN `0.86`, Android package/application ID와 iOS workspace/autolinking 확인
- iOS `xcodebuild -list -json -workspace omw_front.xcworkspace`: scheme `omw_front` 확인
- iOS `plutil -lint`: `Info.plist`, `PrivacyInfo.xcprivacy`, `project.pbxproj` 통과
- iOS app/project/test deployment target을 CocoaPods와 동일한 `15.1`로 정렬
- iOS unsigned generic simulator compile 성공:
  `xcodebuild -quiet -workspace ios/omw_front.xcworkspace -scheme omw_front -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/onmyway-xcode-derived CODE_SIGNING_ALLOWED=NO build`
- 이전 app target `14.0`/Pods `15.1` deployment mismatch warning 제거 확인
- App Icon catalog의 byte-identical 미참조 복사본과 잘못된 `iphone 76x76` entry를 제거하고 재빌드에서 unassigned children warning 제거 확인; marketing icon slot은 유지
- app target의 직접 `-lc++`를 제거하고 CocoaPods의 상속 linker flag만 사용해 duplicate library warning 제거 확인
- Bootsplash `customize(_ rootView: RCTRootView)`는 설치된 `react-native-bootsplash 7.3.2` README와 native API가 요구하는 공식 bare RN 연동임을 확인; RN의 deprecation warning은 compile blocker가 아니며 upstream 대체 API가 생기기 전 유지
- 이전 native 검증에서 Android `assembleDebug`, `bundleRelease`, `signingReport` 성공. fingerprint는 기록하지 않음

### 이후 상태

1. simulator/device runtime smoke는 여전히 남음: cold start/Bootsplash, 위치 권한, Naver·Google renderer, 언어·renderer 저장, 주소·장소·경로·경로상 검색, 장소 상세, 외부 길안내
2. Android fresh release metadata와 제거 SDK linkage 검증은 2026-08-10 상단 항목에서 완료
3. Phase 2 source marker·console·redacting logger 정리는 2026-08-10 상단 항목에서 완료
4. NestJS 11 전환과 Google 오류/quota/필수·optional field 정규화는 2026-08-10 상단 항목에서 완료
5. EAS Update는 project ID/channel/signing 정보가 생길 때까지 미구성. `expo-updates` runtime/rollback/offline 검증 전 production 제출 금지

### 아직 완료로 간주하지 않는 항목

- iOS simulator/device runtime smoke는 아직 실행하지 않음
- Android/iOS 실제 API·지도 시각 smoke와 Store 업로드는 실행하지 않음
- production/배포/Railway/EAS 설정은 변경하지 않음

## 2026-08-09 (4) — 최초 기기 언어 기본값 + 이후 수동 설정 유지

- 최초 설치 후 첫 실행에서만 기기 locale을 앱 언어로 변환(`ko*`→`ko`, 그 외→`en`)하고 `language` key에 즉시 저장
- 첫 renderer도 최초 앱 언어 기본값(`ko`→Naver, `en`→Google)으로 정해 `mapRenderer` key에 즉시 저장
- 이후 앱 실행은 저장된 언어와 renderer를 우선하며 기기 언어 변경이나 foreground 복귀로 덮어쓰지 않음
- 드로어의 한국어/English 수동 선택을 유지하고, 언어를 수동 변경할 때만 renderer를 새 언어 기본값으로 재설정; renderer는 이후 다시 독립적으로 선택 가능
- 한국 경로상 검색 문서화: route 계산은 Kakao only이고, `ko`는 Kakao vertex/radius corridor 근사 검색, `en`은 Kakao path를 Google encoded polyline Search Along Route에 전달
- 대상 FE ESLint, diagnostics, `git diff --check` 통과. 전체 tsc는 기존 `react-native-nmap` dependency 타입 오류만 재현되었고 이번 변경 파일의 신규 오류는 없음. 테스트 suite와 simulator 시각 검증은 실행하지 않음

## 2026-08-09 (3) — Google region code를 좌표 기반으로 유도

- `route-region.ts`의 한국 geofence를 재사용하는 non-throwing `isSouthKoreanPoint` 추가
- Google adapter가 요청 좌표로 region을 유도: reverse geocode(x/y), 장소 검색(locationBias 중심), 경로상 검색(첫/중간/끝 vertex 샘플). 한국이면 `KR`, 해외면 미지정
- 좌표 없는 텍스트 검색만 기존 언어 fallback(`ko`→`KR`, `en`→미지정) 유지 — 회귀 없음
- Routes/place-detail은 lat-lng·id 기반이라 region 미사용
- localhost 실측: EN+서울 좌표 reverse geocode 정상(KR 유도), EN+SF 좌표 정상(미지정), EN+서울 bias 약국 검색 정상
- BE build·대상 lint 통과

## 2026-08-09 (2) — FE Google 장소 상세 보강 연결

- FE `PlaceDetail` 타입에 `place_id` 추가(검색 응답 spread로 자동 전달), `src/api/getPlaceDetail.ts` 신설
- bottom sheet `setExtraData`: Kakao 숫자 ID 경로 유지 + Google `place_id`면 BE `/map/place-detail`로 영업 여부·주차·평점·평점 수 보강
- `null`(UNKNOWN)은 undefined로 두어 badge 미표시(false로 강제 변환 금지), 보강 실패는 기본 정보 표시를 막지 않음
- 비용 제어: 목록 전체가 아닌 선택된 장소만 1회 조회
- 장소 전환 시 `extra` state 초기화로 provider 혼합 시 stale badge 방지
- 대상 FE lint 통과, tsc 신규 오류 0, diagnostics 없음. 시뮬레이터 시각 검증은 미실행

## 2026-08-09 — PlaceDetailProvider port + Google Place Details adapter

- `PlaceDetailProvider` port와 provider-neutral `PlaceDetailResult` 모델 추가 (`null`=UNKNOWN, false로 강제 변환 금지)
- Google Text Search FieldMask에 `places.id` 추가, `PlaceResult.place_id`로 노출 (Google 결과에만 존재; 기존 wire shape에 optional field 추가)
- `GoogleMapAdapter.getPlaceDetail`: Place Details (New) 호출, 영업 여부·요일별 영업시간·주차(`parkingOptions`)·평점·평점 수 반환. `parkingOptions`는 Enterprise+Atmosphere SKU 유발을 코드 주석과 문서에 명시
- `GET /map/place-detail?id=...` endpoint 추가. Kakao 상세는 기존 FE `place_url` 경로 유지
- localhost 실측: 영어 keyword-search에서 `place_id` 발급 확인, place-detail이 영업시간·평점 반환·`parking:null`(UNKNOWN) 유지 확인
- BE build·대상 lint 통과. FE `/map/place-detail` 연결은 다음 작업

## 2026-08-08 — 드로어 지도 renderer 설정(국내 지도/구글맵) 추가

- 드로어 언어 설정 아래에 `지도 설정` 토글(`국내 지도`/`구글맵`) 추가
- 언어 변경 시 renderer를 언어 기본값(한국어→Naver, 영어→Google)으로 재설정하고, 사용자 지정값은 AsyncStorage `mapRenderer`에 저장해 재시작 후 유지
- renderer 변경도 언어 변경과 동일하게 transient 지도 세션 초기화 후 `RootStackNavigation`을 `언어-renderer` key로 remount
- `react-native-maps@1.14.0` 도입(`PROVIDER_GOOGLE`). peerDependencies상 1.20.1도 허용되지만 1.15+의 Android 코드가 RN 0.74+ Fabric interop API를 사용해 실컴파일이 실패하므로 1.14.0이 실질적 상한
- 4개 지도 화면과 마커·경로를 provider-neutral `OmwMapView`/`MapMarker`/`MapPath`로 전환 (Naver zoom·coveringRegion 이벤트 shape를 Google에서 재현)
- Android: `.env`의 Android key를 gradle이 manifest placeholder로 주입; iOS: build phase가 iOS key를 Info.plist `GMSApiKey`로 주입 후 AppDelegate가 GMSServices 초기화. 키 미존재 시 Google 타일만 비활성화
- Podfile에 `react-native-google-maps` 추가(GoogleMaps `7.4.0`), iOS 배포 target `13.4` 유지
- FE `.npmrc`에 `node-linker=hoisted` 추가: pnpm 재설치로 드러난 RN gradle의 flat node_modules 요구 해결
- 검증: 대상 FE lint 통과, tsc 신규 오류 0(기존 nmap·테스트 파일 오류 제외), Android `assembleDebug`(arm64) 빌드 성공 및 병합 manifest에 key 주입 확인, iOS 시뮬레이터 xcodebuild 성공, pbxproj plutil lint 통과. 실기기/시뮬레이터 시각 검증은 미실행

## 2026-08-07 (8) — 한국 좌표 Kakao-only 경로와 priority 계약 정리

- route/stopby provider 선택을 언어에서 좌표 지역으로 분리: 출발지·목적지·기존 경유지·새 stopby 중 하나라도 한국 routing geofence이면 Kakao only, 모두 해외면 Google only
- 한국 경로에서 Kakao 실패 시 Google fallback, 해외 경로에서 Google no-route 시 Kakao fallback을 모두 제거
- API wire에 국가 코드가 없어 주요 국내 도로 영역·제주·서해 주요 섬·울릉도·독도를 포함한 로컬 geofence와 좌표 validation 추가
- Kakao route는 `alternatives=false`로 `RECOMMEND`, `DISTANCE`, `TIME`을 각각 호출해 최대 3개 부분 성공을 반환하도록 명시
- Kakao 공식 priority 5종 중 `MAIN_ROAD`, `NO_TRAFFIC_INFO`는 현재 3-card 제품 범위에서 제외
- FE가 보내던 선택 route `priority`를 BE DTO/port에 명시하고 Kakao/Google stopby 재계산에 실제 반영
- stopby FE 요청의 start/end guard와 빈 waypoints 정규화, 정밀 위치 console log 제거
- 서울·제주·미국·일본·한국 경유지 혼합 좌표 geofence smoke 통과; 실제 외부 API/simulator smoke는 실행하지 않음
- 현재 기준 문서의 Google-first/no-route fallback 잔여 설명을 언어 기반 검색 + 좌표 지역 기반 단일 route provider 정책으로 동기화
- 경로 선택 화면의 no-route/로딩 실패 안내를 사라지는 Toast에서 같은 FlatList 위치의 카드(`SelectRouteEmptyItem`)로 교체; 재검색 성공 시 카드 해제
- 최종 대상 BE/FE lint, BE build, diagnostics, `git diff --check` 통과

## 2026-08-07 (7) — Metro cache reset 명령과 Google Routes 한국 coverage 재확인

- FE에 `start:reset`, 루트에 `dev:reset`, `dev:ios:reset`, `dev:android:reset` 스크립트를 추가해 `--reset-cache` 실행을 표준화
- Google 공식 응답 계약상 성공 HTTP 응답의 빈 `routes`는 한국 외에도 존재할 수 있으며, 찾을 수 없는 주소/Plus Code가 명시된 사례임을 확인
- Google 공식 국가별 coverage의 2026-07-31 기준 한국 Driving Directions가 미지원 또는 낮은 가용성(`—`)임을 확인
- 현재 앱은 유효한 좌표를 보내므로 한국에서 반복되는 빈 route는 주소 geocoding 실패보다 국가별 driving coverage 제약과 일치한다고 판단
- Google 인증·quota·network·timeout·HTTP 오류는 fallback하지 않고, 모든 route 시도가 명시적 no-route일 때만 Kakao로 fallback하는 기존 정책 유지
- 공식 문서 조사 결과와 fallback 유지 조건을 `FEATURE_INSIGHTS.md`에 기록

## 2026-08-07 (6) — 번역 action과 영어 한국 경로 fallback 수정

- `PlaceInputHeader`의 한글 outline glyph SVG 사용을 icon-only SVG + 번역 RN `Text`로 교체하고 세 action을 동일 너비·접근성 button으로 구성
- typed dictionary에 `favorite.short`와 경로 없음/로딩 실패 사용자 안내를 한국어·영어로 추가
- Google의 성공한 빈 route 응답만 나타내는 내부 `RouteNotFoundError`를 추가
- 한국어 route/stopby는 Kakao를 직접 사용하고, 영어는 Google의 부분 성공을 보존하면서 모든 실패가 explicit no-route일 때만 Kakao로 fallback
- Google 인증·quota·network·HTTP 오류는 fallback하지 않고 전파하며, Kakao 모든 우선순위 실패도 빈 성공 배열 대신 오류로 전파
- FE route API에서 좌표 포함 로그와 `@ts-nocheck`를 제거하고 stale-language cancellation만 조용히 무시; route 화면은 빈 결과/실패를 구분해 state와 loading을 정리하고 번역 toast 표시
- 영어 reverse geocoding·장소 검색·경로상 검색과 모든 언어의 Naver renderer는 변경 없음
- 요청 범위에 따라 테스트는 추가하거나 실행하지 않음

## 2026-08-07 (5) — 로컬/production 서버 주소 계약

- BE의 환경변수 미지정 fallback 포트를 `3000`에서 `3005`로 변경하고 `0.0.0.0`에 bind
- 로컬 FE는 iOS `http://localhost:3005`, Android emulator `http://10.0.2.2:3005` 사용
- Production FE는 `SERVER_BASEURL`에 `http://` 또는 `https://` absolute URL을 필수로 지정하며 trailing slash를 정규화
- Production BE는 배포 플랫폼의 `PORT`를 우선하고 외부 80/443 및 TLS 종료는 reverse proxy에 위임

## 2026-08-07 (4) — FE 국제화와 언어 세션 격리

### 구현

- `src/i18n/dictionaries.ts`에 typed flat `ko`/`en` dictionary와 interpolation `translate`, `src/hooks/useTranslation.ts`에 Recoil 기반 hook 추가
- 컴포넌트의 rendered text, toast, alert, placeholder, route 시간/우선순위를 한국어/영어로 전환
- category를 stable id/code/translation key로 변경하고 keyword/category UI 상태를 구조적으로 구분
- 한국어 category는 기존 `카테고리 : <라벨>` query를, 영어 category는 자연스러운 Google query를 기존 backend `query` field로 전달
- 언어 변경 시 지정된 transient atom 13개와 toast를 초기화하고 `RootStackNavigation`만 언어 key로 remount
- `axiosDefault`/`axiosInstance`가 요청 시작 언어를 캡처하고 언어가 바뀐 뒤 도착한 성공 응답을 cancellation으로 폐기
- 경로상 검색의 지연 안내 timer는 navigation session unmount에서 정리하여 이전 언어 toast가 새 세션에 나타나지 않게 함

### 정책

- AsyncStorage 언어 선택과 request language는 session reset 대상이 아니다.
- Google/Kakao는 데이터 provider이고 Naver Map은 모든 언어의 renderer다.
- 의도적인 stale-language cancellation은 로그, alert, toast를 만들지 않는다.

### 검증

- `pnpm exec eslint <변경된 FE .ts/.tsx 파일 목록>` 통과 (error/warning 0)
- `pnpm exec tsc --noEmit` 실행: 이번 변경의 source error는 0개지만 설치된 `react-native-nmap/index.tsx`의 기존 TypeScript 호환 오류 24개 때문에 전체 명령은 실패
- 요청 범위에 따라 테스트는 추가하거나 실행하지 않음
- simulator/device UI validation은 실행하지 않음

## 2026-08-07 (3) — 언어 기반 지도 API provider 선택

### 결정

- 앱 언어 `한국어(ko)`는 주소·장소·경로·경로상 검색 전체에 Kakao API 사용
- 앱 언어 `English(en)`는 동일한 네 기능 전체에 Google Maps Platform API 사용
- 최초 언어는 기기 locale 기준(`ko*`만 한국어, 그 외 영어), 사용자 선택은 AsyncStorage에 유지

### 구현

- 드로어에 `한국어`/`English` 선택 UI와 현재 provider 안내 추가
- 언어 변경 toast: 한국어는 Kakao, 영어는 Google API 사용을 명시
- 공통 axios client가 모든 BE 요청에 `Accept-Language` 전달
- BE `LanguageMapProviderResolver`가 요청별로 Kakao/Google adapter 선택
- Google Geocoding·Places·Routes의 검색/응답 언어를 request context로 변경
- 영어 설정에서 기존 한국어 category label을 Google용 영어 query로 변환
- 기존 env 기반 provider 고정/port override 제거

### 경계

- 이번 선택은 지도 **데이터 API provider**를 바꾼다.
- FE 지도 화면은 아직 기존 Naver renderer이며, Google native renderer는 RN 0.86 이식 때 연결한다.
- Google Routes는 한국 driving을 아직 지원하지 않으므로 한국 내 기본 사용은 한국어/Kakao 설정이다.

### 검증

- BE build 통과
- 변경된 BE/FE 파일 대상 lint 통과
- `Accept-Language: ko-KR` 서울 주소 조회 성공(Kakao, 한국어 주소)
- `Accept-Language: en-US` 미국 주소 조회 성공(Google, 영어 주소)
- 실제 드로어 선택 UI와 전체 검색 flow의 시뮬레이터 시각 검증은 남아 있음

## 2026-08-07 (2) — FE 연동 실패 진단·수정

### 증상

FE 로그에 `/map/get-address` timeout, 이어서
`TypeError: Cannot read property 'road_address' of undefined` 크래시.

### 원인 3가지

1. **포트 충돌**: `3001`을 다른 프로젝트의 Next.js dev server(`next-server v16.2.9`)가
   점유. 우리 BE는 EADDRINUSE로 기동 실패. `localhost:3001`은 `/en/...`로 307 redirect.
2. **플랫폼 불일치**: FE `SERVER_BASEURL`이 Android 에뮬레이터 전용 `10.0.2.2`였으나
   실제 실행은 iOS 시뮬레이터(로그 좌표가 SF 기본값). iOS에서 `10.0.2.2`는 라우팅
   불가 → timeout.
3. **FE 방어 코드 없음**: `getAddress`가 실패 시 `undefined`를 반환하는데 3개 호출
   지점이 그대로 프로퍼티 접근 → 크래시.

### 조치

- BE 포트를 `3005`로 변경 (BE `.env`, 양쪽 `.env.example`, 문서 전체 동기화)
- FE `SERVER_BASEURL`을 `http://localhost:3005`(iOS)로 변경, Android용 주석 병기
- `getAddress` 결과 optional chaining 가드 추가:
  - `naverMap.tsx`: 주소 없으면 `'현위치'`로 표시
  - `SelectMapScreen`: 빈 문자열 fallback
  - `PlaceInputScreen`: fallback 추가 + 기존 오타 `res.roadAddress` → `res.road_address` 수정

### 검증 (localhost:3005 실측)

- get-address: 서울·SF 좌표 모두 정상 (Google)
- keyword-search: 15건 정상 (Google)
- search-on-path: 20건 정상 (Google)
- driving-route: RECOMMEND/TIME/DISTANCE 정상 (Kakao)
- FE 변경 파일 lint 통과 (기존 shadow 경고 1건만 잔존)

### 후속: BASE_URL을 Platform.OS 기반으로 자동화

플랫폼 전환 시 `.env`를 수동으로 바꿔야 하던 구조를 제거했다.

- `src/config/consts/api.ts`: `SERVER_BASEURL`이 있으면 그대로 사용(실기기·원격),
  없으면 `Platform.OS`로 host를 골라 `http://{localhost|10.0.2.2}:{SERVER_PORT ?? 3005}` 구성
- FE `.env`/`.env.example`: `SERVER_PORT=3005` 추가, `SERVER_BASEURL`은 override용으로 비움
- `env.d.ts`: `SERVER_PORT` 및 Google Maps 키 변수 타입 선언 추가
- 검증: 7개 조합(ios/android × override 유무 × port 변형) 해석 로직 통과, tsc·eslint 통과

### 남은 사용자 작업

- Metro 캐시 리셋 후 앱 재시작 (`.env`는 build-time 인라인)
- iOS 시뮬레이터 위치를 서울로 설정 (Features → Location → Custom, `37.5665 / 126.9780`)

## 2026-08-07 — BE provider 구조 + Google adapter + hybrid 구성

### BE: provider port 구조 도입

- `map-provider.port.ts`: 4개 port interface, 중립 모델, DI Symbol token
- `kakao-map.adapter.ts`: 기존 Kakao 구현 전체를 adapter로 이동
- `MapService`에서 Kakao 직접 의존 제거, port 주입으로 전환
- controller/DTO/FE wire 계약 무변경. BE 빌드 통과.

### BE: Google adapter 구현

- `google-map.adapter.ts`: Geocoding, Places API (New) Text Search,
  Search Along Route, Routes computeRoutes (RECOMMEND/TIME/DISTANCE 매핑)
- `polyline.ts`(encode/decode), `stop-by-candidates.ts`(공유 helper) 추가
- `ko`/`KR`/`METRIC` 고정, Lean FieldMask 적용

### 발견: Google Routes 한국 자동차 경로 미지원

- computeRoutes(DRIVE)가 한국 좌표에서 빈 응답 반환 (실측 확인)
- 원인: 한국 지도 데이터 반출 규제. 2026-02 조건부 허용 발표됐으나 API 미반영
- 대응: port별 provider override 도입 → **hybrid 구성**
  - Geocoding/장소/경로상 검색 = GOOGLE
  - 자동차 경로/경유 시간 = KAKAO (`ROUTE_MAP_PROVIDER=KAKAO`)

### smoke test 결과 (localhost, 실측)

- get-address: Google 정상 (서울시청 좌표 → 주소)
- keyword-search: Google 정상 (강남역 카페, 카테고리 magic query 포함)
- search-on-path: Google Search Along Route 정상
- driving-route: Kakao 정상 (RECOMMEND/TIME/DISTANCE 3개)
- stopby-duration: Kakao 정상

### FE: Google place_url 호환 가드

- `mainBotttomSheet.tsx`, `keywordSearchBox.tsx`에서 Kakao 숫자 ID가 없는
  place_url일 때 crash하지 않고 보강을 skip하도록 수정. lint 통과.

### 문서

- `docs/ARCHITECTURE.md` 신설 (현재 구조 + provider 선택 + 남은 작업)
- `docs/PROGRESS_LOG.md` 신설 (이 문서)

## 2026-08-07 — 문서 체계화·키 정책 확정

- `MIGRATION_PLAN.md`, `FEATURE_INSIGHTS.md`, `PROJECT_CONFIGURATION.md`를 `docs/`로 이동, README에 링크
- Google 키 정책 확정: 환경 분리 없이 용도별 3개(`omw-android`, `omw-ios`, `omw-server`)
- 개발 BE는 localhost:3001로 통일 (BE `.env` PORT, FE 예제, 문서 동기화)
- Railway는 개발 완료 후 배포. server key를 Railway Variables에 등록 예정
- FE/BE `.env`에 Google 키 3개 설정 완료 (값은 Git 밖)

## 2026-08-06 — Android signing 정리

- release upload keystore를 `OnMyWay_FE_V3/android/app/`로 복원 (Git 제외 확인)
- signing 비밀번호 4개를 project `gradle.properties` → `~/.gradle/gradle.properties`(600)로 이전
- `signingReport`로 release keystore/alias/SHA-1 인식 확인
- 사용자가 Play Console Upload certificate SHA-1 일치 확인 완료
- 과거 Git history의 signing 비밀번호는 노출로 간주, 백업 후 교체 예정

## 2026-08-06 — Store 기준 동기화

- 실제 최신 출시 소스 확인: `release/v2.1.2` (Android/iOS 2.1.2, code/build 16)
- 출시본 버그 수정 선택 병합 (Kakao panel3 계약, boolean 처리, spread order 등)
- native 메타데이터를 2.1.2/16으로 동기화, iOS ATS 엄격화
- 다음 제출은 code/build 17 이상

## 이전 (요약)

- 루트 pnpm 통합 스크립트 구성 (`pnpm install`/`dev`/`dev:ios`/`dev:android`)
- Xcode/CocoaPods 환경 구성, Flipper opt-in 전환으로 iOS 빌드 성공
- GCP 프로젝트/Billing/API 5종 활성화 및 quota 설정
- Migration Plan 수립 (AUTH legacy화, RN 0.86/NestJS 11 목표, OTA 필수 gate)
