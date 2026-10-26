---
inclusion: always
---

# Definition of Done

A task is done when it is **verified**, not when the code is written.

## Every change

1. Run the verification commands from `tech.md` for each side you touched. Run the narrowest useful set while iterating and the full set before closing.
2. If behaviour changed, update the owning document in the same change (see `structure.md`).
3. Add a `docs/PROGRESS_LOG.md` entry (newest first) with:
   - what changed and why
   - what was verified, and how (command, artifact check, or live request against localhost)
   - what was **not** verified (simulator, real device, store, OTA)
4. Leave no `TODO` / `FIXME` / `HACK` markers in active source. Move real follow-ups into
   `docs/MIGRATION_PLAN.md` or `docs/ARCHITECTURE.md` with a completion condition.

## Honest status words

| Word | Use only when |
| --- | --- |
| *compiles* | the build command succeeded |
| *verified locally* | a live request or artifact inspection confirmed the behaviour |
| *verified on device* | a person checked it on a simulator or real device |
| *shipped* | the store listing or production endpoint shows it |

Never upgrade a status word without the matching evidence. "Store upload", "production OTA publish"
and "commit/push" are human-approved steps. Record them as *not performed* until a person does them.
