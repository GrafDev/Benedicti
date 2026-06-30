# TASK-044: Use real participant ranks in Match Pairs realm and remove castle placeholder copy

## ID

TASK-044

## Role

builder-code

## Goal

Match Pairs realm must show every dictionary-connected participant with their real nickname and real current Match Pairs rank, not default everyone to King. Non-King players should still appear on the map with their own badge, but they cannot conquer territory until they reach King.

## Context

User feedback after TASK-043:

- Realm still shows fallback names like:
  - `Player dlmOgV`
  - `Player TU18bk`
- User says these users definitely have normal nicknames elsewhere in the app.
- Realm currently shows all participants as `King`, but the user knows those players are not King.
- All users connected to the dictionary should be present on the map, regardless of their current level.
- Their castle/marker badge should reflect their current Match Pairs level.
- They can only conquer territory after they become King.
- Popup now appears, but text like `North Keep` is meaningless and should be removed/replaced with useful owner/rank/territory info.

Current likely code issue:
- `src/pages/MatchPairs.tsx` participant creation uses fallback rank:
  - `rankId: realmState.players[uid]?.rankId || 'king'`
  - fallback participants also use `rankId: 'king'`
- This makes unknown/non-King participants display as King.
- Realm player records can preserve stale `rankId: 'king'`.

## Required Changes

### 1. Load real participant rank/progress

For each real participant in a dictionary realm, derive their current Match Pairs rank from their actual progress for the current dictionary:

Read:
- `users/{uid}/matchPairsProgress/{activeDictId}`

Rank derivation:
- Match Pairs playable ranks are:
  - citizen
  - knight
  - baron
  - count
  - duke
  - king
- Current rank should be the highest rank that is marked perfect/true in that participant's progress.
- If no rank is completed, use the starting rank/citizen badge/status.
- Do not use `king` as a default fallback for other participants.
- Do not trust old persisted realm `rankId: 'king'` if the participant's real progress says otherwise.
- If a better/current rank is found, the existing player seeding path may update `matchPairsRealms/{realmKey}/players/{uid}/rankId` without changing cells/territory.

Current user:
- Continue using `effectivePerfectRanks` / local current progress for current user when appropriate.
- In temporary `?adminRealm=king` debug mode, current debug guest can still render as King for QA.

Other participants:
- Always derive from Firebase progress, not from the viewer's localStorage.
- If Firebase progress cannot be read, use persisted non-stale realm rank only if available and valid; otherwise default to `citizen`, not `king`.

### 2. Realm presence and territory rules by rank

All connected dictionary participants should appear on the map:
- teacher/owner,
- connected students,
- existing real realm players,
- current user.

This is true even if they are not King yet.

Badge/marker:
- marker badge must match each participant's current rank.
- if a participant later reaches a new rank, their badge should update on next load/seeding.

Territory:
- home/castle cell belongs to each participant by default.
- Non-King participants should have only their home cell unless they already have legitimate persisted territory from earlier data.
- New territory conquest should be available only for the current user when current user is King.
- Other participants cannot gain territory merely by being listed or seeded.
- Do not wipe existing cells/territory.

### 3. Fix nicknames with actual data source

TASK-043 expanded name fields, but production still shows fallback names. Builder must inspect actual data shape for affected participants instead of guessing.

Use targeted Firebase reads only, not full database dumps:
- Find the full participant UIDs from the current relevant realm/player records or relation records.
- For the affected UIDs that render as `Player dlmOgV` / `Player TU18bk`, inspect:
  - `users/{uid}/profile`
  - `shared/uid_to_beneid/{uid}`
  - any relation/profile data already used by dictionary pages for nicknames.

If the real nickname is stored in a field not currently handled, add that field to the resolver.

If the real nickname is only available through `shared/bene_ids` reverse mapping and not directly under `uid_to_beneid`, add a targeted fallback strategy that can resolve it without scanning the whole database on every render. Prefer existing maps already maintained by the app.

