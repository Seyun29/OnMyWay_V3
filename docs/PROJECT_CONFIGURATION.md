# OnMyWay 프로젝트 설정·빌드·릴리스 기준

> 최종 확인: 2026-08-18. 이 문서는 재설정에 필요한 **이름·경로·버전·절차만** 기록한다. API key, 비밀번호, 인증서 fingerprint, `.env` 실제 값은 절대 기록하지 않는다.
>
> 아래 경로는 별도 설명이 없으면 저장소 루트 기준이다.

## 0. 즉시 다음 작업과 비용 기준

현재 최우선은 새 제품 기능이 아니라 첫 production binary에 OTA 수신 클라이언트를 포함하는 작업이다.

1. [x] Expo cloud project 생성 및 local project 연결. 실제 identifier나 credential은 문서화하지 않는다.
2. [x] 사용자가 이 Mac의 interactive terminal에서 EAS CLI 로그인 완료.
3. [x] iOS minimum `16.4` 상향 승인 및 app/test/Pods target 정렬.
4. [x] RN `0.86.2`에 Expo SDK 57 modules와 `expo-updates` exact version을 manual bare integration.
5. [x] update URL, 공개 build 16과 분리된 명시적 runtime `2.1.2-17`, Android/iOS embedded bundle 구성을 native project에 반영.
6. [x] development/preview/production EAS profile에 같은 이름의 environment/channel을 연결하고 Android preview cloud build 성공.
7. [x] 기존 Play Upload Key를 EAS Android credential로 등록하고 재생성한 Preview APK signer가 로컬 release certificate와 일치하는지 확인.
8. [x] 같은 credential과 `production` environment/channel로 Android Production AAB를 생성하고 signer·embedded backend origin을 검증.
9. [ ] Free plan에서 preview OTA, offline startup, update-server 장애, incompatible runtime rejection, rollback과 embedded recovery를 실제 iOS/Android release 설치로 검증한다.

첫 Android Preview cloud build에서 EAS가 잘못 생성한 remote keystore의 signer 불일치를 발견해 Production build를 차단했다. 이후 Git에서 제외된 기존 `my-upload-key.keystore`를 EAS default credential로 등록하고 Preview APK를 재생성해 signer 일치를 확인했다. 동일 credential로 SDK 57, `2.1.2 (17)`, runtime `2.1.2-17`, `production` channel의 Android Production AAB 생성과 signer 검증도 완료했다. embedded JS bundle에는 Railway production origin이 포함되고 로컬 개발 origin은 없다. 실제 alias·비밀번호·certificate fingerprint는 기록하지 않으며 Store 업로드는 아직 수행하지 않았다.

현재 출시 후보는 Android `2.1.2 (17)`, iOS `2.1.3 (19)`이며 end-to-end update signing 없이 Free plan으로 시작한다. 두 바이너리는 native API가 같아 runtime `2.1.2-17`을 공유한다. 회원·결제 기능이 생겨도 Free/Starter 사용은 가능하며 인증·권한·영수증 검증·entitlement는 서버 기준으로 처리한다. B2B/enterprise signed artifact나 별도 공급망 threat model이 생길 때만 signing certificate를 포함한 새 Store binary와 Production plan을 검토한다.

