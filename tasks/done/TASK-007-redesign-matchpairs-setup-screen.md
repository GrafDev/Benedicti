# Task: redesign Match Pairs setup screen

## ID

TASK-007

## Role

builder-code

## Goal

Redesign the Match Pairs setup / level-selection screen so it feels polished, dense, readable, and appropriate for a modern gamified language-learning app.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css

## Forbidden Files

- src/stores/useDictionaryStore.ts
- src/utils/leitner.ts
- src/types.ts
- src/firebase.ts
- firebase.json
- package.json
- package-lock.json
- Any file not listed in Allowed Files

## Acceptance Criteria

- The setup screen no longer feels like a large empty dark-blue canvas.
- The screen has a compact top command area with the back action, title, dictionary selector, and mode toggle.
- The screen shows useful game/dictionary summary information, such as available words, available ranks, and perfect/completed ranks.
- Rank selection is visually clearer than before and includes obvious states for ready, locked, and perfect/completed ranks.
- The rank progression should feel like a coherent game progression path or ladder.
- Desktop layout must be balanced and readable.
- Mobile layout must not overflow, overlap, or hide important controls.
- Long dictionary names and locked-rank messages must not break the layout.
- Game logic must remain unchanged:
  - word selection
  - dictionary loading
  - learned words / Leitner progression
  - rank unlock rules
  - gameplay mechanics
  - Firebase data shape
- Use neutral UI symbols and lucide icons only.
- Do not use Russian-imperial symbols.
- Do not use a double-headed eagle.
- Avoid Russian-looking heraldry entirely.
- If any eagle or heraldic symbol is considered, prefer avoiding it for this screen. If unavoidable, it must be neutral single-headed European styling.
- Card border radius must be 8px or less.
- Do not put cards inside cards.
- Do not create a landing page or marketing hero.
- Do not add visible instructional text explaining how to use the screen.
- Do not scale font size with viewport width.
- Letter spacing must be 0.
- Avoid a one-note dark blue/slate palette; use restrained accent colors such as teal and gold if appropriate.

## Checks

- npm run build
- git diff --check
- Manual responsive check for desktop and mobile widths

## Notes

- There may already be unauthorized draft changes in the allowed files from the Lead AI. Treat them as an untrusted draft, not as accepted work.
- First inspect the current working tree and decide whether to keep, fix, replace, or simplify those draft changes.
- Preserve unrelated dirty files and unrelated user changes.
- Do not commit, push, deploy, or move this task to `tasks/done`.
- When finished or blocked, append a `Builder Report` to this file and move it from `tasks/todo` to `tasks/review`.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-007-redesign-matchpairs-setup-screen.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual responsive check for desktop and mobile widths: passed by code-level review of desktop, tablet, mobile, and narrow-mobile CSS breakpoints; browser visual automation was not run in this environment.

Notes:
- Kept the existing task draft where it matched the goal, then tightened it to the task constraints: compact setup toolbar, dictionary/mode controls, summary metrics, rank ladder, and clear ready/locked/perfect rank states.
- Preserved game logic and data flow; changes are limited to setup-screen rendering and styling in the allowed files.

## Lead Review

Status: accepted

Notes:
- Reviewed the Builder Report and the actual diff in `src/pages/MatchPairs.tsx` and `src/pages/MatchPairs.module.css`.
- Verified that the setup screen was redesigned with a compact toolbar, summary metrics, rank path, and clearer rank states.
- No changes to word selection, dictionary loading, Leitner progression, Firebase data shape, or gameplay mechanics were found in the diff.
- `npm run build` passed during Lead review.
- `git diff --check` passed for the task files during Lead review.
- Browser visual automation was not run; residual risk is limited to fine visual tuning after manual product review.