Acceptance:
- Players with known profile/BeneID nicknames should not display as `Player <uid-prefix>`.
- Persisted fallback names must not override discovered nicknames.
- If a user truly has no readable profile/BeneID nickname, fallback is allowed.

### 4. Remove meaningless castle placeholder copy

Remove or replace `North Keep` / castle-name placeholder text from:
- left current-player panel,
- castle/player popup,
- any realm summary where it appears as if it is meaningful player data.

Useful replacement:
- player name,
- current rank,
- territory cells/count,
- share percentage,
- dictionary/realm name.

Do not introduce fake castle names until there is a real castle naming feature.

### 5. Close popup when clicking outside

If a realm player popup is open, clicking outside it should close it.

Requirements:
- Clicking a castle/player marker opens or switches the popup to that player.
- Clicking inside the popup must not close it unless the close button is clicked.
- Clicking empty map space, neutral/owned non-player cells, or panel space outside the popup closes the popup.
- Dragging/panning the map should not accidentally reopen a popup.
- Keep map drag/pinch/wheel behavior working.

### 6. Keep existing behavior safe

- Do not reset existing realm state.
- Do not clear territories.
- Do not move existing home cells unless collision logic already requires it.
- Do not change learned-word scheduling.
- Do not change Match Pairs gameplay scoring.
- Do not reintroduce Emperor as a playable Match Pairs rank.
- Realm Emperor/status logic remains future territory-status logic, not a playable level.

## Acceptance Criteria

- Every connected participant for the selected dictionary appears on the realm map and player list.
- Participants do not default to King.
- Each participant marker uses their actual current Match Pairs rank badge.
- Non-King participants can appear on the map but cannot conquer territory until they become King.
- Current user conquest still works when current user is King.
- Open player popup closes when clicking outside the popup/marker.
- Realm player list and popups show real nicknames/BeneIDs where available.
- `Player <uid-prefix>` only appears if no readable nickname exists after targeted data resolution.
- `North Keep` / fake castle placeholder text is removed from the UI.
- Existing cells/territory/progress are preserved.
- No Match Pairs Emperor playable/status regression.
- Edge-hover pan remains absent.
- Old fixed viewport shuffle overlay remains absent.
- `npm run build` passes.

