# Professional Cockpit Refinement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a professional Hold'em decision cockpit layer with compact decision metrics, high-risk action confirmation, and browser-backed single-screen verification.

**Architecture:** Keep the current `ActionDock` / `ActionButtons` / capsule-table architecture. Extend `gameViewModel` with server-authoritative derived decision metrics, render them through existing action-console surfaces, then add inline confirmation only for all-in or large commit actions.

**Tech Stack:** React, Motion, Tailwind-generated CSS in `client/src/index.css`, Node test runner, Jest server tests, Playwright `.runlogs` browser audits.

---

## Task 1: Extend Pro Decision View Model

**Files:**
- Modify: `client/src/view-models/gameViewModel.js`
- Modify: `client/src/view-models/gameViewModel.test.js`

**Step 1: Write failing tests for professional metrics**

Add tests near the existing `deriveProActionSummary` and `buildProActionStatRows` tests:

```js
test('derives professional decision metrics from current hand numbers', () => {
  const summary = deriveProActionSummary({
    currentPlayer: {
      id: 'hero',
      chips: 900,
      currentBet: 100,
      folded: false,
      allIn: false,
    },
    players: [
      { id: 'hero', chips: 900, currentBet: 100, folded: false, allIn: false },
      { id: 'villain', chips: 1800, currentBet: 300, folded: false, allIn: false },
    ],
    gameState: {
      phase: 'turn',
      currentBet: 300,
      minRaise: 400,
      pot: 1200,
      bigBlind: 20,
      currentPlayerActionMode: 'open',
      lastAction: { playerId: 'villain', action: 'raise', amount: 200, totalBet: 300 },
    },
  });

  assert.equal(summary.toCall, 200);
  assert.equal(summary.minRaise, 400);
  assert.equal(summary.pot, 1200);
  assert.equal(summary.effectiveStack, 900);
  assert.equal(summary.effectiveStackBb, 45);
  assert.equal(summary.potOddsPercent, 14);
  assert.equal(summary.spr, 0.75);
  assert.equal(summary.streetLabel, 'TURN');
  assert.equal(summary.actionModeLabel, '可加注');
  assert.equal(summary.lastActionLabel, '上一动作 加注到 300');
});

test('keeps professional decision metrics safe when pot or blind data is missing', () => {
  const summary = deriveProActionSummary({
    currentPlayer: { id: 'hero', chips: 500, currentBet: 0 },
    players: [{ id: 'hero', chips: 500, currentBet: 0 }],
    gameState: { currentBet: 0, minRaise: 0, pot: 0, bigBlind: 0 },
  });

  assert.equal(summary.potOddsPercent, null);
  assert.equal(summary.spr, null);
  assert.equal(summary.effectiveStackBb, null);
});

test('builds compact pro-mode cockpit rows with price and stack pressure', () => {
  assert.deepEqual(
    buildProActionStatRows({
      toCall: 200,
      minRaise: 400,
      pot: 1200,
      effectiveStack: 900,
      effectiveStackBb: 45,
      potOddsPercent: 14,
      spr: 0.75,
      streetLabel: 'TURN',
      actionModeLabel: '可加注',
    }),
    [
      { label: 'Price', value: '14%' },
      { label: 'To Call', value: '200' },
      { label: 'SPR', value: '0.75' },
      { label: 'Eff BB', value: '45BB' },
      { label: 'Street', value: 'TURN' },
      { label: 'Mode', value: '可加注' },
    ]
  );
});
```

**Step 2: Run tests and confirm failure**

Run:

```powershell
cd client
pnpm exec node --test src/view-models/gameViewModel.test.js
```

Expected: FAIL on missing fields / old stat-row shape.

**Step 3: Implement minimal view-model changes**

In `client/src/view-models/gameViewModel.js`:

- add small helpers near `deriveProActionSummary`:

