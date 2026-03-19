# Tactical Arena UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the current Poker OS shell into a more immersive and responsive Tactical Arena UI across desktop, phone portrait, tablet, and ultra-wide layouts while preserving existing room and action semantics.

**Architecture:** Reuse the current shell component model and view-model layer, but move the visual system to stronger theme tokens, tighter responsive layout rules, and more deliberate component variants. Keep state and action truth in `GameContext` and existing view-model helpers; only evolve presentation structure, tokens, and component composition.

**Tech Stack:** React, Vite, Tailwind utility classes, custom CSS, CSS variables, client view-model tests, Node test runner, existing browser regression scripts.

---

### Task 1: Extend theme metadata for Tactical Arena tokens and responsive hints

**Files:**
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`

**Step 1: Write the failing test**

Add new assertions that prove each display mode now exposes:

- visual intent metadata
- motion profile
- density hints
- responsive titles / captions used by the shell

Example:

```js
const pro = getDisplayModeTheme('pro');

assert.equal(pro.motionStyle, 'sharp');
assert.equal(pro.layoutDensity, 'high');
assert.equal(typeof pro.room.stageLabel, 'string');
assert.equal(typeof pro.room.actionTitle, 'string');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL because the new token shape is incomplete.

**Step 3: Write minimal implementation**

- extend `productMode.js` with Tactical Arena tokens
- keep the mode API stable for existing callers
- avoid adding unused token branches

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
git commit -m "feat: extend tactical arena mode tokens"
```

### Task 2: Rebuild shell-level CSS tokens and responsive layout foundations

**Files:**
- Modify: `client/src/index.css`
- Modify: `client/src/components/ModeShell.jsx`
- Modify: `client/src/App.jsx`

**Step 1: Write the failing test**

Add or extend `productMode.test.js` so the shell metadata needed by `ModeShell` is explicit and verified.

Example:

```js
const club = getDisplayModeTheme('club');
assert.equal(club.shellClassName, 'mode-shell-club');
assert.equal(club.accentClassName, 'mode-accent-club');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL if the shell token contract is still incomplete.

**Step 3: Write minimal implementation**

- replace the current shell background and panel styling with Tactical Arena tokens
- add explicit breakpoints for:
  - phone portrait
  - tablet
  - desktop
  - ultra-wide
- keep shell markup stable where possible
- keep accessibility and reduced-motion fallbacks intact

**Step 4: Run build verification**

Run:

```bash
cd client
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/index.css client/src/components/ModeShell.jsx client/src/App.jsx
git commit -m "feat: add tactical arena shell styling"
```

### Task 3: Redesign the mode gateway into a premium entry surface

**Files:**
- Modify: `client/src/components/ModeGateway.jsx`
- Modify: `client/src/components/ModePreviewCard.jsx`
- Modify: `client/src/components/HomePage.jsx`
- Modify: `client/src/components/CreateRoomModal.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add tests for the gateway card copy and order if needed in:

- `client/src/utils/productMode.test.js`

Example:

```js
const cards = buildModePreviewCards();
assert.equal(cards.length, 3);
assert.equal(cards[1].mode, 'pro');
assert.equal(typeof cards[1].tagline, 'string');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL if the richer preview metadata does not exist yet.

**Step 3: Write minimal implementation**

- redesign the gateway as a broadcast-grade entry page
- make mode cards feel like selectable table profiles
- keep create/join flows intact
- keep mobile readability first-class

**Step 4: Run test and build verification**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/ModeGateway.jsx client/src/components/ModePreviewCard.jsx client/src/components/HomePage.jsx client/src/components/CreateRoomModal.jsx client/src/index.css client/src/utils/productMode.js client/src/utils/productMode.test.js
git commit -m "feat: redesign the tactical arena gateway"
```

### Task 4: Upgrade the table stage and seat system

**Files:**
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/components/SeatRing.jsx`
- Modify: `client/src/components/SeatCard.jsx`
- Modify: `client/src/components/TableHeader.jsx`
- Modify: `client/src/components/TableBanner.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add view-model tests proving the stage and seat system still gets the required inputs:

- seat labels
- position labels
- current-turn flags
- banner precedence

Use:

- `client/src/view-models/gameViewModel.test.js`

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL if the new required stage/seat assertions are not yet satisfied.

**Step 3: Write minimal implementation**

- restyle the stage as a felt-centered tactical arena
- make seat cards read like electronic tactical plaques
- improve current-turn emphasis
- keep room banners and table-state overlays readable
- preserve the existing action and modal flows

**Step 4: Run tests and build**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/TableStage.jsx client/src/components/SeatRing.jsx client/src/components/SeatCard.jsx client/src/components/TableHeader.jsx client/src/components/TableBanner.jsx client/src/components/GameRoom.jsx client/src/index.css client/src/view-models/gameViewModel.test.js
git commit -m "feat: upgrade tactical arena table stage"
```

### Task 5: Redesign the hero dock and rail surfaces

**Files:**
- Modify: `client/src/components/ActionDock.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/IntelRail.jsx`
- Modify: `client/src/components/EventRail.jsx`
- Modify: `client/src/components/SettlementOverlay.jsx`
- Modify: `client/src/components/PlayerPanel.jsx`
- Modify: `client/src/components/Leaderboard.jsx`
- Modify: `client/src/components/HandHistoryDrawer.jsx`
- Modify: `client/src/index.css`

**Step 1: Write the failing test**

Add or extend tests for:

- action summary rows
- event-rail summary formatting
- seat/roster summary formatting

Use:

- `client/src/view-models/gameViewModel.test.js`
- `client/src/view-models/handHistoryViewModel.test.js`

**Step 2: Run tests to verify they fail**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: FAIL on the new Tactical Arena-specific expectations.

**Step 3: Write minimal implementation**

- turn the hero dock into a stronger fixed decision cockpit
- redesign rails to feel like tactical consoles rather than generic cards
- make settlement results more scoreboard-like
- ensure phone portrait keeps the dock usable without overlap

**Step 4: Run tests and build**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js src/utils/productMode.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/ActionDock.jsx client/src/components/ActionButtons.jsx client/src/components/IntelRail.jsx client/src/components/EventRail.jsx client/src/components/SettlementOverlay.jsx client/src/components/PlayerPanel.jsx client/src/components/Leaderboard.jsx client/src/components/HandHistoryDrawer.jsx client/src/index.css client/src/view-models/gameViewModel.test.js client/src/view-models/handHistoryViewModel.test.js
git commit -m "feat: polish tactical arena dock and rails"
```

### Task 6: Verify responsive behavior and document new UI pitfalls

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `README.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Update the regression checklist**

Add explicit checks for:

- desktop shell
- phone portrait shell
- mode gateway readability
- current-turn visibility
- dock stability during warnings and action failures

**Step 2: Run full automated verification**

Run:

```bash
cd server
npm test -- --runInBand

cd ..\\client
node --test src/utils/serverOrigin.test.js src/utils/socketRequest.test.js src/utils/productMode.test.js src/utils/roomTransition.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: all green.

**Step 3: Run browser regression**

Capture fresh evidence for:

- desktop `pro`
- desktop `club`
- desktop `study`
- phone portrait room shell

**Step 4: Update docs**

- record room ids and observations
- record any new responsive or animation pitfalls

**Step 5: Commit**

```bash
git add docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md README.md "真实浏览器联机回归踩坑记录.md"
git commit -m "docs: record tactical arena ui regression"
```
