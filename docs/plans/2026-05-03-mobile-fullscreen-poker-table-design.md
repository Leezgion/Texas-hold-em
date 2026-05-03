# Mobile Fullscreen Poker Table Design

**Goal:** Replace the current phone live-hand "stage panel plus action dock" layout with a fullscreen felt-table cockpit that matches serious mobile poker table information hierarchy.

**Decision:** Use DOM + CSS/SVG for the table, seats, chips, controls, and drawers. Do not move to Canvas for this pass because the current product needs accessible buttons, tested layout contracts, focus management, and inspectable state more than raw custom rendering.

## Current Problem

Phone live hands still render as stacked web panels:

- `TableStage` owns the table inside a rounded panel.
- `ActionDock` owns hero cards and decisions inside a second rounded panel.
- `RoomPanelSheet` owns support information as a separate layer.
- Raise sizing can open an internally scrollable drawer.

This creates the exact UX failure reported during manual acceptance: the table does not own the screen, decision controls feel detached from the felt, action controls can require scrolling, and support panels compete with the table instead of behaving like temporary poker-app overlays.

## Target Product Grammar

The phone live hand should behave like one poker table surface:

- The viewport is a `100dvh` deep-green felt surface with black/gold rail treatment.
- The table, board, pot, player seats, player bets, hero cards, and hero actions all live on the same visual plane.
- Low-frequency actions such as leave seat, rebuy, share, settings, players, and hand history stay behind a compact table menu or side drawer.
- Hero actions are immediate and reachable in one thumb zone.
- Raise sizing is a compact non-scrolling overlay with common sizes first and custom sizing second.
- Hand history is a slide-over replay rail, not a generic status panel.

## Component Direction

Keep the current gameplay data flow. Refactor only presentation boundaries:

- `GameRoom.jsx` marks phone live hand with an explicit fullscreen-table contract and keeps support panels available.
- `TableStage.jsx` keeps rendering the SVG/CSS table, board, pot, settlement overlay, and `SeatRing`.
- `ActionDock.jsx` keeps owning hero cards and decision controls, but phone live hand presents them as a transparent table overlay instead of a separate panel.
- `ActionButtons.jsx` keeps existing action behavior, risk confirmation, shortcuts, and submit guards, but adds a phone live "floating controls" presentation.
- `SeatCard.jsx` and `SeatRing.jsx` keep canonical seat data but render phone live seats as avatar/action/stack/bet badges instead of rectangular plaques.
- `EventRail.jsx` becomes the content for a phone hand-replay side drawer with per-player action rows and chip deltas where source data is available.

## Visual Rules

- No large opaque rectangular panel may sit between the player and the table in phone live hand.
- Header is compact chrome only: room code, connection, and menu affordance.
- The felt stage must fill the available viewport, not a small centered table inside a card.
- Opponent information uses compact poker grammar: action tag, avatar/seat, stack, bet badge.
- Hero area uses compact poker grammar: two cards, stack, timer, primary actions.
- Any drawer must be temporary, dismissible, and must not introduce document scroll.

## Test Strategy

Use contract tests before production changes:

- CSS contract: phone live shell uses fullscreen fixed-height table, transparent stage/dock chrome, and no document-scroll-driving dock reserve.
- CSS contract: phone live raise surface has `overflow: visible/hidden` with bounded height, not `overflow-y: auto`.
- Source contract: phone live action dock exposes a fullscreen/floating table action mode.
- Source contract: phone hand history presentation exposes side-drawer replay navigation.
- Browser verification: phone `390x844` and compact `375x667` must keep `scrollHeight === clientHeight`, keep action controls visible, and avoid table/board/hero collisions in live, raise-open, support-drawer, and settlement states.

## Non-Goals

- Do not change poker rules or server gameplay in this pass.
- Do not merge to `main`.
- Do not push.
- Do not introduce deployment tasks.
- Do not replace all rendering with Canvas unless DOM/CSS/SVG fails measurable interaction or layout goals.
