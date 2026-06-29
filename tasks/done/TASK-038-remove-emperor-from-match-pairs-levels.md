# TASK-038: Remove Emperor from Match Pairs game levels and fix dictionary dropdown layering

## Owner

Builder

## Status

todo

## Context

Emperor should not be a playable Match Pairs level. In the new realm design, Emperor is a separate realm status earned when a King controls enough territory. It is not a rank/level inside the Match Pairs game progression.

User feedback:
- Remove `Император` / `Emperor` from Match Pairs levels.
- Last game level should be `King`.
- Emperor belongs to future realm/conquest status logic.

Current issue:
- `src/pages/MatchPairs.tsx` includes `emperor` in the `RANKS` list.
- Setup path/sidebar and rank cards show Emperor as level 7.
- Summary shows `availableRanks / RANKS.length`, causing `7/7`.
- Placeholder realm player data includes a player with `rankId: 'emperor'`, which makes Emperor look like an already reachable game rank/status.
- The dictionary dropdown opens under/behind rank cards in the Match Pairs setup screen.
- Dictionary dropdown items currently wrap like horizontal pills; user wants them shown top-to-bottom as a list.

## Required Changes

### Remove Emperor from Match Pairs levels

- Remove `emperor` from the Match Pairs playable `RANKS` array.
- Match Pairs progression should end at `king`.
- Setup sidebar/cards should show exactly 6 game levels:
  - Citizen
  - Knight
  - Baron
  - Count
  - Duke
  - King
- Available rank summary should use `6` as total because it derives from the Match Pairs playable levels.
- `?adminRealm=king` should still unlock through King and open the realm setup.
- Existing real progress data containing `emperor` should not break the UI; it can be ignored by Match Pairs level rendering.
- Keep realm `Emperor` text/icon/i18n available for future realm status, but do not show it as a playable Match Pairs level.
- Remove or change mock realm placeholder player with `rankId: 'emperor'` so no placeholder player appears as Emperor before real realm status exists.
- Do not change other games such as `NBack`; this task is Match Pairs only.
- Do not implement real conquest/Emperor status logic in this task.

### Fix dictionary dropdown

- Make the Match Pairs dictionary dropdown render above rank cards and setup content.
- Ensure it is not clipped or hidden behind cards.
- Increase/repair z-index and stacking context only as needed; do not create broad global z-index hacks.
- Display dictionary options vertically from top to bottom as a list.
- Avoid horizontal wrapping/pill-grid layout inside the dropdown.
- Keep dropdown usable on desktop and mobile.
- Keep existing dictionary switching behavior unchanged.

## Acceptance Criteria

- Match Pairs setup view no longer shows an Emperor level/card/sidebar item.
- Match Pairs rank count ends at `6/6` when all game ranks through King are available/perfect.
- King remains playable and remains the gateway to realm.
- Temporary `?adminRealm=king` still opens realm for a guest.
- No placeholder realm player is displayed as Emperor.
- Dictionary dropdown appears above cards/setup content, not underneath them.
- Dictionary options are listed vertically top-to-bottom.
- Dictionary switching still works.
- Existing i18n strings for `realmEmperor` and `ranks.emperor` may remain if used elsewhere or reserved for future status.
- NBack ranks are unchanged.
- No Firebase schema/persistence changes.
- No dependencies added.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not remove Emperor from other games such as `NBack`.
- Do not remove realm Emperor i18n/status strings unless they become truly unused and TypeScript requires it.
- Do not implement conquest/Emperor territory status logic.
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
  - `src/pages/MatchPairs.tsx` playable `RANKS` no longer contains `id: 'emperor'`,
  - setup rendering is derived from the 6-level `RANKS`,
  - mock realm players do not use `rankId: 'emperor'`,
  - `src/pages/NBack.tsx` is unchanged by this task,
  - dropdown CSS stacks above setup cards and uses vertical list layout.
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
- tasks/review/TASK-038-remove-emperor-from-match-pairs-levels.md

Checks Run:
- npm run build
- git diff --check
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- git diff -- src/pages/NBack.tsx
- rg static checks for Match Pairs playable Emperor entries and mock realm Emperor player

Notes:
- Removed Emperor from the Match Pairs playable `RANKS` array, so setup cards/sidebar/summary now derive from six playable levels ending at King.
- Changed the mock realm placeholder player that used `rankId: 'emperor'` to a non-Emperor rank; realm Emperor i18n/status references remain available for future realm logic.
- Preserved NBack Emperor rank; `git diff -- src/pages/NBack.tsx` is empty.
- Updated Match Pairs dictionary dropdown to stack above setup content and render options as a vertical list with full-width rows.
- Temporary `?adminRealm=king` behavior remains based on ranks through King.
- Local visual QA is delegated to Lead Review.

## Lead Review - returned

Status: changes requested

Issue:
- `src/pages/MatchPairs.tsx` still derives realm Emperor display from old Match Pairs progress via `effectivePerfectRanks.emperor === true` (`isEmperor`). This means users with stale/old persisted game progress can still see `Император` / `Emperor` on the realm screen, even though Emperor is no longer a Match Pairs game level and must only come from future realm territory status logic.

Required fix:
- Remove the Match Pairs progress based Emperor display path from the realm UI.
- Do not use `effectivePerfectRanks.emperor` to decide realm status.
- Until real conquest status exists, realm status should stay King / placeholder, even if old data contains `emperor`.
- Remove `selectedRealmPlayer.rankId === 'emperor'` branching from the popup unless it is truly driven by real realm status data. Placeholder/mock realm players must not need Emperor handling.
- Keep i18n strings available if desired for future realm status, but do not display Emperor from game rank progress.

Checks after fix:
- `rg -n "effectivePerfectRanks\\.emperor|rankId === 'emperor'|rankId: 'emperor'|id: 'emperor'" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` should return no Match Pairs game/status usage.
- `npm run build`
- `git diff --check`

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-038-remove-emperor-from-match-pairs-levels.md

Checks Run:
- npm run build
- git diff --check
- rg -n "effectivePerfectRanks\\.emperor|rankId === 'emperor'|rankId: 'emperor'|id: 'emperor'" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Removed the remaining Match Pairs progress-based Emperor display path by no longer reading `effectivePerfectRanks.emperor` for realm status.
- Realm placeholder/status now stays King until real conquest status exists, even if old persisted Match Pairs data contains `emperor`.
- Popup copy no longer branches on `rankId === 'emperor'`.
- NBack and future realm Emperor i18n/status strings were not touched.
- Local visual QA is delegated to Lead Review.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- Reviewed `src/pages/MatchPairs.tsx` and `src/pages/MatchPairs.module.css` diff.
- `npm run build`: passed; existing Vite large chunk warning only.
- `git diff --check`: passed.
- `rg -n "effectivePerfectRanks\\.emperor|rankId === 'emperor'|rankId: 'emperor'|id: 'emperor'" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Forbidden edge-hover-pan `rg` check: passed, no matches.
- `git diff -- src/pages/NBack.tsx`: passed, empty diff.
- Local Vite opened at `/play/match-pairs/default?adminRealm=king`: passed; Match Pairs summary shows `6/6`, realm status stays `Король`, and `Император` / `Emperor` is absent from visible text.
- Local dictionary dropdown check on realm toolbar: passed; dropdown opens above content and no Emperor text appears.

Notes:
- The current local browser state has King progress, so the setup card grid redirects to realm; setup-card dropdown layering was verified by code/CSS review rather than a clean-profile visual pass.
- Accepted because the task scope is satisfied and the remaining limitation is only local test-state related.
