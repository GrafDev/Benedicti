# Task: remove raw HTML from home title

## ID

TASK-001

## Role

builder-code

## Goal

Render the home page title without `dangerouslySetInnerHTML` while preserving the styled user name.

## Allowed Files

- src/pages/Home.tsx
- src/i18n/locales/en.ts
- src/i18n/locales/ru.ts

## Forbidden Files

- src/components/MigrationManager.tsx
- src/pages/DictSaber.tsx
- vite.config.ts
- package.json

## Acceptance Criteria

- `src/pages/Home.tsx` no longer uses `dangerouslySetInnerHTML`.
- User display name/email-derived name is rendered as text, not injected HTML.
- The highlighted name keeps the existing visual style.
- Russian and English home title text still read naturally.

## Checks

- `npm run build`
- `npm run lint` or document remaining pre-existing lint failures in the Builder Report.

## Notes

This came from the initial project review. Treat it as a security hardening task, not a redesign.

## Builder Report

Status: completed

Changed Files:
- src/pages/Home.tsx
- src/i18n/locales/en.ts
- src/i18n/locales/ru.ts

Checks Run:
- `npm run build`: passed
- `npm run lint`: failed due to pre-existing global lint issues, including `no-explicit-any`, React hook purity/static component warnings, and unrelated errors across files such as `src/components/AuthModal.tsx`, `src/components/Header.tsx`, `src/pages/DictSaber.tsx`, `src/pages/NBack.tsx`, and `src/stores/useDictionaryStore.ts`
- `npx eslint src/pages/Home.tsx src/i18n/locales/en.ts src/i18n/locales/ru.ts`: failed due to pre-existing issues in `src/pages/Home.tsx` around synchronous `setState` in an effect, existing `any` usage, and the existing inline `StatCard` component

Notes:
- Removed the raw HTML title template from locale strings and render the highlighted user name as React text content inside the existing `styles.sovereign` span.

## Lead Review

Status: accepted

Notes:
- Verified that `Home.tsx` no longer uses `dangerouslySetInnerHTML`.
- Verified that the user name is rendered as React text inside the existing highlighted span.
- `npm run build` passes.
- Global lint remains red from pre-existing unrelated issues, as documented by the Builder Report.
