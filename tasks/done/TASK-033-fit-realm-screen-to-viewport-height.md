# TASK-033: Fit realm screen to viewport height without page scroll

## Owner

Builder

## Status

todo

## Context

After `TASK-032`, the realm map itself is improved, but the full page scrolls vertically again on the realm screen. User feedback: everything must fit within the browser window height. The realm screen should behave like a contained game screen, not a long document page.

Screenshot evidence shows the top of the page is scrolled away while the realm panels remain taller than the viewport. The central map panel has a lot of empty vertical space and the page body scrolls. This is not acceptable for the realm mode.

Likely contributing CSS from current implementation:
- `.container` allows page vertical scroll.
- `.realmLayout` uses `min-height: min(720px, calc(100dvh - 250px))`.
- `.realmMapPanel` / `.realmViewport` chain includes large fixed/min heights.
- `.realmViewport` has `min-height: 560px`, with media variants also using large min heights.

## Required Changes

- Make the King+ realm/setup screen fit inside the visible viewport height.
- The document/body/page must not vertically scroll in the normal desktop realm view.
- The realm layout should use a bounded height derived from viewport height and existing header/stat areas.
- The central map viewport must flex/shrink inside the available height instead of forcing the whole page taller.
- The left player panel and right status panel should fit the same available height and use internal scrolling only if their contents overflow.
- Preserve the map zoom/pan behavior from `TASK-032`.
- Preserve the `Ваше королевство` / `Your kingdom` button and King-level play button.
- Preserve pre-King setup/rank cards behavior; do not break mobile fallback.
- Mobile can use internal scrolling if truly needed, but avoid horizontal page scroll and avoid desktop page scroll.
- Keep visual style intact.
- Do not change realm persistence/conquest/gameplay logic.
- Do not add dependencies.

## Acceptance Criteria

- On desktop-sized viewport, the realm screen fits within `100dvh`/visible browser height without document/page vertical scrolling.
- The browser page itself should not scroll when the realm screen is open; panning/zooming should occur inside the map viewport.
- The map panel shrinks with the viewport and keeps controls visible.
- Left and right side panels stay within the same height as the map area.
- If side panel content overflows, it scrolls inside that panel rather than making the whole page scroll.
- The realm map remains zoomable and draggable.
- The `Ваше королевство` button remains visible and usable.
- Player marker popup behavior remains available.
- Pre-King rank selection view is not regressed.
- `npm run build` passes.
- `git diff --check` passes.

## Files Likely To Change

- `src/pages/MatchPairs.module.css`
- possibly `src/pages/MatchPairs.tsx` only if a class split is needed
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not implement real backend realm state in this task.
- Do not change Match Pairs gameplay or word progression.
- Do not reintroduce removed anti-cheat concepts:
  - `ReplacementGuard`
  - `replacementGuardsRef`
  - `REPLACEMENT_`
  - `triggerReplacementShuffle`
  - `recordCompletedOtherPairAttempt`
  - `otherPairAttempts`
- Do not reintroduce the old viewport overlay answer shuffle approach:
  - `position: fixed`
  - `answerShuffleOverlay`
  - `answerShuffleClone`
  - `fly-x`
  - `fly-y`

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run an `rg` check for the forbidden anti-cheat names listed above.
- Run an `rg` check for the forbidden old overlay names listed above.
- Static CSS review: confirm realm desktop layout does not rely on large `min-height` values that can force body/page scroll.
- Manual browser visual QA may be delegated to Lead Review, but Builder should still report what viewport/layout assumptions were checked.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-033-fit-realm-screen-to-viewport-height.md

Checks Run:
- npm run build
- git diff --check
- rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- Static CSS/layout review of realm container, shell, map panel, viewport, and side panel height/overflow rules

Notes:
- Added a realm-only container class for King+ setup so the desktop realm screen is height-bounded and does not use the base page vertical scroll.
- Changed the desktop realm shell/map/viewport chain to use bounded height, flex/grid shrink behavior, and `min-height: 0` instead of large fixed/min heights.
- Side panels now stay within the realm area and use internal vertical scrolling when needed.
- Mobile keeps an auto-height fallback with page/internal scrolling allowed by the task.
- Preserved TASK-032 map zoom/pan, Your kingdom control, territory mock behavior, and gameplay logic.
- Manual browser visual QA is delegated to Lead Review.

## Lead Review

Status: accepted

Review Notes:
- The realm setup now gets a dedicated `realmContainer` class only for King+ setup mode.
- Desktop realm mode is height-bounded with `height: calc(100dvh - 4.5rem)` and `overflow: hidden`, overriding the base page vertical scroll behavior for this screen.
- The realm shell/map/viewport chain now uses flex/grid shrink behavior and `min-height: 0` instead of large fixed minimum heights that forced document scrolling.
- Left and right realm panels use internal `overflow-y: auto`, so panel overflow should stay inside the panels.
- Mobile keeps an auto-height fallback, which is allowed by the task.
- TASK-032 map zoom/pan, `Your kingdom`, mock territory behavior, and gameplay logic were preserved.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Static CSS review: passed; desktop realm layout no longer relies on large map/viewport `min-height` values that force body/page scroll.

Residual Risk:
- Manual in-browser realm visual QA was attempted, but the local browser control session timed out before the King+ realm view could be inspected. Acceptance is based on CSS review and build/static checks.
