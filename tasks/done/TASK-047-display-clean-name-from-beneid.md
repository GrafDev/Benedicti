# TASK-047: Display clean public names from BeneID values

Status: todo
Owner: Builder
Lead: Codex

## Problem

The Match Pairs realm now correctly falls back to `shared/uid_to_beneid`, but the rendered labels include technical parts:

- `Bene_lavomerka_2471`
- `Bene_Timur_Iakovlev_2435`

The user-facing realm UI should show only the central human-readable part and hide the technical prefix/suffix.

## Requirements

1. Add a helper to convert BeneID-like values into display names:
   - `Bene_lavomerka_2471` -> `lavomerka`
   - `Bene_Timur_Iakovlev_2435` -> `Timur Iakovlev`
   - `Bene_Gregory_2362` -> `Gregory`
   - Keep non-BeneID values unchanged after normal display-name normalization.

2. Apply this helper only where BeneID is used as a display-name fallback:
   - Match Pairs realm participant names.
   - Any local helper that normalizes `shared/uid_to_beneid` for UI display if used by Match Pairs.

3. Do not mutate stored BeneID values.
   - This is display-only.
   - Do not write cleaned names back to `shared/uid_to_beneid`.

4. Preserve existing priority:
   - `sovereignName` still wins over `displayName`.
   - Profile aliases still win over BeneID fallback.
   - Cleaned BeneID wins over trusted persisted fallback name.

5. Keep existing realm/rank behavior:
   - Do not reintroduce non-current `matchPairsProgress` reads.
   - Do not change conquest/cell logic.
   - Do not change current-user trusted self-publish behavior.
   - Do not reintroduce Emperor playable level, edge-hover pan, or old answer shuffle overlay code.

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

- BeneID display examples above are cleaned correctly by the helper.
- Stored BeneID values are not mutated.
- Name priority remains unchanged.

## Out of Scope

- No Firebase rules/config changes.
- No database migration.
- No local/browser visual QA by Builder; Lead/user will check the deployed UI.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-047-display-clean-name-from-beneid.md

Checks Run:
- npm run build
- git diff --check
- node -e "const clean=v=>{const n=v.trim();const m=n.match(/^Bene_(.+)_\\d+$/);return m?(m[1].replace(/_/g,' ').trim()||n):n}; console.log([clean('Bene_lavomerka_2471'),clean('Bene_Timur_Iakovlev_2435'),clean('Bene_Gregory_2362'),clean('Not_Bene_Value')].join('\\n'))"
- rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Added `cleanBeneIdDisplayName` for display-only BeneID cleanup.
- `Bene_lavomerka_2471` displays as `lavomerka`, `Bene_Timur_Iakovlev_2435` displays as `Timur Iakovlev`, and `Bene_Gregory_2362` displays as `Gregory`.
- Non-BeneID values remain unchanged after trimming.
- The cleaner is applied only when profile `beneId` or `shared/uid_to_beneid/{uid}` is used as a Match Pairs realm display-name fallback.
- Stored BeneID values are not mutated or written back.
- Name priority remains unchanged: `sovereignName`, `displayName`, and aliases still win before cleaned BeneID fallback, and cleaned BeneID still wins before trusted persisted fallback name.
- No realm/rank mechanics, conquest/cell logic, current-user self-publish behavior, Firebase rules/config, database migration, Emperor path, edge-hover pan, or old fixed viewport shuffle overlay behavior was changed.
- Local/browser visual QA is delegated to Lead/user per task instruction.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- `rg -n "cleanBeneIdDisplayName|uid_to_beneid|matchPairsProgress|resolveRealmDisplayName" src/pages/MatchPairs.tsx`: passed; only current-user `matchPairsProgress` paths remain.
- Static diff review of `src/pages/MatchPairs.tsx`: accepted.

Accepted Notes:
- BeneID fallback values are cleaned for display only.
- `sovereignName`, `displayName`, and profile aliases still win before cleaned BeneID.
- Stored BeneID values are not mutated.
