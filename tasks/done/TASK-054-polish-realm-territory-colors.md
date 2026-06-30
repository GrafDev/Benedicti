# Task: Polish Match Pairs realm territory colors

## ID

TASK-054

## Role

builder-code

## Goal

Update the Match Pairs realm map territory colors so owned and rival hexes feel consistent with the game's medieval navy/gold visual style, remain readable against neutral hexes, and avoid the current gray-on-gray and alien bright green look.

## Allowed Files

- src/pages/MatchPairs.module.css
- src/pages/MatchPairs.tsx
- tasks/todo/TASK-054-polish-realm-territory-colors.md
- tasks/review/TASK-054-polish-realm-territory-colors.md
- tasks/done/TASK-054-polish-realm-territory-colors.md

## Forbidden Files

- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- Current player's owned hexes use a game-style noble color treatment, not the current bright teal/green.
- Other players' owned hexes use distinct, muted heraldic colors that fit the same visual language: examples include aged gold, wine red, royal blue, muted violet, deep bronze, and desaturated emerald. Avoid flat gray-on-gray and avoid neon/acid colors.
- Neutral cells remain clearly neutral and darker than owned cells.
- Castle/home cells still read as special, but the color should be integrated with the owner's territory style.
- The right-side players list and selected player/castle panel continue to show territory percentages correctly; do not change realm math or persistence.
- The capture animation from TASK-049 still works and reveals the final owner color without a harsh flash.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User feedback: "colors of other players should be in the style of the game; our colors too. Now it is gray on gray and the green is alien to the style."
- Preserve all realm mechanics from TASK-039 through TASK-053: persistence, canonical participant order, canonical home cells, player names, ranks, popup behavior, capture/shrink logic, zoom/pan, and tablet orientation behavior.
- Prefer CSS custom properties or small deterministic TSX class/style mapping if needed. Keep the change visual and narrowly scoped.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-054-polish-realm-territory-colors.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Replaced the bright teal/green current-player territory treatment with a warmer noble gold over navy/violet treatment.
- Added a deterministic muted heraldic palette for rival owners using CSS custom properties on owned hexes: aged gold, wine red, royal blue, muted violet, deep bronze, and desaturated emerald.
- Neutral hexes remain darker and less saturated than owned cells.
- Castle/home hexes keep a special gold border/glow, integrated with the owner territory treatment.
- The capture reveal was adjusted to a softer warm gold glow so it reveals the final owner color without the previous teal flash.
- The palette mapping is visual-only and based on existing `ownerId`; it does not change realm state, persistence, conquest math, player identity, popup behavior, zoom/pan, tablet layout, word selection, or gameplay mechanics.
- `npm run build` passed with the existing Vite large chunk warning.
- Forbidden regression rg check returned no matches.
- No visual/browser QA was performed; Lead/user will check visuals locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-054-polish-realm-territory-colors.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- Forbidden regression `rg` check: passed with no matches.

Acceptance Notes:
- The implementation is scoped to realm territory visuals.
- Current-player hexes no longer use the bright teal/green treatment.
- Rival hexes receive deterministic muted heraldic CSS variable colors based on `ownerId`.
- Neutral cells remain darker.
- Capture reveal color was softened to warm gold.
- No realm persistence, conquest math, rank, identity, popup, zoom/pan, tablet layout, word selection, or gameplay mechanics were changed.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
