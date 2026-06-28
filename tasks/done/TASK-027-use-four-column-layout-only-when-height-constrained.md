# Task: Use four-column Match Pairs layout only when height constrained

## ID

TASK-027

## Role

builder-code

## Goal

Fix the Match Pairs gameplay tablet layout so the four-column layout is used only when there is not enough vertical space. If the viewport has enough height for the normal two-column gameplay layout, keep the two-column layout.

## Context

`TASK-017` introduced a tablet four-column layout for the entire `700px-1180px` viewport range. This is too aggressive: on an iPad/tablet portrait viewport there can be enough vertical space, but the UI still switches to four columns. The user expects four columns only as a fallback when the board is height-constrained.

User clarification:

- "Only if there is not enough height."
- The screenshot shows an iPad/tablet portrait view with enough board height, but the game is still rendered as four columns. That should remain two columns.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/todo/TASK-027-use-four-column-layout-only-when-height-constrained.md

## Forbidden Files

- package.json
- package-lock.json
- public/assets/match-pairs/*
- firebase.json
- .firebaserc
- tasks/done/*
- tasks/review/*
- PROCESS.md
- AGENT_ROLES.md

## Acceptance Criteria

- Match Pairs gameplay uses the normal two-column layout by default on tablet viewports when there is enough vertical space.
- The four-column tablet layout is used only when vertical height is constrained enough that the two-column layout would not comfortably fit the active visible cards.
- Do not switch to four columns based only on viewport width or "tablet" range.
- The iPad/tablet portrait case similar to the user screenshot should remain two columns when the active level has only a few visible rows and enough vertical room.
- High ranks such as King and Emperor should still be able to use four columns on shorter tablet/laptop-height viewports when two columns would overflow vertically.
- Preserve the existing mobile behavior: no horizontal overflow; vertical scroll is acceptable when necessary.
- Preserve the desktop gameplay layout.
- Preserve answer-side shuffle behavior from `TASK-025`/`TASK-026`: board-contained flight, no fixed viewport overlay, no special flight border/glow, no landing flash, answer cards unlock after flight.
- Preserve selected/correct/wrong states, scoring, timer, mistakes, level completion, results modal layout, background image/fade, dictionary filtering, learned-word progression, ranks, rank assets, and Firebase behavior.
- Do not reintroduce anti-cheat guard/tracker logic.
- Do not add dependencies.

## Implementation Guidance

- Prefer a CSS-first solution if possible:
  - keep `.desktopColumns` visible for tablet widths by default,
  - enable `.tabletColumns` only under a height-constrained media query or equivalent class,
  - use viewport height and available board height as the deciding factor, not width alone.
- If CSS alone is too blunt, a small React-side measurement is acceptable:
  - measure whether the two-column board would overflow the available `gameArea` height for the current visible card count,
  - enable the four-column layout only while that overflow/height pressure exists,
  - avoid layout thrashing and keep the measurement simple and stable.
- Keep the shared render helpers from `TASK-017`; do not duplicate game logic.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check to confirm forbidden old anti-cheat names are absent:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
- Run an `rg` check to confirm the old viewport overlay approach is absent:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`
- Manually inspect `/play/match-pairs/default` locally:
  - tablet portrait viewport similar to the user screenshot: confirm two columns are used when height is sufficient,
  - shorter tablet/laptop-height viewport: confirm four columns are used only when needed to avoid vertical overflow,
  - high rank such as King/Emperor if available: confirm it still fits better on constrained height,
  - mobile/narrow viewport: confirm no horizontal overflow and usable scrolling,
  - answer a correct pair: confirm answer shuffle still works, cards stay inside the board, no special flight border/glow, no landing flash, and cards unlock after flight.

## Notes

This task corrects the responsive condition introduced by `TASK-017`; it should not change the gameplay mechanics.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-027-use-four-column-layout-only-when-height-constrained.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-027-use-four-column-layout-only-when-height-constrained.md`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Manual `/play/match-pairs/default`: passed on available local rank. Tablet portrait `834x1112` and taller tablet `1024x900` stayed on the normal two-column board; constrained `1024x768` used the four-column board; mobile `390x844` had no horizontal overflow. A correct answer pair still triggered board-contained answer flight cards with no overlay clones, no special flight border/glow, locked involved answer cards during the motion window, and unlocked cards after the flight.

Notes:
- Moved the four-column tablet board styles out of the width-only tablet media query and into a height-constrained media query: `(min-width: 769px) and (max-width: 1180px) and (max-height: 820px)`.
- Kept the tablet game area width and padding adjustment in the width-based media query.
- Did not change answer shuffle mechanics or reintroduce anti-cheat guard/tracker logic.
- High ranks were not locally available; the constrained-height breakpoint was verified with the available rank.
- Process conflict noted: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: returned

Review Notes:
- The implementation still switches to four columns based on a fixed viewport height threshold (`max-height: 820px`) instead of actual vertical fit for the current visible card count.
- Local verification at `1024x768` with the available rank showed only 8 visible gameplay cards and about 462px of answer stage height. This is enough room for the normal two-column layout, but `.desktopColumns` was hidden and `.tabletColumns` was displayed.
- This reproduces the core user complaint: four columns are used even when there is enough vertical space. The requirement is not "height below a fixed number"; it is "two columns unless the current board would not fit vertically."

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local browser check at `1024x768`: failed acceptance because the short available rank used four columns despite enough vertical room.

Required Changes:
- Replace the fixed `max-height: 820px` switch with a fit-based condition.
- Prefer measuring whether the two-column board would overflow the available stage/game area for the current visible row count.
- Keep two columns for short ranks at `1024x768` and similar viewports when the cards fit vertically.
- Keep four columns available for high ranks or genuinely constrained heights where two columns would overflow.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-027-use-four-column-layout-only-when-height-constrained.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Manual `/play/match-pairs/default`: passed for the returned layout issue. At `1024x768` with the available 4-pair rank, the board stayed in the normal two-column layout with the desktop columns visible and tablet columns hidden. At `1024x430`, the measured stage was genuinely constrained and the four-column tablet layout activated. At `834x1112`, the board stayed two-column. At `390x844`, there was no horizontal overflow. Correct-pair smoke advanced the score and kept the old viewport overlay absent.

Notes:
- Replaced the fixed `max-height: 820px` media-query switch with a React-side fit check based on current visible row count and measured `answerFlightStage` height.
- The four-column CSS now activates only when `tabletFourColumnLayout` is applied, within the tablet width range.
- Kept short ranks in two columns at the Lead-failing `1024x768` case.
- High ranks were not locally available; the genuinely constrained fallback was verified by reducing available stage height.
- Process conflict remains: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: accepted

Review Notes:
- Accepted. The fixed height breakpoint was replaced with a measured fit check based on visible row count and `answerFlightStage` height.
- Confirmed the previous failing case at `1024x768` with 8 visible cards now keeps the normal two-column layout.
- Confirmed a genuinely constrained viewport at `1024x430` activates the four-column layout.
- Confirmed tablet portrait `834x1112` remains two-column and mobile `390x844` has no horizontal overflow.
- The change stays scoped to layout selection and does not reintroduce the old anti-cheat guard or fixed viewport overlay approach.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local browser layout checks:
  - `1024x768`: two-column layout, no horizontal overflow.
  - `1024x430`: four-column layout activated by measured height constraint.
  - `834x1112`: two-column layout.
  - `390x844`: no horizontal overflow.