```js
function safeRound(value, digits = 0) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mapActionModeLabel(mode = 'open') {
  return mode === 'call_only' ? '仅可跟注' : '可加注';
}

function mapActionSummaryStreet(phase = null) {
  return mapPhaseToStageLabel(phase);
}

function formatSummaryLastAction(lastAction = null) {
  if (!lastAction?.action) return null;
  const amount = Number(lastAction.totalBet ?? lastAction.amount) || 0;
  switch (lastAction.action) {
    case 'raise':
      return `上一动作 加注到 ${amount.toLocaleString()}`;
    case 'call':
      return `上一动作 跟注 ${(Number(lastAction.amount) || 0).toLocaleString()}`;
    case 'check':
      return '上一动作 过牌';
    case 'fold':
      return '上一动作 弃牌';
    case 'all_in':
    case 'all-in':
      return `上一动作 All-in ${amount.toLocaleString()}`;
    default:
      return null;
  }
}
```

- extend `deriveProActionSummary`:

```js
const bigBlind = Number(gameState.bigBlind) || 0;
const priceDenominator = pot + toCall;
const effectiveStackBb = bigBlind > 0 ? safeRound(effectiveStack / bigBlind, 1) : null;
const potOddsPercent = toCall > 0 && priceDenominator > 0 ? safeRound((toCall / priceDenominator) * 100, 0) : null;
const spr = pot > 0 ? safeRound(effectiveStack / pot, 2) : null;
```

- return the new fields.
- update `buildProActionStatRows` to return the new six compact rows, using fallbacks like `'-'` for null values.

**Step 4: Run targeted tests**

Run:

```powershell
cd client
pnpm exec node --test src/view-models/gameViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

Run:

```powershell
git add -- client/src/view-models/gameViewModel.js client/src/view-models/gameViewModel.test.js
git commit -m "feat: derive professional cockpit metrics"
```

---

## Task 2: Render Dense Pro Metrics In Action Console

**Files:**
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/index.css`

**Step 1: Write failing contract tests**

In `roomTerminalShellContract.test.js`, add a contract test near the existing `ActionButtons` tests:

```js
test('ActionButtons renders professional cockpit metric hooks for price, SPR, and stack pressure', () => {
  assert.match(actionButtonsSource, /table-action-console__pro-strip/);
  assert.match(actionButtonsSource, /data-pro-metric-label=\{stat\.label\}/);
  assert.match(actionButtonsSource, /table-action-console__last-action/);
  assert.match(globalStylesSource, /\.table-action-console__pro-strip\s*\{/);
  assert.match(globalStylesSource, /\.room-terminal-dock-panel\[data-viewport-model="phone-terminal"\]\[data-dock-state="live"\]\s+\.table-action-console__pro-strip\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/s);
});
```

**Step 2: Run test and confirm failure**

Run:

```powershell
cd client
pnpm exec node --test src/components/roomTerminalShellContract.test.js
```

Expected: FAIL on missing hooks/CSS.

**Step 3: Implement render hooks**

In `ActionButtons.jsx`:

- keep `proActionStats = buildProActionStatRows(proActionSummary)`
- replace or supplement the current stats wrapper with:

```jsx
{proActionStats.length > 0 && (
  <div className="table-action-console__pro-strip" data-pro-strip-density="decision">
    {proActionStats.map((stat) => (
      <div
        key={stat.label}
        className="table-action-console__pro-metric"
        data-pro-metric-label={stat.label}
      >
        <span className="table-action-console__pro-metric-label">
          {translateActionStatLabel(stat.label, effectiveDisplayMode)}
        </span>
        <span className="table-action-console__pro-metric-value">{stat.value}</span>
      </div>
    ))}
  </div>
)}

{proActionSummary?.lastActionLabel && (
  <div className="table-action-console__last-action">{proActionSummary.lastActionLabel}</div>
)}
```

- add translations for `Price`, `SPR`, `Eff BB`, `Street`, and `Mode`.

**Step 4: Add CSS**

In `index.css`, near existing `.table-action-console__stats` styles, add compact pro-strip rules:

```css
.table-action-console__pro-strip {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.36rem;
}

.table-action-console__pro-metric {
  min-width: 0;
  border: 1px solid rgba(255, 216, 74, 0.16);
  border-radius: 0.72rem;
  padding: 0.42rem 0.48rem;
  background: rgba(3, 12, 14, 0.66);
}

.table-action-console__pro-metric-label {
  display: block;
  color: rgba(209, 221, 226, 0.62);
  font-size: 0.56rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.table-action-console__pro-metric-value {
  display: block;
  margin-top: 0.12rem;
  color: rgba(255, 248, 214, 0.94);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1;
}

.table-action-console__last-action {
  color: rgba(209, 221, 226, 0.72);
  font-size: 0.7rem;
  line-height: 1.2;
}
```

