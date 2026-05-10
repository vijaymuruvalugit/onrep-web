# OnRep web — design system (coach shell)

This document ties UI tokens to code locations. It complements `BrandGuide/` and `src/scss/_onrep-variables.scss`.

## Layout

- **Operational column:** `.onrep-content-column` caps width at **1240px**, centered (`AppContent.jsx`).
- **Canvas:** `body` uses `--onrep-canvas` (muted blue-gray) instead of flat bootstrap gray (`style.scss`, `_onrep-surfaces.scss`).

## Surface levels

| Level | Class helpers | Use |
|-------|----------------|-----|
| **A** | `.onrep-surface-a`, `.onrep-surface-a--accent` | Next session, upcoming blocks, primary operational cards |
| **B** | `.onrep-surface-b` | Supporting lists, batch tiles, attendance shell |
| **C** | `.onrep-surface-c` | Pattern builder / “more actions” — lowest emphasis |

Shadows: `--onrep-shadow-sm|md|lg`; radii: `--onrep-radius-md|lg`.

## Typography utilities

- `.onrep-type-label` — eyebrow / section label (uppercase, tracked).
- `.onrep-type-hero` — primary operational line (session time span).
- `.onrep-type-meta` / `.onrep-type-muted` — supporting copy.

## Navigation

- Sidebar active item: inset **4px** accent bar + stronger wash (`onrep-theme.scss`).
- Activity accent drives `--onrep-hero-accent` (`_onrep-activity-themes.scss`, `ActivityThemeSync.jsx`).

## Activity personality

`document.documentElement` receives `data-onrep-activity` = `skating` | `music` | `yoga` | `default` (see `activityTheme.js`). CSS maps each to a distinct `--onrep-hero-accent` for surfaces, attendance “today” panel, and hero cards without branching React trees.

## Display hygiene

`stripDemoSuffix` / `sanitizeStudentNotesForDisplay` (`batchDisplayUtils.js`) strip internal demo markers so **“seed”** never appears in coach/parent UI.

## When extending a new vertical

1. Add type handling in `resolveActivityThemeKey` (`activityTheme.js`).
2. Add `:root[data-onrep-activity="…"]` block in `_onrep-activity-themes.scss`.
3. Register the type in `@onrep/contracts` when the API supports it.
