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
- `[done]` Continue side-pot replay drill-down beyond summary lines; embedded phone support-panel hand history now keeps all replay lines available instead of truncating pro-mode records to 4 lines.
- `[done]` Validate a 4+ player multi-side-pot hand in the phone support-panel history drawer; browser audit `moopphv2` showed main pot, side pot 1, side pot 2, and all chip-delta lines on `390x844` and `375x667`.
- `[done]` Continue reveal-detail density validation for long multiway showdown histories where several players choose `show_one` / `show_all` in the same hand; browser audit `moopyq2i` showed 11 replay lines, 3 visible reveal lines, and no body/shell scroll on `390x844` and `375x667`.
- `[done]` Continue post-hand review ergonomics polish so long pot/delta/reveal records become faster to scan inside the sheet without removing evidence; browser audit `mooq4wxz` verified `总览 / 底池与输赢 / 亮牌` sections with the same 11 evidence lines on `390x844` and `375x667`.
- `[done]` Continue product polish with duplicate action-submit protection; browser audit `mooqcsq5` verified two synchronous `弃牌` clicks emit only one `playerAction` frame and show an informational waiting-confirmation toast on `390x844` and `375x667`.
- `[done]` Continue invalid-action coverage for stale/out-of-turn requests and recovery-required room actions in real browser flows; browser audit `mooqv5ok` verified stale-device UI feedback, out-of-turn socket rejection, and recovery-required banner/recover flows on `390x844` and `375x667`.
- `[done]` Continue real-browser product hardening with live-hand refresh/reconnect; browser audit `moorek12` verified desktop `1366x900` and phone `390x844` refresh keep the host decision, hole cards, and single-screen shell after socket id rotation.
- `[done]` Continue active-hand leave/exit hardening; browser audit `moorw8wp` verified leave-seat and exit-room confirmations, forced-fold metadata, stable homepage return, and inert cleanup on `390x844` and `375x667`.
- `[done]` Continue real-browser product hardening with same-device room-switch cleanup; browser audit `moos5mtp` verified same-device create-switch and join-switch paths clean old membership, preserve new-room hand state, and avoid stale room-code text.
- `[done]` Continue post-switch stale page actions and multi-tab same-device ownership messaging; browser audit `moosa0p2` verified stale home create and stale room exit show the refresh-identity hint without raw `设备未注册`.
- `[done]` Continue room-end / empty-room lifecycle; browser audit `moosel6h` verified the sole-host waiting-room exit closes the room, returns home, and makes both debug and proxied room checks return `404`.
- `[done]` Continue post-hand navigation ergonomics; browser audit `moosobsp` verified a settlement `牌局` support panel auto-closes when hand 2 starts, clears `#root.inert`, and keeps the phone shell single-screen.
- `[done]` Validate repeated multi-hand continuity on phone; browser audit `moosucfd` reached hand 5 after four settlement-review transitions with conserved chips, correct host `decision/watch` states, cleared modal inert state, and no shell scroll.
- `[done]` Validate rebuy / busted-player recovery in real phone browser flow; browser audits `moot2zaw` and `moot38jj` verified zero-stack seat messaging, rebuy modal fit, post-rebuy seating, host-start participation, and single-screen behavior on `390x844` and `375x667`.
- `[done]` Polish rebuy success feedback; browser audits `moot8hrm` and `moot8rhv` verified restored chips show `已补码 1,000，当前筹码 1,000。` and clear the stale zero-chip warning before seating/start continues.
- `[done]` Validate timer-expiry browser behavior on phone; browser audit `mootivlx` verified timeout auto-fold metadata, current-player handoff, explicit `超时自动弃牌` copy, no stale action controls, and no shell scroll.
- `[done]` Validate no-call timeout behavior on phone; browser audit `mootxidq` verified timeout auto-check metadata, explicit `超时自动过牌` copy, no stale action controls, flop-to-turn advancement after all players checked, and no shell scroll.
- `[done]` Continue professional-player hardening around disconnect / reconnect in no-call check spots; browser audit `mooucfgj` verified quick reconnect before grace, disconnect auto-check after grace, sustained disconnect auto-check on the next street, and explicit `断线自动过牌` feedback.
- `[done]` Validate bet-facing disconnect auto-fold feedback in a real phone browser; browser audit `mooujiy6` verified normal facing-bet and call-only disconnects show `断线自动弃牌`, remove stale action controls, and keep the phone shell single-screen.
- `[done]` Continue showdown / settlement interruption validation around refresh, reconnect, reveal eligibility, and support-panel ergonomics; browser audit `moouq6rx` verified settlement-sheet refresh recovery, post-refresh `亮左牌`, support-panel reveal history, inert handling, and single-screen phone layout.
- `[done]` Validate post-settlement reveal/history persistence across automatic next-hand transitions and longer reveal sequences after the settlement sheet disappears; browser audit `moouwl1n` verified hand 1 mixed reveals remain visible from the `牌局` panel after hand 2 preflop starts on both `390x844` and `375x667`.
- `[done]` Continue room/game lifecycle hardening around duration expiry, end-game summary visibility, and timer-driven room closure cleanup; browser audit `moovypco` verified the final-ranking modal, unresolved bet return, overlay cleanup, home navigation, and deleted-room `404`.
- `[done]` Validate stale room tabs and direct `/game/:roomId` refresh after a timer-ended room is deleted; browser audit `moowfbvg` verified offline stale-tab reconnect and direct old-URL access both show `ROOM CLOSED`, clear stale table UI, avoid inert leaks, and keep phone single-screen.
- `[todo]` Validate post-closed-room recovery continuation: after returning home from a closed stale room, creating or joining a new room should not carry stale room errors, stale room codes, or blocked navigation.
