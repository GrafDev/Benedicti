# Task: Close replacement slot cheat loop in Match Pairs

## ID

TASK-019

## Role

builder-code

## Goal

Close the remaining Match Pairs cheating loop where a player can use the same recently replaced board positions repeatedly by selecting another pair in between and then returning to the previous replacement positions until victory.

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

- Preserve all normal gameplay behavior unless explicitly changed below.
- After a correct match is removed and a replacement pair appears in the same board positions, those replacement positions must become guarded.
- The guard must account for both:
  - the replacement pair id,
  - the left/right board positions where the replacement pair appeared.
- The player must not be able to bypass the guard by:
  - selecting the replacement pair/positions,
  - selecting another card or another pair,
  - returning to the guarded replacement positions,
  - repeating this until victory.
- Returning to a guarded replacement pair or guarded replacement positions before a legitimate reset condition must trigger the existing reshuffle behavior.
- A single unrelated click must not reset the guarded replacement positions.
- The reset condition must require enough genuine other-pair activity to prove the player moved on. Keep this conservative:
  - at minimum, require two completed other-pair attempts before clearing the guard,
  - do not clear the guard on one unrelated card click.
- Matching a non-guarded pair correctly should not immediately clear the guarded replacement positions unless it satisfies the reset condition.
- Correct matches must still score and replace words as before.
- Wrong matches must still count mistakes as before.
- The correct-pair bounce/wiggle animation from `TASK-018` must remain intact.
- The tablet four-column layout from `TASK-017` must remain intact.
- Do not change learned-word progression, dictionary filtering, rank setup, background assets, Firebase behavior, or task process files.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally:
  - complete a pair and wait for the replacement pair to appear,
  - click/select another card or pair once,
  - return to the replacement pair positions and confirm reshuffle triggers,
  - repeat the exact reported cheat pattern and confirm it no longer reaches victory without reshuffles,
  - complete a pair, make two genuine other-pair attempts, then return to the old guarded positions and confirm the guard has reset,
  - confirm normal correct matches still score,
  - confirm wrong matches still count mistakes,
  - confirm correct-pair bounce/wiggle still plays,
  - confirm tablet/mobile layout still has no horizontal overflow.

## Notes

User report:

- The player can still cheat:
  - first choose a pair,
  - then choose another,
  - then click the places from the previous pair again,
  - repeat until victory.
- This means the guard must consider board positions/slots, not only the replacement pair id.

Implementation guidance:

- Consider storing a replacement guard object with:
  - replacement pair id,
  - left slot index,
  - right slot index,
  - guarded state,
  - other completed attempts count.
- A click can identify its current slot index from the rendered column/layout source.
- Be careful with `TASK-017`: tablet layout splits the same underlying left/right arrays into four visual columns. The guard should use the underlying left/right array indices, not visual column positions, so behavior remains consistent across desktop/tablet/mobile.
- Prefer a small helper for triggering the existing reshuffle flow to avoid duplicating timeout/reset logic.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-019-close-replacement-slot-cheat-loop.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5181/play/match-pairs/default`: not completed; Vite reported ready and `lsof` showed a listener on `127.0.0.1:5181`, but `curl` could not connect in this environment.

Notes:
- Replaced the single replacement tracker with slot-aware replacement guards that store pair id plus underlying left/right slot indices.
- Returning to any guarded pair id or guarded underlying slot now triggers the existing reshuffle flow before normal selection can continue.
- Guards now survive one unrelated click and one completed other-pair attempt; they clear only after two completed other-pair attempts or an anti-cheat reshuffle.
- Preserved the correct-pair bounce/wiggle animation, tablet four-column layout, scoring, mistakes, learned-word progression, dictionary filtering, rank setup, background assets, Firebase behavior, and modal behavior.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: changes requested

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-019-close-replacement-slot-cheat-loop.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Required Fixes:
- The slot-aware guard direction is correct, but the reset condition is incomplete.
- Currently, `otherPairAttempts` is incremented only inside `handleChoice` when `!isCompletingCorrectMatch`, so a correct non-guarded match does not count as a completed other-pair attempt.
- The task requires: "complete a pair, make two genuine other-pair attempts, then return to the old guarded positions and confirm the guard has reset." Correct matches in other slots must count toward this reset threshold too.
- Update the logic so completed other-pair attempts include both wrong attempts and correct non-guarded matches, without clearing the guard immediately after a single non-guarded correct match.
- Keep the slot-aware guard behavior: returning to guarded pair id or guarded left/right slot before reset must still trigger reshuffle.

Notes:
- Do not revert the slot-index implementation.
- Do not revert `TASK-017` tablet layout or `TASK-018` correct-pair bounce/wiggle.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-019-close-replacement-slot-cheat-loop.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5182/play/match-pairs/default`: not completed; Vite reported ready and `lsof` showed a listener on `127.0.0.1:5182`, but `curl` could not connect in this environment.

Notes:
- Addressed Lead Review by counting correct non-guarded matches as completed other-pair attempts for active replacement guards.
- A single non-guarded correct match now increments guard reset progress without clearing the guard immediately; two completed other-pair attempts clear it.
- Preserved slot-aware guard behavior, tablet layout, correct-pair bounce/wiggle, scoring, mistakes, replacement flow, rank setup, assets, and Firebase behavior.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-019-close-replacement-slot-cheat-loop.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The guard now tracks replacement pair id plus underlying left/right slot indices, so the anti-cheat rule follows the board positions the player is exploiting.
- Returning to a guarded pair id or guarded slot before reset triggers the existing replacement shuffle flow.
- Reset now counts completed other-pair attempts from both wrong attempts and correct non-guarded matches; one unrelated click or one unrelated correct match does not clear the guard by itself.
- The tablet layout and correct-pair bounce/wiggle remain intact.