- add phone live rule:

```css
.room-terminal-dock-panel[data-viewport-model="phone-terminal"][data-dock-state="live"] .table-action-console__pro-strip {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.24rem;
}
```

**Step 5: Run targeted tests**

Run:

```powershell
cd client
pnpm exec node --test src/components/roomTerminalShellContract.test.js src/view-models/gameViewModel.test.js
```

Expected: PASS.

**Step 6: Commit**

Run:

```powershell
git add -- client/src/components/ActionButtons.jsx client/src/components/roomTerminalShellContract.test.js client/src/index.css
git commit -m "feat: render professional cockpit metrics"
```

---

## Task 3: Add Inline High-Risk Action Confirmation

**Files:**
- Modify: `client/src/components/ActionButtons.jsx`
- Modify: `client/src/components/roomTerminalShellContract.test.js`
- Modify: `client/src/index.css`

**Step 1: Write failing contract tests**

Add tests:

```js
test('ActionButtons uses inline confirmation for all-in and large commit actions', () => {
  assert.match(actionButtonsSource, /pendingRiskAction/);
  assert.match(actionButtonsSource, /data-risk-confirmation/);
  assert.match(actionButtonsSource, /确认全下/);
  assert.match(actionButtonsSource, /取消/);
  assert.match(globalStylesSource, /\.table-action-console__risk-confirmation\s*\{/);
});
```

**Step 2: Run test and confirm failure**

Run:

```powershell
cd client
pnpm exec node --test src/components/roomTerminalShellContract.test.js
```

Expected: FAIL.

**Step 3: Implement state and risk policy**

In `ActionButtons.jsx`:

- add state:

```js
const [pendingRiskAction, setPendingRiskAction] = useState(null);
```

- add helpers:

```js
const buildRiskAction = (action, amount = 0) => ({
  action,
  amount,
  label: action === 'allin' ? '确认全下' : '确认大额加注',
  meta: action === 'allin' ? `${resolvedPlayer.chips.toLocaleString()} 筹码` : `${amount.toLocaleString()} 筹码`,
});

const isLargeCommit = (amount) => {
  const totalCommit = callAmount + amount;
  const startingStack = totalCommit + (Number(resolvedPlayer.chips) || 0);
  return startingStack > 0 && totalCommit / startingStack >= 0.5;
};
```

- change direct all-in click to `setPendingRiskAction(buildRiskAction('allin'))`
- change custom raise commit:
  - if all-in or large commit, set pending confirmation
  - otherwise submit immediately
- clear `pendingRiskAction` when game state changes or after submit.

**Step 4: Render inline confirmation**

Add below command row:

```jsx
{pendingRiskAction && (
  <div className="table-action-console__risk-confirmation" data-risk-confirmation="inline">
    <div className="table-action-console__risk-copy">
      <span>高风险动作</span>
      <strong>{pendingRiskAction.meta}</strong>
    </div>
    <button
      type="button"
      className={buildActionCommandClass('allin', 'table-action-command--wide')}
      disabled={isSubmitting}
      onClick={() => handleAction(pendingRiskAction.action, pendingRiskAction.amount)}
    >
      <span className="table-action-command__label">{pendingRiskAction.label}</span>
      <span className="table-action-command__meta">再次确认后提交</span>
    </button>
    <button
      type="button"
      className={buildActionCommandClass('cancel', 'table-action-command--wide')}
      disabled={isSubmitting}
      onClick={() => setPendingRiskAction(null)}
    >
      <span className="table-action-command__label">取消</span>
      <span className="table-action-command__meta">返回动作区</span>
    </button>
  </div>
)}
```

**Step 5: Add CSS**

Add compact inline rules:

