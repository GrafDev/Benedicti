# TASK-045: Use sovereignName as the canonical player display name

## ID

TASK-045

## Role

builder-code

## Goal

Use `sovereignName` as the canonical player-facing display name across profile and Match Pairs realm, instead of showing technical fallback names like `Player <uid>` or BeneID when a sovereign name exists.

## Context

Lead inspected current Firebase RTDB structure:

- Most user profiles currently contain only:
  - `users/{uid}/profile/beneId`
  - `users/{uid}/profile/userNumber`
- The reverse map exists:
  - `shared/uid_to_beneid/{uid}`
- Example:
  - `dImOgVlMSiZae4vp29fHDaqaye13 -> Bene_lavomerka_2471`
  - `TU18bkgC1qWhXddOLtXeqBp9up93 -> Bene_Timur_Iakovlev_2435`
- Firebase Auth `displayName` can be read for the current user, but not for other users from client code.

User clarified:
- The app should use `sovereignName` for the normal player nickname/name.
- BeneID is not the desired display name unless no sovereignName exists.

Current problem:
- Realm UI can still show:
  - `Player dlmOgV`
  - `Player TU18bk`
- Or it may fall back to BeneID, which is better than `Player ...` but still not the desired nickname if `sovereignName` exists.

## Required Changes

### 1. Profile save must persist sovereignName

When the user saves the profile name / "Sovereign Name":
- write it to:
  - `users/{uid}/profile/sovereignName`
- keep backward-compatible writes if already implemented:
  - Firebase Auth `displayName`
  - `users/{uid}/profile/displayName`

Do not remove existing `beneId`, `userNumber`, `isTeacher`, `students`, or `teachers`.

### 2. Profile load should prefer sovereignName

Profile page input should load in this order:
1. `users/{uid}/profile/sovereignName`
2. `users/{uid}/profile/displayName`
3. Firebase Auth `displayName`
4. email prefix fallback

This makes the visible "Sovereign Name" field reflect the canonical stored app name.

### 3. Match Pairs realm display name priority

For realm participants, display name priority should be:
1. `users/{uid}/profile/sovereignName`
2. `users/{uid}/profile/displayName`
3. other profile aliases if already supported (`name`, `username`, `nickname`, etc.)
4. `users/{uid}/profile/beneId`
5. `shared/uid_to_beneid/{uid}`
6. non-fallback persisted realm player name
7. stable `Player <uid-prefix>` fallback

Important:
- Persisted fallback names like `Player dlmOgV` must never override `sovereignName` or BeneID.
- If a better `sovereignName` is found, existing player seeding may update `matchPairsRealms/{realmKey}/players/{uid}/name`.
- Do not change territory/cell ownership/progress.

### 4. Existing users / migration behavior

Do not perform a broad destructive migration.

Safe behavior:
- When a user opens/saves profile, their chosen name is persisted to `sovereignName`.
- If current user has Firebase Auth `displayName` but profile has no `sovereignName`, it is acceptable to seed/write `sovereignName` for that current user during profile save/load only if this matches existing app patterns and does not surprise the user.
- For other users, do not invent sovereignName from UID.
- For other users without `sovereignName`, fallback to BeneID.

### 5. UI wording

The profile field is already labeled "Sovereign Name"; make sure code/data matches that concept.

Do not rename the visible field unless needed.

## Acceptance Criteria

- Saving profile "Sovereign Name" writes `users/{uid}/profile/sovereignName`.
- Profile page reloads and displays `sovereignName`.
- Match Pairs realm shows `sovereignName` for participants when present.
- If `sovereignName` is missing, realm falls back to BeneID before `Player <uid>`.
- Existing `displayName` support remains backward-compatible.
- Existing realm cells/territory/progress are not reset or changed.
- No Match Pairs Emperor playable/status regression.
- Edge-hover pan remains absent.
- Old fixed viewport shuffle overlay remains absent.
- `npm run build` passes.

## Allowed Files

- `src/contexts/AuthContext.tsx`
- `src/pages/Profile.tsx`
- `src/pages/MatchPairs.tsx`
- `src/stores/useDictionaryStore.ts`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add dependencies.
- Do not change Firebase config.
- Do not change Firebase rules.
- Do not perform broad database migration.
- Do not reset or rewrite realm territory/cells.
- Do not edit unrelated games.
- Do not reintroduce demo realm players.
- Do not reintroduce Match Pairs Emperor as a playable rank/status.
- Do not reintroduce edge-hover pan.
- Do not reintroduce old fixed viewport overlay shuffle code.
- Do not perform visual QA; Lead/user handles it with local Vite.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run forbidden demo realm names check.
- Run forbidden Emperor / edge-hover pan check.
- Run forbidden old viewport overlay shuffle check.
- Static verification:
  - profile save writes `sovereignName`;
  - profile load prefers `sovereignName`;
  - realm resolver prefers `sovereignName` before `displayName` / BeneID / persisted fallback;
  - fallback `Player <uid>` is last resort only;
  - no territory/cell/progress write paths changed.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Firebase paths read/written
- Name priority implemented
- Backward compatibility notes
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx
- src/pages/MatchPairs.tsx
- tasks/review/TASK-045-use-sovereign-name-for-player-display.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- `updateProfileName` now writes the saved Sovereign Name to `users/{uid}/profile/sovereignName` while keeping the existing Firebase Auth `displayName` and RTDB `displayName` writes.
- The AuthContext local profile state now updates both `sovereignName` and `displayName` after saving.
- The Profile page now loads the input in canonical order: RTDB `sovereignName`, RTDB `displayName`, Firebase Auth `displayName`, then email/default fallback.
- The Profile save condition compares against the canonical profile name, so saving can seed `sovereignName` even when Firebase Auth `displayName` already matches.
- Match Pairs realm profile name resolution now checks `sovereignName` before `displayName`, aliases, profile `beneId`, shared BeneID, persisted non-fallback name, and final `Player <uid-prefix>` fallback.
- Backward compatibility is preserved: existing `displayName` and BeneID fallbacks still work when `sovereignName` is missing.
- No broad migration was performed.
- No realm territory, cell ownership, progress, Firebase config/rules, Emperor path, edge-hover pan, or old fixed viewport shuffle overlay behavior was changed by this task.
- Local/browser visual QA is delegated to Lead/user per task instruction.

## Lead Review - accepted

Status: accepted

Checks run by Lead:
- `npm run build`: passed; Vite reported the existing large chunk warning only.
- `git diff --check`: passed.
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.

Static review:
- Profile save writes `users/{uid}/profile/sovereignName` while preserving Auth/RTDB displayName compatibility.
- Profile load now prefers `sovereignName`.
- Match Pairs realm resolver now checks `sovereignName` before `displayName`, aliases, BeneID, persisted non-fallback name, and final UID fallback.
- No territory/cell/progress logic was changed in TASK-045.

Notes:
- Visual QA is delegated to the user with local Vite per current process.
