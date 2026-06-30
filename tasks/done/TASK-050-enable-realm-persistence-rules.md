# TASK-050: Enable Match Pairs realm persistence in Firebase rules

Status: todo
Owner: Builder
Lead: Codex

## Problem

Match Pairs realm conquest appears to work locally, but after reload/deploy the captured territory resets.

Live investigation:

- `firebase database:get /matchPairsRealms --project benodict --shallow` returns `null`.
- Current deployed Realtime Database rules only define `shared` and `users`.
- There is no `matchPairsRealms` rule, so the browser writes to `matchPairsRealms/{realmKey}/players/{uid}` and `matchPairsRealms/{realmKey}/cells/{cellId}` are denied by default.
- The UI updates local React state, but the territory is not persisted to Firebase.

Current live rules:

```json
{
  "rules": {
    "shared": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid",
        "dictionaries": {
          ".read": "auth.uid === $uid || root.child('shared/relations/student_teachers/' + auth.uid + '/' + $uid).exists()"
        }
      }
    }
  }
}
```

## Requirements

1. Add Firebase Realtime Database rules to the repo:
   - Create a rules file, likely `database.rules.json`.
   - Include the existing live rules for `shared` and `users`.
   - Add a `matchPairsRealms` section.

2. Configure Firebase deploy to include database rules:
   - Update `firebase.json` with the Realtime Database rules file.
   - Keep existing hosting config unchanged.

3. Allow signed-in realm participants to persist realm state:
   - `matchPairsRealms/{realmKey}` should be readable by signed-in users.
   - `matchPairsRealms/{realmKey}/players/{uid}` should only be writable by that same signed-in user:
     - `auth.uid === uid`
   - `matchPairsRealms/{realmKey}/cells/{cellId}` must allow signed-in users to write conquest/home cell ownership.
   - Keep validation conservative if possible:
     - cell values are either `null` or a string uid;
     - player records should include the same uid as their key when practical.

4. Preserve existing security behavior:
   - Do not loosen `users/{uid}` private profile/progress access.
   - Do not change dictionary ownership rules.
   - Do not make the database public.

5. Add client-side write visibility if low risk:
   - If Match Pairs realm writes fail, surface at least a console warning already exists; do not add noisy UI unless simple and non-invasive.
   - Do not block gameplay while writes are pending.

6. Keep existing forbidden regressions absent:
   - Do not reintroduce non-current participant `matchPairsProgress` reads.
   - Do not reintroduce playable Match Pairs Emperor level.
   - Do not reintroduce edge-hover pan.
   - Do not reintroduce old fixed viewport answer shuffle overlay names.

## Verification

Run:

- `npm run build`
- `git diff --check`
- Firebase rules syntax validation if available locally.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm no non-current reads.

Static verification to report:

- Which Realtime Database rules were added.
- Why realm player writes are limited to the authenticated owner.
- Why realm cell writes are now allowed for signed-in users.
- Confirm existing `users` and `shared` rule behavior is preserved.

## Deployment Notes For Lead

After acceptance, Lead must deploy database rules as well as hosting, for example:

- `firebase deploy --project benodict`

or, if needed:

- `firebase deploy --project benodict --only database,hosting`

## Out of Scope

- No Cloud Functions.
- No database migration.
- No attempt to recover already-lost local-only territory that never reached Firebase.
- No visual/browser QA by Builder.

## Builder Report

Status: completed

Changed Files:
- database.rules.json
- firebase.json
- tasks/review/TASK-050-enable-realm-persistence-rules.md

Checks Run:
- `npm run build`
- `git diff --check`
- `node -e "JSON.parse(require('fs').readFileSync('database.rules.json','utf8')); JSON.parse(require('fs').readFileSync('firebase.json','utf8')); console.log('firebase json ok')"`
- `firebase emulators:exec --only database "node -e \"console.log('database rules loaded')\""`: not completed because local Java runtime is not installed
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress" src/pages/MatchPairs.tsx`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Added `database.rules.json` and configured `firebase.json` to deploy Realtime Database rules with `"database": { "rules": "database.rules.json" }`.
- Preserved the current live `shared` and `users` rules, including private `users/{uid}` access and existing student/teacher dictionary read behavior.
- Added `matchPairsRealms/{realmKey}` signed-in read access.
- Added `matchPairsRealms/{realmKey}/players/{uid}` writes limited to the authenticated owner with `auth.uid === $uid`.
- Player validation requires `id`, `name`, `rankId`, and `homeCellId`; the stored `id` must match the rule key, optional `rankSource` must be `self`, optional `updatedBy` must match the owner uid, and optional `updatedAt` must be numeric.
- Added `matchPairsRealms/{realmKey}/cells/{cellId}` writes for signed-in users with validation allowing either deletion/null or a string uid value, matching current conquest/home ownership writes.
- No public database access was added and private user access was not loosened.
- `npm run build` passed with the existing Vite large chunk warning.
- JSON parse validation passed for `database.rules.json` and `firebase.json`.
- Firebase Database emulator syntax validation was attempted but could not run locally because Java is not installed; no deployment was attempted.
- The broader task rg for `matchPairsProgress/${activeDictId}` reports existing current-user progress paths; the narrower non-current `users/${uid}/matchPairsProgress` check has no matches.
- Playable Emperor path, edge-hover pan, old fixed viewport answer shuffle overlay names, and `position: fixed` were not reintroduced.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- Static review of `database.rules.json`: accepted.
- Static review of `firebase.json`: accepted; hosting config preserved and database rules path added.

Accepted Notes:
- Existing `shared` and `users` rules match the live rule behavior inspected before the task.
- `matchPairsRealms/{realmKey}` is readable only for signed-in users.
- `matchPairsRealms/{realmKey}/players/{uid}` is writable only by `auth.uid === uid` and validates the record identity.
- `matchPairsRealms/{realmKey}/cells/{cellId}` can now be written by signed-in users and accepts string ownership values or deletion.
- No client gameplay logic was changed.