```css
.table-action-console__risk-confirmation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(7rem, 0.8fr) minmax(6rem, 0.7fr);
  gap: 0.42rem;
  align-items: stretch;
  border: 1px solid rgba(255, 92, 92, 0.32);
  border-radius: 1rem;
  padding: 0.48rem;
  background: rgba(35, 8, 8, 0.78);
}

.table-action-console__risk-copy {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 0.12rem;
  color: rgba(255, 238, 220, 0.78);
  font-size: 0.66rem;
}

.table-action-console__risk-copy strong {
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.86rem;
}
```

- add phone rule to make it two rows if needed.

**Step 6: Run targeted tests**

Run:

```powershell
cd client
pnpm exec node --test src/components/roomTerminalShellContract.test.js
```

Expected: PASS.

**Step 7: Commit**

Run:

```powershell
git add -- client/src/components/ActionButtons.jsx client/src/components/roomTerminalShellContract.test.js client/src/index.css
git commit -m "feat: confirm high-risk poker actions inline"
```

---

## Task 4: Browser Audit Professional Cockpit

**Files:**
- Create ignored/local: `.runlogs/2026-05-03-professional-cockpit-audit.cjs`
- Update after evidence: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Update after evidence: `真实浏览器联机回归踩坑记录.md`

**Step 1: Create browser audit script**

Create a `.runlogs` Playwright audit script based on the existing cockpit scripts. It should:

- create a live 2- or 3-player room
- open phone `390x844`, compact phone `375x667`, tablet portrait `768x1024`, tablet landscape `1024x768`, desktop `1366x900`
- verify:
  - no document scroll in live hand
  - hero has 2 cards
  - pro strip exists
  - `Price`, `SPR`, `Eff BB`, `Street`, and `Mode` metrics are visible or present in `data-pro-metric-label`
  - all-in first click opens inline confirmation and does not submit immediately
  - confirmation cancel returns to normal commands
  - no risk confirmation, pro strip, hand cards, board, or command row overlap

**Step 2: Run browser audit**

Run:

```powershell
node .runlogs/2026-05-03-professional-cockpit-audit.cjs
```

Expected: PASS with JSON evidence under `.runlogs`.

**Step 3: If audit fails, debug systematically**

Use `superpowers:systematic-debugging`:

- inspect screenshot and rects
- identify whether failure is product bug or audit false positive
- fix product only when screenshot/rect proves a real user-facing issue

**Step 4: Update docs**

Add a section to `docs/plans/2026-03-19-poker-product-polish-todolist.md` with:

- runId
- covered viewports
- metrics verified
- any layout thresholds
- next queue

Append pitfalls to `真实浏览器联机回归踩坑记录.md`.

**Step 5: Commit docs only if no product changes remain unstaged**

Run:

```powershell
git add -- docs/plans/2026-03-19-poker-product-polish-todolist.md "真实浏览器联机回归踩坑记录.md"
git commit -m "docs: record professional cockpit browser audit"
```

Do not add `.runlogs` unless a script is intentionally promoted out of ignored evidence storage.

---

## Task 5: Full Verification Gate

**Files:**
- No planned code files unless fixing failures

**Step 1: Run full verification**

Run:

```powershell
cd client
pnpm exec node --test
pnpm build
cd ..\server
npm test -- --runInBand
cd ..
git diff --check
git status --short --branch
```

Expected:

- client tests pass
- client build exits `0`, existing large-chunk warning is acceptable
- server tests pass
- `git diff --check` has no whitespace errors; Windows LF-to-CRLF warnings are acceptable
- worktree has only expected ignored `.runlogs` artifacts

**Step 2: Update active todo**

If all verification passes, update `docs/plans/2026-03-19-poker-product-polish-todolist.md`:

- mark professional cockpit refinement `[done]`
- add evidence
- set next queue to phone performance profiling and final UI/UX review

**Step 3: Commit final docs**

Run:

```powershell
git add -- docs/plans/2026-03-19-poker-product-polish-todolist.md
git commit -m "docs: update professional cockpit polish status"
```

---

## Notes For Execution

- Stay on `feat/poker-os-polish`; do not merge or push to `main`.
- Do not restart user-run client/server unless health checks fail.
- Use `apply_patch` for manual edits.
- Keep `.runlogs` evidence ignored unless explicitly promoting a script.
- Commit after each completed stage.
- Use `superpowers:verification-before-completion` before every completion claim.
