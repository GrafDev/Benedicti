# Task: Redesign Match Pairs game screen

## ID

TASK-014

## Role

builder-code

## Goal

Polish the active Match Pairs gameplay screen so it visually matches the new rank setup reference style: softer dark-blue/gold/green palette, cleaner top HUD, and more refined word cards.

## Allowed Files

- src/pages/MatchPairs.module.css
- src/pages/MatchPairs.tsx
- public/assets/match-pairs/game-background.png

## Forbidden Files

- public/assets/match-pairs/ranks/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- Update only the active gameplay screen styling and minimal markup needed for styling.
- Keep the visual language consistent with the rank setup reference:
  - deep navy background,
  - soft blue/green card surfaces,
  - gold accents,
  - subtle borders and shadows,
  - no harsh high-contrast panels.
- Use the existing gameplay background asset:
  - `public/assets/match-pairs/game-background.png`
  - show it only during the active gameplay screen, not the rank setup screen,
  - keep the center readable with overlays/gradients if needed,
  - do not replace or regenerate this image.
- Improve the gameplay HUD:
  - back button, score, time, errors, and current rank should feel like one designed system,
  - HUD must remain readable at desktop and mobile widths,
  - avoid oversized empty spacing when possible.
- Improve word/translation cards:
  - cards should look softer and more premium,
  - selected/correct/wrong/shuffling states must remain visually distinct,
  - text must stay centered/readable and not overflow.
- Keep the two-column matching layout and all existing game interactions intact.
- Do not change gameplay logic, repeat-click logic, scoring, timer, mistakes, learned-word progression, dictionary filtering, rank setup screen, or image assets.
- Do not add new images or generated artwork.
- Do not modify `public/assets/match-pairs/game-background.png`; only reference it from CSS/markup.
- Avoid nested card-in-card styling unless it is functionally necessary.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally:
  - start an available rank and inspect the active game screen at desktop width,
  - check selected, correct, and wrong card states,
  - check the layout at a narrow/mobile width,
  - confirm there is no horizontal overflow and no text overlap.

## Notes

User reference:

- Current gameplay screen feels too plain compared to the redesigned rank setup.
- Use the rank setup screenshot as the target visual direction.
- Keep colors softer and closer to the reference, especially the navy/blue/green/gold palette.
- A background image has already been generated and saved at `public/assets/match-pairs/game-background.png`.
- The background has a humble village/citizen side on the left, a calm readable center, and an imperial/castle side on the right.
- The central matching field should be narrower than the first mockup concept, leaving some of the background visible on both sides.

This task is a visual polish task only. Preserve all behavior from `TASK-013`.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-014-redesign-matchpairs-game-screen.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5176/play/match-pairs/default`: passed; inspected setup and active gameplay at desktop and mobile widths, selected/correct/wrong card states, no page-level horizontal overflow or text overlap.

Notes:
- Added a gameplay-only root class and referenced the existing gameplay background asset only in PLAY phase.
- Polished the active gameplay HUD, progress bar, central play field, and word cards with softer navy, blue, green, and gold treatments.
- Preserved gameplay logic, repeat-click logic, scoring, timer, mistakes, learned-word progression, dictionary filtering, rank setup screen, and image assets.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- public/assets/match-pairs/game-background.png
- tasks/review/TASK-014-redesign-matchpairs-game-screen.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The TSX change is limited to adding a PLAY-phase container class, and the rest of the gameplay redesign is CSS-only.
- The generated background asset is referenced only through the gameplay container styling, keeping the rank setup screen separate.
- The central game area is narrower, with the background visible around it, and HUD/card styling now follows the softer navy/blue/green/gold reference direction.
- No gameplay logic, repeat-click behavior, scoring, timer, mistakes, learned-word progression, dictionary filtering, rank setup behavior, or rank assets were changed.
