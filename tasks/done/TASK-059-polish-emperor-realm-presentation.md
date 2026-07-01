# Task: Polish Emperor realm presentation

## ID

TASK-059

## Role

builder-code

## Goal

Make the derived Emperor status visually obvious in the realm UI without cluttering the players list: show Emperor prominently in the top/status/player areas, render the Emperor's territory as gold for everyone, and use the Emperor badge for the Emperor's castle marker.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-059-polish-emperor-realm-presentation.md
- tasks/review/TASK-059-polish-emperor-realm-presentation.md
- tasks/done/TASK-059-polish-emperor-realm-presentation.md

## Forbidden Files

- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- The derived Emperor is shown prominently near the top/right status card so it is immediately visible.
- The players list does not append or write the word "Emperor"/"Император" next to the player's percent. Keep the list clean: name and percent only.
- The Emperor's owned territory cells render gold for every viewer/client.
- The Emperor's castle marker uses `/assets/match-pairs/ranks/emperor-badge.png` instead of the player's playable-rank badge.
- Non-Emperor players keep their normal owner colors and playable-rank castle badges.
- Left player info panel and castle popup may still show Emperor status for the Emperor.
- Emperor remains derived from territory leader logic; do not persist Emperor status and do not add Emperor back as a playable rank.
- The "Conquer territory" button remains gated by playable King rank, not by Emperor status.
- Existing live-sync from TASK-055, owner colors from TASK-056, castle-cell protection from TASK-057, and Emperor derivation from TASK-058 must be preserved.
- No edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx` and confirm no playable Emperor/rank logic is reintroduced.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User feedback: "Императора дописывать наверху чтобы сразу было видно, а в списке не писать императора. Территорию императора делать золотой для всех. Значок замка у императора менять на императорский."
- `public/assets/match-pairs/ranks/emperor-badge.png` already exists.
- Emperor is not a playable Match Pairs rank. It is a realm status derived from territory leadership.
- Prefer deriving display values from `realmEmperorPlayerId` / `realmEmperorPlayer` rather than writing new persisted fields.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-059-polish-emperor-realm-presentation.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Added a derived Emperor presentation palette so territory owned by `realmEmperorPlayerId` renders gold for every viewer without persisting Emperor status.
- The Emperor castle marker now uses `/assets/match-pairs/ranks/emperor-badge.png`; non-Emperor castle markers keep their playable-rank badges.
- The right status card now highlights Emperor state and shows the Emperor player name prominently near the top/status area.
- Removed Emperor text from player list rows; leaderboard rows now remain name plus territory percent only.
- Left player info and castle popup continue to use the existing derived realm display status.
- Conquer territory remains gated by playable `currentRealmPlayer?.rankId === 'king'`.
- No playable Emperor rank card, progress key, persisted Emperor field, non-current progress read, edge-hover pan, or fixed viewport answer shuffle overlay was added.
- `npm run build` passed with the existing Vite large chunk warning.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-059-polish-emperor-realm-presentation.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`: passed with no matches.
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`: passed with no matches for non-current participant progress reads.
- Edge-hover pan / old fixed overlay `rg` check: passed with no matches.

Acceptance Notes:
- Emperor territory color is derived from `realmEmperorPlayerId` and rendered gold for every viewer.
- Emperor castle marker uses `/assets/match-pairs/ranks/emperor-badge.png`.
- Player list rows are clean and show only name plus territory percent.
- The right status card now highlights Emperor and shows the Emperor player's name.
- Emperor remains derived only; no playable Emperor rank/progress/persistence was added.
- Conquest remains gated by playable King rank.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
