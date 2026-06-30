# TASK-046: Fix realm public identity resolution and stale rank trust

Status: todo
Owner: Builder
Lead: Codex

## Problem

The Match Pairs realm still renders participants as fallback names like `Player dImOgV` / `Player TU18bk` and can show non-current participants as `King` even when the UI should not trust that status.

Live data check for the `Timurs lessons` dictionary showed:

- Dictionary owner: `Bo8E4WwFhib5ZkvmGcA1NnD1Wkt1` (Gregory)
- Connected students:
  - `dImOgVlMSiZae4vp29fHDaqaye13`
  - `TU18bkgC1qWhXddOLtXeqBp9up93`
- Their `/users/{uid}/profile` records currently have `beneId` and `userNumber`, but no `sovereignName`.
- `/shared/uid_to_beneid/{uid}` contains readable BeneIDs:
  - `dImOgVlMSiZae4vp29fHDaqaye13` -> `Bene_lavomerka_2471`
  - `TU18bkgC1qWhXddOLtXeqBp9up93` -> `Bene_Timur_Iakovlev_2435`

Current code issue:

- `resolveRealmDisplayName` uses one `Promise.all()` for private profile and shared BeneID. If the client cannot read another user's private profile, the whole name resolution falls into `Player <uid-prefix>` and ignores the shared BeneID that should still be usable.
- Non-current participant rank resolution reads private progress and then may trust persisted realm `rankId`. Old realm records can be stale or viewer-written, so stale `king` values can keep showing.
- Realm player seeding currently writes `name` and `rankId` for every participant. One viewer should not stamp other users' public names/ranks.

## Requirements

1. Resolve participant names robustly:
   - Fetch private profile and shared BeneID independently.
   - If private profile read fails or is denied, still use `shared/uid_to_beneid/{uid}`.
   - Prefer names in this order:
     1. `sovereignName`
     2. `displayName`
     3. existing profile aliases
     4. profile `beneId`
     5. `shared/uid_to_beneid/{uid}`
     6. trusted non-fallback persisted realm name
     7. final `Player <uid-prefix>` fallback

2. Do not let old persisted realm names override better live public identity:
   - Fallback names matching `Player <uid-prefix>` must never win over profile/BeneID data.
   - If a persisted realm name is present but better public data exists, render the better public data.

3. Fix rank trust for non-current participants:
   - Current user rank can still be derived from current local/Firebase progress.
   - Temporary `?adminRealm=king` debug user still renders as King.
   - For other users, do not trust old realm `rankId` unless the record is explicitly self-published by that same user in the new format.
   - Add a small trust marker for self-published player records, for example `rankSource: 'self'` or `updatedBy: uid`.
   - Existing old records without this marker must not make a participant King; use `citizen` unless a trusted public/self-published rank is available.

4. Publish only the current user's public realm player data:
   - When the current signed-in user opens the realm or completes relevant Match Pairs progress, update only `matchPairsRealms/{realmKey}/players/{currentUser.uid}` with:
     - resolved current user's display name
     - current user's derived rank
     - `homeCellId`
     - trust marker (`rankSource: 'self'` or `updatedBy: currentUser.uid`)
     - `updatedAt`
   - Do not write `name` / `rankId` for other participants from the current viewer session.

5. Preserve castle/home cell behavior:
   - All connected participants still appear on the map.
   - They still get deterministic home/castle cells.
   - Home cell ownership remains seeded so every participant has a visible castle.
   - Do not create fake conquest territory.
   - Capture must still skip all home cells.

6. Keep existing realm mechanics:
   - No Emperor playable level.
   - No edge-hover pan.
   - Outside-click popup close remains working.
   - Do not reintroduce old anti-cheat/replacement guard code.

## Verification

Run:

- `npm run build`
- `git diff --check`
- `rg` checks for removed demo names and forbidden old mechanics:
  - no `Amber Gate`, `Moon Tower`, `Eastwatch`, `River Hold`, `Sunspire`
  - no playable Match Pairs `emperor`
  - no `REALM_EDGE_PAN`
  - no old fixed viewport shuffle overlay names

Static verification to report:

- `resolveRealmDisplayName` uses independent reads and can return `shared/uid_to_beneid` even if profile read fails.
- Non-current users with old realm records and no self-published trust marker do not inherit stale `king`.
- Only current user's player record gets self-published `name` / `rankId` / trust marker from the current session.
- Other participants still render and still receive deterministic castle cells.

## Out of Scope

