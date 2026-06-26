# Task: Prevent repeated same-pair clicks in Match Pairs

## ID

TASK-012

## Role

builder-code

## Goal

Adjust Match Pairs click handling so the game detects when a user repeatedly clicks cards from the same matched pair, and reshuffles only after two consecutive same-pair click attempts according to the rule below.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css

## Forbidden Files

- public/assets/match-pairs/ranks/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- Track repeated clicks by pair, not only by individual card.
- If the user clicks cards from the same pair twice in a row, trigger the existing reshuffle behavior and reset the repeat tracking.
- If the user clicks a different pair, count that as an "other pair" click relative to the previously tracked pair.
- If the user clicks two different-pair attempts after the previously tracked pair, reset the repeat counter for the previously tracked pair and reset the "other pair" counter.
- After reset, a later click on the original pair starts fresh and should not immediately reshuffle.
- The behavior must work for both word and translation cards that belong to the same pair.
- Correct matching behavior must remain unchanged.
- Incorrect matching behavior, mistakes counting, level completion, learned-word progression, and dictionary filtering must remain unchanged.
- Do not change visual rank-card assets or the rank setup redesign.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually test `/play/match-pairs/default`:
  - click within the same pair twice in a row and confirm reshuffle happens,
  - click one pair, then two attempts involving other pairs, then the first pair again and confirm it starts fresh,
  - confirm normal correct matches still work,
  - confirm wrong matches still count as mistakes as before.

## Notes

User intent:

- Each pair should have repeat-click tracking.
- A same-pair repeat counter reaches 2 -> reshuffle.
- The same-pair counter should be cleared after the user makes two attempts on other pairs.
- This likely needs a small state object that remembers the currently watched pair id, its repeat count, and how many other-pair attempts happened since then.

Keep the change small and local to Match Pairs gameplay input handling.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-012-prevent-repeated-same-pair-clicks.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://localhost:5176/play/match-pairs/default`: passed.
  - Clicking the same pair card twice triggered the existing reshuffle/fade-out behavior.
  - Clicking one pair, then two other-pair attempts, then the original pair did not immediately reshuffle and started fresh.
  - Normal correct matching still increased score.
  - Wrong matching still increased mistakes.

Notes:
- Replaced position-based repeat detection with pair-id repeat tracking using a small ref-backed tracker.
- Correct match completion is excluded from repeat-trigger handling so normal matching behavior remains unchanged.
- Process conflict: this task's Allowed Files omitted the task file itself, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-012-prevent-repeated-same-pair-clicks.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The implementation replaces the old position-based repeat detection with pair-id tracking.
- Correct match completion is excluded from repeat-trigger handling, so a normal pair match does not reshuffle.
- The tracker resets after a correct match, after a reshuffle, on level start, and after two other-pair clicks.
- No dictionary, learned-word, rank setup, or asset logic was changed.
