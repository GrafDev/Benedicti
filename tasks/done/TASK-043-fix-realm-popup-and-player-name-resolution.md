# TASK-043: Fix realm castle popup clicks and real player name resolution

## ID

TASK-043

## Role

builder-code

## Goal

In Match Pairs realm, clicking any other player's castle must open the owner popup, and the realm player list/popup must show real player nicknames instead of fallback names such as `Player dlmOgV`.

## Context

User reported two production issues after TASK-040/TASK-041:

1. Clicking another player's kingdom/castle does not open the popup.
2. Player names in the realm list are still strange fallback names, even though the users have normal nicknames in the app.

Relevant current implementation:
- `src/pages/MatchPairs.tsx`
  - `selectedRealmPlayer` controls the popup.
  - castle marker click calls `setSelectedRealmPlayer(cell.player || null)`.
  - realm map viewport also has pointer drag handlers:
    - `handleRealmPointerDown`
    - `handleRealmPointerMove`
    - `handleRealmPointerEnd`
  - player names are resolved in `resolveRealmDisplayName`.
- `src/pages/MatchPairs.module.css`
  - `.realmPlayerPopup` currently has low local z-index (`z-index: 3`).
  - `.realmWorld` is transformed, creating a stacking context.
- `src/stores/useDictionaryStore.ts`
  - profile/BeneID relations are handled under:
    - `users/{uid}/profile`
    - `shared/uid_to_beneid/{uid}`
    - `shared/bene_ids/{beneId}`
    - `shared/relations/teacher_students/{teacherUid}`
    - `shared/relations/student_teachers/{studentUid}`

Important process note:
- Lead/user handles visual QA.
- Builder should run build/static checks, but should not spend time on browser visual QA.

## Required Changes

### 1. Fix castle popup click behavior

Clicking any player castle marker, including another player's marker, must open the popup for that owner.

Investigate and fix likely causes:
- pointer drag handlers on `.realmViewport` may capture pointer events before marker click;
- clicking a transformed `.realmWorld` child may be interpreted as drag/pan;
- popup may render but appear underneath the map/HUD due to stacking context/z-index;
- popup may be positioned but hidden/clipped by parent overflow.

Implementation guidance:
- Add a small "do not start drag from marker" guard if needed:
  - use `event.target.closest(...)`,
  - or a data attribute on marker/clickable owner cells,
  - or `onPointerDown={event => event.stopPropagation()}` on marker/clickable castle.
- Keep map drag/pinch/wheel behavior working when dragging the map background or neutral cells.
- Ensure `.realmPlayerPopup` renders above the map/world/HUD and is not clipped.
- It is OK to raise z-index or adjust local stacking/overflow around `.realmMapPanel`.
- Do not introduce modal/global overlay unless necessary.

Acceptance for this part:
- Clicking current player's castle opens the popup.
- Clicking another player's castle opens the popup with that player's data.
- Dragging/panning the realm map still works outside castle markers.
- Popup close button still works.

### 2. Fix real player nickname/name resolution

The realm must not show fallback names like `Player dlmOgV` when a real nickname/BeneID/display name exists anywhere in the app's user data.

Before changing code, inspect the current data shape used by this project:
- `users/{uid}/profile`
- `shared/uid_to_beneid/{uid}`
- if relevant, `shared/bene_ids`
- existing `matchPairsRealms/{realmKey}/players/{uid}`

Use a small targeted check against one or two affected participant ids if available from the local realm state or current Firebase state. Do not dump large database branches.

Name resolution requirements:
- Prefer player-facing profile names:
  - `displayName`
  - `name`
  - `sovereignName`
  - `username`
  - any other existing profile field discovered in live/project data that clearly stores the user-visible nickname.
- Then use BeneID from `shared/uid_to_beneid/{uid}`.
- If `shared/uid_to_beneid/{uid}` can be stored as a non-string shape, normalize it safely instead of rendering `[object Object]` or falling back incorrectly.
- Existing persisted realm fallback names like `Player dlmOgV` must never win over profile/BeneID data.
- Existing persisted realm non-fallback names may be used only after profile/BeneID lookup fails.
- If better names are found, existing realm player seeding may update `matchPairsRealms/{realmKey}/players/{uid}/name` without changing territory/cells.

If old users only have Firebase Auth `displayName` and no RTDB profile display name, document that Auth displayName is not readable for other users from client code. Do not claim it is fixed unless the app has an RTDB path for it.

