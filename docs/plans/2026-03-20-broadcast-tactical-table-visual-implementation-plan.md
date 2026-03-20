# Broadcast Tactical Table Visual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the room’s visual shell around a broadcast-grade `9-max` tournament capsule table with deep green felt, black-gold rails, embedded seat plaques, and a table-coupled hero dock.

**Architecture:** Keep gameplay and room-state authority exactly where it is today. Push this pass through table chrome geometry, seat plaque rendering, dock composition, center-table hierarchy, and responsive visual tokens instead of rewriting gameplay flow. Preserve the single-screen terminal contract across desktop and phone portrait.

**Tech Stack:** React, Vite, Tailwind 4, custom CSS, `motion/react`, Node test runner, Chrome DevTools browser verification.

---

### Task 1: Lock the visual contract to the broadcast tactical table family

**Files:**
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`

**Step 1: Write the failing test**

Extend `client/src/utils/productMode.test.js` so each mode exposes the new visual contract fields:

```js
const pro = getDisplayModeTheme('pro');

assert.equal(pro.roomTerminal.tableVisualFamily, 'broadcast-tactical-9max');
assert.equal(pro.roomTerminal.tableMaterial.feltTone, 'deep-green-velvet');
assert.equal(pro.roomTerminal.tableMaterial.railTone, 'black-gold');
assert.equal(pro.roomTerminal.centerSurfaceModel, 'broadcast-clean-center');
assert.equal(pro.roomTerminal.seatPlaqueStyle, 'embedded-electronic');
assert.equal(pro.roomTerminal.heroDockStyle, 'table-coupled-terminal');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the visual contract fields do not exist yet.

**Step 3: Write minimal implementation**

- Add the visual contract tokens to `productMode.js`.
- Keep current callers stable; do not rename existing terminal metadata.
- Update the polish todo with a note that the next phase is the `Broadcast Tactical` table pass.

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
git commit -m "feat: declare broadcast tactical table contract"
```

### Task 2: Rebuild table chrome materials around the black-gold rail and deep green felt

**Files:**
- Modify: `client/src/components/TableStageChrome.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/utils/tableStageLayout.js`
- Modify: `client/src/utils/tableStageLayout.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Extend `tableStageLayout.test.js` and contract tests so the stage advertises the new material family and center-clean contract:

```js
const layout = resolveTableSurfaceLayout({ viewportWidth: 1280, tableDiameter: 352 });

assert.equal(layout.family, 'broadcast-tactical-9max');
assert.equal(layout.centerSurfaceModel, 'broadcast-clean-center');
assert.equal(layout.material.feltTone, 'deep-green-velvet');
assert.equal(layout.material.railTone, 'black-gold');
```

Also extend the JSX contract so `TableStageChrome` no longer relies on the old circular/HUD-style shell language.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/tableStageLayout.test.js src/components/gameRoomStageContract.test.js
```

Expected: FAIL because the visual material contract is missing.

**Step 3: Write minimal implementation**

- Update `tableStageLayout.js` with the new visual family metadata.
- Rework `TableStageChrome.jsx` to render:
  - black-gold outer rail
  - dark inner transition rail
  - deep green felt
  - cleaner center board/pot framing
- Update CSS tokens in `index.css` for felt, rail, metallic highlights, and restrained grain.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/utils/tableStageLayout.test.js src/components/gameRoomStageContract.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/TableStageChrome.jsx client/src/components/TableStage.jsx client/src/utils/tableStageLayout.js client/src/utils/tableStageLayout.test.js client/src/index.css
git commit -m "feat: rebuild tournament table materials for broadcast tactical mode"
```

### Task 3: Redesign seat cards into embedded electronic plaques

**Files:**
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/components/EmptySeat.jsx`
- Modify: `client/src/components/SeatRing.jsx`
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/components/interactionSurfaceContract.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add or extend tests that lock the embedded plaque contract:

```js
const seatRing = deriveSeatRingView(...);
assert.equal(seatRing[0].visualRole, 'embedded-plaque');
assert.equal(seatRing[0].densityTier, 'compact-primary');
assert.equal(seatRing[0].anchorRole, 'hero');
```

Add contract checks proving `SeatCard.jsx` renders embedded plaque class names rather than generic floating-card classes.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/components/interactionSurfaceContract.test.js
```

Expected: FAIL because the embedded plaque contract is not present yet.

**Step 3: Write minimal implementation**

- Thread plaque-specific metadata through `deriveSeatRingView()`.
- Redesign `SeatCard.jsx` and `EmptySeat.jsx` so they read as embedded rail plaques.
- Keep accessibility and button semantics intact for empty seats.
- Update CSS for:
  - inset plaque framing
  - hero plaque emphasis
  - current-turn glow
  - compact status rows

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/components/interactionSurfaceContract.test.js src/utils/seatRingLayout.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/SeatCard.jsx client/src/components/EmptySeat.jsx client/src/components/SeatRing.jsx client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/components/interactionSurfaceContract.test.js client/src/index.css
git commit -m "feat: render embedded electronic seat plaques"
```

### Task 4: Couple the hero dock to the lower rail and tighten action density

**Files:**
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Extend room-shell and view-model tests so the dock exposes the new table-coupled cockpit contract:

```js
const shell = deriveTableShellView(...);
assert.equal(shell.heroDockStyle, 'table-coupled-terminal');
assert.equal(shell.heroDockDensity, 'high-efficiency');
```

Add a source/contract assertion proving `GameRoom` keeps the dock visually attached to the table frame and does not reintroduce page flow separation.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/components/roomTerminalShellContract.test.js src/view-models/gameViewModel.test.js
```

