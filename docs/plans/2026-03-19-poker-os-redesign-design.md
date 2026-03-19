# Poker OS Redesign Design

**Date:** 2026-03-19

**Goal:** Redesign the client into a mode-aware `Poker OS` experience that keeps one authoritative gameplay engine while delivering distinct `club`, `pro`, and `study` front-end experiences with stronger immersion, clearer state handling, and more professional table workflows.

## Context

The current app already has the underlying gameplay and hardening work needed for a serious Hold'em product:

- server-authoritative room, seat, hand, recovery, and settlement logic
- room-level `roomMode` presets
- local `displayModePreference` overrides
- hardened request / response flows for create, join, leave, seat, rebuy, reveal, recover, and action requests
- regression scripts, runbooks, and a living pitfall log

What it does not yet have is a truly cohesive product surface. The present front end still feels like a collection of page sections and utility panels rather than an intentional poker operating system.

## Product Intent

The redesign should satisfy three product goals at the same time through mode-aware presentation rather than separate products:

- `club`
  - support private games, hosts, and offline-table assistance
  - reduce ambiguity and operator mistakes
  - keep shared status easy to read from across a table
- `pro`
  - support fast online-style play and dense numerical context
  - reduce decision latency
  - keep critical action information close to the player’s focal area
- `study`
  - support review, replay, and understanding of what just happened
  - make state transitions, settlement, and hand summaries easier to inspect

The redesign must feel more immersive and premium, but the visual treatment may not come at the cost of action clarity or state correctness.

## Non-Goals

- no deployment, staging, CI, persistence, or launch preparation work
- no server gameplay rule changes for mode-specific behavior
- no hidden information advantages based on local display mode
- no branching into three independent front-end applications
- no solver, HUD, equity trainer, or range-analysis tooling

## Core Design Principles

### 1. One table system, three presentation faces

The product should behave like one `Poker OS` with three recognizable faces, not three separate apps. Shared gameplay state, action legality, room truth, recovery handling, and settlement semantics remain common. Differences come from:

- information density
- layout emphasis
- visual material and atmosphere
- copy tone
- animation pacing

### 2. State-first design

The redesign should begin with state semantics, not cosmetics. Every major UI surface must map back to already authoritative state:

- room state
- player seat state
- current action state
- recovery / reconnect state
- settlement / reveal state
- hand history and ledger state

The UI should never infer product-critical meaning ad hoc inside many components.

### 3. Immersion without spectacle tax

The app should feel premium and atmospheric, but animation and texture must never slow down core decision flows. "Cool" means:

- excellent hierarchy
- strong motion timing
- meaningful visual depth
- zero ambiguity about who acts now, what is owed, and what happened

### 4. Shared semantics, mode-aware emphasis

All three modes read from the same derived front-end semantics. The difference is what each mode foregrounds:

- `club` foregrounds table control, shared status, and reduced confusion
- `pro` foregrounds speed, numerical context, and compact decision support
- `study` foregrounds sequence, explanations, and replay comprehension

## Information Architecture

The current page-level composition should be reorganized into a single operating-shell model.

### Mode Gateway

The landing page becomes a mode-aware gateway rather than a simple form page.

It should provide:

- brand framing
- connection status
- clear `club / pro / study` previews
- create-room and join-room entry points
- room preset explanation before entering the table

Mode selection should feel like choosing a table operating profile, not toggling a generic filter.

### Poker OS Table Shell

The room page should be rebuilt around these persistent surfaces:

- `ModeShell`
  - top-level page shell
  - owns theme tokens, background atmosphere, animation strength, and layout density
- `TableHeader`
  - room code, mode indicator, connection state, share, leave, and top-level room actions
- `TableStage`
  - the central table surface
  - shows board, pot, street, current actor beacon, shared banners, and dominant in-hand context
- `SeatRing`
  - the player ring around the table
  - expresses seat, stack, blind/position, in-hand state, bust/rebuy state, pending-next-hand state, and host markers
- `ActionDock`
  - the player's command area
  - fixed and always reachable
  - exposes to-call, raise context, sizing shortcuts, and action feedback
- `IntelRail`
  - room/member intelligence rail
  - hosts room status, occupancy, compact roster, host controls, and session-level summaries
- `EventRail`
  - event and review rail
  - contains current hand summary, settlement, side-pot breakdowns, reveal outcomes, and hand history
- `Overlay Layer`
  - keeps only the truly interruptive workflows:
    - create room
    - join room
    - rebuy
    - leave seat
    - reconnect
    - recovery-required intervention

## Mode Language

### `club`

**Mood:** premium private-table control surface

**Visual direction:**

- walnut / brass / dark felt palette
- warmer highlights
- more tactile card-table material
- status bars and banners designed for clear shared reading

**Behavior emphasis:**

- stronger host affordances
- more explicit shared-state banners
- slightly gentler pacing on transitions
- more conservative visual complexity in the action area

### `pro`

**Mood:** high-end competitive command console

**Visual direction:**

- graphite black, oxblood accents, cold white numerics, restrained metallic highlights
- tighter spacing
- crisp outlines and sharper contrast
- less ornamental, more instrument-like

**Behavior emphasis:**

- decision metrics close to the action strip
- position / blind / net / stack context always nearby
- shorter transition timing
- result and history panels optimized for rapid scan

### `study`

**Mood:** analytic replay workstation

**Visual direction:**

