# Unified 9-Max Tournament Table Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current mixed seat-ring geometry with a single `9-max` tournament capsule table model that works consistently across `2-9` players and across desktop, phone portrait, and short-height terminal windows.

**Architecture:** Keep `GameContext` and the gameplay/view-model layers authoritative. Rebuild the room table through explicit `9-max` anchor data, a unified SVG table model, a height-aware viewport policy, and DOM seat cards layered on top. Remove player-count-driven fallback geometry from the room surface.

**Tech Stack:** React, Vite, Tailwind 4, custom CSS, `motion/react`, Node test runner, Chrome/DevTools browser verification.

---

### Task 1: Lock the product contract to a unified 9-max tournament table

**Files:**
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`

**Step 1: Write the failing test**

Extend `client/src/utils/productMode.test.js` to prove the room shell now advertises a single canonical table family instead of count-specific table semantics.

Example:

```js
const pro = getDisplayModeTheme('pro');

assert.equal(pro.roomTerminal.tableFamily, 'tournament-capsule-9max');
assert.equal(pro.roomTerminal.maxVisualSeats, 9);
assert.equal(pro.roomTerminal.desktop.geometryModel, 'unified-9max');
assert.equal(pro.roomTerminal.phone.geometryModel, 'unified-9max-portrait');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the new terminal-table contract does not exist yet.

**Step 3: Write minimal implementation**

- Add `tableFamily`, `maxVisualSeats`, and geometry model tokens to the room-terminal metadata.
- Update the polish todo to note that the room shell is now targeting a unified `9-max` tournament table model.

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
git commit -m "feat: declare unified 9-max table contract"
```

### Task 2: Replace fallback ring math with explicit 9-max anchor maps

**Files:**
- Modify: `client/src/utils/seatRingLayout.js`
- Modify: `client/src/utils/seatRingLayout.test.js`

**Step 1: Write the failing test**

Add tests that prove:

- desktop `7-9` player rooms do not collide with the table body or stage band
- phone `7-9` player rooms keep hero anchored to `dock-edge`
- no supported count depends on the generic fallback ellipse

Example:

```js
test('keeps nine-player desktop tournament seats outside the table bounds', () => {
  const layout = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 1440,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });

  assert.equal(layout.overlaps.tableBody, 0);
  assert.equal(layout.overlaps.stageBand, 0);
});

test('keeps nine-player phone seats on the unified portrait table with dock-edge hero anchoring', () => {
  const layout = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 390,
    roomShellLayout: 'stacked',
    tableDiameter: 208,
    profile: 'phone-oval',
  });

  assert.equal(layout.heroAnchor.zone, 'dock-edge');
  assert.equal(layout.overlaps.tableBody, 0);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/seatRingLayout.test.js
```

Expected: FAIL because `7-9` players currently fall back to a generic ellipse and collide.

**Step 3: Write minimal implementation**

- Introduce explicit `desktop9MaxAnchors` and `phonePortrait9MaxAnchors`.
- Introduce explicit occupancy maps for `2-9` players.
- Remove the supported-count dependency on the generic fallback ellipse.
- Keep fallback logic only for genuinely unsupported situations, not normal room sizes.

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/utils/seatRingLayout.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/seatRingLayout.js client/src/utils/seatRingLayout.test.js
git commit -m "feat: add unified 9-max seat anchor maps"
```

### Task 3: Rebuild the SVG stage chrome around the unified table family

