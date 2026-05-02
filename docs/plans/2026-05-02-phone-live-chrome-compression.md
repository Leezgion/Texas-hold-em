# Phone Live Chrome Compression Implementation Plan

**Goal:** Reduce duplicated phone live-hand chrome so the first screen reads as table-first instead of status-first.

**Scope:** CSS-only phone live-hand treatment. Do not change gameplay state, support sheets, desktop layout, or waiting-room chrome.

## Tasks

1. Add a contract test that requires phone live-hand to hide the table overlay status row and header mode/state duplicate badges.
2. Add scoped CSS under `.room-terminal-shell[data-viewport-model="phone-terminal"][data-room-play-state="live-hand"]`.
3. Verify focused client tests and real phone browser metrics at `390x844` and `375x667`.
4. Update product todolist and browser pitfall notes.
5. Run full client tests, build, `git diff --check`, then commit the phase.
