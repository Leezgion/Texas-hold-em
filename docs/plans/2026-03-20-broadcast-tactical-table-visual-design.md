# Broadcast Tactical Table Visual Design

**Goal:** Evolve the current single-screen poker terminal into a broadcast-grade `9-max` tournament table that feels like a real televised Hold'em table while preserving one-screen decision flow on desktop and phone portrait.

**Status:** Approved for implementation on `feat/poker-os-polish`

---

## 1. Product Intent

This pass is not a gameplay rewrite. It is a presentation-layer upgrade that must make the room feel like a real competition table instead of a generic web layout.

The chosen visual direction is:

- deep green felt
- black-gold tournament rail
- clean center table surface
- embedded electronic seat plaques
- a hero control dock that feels attached to the table, not detached below it

The target mood is `Broadcast Tactical`:

- more realistic than an esports HUD
- more distinctive than a conservative TV-table clone
- disciplined enough for dense information and serious play

---

## 2. Hard Constraints

These are non-negotiable:

- one canonical `9-max` tournament capsule table family across `2-9` players
- desktop and phone portrait must feel like the same table, not different products
- the room remains a single-screen decision terminal
- table center stays clean: board, pot, street cue
- the hero never has to page-scroll to see cards or actions
- support surfaces stay secondary: panels, sheets, rails
- no visual polish may break action correctness, accessibility, or layout stability

---

## 3. Visual Language

### 3.1 Table

The table itself is the hero surface.

- outer rail: black-gold tournament edge with subtle metallic highlights
- inner rail: darker matte transition ring
- felt: deep green velvet with restrained directional grain
- table center: low-noise, no heavy HUD lines, no circular sci-fi shell

The center should read as:

- public board first
- pot second
- street/state cue third

### 3.2 Seat Plaques

Seats become embedded electronic plaques rather than floating cards.

- dark glass/terminal face
- compact digital typography
- subtle perimeter light on active turn
- stable sizing across counts
- hero plaque is richer, but still the same design family

### 3.3 Hero Dock

The hero dock is a control terminal attached to the bottom of the table composition.

- desktop: visually coupled to the lower rail
- phone portrait: fixed bottom cockpit with the same material language
- no webpage-card feel
- no large descriptive copy in the action path

---

## 4. Unified Table Geometry

The room uses one canonical `9-max` seat geometry:

- the table remains a capsule / racetrack form
- `Hero` anchor stays bottom center
- opponent center seat stays top center
- side anchors follow a stable tournament-table reading order
- lower occupancy counts only disable anchors; they do not generate a new table

Desktop:

- horizontal capsule
- broad lower rail connection into the hero dock
- center board tray stays horizontally centered

Phone portrait:

- the same table family rotates into a vertical capsule
- hero remains at the bottom edge near the dock
- board tray remains central
- side plaques compress, but do not turn into unrelated cards

---

## 5. Information Density Rules

The goal is information efficiency, not maximum packing.

### 5.1 Priority Model

- `P0`: always visible
  - hero hole cards
  - to call
  - pot
  - effective stack
  - primary action buttons
  - current-turn cue
- `P1`: visible in compact form
  - seat label
  - position
  - blind marker
  - current bet
  - folded / all-in / waiting-next-hand / disconnected
- `P2`: support surface only
  - hand tape detail
  - extended settlement copy
  - room tools
  - long explanations

### 5.2 Compression Rules

Can compress:

- repeated labels
- long descriptions
- decorative spacing
- non-critical panel padding

Must not compress:

- card readability
- action button hit area
- current-turn hierarchy
- key numeric contrast
- board / pot clarity

---

## 6. Component Intent

### 6.1 `TableStageChrome`

Responsible for the real table shell:

- black-gold rail
- felt surface
- board tray
- pot zone frame
- marker orbit
- anchor guide integration

### 6.2 `TableStage`

Responsible for table center composition:

- board tray placement
- pot capsule hierarchy
- street beacon
- settlement placement relative to the table center

### 6.3 `SeatCard`

Responsible for embedded plaque rendering:

- compact name/chips/status stack
- anchor-role styling
- current-turn emphasis
- hero plaque richness

### 6.4 `ActionDock`

Responsible for decision density:

- cards
- to call / pot / eff / min raise
- quick sizings
- stable primary buttons
- local error/pending feedback

---

## 7. Motion Rules

Motion is allowed only when it improves comprehension or atmosphere.

Priority order:

- current-turn emphasis
- dock emphasis on hero action
- pot updates
- settlement reveal
- panel / sheet transitions

Avoid:

- large center-stage flourishes
- heavy blur stacks on phone
- anything that reintroduces scroll jank
- decorative animation that competes with cards or numbers

---

## 8. Responsive Strategy

Desktop remains the mother layout.

- full table composition
- embedded plaques
- coupled hero dock
- support surfaces in panel/rail forms

Phone portrait remains a true one-screen terminal.

- same table family, vertical
- compact plaques
- fixed dock
- support surfaces in sheets only

Tablet and ultrawide remain adaptations of the same system, not separate products.

---

## 9. Success Criteria

The pass is successful when:

- the room reads as one realistic tournament table on both desktop and phone
- the center no longer looks like a circular HUD
- seat plaques feel embedded, not pasted on
- the dock and table feel like one composition
- information density increases without degrading readability
- no page-scroll fight returns
- browser screenshots clearly show the new table identity without explanation
