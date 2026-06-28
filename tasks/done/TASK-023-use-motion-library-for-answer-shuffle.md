# Task: Use motion library for answer shuffle animation

## ID

TASK-023

## Role

builder-code

## Goal

Replace the custom answer-side shuffle animation with a robust library-based layout animation so answer cards move smoothly within the game board instead of jerking or flying off to the side.

## Allowed Files

- package.json
- package-lock.json
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css

## Forbidden Files

- public/assets/match-pairs/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc

## Acceptance Criteria

- Use a proven React animation library for the answer-side card shuffle.
- Preferred library: `framer-motion`, unless there is a strong compatibility issue with React 19 / this project.
- Remove the custom fixed-position overlay clone flight implementation from `TASK-022` if the library layout animation replaces it.
- The answer-side shuffle mechanic must remain:
  - after a correct replacement, shuffle up to three answer-side cards,
  - include the newly appeared replacement answer,
  - do not shuffle original-word cards,
  - do not reintroduce anti-cheat guard/tracker logic.
- Answer cards must animate smoothly inside their actual board/column positions.
- Cards must not fly off to the page side, viewport edge, or outside the game board.
- The motion should feel beautiful and controlled:
  - slight lift/scale,
  - smooth position transition,
  - soft settle,
  - no duplicate ghost cards outside the board,
  - no jerky snaps.
- During shuffle motion, involved answer cards should not accept clicks.
- Preserve correct-pair bounce/wiggle if it still makes sense with the library animation; otherwise adapt it to the same motion system without changing behavior.
- Preserve tablet four-column layout and mobile behavior.
- Preserve gameplay background, fade-in, results modal, scoring, timer, mistakes, learned-word progression, dictionary filtering, rank setup, rank assets, Firebase behavior, and task process files.

## Checks

- Install dependency if needed with `npm install`.
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
  - confirm answer cards animate smoothly inside the board,
  - confirm no card clone appears off to the right/side of the screen,
  - confirm only answer-side cards reorder,
  - confirm correct/wrong matching still works,
  - confirm tablet and mobile layouts remain usable.

## Notes

User feedback:

- Current overlay clone approach still has jerks.
- Cards also fly somewhere off to the side of the board.
- User suggested using a library for card animation.

Implementation guidance:

- `framer-motion` with `LayoutGroup` and `motion.button layout` is likely a good fit.
- Animate actual answer card layout changes instead of calculating viewport-level clone positions.
- Keep the implementation small and local to Match Pairs.
- Avoid keeping the overlay clone system if the motion library makes it unnecessary.
- If adding a dependency, keep package changes minimal and explain it in the Builder Report.

## Builder Report

Status: completed

Changed Files:
- package.json
- package-lock.json
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-023-use-motion-library-for-answer-shuffle.md

Checks Run:
- `npm install framer-motion`: passed; added `framer-motion@12.42.0`. npm audit reported 23 vulnerabilities and no audit fix was run because dependency cleanup was outside this task.
- `npm run build`: passed; Vite reported the existing large chunk warning after build.
- `git diff --check -- package.json package-lock.json src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/todo/TASK-023-use-motion-library-for-answer-shuffle.md`: passed.
- `git diff --check -- package.json package-lock.json src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css tasks/review/TASK-023-use-motion-library-for-answer-shuffle.md`: passed after moving the task to review.
- `rg -n "answerShuffleClone|answerShuffleOverlay|answerShuffleHidden|fly-x|fly-y|clone-z|ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|interface AnswerShuffleMove|fromIndex|toIndex" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Manual browser inspection at `/play/match-pairs/default`: passed; verified a correct pair replaces and reorders answer-side cards inside the board, no overlay clone exists, wrong matching still records an error, and tablet/mobile layouts remain usable without horizontal overflow.

Notes:
- Replaced the custom fixed-position overlay clone system with `framer-motion` `LayoutGroup` and answer-side `motion.button layout="position"` cards.
- The answer column updates directly after replacement, and Framer Motion animates the actual answer cards in their board positions with a slight lift/scale and spring settle.
- Answer-side cards are click-locked during the 720 ms shuffle motion and unlock afterward.
- Process conflict: the task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires appending this report and moving the task file from `tasks/todo` to `tasks/review`; I followed `PROCESS.md` as instructed.

## Lead Review

Status: accepted

Checks:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "answerShuffleClone|answerShuffleOverlay|answerShuffleHidden|fly-x|fly-y|clone-z|ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|interface AnswerShuffleMove|fromIndex|toIndex" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: no matches.
- Local browser check at `http://127.0.0.1:5176/play/match-pairs/default`: passed.

Review Notes:
- The old fixed-position clone overlay implementation was removed.
- Answer cards now use `framer-motion` layout animation in their real column positions.
- After a correct pair, the replacement answer-side shuffle stays inside the board and unlocks after the animation.
- Tablet gameplay layout was checked at `1024x768`; four columns fit with no horizontal overflow.
