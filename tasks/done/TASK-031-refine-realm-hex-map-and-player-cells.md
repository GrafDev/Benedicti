# Task: Refine Dictionary Realm hex map, player cells, and player popup

## ID

TASK-031

## Role

builder-code

## Goal

Refine the Dictionary Realm UI shell so the realm map uses a center-out spiral hex layout, rotated hex orientation, player castles placed inside edge hex cells, and a player info popup on cell click.

## Context

The first Dictionary Realm shell exists from `TASK-029`, but the user reviewed it and requested important changes:

- Hexagons should be rotated from the current visual orientation.
- Hexagons should not be arranged as the current offset block/rows.
- Realm cells should be placed from a conceptual realm center outward in a circular/spiral pattern.
- Players should be placed on edge hex cells, not floating outside the field.
- Player cells should show only a rank crest/badge on the hex.
- Clicking a player cell should open a popup with:
  - player name,
  - current rank/level,
  - territory percent if applicable.
- If a player is not yet King, no territory percent should be shown.
- If a player is King but has not conquered territory yet, no percent should be shown yet.

Future conquest rules from the user, for context only:

- Completing the King level perfectly captures one cell.
- Captures start from the player's main castle cell, then adjacent cells, then cells adjacent to already captured territory.
- If no free adjacent cells exist, capture a cell from another kingdom.
- Completing with mistakes shrinks owned territory.
- If a King has only the last/main territory cell and makes a mistake, they drop from King to the lower rank.

This task should implement the UI/geometry foundation only. Do not implement final conquest persistence or multiplayer territory logic yet.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-031-refine-realm-hex-map-and-player-cells.md

## Forbidden Files

