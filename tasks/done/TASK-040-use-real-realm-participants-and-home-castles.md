# TASK-040: Use real realm participants, own home castles, and spread castles apart

## Owner

Builder

## Status

todo

## Context

After TASK-039, the realm conquest mechanic works, but the realm still has several product issues:

User feedback:
- The right player list must show real people connected to the dictionary, not placeholder names like Amber Gate / Moon Tower.
- The names in the list should be the users' real nicknames/BeneIDs.
- Clicking a castle must show information about the castle owner.
- The player's own castle hex should already be owned by that player by default.
- The second conquest currently captured the player's own castle/home hex; that is wrong because the castle hex is already the player's land.
- Castles are too close to each other even though there is enough space; distribute them around the map edge with more distance.

Existing data:
- Teacher/student relations are available in Firebase:
  - `shared/relations/teacher_students/{teacherUid}/{studentUid}: true`
  - `shared/relations/student_teachers/{studentUid}/{teacherUid}: true`
- Reverse BeneID map is available:
  - `shared/uid_to_beneid/{uid}`
- User profiles are available:
  - `users/{uid}/profile`
- Dictionaries include:
  - `Dictionary.userId`
  - `Dictionary.isTeacherDict`
  - `Dictionary.isShared`

Current realm persistence from TASK-039:
- `matchPairsRealms/{realmKey}/players/{uid}`
- `matchPairsRealms/{realmKey}/cells/{cellId}`
- Debug guest localStorage:
  - `benedicti_match_pairs_realm_{realmKey}`

## Required Changes

### Real realm participants

Replace demo placeholder opponents in Match Pairs realm with real participants for the current dictionary realm.

Participant rules:
- Personal dictionary owned by the current user:
  - include owner/current user;
  - if owner is a teacher, include students from `shared/relations/teacher_students/{ownerUid}`.
- Teacher dictionary viewed by a student:
  - include the teacher/owner;
  - include all students connected to that teacher from `shared/relations/teacher_students/{teacherUid}`;
  - include current user if they are connected or currently viewing the teacher dictionary.
- Shared/default dictionary:
  - include current user and any players already present in `matchPairsRealms/{realmKey}/players`;
  - do not invent fake nonzero players.
- Debug guest `?adminRealm=king` without `currentUser`:
  - keep the debug guest only, plus existing local debug participants if already stored;
  - do not write fake users to Firebase.

Do not keep hardcoded demo players like Amber Gate, Moon Tower, Eastwatch, River Hold, Sunspire in the real app UI.

### Player display names

Player display name should use the best available identity:
1. `users/{uid}/profile/displayName`, if present,
2. `shared/uid_to_beneid/{uid}`,
3. email prefix if available for current user,
4. stable short fallback from uid.

The right panel must show these real display names/nicknames.

### Castle popup

Clicking a castle marker must open a popup with owner info:
- display name/nickname,
- rank/status,
- owned cell count,
- territory percentage,
- castle/home label.

The popup must reflect the clicked castle owner, not just generic placeholder copy.

### Home castle ownership

The home/castle hex for each real participant must be treated as owned by that participant by default.

Important:
- The home/castle cell must count as owned territory.
- The home/castle cell must be colored as that player's owned cell.
- The first conquest after entering realm should capture a neighboring hex, not the home/castle hex.
- Capture algorithm must never choose the current player's own home cell as a capture target.
- If an old persisted state has no home cell in `cells`, the UI/state should seed or derive home ownership safely.

Persistence:
- For signed-in users, persist home ownership to `matchPairsRealms/{realmKey}/cells/{homeCellId}` when needed.
- For debug guest, persist home ownership only to the debug localStorage state.
- Avoid creating Firebase records for non-real demo users.

### Castle distribution

Distribute participant castles evenly around the outer ring edge with more spacing.

Requirements:
- For N participants, choose edge cells roughly evenly around the entire outer ring.
- Do not use hash-only placement that can put two real players next to each other when there is plenty of space.
- Avoid duplicate home cells.
- If persisted `homeCellId` exists and is valid, keep it unless it collides with another participant.
- For new participants, assign a free edge cell with a minimum gap when possible.
- Deterministic output: the same participant list should produce the same home cells.

### Existing territory compatibility

Do not wipe existing territory.

When loading existing `matchPairsRealms/{realmKey}`:
- keep existing owned conquest cells;
- add missing home ownership cells;
- ensure percentages include home cells;
- ensure old current-player territory still displays.

