# Poker Product Readiness Todo

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Drive `feat/presentation-state-refactor` to a state where the poker game is credible as a real product and can be merged into `main` without known gameplay, recovery, or operator-flow blockers.

**Architecture:** Keep the current server-authoritative room/hand/seat/ledger model. Remaining work is no longer broad gameplay refactor; it is product hardening: tightening UI semantics, eliminating known recovery/operator gaps, expanding deterministic regression coverage, and maintaining a living merge gate with fresh evidence.

**Tech Stack:** Node.js, Express, Socket.IO, Jest, React 18, Vite, PowerShell scripts, Chrome DevTools MCP, Node `node:test`

---

## How To Use This Todo

- This file is the single source of truth for remaining work on `feat/presentation-state-refactor`.
- Every task must carry a status:
  - `[done]`
  - `[in_progress]`
  - `[blocked]`
  - `[todo]`
- After every material result, update:
  - task status
  - evidence
  - new blockers or scope cuts
- Do not merge to `main` until all merge-gate items are `[done]`.

## Current Snapshot

- Branch: `feat/presentation-state-refactor`
- Stable checkpoint: `60550af feat: stabilize presentation-state gameplay flows`
- Current policy:
  - keep all ongoing work on this branch
  - no merge to `main`
  - no push until product-readiness gate is closed

## Fresh Evidence Baseline

- `[done]` Server regression suite passes
  - Command: `cd server && npm test -- --runInBand`
  - Latest result: `11/11` suites, `102/102` tests passed on `2026-03-19`
- `[done]` Client targeted regression suite passes
  - Command: `cd client && node --test src/utils/serverOrigin.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js`
  - Latest result: `23/23` tests passed on `2026-03-19`
- `[done]` Production build passes
  - Command: `cd client && npm run build`
  - Latest result: build succeeded on `2026-03-19`
- `[done]` Real-browser matrix already verified
  - `settling` reload with extended `settleMs`
  - `0` chips -> rebuy -> reseat -> next hand
  - 3-player unequal-stack side pot
  - mid-hand join -> next-hand-only entry
  - 6-player fast 3-hand smoke

## Merge Gate

- `[done]` No known product-critical UX ambiguity in active gameplay flows
- `[done]` No known operator-flow gap in environment start/stop, room verification, or browser cleanup
- `[done]` No known reconnect/recovery blocker beyond documented non-goals
- `[done]` Full automated suite remains green after final polish work
- `[done]` Full browser matrix is rerun after final polish work
- `[done]` Docs, scripts, README, and actual workflow all agree

## Completed Work We Should Not Re-open Without New Evidence

- `[done]` Recovery-required detection and host recovery flow
- `[done]` Host spectator start alignment
- `[done]` Clean idle reset when next hand cannot start
- `[done]` Dev proxy alignment for worktree backend
- `[done]` `settling` reconnect restoration on server and browser proof with long settle window
- `[done]` 3-player side-pot authoritative hand-history recording
- `[done]` Mid-hand join isolation to next hand
- `[done]` 6-player fast smoke without phantom side pots
- `[done]` Environment scripts for preflight / start / stop / room tracking

## Active Queue

### Task 1: Build a Real Merge-Blocking Inventory

- Status: `[done]`
- Why this exists:
  - We need a living list of what still blocks merge, not a pile of old regression notes mixed with already-fixed issues.
- Exit criteria:
  - this todo file exists
  - merge gate is explicit
  - completed items and remaining items are separated

### Task 2: Tighten Side-Pot And Settlement Readability

- Status: `[done]`
- Why this is next:
  - current gameplay engine is stable enough that the highest remaining product risk is user confusion during all-in / settlement / side-pot resolution
  - old regression notes explicitly call out unclear side-pot winner text and weak main-pot / side-pot readability
- Scope:
  - settlement summary should clearly distinguish:
    - total pot
    - main pot winners
    - side pot winners
    - split-pot cases
  - table-center pot display should be readable during active all-in states
  - do not change backend pot rules unless new failing evidence appears
- Expected files:
  - `client/src/view-models/handHistoryViewModel.js`
  - `client/src/view-models/handHistoryViewModel.test.js`
  - `client/src/components/SettlementOverlay.jsx`
  - `client/src/components/GameRoom.jsx`
- Verification:
  - targeted client tests
  - build
  - browser replay of side-pot scenario
- Scope adjustment discovered during execution:
  - the old hand record format did not carry per-pot winner attribution
  - this task required a backend augmentation to emit `potResults`; pure frontend copy changes would have been misleading in split or mixed-winner cases
