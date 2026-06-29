# TASK-035: Fix realm viewport fill after local visual QA

## Owner

Builder

## Status

todo

## Context

`TASK-034` removed edge hover panning, but the deployed layout is visually broken. The realm screen no longer scrolls, but the header/stat area consumes the top while the realm panels are pushed too low and partly clipped at the bottom. The map panel appears at the bottom of a large empty vertical area instead of filling the available space cleanly.

User feedback:
- "Everything should stretch to the remaining height. There is flex."
- "Before deploy, run Vite locally and look."
- Current screenshot shows large empty space between stats and realm panels, with the realm content cut off near the bottom.

This task must fix the current visual layout, not just pass static CSS checks.

## Required Changes

- Make the King+ realm setup screen visually fill the viewport height in a balanced way:
  - header toolbar remains at the top,
  - stat summary row remains below it,
  - realm layout starts immediately after the stat row with only normal spacing,
  - realm layout consumes the remaining height,
  - side panels and map panel are fully visible inside that remaining height.
- Remove the large empty vertical gap between the stat row and the realm layout.
- Avoid clipping the bottom of the realm panels/buttons.
- Keep full-page vertical scroll disabled on desktop realm mode.
- Keep side panel overflow internal if content exceeds panel height.
- Preserve removed edge hover pan; do not re-add it.
- Preserve drag pan, wheel zoom, pinch zoom, and `Your kingdom` centering.
- Preserve mobile fallback behavior where page/internal scrolling is allowed if necessary.
- Do not change gameplay, learned word logic, Firebase, persistence, or conquest logic.
- Do not add dependencies.

## Local Visual QA Ownership

Lead AI owns local visual QA before acceptance/deployment. Builder should not spend extended time on browser/Vite visual testing for this task.

Builder should:
- implement the layout fix,
- run build/static checks listed below,
- do a static CSS/layout sanity review,
- report any visual QA that was not run as delegated to Lead Review.

Lead Review will run local Vite/preview and inspect the affected screen before accepting/deploying.

## Acceptance Criteria

- Desktop realm screen no longer has a large empty gap between summary stats and realm layout.
- Realm layout fills the remaining viewport height cleanly.
- Map panel and side panels are not clipped at the bottom.
- `Your kingdom` and `Play King level` buttons are visible.
- No document/page vertical scroll in desktop realm mode.
- No hover edge-pan behavior.
- Drag pan, wheel zoom, and pinch zoom remain wired.
- Pre-King rank selection view is not regressed.
- `npm run build` passes.
- `git diff --check` passes.
- Builder Report states that local visual QA is delegated to Lead Review.

## Files Likely To Change

- `src/pages/MatchPairs.module.css`
- possibly `src/pages/MatchPairs.tsx` only if a small class/layout hook is needed
- this task file, moved to `tasks/review/` when complete according to `PROCESS.md`

## Forbidden / Avoid

- Do not edit `package.json` or add dependencies.
- Do not change Firebase config or deployment files.
- Do not implement real backend realm state.
- Do not change Match Pairs gameplay or word progression.
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
- Local Vite/preview visual QA is delegated to Lead Review.

## Builder Completion Signal

When finished, send a completion signal back to the Lead thread with:
- Task ID
- Status
- Changed files
- Checks run
- Static layout review result
- Blockers
- Risk notes

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-035-fix-realm-viewport-fill-after-local-qa.md

Checks Run:
- npm run build
- git diff --check
- rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css
- Static CSS/layout sanity review of `.realmContainer`, `.setupShell`, `.setupContainer`, and `.realmShell`

Notes:
- Fixed the large empty gap/clipping risk by removing `height: 100%` from `.realmContainer .setupContainer`; the toolbar/stat block now stays natural-height and `.realmShell` can consume the remaining viewport space.
- Kept `.realmContainer .setupShell` as the only 100%-height setup wrapper, with `.setupContainer` set to `flex: 0 0 auto` and `.realmShell` continuing to use `flex: 1 1 0` plus `min-height: 0`.
- Static review confirms the realm layout order is toolbar, stats, then realm shell with no full-height header/stats wrapper pushing the realm below the viewport.
- Edge hover pan remains removed; drag pan, wheel zoom, pinch zoom, and Your kingdom centering were not changed.
- Local browser/Vite visual QA was started before the process correction but stopped before final verification; visual QA is delegated to Lead Review and is not claimed as passed by Builder.

## Lead Review

Status: accepted

Review Notes:
- The root layout issue is fixed in CSS: `.realmContainer .setupContainer` no longer has `height: 100%`, so the toolbar/stat block stays natural-height instead of consuming the viewport and pushing the realm shell down.
- `.realmContainer .setupShell` remains the 100%-height wrapper; `.realmShell` can consume the remaining height via the existing flex behavior.
- Edge hover pan remains removed.
- Drag pan, wheel zoom, pinch zoom, `Your kingdom`, and gameplay logic were not changed.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.
- Local Vite sanity check at `1280x720`: realm setup loaded, document scroll height matched viewport height (`720`), summary ended at `y≈183`, realm shell started at `y≈187`, and map panel bottom was inside the viewport at `y≈628`.
