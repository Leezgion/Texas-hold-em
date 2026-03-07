# Poker Gameplay Presentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current modal-driven, boolean-heavy poker table flow with an authoritative room/hand/seat/ledger model that supports non-blocking settlement, hand-history records, reveal rules, and reliable multiplayer recovery.

**Architecture:** Keep `RoomManager` as the room/application coordinator and `GameLogic` as the hand engine, but stop letting either class improvise room semantics through ad hoc booleans. Introduce explicit state vocabularies in `server/types/GameTypes.js`, persist immutable `HandRecord` objects per hand, and emit server-authoritative projections that the React client consumes through pure view-model helpers instead of deriving critical semantics inline.

**Tech Stack:** Node.js, Express, Socket.IO, Jest, React 18, Zustand, Vite, Node built-in test runner (`node:test`), Chrome DevTools MCP for real-browser regression

---

**Execution Notes**

- Use `@superpowers:test-driven-development` for Tasks 1 through 8.
- Use `@superpowers:systematic-debugging` if any new state transition breaks an existing multiplayer regression.
- Use `@superpowers:verification-before-completion` before closing Task 9.
- Execute this plan in a dedicated git worktree so the current dirty workspace does not contaminate the refactor.
- This plan is intentionally scoped to logic-first delivery. Full table layout redesign is out of scope until this tranche lands.

**Out of Scope**

- Typography, color system, and final visual language overhaul
- Large-scale table layout redesign for desktop/mobile
- Cosmetic animation polish beyond the minimal settlement shell
- Bot support or AI player behavior

### Task 0: Prepare a Dedicated Worktree and Baseline

**Files:**
- None

**Step 1: Create the dedicated worktree**

Run:

```bash
git worktree add ..\Texas-holdem-presentation-refactor -b feat/presentation-state-refactor
```

Expected: Git creates a new worktree on branch `feat/presentation-state-refactor`.

**Step 2: Install dependencies and capture the baseline**

Run:

```bash
cd ..\Texas-holdem-presentation-refactor\server && npm test -- --runInBand
cd ..\Texas-holdem-presentation-refactor\client && npm run build
```

Expected: Server tests pass and the client build succeeds before any refactor work begins.

**Step 3: Record the baseline in the regression log**

Append one short section to `真实浏览器联机回归踩坑记录.md` noting:

- worktree path
- current branch
- baseline test/build result

**Step 4: Commit the baseline note**

```bash
git add 真实浏览器联机回归踩坑记录.md
git commit -m "docs: record state-refactor baseline"
```

### Task 1: Define Explicit Room, Hand, and Seat State Vocabularies

**Files:**
- Create: `server/tests/gameLogic/RoomState.test.js`
- Modify: `server/types/GameTypes.js`
- Modify: `server/gameLogic/RoomManager.js`
- Modify: `server/gameLogic/GameLogic.js`

**Step 1: Write the failing tests**

Add tests that pin the new server vocabulary:

```js
const { ROOM_STATES, TABLE_STATES } = require('../../types/GameTypes');

it('marks a room as idle before the first hand starts', () => {
  const room = createRoomWithTwoPlayers();
  expect(room.roomState).toBe(ROOM_STATES.IDLE);
});

it('marks a mid-hand seat request as seated_wait_next_hand', () => {
  const { roomManager, room, spectator } = createStartedRoomWithSpectator();
  roomManager.takeSeat(room.id, spectator.id, 3);
  expect(findPlayer(room, spectator.id).tableState).toBe(TABLE_STATES.SEATED_WAIT_NEXT_HAND);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/RoomState.test.js
```

Expected: FAIL because `roomState` / `tableState` do not exist yet.

**Step 3: Write the minimal implementation**

Add canonical enums and wire them into room/player payloads:

```js
const ROOM_STATES = Object.freeze({
  IDLE: 'idle',
  IN_HAND: 'in_hand',
  SETTLING: 'settling',
  RECOVERY_REQUIRED: 'recovery_required',
  CLOSED: 'closed',
});

const TABLE_STATES = Object.freeze({
  SPECTATING: 'spectating',
  SEATED_READY: 'seated_ready',
  SEATED_WAIT_NEXT_HAND: 'seated_wait_next_hand',
  ACTIVE_IN_HAND: 'active_in_hand',
  FOLDED_THIS_HAND: 'folded_this_hand',
  ALL_IN_THIS_HAND: 'all_in_this_hand',
  DISCONNECTED: 'disconnected',
  BUSTED_WAIT_REBUY: 'busted_wait_rebuy',
});
```

