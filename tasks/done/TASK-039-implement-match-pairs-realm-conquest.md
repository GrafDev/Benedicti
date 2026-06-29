# TASK-039: Implement working Match Pairs realm conquest

## Owner

Builder

## Status

todo

## Context

The Match Pairs realm screen is currently mostly a UI/mock shell. The user completed the King level without errors, but the kingdom did not grow from the player's castle. This must now become a working first version of realm conquest.

User requirements:
- After a player has reached King, the realm is the main progression surface.
- The realm action button must say "Завоевать территорию" / "Conquer territory", not "Играть ранг Короля" / "Play King level".
- Completing the King Match Pairs level with `0` errors must expand the player's territory from their castle / existing territory.
- The left panel must show information about the current player.
- The right panel must show a player list and each player's territory percentage.
- Emperor is not a Match Pairs level. Do not reintroduce it as a playable rank. Emperor can only be future realm status logic after territory control is implemented later.

Important current behavior:
- `?adminRealm=king` gives temporary King access for QA.
- Existing rank progression persistence is skipped while `?adminRealm=king` is active.
- That skip makes realm QA impossible if conquest also depends on normal rank persistence.

## Required Changes

### Realm data model, first working version

Implement a minimal working realm conquest state for Match Pairs.

Use a stable per-dictionary realm key:
- Personal dictionary: include dictionary owner/user id and dictionary id.
- Teacher dictionary: use the teacher/owner id and dictionary id, so all students share the teacher dictionary realm.
- Shared/default dictionary: use a stable shared/default key.
- Do not mix territories from different dictionaries.

Persist real signed-in realm state in Firebase Realtime Database under a Match Pairs specific path, for example:
- `matchPairsRealms/{realmKey}/players/{uid}`
- `matchPairsRealms/{realmKey}/cells/{cellId}`

The exact path can differ if a better existing convention is available, but it must be documented in comments or task notes.

For temporary debug guest access with `?adminRealm=king`:
- Allow conquest to work locally so the realm can be tested without a real account.
- Use local state/localStorage only for guest/debug if there is no `currentUser`.
- Do not write fake guest conquest to Firebase.

### Player identity and list

Replace placeholder players with a first useful player model:
- The current signed-in user or temporary debug guest must appear as the current realm player.
- Player display name should use, in priority order:
  - Firebase display name,
  - profile displayName,
  - email prefix,
  - existing placeholder fallback.
- Player rank badge should reflect their current Match Pairs rank, with King for players who reached the realm.
- Right panel must list players with territory percentage.
- Players with no territory should show `0%`, not `-`.
- Left panel must show current player info:
  - player name,
  - current rank/status (King for now),
  - castle name or fallback,
  - conquered cells count,
  - territory percentage,
  - dictionary/realm name.

For this task, if there is no reliable way to load all students yet, show:
- current player,
- players already present in the realm Firebase state,
- and keep deterministic placeholder opponents only as non-current demo entries if needed for layout, but they must have `0%` and no fake conquered territory.

### Territory ownership

Realm cells must support ownership:
- `neutral`
- `owned by player`
- optional `contested/frontier` styling only if it is real, not fake mock data.

The current player must have a stable home/castle cell on the edge.

When the player completes the King level with `0` errors through the realm action:
1. Determine the current player's owned cells.
2. If the player owns no territory yet, capture one neutral cell adjacent to the player's castle/home cell.
3. If the player already owns territory, capture one neutral cell adjacent to any owned cell, preferring cells closest to the castle or deterministic order.
4. If no adjacent neutral cell exists, capture a neighboring enemy-owned cell adjacent to current owned territory.
5. Update Firebase/local debug state.
6. Return to the realm screen and visibly show the newly owned cell in the current player's color.
7. Update the left panel conquered count and percentage.
8. Update the right player list percentages.

Territory percentage:
- Calculate from owned territory cells divided by total realm cells.
- Be consistent across left panel and right list.
- Round to whole percents for display.

### Failed King conquest

When the player starts conquest from the realm and completes King level with errors:
- If the player has conquered territory, remove one owned territory cell, preferring the farthest cell from the castle or a deterministic edge of the territory.
- If the player has no conquered territory left, then normal King demotion may apply.
- Do not immediately demote a King who still has territory; first shrink territory.

Keep existing non-King rank demotion behavior unchanged.

### UI copy

Change realm action button:
- RU: `Завоевать территорию`
- EN: `Conquer territory`

Adjust placeholder copy:
- Remove "Данные завоевания подключим позже" / "Conquest data will connect later" from the live realm status area once real data is displayed.
- Keep text concise and in the current visual style.

### Geometry and layout

Preserve the current realm geometry and controls:
- Hex field remains round/spiral-ish.
- Castles stay on edge cells.
- Wheel zoom, pinch zoom, drag pan, and "Ваше королевство" centering remain.
- Do not reintroduce edge-hover pan.
- Do not reintroduce fake orange/mock territories.

New owned territories must be adjacent to the player's castle or existing owned territory.

### Completion flow

The app must know when a King game was started from the realm conquest button.

Do not make every random King replay from setup accidentally mutate realm territory unless the player is in the realm/conquest flow. If simpler and safe, the King action button in realm can set a `conquestMode` flag before calling `startLevel(kingRank)`.

After game completion:
- Save normal perfect rank progress as before where applicable.
- Apply conquest/shrink logic only for King + conquest flow.
- Return to setup/realm so the updated map is visible.

