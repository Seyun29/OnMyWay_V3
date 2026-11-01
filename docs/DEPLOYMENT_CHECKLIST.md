# Production 배포·OTA 체크리스트

> 기준일: 2026-08-18 (화)
> 공개 버전: Android/iOS `2.1.2 (16)` · 출시 후보: Android `2.1.2 (17)`, iOS `2.1.3 (19)`
> 공통 OTA runtime: `2.1.2-17`
> Android target API 대응 기한: 2026-08-31

## 현재 완료 상태
- [x] 레거시 Jenkins ECR/ECS 배포 파일 제거
- [x] 백엔드 Dockerfile을 Node `22.13.0`·pnpm `10.15.1` multi-stage production image로 갱신
- [x] Backend Railway production 배포와 public HTTPS endpoint `/health` 확인
- [x] Expo cloud project 연결과 EAS CLI 로그인
- [x] Expo SDK 57/`expo-updates` 네이티브 통합, update URL과 공개 build 16을 격리한 runtime `2.1.2-17` 구성
- [x] Android release AAB와 iOS unsigned compile 확인
- [ ] FE production backend 연결, OTA와 Store production 배포는 아직 수행하지 않음

## 1. 출시 기준점 고정
- [ ] 이번 릴리스의 포함·제외 범위를 확정하고 release note 작성
- [ ] 현재 FE/BE 변경과 경유지 계산 수정 검토
- [ ] lint, typecheck, unit/e2e, release build 통과
- [ ] release commit을 생성·push하고 commit SHA/tag 기록
- [ ] API key, token, signing 비밀번호, `.env`가 Git·artifact log에 없는지 확인
- [ ] 과거 노출 가능 credential의 폐기·로테이션 완료

## 2. Backend Railway Docker 배포

