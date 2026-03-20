# Canonical Table And True Modal Design

**Date:** 2026-03-20

**Goal:** Close the two remaining review blockers on `feat/poker-os-polish` by replacing the hand-tuned tournament table anchors with a truly canonical symmetric `9-max` model and by upgrading room surfaces to real modal behavior.

## Why This Design Exists

The final branch review found two important gaps:

1. the current `9-max` table is still geometry-by-tuning, not geometry-by-contract
2. `Modal` and `RoomPanelSheet` advertise modal semantics without actually trapping focus or isolating the background

Those are not polish nits. They sit in the center of the branch promise:

- one stable real tournament table across counts and viewports
- one controlled single-screen terminal with trustworthy dialog behavior

## Product Decision

This pass does **not** introduce another table family or another dialog system.

Instead it hardens the existing direction:

- one canonical symmetric `9-max` table model
- one shared modal behavior layer for create-room and room support sheets

## Chosen Direction

Three approaches were considered:

1. patch the current hand-tuned anchors and add a minimal keydown loop
2. create a canonical normalized seat model and a shared true-modal hook
3. replace the current modal surfaces with a third-party primitive library

Approach 2 is the chosen direction because it fixes both review findings without adding a new dependency stack or reopening the entire room shell architecture.

## Canonical Table Geometry

The current table anchors are explicit, but still hand-shaped around known screenshots. That is not stable enough.

The new model defines one canonical `9-slot` seat map in normalized coordinates.

### Canonical Slots

The table keeps these semantic slots:

- `hero`
- `lower-left`
- `left-lower`
- `left-upper`
- `top`
- `right-upper`
- `right-lower`
- `lower-right`
- `near-hero-right`

The exact labels are less important than the contract:

- left and right sides are true mirrors
- hero stays anchored at the bottom
- `2-9` players are occupancy selections from this single model

### Geometry Model

The canonical slots are stored as normalized coordinates relative to the active table footprint:

- desktop: horizontal tournament capsule
- phone portrait: vertical tournament capsule

This means:

- anchor placement scales with the current table footprint
- anchor symmetry is checked by test
- short-height layouts still derive from the same geometry instead of introducing a second bespoke table

### Occupancy Model

Player counts remain explicit selections from the canonical map:

- `2`: hero + top
- `3`: hero + left-upper + right-upper
- `4`: hero + left-lower + top + right-lower
- `5`: hero + lower-left + left-upper + right-upper + lower-right
- `6`: hero + lower-left + left-upper + top + right-upper + lower-right
- `7-9`: continue filling the remaining canonical slots

The implementation may refine which symmetric pair is used first, but it must remain mirrored and testable.

## True Modal Contract

`CreateRoomModal` and `RoomPanelSheet` will both be treated as **true modal** surfaces.

That contract includes:

- `role="dialog"`
- `aria-modal="true"`
- labelled headers
- focus moved into the surface on open
- `Tab` and `Shift+Tab` trapped inside the surface
- background root made inert while the surface is open
- previous focus restored on close
- Escape dismissal where the surface already supports it

This is not just for accessibility. It prevents the single-screen terminal from leaking interaction to the obscured page behind a modal surface.

## Shared Modal Behavior Layer

The behavior should live in a shared helper or hook rather than being duplicated in both components.

That layer will own:

- active element capture
- focus target selection
- focus trap loop
- inert / `aria-hidden` toggling for the application root
- cleanup on close

`Modal` and `RoomPanelSheet` should become thin consumers of the same behavior contract.

## Testing Strategy

### Canonical Table

Automated tests must verify:

- left/right anchor symmetry on desktop and phone models
- `2`, `6`, and `9` player occupancy still produce zero table-body and stage-band overlap
- hero anchor remains stable

### True Modal

Automated tests must verify:

- `Tab` stays inside the modal/sheet
- the app root becomes inert while the surface is open
- focus returns after close

If the current test stack makes this awkward, the tests should still validate runtime behavior rather than only regex-matching component source.

### Final Verification

After implementation:

- rerun focused client tests
- rerun `client` build
- rerun full `server` tests
- if needed, perform one browser spot check for create-room + room sheet keyboard behavior

## Non-Goals

- no gameplay rule changes
- no server protocol changes
- no new modal library
- no table-family redesign
- no Canvas/WebGL migration

## Success Criteria

This follow-up is complete only when:

1. the canonical `9-max` table anchors are symmetric and footprint-derived
2. `2-9` player occupancy is still driven by one table family
3. short-height layouts still pass geometry checks
4. modal surfaces truly isolate focus and background interaction
5. tests validate runtime behavior instead of only source shape where practical
6. final verification is green again
