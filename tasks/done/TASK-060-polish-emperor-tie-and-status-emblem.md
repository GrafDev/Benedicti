# Task: Polish Emperor tie status and status-card emblem

## ID

TASK-060

## Role

builder-code

## Goal

Update the realm status card so tied territory leaders show "Emperor deposed" instead of falling back to "King", and show the Emperor badge image in the Emperor status card instead of the generic crown icon.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-060-polish-emperor-tie-and-status-emblem.md
- tasks/review/TASK-060-polish-emperor-tie-and-status-emblem.md
- tasks/done/TASK-060-polish-emperor-tie-and-status-emblem.md

## Forbidden Files

- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- If two or more players are tied for the highest `territoryCells` count and that highest count is greater than `1`, the right status card shows "Император низложен" in Russian and "Emperor deposed" in English.
- If there is a unique leader with `territoryCells > 1`, the right status card still shows Emperor and the Emperor player's name.
- If nobody has meaningful conquest beyond the home cell, keep the normal fallback status.
- The Emperor status card uses `/assets/match-pairs/ranks/emperor-badge.png` instead of the generic Lucide crown icon.
- The deposed/tied status should not assign an Emperor badge to any player and should not make any territory gold.
- The players list remains clean: name and percent only.
- Emperor remains derived from territory leadership; do not persist Emperor status and do not add Emperor back as a playable rank.
- The "Conquer territory" button remains gated by playable King rank, not by Emperor/deposed status.
- Existing live-sync, owner colors, castle-cell protection, and Emperor presentation rules must be preserved.
- No edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx` and confirm no playable Emperor/rank logic is reintroduced.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User feedback: "При равных надо писать что 'император низложен'." and "У императора должно быть герб императора а не эта корона."
- Use the existing `REALM_EMPEROR_BADGE_SRC` constant if available.
- The tied/deposed state is a status-card state only; it does not create an Emperor player.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/review/TASK-060-polish-emperor-tie-and-status-emblem.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Added derived `isRealmEmperorDeposed` status for ties at the highest `territoryCells` count when that count is greater than `1`.
- The tied/deposed state only changes the right status card text to `realmEmperorDeposed`; it does not set `realmEmperorPlayerId`, assign an Emperor badge to a player, or apply the Emperor gold palette.
- Added EN/RU strings for "Emperor deposed" / "Император низложен".
- Unique Emperor status still shows Emperor and the player's name, and the status card now uses `/assets/match-pairs/ranks/emperor-badge.png` instead of the generic crown icon.
- The players list remains name plus percent only.
- Conquer territory remains gated by playable `currentRealmPlayer?.rankId === 'king'`.
- No persisted Emperor/deposed status, playable Emperor rank, progress key, non-current progress read, edge-hover pan, or fixed viewport answer shuffle overlay was added.
- `npm run build` passed with the existing Vite large chunk warning.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/review/TASK-060-polish-emperor-tie-and-status-emblem.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`: passed with no matches.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Edge-hover pan / old fixed overlay `rg` check: passed with no matches.

Acceptance Notes:
- Tied top leaders with `territoryCells > 1` now show `realmEmperorDeposed` in the right status card.
- Deposed state does not assign Emperor to a player, badge, or gold territory.
- Unique Emperor state still uses the derived Emperor player and shows the Emperor badge image in the status card.
- The players list remains clean.
- No playable Emperor rank/progress/persistence was added.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
