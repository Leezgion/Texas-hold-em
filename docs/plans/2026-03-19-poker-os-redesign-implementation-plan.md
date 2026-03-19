# Poker OS Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the current client into a mode-aware `Poker OS` with a redesigned gateway, a new room-shell architecture, and visibly differentiated `club`, `pro`, and `study` front-end experiences without changing server-authoritative gameplay.

**Architecture:** Keep gameplay truth in the existing server and `GameContext`, then move presentation decisions into a small set of shared shell components plus pure view-model helpers. Reuse one semantic layout across all modes and differentiate the experience through theme tokens, layout emphasis, copy, and motion rather than separate rule or route forks.

**Tech Stack:** React, React Router, Tailwind CSS, CSS custom properties, Node test runner, existing client view-model helpers, Socket.IO client, PowerShell regression scripts.

---

### Task 1: Add shared mode theme metadata and shell helpers

**Files:**
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`
- Create: `client/src/components/ModeShell.jsx`
- Modify: `client/src/App.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add tests for a helper like `getDisplayModeTheme(mode)` that returns stable tokens for:

```js
assert.deepEqual(getDisplayModeTheme('pro'), {
  shellClassName: 'mode-shell-pro',
  accentClassName: 'mode-accent-pro',
  label: 'Pro',
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because `getDisplayModeTheme` does not exist yet.

**Step 3: Write minimal implementation**

- add theme metadata helpers in `productMode.js`
- create `ModeShell.jsx` to apply the active display-mode theme class
- wrap the app content with `ModeShell`
- add shell-level CSS custom properties and background layers in `index.css`

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/productMode.js client/src/utils/productMode.test.js client/src/components/ModeShell.jsx client/src/App.jsx client/src/index.css
git commit -m "feat: add poker os theme shell"
```

### Task 2: Redesign the home route into the mode gateway

**Files:**
- Create: `client/src/components/ModePreviewCard.jsx`
- Create: `client/src/components/ModeGateway.jsx`
- Modify: `client/src/components/HomePage.jsx`
- Modify: `client/src/components/CreateRoomModal.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add tests to `client/src/utils/productMode.test.js` for a helper that returns the three gateway cards in the expected order and with the expected labels/details.

Example:

```js
assert.equal(buildModePreviewCards().length, 3);
assert.equal(buildModePreviewCards()[0].mode, 'club');
assert.equal(buildModePreviewCards()[1].mode, 'pro');
assert.equal(buildModePreviewCards()[2].mode, 'study');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because `buildModePreviewCards` does not exist yet.

**Step 3: Write minimal implementation**

- add the pure helper in `productMode.js`
- build `ModePreviewCard.jsx` and `ModeGateway.jsx`
- replace the current `HomePage` layout with the gateway shell
- keep existing create/join flows intact
- improve the create-room mode selection so the preset reads like a table profile instead of a raw setting

**Step 4: Run test and build verification**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
npm run build
```

Expected: PASS and successful build.

**Step 5: Commit**

```bash
git add client/src/utils/productMode.js client/src/utils/productMode.test.js client/src/components/ModePreviewCard.jsx client/src/components/ModeGateway.jsx client/src/components/HomePage.jsx client/src/components/CreateRoomModal.jsx client/src/index.css
git commit -m "feat: redesign the mode gateway"
```

### Task 3: Add room-shell view models for banners, seats, and rails

**Files:**
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/view-models/handHistoryViewModel.js`
- Modify: `client/src/view-models/handHistoryViewModel.test.js`

**Step 1: Write the failing test**

Add tests for pure helpers like:

- `deriveTableShellView`
- `deriveSeatRingView`
- `deriveIntelRailView`
- `deriveEventRailView`

Example:

```js
const shell = deriveTableShellView({
  roomId: 'ABC123',
  roomState: 'settling',
  roomMode: 'study',
  connected: true,
});

assert.equal(shell.modeLabel, 'Study');
assert.equal(shell.statusLabel, '结算中');
assert.equal(shell.roomCode, 'ABC123');
```

**Step 2: Run tests to verify they fail**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: FAIL because the new helpers do not exist yet.

**Step 3: Write minimal implementation**

- add shell, seat, and rail helpers in `gameViewModel.js`
- extend the history view-model for event-rail summaries
- keep the helpers pure and mode-aware
- avoid spreading mode branching throughout components

