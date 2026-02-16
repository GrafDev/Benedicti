---
name: pwa-spa-engineering
description: Expert guide for the frontend architecture. Use this skill for Vite configuration, Service Workers, Offline support, Routing, and UI Component standards.
---

# PWA & SPA Engineering

This skill governs the client-side architecture of the application.

## Tech Stack Definitions

*   **Framework**: React (or pure Vanilla JS if extremely lightweight is preferred, but React recommended for complex state). *Assuming React based on complexity of 'router' and 'state'.*
*   **Build Tool**: Vite.
*   **Styling**: Tailwind CSS (Mobile-first utility classes).

## Architecture

### Directory Structure
```
src/
├── components/      # Reusable UI (Buttons, Cards, Inputs)
├── contexts/        # React Context (AuthContext, ThemeContext)
├── hooks/           # Custom hooks (useDictionary, useGameLoop)
├── pages/           # Route views (Home, Dictionary, Game)
├── services/        # Firebase wrappers
├── main.jsx         # Entry point
└── App.jsx          # Root component & Routing
```

## Progressive Web App (PWA) Features

### Manifest (`manifest.json`)
Critical for "Add to Home Screen" (A2HS).
*   `display`: `standalone` (Removes browser UI).
*   `background_color`: `#ffffff` (or dark theme color).
*   `theme_color`: matches header color.
*   `icons`: Must include safe area maskable icons.

### Service Worker (`sw.js`)
*   **Strategy**: `Stale-While-Revalidate` for API data (dictionaries), `Cache-First` for assets (fonts, images).
*   **Offline Mode**:
    *   Detect network status (`navigator.onLine`).
    *   If offline, read dictionaries from `localStorage` or `IndexedDB` (synced previously).
    *   Queue SRS updates in `IndexedDB` to sync when online.

## Router Configuration
*   `/`: Dashboard (My Dictionaries, Daily Goal).
*   `/auth`: Login/Signup.
*   `/dict/:id`: View specific dictionary.
*   `/play/:mode/:dictId`: Game session (e.g., `/play/match/dict_123`).
*   `/profile`: User settings.

## UX & Accessibility
*   **Touch Targets**: Minimum 44x44px for all buttons.
*   **Feedback**: Visual feedback on every tap (ripple or scale).
*   **Transitions**: Use `framer-motion` or CSS transitions for page slides.
