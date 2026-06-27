# Task: Adapt Match Pairs gameplay layout for tablets

## ID

TASK-017

## Role

builder-code

## Goal

Make the active Match Pairs gameplay screen fit higher ranks on tablet-sized screens. On tablets, use a four-column layout that splits the pairs into two shorter groups: original words, translations, original words, translations.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css

## Forbidden Files

- public/assets/match-pairs/*
- tasks/done/*
- tasks/review/*
- firebase.json
- .firebaserc
- package.json
- package-lock.json

## Acceptance Criteria

- Preserve all Match Pairs gameplay behavior from previous tasks.
- On tablet-sized gameplay viewports, high ranks such as King and Emperor must fit better vertically than the current two-column layout.
- Implement a tablet layout with four visual columns:
  - column 1: first group of original-word cards,
  - column 2: matching translations for the first group,
  - column 3: second group of original-word cards,
  - column 4: matching translations for the second group.
- The four-column layout must keep the same card ids and click handlers, so matching, selected/correct/wrong states, shuffling, appearing animations, repeat-click behavior, score, timer, mistakes, and level completion continue to work.
- Desktop may keep the current centered two-column layout if it already fits well, unless a responsive breakpoint improves it safely.
- Mobile should remain usable:
  - prefer reducing card height, gaps, and font size enough to fit more content,
  - allow safe vertical scrolling if fitting all cards would make text unreadable,
  - avoid horizontal overflow.
- The gameplay background image, fade-in behavior from `TASK-016`, and results modal fix from `TASK-015` must remain intact.
- Do not change learned-word progression, dictionary filtering, rank setup, rank cards, assets, Firebase behavior, or task process files.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Manually inspect `/play/match-pairs/default` locally:
  - start a high rank such as King or Emperor if available,
  - test a tablet viewport around `768x1024`, `820x1180`, and/or `1024x768`,
  - confirm the four-column layout is used on tablet and fits substantially better,
  - confirm selected, correct, wrong, appearing, and shuffling states still apply to the right cards,
  - confirm correct matches still score and wrong matches still count mistakes,
  - confirm mobile/narrow viewport has no horizontal overflow and remains usable,
  - complete a level and confirm the results modal remains centered.

## Notes

User report:

- On tablets, higher ranks such as King and Emperor do not fit enough words vertically.
- Suggested tablet layout: four columns: first words, translations, first words, translations.
- Mobile can keep scroll if needed, but should shrink card sizes where safe.

Implementation hint:

- Consider deriving a midpoint from the current visible column length and rendering two column groups for tablet layout.
- Keep ids and handlers exactly tied to each card item.
- Avoid duplicating gameplay logic; create small render helpers if useful.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-017-adapt-matchpairs-gameplay-for-tablets.md

Checks Run:
- `npm run build`: passed
- `git diff --check -- src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed
- Manual local browser check at `http://127.0.0.1:5179/play/match-pairs/default`: partially attempted; the in-app browser/local dev-server channel repeatedly timed out after starting the high-rank unlock flow, and `curl` could not connect to the reported Vite port despite Vite printing ready.

Notes:
- Added shared Match Pairs card/column render helpers so the same ids, click handlers, disabled states, selected/correct/wrong classes, appearing classes, and shuffling classes are used by both layouts.
- Added a tablet-only four-column gameplay layout for 700px-1180px viewports: original group, matching translation group, original group, matching translation group.
- Kept desktop on the existing two-column layout and kept narrow/mobile below 700px on the compact two-column behavior to avoid horizontal overflow.
- Preserved gameplay background fade-in, results modal markup/fix, gameplay logic, scoring, timer, mistakes, repeat-click behavior, learned-word progression, dictionary filtering, rank setup, assets, and Firebase behavior.
- Process conflict: this task's Allowed Files omitted the task file itself and Forbidden Files includes `tasks/review/*`, but `PROCESS.md` requires appending a Builder Report and moving the task to `tasks/review`.

## Lead Review

Status: accepted

Reviewed Files:
- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- tasks/review/TASK-017-adapt-matchpairs-gameplay-for-tablets.md

Checks Run:
- `npm run build`: passed
- `git diff --check`: passed

Notes:
- Accepted. The implementation keeps the existing desktop two-column layout and adds a tablet-only four-column layout for `700px-1180px`.
- Card rendering now uses shared helpers, so ids, click handlers, selected/correct/wrong states, appearing states, shuffling states, and disabled behavior remain tied to the same item data.
- The tablet split renders original group A, translation group A, original group B, translation group B, which should substantially reduce vertical pressure for King/Emperor ranks.
- Browser manual verification was limited by the Builder's local browser/dev-server timeout report, so residual visual risk remains on exact tablet dimensions; build and static review passed.
- `TASK-018` remains separate and should handle anti-cheat/animation without reverting this layout.
