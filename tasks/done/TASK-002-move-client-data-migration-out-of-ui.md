# Task: move bracket cleanup migration out of UI runtime

## ID

TASK-002

## Role

builder-architecture

## Goal

Remove the Firebase bracket cleanup migration from automatic app startup and define a safer one-time migration path.

## Allowed Files

- src/components/MigrationManager.tsx
- scripts/clean_database_brackets.js
- scripts/import_default_dict.js
- PROCESS.md

## Forbidden Files

- src/pages/DictSaber.tsx
- src/pages/Home.tsx
- src/stores/useDictionaryStore.ts
- package.json

## Acceptance Criteria

- Normal app startup does not attempt to mutate shared dictionary data as a client-side migration.
- Existing default dictionary import behavior remains intact.
- A clear script-based or documented migration path exists for bracket cleanup.
- The migration path is not keyed only by browser `localStorage`.

## Checks

- `npm run build`
- Manual review of Firebase write paths touched by the task.

## Notes

Client-side shared-data migrations are risky because every user browser can become a migration runner.

## Builder Report

Status: completed

Changed Files:
- src/components/MigrationManager.tsx
- scripts/clean_database_brackets.js

Checks Run:
- `npm run build`: passed
- `node --check scripts/clean_database_brackets.js`: passed
- Manual Firebase write-path review: `src/components/MigrationManager.tsx` no longer imports Realtime Database write helpers or runs bracket cleanup on app startup; bracket cleanup writes are isolated to `scripts/clean_database_brackets.js`, default to dry-run, require explicit `--write`, and write a database migration marker at `maintenance/migrations/bracketCleanupV1/...` instead of relying on browser `localStorage`

Notes:
- Existing default dictionary import startup behavior remains in `MigrationManager`.
- The one-time bracket cleanup path is now script-based: run `node scripts/clean_database_brackets.js` for dry-run, then `node scripts/clean_database_brackets.js --write` to apply the cleanup to `shared/dictionaries/dict2500/words`.

## Lead Review

Status: accepted

Notes:
- Verified that app startup no longer runs bracket cleanup or imports Firebase Database write helpers in `MigrationManager`.
- Verified that bracket cleanup is isolated to `scripts/clean_database_brackets.js`, defaults to dry-run, requires `--write`, and records a database marker.
- `npm run build` passes.
- `node --check scripts/clean_database_brackets.js` passes.
- Commit decision: wait and batch with related accepted work.
