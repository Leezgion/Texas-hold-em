# RC UX Density Tightening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove duplicate mode selection and compress live table information so the product feels like a poker table first, not an admin dashboard.

**Architecture:** Keep the current React/CSS DOM architecture and browser QA scripts. Use the homepage selected table type as the default room mode, collapse non-decision information into menu/sheet surfaces, and keep live action controls in the same cockpit without adding a Canvas rewrite.

**Tech Stack:** React, Zustand, CSS/Tailwind utilities in `index.css`, Node `--test`, Playwright `.runlogs` browser audits.

---

### Task 1: Single Table-Type Selection

**Files:**
- Modify: `client/src/contexts/GameContext.jsx`
- Modify: `client/src/components/HomePage.jsx`
- Modify: `client/src/components/ModeGateway.jsx`
- Modify: `client/src/components/CreateRoomModal.jsx`
- Test: `client/src/components/modeGatewayMobileContract.test.js`
- Test: `client/src/components/createRoomSurfaceContract.test.js`

**Steps:**
1. Write failing tests that assert the homepage uses player-facing table-type language, removes duplicate `模式速览 / 显示模式`, and `CreateRoomModal` receives the selected mode as its initial `roomMode`.
2. Run the targeted tests and verify they fail on the current duplicate-selection behavior.
3. Add a store field for `pendingCreateRoomMode`, set it when the homepage create action is clicked, and initialize/reset `CreateRoomModal` settings from it.
4. Replace homepage copy with poker-facing action copy and keep the mode selector as a single compact table-type selector.
5. Run targeted tests, commit.

### Task 2: Phone Live Cockpit Compression And Fast Seat Menu

**Files:**
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/index.css`
- Test: `client/src/components/roomTerminalShellContract.test.js`

**Steps:**
1. Write failing tests that assert phone live hands collapse support launchers into one `桌面` menu button, expose quick `离座` through that path, and default pro metrics to a compact row.
2. Run the targeted tests and verify they fail.
3. Add a compact phone live support menu model without hiding the existing bottom sheet content.
4. Reduce default phone live cockpit chrome: hand cards + decision buttons stay primary; extra metrics/support buttons become secondary.
5. Run targeted tests and commit.

### Task 3: Horizontal Hand Timeline And Status Panel Pruning

**Files:**
- Modify: `client/src/components/HandHistoryDrawer.jsx`
- Modify: `client/src/components/RoomPanelSheet.jsx` if header copy needs tightening
- Modify: `client/src/components/GameRoom.jsx` if support panel composition needs pruning
- Modify: `client/src/index.css`
- Test: `client/src/components/roomTerminalShellContract.test.js`
- Test: `client/src/components/interactionSurfaceContract.test.js`

**Steps:**
1. Write failing tests that assert embedded/support-panel hand history uses a horizontal hand carousel surface and removes vertical tape dependence for phone support panels.
2. Write failing tests that assert panel copy avoids low-value system explanations and keeps actionable room state.
3. Run targeted tests and verify they fail.
4. Implement carousel controls with previous/next buttons and compact hand cards; keep detail lines available inside the selected hand.
5. Prune panel copy and labels to player-useful status only.
6. Run targeted tests and commit.

### Task 4: Browser Evidence And RC Record

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Steps:**
1. Run targeted Node tests after each task.
2. Run final `client` tests, build, and server tests.
3. Run homepage/create-room and live-room phone browser audits.
4. Record runIds, screenshots, and remaining non-blockers.
5. Commit documentation.
