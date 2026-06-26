# Task: improve Match Pairs rank state contrast

## ID

TASK-008

## Role

builder-code

## Assigned To

Builder AI only.

Artist AI must not take this task.

If Artist AI opens this task, it must stop immediately and take only tasks whose `## Role` starts with `artist-`.

## Goal

Improve the visual contrast of Match Pairs rank cards and rank path states so completed/perfect and ready ranks are clearly distinguishable from locked ranks.

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

- Completed/perfect rank cards must have a clearly visible green success treatment.
- Ready rank cards must have a clear active/available treatment, visually stronger than locked cards.
- Locked cards must remain muted and visually secondary.
- Card backgrounds must visibly change between perfect, ready, and locked states.
- Rank path items must also show meaningful state differences, not only text labels.
- The visual hierarchy should be closer to a game progression screen:
  - passed/perfect: green and rewarding
  - ready/current: active and inviting
  - locked: dim and unavailable
- Keep the existing neutral icon approach; do not add Russian-imperial, double-headed eagle, or Russian-looking heraldic symbols.
- Do not change game logic, rank unlock logic, word selection, dictionary loading, Leitner behavior, Firebase data shape, or gameplay mechanics.
- Do not introduce new dependencies.
- Desktop and mobile layouts must remain stable without text overlap.
- Card border radius must remain 8px or less.
- Letter spacing must remain 0.

## Checks

- npm run build
- git diff --check
- Manual visual check at desktop width for perfect, ready, and locked states
- Manual visual check at mobile width for perfect, ready, and locked states

## Notes

- User feedback: completed/available items should look greener and more alive; current cards are too faded and the background barely changes.
- The previous accepted redesign is in `tasks/done/TASK-007-redesign-matchpairs-setup-screen.md`.
- Preserve unrelated dirty files and unrelated user changes.
- Do not commit, push, deploy, or move this task to `tasks/done`.
- When finished or blocked, append a `Builder Report` to this file and move it from `tasks/todo` to `tasks/review`.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-008-improve-matchpairs-rank-state-contrast.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual visual check at desktop width for perfect, ready, and locked states: not run visually because the in-app Browser webview did not attach; completed code-level CSS state review instead.
- Manual visual check at mobile width for perfect, ready, and locked states: not run visually because the in-app Browser webview did not attach; completed code-level responsive CSS state review instead.

Notes:
- Added explicit ready and readyPath classes using existing rank state calculations only; no game logic, unlock logic, word selection, dictionary loading, Leitner behavior, Firebase data shape, or gameplay mechanics were changed.
- Perfect rank cards and path items now use green success backgrounds, borders, markers, and status pills; ready items use stronger teal active treatment; locked items remain muted and secondary.

## Lead Review

Status: accepted

Notes:
- Reviewed the Builder Report and the actual diff in `src/pages/MatchPairs.tsx` and `src/pages/MatchPairs.module.css`.
- Verified that perfect/completed rank cards now use a visible green success treatment.
- Verified that ready rank cards and path items have a stronger active treatment than locked items.
- Verified that locked cards remain visually secondary.
- No changes to word selection, dictionary loading, Leitner behavior, Firebase data shape, rank unlock rules, or gameplay mechanics were found in the diff.
- `npm run build` passed during Lead review.
- `git diff --check` passed for the task files during Lead review.
- Local browser check confirmed distinct perfect, ready, and locked visual states.
