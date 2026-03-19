# Unified 9-Max Tournament Table Design

## Goal

Replace the current mixed seat-ring/table-profile approach with a single real-table model that keeps one consistent tournament-style capsule table across every supported player count and across desktop and phone portrait.

## Problem

The current room UI still mixes three different ideas:

1. the table profile changes by viewport
2. the seat geometry changes by player count
3. unsupported counts fall back to a generic ellipse

That produces the wrong product behavior:

- `2-9` players do not feel like they are seated at the same table
- `7-10` players regress into generic geometry instead of a real poker table
- seat anchors and hero placement drift between counts
- phone portrait behaves like a different table instead of the same table rotated into a portrait-friendly view

For a realistic poker product, the table itself must stay semantically stable. Real poker tournaments do not swap the whole table shape when the player count changes. Empty seats remain part of the same table.

## Product Decision

The canonical visual model is now:

- one `9-max` tournament capsule table
- one consistent seat-anchor system
- one consistent board tray and pot zone
- one consistent marker orbit
- one consistent hero seat

`2-9` player rooms will be rendered by selecting which seat anchors are occupied on that same table. The table does not change shape.

Phone portrait is allowed to rotate into a vertical capsule orientation, but it is still the same table from the same product family, not a separate table design.

## Design Principles

### 1. One Table, Many Occupancy States

The table is not generated from player count. Player count only determines which standard seat anchors are active.

### 2. Stable Hero Perspective

The hero seat must be stable:

- desktop: bottom-center anchor
- phone portrait: bottom anchor adjacent to the hero dock

The hero seat never drifts because the room went from 6 players to 4 players.

### 3. Explicit Geometry Beats Runtime Guessing

Seat positions must come from explicit anchor maps, not a runtime trigonometric fallback. The current ellipse fallback is exactly what caused full-ring regressions and inconsistent hero anchoring.

### 4. SVG Owns Table Truth

The table body, felt, tray, orbit, and seat-guide anchors should be driven by SVG geometry, not by Tailwind utility composition. DOM remains the interaction layer on top.

### 5. Single-Screen Terminal Still Applies

The room remains a single-screen poker terminal:

- status spine
- real table stage
- always-visible hero dock
- support surfaces in sheet/panel form

The new table model replaces the geometry system, not the single-screen room concept.

## Standard Table Model

The new canonical table is `Tournament Capsule 9-max`.

It contains these fixed semantic zones:

- `outerRail`
- `feltBody`
- `boardTray`
- `potZone`
- `markerOrbit`
- `seatAnchors[9]`

Those zones exist on both desktop and phone portrait. Phone portrait rotates the table family into a vertical composition, but preserves the same semantic map.

## Seat Anchor Model

We will define two explicit coordinate sets:

- `desktop9MaxAnchors`
- `phonePortrait9MaxAnchors`

Each set contains 9 fixed anchor records with:

- `seatIndex`
- `x`
- `y`
- `anchorRole`
- `anchorZone`
- `labelOffset`
- optional marker offset hints

`anchorRole` will describe semantic locations like:

- `hero`
- `lower-left`
- `upper-left`
- `top-left`
- `top-center`
- `top-right`
- `upper-right`
- `lower-right`
- `near-hero-right`

The exact labels can be refined during implementation, but the coordinates must be explicit and stable.

## Player-Count Occupancy Mapping

We will no longer synthesize seat layouts from count. Instead we will explicitly choose active anchors from the 9-max table.

For example:

- `2 players`: hero + top-center
- `3 players`: hero + upper-left + upper-right
- `4 players`: hero + lower-left + top-center + lower-right
- `5 players`: hero + lower-left + upper-left + upper-right + lower-right
- `6 players`: hero + lower-left + upper-left + top-center + upper-right + lower-right
- `7-9 players`: continue filling the remaining canonical anchors

The exact seat-selection map should be codified as product data and covered by tests. The implementation must not fall back to “draw another ring”.

## Desktop vs Phone Portrait

### Desktop

- horizontal capsule table
- hero seat at bottom center
- opponent seats distributed around the rail in tournament style
- board tray centered
- pot zone above board tray

### Phone Portrait

- vertical capsule table from the same table family
- hero seat anchored just above the hero dock
- top opponent anchors compressed into the upper half
- board tray and pot zone remain in the table core

The phone version is not a different table type. It is the same table language adapted to portrait ergonomics.

## Rendering Architecture

### SVG Layer

SVG becomes the source of truth for:

- outer rail
- felt body
- tray shell
- marker orbit
- seat guides
- decorative table framing

### DOM Layer

DOM remains responsible for:

- `SeatCard`
- `EmptySeat`
- blind/button markers
- turn emphasis
- settlement overlay
- hero dock
- support sheets and rails

### Motion Layer

`motion/react` remains responsible for:

- turn emphasis
- pot and cue transitions
- settlement sequencing
- sheet/panel reveal

The new geometry work should not move interaction into canvas.

## Viewport Policy Correction

The previous viewport helper is too width-centric. The design now requires a second constraint:

- short-height windows must not hard-lock the stage into collapse

This means the room viewport policy must become height-aware. If the available height cannot sustain:

- status spine
- table stage
- hero dock

then the layout must switch to a reduced-height terminal policy instead of pretending the full single-screen budget still exists.

This is a UI/UX requirement, not a secondary engineering improvement.

## Accessibility Expectations

The modal and support sheet redesign introduced stronger visual surfaces but not yet full dialog semantics. The final implementation should also treat the new create-room panel and room sheets as real dialogs with:

- `role="dialog"`
- `aria-modal`
- labelled headers
- Escape dismissal where appropriate
- basic focus management

This is not the centerpiece of the geometry redesign, but it is part of the production-quality room shell.

## Non-Goals For This Pass

- no gameplay-rule rewrite
- no server protocol change
- no canvas/WebGL rewrite of the interactive room
- no forced removal of support for `7-9` players
- no separate table type per player count

## Acceptance Criteria

The redesign is only acceptable when all of the following are true:

1. `2-9` player rooms render from the same canonical table family.
2. There is no seat-layout fallback that invents a different ring geometry.
3. Desktop and phone portrait both preserve stable hero positioning.
4. `7-9` players no longer collide with the table body or stage band.
5. Short-height windows do not collapse the table stage into unusable height.
6. The room still behaves as a single-screen poker terminal for supported viewport budgets.
7. Browser evidence is captured for desktop, phone portrait, and at least one short-height viewport.

## Recommended Technical Direction

Proceed with:

- `SVG + DOM + Motion`
- explicit `9-max` anchor maps
- explicit `2-9` occupancy maps
- height-aware viewport policy

Do not continue evolving the current player-count-driven ellipse fallback.