**Step 4: Run tests to verify they pass**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/view-models/handHistoryViewModel.js client/src/view-models/handHistoryViewModel.test.js
git commit -m "feat: add poker os shell view models"
```

### Task 4: Replace the room layout with the Poker OS shell

**Files:**
- Create: `client/src/components/TableHeader.jsx`
- Create: `client/src/components/TableBanner.jsx`
- Create: `client/src/components/TableStage.jsx`
- Create: `client/src/components/SeatRing.jsx`
- Create: `client/src/components/SeatCard.jsx`
- Create: `client/src/components/ActionDock.jsx`
- Create: `client/src/components/IntelRail.jsx`
- Create: `client/src/components/EventRail.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/Player.jsx`
- Modify: `client/src/components/EmptySeat.jsx`
- Modify: `client/src/components/PlayerPanel.jsx`
- Modify: `client/src/components/Leaderboard.jsx`
- Modify: `client/src/components/HandHistoryDrawer.jsx`
- Modify: `client/src/components/SettlementOverlay.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add new view-model assertions in `gameViewModel.test.js` for the data each shell component needs, especially:

- shared banner precedence
- seat ring ordering
- action-dock status labeling

These tests should prove the shell can render deterministic sections without components owning business rules.

**Step 2: Run tests to verify they fail**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL on the new shell-derived assertions.

**Step 3: Write minimal implementation**

- create the new shell components
- refactor `GameRoom.jsx` into an orchestrator that feeds them derived views
- keep existing action logic and modal flows intact
- reuse `ActionButtons`, `PlayerPanel`, `Leaderboard`, `HandHistoryDrawer`, and `SettlementOverlay` inside the new shell where practical
- move layout responsibility out of `GameRoom.jsx`

**Step 4: Run targeted tests and build**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js src/utils/productMode.test.js
npm run build
```

Expected: PASS and successful build.

**Step 5: Commit**

```bash
git add client/src/components/TableHeader.jsx client/src/components/TableBanner.jsx client/src/components/TableStage.jsx client/src/components/SeatRing.jsx client/src/components/SeatCard.jsx client/src/components/ActionDock.jsx client/src/components/IntelRail.jsx client/src/components/EventRail.jsx client/src/components/GameRoom.jsx client/src/components/ActionButtons.jsx client/src/components/Player.jsx client/src/components/EmptySeat.jsx client/src/components/PlayerPanel.jsx client/src/components/Leaderboard.jsx client/src/components/HandHistoryDrawer.jsx client/src/components/SettlementOverlay.jsx client/src/index.css client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js
git commit -m "feat: rebuild game room as poker os shell"
```

### Task 5: Differentiate `club`, `pro`, and `study` inside the shared shell

**Files:**
- Modify: `client/src/components/ModeShell.jsx`
- Modify: `client/src/components/ModeGateway.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/IntelRail.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/index.css`
- Modify: `client/src/styles/improvements.css`

**Step 1: Write the failing test**

Add tests in `productMode.test.js` that prove per-mode shell metadata differs in the expected ways, such as:

```js
const proTheme = getDisplayModeTheme('pro');
const clubTheme = getDisplayModeTheme('club');

assert.notEqual(proTheme.shellClassName, clubTheme.shellClassName);
assert.equal(proTheme.layoutDensity, 'high');
assert.equal(clubTheme.layoutDensity, 'medium');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the extra per-mode metadata is not complete yet.

**Step 3: Write minimal implementation**

- enrich theme metadata with density, motion, and emphasis tokens
- make `club`, `pro`, and `study` visibly distinct in shell presentation
- keep markup mostly shared
- adjust copy and default panel emphasis per mode without hiding critical state

**Step 4: Run test and build verification**

Run:

```bash
cd client
node --test src/utils/productMode.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: PASS and successful build.

**Step 5: Commit**

```bash
git add client/src/components/ModeShell.jsx client/src/components/ModeGateway.jsx client/src/components/ActionDock.jsx client/src/components/IntelRail.jsx client/src/components/EventRail.jsx client/src/components/TableStage.jsx client/src/index.css client/src/styles/improvements.css client/src/utils/productMode.js client/src/utils/productMode.test.js
git commit -m "feat: differentiate poker os display modes"
```

### Task 6: Verify, document, and record redesign-specific pitfalls

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `README.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Add the new regression checkpoints**

Update docs so operators explicitly verify:

- gateway mode previews
- room-shell responsive layout
- `club / pro / study` visual differentiation
- non-happy-path banners in the new shell

**Step 2: Run full verification**

Run:

```bash
cd server
npm test -- --runInBand

cd ..\\client
node --test src/utils/serverOrigin.test.js src/utils/socketRequest.test.js src/utils/productMode.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: all green.

**Step 3: Run browser regression**

Use the existing PowerShell scripts and capture fresh evidence for:

- one `club` room
- one `pro` room
- one `study` room
- one mobile-width spot check

**Step 4: Update docs with results**

- mark the relevant todo tasks done or in progress
- add any new pitfalls found during the redesign
- record the room ids / evidence summary

**Step 5: Commit**

```bash
git add docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md README.md "真实浏览器联机回归踩坑记录.md"
git commit -m "docs: record poker os redesign regression"
```
