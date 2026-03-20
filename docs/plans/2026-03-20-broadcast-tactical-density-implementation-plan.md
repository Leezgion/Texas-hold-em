# Broadcast Tactical Density Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tighten the room and create-room surfaces so the Broadcast Tactical UI delivers more decision-critical information per screen without reintroducing scroll fights, oversized cards, or broken touch targets.

**Architecture:** Keep the existing single-screen room shell, unified `9-max` table family, and gameplay/view-model authority intact. Drive this pass through explicit density tokens, compact surface variants, copy tightening, and CSS/layout refinements rather than new gameplay behavior. Treat desktop and phone portrait as the primary targets.

**Tech Stack:** React, Vite, Tailwind 4, custom CSS, `motion/react`, Node test runner, Chrome DevTools browser verification.

---

### Task 1: Lock a density contract into the product-mode metadata

**Files:**
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`

**Step 1: Write the failing test**

Extend `client/src/utils/productMode.test.js` so the room and create-room surfaces expose explicit density fields.

```js
const pro = getDisplayModeTheme('pro');

assert.equal(pro.roomTerminal.densityModel, 'high-efficiency');
assert.equal(pro.roomTerminal.desktop.stageSpacing, 'tight');
assert.equal(pro.roomTerminal.phone.supportLauncherDensity, 'compact');
assert.equal(pro.createRoom.densityModel, 'compact-terminal');
assert.equal(pro.createRoom.modeTileHeight, 'short');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the new density fields do not exist yet.

**Step 3: Write minimal implementation**

- Add density metadata to `productMode.js`.
- Keep current visual-family tokens stable.
- Update the polish todo with a note that the next pass is focused on density and information efficiency.

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/productMode.js client/src/utils/productMode.test.js docs/plans/2026-03-19-poker-product-polish-todolist.md
git commit -m "feat: declare broadcast tactical density contract"
```

### Task 2: Compress the create-room surface into a real compact terminal sheet

**Files:**
- Modify: `client/src/components/CreateRoomModal.jsx`
- Modify: `client/src/components/ModePreviewCard.jsx`
- Modify: `client/src/components/Modal.jsx`
- Modify: `client/src/index.css`
- Modify: `client/src/components/createRoomSurfaceContract.test.js`

**Step 1: Write the failing test**

Extend or create a surface-contract test proving the create-room UI no longer relies on tall profile cards.

```js
assert.match(source, /data-create-room-density=\{theme\.createRoom\.densityModel\}/);
assert.match(source, /create-room-mode-grid--compact/);
assert.match(source, /mode-preview-card--terminal-tile/);
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/components/createRoomSurfaceContract.test.js src/utils/productMode.test.js
```

Expected: FAIL because the compact terminal classes and density contract are not wired yet.

**Step 3: Write minimal implementation**

- Tighten tile height and copy in `CreateRoomModal.jsx`.
- Keep mode titles horizontal and readable.
- Preserve modal semantics while reducing dead vertical space.
- Add compact scrollbar and layout styles in `index.css`.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/components/createRoomSurfaceContract.test.js src/utils/productMode.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/CreateRoomModal.jsx client/src/components/ModePreviewCard.jsx client/src/components/Modal.jsx client/src/index.css client/src/components/createRoomSurfaceContract.test.js
git commit -m "feat: compress the create-room terminal sheet"
```

### Task 3: Tighten the room shell and hero dock density without breaking the single-screen contract

**Files:**
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/TableHeader.jsx`
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Extend shell and view-model tests to lock tighter density tokens and a stable action area.

```js
const shell = deriveTableShellView(...);

assert.equal(shell.heroDockDensity, 'high-efficiency');
assert.equal(shell.stageSpacing, 'tight');
assert.equal(shell.supportLauncherDensity, 'compact');
```

Add a source contract proving the dock and stage still live in the same terminal frame after the density pass.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/components/roomTerminalShellContract.test.js src/view-models/gameViewModel.test.js
```

Expected: FAIL because the tighter shell metadata and compact launcher treatment are not encoded yet.

**Step 3: Write minimal implementation**

- Reduce redundant dock labels and spacing.
- Tighten the header/support trigger row.
- Preserve 44px buttons and fail-closed action behavior.
- Keep the table and dock visually coupled and co-visible.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/components/roomTerminalShellContract.test.js src/view-models/gameViewModel.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/GameRoom.jsx client/src/components/ActionDock.jsx client/src/components/ActionButtons.jsx client/src/components/TableHeader.jsx client/src/components/roomTerminalShellContract.test.js client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/index.css
git commit -m "feat: tighten broadcast tactical room density"
```

### Task 4: Compact seat plaques and the center-shell spacing

**Files:**
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/components/EmptySeat.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/components/CommunityCards.jsx`
- Modify: `client/src/components/gameRoomStageContract.test.js`
- Modify: `client/src/components/interactionSurfaceContract.test.js`
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add contract coverage proving plaques use a compact density tier and the center shell stays board-first without oversized spacing.

