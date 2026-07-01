# Task: Use map image as Match Pairs realm field background

## ID

TASK-062

## Role

builder-code

## Goal

Use the provided fantasy map image as the filled background for the Match Pairs realm map field, so the realm board looks like land/terrain behind the hex grid instead of a flat dark panel.

## Allowed Files

- public/assets/match-pairs/realm-board-background.png
- src/pages/MatchPairs.module.css
- tasks/todo/TASK-062-use-map-image-as-realm-field-background.md
- tasks/review/TASK-062-use-map-image-as-realm-field-background.md
- tasks/done/TASK-062-use-map-image-as-realm-field-background.md

## Forbidden Files

- src/pages/MatchPairs.tsx
- src/i18n/locales/ru.ts
- src/i18n/locales/en.ts
- database.rules.json
- firebase.json
- package.json
- package-lock.json
- src/stores/useDictionaryStore.ts
- src/contexts/AuthContext.tsx
- src/pages/Profile.tsx

## Acceptance Criteria

- Save/replace `public/assets/match-pairs/realm-board-background.png` with the provided image from:
  `/var/folders/qz/8x88vz0d74d5s0hdtqt6rpd00000gn/T/codex-clipboard-39b8585a-1e4f-4237-8a91-5b7ef650e9ac.png`
- The realm map field is filled by this image.
- The image should cover/fill the realm field without visible tiling or empty gaps.
- The image should be centered and sized so it reads as the terrain behind the realm, not as a small repeated texture.
- Keep a dark/blue overlay or vignette as needed so hex cells, territory colors, castle badges, and controls remain readable.
- The background must stay inside the realm map field/viewport and must not affect the global page background or gameplay card screen.
- Preserve all current realm mechanics and UI behavior: live-sync, Emperor/deposed status, owner colors, castle-cell protection, pan/zoom, tablet layout, popup behavior, player list, rank gating, and conquest logic.
- No playable Emperor rank, edge-hover pan, old fixed viewport shuffle overlay, or non-current `matchPairsProgress` reads are reintroduced.

## Checks

- Run `npm run build`.
- Run `git diff --check`.
- Run `file public/assets/match-pairs/realm-board-background.png` and confirm it is a PNG image.
- Run `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx` and confirm no playable Emperor/rank logic is reintroduced.
- Run `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx` and confirm there is no non-current participant progress read. Existing current-user paths are OK.
- Run `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css` and confirm no matches.
- Do not perform visual/browser QA; Lead/user will check visuals locally.

## Notes

- User request: "Сделай фон у поля с реалмом вот этой картинкой заполненым."
- Current `public/assets/match-pairs/realm-board-background.png` exists but differs from the attached image; use the attached image path above as the source of truth.
- Prefer CSS background layers on `.realmMapPanel`, `.realmViewport`, or `.realmWorldBackdrop`, whichever keeps pan/zoom behavior stable and the terrain visually fixed behind the hex map.

## Builder Report

Status: completed

Changed Files:
- public/assets/match-pairs/realm-board-background.png
- src/pages/MatchPairs.module.css
- tasks/review/TASK-062-use-map-image-as-realm-field-background.md

Checks Run:
- `npm run build`
- `git diff --check`
- `file public/assets/match-pairs/realm-board-background.png`
- `rg -n "id: 'emperor'|rankId: 'emperor'|rankId === 'emperor'|effectivePerfectRanks\\.emperor" src/pages/MatchPairs.tsx`
- `rg -n "users/\\$\\{uid\\}/matchPairsProgress|matchPairsProgress/\\$\\{activeDictId\\}" src/pages/MatchPairs.tsx`
- `rg -n "REALM_EDGE_PAN|realmEdgeVelocityRef|realmAnimationFrameRef|runRealmEdgePan|startRealmEdgePan|stopRealmEdgePan|handleRealmMouseMove|onMouseMove|onMouseLeave|position: fixed|answerShuffleOverlay|answerShuffleClone|fly-x|fly-y" src/pages/MatchPairs.tsx src/pages/MatchPairs.module.css`

Notes:
- Replaced `public/assets/match-pairs/realm-board-background.png` with the provided source image from `/var/folders/qz/8x88vz0d74d5s0hdtqt6rpd00000gn/T/codex-clipboard-39b8585a-1e4f-4237-8a91-5b7ef650e9ac.png`.
- Confirmed the copied target hash matches the provided source image hash: `91f1e7605c9bc4c0b1ba04e6e3010034b0ba94b339a62c1d25062cbfd4c8e937`.
- Added the realm board image as a centered, cover/no-repeat CSS background layer on `.realmWorldBackdrop`, keeping it scoped inside the realm map world/viewport.
- Preserved dark overlay/vignette layers above the image so hexes, territory colors, badges, popup, and controls remain readable.
- Did not touch `src/pages/MatchPairs.tsx` or any realm/gameplay mechanics.
- `file` confirms the target is a PNG image: 1448 x 1086, 8-bit/color RGB, non-interlaced.
- `npm run build` passed with the existing Vite large chunk warning.
- No visual/browser QA was performed; Lead/user will check locally.

## Lead Review

Status: accepted

Reviewed Files:
- public/assets/match-pairs/realm-board-background.png
- src/pages/MatchPairs.module.css
- tasks/review/TASK-062-use-map-image-as-realm-field-background.md

Checks Run:
- `npm run build`: passed; Vite reported the existing large chunk warning.
- `git diff --check`: passed.
- `file public/assets/match-pairs/realm-board-background.png`: passed; PNG image data, 1448 x 1086.
- SHA-256 target/source comparison: passed; target matches the provided clipboard image.
- Playable Emperor / progress / edge-hover pan / old fixed overlay `rg` checks: passed with no matches.

Acceptance Notes:
- The provided map image is now saved as `public/assets/match-pairs/realm-board-background.png`.
- `.realmWorldBackdrop` uses the image as a centered cover/no-repeat background layer.
- Dark overlay/vignette layers remain above the image for map readability.
- The background is scoped to the realm map world/viewport and does not affect global/gameplay backgrounds.
- No `MatchPairs.tsx` or realm/game mechanics were changed.

Visual QA:
- Not performed by Lead per user process; user will verify locally.