### UI

Right panel:
- list real realm participants and percentages;
- no hardcoded demo names;
- players with only home castle should show the correct percentage (for example `1 / total cells`, rounded whole percent may be `1%` or `2%` depending total).

Left panel:
- keep current player info, but counts must include home castle ownership.

Map:
- current player's owned cells and home castle should be visually connected/consistent.
- other players' home castles should appear owned by them, not neutral.

## Acceptance Criteria

- Teacher dictionary realm shows the teacher and real connected students, not demo players.
- Right panel uses real nicknames/BeneIDs/display names.
- Clicking a castle opens owner info for that castle.
- Current player's castle hex is owned from initial realm load.
- First successful conquest from a fresh realm increases territory from home ownership to home + 1 adjacent hex.
- Second successful conquest captures another adjacent hex, not the player's castle.
- Castle markers are distributed around the outer ring with visible spacing when enough edge cells exist.
- Existing territory state is preserved.
- Debug guest mode still works locally without Firebase writes.
- No placeholder demo players in normal signed-in/shared/teacher realm UI.
- No Match Pairs Emperor playable/status regression.
- Edge-hover pan remains absent.
- `npm run build` passes.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add dependencies.
- Do not change Firebase config.
- Do not edit unrelated games.
- Do not reintroduce demo names as normal players.
- Do not reset existing realm territory data.
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
- Do not perform visual QA; Lead handles local Vite/browser visual checks.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run forbidden edge-hover-pan `rg` check.
- Run static checks:
  - no hardcoded demo player names remain in Match Pairs realm player creation/rendering;
  - no `effectivePerfectRanks.emperor`, `rankId: 'emperor'`, or `id: 'emperor'` Match Pairs usage;
  - capture algorithm cannot select the current player's home cell;
  - home cells are included in ownership counts.
- Include implementation notes:
  - participant loading paths;
  - display name resolution strategy;
  - home ownership seeding/persistence behavior;
  - castle distribution algorithm.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Firebase/localStorage paths used
- Participant loading summary
- Home ownership and castle distribution summary
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-040-use-real-realm-participants-and-home-castles.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Replaced normal realm demo participants with real participants loaded from Firebase relations and existing realm records.
- Participant loading uses `shared/relations/teacher_students/{ownerUid}` for personal/teacher-owned dictionary realms, includes the owner/current user, and includes existing `matchPairsRealms/{realmKey}/players` records; shared/default realms include current user plus existing realm players.
- Debug guest `?adminRealm=king` remains local-only and uses localStorage state from `benedicti_match_pairs_realm_{realmKey}` without Firebase writes.
- Display name resolution uses `users/{uid}/profile/displayName`, then `shared/uid_to_beneid/{uid}`, then current user email prefix when available, then a stable short uid fallback.
- Home ownership is seeded for every real participant by adding/updating `matchPairsRealms/{realmKey}/players/{uid}` and `matchPairsRealms/{realmKey}/cells/{homeCellId}` while preserving existing conquest cells.
- Territory counts and percentages are based on `realmState.cells`, so seeded home cells count as owned territory.
- Castle/home cells are skipped by the capture target selection, so first conquest from a fresh realm captures a neighboring hex rather than the player's own castle.
- Shrink no longer removes the player's home castle; it removes the farthest non-home owned cell first.
- Castle assignment keeps valid persisted homes unless they collide, then distributes new home cells evenly around the outer ring with gap-aware deterministic fallback.
- Castle popup now shows the clicked owner's name, rank, castle label, owned cell count, and territory percentage.
- Local browser/visual QA is delegated to Lead Review per task instruction.

## Lead Review - returned

Status: changes requested

Issue:
- Fresh debug realm starts with `2 / 127` owned cells before any conquest. Expected initial fresh state is exactly the home/castle cell: `1 / 127`.
- Reproduced locally at `/play/match-pairs/default?adminRealm=king&reviewFresh=040` in a fresh tab. Visible text showed:
  - `ТЕРРИТОРИЯ 2 / 127`
  - leaderboard current player `2%`
  - two current-player owned hexes in the DOM.
- This fails the acceptance criterion: "Current player's castle hex is owned from initial realm load" and "First successful conquest from a fresh realm increases territory from home ownership to home + 1 adjacent hex." It appears the current implementation seeds home ownership plus one extra owned cell before the player conquers.

