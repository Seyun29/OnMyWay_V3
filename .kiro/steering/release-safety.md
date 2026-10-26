---
inclusion: manual
---

# Release Safety

Include with `#release-safety` before touching `android/`, `ios/`, `app.json`, `eas.json`, signing or store metadata.

## Identity never changes

- Android application ID `com.omw.omw_front`, iOS bundle ID `com.omw.onmywayapp`, the existing Apple team and App Store record.
- The Play **upload key** is the original keystore. Never let a tool generate a new one.
  If a build's signer does not match the Play upload certificate, **stop the production build**. This happened once with an EAS-generated remote keystore. The fix was to register the original keystore as the EAS default credential and rebuild.
- Credentials (keystore, passwords, service account keys, Apple sessions) are entered by a human in an interactive terminal. They never go into the repo, docs, chat or logs.

## Numbers only go up

- Android `versionCode` and iOS build number increase on every upload, including failed ones.
- iOS cannot reuse a closed marketing-version train. Bump the marketing version when App Store Connect rejects the train.

## OTA vs store binary

| Change | Ship via |
| --- | --- |
| JS/TS logic, copy, layout, bundled images and fonts | OTA (EAS Update), if the runtime matches |
| Native dependency, SDK, Podfile, Gradle, Swift/Kotlin | **New store binary + new runtime version** |
| Permissions, `Info.plist`, `AndroidManifest.xml`, entitlements | **New store binary + new runtime version** |
| Anything that changes what the app is for | Store review. Never use OTA to bypass review. |

- The runtime version is explicit (`2.1.2-17`), shared by Android and iOS because their native API surface is the same. Local and cloud fingerprints differed, so the fingerprint policy was dropped.
- EAS build profiles `development`, `preview` and `production` each map to the EAS environment **and** update channel of the same name.
- Production binaries must embed the Railway production origin. They must contain no `localhost`, no `10.0.2.2` and no cleartext development origin. Check the artifact, not the config.

## Gates before production

1. lint, typecheck, unit and e2e tests, Android release AAB, iOS Release archive
2. Real-device smoke: location allow/deny/retry, both renderers, address, place, route, along-route search, place detail, external navigation
3. OTA: preview update download and restart, offline start, update server down, incompatible runtime rejected, rollback, embedded recovery
4. Privacy labels (App Store) and Data safety (Play) match what the app actually collects
5. Staged rollout: Play `5% → 25% → 100%`, App Store phased release. Watch crashes, ANRs, 5xx and provider errors at each step.

End-to-end OTA code signing (EAS Production plan, $199/month) is intentionally **not** enabled for the
current consumer release. Reconsider only for a B2B/enterprise signed-artifact requirement or a threat
model where a compromised Expo account must not be able to publish.