Update `RoomManager` and `GameLogic` so room/player objects always carry one authoritative state field instead of only booleans.

**Step 4: Run the test to verify it passes**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/RoomState.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/gameLogic/RoomState.test.js server/types/GameTypes.js server/gameLogic/RoomManager.js server/gameLogic/GameLogic.js
git commit -m "refactor: add explicit room and seat state vocabularies"
```

### Task 2: Enforce Host-Only Start and Explicit Recovery Semantics

**Files:**
- Modify: `server/tests/gameLogic/RoomState.test.js`
- Modify: `server/gameLogic/RoomManager.js`
- Modify: `server/gameLogic/GameLogic.js`
- Modify: `server/server.js`

**Step 1: Write the failing tests**

Extend `RoomState.test.js` with:

```js
it('rejects startGame from a non-host player', () => {
  const { roomManager, room, host, guest } = createIdleRoomWithTwoPlayers();
  expect(() => roomManager.startGame(room.id, guest.id)).toThrow('Only the host can start the game');
});

it('surfaces recovery_required instead of silently no-oping a dirty room', () => {
  const room = createDirtyWaitingRoom();
  expect(() => roomManager.startGame(room.id, room.hostId)).toThrow('Room requires recovery');
  expect(room.roomState).toBe('recovery_required');
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/RoomState.test.js -t "startGame|recovery_required"
```

Expected: FAIL because non-host starts are still accepted or ignored.

**Step 3: Write the minimal implementation**

Introduce explicit guards:

```js
if (playerId !== room.hostId) {
  throw new Error('Only the host can start the game');
}

if (room.gameStarted && room.phase === 'waiting' && !room.currentPlayerId) {
  room.roomState = ROOM_STATES.RECOVERY_REQUIRED;
  throw new Error('Room requires recovery');
}
```

Also emit a distinct socket error/event so the client can render a real room-recovery message instead of spinning.

**Step 4: Run the test to verify it passes**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/RoomState.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/gameLogic/RoomState.test.js server/gameLogic/RoomManager.js server/gameLogic/GameLogic.js server/server.js
git commit -m "fix: enforce host start permission and explicit room recovery"
```

### Task 3: Replace Boolean Seat Semantics with a Real Transition Model

**Files:**
- Create: `server/tests/gameLogic/SeatState.test.js`
- Modify: `server/types/GameTypes.js`
- Modify: `server/gameLogic/RoomManager.js`
- Modify: `server/gameLogic/GameLogic.js`

**Step 1: Write the failing tests**

Add seat-transition tests for the real regressions we already observed:

```js
it('keeps a mid-hand spectator out of blinds and action order', () => {
  const { roomManager, room, spectator } = createStartedRoomWithSpectator();
  roomManager.takeSeat(room.id, spectator.id, 0);
  const player = findPlayer(room, spectator.id);
  expect(player.tableState).toBe(TABLE_STATES.SEATED_WAIT_NEXT_HAND);
  expect(room.gameLogic.currentPlayerId).not.toBe(spectator.id);
});

it('moves zero-chip seated players to busted_wait_rebuy instead of leaving a dead seat', () => {
  const room = createRoomWithZeroChipSeat();
  roomManager.normalizePlayerStates(room.id);
  expect(findPlayer(room, 'dead-seat').tableState).toBe(TABLE_STATES.BUSTED_WAIT_REBUY);
  expect(findPlayer(room, 'dead-seat').seat).toBe(-1);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/SeatState.test.js
```

Expected: FAIL because current code still mutates `seat`, `isSpectator`, and `chips` independently.

**Step 3: Write the minimal implementation**

Centralize transitions in one helper:

```js
function setTableState(player, nextState, overrides = {}) {
  player.tableState = nextState;
  Object.assign(player, overrides);
}
```

Use it inside `takeSeat`, `leaveSeat`, disconnect handling, and hand-start normalization. Never allow a `chips === 0` player to stay in a live seat.

**Step 4: Run the test to verify it passes**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/SeatState.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/gameLogic/SeatState.test.js server/types/GameTypes.js server/gameLogic/RoomManager.js server/gameLogic/GameLogic.js
git commit -m "refactor: add seat transition model and zero-chip guards"
```

### Task 4: Add Player Ledger Accounting and Rebuy Eligibility Rules

**Files:**
- Create: `server/tests/gameLogic/PlayerLedger.test.js`
- Modify: `server/types/GameTypes.js`
- Modify: `server/gameLogic/RoomManager.js`
- Modify: `server/gameLogic/GameLogic.js`

**Step 1: Write the failing tests**

Add tests for the ledger fields and rebuy gating:

```js
it('tracks initial buy-in, rebuy total, and session net', () => {
  const player = createPlayer({ chips: 1000, initialBuyIn: 1000 });
  applyRebuy(player, 500);
  expect(player.ledger).toEqual({
    initialBuyIn: 1000,
    rebuyTotal: 500,
    totalBuyIn: 1500,
    currentChips: 1500,
    sessionNet: 0,
  });
});

it('allows rebuy after fold or bust but rejects rebuy while still active in hand', () => {
  expect(canRebuy({ tableState: TABLE_STATES.FOLDED_THIS_HAND })).toBe(true);
  expect(canRebuy({ tableState: TABLE_STATES.BUSTED_WAIT_REBUY })).toBe(true);
  expect(canRebuy({ tableState: TABLE_STATES.ACTIVE_IN_HAND })).toBe(false);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/PlayerLedger.test.js
```

Expected: FAIL because `ledger` and `canRebuy` do not exist yet.

**Step 3: Write the minimal implementation**

Create one authoritative ledger shape:

```js
player.ledger = {
  initialBuyIn,
  rebuyTotal: 0,
  totalBuyIn: initialBuyIn,
  currentChips: initialBuyIn,
  sessionNet: 0,
  handStartChips: initialBuyIn,
  handDelta: 0,
  showdownDelta: 0,
};
```

Update rebuy handling to derive eligibility from `tableState`, not from old `folded` / `gameStarted` heuristics.

**Step 4: Run the test to verify it passes**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/PlayerLedger.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/gameLogic/PlayerLedger.test.js server/types/GameTypes.js server/gameLogic/RoomManager.js server/gameLogic/GameLogic.js
git commit -m "feat: add player ledger accounting and rebuy gating"
```

### Task 5: Capture Immutable Hand Records Instead of Ad Hoc Logs

**Files:**
- Create: `server/gameLogic/HandRecordBuilder.js`
- Create: `server/tests/gameLogic/HandRecordBuilder.test.js`
- Modify: `server/gameLogic/GameLogic.js`
- Modify: `server/gameLogic/RoomManager.js`

**Step 1: Write the failing tests**

Add tests that force a complete hand record:

```js
it('stores actions grouped by street and freezes chip deltas at showdown', () => {
  const handRecord = buildHandRecord({
    handNumber: 7,
    streets: {
      preflop: [{ playerId: 'p1', action: 'raise', amount: 60 }],
      flop: [{ playerId: 'p2', action: 'call', amount: 60 }],
    },
    chipDeltas: { p1: 120, p2: -120 },
  });

  expect(handRecord.streets.preflop).toHaveLength(1);
  expect(handRecord.chipDeltas.p1).toBe(120);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/HandRecordBuilder.test.js
```

Expected: FAIL because there is no builder and the server still emits transient `lastAction`.

**Step 3: Write the minimal implementation**

Create a builder that materializes one immutable record per hand:

```js
function buildHandRecord(snapshot) {
  return Object.freeze({
    handNumber: snapshot.handNumber,
    board: [...snapshot.board],
    streets: structuredClone(snapshot.streets),
    pots: structuredClone(snapshot.pots),
    reveals: structuredClone(snapshot.reveals),
    chipDeltas: { ...snapshot.chipDeltas },
    winners: [...snapshot.winners],
  });
}
```

Wire `GameLogic` to append actions by street during the hand and freeze the record when settlement begins.

**Step 4: Run the test to verify it passes**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/HandRecordBuilder.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add server/gameLogic/HandRecordBuilder.js server/tests/gameLogic/HandRecordBuilder.test.js server/gameLogic/GameLogic.js server/gameLogic/RoomManager.js
git commit -m "feat: capture immutable hand records for settlement history"
```

### Task 6: Implement the Settling Window and Reveal Policies on the Server

**Files:**
- Create: `server/tests/gameLogic/SettlementFlow.test.js`
- Modify: `server/types/GameTypes.js`
- Modify: `server/gameLogic/GameLogic.js`
- Modify: `server/gameLogic/RoomManager.js`
- Modify: `server/server.js`

**Step 1: Write the failing tests**

Add tests for both reveal policies and the non-blocking settlement timer:

```js
it('lets only showdown players reveal in showdown_only rooms', () => {
  const room = createSettlingRoom({ revealPolicy: 'showdown_only' });
  expect(() => roomManager.revealHand(room.id, 'folded-player', 'show_all')).toThrow('Player cannot reveal in this hand');
});

it('auto-advances from settling to the next hand after the timer expires', async () => {
  const room = createSettlingRoom({ settleMs: 10 });
  await waitForSettle(room);
  expect(room.roomState).toBe(ROOM_STATES.IN_HAND);
  expect(room.gameLogic.handNumber).toBe(8);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/SettlementFlow.test.js
```

Expected: FAIL because there is no authoritative `settling` state or `revealHand` event.

**Step 3: Write the minimal implementation**

Add reveal-policy enforcement and the short settlement window:

```js
room.roomState = ROOM_STATES.SETTLING;
room.settlementWindowEndsAt = Date.now() + room.settings.settleMs;

if (room.settings.revealPolicy === 'showdown_only' && !eligibleRevealPlayers.has(playerId)) {
  throw new Error('Player cannot reveal in this hand');
}
```

Add a new socket event, for example `revealHand`, that accepts:

- `mode: 'hide' | 'show_one' | 'show_all'`
- `cardIndex?: 0 | 1`

Lock reveal choices when the timer expires and start the next hand automatically.

**Step 4: Run the test to verify it passes**

Run:

```bash
cd server && npm test -- --runInBand tests/gameLogic/SettlementFlow.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/gameLogic/SettlementFlow.test.js server/types/GameTypes.js server/gameLogic/GameLogic.js server/gameLogic/RoomManager.js server/server.js
git commit -m "feat: add settling window and reveal policy flow"
```

### Task 7: Add Pure Client View Models for Authoritative Table Semantics

**Files:**
- Create: `client/src/view-models/gameViewModel.js`
- Create: `client/src/view-models/gameViewModel.test.js`
- Modify: `client/src/contexts/GameContext.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/PlayerPanel.jsx`
- Modify: `client/src/components/RebuyModal.jsx`

**Step 1: Write the failing tests**

Use Node's built-in test runner so the client can be tested without introducing a new framework in this tranche:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { derivePlayerStateView } from './gameViewModel.js';

test('labels busted players as waiting for rebuy', () => {
  const view = derivePlayerStateView({
    tableState: 'busted_wait_rebuy',
    roomState: 'idle',
    ledger: { sessionNet: -1000 },
  });

  assert.equal(view.statusLabel, '等待补码');
  assert.equal(view.canRequestRebuy, true);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd client && node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL because the view-model module does not exist yet.

**Step 3: Write the minimal implementation**

Move semantic projection out of JSX:

```js
export function derivePlayerStateView(player, roomState) {
  return {
    statusLabel: mapTableStateToLabel(player.tableState, roomState),
    canRequestRebuy: ['folded_this_hand', 'busted_wait_rebuy', 'spectating'].includes(player.tableState),
    netLabel: formatSignedChips(player.ledger?.sessionNet ?? 0),
  };
}
```

Update `GameContext`, `GameRoom`, `PlayerPanel`, and `RebuyModal` to consume `roomState`, `tableState`, and `ledger` directly from the server payload instead of guessing from old booleans.

**Step 4: Run the test and build**

Run:

```bash
cd client && node --test src/view-models/gameViewModel.test.js
cd client && npm run build
```

Expected: The view-model test passes and the client build succeeds.

**Step 5: Commit**

```bash
git add client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js client/src/contexts/GameContext.jsx client/src/components/GameRoom.jsx client/src/components/PlayerPanel.jsx client/src/components/RebuyModal.jsx
git commit -m "refactor: project authoritative table semantics in the client"
```

### Task 8: Replace the Result Modal with a Settlement Shell and Hand-History Drawer

**Files:**
- Create: `client/src/view-models/handHistoryViewModel.js`
- Create: `client/src/view-models/handHistoryViewModel.test.js`
- Create: `client/src/components/HandHistoryDrawer.jsx`
- Create: `client/src/components/SettlementOverlay.jsx`
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/GameLog.jsx`
- Modify: `client/src/components/HandResultModal.jsx`

**Step 1: Write the failing tests**

Add a pure hand-history projection test:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHandSummary } from './handHistoryViewModel.js';

test('summarizes main pot, side pots, and reveal choices', () => {
  const summary = buildHandSummary({
    handNumber: 9,
    winners: [{ playerId: 'p1', amount: 3000, potType: 'main' }],
    reveals: [{ playerId: 'p2', mode: 'show_one', cards: ['A♠'] }],
  });

  assert.match(summary.lines[0], /主池/);
  assert.match(summary.lines[1], /亮牌/);
});
```

**Step 2: Run the test to verify it fails**

Run:

```bash
cd client && node --test src/view-models/handHistoryViewModel.test.js
```

Expected: FAIL because the hand-history view-model does not exist yet.

**Step 3: Write the minimal implementation**

Create two new UI shells:

- `SettlementOverlay.jsx`: non-blocking winner highlight + countdown + reveal controls
- `HandHistoryDrawer.jsx`: collapsible hand-history list sourced from immutable `HandRecord`s

Representative view-model code:

```js
export function buildHandSummary(record) {
  return {
    handNumber: record.handNumber,
    lines: [
      ...record.winners.map((winner) => `${winner.nickname} 赢得${winner.potType === 'main' ? '主池' : '边池'} +${winner.amount}`),
      ...record.reveals.map((reveal) => `${reveal.nickname} ${formatReveal(reveal)}`),
    ],
  };
}
```

Stop opening `HandResultModal`; keep the file only as a temporary dead-end shell until the new flow is stable, then delete it in a later cleanup.

**Step 4: Run the test and build**

Run:

```bash
cd client && node --test src/view-models/handHistoryViewModel.test.js
cd client && npm run build
```

Expected: PASS and successful build.

**Step 5: Commit**

```bash
git add client/src/view-models/handHistoryViewModel.js client/src/view-models/handHistoryViewModel.test.js client/src/components/HandHistoryDrawer.jsx client/src/components/SettlementOverlay.jsx client/src/components/GameRoom.jsx client/src/components/GameLog.jsx client/src/components/HandResultModal.jsx
git commit -m "feat: add settlement overlay and hand-history drawer"
```

### Task 9: Run the Real Regression Matrix and Update Project Documentation

**Files:**
- Modify: `真实浏览器联机回归踩坑记录.md`
- Modify: `docs/plans/2026-03-07-poker-gameplay-presentation-design.md`
- Modify: `docs/plans/2026-03-07-poker-gameplay-presentation-implementation-plan.md`

**Step 1: Run the automated checks**

Run:

```bash
cd server && npm test -- --runInBand
cd client && node --test src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
cd client && npm run build
```

Expected: All server tests pass, both client view-model tests pass, and the production build succeeds.

**Step 2: Run the real-browser regression set**

Use Chrome DevTools MCP and execute these scenarios:

- two-player all-in / call / settling / auto-next-hand
- three-player unequal-stack side-pot showdown
- spectator joins mid-hand and only enters next hand
- disconnect + reconnect during `settling`
- rebuy after fold / bust
- six-player smoke: three fast hands, no dead seats, no phantom side pots

Expected: No blocking modal, no `0`-chip dead seat, no non-host start, no silent dirty-room no-op, and the drawer explains the hand correctly.

**Step 3: Update the docs with the final behavior**

Append a completion section to:

- `真实浏览器联机回归踩坑记录.md`
- the design doc if any accepted behavior changed during implementation

Include:

- what regressed and how it was fixed
- what was explicitly deferred
- the final reveal policy and settling timer defaults

**Step 4: Commit**

```bash
git add 真实浏览器联机回归踩坑记录.md docs/plans/2026-03-07-poker-gameplay-presentation-design.md docs/plans/2026-03-07-poker-gameplay-presentation-implementation-plan.md
git commit -m "docs: record presentation refactor regression results"
```

## Execution Notes

Current implementation status on `feat/presentation-state-refactor`:

- Task 1 completed
- Task 2 completed
- Task 3 completed
- Task 4 completed
- Task 5 completed
- Task 6 completed
- Task 7 completed
- Task 8 completed

Automated verification completed:

- `server`
  - `npm test -- --runInBand`
  - passed (`91/91`)
- `client`
  - `node --test src/view-models/gameViewModel.test.js`
  - `node --test src/view-models/handHistoryViewModel.test.js`
  - `npm run build`
  - passed

Real-browser verification status:

- Started against worktree server on `http://127.0.0.1:3101`
- Blocked by a new projection regression before the full matrix could continue:
  - room page showed `2/2 (0座 2观)` while simultaneously rendering player seat placeholders
  - host no longer saw `开始游戏`
  - worktree debug endpoint did not resolve the page room ID during this run

Result:

- The implementation tranche is code-complete through Task 8
- The remaining work is to repair the new room/seat projection regression and then rerun the real-browser matrix before calling the refactor done