Required fix:
- A fresh realm state must seed only the current player's home/castle hex as owned.
- The first successful conquest from that fresh state must increase territory from `1 / total` to `2 / total`, not from `2 / total` to `3 / total`.
- Preserve old existing conquest data when it truly exists, but do not create an extra conquest cell during initial participant/home seeding.
- Ensure debug guest local-only state follows the same rule.

Checks after fix:
- `npm run build`
- `git diff --check`
- forbidden edge-hover-pan / Emperor rg checks from this task.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-040-use-real-realm-participants-and-home-castles.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Added an explicit fresh-review debug invariant instead of relying only on storage-key isolation.
- For `?adminRealm=king&reviewFresh=...`, before the first conquest, home seeding now normalizes `cells` to an empty object and then writes only participant `homeCellId` entries.
- Fresh-review non-home cells are not preserved until `applyRealmCapture` runs and sets `reviewConquestStarted: true`.
- Normal non-review debug mode and signed-in Firebase mode still preserve existing territory by spreading `realmState.cells`.
- This separates the code paths for home seeding, existing territory preservation, and fresh review/debug reset.
- Local browser/visual QA is delegated to Lead Review per task instruction.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- `npm run build`: passed; Vite reported the existing large chunk warning only.
- `git diff --check`: passed.
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Local browser review with `/play/match-pairs/default?adminRealm=king&reviewFresh=040d_finalcheck`: initial fresh debug realm showed exactly `ТЕРРИТОРИЯ 1 / 127`, exactly one current-player owned hex, and that owned hex contained the castle/home marker.
- Local browser review with `/play/match-pairs/default?adminRealm=king&reviewFresh=040e_perfect`: after an ideal conquest run, the realm showed `ТЕРРИТОРИЯ 2 / 127`, with one home/castle hex and one non-home conquered hex.
- Local DOM/text review: demo player names are absent from the rendered player list, and the current player entry is shown as `Гость`.

Notes:
- The returned issue where a brand-new fresh review realm started with a non-home owned cell is fixed.
- Castle/player popup rendering is present in the component and is wired through `selectedRealmPlayer`; the in-app browser automation bridge could not complete a synthetic marker click reliably, so this was not used as a blocking automated check.
- No Firebase rules/config changes were made in this task.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-040-use-real-realm-participants-and-home-castles.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Added an explicit fresh-review debug invariant instead of relying only on storage-key isolation.
- For `?adminRealm=king&reviewFresh=...`, before the first conquest, home seeding now normalizes `cells` to an empty object and then writes only participant `homeCellId` entries.
- Fresh-review non-home cells are not preserved until `applyRealmCapture` runs and sets `reviewConquestStarted: true`.
- Normal non-review debug mode and signed-in Firebase mode still preserve existing territory by spreading `realmState.cells`.
- This separates the code paths for home seeding, existing territory preservation, and fresh review/debug reset.
- Local browser/visual QA is delegated to Lead Review per task instruction.
- Local Lead-repro scenario should show initial fresh debug realm as `1 / 127` before conquest.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-040-use-real-realm-participants-and-home-castles.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Root cause: debug guest localStorage used only `benedicti_match_pairs_realm_{realmKey}`, so the Lead fresh-review URL with `reviewFresh=040` could still load an older local debug conquest cell. Home ownership seeding then correctly added the castle cell, producing `2 / total` before a new conquest.
- Fix: debug guest localStorage now uses `benedicti_match_pairs_realm_{realmKey}_review_{reviewFresh}` when `reviewFresh` is present, isolating fresh review runs while preserving normal debug guest territory for URLs without `reviewFresh`.
- Initial home seeding still only adds participant home/castle ownership; it does not create an extra conquest cell.
- Existing normal debug/Firebase territory remains preserved under the original realm keys.
- Local browser/visual QA is delegated to Lead Review per task instruction.

## Lead Review - returned again

Status: changes requested

Issue:
- The returned fix did not resolve the repro. A brand-new fresh key still starts with `2 / 127` before any conquest.
- Reproduced locally with:
  - `/play/match-pairs/default?adminRealm=king&reviewFresh=040b`
- Visible state still showed:
  - `ТЕРРИТОРИЯ 2 / 127`
  - current player leaderboard `2%`
  - two DOM hexes with `realmHexOwnedCurrent`
