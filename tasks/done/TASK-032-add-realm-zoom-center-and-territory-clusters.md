# TASK-032: Add realm zoom, center-on-kingdom, and city-adjacent territories

## Owner

Builder

## Status

todo

## Context

The realm map from `TASK-031` is directionally correct: the cities/player markers sit well on edge hexes and the realm shape is acceptable. However, the current placeholder claimed/frontier cells are not visually connected to the cities/castles. The whole realm also does not fit comfortably inside the viewport, and the map needs a Google Maps-like zoom/pan interaction. The instructional pan hint should be replaced with a direct control that centers the current player's kingdom in the map window.

Lead/user feedback:
- Cities are placed well.
- The realm shape is acceptable.
- Claimed/filled fields must be adjacent to player cities/kingdoms, not disconnected in the middle.
- The map should be scalable like Google Maps.
- Add a button labeled "Ваше королевство" / "Your kingdom" instead of the current pan instruction.
- The button should center the current player's kingdom and fit it fully in the map viewport.

## Required Changes

### Territory placement

- Change placeholder territory generation so claimed/frontier cells are spatially connected to player/city cells.
- For the current placeholder data:
  - each King+ player with `territoryPercent` should have a connected cluster starting from that player's city cell,
  - the current player's cluster should be the primary visual focus,
  - non-King players should keep only their city badge and should not own territory cells yet.
- Do not leave claimed/frontier cells floating away from all player cities.
- Territory assignment must remain deterministic and local/mock for now.
- Do not implement real conquest, shrinking, conflict resolution, multiplayer, Firebase persistence, or Emperor persistence in this task.

### Zoom and pan

- Add map scale state for the realm viewport.
- Support desktop zoom:
  - mouse wheel / trackpad wheel over the realm viewport should zoom in/out,
  - zoom should feel map-like and keep the pointer area reasonably stable while zooming.
- Support touch zoom:
  - two-finger pinch should zoom in/out on touch devices where pointer/touch events allow it,
  - one-finger drag should continue to pan.
- Keep existing drag panning.
- Keep desktop edge-pan if it still feels good with scale, but it may be simplified if it conflicts with zoom.
- Clamp pan at the current scale so the map cannot be lost entirely offscreen.
- Provide reasonable min/max zoom limits.
- The realm should initially fit comfortably inside the map viewport when possible, while preserving a fixed visual map scale relationship.

### "Your kingdom" control

- Replace the current `realmMapHint` text with a button/control labeled:
  - Russian: `Ваше королевство`
  - English: `Your kingdom`
- The button should center the current player's kingdom/territory in the realm viewport.
- If the current player has a territory cluster, fit that cluster fully into the viewport with a small padding.
- If the current player has no territory cluster, center and fit around the current player's city cell.
- The control must remain usable on desktop, tablet, and mobile.
- Add or update i18n strings as needed.

### Layout and visual fit

- The full relevant realm should be able to fit in the central map window using initial fit and/or the "Your kingdom" button.
- Do not require horizontal page scrolling.
- Keep the left and right panels from `TASK-029`/`TASK-031`.
- Preserve the existing dark medieval/map visual style.
- Do not add dependencies.

## Acceptance Criteria

- Claimed/frontier placeholder territory is connected to city/player cells.
- Current player's territory is visibly near the current player's city marker.
- The map can be zoomed in and out with wheel/trackpad.
- Touch drag still pans; pinch zoom is implemented where practical.
- Drag panning works after zooming.
- Pan is clamped so the realm cannot disappear completely.
- Initial view shows the realm comfortably enough to understand the map.
- The old pan instruction text is gone.
- A visible `Ваше королевство` / `Your kingdom` button is present.
- Clicking/tapping the button centers/fits the current player's kingdom or city.
- Player popup behavior from `TASK-031` still works.
- Pre-King flow remains unchanged.
- Match Pairs gameplay remains unchanged.
- No Firebase realm persistence, conquest, multiplayer transactions, territory capture/shrink, or Emperor persistence is added.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not implement real backend realm state in this task.
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
- Run an `rg` check for the forbidden anti-cheat names listed above.
- Run an `rg` check for the forbidden old overlay names listed above.
- Manual browser visual QA may be delegated to Lead Review, but static behavior should still be checked by Builder.

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
- src/i18n/locales/en.ts
- src/i18n/locales/ru.ts
- tasks/review/TASK-032-add-realm-zoom-center-and-territory-clusters.md

