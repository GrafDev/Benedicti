---
name: flutter-architect
description: Expert guidance on Flutter architecture, state management, and cross-platform best practices. Use this skill when setting up a new Flutter project, designing feature modules, implementing state management (Riverpod/Bloc), or resolving complex UI/Logic separation issues.
---

# Flutter Architect

## Overview

This skill provides architectural patterns and best practices for building scalable, testable, and maintainable Flutter applications. It focuses on Clean Architecture and effective state management.

## Core Capabilities

### 1. Project Structure (Clean Architecture)

Organize code by features, not layers.

```
lib/
├── src/
│   ├── features/
│   │   ├── authentication/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   └── dictionary/
│   ├── common/
│   │   ├── constants/
│   │   ├── widgets/
│   │   └── utils/
│   ├── routing/
│   └── main.dart
```

### 2. State Management (Riverpod)

Use Riverpod for dependency injection and state management.

- **Providers**: Use `g.dart` (riverpod_generator) for type safety.
- **Controllers**: Use `AsyncNotifier` for async state logic.
- **UI**: Consume state with `ConsumerWidget` or `Ref.watch`.

### 3. Cross-Platform Responsive Design

- Use `LayoutBuilder` for adaptive layouts.
- Abstract platform-specific logic into separate services/repositories.
- Use `gap` package for spacing instead of `SizedBox`.

## When to Use

- **New Feature**: When adding a new domain (e.g., "Add User Profile"), engage this skill to plan the folder structure and data flow.
- **Refactoring**: When code becomes spaghetti, use this to separate UI from Logic.
- **Performance**: When app jank occurs, use this to optimize build methods and state rebuilds.
