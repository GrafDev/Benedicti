# Task: Add client admin role mode

## ID

TASK-030

## Role

builder-code

## Goal

Add a small client-side admin mode foundation based on the signed-in user's Firebase profile role, without building a full admin panel yet.

## Context

An admin Firebase Auth user now exists:

- email: `admin@benedict.local`
- uid: `UyApdFKE85XPgSLZQlxfJ7oSO5b2`
- profile path: `users/UyApdFKE85XPgSLZQlxfJ7oSO5b2/profile`
- profile fields include:
  - `role: "admin"`
  - `isAdmin: true`
  - `isTeacher: true`

The current app has an older hardcoded admin email list in `src/constants/admin.ts`, and some pages check `ADMIN_EMAILS.includes(currentUser.email)`. Replace that pattern with profile-driven auth context state.

## Allowed Files

- src/contexts/AuthContext.tsx
- src/constants/admin.ts
- src/components/Header.tsx
- src/components/Header.module.css
- src/pages/Dictionaries.tsx
- src/pages/DictionaryDetail.tsx
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/todo/TASK-030-add-client-admin-role-mode.md

## Forbidden Files

- package.json
- package-lock.json
- firebase.json
- .firebaserc
- public/assets/*
- tasks/done/*
- tasks/review/*
- PROCESS.md
- AGENT_ROLES.md

## Acceptance Criteria

- `AuthContext` exposes the signed-in user's profile and role information:
  - `userProfile` or equivalent typed object,
  - `isAdmin`,
  - `isTeacher` if useful and already present in the profile.
- `AuthContext` reads `users/{uid}/profile` from Realtime Database after login/auth state changes.
- `isAdmin` must be true when either:
  - `profile.role === "admin"`, or
  - `profile.isAdmin === true`.
- If no user is signed in, `isAdmin` is false and profile is null.
- Existing hardcoded `ADMIN_EMAILS` checks in `Dictionaries.tsx` and `DictionaryDetail.tsx` are replaced with `isAdmin` from `useAuth()`.
- Keep `src/constants/admin.ts` only if still needed for backward compatibility; otherwise remove its usage. Do not rely on email lists for admin UI decisions.
- Header shows a small admin indicator/badge or admin mode label for admins.
- Mobile header/menu should also communicate admin status without layout breakage.
- Do not build a full admin panel in this task.
- Do not add user management, role editing, Firebase security rules, Cloud Functions, or server-side custom claims in this task.
- Existing sign-in/sign-out, profile page, dictionary CRUD, teacher/student features, games, and Match Pairs realm shell must continue working.
- Add Russian and English i18n strings for any new visible admin text.
- Do not add dependencies.

## Implementation Guidance

- `AuthContext` currently imports only `auth`; it may need Realtime Database imports from `../firebase` and `firebase/database`.
- Keep the loading behavior stable. If profile loading is separate from auth loading, avoid blocking the whole app indefinitely.
- Handle Firebase read errors gracefully:
  - log a warning,
  - keep `isAdmin` false if profile cannot be loaded.
- Use a small TypeScript interface for profile fields used by the client.
- If keeping `ADMIN_EMAILS`, it should not be the source of truth for admin mode.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `rg -n "ADMIN_EMAILS|constants/admin" src` and confirm there are no active UI authorization checks based on the old email list.
- Manually or statically verify:
  - signed-out state has `isAdmin=false`,
  - admin profile with `role: "admin"` or `isAdmin: true` would show admin indicator,
  - non-admin users do not see admin indicator.

## Notes

This task creates only the client-side role foundation. Firebase security rules/custom claims and a real admin panel should be separate future tasks.

## Builder Report

Status: completed

Changed Files:
- src/contexts/AuthContext.tsx
- src/constants/admin.ts
- src/components/Header.tsx
- src/components/Header.module.css
- src/pages/Dictionaries.tsx
- src/pages/DictionaryDetail.tsx
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- tasks/review/TASK-030-add-client-admin-role-mode.md

Checks Run:
- `npm run build`: passed. Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ADMIN_EMAILS|constants/admin" src`: passed, no matches.
- Static verification: signed-out state resets `userProfile` to null and derives `isAdmin=false`; profile `role: "admin"` or `isAdmin: true` derives `isAdmin=true`; non-admin profiles do not show the admin badge.
- Manual browser visual QA: not run; delegated to Lead Review per task allowance.

Notes:
- `AuthContext` now exposes `userProfile`, `isAdmin`, and `isTeacher`, loading `users/{uid}/profile` from Realtime Database after auth state changes.
- Admin UI decisions in `Dictionaries.tsx` and `DictionaryDetail.tsx` now use `isAdmin` from `useAuth()` instead of email lists.
- Header now shows a small localized admin badge for admin users on desktop and mobile.
- Removed the old hardcoded `ADMIN_EMAILS` module because it is no longer needed.
- Did not add role management UI, an admin panel, dependencies, Firebase rules, custom claims, or server-side behavior.
- Process conflict noted: this task lists `tasks/review/*` as forbidden, but `PROCESS.md` requires moving completed tasks to `tasks/review/`. I followed `PROCESS.md`.

## Lead Review

Status: accepted

Review Notes:
- Accepted. `AuthContext` now reads `users/{uid}/profile` and exposes `userProfile`, `isAdmin`, and `isTeacher`.
- Confirmed `isAdmin` derives from `profile.role === "admin"` or `profile.isAdmin === true`, and signed-out state resets profile/admin state.
- Confirmed dictionary publish/edit UI now uses `isAdmin` from `useAuth()` instead of the old email allowlist.
- Confirmed the hardcoded `ADMIN_EMAILS` module is no longer imported or used.
- Confirmed header admin badge is localized and only rendered for signed-in admin users.

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `rg -n "ADMIN_EMAILS|constants/admin" src`: passed with no matches.

Risk Notes:
- This is client UI role foundation only; Firebase rules/custom claims are still a separate future task.
