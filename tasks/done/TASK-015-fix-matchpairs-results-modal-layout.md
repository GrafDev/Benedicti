# Task: Fix Match Pairs results modal layout

## ID

TASK-015

## Role

builder-code

## Goal

Fix the Match Pairs end-of-game results modal layout regression introduced by the gameplay redesign. The modal must be centered and fully visible over the gameplay screen.

## Allowed Files

- src/pages/MatchPairs.module.css
- src/pages/MatchPairs.tsx

## Forbidden Files

- public/assets/match-pairs/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- The results overlay must cover the active gameplay screen correctly.
- The results modal must be centered horizontally and vertically within the viewport on desktop.
- The modal must remain fully visible on narrow/mobile viewports, with safe padding and internal scrolling if needed.
- The modal must not be pushed to the right or clipped by the redesigned `.gameArea` / gameplay container layout.
- The overlay should preserve the new gameplay background mood while dimming the game enough for readability.
- The modal visual style should remain consistent with the new navy/gold gameplay design.
- Do not change game logic, scoring, timer, mistakes, repeat-click behavior, learned-word progression, dictionary filtering, rank setup, or background assets.
- Prefer a CSS-only fix unless a very small markup/class adjustment is necessary.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually test `/play/match-pairs/default`:
  - complete a level and confirm the results modal is centered and fully visible at desktop width,
  - confirm the modal is usable at narrow/mobile width,
  - confirm the buttons inside the modal are visible and clickable,
  - confirm the gameplay screen layout still looks correct before completion.

## Notes

User screenshot shows the results modal shifted far to the right and partially clipped after level completion.

Likely area to inspect:

- `.resultsOverlay`
- `.results`
- `.gameArea`
- `.gameplayContainer`
- any parent layout constraints that affect absolute/fixed positioning.

Keep the fix narrow and safe.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-015-fix-matchpairs-results-modal-layout.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5177/play/match-pairs/default`: passed; completed a level, confirmed the results modal is centered and fully visible on desktop, fully visible on mobile, has no horizontal overflow, and the replay button is clickable.

Notes:
- Moved the results overlay outside `.gameArea` so fixed positioning is not constrained by the gameplay panel/backdrop-filter layout.
- Updated the results overlay and modal CSS for viewport-safe centering, safe mobile sizing, internal scrolling if needed, and the new navy/gold gameplay style.
- Preserved gameplay logic, scoring, timer, mistakes, repeat-click behavior, learned-word progression, dictionary filtering, rank setup, and background assets.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-015-fix-matchpairs-results-modal-layout.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The results overlay was moved outside `.gameArea`, which addresses the clipping/offset regression caused by the gameplay panel layout.
- The overlay now uses viewport-safe fixed positioning, centered grid placement, safe padding, and modal max-height/internal scrolling.
- The fix is limited to markup placement and CSS for the results modal; game logic and assets were not changed.