- Fresh evidence:
  - `cd server && npm test -- --runInBand`
    - `11/11` suites, `102/102` tests passed on `2026-03-19`
  - `cd client && node --test src/utils/serverOrigin.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js`
    - `23/23` tests passed on `2026-03-19`
  - `cd client && npm run build`
    - build passed on `2026-03-19`
  - real browser room `38L942`
    - active all-in state showed `总池 3020 / 边池 1 1960 / 待匹配差额 1000`
    - settlement overlay showed `总池 +5,000 / 主池 +3,000 / 边池 1 +2,000`
    - `/api/debug/rooms/38L942` confirmed `potResults` for main and side pot

### Task 3: Tighten Mid-Hand Join Messaging

- Status: `[done]`
- Why this matters:
  - the state transition is correct, but the UI still does not explain clearly enough why the player has no hole cards yet and when entry becomes active
- Scope:
  - make the “next hand join” state explicit and persistent enough to avoid confusion
  - show whether the player is seated but out of the current pot
  - avoid misleading seat/chip cues
- Expected files:
  - `client/src/view-models/gameViewModel.js`
  - `client/src/view-models/gameViewModel.test.js`
  - `client/src/components/GameRoom.jsx`
  - possibly `client/src/components/PlayerPanel.jsx`
- Verification:
  - targeted client tests
  - browser replay of `mid-hand join`
- Fresh evidence:
  - `cd client && node --test src/view-models/gameViewModel.test.js`
    - `14/14` tests passed on `2026-03-19`
  - real browser room `H9U8F6`
    - late-join page showed persistent banner `已入座，本手观战`
    - during `settling`, the same page switched to `已入座，等待下一手`
    - next hand started with the banner gone, two hole cards visible, and the late-join player active as `SB`
    - `/api/debug/rooms/H9U8F6` confirmed hand 1 `tableState = seated_wait_next_hand`, then hand 2 `isActive = true`

### Task 4: Add Defensive Rendering For Incomplete Room/Game State

- Status: `[done]`
- Why this matters:
  - product-readiness requires a bad payload or transient reconnect state to degrade gracefully, not white-screen the whole room
- Scope:
  - audit render paths that assume `gameState`, `players`, `currentPlayer`, `roomSettings`
  - replace crash-prone branches with explicit fallbacks
- Expected files:
  - `client/src/components/GameRoom.jsx`
  - `client/src/contexts/GameContext.jsx`
  - targeted client tests where practical
- Verification:
  - targeted tests
  - build
- Fresh evidence:
  - `GameRoom.jsx` now normalizes `players`, `gameState`, room state, seat count, hand cards, and per-player chip/bet labels before rendering
  - `PlayerPanel.jsx` now tolerates missing `nickname`, `chips`, and `seat` fields without crashing the panel
  - `cd client && npm run build`
    - build passed on `2026-03-19`
  - browser replay of rooms `38L942` and `H9U8F6`
    - no white-screen or panel crash occurred during join/settling/auto-next-hand transitions

### Task 5: Convert Operator Workflow Into A Formal Runbook

- Status: `[done]`
- Why this matters:
  - a real product branch cannot depend on tribal memory for start/stop, browser cleanup, port checks, or room debug verification
- Scope:
  - align:
    - `README.md`
    - scripts
    - regression log
    - this todo
  - remove stale references to workflows that no longer exist
  - write a concise “preflight / execute / cleanup / evidence capture” runbook
- Expected files:
  - `README.md`
  - `真实浏览器联机回归踩坑记录.md`
  - maybe a dedicated runbook doc if the README becomes noisy
- Verification:
  - dry-run the documented commands exactly as written
- Fresh evidence:
  - added dedicated runbook:
    - `docs/runbooks/real-browser-regression-runbook.md`
  - updated `README.md` to point real-browser regression work at the runbook and worktree scripts
  - dry-run completed on `2026-03-19`:
    - `manage-real-browser-env.ps1 stop-all`
    - `browser-room-workflow.ps1 clear-current-room`
    - `manage-real-browser-env.ps1 start-all -CleanProfile -SettleMs 15000`
    - `manage-real-browser-env.ps1 status`
    - `Invoke-RestMethod http://127.0.0.1:3101/api/debug/devices | ConvertTo-Json -Depth 4`
    - `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/index.html | Select-Object StatusCode`
    - `browser-room-workflow.ps1 set-from-url -Url http://127.0.0.1:5173/game/H9U8F6`
    - `browser-room-workflow.ps1 show-current-room`
    - `browser-room-workflow.ps1 print-current-room-url`
