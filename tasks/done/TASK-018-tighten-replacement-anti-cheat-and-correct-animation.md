# Task: Tighten replacement anti-cheat and add correct-pair animation

## ID

TASK-018

## Role

builder-code

## Goal

Improve Match Pairs anti-cheat behavior so players cannot bypass the post-replacement repeat shuffle by briefly clicking another pair and then returning to the tracked replacement pair. Also add a small satisfying animation when a pair is selected correctly.

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

- Preserve all existing gameplay behavior unless explicitly changed below.
- Current known bypass:
  - user completes a pair correctly,
  - replacement pair appears and becomes the tracked pair,
  - user clicks another pair once,
  - user returns to the tracked replacement pair,
  - current behavior may avoid the intended anti-cheat shuffle.
- Fix the bypass so returning to the tracked replacement pair before the reset condition still triggers reshuffle.
- The tracked replacement pair should reset only after the intended reset condition, not after one other-pair click.
- Keep the reset rule concept from previous tasks: other-pair activity should be enough to clear the tracked pair only after the configured threshold is reached.
- Do not make ordinary gameplay feel punitive:
  - normal matching should continue to work,
  - wrong matches should still count mistakes as before,
  - correct matches should still score and progress as before.
- Add a subtle correct-pair animation:
  - when a pair is matched correctly, both cards should make a small upward bounce,
  - include a very slight wiggle/sway,
  - keep it short and restrained,
  - do not cause layout shift or overlap,
  - preserve the existing correct state timing and replacement flow.
- Do not change learned-word progression, dictionary filtering, rank setup, tablet layout task scope, background assets, Firebase behavior, or task process files.
- If `TASK-017` has already changed the gameplay card layout, adapt to it without reverting its work.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally:
  - complete a pair, wait for replacement, click one other pair, then click the replacement pair and confirm the anti-cheat shuffle triggers,
  - complete a pair, wait for replacement, perform enough other-pair activity to satisfy reset, then click the replacement pair and confirm it does not immediately reshuffle,
  - confirm normal correct matches still score,
  - confirm wrong matches still count mistakes,
  - confirm both correctly matched cards bounce slightly with a tiny wiggle,
  - confirm tablet/mobile layout still has no horizontal overflow.

## Notes

User report:

- Players can cheat by selecting a replacement pair, then selecting another pair, then returning to the replacement pair.
- This should be treated as suspicious and should reshuffle.
- Add a small animation when the correct pair is selected: a little jump with a tiny wiggle.

Implementation hint:

- The current replacement tracker likely increments `otherPairAttempts` on other-pair clicks and resets only after the threshold.
- Ensure a single other-pair click does not clear the tracked pair's repeat state or prevent the tracked pair from triggering reshuffle when clicked again.
- The correct-pair animation likely belongs on the existing `.correct` class or a new class applied while `correctIds` contains the matched id.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-018-tighten-replacement-anti-cheat-and-correct-animation.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5180/play/match-pairs/default`: not completed; Vite reported ready and `lsof` showed a listener on `127.0.0.1:5180`, but `curl` and the browser/dev-server channel could not connect in this environment.

Notes:
- Changed replacement tracking so other-pair activity increments only on completed other-pair attempts, not on individual unrelated card clicks.
- Prevented non-tracked correct matches from immediately clearing the active replacement tracker; returning to the tracked replacement pair before the reset threshold can still trigger the reshuffle.
- Added a short correct-pair bounce/wiggle animation on the existing `.correct` state without changing correct-state timing or replacement flow.
- Preserved scoring, mistakes, repeat-click behavior, learned-word progression, dictionary filtering, rank setup, tablet layout, background assets, Firebase behavior, and results modal behavior.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-018-tighten-replacement-anti-cheat-and-correct-animation.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The replacement tracker now survives a single unrelated click/attempt path, so returning to the tracked replacement pair before the reset threshold triggers the existing reshuffle.
- Other-pair activity is counted on completed other-pair attempts, preserving the reset threshold without punishing a single exploratory click.
- Correct matches now use a short `correctPairBounce` animation with a small upward movement and subtle wiggle on both matching cards.
- Browser manual verification was blocked in Builder's environment, so residual interaction risk remains; static review and build passed.
- `TASK-017` tablet layout changes are preserved and not reverted.
