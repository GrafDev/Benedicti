# TASK-052: Simplify tablet layout to landscape/portrait modes

Status: todo
Owner: Builder
Lead: Codex

## Problem

The Match Pairs UI currently has several tablet-specific responsive behaviors. The desired model is simpler:

- Landscape tablets should behave like desktop.
- Portrait tablets should use the portrait/mobile-oriented layout where needed.

There should not be a separate third "tablet" layout mode that changes the interface unexpectedly.

## Requirements

1. Simplify responsive behavior for Match Pairs:
   - Use two effective layout modes:
     - landscape / wide: desktop-like layout;
     - portrait / narrow: portrait layout.
   - Tablet landscape should match desktop as closely as possible.

2. Review and remove/adjust tablet-specific breakpoints that create a third behavior:
   - Especially rules around gameplay board columns, realm layout, setup screen, and controls.
   - Keep portrait behavior usable and non-overflowing.

3. Preserve game-specific layout constraints:
   - Match Pairs gameplay must still fit vertically where possible.
   - The four-column word layout should only be used when height is genuinely constrained, not simply because the device is a tablet.
   - Realm screen must still fit viewport height and keep the map inside its panel.

4. Preserve current functionality:
   - Dictionary dropdown portal behavior remains.
   - Realm conquest persistence remains unchanged.
   - Realm participant canonical placement work is separate and must not be overwritten.
   - Capture animation remains.

5. Keep existing forbidden regressions absent:
   - Do not reintroduce non-current participant `matchPairsProgress` reads.
   - Do not reintroduce playable Match Pairs Emperor level.
   - Do not reintroduce edge-hover pan.
   - Do not reintroduce old fixed viewport answer shuffle overlay names.

## Verification

Run:

- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm no non-current reads.
- Existing forbidden checks for demo names, playable Emperor, edge-hover pan, fixed answer shuffle overlay.

Static verification to report:

- Which tablet-specific rules were removed or changed.
- Why tablet landscape now follows desktop layout.
- Why tablet portrait still remains usable.

## Out of Scope

- No Firebase rules/config changes.
- No realm data model changes.
- No visual/browser QA by Builder; Lead/user will check.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-052-simplify-tablet-layout-to-orientation-modes.md

Checks Run:
- `npm run build`
- `git diff --check`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress" src/pages/MatchPairs.tsx`
- `rg -n "Amber Gate|Moon Tower|Eastwatch|River Hold|Sunspire|demo-amber|demo-moon|demo-east|demo-river|demo-sun" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`
- `rg -n "effectivePerfectRanks\\.emperor|rankId: 'emperor'|rankId === 'emperor'|id: 'emperor'|REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Replaced the width-only tablet four-column gate with a portrait-tablet gate: `769px..1180px` only when `window.innerHeight >= window.innerWidth`.
- Landscape tablets no longer opt into `useTabletFourColumnLayout`; they keep the default desktop-like two-column board.
- Four-column gameplay remains available only as a height-fit fallback for portrait tablets when the measured two-column board would overflow the available stage height.
- Changed the realm/setup/gameplay tablet media queries from width-only tablet breakpoints to portrait/narrow rules: `max-width: 768px` or `769px..1180px` with `orientation: portrait`.
- The previous `max-width: 1100px` realm shell override no longer affects landscape tablets, so landscape follows the desktop realm layout more closely.
- Portrait tablets still receive the narrow/mobile-oriented setup, realm, controls, rank path, and board sizing rules.
- Dictionary dropdown portal behavior, realm persistence, realm canonical placement, capture animation, and rank pair/direction logic were not changed by this task.
- `npm run build` passed with the existing Vite large chunk warning.
- The broader task rg for `matchPairsProgress/${activeDictId}` reports existing current-user progress paths; the narrower non-current `users/${uid}/matchPairsProgress` check has no matches.
- Demo realm names, playable Emperor path, edge-hover pan, old fixed viewport answer shuffle overlay names, and `position: fixed` were not reintroduced.
- No Firebase rules/config changes, realm data model changes, visual QA, or browser QA were performed.

## Lead Review

Status: accepted

Checks Run:
- `npm run build`: passed; existing Vite large chunk warning only.
- Static review of Match Pairs responsive logic and CSS media queries: accepted.

Accepted Notes:
- Width-only tablet layout gating was replaced with portrait tablet gating.
- Landscape tablets now keep desktop-like layout behavior.
- Four-column gameplay fallback remains available only for portrait tablet height constraints.
- Realm/layout CSS tablet overrides now apply to mobile widths or portrait tablet ranges, not all tablet landscape viewports.
- Dictionary dropdown portal, realm persistence, canonical placement, capture animation, and rank pair/direction logic were preserved.
