# Tailwind 4.2.2 Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the client from Tailwind CSS 3.x to Tailwind CSS 4.2.2 before continuing Tactical Arena UI work, while keeping the current React/Vite app behavior stable.

**Architecture:** Keep the current React and Vite runtime intact, but replace the Tailwind 3-era CSS pipeline with Tailwind 4.2.2 plus the official Vite integration. Preserve the semantic CSS architecture in `client/src/index.css`, then verify the migrated pipeline against both tests and live browser screenshots.

**Tech Stack:** React 18, Vite 4, Tailwind CSS 4.2.2, `@tailwindcss/vite`, Node test runner, semantic CSS in `client/src/index.css`, Chrome DevTools MCP for browser regression.

---

### Task 1: Capture the Tailwind 4.2.2 migration contract in tests

**Files:**
- Modify: `client/src/utils/productMode.test.js`
- Modify: `client/src/utils/productMode.js`

**Step 1: Write the failing test**

Add a focused assertion proving the room-shell layout resolver contract remains stable during the migration.

Example:

```js
assert.equal(resolveRoomShellLayout(1280), 'split-stage');
assert.equal(resolveRoomShellLayout(1536), 'three-column');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL if the contract is missing or has regressed.

**Step 3: Write minimal implementation**

- keep `resolveRoomShellLayout()` exported
- keep the current responsive shell contract stable

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
git commit -m "test: lock the room shell layout contract"
```

### Task 2: Upgrade Tailwind dependencies and Vite integration

**Files:**
- Modify: `client/package.json`
- Modify: `client/package-lock.json`
- Modify: `client/vite.config.js`
- Modify: `client/postcss.config.js`

**Step 1: Write the failing verification**

Attempt a build with the old pipeline after dependency changes staged but before wiring is corrected.

Run:

```bash
cd client
npm run build
```

Expected: FAIL or render with missing styles until the Tailwind 4 integration is fully updated.

**Step 2: Write minimal implementation**

- upgrade `tailwindcss` to `4.2.2`
- add `@tailwindcss/vite`
- add `@tailwindcss/postcss` only if needed for compatibility
- update `vite.config.js` to use the official Tailwind Vite plugin
- remove legacy Tailwind 3 PostCSS wiring

**Step 3: Reinstall and verify dependency graph**

Run:

```bash
cd client
npm install
npm ls tailwindcss @tailwindcss/vite @tailwindcss/postcss
```

Expected: installed versions resolve to `4.2.2`.

**Step 4: Run build verification**

Run:

```bash
cd client
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/package.json client/package-lock.json client/vite.config.js client/postcss.config.js
git commit -m "build: migrate the client to tailwind 4"
```

### Task 3: Migrate the Tailwind entry CSS and preserve semantic shell layers

**Files:**
- Modify: `client/src/index.css`

**Step 1: Write the failing verification**

Run a build or dev render immediately after switching the package versions but before updating the CSS entrypoint.

Run:

```bash
cd client
npm run build
```

Expected: FAIL or produce missing base/utility output until the stylesheet entrypoint is updated.

**Step 2: Write minimal implementation**

- replace the Tailwind 3 directives with the Tailwind 4 entry syntax
- preserve the current `@layer base` and `@layer components` structure
- keep the semantic Tactical Arena classes intact
- do not refactor visual design during this task

**Step 3: Run build verification**

Run:

```bash
cd client
npm run build
```

Expected: PASS.

**Step 4: Run targeted client tests**

Run:

```bash
cd client
node --test src/utils/productMode.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/index.css
git commit -m "style: migrate tailwind entry css to v4"
```

### Task 4: Audit scanning-sensitive classes and stabilize room shell rendering

**Files:**
- Modify: `client/src/components/GameRoom.jsx`
- Modify: `client/src/components/TableStage.jsx`
- Modify: `client/src/index.css`
- Modify: `client/src/utils/productMode.js`
- Modify: `client/src/utils/productMode.test.js`

**Step 1: Write the failing test**

Add or keep a test proving the room shell breakpoint contract remains stable.

Example:

```js
assert.equal(resolveRoomShellLayout(1440), 'split-stage');
assert.equal(resolveRoomShellLayout(1536), 'three-column');
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
```

Expected: FAIL if the layout contract or export is missing.

**Step 3: Write minimal implementation**

- replace scan-fragile dynamic Tailwind class construction with explicit class branches where needed
- keep room shell responsive classes available after the Tailwind 4 migration
- preserve the current semantic CSS selectors for the room shell and table stage

**Step 4: Run tests and build**

Run:

```bash
cd client
node --test src/utils/productMode.test.js
npm run build
```

Expected: PASS.

**Step 5: Commit**

```bash
git add client/src/components/GameRoom.jsx client/src/components/TableStage.jsx client/src/index.css client/src/utils/productMode.js client/src/utils/productMode.test.js
git commit -m "fix: stabilize room shell classes after tailwind 4 migration"
```

### Task 5: Verify in the browser and record migration evidence

**Files:**
- Modify: `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- Modify: `docs/runbooks/real-browser-regression-runbook.md`
- Modify: `真实浏览器联机回归踩坑记录.md`

**Step 1: Run browser verification at key widths**

Verify:

- mode gateway desktop
- room shell at `1280px`
- room shell at phone portrait width

Capture screenshots and note any migration-specific regressions.

**Step 2: Verify expected results**

Expected:

- gateway still styled correctly
- room shell renders with the correct responsive form
- no new missing-style regressions
- no new horizontal overflow

**Step 3: Record migration notes**

- update the product polish todo with migration status
- update the runbook if startup or verification steps changed
- record any Tailwind 4-specific pitfalls in the browser pitfall log

**Step 4: Run final verification**

Run:

```bash
cd client
npm run build
node --test src/utils/productMode.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add docs/plans/2026-03-19-poker-product-polish-todolist.md docs/runbooks/real-browser-regression-runbook.md 真实浏览器联机回归踩坑记录.md
git commit -m "docs: record tailwind 4 migration verification"
```
