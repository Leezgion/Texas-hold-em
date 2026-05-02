# Phone Live Pot Pill Implementation Plan

**Goal:** Make the phone live-hand pot display a small readable table pill that does not collide with the top opponent, header, board tray, beacon, dock, or raise drawer.

**Scope:** CSS-only phone live-hand treatment for `.table-stage-pot-capsule`. No gameplay or table geometry changes.

## Tasks

1. Add a contract test for the phone live-hand micro pot pill and short-height offset.
2. Compact the pot capsule typography and hide secondary rails in the phone live-hand pill.
3. Extend the browser audit to fail pot/header, pot/seat, pot/board, and pot/beacon collisions.
4. Verify focused tests, real phone browser screenshots, full client tests, build, and `git diff --check`.
5. Update todolist and pitfall notes, then commit the phase.