- package.json
- package-lock.json
- firebase.json
- .firebaserc
- public/assets/*
- tasks/done/*
- tasks/review/*
- PROCESS.md
- AGENT_ROLES.md

## Acceptance Criteria

- Realm hexes are visually rotated from the current implementation.
  - Use the orientation that reads as a deliberately rotated hex field compared to the current screenshot.
  - Keep the shape crisp and consistent.
- Realm cells are generated from the center outward in a deterministic spiral/ring-like order.
- The resulting field reads as a roughly circular realm, not a rectangular/row block.
- The cell count remains deterministic and based on the placeholder rule from `TASK-029` for now.
- Placeholder players/castles are assigned to actual edge hex cells.
- Player markers are rendered inside their assigned hex cells, not floating outside the field.
- Player markers show a rank crest/badge only:
  - use existing Match Pairs rank badge assets where practical,
  - do not add new image assets.
- Clicking/tapping a player cell opens a polished popup/card near the map or centered over the map on small screens.
- Popup includes:
  - player name,
  - current rank,
  - territory percent only when the player has territory percent data and is King+.
- Popup can be closed by a close button and by selecting another player cell.
- Non-player cells do not open the player popup.
- The existing fixed-scale panning behavior remains:
  - desktop edge-pan still works,
  - pointer/touch drag still works,
  - no zoom controls.
- Keep pre-King flow unchanged.
- Keep `King`-gated realm shell behavior unchanged.
- Do not implement real Firebase realm data, conquest, multiplayer transactions, Emperor persistence, or automatic territory capture in this task.
- Preserve existing Match Pairs gameplay behavior:
  - admin role mode from `TASK-030`,
  - rank demotion from `TASK-028`,
  - height-based tablet layout from `TASK-027`,
  - answer shuffle behavior from `TASK-025`/`TASK-026`,
  - learned-word progression and dictionary filtering.
- Add Russian and English i18n strings for new visible popup text.
- Do not add dependencies.

## Implementation Guidance

- Prefer local helper functions inside `MatchPairs.tsx` for:
  - axial/cube hex ring generation,
  - center-out spiral ordering,
  - edge cell detection,
  - deterministic player-to-edge-cell placement.
- A typical axial spiral can start with `(0,0)`, then rings radius `1..n`, walking the six directions.
- Translate axial coordinates to pixel positions using the chosen rotated orientation.
- Keep all placeholder player data deterministic:
  - no `Math.random()` on render,
  - stable names/ranks/territory examples are fine.
- Use existing badge images:
  - `/assets/match-pairs/ranks/citizen-badge.png`
  - `/assets/match-pairs/ranks/knight-badge.png`
  - `/assets/match-pairs/ranks/baron-badge.png`
  - `/assets/match-pairs/ranks/count-badge.png`
  - `/assets/match-pairs/ranks/duke-badge.png`
  - `/assets/match-pairs/ranks/king-badge.png`
  - `/assets/match-pairs/ranks/emperor-badge.png`
- If a player is below King, popup should show a short status like "Not in the realm war yet" / "Еще не участвует в борьбе за державу".
- If a King has no territory percent, popup should show rank but omit percent.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check to confirm forbidden old anti-cheat names are absent:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
- Run an `rg` check to confirm the old viewport overlay approach is absent:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`
- Manual visual QA may be delegated to Lead Review.
- If you do inspect locally, verify:
  - hex field is circular/spiral and not rectangular,
  - hex orientation is visibly rotated,
  - player badges sit inside edge hexes,
  - clicking a player badge opens the popup,
  - panning still works,
  - mobile has no horizontal page overflow.

## Notes

Territory capture/shrink rules are intentionally documented here for future tasks, but should not be implemented in this task.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/review/TASK-031-refine-realm-hex-map-and-player-cells.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Manual browser visual QA: not run; delegated to Lead Review per task allowance.

Notes:
- Replaced the realm block/row placeholder with deterministic axial center-out spiral/ring cell generation.
- Rotated the hex visual orientation to a pointy hex shape so the field reads differently from the previous screenshot.
- Assigned deterministic placeholder players to outer-ring edge cells and rendered only existing rank badge images inside those cells.
- Added player popup state and UI with name, rank, conditional territory percent, and close behavior.
- Added Russian and English strings for popup status text.
- Preserved fixed-scale realm panning behavior and did not add conquest, Firebase realm persistence, multiplayer transactions, territory capture/shrink, or Emperor persistence.
- Process conflict noted: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: returned

Review Notes:
- The current spiral generation can end with a partial outer ring. With the default realm target (`96` cells), full rings through radius 5 create `91` cells, then only the first `5` cells of radius 6 are added.
- Player placement then uses `edgeCells = cells.filter(cell => cell.ring === outerRing)`. In the default `96`-cell case this gives only `5` edge cells for `6` placeholder players.
- Because `playerCellIndices` is based on `Math.floor((index * edgeCells.length) / realmPlayers.length)`, two players map to edge index `0`, and `playerByCellId.set(...)` overwrites one player. Result: not all players are rendered.
- The partial outer ring also makes the field read as an incomplete clipped spiral instead of a roughly circular realm.

Required Changes:
- Ensure player placement always has at least one unique edge cell per player.
- Avoid using a partial outer ring as the player-placement ring.
- Prefer generating complete rings for the visible placeholder realm, or choose the outermost complete ring for player placement while keeping the visual field circular.
- Preserve center-out deterministic ordering and the rotated pointy hex orientation.
- Keep player markers inside edge hex cells and keep popup behavior.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Browser visual QA was attempted, but the browser control session became unstable during local admin login; the return is based on deterministic code review of the default `96`-cell case.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-031-refine-realm-hex-map-and-player-cells.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Static geometry check: default target `96` now rounds up to complete radius `6`, producing `127` cells, `36` edge cells, and six unique player slots `[0, 6, 12, 18, 24, 30]`.
- Manual browser visual QA: not run; delegated to Lead Review per task allowance.

Notes:
- Updated realm placeholder generation to always render complete rings instead of ending midway through an outer ring.
- Player placement now uses the complete outer ring, so every placeholder player has a unique edge hex cell.
- Preserved center-out deterministic ordering, pointy rotated hex orientation, player badges inside edge cells, popup behavior, and panning behavior.
- Did not add conquest, Firebase realm persistence, multiplayer transactions, territory capture/shrink, or Emperor persistence.
- Process conflict noted: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: accepted

Review Notes:
- The returned geometry issue is fixed. The placeholder target `96` now rounds up to a complete radius `6`, yielding `127` cells, `36` outer-ring cells, and six unique player edge slots.
- The realm grid is generated center-out from axial ring coordinates and uses the rotated pointy hex shape.
- Player markers are assigned to actual edge cells and render rank badge images inside those cells.
- Player popup state, close behavior, rank/name display, and conditional territory text are implemented with Russian and English strings.
- The task remains correctly limited to UI/geometry foundation only; conquest, Firebase realm persistence, multiplayer transactions, territory capture/shrink, and Emperor persistence were not implemented.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Static geometry check: radius `6`, cells `127`, edge cells `36`, player slots `[0, 6, 12, 18, 24, 30]`.

Residual Risk:
- Manual realm visual QA was not completed in the browser because the local session did not have King-level progress available without modifying browser auth/session state. The review accepted based on deterministic code review plus build/static checks.
