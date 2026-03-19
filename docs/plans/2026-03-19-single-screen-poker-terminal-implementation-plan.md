# Single-Screen Poker Terminal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the room and create-room surfaces into a single-screen poker terminal that keeps the table, hero dock, and actions visible together on desktop and phone portrait.

**Architecture:** Keep `GameContext` and the existing view-model layer authoritative. Push the redesign through layout helpers, shell composition, modal/panel primitives, and table geometry helpers instead of rewriting gameplay state. Treat desktop and phone portrait as two explicit terminal layouts with the same underlying room data.

**Tech Stack:** React, Vite, Tailwind 4, custom CSS, `motion/react`, Node test runner, existing browser regression scripts.

---

### Task 1: Extend product-mode metadata for terminal layout and room-surface labels

**Files:**
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`

**Step 1: Write the failing test**

Add assertions proving each display mode now exposes:

- terminal shell intent
- phone/desktop room-surface policy
- create-room modal copy
- sheet labels for `players`, `history`, and `room`

Example:

```js
const pro = getDisplayModeTheme('pro');

assert.equal(pro.roomTerminal.desktop.surfaceModel, 'single-screen');
assert.equal(pro.roomTerminal.phone.heroDock, 'fixed-bottom');
assert.equal(pro.roomTerminal.phone.sheetOrder[0], 'players');
assert.equal(pro.createRoom.entryModel, 'profile-first');
assert.equal(pro.createRoom.primaryActionLabel, '创建房间');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the new token contract does not exist yet.

**Step 3: Write minimal implementation**

- extend `productMode.js` with:
  - `roomTerminal`
  - `createRoom`
  - `sheetLabels`
- keep the existing theme API stable for current callers
- avoid adding unused mode branches

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/productMode.js client/src/utils/productMode.test.js
git commit -m "feat: extend poker terminal mode metadata"
```

### Task 2: Add a viewport-layout helper for the single-screen room shell

**Files:**
- Create: `client/src/utils/roomViewportLayout.js`
- Create: `client/src/utils/roomViewportLayout.test.js`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/TableHeader.jsx`

**Step 1: Write the failing test**

Create tests that lock the core invariant: desktop and phone portrait must keep the room in a single-screen terminal model.

Example:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRoomViewportLayout } from './roomViewportLayout.js';