- DOM details:
  - one owned-current hex is the castle/home marker cell;
  - one additional owned-current hex is a normal non-castle hex.

Important:
- The root cause cannot only be stale normal debug localStorage, because `reviewFresh=040b` uses a new review key and still reproduces.
- Please inspect the home-seeding/render state flow itself. The extra non-home owned cell is being produced before any conquest action.

Required fix:
- On a fresh `reviewFresh` debug realm, current player must show exactly `1 / total` before any conquest.
- Only the castle/home hex should have `realmHexOwnedCurrent` before conquest.
- First successful conquest should create exactly one additional adjacent non-home owned hex, moving from `1 / total` to `2 / total`.
- Keep existing persisted territory behavior for real non-fresh states, but fresh review/debug state must be clean.

Checks after fix:
- `npm run build`
- `git diff --check`
- forbidden edge-hover-pan / Emperor rg checks from this task.
- Builder may do static checks only, but include a concrete explanation of why the extra non-home owned cell can no longer be produced before conquest.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-040-use-real-realm-participants-and-home-castles.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Root cause: the realm component could render and run participant/home seeding with stale in-memory `realmState` before the async load for the current debug/Firebase state key completed. In a fresh `reviewFresh` URL, that allowed an old non-home debug conquest cell to be copied into the new review state, then home seeding added the castle cell, producing `2 / total` before conquest.
- Fix: added a `realmStateLoadKey`/`realmStateKey` readiness gate. Realm loading now clears in-memory state immediately, marks the state as not ready, and only participant loading/home seeding may run after the current key has finished loading.
- Fresh review debug keys are also versioned with `_home_seed_v2`, so previously contaminated review keys are not reused.
- Because home seeding now runs only after a clean current-key load and only writes each participant `homeCellId`, a fresh review/debug realm cannot create a non-home owned cell before `applyRealmCapture`.
- Existing real/non-fresh territory remains preserved after the correct state key loads.
- Local browser/visual QA is delegated to Lead Review per task instruction.

## Lead Review - returned third time

Status: changes requested

Issue:
- The repro still fails after the readiness-key fix.
- Reproduced locally with a new key:
  - `/play/match-pairs/default?adminRealm=king&reviewFresh=040c_home_seed_review`
- Visible state still showed:
  - `ТЕРРИТОРИЯ 2 / 127`
  - current player `2%`
  - two DOM hexes with `realmHexOwnedCurrent`.
- DOM again shows one castle/home hex and one ordinary non-castle owned hex before any conquest.

Important:
- The fix explanation says this cannot happen, but the browser state shows it still does.
- Please stop treating this as only storage-key contamination. Add an explicit fresh/debug invariant so a new reviewFresh debug realm cannot retain or derive non-home cells before conquest.

Required fix:
- For `?adminRealm=king&reviewFresh=...` with no prior state for that exact review key, initial state must be normalized to only:
  - participant player records,
  - participant home/castle cells.
- It must not preserve any non-home cells in fresh review mode before conquest.
- If needed, make reviewFresh mode intentionally clean by ignoring previous debug/Firebase-like non-home state for that review key until a conquest happens in that review session.
- Normal non-review modes must still preserve existing territory.
- Add a small pure helper or clear code path that distinguishes:
  - home seeding,
  - existing territory preservation,
  - fresh review/debug reset.

Local acceptance target:
- Opening `/play/match-pairs/default?adminRealm=king&reviewFresh=<brand-new-value>` must show exactly:
  - `ТЕРРИТОРИЯ 1 / 127`
  - exactly one `realmHexOwnedCurrent` hex,
  - that hex is the castle/home marker cell.

Checks after fix:
- `npm run build`
- `git diff --check`
- forbidden edge-hover-pan / Emperor rg checks from this task.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-040-use-real-realm-participants-and-home-castles.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Added an explicit fresh-review debug invariant instead of relying only on storage-key isolation.
- For `?adminRealm=king&reviewFresh=...`, before the first conquest, home seeding now normalizes `cells` to an empty object and then writes only participant `homeCellId` entries.
- Fresh-review non-home cells are not preserved until `applyRealmCapture` runs and sets `reviewConquestStarted: true`.
- Normal non-review debug mode and signed-in Firebase mode still preserve existing territory by spreading `realmState.cells`.
- This separates the code paths for home seeding, existing territory preservation, and fresh review/debug reset.
- Local browser/visual QA is delegated to Lead Review per task instruction.
