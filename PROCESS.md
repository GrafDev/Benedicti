# AI Development Process

We use a lightweight Lead/Builder task board for BeneDicti work.

The goal is to keep changes small, reviewable, and safe for an active learning app with Firebase data, PWA behavior, and several game modes.

## Board

Tasks move through three folders:

```text
tasks/todo -> tasks/review -> tasks/done
```

Returned tasks move back:

```text
tasks/review -> tasks/todo
```

## Folder Meaning

- `tasks/todo`: scoped tasks ready for implementation.
- `tasks/review`: completed or blocked tasks waiting for Lead AI review.
- `tasks/done`: accepted tasks.

## Roles

- Lead AI: creates tasks, reviews work, accepts or returns tasks, and decides when to commit.
- Builder AI: completes one assigned task and writes a short report inside the task file.

## Language Rules

- User-facing conversation should be in Russian unless the user asks otherwise.
- AI-to-AI project artifacts must be written in English: task files, Builder Reports, Lead Reviews, process notes, and acceptance criteria.
- Code, identifiers, and existing product copy should follow the surrounding project conventions.

## Lead AI Rules

- Create clear, small tasks in `tasks/todo`.
- Each task must include a goal, allowed files, forbidden files, acceptance criteria, and checks.
- Keep one task focused on one outcome.
- Use follow-up tasks for useful work outside the current scope.
- Review changed files and the Builder Report before accepting.
- If accepted, add `Lead Review` and move the task to `tasks/done`.
- If changes are needed, add `Lead Review` with required fixes and move the task back to `tasks/todo`.
- Decide whether accepted work should be committed now, batched, or left uncommitted.
- Do not assign commit or push work to Builder AI.

## Builder AI Rules

- Work on one assigned task at a time.
- Change only files listed in `Allowed Files`.
- Do not change files listed in `Forbidden Files`.
- Do not accept your own work.
- Do not move tasks to `tasks/done`.
- When finished or blocked, append a `Builder Report` to the task file.
- Move the task from `tasks/todo` to `tasks/review`.
- Do not run `git commit` or `git push`.

## Builder Modes

- `builder-process`: process files and task workflow.
- `builder-architecture`: architecture and technical decisions.
- `builder-code`: implementation.
- `builder-test`: tests, lint, build, and manual checks.

## Task Format

```md
# Task: short title

## ID

TASK-000

## Role

builder-process | builder-architecture | builder-code | builder-test

## Goal

One clear result this task should produce.

## Allowed Files

- path/to/file

## Forbidden Files

- path/to/file

## Acceptance Criteria

- Concrete condition.

## Checks

- Command or manual check expected from the Builder AI.

## Notes

Extra context or constraints.
```

## Builder Report Format

```md
## Builder Report

Status: completed | blocked

Changed Files:
- path/to/file or none

Checks Run:
- command/check or not run: reason

Notes:
- short note or none
```

## Lead Review Format

Accepted:

```md
## Lead Review

Status: accepted

Notes:
- short note
```

Returned:

```md
## Lead Review

Status: returned

Issues:
- specific issue

Required Changes:
- specific fix
```

## Default Checks

- `npm run build`
- `npm run lint`

When lint is already failing globally, the task should state whether the goal is to reduce all lint errors or only avoid introducing new ones.