Expected: FAIL because the dock coupling and density contract are not encoded yet.

**Step 3: Write minimal implementation**

- Update `ActionDock.jsx` and `ActionButtons.jsx` to reduce redundant labels and spacing.
- Visually attach the dock to the bottom rail in `GameRoom.jsx` and CSS.
- Keep primary actions stable and one-screen.
- Preserve all existing pending/error states.

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
git add client/src/components/ActionDock.jsx client/src/components/ActionButtons.jsx client/src/components/GameRoom.jsx client/src/components/roomTerminalShellContract.test.js client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/index.css
git commit -m "feat: couple hero dock to the tournament table"
```

### Task 5: Clean the table center and rebalance board / pot / street hierarchy

**Files:**
- Modify: `client/src/components/CommunityCards.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/components/SettlementOverlay.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/view-models/handHistoryViewModel.js`
- Modify: `client/src/view-models/handHistoryViewModel.test.js`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add assertions that the center surface now declares a cleaner hierarchy:

```js
const summary = buildTablePotSummary(...);
assert.equal(summary.centerPriority, 'board-pot-street');
```

Add contract checks that `CommunityCards` and `TableStage` use the cleaned center-shell class names and do not reintroduce a HUD ring language.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/handHistoryViewModel.test.js src/components/gameRoomStageContract.test.js
```

Expected: FAIL because the center-priority contract is not present yet.

**Step 3: Write minimal implementation**

- Reduce visual noise around the board tray and pot capsule.
- Keep settlement overlays subordinate to the board/pot composition.
- Tighten labels and spacing in the center surface.
- Keep board and pot as the first read.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/view-models/handHistoryViewModel.test.js src/components/gameRoomStageContract.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/CommunityCards.jsx client/src/components/TableStage.jsx client/src/components/SettlementOverlay.jsx client/src/components/EventRail.jsx client/src/view-models/handHistoryViewModel.js client/src/view-models/handHistoryViewModel.test.js client/src/index.css
git commit -m "feat: rebalance board and pot hierarchy for the broadcast table"
```

### Task 6: Add restrained broadcast-tactical motion for plaques, dock, and turn cues

**Files:**
- Modify: `client/src/utils/tacticalMotion.js`
- Modify: `client/src/utils/tacticalMotion.test.js`
- Modify: `client/src/components/ModeShell.jsx`
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Extend motion tests to prove the new visual pass keeps restrained, viewport-aware timing:

```js
const profile = buildTacticalMotionProfile('pro', { viewport: 'desktop-terminal' });
assert.equal(profile.tableVisualCueStyle, 'broadcast-tactical');
assert.equal(profile.viewportShellStyle, 'restrained-competition');
```

Add contract assertions for the new plaque / dock / turn-cue class names where appropriate.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/tacticalMotion.test.js src/components/interactionSurfaceContract.test.js
```

Expected: FAIL because the new motion style fields and class contracts do not exist yet.

**Step 3: Write minimal implementation**

- Add a restrained broadcast-tactical cue family to `tacticalMotion.js`.
- Limit motion to:
  - turn emphasis
  - plaque response
  - dock cue
  - pot / settlement confirmation
- Keep phone portrait conservative.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/utils/tacticalMotion.test.js src/components/interactionSurfaceContract.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/tacticalMotion.js client/src/utils/tacticalMotion.test.js client/src/components/ModeShell.jsx client/src/components/SeatCard.jsx client/src/components/ActionDock.jsx client/src/components/TableStage.jsx client/src/index.css
git commit -m "feat: add restrained broadcast tactical motion cues"
```

### Task 7: Capture browser evidence for the new table identity on desktop and phone

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `真实浏览器联机回归踩坑记录.md`
- Update or add evidence under: `.runlogs/`

**Step 1: Add the failing evidence checklist**

Update the polish todo and runbook so this pass explicitly requires evidence for:

- desktop broadcast table rail + felt material
- phone portrait vertical capsule using the same family
- embedded seat plaque treatment
- hero dock visually attached to the lower rail
- center table staying board-first / pot-second

**Step 2: Run real browser verification**

Use the healthy local dev environment.

Capture at minimum:

- create-room screen
- room desktop waiting state
- room desktop live-hand state
- room phone portrait waiting state
- room phone portrait support sheet open

For each, verify:

- `broadcast-tactical-9max` identity is visually obvious
- open seats and hero plaque still remain readable
- no page-scroll fight
- hero dock remains attached to the table composition

**Step 3: Record evidence**

Write exact screenshots, metrics, and pitfalls to:

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
git add docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md 真实浏览器联机回归踩坑记录.md
git add -f .runlogs/*
git commit -m "docs: record broadcast tactical table evidence"
```
