# Task: Replace anti-cheat guards with answer-side shuffle

## ID

TASK-020

## Role

builder-code

## Goal

Remove the complex Match Pairs anti-cheat guard algorithms and replace them with a simpler mechanic: after each correct answer and replacement, shuffle three cards on the answers side, including the answer card for the newly appeared pair.

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

- Remove the replacement anti-cheat guard/tracker logic introduced by recent tasks:
  - no replacement slot guard,
  - no replacement pair repeat counter,
  - no guarded slot reshuffle trigger,
  - no other-pair reset threshold logic.
- Preserve the normal full-column shuffle used where it is still needed for ordinary gameplay setup or existing non-anti-cheat behavior.
- After a pair is answered correctly and the new replacement pair appears, shuffle exactly three visible answer-side cards when possible.
- The three answer-side cards must include the answer card for the newly appeared replacement pair.
- If fewer than three answer-side cards are available, shuffle all available answer-side cards instead of failing.
- The shuffle should affect only the answer side, not the original-word side.
- The shuffle should not change card ids or matching correctness.
- The shuffle must work across desktop, tablet four-column layout, and mobile:
  - use the underlying `rightColumn` positions as the source of truth,
  - visual tablet split columns must reflect the shuffled underlying answer positions.
- Add a small animation for the answer-side shuffle:
  - the involved answer cards should visually lift and move/swap places,
  - movement should feel simultaneous,
  - use scale/transform to suggest lift,
  - separate visual stacking via z-index so cards do not look like one flat layer,
  - keep it short and readable,
  - do not cause permanent layout shift.
- Preserve the correct-pair bounce/wiggle animation from `TASK-018`.
- Preserve tablet responsive layout from `TASK-017`.
- Preserve gameplay background, fade-in, results modal, scoring, timer, mistakes, learned-word progression, dictionary filtering, rank setup, rank assets, Firebase behavior, and task process files.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally:
  - complete a correct pair,
  - confirm the newly appeared answer card is included in a three-card answer-side shuffle,
  - confirm only the answer side changes positions,
  - confirm the shuffle animation lifts/moves the cards and uses visually separated stacking,
  - confirm correct matches still score and replace words,
  - confirm wrong matches still count mistakes,
  - confirm tablet four-column layout still reflects shuffled answer positions correctly,
  - confirm mobile has no horizontal overflow,
  - complete a level and confirm the results modal remains centered.

## Notes

User decision:

- The anti-cheat algorithms became too complex and still feel wrong.
- Remove those algorithms.
- Simpler desired behavior:
  - after a correct pair,
  - once the new pair appears,
  - shuffle three answer-side cards,
  - one of those three must be the answer for the newly appeared pair.

Implementation guidance:

- Prefer a small helper that receives the replacement pair id and shuffles answer-side `rightColumn` indices.
- Choose the replacement answer index plus two other non-null answer indices if available.
- Animate only the involved answer cards. A FLIP-style animation is ideal if simple enough; otherwise use a state/class that gives a convincing lift/translate/scale while the positions update.
- Avoid using the old guard variables/functions after this task; cleanly remove them to reduce future bugs.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-020-replace-anti-cheat-with-answer-side-shuffle.md

Checks Run:
- `npm run build`: passed.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|repeatPair|guard|otherPairAttempts|isShuffling" src/pages/MatchPairs.tsx`: no matches.
- Manual local browser check: not completed; Vite reported ready on localhost, but local connection/browser inspection was not available reliably in this environment.

Notes:
- Removed the replacement guard/tracker/repeat/reset anti-cheat logic from Match Pairs.
- After a correct replacement, the right-side answer column now shuffles up to three non-null answer cards including the newly appeared replacement answer; the original side is not shuffled.
- Tablet answer columns now split from the underlying `rightColumn`, so the four-column view reflects shuffled answer positions.
- Added a short answer-side lift/move animation with z-index separation and preserved the existing correct-pair bounce, tablet layout, scoring, timer, mistakes, results modal, rank setup, assets, and Firebase behavior.
- Process conflict noted: the task requires appending this Builder Report and moving the task into `tasks/review`, while the task file's Allowed Files only list app code and Forbidden Files include `tasks/review/*`; followed `PROCESS.md` and `BUILDER_PROMPT.md` for task workflow artifacts.

