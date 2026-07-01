# Task: Limit realm zoom so background always covers viewport

## ID

TASK-063

## Role

builder-code

## Goal

Prevent the Match Pairs realm map from zooming out so far that the realm background/world becomes smaller than the visible map viewport, leaving empty uncovered space.

## Allowed Files

- src/pages/MatchPairs.tsx
- tasks/todo/TASK-063-limit-realm-zoom-to-background-coverage.md
- tasks/review/TASK-063-limit-realm-zoom-to-background-coverage.md
- tasks/done/TASK-063-limit-realm-zoom-to-background-coverage.md

## Forbidden Files

- src/pages/MatchPairs.module.css
- public/assets/match-pairs/realm-board-background.png
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- Realm zoom-out is clamped so the scaled realm world/background is never smaller than the visible realm viewport in either width or height.
- The minimum scale is dynamic and based on the current realm viewport size and `REALM_WORLD_WIDTH` / `REALM_WORLD_HEIGHT`.
- Wheel zoom, pinch zoom, initial fit, "Your kingdom" centering, and any resize/recompute path all respect the dynamic minimum scale.
- Panning should also remain clamped after the dynamic minimum scale is applied, so no empty background edges can be exposed.
- Zoom-in maximum behavior remains unchanged.
- Existing realm background image from TASK-062 remains CSS-driven and is not changed.
- Preserve all current realm mechanics and UI behavior: live-sync, Emperor/deposed status, owner colors, castle-cell protection, pan/zoom interactions except the new min clamp, tablet layout, popup behavior, player list, rank gating, and conquest logic.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx` and confirm no playable Emperor/rank logic is reintroduced.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User feedback: "Фон при зумировании не должен быть меньше размера блока в котором он зумируется. То есть надо зумирование ограничить фоном."
- The relevant current functions appear to be `clampRealmScale`, `clampRealmPan`, `fitRealmBounds`, `zoomRealmAtPoint`, and pinch handling in `handleRealmPointerMove`.
- A likely rule is: `minScale = max(REALM_MIN_SCALE, viewport.width / REALM_WORLD_WIDTH, viewport.height / REALM_WORLD_HEIGHT)`.
- Keep changes narrowly scoped to zoom/pan scale clamping logic.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-063-limit-realm-zoom-to-background-coverage.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx`

Notes:
- Added `getRealmMinimumScale()` using `max(REALM_MIN_SCALE, viewport.width / REALM_WORLD_WIDTH, viewport.height / REALM_WORLD_HEIGHT)`.
- Updated `clampRealmScale()` so wheel zoom, pinch zoom, initial fit, and "Your kingdom" fit all respect the dynamic minimum scale.
- Updated `clampRealmPan()` to use the dynamically clamped active scale before calculating pan bounds.
- Added a scoped viewport resize sync using `ResizeObserver` plus window resize fallback to re-clamp current scale and pan when the visible realm viewport changes size.
- Zoom-in maximum remains `REALM_MAX_SCALE`.
- Did not change CSS, the realm background asset, realm mechanics, live-sync, Emperor/deposed status, owner colors, castle-cell protection, tablet layout, popup behavior, player list, rank gating, conquest logic, word selection, or gameplay mechanics.
- No playable Emperor rank, non-current progress read, edge-hover pan, or fixed viewport answer shuffle overlay was added.
- `npm run build` passed with the existing Vite large chunk warning.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-063-limit-realm-zoom-to-background-coverage.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`: passed with no matches.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Edge-hover pan / old fixed overlay `rg` check: passed with no matches.

Acceptance Notes:
- Realm minimum scale is now dynamic and based on viewport dimensions versus `REALM_WORLD_WIDTH` / `REALM_WORLD_HEIGHT`.
- Wheel zoom, pinch zoom, fit, and "Your kingdom" paths use `clampRealmScale`.
- Pan clamping uses the dynamically clamped scale.
- ResizeObserver/window resize re-clamps scale and pan after viewport size changes.
- CSS, background asset, realm mechanics, and gameplay logic were preserved.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
