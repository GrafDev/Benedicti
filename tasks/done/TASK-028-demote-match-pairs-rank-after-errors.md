# Task: Demote Match Pairs rank after completing a level with errors

## ID

TASK-028

## Role

builder-code

## Goal

Update Match Pairs rank progression so completing a level with one or more mistakes demotes the player by one rank after the level ends.

## Context

Current behavior:

- A rank is marked as conquered/perfect only when the level is completed with `errors === 0`.
- If a player already conquered a high rank and then completes that same rank with mistakes, the old conquered rank remains.

New rule from the user:

- If the player makes any mistake on a level, they should drop one rank after completing that level.
- Example: if the player was `Emperor` and completes with mistakes, they become `King`.

## Allowed Files

- src/pages/MatchPairs.tsx
- src/pages/MatchPairs.module.css
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-028-demote-match-pairs-rank-after-errors.md

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

- When a Match Pairs level completes with `errors === 0`, preserve the current behavior: mark the selected rank as conquered/perfect locally and in Firebase.
- When a Match Pairs level completes with `errors > 0`, demote rank progress by one rank:
  - clear the selected rank's conquered/perfect status,
  - clear all higher ranks' conquered/perfect statuses too, to keep the progression chain consistent,
  - keep all lower ranks unchanged.
- Example:
  - if `Emperor` was conquered and the player finishes `Emperor` with mistakes, `Emperor` is cleared and `King` remains the highest conquered rank.
  - if `King` is completed with mistakes, `King` and `Emperor` are cleared and `Duke` remains the highest conquered rank if it was previously conquered.
  - if `Citizen` is completed with mistakes, no lower rank exists; `Citizen` and all higher ranks should not be conquered unless later completed perfectly again.
- Apply the demotion to both local state/localStorage and Firebase `users/{uid}/matchPairsProgress/{dictId}` when a user is signed in.
- Use the active dictionary id exactly like the existing perfect-rank save/load logic (`dictId || 'default'`).
- Avoid repeated demotion writes for the same completed level render. The completion effect should run once per completed session result, not repeatedly while the results modal is visible.
- After demotion, the setup/rank screen must reflect the new highest conquered rank and lock higher ranks according to existing progression rules.
- The result modal should remain stable and centered.
- If adding result text for demotion, provide both Russian and English translations. Keep copy short.
- Preserve learned-word progression, dictionary filtering, word selection, answer shuffle behavior, tablet/mobile layout behavior, background, rank assets, scoring, timer, and wrong-answer behavior.
- Do not add dependencies.

## Implementation Guidance

- The existing perfect save logic is near the `isAllDone && errors === 0 && selectedRank` effect in `src/pages/MatchPairs.tsx`.
- Consider replacing it with a single completion-progress effect that handles both perfect completion and error completion.
- For demotion, derive the selected rank index from `RANKS`.
- Clearing a rank should remove localStorage keys like `benedicti_match_perfect_${activeDictId}_${rank.id}` and update `perfectRanks` state.
- For Firebase, remove or set false for selected and higher rank keys under `users/{uid}/matchPairsProgress/{activeDictId}`. Prefer the style already used in this codebase for Firebase writes/removes.
- Be careful with React effect dependencies so the demotion is not applied multiple times for one completed session.

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
- Manual browser visual QA can be delegated to Lead Review unless you directly see a regression while testing.
- If practical, locally verify progression behavior:
  - complete a rank with no mistakes and confirm it is conquered,
  - complete the same or a higher rank with mistakes and confirm selected/higher ranks are cleared,
  - confirm lower ranks stay conquered,
  - confirm setup screen locks/unlocks ranks according to the new state.

## Notes

This task changes Match Pairs rank progression only. It should not affect Leitner learned-word timing or dictionary ownership rules.

## Builder Report

Status: completed

Changed Files:
- src/pages/MatchPairs.tsx
- tasks/review/TASK-028-demote-match-pairs-rank-after-errors.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- `rg -n "position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed, no matches.
- Manual browser visual QA: not run; delegated to Lead Review per task allowance.

Notes:
- Replaced the completion progression effect with a one-shot result handler for each started level.
- Perfect completions still mark the selected rank conquered in state, localStorage, and Firebase.
- Error completions now clear the selected rank and all higher ranks from state/localStorage, and write `false` for those Firebase rank keys when signed in.
- Firebase-loaded `false` values now remove matching localStorage keys so demotion state does not resync stale local perfect flags.
- Did not change answer shuffle, layout, learned-word progression, dictionary filtering, scoring, timer, rank assets, or Firebase paths.
- Process conflict noted: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: accepted

Review Notes:
- Accepted. The completion progression effect now handles both perfect completion and error completion once per started level.
- Confirmed `errors === 0` still marks only the selected rank as conquered/perfect in React state, localStorage, and Firebase.
- Confirmed `errors > 0` clears the selected rank and every higher rank from React state/localStorage, while keeping lower ranks unchanged.
- Confirmed Firebase persistence uses the same active dictionary id path as the existing progression logic and writes `false` for demoted ranks.
- Confirmed Firebase-loaded `false` values clear stale localStorage keys, so older local progress cannot resurrect a demoted rank.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ReplacementGuard|replacementGuardsRef|REPLACEMENT_|triggerReplacementShuffle|recordCompletedOtherPairAttempt|otherPairAttempts|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`: passed with no matches.

Risk Notes:
- Live Firebase write behavior was reviewed statically and not exercised against production data during Lead Review.