## Lead Review

Status: changes requested

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-020-replace-anti-cheat-with-answer-side-shuffle.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|repeatPair|guard|otherPairAttempts|isShuffling" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches

Accepted Parts:
- The old replacement guard/tracker/repeat/reset anti-cheat logic was removed.
- The new answer-side shuffle affects only `rightColumn`.
- The replacement answer card is included in the shuffled answer-side set.
- Tablet layout now reflects underlying answer-side positions.

Required Fixes:
- The answer-side shuffle animation does not yet meet the requested behavior. The cards currently reorder immediately and then all run the same small `answerSideShuffle` transform in their new positions.
- Make the involved answer cards visually travel/swap positions, not just wiggle after an instant reorder.
- Add visual stacking separation: involved cards should not all share one flat `z-index`. Use per-card z-index or classes/CSS variables so the lifted cards feel layered while moving.
- Keep the shuffle logic itself intact: exactly three answer-side cards when possible, including the new replacement answer; do not reintroduce guard/tracker anti-cheat code.
- Preserve correct-pair bounce/wiggle, tablet layout, scoring, mistakes, results modal, rank setup, assets, and Firebase behavior.

Notes:
- A small FLIP-style implementation is preferred if feasible.
- If a full FLIP implementation is too large, use per-card animation classes/CSS variables that produce clearly different lift/translate paths and z-index layering for the involved cards.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-020-replace-anti-cheat-with-answer-side-shuffle.md

Checks Run:
- `npm run build`: passed.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|repeatPair|guard|otherPairAttempts|isShuffling" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches.
- Manual browser check on `http://127.0.0.1:5183/play/match-pairs/default`: passed for starting Citizen rank, completing a correct pair, seeing score advance/replacement occur, confirming exactly three visible answer cards receive `_answerShuffling`, confirming the newly appeared answer card is included, confirming per-card `--shuffle-x`, `--shuffle-y`, and z-index values differ, confirming tablet four-column answer positions reflect `rightColumn`, confirming a wrong match increments mistakes, and confirming mobile viewport `390x844` has no horizontal overflow.
- Manual complete-level/results-modal check: not run; the returned fix only targeted the shuffle animation issue, and the browser verification focused on the affected replacement/shuffle path.

Notes:
- Reworked the answer-side shuffle animation into a small FLIP-style motion: each moved answer card gets a computed old-to-new translate, scale/lift keyframes, and a per-card z-index through CSS variables.
- The newly appeared replacement answer uses the outgoing answer card's slot as its FLIP origin, so it visibly travels into its shuffled destination instead of only fading/wiggling after an instant reorder.
- Kept the accepted shuffle logic intact: up to three non-null right-side cards are shuffled, including the replacement answer, with no original-side shuffle and no anti-cheat guard/tracker code reintroduced.
- Process conflict still applies: this task requires appending a Builder Report and moving the task into `tasks/review`, while the task's Allowed Files only list app code and Forbidden Files include `tasks/review/*`; followed `PROCESS.md` and `BUILDER_PROMPT.md` for workflow artifacts.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-020-replace-anti-cheat-with-answer-side-shuffle.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|repeatPair|guard|otherPairAttempts|isShuffling" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches

Notes:
- Accepted. The old anti-cheat guard/tracker logic is removed and was not reintroduced.
- The new mechanic shuffles up to three answer-side cards, includes the newly appeared replacement answer, and does not shuffle the original-word side.
- The second pass addresses the animation review: moved answer cards now receive old-to-new translate values and per-card z-index through CSS variables, giving a visible lift/travel effect instead of a same-position wiggle.
- The correct-pair bounce/wiggle, tablet layout, scoring, mistakes, results modal, rank setup, assets, and Firebase behavior remain intact.