- Execution notes:
  - CLI health-checking `5173` should use `/index.html`, not bare `/`
  - room-workflow commands are sequential operator commands; do not treat `set-from-url` and `show-current-room` as parallel checks

### Task 6: Add Longer-Duration Product Soak Coverage

- Status: `[done]`
- Why this matters:
  - the current matrix proves correctness for short, high-value flows, but not extended operator confidence
- Scope:
  - run a longer live-room soak with repeated hands and reconnect disturbance
  - capture evidence for:
    - no seat drift
    - no dead room after disconnect
    - no stale side-pot projection
    - no browser/operator cleanup confusion
- Expected files:
  - scripts and docs if automation gaps are found
  - regression log with timestamped results
- Verification:
  - real-browser evidence only
- Fresh evidence:
  - real browser room `WF625O`
  - three consecutive 3-player hands completed after a fresh environment restart
  - during hand 2, the late player page was closed and reopened with the same `isolatedContext`, and the room recovered without seat drift or dead-room behavior
  - by hand 4 `preflop`, `/api/debug/rooms/WF625O` still showed:
    - seats stable at `0 / 1 / 2`
    - `handHistoryCount = 3`
    - latest hand `totalPot = 30`
    - latest hand `reason = 其他玩家全部弃牌`
    - latest hand `pots = []`
    - no stale `sidePots`

### Task 7: Final Product-Readiness Rerun

- Status: `[done]`
- Why this is last:
  - after all remaining polish/hardening, we need one fresh, comprehensive pass
- Scope:
  - rerun:
    - full server tests
    - client targeted tests
    - client build
    - browser matrix
  - update this file with final pass/fail state
- Exit criteria:
  - all merge-gate items become `[done]`
  - branch is ready to present merge options, but still not merged automatically
- Fresh evidence so far:
  - `cd server && npm test -- --runInBand`
    - `11/11` suites, `102/102` tests passed on `2026-03-19`
  - `cd client && node --test src/utils/serverOrigin.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js`
    - `23/23` tests passed on `2026-03-19`
  - `cd client && npm run build`
    - build passed on `2026-03-19`
  - fresh browser reruns completed on post-polish code:
    - side-pot readability room `38L942`
    - mid-hand join messaging room `H9U8F6`
    - reconnect soak room `WF625O`
    - rebuy / reseat / next hand room `J54RJ0`
    - 6-player smoke room `J05H3O`
    - extended 4-player reconnect soak room `7GHPD4`
  - `J54RJ0`
    - losing player reached `seat = -1`, `chips = 0`
    - same player rebought `1000`, re-seated into seat `2`, and entered the next hand as `BB`
    - `/api/debug/rooms/J54RJ0` confirmed the recovered player returned to `seat = 1`, `chips = 980`, `isActive = true` in fresh `preflop`
  - `J05H3O`
    - six isolated browser identities filled seats `0..5`
    - three consecutive hands completed with no seat drift, no dead room, and no stale `sidePots`
    - by hand `4` `preflop`, `/api/debug/rooms/J05H3O` confirmed:
      - stable seats `0 / 1 / 2 / 3 / 4 / 5`
      - `handHistoryCount = 3`
      - latest hand `totalPot = 30`
      - latest hand `reason = 其他玩家全部弃牌`
      - latest hand `pots = []`
      - `gameState.sidePots = []`
  - `7GHPD4`
    - four isolated browser identities completed five consecutive hands
    - same-identity reconnects were forced during hand `2` and hand `4`
    - both reconnects restored a new `socketId` onto the original seated player without seat drift
    - by hand `6` `preflop`, `/api/debug/rooms/7GHPD4` confirmed:
      - stable seats `0 / 1 / 2 / 3`
      - `handHistoryCount = 5`
      - latest hand `totalPot = 30`
      - latest hand `reason = 其他玩家全部弃牌`
      - latest hand `pots = []`
      - `gameState.sidePots = []`

## Live Adjustment Rules

- If a task uncovers a backend correctness bug, insert the backend bugfix task immediately before any UI polish that depends on it.
- If a browser run disproves an assumption in this file, update this file first, then continue implementation.
- If a task finishes without changing code, still record the evidence and close it.
- If a task expands materially, split it into smaller tasks here instead of letting the queue become vague.
