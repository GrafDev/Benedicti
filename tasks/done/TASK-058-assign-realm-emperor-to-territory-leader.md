# Task: Assign realm Emperor status to the territory leader

## ID

TASK-058

## Role

builder-code

## Goal

Make Emperor a realm status, not a playable Match Pairs rank: the player who owns more territory cells than every other player in the same realm becomes the Emperor.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-058-assign-realm-emperor-to-territory-leader.md
- tasks/review/TASK-058-assign-realm-emperor-to-territory-leader.md
- tasks/done/TASK-058-assign-realm-emperor-to-territory-leader.md

## Forbidden Files

- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- Emperor is computed from realm territory ownership only.
- A player is Emperor when their `territoryCells` count is strictly greater than every other player's count in the current realm.
- If multiple players are tied for the highest territory count, no one is Emperor; they remain shown by their actual playable rank/status.
- Emperor must not be added back as a playable Match Pairs level/rank card.
- A non-King player should not become Emperor just from owning only their castle/home cell. The intended Emperor status is for realm conquest. Require meaningful conquered territory beyond home/castle ownership before showing Emperor status.
- The right-side realm status card should show Emperor when there is a unique Emperor, otherwise King/realm status as now.
- The players list should clearly indicate which player is Emperor when one exists.
- The left player info panel and castle popup should show Emperor status for the Emperor while preserving the player's actual playable rank for game gating if needed.
- The "Conquer territory" button remains gated by playable King rank, not by Emperor status.
- Realm persistence shape does not need to store Emperor status; it can be derived live from `realmPlayers` / `realmState.cells`.
- Existing live-sync from TASK-055, owner colors from TASK-056, and castle-cell protection from TASK-057 must be preserved.
- No edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx` and confirm no playable Emperor/rank logic is reintroduced.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User requirement: "Императором становится тот, у кого территорий больше, чем у любого другого игрока."
- Emperor is a political/realm status, not the seventh playable rank. Match Pairs playable ranks still end at King.
- Castle/home cells count as owned cells in existing territory numbers, but Emperor should require conquest beyond just having the initial castle. A simple acceptable rule is: unique leader and `territoryCells > 1`.
- Preserve all realm mechanics and persistence from TASK-039 through TASK-057.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-058-assign-realm-emperor-to-territory-leader.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Added derived `realmEmperorPlayerId` from live `realmPlayers` territory counts.
- Emperor status is assigned only when one player has a strictly higher `territoryCells` count than every other player and that count is greater than `1`.
- Tied top counts produce no Emperor; players continue to display their playable rank/status.
- Added `getRealmDisplayStatus(...)` for realm-only status display without changing `rankId`.
- The left player panel, castle popup, right status badge, and players list now display Emperor when the derived Emperor exists.
- The "Conquer territory" button remains gated by playable `currentRealmPlayer?.rankId === 'king'`.
- No playable Emperor rank card, `rankId: 'emperor'`, `id: 'emperor'`, or `effectivePerfectRanks.emperor` logic was added.
- `npm run build` passed with the existing Vite large chunk warning.
- The progress rg reports existing current-user `users/${currentUser.uid}/matchPairsProgress/...` paths only; no non-current `users/${uid}/matchPairsProgress` read was added.
- Edge-hover pan and old fixed viewport answer shuffle overlay checks returned no matches.
- No realm persistence shape, live-sync, rank logic for gameplay, player identity, popup mechanics, zoom/pan, tablet behavior, owner colors, castle-cell protection, word selection, or gameplay mechanics were changed.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-058-assign-realm-emperor-to-territory-leader.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`: passed with no matches.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Edge-hover pan / old fixed overlay `rg` check: passed with no matches.

Acceptance Notes:
- Emperor is derived from live realm territory counts only.
- The leader must be unique and own more than one cell.
- Ties produce no Emperor.
- `rankId` remains the playable rank and was not changed to `emperor`.
- Conquer territory remains gated by playable King rank.
- Realm persistence, live-sync, owner colors, and castle-cell protection were preserved.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
