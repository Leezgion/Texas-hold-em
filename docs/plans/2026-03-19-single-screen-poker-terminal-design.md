# Single-Screen Poker Terminal Design

**Date:** 2026-03-19

**Goal:** Replace the current long-page room experience with a true single-screen poker terminal that keeps the table, hero cards, and action controls visible together on both desktop and phone portrait while also fixing the create-room modal structure.

## Why This Design Exists

Fresh operator feedback and screenshots exposed five structural failures in the current Tactical Arena UI:

- the create-room modal is oversized, scroll-heavy, and allows mode cards to collapse into unreadable vertical Chinese text
- the table still reads like a circular HUD instead of a real Hold'em table
- upper seats can overlap the table information band and stage chrome
- the room page still behaves like a long web page instead of a poker terminal
- phone portrait relies on page scrolling for decision-critical surfaces and feels sluggish

These are not visual polish issues. They are layout-model failures.

## Product Intent

The room page should behave like a focused poker decision terminal:

- the user should not need vertical page scrolling to complete a hand
- the table state and hero actions must share one viewport
- auxiliary information must be secondary and intentionally opened
- the same gameplay model must continue to power `club`, `pro`, and `study`

## Non-Goals

- no server gameplay rule changes
- no hidden-information or solver features
- no separate client apps per mode
- no persistence, deployment, or CI work
- no attempt to make phone portrait mirror desktop geometry

## Chosen Direction

This design replaces the current room-page composition with a **single-screen Poker Terminal**.

Three approaches were considered:

1. patch the current layout in place
2. rebuild the room page as a single-screen terminal while preserving the existing gameplay model
3. move further toward a game-client shell with many full-screen panels

Approach 2 is the chosen direction because it fixes the current structural failures without discarding the existing state model and hardened interaction flows.

## Core Layout Principles

### One Viewport, One Hand

During live play, one viewport must always contain:

- current table state
- hero hole cards
- action controls

The product must stop depending on page scrolling to move between those three surfaces.

### Auxiliary Information Is Secondary

Detailed roster, history, and room settings remain available, but they must open as secondary panels:

- desktop: rail or slide-over panel
- phone portrait: bottom sheet or segmented sheet

### Fixed Decision Surface

The hero action area is a fixed terminal surface, not ordinary page content:

- no layout jumping when warnings appear
- no pushing the action area below the fold
- no history panel expansion that displaces action controls

## Room Page Layout

### Desktop

Desktop becomes a stable three-zone terminal:

1. `Status Bar`
   - room code
   - connection state
   - mode
   - compact global actions
2. `Table Stage`
   - real Hold'em table geometry
   - board tray
   - pot capsule
   - current phase / turn beacon
   - seat ring aligned to table edges
3. `Hero Dock`
   - fixed at the bottom of the viewport
   - hole cards
   - `to call / min raise / pot / eff`
   - quick sizing and primary actions

Wide desktop can still expose side rails, but only after table + dock geometry is safe.

At approximately `1280px`, the product should favor the table and dock over permanent left/right rails.

### Phone Portrait

Phone portrait becomes a dedicated vertical terminal:

1. compact `Status Strip`
2. vertically oriented real table stage
3. fixed `Hero Dock`
4. auxiliary sheets for:
   - `Players`
   - `History`
   - `Room`

The first phone screen should answer only:

- what is happening on the table
- what cards do I hold
- what can I do now

### Tablet And Ultra-Wide

Tablet and ultra-wide keep the same state model but adapt presentation:

- tablet keeps the single-screen terminal shape with one persistent secondary panel at most
- ultra-wide expands atmosphere and secondary rails without increasing the hero-to-table eye travel distance

## Table Geometry

The table must stop being a circular HUD.

### Desktop Table

- horizontal oval Hold'em table
- board tray centered on the felt
- internal state band or floating capsule for phase/turn context
- seat anchors aligned to the table edge, not to a mathematical circle

### Phone Portrait Table

- vertical oval table
- compressed upper seat spread
- no seat allowed to intrude into the board tray or state band
- hero seat remains visually tied to the dock

### Seat System

Seat cards become tactical plaques, but geometry is driven by reading order:

- hero seat anchored to the lower center
- opposite seat anchored to the upper center
- side seats distributed along the table edge
- cards stay upright for readability rather than rotating with the curve

## Hero Dock

The hero dock becomes a hard layout invariant.

- fixed at viewport bottom
- visible during the whole hand
- never displaced by history or roster surfaces
- errors and confirmations render inside stable feedback slots

Desktop dock:

- broad and shallow
- cockpit-like

Phone dock:

- shorter, denser, thumb-first
- optimized for one-screen decision making

## Auxiliary Panels

### Desktop

Secondary surfaces may appear as:

- compact rail
- slide-over panel
- overlay review panel

But they must never collapse the table or dock below functional thresholds.

### Phone Portrait

Secondary surfaces move to sheets:

- `Players Sheet`
- `History Sheet`
- `Room Sheet`

Sheets overlay the terminal and scroll independently. They do not push the page longer.

## Create-Room Modal Redesign

The current create-room surface is structurally wrong because it behaves like a tall form with oversized cards.

### New Interaction Model

Creating a room should feel like selecting a table profile first, then tuning settings.

The flow becomes:

1. choose `Club / Pro / Study`
2. adjust essential settings
3. optionally expand advanced settings

### Desktop Create-Room Surface

- medium-width configuration panel
- fixed header
- scrollable content body
- fixed footer actions
- horizontal mode tiles with:
  - English label
  - Chinese title
  - one-line positioning copy
  - active/default indicator

### Phone Create-Room Surface

- full-screen sheet
- fixed top bar
- fixed bottom primary action
- only the center content scrolls
- product-styled scrollbar

The mode tiles must never force Chinese copy into vertical single-character columns.

## Motion And Performance Constraints

The redesign intentionally restricts costly motion on room surfaces.

Allowed:

- active-seat spotlight
- dock emphasis
- short sheet transitions
- compact board / pot / settlement confirmations

Disallowed:

- heavy nested blur stacks
- page-level floating effects that compete with scrolling
- animations that move the action controls
- multi-layer motion that causes mobile frame drops

Hard performance rules:

- room page should target one primary viewport height
- minimize nested scroll containers
- prefer `transform` and `opacity`
- reduce expensive `filter`, large blur, and oversized shadow usage on phone portrait

## Mode Behavior Within The New Layout

The layout model is shared, but emphasis still differs by mode:

- `pro`
  - tightest density
  - strongest action/dock emphasis
  - most compact labels
- `club`
  - more explicit status copy
  - stronger operator-facing prompts
  - slightly warmer surface treatment
- `study`
  - richer history sheet
  - more explanatory result framing
  - slightly expanded event semantics when the user opens review surfaces

## Testing Strategy

This redesign requires both automated and browser verification.

### Automated

- view-model tests for table/dock/seat state inputs
- layout helper tests for desktop and phone portrait geometry
- mode token tests for new panel and modal metadata
- build verification after every layout batch

### Browser

- desktop room at `1280x900`
- phone portrait room at approximately `390x844`
- create-room flow on desktop and phone
- verify that one screen contains:
  - table stage
  - hero cards
  - action controls
- verify auxiliary sheets do not force whole-page scrolling

## Success Criteria

This redesign is successful when:

- the room page no longer requires vertical page scrolling for live play
- desktop and phone both keep table + hero dock in one view
- seat cards no longer overlap state bands or board space
- create-room becomes readable and product-grade on both desktop and phone
- mobile interaction feels controlled rather than sticky or scroll-fighty
