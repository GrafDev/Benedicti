# Task: Fade in Match Pairs gameplay background

## ID

TASK-016

## Role

builder-code

## Goal

Make the Match Pairs gameplay background transition in smoothly instead of appearing with a sharp visual jump when entering the active game screen.

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

- When switching from rank setup to active gameplay, the gameplay background should fade in smoothly.
- The transition should feel calm and premium, matching the new navy/gold style.
- Avoid flashing, white frames, or sudden background jumps.
- The fade must not delay or block gameplay interactions.
- The results modal fix from `TASK-015` must remain intact.
- The rank setup screen should keep its existing background and should not unexpectedly show the gameplay background.
- Do not change gameplay logic, scoring, timer, mistakes, repeat-click behavior, learned-word progression, dictionary filtering, modal behavior, or assets.
- Prefer a CSS-only solution unless a very small class/markup adjustment is necessary.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally:
  - start an available rank and confirm the background fades in rather than snapping,
  - return to setup and start again to confirm the fade is repeatable,
  - complete a level and confirm the results modal still centers correctly,
  - confirm there is no horizontal overflow or text overlap.

## Notes

User reported that the gameplay background appears with a sharp jump.

Likely implementation options:

- Use a pseudo-element on the gameplay container for `game-background.png` and animate its opacity.
- Or add a gameplay background layer/class that fades in on PLAY phase.

Keep the fix narrow and do not touch the background image file.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-016-fade-in-matchpairs-game-background.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5178/play/match-pairs/default`: passed; confirmed the gameplay background fades in on rank start, the fade repeats after returning to setup and starting again, setup does not show the gameplay background asset, the results modal remains centered and visible, and desktop/mobile checks had no horizontal overflow.

Notes:
- Replaced the direct gameplay `background` swap with a non-interactive `::before` gameplay background layer that animates opacity on PLAY entry.
- Kept gameplay interactions immediate; the fade layer uses `pointer-events: none` and only affects visuals.
- Preserved gameplay logic, scoring, timer, mistakes, repeat-click behavior, learned-word progression, dictionary filtering, modal behavior, rank setup, and background assets.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-016-fade-in-matchpairs-game-background.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The gameplay background image is now rendered through `.gameplayContainer::before` and fades in with `gameplayBackgroundIn`.
- The fade applies to the `game-background.png` layer only; HUD/cards remain interactive and are kept above the layer with z-index.
- The layer uses `pointer-events: none`, so gameplay is not blocked during the animation.
- No gameplay logic, modal behavior, rank setup behavior, or asset files were changed by this task.
