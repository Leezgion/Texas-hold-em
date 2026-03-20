# Broadcast Tactical Density Pass Design

**Date:** 2026-03-20
**Branch:** `feat/poker-os-polish`

## Goal

Tighten the `Broadcast Tactical` room and create-room surfaces so the product reads like a professional poker terminal instead of a tall web page. The pass should increase information efficiency, reduce dead spacing, and keep the real-table visual identity intact on desktop and phone portrait.

## Product Principles

This pass optimizes for information efficiency, not raw information volume.

- `P0` information must stay visible without scrolling:
  - hero hand
  - `to call`
  - `pot`
  - `effective stack`
  - primary action buttons
  - current-turn cue
- `P1` information stays visible but tighter:
  - seat/position
  - blind/button markers
  - current bet
  - `folded / all-in / waiting next hand / disconnected`
- `P2` information moves into secondary surfaces:
  - full roster details
  - long history narratives
  - room tools and advanced settings

The design must remove wasted space before it removes readability. We are allowed to compress labels, padding, and duplicated metadata, but we are not allowed to shrink touch targets, card legibility, or the board/pot reading order.

## Room Surface Strategy

The room stays a single-screen poker terminal.

### Desktop

- Keep `Status Spine`, `Table Stage`, and `Hero Dock` co-visible.
- Reduce vertical gaps between header, table, and dock.
- Tighten the support-surface launchers so they stop reading like a secondary toolbar.
- Keep the broadcast table dominant, but reclaim empty margins around the center shell and plaque ring.

### Phone Portrait

- Keep the page locked to one screen.
- Table and dock remain the only always-visible surfaces.
- `Roster / Hand Tape / Room` stay in sheets, but their trigger bar becomes denser and more compact.
- Avoid nested scroll fights and avoid any styling that makes the page feel sticky or sluggish.

## Create-Room Surface Strategy

The create-room flow remains profile-first, but the modal must stop wasting vertical space.

- The `club / pro / study` chooser should read as compact selection tiles, not tall feature cards.
- The modal header and footer stay fixed.
- The body becomes denser:
  - tighter tile height
  - shorter descriptive copy
  - reduced decorative gaps
  - product-styled scrollbar
- Phone keeps the full-screen sheet model, but avoids long dead zones between sections.

## Table Stage Density Rules

The table keeps the `broadcast-tactical-9max` family.

- Do not reintroduce HUD-like clutter in the center.
- Keep the board first, pot second, street/status third.
- Reduce extra padding around the board tray and pot capsule.
- Seat plaques should feel embedded and efficient, not oversized floating cards.
- Hero plaque remains slightly richer than other seats, but the family must stay consistent.

## Hero Dock Density Rules

The dock stays table-coupled, but becomes more cockpit-like.

- Keep 44px touch targets.
- Reduce redundant headings and label repetition.
- Tighten spacing between stats, quick actions, and primary controls.
- Error and pending feedback must stay close to the action frame without causing layout jumps.
- Phone dock height should remain bounded and stable.

## Copy Rules

- Prefer short labels and numbers over sentences.
- Keep Chinese labels to 2-4 characters when possible.
- Reuse one fixed term for each state.
- Remove decorative or explanatory copy from live-play surfaces if it does not change a decision.

## Validation

Every batch in this pass must verify:

- client targeted tests
- client build
- at least one desktop screenshot
- at least one phone portrait screenshot

Browser checks must confirm:

- no page-scroll fight
- table, dock, and current-turn cue remain co-visible
- create-room tiles stay horizontal and readable
- phone sheet interaction does not push the page into a long scroller

## Out of Scope

- gameplay rule changes
- server behavior changes
- new analytics or study tooling
- card-sound or extra delight effects
- canvas/webgl table rendering
