# Short Phone Top Seat Plaque Implementation Plan

**Goal:** Keep the short-height phone live-hand top opponent readable without overlapping the header, pot pill, board tray, center cue, dock, or raise drawer.

**Scope:** CSS-only short-height phone live-hand treatment for the top occupied opponent plaque and its clipping containers. No gameplay, seat geometry, or desktop/tablet changes.

## Tasks

1. Add a failing contract test for the short-height top opponent micro plaque.
2. Add `seatHeader` collision detection to the browser audit so top-seat/header overlap cannot pass unnoticed.
3. Compact the top opponent plaque on short-height phone live hands while preserving critical information: seat, blind/position, stack, and current bet.
4. Allow the short-height live-hand stage container chain to show the top plaque instead of clipping it at the panel edge.
5. Verify focused tests, real phone browser screenshots, full client tests, build, and `git diff --check`.
6. Update the product todolist and real-browser pitfall log, then commit the phase.
