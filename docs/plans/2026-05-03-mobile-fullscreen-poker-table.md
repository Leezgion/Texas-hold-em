# Mobile Fullscreen Poker Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert phone live hands into a fullscreen felt-table cockpit with floating hero actions, non-scrolling raise sizing, and replay-style hand history.

**Architecture:** Keep the existing game state, room state, and view-model flow. Change phone live presentation by adding explicit contracts to `GameRoom`, `TableStage`, `ActionDock`, `ActionButtons`, `SeatCard`, and `EventRail`, then verify with contract tests and browser metrics.

**Tech Stack:** React, CSS/Tailwind utility classes, SVG table chrome, `motion/react`, Node test runner, browser smoke scripts.

---

### Task 1: Fullscreen Phone Table Contract

**Files:**
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add a contract that requires phone live hand to expose a fullscreen table surface and transparent stage chrome:

```js
test('phone-terminal live hand uses a fullscreen felt table shell instead of stacked panels', () => {
  assert.match(gameRoomSource, /data-phone-live-table-shell=\{isPhoneLiveHand \? 'fullscreen-felt' : 'standard'\}/);
  assert.match(tableStageSource, /data-phone-live-stage=\{[^}]*\? 'fullscreen-felt' : 'standard'\}/s);
  assert.match(globalStylesSource, /\.room-terminal-shell\[data-viewport-model="phone-terminal"\]\[data-room-play-state="live-hand"\]\[data-phone-live-table-shell="fullscreen-felt"\]\s*\{[\s\S]*height:\s*100dvh;[\s\S]*overflow:\s*hidden;/s);
  assert.match(globalStylesSource, /\.room-terminal-shell\[data-viewport-model="phone-terminal"\]\[data-room-play-state="live-hand"\]\s+\.table-stage-panel\s*\{[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/s);
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js`

Expected: FAIL because the new fullscreen data contract and transparent stage shell rules do not exist.

**Step 3: Implement minimal code**

- Add `data-phone-live-table-shell={isPhoneLiveHand ? 'fullscreen-felt' : 'standard'}` to `GameRoom`.
- Add `data-phone-live-stage={viewportLayout?.viewportModel === 'phone-terminal' ? 'fullscreen-felt' : 'standard'}` to `TableStage`.
- Add CSS that makes phone live shell `height: 100dvh`, `overflow: hidden`, and makes stage panel transparent.

**Step 4: Run test to verify it passes**

Run: `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/roomTerminalShellContract.test.js client/src/components/GameRoom.jsx client/src/components/TableStage.jsx client/src/index.css
git commit -m "fix: fullscreen phone poker table shell"
```

### Task 2: Floating Hero Actions And Non-Scrolling Raise

**Files:**
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add a contract that phone live hand uses a floating action overlay and raise sizing cannot internally scroll:

```js
test('phone-terminal live actions float on the table and raise sizing does not scroll', () => {
  assert.match(actionDockSource, /data-phone-action-presentation=\{isPhoneLiveHand \? 'floating-table-controls' : 'dock-panel'\}/);
  assert.match(actionButtonsSource, /data-phone-action-layout=\{isPhoneTerminal \? 'floating-thumb-zone' : 'standard'\}/);
  assert.match(globalStylesSource, /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\[data-phone-action-presentation="floating-table-controls"\]\s*\{[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none;/s);
  assert.match(globalStylesSource, /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\s+\.table-action-console--raise-open\s+\.table-action-console__raise-surface\s*\{[\s\S]*overflow:\s*hidden;/s);
  assert.doesNotMatch(globalStylesSource, /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\s+\.table-action-console--raise-open\s+\.table-action-console__raise-surface\s*\{[\s\S]*overflow-y:\s*auto;/s);
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js`

Expected: FAIL because phone floating action data and non-scrolling raise CSS do not exist.

**Step 3: Implement minimal code**

- Add phone action presentation data attributes.
- Convert phone live dock chrome to transparent overlay.
- Position hero cards and action buttons as a bottom thumb-zone overlay.
- Change raise surface to bounded fixed overlay with no internal vertical scrolling.
- Hide redundant phone live hero metric ribbons when they duplicate visible action data.

**Step 4: Run focused tests**

Run: `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js src/view-models/gameViewModel.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/roomTerminalShellContract.test.js client/src/components/ActionDock.jsx client/src/components/ActionButtons.jsx client/src/index.css
git commit -m "fix: float phone poker actions on table"
```

