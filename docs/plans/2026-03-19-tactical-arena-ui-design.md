# Tactical Arena UI Design

**Date:** 2026-03-19

**Goal:** Redesign the current Poker OS front end into a more immersive, professional, and responsive Tactical Arena experience that feels credible to serious Hold'em players while preserving the existing server-authoritative game model.

## Product Intent

This phase is about visual and interaction quality, not new gameplay rules.

The client already has:

- authoritative room, seat, settlement, reconnect, and recovery semantics
- differentiated `club`, `pro`, and `study` modes
- hardened request / response flows for the critical room and action operations
- a responsive shell baseline that is functionally correct

What it still lacks is a truly premium table identity. The current UI is structurally better than before, but it still reads too much like a modern web app and not enough like a professional poker environment.

The redesign should push the product toward:

- a stronger table-first visual identity
- faster visual scanning for live play
- more deliberate motion and emphasis
- clearer per-device layouts
- stronger mode differentiation without forking logic

## Non-Goals

- no server gameplay rule changes
- no new hidden-information features
- no deployment, staging, CI, persistence, or launch tasks
- no solver, HUD, equity, or trainer features
- no separate front-end apps for `club`, `pro`, and `study`

## Design Direction

The chosen direction is a hybrid of:

- **broadcast-stage poker**
- **online pro grinding terminal**

Working title: `Tactical Arena`

The app should feel like a serious tournament table surrounded by a control system, not a simple page with a game widget dropped in the middle.

The tone should be:

- immersive
- premium
- restrained
- numerically legible
- decisively non-generic

## Responsive Strategy

Responsive behavior is a first-class design constraint, not a final polish step.

Priority order:

1. `desktop`
2. `phone portrait`
3. `tablet`
4. `ultra-wide`

The product should be treated as one state system with four layout forms.

### Desktop

This is the master layout.

- complete shell with left rail, center stage, and right rail
- strongest atmosphere and motion depth
- full seat ring around the table
- maximum information density in `pro`

### Phone Portrait

This is not a scaled desktop.

- compact header
- table remains central
- `Hero Dock` stays fixed and dominant
- `IntelRail` and `EventRail` become stacked drawers, tabs, or collapsible sections
- side seats use a compressed geometry tuned for narrow screens
- motion is reduced in distance and duration

### Tablet

Tablet is an independent form, not a stretched phone.

- central table remains dominant
- one rail can stay persistent
- the second rail can collapse or slide
- this form is especially important for `club` mode in table-assist scenarios

### Ultra-Wide

Extra width should expand atmosphere, not scatter the core experience.

- the table stage stays centered
- content width remains bounded
- rails may widen, but the user's focal path must not become too long
- decorative background layers can extend further than the functional content

## Information Architecture

The room page should continue to use one shell, but the redesign raises its hierarchy and spacing discipline.

### 1. Status Spine

Top-level room information:

- room code
- connection state
- room mode
- room state
- share / leave / rebuy / host-level controls

This should feel like a tournament control strip, not a navigation bar.

### 2. Table Stage

The center of the experience:

- felt table surface
- shared board tray
- pot capsule
- current street / turn beacon
- dealer / blind markers
- action spotlight

This is always the primary focal region.

### 3. Intel Rail

The table intelligence surface:

- occupancy
- host actions
- compact roster
- seat summaries
- stack and state snapshots

This is optimized for table awareness, not long reading.

### 4. Event Rail

The event and settlement surface:

- latest hand
- pot layers
- showdown summary
- chip outcomes
- timeline / review tape

This is optimized for answering "what just happened?" without stealing focus from the active hand.

### 5. Hero Dock

The player’s cockpit:

- hole cards
- to-call / min-raise / pot / effective stack
- quick sizing controls
- primary actions
- action feedback
- decision timer

This must stay stable across all responsive forms. It should never shift unpredictably because a warning or animation appeared.

## Visual Language

The redesign should avoid common “purple gaming dashboard” cliches.

### Color

