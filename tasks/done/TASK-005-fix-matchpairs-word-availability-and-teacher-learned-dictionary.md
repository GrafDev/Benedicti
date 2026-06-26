# Task: fix MatchPairs word availability and hide teacher learned dictionary

## ID

TASK-005

## Role

builder-code

## Goal

Fix the MatchPairs flow so rank progression does not incorrectly run out of words after several levels, and ensure students never see a teacher's learned-words dictionary.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/stores/useDictionaryStore.ts
- src/i18n/locales/en.ts
- src/i18n/locales/ru.ts

## Forbidden Files

- src/pages/DictSaber.tsx
- src/components/MigrationManager.tsx
- vite.config.ts
- package.json
- firebase.json

## Acceptance Criteria

- Starting a new MatchPairs rank resets all per-session match state, including previously matched word ids.
- MatchPairs word availability is based on the intended playable words for the selected dictionary, not stale state from a previous rank.
- The task report explains how words are selected for MatchPairs and when words become learned.
- A teacher's learned-words dictionary is filtered out of dictionary lists shown to students.
- The student's own learned-words dictionary behavior is not changed unless required by the bug fix.
- The filter recognizes teacher learned dictionaries by stable id and by known display names.
- Existing personal, shared, and teacher dictionaries continue to load normally.

## Checks

- `npm run build`
- `npm run lint` or document pre-existing unrelated lint failures.
- Manual smoke check: with a 28-word dictionary, complete the first four MatchPairs ranks and confirm the next available rank is not blocked by stale matched ids.
- Manual smoke check: attach a teacher that has a learned-words dictionary and confirm it is not visible to the student.

## Notes

Observed behavior: after completing four MatchPairs ranks once, a user with a 28-word dictionary can see a "not enough words" state even though the dictionary should still have enough words. Also, students should not see the teacher's service dictionary for learned words.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- src/stores/useDictionaryStore.ts

Checks Run:
- `npm run build`: passed
- `npm run lint`: failed due to pre-existing unrelated lint issues across the app, including `no-explicit-any`, React hook compiler checks, and unrelated errors in files such as `src/components/AuthModal.tsx`, `src/components/Header.tsx`, `src/pages/Dictionaries.tsx`, `src/pages/NBack.tsx`, and `src/stores/useDictionaryStore.ts`
- `npx eslint src/pages/MatchPairs.tsx`: failed only on the pre-existing `react-hooks/set-state-in-effect` issue around updating perfect rank state after completion
- Manual smoke check for 28-word MatchPairs progression: not run; browser automation remains blocked in this environment because Playwright Chromium is not installed and system Chrome automation failed with `kill EPERM`
- Manual smoke check for teacher learned dictionary visibility: not run; requires a Firebase teacher/student fixture plus browser access, which is unavailable in this environment

Notes:
- MatchPairs now derives rank availability and session selection from `playableWords`, the current selected dictionary words with non-empty original and translation text, instead of relying on stale per-session match state.
- Starting a rank now resets per-session match state, including `matchedIds`, selected left/right cards, correctness markers, shuffling state, wrong ids, and appearing ids.
- MatchPairs session selection prioritizes due unlearned words, then fills from learned or not-yet-due words, and caps the active session pool at 15 words.
- Words become learned through `answerWordLeitner`: after a correct answer reaches box 5, `markWordAsLearned` moves the word into the user's learned-words dictionary, records foreign/shared progress when needed, and removes that word from the current store words.
- Teacher learned dictionaries are filtered only when loading teacher dictionaries for a student, by stable id/key `learned_dict` and known display names such as `Выученные слова` and `Learned Words`; the student's own learned dictionary loading path is unchanged.

## Lead Review

Status: accepted

Notes:
- Verified that MatchPairs rank startup resets `matchedIds` and related per-session state.
- Verified that rank availability and session selection use `playableWords` from the selected dictionary words with non-empty original and translation text.
- Verified that teacher learned dictionaries are filtered only in the teacher dictionary loading branch and that own dictionary loading is unchanged.
- `npm run build` passes.
- `npx eslint src/pages/MatchPairs.tsx` still fails on the documented pre-existing `react-hooks/set-state-in-effect` warning around perfect-rank state.
- Manual browser smoke checks were not completed due to the environment limitation documented by the Builder Report.
- Residual product note: if words truly reach Leitner box 5, current store behavior still removes them from active words; changing that learning policy should be a separate task.