Acceptance for this part:
- Realm player list shows real nicknames/BeneIDs where they exist in RTDB/shared maps.
- Castle popup shows the same resolved real name.
- Fallback `Player <uid-prefix>` appears only when no profile nickname and no BeneID can be resolved.
- No territory/cell ownership/progress is reset.

## Allowed Files

- `src/pages/MatchPairs.tsx`
- `src/pages/MatchPairs.module.css`
- `src/stores/useDictionaryStore.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/Profile.tsx`
- `src/i18n/locales/ru.ts`
- `src/i18n/locales/en.ts`
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not add dependencies.
- Do not change Firebase config.
- Do not change Firebase rules.
- Do not reset or rewrite realm territory/cells.
- Do not edit unrelated games.
- Do not reintroduce demo realm players.
- Do not reintroduce Match Pairs Emperor as a playable level/status.
- Do not reintroduce edge-hover pan:
  - `REALM_EDGE_PAN`
  - `realmEdgeVelocityRef`
  - `realmAnimationFrameRef`
  - `runRealmEdgePan`
  - `startRealmEdgePan`
  - `stopRealmEdgePan`
  - `handleRealmMouseMove`
  - `onMouseMove`
  - `onMouseLeave`
- Do not reintroduce old viewport overlay shuffle code:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`
- Do not perform visual QA; Lead/user handles it with local Vite.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run forbidden demo realm names check:
  - `Amber Gate`
  - `Moon Tower`
  - `Eastwatch`
  - `River Hold`
  - `Sunspire`
- Run forbidden Emperor / edge-hover pan check.
- Run forbidden old viewport overlay shuffle check.
- Static verification:
  - marker click/pointerdown cannot be swallowed by map drag for castle markers;
  - popup z-index/stacking is above the map/world/HUD;
  - name resolver normalizes real profile/BeneID data before fallback;
  - fallback persisted realm names cannot override real names;
  - cells/territory write paths are unchanged except possible player `name` update.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static verification result
- Data shape inspected for names
- Firebase paths read/written
- Name resolution priority actually implemented
- Popup click fix summary
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- tasks/review/TASK-043-fix-realm-popup-and-player-name-resolution.md

Checks Run:
- npm run build
- git diff --check
- rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css

Notes:
- Castle/player hexes now carry a `data-realm-castle-marker` marker and stop pointerdown propagation, and the map viewport drag handler ignores pointerdown events that begin on castle marker targets.
- Map dragging, pinch, and wheel behavior remain attached to the viewport/background path outside castle markers.
- The realm popup now sits above the transformed map world and HUD via explicit map-panel isolation and higher popup/HUD z-index; clipping remains on the viewport map layer, not the popup layer.
- Name resolution now normalizes profile and BeneID values before fallback, including string values and object-shaped `shared/uid_to_beneid/{uid}` values.
- Match Pairs realm names prefer profile `displayName`, `name`, `sovereignName`, `username`, `nickname`, `nickName`, `screenName`, `fullName`, and `beneId`, then normalized BeneID mapping, then a non-fallback persisted realm name, then `Player <uid-prefix>`.
- `useDictionaryStore.resolveBeneIds` also normalizes object-shaped BeneID mapping values before adding them to `beneIdMap`.
- Data shape inspected statically in project code: `users/{uid}/profile`, `shared/uid_to_beneid/{uid}`, `shared/bene_ids/{beneId}`, `shared/relations/teacher_students/{teacherUid}`, `shared/relations/student_teachers/{studentUid}`, and existing realm player records under `matchPairsRealms/{realmKey}/players/{uid}`. No live database branches were dumped because no affected participant UID was provided in the task.
- Existing Auth displayName is still only directly available for the current user; other users require readable RTDB profile/shared data.
- Cells/territory/progress write paths were not changed; the existing player seeding path may still update only player `name` when a better resolved name is found.
- No demo players, Match Pairs Emperor playable/status path, edge-hover pan, or old fixed viewport shuffle overlay code was reintroduced.
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
- Castle markers now stop pointerdown propagation and the viewport drag handler ignores marker-originated pointerdown events.
- Realm popup stacking was raised above the map viewport/world/HUD.
- Name resolver now normalizes profile objects and object-shaped BeneID mappings before falling back.
- Persisted fallback names such as `Player dlmOgV` cannot override profile/BeneID data.
- No territory/cell ownership/progress logic was changed.

Notes:
- Visual verification is delegated to the user with local Vite per updated Lead process.
