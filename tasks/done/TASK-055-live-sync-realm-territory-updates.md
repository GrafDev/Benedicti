# Task: Live-sync Match Pairs realm territory updates

## ID

TASK-055

## Role

builder-code

## Goal

Make Match Pairs realm territory updates propagate automatically to all open clients when any player captures or loses territory, without requiring page reload or manual refresh.

## Allowed Files

- src/pages/MatchPairs.tsx
- tasks/todo/TASK-055-live-sync-realm-territory-updates.md
- tasks/review/TASK-055-live-sync-realm-territory-updates.md
- tasks/done/TASK-055-live-sync-realm-territory-updates.md

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

- Signed-in clients subscribe to the active realm path `matchPairsRealms/{realmKey}` and receive live Firebase updates for `players` and `cells`.
- When one player captures or loses a territory cell, other open clients viewing the same realm update automatically.
- The existing debug guest/localStorage mode still works without Firebase writes or Firebase live subscription requirements.
- Initial realm loading remains safe: no stale in-memory state from a previous `realmStateKey` should be shown as ready for the new key.
- The listener is cleaned up when the component unmounts or when `realmKey` / `realmStateKey` changes.
- Current local optimistic updates must not be overwritten by stale older snapshots in a way that drops the user's just-written capture.
- Preserve all current realm behavior: canonical participant order, canonical home cells, player names, ranks, popup behavior, capture/shrink logic, zoom/pan, tablet orientation behavior, and TASK-054 visual palette.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User requirement: once territory is captured by anyone, it should update automatically for all users.
- Prefer Firebase Realtime Database `onValue` listener on `matchPairsRealms/{realmKey}` for signed-in users.
- Current implementation appears to use one-time `get()` loading; replace or supplement that carefully with a live listener.
- Keep debug guest `?adminRealm=king` localStorage behavior intact.
- Do not change database rules in this task.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-055-live-sync-realm-territory-updates.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx`

Notes:
- Signed-in realm loading now subscribes with Firebase Realtime Database `onValue(ref(db, `matchPairsRealms/${realmKey}`), ...)`.
- Incoming live snapshots update both `players` and `cells`, so other open clients on the same `realmKey` receive territory changes without reload.
- The listener is unsubscribed in the effect cleanup when the component unmounts or when `realmKey` / `realmStateKey` dependencies change.
- The effect still resets `realmStateLoadKey` and clears realm state before loading a new key, so stale ready state from a previous realm key is not reused.
- Debug guest/localStorage mode remains on the existing local load path and does not require a Firebase live subscription.
- Added `pendingRealmWriteRef` so current optimistic writes merge their changed players/cells over incoming snapshots until the write promises settle, avoiding a stale snapshot dropping a just-written capture/shrink.
- `npm run build` passed with the existing Vite large chunk warning.
- The progress rg reports existing current-user `users/${currentUser.uid}/matchPairsProgress/...` paths only; no non-current `users/${uid}/matchPairsProgress` read was added.
- Forbidden regression rg check returned no matches.
- No database rules, realm math, rank logic, player identity, popup behavior, zoom/pan, tablet behavior, visual palette, or gameplay mechanics were changed by this task.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-055-live-sync-realm-territory-updates.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Forbidden regression `rg` check: passed with no matches.

Acceptance Notes:
- Signed-in realm state now subscribes to `matchPairsRealms/{realmKey}` with Firebase Realtime Database `onValue`.
- Incoming snapshots update `players` and `cells`, enabling automatic cross-client territory updates.
- Listener cleanup is present in the effect return.
- Debug guest/localStorage path remains separate.
- Existing realm behavior and TASK-054 palette were preserved.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