- No Firebase rules changes.
- No broad database migration.
- No visual QA by Builder; Lead/user will check locally if needed.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-046-fix-realm-public-identity-and-rank-trust.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- `resolveRealmDisplayName` now reads `users/{uid}/profile` and `shared/uid_to_beneid/{uid}` independently, so a denied/private profile read no longer prevents using the shared BeneID.
- Persisted realm names are used for non-current participants only when the player record is trusted with `rankSource: 'self'` or `updatedBy: uid`; fallback `Player <uid-prefix>` names still cannot override profile/BeneID identity.
- Non-current participant rank trust now requires a trusted self-published record when Firebase progress is not readable; old records without the trust marker default to `citizen` instead of stale `king`.
- Current user and temporary debug guest behavior are preserved: current user uses current progress, and `?adminRealm=king` debug guest remains King.
- Self-published player records now include `rankSource: 'self'` and `updatedBy: currentUser.uid`.
- The realm seeding pass only publishes the current user's `name` / `rankId` / trust marker. Other participants still get deterministic home/castle cells through the cells map, but their player records are not stamped from the current viewer session.
- `persistRealmState` now writes only explicitly changed player ids while preserving existing cell writes.
- Capture writes only the current player's trusted record; shrink writes only the changed cell.
- No Firebase rules, broad migrations, territory reset, Emperor playable path, edge-hover pan, or old fixed viewport shuffle overlay were introduced.
- Local/browser visual QA is delegated to Lead/user per task instruction.
- Process note: this task file did not include an explicit `Allowed Files` section; the implementation was kept to the task-described Match Pairs file plus this task report.

## Lead Review

Status: returned

The name-resolution part is acceptable, but rank trust is still not strict enough for the reported production case.

Issue:
- `resolveRealmParticipantRankId` still reads `users/{uid}/matchPairsProgress/{activeDictId}` for non-current participants.
- Live data for the reported `Timurs lessons` participants currently contains stale/incorrect `king: true` progress for the affected users.
- If that private progress read is allowed in the browser, the realm will still show those users as King, which is exactly the bug being returned.

Required fix:
- For non-current participants, do not read `users/{uid}/matchPairsProgress/{activeDictId}` at all.
- Use only a trusted self-published realm player record for another participant's displayed rank:
  - trusted means `rankSource: 'self'` and/or `updatedBy === uid`;
  - old records without the marker must fall back to `citizen`.
- Keep current-user rank derivation unchanged.
- Keep temporary `?adminRealm=king` debug user unchanged.
- Keep independent profile/BeneID name resolution unchanged.
- Keep current-user-only player record publishing unchanged.

Additional static verification to report:
- There is no non-current participant read from `users/{uid}/matchPairsProgress/{activeDictId}`.
- Non-current displayed rank can only come from a trusted self-published realm player record or `citizen` fallback.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-046-fix-realm-public-identity-and-rank-trust.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n 'users/\\$\\{uid\\}/matchPairsProgress|resolveRealmParticipantRankId|trustedPersistedRank|isTrustedRealmPlayerRecord|users/\\$\\{currentUser\\.uid\\}/matchPairsProgress' src/pages/MatchPairs.tsx

Notes:
- Addressed Lead Review by removing the non-current participant read from `users/{uid}/matchPairsProgress/{activeDictId}` entirely.
- `resolveRealmParticipantRankId` is now synchronous for non-current participants: debug guest can still be King, current user still uses `effectivePerfectRanks`, and all other users use only a trusted self-published realm player record or `citizen`.
- Trusted non-current rank still requires `rankSource: 'self'` or `updatedBy === uid`.
- The only remaining `matchPairsProgress` paths in `MatchPairs.tsx` are current-user load/save/demotion paths under `users/${currentUser.uid}/...`.
- Independent profile/BeneID name resolution remains unchanged.
- Current-user-only player record publishing remains unchanged.
- Other participants still render and still receive deterministic castle/home cells through the cells map.
- No Firebase rules, broad migrations, visual QA, territory reset, Emperor playable path, edge-hover pan, or old fixed viewport shuffle overlay were introduced.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}|resolveRealmParticipantRankId" src/pages/MatchPairs.tsx`: passed; no non-current participant progress read remains.
- Static diff review of `src/pages/MatchPairs.tsx`: accepted.

Accepted Notes:
- Other participants' names now read profile and shared BeneID independently.
- Other participants' displayed rank now comes only from a trusted self-published realm record or falls back to `citizen`.
- Current user rank and temporary `?adminRealm=king` behavior are preserved.
- Current viewer no longer writes other participants' realm `name` / `rankId` records.
