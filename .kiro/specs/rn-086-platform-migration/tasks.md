# Implementation Plan — React Native 0.86 Platform Migration

- [x] 1. Pin the store baseline
  - Identify the source of the public build (`release/v2.1.2`, Android/iOS `2.1.2 (16)`) and merge its release-only fixes
  - Restore the Play upload keystore outside Git and move signing passwords to `~/.gradle/gradle.properties` (600)
  - Confirm the local release SHA-1 matches the Play Console upload certificate
  - _Requirements: 1.1, 1.2_

- [x] 2. Generate the React Native 0.86.2 template and port `src/`
  - [x] 2.1 Port `src/`, `App.tsx`, Babel, Tailwind, tsconfig paths, SVG and font assets
  - [x] 2.2 Switch iOS to the Swift factory AppDelegate and re-wire Google Maps and Bootsplash
  - [x] 2.3 Android compile/target SDK 36, min SDK 24, candidate `versionCode 17`
  - [x] 2.4 Align iOS app/test/Pods deployment targets (15.1, then 16.4 once approved for Expo SDK 57)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Replace unmaintained libraries
  - NativeWind 4, React Navigation 7, Reanimated 4 + Worklets, Bootsplash, Naver renderer 2.9.0
  - Zustand 5 facade exposing `useRecoilState` / `useRecoilValue` so screens stay untouched
  - _Requirements: 2.4_

- [x] 4. Remove retired native integrations
  - [x] 4.1 Remove CodePush and App Center from JS, Gradle, `MainApplication`, `AppDelegate`, Pods, resources, plist
  - [x] 4.2 Remove TMap native SDK and bridges, keep TMAP via URL handoff
  - [x] 4.3 Remove login UI, token interceptors and OpenAI review-summary UI
  - [x] 4.4 Verify fresh release AAB contains no CodePush, App Center or TMap entries
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Restore code hygiene and tests
  - Remove every authored `@ts-nocheck` / `@ts-ignore` / `@ts-expect-error` and fix the real types
  - Remove `console.*` and enforce `no-console: error`
  - Rebuild Jest on the RN 0.86 Babel path with deterministic native mocks and an App smoke test
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Integrate Expo SDK 57 and `expo-updates` (bare workflow)
  - Manual integration (the automatic installer did not recognize RN 0.86.2)
  - Exact versions: `expo 57.0.12`, `expo-updates 57.0.13`, `babel-preset-expo 57.0.0`
  - Merge Metro/Babel config, register root component, `RCT_USE_PREBUILT_RNCORE=0` fallback on iOS
  - Verify the Android embedded bundle and fingerprint asset, and `Expo.plist` in the iOS app bundle
  - _Requirements: 4.1_

- [x] 7. Configure EAS profiles, channels and the runtime
  - `development` / `preview` / `production` profiles, each mapped to the environment and channel of the same name
  - `appVersionSource: local` to keep native build numbers authoritative
  - Explicit runtime `2.1.2-17` shared by Android and iOS
  - _Requirements: 4.2, 4.3_

- [x] 8. Build and verify Android release artifacts
  - [x] 8.1 First preview build revealed an EAS-generated keystore signer mismatch. Production build stopped
  - [x] 8.2 Register the original upload keystore as the EAS default credential and rebuild the preview APK
  - [x] 8.3 Build the production AAB `2.1.2 (17)` and verify the signer and the embedded Railway production origin
  - _Requirements: 1.3, 4.4_

- [x] 9. Ship iOS
  - [x] 9.1 Closed `2.1.2` train rejected → bump the marketing version and the build number
  - [x] 9.2 Declare exempt encryption (`ITSAppUsesNonExemptEncryption=false`) in native plist and Expo config
  - [x] 9.3 TestFlight internal build `VALID` → App Store release (`3.0.0`, 2026-08-23)
  - _Requirements: 1.2, 1.4_

- [ ] 10. Roll out Android to Google Play production
  - Register the Play service account key interactively, upload to the internal track, promote to closed testing, then staged production rollout `5% → 25% → 100%`
  - Public listing still shows `2.1.2`
  - _Requirements: 1.1, 1.2_

- [ ] 11. OTA recovery gate on real release installs
  - Preview OTA download and restart, offline start, update server failure, incompatible runtime rejection, rollback, embedded recovery
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 12. Crash reporting
  - Sentry (or equivalent) compatible with RN 0.86 / Expo 57, redaction of location, routes, queries and keys
  - dSYM, R8 mapping and JS source map upload. Verify symbolication with a controlled test crash
  - _Requirements: 6.1_

- [ ] 13. Real-device runtime smoke matrix
  - Cold start and Bootsplash, location permission flows, both renderers, all search flows, place detail, external navigation, Android 15 edge-to-edge
  - _Requirements: 2.1, 2.3_
