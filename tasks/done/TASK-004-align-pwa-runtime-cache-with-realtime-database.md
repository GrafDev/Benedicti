# Task: align PWA runtime cache with Realtime Database

## ID

TASK-004

## Role

builder-architecture

## Goal

Review and adjust PWA runtime caching so it matches the Firebase products actually used by the app.

## Allowed Files

- vite.config.ts
- src/firebase.ts
- README.md

## Forbidden Files

- src/pages/DictSaber.tsx
- src/components/MigrationManager.tsx
- src/pages/Home.tsx
- package.json

## Acceptance Criteria

- Workbox runtime caching no longer targets only Firestore when the app uses Realtime Database.
- Any chosen Realtime Database caching strategy is justified in code comments or README notes.
- PWA asset references are consistent with files present in `public/`.

## Checks

- `npm run build`
- Inspect generated `dist/manifest.webmanifest` for missing icons.

## Notes

This is a configuration task. Avoid broad PWA redesign.

## Builder Report

Status: completed

Changed Files:
- vite.config.ts

Checks Run:
- `npm run build`: passed
- Inspect generated `dist/manifest.webmanifest` for missing icons: passed; all manifest icon `src` values resolve to `favicon.png`, which is present
- Generated service worker inspection: passed; runtime caching now targets Realtime Database hosts with `NetworkOnly` and no longer registers a Firestore-only runtime cache

Notes:
- Replaced the stale Firestore `StaleWhileRevalidate` runtime cache with a Realtime Database `NetworkOnly` route because learning progress and highscores should not be served from a stale cache.
- Updated `includeAssets` to reference only `favicon.png`, matching the files currently present in `public/`.

## Lead Review

Status: accepted

Notes:
- Verified that Workbox no longer registers a Firestore-only runtime cache.
- Verified that Realtime Database requests are routed through `NetworkOnly`.
- Verified that generated `dist/manifest.webmanifest` references only `favicon.png`, which exists in `public/`.
- `npm run build` passes.
