# TASK-034: Stretch realm layout to remaining height and remove edge hover pan

## Owner

Builder

## Status

todo

## Context

`TASK-033` removed the full page scroll, but the realm content no longer stretches into all available remaining viewport height. The header/stat area sits at the top, then the realm layout appears lower and shorter than the remaining space. User feedback: use flex so the realm area fills the remaining height.

The user also wants to remove the old hover-near-edge map scrolling behavior. The realm map should be moved by drag, wheel/pinch zoom, and the `Your kingdom` button, not by simply hovering near the viewport edge.

## Required Changes

### Stretch realm layout

- Make the King+ realm layout stretch to fill all remaining height inside the realm setup container.
- Use flex/grid correctly:
  - the setup shell/container should be column flex,
  - fixed header/stat sections should remain natural height,
  - `.realmShell` should consume the remaining space with `flex: 1 1 auto` and `min-height: 0`.
- Avoid fixed/clamped realm shell height on desktop when inside `.realmContainer`.
- The central map panel should fill its grid cell height.
- Left and right side panels should match the map area height and keep internal scrolling if needed.
- Preserve `TASK-033` behavior: the page itself should not vertically scroll on desktop realm mode.
- Preserve mobile fallback behavior where auto-height/page scrolling is allowed if necessary.

### Remove hover edge-pan

- Remove the old map panning that starts when the mouse hovers near the map viewport edge.
- Remove unused constants/functions/refs tied only to edge-pan:
  - `REALM_EDGE_PAN_ZONE`
  - `REALM_EDGE_PAN_SPEED`
  - `realmEdgeVelocityRef`
  - `realmAnimationFrameRef`
  - `runRealmEdgePan`
  - `startRealmEdgePan`
  - `stopRealmEdgePan` if no longer needed
  - `handleRealmMouseMove`
  - `onMouseMove={handleRealmMouseMove}`
  - `onMouseLeave={stopRealmEdgePan}` if no longer needed
- Keep drag panning.
- Keep wheel zoom.
- Keep pointer pinch zoom.
- Keep `Your kingdom` centering/fitting.

## Acceptance Criteria

- On desktop realm mode, the realm layout fills the available remaining viewport height below the header/stats area.
- No full-page vertical scroll is introduced.
- The map panel is taller than before and uses available space rather than leaving large unused vertical gaps.
- Side panels align with the map panel height.
- Hovering near the map edge no longer pans the map.
- Drag panning still works.
- Wheel zoom still works.
- Pinch zoom logic remains intact.
- `Your kingdom` button still centers/fits the current kingdom.
- Pre-King rank selection view is not regressed.
- No gameplay, word progression, Firebase, persistence, or conquest logic changes.
- No dependencies added.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not implement real backend realm state in this task.
- Do not change Match Pairs gameplay or word progression.
- Do not reintroduce removed anti-cheat concepts:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
- Do not reintroduce the old viewport overlay answer shuffle approach:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check for forbidden anti-cheat names listed above.
- Run an `rg` check for forbidden old overlay names listed above.
- Run an `rg` check confirming edge-pan names are absent:
  - `REALM_EDGE_PAN`
  - `realmEdgeVelocityRef`
  - `realmAnimationFrameRef`
  - `runRealmEdgePan`
  - `startRealmEdgePan`
  - `handleRealmMouseMove`
- Static CSS review: confirm `.realmContainer .realmShell` consumes remaining height and desktop realm mode does not rely on clamped/fixed shell height inside the realm container.
- Manual browser visual QA may be delegated to Lead Review, but Builder should report what layout assumptions were checked.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-034-stretch-realm-layout-and-remove-edge-pan.md

Checks Run:
- npm run build
- git diff --check
- rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- Static CSS/layout review of `.realmContainer`, `.setupContainer`, and `.realmContainer .realmShell`

Notes:
- Removed hover-near-edge map panning constants, refs, RAF loop, mouse handlers, and JSX listeners.
- Preserved pointer drag pan, wheel zoom, pinch zoom, and the Your kingdom centering behavior.
- Updated `.realmContainer .realmShell` to consume remaining setup height with `flex: 1 1 0` and `min-height: 0`, while avoiding a clamped/fixed shell height inside the realm container.
- Desktop realm mode remains page-scroll-contained; mobile fallback behavior is unchanged.
- Manual browser visual QA is delegated to Lead Review.

## Lead Review

Status: accepted

Review Notes:
- Edge hover pan is fully removed from `MatchPairs.tsx`: constants, refs, RAF loop, callbacks, and JSX mouse listeners are gone.
- Drag pan, wheel zoom, pointer pinch zoom, and `Your kingdom` centering remain wired.
- `.realmContainer .setupContainer` now uses column flex with `overflow: hidden`, allowing the realm area to consume internal space without page scroll.
- `.realmContainer .realmShell` now overrides the generic shell height with `flex: 1 1 0`, `height: auto`, and `min-height: 0`, so King+ realm mode can stretch into the remaining viewport height.
- The generic `.realmShell` still has a clamped height for non-realm contexts, but it is overridden inside `.realmContainer` by the more specific selector.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.

Residual Risk:
- Manual in-browser visual QA was not completed in this Lead pass; acceptance is based on targeted code/CSS review and static/build checks.
