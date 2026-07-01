# Task: Block realm castle cells from capture targets

## ID

TASK-057

## Role

builder-code

## Goal

Fix the Match Pairs realm capture logic so no castle/home cell can ever be selected, captured, overwritten, or animated as a conquest target, whether it belongs to the current player or another player.

## Allowed Files

- src/pages/MatchPairs.tsx
- tasks/todo/TASK-057-block-realm-castle-cells-from-capture.md
- tasks/review/TASK-057-block-realm-castle-cells-from-capture.md
- tasks/done/TASK-057-block-realm-castle-cells-from-capture.md

## Forbidden Files

- src/pages/MatchPairs.module.css
- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- Castle/home cells are excluded from conquest target selection for all players, including current-player and rival castles.
- The exclusion must be robust even during live-sync timing, stale state, missing player record data, or canonical home-cell recalculation.
- `applyRealmCapture` must not write a captured cell if the selected target is any player's home/castle cell.
- Capture animation must not be started for any home/castle cell.
- If no valid non-home target exists, capture should safely return `false` without looping, retrying forever, or leaving UI in a stuck conquest state.
- Shrink/demotion logic must continue to preserve the current player's home/castle cell.
- Existing live-sync from TASK-055 and owner-color behavior from TASK-056 must be preserved.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User reported a bug where the game tried to paint/occupy a castle cell and appeared to loop until page refresh.
- Important rule: castle cells are not conquerable territory. They are anchor cells only.
- Current code already has a `homeCellIds` guard inside candidate selection, but the bug indicates the guard must be made stronger and closer to persistence as well.
- Consider deriving protected home cells from both `realmPlayers` and `realmState.players`, plus canonical player home cells if available, so stale/live states cannot expose a castle as an ordinary target.
- Preserve all realm mechanics and persistence from TASK-039 through TASK-056.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-057-block-realm-castle-cells-from-capture.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx`

Notes:
- Strengthened `applyRealmCapture` with `protectedHomeCellIds` built from the current player's home cell, canonical `realmPlayers` home cells, persisted `realmState.players` home cells, and rendered castle/player cells.
- Candidate selection now skips any protected home/castle cell via `isProtectedHomeCell(candidate)`.
- Added a final guard after `captureTarget` selection and before `nextState`, `persistRealmState(...)`, and `markRealmCellCaptured(...)`; protected home/castle targets now return `false` safely.
- If no non-home capture target exists, `applyRealmCapture` returns `false` without retrying or persisting/animating a protected cell.
- Shrink logic already excludes the current player's `homeCellId` and was not changed.
- `npm run build` passed with the existing Vite large chunk warning.
- The progress rg reports existing current-user `users/${currentUser.uid}/matchPairsProgress/...` paths only; no non-current `users/${uid}/matchPairsProgress` read was added.
- Forbidden regression rg check returned no matches.
- No realm mechanics, live-sync, persistence shape, rank logic, player identity, popup behavior, zoom/pan, tablet behavior, owner colors, word selection, or gameplay mechanics were changed.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-057-block-realm-castle-cells-from-capture.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Forbidden regression `rg` check: passed with no matches.

Acceptance Notes:
- `applyRealmCapture` now protects home/castle cells gathered from current player, canonical realm players, persisted realm player records, and rendered castle cells.
- Candidate selection skips protected cells.
- A final guard before state creation, persistence, and animation prevents protected cells from being captured even if a stale/live-sync state exposes them.
- If no valid non-home target exists, capture returns `false` without persisting or animating.
- Existing live-sync, owner colors, shrink preservation, and realm mechanics were preserved.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
