# TASK-048: Fix Match Pairs dictionary dropdown clipping above realm map

Status: todo
Owner: Builder
Lead: Codex

## Problem

On the Match Pairs realm screen, the dictionary dropdown opens behind or under the realm/map content. The menu is clipped/hidden by the field area.

User screenshot shows:

- The dictionary selector is in the top toolbar.
- The dropdown opens downward.
- Lower dropdown rows are hidden behind the realm panel/map area.

Likely cause:

- The realm screen uses `overflow: hidden` / constrained stacking contexts on containers such as `realmContainer`, `setupContainer`, or `realmShell`.
- `.dictOptions` is absolutely positioned inside that tree, so `z-index` alone is not enough if an ancestor clips it.

## Requirements

1. Make the dictionary dropdown render above all realm/map panels.
   - It must not be clipped by the realm field, stats row, side panels, map viewport, or setup containers.
   - It must remain visually anchored to the dictionary selector.

2. Prefer a robust implementation:
   - Either render the dropdown in a top-level overlay/portal layer for Match Pairs,
   - or restructure the toolbar/dropdown stacking so no ancestor clips it.
   - Do not rely only on increasing `z-index` if an ancestor still has clipping overflow.

3. Preserve current dropdown behavior:
   - Opens/closes as before.
   - Selecting a dictionary still works.
   - Click/outside behavior remains sensible.
   - Keyboard/accessibility behavior should not regress if currently present.

4. Preserve layout behavior:
   - Realm screen must still fit viewport height.
   - Realm map remains clipped/pannable inside its own viewport.
   - No page scroll regression.
   - No changes to realm conquest/rank/name mechanics.

5. Keep existing forbidden regressions absent:
   - Do not reintroduce playable Match Pairs Emperor level.
   - Do not reintroduce edge-hover pan.
   - Do not reintroduce old fixed viewport answer shuffle overlay names.
   - Do not reintroduce non-current participant `matchPairsProgress` reads.

## Verification

Run:

- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm no matches.
- Existing forbidden checks for:
  - demo realm names
  - playable Match Pairs Emperor
  - edge-hover pan
  - old fixed viewport shuffle overlay

Static verification to report:

- Which clipping/stacking issue was fixed.
- Why the dropdown can no longer be clipped by the realm/map panel.
- Which files changed.

## Out of Scope

- No Firebase rules/config changes.
- No database migration.
- No visual/browser QA by Builder; Lead/user will check the deployed UI.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-048-fix-matchpairs-dictionary-dropdown-clipping.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Dictionary options now render through a React portal into `document.body`, outside the realm/setup clipping ancestors.
- The dropdown remains anchored to the selector by measuring the selector rect and applying body-level absolute coordinates with scroll offsets.
- Position is recalculated when opened and on window resize/scroll.
- The portal uses absolute positioning, not fixed positioning, so the old fixed overlay pattern is not reintroduced.
- Existing dictionary selection behavior is preserved; the same option buttons call `handleDictionaryChange`.
- Realm viewport clipping/panning remains in its own map layer and was not changed.
- No realm/rank/conquest/name mechanics, Firebase config/rules, database writes, Emperor path, edge-hover pan, non-current progress reads, or old fixed viewport shuffle overlay names were changed/reintroduced.
- Local/browser visual QA is delegated to Lead/user per task instruction.
- Process note: this task file did not include an explicit `Allowed Files` section; implementation was kept to the task-described Match Pairs files plus task report.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- `rg -n "createPortal|dictOptionsPortal|dictOptions|dictionaryMenu|dropdown|position: fixed|answerShuffleOverlay|users/\\$\\{uid\\}/matchPairsProgress" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed; portal is used and forbidden old paths were not reintroduced.
- Static diff review of `src/pages/MatchPairs.tsx` and `src/pages/MatchPairs.module.css`: accepted.

Accepted Notes:
- Dictionary options now render through a React portal into `document.body`, outside clipped realm/setup ancestors.
- Dropdown position is measured from the selector and recalculated on open, resize, and scroll.
- Realm map clipping/panning and realm/rank/conquest mechanics were not changed.
