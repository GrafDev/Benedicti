# Task: Polish Emperor emblems in realm panels

## ID

TASK-061

## Role

builder-code

## Goal

Make the Emperor emblem visually prominent and consistent: enlarge the Emperor badge in the right status card and use the current derived status badge in the left castle/player panel instead of the generic Landmark icon.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/todo/TASK-061-polish-emperor-emblems-size-and-left-panel.md
- tasks/review/TASK-061-polish-emperor-emblems-size-and-left-panel.md
- tasks/done/TASK-061-polish-emperor-emblems-size-and-left-panel.md

## Forbidden Files

- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- The Emperor badge in the right status card is approximately twice the current visible size and reads clearly in the compact panel.
- The right status card layout still fits text cleanly and does not clip/overlap the badge.
- The left castle/player panel uses the displayed realm status badge image for the current player:
  - Emperor current player: `/assets/match-pairs/ranks/emperor-badge.png`.
  - Non-Emperor current player: current playable rank badge.
  - No player/current fallback can keep the existing generic icon.
- The left panel's badge image should be visually consistent with the rest of Match Pairs rank badges and fit inside the existing square sigil container.
- Do not change Emperor derivation, tied/deposed status logic, player list text, territory colors, live-sync, persistence, rank gating, conquest logic, or gameplay mechanics.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx` and confirm no playable Emperor/rank logic is reintroduced.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User feedback: "крупнее надо сделать герб в два раза примерно" for the right Emperor status card.
- User feedback: "Тут тоже надо текущий герб" for the left castle/player panel.
- `REALM_EMPEROR_BADGE_SRC` already exists in `MatchPairs.tsx`.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-061-polish-emperor-emblems-size-and-left-panel.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Enlarged the Emperor image in the right status card from 34px to 64px so the emblem reads clearly in the compact status panel.
- The left castle/player panel now renders the current displayed realm badge image when a current player exists.
- Current Emperor player uses `/assets/match-pairs/ranks/emperor-badge.png`; non-Emperor current player uses the current playable rank badge.
- The left panel keeps the existing Landmark fallback when no current realm player badge is available.
- Added image sizing inside the existing square sigil container to keep the badge visually consistent with Match Pairs rank badges.
- No Emperor derivation, tied/deposed logic, player list text, territory colors, live-sync, persistence, rank gating, conquest logic, word selection, or gameplay mechanics were changed.
- No playable Emperor rank/progress key, edge-hover pan, fixed viewport answer shuffle overlay, or non-current progress read was added.
- `npm run build` passed with the existing Vite large chunk warning.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-061-polish-emperor-emblems-size-and-left-panel.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`: passed with no matches.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Edge-hover pan / old fixed overlay `rg` check: passed with no matches.

Acceptance Notes:
- Right Emperor status emblem is now 64px.
- Left castle/player panel uses the current displayed badge image.
- Emperor current player uses `emperor-badge.png`; non-Emperor current player uses playable rank badge.
- Existing fallback remains for missing current player.
- No realm/game mechanics changed.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
