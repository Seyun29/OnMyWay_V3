# Requirements Document — React Native 0.86 Platform Migration

## Introduction

OnMyWay shipped in June 2024 on React Native 0.73.6 / React 18.2 with Microsoft CodePush for OTA updates.
App Center (and with it CodePush) was retired on 2025-03-31, and Google Play requires a target API of
35+ for new installs from 2026-08-31. This spec moves the shipped app to React Native 0.86.2 / React 19
(New Architecture, Hermes) and replaces CodePush with EAS Update, **without losing the existing store
identity, signing key or upgrade path of current users**.

## Requirements

### Requirement 1 — Store continuity

**User Story:** As an existing user, I want the new version to arrive as a normal update of the app I already have, so that I keep my favorites and do not reinstall anything.

#### Acceptance Criteria

1. WHEN a release binary is built THEN the build SHALL keep application ID `com.omw.omw_front`, bundle ID `com.omw.onmywayapp`, the existing Apple team and the existing App Store / Play records.
2. WHEN a release binary is built THEN Android `versionCode` and iOS build number SHALL be greater than every number previously uploaded (public baseline: `2.1.2 (16)`).
3. IF the signer of a cloud-built artifact does not match the Play upload certificate THEN the production build SHALL be stopped until the original upload key is used.
4. WHEN App Store Connect rejects a closed marketing-version train THEN the marketing version SHALL be increased instead of reusing the train.

### Requirement 2 — Platform upgrade

**User Story:** As the maintainer, I want the app on a current React Native baseline, so that native dependencies, store policies and OTA tooling are supported again.

#### Acceptance Criteria

1. The app SHALL run on React Native `0.86.2` and React `19.2.3` with the New Architecture and Hermes enabled.
2. WHEN migrating THEN `src/` SHALL be ported onto a freshly generated 0.86 template rather than upgraded in place (13 minor versions plus the New Architecture switch).
3. Android SHALL compile and target SDK 36 with min SDK 24. iOS SHALL use minimum deployment target 16.4 for the app, test and Pods targets.
4. Unmaintained libraries SHALL be replaced: `react-native-nmap` → `@mj-studio/react-native-naver-map`, Recoil → Zustand (behind a compatibility facade that keeps existing call sites), NativeWind 2 → 4, React Navigation 6 → 7, `react-native-splash-screen` → `react-native-bootsplash`.

### Requirement 3 — Retired and unused native code removed

**User Story:** As the maintainer, I want dead SDKs gone from both JavaScript and native code, so that two OTA loaders never compete and old keys stop shipping in binaries.

#### Acceptance Criteria

1. CodePush and App Center SHALL be removed from `package.json`, Gradle, `MainApplication`, `AppDelegate`, Pods, resources and `Info.plist`.
2. The TMap native SDK and bridges SHALL be removed. TMAP handoff SHALL use a credential-free app URL.
3. The login UI, token interceptors and OpenAI review-summary UI SHALL be removed (the auth server and the summary endpoint are no longer deployed).

### Requirement 4 — OTA updates through EAS Update

**User Story:** As the maintainer, I want an OTA client inside the first new production binary, so that JavaScript hotfixes do not each need a store review.

#### Acceptance Criteria

1. The first production binary SHALL contain `expo-updates`, the EAS update URL, a production channel and an explicit runtime version.
2. EAS build profiles `development`, `preview` and `production` SHALL each map to the EAS environment and update channel of the same name.
3. Android and iOS binaries with the same native API surface SHALL share one runtime version (`2.1.2-17`).
4. WHEN a production artifact is built THEN its embedded JS bundle SHALL contain the Railway production origin and SHALL NOT contain `localhost`, `10.0.2.2` or other development origins.
5. IF a change touches native code, dependencies, permissions, plist or manifest THEN it SHALL ship only as a new store binary with a new runtime version.

### Requirement 5 — Code hygiene

#### Acceptance Criteria

1. Authored FE code SHALL contain no `@ts-nocheck`, `@ts-ignore` or `@ts-expect-error`.
2. Authored FE and BE code SHALL contain no `console.*` calls, enforced by `no-console: error`.
3. Jest SHALL run on the React Native 0.86 Babel path with deterministic native mocks and at least an App render smoke test.

### Requirement 6 — OTA recovery gate (open)

**User Story:** As a user, I want the app to start even if an update is broken or the update server is down.

#### Acceptance Criteria

1. WHEN the device is offline or the update server fails THEN the app SHALL start from the embedded or last good bundle.
2. WHEN an update targets a different runtime THEN installed binaries SHALL reject it.
3. WHEN a bad update is published THEN republishing the previous good update SHALL restore users. Embedded recovery SHALL be rehearsed on real iOS and Android release installs.
