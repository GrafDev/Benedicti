# Task: Rework answer shuffle with overlay clones

## ID

TASK-022

## Role

builder-code

## Goal

Replace the current jerky answer-side shuffle animation with a smooth overlay-clone flight animation. The visual cards should fly on a temporary overlay layer while the real answer buttons stay stable until the animation completes.

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
  - include the newly appeared replacement answer,
  - do not shuffle original-word cards,
  - do not reintroduce anti-cheat guard/tracker logic.
- Replace the current grid-card FLIP animation if needed; the current animation still looks jerky.
- Use a temporary overlay/floating-card approach:
  - capture source and destination rects,
  - render visual clone cards in an overlay above the game board,
  - hide or visually freeze the real involved answer cards during flight,
  - animate clone cards smoothly from source rects to destination rects,
  - commit the real `rightColumn` reorder only after the flight completes,
  - remove clones and reveal real cards after the animation.
- The animation should visibly:
  - lift cards first,
  - fly smoothly,
  - have slight scale/shadow depth,
  - use different z-index layers,
  - settle cleanly without any snap, double image, or permanent offset.
- During the overlay flight, involved answer cards must not be clickable.
- Keep the animation tasteful and short enough for gameplay.
- Preserve the correct-pair bounce/wiggle animation.
- Preserve tablet four-column layout and mobile behavior.
- Preserve gameplay background, fade-in, results modal, scoring, timer, mistakes, learned-word progression, dictionary filtering, rank setup, rank assets, Firebase behavior, and task process files.

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
  - confirm three answer-side visual cards fly smoothly on an overlay,
  - confirm there is no jerky DOM snap,
  - confirm involved real cards do not show duplicate/confusing content during flight,
  - confirm final answer positions are correct,
  - confirm correct and wrong matching still work,
  - confirm tablet/mobile layouts remain usable.

## Notes

User feedback:

- The current animation is better than before but still has jerky movement and looks bad.
- Do not just tweak easing again.
- Use a more robust visual approach that separates animation from layout reflow.

Implementation guidance:

- A good approach is:
  1. Compute `nextRightColumn` and the three shuffled card moves.
  2. Measure source rects for current cards and destination rects for target slots.
  3. Render overlay clone cards using fixed/absolute positioning relative to viewport or game area.
  4. Keep the real cards hidden/invisible in their old/current slots during flight.
  5. Animate clones with CSS transitions or Web Animations API.
  6. After animation, set `rightColumn` to `nextRightColumn`, clear overlay state, and reveal real cards.
- Prefer simple React state and CSS transitions over a large animation library.
- Keep the existing shuffle behavior and cleanup old unsuccessful animation state/classes if they are no longer needed.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-022-rework-answer-shuffle-with-overlay-clones.md

Checks Run:
- `npm run build`: passed.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches.
- Manual browser check on `http://127.0.0.1:5183/play/match-pairs/default`: passed for correct replacement, three overlay clone cards flying, hidden/disabled real answer cards during flight, no leftover overlay/hidden cards after flight, final answer positions, wrong match mistake count, tablet `900x720`, and mobile `390x844` with no horizontal overflow.

Notes:
- Replaced the grid-card FLIP animation with fixed-position overlay clones that animate from measured source rects to measured destination rects.
- Real involved answer buttons remain in the stable pre-shuffle layout, hidden and disabled during flight; `rightColumn` is committed only after the overlay animation completes.
- Preserved the existing TASK-020 answer-side shuffle behavior and did not reintroduce anti-cheat guard/tracker logic.
- Process conflict noted: the task requires appending this Builder Report and moving the task into `tasks/review`, while the task file's Allowed Files only list app code and Forbidden Files include `tasks/review/*`; followed `PROCESS.md` and `BUILDER_PROMPT.md` for task workflow artifacts.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-022-rework-answer-shuffle-with-overlay-clones.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches

Notes:
- Accepted. The shuffle animation now uses fixed-position overlay clone cards instead of animating live grid buttons through reflow.
- Real answer buttons are hidden/disabled during the flight, and `rightColumn` is committed only after the clone animation finishes.
- This preserves the `TASK-020` answer-side shuffle mechanic while removing the jerky grid-card FLIP approach.
- Correct/wrong matching, tablet/mobile layout, results modal, rank setup, assets, and Firebase behavior remain intact.
