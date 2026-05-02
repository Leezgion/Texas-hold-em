# 2026-05-02 Phone Multiseat Visual Audit

## Goal

Make full 6-max and 9-max phone live-hand tables readable on regular and short phone viewports without changing the shared vertical capsule table language.

## Completed

- Added a real-browser multiseat audit for full 6-max and 9-max rooms across `390x844` and `375x667`.
- Fixed short-height phone board geometry by switching community cards to a `micro` board density that fits inside the compressed vertical table.
- Compacted short-height opponent plaques globally, not just the top seat, so flank seats no longer collide with each other or the board.
- Forced short-height live-hand stage/main overflow to `visible !important` after screenshots showed Tailwind `overflow-hidden` still clipping top seats.
- Hid duplicate phone live-hand chrome guide ghosts, keeping the current-turn guide while letting seat plaques carry player data.

## Evidence

- Browser audit: `.runlogs/2026-05-02-phone-multiseat-visual-audit.json` (`runId = moojx4ch`)
- Screenshots:
  - `.runlogs/2026-05-02-phone-multiseat-6max-full-phone-390x844-live.png`
  - `.runlogs/2026-05-02-phone-multiseat-6max-full-compact-375x667-live.png`
  - `.runlogs/2026-05-02-phone-multiseat-9max-full-phone-390x844-live.png`
  - `.runlogs/2026-05-02-phone-multiseat-9max-full-compact-375x667-live.png`
- Fresh rooms:
  - `6max-full 390x844`: `M52XLY`
  - `6max-full 375x667`: `I0L7OU`
  - `9max-full 390x844`: `70L2P9`
  - `9max-full 375x667`: `P18N3G`
- Key metrics:
  - every audit reported `scrollHeight = clientHeight`
  - every audit reported `seatPairs = 0`, `seatHeader = 0`, `seatBoard = 0`
  - short phone reported `stageOverflow = visible` and `mainOverflow = visible`
  - short phone board bounds stayed inside the table lane: `left = 134`, `right = 251`

## Street Audit Addendum

- Browser audit: `.runlogs/2026-05-02-phone-multiseat-visual-audit.json` (`runId = mookhv3c`)
- Fresh rooms:
  - `6max-full 390x844`: `4T7U10`
  - `6max-full 375x667`: `5Y6Q1G`
  - `9max-full 390x844`: `G9MGLS`
  - `9max-full 375x667`: `QU13X9`
- Key metrics:
  - every room advanced through `flop`, `turn`, `river`, and `showdown`
  - community card counts/frame counts matched each street: `3/3`, `4/4`, `5/5`, `5/5`
  - `clippedBoardCards = 0` across every street and viewport
  - `seatPairs = 0`, `seatHeader = 0`, and `seatBoard = 0` across every street and viewport
  - short phone retained `stageOverflow = visible` and `mainOverflow = visible`
- Fixes from this addendum:
  - short-height current-turn opponent plaques no longer translate upward into the header
  - animated community-card frames now inherit the resolved board card width/height, so micro cards are not clipped by the tray

## Next Queue

- `[done]` Review short-phone current-turn marker and hero-position communication; center cue now uses compact `座N · 跟注 X` / `座N · 可过牌` wording while seat plaques keep position and stack context.
- `[done]` Continue live-hand action dock polish after board/seat geometry is stable; decision buttons now stretch to the available phone dock width.
- `[done]` Continue raise-drawer hierarchy review for larger blind structures and deeper stacks; quick-raise amounts now dedupe after big-blind alignment and the phone drawer grid adapts to 2/3/4 valid buttons.
- `[done]` Continue broader gameplay edge validation after the phone table/action UI is stable; 3-way all-in side-pot settlement now shows main and side pot lines on regular and short phone viewports.
- `[done]` Continue gameplay edge validation for reveal policy variants and hand-history/support-panel access after settlement; folded host reveal behavior now matches `showdown_only` vs `free_reveal_after_hand`, and post-settlement support panels are verified on `390x844` and `375x667`.
- `[done]` Continue professional-player gameplay validation around multi-street betting, min-raise/all-in edge cases, and post-hand replay accuracy; non-full all-in now returns action to the opener as `call_only`, hides raise/all-in controls on phone, preserves the full preflop action record, and keeps `390x844` / `375x667` single-screen.
- `[done]` Continue professional-player gameplay validation for timeout/disconnect decision states and full all-in reopening; call-only timeout/disconnect now records forced folds, and a complete all-in raise reopens action to prior bettors.
- `[done]` Continue professional-player replay validation for odd-chip split display; hand-history summaries now mark the recipient with `（奇数筹码）`, and backend regression coverage verifies the odd chip goes to the winner closest to the small blind.
- `[todo]` Continue side-pot replay drill-down beyond summary lines, especially compact phone access to all pot layers when a hand has multiple side pots and reveal details.
