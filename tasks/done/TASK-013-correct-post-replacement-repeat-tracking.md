# Task: Correct post-replacement repeat tracking in Match Pairs

## ID

TASK-013

## Role

builder-code

## Goal

Correct the Match Pairs anti-repeat shuffle logic so repeat tracking starts only for the new pair that appears after a correct match replaces an old pair in the same board position.

## Allowed Files

- src/pages/MatchPairs.tsx

## Forbidden Files

- src/pages/MatchPairs.module.css
- public/assets/match-pairs/ranks/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- Do not start or increment the anti-repeat tracker from arbitrary first clicks during normal play.
- When the user answers a pair correctly and that pair disappears, identify the board position where it disappeared.
- When a replacement pair appears in that same position, start repeat tracking for that replacement pair with count `1`.
- If the user clicks that replacement pair again before the reset condition, the count reaches `2` and the existing reshuffle behavior must run.
- If the user makes two attempts/clicks involving other pairs after the tracked replacement pair appears, reset the tracked replacement pair counter.
- After reset, clicking that replacement pair must start fresh and must not immediately reshuffle.
- Correct matching behavior must remain unchanged.
- Wrong matching behavior and mistake counting must remain unchanged.
- Level completion, learned-word progression, dictionary filtering, rank setup visuals, and rank assets must remain unchanged.
- Keep the change local to Match Pairs gameplay input/replacement handling.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually test `/play/match-pairs/default`:
  - before any correct replacement happens, normal clicks must not trigger anti-repeat shuffle,
  - make a correct match, wait for the replacement pair to appear, click that replacement pair and confirm reshuffle triggers on the repeat count reaching `2`,
  - make a correct match, wait for replacement, click two other-pair attempts, then click the replacement pair and confirm it starts fresh without immediate reshuffle,
  - confirm normal correct matches still work,
  - confirm wrong matches still count as mistakes as before.

## Notes

This task corrects `TASK-012`.

User clarification:

- The first counter for a pair should turn on only after a pair was answered correctly and disappeared.
- Then a different pair appears in that same place.
- For that replacement pair, the counter starts at `1`.
- If that replacement pair reaches `2`, reshuffle.
- The counter should still reset after two clicks/attempts on other pairs.

Implementation hint:

- The old position-based logic tracked where a correct match happened.
- The new behavior may need to remember the replaced board position and the id of the new pair inserted by `replaceWordOnPlace`.
- Avoid reviving the old "same position click" bug; tracking should be by replacement pair id after replacement, with the replacement position used only to decide which new pair to track.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-013-correct-post-replacement-repeat-tracking.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx`: passed
- Manual local browser check at `http://localhost:5176/play/match-pairs/default`: passed.
  - Before any correct replacement, repeated normal clicks did not trigger anti-repeat shuffle.
  - After a correct match inserted a replacement pair, clicking that replacement pair triggered the existing reshuffle behavior.
  - After a correct replacement, two other-pair attempts reset the replacement tracker, and clicking the replacement pair again did not immediately reshuffle.
  - Correct matching still increased score.
  - Wrong matching still increased mistakes.

Notes:
- Repeat tracking now starts only inside `replaceWordOnPlace` when a new replacement pair is inserted.
- Ordinary first clicks during normal play no longer create or increment the anti-repeat tracker.
- Process conflict: this task's Allowed Files omitted the task file itself, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-013-correct-post-replacement-repeat-tracking.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. Repeat tracking now starts only when `replaceWordOnPlace` inserts a replacement pair after a correct match.
- Ordinary first clicks during normal play no longer create the anti-repeat tracker.
- The replacement pair starts at `repeatCount: 1`; clicking that same replacement pair again reaches `2` and triggers the existing reshuffle behavior.
- The tracker is cleared when no replacement word is available and still resets after two other-pair clicks.
- No CSS, assets, dictionary filtering, learned-word progression, or rank setup behavior was changed.