- deep slate / desaturated blue / amber highlight palette
- clearer section dividers
- more timeline and annotation feel than casino feel

**Behavior emphasis:**

- stronger explanation of current street and recent transitions
- easier reading of board, pots, reveal, and net results
- more prominent history and event sequencing

## Component Strategy

Do not build three separate sets of components. Build one semantic component system with mode variants.

Recommended new composition:

- `client/src/components/ModeShell.jsx`
- `client/src/components/ModeGateway.jsx`
- `client/src/components/ModePreviewCard.jsx`
- `client/src/components/TableHeader.jsx`
- `client/src/components/TableStage.jsx`
- `client/src/components/SeatRing.jsx`
- `client/src/components/SeatCard.jsx`
- `client/src/components/ActionDock.jsx`
- `client/src/components/IntelRail.jsx`
- `client/src/components/EventRail.jsx`
- `client/src/components/TableBanner.jsx`

Existing components should either become inner modules of these shells or be adapted into them:

- `ActionButtons.jsx` becomes the interaction core inside `ActionDock`
- `PlayerPanel.jsx` and `Leaderboard.jsx` become sections inside `IntelRail`
- `HandHistoryDrawer.jsx` and `SettlementOverlay.jsx` become sections or overlays coordinated by `EventRail`
- `GameRoom.jsx` becomes a page orchestrator instead of a large all-in-one layout file

## Data Flow

Server truth stays unchanged. The redesign should add presentation-only derivations so components consume already-shaped view data.

Recommended semantic view-model layers:

- shell-level summary
  - current room title, mode chip, room status, reconnect/recovery banners
- table-stage summary
  - street label, pot summary, current actor summary, shared notice stack
- seat summary
  - seat label, position/blind label, stack label, in-hand state, next-hand marker, bust/rebuy marker, host badge
- action summary
  - to call, min raise, pot, effective stack, quick sizing options, pending action feedback
- event summary
  - settlement headline, main / side pot breakdown, board label, reveal label, recent hand summaries

`GameContext` continues to own data fetch / socket actions and should not become a mode-styling layer.

## Error And Exception Handling

The redesign must treat non-happy paths as first-class UI states.

### Connection states

- offline
- reconnecting
- reconnect failed with manual retry

### Room states

- room missing
- create failure
- join failure
- recovery required

### Seat states

- spectator
- seated but idle
- seated waiting next hand
- busted, needs rebuy
- rebought but not reseated

### Action states

- not your turn
- action pending
- stale / denied action with explicit reason
- host start denied with explicit reason

### Settlement states

- settling countdown
- reveal choices
- main / side pot result lines
- net chip outcome

### Exit states

- leave seat confirmed
- leave room confirmed
- forced fold called out clearly when it occurs
- room closed feedback when relevant

These should be surfaced through three consistent layers:

- `TableBanner`
- local `ActionDock` feedback
- `EventRail` / history record

The redesign should avoid hiding important failures inside ephemeral toast-only behavior.

## Visual System Direction

The new visual system should replace the current default tailwind-heavy gray boxes with a more intentional design language.

Recommended system pieces:

- CSS custom properties for per-mode theme tokens
- shell-level gradients, glows, and materials
- typography split between:
  - sharper display typography for headings / table labels
  - compact numeric typography for chips, pot, and action metrics
- more deliberate motion:
  - route-entry reveal
  - rail slide / dock settle
  - state beacon pulses
  - restrained settlement emphasis

The visual system should be theme-driven so the three modes remain easy to evolve without duplicating markup.

## Delivery Strategy

### Phase 1: Theme and shell foundation

- create shared mode tokens and shell components
- wire mode-aware class and theme selection
- keep existing logic intact

### Phase 2: Mode Gateway redesign

- redesign the landing page into a mode-driven entry experience
- improve room creation preset comprehension

### Phase 3: Poker OS room-shell migration

- replace the current `GameRoom` layout with the new shell
- introduce `TableHeader`, `TableStage`, `SeatRing`, `IntelRail`, `EventRail`, and `ActionDock`

### Phase 4: Mode refinement

- make `club`, `pro`, and `study` visibly distinct within the shared shell
- keep `pro` as the density benchmark without breaking the other two modes

### Phase 5: Regression closure

- rerun targeted automated coverage
- rerun browser regression matrix across modes
- update todo, runbook, and pitfall records

## Testing Strategy

### Automated

Maintain existing green coverage and add view-model tests for new semantic derivations:

- `client/src/view-models/gameViewModel.test.js`
- `client/src/view-models/handHistoryViewModel.test.js`
- mode utility tests where necessary
- full `server` baseline
- full targeted `client` baseline
- `client` build

### Browser regression

Fresh verification should cover:

1. `club`
   - create room
   - seat players
   - host start
   - clear settlement and host controls
2. `pro`
   - rapid action flow
   - side-pot readability
   - reconnect / recovery visibility
3. `study`
   - board / reveal / settlement / history readability
   - next-hand and seat-state explanations
4. responsive
   - desktop and mobile pass for gateway and room shell

## Acceptance Criteria

The redesign is successful when:

- the app feels like a deliberate poker product rather than a generic web page
- `club`, `pro`, and `study` are all visibly distinct and purpose-driven
- no server-authoritative gameplay semantics change
- non-happy-path states remain clear and safe
- automated baselines stay green
- fresh browser evidence confirms the redesign still supports real play instead of only looking better
