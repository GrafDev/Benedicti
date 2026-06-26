# Task: stabilize DictSaber game loop state

## ID

TASK-003

## Role

builder-code

## Goal

Make the DictSaber animation loop robust against stale React state and repeated `requestAnimationFrame` scheduling issues.

## Allowed Files

- src/pages/DictSaber.tsx

## Forbidden Files

- src/components/MigrationManager.tsx
- src/pages/Home.tsx
- src/stores/useDictionaryStore.ts
- vite.config.ts
- package.json

## Acceptance Criteria

- The game loop uses current score, energy, and phase values when ending a game.
- Animation frames are cancelled reliably when leaving play mode or unmounting.
- No new gameplay behavior is introduced outside loop stability.
- The task explains any remaining React Hooks lint warnings if global lint still fails.

## Checks

- `npm run build`
- `npm run lint` or document remaining pre-existing lint failures in the Builder Report.
- Manual smoke check: start DictSaber, miss cards until game over, confirm highscore uses the final score.

## Notes

The initial review found React lint warnings around `updateGame`, `Math.random`, and mutable local state. Focus first on runtime correctness.

## Builder Report

Status: completed

Changed Files:
- src/pages/DictSaber.tsx

Checks Run:
- `npm run build`: passed
- `npm run lint`: failed due to pre-existing global lint issues outside `src/pages/DictSaber.tsx`, including `no-explicit-any`, React hook purity/static checks, and unrelated errors in files such as `src/components/AuthModal.tsx`, `src/components/Header.tsx`, `src/pages/Dictionaries.tsx`, `src/pages/NBack.tsx`, and `src/stores/useDictionaryStore.ts`
- `npx eslint src/pages/DictSaber.tsx`: passed
- Manual smoke check: not run; Vite dev server started successfully after sandbox approval, but browser automation was blocked because Playwright's bundled Chromium is not installed and system Chrome automation failed with `kill EPERM`

Notes:
- Reworked the DictSaber animation loop to use refs for current `phase`, `score`, and `energy` so game-over handling saves the final score instead of stale React state.
- Added centralized animation-frame cancellation for game over, leaving play mode, restarting, and unmount cleanup.
- Removed the prior self-referential `updateGame` callback scheduling path and kept gameplay rules unchanged.

## Lead Review

Status: accepted

Notes:
- Verified that `phase`, `score`, and `energy` have refs used by the animation loop and game-over path.
- Verified that `cancelAnimationFrame` is centralized and used when leaving play mode, restarting, ending the game, and unmounting.
- `npm run build` passes.
- `npx eslint src/pages/DictSaber.tsx` passes.
- Manual browser smoke was not completed due to local browser automation limitations documented in the Builder Report; no blocking issue found in code review.
