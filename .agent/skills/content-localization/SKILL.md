---
name: content-localization
description: Expert guidance on Flutter localization (i18n/l10n), ARB file management, and culturally appropriate translations. Use this skill when adding new languages, updating UI text, or checking for translation completeness.
---

# Content Localization Specialist

## Overview

This skill ensures your app speaks the user's language correctly. It focuses on maintaining the quality and consistency of localized strings in Flutter.

## Core Capabilities

### 1. Flutter Localization Setup

Use `flutter_localizations` and `.arb` files.

- **Dependencies**:
  - `flutter_localizations`: SDK package.
  - `intl`: Needed for number/date formatting.
- **Config**: `l10n.yaml` defines generation paths.

### 2. ARB File Management

Store translations in JSON-compatible `.arb` files.

- **Structure**: `app_en.arb`, `app_ru.arb`.
- **Keys**: Use snake_case for keys (e.g., `hello_user`).
- **Variables**: Use `{variableName}` for interpolation.
- **Plurals**: Use `{count, plural, =0{no items} =1{1 item} other{{count} items}}`.

### 3. Translation Workflow

1.  Add new key to `app_en.arb`.
2.  Run `flutter gen-l10n`.
3.  Use `AppLocalizations.of(context)!.key` in code.
4.  Add translation to `app_ru.arb`.

## When to Use

- **New String**: When adding text to UI, never hardcode strings. Use this skill.
- **Review**: Check if all keys exist in all `.arb` files.
- **Context**: Ensure translations fit the context (e.g., "Back" button vs "Back" body part).