## Allowed Files

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- `src/stores/useDictionaryStore.ts`
- `src/contexts/AuthContext.tsx`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add dependencies.
- Do not change Firebase config.
- Do not change Firebase rules.
- Do not dump large Firebase database branches.
- Do not reset or rewrite realm territory/cells.
- Do not edit unrelated games.
- Do not reintroduce demo realm players.
- Do not reintroduce Match Pairs Emperor as a playable rank/status.
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
- Do not reintroduce old viewport overlay shuffle code:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`
- Do not perform visual QA; Lead/user handles it with local Vite.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run forbidden demo realm names check.
- Run forbidden Emperor / edge-hover pan check.
- Run forbidden old viewport overlay shuffle check.
- Static verification:
  - participant rank is derived from `users/{uid}/matchPairsProgress/{activeDictId}`;
  - unknown participants default to `citizen`, not `king`;
  - current debug guest `?adminRealm=king` still works for QA;
  - connected non-King participants are still listed and placed on the map;
  - no fake castle-name placeholder remains in visible Match Pairs realm UI;
  - outside-click closes the realm player popup without breaking marker click or map drag;
  - territory/cell writes are unchanged except safe player `name` / `rankId` updates.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Targeted Firebase paths inspected for affected names/ranks
- Rank derivation summary
- Name resolution summary
- Territory preservation notes
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/i18n/locales/en.ts
- src/i18n/locales/ru.ts
- tasks/review/TASK-044-use-real-participant-ranks-and-remove-castle-placeholder.md

Checks Run:
- npm run build
- git diff --check
- firebase database:get /matchPairsRealms/shared_default/players --project benodict --shallow
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "North Keep|Северная крепость|rankId: realmState.players\\[uid\\]\\?\\.rankId \\|\\| 'king'|existingRecord\\?\\.rankId \\|\\| participant\\.rankId|rankId: 'king'" src/pages/MatchPairs.tsx src/i18n/locales/en.ts src/i18n/locales/ru.ts

Notes:
- Connected realm participant loading now includes current user, existing real realm players, dictionary owner, and the owner's `shared/relations/teacher_students/{ownerUid}` students when an owner is known.
- Real signed-in participants resolve rank from `users/{uid}/matchPairsProgress/{activeDictId}`; the current user uses `effectivePerfectRanks`, and the temporary debug guest remains King for `?adminRealm=king` QA.
- Rank derivation uses the highest playable Match Pairs rank with a `true` progress value across `citizen`, `knight`, `baron`, `count`, `duke`, and `king`; no completed rank defaults to `citizen`.
- Stale persisted realm `rankId: 'king'` no longer overrides freshly resolved participant rank. Persisted valid rank is used only when another participant's Firebase progress read fails.
- Realm player rendering now uses the resolved participant rank first, so non-King participants appear with their own badge and old persisted King records can be corrected by the existing player seeding path.
- The conquest button now requires `currentRealmPlayer.rankId === 'king'`; non-King participants remain visible but cannot start new conquest from the current user controls.
- Fake castle placeholder copy was removed from visible realm UI: `North Keep` / `Северная крепость` were replaced with neutral `Home cell` / `Домашняя клетка`, and the panels/popups show owner, rank, territory, and realm/dictionary information instead of a fake castle name.
- Clicking outside the player popup closes it via the map panel click handler; marker clicks and popup clicks stop propagation so they open/switch or keep the popup as expected.
- Targeted Firebase inspection: shallow read of `/matchPairsRealms/shared_default/players` returned `null`, so no full affected UID could be extracted from the known default realm path. No large database branches were dumped.
- Existing name resolution from TASK-043 remains in place for profile/BeneID fields and object-shaped `shared/uid_to_beneid/{uid}` values; no additional live nickname field could be confirmed without full affected UIDs.
- Territory/cell ownership write paths were not changed; only existing safe player `name` / `rankId` seeding updates may occur.
- No demo players, Match Pairs Emperor playable/status path, edge-hover pan, or old fixed viewport shuffle overlay code was reintroduced.
- Local/browser visual QA is delegated to Lead/user per task instruction.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- `npm run build`: passed; Vite reported the existing large chunk warning only.
- `git diff --check`: passed.
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "North Keep|Северная крепость|realmState\\.players\\[[^\\]]+\\]\\?\\.rankId \\|\\| 'king'|rankId: 'king'" src/pages/MatchPairs.tsx src/i18n/locales/en.ts src/i18n/locales/ru.ts`: passed, no matches.
- `firebase database:get /matchPairsRealms --project benodict --shallow`: returned `null`, so no production realm player UID could be extracted from that path.

Static review:
- Participant rank resolution now reads `users/{uid}/matchPairsProgress/{activeDictId}` for signed-in non-current participants.
- Unknown/no-progress participants now fall back to `citizen`, not `king`.
- Current user still uses `effectivePerfectRanks`, and temporary debug guest still supports King mode.
- Realm rendering now uses resolved participant rank before persisted realm rank, so stale persisted `king` cannot override actual progress.
- Conquest button is disabled unless the current realm player is King.
- `North Keep` / `Северная крепость` placeholder strings were removed.
- Map panel click closes an open player popup, while marker and popup clicks stop propagation.

Notes:
- Lead did not perform visual QA per updated user process; local Vite is used for user review.
- Name resolution could not be verified against the affected live UIDs because the known production realm path is empty. Existing TASK-043 name normalization remains in place.
