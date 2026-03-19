# Tailwind 4.2.2 Migration Design

**Date:** 2026-03-19

**Goal:** Upgrade the client styling pipeline from Tailwind CSS 3.x to Tailwind CSS 4.2.2 before continuing the Tactical Arena UI rebuild, while preserving the current React/Vite app behavior and keeping browser support limited to modern engines only.

## Why This Comes First

The current client is no longer a light utility-only Tailwind app.

It now combines:

- Tailwind utility classes for layout and spacing
- a large `client/src/index.css` token layer
- many semantic component classes for the poker shell, rails, table stage, and seat system
- responsive layout rules that are sensitive to Tailwind scanning behavior

This means continuing large UI work on Tailwind 3 would push more presentation logic onto an older build model, then force a second disruptive styling migration later.

The migration should happen now, before the next round of:

- table layout tuning
- seat ring geometry tuning
- motion and animation layering
- SVG / richer visual shell work

## Current Project Context

The client currently uses:

- `tailwindcss` 3.x
- PostCSS plugin wiring through `tailwindcss` + `autoprefixer`
- `@tailwind base/components/utilities` in `client/src/index.css`
- Vite 4 with `@vitejs/plugin-react`

The project does **not** need to support older browsers, so the Tailwind 4 browser baseline is acceptable.

## Non-Goals

- no React major upgrade in this task
- no Vite major upgrade in this task
- no new gameplay rules
- no broad UI redesign beyond what is required to keep the migrated pipeline rendering correctly
- no introduction of Canvas as the main table-rendering layer during this migration

## Recommended Technical Direction

### Chosen Approach

Use **Tailwind 4.2.2 with `@tailwindcss/postcss`** for this migration pass.

Keep:

- React 18
- Vite 4
- the current semantic CSS architecture

Change:

- Tailwind package family to `4.2.2`
- CSS entrypoint from `@tailwind ...` directives to Tailwind 4 import syntax
- PostCSS config so it uses the Tailwind 4 PostCSS plugin
- keep `tailwind.config.js` loaded explicitly through `@config` for compatibility
- defer the Tailwind Vite plugin until a later Vite major upgrade

### Why Not `@tailwindcss/vite` Yet

The project is already Vite-based, and the Tailwind Vite plugin would normally be the preferred integration path.

However, in this repository the current client is still on Vite 4, and `@tailwindcss/vite@4.2.2` requires Vite `^5.2.0 || ^6 || ^7 || ^8`.

That means using the Vite plugin would force a Vite major upgrade in the same task.

For this migration, that is unnecessary risk. The safer path is:

- upgrade Tailwind to `4.2.2`
- use `@tailwindcss/postcss`
- keep Vite 4 stable
- revisit the dedicated Vite plugin later in a separate toolchain task

## Render Stack Decision

This migration does **not** change the core rendering model.

After migration, the preferred rendering stack remains:

- **Tailwind** for layout, spacing, breakpoints, utility-level composition
- **semantic CSS + CSS variables** for the shell, table stage, seat plaques, rails, and themes
- **DOM/CSS** for the primary interaction layer
- **SVG** later for table geometry, rails, markers, and decorative structural graphics
- **motion library** later for controlled sequencing and transitions
- **Canvas** only as an optional atmosphere layer, not as the primary UI rendering layer

This migration should make that future architecture easier, not change it now.

## Key Migration Risks

### 1. Tailwind 4 entrypoint changes

The current CSS begins with:

- `@tailwind base;`
- `@tailwind components;`
- `@tailwind utilities;`

Tailwind 4 uses a different import model. The migration must update the stylesheet entrypoint carefully without breaking the existing `@layer` organization.

### 2. Plugin wiring changes

The current `postcss.config.js` still wires Tailwind the Tailwind 3 way.

If only the dependency versions are bumped and the integration is not migrated correctly, the app can build with missing classes, stale layers, or partially applied styles.

### 3. Dynamic-class fragility

The recent layout bug proved that dynamic class construction is already a sharp edge in this codebase.

Tailwind 4 migration should include a fast audit of:

- dynamically assembled class names
- classes that depend on scanning
- styles that must remain semantic CSS instead of Tailwind-generated utility output

### 4. Visual regressions in the Tactical Arena shell

The client now depends heavily on:

- custom shell panels
- custom rail cards
- table stage state classes
- responsive layout classes

So migration success is not just “build passes”. It must also preserve:

- mode gateway rendering
- room shell rendering
- table stage rendering
- mobile portrait rendering

## Migration Strategy

### Phase 1: Pipeline Migration

- update Tailwind packages to `4.2.2`
- add `@tailwindcss/vite`
- update CSS entrypoint syntax
- simplify Tailwind/PostCSS wiring
- keep the rest of the app untouched as much as possible

### Phase 2: Compatibility Audit

- run client tests
- run build
- verify that the current semantic classes still render
- verify no missing utility output from Tailwind scanning

### Phase 3: Visual Regression Sweep

Run fresh browser checks for:

- mode gateway
- room page at `1280px`
- room page at phone portrait width
- current outstanding Tactical Arena shell regressions

If migration introduces any new style breakage, stop and fix migration-specific regressions before resuming new UI work.

## Success Criteria

The migration is complete only if all of the following are true:

- client dependencies are on Tailwind `4.2.2`
- client dev server starts successfully
- client build passes
- targeted client tests pass
- the mode gateway still renders correctly
- the room shell still renders in modern browsers
- no new missing-style regressions are introduced by Tailwind scanning or plugin changes

## Follow-On Work

Once this migration is stable, the next front-end tasks should resume in this order:

1. finish Tactical Arena layout fixes
2. refine phone / tablet responsive behavior
3. introduce SVG structural graphics where useful
4. add a motion library for card / spotlight / settlement transitions
