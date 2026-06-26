# Task: Refine Match Pairs rank card visuals

## ID

TASK-011

## Role

builder-code

## Goal

Refine the Match Pairs rank selection cards so the badge image sits directly on the card background, without an inner framed image panel, and tune the completed/ready/current card colors to be softer and closer to the provided reference screenshots.

## Allowed Files

- src/pages/MatchPairs.module.css

## Forbidden Files

- src/pages/MatchPairs.tsx
- public/assets/match-pairs/ranks/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- Remove the visible "frame inside a frame" effect around the rank badge on rank cards.
- The rank badge image should appear directly over the card background, similar to the reference card layout.
- Keep the badge centered and visually prominent on desktop and mobile.
- Completed/perfect cards should use a soft green-tinted background and border similar to the reference, not a harsh teal panel.
- Ready/current cards should use a soft blue-tinted background and border similar to the reference.
- Locked cards should remain muted and clearly unavailable.
- Do not change gameplay logic, rank data, dictionary behavior, learned-word behavior, or image assets.
- Do not introduce new images or generated artwork.
- Keep existing responsive behavior intact.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally at desktop width and confirm:
  - no inner framed badge panel is visible,
  - rank badge images are readable,
  - completed/ready/current/locked states are visually distinct,
  - text does not overlap.

## Notes

The user provided screenshots showing the current issue and the desired reference:

- Current issue: the badge has an extra framed panel inside the rank card.
- Desired reference: the badge sits directly on a soft green/blue card background, with softer colors and no nested image frame.

Keep the change small and CSS-only.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-011-refine-matchpairs-rank-card-visuals.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://localhost:5176/play/match-pairs/default`: passed at desktop width; verified rank badge stages have transparent background and border, badge images remain readable, completed/ready/locked states remain distinct, and there is no page-level horizontal overflow.

Notes:
- Removed the visible inner badge panel by making the rank badge stage transparent while preserving badge placement and sizing.
- Tuned perfect cards toward softer green and ready cards toward softer blue; locked cards remain muted.
- Process conflict: this task's Allowed Files omitted the task file itself, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.module.css
- tasks/review/TASK-011-refine-matchpairs-rank-card-visuals.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The change is CSS-only and stays within the task scope.
- The rank badge stage is now transparent with no visible inner panel, removing the frame-inside-frame effect.
- Ready/perfect card colors were softened toward blue/green reference tones while locked cards remain muted.
- No gameplay logic, rank data, dictionary behavior, learned-word behavior, or image assets were changed.