Checks Run:
- npm run build
- git diff --check
- rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- node static realm geometry check for complete ring, unique player cells, current-player connected ownership count, and non-King territory exclusion

Notes:
- Added deterministic city-adjacent mock territory clusters for King+ players with territoryPercent, with the current player's cluster used for initial/centered focus.
- Added wheel zoom, pointer pinch zoom, scale-aware pan clamp, and a Your kingdom control that fits the current owned cluster or city.
- No Firebase realm persistence, conquest, multiplayer, territory capture/shrink, Emperor persistence, dependencies, anti-cheat guard logic, or old fixed overlay shuffle logic was added.
- Manual browser visual QA is delegated to Lead Review.

## Lead Review

Status: returned

Review Notes:
- Build and static forbidden-name checks passed.
- Territory clustering is directionally correct: claimed/frontier cells are now generated from player city cells, and non-King players do not own territory.
- The implementation has a serious interaction bug in the auto-fit effect. `centerCurrentRealmKingdom` depends on `fitRealmBounds`, `fitRealmBounds` depends on `clampRealmPan`, and `clampRealmPan` currently depends on `realmScale`. Therefore any manual zoom changes `realmScale`, which changes the callback identity and retriggers the effect at `src/pages/MatchPairs.tsx:454-462`. That effect calls `centerCurrentRealmKingdom()` again and can reset the user back to the fitted kingdom view after wheel/pinch zoom. This undermines Google Maps-like manual control.

Required Changes:
- Initial auto-fit should run only when entering/showing the realm view or when the underlying realm/dictionary data changes in a meaningful way, not after every user pan/zoom.
- Manual wheel zoom, pinch zoom, and drag pan must persist until the user explicitly clicks `Your kingdom`.
- The `Your kingdom` button should still always refit/center the current player's kingdom on demand.
- Decouple scale-aware pan clamping from mutable callback identities where practical. For example, avoid making the auto-fit effect depend on a callback that changes whenever `realmScale` changes, or guard initial fitting with a ref keyed by realm/dictionary/cell data.
- Add a static/manual note in Builder Report confirming that changing `realmScale` via wheel/pinch no longer retriggers the auto-center effect.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-032-add-realm-zoom-center-and-territory-clusters.md

Checks Run:
- npm run build
- git diff --check
- rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- Static inspection of realm initial-fit dependencies and scale updates

Notes:
- Fixed the returned auto-center issue by making pan clamping read the current scale from a ref instead of depending on `realmScale`.
- Added `realmInitialFitKey`/`realmInitialFitKeyRef` so initial auto-fit runs only for meaningful realm/dictionary/current-kingdom data changes.
- Confirmed by static inspection that wheel/pinch scale changes update `realmScaleRef` and `realmScale`, but do not change `realmInitialFitKey`; therefore changing scale no longer retriggers the auto-center effect.
- The `Your kingdom` button still calls `centerCurrentRealmKingdom()` directly and refits on demand.
- Manual browser visual QA is delegated to Lead Review.

## Lead Review

Status: accepted

Review Notes:
- The returned auto-center bug is fixed. `clampRealmPan` now reads the current scale from `realmScaleRef`, so it does not change identity when `realmScale` changes.
- Initial auto-fit is guarded by `realmInitialFitKeyRef` and keyed to meaningful realm/current-kingdom data, not to wheel/pinch scale changes.
- Manual wheel zoom and pinch zoom update `realmScaleRef`/`realmScale`, but do not change `realmInitialFitKey`; therefore manual zoom should persist until the player explicitly clicks `Your kingdom`.
- The `Your kingdom` button still directly calls `centerCurrentRealmKingdom()` and refits on demand.
- Territory clusters remain deterministic/local mock data and are connected from King+ player city cells; non-King players keep city badges only.
- The task remains correctly limited to UI/mock map behavior only.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.

Residual Risk:
- Manual browser visual QA was not completed in this Lead pass; acceptance is based on code review and static/build checks for the returned interaction bug.