## Acceptance Criteria

- Realm button text is `Завоевать территорию` in Russian and `Conquer territory` in English.
- After starting from that button and finishing King with zero errors, the current player's territory increases by exactly one visible adjacent hex.
- The new cell is adjacent to the current player's castle or existing owned territory.
- Left panel shows current player info, conquered cell count, percentage, rank/status, and dictionary realm name.
- Right panel shows players and whole-number territory percentages; no fake `-` percentages for players.
- A player with no territory shows `0%`.
- `?adminRealm=king` guest/debug mode can test conquest locally without Firebase writes.
- Signed-in users persist conquest state to Firebase and reload it when returning to the realm.
- Teacher dictionary realms use the teacher dictionary identity, not the student's private dictionary identity.
- Completing King with errors shrinks territory before demoting King.
- Emperor does not reappear as a game level or mock realm status in this task.
- Edge-hover pan remains absent.
- Existing Match Pairs rank selection and non-King game behavior still works.
- No broad visual redesign.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add new dependencies.
- Do not change Firebase config.
- Do not edit unrelated games.
- Do not reintroduce Match Pairs Emperor as a playable level.
- Do not create fake nonzero territory for mock players.
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
- Run static checks that:
  - `realmPlayKing` copy is replaced/renamed or no longer says "Play King level" / "Играть ранг Короля".
  - no `id: 'emperor'`, `rankId: 'emperor'`, or `effectivePerfectRanks.emperor` Match Pairs realm/game usage exists in `src/pages/MatchPairs.tsx`.
  - territory ownership is not hardcoded fake orange/mock data.
- Static/manual logic notes:
  - Describe the Firebase/localStorage realm paths used.
  - Describe the capture algorithm and shrink algorithm.
  - Describe how `?adminRealm=king` debug conquest is stored locally.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Firebase/local storage paths used
- Capture/shrink algorithm summary
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/review/TASK-039-implement-match-pairs-realm-conquest.md

Checks Run:
- npm run build
- git diff --check
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|Move near the edge|Подведите курсор к краю" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css src/i18n/locales/ru.ts src/i18n/locales/en.ts
- rg -n "effectivePerfectRanks\\.emperor|rankId === 'emperor'|rankId: 'emperor'|id: 'emperor'|Play King level|Играть ранг Короля" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css src/i18n/locales/ru.ts src/i18n/locales/en.ts
- rg -n "fake orange|mock territory|realmHexFrontier|realmHexConquered|conquest data will connect later|Данные завоевания подключим позже" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css src/i18n/locales/ru.ts src/i18n/locales/en.ts

Notes:
- Added first-version Match Pairs realm conquest state using `matchPairsRealms/{realmKey}/players/{uid}` and `matchPairsRealms/{realmKey}/cells/{cellId}` in Firebase for signed-in users.
- Realm keys are dictionary-scoped: `shared_{dictId}` for default/shared dictionaries and `owner_{ownerUid}_dict_{dictId}` for personal/teacher-owned dictionaries, with teacher dictionaries using the teacher owner id.
- Debug guest `?adminRealm=king` conquest uses localStorage key `benedicti_match_pairs_realm_{realmKey}` and does not write guest state to Firebase.
- Realm conquest is gated by a `conquestMode` flag set only by the realm action button, so ordinary King replays do not mutate territory.
- Capture algorithm claims exactly one adjacent cell: neutral neighbors of owned territory first, neutral neighbors of the castle when no territory exists, then adjacent enemy-owned cells as fallback, with deterministic distance/id sorting.
- Shrink algorithm removes one current-player owned cell before King demotion, preferring the farthest cell from the castle with deterministic tie-breakers.
- Left panel now shows current player, rank, castle, territory count, territory percent, and dictionary realm name; right panel shows whole-number territory percentages including `0%`.
- Placeholder/demo opponents remain only as zero-territory entries/edge markers; no fake nonzero territory is created.
- Realm action copy is now RU `Завоевать территорию` / EN `Conquer territory`.
- Local browser/visual QA is delegated to Lead Review per task instruction.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- Reviewed `src/pages/MatchPairs.tsx`, `src/pages/MatchPairs.module.css`, and i18n diffs.
- `npm run build`: passed; existing Vite large chunk warning only.
- `git diff --check`: passed.
- Forbidden edge-hover-pan `rg` check: passed, no matches.
- Emperor/game-status `rg` check: passed, no matches.
- Local Vite opened `/play/match-pairs/default?adminRealm=king`.
- Local realm initial state: passed; button shows `ЗАВОЕВАТЬ ТЕРРИТОРИЮ`, current player shows `0 / 127`, current player leaderboard row shows `0%`, demo opponents show `0%`, no Emperor text.
- Local perfect conquest smoke: passed; after completing King with `0` errors from the realm button, current territory increased from `0 / 127` to `1 / 127`, and current leaderboard row changed to `1%`.
- Local failed conquest smoke: passed; after starting conquest again, making an intentional mismatch, then completing the level, current territory shrank from `1 / 127` back to `0 / 127`.
- Browser console check after local smoke: passed, no error/warning logs.

Notes:
- The automated local solver timed out before returning its own detailed log, but the browser state after each run confirmed the expected territory result.
- Signed-in Firebase persistence was reviewed statically; live Firebase write QA was not performed from Lead Review.
