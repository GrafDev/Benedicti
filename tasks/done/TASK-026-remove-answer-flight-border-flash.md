# Task: Remove answer flight border and landing flash

## ID

TASK-026

## Role

builder-code

## Goal

Polish the Match Pairs answer shuffle flight so moving answer cards do not show an extra border/highlight during movement and do not flash or glow after landing.

## Context

`TASK-025` implemented board-contained FLIP card flight for answer-side shuffle. The user reports two visual problems:

- moving cards have an unnecessary frame/border during the flight,
- after cards land, there is some glare/flash/highlight at the end of positioning.

The desired behavior: moving cards should look like normal answer cards while they travel, with no added special frame, cyan border, glow, or landing flash.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/todo/TASK-026-remove-answer-flight-border-flash.md

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

- Remove the extra visible border/frame from moving answer flight cards.
- Remove any glow, glare, flash, or highlight that appears after the moving cards land.
- Moving answer cards should visually match ordinary answer cards as closely as possible while still clearly moving.
- Keep the board-contained FLIP behavior from `TASK-025`:
  - moving copies stay inside the board/answer stage,
  - real answer order updates only after the flight,
  - involved real slots are hidden/disabled during flight,
  - answer-side cards unlock after flight.
- Do not reintroduce viewport-level fixed overlays.
- Do not reintroduce anti-cheat guard/tracker logic.
- Do not add dependencies.
- Preserve wrong answer behavior, scoring, timer, mistakes, learned-word progression, dictionary filtering, ranks, rank assets, Firebase behavior, tablet layout, mobile behavior, results modal behavior, and game background.

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
  - start a level,
  - answer a correct pair,
  - confirm moving answer cards have no extra border/frame/glow,
  - confirm there is no flash/glare after landing,
  - confirm cards still visibly travel between answer slots,
  - confirm cards stay inside the board,
  - confirm cards unlock after flight.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-026-remove-answer-flight-border-flash.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning after build.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-026-remove-answer-flight-border-flash.md`: passed.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/review/TASK-026-remove-answer-flight-border-flash.md`: passed after moving the task to review.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Manual browser inspection at `/play/match-pairs/default`: passed; verified moving answer copies use the same border and box-shadow as ordinary answer cards, remain inside the board, and disappear after landing.
- Manual post-landing inspection: passed; verified answer cards have no running `appearing` animation, no flight copies remain, and all answer cards unlock after the flight.

Notes:
- Removed the special cyan border/glow styling from `.answerFlightCard`.
- Prevented answer-side cards from receiving the `appearing` fade/scale after the flight, while keeping the appearing behavior for original-word cards.
- Answer-side cards now unlock when the FLIP flight lock ends instead of staying disabled because of `newlyAppearingIds`.
- Did not add dependencies, did not change package files, did not bring back fixed viewport overlays, and did not reintroduce anti-cheat guard/tracker logic.
- Process conflict: the task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires appending this report and moving the task file from `tasks/todo` to `tasks/review`; I followed `PROCESS.md` as instructed.

## Lead Review

Status: accepted

Review Notes:
- Confirmed the code change is scoped to answer flight visual polish: `.answerFlightCard` no longer has a special cyan border/glow, and answer-side cards no longer receive the post-flight `appearing` animation.
- Confirmed the answer-side unlock behavior remains intact after the flight.
- Verified locally that the visible duplicate buttons after flight belong to the hidden tablet layout (`0x0` rects), not leftover flight copies.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local browser smoke at `/play/match-pairs/default`: passed; correct answer flow keeps cards inside the board, removes flight children after landing, avoids post-landing `appearing` animation on answer cards, and leaves cards enabled.
