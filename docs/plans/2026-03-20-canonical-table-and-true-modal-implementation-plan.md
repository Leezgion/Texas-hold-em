# Canonical Table And True Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the remaining branch-level blockers by making the unified tournament table geometry truly canonical and by upgrading room surfaces to real modal behavior.

**Architecture:** Keep the current room shell, stage chrome, and gameplay/view-model flow intact. Replace only the unstable pieces: the hand-tuned seat anchor maps and the partial modal behavior. Geometry will move to normalized canonical slot data consumed by the existing layout helpers, and modal semantics will move to one shared behavior helper used by `Modal` and `RoomPanelSheet`.

**Tech Stack:** React, Vite, Tailwind 4, custom CSS, Node test runner, `motion/react`

---

### Task 1: Replace hand-tuned seat anchors with a canonical symmetric 9-max model

**Files:**
- Modify: `client/src/utils/seatRingLayout.js`
- Modify: `client/src/utils/seatRingLayout.test.js`
- Modify: `client/src/utils/tableStageLayout.js`

**Step 1: Write the failing test**

Extend `client/src/utils/seatRingLayout.test.js` to prove the new canonical model is mirrored and still safe for live counts.

Add assertions for:

- desktop `9-max` left/right anchors mirror each other
- phone `9-max` left/right anchors mirror each other
- `2`, `6`, and `9` player occupancy on both desktop and phone keep `tableBody` and `stageBand` overlaps at `0`

Example:

```js
test('desktop 9-max canonical anchors stay mirrored around the center line', () => {
  const layout = buildSeatRingPositions({
    playerCount: 9,
    viewportWidth: 1440,
    roomShellLayout: 'split-stage',
    tableDiameter: 352,
    profile: 'desktop-oval',
  });

  assert.equal(layout[1].x, -layout[7].x);
  assert.equal(layout[1].y, layout[7].y);
  assert.equal(layout[2].x, -layout[6].x);
  assert.equal(layout[2].y, layout[6].y);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/seatRingLayout.test.js
```

Expected: FAIL because the current anchor map is asymmetric and partially hard-coded.

**Step 3: Write minimal implementation**

- Replace the current hard-coded desktop and phone anchor arrays with normalized canonical slot definitions.
- Derive actual pixel anchors from the current table footprint.
- Keep `2-9` occupancy as explicit selections from the canonical map.
- Preserve hero anchor semantics and existing overlap counting.
- Update `tableStageLayout.js` only if needed so stage chrome continues to consume the corrected anchor geometry.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/seatRingLayout.js client/src/utils/seatRingLayout.test.js client/src/utils/tableStageLayout.js
git commit -m "fix: canonicalize tournament seat geometry"
```

### Task 2: Upgrade room surfaces to true modal behavior

**Files:**
- Create: `client/src/hooks/useModalSurface.js`
- Modify: `client/src/components/Modal.jsx`
- Modify: `client/src/components/RoomPanelSheet.jsx`
- Modify: `client/src/components/dialogSemanticsContract.test.js`
- Modify: `client/src/components/roomShellScrollContract.test.js`
- Create or Modify: narrow runtime-level tests for modal focus behavior in the current Node test stack

**Step 1: Write the failing test**

Replace the current source-text-only modal assertions with runtime behavior checks.

Add the narrowest possible tests that prove:

- opening a modal/sheet moves focus into the surface
- `Tab` stays inside the surface
- the app root becomes inert or `aria-hidden`
- closing restores focus

If needed, add a small helper-based test that exercises the shared modal behavior logic instead of full component rendering.

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/components/dialogSemanticsContract.test.js
```

Expected: FAIL because the current surfaces do not trap focus or isolate the background.

**Step 3: Write minimal implementation**

- Create a shared hook/helper for modal surface behavior.
- Use it in both `Modal` and `RoomPanelSheet`.
- Add focus trap looping for `Tab` / `Shift+Tab`.
- Mark the app root inert while the surface is open and restore it on close.
- Keep existing Escape and focus-restore behavior intact.

**Step 4: Run focused verification**

Run:

```bash
cd client
node --test src/components/dialogSemanticsContract.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/hooks/useModalSurface.js client/src/components/Modal.jsx client/src/components/RoomPanelSheet.jsx client/src/components/dialogSemanticsContract.test.js client/src/components/roomShellScrollContract.test.js
git commit -m "fix: enforce true modal behavior on room surfaces"
```

### Task 3: Refresh evidence and rerun final verification

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Extend the evidence checklist**

Update the polish todo and runbook so they explicitly call out:

- canonical seat symmetry as a review gate
- true modal keyboard isolation as a review gate

**Step 2: Run focused browser verification**

Use the healthy local environment if available.

Verify at minimum:

- one `9-player` room in desktop
- one `9-player` room in phone portrait
- create-room modal keyboard trap
- one room support sheet keyboard trap

Record exact room code, viewport, screenshot path, and observed result.

**Step 3: Record evidence**

Update:

- `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- `docs/runbooks/real-browser-regression-runbook.md`
- `真实浏览器联机回归踩坑记录.md`

with exact notes, screenshots, and any new pitfalls.

**Step 4: Run final verification**

Run:

```bash
cd client
node --test src/utils/productMode.test.js src/utils/roomViewportLayout.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js src/utils/tacticalMotion.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js src/components/gameRoomStageContract.test.js src/components/dialogSemanticsContract.test.js src/components/roomShellScrollContract.test.js
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
git commit -m "docs: record canonical table and true modal evidence"
```
