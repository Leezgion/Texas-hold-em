# Pro Mode Design

**Date:** 2026-03-19

**Goal:** Make `pro` the first truly differentiated product mode by improving decision speed, information density, and result readability for serious real-play Hold'em use without changing server-authoritative gameplay.

## Context

The repo already supports:

- shared room presets through `roomMode`
- local presentation overrides through `displayModePreference`
- server-authoritative seat / hand / recovery / ledger behavior

What it does not yet provide is a meaningful professional-mode experience. Today `pro` is mostly a label. Players can switch into it, but the table does not consistently expose the condensed numerical context or action-focused summaries that stronger players expect.

## Product Intent

`pro` mode should help a player answer these questions with minimal scanning:

1. Whose turn is it, and what is the pressure on the current decision?
2. What do I owe to continue, what is the minimum legal raise, and how big is the effective stack?
3. Who is seated, who is still live in the hand, who is only waiting for next hand, and who is effectively out?
4. What exactly happened on the last hand in chips and pot layers?

`pro` mode is not a different ruleset. It is a denser and clearer presentation of the same table truth.

## Non-Goals

- no server rule changes
- no solver, HUD, range trainer, or exploit analysis features
- no persistent profiles or deployment work
- no large table-layout rewrite in this batch
- no visual fork of the app into separate `club` / `pro` / `study` pages

## Design Principles

### 1. One authoritative model

All mode-specific behavior must remain presentation-level. The server continues to own:

- room truth
- action legality
- pot and settlement math
- reveal and recovery behavior

### 2. Density without ambiguity

`pro` should show more numbers, not more noise. Extra labels only stay if they reduce decision latency or post-hand ambiguity.

### 3. Reuse for future `club` / `study`

The first `pro` batch should create reusable view-model surfaces. `club` can later hide or soften some details, and `study` can later expand them with explanation, but all three modes should read from the same derived data.

### 4. Safe rollout

Start with view-model and local component changes. Avoid broad layout churn until the denser information surfaces are stable and tested.

## Recommended Delivery Order

### Phase 1: Decision Density

Improve the acting-player area first because it directly affects speed and correctness.

Target changes:

- expose `toCall`, `minRaise`, `pot`, and `effectiveStack` together
- keep quick raise sizing visible and easier to compare
- tighten submit feedback so the player can see when the action is in flight
- preserve immediate failure recovery already added in the socket-response work

Primary files:

- `client/src/view-models/gameViewModel.js`
- `client/src/components/ActionButtons.jsx`
- `client/src/components/GameRoom.jsx`

### Phase 2: Table Awareness

Improve how the table summarizes seat, blind, and player state information.

Target changes:

- clearer seat + position context in `PlayerPanel`
- stronger distinction between:
  - seated and active
  - seated but waiting next hand
  - spectating
  - busted and pending rebuy
- denser but still readable chip and session-net information
- make `Leaderboard` feel more like a live table state panel than a generic ranking widget

Primary files:

- `client/src/view-models/gameViewModel.js`
- `client/src/components/PlayerPanel.jsx`
- `client/src/components/Leaderboard.jsx`
- `client/src/components/GameRoom.jsx`

### Phase 3: Hand Result Readability

Improve post-hand scan speed for serious players.

Target changes:

- hand-history rows emphasize:
  - hand number
  - end reason
  - total pot
  - main / side pot splits
  - per-player net
- settlement overlay becomes more compact and money-first
- pot summary language stays consistent between live table and hand history

Primary files:

- `client/src/view-models/handHistoryViewModel.js`
- `client/src/components/HandHistoryDrawer.jsx`
- `client/src/components/SettlementOverlay.jsx`
- `client/src/components/GameRoom.jsx`

## Data Model Changes

No server schema changes are required for this batch.

The client should add presentation-only derivations:

- action summary for the current acting player
- compact player summary objects for table panels
- position / blind labels derived from current hand indices
- mode-aware history row summaries
- mode-aware settlement summary slices

These should live in view-model helpers, not be recomputed ad hoc inside multiple components.

## Mode Contract

### `pro`

- highest density
- numeric context always favored over long prose
- chip, pot, blind, and action context kept close to the player’s next decision
- summaries favor compact scanability

### `club`

Will later reuse the same data but prefer softer labels, fewer secondary numbers, and safer banners.

### `study`

Will later reuse the same data but expand history, state explanation, and review cues.

## Error Handling

This batch must preserve the product hardening already completed:

- no new optimistic UI for authoritative actions
- no falling back to shared generic socket `error` channels
- no new mode-specific logic that hides recovery, reconnect, or denied-action states

If a component cannot render a dense `pro` summary due to missing state, it should degrade to existing safe labels instead of throwing or rendering incomplete fragments.

## Testing Strategy

### Unit tests

Add or extend tests for:

- new `pro` decision-summary derivations
- compact player-state summaries
- history-row formatting with main / side pot breakdowns
- mode branching where `pro` output differs from base output

Primary test files:

- `client/src/view-models/gameViewModel.test.js`
- `client/src/view-models/handHistoryViewModel.test.js`

### Browser regression

After implementation, rerun at least:

1. 2-player quick action flow in `pro`
2. 3-player side-pot hand in `pro`
3. seated-wait-next-hand visibility in `pro`
4. desktop and mobile spot-check to confirm the denser action strip does not overlap core controls

## Acceptance Criteria

This batch is complete when:

- `pro` mode exposes materially better decision context than today
- the same room can still be viewed safely in other display modes
- no server gameplay semantics change
- automated client and server baselines stay green
- at least one fresh browser regression pass confirms the new `pro` surfaces are readable in live play
