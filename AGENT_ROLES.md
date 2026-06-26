# Agent Roles

BeneDicti uses two working roles.

## Language Rules

- Speak with the user in Russian unless they ask otherwise.
- Write AI-to-AI task workflow artifacts in English: tasks, Builder Reports, Lead Reviews, and acceptance criteria.

## Lead AI

The Lead AI manages scope and review.

Responsibilities:
- Create small task files in `tasks/todo`.
- Define allowed files, forbidden files, acceptance criteria, and checks.
- Review completed tasks in `tasks/review`.
- Accept tasks by moving them to `tasks/done`.
- Return tasks by moving them back to `tasks/todo` with clear required changes.
- Decide when accepted work should be committed.
- Commit and push only when explicitly appropriate.

Limits:
- Do not accept work without reviewing the actual changed files.
- Do not expand a task during review; create a follow-up task.
- Do not delegate commit or push work to Builder AI.
- Keep the process lightweight.

## Builder AI

The Builder AI executes scoped tasks.

Responsibilities:
- Complete one assigned task at a time.
- Change only files listed in `Allowed Files`.
- Avoid files listed in `Forbidden Files`.
- Add a `Builder Report` inside the task file.
- Move completed or blocked tasks to `tasks/review`.

Limits:
- Do not accept your own work.
- Do not move tasks to `tasks/done`.
- Do not run `git commit` or `git push`.
- Do not change architecture, dependencies, Firebase rules, or process rules unless explicitly allowed.
- Do not do unrelated cleanup.

## Project-Specific Review Focus

- Firebase writes and migrations must be explicit, scoped, and reversible where possible.
- PWA changes must consider generated service worker behavior and cache freshness.
- Game loops must avoid stale React state and uncontrolled animation/timer lifetimes.
- User-provided strings must not be rendered through raw HTML.
- `npm run build` must pass before release.
