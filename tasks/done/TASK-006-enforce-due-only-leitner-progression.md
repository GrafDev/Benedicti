# Task: enforce due-only Leitner progression

## ID

TASK-006

## Role

builder-code

## Goal

Ensure words progress through the learned-word system only according to the Leitner review schedule dates, not from repeated correct answers before the next review is due.

## Allowed Files

- src/stores/useDictionaryStore.ts
- src/pages/Flashcards.tsx
- src/pages/NBack.tsx
- src/pages/MatchPairs.tsx
- src/pages/DictSaber.tsx
- src/types.ts

## Forbidden Files

- src/components/MigrationManager.tsx
- vite.config.ts
- package.json
- firebase.json

## Acceptance Criteria

- The Leitner schedule remains exactly:
  - box 0: immediately
  - box 1: after 1 day
  - box 2: after 3 days
  - box 3: after 7 days
  - box 4: after 14 days
  - box 5: after 30 days
- A correct answer must not increase `box` if the word's current `nextReview` is still in the future.
- A word may reach learned status only by correctly answering when it is due and progressing into box 5.
- Repeated correct answers for the same word must not rapidly promote the word through multiple boxes before the scheduled review dates, regardless of session boundaries.
- Incorrect answers still reset the word to box 0 and make it immediately reviewable.
- Existing personal, shared, foreign, and teacher dictionary progress paths continue to update in the correct Firebase location.
- The Builder Report explains the final policy for when `box`, `nextReview`, and `isLearned` change.

## Checks

- `npm run build`
- `npm run lint` or document pre-existing unrelated lint failures.
- Focused manual or code-level check: a word with `box: 1` and `nextReview` tomorrow does not advance on a correct answer today, even if it appears in a new session.
- Focused manual or code-level check: a word with due `nextReview` advances by exactly one box on a correct answer.
- Focused manual or code-level check: an incorrect answer resets to box 0 and `nextReview` is immediate.

## Notes

The product requirement is strict: learned-word status must follow the scheduled time intervals only. Sessions do not matter; only the current time compared with `nextReview` matters.

## Builder Report

Status: completed

Changed Files:
- src/stores/useDictionaryStore.ts

Checks Run:
- `npm run build`: passed
- `npm run lint`: failed due to pre-existing unrelated lint issues across the app, including `no-explicit-any`, React hook compiler checks, and unrelated errors in files such as `src/components/AuthModal.tsx`, `src/components/Header.tsx`, `src/pages/Dictionaries.tsx`, `src/pages/NBack.tsx`, and `src/stores/useDictionaryStore.ts`
- `npx eslint src/stores/useDictionaryStore.ts`: failed on pre-existing store lint issues such as `no-explicit-any` and `prefer-const`
- Focused code-level check: `node -e "...policy simulation..."` passed for future correct skip, due correct one-box advance, due box 4 correct learned transition, and incorrect reset to box 0 with immediate review

Notes:
- Final policy: incorrect answers always set `box` to 0, set `nextReview` to now, and keep `isLearned` false in the relevant progress path.
- Final policy: correct answers only change progress when `word.nextReview <= Date.now()`; if `nextReview` is in the future, the function returns without updating Firebase or local word state.
- Final policy: due correct answers advance exactly one box and schedule the next review using the unchanged intervals: immediate, 1 day, 3 days, 7 days, 14 days, 30 days.
- Final policy: a due correct answer that advances into box 5 calls `markWordAsLearned` with `box: 5`, the box 5 `nextReview`, and `isLearned: true`; personal, shared, foreign, and teacher progress paths still write to their existing Firebase locations.

## Lead Review

Status: returned

Issues:
- `answerWordLeitner` calls `markWordAsLearned` whenever a due correct answer produces `newBox === 5`, including when the word is already at `box 5`. Because `newBox = Math.min(currentBox + 1, 5)`, a due word with `currentBox === 5` will be copied into the learned dictionary again instead of being treated as already learned. This violates the acceptance criterion that a word reaches learned status only when it is progressing into box 5.

Required Changes:
- Only call `markWordAsLearned` when the due correct answer actually transitions the word into box 5, for example from `currentBox === 4` to `newBox === 5`.
- Define and implement safe behavior for a due correct answer on a word already at `box 5` or `isLearned: true` so it does not create duplicate learned-dictionary entries.
- Add/update the focused code-level check to cover a due `box: 5` word and prove it does not call the learned-word migration path again.

## Builder Report

Status: completed

Changed Files:
- src/stores/useDictionaryStore.ts

Checks Run:
- `npm run build`: passed
- `npm run lint`: failed due to pre-existing unrelated lint issues across the app, including `no-explicit-any`, React hook compiler checks, and unrelated errors in files such as `src/components/AuthModal.tsx`, `src/components/Header.tsx`, `src/pages/Dictionaries.tsx`, `src/pages/NBack.tsx`, and `src/stores/useDictionaryStore.ts`
- Focused code-level check: `node -e "...policy simulation..."` passed for future correct skip, due correct one-box advance, due box 4 correct learned transition, due box 5 correct no-op, already learned correct no-op, and incorrect reset to box 0 with immediate review

Notes:
- `answerWordLeitner` now treats correct answers for `isLearned` words or words already at `box >= 5` as a no-op before any Firebase writes or learned-dictionary migration.
- `markWordAsLearned` is called only when a due correct answer actually progresses from `currentBox === 4` into `newBox === 5`.
- This prevents duplicate learned-dictionary entries for due words that are already at box 5 while preserving the due-only progression and incorrect-reset behavior.

## Lead Review

Status: accepted

Notes:
- Verified that correct answers before `nextReview` are no-ops.
- Verified that learned words and words already at `box >= 5` are no-ops for correct answers, preventing duplicate learned-dictionary entries.
- Verified that `markWordAsLearned` is now called only on the actual transition from box 4 to box 5.
- Verified that incorrect answers still reset to box 0 and immediate review.
- `npm run build` passes.
- `npx eslint src/stores/useDictionaryStore.ts` still fails on pre-existing store lint debt documented in the Builder Report.
