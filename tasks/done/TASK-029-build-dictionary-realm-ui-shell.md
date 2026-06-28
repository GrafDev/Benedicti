# Task: Build Dictionary Realm UI shell for King+ Match Pairs players

## ID

TASK-029

## Role

builder-code

## Goal

Create the first UI shell for the Dictionary Realm mode shown to Match Pairs players who have reached the `King` rank, using placeholders for art/assets while preserving the existing pre-King rank flow.

## Context

Product direction from the user:

- Each teacher dictionary becomes a "world" or "realm".
- The realm is a field made from hexagonal cells.
- The number of hex cells is based on teacher dictionary words plus students.
- Students are represented by castles placed evenly around the realm edge.
- Until a student reaches `King`, they should not see the realm and should continue through the existing rank cards/path.
- Once a student reaches `King`, the interface changes to the realm screen.
- When a King-level player completes another King level, they will later conquer neighboring cells.
- A player who owns more than 50% of cells becomes `Emperor`.

This task is only the first UI shell. It should not implement final multiplayer conquest or Firebase realm persistence yet.

Visual direction:

- Follow the approved dark medieval/premium navy-gold style from the Match Pairs redesign.
- Use the same kind of panels/buttons as the approved concept:
  - main realm map,
  - left player/castle panel,
  - right leaderboard/status panel,
  - bottom or corner action button for playing the King level,
  - clear `King` / `Emperor` status presentation.
- The user will prepare final background and castle/realm images later. Use polished placeholders for now.

Critical interaction direction:

- The realm field is not visually boxed into a small constrained frame.
- Keep the map scale fixed; do not add zoom for this task.
- The map should be pannable/scrollable:
  - desktop: auto-pan when the mouse is near screen/map edges,
  - tablet/mobile: drag with touch/pointer to pan,
  - avoid accidental page scroll conflicts as much as practical.
- The map may extend beyond the visible viewport; the user should feel like they are moving across a larger world.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-029-build-dictionary-realm-ui-shell.md

## Forbidden Files

- package.json
- package-lock.json
- public/assets/match-pairs/*
- firebase.json
- .firebaserc
- tasks/done/*
- tasks/review/*
- PROCESS.md
- AGENT_ROLES.md

## Acceptance Criteria

- Existing pre-King Match Pairs setup/rank UI remains unchanged for players below `King`.
- If the player has reached `King` for the active dictionary, show the new Dictionary Realm shell instead of the current rank card grid/setup body.
- Use current local/Firebase `perfectRanks` data to determine whether `King` is reached.
- Realm UI includes:
  - large hex realm field with placeholder hex cells,
  - placeholder student castles placed around the realm edge,
  - current player/castle info panel,
  - realm leaderboard/status panel,
  - action button to play the next `King` level,
  - visible King/Emperor status copy or badge area.
- Placeholder realm data is acceptable for this task, but it must be deterministic and easy to replace with real Firebase data later.
- Hex field should be larger than the visible area on common desktop/tablet viewports and support panning.
- Desktop edge-pan:
  - moving the mouse near the visible map/screen edge pans the map smoothly,
  - panning stops when the mouse leaves the edge zone or the component unmounts.
- Touch/pointer pan:
  - dragging the map pans it on tablet/mobile,
  - dragging should not select text or trigger awkward horizontal page overflow.
- Keep map scale fixed. Do not implement zoom controls yet.
- Do not implement final conquest logic, Firebase realm model, multiplayer transactions, or Emperor assignment persistence in this task.
- Keep all current Match Pairs gameplay behavior intact:
  - rank progression/demotion from `TASK-028`,
  - answer shuffle behavior from `TASK-025`/`TASK-026`,
  - height-based tablet layout from `TASK-027`,
  - learned-word progression and dictionary filtering.
- Use both Russian and English i18n strings for any new visible text.
- Do not add dependencies.

## Implementation Guidance

- Prefer small local helper functions/components inside `MatchPairs.tsx` for this first shell.
- Consider deriving a temporary `hasReachedKing` boolean from `perfectRanks.king`.
- Keep the existing `startLevel(rank)` path usable from the new realm action button by starting the `King` rank.
- Use CSS hex shapes/placeholders; final images will be supplied later.
- Keep generated/mock students deterministic, for example based on dictionary/student placeholder names, not `Math.random()` on each render.
- For panning:
  - maintain pan offset in React state or refs,
  - clamp only if necessary; the world can be larger than the viewport but should not drift into total blankness,
  - use `requestAnimationFrame` for edge auto-pan if implementing continuous movement,
  - clean up timers/animation frames on unmount.

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
- Manual browser visual QA may be delegated to Lead Review.
- If you do inspect locally, verify:
  - below-King state still shows current rank setup,
  - King+ state shows realm shell,
  - desktop edge pan works,
  - touch/pointer drag pan works in responsive viewport,
  - no horizontal page overflow on mobile.

## Notes

This task intentionally creates only the UI shell and interaction foundation. Data model, realm generation, conquest, Firebase persistence, and multiplayer consistency should be separate future tasks.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/review/TASK-029-build-dictionary-realm-ui-shell.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Manual browser visual QA: not run; delegated to Lead Review per task allowance.

Notes:
- Added a King+ Dictionary Realm setup shell gated by `perfectRanks.king`; pre-King players keep the existing rank path and rank card grid.
- Added deterministic placeholder realm cells and placeholder castles generated locally from stable data, with no Firebase writes or conquest persistence.
- Added fixed-scale map panning: desktop edge auto-pan via `requestAnimationFrame` and pointer drag for touch/tablet.
- Added player/castle, leaderboard/status, King/Emperor status, and King-level action UI using existing `startLevel(kingRank)`.
- Added Russian and English strings for new visible text.
- Preserved existing Match Pairs gameplay paths, shuffle/layout state, rank progression/demotion logic, learned-word progression, and dictionary filtering.
- Process conflict noted: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: accepted

Review Notes:
- Accepted. The implementation adds a King-gated Dictionary Realm UI shell while preserving the pre-King rank path and rank cards.
- Confirmed the available pre-King local state still shows the existing setup/rank UI and does not show the realm shell.
- Code review confirmed King+ realm shell uses deterministic placeholder cells/castles, fixed map scale, desktop edge-pan, and pointer/touch drag panning.
- Confirmed the King action button reuses the existing `startLevel(kingRank)` path.
- Confirmed this task does not add Firebase realm persistence, conquest logic, multiplayer transactions, or Emperor persistence.
- Live visual QA of the King+ shell was limited because the Lead browser session could not safely force localStorage King progress; visual review should be rechecked on an account/dictionary where `King` is genuinely unlocked.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local browser pre-King smoke at `/play/match-pairs/default`: passed; existing rank grid remained visible, realm shell was hidden, and there was no horizontal overflow.

Risk Notes:
- King+ visual shell should still be reviewed with real unlocked King progress before deployment confidence is considered high.