2026-08-13 공식 공개 가격 기준 Free는 `$0/월`·OTA 1,000 MAU hard quota다. 한도를 소진하면 초과 과금 없이 update delivery가 제한되므로 게시 전에 Starter로 올려야 한다. Starter는 `$19/월`에 3,000 MAU를 포함하고 3,001~200,000은 `$0.005/MAU`, Production은 `$199/월`에 50,000 MAU를 포함한다. 자체 end-to-end update signing은 Production/Enterprise에서만 제공된다. 상세 초과 비용은 [Expo pricing](https://expo.dev/pricing), [billing FAQ](https://docs.expo.dev/billing/faq/)와 `FEATURE_INSIGHTS.md`를 기준으로 한다.

Local EAS login, project 연결, Expo SDK 57/`expo-updates` native 구성과 local native compile을 완료했다. Android `2.1.2 (17)` Preview/Production cloud build 및 Upload Key 검증을 완료했지만 Google Play Service Account key가 없어 Play 제출은 대기 중이다. iOS는 닫힌 `2.1.2` train을 피해 `2.1.3 (19)`로 빌드·제출했으며 App Store Connect에서 `VALID`, Internal TestFlight `IN_BETA_TESTING` 상태다. Android/iOS 모두 runtime `2.1.2-17`과 embedded Railway production origin을 사용한다. OTA/runtime recovery와 실기기 smoke는 아직 완료하지 않았다.

## 1. 설정 원본 위치

| 구분                             | 기준 파일/위치                                                               |
| -------------------------------- | ---------------------------------------------------------------------------- |
| 루트 명령·패키지 관리자          | `package.json`, `pnpm-lock.yaml`                                             |
| FE/BE 의존성                     | `OnMyWay_FE_V3/package.json`, `OnMyWay_BE_V3/package.json` 및 각 lockfile    |
| Android SDK·앱 버전·signing 연결 | `OnMyWay_FE_V3/android/build.gradle`, `android/app/build.gradle`             |
| iOS 앱 버전·bundle·Team          | `OnMyWay_FE_V3/ios/omw_front.xcodeproj/project.pbxproj`                      |
| 환경변수 이름                    | 각 앱의 `.env.example`; 실제 값은 Git 제외된 `.env`                          |
| Android release credential       | `~/.gradle/gradle.properties` (`chmod 600`, Git 밖)                          |
| Android upload keystore          | `OnMyWay_FE_V3/android/app/my-upload-key.keystore` (`*.keystore`로 Git 제외) |
| iOS native dependency            | `OnMyWay_FE_V3/ios/Podfile`, `Podfile.lock`, `Gemfile.lock`                  |

## 2. Store identity와 현재 출시 기준

| 플랫폼  | ID                   | 공개 버전 | 공개 build/code  | 현재 출시 후보          | 추가 identity           |
| ------- | -------------------- | --------: | ----------------: | -----------------------: | ----------------------- |
| Android | `com.omw.omw_front`  |   `2.1.2` |  `versionCode 16` | `2.1.2`, versionCode `17` | 동일 upload key 유지    |
| iOS     | `com.omw.onmywayapp` |   `2.1.2` |        build `16` |      `2.1.3`, build `19` | Apple Team `63SCY9KWZL` |

- authoritative source: `temp/onmyway/omw_front`, ref `release/v2.1.2`, commit `74abb3607bbf21a57b26d433fc97ee51f5ed416e`.
- Android 후보는 기존 build보다 높은 versionCode `17`이므로 marketing version `2.1.2`를 유지할 수 있다.
- iOS는 공개 `2.1.2` train이 닫혀 marketing version `2.1.3`과 build `19`를 사용한다.
- 두 플랫폼은 native API 호환성이 같아 OTA runtime `2.1.2-17`을 공유한다.
- FE `package.json`의 `version: 1.0.6`은 npm package metadata이며 Store 버전 기준이 아니다.

## 3. Android release signing

`~/.gradle/gradle.properties`에는 아래 이름을 `KEY=value` 평문 형식으로 두되, 실제 값은 문서·Git·채팅에 넣지 않는다.

```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=<다른 Mac에서 안전하게 복원한 로컬 값>
MYAPP_UPLOAD_STORE_PASSWORD=<다른 Mac에서 안전하게 복원한 로컬 값>
MYAPP_UPLOAD_KEY_PASSWORD=<다른 Mac에서 안전하게 복원한 로컬 값>
```

- `build.gradle`이 위 값을 읽어 release signing을 구성한다. debug의 `android/androiddebugkey` 설정은 개발 전용이다.
- 새 Mac에서는 **동일한** `my-upload-key.keystore`도 위 경로로 안전하게 복사해야 한다. 새 key를 임의 생성하지 않는다.
- 검증: `cd OnMyWay_FE_V3/android && ./gradlew signingReport`. release SHA-1은 Play Console의 **Upload certificate**와 비교한다.
- Google Maps production Android 제한에는 Upload SHA-1이 아니라 Play Console의 **App signing certificate SHA-1**을 사용한다.

## 4. 환경변수·Google 키 계약

- FE 현재 계약: `SERVER_BASEURL`, `SERVER_PORT`, `APP_NAME`, `ANDROID_PACKAGE_NAME`, `IOS_BUNDLE_ID`, `GOOGLE_MAPS_ANDROID_API_KEY`, `GOOGLE_MAPS_IOS_API_KEY`.
- BE 현재 계약: `PORT`, `MODE`, `GOOGLE_MAPS_SERVER_API_KEY`, `KAKAO_API_KEY`, `SWAGGER_USER`, `SWAGGER_PASSWORD`; OpenAI 리뷰 요약 변수와 endpoint는 제거됨.
- 지도 provider는 기능별로 선택한다. 주소·장소·경로상 검색은 FE의 `Accept-Language`를 사용해 `ko`/`ko-*`는 Kakao, 그 외(현재 UI는 `en`)는 Google을 사용한다. 경로·stopby는 언어가 아니라 좌표 기준이다. 출발지·목적지·기존 경유지·새 stopby 중 하나라도 한국 routing geofence 안이면 Kakao만 호출하고, 모두 해외면 Google만 호출한다. 어느 방향도 provider fallback하지 않으며 upstream 오류를 그대로 노출하지 않는다.
- Google adapter의 운영 오류는 안정된 `error` code로 정규화한다: `MAP_PROVIDER_QUOTA_EXCEEDED`(503), `MAP_PROVIDER_AUTHENTICATION_FAILED`(기본 502), `MAP_PROVIDER_TIMEOUT`(504), `MAP_PROVIDER_UNAVAILABLE`(기본 502), `MAP_PROVIDER_INVALID_RESPONSE`(기본 502). 외부 provider의 raw message·payload는 client나 로그에 전달하지 않으며, 정상 응답의 빈 route는 별도 `RouteNotFoundError`로 구분한다.
- 장소 검색 응답은 `provider`, `provider_place_id?`, `attribution`을 보존한다. place-detail은 기존 nullable 값과 함께 필드별 `KNOWN | UNKNOWN | UNSUPPORTED` 상태를 반환하며, FE 표시가 완료되기 전에도 기존 UI 계약은 유지된다.
- Kakao route 화면은 `alternatives=false` 상태에서 `RECOMMEND`, `DISTANCE`, `TIME`을 각각 호출해 최대 3개 경로를 구성한다. Kakao API의 추가 priority인 `MAIN_ROAD`, `NO_TRAFFIC_INFO`는 현재 UI에 노출하지 않는다. stopby 시간은 선택된 route priority로 다시 계산한다.
- 앱 언어는 최초 설치 후 첫 실행에서만 기기 locale로 정해(`ko*`→`ko`, 그 외→`en`) AsyncStorage `language` key에 즉시 저장한다. 이후에는 저장값이 authoritative하며 드로어에서 한국어/English를 수동 선택한다. 기기 언어 변경이나 foreground 복귀가 저장값을 덮어쓰지 않는다.
- 사용자가 언어를 바꾸면 language와 해당 언어의 기본 renderer를 저장하고 request language를 즉시 갱신한다. transient 지도 상태를 초기화한 뒤 `RootStackNavigation`만 새 `언어-renderer` key로 remount한다. `RecoilRoot`, 언어 초기화, 전역 toast는 remount하지 않는다.
- `axiosDefault`/`axiosInstance`는 요청 시작 언어를 캡처한다. 응답 시 현재 언어와 다르면 성공 응답도 의도적 cancellation로 폐기하며 사용자 로그·alert·toast를 만들지 않는다.
- `ProviderContext`가 `Accept-Language`를 language/region/units로 정규화하고 `MarketConfig`가 주소·장소·경로상 검색의 언어 policy, route/stopby의 좌표 policy, place-detail provider를 선언적으로 결정한다. `MapService`는 controller wire contract를 유지하는 facade이며 6개 application use case로 위임한다.
- Google adapter는 request context의 언어를 사용하고 Kakao 요청은 기존 한국어 동작을 유지한다. route/stopby 결과는 언어가 아니라 좌표 지역으로 선택된 단일 provider에서 받으며 provider 간 fallback은 없다. 임의의 장소명·즐겨찾기·검색 기록은 번역하지 않는다. category는 stable id/code를 사용하고 기존 backend payload shape를 유지한 채 한국어 Kakao query 또는 영어 Google query를 같은 `query` field로 보낸다. 단위는 현재 모두 metric이다.
- FE 지도 화면은 드로어 `지도 설정`에서 `국내 지도`(Naver)와 `구글맵`(react-native-maps Google provider) 중 선택한다. 최초 설치 후 첫 실행에서 앱 언어 기본값(한국어 Naver, 영어 Google)을 AsyncStorage `mapRenderer` key에 저장한다. 이후 사용자가 지정한 값은 앱 재시작과 기기 언어 변경에도 유지되며, 앱 언어를 수동 변경할 때만 새 언어 기본값으로 재설정된다. renderer 선택은 지도 타일에만 적용되며 Kakao/Google 데이터 API provider 정책과 독립이다.
- 지도 center는 임의 좌표로 초기화하지 않는다. `mapCenterState`/`lastCenterState`의 기본값은 `null`이고, 일반 지도는 실제 위치, 경로 선택 지도는 start/waypoint/end geometry, 지도 직접 선택 화면은 last center → global center → 실제 위치 순서로 초기화한다. 유효 center가 생기기 전 native map을 mount하지 않으며 위치 실패 시 번역된 재시도 UI를 표시한다.
- 지도 native key 배선: Android는 `app/build.gradle`이 FE `.env`의 Android Google/Naver 값을 manifest placeholder로 주입하고, iOS는 `Inject Map API Configuration` build phase가 iOS Google/Naver 값을 빌드 산출물 Info.plist에만 주입한다. 실제 값은 source plist·문서·Git에 저장하지 않는다.
- `react-native-maps` `1.29.0`, `@mj-studio/react-native-naver-map` `2.9.0`, GoogleMaps pod `9.4.0`, NMapsMap pod `3.23.2`를 RN 0.86 renderer 기준으로 사용한다.
- FE는 pnpm `node-linker=hoisted`(`OnMyWay_FE_V3/.npmrc`)를 사용한다. React Native gradle 스크립트가 flat `node_modules` 경로를 요구한다.
- `PlaceInputHeader`의 세 action은 icon-only SVG와 typed dictionary의 RN `Text`를 사용한다(`place.current`, `favorite.short`, `map.selectTitle`). 한글 outline glyph가 포함된 기존 SVG는 active UI에서 사용하지 않는다.
- Google 키는 환경별로 나누지 않고 용도별 3개만 사용한다: Android(`com.omw.omw_front` + debug/Play App Signing SHA-1, Android SDK만), iOS(`com.omw.onmywayapp`, iOS SDK만), server(Places API (New)·Routes API·Geocoding API만).
- 개발 중 BE는 localhost `3005`에서 실행한다(3000·3001은 다른 로컬 프로젝트가 점유). Nest의 환경변수 미지정 fallback도 `3005`이며 FE는 `SERVER_PORT`만 BE `PORT`와 맞춘다. host는 `Platform.OS`로 자동 선택된다(iOS `localhost`, Android `10.0.2.2`).
- 실기기에는 `SERVER_BASEURL=http://{개발 Mac IP}:3005` 형태를 사용한다. Production build에서는 `SERVER_BASEURL`이 필수이며 `http://` 또는 `https://`를 포함한 전체 origin을 지정한다. URL에 port가 없으면 scheme 기본값(HTTP 80, HTTPS 443)이 사용된다.
- Production BE는 Railway 등 배포 플랫폼이 주입한 `PORT`를 우선하고 `0.0.0.0`에 bind한다. 외부 HTTP/HTTPS와 TLS는 reverse proxy에서 종료하므로 Nest에 80/443을 직접 고정하지 않는다.
- server 키는 개발 중 localhost BE에서만 사용한다. Railway 배포는 개발 완료 후 진행하며 같은 키를 Railway Variables에 등록한다. application restriction은 우선 적용하지 않고, 추후 static outbound IP 도입 시 로컬 호출 정책을 재검토한다.
- `.env.example`은 이름과 placeholder만, Git에서 제외된 `.env`는 실제 값만 담는다. 키 값은 문서·채팅·Git에 기록하지 않는다.

## 5. 현재 toolchain·주요 dependency

| 영역              | 현재 기준                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Node              | 루트/FE/BE `.nvmrc`: `22.13.0`                                                                                              |
| pnpm              | 루트/FE/BE `10.15.1`                                                                                                        |
| FE                | React Native `0.86.2`, React `19.2.3`, New Architecture/Hermes                                                              |
| FE 핵심           | React Navigation `7.3.16`, NativeWind `4.2.6`, Reanimated `4.5.1`, Worklets `0.10.1`, Zustand `5.0.14` facade, Axios `1.19.0` |
| native/OTA        | Expo `57.0.12`, expo-updates `57.0.13`, Naver renderer `2.9.0`, react-native-maps `1.29.0`; EAS Update native client 구성 완료 |
| BE                | NestJS `11.1.28`, Express `5.2.1`, TypeScript `5.9.3`, Axios `1.19.0`                                                       |
| Android           | JDK 17, compile/target SDK 36, min SDK 24, build tools 36, NDK `27.1.12297006`, Kotlin `2.1.20`                               |
| iOS               | Expo factory AppDelegate, minimum deployment target `16.4`, CocoaPods workspace, GoogleMaps `9.4.0`, NMapsMap `3.23.2`; unsigned generic simulator compile 성공, runtime smoke 대기 |

주의: 다음 Store candidate는 Android/iOS 모두 build/code `17`이며, production 제출 전 channel embedding, OTA runtime/rollback/offline gate와 실제 device smoke가 남아 있다.

### Local release 검증 상태 (2026-08-14)

- Android `:app:processReleaseMainManifest`와 `:app:bundleRelease` 성공. fresh artifact에서 기존 application ID, `2.1.2 (17)`, min SDK 24, target SDK 36, Expo update metadata, embedded bundle, non-empty fingerprint asset을 확인했다.
- iOS app/project/test deployment target은 `16.4`다. Expo/RN source Pod graph에서 unsigned generic simulator compile이 성공했고 built app에 `Expo.plist`가 포함됐다.
- 위 검증은 local compile/artifact 검사다. 실제 simulator/device runtime, Store 업로드, Play App Signing 연결, production API 및 OTA 동작을 완료한 것으로 간주하지 않는다.
- BE는 NestJS `11.1.28`/Express `5.2.1`/TypeScript `5.9.3`로 전환되었고 Express 5 wildcard middleware, Swagger 11 nested array schema, Jest `src/*` alias를 반영했다. 기존 unit 5 suites/5 tests와 `/health` e2e 1 test가 통과했다.
- Android Naver SDK R8 stack-map warning, Android SDK XML tool-version 및 Gradle 10 예정 deprecation, iOS upstream deprecation warning은 현재 non-blocking이며 후속 toolchain 정리 대상으로 추적한다.

## 6. 루트 명령

```bash
corepack enable
pnpm install       # BE/FE 설치 + Bundler/CocoaPods 설치
pnpm dev           # BE + Metro
pnpm dev:reset     # BE + Metro (--reset-cache)
pnpm dev:ios       # BE + Metro + iOS
pnpm dev:ios:reset # BE + Metro (--reset-cache) + iOS
pnpm dev:android   # BE + Metro + Android
pnpm dev:android:reset # BE + Metro (--reset-cache) + Android
pnpm build         # BE build
pnpm prod          # BE production build/run
```

## 7. 새 Mac 복원 체크리스트

1. Node/JDK/Xcode/Android SDK를 위 기준에 맞추고 `corepack enable` 실행.
2. FE/BE `.env.example`을 `.env`로 복사한 뒤 실제 값은 안전한 원본에서 복원.
3. 동일 upload keystore를 `OnMyWay_FE_V3/android/app/my-upload-key.keystore`에 복원.
4. `~/.gradle/gradle.properties`에 네 signing 항목을 복원하고 `chmod 600` 적용.
5. `pnpm install` 후 `./gradlew signingReport`로 release 인증서와 Play Upload certificate 일치 확인.
6. `node_modules`, `Pods`, `build`, `.gradle`, `.xcode.env.local`은 이전 Mac에서 복사하지 않고 다시 생성.
7. Store 제출 직전 앱 ID, version/build, signing, Google key restriction을 다시 확인.

과거 Git history에 있었던 signing 비밀번호는 노출된 것으로 취급한다. keystore의 암호화 백업을 확보한 뒤 비밀번호 교체 여부를 결정하고, 실제 credential은 계속 Git 밖에서 관리한다.
## 8. App Store·Google Play 업데이트 runbook

> 이 앱은 기존 Store 앱의 업데이트다. 새 app record를 만들지 않고 기존 application/bundle identity, Apple Team, Android upload key와 Play App Signing 연결을 유지한다. credential 입력과 Store 제출은 사용자가 interactive terminal 또는 Store Console에서 직접 수행한다.

### 8-1. 버전과 배포 경계

- 현재 공개 버전은 `2.1.2 (16)`이고 local/Preview candidate는 `2.1.2 (17)`이다.
- Android는 모든 업로드에서 `versionCode`를 증가시킨다. 사용자에게 표시할 `versionName`은 최종 제품 버전과 맞춘다.
- iOS TestFlight에는 `2.1.2 (17)` candidate를 사용할 수 있지만, 이미 공개된 `2.1.2`의 후속 App Store 버전은 App Store Connect에서 더 높은 incremental marketing version을 생성해야 한다. 최종 값은 출시 범위를 확정한 뒤 `<NEXT_VERSION>`으로 결정하고 iOS/Android/app config를 함께 맞춘다.
- 같은 marketing version의 재업로드라도 Android `versionCode`와 iOS build number는 이전 업로드보다 항상 커야 한다. 실패한 업로드의 번호도 재사용하지 않는다.
- JS/asset만 바뀌고 native runtime이 동일하면 OTA 후보가 될 수 있다. native dependency, Swift/Kotlin, 권한, plist/manifest, SDK 변경은 반드시 새 Store binary로 배포한다.

Apple은 기존 app record에서 incremental version을 생성하도록 안내한다: [Create a new version](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version/). Google release 생성·검토·rollout 절차는 [Prepare and roll out a release](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en)를 기준으로 한다.

### 8-2. 공통 사전 gate

- [ ] 출시 commit과 변경 범위를 고정하고 release note 초안을 작성
- [ ] `<NEXT_VERSION>`, Android `versionCode`, iOS build를 결정하고 `app.json`, Gradle, Xcode project를 동기화
- [ ] production backend origin, 지도 key restriction, OTA production channel/runtime가 production artifact에 반영됐는지 확인
- [ ] lint, typecheck, 기존 unit/e2e, Android release AAB, iOS Release archive를 통과
- [ ] 실제 Android/iOS 기기에서 공개 build `16` → 새 build 업그레이드와 fresh install을 모두 검증
- [ ] 위치 허용/거부/재시도, Naver/Google renderer, 주소·장소·경로·경로상 검색, 장소 상세, 외부 길안내를 smoke test
- [ ] Preview OTA download/restart, offline startup, update-server 장애, incompatible runtime 거부, rollback과 embedded recovery를 통과
- [ ] 크래시 리포팅 Preview test event가 symbolicated 원본 파일/줄과 올바른 environment/build/runtime를 표시
- [ ] 개인정보처리방침, Apple privacy details, Google Data safety가 실제 수집 데이터와 일치
- [ ] API key, signing password, token, private key, `.env` 값이 source·artifact log·release note에 노출되지 않았는지 확인

위 gate 전에는 production OTA publish, App Store 심사 제출, Play production rollout을 진행하지 않는다.

### 8-3. Android: Internal → Closed → Production

1. Git에서 제외된 production `.env`와 Git 밖의 `MYAPP_UPLOAD_*` Gradle properties를 준비하고 값은 터미널 출력이나 문서에 남기지 않는다.
2. signing 연결을 확인한다.

```bash
cd OnMyWay_FE_V3/android
./gradlew signingReport
```

3. `NODE_ENV=production`으로 signed release AAB를 생성한다. `clean`은 사용하지 않는다.

```bash
NODE_ENV=production ./gradlew :app:processReleaseMainManifest :app:bundleRelease --console=plain
```

4. 산출물에서 application ID, version name/code, min/target SDK, production cleartext 차단, OTA channel/runtime/update metadata와 embedded bundle을 검사한다.
5. release AAB를 기존 Play Console 앱의 **Internal testing** release에 업로드한다. 새 앱을 만들지 않는다.
6. generated R8 `mapping.txt`와 native debug symbols를 해당 release에 연결·보존한다. 이를 제공해야 Android vitals의 obfuscated/native crash를 해석할 수 있다: [Android vitals](https://play.google.com/console/about/vitals/).
7. 내부 테스터가 Play Store를 통해 공개 build에서 업데이트하고 fresh install도 수행한다. 자동 pre-launch report, 권한, startup, 지도/검색 핵심 flow와 Sentry Preview event를 확인한다.
8. 통과한 동일 artifact를 Closed testing으로 승격해 기기/OS 범위를 넓힌다. 테스트 트랙 구성은 [Play Console testing guide](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)를 따른다.
9. 심사/정책 경고가 없고 release gate가 모두 통과하면 Production에 staged rollout한다. 초기 기준은 `5% → 25% → 100%`이며 각 단계에서 최소 관찰 시간을 두고 crash/ANR/startup/API 실패율을 확인한다. 공식 staged rollout 동작은 [Play staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en)를 우선한다.
10. 심각한 문제가 발생하면 rollout을 즉시 중단한다. 이미 배포된 Android artifact는 낮은 `versionCode`로 되돌릴 수 없으므로 수정본은 더 높은 `versionCode`로 빌드한다. native runtime이 같은 JS 문제만 OTA rollback 대상으로 처리한다.

### 8-4. iOS: TestFlight → App Review → Phased Release

1. production `.env`, production OTA channel/runtime, 기존 bundle identity와 Apple Team을 확인한다.
2. 최종 App Store 제출 전 `<NEXT_VERSION>`을 공개 `2.1.2`보다 높은 marketing version으로 정하고 iOS build number도 마지막 업로드보다 증가시킨다.
3. CocoaPods가 동기화된 workspace를 Xcode에서 연다.

```bash
open OnMyWay_FE_V3/ios/omw_front.xcworkspace
```

4. scheme `omw_front`, Release, generic iOS device로 `Product > Archive`를 실행한다. Organizer에서 Validate 후 기존 App Store Connect app record로 Upload한다.
5. 해당 archive의 dSYM과 OTA/embedded JS source map을 release 기록과 함께 보존하고 crash service에 업로드한다.
6. 처리된 build를 먼저 TestFlight Internal Testing에 배포한다. 공개 App Store build에서 TestFlight build로의 업데이트와 fresh install을 실제 기기에서 검증한다.
7. TestFlight crash/session/feedback, Sentry Preview event, 핵심 flow와 OTA recovery gate를 확인한다. TestFlight는 crash feedback과 build metrics를 제공한다: [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
8. 필요하면 External Testing과 Beta App Review를 거쳐 테스트 범위를 확장한다.
9. App Store Connect의 기존 app record에서 `<NEXT_VERSION>`을 만들고 build를 연결한다. What’s New, support/privacy URL, export compliance, privacy details, 심사 메모와 필요한 demo 정보를 갱신한 뒤 Submit for Review한다.
10. 승인 후 자동 전체 공개 대신 phased release를 우선 사용한다. startup crash, 지도/API 실패와 사용자 피드백을 관찰하면서 진행하며 필요하면 pause한다: [Apple phased release](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases/).
11. 심각한 native 문제가 있으면 phased release를 중단하고 더 높은 build/version의 수정본을 제출한다. 호환되는 JS 문제만 OTA rollback으로 복구한다.

### 8-5. Production 배포 후 확인

- [ ] Sentry Production, App Store Connect crash feedback, Android vitals에서 새 version/build만 필터링
- [ ] startup crash, ANR, error-free session, backend 5xx/timeout, 지도 provider 오류와 핵심 검색 성공률 관찰
- [ ] rollout 단계마다 진행/중단 판단, 시각, 지표와 담당자를 `PROGRESS_LOG.md`에 기록
- [ ] release commit, Store version/build, runtime/channel, AAB/archive, dSYM, mapping/native symbols, JS source map을 같은 release manifest로 보존
- [ ] 이전 정상 Store artifact와 runtime별 정상 OTA update를 최소 1개 유지
- [ ] 100% 배포와 안정화 관찰이 끝난 뒤에만 release TODO 완료 처리

Store가 제공하는 보고만으로는 실시간 JS 오류가 충분하지 않으므로 [Expo의 Sentry 연동 가이드](https://docs.expo.dev/guides/using-sentry/)를 기준으로 Sentry 계열 도구와 Store 보고를 함께 사용한다. 정밀 위치·경로·검색어·인증 정보는 수집하지 않으며 초기 Session Replay와 screenshot은 비활성화한다.

Content was rephrased for compliance with licensing restrictions.