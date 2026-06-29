# TASK-036: Add temporary guest King URL flag for realm testing

## Owner

Builder

## Status

todo

## Context

We need a temporary admin/development mode that lets a guest open Match Pairs realm as if they already reached King. This is needed for fast visual/product testing of the realm screen without logging in or manually completing ranks.

User requirement:
- Launch with additional URL parameters.
- Guest immediately has King level.
- This is temporary and will be removed later.

## Required Changes

- Add a temporary URL flag for Match Pairs realm testing.
- Suggested flag:
  - `?adminRealm=king`
  - optionally also support `?debugKing=1` only if it is simpler, but keep one documented canonical flag.
- When the flag is present on `/play/match-pairs/:dictId`, guests and logged-in users should see Match Pairs setup as if ranks through `king` are perfect.
- This must unlock/render the King+ realm setup immediately.
- It should not require Firebase auth.
- It should not write anything to Firebase.
- It should not write permanent localStorage progress.
- It should be an in-memory/session render override only.
- Existing real progress should still work normally when the flag is absent.
- If the flag is removed from the URL and the page reloads, the override should disappear.
- Keep gameplay, learned-word logic, demotion, dictionary filtering, and realm mock data unchanged.
- Add a small code comment marking this as a temporary debug/admin shortcut to remove later.

## Acceptance Criteria

- Opening `/play/match-pairs/default?adminRealm=king` as a guest shows the King+ realm screen.
- The default route `/play/match-pairs/default` remains unchanged.
- The flag does not persist progress to Firebase.
- The flag does not persist progress to localStorage.
- Logged-in users still load real progress normally when the flag is absent.
- Existing admin role UI remains unchanged.
- No dependencies are added.

## Files Likely To Change

- `src/pages/MatchPairs.tsx`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not implement real admin panel controls in this task.
- Do not change persistent progression schema.
- Do not modify learned-word progression.
- Do not reintroduce removed anti-cheat concepts:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
- Do not reintroduce old viewport overlay answer shuffle:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`
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
- Run an `rg` check for forbidden anti-cheat names listed above.
- Run an `rg` check for forbidden overlay names listed above.
- Run an `rg` check for forbidden edge hover pan names listed above.
- Static verification:
  - `adminRealm=king` affects computed effective ranks only,
  - no Firebase write path is added,
  - no localStorage write path is added for the override.
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
- tasks/review/TASK-036-add-temporary-guest-king-url-flag.md

Checks Run:
- npm run build
- git diff --check
- rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- Static verification of `adminRealm=king` effective rank override and persistent write paths

Notes:
- Added temporary `?adminRealm=king` support through `effectivePerfectRanks`, marking ranks through King as perfect for rendering/unlocking only.
- Added an inline comment marking the shortcut as temporary debug/admin tooling to remove later.
- Static verification: the URL flag does not call `setPerfectRanks`, does not write localStorage, and does not write Firebase; completion persistence is skipped while the temporary flag is active.
- Existing real progress loading/saving remains unchanged when the flag is absent.
- Local visual QA is delegated to Lead Review.

## Lead Review

Status: accepted

Review Notes:
- `?adminRealm=king` is implemented as a temporary render-only override through `effectivePerfectRanks`.
- The override marks ranks through King as perfect for unlock/render state and enables the King+ realm setup.
- The flag does not call `setPerfectRanks`, does not add Firebase writes, and does not add localStorage writes.
- Completion persistence/demotion returns early while the temporary flag is active, so debug sessions cannot persist progress.
- Existing progress loading/saving remains based on `perfectRanks` when the flag is absent.
- The temporary remove-later code comment is present.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local Vite check: `/play/match-pairs/default?adminRealm=king` rendered the King+ realm screen with `realmContainer`, `realmShell`, and `Ваше королевство` visible.

Notes:
- The same browser profile already had local `default` progress, so the default route visual comparison was not isolated. Code review confirms the default path uses unchanged `perfectRanks` when the flag is absent.
