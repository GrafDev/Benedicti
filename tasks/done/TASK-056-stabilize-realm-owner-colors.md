# Task: Stabilize and enrich Match Pairs realm owner colors

## ID

TASK-056

## Role

builder-code

## Goal

Make each realm owner always render with one stable territory color across all users' screens, and replace the current low-contrast palette with darker but more distinguishable red/green/blue-style territory shades that still fit the gloomy medieval game style.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/todo/TASK-056-stabilize-realm-owner-colors.md
- tasks/review/TASK-056-stabilize-realm-owner-colors.md
- tasks/done/TASK-056-stabilize-realm-owner-colors.md

## Forbidden Files

- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- A given `ownerId` has the same territory color on every client, including the current user's own client and other players' clients.
- Do not use a separate special territory color just because `ownerId === currentRealmPlayer.id`; current player may still have a subtle marker/outline if needed, but the territory fill must come from the same owner palette as everyone else.
- Replace the current muted gray/brown/teal-heavy palette with more distinguishable dark saturated families: red, green, blue, violet, amber/bronze, and optionally steel/cyan. Keep them dark, moody, and game-style; avoid neon, flat primary colors, and bright acid green.
- Adjacent territories owned by different players should be visually distinguishable.
- Neutral cells remain clearly neutral and darker/desaturated compared with owned cells.
- Castle/home cells still read as special but inherit or harmonize with the owner color.
- The players list, popup, territory counts, live-sync behavior from TASK-055, and capture animation from TASK-049 remain unchanged in mechanics.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User feedback: "colors of other players and ours should be in the style of the game; red, green, blue shades; more saturated but not bright; gloomy, but colors should differ."
- Root cause to address: current-player territories use a separate `.realmHexOwnedCurrent` color while other users use the deterministic owner palette, so the same player can appear as different colors depending on who is viewing.
- Prefer owner-driven CSS custom properties for both current and other owned cells. If keeping separate current styling, restrict it to outline/glow/marker, not fill hue.
- Preserve all realm mechanics and persistence from TASK-039 through TASK-055.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-056-stabilize-realm-owner-colors.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Territory fill color is now derived from `ownerId` for every owned cell, including the current player's own cells.
- `getRealmOwnerPalette(cell.ownerId)` is applied whenever `cell.ownerId` exists; it no longer skips `currentRealmPlayer.id`.
- `.realmHexOwned` now owns the owner-driven fill using CSS custom properties, so all clients render the same owner with the same fill hue.
- `.realmHexOwnedCurrent` no longer sets a separate fill/background hue; it only adds a subtle current-player outline/glow.
- Replaced the previous muted brown/teal-heavy palette with darker distinguishable red, green, blue, violet, amber/bronze, and steel/cyan families.
- Neutral cells remain dark/desaturated, and castle/home cells continue to harmonize through border/glow without changing owner fill.
- `npm run build` passed with the existing Vite large chunk warning.
- The progress rg reports existing current-user `users/${currentUser.uid}/matchPairsProgress/...` paths only; no non-current `users/${uid}/matchPairsProgress` read was added.
- Forbidden regression rg check returned no matches.
- No realm mechanics, live-sync, persistence, rank logic, player identity, popup behavior, zoom/pan, tablet behavior, word selection, or gameplay mechanics were changed.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-056-stabilize-realm-owner-colors.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Forbidden regression `rg` check: passed with no matches.

Acceptance Notes:
- Territory fill color is now derived from `ownerId` for all owned cells, including the current player's own cells.
- `.realmHexOwned` owns the shared owner-driven fill via CSS variables.
- `.realmHexOwnedCurrent` no longer changes fill hue and only adds current-player emphasis.
- The palette is now darker and more distinguishable across red, green, blue, violet, amber/bronze, and steel/cyan families.
- Realm mechanics, persistence, live-sync, ranks, identity, popup behavior, zoom/pan, tablet behavior, word selection, and gameplay mechanics were preserved.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
