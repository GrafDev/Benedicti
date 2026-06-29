# TASK-041: Fix Match Pairs realm participant display names

## ID

TASK-041

## Role

builder-code

## Goal

Match Pairs realm must show real player names/nicknames for connected dictionary participants instead of fallback labels such as `Player dlmOgV` or `Player TU18bk`.

## Context

After TASK-040, realm participants are loaded from real dictionary relationships, but some participant names render as `Player <uid-prefix>`.

User screenshots:
- Realm player list shows:
  - `Gregory`
  - `Player dlmOgV`
  - `Player TU18bk`
- Profile screen shows the player-facing name field as `Sovereign Name`, for example `Gregory`.

Important current code observations:
- `src/pages/Profile.tsx` edits the local `name` from `currentUser.displayName`.
- `src/contexts/AuthContext.tsx:updateProfileName` currently updates Firebase Auth `displayName`.
- `src/pages/MatchPairs.tsx:resolveRealmDisplayName` currently reads:
  - `users/{uid}/profile/displayName`
  - `shared/uid_to_beneid/{uid}`
  - fallback `Player ${uid.slice(0, 6)}`
- Firebase Auth `displayName` for other users is not available through the Realtime Database read path, so Match Pairs cannot rely only on Auth profile names for other participants.

## Required Changes

### Persist the player's visible name where other app users can resolve it

When the user saves `Sovereign Name` / profile name:
- keep the existing Firebase Auth `displayName` update;
- also persist the visible name into Realtime Database under the user's profile, for example:
  - `users/{uid}/profile/displayName`
- if there is already an existing local profile field used for the same concept, reuse it instead of adding a duplicate field.

Do not break existing profile fields:
- `beneId`
- `isTeacher`
- `students`
- `teachers`
- `userNumber`

### Resolve realm participant names robustly

Update Match Pairs realm display name resolution so it uses the best available player-facing identity:
1. `users/{uid}/profile/displayName`
2. any existing profile name aliases if present in the stored data, such as `name`, `sovereignName`, or `username`
3. `shared/uid_to_beneid/{uid}`
4. existing persisted realm player name if it is not a fallback `Player <uid-prefix>`
5. current user's `currentUser.displayName` / email prefix when resolving the current user
6. stable uid fallback only as a last resort

Important:
- Existing fallback names already persisted in `matchPairsRealms/{realmKey}/players/{uid}/name` must not permanently win over better newly resolved names.
- If a better display name is found, update/persist the realm player record name on the next home/player seeding pass.
- The right player list and castle owner popup must use the improved resolved name.

### Backward compatibility

Existing users may have:
- only Firebase Auth `displayName`,
- only `beneId`,
- old realm player records with fallback `Player ...` names,
- profile records without `displayName`.

Handle these safely without clearing territory, castle placement, or rank/conquest state.

## Acceptance Criteria

- A teacher dictionary realm with connected students no longer shows `Player <uid-prefix>` when profile display names or BeneIDs exist.
- The right realm player list shows real names/nicknames such as `Gregory` or the participant BeneID.
- Castle owner popup shows the same resolved name for that castle owner.
- Saving/changing `Sovereign Name` on the profile persists a readable profile display name for future realm resolution.
- Existing realm player records with old fallback names are upgraded when better names become available.
- No realm territory/cell ownership is reset.
- No Match Pairs Emperor playable/status regression.
- Edge-hover pan remains absent.
- `npm run build` passes.

## Allowed Files

- `src/pages/MatchPairs.tsx`
- `src/pages/Profile.tsx`
- `src/contexts/AuthContext.tsx`
- `src/stores/useDictionaryStore.ts`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add dependencies.
- Do not change Firebase config.
- Do not reset or rewrite realm territory.
- Do not reintroduce demo realm players.
- Do not reintroduce Match Pairs Emperor as a playable level/status.
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
- Do not perform visual QA; Lead handles local/browser visual checks if needed.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check that no hardcoded demo realm names are reintroduced:
  - `Amber Gate`
  - `Moon Tower`
  - `Eastwatch`
  - `River Hold`
  - `Sunspire`
- Run the existing forbidden Emperor / edge-hover pan `rg` checks used in recent Match Pairs tasks.
- Static verification:
  - profile save writes a readable profile display name path;
  - `resolveRealmDisplayName` prefers real profile/BeneID data over fallback persisted names;
  - persisted realm fallback names can be upgraded without changing cells/territory.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Firebase paths read/written
- Name resolution priority actually implemented
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx
- src/pages/MatchPairs.tsx
- src/stores/useDictionaryStore.ts
- tasks/review/TASK-041-fix-realm-participant-display-names.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- `updateProfileName` now keeps the Firebase Auth `displayName` update and also writes `users/{uid}/profile/displayName` in Realtime Database.
- Profile loading can read the stored `displayName` from the dictionary store profile state for the Sovereign Name field.
- Match Pairs participant name resolution now checks profile `displayName`, `name`, `sovereignName`, and `username`, then `shared/uid_to_beneid/{uid}`, then a non-fallback persisted realm name, then the stable uid fallback.
- Current user resolution also includes Auth display name and email prefix before uid fallback.
- Old persisted realm names matching `Player <uid-prefix>` no longer win over better profile/BeneID names; the normal realm player seeding pass will persist the upgraded name without changing cells/territory.
- No realm territory, cells, rank progression, Emperor status, or edge-hover pan behavior was changed.
- Local/browser visual QA is delegated to Lead Review per task instruction.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- `npm run build`: passed; Vite reported the existing large chunk warning only.
- `git diff --check`: passed.
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.

Static review:
- `updateProfileName` now writes the saved Sovereign Name to `users/{uid}/profile/displayName`, so other users can resolve it through RTDB.
- `fetchProfile` carries `displayName` and name aliases into local profile state.
- Match Pairs now rejects persisted fallback names like `Player dlmOgV` when profile/BeneID data exists.
- Existing realm player seeding can persist a better resolved name without changing `cells`, territory, home cells, rank progression, or conquest state.

Notes:
- This is a data-resolution fix; no local visual browser QA was needed for acceptance.
- Existing users who have not saved a profile display name can still fall back to BeneID.
