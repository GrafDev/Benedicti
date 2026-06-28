# Task: Make answer shuffle visibly smooth and noticeable

## ID

TASK-024

## Role

builder-code

## Goal

Improve the Match Pairs answer-side shuffle animation so it is clearly visible, smooth, and pleasant instead of barely moving or looking like a tiny jerk.

## Context

`TASK-023` replaced the custom overlay clone animation with `framer-motion` layout animation. It fixed the off-board flying cards, but the user reports the new animation is almost invisible: cards only twitch slightly and the shuffle feels too fast or too small.

The likely issue is a combination of:

- the shuffle sometimes only moves cards one nearby slot,
- `layout="position"` may produce subtle movement with the current transition,
- the visual lift is only `scale: 1.025` and `y: -2`,
- the 720 ms lock window does not necessarily mean the visible flight feels long enough.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- package.json
- package-lock.json
- tasks/todo/TASK-024-make-answer-shuffle-visibly-smooth.md

## Forbidden Files

- public/assets/match-pairs/*
- firebase.json
- .firebaserc
- tasks/done/*
- tasks/review/*

## Acceptance Criteria

- Keep using `framer-motion` or another already-installed proven animation approach.
- Do not bring back the old fixed-position overlay clone system that made cards fly off to the side.
- Do not reintroduce anti-cheat guard/tracker logic.
- After a correct pair replacement, answer-side shuffle must be visually obvious:
  - cards should lift noticeably,
  - cards should travel smoothly to their new positions,
  - the settle should feel soft, not snappy,
  - the user should clearly understand that answer cards changed places.
- The animation must stay inside the actual answer-side board/columns.
- No cards may appear outside the game board or viewport edge.
- Shuffle up to three answer-side cards and include the newly appeared replacement answer.
- Prefer choosing shuffle indices so movement is meaningful:
  - avoid a no-op,
  - avoid only adjacent tiny swaps when a farther valid slot exists,
  - use a deterministic fallback if random choice produces too little movement.
- During shuffle motion, involved answer cards must not accept clicks.
- Preserve correct-pair bounce/wiggle, wrong answer behavior, scoring, timer, mistakes, learned-word progression, dictionary filtering, ranks, rank assets, Firebase behavior, tablet four-column layout, and mobile behavior.
- Tablet layout must still have no horizontal overflow around `1024x768`.

## Suggested Implementation Direction

- Keep `LayoutGroup` / `motion.button`, but make the shuffle visually stronger.
- Consider these options:
  - use `layout` instead of only `layout="position"` if size/layout transforms need to be more expressive,
  - increase lift/scale during shuffle, for example `scale: 1.06` and `y: -10` or similar,
  - lengthen/smooth the layout transition, for example lower stiffness and higher damping,
  - stagger or layer answer cards with `z-index` while moving,
  - improve the shuffle algorithm so selected answer cards move at least two slots when possible,
  - if three cards are available, rotate them in an order that creates visible travel.
- If Framer Motion layout animation is still too subtle because the DOM reorder is not producing a satisfying visual, use Framer Motion primitives such as variants/`layoutId`/`AnimatePresence` as appropriate, but keep the implementation local and robust.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check to confirm old anti-cheat and old overlay names are absent:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
  - `answerShuffleClone`
  - `answerShuffleOverlay`
  - `fly-x`
  - `fly-y`
- Manually inspect `/play/match-pairs/default` locally:
  - start a level,
  - answer a correct pair,
  - confirm answer-side cards visibly lift and move smoothly,
  - confirm the movement is stronger than TASK-023 and not just a small twitch,
  - confirm no card flies off-board,
  - confirm answer cards unlock after animation,
  - confirm tablet `1024x768` still fits without horizontal overflow.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-024-make-answer-shuffle-visibly-smooth.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning after build.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-024-make-answer-shuffle-visibly-smooth.md`: passed.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/review/TASK-024-make-answer-shuffle-visibly-smooth.md`: passed after moving the task to review.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|answerShuffleClone|answerShuffleOverlay|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Manual browser inspection at `/play/match-pairs/default`: passed; verified correct pair replacement, visible answer-side active/locked state with stronger highlight, no overlay clones, no horizontal overflow, and answer cards unlocking after animation.
- Manual tablet viewport inspection at `1024x768`: passed; `scrollWidth` matched viewport width and no horizontal overflow was detected.

Notes:
- Kept the Framer Motion approach and did not add dependencies.
- Changed answer shuffle selection to choose the farthest available answer slots deterministically, then rotate up to three answer cards including the replacement answer.
- Increased the visible lift/scale, softened the layout spring, switched answer cards to full `layout`, and extended the answer-side click lock to match the stronger motion.
- Process conflict: the task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires appending this report and moving the task file from `tasks/todo` to `tasks/review`; I followed `PROCESS.md` as instructed.

## Lead Review

Status: changes requested

Checks:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|answerShuffleClone|answerShuffleOverlay|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches.
- Local browser inspection at `http://127.0.0.1:5176/play/match-pairs/default`: failed acceptance on visible motion duration/clarity.

Issues:
- The animation is still too short/subtle. In local browser sampling after correct replacements, answer cards showed a small transform around the first sampled frame, then settled by roughly the next frame (`~100ms`). That still reads as a twitch rather than a clear, smooth card flight.
- The change improves the slot choice and removes off-board movement, but it does not yet satisfy the user-facing requirement that answer cards visibly lift, travel, and settle.

Needed Fix:
- Make the answer-side shuffle explicitly visible for a meaningful duration, not just as a quick layout spring. Use Framer Motion controls/variants/keyframes/layout transition settings as needed, but keep cards inside the board.
- Target a perceptible movement window around `550-900ms`: lift first, travel, then soft settle.
- During that window, involved answer cards must remain non-clickable.
- The animation should be visually obvious even when movement is mostly vertical between nearby slots.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-024-make-answer-shuffle-visibly-smooth.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning after build.
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-024-make-answer-shuffle-visibly-smooth.md`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|answerShuffleClone|answerShuffleOverlay|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Manual browser inspection at `/play/match-pairs/default`: passed; verified correct pair replacement, answer-side active/locked motion frames, no overlay clones, no off-board cards, and answer cards unlocking after motion.
- In-page motion sampling after the duration fix captured answer cards still active/locked at sampled frames through about `900ms`, with transforms present and `cloneCount: 0`.
- Manual tablet viewport inspection at `1024x768`: passed; `scrollWidth` matched viewport width and no horizontal overflow was detected.

Notes:
- Fixed only the returned Lead Review issue.
- Changed Framer layout motion from a short spring to an explicit `0.82s` layout tween plus `0.9s` lift/scale keyframes.
- Increased the visible lift/scale amplitude and extended the answer shuffle lock to `980ms`, so involved answer cards remain non-clickable through the visible motion window.
- Did not add dependencies, did not bring back fixed-position overlay clones, and did not reintroduce anti-cheat guard/tracker logic.
- Process conflict remains: the task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires appending this report and moving the task file from `tasks/todo` to `tasks/review`; I followed `PROCESS.md` as instructed.

## Lead Review

Status: accepted

Checks:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|answerShuffleClone|answerShuffleOverlay|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches.
- Local browser inspection at `http://127.0.0.1:5176/play/match-pairs/default`: passed.
- Tablet viewport `1024x768`: passed with no horizontal overflow.

Review Notes:
- The returned issue was fixed: answer-side motion now remains visibly active/locked for roughly the intended window instead of collapsing into a short twitch.
- In sampled frames after a correct replacement, answer cards remained active/locked with visible transform through about `1s`, then unlocked cleanly.
- No fixed-position overlay clones were reintroduced, and cards stayed inside the board/viewport.
