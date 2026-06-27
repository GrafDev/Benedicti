# Task: Polish answer-side shuffle flight animation

## ID

TASK-021

## Role

builder-code

## Goal

Make the Match Pairs answer-side shuffle animation feel smooth and beautiful. The involved answer cards should visibly lift, fly/swap positions, and settle, instead of jumping or moving with jerky snaps.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css

## Forbidden Files

- public/assets/match-pairs/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- Preserve the answer-side shuffle mechanic from `TASK-020`:
  - after a correct replacement, shuffle up to three answer-side cards,
  - include the newly appeared replacement answer card,
  - do not shuffle original-word cards,
  - do not reintroduce anti-cheat guard/tracker logic.
- Improve only the visual animation quality of the answer-side shuffle.
- The involved answer cards should:
  - visibly lift first,
  - travel smoothly toward their new positions,
  - settle softly,
  - feel simultaneous but layered,
  - use z-index separation so cards do not look like one flat layer.
- Avoid jerky movement, instant position pops, or same-position wiggles.
- The lift should be visible; use scale/translate/shadow if helpful.
- The animation must not permanently shift layout or leave cards offset.
- During the flight animation, clicks on the moving answer cards should be disabled or safely ignored.
- Keep the correct-pair bounce/wiggle animation intact.
- Keep tablet four-column layout intact.
- Preserve scoring, timer, mistakes, learned-word progression, dictionary filtering, results modal, rank setup, background assets, Firebase behavior, and task process files.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check to confirm old anti-cheat guard names are still absent:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
- Manually inspect `/play/match-pairs/default` locally:
  - complete a correct pair,
  - confirm the three answer-side cards lift visibly before/during movement,
  - confirm the movement is smooth rather than jerky,
  - confirm cards settle into final positions without offset,
  - confirm click behavior remains safe during animation,
  - confirm tablet/mobile layouts remain usable.

## Notes

User feedback:

- Current cards do not really lift.
- They move jerkily instead of flying smoothly.
- The goal is a visually pleasing card-flight animation.

Implementation guidance:

- Consider a two-phase approach:
  1. Mark selected answer cards as "lifting" before the order update.
  2. On the next animation frame, update `rightColumn` and apply FLIP translate values.
  3. Animate from old positions to new positions while elevated.
  4. Clear animation state after the transition.
- If using FLIP, capture old rects before the order update and new rects after React commits the new order. Avoid measuring both before the DOM has changed.
- Use CSS variables for x/y/z/scale only if they are computed from real old/new rects.
- Keep the code local and avoid large architectural changes.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-021-polish-answer-side-shuffle-flight-animation.md

Checks Run:
- `npm run build`: passed.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches.
- Manual browser check on `http://127.0.0.1:5183/play/match-pairs/default`: passed for completing a correct pair, observing three answer cards in `answerShuffleLift`, observing three answer cards in `answerSideShuffle`/`answerSideShuffleAppearing`, confirming moving answer cards are disabled during lift/flight, confirming per-card z-index separation, confirming final transform settles back to identity, and confirming tablet `900x720` plus mobile `390x844` have no horizontal overflow.

Notes:
- Added a two-phase answer-side shuffle animation: selected answer cards lift in place after replacement, then the `rightColumn` order updates and the cards fly into their shuffled slots.
- Moved FLIP measurement into an effect that runs after the lift state is rendered, so CSS variables are based on actual visible card rects.
- Kept the TASK-020 shuffle mechanic intact and did not reintroduce anti-cheat guard/tracker logic.
- Process conflict noted: the task requires appending this Builder Report and moving the task into `tasks/review`, while the task file's Allowed Files only list app code and Forbidden Files include `tasks/review/*`; followed `PROCESS.md` and `BUILDER_PROMPT.md` for task workflow artifacts.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-021-polish-answer-side-shuffle-flight-animation.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches

Notes:
- Accepted. The answer-side shuffle now has a separate lift phase before `rightColumn` order changes, followed by FLIP-style flight and settle.
- Moving cards are disabled during lift/flight, and the animation uses per-card z-index/CSS variables for layered motion.
- The `TASK-020` shuffle mechanic remains intact and old anti-cheat guard/tracker logic was not reintroduced.