**Files:**
- Modify: `client/src/utils/tableStageLayout.js`
- Modify: `client/src/utils/tableStageLayout.test.js`
- Modify: `client/src/components/TableStageChrome.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Extend `tableStageLayout.test.js` so it proves the stage layout now derives from one tournament capsule family on both desktop and phone portrait.

Example:

```js
test('builds the same tournament table family for desktop and phone portrait', () => {
  const desktop = resolveTableSurfaceLayout({ viewportWidth: 1440, tableDiameter: 352 });
  const phone = resolveTableSurfaceLayout({ viewportWidth: 390, tableDiameter: 208 });

  assert.equal(desktop.family, 'tournament-capsule-9max');
  assert.equal(phone.family, 'tournament-capsule-9max');
  assert.equal(desktop.profile, 'desktop-oval');
  assert.equal(phone.profile, 'phone-oval');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/tableStageLayout.test.js
```

Expected: FAIL because the table family contract is not encoded yet.

**Step 3: Write minimal implementation**

- Add a `family` field such as `tournament-capsule-9max`.
- Rebuild `TableStageChrome` to render the new canonical table shell and marker orbit from the unified model.
- Update CSS so the stage chrome and felt styling reflect the same table family on both desktop and phone portrait.

**Step 4: Run test and build verification**

Run:

```bash
cd client
node --test src/utils/tableStageLayout.test.js src/utils/seatRingLayout.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/tableStageLayout.js client/src/utils/tableStageLayout.test.js client/src/components/TableStageChrome.jsx client/src/components/TableStage.jsx client/src/index.css
git commit -m "feat: rebuild stage chrome around unified tournament table"
```

### Task 4: Bind seat cards and markers to canonical anchor slots

**Files:**
- Modify: `client/src/components/SeatRing.jsx`
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`

**Step 1: Write the failing test**

Add assertions that the seat-ring view now exposes stable canonical anchor semantics rather than ad-hoc count-driven placement.

Example:

```js
const seatRing = deriveSeatRingView(...);

assert.equal(seatRing[0].anchorRole, 'hero');
assert.equal(seatRing[0].anchorZone, 'dock-edge');
assert.ok(seatRing.every((seat) => seat.anchorSlotId));
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL because the canonical slot metadata is incomplete.

**Step 3: Write minimal implementation**

- Thread canonical anchor/slot metadata into the seat-ring and seat-card render path.
- Ensure markers and hero treatment consume the canonical slot model instead of local heuristics.
- Keep gameplay state unchanged; this is presentation-layer stabilization only.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/utils/seatRingLayout.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/SeatRing.jsx client/src/components/SeatCard.jsx client/src/components/GameRoom.jsx client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js
git commit -m "feat: bind seat cards to canonical tournament anchors"
```

### Task 5: Make the viewport helper genuinely height-aware

**Files:**
- Modify: `client/src/utils/roomViewportLayout.js`
- Modify: `client/src/utils/roomViewportLayout.test.js`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/TableHeader.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add regression coverage for short-height windows that currently collapse the stage.

Example:

```js
test('short-height landscape windows relax the single-screen budget before the stage collapses', () => {
  const layout = resolveRoomViewportLayout({ width: 844, height: 390 });

  assert.equal(layout.heightClass, 'short-height');
  assert.equal(layout.stageDensity, 'compressed');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.minStageBudgetPx >= 180, true);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js
```

Expected: FAIL because the helper currently ignores `height`.

**Step 3: Write minimal implementation**

- Make `resolveRoomViewportLayout()` evaluate height as well as width.
- Add explicit short-height metadata such as:
  - `heightClass`
  - `stageDensity`
  - `minStageBudgetPx`
- Update `GameRoom`, `ActionDock`, `TableHeader`, and CSS to honor the compressed terminal mode instead of squeezing the stage to unusable height.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/roomViewportLayout.js client/src/utils/roomViewportLayout.test.js client/src/components/GameRoom.jsx client/src/components/ActionDock.jsx client/src/components/TableHeader.jsx client/src/index.css
git commit -m "fix: make room viewport layout height-aware"
```

### Task 6: Upgrade modal and support sheets to real dialog semantics

**Files:**
- Modify: `client/src/components/Modal.jsx`
- Modify: `client/src/components/RoomPanelSheet.jsx`
- Modify: `client/src/components/CreateRoomModal.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

If there is no existing component-test harness, add a minimal render-level assertion path or a utility-style test that checks the dialog attributes the components now emit.

Example expectation:

```js
assert.match(renderedHtml, /role="dialog"/);
assert.match(renderedHtml, /aria-modal="true"/);
```

If a render-level test is too heavy for the current setup, add a narrow implementation note in the plan and verify via browser/manual checks in Task 7 instead of inventing a new test stack.

**Step 2: Run the test or verification to confirm the gap**

Run the narrowest viable check for the current test setup.

Expected: FAIL or missing semantics before the fix.

**Step 3: Write minimal implementation**

- Add `role="dialog"` and `aria-modal`.
- Wire headers to `aria-labelledby`.
- Add Escape-key dismissal where appropriate.
- Add basic focus entry/return behavior if it can be done cleanly without introducing a new dependency.

**Step 4: Re-run verification**

Run the same targeted check plus:

```bash
cd client
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/Modal.jsx client/src/components/RoomPanelSheet.jsx client/src/components/CreateRoomModal.jsx client/src/index.css
git commit -m "feat: add dialog semantics to terminal surfaces"
```

### Task 7: Capture browser evidence for unified table behavior and short-height resilience

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Add or extend the failing evidence checklist**

Update the polish todo and runbook with explicit checks for:

- `2`, `6`, and `9` player rooms using the same table family
- phone portrait still rendering the same table family in vertical form
- short-height landscape not collapsing the stage
- hero anchor stability across counts

**Step 2: Run real browser verification**

Use the healthy local environment if available, otherwise the runbook environment.

Capture at minimum:

- create-room screen
- `2-player` room
- `6-player` room
- `9-player` room
- phone portrait room
- short-height window such as `844x390`

For each room, verify:

- same table family
- no table/seat collisions
- stable hero anchor
- no page-scroll fight

**Step 3: Record evidence**

Write exact scenario notes, screenshots, and any discovered pitfalls to:

- `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- `docs/runbooks/real-browser-regression-runbook.md`
- `真实浏览器联机回归踩坑记录.md`

**Step 4: Run final verification**

Run:

```bash
cd client
node --test src/utils/productMode.test.js src/utils/roomViewportLayout.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js src/utils/tacticalMotion.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
npm run build

cd ../server
npm test -- --runInBand
```

Expected:

- targeted client suite passes
- client build passes
- full server suite passes

**Step 5: Commit**

```bash
git add docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md 真实浏览器联机回归踩坑记录.md
git commit -m "docs: record unified 9-max tournament table evidence"
```
