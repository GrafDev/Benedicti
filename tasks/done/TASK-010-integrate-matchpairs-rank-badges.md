# Task: integrate Match Pairs rank badge assets

## ID

TASK-010

## Role

builder-code

## Assigned To

Builder AI only.

Artist AI must not take this task.

If Artist AI opens this task, it must stop immediately and take only tasks whose `## Role` starts with `artist-`.

## Goal

Integrate the existing Match Pairs rank badge PNG assets into the setup screen and make the rank selection layout closer to the provided reference: large polished badges on cards, smaller badges in the rank path, clearer card hierarchy, and stronger game progression feel.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/todo/TASK-010-integrate-matchpairs-rank-badges.md

## Read-Only Asset Files

- public/assets/match-pairs/ranks/citizen-badge.png
- public/assets/match-pairs/ranks/knight-badge.png
- public/assets/match-pairs/ranks/baron-badge.png
- public/assets/match-pairs/ranks/count-badge.png
- public/assets/match-pairs/ranks/duke-badge.png
- public/assets/match-pairs/ranks/king-badge.png
- public/assets/match-pairs/ranks/emperor-badge.png

## Forbidden Files

- public/assets/match-pairs/ranks/*.png
- src/stores/useDictionaryStore.ts
- src/utils/leitner.ts
- src/types.ts
- src/firebase.ts
- firebase.json
- package.json
- package-lock.json
- Any file not listed in Allowed Files

## Acceptance Criteria

- Use the existing PNG badge assets for all seven ranks.
- Rank cards must show large centered badge images similar to the reference layout.
- Rank path items must show smaller badge images, not only lucide icons.
- Preserve the existing text/rank data and rank unlock behavior.
- Preserve current perfect/ready/locked state logic from `TASK-008`.
- Perfect/completed cards must remain clearly green and rewarding.
- Ready cards must remain visually active and clickable.
- Locked cards must remain muted and secondary.
- Card backgrounds, borders, and badges must work together visually; do not let badges look pasted on top of unrelated cards.
- Layout should move closer to the reference:
  - larger game badges
  - clearer level number or rank progression cue
  - stronger card hierarchy
  - readable status and action controls
  - balanced grid with less unused empty space
- Do not add Russian-imperial symbols, double-headed eagles, or Russian-looking heraldry.
- Do not introduce new dependencies.
- Do not change word selection, dictionary loading, learned words / Leitner progression, Firebase data shape, rank unlock rules, or gameplay mechanics.
- Desktop and mobile layouts must remain stable without text overlap.
- Card border radius must remain 8px or less.
- Letter spacing must remain 0.

## Checks

- npm run build
- git diff --check
- Manual local browser check at `http://localhost:5176/play/match-pairs/default`
- Manual responsive check for desktop and mobile widths

## Notes

- The user wants the result to feel like the provided reference screen, especially the rank badge treatment.
- The assets already exist in `public/assets/match-pairs/ranks/`; do not regenerate or edit them in this task.
- `TASK-009` is still in review and should not be touched by Builder.
- Preserve unrelated dirty files and unrelated user changes.
- Do not commit, push, deploy, or move this task to `tasks/done`.
- When finished or blocked, append a `Builder Report` to this file and move it from `tasks/todo` to `tasks/review`.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-010-integrate-matchpairs-rank-badges.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-010-integrate-matchpairs-rank-badges.md`: passed
- Manual local browser check at `http://localhost:5176/play/match-pairs/default`: passed; verified 14 rendered badge images, 7 unique rank badge asset URLs, and no page-level horizontal overflow at desktop width.
- Manual responsive check for desktop and mobile widths: passed; verified desktop badge/card rendering and mobile page width stayed within viewport, with the rank path scrolling inside its own container.

Notes:
- Integrated existing read-only PNG rank badges into both rank cards and the rank path without editing the asset files.
- Preserved TASK-008 ready/perfect/locked state logic and treatments while making cards badge-first with large centered badges and smaller path badges.
- No game logic, rank unlock rules, word selection, dictionary loading, Leitner behavior, Firebase data shape, dependencies, or gameplay mechanics were changed.

## Lead Review

Status: returned

Issues:
- The rank card corner cue renders `rank.count` instead of the rank progression number. This produces values like 4, 5, 6 instead of the reference-style level numbers 1, 2, 3.
- Lead browser verification could not be completed because the in-app browser automation was blocked by browser security policy, so the task needs a focused fix and another Builder browser/manual check.

Required Changes:
- Change the card-level cue to use the rank progression index (`index + 1`) rather than `rank.count`.
- Keep the pair count in the existing rank description text only.
- Re-run `npm run build`.
- Re-run `git diff --check`.
- Re-run the local visual check for `http://localhost:5176/play/match-pairs/default`, confirming the card corner cue shows 1 through 7 and that badges still render on both cards and rank path.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-010-integrate-matchpairs-rank-badges.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-010-integrate-matchpairs-rank-badges.md`: passed
- Manual local browser check at `http://localhost:5176/play/match-pairs/default`: passed; verified card corner cues show `1, 2, 3, 4, 5, 6, 7`.
- Manual responsive check for desktop and mobile widths: passed; verified 7 rank card badges, 7 rank path badges, all 7 unique PNG asset URLs, and no page-level horizontal overflow at desktop or mobile width.

Notes:
- Fixed the returned issue by changing the card-level cue from `rank.count` to `index + 1`.
- Pair counts remain only in the existing rank description text.
- No game logic, rank unlock rules, word selection, dictionary loading, Leitner behavior, Firebase data shape, dependencies, or gameplay mechanics were changed.

## Lead Review

Status: accepted

Notes:
- Reviewed the repeated Builder Report and the actual diff in `src/pages/MatchPairs.tsx` and `src/pages/MatchPairs.module.css`.
- Verified that rank cards and rank path use the existing badge PNG assets from `/assets/match-pairs/ranks/`.
- Verified that the card corner cue now uses the progression number (`index + 1`) rather than `rank.count`.
- Verified that pair counts remain in the rank description text.
- No changes to word selection, dictionary loading, learned words / Leitner progression, Firebase data shape, rank unlock rules, or gameplay mechanics were found in the diff.
- `npm run build` passed during Lead review.
- `git diff --check` passed for the task files during Lead review.