> Railway의 **Watch Paths**는 Git 변경에 따른 재배포 범위다. 컨테이너에서는 `nest --watch`나 파일 watcher를 실행하지 않고 `node dist/main.js`만 실행한다.
>
> Production origin: `https://onmywayv2-production.up.railway.app`
>
> 2026-08-17 확인: [`GET /health`](https://onmywayv2-production.up.railway.app/health) → HTTP `200`, `{"success":true,"data":"ok"}`

### 2-1. Source·Docker build 설정

- [x] Railway project에서 GitHub 저장소를 연결하고 Backend service 생성
- [ ] Service Settings → Source의 production branch를 실제 release branch로 고정
- [ ] **Root Directory**를 `/OnMyWay_BE_V3`로 설정
- [ ] **Railway Config File**을 `/OnMyWay_BE_V3/railway.json`으로 설정. Config 파일 경로는 Root Directory가 자동 적용되지 않으므로 저장소 루트 기준 절대 경로를 사용한다.
- [x] `railway.json`의 builder를 `DOCKERFILE`로 고정
- [x] **Watch Paths**를 `/OnMyWay_BE_V3/**`로 설정. FE·docs만 바뀐 commit은 Backend를 재배포하지 않는다.
- [x] Docker image build, runtime startup과 production deployment 완료
- [ ] Railway Build Command와 Start Command는 비워 둔다. 설치·build는 Dockerfile build stage, 실행은 Dockerfile `CMD ["node", "dist/main.js"]`가 담당한다.
- [ ] Dockerfile이 Node `22.13.0`, pnpm `10.15.1`, production dependency, non-root `node` 사용자로 실행되는지 확인
- [ ] production branch 자동 배포 사용 여부를 결정한다. 사용 시 merge 전 CI 통과를 필수로 하고, 수동 배포면 release SHA를 기록한다.

현재 저장된 `OnMyWay_BE_V3/railway.json` 기준값:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "watchPatterns": ["/OnMyWay_BE_V3/**"]
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2-2. Railway Variables와 `.env`

`.env` 파일은 Railway에 업로드하거나 Git에 커밋하지 않는다. Service → **Variables**에서 production 환경에 아래 이름을 등록한다. 값은 로컬 `OnMyWay_BE_V3/.env`의 검증된 값을 비밀 저장소에서 복사하되 문서·채팅·배포 로그에 남기지 않는다.

| 변수 | 설정 주체 | 설정 방법 |
| --- | --- | --- |
| `MODE` | 사용자 | `prod` |
| `GOOGLE_MAPS_SERVER_API_KEY` | 사용자 | Google server key 실제 값 |
| `KAKAO_API_KEY` | 사용자 | Kakao REST API key 실제 값 |
| `SWAGGER_USER` | 사용자 | 추측하기 어려운 운영 계정명 |
| `SWAGGER_PASSWORD` | 사용자 | 비밀번호 관리자에서 생성한 긴 임의 값 |
| `PORT` | Railway | **직접 등록하지 않음**. Railway가 주입하며 앱이 `0.0.0.0:$PORT`로 수신 |
| `NODE_ENV` | Dockerfile | `production`; Railway에서 중복 등록할 필요 없음 |

`DEFAULT_MAP_PROVIDER`, `ROUTE_MAP_PROVIDER`, `OPENAI_HEADER_AUTH`는 현재 코드에서 사용하지 않으므로 Railway에 등록하지 않는다.

설정 순서:

1. [ ] Service → Variables → Raw Editor 또는 New Variable에서 위 5개 사용자 변수를 입력
2. [ ] staging/preview와 production 환경이 있다면 key와 Swagger 계정을 환경별로 분리
3. [x] staged changes를 검토하고 Deploy하여 실제 컨테이너에 적용
4. [ ] 첫 정상 배포 후 API key와 Swagger password를 **Seal** 처리. Sealed value는 다시 조회·unseal할 수 없으므로 안전한 원본을 별도 보관
5. [ ] 변수 변경 시 새 deployment가 생성되는지 확인하고 이전 deployment rollback 가능 상태 유지
6. [ ] Docker build-time secret이 필요하지 않으므로 Dockerfile에 secret `ARG`/`ENV`나 `COPY .env`를 추가하지 않음

### 2-3. Health check·restart·network

- [x] Railway Healthcheck Path: `/health`
- [x] Healthcheck Timeout: `120초`. 이 시간 안에 HTTP `200`을 반환하지 못하면 새 deployment를 실패 처리
- [x] Restart Policy: `ON_FAILURE`, 최대 `10회` — Railway 기본과 동일하며 비정상 종료만 재시작
- [ ] Railway health check는 배포 전환 시에만 실행되므로 외부 uptime monitor를 별도로 구성
- [ ] production의 **Serverless/App Sleep은 비활성화**하여 모바일 첫 요청 cold start를 방지
- [ ] 사용자와 지도 provider에 지연이 가장 낮은 단일 region을 선택하고 실제 한국 네트워크에서 측정
- [x] Public Networking HTTPS domain을 생성하고 FE production origin을 `https://onmywayv2-production.up.railway.app`으로 확정
- [ ] 현재 서비스는 stateless이므로 volume을 연결하지 않음. volume은 zero-downtime 전환을 제한할 수 있음
- [ ] Dockerfile 자체 `HEALTHCHECK`와 별개로 Railway의 `/health` 설정이 deployment 화면에 표시되는지 확인

### 2-4. CPU·Memory·replica 권장값

Railway Service Settings → Deploy → **Replica Limits**에서 replica당 상한을 지정한다. 상한이 너무 낮으면 OOM/CPU throttling으로 재시작될 수 있다. Railway는 설정 상한까지 vertical scaling하며, 실제 사용량과 plan 한도를 함께 확인한다.

| 환경 | 초기 CPU 상한 | 초기 Memory 상한 | Replica | Serverless |
| --- | ---: | ---: | ---: | --- |
| Preview | `0.5 vCPU` | `512 MB` | 1 | 필요 시 활성화 |
| Production 초기 | `1 vCPU` | `1 GB` | 1 | 비활성화 |
| 트래픽 증가 후 후보 | `2 vCPU` | `2 GB` | 1→2 | 비활성화 |

위 값은 DB·파일 저장·background worker가 없고 외부 지도 API를 호출하는 현재 NestJS 서비스의 **초기 운영 권장값**이며 Railway의 고정 요구값이 아니다.

- [ ] Production을 `1 vCPU / 1 GB / 1 replica`로 시작하고 72시간 및 Store rollout 각 단계의 Metrics 기록
- [ ] CPU가 10~15분 이상 70%를 넘으면 먼저 2 vCPU로 상향
- [ ] Memory가 지속적으로 75%를 넘거나 OOM/restart가 발생하면 2 GB로 상향
- [ ] CPU·Memory 여유가 있는데 p95 latency가 목표를 초과하면 외부 provider latency, timeout, quota를 먼저 진단
- [ ] 단일 replica의 vertical scaling 후에도 포화되면 2 replicas로 수평 확장. 현재 앱은 stateless라 확장 가능하지만 요청당 외부 API quota와 비용을 함께 확인
- [ ] 7일 이상 peak CPU 30% 미만·Memory 50% 미만이면 한 단계 하향을 검토하되 Store rollout 중에는 축소하지 않음
- [ ] Railway Workspace Usage에서 비용 알림을 월 예산의 70~80%로 설정. Hard limit 도달 시 workload가 중단되므로 서비스 중단을 감수할 수 있을 때만 설정

### 2-5. 배포·검증·rollback

- [x] Railway production [`/health`](https://onmywayv2-production.up.railway.app/health)가 HTTP `200`과 `{"success":true,"data":"ok"}`를 반환
- [ ] 주소·장소·경로·경로상 검색·상세·첫/두 번째 경유지 production smoke test
- [ ] Metrics에서 startup CPU, steady memory, restart count, response latency 기준선 기록
- [ ] 로그에 API key, 요청 좌표, 검색어 원문, provider raw payload가 없는지 확인
- [ ] 새 deployment가 healthy가 된 뒤 이전 deployment가 교체되는지 확인
- [ ] 실패 시 Deployments에서 직전 정상 deployment를 Rollback/Redeploy하고 FE release를 중단

Railway 설정 근거: [Dockerfile 배포](https://docs.railway.com/builds/dockerfiles), [Root Directory와 Watch Paths](https://docs.railway.com/builds/build-configuration), [Config as Code](https://docs.railway.com/config-as-code/reference), [Variables와 sealed secrets](https://docs.railway.com/variables), [Healthchecks](https://docs.railway.com/deployments/healthchecks), [Restart policy](https://docs.railway.com/deployments/restart-policy), [Scaling](https://docs.railway.com/deployments/scaling), [Cost control](https://docs.railway.com/pricing/cost-control).

외부 문서 내용은 라이선스 준수를 위해 재서술했다.

## 3. FE production 연결·보안

`SERVER_BASEURL`은 `react-native-dotenv`가 **JS bundle 생성 시점**에 치환한다. `package.json` 또는 `app.json`에 backend URL을 넣지 않는다. `app.json`의 `updates.url`은 Expo Updates 서버 주소이므로 그대로 유지한다. Store embedded bundle과 OTA bundle은 별도로 생성되므로 양쪽 모두 동일한 production environment를 명시해야 한다.

- [x] `package.json` dependency/script 변경이 필요하지 않음을 확인
- [x] `app.json`의 Expo `updates.url`과 backend URL을 분리해 유지
- [x] `.env.example`에 Railway production endpoint 예시 추가
- [x] 로컬 ignored `.env`의 `SERVER_BASEURL`이 Railway production origin과 일치하는지 확인
- [ ] 값 변경 후 `pnpm start:reset`으로 Metro cache 초기화
- [x] EAS project의 `production` environment에 `SERVER_BASEURL=https://onmywayv2-production.up.railway.app` 등록 확인
- [x] Android/iOS native 지도 설정이 EAS environment를 우선하고 로컬 `.env`로 fallback하도록 구성
- [ ] production Store build와 production OTA 모두 EAS `production` environment를 사용
- [ ] production artifact에 localhost, `10.0.2.2`, 개발 IP와 cleartext HTTP가 없는지 확인
- [ ] OTA 미수신·offline startup에서도 embedded bundle이 Railway production endpoint를 호출하는지 확인
- [ ] Android Maps key에 package와 Play App Signing SHA-1 제한 적용
- [ ] iOS Maps key에 bundle ID 제한, server key에 필요한 API만 허용
- [ ] Google/Kakao attribution 및 개인정보처리방침·Data Safety·Apple privacy 정보 확인

### 로컬 release bundle 확인

ignored `OnMyWay_FE_V3/.env`에 production URL을 설정한 뒤 다음을 실행한다. `.env`는 커밋하지 않는다.

```bash
corepack pnpm@10.15.1 --dir OnMyWay_FE_V3 run bundle:android
corepack pnpm@10.15.1 --dir OnMyWay_FE_V3 run bundle:ios
```

## 4. EAS Build·Update 채널 구성
- [x] `eas.json`에 `development`, `preview`, `production` build profile 정의
- [x] 각 profile에 동일 이름의 `environment`와 `channel`을 매핑
- [x] `appVersionSource: local`로 기존 Android/iOS build 17을 유지하고 잘못 생성된 remote versionCode 2를 사용하지 않도록 설정
- [x] EAS project의 `preview`·`production` environment에 `SERVER_BASEURL`과 native 지도 설정 변수 등록 확인
- [x] EAS CLI `21.8.0`, 게시 계정 `andrewjsy`, project ID 연결 확인
- [x] Android preview cloud build가 SDK 57·`2.1.2 (17)`·runtime `2.1.2-17`·`preview` channel로 성공
- [x] 첫 Android Preview APK signer가 기존 Play Upload certificate와 불일치함을 발견하고 Production build를 차단
- [x] 기존 `my-upload-key.keystore`를 EAS Android default credential로 등록. alias·비밀번호·fingerprint는 문서·Git·채팅에 기록하지 않음
- [x] credential 교체 후 Android Preview cloud build를 재생성하고 APK signer가 기존 Play Upload certificate와 일치함을 확인
- [x] 동일 credential로 Android Production AAB를 `production` environment/channel·runtime `2.1.2-17`로 생성
- [x] Production AAB signer가 기존 Play Upload certificate와 일치함을 확인
- [x] Production AAB embedded JS bundle에 Railway production origin이 포함되고 localhost·`10.0.2.2` 개발 origin이 없음을 확인
- [ ] Production OTA 게시 시 `eas update --channel production --environment production` 사용
- [ ] Store 제출은 실기기·OTA recovery·정책 gate 통과 후 별도로 수행
- [ ] Expo 2FA와 최소 publish 권한을 고정
- [ ] production publish 2인 검토와 감사 기록 절차 정의
- [ ] Free plan OTA MAU 사용량을 확인하고 한도 도달 전 plan 변경 기준 설정
- [ ] Preview와 Production binary/update의 `runtimeVersion`이 정확히 일치하는지 확인. native 변경 시 build 번호와 runtime을 함께 증가

## 5. Preview OTA·실기기 gate
- [ ] Preview channel을 포함한 Android/iOS release 설치본 생성
- [ ] Preview OTA 게시 후 다운로드·재시작 적용과 핵심 지도/검색 flow 확인
- [ ] offline startup과 update server 장애 시 기존 bundle 시작 확인
- [ ] incompatible runtime update 거부 확인
- [ ] 이전 정상 update 재게시 rollback과 embedded bundle recovery 리허설
- [ ] 정상 update group ID, runtime, channel, commit SHA 기록

## 6. 관측·크래시 대응
- [ ] Preview/Production 크래시 리포팅을 구성하고 환경·build·runtime·update ID 태깅
- [ ] 정밀 위치·전체 경로·검색어·API key를 event/breadcrumb에서 제거
- [ ] Preview test error/crash의 원본 파일·줄 symbolication과 alert 확인
- [ ] iOS dSYM, Android R8 mapping/native symbols, OTA JS source map 보존·업로드

## 7. 최종 버전·서명 artifact
- [ ] 공개 `2.1.2`보다 높은 `<NEXT_VERSION>` 결정
- [ ] Android versionCode와 iOS build가 Store의 마지막 사용 번호보다 큰지 확인
- [ ] `app.json`, Gradle, Xcode의 version/build를 동기화
- [ ] Android `signingReport`와 Play Upload certificate 일치 확인
- [ ] production channel/backend를 포함한 signed AAB 생성·metadata 검사
- [ ] iOS Release Archive 생성, Validate 후 dSYM과 source map 보존
- [ ] 실제 기기에서 공개 build 16→후보 upgrade와 fresh install 모두 검증

## 8. Android Store 배포 — 최우선
- [x] 기존 Play 앱용 `2.1.2 (17)` Production AAB 생성과 Upload certificate signer 일치 확인
- [ ] EAS에 Google Play Service Account key를 대화형으로 등록하고 Internal testing `draft`에 AAB 업로드
- [ ] Play Console에서 Play App Signing 연결과 draft artifact metadata 확인
- [ ] pre-launch report, Android 15+, 권한·지도·검색·경로·경유지 smoke 통과
- [ ] 동일 artifact를 Closed testing으로 승격
- [ ] 정책 경고가 없으면 Production `5% → 25% → 100%` staged rollout
- [ ] 2026-08-31 전 target API 35+ production 게시와 Play 경고 해제 확인

## 9. iOS Store 배포
- [x] 공개 `2.1.2`보다 높은 marketing version `2.1.3`과 build `19`로 EAS Production IPA 생성
- [x] IPA embedded JS bundle에 Railway production origin이 있고 로컬 개발 origin이 없음을 확인
- [x] `ITSAppUsesNonExemptEncryption=false`를 native Info.plist와 Expo config에 반영
- [x] 기존 App Store Connect 앱에 `2.1.3 (19)` 업로드 및 처리 완료 — `VALID`, Internal TestFlight `IN_BETA_TESTING`
- [ ] TestFlight Internal에서 공개 build 16→19 upgrade/fresh install 및 OTA recovery gate 통과
- [ ] App Store Connect의 `2.1.3` 버전에 build 19를 연결하고 privacy·심사 정보·release note 갱신
- [ ] App Review 제출 후 phased release
- [ ] 심각한 문제 발생 시 release를 pause하고 더 높은 build로 수정

## 10. Production OTA·운영 종료
- [ ] Store production channel binary 배포 후 Preview 검증된 JS/asset만 production OTA 게시
- [ ] production update ID/runtime/channel/commit/release note를 release manifest에 기록
- [ ] startup crash, ANR, backend 5xx/timeout, provider 오류와 핵심 검색 성공률 관찰
- [ ] JS 문제는 이전 정상 OTA 재게시, native 문제는 rollout 중단 후 새 Store build로 복구
- [ ] 직전 정상 Store artifact와 runtime별 정상 OTA를 최소 1개 보존
- [ ] 100% rollout과 안정화 관찰 후 `PROGRESS_LOG.md`에 결과 기록