test('phone portrait keeps the hero dock fixed and moves support surfaces into sheets', () => {
  const layout = resolveRoomViewportLayout({ width: 390, height: 844 });

  assert.equal(layout.viewportModel, 'phone-terminal');
  assert.equal(layout.pageScroll, 'locked');
  assert.equal(layout.heroDockPlacement, 'fixed-bottom');
  assert.equal(layout.supportSurfaceModel, 'bottom-sheets');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js
```

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

- create `resolveRoomViewportLayout()`
- return explicit policies for:
  - `phone-terminal`
  - `tablet-terminal`
  - `desktop-terminal`
  - `ultrawide-terminal`
- wire `GameRoom`, `ActionDock`, and `TableHeader` to consume the helper without changing gameplay behavior

**Step 4: Run tests to verify they pass**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js src/utils/productMode.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/roomViewportLayout.js client/src/utils/roomViewportLayout.test.js client/src/components/GameRoom.jsx client/src/components/ActionDock.jsx client/src/components/TableHeader.jsx
git commit -m "feat: add single-screen room viewport layout helper"
```

### Task 3: Redesign the modal primitive and the create-room surface

**Files:**
- Modify: `client/src/components/Modal.jsx`
- Modify: `client/src/components/CreateRoomModal.jsx`
- Modify: `client/src/components/ModePreviewCard.jsx`
- Modify: `client/src/index.css`
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`

**Step 1: Write the failing test**

Extend `productMode.test.js` to lock the new create-room contract:

```js
const club = getDisplayModeTheme('club');

assert.equal(club.createRoom.surface, 'panel');
assert.equal(club.createRoom.phoneSurface, 'full-screen-sheet');
assert.equal(club.createRoom.tileLayout, 'horizontal');
assert.equal(club.createRoom.advancedSettingsMode, 'collapsed');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the modal contract is incomplete.

**Step 3: Write minimal implementation**

- upgrade `Modal.jsx` to support:
  - scrollable panel mode
  - full-screen sheet mode
  - fixed header/footer content
- rebuild `CreateRoomModal.jsx` into:
  - mode tiles first
  - essential settings second
  - advanced settings collapsed by default
- restyle the scrollbar and modal body in `index.css`
- ensure Chinese copy stays horizontal and readable

**Step 4: Run verification**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/Modal.jsx client/src/components/CreateRoomModal.jsx client/src/components/ModePreviewCard.jsx client/src/index.css client/src/utils/productMode.js client/src/utils/productMode.test.js
git commit -m "feat: redesign the create-room terminal sheet"
```

### Task 4: Rebuild the room shell into a true single-screen terminal

**Files:**
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/ModeShell.jsx`
- Modify: `client/src/components/TableHeader.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/IntelRail.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/index.css`
- Modify: `client/src/view-models/gameViewModel.test.js`

**Step 1: Write the failing test**

Add assertions that lock the room-shell data expected by the new terminal layout.

Example:

```js
const view = deriveTableShellView({
  roomId: 'ROOM1',
  roomState: 'playing',
  roomSettings: { roomMode: 'pro', maxPlayers: 6 },
  connected: true,
  effectiveDisplayMode: 'pro',
  currentPlayer,
  players,
  gameState,
});

assert.equal(view.heroDockPriority, 'always-visible');
assert.equal(view.supportSurfacePolicy.phone, 'sheet');
assert.equal(view.supportSurfacePolicy.desktop, 'panel-or-rail');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/utils/roomViewportLayout.test.js
```

Expected: FAIL because the terminal shell fields are missing.

**Step 3: Write minimal implementation**

- make `GameRoom` render a locked single-screen shell
- keep `Hero Dock` fixed and co-visible with the stage
- stop using page-length composition for live play
- keep desktop side surfaces secondary unless there is safe width
- push the necessary shell metadata through the existing view-model contract

**Step 4: Run verification**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/utils/roomViewportLayout.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/GameRoom.jsx client/src/components/ModeShell.jsx client/src/components/TableHeader.jsx client/src/components/ActionDock.jsx client/src/components/IntelRail.jsx client/src/components/EventRail.jsx client/src/index.css client/src/view-models/gameViewModel.test.js
git commit -m "feat: turn the room into a single-screen poker terminal"
```

### Task 5: Replace circular stage geometry with true desktop and phone table profiles

**Files:**
- Modify: `client/src/utils/seatRingLayout.js`
- Modify: `client/src/utils/seatRingLayout.test.js`
- Modify: `client/src/utils/tableStageLayout.js`
- Modify: `client/src/utils/tableStageLayout.test.js`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/components/TableStageChrome.jsx`
- Modify: `client/src/components/SeatRing.jsx`
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/components/CommunityCards.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add geometry tests for both desktop and phone portrait:

```js
test('desktop profile uses an oval table and keeps the top seat clear of the stage band', () => {
  const layout = buildSeatRingPositions({
    width: 1280,
    height: 900,
    maxPlayers: 6,
    profile: 'desktop-oval',
  });

  assert.equal(layout.profile, 'desktop-oval');
  assert.equal(layout.overlaps.stageBand, 0);
});

test('phone portrait profile uses a vertical oval and keeps hero tied to the dock edge', () => {
  const layout = buildSeatRingPositions({
    width: 390,
    height: 844,
    maxPlayers: 6,
    profile: 'phone-oval',
  });

  assert.equal(layout.profile, 'phone-oval');
  assert.equal(layout.heroAnchor.zone, 'dock-edge');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js
```

Expected: FAIL because the existing helpers still model the stage too much like a circular HUD.

**Step 3: Write minimal implementation**

- add explicit table profiles:
  - `desktop-oval`
  - `phone-oval`
- rebuild seat anchors around the table edge instead of a circle
- keep the board tray and stage band clear
- render the new geometry through `TableStageChrome`, `SeatRing`, and `SeatCard`

**Step 4: Run verification**

Run:

```bash
cd client
node --test src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js src/view-models/gameViewModel.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/utils/seatRingLayout.js client/src/utils/seatRingLayout.test.js client/src/utils/tableStageLayout.js client/src/utils/tableStageLayout.test.js client/src/components/TableStage.jsx client/src/components/TableStageChrome.jsx client/src/components/SeatRing.jsx client/src/components/SeatCard.jsx client/src/components/CommunityCards.jsx client/src/index.css
git commit -m "feat: rebuild table geometry for desktop and phone"
```

### Task 6: Move roster, history, and room tools into secondary panels and sheets

**Files:**
- Create: `client/src/components/RoomPanelSheet.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/IntelRail.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/components/HandHistoryDrawer.jsx`
- Modify: `client/src/components/Leaderboard.jsx`
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/index.css`
- Modify: `client/src/utils/roomViewportLayout.js`
- Modify: `client/src/utils/roomViewportLayout.test.js`

**Step 1: Write the failing test**

Extend `roomViewportLayout.test.js` to prove support surfaces are no longer part of the main page flow on phone portrait and compact desktop widths.

Example:

```js
const phone = resolveRoomViewportLayout({ width: 390, height: 844 });
assert.equal(phone.supportSurfaceModel, 'bottom-sheets');
assert.equal(phone.pageScroll, 'locked');

const compactDesktop = resolveRoomViewportLayout({ width: 1280, height: 900 });
assert.equal(compactDesktop.supportSurfaceModel, 'slide-panels');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js
```

Expected: FAIL because panel/sheet policies are not complete yet.

**Step 3: Write minimal implementation**

- create `RoomPanelSheet.jsx`
- move `Players`, `History`, and `Room` tools into:
  - bottom sheets on phone portrait
  - slide panels or conditional rails on desktop
- preserve existing room actions and history semantics
- prevent support surfaces from lengthening the page

**Step 4: Run verification**

Run:

```bash
cd client
node --test src/utils/roomViewportLayout.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/RoomPanelSheet.jsx client/src/components/GameRoom.jsx client/src/components/IntelRail.jsx client/src/components/EventRail.jsx client/src/components/HandHistoryDrawer.jsx client/src/components/Leaderboard.jsx client/src/components/ActionDock.jsx client/src/index.css client/src/utils/roomViewportLayout.js client/src/utils/roomViewportLayout.test.js
git commit -m "feat: move room support surfaces into sheets and panels"
```

### Task 7: Tighten motion cost, reduce mobile scroll fights, and record browser evidence

**Files:**
- Modify: `client/src/utils/tacticalMotion.js`
- Modify: `client/src/utils/tacticalMotion.test.js`
- Modify: `client/src/components/ModeShell.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/index.css`
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Write the failing test**

Extend the motion helper tests to enforce the new mobile restrictions.

Example:

```js
const phone = buildMotionProfile({ mode: 'pro', viewport: 'phone-terminal' });

assert.equal(phone.allowBackdropBlurStacks, false);
assert.equal(phone.pageFloat, 'disabled');
assert.equal(phone.primaryTransitions, 'transform-opacity-only');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/tacticalMotion.test.js
```

Expected: FAIL because the stricter mobile motion contract does not exist yet.

**Step 3: Write minimal implementation**

- lower motion cost on the room shell
- remove scroll-fighting CSS from phone portrait surfaces
- restrict room motion to transform/opacity where possible
- update runbook checks and pitfall log for the new terminal layout

**Step 4: Run verification**

Run:

```bash
cd client
node --test src/utils/tacticalMotion.test.js src/utils/roomViewportLayout.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
cd ..\\server
npm test -- --runInBand
cd ..\\client
npm run build
```

Expected:

- client targeted tests PASS
- server suite PASS
- build PASS

**Step 5: Capture browser evidence**

Run:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 status
```

If the regression ports are not already healthy, start them:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 start-all -CleanProfile
```

Then capture fresh evidence for:

- create-room desktop
- create-room phone portrait
- room desktop `1280x900`
- room phone portrait around `390x844`
- one live-hand view proving table + hero dock are simultaneously visible
- one auxiliary sheet open on phone portrait without forcing page-length scrolling

Update:

- `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- `docs/runbooks/real-browser-regression-runbook.md`
- `真实浏览器联机回归踩坑记录.md`

**Step 6: Commit**

```bash
git add client/src/utils/tacticalMotion.js client/src/utils/tacticalMotion.test.js client/src/components/ModeShell.jsx client/src/components/GameRoom.jsx client/src/index.css docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md "真实浏览器联机回归踩坑记录.md"
git commit -m "docs: record single-screen poker terminal evidence"
```
