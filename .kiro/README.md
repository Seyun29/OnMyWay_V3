# .kiro

Working agreements for building OnMyWay with Kiro. The 2026 migration (React Native 0.73 → 0.86,
NestJS 10 → 11, CodePush → EAS Update, ECS/Jenkins → Docker on Railway) and the features added with it
are written down here as steering rules, specs and hooks.

```text
.kiro/
├── steering/                                   rules the agent always (or selectively) follows
│   ├── product.md                              what OnMyWay is, principles, out of scope
│   ├── tech.md                                 pinned toolchain, commands, constraints
│   ├── structure.md                            repo layout, layering rules, doc ownership
│   ├── map-provider-policy.md                  fileMatch: OnMyWay_BE_V3/src/modules/map/**
│   ├── release-safety.md                       manual: #release-safety
│   ├── security-and-observability.md           secrets, keys, logging, health
│   └── definition-of-done.md                   verification and honest status words
├── specs/                                      requirements → design → tasks
│   ├── rn-086-platform-migration/
│   ├── provider-neutral-map-engine/
│   ├── bilingual-experience-and-map-renderers/
│   ├── route-corridor-search-and-waypoints/
│   └── backend-runtime-and-container-deployment/
└── hooks/
    ├── docs-sync.kiro.hook                     behaviour change → docs + progress log
    ├── secret-guard.kiro.hook                  no literal secrets in config, docs or legacy
    └── map-provider-guard.kiro.hook            provider policy + BE lint/build/test
```

## How the specs map to the work

| Spec | Outcome | Open items |
| --- | --- | --- |
| `rn-086-platform-migration` | RN 0.86.2 / React 19, Expo SDK 57 + EAS Update, store identity kept, iOS 3.0.0 on the App Store | Play production rollout, OTA recovery rehearsal, crash reporting |
| `provider-neutral-map-engine` | Kakao + Google behind ports, language- and coordinate-based routing, stable errors, place detail | contract suite, FieldMask presets, `SearchIntent` |
| `bilingual-experience-and-map-renderers` | Korean/English UI, Naver/Google renderers, session reset boundary | camera fit contract, visual matrix |
| `route-corridor-search-and-waypoints` | Buffered search corridor, best-position waypoint insertion, region-aware navigation handoff | slider clamp alignment |
| `backend-runtime-and-container-deployment` | NestJS 11 / Express 5 / Node 22, multi-stage Docker image on Railway | uptime monitor, CI gate |

Task checkboxes reflect `docs/PROGRESS_LOG.md`. A box is ticked only for work with recorded evidence.
