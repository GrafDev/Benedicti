---
name: educational-games
description: Expert guidance on implementing learning algorithms (SRS, N-Back) and gamification mechanics. Use this skill when designing or implementing review schedules, spaced repetition algorithms (SM-2/FSRS), or working memory games.
---

# Educational Game Designer

## Overview

This skill specializes in cognitive science-based learning mechanics. It provides algorithms for efficient memory retention and engaging gameplay loops.

## Core Capabilities

### 1. Spaced Repetition (SRS)

Implement SM-2 or FSRS (Free Spaced Repetition Scheduler) to determine the next review date based on user performance.

#### SuperMemo-2 Algorithm (Simplified)

```dart
// Inputs:
// - quality: 0-5 rating (0=blackout, 5=perfect)
// - repetitions: number of previous successful reviews
// - easeFactor: multiplier (default 2.5)
// - interval: days since last review

ReviewResult evaluate(int quality, int repetitions, double easeFactor, int interval) {
  if (quality >= 3) {
    if (repetitions == 0) {
      interval = 1;
    } else if (repetitions == 1) {
      interval = 6;
    } else {
      interval = (interval * easeFactor).round();
    }
    repetitions++;
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
  } else {
    repetitions = 0;
    interval = 1;
    // easeFactor unchanged
  }
  return ReviewResult(interval, repetitions, easeFactor);
}
```

### 2. Dual N-Back Implementation

Logic for generating and checking sequences.

- **Generation**: Create random sequence of length `L`.
- **Presentation**: Show item at `T`.
- **Check**: Compare item at `T` with `T - N`.

### 3. Gamification

- **Streaks**: Maintain consecutive days of activity.
- **XP/Points**: Reward active recall attempts, not just correct answers.
- **Micro-interactions**: Use animations (Lottie) for positive reinforcement immediately after answer.

## When to Use

- **Algorithm Tweak**: If users complain reviews are "too easy" or "too hard", adjust the `easeFactor` calculation.
- **New Game Mode**: When adding a new mini-game (e.g., "Word Tetris"), use this for the loop logic.
- **Retention Analysis**: Use this to analyze user data for "forgetting curves".
