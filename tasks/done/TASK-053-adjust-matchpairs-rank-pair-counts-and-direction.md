# TASK-053: Adjust Match Pairs rank pair counts and word direction

Status: todo
Owner: Builder
Lead: Codex

## Problem

Match Pairs rank levels need updated pair counts and alternating word/translation direction for some ranks.

## Requirements

Update Match Pairs rank configuration:

1. Citizen / `citizen`
   - 4 pairs.
   - Left side: original word.
   - Right side: translation.

2. Knight / `knight`
   - 4 pairs.
   - Direction swapped.
   - Left side: translation.
   - Right side: original word.

3. Baron / `baron`
   - 5 pairs.
   - Left side: original word.
   - Right side: translation.

4. Count / `count`
   - Direction swapped.
   - Left side: translation.
   - Right side: original word.
   - Pair count should follow the existing intended progression unless already specified elsewhere; prefer 5 pairs if the current rank progression expects it, otherwise keep existing count if there is a clear local pattern.

5. Duke / `duke`
   - 6 pairs.
   - Left side: original word.
   - Right side: translation.

6. King / `king`
   - 7 pairs.
   - Left side: original word.
   - Right side: translation unless existing design clearly expects a final swapped challenge.

No playable Emperor level.

## Implementation Notes

- Prefer adding explicit rank config fields if needed, for example `pairCount` and `isDirectionSwapped`.
- Ensure setup cards/sidebar labels show correct pair counts.
- Ensure gameplay session generation uses the configured pair count.
- Ensure swapped ranks display/select/check pairs correctly:
  - The underlying matching should still compare original/translation pairs.
  - Only displayed column direction changes.
- Ensure rank unlock/progress/demotion logic still uses rank ids and is not broken by pair count/direction changes.

## Verification

Run:

- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm no non-current reads.
- Existing forbidden checks for demo names, playable Emperor, edge-hover pan, fixed answer shuffle overlay.

Static verification to report:

- Final pair count per rank.
- Which ranks are swapped.
- Where gameplay uses the new config.

## Out of Scope

- No Firebase rules/config changes.
- No realm canonical placement changes.
- No tablet layout changes.
- No visual/browser QA by Builder; Lead/user will check.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-053-adjust-matchpairs-rank-pair-counts-and-direction.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress" src/pages/MatchPairs.tsx`
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Final Match Pairs rank counts are: Citizen 4, Knight 4, Baron 5, Count 5, Duke 6, King 7.
- Swapped ranks are Knight and Count: left column uses translation, right column uses original word.
- Added optional `isDirectionSwapped` rank config and `createMatchColumnItems(...)` so initial batch generation and replacement-word generation use the same direction rules.
- Matching still compares shared word ids, so rank progression, perfect-rank persistence, demotion, and realm conquest logic remain rank-id based and unchanged.
- Elite mode now hides/speaks the actual original item even when the original appears in the right column for swapped ranks.
- Setup card/sidebar labels continue to use each rank description/count from the rank config.
- `npm run build` passed with the existing Vite large chunk warning.
- The broader task rg for `matchPairsProgress/${activeDictId}` reports existing current-user progress paths; the narrower non-current `users/${uid}/matchPairsProgress` check has no matches.
- Demo realm names, playable Emperor path, edge-hover pan, old fixed viewport answer shuffle overlay names, and `position: fixed` were not reintroduced.
- No Firebase rules/config changes, realm canonical placement changes, tablet layout changes, visual QA, or browser QA were performed.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- Static review of `RANKS`, `createMatchColumnItems`, initial batch generation, replacement generation, `handleChoice`, and render paths in `src/pages/MatchPairs.tsx`: accepted.

Accepted Notes:
- Final pair counts are Citizen 4, Knight 4, Baron 5, Count 5, Duke 6, King 7.
- Knight and Count use swapped direction: left column translation, right column original word.
- Matching remains based on shared word ids.
- Elite mode hides/speaks the original item even when original appears in the right column.
