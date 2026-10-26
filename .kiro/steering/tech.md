---
inclusion: always
---

# Tech Stack & Commands

## Toolchain (pinned)

| Area | Version | Where it is pinned |
| --- | --- | --- |
| Node | `22.13.0` | root / FE / BE `.nvmrc`, Dockerfile, `eas.json` |
| pnpm | `10.15.1` | root `packageManager`, Dockerfile, `eas.json` |
| React Native | `0.86.2` (New Architecture, Hermes) | `OnMyWay_FE_V2/package.json` |
| React | `19.2.3` | FE |
| Expo SDK / expo-updates | `57.0.12` / `57.0.13` (bare workflow, no CNG) | FE |
| NestJS / Express / TypeScript | `11.1.28` / `5.2.1` / `5.9.3` | `OnMyWay_BE_V2/package.json` |
| Android | compile/target SDK 36, min SDK 24, JDK 17 | `android/build.gradle` |
| iOS | minimum deployment target `16.4` | `project.pbxproj`, `Podfile` |

## Key libraries

- Maps: `@mj-studio/react-native-naver-map` `2.9.0`, `react-native-maps` `1.29.0` (Google provider, **patched** — see `OnMyWay_FE_V2/patches/react-native-maps@1.29.0.patch`)
- Geometry: `@turf/buffer` for the search corridor
- State: Zustand `5` behind a `useRecoilState` / `useRecoilValue` compatibility facade (`src/state/atom.ts`)
- UI: NativeWind `4`, React Navigation `7`, Reanimated `4` + Worklets
- HTTP: Axios `1.19` on both sides

## Commands (run from the repository root)

```bash
corepack enable
pnpm install            # BE + FE + Bundler + CocoaPods
pnpm dev                # BE (watch) + Metro
pnpm dev:ios            # BE + Metro + iOS simulator
pnpm dev:android        # BE + Metro + Android emulator
pnpm dev:reset          # same as dev, Metro --reset-cache (required after .env changes)
pnpm build              # BE production build
```

Verification commands used as the definition of done:

```bash
corepack pnpm --dir OnMyWay_BE_V2 lint
corepack pnpm --dir OnMyWay_BE_V2 build
corepack pnpm --dir OnMyWay_BE_V2 test --runInBand
corepack pnpm --dir OnMyWay_BE_V2 test:e2e --runInBand
corepack pnpm --dir OnMyWay_FE_V2 lint
corepack pnpm --dir OnMyWay_FE_V2 typecheck
corepack pnpm --dir OnMyWay_FE_V2 test --runInBand
```

## Constraints that bite

- FE uses `node-linker=hoisted` (`OnMyWay_FE_V2/.npmrc`). React Native Gradle scripts need a flat `node_modules`.
- `.env` values are inlined at bundle time by `react-native-dotenv`. Reset the Metro cache after changing them.
- Local backend port is `3005` (3000/3001 are taken on the dev machine). iOS uses `localhost`, Android emulator uses `10.0.2.2`.
- Production builds must set `SERVER_BASEURL` (absolute `http(s)://` origin). The app fails fast without it.
- Any native change (dependency, Podfile, Gradle, plist, manifest, permission) needs a **new store binary and a new runtime version**. It can never ship over OTA.
- Keep build artifacts (DerivedData) outside the project. Expo fingerprinting scans the tree.
