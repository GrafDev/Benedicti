---
name: educational-game-design
description: Expert guide for language learning game mechanics and algorithms. Use this skill when implementing game loops, spaced repetition (SRS), scoring, or interactive learning features.
---

# Educational Game Design

This skill defines the mechanics, algorithms, and logic for the learning games.

## Spaced Repetition System (SRS)

We use a modified **Leitner System** combined with a simplified **SuperMemo-2** approach.

### The Algorithm

When a user reviews a word:
1.  **Correct Answer**:
    *   Promotion: Move card to next box (Box `n` -> `n+1`).
    *   Interval Calculation: `Interval = 2^Box` (days).
    *   Set `nextReview = Now + Interval`.
2.  **Incorrect Answer**:
    *   Demotion: Reset to Box 1 (or 0).
    *   Interval: `0` (Review again today).
    *   Set `nextReview = Now`.

*Max Box level is usually 5 or 7.*

## Game Modes

### 1. Flashcards (Review Mode)
*   **Goal**: Self-assessment.
*   **Flow**:
    1.  Show `original` word.
    2.  User taps "Flip".
    3.  Show `translation`.
    4.  User rates recall: "Forgot", "Hard", "Good", "Easy".
*   **Logic**: Map ratings to SRS box changes.

### 2. Word Match (Speed Mode)
*   **Goal**: Quick recognition.
*   **Flow**:
    1.  Display grid of 8 cards (4 originals, 4 translations) shuffled.
    2.  User selects a pair.
    3.  **Match**: Pair disappears, +Points.
    4.  **Mismatch**: Shake animation, -Time.
*   **Scoring**: Base Score + Streak Multiplier.

### 3. Typing Construction (Spelling Mode)
*   **Goal**: Orthography and precise recall.
*   **Flow**:
    1.  Show `original` word.
    2.  User types `translation`.
    3.  Real-time feedback (green/red outline).
*   **Hint System**: Reveal first letter (-Score).

## Gamification Elements

*   **Daily Streaks**: Track consecutive days with at least 1 lesson. Store in `users/{uid}/stats/streaks`.
*   **XP System**: 
    *   Review word: +10 XP.
    *   Game complete: +50 XP.
*   **Badges**: "Week Warrior", "Vocabulary Master (1000 words)".
