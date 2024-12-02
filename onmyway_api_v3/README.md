# BackEnd Repository for [ OnMyWay - 경로 주변 장소 검색을 한눈에 ]
<img width="531" alt="image" src="https://github.com/OnMyWayDev/omw_front/assets/45298516/3165bf21-09e5-45ba-884e-5d1620142d99">
<img width="775" alt="image" src="https://github.com/OnMyWayDev/omw_front/assets/45298516/a96cd068-2ea7-4e34-9a1e-c3c13c3e8b42">
<img width="775" alt="image" src="https://github.com/OnMyWayDev/omw_front/assets/45298516/536fc1c8-3146-4a10-84fc-30513e238291">

## Prerequisites

`Node.js` = v18.16.1
If not installed, please install it using `nvm install 18.16.1`
This project uses `pnpm` as package manager. If not installed, please install it using `npm install -g pnpm`

## Automatic Node Version Switch

The repository contains `.nvmrc` file. By adding the script below to your bash configuration file (e.g.: `.zshrc`) it will automatically prompt nvm to switch to the required node version in given project.

```bash
# detect node version when navigating to projects that contain .nvmrc
cd() {
  builtin cd "$@"
  if [[ -f .nvmrc ]]; then
    nvm use
  fi
}
```

### Tech Stacks Used

`Nest.js` `TypeScript`
`ESLint` `Prettier`
`Jest` `Github Actions` `Git Flow` `pnpm`
`AWS Secrets Manager`

Grafana, Prometheus,
use MongoDB for monitoring/logging

Docker - ?
npmrc ?

Git Flow branching strategy, SourceTree for GUI
Utilize git tags for versioning

main - deploying to production, has tag for every release
develop - deploying to development,
feature/_ - new feature development
release/_ - deploying to staging
Hotfix/\* - bug fixes, merge directly to main

![GitFlow Explanation](./docs/GitflowExplanation.png)

## Algorithm
TBU

Algorithm for choosing vertexes
![algorithm draft](./docs/algorithmDraft.png)

### Prerequisites

- Node.js -> version?
- pnpm
- Nest.js installed
- typescript
  TBU

### Development
TBU
![alt text](image.png)

### Testing
TBU

### CI/CD
TBU

### Deployment
\
TBU
