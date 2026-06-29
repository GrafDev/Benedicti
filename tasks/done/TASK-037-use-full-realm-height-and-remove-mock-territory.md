# TASK-037: Use full realm viewport height and remove mock conquered territory

## Owner

Builder

## Status

todo

## Context

The realm screen is now much better, but two product issues remain:

1. The screen still leaves unused vertical space at the bottom. The current CSS still subtracts `4.5rem` from viewport height (`calc(100dvh - 4.5rem)`), even though this Match Pairs/realm screen does not need that reserved external header space. The realm screen should use the full device viewport height and place its content inside that space with flex.

2. The realm currently shows teal/orange placeholder territory cells and placeholder percentages (`28%`, `54%`) even though real conquest has just been introduced and no player should already have territory. The orange cells are mock frontier cells from prior UI scaffolding. This is misleading.

## Required Changes

### Full viewport height

- For desktop Match Pairs realm mode, use the full visible device height (`100dvh`) instead of subtracting `4.5rem`.
- Header toolbar, stat summary, and realm layout should all fit inside the full viewport.
- The realm layout should consume all remaining height after toolbar/stats.
- Do not create document/page vertical scrolling on desktop realm mode.
- Preserve mobile fallback behavior if small screens need scrolling.
- Keep sound button visible and not overlapping critical content.

### Remove mock conquered territory

- Remove placeholder conquered/frontier territory from the realm map until real conquest state exists.
- The realm should start as neutral cells with player/castle markers only.
- Remove or neutralize mock `territoryPercent` values from placeholder players.
- Right status leaderboard should not show fake `28%` / `54%` ownership.
- Player popup should not claim territory percent for mock players.
- It is acceptable to show `-`, `No territory claimed yet`, or equivalent existing neutral copy.
- Do not implement real conquest/persistence in this task.
- Keep city/player markers on edge hexes.
- Keep the current player's city marker and `Your kingdom` centering behavior.

## Acceptance Criteria

- Desktop realm screen uses the full viewport height without a reserved bottom strip caused by `calc(100dvh - 4.5rem)`.
- Realm content remains fully visible inside the viewport.
- No document/page vertical scroll is introduced in desktop realm mode.
- Map cells are neutral by default; no teal claimed territory and no orange frontier territory appear from mock data.
- Placeholder leaderboard no longer shows fake ownership percentages.
- Player/castle badges remain visible on the map edge cells.
- `Your kingdom` button remains visible and works.
- Drag pan, wheel zoom, and pinch zoom remain wired.
- Temporary `?adminRealm=king` still opens the realm as a guest.
- No Firebase/conquest persistence is added.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- i18n files only if visible text must change
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not implement real backend realm state.
- Do not change learned-word progression.
- Do not reintroduce edge hover pan:
  - `REALM_EDGE_PAN`
  - `realmEdgeVelocityRef`
  - `realmAnimationFrameRef`
  - `runRealmEdgePan`
  - `startRealmEdgePan`
  - `stopRealmEdgePan`
  - `handleRealmMouseMove`
  - `onMouseMove`
  - `onMouseLeave`

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check for forbidden edge hover pan names listed above.
- Static verification:
  - realm desktop container no longer reserves `4.5rem` of unused height,
  - placeholder players no longer include fake territory percentages,
  - mock territory generation no longer marks neutral cells as claimed/frontier.
- Local visual QA is owned by Lead Review, not Builder.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-037-use-full-realm-height-and-remove-mock-territory.md

Checks Run:
- npm run build
- git diff --check
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- Static verification for realm height override and removal of mock territory/percent ownership paths

Notes:
- Updated `.realmContainer` to use `height: 100dvh` on desktop and removed the `4.5rem` reserved strip from the realm-specific container; mobile realm fallback now uses `min-height: 100dvh`.
- Removed placeholder territory generation, owner/frontier bookkeeping, claimed/frontier hex styles, and fake territory percentages from placeholder players.
- Realm cells now remain neutral by default while player/castle markers still render on edge cells.
- Leaderboard, player popup, and castle summary no longer display fake ownership percentages or claimed cell counts.
- `Your kingdom` now centers/fits the current player's city marker until real territory exists.
- Drag pan, wheel zoom, pinch zoom, and temporary `?adminRealm=king` behavior were preserved.
- No Firebase/conquest persistence was added; local visual QA is delegated to Lead Review.

## Lead Review

Status: accepted

Review Notes:
- Desktop realm container now uses full viewport height (`100dvh`) instead of reserving `4.5rem`.
- Mock conquered/frontier territory generation is removed; cells remain neutral until real conquest state exists.
- Placeholder players no longer carry fake `territoryPercent` values or nonzero territory scores.
- Leaderboard, popup, and castle summary no longer show fake ownership percentages.
- Player/castle markers remain on the map.
- `Your kingdom`, drag pan, wheel zoom, pinch zoom, and temporary `?adminRealm=king` behavior are preserved.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|territoryPercent|realmHexClaimed|realmHexFrontier|ownerId|frontierCellIds|ownerByCellId" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local Vite check at `1280x720` on `/play/match-pairs/default?adminRealm=king`: page scroll was absent (`docH=720`, `innerH=720`), realm container height was `720`, realm shell/map bottom was inside viewport at `y=700`, no percentage text was present, no claimed/frontier classes were present, `127` hexes and `6` player markers rendered.
