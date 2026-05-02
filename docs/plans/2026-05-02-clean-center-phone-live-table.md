# Clean-Center Phone Live Table Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for implementation and superpowers:verification-before-completion before commit.

**Goal:** Make phone live-hand screens keep the table as the visual focus by replacing the oversized center status card with a low-profile clean-center cue.

**Architecture:** Keep the current unified vertical capsule table and action dock. Scope the change to phone live-hand CSS/contracts so desktop, waiting rooms, settlement rails, support sheets, and gameplay logic remain unchanged.

**Tech Stack:** React components, CSS contracts in `client/src/index.css`, Node test contracts, Playwright real-browser evidence in `.runlogs`.

---

### Task 1: Add Contract Coverage

**Files:**
- Modify: `client/src/components/roomTerminalShellContract.test.js`

**Steps:**
1. Add a failing test asserting phone live-hand styles define a clean-center cue contract.
2. Assert phone live-hand suppresses or flattens the oversized stage state card.
3. Run `node --test src/components/roomTerminalShellContract.test.js` from `client` and confirm the new test fails.

### Task 2: Implement Clean-Center CSS

**Files:**
- Modify: `client/src/index.css`

**Steps:**
1. Scope rules to `.room-terminal-shell[data-viewport-model="phone-terminal"][data-room-play-state="live-hand"]`.
2. Reduce the center status surface to a small non-blocking cue.
3. Keep pot, street, and current action visible but stop the large card from covering the felt and board tray.
4. Preserve existing short-height table/dock collision fixes.

### Task 3: Verify Locally

**Commands:**
- `cd client && node --test src/components/roomTerminalShellContract.test.js`
- `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/roomViewportLayout.test.js src/utils/tableStageLayout.test.js src/components/roomShellScrollContract.test.js`

**Expected:** all focused tests pass.

### Task 4: Real Browser Evidence

**Files:**
- Add ignored `.runlogs` audit script if needed.

**Steps:**
1. Reuse the running `3101 / 5173` dev pair.
2. Capture `390x844` and `375x667` phone live-hand screenshots.
3. Measure table, board, center cue, dock, cards, and raise drawer rects.
4. Require no page scroll, no clipped viewport, and no cue/board or cue/action collision.

### Task 5: Document And Commit

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Commands:**
- `cd client && node --test <all src/**/*.test.js>`
- `cd client && npm run build`
- `git diff --check`
- `git commit -m "fix: clean phone live table center"`