Primary palette:

- charcoal
- graphite
- deep navy-black
- cool white
- muted ice-cyan
- restrained champagne / gold accents

State colors:

- success / live / actionable: cool emerald
- warning: amber
- danger: deep red
- inactive: low-contrast slate

Mode inflection:

- `pro`: colder, sharper, denser
- `club`: slightly warmer and more tactile
- `study`: more analytical with stronger section guidance

### Materials

- table stage: felt-like surface with depth and edge treatment
- rails and dock: dark metallic / smoked glass treatment
- seat cards: electronic desk-plate feel
- pot capsule: suspended scoreboard feel

### Typography

Use two clear typographic roles:

- display / status typography for labels, stage titles, and mode framing
- compact, high-legibility numeric styling for chips, pot, and action metrics

Numbers should feel instrument-like, not decorative.

## Motion System

Motion must clarify state and reward attention, never delay play.

### Motion Categories

#### Decision-Critical

- dealing cards
- active-player spotlight
- pot updates
- settlement result emphasis

These are required but short.

#### State-Confirmation

- seat taken
- waiting next hand
- rebuy confirmed
- room recovery completed

These support comprehension without dominating the interface.

#### Atmospheric

- shell reveal
- rail entrance
- subtle stage lighting shifts
- background ambient motion

These must remain secondary and be reduced on narrow screens.

### Duration Guidance

- button / hover feedback: `120ms - 180ms`
- compact state transitions: `180ms - 240ms`
- deal / pot movement: `240ms - 420ms`
- settlement emphasis: `300ms - 600ms`

Mode bias:

- `pro` shortest
- `club` moderate
- `study` slightly slower only in non-critical review surfaces

### Motion Constraints

- no long card-flip spectacle
- no layout-janking transitions
- no heavy glow that obscures numbers
- no rail animations that push the table stage off balance
- reduced-motion fallback is required

## Component Strategy

The current Poker OS shell stays as the semantic base, but the visible component treatment is elevated.

### `ModeGateway`

The home route should feel like a premium table-profile selector.

- stronger hero framing
- clearer differentiation between `club`, `pro`, and `study`
- more tactile card-like selection treatment
- create / join actions embedded in the branded gateway rather than floating as generic forms

### `TableHeader`

- compact but authoritative
- supports room state, mode chip, and global actions
- folds intelligently on mobile

### `TableStage`

- redesigned felt table surface
- stronger board tray
- pot capsule and stage beacon
- visually anchored dealer / blind / actor indicators

### `SeatCard` and `SeatRing`

Every seat should work as a compact tactical unit:

- player name
- seat number
- position label
- chips
- current bet
- net result
- state marker
- host badge when relevant
- clear current-turn emphasis

### `ActionDock`

This becomes the tactical command surface.

- stable physical presence
- strong numeric hierarchy
- quick sizing controls aligned with the stage tone
- warning / success feedback integrated without causing reflow shock

### `IntelRail`

- tighter grouping and scanability
- more professional section framing
- compact tactical summaries rather than generic cards

### `EventRail`

- more scoreboard / tape character
- layered pot outcomes
- compact recent-hand review
- more refined `study` presentation without bloating `pro`

## Mode Differentiation

Modes share one semantic layout but differ in emphasis.

### `pro`

- cold, compact, competitive
- highest information density
- fastest motion
- action metrics always prominent

### `club`

- more tactile and host-friendly
- shared-state banners are clearer and calmer
- host actions and occupancy summaries read more easily from a distance

### `study`

- stronger annotations and sequence readability
- event rail becomes more explanatory
- current street / result context is more explicit

## Acceptance Criteria

The redesign is successful when:

- the app feels like a serious poker product, not a generic admin/game hybrid
- desktop and phone portrait both feel intentional rather than scaled
- `club`, `pro`, and `study` are visually distinct in a meaningful way
- the active-player decision path remains faster to read than before
- motion improves comprehension without slowing interactions
- existing automated gameplay and client verification remains green
