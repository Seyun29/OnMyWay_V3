# legacy

2024년에 직접 만들고 운영했던 OnMyWay 백엔드·인프라 구성이다.

| 폴더 | 시기 | 내용 |
| --- | --- | --- |
| [`OnMyWay_AUTH_V2/`](OnMyWay_AUTH_V2) | 2024.08 | Spring Boot 인증·프록시 서버. API 서버 앞단에서 JWT 인가와 reverse proxy, 병목 경로 캐싱을 맡았다 |
| [`OnMyWay_K8S_V2/`](OnMyWay_K8S_V2) | 2024.11–12 | API·인증 서버를 Kubernetes 매니페스트로 다시 구성한 버전 |

## 2024.08 — ECS Fargate 고가용성 구조 (LG CNS 인턴 최종 과제)

단일 EC2로 운영하던 첫 버전(2024.06 출시)을 컨테이너 기반으로 옮겼다. 기존 API 서버 코드는 건드리지 않는다는 조건이 있어서, 앞단에 인증·프록시 계층을 따로 두는 구조로 갔다.

<img width="640" alt="ECS Fargate architecture" src="https://github.com/user-attachments/assets/16607980-d5a2-4b9d-8b09-9e347c169aa4">

- 요청 흐름: ALB → `omw_auth`(Spring) → 내부 ALB → `omw_api`(NestJS) → Kakao API
- `omw_auth`: Spring Security 필터 체인으로 JWT(access/refresh) 검증, Spring Cloud Gateway로 프록시, 병목 API 경로 캐싱. 사용자 DB는 RDS MySQL(개발은 H2)
- 두 서비스 모두 2개 AZ의 ECS Fargate에 배포하고 CloudWatch 지표로 Auto Scaling(태스크 1–3개)
- CI/CD: GitHub push → Jenkins(EC2) → Docker build → ECR push → `aws ecs update-service --force-new-deployment`
- Private subnet, NAT, Bastion host로 네트워크를 나눴다

<img width="420" alt="Auth server stack" src="https://github.com/user-attachments/assets/6d27154c-c449-4b30-b1fe-aa531588165e">

### JMeter 부하 테스트 (7,500 요청)

| | 전환 전 (단일 서버) | 전환 후 |
| --- | --- | --- |
| 처리 | 4,994건 처리 후 서버 다운 | 7,500건 모두 응답 |
| 에러율 | 59.25% | 15.25% |
| 평균 응답 | 62.6초 | 7.2초 |
| CPU 최대 | 99.7% | 35% |

처리량(5.3/sec)은 그대로였다. 개선은 서버가 죽지 않고 에러와 응답 시간이 줄어든 쪽이다. 장소 검색(`/map/keyword-search`)은 에러 34%가 남았다.

<img width="640" alt="JMeter result after migration" src="https://github.com/user-attachments/assets/a62b01de-063d-4d44-bf48-11a13f1550a5">

## 2024.11–12 — Kubernetes (`OnMyWay_K8S_V2/`)

같은 두 백엔드를 Kubernetes 매니페스트로 다시 구성했다. 설정은 [`OnMyWay_K8S_V2/master-deployment.yaml`](OnMyWay_K8S_V2/master-deployment.yaml) 한 파일에 있다.

```text
Client
  │
  ▼
Service onmyway-auth (LoadBalancer :80 → 8080)
  │
  ▼
Deployment onmyway-auth × 2   Spring Security(JWT) + Spring Cloud Gateway
  │  PROXY_ADDRESS=onmyway-api.default
  │  route uri = http://${ONMYWAY_API_SERVICE_HOST}:8080
  ▼
Service onmyway-api (LoadBalancer :8080 → 80)
  │
  ▼
Deployment onmyway-api × 2    NestJS (PM2)
```
