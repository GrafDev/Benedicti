# TASK-042: Polish Match Pairs game stage height, centering, and card animation clipping

## ID

TASK-042

## Role

builder-code

## Goal

Make the Match Pairs in-game board use the available viewport height elegantly, center the card grid, fill/center the thematic background, and prevent cards from being clipped during lift/shuffle/correct-answer animations.

## Context

User feedback from screenshots:
- There is unused vertical space above and below the card board even on desktop.
- The game background should fully fill the screen and be centered.
- The card board should be centered in the available play area.
- The card grid should fill the card board naturally, with an optimal height instead of sitting awkwardly in the middle.
- When a card lifts during animation, the top edge gets clipped by a parent container. This must not happen.
- The result should feel polished and intentional, not cramped inside an oversized empty block.

Recent constraints from prior tasks:
- Visual QA is handled by Lead/user, not Builder.
- Do not reintroduce edge-hover pan.
- Do not reintroduce old fixed viewport answer overlay shuffle logic.
- Do not change realm logic or Match Pairs rank/progress logic.

## Required Changes

### Background and viewport

- Ensure the in-game Match Pairs background image covers the whole viewport area behind the game.
- Use `background-size: cover` and a sensible `background-position: center` / theme-appropriate positioning.
- Avoid leaving a visible unstyled or empty strip at the bottom/top.
- The main game page should use the full available device height without causing unnecessary page scroll on desktop/tablet.

### Game layout vertical fill

- The gameplay screen should be a flex/grid layout that uses the viewport height:
  - header/status row keeps natural height;
  - the board/play area consumes the remaining height;
  - sound/footer controls stay positioned without stealing excessive board height.
- Avoid hardcoded vertical gaps that create unused space above/below the board.
- The card board should be centered in the remaining play area.

### Card board and card grid sizing

- The board containing the cards should size itself optimally for the current rank/card count.
- For tall screens, the board/card grid may grow to use more space, but should stay visually balanced.
- For constrained screens, the board/card grid should shrink without horizontal overflow.
- The internal card grid should be centered and distributed evenly inside the board.
- Preserve the existing tablet/mobile layout behavior from TASK-027:
  - use four columns only when height is genuinely constrained;
  - otherwise keep the normal two-column pairing layout.

### Prevent animation clipping

- Identify the parent container that clips lifted/moving cards.
- Card lift/shuffle/correct-answer animations must have enough overflow allowance so raised/scaled cards are not cut off at the top, bottom, or sides.
- Prefer fixing overflow/padding/animation layer structure locally around the game board.
- Do not use viewport-level fixed overlays for answer shuffles; prior tasks intentionally removed that approach.
- Moving cards must remain visually inside the board/play context and not fly off-screen.

### Preserve behavior

- Do not alter word selection, scoring, learned-word logic, realm conquest logic, rank demotion, dictionary selection, or answer-shuffle game logic.
- This task is layout/CSS/DOM-structure polish only unless a tiny structural wrapper is required to solve clipping.

## Acceptance Criteria

- Desktop gameplay screen uses the full viewport height cleanly.
- The background image fills and centers behind the game screen.
- The board/card area is vertically centered and no longer leaves awkward unused top/bottom space.
- The card grid fills the board more naturally while staying readable.
- Lifted/scaled cards are not clipped by the top edge or any board edge during animations.
- Tablet/mobile layouts remain usable and do not introduce horizontal overflow.
- Four-column fallback still activates only when height is constrained.
- No edge-hover pan code is reintroduced.
- No old fixed viewport shuffle overlay code is reintroduced.
- `npm run build` passes.

## Allowed Files

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add dependencies.
- Do not change Firebase config or database paths.
- Do not edit unrelated games.
- Do not change realm conquest mechanics.
- Do not change learned-word scheduling.
- Do not change rank progression/demotion logic.
- Do not reintroduce edge-hover pan:
  - `REALM_EDGE_PAN`
  - `realmEdgeVelocityRef`
  - `realmAnimationFrameRef`
  - `runRealmEdgePan`
  - `startRealmEdgePan`
  - `stopRealmEdgePan`
  - `handleRealmMouseMove`
  - `onMouseMove`
  - `onMouseLeave`
- Do not reintroduce old viewport overlay shuffle code:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`
- Do not perform visual QA; Lead/user handles visual review.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run forbidden edge-hover-pan `rg` check.
- Run forbidden old viewport overlay shuffle `rg` check.
- Static CSS/layout review:
  - gameplay root uses viewport/full-height layout;
  - background cover/center behavior is present;
  - card animation containers do not clip raised cards;
  - tablet/mobile fallbacks remain present.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static CSS/layout review result
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-042-polish-match-pairs-game-stage-height-and-card-clipping.md

Checks Run:
- npm run build
- git diff --check
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- The gameplay container now uses a full `100dvh` flex layout with hidden page overflow for the PLAY screen, while the header remains natural height and the game board consumes the remaining space.
- The in-game background remains centered and covered through the existing `gameplayContainer::before` layer.
- The game board now has a wider balanced desktop max width, viewport-responsive padding/gaps, and centered flex content so the card grid uses available vertical space more naturally.
- The card motion containers (`gameArea`, `columns`, `answerFlightStage`, and `answerFlightLayer`) no longer clip raised/shuffled/correct cards; card and empty-slot heights were relaxed with viewport-aware maximums.
- Tablet/mobile fallbacks and the existing fit-based four-column class remain present.
- No Match Pairs mechanics, realm mechanics, word selection, learned-word scheduling, rank progression/demotion, fixed viewport shuffle overlay, or edge-hover pan behavior was changed.
- Local/browser visual QA is delegated to Lead Review per task instruction.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- `npm run build`: passed; Vite reported the existing large chunk warning only.
- `git diff --check`: passed.
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.

Static review:
- Gameplay CSS now uses a full-height flex layout for PLAY.
- The gameplay background cover/center layer is preserved.
- Board/card motion containers were changed to avoid clipping raised/shuffled cards.
- Tablet/mobile fallback selectors remain present.

Notes:
- Per updated Lead/user process, visual QA is left to the user with local Vite running.
