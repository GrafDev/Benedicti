# TASK-049: Animate realm hex capture after successful conquest

Status: todo
Owner: Builder
Lead: Codex

## Problem

After a player completes a successful King conquest set, a neighboring hex becomes owned by the player immediately. The color change is too abrupt and should feel like territory is being claimed.

## Requirements

1. Add a capture animation for the newly claimed hex after a successful conquest:
   - The hex should visibly transition from neutral/enemy color to the current player's color.
   - Acceptable styles: soft fade, pixel/scan reveal, radial fill, or similar polished color-fill effect.
   - Keep the animation subtle and readable; no aggressive flash.

2. Trigger the animation only for newly captured cells:
   - It should run after `applyRealmCapture` successfully captures a cell.
   - It should not replay for all already-owned cells on every render.
   - It should not trigger on initial realm load/home cell seeding.
   - It should not trigger on shrink/demotion.

3. Preserve data logic:
   - The cell ownership must still be written immediately enough for persistence.
   - The animation is visual-only and must not block or corrupt Firebase/localStorage state.
   - Capture must still skip home/castle cells.

4. Keep interaction safe:
   - During/after animation the map remains usable.
   - Popup/castle click behavior remains working.
   - The "Your kingdom" centering behavior remains working.

5. Keep existing forbidden regressions absent:
   - Do not reintroduce playable Match Pairs Emperor level.
   - Do not reintroduce edge-hover pan.
   - Do not reintroduce old fixed viewport answer shuffle overlay names.
   - Do not reintroduce non-current participant `matchPairsProgress` reads.

## Implementation Notes

- Prefer a state/ref that stores the last captured `cellId` or a short-lived set of animated cell ids.
- Clear the animation marker after the animation duration.
- If CSS-only is enough, use a dedicated class on the captured hex and keyframes in `MatchPairs.module.css`.
- If the hex uses `clip-path`, the animation should respect the hex shape.

## Verification

Run:

- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm no matches.
- Existing forbidden checks for:
  - demo realm names
  - playable Match Pairs Emperor
  - edge-hover pan
  - old fixed viewport shuffle overlay

Static verification to report:

- Which state/class marks newly captured cells.
- How the marker is cleared.
- Why initial load/home cells do not animate.

## Out of Scope

- No Firebase rules/config changes.
- No database migration.
- No visual/browser QA by Builder; Lead/user will check the animation.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-049-animate-realm-hex-capture.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress" src/pages/MatchPairs.tsx`
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Added `capturedRealmCellIds`, a short-lived set of newly captured realm cell ids.
- `applyRealmCapture` calls `markRealmCellCaptured(captureTarget.id)` only after `persistRealmState(...)` succeeds for the selected capture target.
- The marker is cleared with a `window.setTimeout` after `REALM_CAPTURE_ANIMATION_MS`; pending animation timeouts are cleared on component unmount.
- The animated class is applied only when a rendered cell id is present in `capturedRealmCellIds`.
- Initial realm load, home/castle seeding, existing owned cells, and shrink/demotion do not call `markRealmCellCaptured`, so they do not animate.
- CSS adds a subtle clipped radial reveal and settle filter through `realmHexCaptured`, `realmCaptureReveal`, and `realmCaptureSettle`.
- The capture state is visual-only and does not change Firebase/localStorage persistence, conquest selection, rank, demotion, popup, map pan/zoom, or castle behavior.
- `npm run build` passed with the existing Vite large chunk warning.
- The broader task rg for `matchPairsProgress/${activeDictId}` reports existing current-user progress paths; the narrower non-current `users/${uid}/matchPairsProgress` check has no matches.
- Demo realm names, playable Emperor path, edge-hover pan, old fixed viewport answer shuffle overlay names, and `position: fixed` were not reintroduced.
- Local/browser visual QA is delegated to Lead/user per task instruction.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- `rg -n "capturedRealmCellIds|markRealmCellCaptured|REALM_CAPTURE_ANIMATION_MS|realmHexCaptured|users/\\$\\{uid\\}/matchPairsProgress|position: fixed|answerShuffleOverlay" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed; capture animation markers are present and forbidden paths were not reintroduced.
- Static diff review of `src/pages/MatchPairs.tsx` and `src/pages/MatchPairs.module.css`: accepted.

Accepted Notes:
- Newly captured cells are marked with `capturedRealmCellIds` and rendered with `realmHexCaptured`.
- The marker is set only in `applyRealmCapture` for the selected `captureTarget.id`.
- The marker is cleared after `REALM_CAPTURE_ANIMATION_MS`, and pending timeouts are cleared on unmount.
- Initial load/home seeding/shrink do not call the marker path.
- `persistRealmState` remains asynchronous; the animation starts after the local state/persistence call is issued, not after awaiting Firebase completion. This is acceptable for the visual-only effect.