```js
const seatRing = deriveSeatRingView(...);

assert.equal(seatRing[0].densityTier, 'compact-primary');
assert.equal(seatRing[1].densityTier, 'compact-secondary');
```

Add source checks for compact plaque and center-shell class names.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/components/gameRoomStageContract.test.js src/components/interactionSurfaceContract.test.js src/view-models/gameViewModel.test.js
```

Expected: FAIL because the compact plaque tiers and tightened center-shell spacing are not fully encoded yet.

**Step 3: Write minimal implementation**

- Tighten seat plaque padding, metadata order, and empty-seat treatment.
- Reduce center-shell dead space around board and pot.
- Keep the broadcast-tactical material family intact.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/components/gameRoomStageContract.test.js src/components/interactionSurfaceContract.test.js src/view-models/gameViewModel.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/SeatCard.jsx client/src/components/EmptySeat.jsx client/src/components/TableStage.jsx client/src/components/CommunityCards.jsx client/src/components/gameRoomStageContract.test.js client/src/components/interactionSurfaceContract.test.js client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/index.css
git commit -m "feat: compact plaques and center-shell spacing"
```

### Task 5: Reduce phone support-surface overhead and lock the no-scroll terminal feel

**Files:**
- Modify: `client/src/components/RoomPanelSheet.jsx`
- Modify: `client/src/components/IntelRail.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/utils/roomViewportLayout.js`
- Modify: `client/src/utils/roomViewportLayout.test.js`
- Modify: `client/src/utils/tacticalMotion.js`
- Modify: `client/src/utils/tacticalMotion.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Extend viewport and motion tests so phone portrait explicitly stays compact and sheet-owned.

```js
const phone = resolveRoomViewportLayout({ width: 390, height: 844 });
assert.equal(phone.supportLauncherDensity, 'compact');
assert.equal(phone.pageScroll, 'locked');

const motion = buildTacticalMotionProfile('pro', { viewport: 'phone-terminal' });
assert.equal(motion.pageFloat, 'disabled');
assert.equal(motion.sheetPresentation, 'tight-terminal');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js src/utils/tacticalMotion.test.js
```

Expected: FAIL because the tighter phone sheet contract is not encoded yet.

**Step 3: Write minimal implementation**

- Tighten phone sheet headers, trigger bar, and spacing.
- Keep overflow owned by the sheet body, not the page.
- Avoid adding new blur/float effects that reintroduce sluggish scroll behavior.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js src/utils/tacticalMotion.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/RoomPanelSheet.jsx client/src/components/IntelRail.jsx client/src/components/EventRail.jsx client/src/utils/roomViewportLayout.js client/src/utils/roomViewportLayout.test.js client/src/utils/tacticalMotion.js client/src/utils/tacticalMotion.test.js client/src/index.css
git commit -m "feat: tighten phone support sheets for the poker terminal"
```

### Task 6: Capture browser evidence for the density pass and rerun verification

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `真实浏览器联机回归踩坑记录.md`
- Update or add evidence under: `.runlogs/`

**Step 1: Add the failing evidence checklist**

Update the polish todo and runbook so this pass explicitly requires evidence for:

- create-room desktop compact mode tiles
- room desktop waiting with tighter header/dock spacing
- room desktop live-hand with co-visible table and action area
- room phone waiting with compact launcher row
- room phone support sheet open without page-length scroll

**Step 2: Run real browser verification**

Use the healthy local dev environment without restarting user-owned servers unless they are actually unhealthy.

Capture at minimum:

- create-room desktop
- room desktop waiting
- room desktop live-hand
- room phone portrait waiting
- room phone portrait support sheet open

For each, verify:

- page scroll stays locked
- table + hero dock remain co-visible
- compact density does not collapse readability
- open-seat / hero plaque text remains readable

**Step 3: Record evidence**

Write exact screenshots, metrics, and any density-specific pitfalls to:

- `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- `docs/runbooks/real-browser-regression-runbook.md`
- `真实浏览器联机回归踩坑记录.md`

**Step 4: Run final verification**

Run:

```bash
cd client
$tests = Get-ChildItem -Path src -Recurse -Filter *.test.js | ForEach-Object { $_.FullName }
node --test $tests
npm run build

cd ../server
npm test -- --runInBand
```

Expected:

- client tests pass
- client build passes
- full server suite passes

**Step 5: Commit**

```bash
git add docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md "真实浏览器联机回归踩坑记录.md"
git add -f .runlogs/*
git commit -m "docs: record broadcast tactical density evidence"
```
