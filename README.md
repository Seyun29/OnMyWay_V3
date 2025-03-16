# OnMyWay_V3

### 경로상 장소 검색/추천 서비스 OnMyWay 통합 레포지토리 (Ver 3.0, Kubernetes Architecture applied)

### Kubernetes architecture applied version of the service 'OnMyWay - place search/recommendation service along the driving route'

This is a Mono Repo containing 3 sub-repositories.

- OnMyWay_AUTH : Repository for JWT Authentication & Reverse proxy server
- OnMyWay_BE : Backend Repository
- OnMyWay_FE : Frontend(Mobile) Repository

*아래는 단일 서버로 구성된 초기 버전을 기반으로 작성된 내용입니다. 본 레포지토리(version 3)는 두 개의 백엔드 서비스에 쿠버네티스 / AWS EKS를 활용해 고가용성 아키텍처를 구현했습니다.
![image](https://github.com/user-attachments/assets/a2682d30-a7e4-4b1e-bd67-708d146a6dcf)


### Main Tech Stacks Used (To be Modified)

- OnMyWay_AUTH : Springboot, Spring Security, Spring Cloud, Spring Data JPA, MySQL, Jenkins
- OnMyWay_BE : Nest.js, Typescript, KakaoMap API, OpenAI API, Axios, Jenkins
- OnMyWay_FE : ReactNative, Typescript, NaverMap SDK, TMap SDK, Axios, MS Codepush
- Deployment & CI/CD : AWS ECS (fargate), ECR, EC2, RDS, Cloudwatch & AutoScaling, Jenkins, Docker, Kubernetes, Cloudflare

Please refer to README.md of each sub-repositories for more details.

### Service Architecture (V3)

TBU

![image](https://github.com/user-attachments/assets/06806b05-ce76-46f7-915b-67d33f3513fc)
<img width="420" alt="image" src="https://github.com/user-attachments/assets/2b7c498a-cfee-48f0-8220-6850a2a2c022">