### Task 3: Poker-Style Seat And Bet Badges

**Files:**
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add a contract that phone live seats use poker-app compact badges:

```js
test('phone-terminal live seats use compact action stack and bet badges', () => {
  assert.match(seatCardSource, /data-phone-seat-presentation=\{[^}]*\? 'poker-app-badge' : 'plaque'\}/s);
  assert.match(seatCardSource, /arena-seat-plaque__phone-action-tag/);
  assert.match(seatCardSource, /arena-seat-plaque__phone-bet-chip/);
  assert.match(globalStylesSource, /\.room-terminal-shell\[data-viewport-model="phone-terminal"\]\[data-room-play-state="live-hand"\]\s+\.arena-seat-plaque\[data-phone-seat-presentation="poker-app-badge"\]\s*\{[\s\S]*background:\s*transparent;/s);
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js`

Expected: FAIL because phone compact badge markup and CSS do not exist.

**Step 3: Implement minimal code**

- Add phone live seat presentation data.
- Render action tag, compact stack, and bet chip as separate visual elements.
- Keep current existing labels and data; only change phone live visual hierarchy.

**Step 4: Run focused tests**

Run: `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/roomTerminalShellContract.test.js client/src/components/SeatCard.jsx client/src/index.css
git commit -m "fix: compact phone poker seat badges"
```

### Task 4: Hand Replay Side Drawer

**Files:**
- Modify: `client/src/components/interactionSurfaceContract.test.js`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add a contract that phone history opens as replay side drawer with lateral navigation:

```js
test('phone-terminal history panel presents a hand replay side drawer', () => {
  assert.match(gameRoomSource, /const supportPanelPresentation =[\s\S]*isPhoneLiveHand[\s\S]*'side-replay-drawer'/s);
  assert.match(eventRailSource, /data-event-presentation=\{presentation === 'side-replay-drawer' \? 'hand-replay' : presentation\}/);
  assert.match(eventRailSource, /event-rail__replay-controls/);
  assert.match(globalStylesSource, /\.room-panel-sheet\[data-presentation="side-replay-drawer"\]\s*\{[\s\S]*inset:\s*0 0 0 auto;/s);
});
```

**Step 2: Run test to verify it fails**

Run: `cd client && pnpm exec node --test src/components/interactionSurfaceContract.test.js`

Expected: FAIL because the side replay drawer contract does not exist.

**Step 3: Implement minimal code**

- Use `side-replay-drawer` presentation for phone live history.
- Let EventRail render compact replay rows, player action labels, visible cards when available, and previous/next controls.
- Keep members/room tools in compact drawers.

**Step 4: Run focused tests**

Run: `cd client && pnpm exec node --test src/components/interactionSurfaceContract.test.js src/view-models/handHistoryViewModel.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/interactionSurfaceContract.test.js client/src/components/GameRoom.jsx client/src/components/EventRail.jsx client/src/index.css
git commit -m "fix: add phone hand replay side drawer"
```

### Task 5: Browser Regression And Documentation

**Files:**
- Modify: `真实浏览器联机回归踩坑记录.md`
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`

**Step 1: Verify services**

Run:

```powershell
try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/api/rooms -TimeoutSec 3).StatusCode } catch { $_.Exception.Message }
try { (Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/index.html -TimeoutSec 3).StatusCode } catch { $_.Exception.Message }
```

Expected: backend API returns `200`; client returns `200` or use built app on `3001` after `pnpm build`.

**Step 2: Run automated browser smoke**

Use the existing browser scripts or create a focused `.runlogs` script that checks:

- phone `390x844`
- compact phone `375x667`
- live hand no document scroll
- raise open no internal scroll
- support drawer no inert leak
- settlement and history still accessible

**Step 3: Run full local verification**

Run:

```powershell
cd client; pnpm exec node --test
cd client; pnpm build
cd server; npm test -- --runInBand
git diff --check
```

Expected: client tests pass, build exits `0` with only known Vite chunk warning, server tests pass, diff check passes.

**Step 4: Update docs**

Record:

- what changed
- test evidence
- browser evidence
- pitfalls, especially service health, browser sessions, `.runlogs`, and scroll/overlay checks

**Step 5: Commit**

```bash
git add 真实浏览器联机回归踩坑记录.md docs/plans/2026-03-19-poker-product-polish-todolist.md
git commit -m "docs: record mobile fullscreen table qa"
```
