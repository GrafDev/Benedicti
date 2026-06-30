# TASK-051: Canonicalize realm participant order and home cells across clients

Status: todo
Owner: Builder
Lead: Codex

## Problem

Different players do not see the same realm layout:

- A player sees their own castle in the same "main" position on their computer.
- Another player sees themselves in that same position on their computer.
- Captured territories can look different between players because home/castle assignment is viewer-dependent.

Live Firebase evidence for `Timurs lessons` realm:

Path:

`matchPairsRealms/owner_Bo8E4WwFhib5ZkvmGcA1NnD1Wkt1_dict_-Ovz5Xgjkw_ALN5UYakD`

Current data contains a home-cell collision:

```json
{
  "cells": {
    "-1:4": "TU18bkgC1qWhXddOLtXeqBp9up93",
    "-2:-1": "Bo8E4WwFhib5ZkvmGcA1NnD1Wkt1",
    "-3:-1": "Bo8E4WwFhib5ZkvmGcA1NnD1Wkt1",
    "-3:0": "TU18bkgC1qWhXddOLtXeqBp9up93",
    "4:-3": "dImOgVlMSiZae4vp29fHDaqaye13"
  },
  "players": {
    "Bo8E4WwFhib5ZkvmGcA1NnD1Wkt1": {
      "homeCellId": "-3:-1"
    },
    "TU18bkgC1qWhXddOLtXeqBp9up93": {
      "homeCellId": "-3:-1"
    }
  }
}
```

Root cause in code:

- Participant sorting currently moves `currentUser.uid` to the front.
- Home cell assignment uses participant index.
- Therefore each viewer can assign themselves to the first slot.
- The self-published `players/{uid}/homeCellId` then persists a viewer-dependent value.

## Requirements

1. Make participant ordering canonical and viewer-independent:
   - Do not sort current user first for realm map placement.
   - Use the same participant order on every client for the same realm.
   - Preferred order:
     1. realm/dictionary owner first when known;
     2. remaining connected participants sorted deterministically by uid or stable public id.
   - Current user can still be highlighted as current, but must not change placement order.

2. Make home/castle cell assignment canonical:
   - The same participant must get the same home cell on every client.
   - Do not trust stale persisted `players/{uid}.homeCellId` if it collides with another participant or conflicts with canonical assignment.
   - Avoid duplicate home cells.
   - Existing conquest cells should be preserved when possible.

3. Repair stale/colliding self-published player home cells:
   - When the current user's stored `players/{currentUser.uid}.homeCellId` differs from canonical home cell, update only the current user's player record to canonical.
   - Do not write other participants' player records from the current viewer.
   - Cell ownership for home cells may still be seeded for all participants so castles appear.

4. Reconcile cells safely:
   - Each participant's canonical home cell should be owned by that participant.
   - If a stale home cell was owned only because of bad home assignment, the current user's stale home cell should be cleared or left only if it is a legitimate conquered non-home cell.
   - Do not delete other players' conquered territory broadly.
   - Capture must still skip all canonical home cells.

5. Preserve shared realm key behavior:
   - Players connected to the same teacher dictionary must use the same `realmKey`.
   - Do not create per-viewer realm keys for teacher dictionaries.

6. Preserve existing mechanics:
   - Realm persistence rules remain unchanged.
   - No non-current participant `matchPairsProgress` reads.
   - No playable Match Pairs Emperor level.
   - No edge-hover pan.
   - No old fixed viewport answer shuffle overlay.

## Verification

Run:

- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm no non-current reads.
- Existing forbidden checks for demo names, playable Emperor, edge-hover pan, fixed answer shuffle overlay.

Static verification to report:

- Participant order no longer depends on current user.
- Home cell assignment is deterministic for the same participant set.
- Current user's stale `homeCellId` can be corrected to canonical.
- Other participants' player records are not overwritten by the current viewer.

## Out of Scope

- No Firebase rules/config changes.
- No broad database migration script.
- No visual/browser QA by Builder; Lead/user will check.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-051-canonicalize-realm-participant-order-and-home-cells.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress" src/pages/MatchPairs.tsx`
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Added `realmOwnerUid` and reused it for the shared teacher dictionary realm key and participant loading.
- Participant ordering no longer moves `currentUser.uid` to the front. Signed-in realm participants are now sorted with the realm/dictionary owner first when known, then remaining participants by uid.
- Current-user highlighting still uses `isCurrent`; it no longer affects map placement order.
- Home/castle assignment no longer passes persisted `players/{uid}.homeCellId` as a preferred slot. Home cells are assigned from deterministic participant index order against the same edge-cell list, so stale/colliding stored home ids do not control layout.
- The current viewer still only self-publishes their own player record. Other participants' `players/{uid}` records are not overwritten by this viewer.
- If the current user's stored home cell differs from the canonical home cell, their player record is corrected to canonical.
- If the current user's stale stored home cell is an edge home-slot cell still owned by them, that stale cell ownership is cleared before canonical home seeding. Existing non-edge conquered cells are preserved.
- All canonical participant home cells are still seeded into `cells` so castles appear and capture continues to skip canonical home cells.
- `npm run build` passed with the existing Vite large chunk warning.
- The broader task rg for `matchPairsProgress/${activeDictId}` reports existing current-user progress paths; the narrower non-current `users/${uid}/matchPairsProgress` check has no matches.
- Demo realm names, playable Emperor path, edge-hover pan, old fixed viewport answer shuffle overlay names, and `position: fixed` were not reintroduced.
- No Firebase rules/config changes, migrations, visual QA, or browser QA were performed.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- Static review of participant sorting, `realmPlayers`, and home seeding logic in `src/pages/MatchPairs.tsx`: accepted.

Accepted Notes:
- Participant placement order no longer puts `currentUser.uid` first.
- Realm owner is first when known; remaining participants are sorted deterministically.
- Home/castle assignment no longer trusts persisted `players/{uid}.homeCellId` as a preferred placement slot.
- Current user's stale home record can be self-corrected; other participants' player records are not overwritten by the current viewer.
- Canonical home cell ownership is still seeded through cells so castles appear for all participants.
