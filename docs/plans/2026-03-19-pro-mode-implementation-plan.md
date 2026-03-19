# Pro Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn `pro` from a label into a real high-density table mode by improving decision context, table-state summaries, and hand-result readability without changing server-authoritative gameplay.

**Architecture:** Keep all gameplay rules server-authoritative and implement `pro` as a presentation-layer enhancement. Add reusable derived view-model helpers first, then consume them from the existing React components behind `effectiveDisplayMode === 'pro'` branches so `club` and `study` can later reuse the same derived data with different density.

**Tech Stack:** React, Zustand, Node test runner, Socket.IO client, existing client view-model helpers, PowerShell/browser regression scripts.

---

### Task 1: Add `pro` Decision Summary View Models

**Files:**
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`

**Step 1: Write the failing test**

Add tests for a helper like:

```js
const summary = deriveProActionSummary({
  currentPlayer: { chips: 990, currentBet: 10 },
  gameState: { currentBet: 20, minRaise: 20, pot: 30 },
  players: [
    { id: 'p1', chips: 990, folded: false, allIn: false },
    { id: 'p2', chips: 980, folded: false, allIn: false },
  ],
});

assert.deepEqual(summary, {
  toCall: 10,
  minRaise: 20,
  pot: 30,
  effectiveStack: 980,
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL because `deriveProActionSummary` does not exist yet.

**Step 3: Write minimal implementation**

Add a pure helper in `gameViewModel.js` that:

- returns `null` when required state is missing
- computes:
  - `toCall`
  - `minRaise`
  - `pot`
  - `effectiveStack`
- ignores folded / all-in players when finding the effective stack opponent set

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: PASS for the new helper cases.

**Step 5: Commit**

```bash
git add client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js
git commit -m "feat: add pro action summary view model"
```

### Task 2: Render `pro` Decision Context In The Action Area

**Files:**
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Test: `client/src/view-models/gameViewModel.test.js`

**Step 1: Write the failing test**

Add a test proving the view model returns the exact labels needed for rendering, for example:

```js
assert.deepEqual(buildProActionStatRows(summary), [
  { label: 'To Call', value: '10' },
  { label: 'Min Raise', value: '20' },
  { label: 'Pot', value: '30' },
  { label: 'Eff', value: '980' },
]);
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL because the stat-row builder does not exist yet.

**Step 3: Write minimal implementation**

- add a small formatter helper in `gameViewModel.js`
- pass `effectiveDisplayMode` and the derived `pro` summary from `GameRoom.jsx`
- in `ActionButtons.jsx`, render a compact stat strip only when `effectiveDisplayMode === 'pro'`

Use the existing buttons and quick raise controls. Do not rewrite the action layout yet.

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/ActionButtons.jsx client/src/components/GameRoom.jsx client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js
git commit -m "feat: show pro action decision context"
```

### Task 3: Add Compact `pro` Player Summaries For Table Panels

**Files:**
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/components/PlayerPanel.jsx`
- Modify: `client/src/components/Leaderboard.jsx`

**Step 1: Write the failing test**

Add tests for a helper like:

```js
const summary = deriveProPlayerSummary(
  {
    id: 'p1',
    seat: 0,
    chips: 1010,
    tableState: 'seated_wait_next_hand',
    ledger: { sessionNet: 10 },
  },
  {
    roomState: 'in_hand',
    dealerPosition: 1,
    smallBlindIndex: 1,
    bigBlindIndex: 0,
  }
);

assert.deepEqual(summary, {
  seatLabel: '座1',
  positionLabel: 'BB',
  statusLabel: '下一手加入',
  chipsLabel: '1,010',
  netLabel: '+10',
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL because the helper does not exist or does not match the expected output.

**Step 3: Write minimal implementation**

- add compact player-summary helpers to `gameViewModel.js`
- feed them into `PlayerPanel.jsx` and `Leaderboard.jsx`
- only switch to the denser labels when `effectiveDisplayMode === 'pro'`
- keep existing safe fallbacks for other modes and missing game state

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/components/PlayerPanel.jsx client/src/components/Leaderboard.jsx
git commit -m "feat: compact pro player summaries"
```

### Task 4: Tighten `pro` Hand History And Settlement Readability

**Files:**
- Modify: `client/src/view-models/handHistoryViewModel.js`
- Modify: `client/src/view-models/handHistoryViewModel.test.js`
- Modify: `client/src/components/HandHistoryDrawer.jsx`
- Modify: `client/src/components/SettlementOverlay.jsx`

**Step 1: Write the failing test**

Add tests that prove a side-pot hand renders the compact lines needed by `pro`, for example:

```js
const summary = buildHandSummary({
  handNumber: 8,
  totalPot: 5000,
  reason: '摊牌',
  potResults: [
    { potId: 0, potType: 'main', amount: 3000, winners: [{ nickname: 'A', amount: 3000 }] },
    { potId: 1, potType: 'side', amount: 2000, winners: [{ nickname: 'B', amount: 2000 }] },
  ],
  chipDeltas: { a: 1000, b: -1000 },
  players: [{ id: 'a', nickname: 'A' }, { id: 'b', nickname: 'B' }],
});

assert.deepEqual(summary.lines.slice(0, 3), [
  '总池 +5,000',
  '主池 +3,000: A +3,000',
  '边池 1 +2,000: B +2,000',
]);
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/handHistoryViewModel.test.js
```

Expected: FAIL if the current summary does not match the compact target.

**Step 3: Write minimal implementation**

- keep the existing shared summary builder
- add mode-aware summary slicing or compact formatting helpers
- update `HandHistoryDrawer.jsx` and `SettlementOverlay.jsx` to prefer the denser `pro` formatting when `effectiveDisplayMode === 'pro'`

Do not fork the entire components.

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/view-models/handHistoryViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/view-models/handHistoryViewModel.js client/src/view-models/handHistoryViewModel.test.js client/src/components/HandHistoryDrawer.jsx client/src/components/SettlementOverlay.jsx
git commit -m "feat: tighten pro hand history summaries"
```

### Task 5: Wire `effectiveDisplayMode` Through The Table Surface

**Files:**
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/PlayerPanel.jsx`
- Modify: `client/src/components/Leaderboard.jsx`
- Modify: `client/src/components/HandHistoryDrawer.jsx`
- Modify: `client/src/components/SettlementOverlay.jsx`

**Step 1: Write the failing test**

If any remaining mode branching is still embedded in components without a dedicated helper, add a small view-model or formatter test first. Prefer not to add brittle component rendering tests unless a pure helper cannot cover the logic.

Example:

```js
assert.equal(selectTableDensity('pro'), 'compact');
assert.equal(selectTableDensity('club'), 'standard');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: FAIL until the missing helper exists.

**Step 3: Write minimal implementation**

- finish threading `effectiveDisplayMode` into all touched components
- remove duplicated per-component mode checks when a shared helper can own them
- verify that non-`pro` modes keep their current safe rendering

**Step 4: Run test to verify it passes**

Run:

```bash
cd client
node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/GameRoom.jsx client/src/components/ActionButtons.jsx client/src/components/PlayerPanel.jsx client/src/components/Leaderboard.jsx client/src/components/HandHistoryDrawer.jsx client/src/components/SettlementOverlay.jsx client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/view-models/handHistoryViewModel.js client/src/view-models/handHistoryViewModel.test.js
git commit -m "feat: wire pro mode across table surfaces"
```

### Task 6: Verify, Update The Living Todo, And Capture Browser Evidence

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Run the automated suite**

Run:

```bash
cd server
npm test -- --runInBand

cd ..\\client
node --test src/utils/serverOrigin.test.js src/utils/socketRequest.test.js src/utils/productMode.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
npm run build
```

Expected: all green.

**Step 2: Run targeted browser regression**

Use:

```powershell
pwsh -NoProfile -File scripts/manage-real-browser-env.ps1 start-all -CleanProfile
```

Capture at least:

- 2-player `pro` quick action scan
- 3-player side-pot settlement readability
- seated-wait-next-hand visibility in `pro`

**Step 3: Update docs**

- mark `Task 7` progress in the living todo
- record any new `pro`-mode readability or density pitfalls in `真实浏览器联机回归踩坑记录.md`

**Step 4: Commit**

```bash
git add docs/plans/2026-03-19-poker-product-polish-todolist.md 真实浏览器联机回归踩坑记录.md
git commit -m "docs: record pro mode regression evidence"
```
