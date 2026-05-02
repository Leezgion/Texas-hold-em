# Poker Product Polish Todo

**Goal:** Keep polishing the game on the active product branch until it is robust in normal play, resilient in edge cases, aligned with serious Hold'em table expectations, and only then merge back to `main`.

**Non-goals for this phase:** deployment, staging, CI, persistence, or launch preparation. Those tracks are intentionally deferred.

**Current product direction:** support three usage goals at the same time through configurable modes instead of three separate products:

- `club`: for offline private games and club-style table assistance
- `pro`: for online-grinder style play, speed, and information density
- `study`: for review, replay, and hand-history comprehension
- next visual pass after this contract lock: Broadcast Tactical table treatment on the approved deep-green / black-gold / clean-center surface family

**Architecture direction:** keep one authoritative gameplay engine. Add a thin configuration layer instead of forking rules or UI flows:

- shared room-level mode presets for table behavior and defaults
- local client display modes for information density and presentation
- room-shell terminal metadata now targets a unified `9-max` tournament capsule table family across modes
- one common recovery / seat / hand / ledger model underneath

---

## How To Use This Todo

- This file is now the active source of truth for product polishing work after the presentation-state merge.
- Every task must carry one status:
  - `[done]`
  - `[in_progress]`
  - `[blocked]`
  - `[todo]`
- After each meaningful result, update:
  - task status
  - evidence
  - newly discovered gaps
  - newly discovered pitfalls
- Do not start large UI polish until functional and exception-handling tasks are stable.

## Current Snapshot

- Branch at original plan creation: `main`
- Active branch as of `2026-05-02`: `feat/poker-os-polish`
- Merge policy: stay on the active product branch until the table UX, functional flows, browser regression, and edge-case tests are complete; only then merge to `main` and push.
- Baseline commit at plan creation: `d705784`
- Automated regression baseline was green before this plan started:
  - `server`: `102/102`
  - `client`: `23/23`
  - `build`: passed
- Fresh baseline rerun on `main` after plan creation is also green:
  - `server`: `105/105` on `2026-03-19`
  - `client`: `29/29` on `2026-03-19`
  - `build`: passed on `2026-03-19`
- Existing operator runbook and regression log already exist:
  - `docs/runbooks/real-browser-regression-runbook.md`
  - `真实浏览器联机回归踩坑记录.md`

## 2026-05-02 Active Product-Branch Update

- Status: `[done]` Product copy cleanup, canonical `9-max` seat semantics, closed-seat modeling, and table-anchor safety pass are verified on the active branch.
- Scope completed in this pass:
  - product-facing Chinese labels for room support surfaces, mode cards, history/event panels, and settlement surfaces
  - sanitized player display names so raw `device_*` identities do not leak into key UI surfaces
  - a unified `9-max` visual table with room-cap seats marked as closed rather than changing the table geometry per player count
  - compact visual plaques separated from larger anchor-safety footprints, so live-turn badges and halo states do not clip back into the table
  - sign-symmetric seat-coordinate rounding, so phone left/right canonical anchors stay mirrored at half-pixel boundaries
- Automated evidence:
  - `cd client && node --test ...`
    - `204/204` passed on `2026-05-02`
  - `cd client && npm run build`
    - passed on `2026-05-02`
  - `cd server && npm test -- --runInBand`
    - `114/114` passed on `2026-05-02`
- Browser evidence status:
  - `[done]` live browser evidence is now available for the desktop gateway, create-room modal, desktop waiting/live, phone waiting, phone roster sheet, phone live-hand, 6-max / 9-max occupied live hands, and phone raise-drawer recovery on the dedicated `3101 / 5173` regression pair.
  - latest desktop waiting screenshot: `.runlogs/2026-05-02-room-desktop-waiting-closed-plaques-hidden.png`
  - latest phone live-hand screenshots include `.runlogs/2026-05-02-room-phone-live-hand-9max-after-rail-badges.png` and `.runlogs/2026-05-02-room-phone-live-hand-9max-raise-open-after-sticky-footer.png`
  - follow-up browser gameplay smoke also covers 2-max settlement and 9-max first-action raise drawer recovery.
- Next immediate queue:
  - `[done]` reran live browser screenshots and metrics for create-room desktop, desktop waiting/live, phone waiting, and phone roster sheet.
  - `[done]` fixed the visual overlap and density regressions found by that browser pass.
  - `[done]` continued gameplay validation for supported room sizes and edge flows.

## 2026-05-02 Compact Waiting-Table Follow-up

- Status: `[done]` Desktop waiting-room density and seat readability pass is implemented and verified locally.
- Root causes found in fresh browser evidence:
  - `5173/` returned a Vite dev 404 in this regression setup while `5173/index.html` served the app; BrowserRouter routes must be initialized explicitly during Playwright evidence capture.
  - `start-all` can leave only the backend alive; the client listener must be verified separately before browser work starts.
  - waiting rooms were rendering a `0` pot capsule and full closed-seat plaques, consuming the same top-stage budget as meaningful table information.
  - compact desktop top-row plaques need a scoped inside-panel rule because the table shell clips overflow.
- Local fixes in this pass:
  - closed seats stay in the canonical table model and SVG guide layer, but no longer render full SeatRing plaques.
  - zero-pot waiting capsules are suppressed so the center stage is reserved for actual hand information.
  - desktop compact pot placement and top-row plaque placement are scoped to `desktop-oval`.
  - split-stage seat projection now budgets the live-turn footprint without forcing a taller compact shell.
- Automated evidence:
  - `cd client && node --test src/view-models/handHistoryViewModel.test.js src/view-models/gameViewModel.test.js src/utils/tacticalMotion.test.js src/utils/tableStageLayout.test.js src/utils/socketRequest.test.js src/utils/serverOrigin.test.js src/utils/seatRingLayout.test.js src/utils/roomViewportLayout.test.js src/utils/roomTransition.test.js src/utils/productMode.test.js src/utils/playerIdentity.test.js src/components/dialogSemanticsContract.test.js src/components/createRoomSurfaceContract.test.js src/components/createRoomModalContract.test.js src/components/gameRoomStageContract.test.js src/components/roomTerminalShellContract.test.js src/components/roomShellScrollContract.test.js src/components/interactionSurfaceContract.test.js`
  - `207/207` passed on `2026-05-02`
  - `cd client && npm run build`
  - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - `cd server && npm test -- --runInBand`
  - `114/114` passed on `2026-05-02`
  - focused red/green evidence during the stage-clearance fix:
  - full client suite initially failed only `desktop oval stage chrome leaves a real clearance gap above the top seat`
  - after adding the small projection stage-clearance reserve, `src/utils/tableStageLayout.test.js src/utils/seatRingLayout.test.js` passed `50/50`
  - `cd client && node --test src/components/gameRoomStageContract.test.js src/components/interactionSurfaceContract.test.js src/utils/seatRingLayout.test.js`
  - `50/50` passed on `2026-05-02`
- Fresh browser evidence:
  - `.runlogs/2026-05-02-room-desktop-waiting-after-stage-clearance.png`
  - room `WYL79Q`
  - `scrollHeight = clientHeight = bodyHeight = 900`
  - `tableProfile = desktop-oval`
  - `shellOrientation = horizontal-capsule`
  - `potExists = false`
  - `plaqueCount = 5`
  - `closedPlaques = 0`
  - `clippedByPanel = []`
  - top open-seat plaque still geometrically touches the table rail, but it is now an embedded rail treatment and does not cover the pot, board tray, or action area
- Remaining queue for this phase:
  - `[done]` rerun phone portrait waiting-room browser evidence
  - `[done]` rerun phone roster sheet evidence
  - `[done]` rerun live-hand desktop and phone evidence for action dock / table co-visibility

## 2026-05-02 Phone Waiting And Roster Follow-up

- Status: `[done]` Phone waiting-room table, dock, header, and roster sheet constraints are implemented and verified locally.
- Root causes found in fresh browser evidence:
  - phone `lower-left / lower-right` seat anchors were still using the desktop-like `0.48` lower-flank vertical ratio, which pushed open-seat plaques about `9.4px` into the waiting dock
  - phone header kept the full `服务器已连接` copy inside a single-line badge row, causing the rightmost connection badge to clip
- Local fixes in this pass:
  - `phone-oval` lower flank anchors move to `0.41`, preserving the same vertical capsule table while keeping open-seat plaques above the dock reserve
  - `TableHeader` uses `已连接 / 未连接` only on `phone-terminal`; desktop keeps the complete `服务器已连接 / 服务器未连接` copy
- Automated evidence:
  - red test before the fix: `phone lower flank y=131/131 should leave room for the waiting dock`
  - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js`
  - `66/66` passed on `2026-05-02`
  - `cd client && node --test src/view-models/handHistoryViewModel.test.js src/view-models/gameViewModel.test.js src/utils/tacticalMotion.test.js src/utils/tableStageLayout.test.js src/utils/socketRequest.test.js src/utils/serverOrigin.test.js src/utils/seatRingLayout.test.js src/utils/roomViewportLayout.test.js src/utils/roomTransition.test.js src/utils/productMode.test.js src/utils/playerIdentity.test.js src/components/dialogSemanticsContract.test.js src/components/createRoomSurfaceContract.test.js src/components/createRoomModalContract.test.js src/components/gameRoomStageContract.test.js src/components/roomTerminalShellContract.test.js src/components/roomShellScrollContract.test.js src/components/interactionSurfaceContract.test.js`
  - `209/209` passed on `2026-05-02`
  - `cd client && npm run build`
  - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - `cd server && npm test -- --runInBand`
  - `114/114` passed on `2026-05-02`
- Fresh browser evidence:
  - `.runlogs/2026-05-02-room-phone-waiting-header-compact.png`
  - room `DJPCKF`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `tableProfile = phone-oval`
  - `shellOrientation = vertical-capsule`
  - `potExists = false`
  - `closedPlaques = 0`
  - `overlappingTable = []`
  - `overlappingBoard = []`
  - `overlappingDock = []`
  - `clipped = []`
  - lower flank dock gap: `9.57px`
  - `headerOverflow = false`
  - quick actions remain visible: `补码 / 离座 / 分享 / 退出 / 成员 / 牌局 / 房间`
  - `.runlogs/2026-05-02-room-phone-roster-sheet.png`
  - room `YA5ZNJ`
  - roster sheet state: `scrollHeight = clientHeight = bodyHeight = 844`, `rootInert = true`, `dialogCount = 1`, `data-sheet-density = tight-terminal`
- Remaining queue:
  - `[done]` run the full client node suite after this phone fix
  - `[done]` run `cd client && npm run build`
  - `[done]` run `cd server && npm test -- --runInBand`
  - `[done]` commit the phone waiting/roster phase
  - `[done]` continue live-hand desktop and phone evidence

## 2026-05-02 Live-Hand Phone Action-Dock Follow-up

- Status: `[done]` Desktop live-hand evidence is recorded and phone live-hand table/action co-visibility is implemented and verified locally.
- Root causes found in fresh browser evidence:
  - desktop live-hand was usable, but phone live-hand had a `~504px` action dock that covered the vertical capsule table and public board region
  - shrinking the phone stage height alone moved the seat-coordinate center upward and clipped the top open seat into the header
  - phone live-hand continued rendering open-seat plaques even though they were not useful during a hand and competed with action controls
  - opponent plaques on phone were too tall and too close to viewport/dock edges for a dense live-hand screen
- Local fixes in this pass:
  - `GameRoom` exposes `data-room-play-state="live-hand"` so phone live-hand can use a different stage contract from waiting rooms
  - phone live-hand keeps the vertical stage coordinate space, shifts the table center upward, and compacts the betting dock instead of making the user scroll
  - `SeatRing` hides open seats only for `phone-oval` live hands; occupied opponents remain visible
  - `SeatCard` applies phone live-hand nudges for flank/lower plaques and compacts opponent plaques into table badges
  - phone top-row canonical anchors move from `-1` to `-0.91`, staying below the compact header while preserving table and stage-band clearance
  - 6-max / 9-max occupied phone live-hand evidence exposed a right-side plaque collision between `lower-right` and `near-hero-right`
  - the follow-up fix turns phone live-hand opponent plaques into shorter rail badges, hides the non-essential net chip on phone, and separates `lower-right` from `near-hero-right`
- Automated evidence:
  - red test before the seat fix: `top-left y=-272 should stay below the compact header apron`
  - red contract before the live-hand fix: missing `data-room-play-state` and phone live-stage / dock rules
  - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/seatRingLayout.test.js`
  - `43/43` passed on `2026-05-02`
  - `cd client && node --test <all src/**/*.test.js>`
  - `214/214` passed on `2026-05-02`
  - `cd client && npm run build`
  - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - `cd server && npm test -- --runInBand`
  - `114/114` passed on `2026-05-02`
- Fresh browser evidence:
  - `.runlogs/2026-05-02-room-desktop-live-hand.png`
  - room `P8Q5C3`
  - `scrollHeight = clientHeight = bodyHeight = 900`
  - `tableProfile = desktop-oval`
  - `shellOrientation = horizontal-capsule`
  - `potText = 底池30`
  - `holeCardCount = 2`
  - action buttons visible: `弃牌 / 跟注 / 加注 / 全下`
  - `dockStageGap = 30.97px`, `tableDockGap = 105.47px`, `boardDockGap = 215.97px`
  - `.runlogs/2026-05-02-room-phone-live-hand-after-compact-opponent-badges.png`
  - room `WOJWZJ`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `data-room-play-state = live-hand`
  - `tableProfile = phone-oval`
  - `potText = 底池30`
  - `holeCardCount = 2`
  - `plaqueCount = 1` in the two-player sample because open seats are intentionally suppressed during phone live hands
  - `dockTable = false`
  - `dockBoard = false`
  - `actionCards = false`
  - `plaqueDock = []`
  - `plaqueTable = []`
  - `plaqueBoard = []`
  - `clippedViewport = []`
  - `dockTableGap = 9.73px`
  - `dockBoardGap = 124.73px`
  - `.runlogs/2026-05-02-room-phone-live-hand-6max-after-rail-badges.png`
  - room `W6CTAW`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `plaqueCount = 5`
  - `dockTable = false`
  - `dockBoard = false`
  - `actionCards = false`
  - `plaqueDock = []`
  - `plaqueBoard = []`
  - `plaquePairs = []`
  - `clippedViewport = []`
  - `.runlogs/2026-05-02-room-phone-live-hand-9max-after-rail-badges.png`
  - room `0EMFC5`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `plaqueCount = 8`
  - `dockTable = false`
  - `dockBoard = false`
  - `actionCards = false`
  - `plaqueDock = []`
  - `plaqueBoard = []`
  - `plaquePairs = []`
  - `clippedViewport = []`
  - `.runlogs/2026-05-02-room-phone-live-hand-9max-raise-open-after-sticky-footer.png`
  - room `LYZ3H3`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `dockTable = false`
  - `dockBoard = false`
  - `actionCards = false`
  - `raiseTable = false`
  - `raiseBoard = false`
  - `raiseCards = false`
  - `raiseLauncher = false`
  - `confirmVisible = true`
  - `raiseSurface.scrollable = true`
- Remaining queue:
  - `[done]` validate phone live-hand with 6-max and 9-max occupied seats, including lower-flank and near-hero occupied opponents
  - `[done]` validate raise-slider open state on phone live-hand so expanded bet sizing does not reintroduce scroll or table overlap
  - `[done]` continue gameplay validation for supported room sizes and edge flows

## 2026-05-02 Supported Room-Size Gameplay Follow-up

- Status: `[done]` Minimum and maximum table-size gameplay smoke is now explicitly covered.
- Why this matters:
  - visual table geometry is now always a unified `9-max` table, but server gameplay still needs to prove that capped `2-max` and full `9-max` rooms behave correctly
  - existing smoke covered six-player hands, side pots, settlement, and room-state recovery, but did not directly assert heads-up blind/action order or full-table starting semantics
- New automated coverage:
  - `2-max` heads-up room:
    - third joiner becomes spectator with `seat = -1`, `chips = 0`, and does not enter the hand
    - dealer is also small blind on the first hand
    - heads-up preflop action starts on the button-small-blind
    - after settlement, the button/small-blind rotates to the other player
    - total chips remain conserved at `2000`
  - `9-max` full room:
    - exactly nine players enter the hand and each receives two cards
    - first hand starts with dealer seat `0`, small blind seat `1`, big blind seat `2`, and UTG seat `3`
    - fold-only settlement reaches `settling` without phantom side pots
    - total chips remain conserved at `9000`
    - seat map does not drift after settlement
- Fresh evidence:
  - `cd server && npm test -- GameplaySmoke.test.js --runInBand`
  - `4/4` passed on `2026-05-02`
- Remaining gameplay queue:
  - `[done]` real-browser smoke for a short 2-max hand from create/join/start through settlement UI
  - `[done]` real-browser smoke for a 9-max full room through first action and raise drawer recovery
  - `[done]` review client feedback copy for invalid/out-of-turn/min-raise actions after the browser gameplay pass

## 2026-05-02 Browser Gameplay Edge Follow-up

- Status: `[done]` 2-max settlement and 9-max first-action raise drawer are verified in a real phone browser viewport.
- Method:
  - Socket.IO seeded deterministic `2-max` and `9-max` rooms so the browser pass could focus on critical UI actions instead of repeating manual join boilerplate
  - the browser still entered with real persisted device IDs through `/game/:roomId`
  - 2-max host performed the actual UI `开始` and `弃牌` actions
  - 9-max current actor opened the actual UI `加注` drawer
- Fresh evidence:
  - `.runlogs/2026-05-02-browser-gameplay-edge-smoke.json`
  - `.runlogs/2026-05-02-browser-2max-settlement-phone.png`
  - room `0I7WBP`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `settlementVisible = true`
  - `handHistoryCount = 1`
  - `totalChips = 2000`
  - spectator `seat = -1`, `chips = 0`, `isActive = false`
  - `dockTable = false`, `dockBoard = false`, `actionCards = false`
  - `clippedViewport = []`
  - `.runlogs/2026-05-02-browser-9max-raise-open-phone.png`
  - room `ZAYM4P`
  - current actor `device_browser9_moo5beyi_4`
  - `scrollHeight = clientHeight = bodyHeight = 844`
  - `actionConsoleState = decision`
  - `holeCardCount = 2`
  - `plaqueCount = 8`
  - `confirmVisible = true`
  - `raiseSurface.scrollable = true`
  - `raiseTable = false`, `raiseBoard = false`, `raiseCards = false`, `raiseLauncher = false`
  - `clippedViewport = []`
  - server `inHandCount = 9`, `pot = 30`, `chipsPlusPot = 9000`
- Product notes from the pass:
  - 9-max phone live-hand is intentionally very dense; side plaques are close to the rail and viewport edge but not clipped in the measured pass
  - settlement overlay on phone is readable and remains single-screen, but it visually dominates the table; revisit only after invalid-action feedback polish if we decide settlement needs a lower-profile pro variant

## 2026-05-02 Player-Action Feedback Follow-up

- Status: `[done]` Message-only player-action errors now map to actionable warning toasts instead of generic error toasts.
- Root cause:
  - server player-action failures often return only Chinese `message` values without structured `code`
  - client feedback mapping already handled coded errors, but message-only errors such as `加注金额必须至少为 40` fell back to `操作失败：...`
- Local fixes:
  - message-only `不是你的回合` maps to an immediate warning
  - message-only min-raise errors parse the required amount and tell the player the minimum
  - message-only `筹码不足`, `当前不能过牌`, `玩家当前无法行动`, and `无效的动作` map to concise action guidance
- Fresh evidence:
  - red test before implementation:
    - `cd client && node --test src/view-models/gameViewModel.test.js`
    - failed at `maps message-only player action errors to actionable warning feedback`
  - green focused test:
    - `cd client && node --test src/view-models/gameViewModel.test.js`
    - `40/40` passed on `2026-05-02`

## 2026-05-02 Socket Lifecycle Hygiene Follow-up

- Status: `[done]` Server socket-device registry cleanup is implemented and verified locally.
- Root cause:
  - browser evidence runs and Socket.IO setup scripts create many short-lived sockets
  - `server.js` handled disconnects but intentionally kept `socketDeviceMap` entries, so `/api/debug/devices` accumulated stale socket IDs and made pre-task service checks misleading
  - same-device reconnect cleanup only removed the first stale socket mapping, which was not enough after repeated browser retries
- Local fixes:
  - extracted `socketDeviceRegistry` helper for register/unregister/list semantics
  - same-device registration removes all stale socket IDs before setting the current socket
  - disconnect unregisters the current socket before delegating player-disconnect handling, while reconnect still works through the device ID
- Fresh evidence:
  - red before implementation:
    - `cd server && npm test -- socketDeviceRegistry.test.js --runInBand`
    - failed because `../utils/socketDeviceRegistry` did not exist
  - green focused test:
    - `cd server && npm test -- socketDeviceRegistry.test.js --runInBand`
    - `4/4` passed on `2026-05-02`
  - full server suite:
    - `cd server && npm test -- --runInBand`
    - `120/120` passed on `2026-05-02`

## 2026-05-02 Mobile Create-Room Density Follow-up

- Status: `[done]` Mobile create-room modal density is implemented and verified locally.
- Root cause:
  - desktop create-room cards were acceptable, but the phone full-screen sheet still rendered three large profile cards and stacked summary cards
  - fresh browser metrics showed phone `modePanel = 844.97px`, `modeStrip = 477.97px`, and body `scrollHeight = 1267px`
  - this recreated the original user-reported issue where room creation felt like scrolling through marketing panels instead of setting up a table
- Local fixes:
  - phone create-room mode choice collapses into a three-column compact selector
  - phone mode selector hides persona/copy/chip prose and keeps only mode identity plus selected state
  - phone quick summary uses three compact metric columns instead of three stacked large cards
  - desktop create-room layout remains unchanged
- Fresh evidence:
  - red before implementation:
    - `cd client && node --test src/components/createRoomSurfaceContract.test.js`
    - failed at `create-room phone contract collapses mode choice into a compact selector instead of tall profile cards`
    - failed at `create-room phone summary uses compact metric columns instead of stacked large cards`
  - green focused test:
    - `cd client && node --test src/components/createRoomSurfaceContract.test.js`
    - `11/11` passed on `2026-05-02`
  - full client suite:
    - `cd client && node --test <all src/**/*.test.js>`
    - `218/218` passed on `2026-05-02`
  - client build:
    - `cd client && npm run build`
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser evidence:
    - `.runlogs/2026-05-02-create-room-modal-phone.png`
    - `.runlogs/2026-05-02-create-room-modal-desktop.png`
    - phone after fix: `modePanel = 283.70px`, `modeStrip = 81.53px`, `body.clientHeight = 672`, `body.scrollHeight = 685`, `footerVisible = true`, `clipped = []`
    - desktop after fix: still `tileCount = 3`, `bodyOwnsOverflow = false`, `clipped = []`

## 2026-05-02 Modal Background Scroll-Lock Follow-up

- Status: `[done]` Modal background scroll-lock is implemented and verified locally.
- Root cause:
  - the modal surface made `#root` inert and portaled the dialog outside the app root, but it did not lock `html/body` scrolling
  - after the create-room modal opened, the underlying gateway page still reported `scrollHeight = 3325`
  - on phone, this creates a real risk that touch gestures scroll the background instead of the sheet body
- Local fixes:
  - `createModalSurfaceController` saves `body.style.overflow` and `documentElement.style.overflow`
  - modal activation sets both to `hidden`
  - modal deactivation restores the previous values
- Fresh evidence:
  - red before implementation:
    - `cd client && node --test src/components/dialogSemanticsContract.test.js`
    - failed at `modal surface controller locks background page scroll and restores it on close`
  - green focused test:
    - `cd client && node --test src/components/dialogSemanticsContract.test.js`
    - `9/9` passed on `2026-05-02`
  - full client suite:
    - `cd client && node --test <all src/**/*.test.js>`
    - `219/219` passed on `2026-05-02`
  - client build:
    - `cd client && npm run build`
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser evidence:
    - `.runlogs/2026-05-02-create-room-modal-phone.png`
    - phone modal open: `bodyOverflowY = hidden`, `htmlOverflowY = hidden`, modal body still `overflowY = auto`
    - desktop modal open: `bodyOverflowY = hidden`, `htmlOverflowY = hidden`

## 2026-05-02 Create-Room Submit Shell-Fit Follow-up

- Status: `[done]` Create-room submit-to-room shell fit is implemented and verified locally.
- Root cause:
  - after creating a room from the phone modal, scroll-lock restored correctly and the page stayed single-screen
  - fresh browser metrics still showed the room shell at `top = 10.39`, `bottom = 854.39`, so the shell itself extended about `10px` below the viewport
  - the cause was double vertical padding: the room route kept gateway `.mode-shell__content` padding while `room-terminal-shell` also had `py-3`
- Local fixes:
  - room routes now clear `.mode-shell__content` / `.mode-app-shell` padding
  - the room terminal keeps its own internal shell padding, so the table still has breathing room without exceeding `100dvh`
- Fresh evidence:
  - red before implementation:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js`
    - failed at `room route clears gateway page padding so phone terminals fit inside 100dvh`
  - green focused test:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js`
    - `21/21` passed on `2026-05-02`
  - full client suite:
    - `cd client && node --test <all src/**/*.test.js>`
    - `220/220` passed on `2026-05-02`
  - client build:
    - `cd client && npm run build`
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser evidence:
    - `.runlogs/2026-05-02-create-room-submit-phone-after-shell-padding.png`
    - room `B58VUN`
    - `bodyHeight = clientHeight = scrollHeight = 844`
    - `roomScrollContract = single-screen`
    - `shellRect.top = 0`, `shellRect.bottom = 844`, `shellRect.height = 844`
    - `frameRect.top = 12`, `frameRect.bottom = 832`, `frameRect.height = 820`
    - `clipped = []`

## 2026-05-02 Mobile Settlement Rail Follow-up

- Status: `[done]` Phone settlement no longer behaves like a full table-cover overlay during live-hand settlement.
- Root cause:
  - the generic phone settlement sheet reused the large desktop-style card footprint
  - fresh browser evidence after the shell-fit pass still showed `settlementTable = true` and `settlementBoard = true`
  - the product issue was not scrolling; it was hierarchy: the result surface dominated the table when the player only needed the latest-hand outcome and countdown
- Local fixes:
  - phone live-hand settlement now renders as a compact rail result near the lower table apron
  - it keeps the hand number, countdown, and winner/pot headline visible
  - total, board, and detailed net lines are hidden on the compact phone rail; the detailed review path remains in the hand-history support surface
- Fresh evidence:
  - red before implementation:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js`
    - failed at `phone-terminal settlement renders as a compact rail result instead of a full table cover`
  - green focused test:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js`
    - `22/22` passed on `2026-05-02`
  - browser rerun:
    - `.runlogs/2026-05-02-create-to-settlement-phone-after-shell-padding.png`
    - room `STJLX2`
    - `bodyHeight = clientHeight = scrollHeight = 844`
    - settlement rect: `top = 443.33`, `bottom = 533.98`, `height = 90.66`
    - `settlementTable = false`
    - `settlementBoard = false`
    - `clippedViewport = []`
- Reveal-action follow-up:
  - first showdown reveal browser audit exposed that four reveal buttons could make the compact rail tall enough to touch the table or dock
  - settlement sheets now add `settlement-sheet--with-reveal-actions` only when the current player can reveal
  - the reveal variant moves the winner/pot headline inline under the hand number and gives the four reveal buttons a single full-width row
  - final browser rerun:
    - `.runlogs/2026-05-02-showdown-reveal-phone.png`
    - room `67L2BQ`
    - `revealButtonCount = 4`
    - `bodyHeight = clientHeight = scrollHeight = 844`
    - settlement rect: `top = 440.38`, `bottom = 541.69`, `height = 101.31`
    - actions rect: `top = 493.34`, `bottom = 531.73`, `height = 38.39`
    - `settlementTable = false`
    - `settlementBoard = false`
    - `settlementDock = false`
    - `actionsDock = false`
    - `clippedViewport = []`

## 2026-05-02 Short Phone Live-Hand Layout Follow-up

- Status: `[done]` Short phone live-hand table, dock, and raise drawer constraints are implemented and verified locally.
- Root cause:
  - `375x667` phone portrait was still classified as `regular-height`, so it inherited the `390x844` live-hand table and action-dock spacing
  - the live dock measured too tall for that viewport and overlapped the table and public board even though page scrolling remained locked
  - the raise drawer inherited the same vertical budget problem and could collide with the table or hero-card row
- Local fixes:
  - compact phone portrait viewports from `520px` to `<700px` tall now enter the `short-height` room contract
  - short phone live hands use a micro table-stage contract and tighter live dock spacing
  - non-critical hero-column duplicate information is hidden only in the short-height live dock
  - the short-height raise drawer is bounded independently and remains internally scrollable
- Fresh evidence:
  - focused client contract tests:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/roomViewportLayout.test.js src/utils/tableStageLayout.test.js src/components/roomShellScrollContract.test.js`
    - `65/65` passed on `2026-05-02`
  - browser rerun at `390x844`:
    - room `M2SL71`
    - `dockTable = false`, `dockBoard = false`
    - `raiseTable = false`, `raiseBoard = false`, `raiseCards = false`
    - page scroll remained locked
  - browser rerun at `375x667`:
    - room `QG9F7O`
    - `bodyHeight = clientHeight = scrollHeight = 667`
    - shell rect: `bottom = 667`, `clippedViewport = []`
    - stage rect: `top = 90.58`, `bottom = 428.58`, `height = 338`
    - table rect: `top = 95.08`, `bottom = 272.08`, `height = 177`
    - dock rect: `top = 403.73`, `bottom = 663`, `height = 259.27`
    - live metrics: `dockTable = false`, `dockBoard = false`, `cardsCommandRow = false`
    - raise drawer rect: `top = 470.06`, `bottom = 622.06`, `height = 152`
    - raise metrics: `raiseTable = false`, `raiseBoard = false`, `raiseCards = false`
    - `raiseScroll.canScroll = true`
- Remaining queue:
  - `[done]` audit phone live-hand support panels (`成员 / 牌局 / 房间`) on short-height and regular phone viewports
  - `[done]` run real phone action execution flow through quick actions, raise confirm/cancel, and post-action state transitions
  - `[done]` compress the phone live-hand center cue after the single-screen action path stayed stable on both phone heights
  - `[done]` remove duplicated phone live-hand chrome from the table/header layer so the table owns more of the first screen

## 2026-05-02 Phone Support Panel Audit Follow-up

- Status: `[done]` Phone live-hand support panels keep modal isolation and owned overflow on regular and short phone viewports.
- Method:
  - seeded a fresh `2-max` live hand for each viewport through Socket.IO setup
  - entered the room with a real browser device ID and opened the actual `成员 / 牌局 / 房间` launcher buttons
  - tested both `390x844` and `375x667`
- Fresh evidence:
  - `.runlogs/2026-05-02-phone-support-panels-audit.json`
  - `390x844` room `2ER56Q`, `375x667` room `IPGEI0`
  - all six panel opens reported `scrollHeight = clientHeight`
  - all six panel opens reported `bodyOverflowY = hidden` and `htmlOverflowY = hidden`
  - all six panel opens reported `rootInert = true`, `modalRootHasDialog = true`, `dialogInsideRoot = false`
  - all six panel opens reported `clippedViewport = []`
  - body scroll attempts stayed at `0`
  - each sheet body owned its own scroll range, including the dense `牌局` panel
  - after `Escape`, every panel returned to `dialogCount = 0`, `rootInert = false`, and `clippedViewport = []`
- Product note:
  - support panels intentionally cover the lower table/dock while open because they are explicit modal bottom sheets; the hard requirement is that the underlying table does not regain scroll or focus while a support panel is active

## 2026-05-02 Phone Action Execution Audit Follow-up

- Status: `[done]` Phone live-hand action execution is verified through raise cancel, confirmed raise, turn transfer, and next-player call on regular and short phone viewports.
- Method:
  - seeded a fresh `2-max` live hand for each viewport
  - opened the actual current-player browser, opened the raise drawer, canceled it, reopened it, and clicked `确认加注`
  - opened the next-player browser after the raise, verified decision state, and clicked `跟注`
  - verified the room advanced from `preflop` to `flop`
- Fresh evidence:
  - `.runlogs/2026-05-02-phone-action-execution-audit.json`
  - `390x844` room `VLN8XJ`, `375x667` room `GCVIH2`
  - both viewports stayed `scrollHeight = clientHeight` through every measured step
  - both viewports reported `clippedViewport = []` through every measured step
  - both viewports reported no dock/table, dock/board, cards/command, raise/table, raise/board, or raise/cards collision
  - `确认加注` changed pot from `30` to `60`, current bet to `40`, and action to the guest
  - guest `跟注` changed pot to `80` and advanced the hand to `flop`
- Product note:
  - after the guest call, the guest correctly remains the postflop actor in this heads-up setup and sees `过牌 / 加注 / 全下` without reintroducing scroll or clipping

## 2026-05-02 Clean-Center Phone Live-Table Follow-up

- Status: `[done]` Phone live-hand center state is now a low-profile felt cue instead of a large state card.
- Root cause:
  - the prior center beacon was geometrically compacted but still sat inside the community-card tray on real phone browsers
  - the independent `座1` turn-seat badge duplicated the cue text and wrapped vertically on narrow phone widths
  - hidden/missing last-action content must be treated differently in browser audits; a missing optional element is not a visible regression
- Local fixes:
  - phone live-hand `.table-stage-beacon` now moves below the board tray, uses a single-line pill, and hides mode/state/turn-seat/last-action chrome
  - short-height phones use a separate beacon offset so `375x667` keeps the cue between the board tray and dock
  - the browser audit now reads `innerText` for rendered copy and only fails last-action when an existing element is visible
- Fresh evidence:
  - focused client contract tests:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/roomViewportLayout.test.js src/utils/tableStageLayout.test.js src/components/roomShellScrollContract.test.js`
    - `66/66` passed on `2026-05-02`
  - full client node suite:
    - `226/226` passed on `2026-05-02`
  - client production build:
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser audit:
    - `.runlogs/2026-05-02-phone-clean-center-audit.json`
    - `390x844` room `BQ9CK9`, `375x667` room `ORP4MM`
    - both viewports stayed `scrollHeight = clientHeight`
    - both viewports reported `clippedViewport = []`
    - both viewports reported no beacon/board, beacon/cards, beacon/action, beacon/dock, dock/table, dock/board, raise/beacon, raise/board, or raise/cards collision
    - final rendered cue text became `PREFLOP 轮到 座1 · 需跟注 10`
- Product note:
  - the duplicated status chrome exposed here was removed in the follow-up phase below

## 2026-05-02 Phone Live Chrome Compression Follow-up

- Status: `[done]` Phone live-hand header and table overlay chrome now stop duplicating room mode/state.
- Root cause:
  - after the clean-center pass, the phone screen still rendered `职业 / 牌局进行中` in both the header and the table overlay layer
  - the duplicated chrome competed with the actual poker information and made the first screen feel status-first instead of table-first
- Local fixes:
  - phone live-hand header keeps only room code and connection state visible
  - phone live-hand hides the table overlay status row
  - phone live-hand header padding, badge padding, font size, and shadow are reduced under a parent `data-room-play-state="live-hand"` scope
- Fresh evidence:
  - focused client contract tests:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/roomViewportLayout.test.js src/utils/tableStageLayout.test.js src/components/roomShellScrollContract.test.js`
    - `67/67` passed on `2026-05-02`
  - full client node suite:
    - `227/227` passed on `2026-05-02`
  - client production build:
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser audit:
    - `.runlogs/2026-05-02-phone-clean-center-audit.json`
    - `390x844` room `6P1AMF`, `375x667` room `A9KX4O`
    - header height is `37.41px` on both measured phone heights
    - header mode/state badges report `display = none`
    - table overlay status row reports `display = none`
    - both viewports stayed `scrollHeight = clientHeight`
    - both viewports reported `clippedViewport = []`
    - both viewports still reported no beacon/board, beacon/cards, beacon/action, beacon/dock, dock/table, dock/board, raise/beacon, raise/board, or raise/cards collision
- Remaining queue:
  - `[done]` rework the phone live-hand pot capsule / board-area hierarchy; screenshots had shown the pot capsule too close to the top seat/top rail even though geometry checks passed
  - `[done]` continue phone live-hand visual polish on the board tray / seat rail density after pot, center cue, and header chrome are stable

## 2026-05-02 Phone Live Pot-Pill Follow-up

- Status: `[done]` Phone live-hand pot display is now a compact table pill clear of top seat, header, board, and cue.
- Root cause:
  - the original phone live pot capsule remained a `~65px` tall desktop-like card
  - real browser metrics showed `potSeat = true`; short-height phones also showed `potHeader = true`
  - geometry checks for board/dock/action could pass while the pot still visually collided with the top opponent plaque
- Local fixes:
  - phone live-hand `.table-stage-pot-capsule` is now an inline pill (`~20px` high, `~53-55px` wide)
  - regular phone positions the pot pill between the top opponent plaque and board tray
  - short-height phone uses a separate top offset so the pot clears the header and top opponent before the board tray
  - phone live-hand hides secondary pot rails in the micro pill; detailed pot data remains in the action dock and support surfaces
- Fresh evidence:
  - focused client contract tests:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/roomViewportLayout.test.js src/utils/tableStageLayout.test.js src/components/roomShellScrollContract.test.js`
    - `68/68` passed on `2026-05-02`
  - full client node suite:
    - `228/228` passed on `2026-05-02`
  - client production build:
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser audit:
    - `.runlogs/2026-05-02-phone-clean-center-audit.json`
    - `390x844` room `ZW8D6O`, `375x667` room `V5AR2L`
    - regular phone pot rect: `top = 138.59`, `bottom = 158.83`, `width = 54.86`, `height = 20.23`
    - short phone pot rect: `top = 93.28`, `bottom = 112.86`, `width = 52.95`, `height = 19.58`
    - both viewports reported `potHeader = false`, `potSeat = false`, `potBoard = false`, and `potBeacon = false`
    - both viewports stayed `scrollHeight = clientHeight` with `clippedViewport = []`
- Product note:
  - the table now has a cleaner hierarchy: header identity, opponent badge, micro pot, board tray, center action cue, hero/dock action surface

## 2026-05-02 Short Phone Top-Seat Plaque Follow-up

- Status: `[done]` Short-height phone live-hand top opponent plaque is compacted and no longer clipped or overlapped by header/pot/table containers.
- Root cause:
  - after the pot pill pass, `375x667` geometry exposed that the top opponent plaque still used regular phone live-hand height
  - moving the plaque down alone would have collided with the micro pot pill, so the fix needed a smaller short-height plaque footprint
  - the first geometric fix passed rectangle collision checks, but screenshot review showed the top plaque could still be visually clipped by the stage container chain
- Local fixes:
  - short-height phone live-hand top opponent uses a micro plaque with seat, blind/position, stack, and bet
  - the opponent nickname is hidden only in that short-height top slot because it is lower priority than stack/bet/position
  - short-height phone live-hand `.room-terminal-main`, `.table-stage-panel`, and `.table-stage-surface` allow visible overflow so the top badge can sit on the table edge without being cropped
  - the browser audit now fails `seatHeader` collisions in addition to pot/header/seat/board/cue checks
- Fresh evidence:
  - focused client contract tests:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js src/utils/roomViewportLayout.test.js src/utils/tableStageLayout.test.js src/components/roomShellScrollContract.test.js`
    - `69/69` passed on `2026-05-02`
  - full client node suite:
    - `229/229` passed on `2026-05-02`
  - client production build:
    - passed on `2026-05-02`; Vite still reports the existing `>500 kB` chunk-size warning
  - browser audit:
    - `.runlogs/2026-05-02-phone-clean-center-audit.json`
    - `390x844` room `XN5V04`, `375x667` room `D0273H`
    - short phone top opponent rect: `top = 51.40`, `bottom = 90.59`, `width = 63.75`, `height = 39.19`
    - short phone header rect: `bottom = 49.41`
    - short phone pot rect: `top = 93.28`, `bottom = 112.86`
    - both viewports reported `seatHeader = false`, `potSeat = false`, `potHeader = false`, `potBoard = false`, and `potBeacon = false`
    - both viewports stayed `scrollHeight = clientHeight` with `clippedViewport = []`
- Product note:
  - short phone live-hand now follows a strict information hierarchy: room identity, top opponent micro badge, pot, board, cue, hero cards, action dock
  - short-screen plaques should remove lower-priority copy before moving critical poker data into another layer

## 2026-05-02 Phone Multiseat Visual Audit Follow-up

- Status: `[done]` Full 6-max and 9-max phone live-hand tables are verified on regular and short phone viewports.
- Plan:
  - `docs/plans/2026-05-02-phone-multiseat-visual-audit.md`
- Completed:
  - `[done]` added a `.runlogs` browser audit for full 6-max and 9-max rooms on `390x844` and `375x667`
  - `[done]` corrected the audit expectation that the hero is represented in the dock, so visible opponent plaque count is `seatedPlayers - 1`
  - `[done]` shrank short-height phone community-card geometry to a `micro` density that stays inside the compressed vertical table
  - `[done]` applied short-height micro opponent plaques to crowded 6-max/9-max edges instead of only the top seat
  - `[done]` forced short-height phone live-hand stage/main overflow visible after screenshots exposed ancestor clipping despite passing collision checks
  - `[done]` hid duplicate non-current chrome guide ghosts on phone live hands so seat plaques own player information
  - `[done]` extended the real-browser audit through `flop`, `turn`, `river`, and `showdown`
  - `[done]` fixed short-height current-turn plaque upward motion so observer/current-turn top seats do not touch the header
  - `[done]` fixed `CommunityCards` animated card frames to inherit micro board dimensions, preventing DOM-visible cards from being visually clipped
- Evidence:
  - `node .runlogs\2026-05-02-phone-multiseat-visual-audit.cjs` (`runId = moojx4ch`)
  - `6max-full 390x844`: room `M52XLY`, `seatPairs = 0`, `seatHeader = 0`, `seatBoard = 0`, `scrollHeight = clientHeight = 844`
  - `6max-full 375x667`: room `I0L7OU`, `seatPairs = 0`, `seatHeader = 0`, `seatBoard = 0`, `stageOverflow = visible`, `mainOverflow = visible`, `scrollHeight = clientHeight = 667`
  - `9max-full 390x844`: room `70L2P9`, `seatPairs = 0`, `seatHeader = 0`, `seatBoard = 0`, `scrollHeight = clientHeight = 844`
  - `9max-full 375x667`: room `P18N3G`, `seatPairs = 0`, `seatHeader = 0`, `seatBoard = 0`, `stageOverflow = visible`, `mainOverflow = visible`, `scrollHeight = clientHeight = 667`
  - `node .runlogs\2026-05-02-phone-multiseat-visual-audit.cjs` (`runId = mookhv3c`)
  - `6max-full 390x844`: room `4T7U10`, streets `3/3`, `4/4`, `5/5`, `5/5`, `clippedBoardCards = 0`
  - `6max-full 375x667`: room `5Y6Q1G`, streets `3/3`, `4/4`, `5/5`, `5/5`, `clippedBoardCards = 0`
  - `9max-full 390x844`: room `G9MGLS`, streets `3/3`, `4/4`, `5/5`, `5/5`, `clippedBoardCards = 0`
  - `9max-full 375x667`: room `QU13X9`, streets `3/3`, `4/4`, `5/5`, `5/5`, `clippedBoardCards = 0`
- Remaining queue:
  - `[done]` review whether current-turn position communication is still strong enough after hiding duplicate chrome guides
  - `[done]` continue short-phone action dock and raise-drawer polish now that board/seat geometry is stable

## 2026-05-02 Phone Live Decision-Cockpit Follow-up

- Status: `[done]` Phone live-hand decision controls now use the available dock width instead of shrinking to the hero-card row.
- Root cause:
  - the phone live-hand decision cockpit was centered as shrink-to-content, so its `width: 100%` action frame inherited the hand-card row width
  - real-browser metrics showed short phone command buttons were only about `52-56px` wide; this passed 44px touch minimums but was not acceptable for a real money-style decision surface
- Local fixes:
  - phone live-hand `.tactical-dock__center` now stretches its decision cockpit
  - phone live-hand `.tactical-dock__decision-cockpit` is bounded to `min(100%, 21.5rem)` and centered, giving actions the full bottom-rail width without affecting desktop or waiting-room layouts
  - added a contract test so future mobile dock changes cannot accidentally return to shrink-wrapped action buttons
- Fresh evidence:
  - red/green contract:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js`
    - new test failed before the CSS fix and passed after it; final focused run `33/33` passed on `2026-05-02`
  - browser audit:
    - `node .runlogs\2026-05-02-phone-action-execution-audit.cjs` (`runId = mookwxxk`)
    - `390x844` room `BWO20K`, min command button width `128.89px`
    - `375x667` room `OFW1BV`, min command button width `130.59px`
    - both viewports stayed `scrollHeight = clientHeight`
    - both viewports reported no dock/table, dock/board, cards/command-row, raise/table, or raise/board collision
- Remaining queue:
  - `[done]` decide whether the phone live-hand center cue should be reduced further into a thinner chip-level HUD after action controls are now readable
  - `[done]` continue raise-drawer hierarchy review for larger blind structures and deeper stacks

## 2026-05-02 Phone Live Center-Cue Copy Follow-up

- Status: `[done]` Phone live-hand center cue now uses compact decision wording instead of a sentence-like prompt.
- Root cause:
  - the previous center cue `轮到 座1 · 需跟注 10` was safe geometrically but still read like explanatory UI copy
  - the action dock already carries the full numeric decision context, so the table-center HUD should only identify street, acting seat, and immediate action
- Local fixes:
  - stage action copy now formats call spots as `座N · 跟注 X`
  - no-call spots now format as `座N · 可过牌` instead of `需跟注 0`
  - added view-model coverage for both call and check spots
- Fresh evidence:
  - focused tests:
    - `cd client && node --test src/view-models/gameViewModel.test.js src/components/roomTerminalShellContract.test.js`
    - `74/74` passed on `2026-05-02`
  - browser audit:
    - `node .runlogs\2026-05-02-phone-clean-center-audit.cjs` (`runId = mool5q9j`)
    - `390x844` room `TZ7CZV`, beacon text `PREFLOP 座1 · 跟注 10`, width `133.42px`, height `18.94px`
    - `375x667` room `YTASTQ`, beacon text `PREFLOP 座1 · 跟注 10`, width `131.52px`, height `17.66px`
    - both viewports stayed `scrollHeight = clientHeight`
    - both viewports reported no beacon/board, beacon/cards, beacon/action-frame, beacon/dock, raise/beacon, raise/board, or raise/cards collision
- Remaining queue:
  - `[done]` continue raise-drawer hierarchy review for larger blind structures and deeper stacks

## 2026-05-02 Phone Raise Drawer Sizing Follow-up

- Status: `[done]` Phone quick-raise buttons now dedupe after big-blind alignment and use an adaptive drawer grid.
- Root cause:
  - the quick-raise candidates were deduped only by label intent, not by their final aligned amount
  - on a small pot such as `30` with `BB = 20`, `1/3池`, `1/2池`, and `1.2x池` can all align to the same legal chip amount, creating crowded duplicate buttons
- Local fixes:
  - added `buildQuickRaiseSizes` so candidate amounts are rounded to the big blind, clamped to min/max raise, and then deduped by final amount
  - phone raise drawer quick grid now uses `repeat(auto-fit, minmax(4.6rem, 1fr))`, so 2/3/4 valid buttons fill the drawer without thin empty columns
  - added focused unit coverage for small-pot dedupe, normal ladder sizing, and max-raise filtering
- Fresh evidence:
  - focused tests:
    - `cd client && node --test src/utils/betSizing.test.js src/components/roomTerminalShellContract.test.js`
    - `36/36` passed on `2026-05-02`
  - browser audit:
    - `node .runlogs\2026-05-02-phone-action-execution-audit.cjs` (`runId = moole7j8`)
    - `390x844` room `P2GKYW`, quick buttons `1/3池 20 1BB` / `1x池 40 2BB`, min quick width `155.97px`
    - `375x667` room `KFWVXL`, quick buttons `1/3池 20 1BB` / `1x池 40 2BB`, min quick width `151.47px`
    - both viewports stayed `scrollHeight = clientHeight`
    - both viewports reported no raise/table, raise/board, or raise/cards collision
  - final verification:
    - client full node tests: `240/240`
    - client build: passed; Vite still reports the existing `>500 kB` chunk-size warning
- Remaining queue:
  - `[done]` continue broader gameplay edge validation after the phone table/action UI is stable

## 2026-05-02 Phone Side-Pot Settlement Follow-up

- Status: `[done]` Phone settlement now preserves side-pot result visibility during reveal-action windows on regular and short phone viewports.
- Root cause:
  - reveal-enabled phone settlement only inlined `latestSummary.headlineLine`, which is the first scoreboard line
  - the remaining scoreboard lines were hidden by the compact phone settlement rule, so multiway all-in side pots disappeared from the visible single-screen result
  - the added side-pot line also needed a separate short-height position, otherwise `375x667` phones pushed the settlement rail into the bottom dock
- Local fixes:
  - reveal-enabled settlement now inlines the first two scoreboard lines, exposing both main pot and first side pot in compact phone mode
  - reveal buttons and inline result typography were compressed so the settlement rail still fits between table and dock
  - short-height phone settlement uses its own `18.8rem` top position while regular phone stays on the table/dock gap
  - added contract coverage for inline side-pot scoreboard lines and short-height settlement positioning
- Fresh evidence:
  - red/green contract:
    - `cd client && node --test src/components/roomTerminalShellContract.test.js`
    - new contract failed before the CSS/component fix and passed after it; final focused run `33/33` passed on `2026-05-02`
  - browser audit:
    - `node .runlogs\2026-05-02-phone-side-pot-allin-audit.cjs` (`runId = moom32yj`)
    - fresh room `NDZU8Y`, 3-way all-in, server total chips `7000`, total pot `5000`, pot results `main 3000` and `side 2000`
    - `390x844`: visible `主池 +3,000` and `边池 1 +2,000`, `scrollHeight = clientHeight = 844`, no settlement/table, settlement/board, or settlement/dock collision
    - `375x667`: visible `主池 +3,000` and `边池 1 +2,000`, `scrollHeight = clientHeight = 667`, no settlement/table, settlement/board, or settlement/dock collision
  - final verification:
    - client full node tests: `240/240`
    - client build: passed; Vite still reports the existing `>500 kB` chunk-size warning
    - server Jest suite: `12/12` suites and `120/120` tests passed
- Remaining queue:
  - `[done]` continue gameplay edge validation for reveal policy variants and hand-history/support-panel access after settlement

## 2026-05-03 Phone Settlement Policy And Post-Settlement Panels Follow-up

- Status: `[done]` Fold-to-settlement reveal policy behavior and post-settlement support panels are verified on regular and short phone viewports.
- Root cause:
  - the hand-history support panel still exposed hard-coded English `Hand History / Recent Tape` copy inside an otherwise localized phone settlement review flow
  - short-height no-reveal phone settlement used bottom anchoring, so the compressed stage container could push the settlement rail back into the vertical table capsule
  - the first audit draft incorrectly expected debug-room player objects to expose `inHand/folded`; the durable participant check must use the latest hand record plus the fold action
- Local fixes:
  - localized the embedded hand-history drawer header to `牌局记录 / 最近手牌`
  - changed phone settlement positioning so reveal and no-reveal outcomes share the same table/dock gap anchor, with a short-height override on the base `.settlement-sheet`
  - added contract coverage for localized hand-history copy and phone settlement anchoring for reveal and no-reveal outcomes
- Fresh evidence:
  - red/green contract:
    - `cd client && pnpm exec node --test src/components/gameRoomStageContract.test.js`
    - new contracts failed before the copy/CSS fixes and passed after them; final focused run `17/17` passed on `2026-05-03`
  - browser audit:
    - `node .runlogs\2026-05-03-phone-settlement-policy-panels-audit.cjs` (`runId = moomvwb3`)
    - `showdown_only` room `48I66B`: folded host saw `0` reveal buttons on `390x844` and `375x667`
    - `free_reveal_after_hand` room `Q7DLW6`: folded host saw `4` reveal buttons on `390x844` and `375x667`
    - all four viewport/scenario audits stayed `scrollHeight = clientHeight`
    - all four audits reported no settlement/table, settlement/board, settlement/dock, or actions/dock collision
    - `成员 / 牌局 / 房间` panels opened after settlement with modal isolation, owned sheet scrolling, and no English hand-history copy
  - final verification:
    - client full node tests: `242/242`
    - client build: passed; Vite still reports the existing `>500 kB` chunk-size warning
    - server Jest suite: `12/12` suites and `120/120` tests passed
- Remaining queue:
  - `[done]` continue professional-player gameplay validation around multi-street betting, min-raise/all-in edge cases, and post-hand replay accuracy

## Product Mode Model

### Shared Room Mode

This is a room-level preset chosen when creating a table. It affects shared semantics and defaults seen by everyone in that room.

- `club`
  - optimize for low confusion and dispute avoidance
  - simplified status language
  - readable settlement pacing
  - conservative reveal defaults
- `pro`
  - optimize for action speed and information density
  - fast table flow
  - stronger shortcut / quick-action emphasis
  - clearer blind / position / to-call / pot context
- `study`
  - optimize for explanation and replay value
  - richer hand-history summaries
  - more explicit state transitions
  - review-friendly settlement and reveal context

### Local Display Mode

This is a client preference. It should not change server truth or give one player secret rule advantages. It only changes how much information and annotation the current client sees.

- `club`
  - lower density
  - fewer secondary stats
  - stronger banners and operator guidance
- `pro`
  - compact information layout
  - quicker access to action controls
  - more visible numerical context
- `study`
  - richer hand-history and state explanations
  - more explicit pot and reveal breakdowns
  - easier review of what just happened
- `custom`
  - unlocked local overrides after the three presets exist

### Hard Invariants

- Server-authoritative gameplay does not change based on local display mode.
- No mode may hide critical rules or create ambiguous seat / chip / pot semantics.
- If a room preset changes defaults, the final submitted room settings must still be explicit and inspectable.
- Mode presets are only a starting layer; advanced settings must remain debuggable and testable.

## Priority Order

1. Functional completeness
2. Edge conditions and exception handling
3. Professional-player workflow and information design
4. Club / study mode differentiation
5. UI / UX polish

## Active Queue

### Task M1: Migrate The Client To Tailwind 4.2.2 Before Further UI Work

- Status: `[done]`
- Why this moved ahead of more Tactical Arena work:
  - the project no longer uses Tailwind as a tiny utility layer; it now depends on a large semantic shell and table CSS surface
  - continuing visual work on Tailwind 3 would have forced a second disruptive styling migration later
- Scope:
  - upgrade `tailwindcss` to `4.2.2`
  - move from the Tailwind 3 PostCSS plugin to `@tailwindcss/postcss`
  - switch the CSS entrypoint to Tailwind 4 syntax
  - keep `Vite 4` stable for now
  - rerun browser evidence on the Tactical Arena shell after migration
- Fresh evidence:
  - `cd client && npm ls tailwindcss @tailwindcss/postcss vite`
    - `tailwindcss@4.2.2`
    - `@tailwindcss/postcss@4.2.2`
    - `vite@4.5.14`
  - `cd client && node --test src/utils/productMode.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js`
    - `50/50` passed on `2026-03-19`
  - `cd client && npm run build`
    - passed on `2026-03-19`
  - fresh browser screenshots captured after the migration:
    - `tailwind4-home-1280.png`
    - `tailwind4-room-1280.png`
    - `tailwind4-room-phone.png`
  - important implementation note:
    - `@tailwindcss/vite@4.2.2` was not used in this pass because it requires `vite ^5.2.0 || ^6 || ^7 || ^8`, while the current repo is still on `vite 4.5.14`

### Task 0: Remove Post-Merge Documentation Drift

- Status: `[done]`
- Why this matters:
  - the repo is now on `main`, but some docs still point at the deleted feature worktree
  - stale paths waste time and can break regression startup on the very first command
- Scope:
  - fix runbook paths and wording
  - fix README references to the old worktree flow
  - record this specific pitfall in the regression log
- Exit criteria:
  - no active operator doc points at `.worktrees/presentation-state-refactor`
- Fresh evidence:
  - `README.md` now points current regression work at root-level scripts and current ports
  - `docs/runbooks/real-browser-regression-runbook.md` now uses `D:\GITHUB\Texas-hold'em` instead of the deleted feature worktree
  - `docs/plans/2026-03-19-poker-product-readiness-todolist.md` is explicitly marked archived
  - regression log now records the “post-merge stale worktree path” pitfall

### Task 1: Build A Fresh Product-Gap Inventory On `main`

- Status: `[done]`
- Why this is first:
  - the old readiness todo is closed; we need a new list of real product gaps, not merge blockers that no longer exist
- Scope:
  - rerun automated baseline on `main`
  - audit current gameplay for missing functional guarantees
  - separate:
    - confirmed bugs
    - ambiguous product behavior
    - nice-to-have UX polish
- Expected outputs:
  - updated sections in this file
  - new evidence in `真实浏览器联机回归踩坑记录.md`
- Fresh evidence:
  - automated baseline rerun stayed green on `main`:
    - `cd server && npm test -- --runInBand`
    - `cd client && node --test src/utils/serverOrigin.test.js src/utils/socketRequest.test.js vite.proxyTarget.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js`
    - `cd client && npm run build`
  - first confirmed gaps after the audit:
    - room creation was fire-and-forget and closed the modal before server confirmation
    - room mode / display mode scaffolding does not exist yet
    - `joinRoom` and `requestRebuy` still depend on the generic socket `error` channel
    - client/server still carry a large amount of debug logging that is no longer operator-grade

### Task 2: Make Room Creation Awaitable And Failure-Safe

- Status: `[done]`
- Why this jumped ahead:
  - room creation is the very first product action; closing the modal before success is a hard exception-handling flaw, not a cosmetic issue
- Scope:
  - create a reusable socket request helper with explicit success / error / timeout cleanup
  - make `createRoom` awaitable
  - keep the create-room modal open on failure
  - reset `isCreatingRoom` on failure instead of leaving the client in a half-creating state
- Expected files:
  - `client/src/utils/socketRequest.js`
  - `client/src/utils/socketRequest.test.js`
  - `client/src/contexts/GameContext.jsx`
  - `client/src/components/CreateRoomModal.jsx`
  - `server/server.js`
- Fresh evidence:
  - new targeted test:
    - `cd client && node --test src/utils/socketRequest.test.js`
    - `3/3` passed on `2026-03-19`
  - full client targeted suite:
    - `26/26` passed on `2026-03-19`
  - full server suite:
    - `102/102` passed on `2026-03-19`
  - build:
    - passed on `2026-03-19`

### Task 3: Normalize Critical Socket Error Semantics For Join / Rebuy / Seat Flows

- Status: `[done]`
- Why this is now ahead of mode work:
  - the create-room path proved that generic socket `error` events are too loose for product-grade flows
  - the same structural issue still exists in `joinRoom` and `requestRebuy`, and likely spills into seat operations
- Scope:
  - move remaining critical request/response flows away from generic shared `error` handling where practical
  - avoid unrelated errors incorrectly rejecting the wrong in-flight promise
  - make failure copy explicit enough that the caller can decide whether to keep a modal open, retry, or downgrade to toast-only
- Expected files:
  - `server/server.js`
  - `client/src/contexts/GameContext.jsx`
  - affected modal/action components
  - targeted client tests
- Progress so far:
  - `[done]` `joinRoom` now listens to `joinRoomError` instead of the generic shared `error` event
  - `[done]` `requestRebuy` now listens to `requestRebuyError` instead of the generic shared `error` event
  - `[done]` `changeSeat / takeSeat / leaveSeat` now use dedicated success and error events
- Fresh evidence:
  - seat-action return-value coverage landed in `server/tests/gameLogic/SeatState.test.js`
  - post-success feedback coverage landed in `client/src/view-models/gameViewModel.test.js`
  - full baseline after finishing this task:
    - `server`: `107/107` on `2026-03-19`
    - `client`: `33/33` on `2026-03-19`
    - `build`: passed on `2026-03-19`

### Task 4: Introduce Product Mode Vocabulary And Config Scaffolding

- Status: `[done]`
- Why this is still early:
  - the user requirement is to support `club / pro / study` through configuration, not through ad hoc future patches
- Scope:
  - define shared room mode in room settings
  - define local display mode in client preferences
  - choose default behavior:
    - shared room default: `pro`
    - local display default: inherit room mode until the player overrides
  - expose mode intent in create-room flow without overwhelming the existing settings UI
- Expected files:
  - `server/gameLogic/RoomManager.js`
  - `server/tests/gameLogic/RoomState.test.js`
  - `client/src/components/CreateRoomModal.jsx`
  - `client/src/contexts/GameContext.jsx`
  - new or updated view-model tests
- Fresh evidence:
  - new room-mode server coverage landed in `RoomState.test.js`
    - default `roomMode = pro`
    - explicit `roomMode` is preserved
    - invalid `roomMode` is rejected
  - new client mode utility coverage landed in `client/src/utils/productMode.test.js`
    - `3/3` passed on `2026-03-19`
  - create-room flow now exposes `club / pro / study`
  - client now persists a local display-mode preference and resolves it against room mode
  - full baseline after this scaffolding stayed green:
    - `server`: `105/105`
    - `client`: `29/29`
    - `build`: passed

### Task 5: Harden Functional Edge Flows Before Cosmetic Work

- Status: `[done]`
- Scope focus:
  - join / leave / seat-switch timing edges
  - spectator -> seat -> next-hand transitions
  - `0 chips -> rebuy -> reseat` without misleading UI
  - reconnect and recovery banners during non-happy-path timing
  - invalid or stale action attempts after state changes
- Exit criteria:
  - all known flow edges have either deterministic tests, browser evidence, or explicit non-goal notes
- Progress so far:
  - `[done]` `leaveRoom` no longer navigates away optimistically; the UI now waits for `leaveRoomSuccess / leaveRoomError`
  - `[done]` `leaveRoom` now returns authoritative metadata about `forcedFold` and `roomClosed`
  - `[done]` `startGame` now returns authoritative `handStarted / roomState` metadata instead of assuming every accepted click really produced a live hand
  - `[done]` `recoverRoom` now returns authoritative completion metadata instead of relying on broadcast timing alone
  - `[done]` `playerAction` now returns authoritative action metadata and no longer forces `ActionButtons` to wait for a 5-second timeout on denied clicks
  - `[done]` `revealHand` now returns authoritative reveal metadata and the showdown reveal buttons no longer depend on the shared socket `error` channel
  - `[done]` the server now ejects a device from earlier rooms before it creates or joins a newer room, so room lookups stay bound to the active table instead of a stale earlier membership
- Fresh evidence:
  - targeted red-green coverage landed in:
    - `server/tests/gameLogic/SeatState.test.js`
    - `server/tests/gameLogic/RoomState.test.js`
    - `client/src/view-models/gameViewModel.test.js`
    - `client/src/utils/socketRequest.test.js`
    - `server/tests/gameLogic/GameplaySmoke.test.js`
    - `server/tests/gameLogic/SettlementFlow.test.js`
  - fresh baseline after this batch:
    - `server`: `110/110` on `2026-03-19`
    - `client`: `37/37` on `2026-03-19`
    - `build`: passed on `2026-03-19`
  - fresh browser rerun on `2026-03-19` for the same-device room-switch path:
    - create room `C9ZUGP`
    - navigate home without explicitly leaving
    - create room `C20LNR`
    - open a fresh isolated guest in `C20LNR`
    - start the game and fold as host
    - result:
      - no `操作失败：游戏未开始` toast
      - `GET /api/debug/rooms/C9ZUGP` returned `404`
      - `GET /api/debug/rooms/C20LNR` showed the accepted fold and `handHistory[0]` under the new room
  - fresh stale-action browser evidence on `2026-03-19`:
    - page A created room `K5CQ52`
    - page B opened the home route with the same device identity and re-registered the device
    - back on stale page A, clicking `退出房间` immediately produced the new warning toast:
      - `当前页面身份已失效，请刷新页面后重试。`
    - `GET /api/debug/rooms/K5CQ52` still showed a healthy room with the latest active socket on the newer page
- Explicit non-goal note:
  - several invalid actions such as non-eligible reveal choices are intentionally suppressed in the UI, so browser verification for those paths is “button not offered”; their denial semantics remain covered by server and view-model tests

### Task 6: Tighten Exception Surfaces And Operator Feedback

- Status: `[done]`
- Why this matters:
  - serious players tolerate rule complexity, but not silent failure or ambiguous table state
- Scope:
  - audit server-thrown errors surfaced to the client
  - unify confusing or missing toasts / banners
  - make auto actions, reconnect outcomes, and denied operations explicit
  - ensure bad payload / transient states degrade without white-screening
- Progress so far:
  - `[done]` `emitWithResponse` now preserves structured error metadata, including error `code`
  - `[done]` `startGame` now uses `startGameSuccess / startGameError` and suppresses duplicate “需要恢复” toasts when `roomRecoveryRequired` already handled the state change
  - `[done]` `recoverRoom` now uses `recoverRoomSuccess / recoverRoomError` and emits explicit success feedback after recovery completes
  - `[done]` `playerAction` now uses `playerActionSuccess / playerActionError`, so denied or stale clicks unlock the action UI immediately instead of waiting for the fallback timeout
  - `[done]` `revealHand` now uses `revealHandSuccess / revealHandError`, so showdown choice failures no longer share the loose global `error` channel
  - `[done]` new client error-feedback mapping now turns structured denied-operation codes into stable user-facing copy in `deriveRequestErrorFeedback`
  - `[done]` action components (`ActionButtons`, `GameRoom`, `Player`, `EmptySeat`, `JoinRoomModal`, `RebuyModal`, `CreateRoomModal`) now consume that shared mapping instead of each rendering raw `error.message`
- Fresh evidence:
  - new view-model coverage landed for:
    - `PLAYER_OUT_OF_TURN`
    - `ROOM_RECOVERY_REQUIRED`
    - stale `设备未注册` page-identity failures
  - post-feedback rerun stayed green:
    - `client`: `57/57` on `2026-03-19`
    - `build`: passed on `2026-03-19`
  - fresh browser evidence on stale room page `K5CQ52` confirmed the user now sees:
    - `当前页面身份已失效，请刷新页面后重试。`
    - instead of a raw backend string
- Ongoing operator reminder:
  - if room-switch regressions ever reappear, distinguish server truth from client residue first by checking `GET /api/debug/rooms/:roomId`; earlier runs showed the client could briefly render stale old-room occupants and hand history even when the new room on the server was already clean

### Task 7: Build The `pro` Mode First

- Status: `[done]`
- Why this is the anchor mode:
  - existing product direction already uses professional real-play semantics as the backbone
- Scope candidates:
  - clearer position and blind context
  - stronger to-call / pot / sizing cues
  - quicker access to action controls
  - compact but readable seat and chip presentation
  - denser hand-history entry summaries
- Constraint:
  - do not invent solver/training features before the core live-play experience is sharp
- Design + execution docs:
  - `docs/plans/2026-03-19-pro-mode-design.md`
  - `docs/plans/2026-03-19-pro-mode-implementation-plan.md`
- First delivery order:
  - action decision density
  - player/seat/table awareness
  - hand-history and settlement readability
- Fresh evidence:
  - new client view-model coverage landed for:
    - `deriveProActionSummary`
    - `buildProActionStatRows`
    - `deriveProPlayerSummary`
    - object-based board / reveal formatting in `handHistoryViewModel`
  - automated rerun after the `pro` batch:
    - `server`: `112/112` on `2026-03-19`
    - `client`: `41/41` on `2026-03-19`
    - `build`: passed on `2026-03-19`
  - fresh browser evidence on room `2O2MST`:
    - pre-hand `Leaderboard` already showed `座位 · 状态 · 净额`
    - after `startGame`, the acting host saw a `pro` decision strip with:
      - `TO CALL`
      - `MIN RAISE`
      - `POT`
      - `EFF`
    - mid-hand third-player join showed both:
      - the pending-join banner
      - compact panel text `座3 · 下一手加入`
    - after a two-player `all-in / call`, the drawer rendered a readable board line:
      - `Board 2♠ 5♠ 3♠ 5♦ 8♠`
- Newly discovered pitfall:
  - hand-history `communityCards` and reveal `cards` arrive as card objects, not preformatted strings; direct string joining renders `[object Object]`, so `pro` board / reveal summaries must format `{ rank, suit }` explicitly

### Task 8: Add `club` And `study` Differentiation Without Forking The App

- Status: `[done]`
- Scope:
  - `club`: lower cognitive load, clearer banners, safer defaults
  - `study`: richer explanations, better review context, stronger history readability
  - keep one common view-model surface and only vary presentation/config density
- Fresh evidence:
  - approved redesign docs landed and were committed:
    - `docs/plans/2026-03-19-poker-os-redesign-design.md`
    - `docs/plans/2026-03-19-poker-os-redesign-implementation-plan.md`
  - shared `ModeShell` theme tokens now exist in `client/src/utils/productMode.js`
  - the new `Mode Gateway` now renders visible `club / pro / study` preview cards instead of only a flat preference toggle
  - room creation now presents room mode as a table preset card instead of a raw setting row
  - fresh browser evidence on `2026-03-19`:
    - desktop gateway shows three clearly different mode cards with distinct copy and accents
    - mobile gateway still renders the three cards as separate readable blocks
  - fresh desktop `club` room `Y2TFWJ` rendered a visibly different operator-first shell:
    - `桌况总览`
    - `Table Console`
    - `最近动态`
    - `本席控制`
  - fresh desktop + mobile `study` room `WM360K` rendered a visibly different review-first shell:
    - `State Notes`
    - `Review Stage`
    - `Review Rail`
    - `Hero Review`
  - cross-mode room-shell differentiation is no longer only a theme-card/gateway effect; the room-page headings, captions, stat ordering, and history density now differ per mode
- Newly discovered pitfall:
  - when a user creates a new room from inside an older room session, the first payload for the new room must not be filtered as an “unrelated room” broadcast; this regression appeared during the `club` verification and is now guarded by `client/src/utils/roomTransition.js`

### Task 9: UI / UX Polish Pass

- Status: `[done]`
- Gating rule:
  - this only starts after Tasks 1-6 are stable enough that we are not repainting over moving logic
- Scope:
  - refine visual hierarchy
  - remove remaining confusing copy
  - improve mobile and desktop density choices by mode
  - revisit optional delight items such as card-flip sound only after functional polish
- Fresh evidence:
  - the client now has a new `Poker OS` shell on both routes:
    - `ModeGateway`
    - `TableHeader`
    - `TableStage`
    - `SeatRing`
    - `IntelRail`
    - `EventRail`
    - `ActionDock`
  - shell view models now exist for:
    - room header state
    - seat ring state
    - intel rail occupancy summaries
    - event rail summaries
  - automated rerun after the shell migration stayed green:
    - `server`: `112/112` on `2026-03-19`
    - `client`: `49/49` on `2026-03-19`
    - `build`: passed on `2026-03-19`
  - fresh browser evidence on `2026-03-19`:
    - desktop room `0D470R` rendered the new header, stage, rails, and hero dock without compile/runtime regressions
    - mobile gateway rendered without card overlap or unreadable action panels
    - mobile room `0D470R` rendered the new shell after seat-radius tuning and long-name truncation fixes
    - mobile `study` room `WM360K` rerendered cleanly after the cross-mode pass; the new shell stayed readable in a `390x844` viewport without side-seat overflow or history-rail tearing
  - new client transition coverage landed in `client/src/utils/roomTransition.test.js`
  - post-fix automated rerun stayed green:
    - `server`: `112/112` on `2026-03-19`
    - `client`: `53/53` on `2026-03-19`
    - `build`: passed on `2026-03-19`
  - tactical dock / rail redesign batch landed in `8b76fc2` and reran cleanly:
    - `server`: `112/112` on `2026-03-19`
    - `client`: `61/61` on `2026-03-19`
    - `build`: passed on `2026-03-19`
  - fresh browser evidence after the dock / rail redesign:
    - desktop `pro` room `M3SN1S` now renders:
      - `INTEL RAIL / Tactical Intel`
      - `EVENT RAIL / Event Console`
      - `HERO SEAT`
      - the denser tactical dock stat strip without runtime regressions
    - desktop `club` room `AO6TQR` now renders:
      - `桌况总览 / 桌面控制台`
      - `最近动态`
      - `本席控制`
    - desktop `study` room `20KEUB` now renders:
      - `STATE NOTES / 桌况分析台`
      - `REVIEW STAGE`
      - `REVIEW RAIL`
      - `HERO REVIEW`
    - mobile portrait `study` room `20KEUB` rerendered cleanly in `390x844`:
      - seat ring stayed inside the stage
      - rails stacked vertically without overlap
      - hero dock stayed readable below the rails
      - long host nickname truncated inside the stack ledger instead of tearing the card
  - responsive geometry rerun after the Tailwind 4 migration and layout-helper pass:
    - desktop room `KANQ0R` at `1280x900` stayed in `split-stage`
    - desktop script verification showed:
      - `overlappingTableSeats = 0`
      - `overlappingCardBandSeats = 0`
    - phone portrait room `KANQ0R` at `390x844` rerendered cleanly after:
      - updating the mobile seat-ring profile to use the real rendered seat-card height budget
      - shrinking the community-card band into the phone table safe width
    - phone script verification showed:
      - `overlappingTableSeats = 0`
      - `overlappingCardBandSeats = 0`
  - motion-system foundation rerun after the responsive geometry fix:
    - `productMode` now exposes mode-specific motion tokens for `club / pro / study`
    - `ModeShell` now maps those tokens into CSS variables consumed by:
      - shell ambience
      - gateway stage
      - preview cards
      - table pot capsule and beacon
      - tactical dock
      - settlement sheet
    - fresh automated verification on `2026-03-19`:
      - `client`: `55/55`
      - `build`: passed
    - fresh browser spot checks on `2026-03-19`:
      - desktop gateway showed active motion vars and `arenaStageFloat / arenaAmbientDrift`
      - desktop room `QSPNVK` showed active `arenaStageFloat / arenaSpotlightPulse` on the stage surfaces without reintroducing overlap
      - phone portrait room `QSPNVK` preserved `tableOverlaps = 0` and `cardBandOverlaps = 0` while the stage motion remained active
  - current-turn stage emphasis rerun after the split-stage geometry fix:
    - new view-model coverage landed for:
      - `phaseLabel`
      - `currentTurnSeatLabel`
      - `stageActionLabel`
      - `lastActionLabel`
    - fresh automated rerun on `2026-03-19`:
      - `client`: `57/57`
      - `build`: passed
    - fresh browser evidence on room `ID7LH3`:
      - desktop `1280x900` initially exposed a real overlap regression where the live-turn plaque height budget was too small and the bottom seat clipped into the felt
      - after raising the desktop seat-ring helper to the real rendered live-turn plaque footprint, browser rect checks returned:
        - `overlaps = 0`
        - `cardBandOverlaps = 0`
      - the stage beacon now renders live cues in-hand:
        - `轮到 座2 · TO CALL 10`
        - `上一动作 座2 跟注 10`
      - phone portrait rerun at `390x844` stayed green with:
        - `overlaps = 0`
        - `cardBandOverlaps = 0`
  - winner-first settlement hierarchy rerun after renaming the product shell to `Tactical Hold'em`:
    - `client/index.html` now exposes the product title `Tactical Hold'em`
    - hand-history summaries now split into:
      - `headlineLine`
      - `totalLine`
      - `scoreboardLines`
      - `detailLines`
    - `EventRail` and `SettlementOverlay` now render winner-first ordering instead of treating the total-pot line as the first result row
    - fresh automated rerun on `2026-03-19`:
      - `client`: `58/58`
      - `build`: passed
    - fresh browser evidence on room `A8BQG5` with `settleMs = 15000`:
      - desktop settlement overlay showed:
        - `LATEST HAND`
        - `第 3 手`
        - `主池 +30: device_mmx9ri4m_6bw0ze_lbfwmz +30`
        - `总池 +30`
        - chip-delta lines below the winner line
      - desktop screenshot evidence saved to:
        - `.runlogs/winner-first-settlement-desktop.png`
        - `.runlogs/winner-first-settlement-desktop-refresh.png`
      - phone portrait rerun preserved the winner-first order in the live event rail:
        - `主池 +30: ...`
        - `总池 +30`
        - chip-delta lines
      - phone screenshot evidence saved to:
        - `.runlogs/winner-first-event-rail-phone.png`
      - the same browser batch also confirmed the shell title:
        - `document.title === Tactical Hold'em`
        - screenshot `.runlogs/tactical-holdem-home-title.png`
  - Motion library integration rerun for stage / dock / settlement choreography:
    - client dependency now includes `motion`
    - new helper coverage landed in:
      - `client/src/utils/tacticalMotion.test.js`
      - `client/src/utils/tacticalMotion.js`
    - `ModeShell` now mounts a global `MotionConfig` with `reducedMotion=\"user\"`
    - `TableStage`, `ActionDock`, and `SettlementOverlay` now use `motion/react` for:
      - stage pot-capsule entrances
      - stage cue / last-action transitions
      - hero-dock turn-context emphasis
      - settlement-sheet entrance and line stagger
    - fresh automated rerun on `2026-03-19`:
      - `client`: `60/60`
      - `build`: passed
    - fresh browser evidence on room `4SJK71` with `settleMs = 15000`:
      - live desktop hand showed Motion-managed inline transforms on:
        - `.table-stage-pot-capsule`
        - `.table-stage-beacon`
        - `.tactical-dock__chip` for `您的回合`
      - settlement rerun showed Motion-managed inline styles on:
        - `.settlement-sheet`
        - `.settlement-sheet__countdown`
      - fresh screenshots:
        - `.runlogs/motion-settlement-desktop.png`
        - `.runlogs/motion-phone-live.png`
  - rail Motion and SVG-backed stage rerun:
    - `EventRail` and `Hand Tape` now use `motion/react` entrance timing instead of only static CSS cards
    - `TableStage` now mounts an SVG-backed chrome layer driven by `buildStageChromeLayout`
    - the stage chrome now renders:
      - seat guides
      - blind / button marker labels when available
      - board-tray framing lines
    - fresh automated rerun on `2026-03-19`:
      - `client`: `25/25` on the focused helper/model suite
      - `build`: passed
    - fresh browser evidence on room `01ELEM` with `settleMs = 15000`:
      - desktop live room showed:
        - `.table-stage-chrome` present
        - `6` seat guides
        - marker labels `SB/BTN` and `BB`
      - desktop settlement rerun showed:
        - `EventRail` latest card and `Hand Tape` cards rendered with Motion-managed inline styles
        - `SettlementOverlay` remained intact over the new SVG stage chrome
      - fresh screenshots:
        - `.runlogs/svg-stage-settlement-desktop.png`
        - `.runlogs/svg-stage-tablet-emulated.png`
        - `.runlogs/svg-stage-ultrawide.png`
    - fresh wider-shell checks on `2026-03-19`:
      - emulated `1024x1366` stayed on the stacked shell with the SVG stage still rendering `6` seat guides
      - emulated `1720x1000` switched to `room-shell-grid--three-column` and preserved the stage chrome in the wider shell
  - single-screen terminal motion-cost and mobile-scroll rerun:
    - `tacticalMotion` now carries an explicit phone-terminal contract:
      - `allowBackdropBlurStacks = false`
      - `pageFloat = disabled`
      - `primaryTransitions = transform-opacity-only`
    - `ModeShell` now maps that contract into shell-level CSS vars instead of reusing the raw theme timings:
      - phone portrait now resolves `--arena-motion-enter = 120ms`
      - phone portrait now resolves `--arena-motion-emphasis = 160ms`
      - desktop keeps the full-shell values (`180ms / 260ms`)
    - room-route phone portrait now locks the shell to a true single-screen viewport instead of leaving residual page scroll under the support sheet
    - phone support surfaces now scroll inside the sheet body instead of fighting the page container or nested rail scroll areas
    - phone room shell also disables the heaviest stage pulses:
      - `.table-stage-pot-capsule`
      - `.table-stage-beacon`
      - `.table-stage-atmosphere`
    - fresh automated rerun on `2026-03-20`:
      - `cd client && node --test src/utils/tacticalMotion.test.js src/utils/roomViewportLayout.test.js src/utils/seatRingLayout.test.js src/utils/tableStageLayout.test.js src/view-models/gameViewModel.test.js src/view-models/handHistoryViewModel.test.js`
      - `client`: `104/104` on the focused room-shell + geometry + motion + view-model scope
      - `server`: `113/113`
      - `build`: passed
    - fresh browser evidence on room `O1E18K` while reusing the live local `5173` frontend and the current local game server:
      - create-room desktop:
        - `.runlogs/task7-create-room-desktop.png`
      - create-room phone portrait:
        - `.runlogs/task7-create-room-phone.png`
      - room desktop `1280x900`:
        - `.runlogs/task7-room-desktop-waiting.png`
      - room desktop live-hand:
        - `.runlogs/task7-live-hand-desktop.png`
      - room phone portrait `390x844`:
        - `.runlogs/task7-room-phone.png`
      - phone portrait support sheet:
        - `.runlogs/task7-phone-room-sheet.png`
      - browser-side motion + scroll contract on the current runtime:
        - desktop:
          - `scrollHeight = clientHeight = 900`
          - `supportPolicy = panel`
          - `supportButtons = [Roster, Hand Tape, Room]`
          - `supportSurfaceModel = slide-panels`
          - `roomMotionBudget = standard`
          - `--arena-motion-enter = 180ms`
          - `--arena-motion-emphasis = 260ms`
        - phone:
          - `scrollHeight = clientHeight = 844`
          - `supportPolicy = sheet`
          - `supportSurfaceModel = bottom-sheets`
          - `roomMotionBudget = mobile-tight`
          - `pageFloat = disabled`
          - `touchScroll = sheet-body-y-only`
          - `--arena-motion-enter = 120ms`
          - `--arena-motion-emphasis = 160ms`
          - `potAnimation = none`
          - `beaconAnimation = none`
      - phone sheet open:
          - `presentation = bottom-sheet`
          - `rootInert = true`
          - `scrollHeight = clientHeight = 844`
      - evidence payload:
        - `.runlogs/task7-browser-evidence.json`
- Newly discovered pitfall:
  - the old full-screen seat geometry does not fit unchanged inside the new shell panels; desktop clipping and mobile side-seat overflow both reappeared until the seat-ring scale was reduced for panel-based layout
  - mobile seat geometry cannot use guessed card heights; the real rendered `arena-seat-card` footprint was about `70 x 123-128`, while the first helper pass only budgeted `70 x 60`, which hid the regression in unit tests
  - on narrow tables, “seat ring vs table circle” is not the whole problem; the community-card band can still extend beyond the safe width and collide with side seats unless it is included in the responsive layout contract
  - long device-style nicknames can tear open narrow rail cards if the new shell forgets to apply explicit truncation rules
  - if the same `deviceId` is open in multiple pages, the page that re-registers last owns the server mapping; an older page can still look “connected” but fail `createRoom` with `设备未注册`
  - responsive shell verification cannot rely on accessibility snapshots alone; take at least one real screenshot for phone portrait before concluding that seat ring spacing, rail stacking, and hero dock spacing are truly stable
  - desktop `split-stage` cannot budget seat geometry from the visual plaque body alone; once the live-turn halo, badges, and footer rows render, the real footprint grows to roughly `132 x 144`, and the helper must reserve that larger height or the bottom seat will clip back into the felt even while older unit tests still pass
  - the default `settleMs = 3000` window is too short for reliable UI evidence capture; use a long-settlement browser batch such as `-SettleMs 15000` when validating settlement hierarchy, countdown placement, or winner-first result ordering
  - once `motion/react` is layered on top of CSS keyframes, browser verification must inspect both sides:
    - CSS animation names confirm the ambient layer is still running
    - inline styles on the same elements confirm Motion is actually driving entrances or pulse transforms
  - when the room enters a live hand, do not block browser automation on hero action buttons alone; the host can be in-hand without being first to act, so live-hand readiness should be keyed off hole cards or `preflop` stage-state instead
  - if a motion-heavy CTA is still animating or reflowing, Playwright can reject a normal click as `element is not stable`; force-click is acceptable for evidence capture, but the UI side should still keep shrinking motion on phone-first paths
  - `resize_page` alone is not enough to validate ultrawide breakpoints in DevTools; if `window.innerWidth` stays below the target breakpoint, use viewport emulation before concluding that the three-column shell is broken
  - phone portrait support-sheet validation must also inspect `document.scrollingElement`; the UI can look visually correct while the page still has a hidden extra scroll range under the sheet
  - if you intentionally reuse local `pnpm dev` on `3001 / 5173`, treat that as a separate healthy environment from the runbook’s `3101 / 5173` regression pair and verify the backend with `/api/debug/devices` before restarting anything

## Living Evidence

- `[done]` Previous product-readiness gate closed on `2026-03-19`
- `[done]` Fresh baseline rerun for this phase
- `[done]` First post-readiness implementation landed without breaking baseline
- `[done]` First mode-system implementation evidence
- `[done]` First post-plan browser regression batch
- `[done]` Poker OS redesign design + implementation plan committed on `2026-03-19`
- `[done]` Poker OS shell migration and cross-mode UI differentiation
- `[done]` Functional edge-flow and exception-surface hardening rerun
- `[done]` Tactical dock / rail redesign rerun with fresh browser evidence on `2026-03-19`
- `[done]` Seat-ring and community-card responsive geometry rerun with fresh browser evidence on `2026-03-19`
- `[done]` Tactical Arena motion-system foundation rerun with fresh browser evidence on `2026-03-19`
- `[done]` Tactical Arena current-turn stage emphasis rerun with fresh browser evidence on `2026-03-19`
- `[done]` Tactical Arena winner-first settlement hierarchy rerun with fresh browser evidence on `2026-03-19`
- `[done]` Tactical Arena Motion choreography rerun with fresh browser evidence on `2026-03-19`
- `[done]` Tactical Arena rail Motion + SVG-backed stage rerun with fresh browser evidence on `2026-03-19`
- `[done]` Single-screen terminal motion-cost / mobile-scroll rerun with fresh browser evidence on `2026-03-20`
- `[done]` Final-review interaction hardening rerun on `2026-03-20`
- `[done]` Unified `9-max` room-shell table contract now advertised through `roomTerminal` metadata
- unified `9-max` browser rerun on the live local `3001 / 5173` dev pair:
  - create-room desktop modal stayed readable after the dialog-semantics pass:
    - `.runlogs/task7-create-room-modal-desktop.png`
  - `2-player` room `REXNEW` at desktop `1280x900`:
    - `.runlogs/task7-room-2p-desktop-1280x900.png`
    - browser metrics:
      - `anchorCount = 2`
      - `scrollHeight = clientHeight = 900`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
    - backend truth:
      - `.runlogs/task7-room-2p-debug.json`
      - `settings.maxPlayers = 2`
      - `settings.roomMode = pro`
  - the same `2-player` room `REXNEW` rerun at short-height `844x390`:
    - `.runlogs/task7-room-2p-shortheight-844x390.png`
    - browser metrics after the scroll-contract + wide-plaque fix:
      - `scrollHeight = clientHeight = 390`
      - `anchorCount = 2`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
  - `6-player` room `GGHERX` at desktop `1280x900`:
    - `.runlogs/task7-room-6p-desktop-1280x900.png`
    - browser metrics:
      - `anchorCount = 6`
      - `scrollHeight = clientHeight = 900`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
    - backend truth:
      - `.runlogs/task7-room-6p-debug.json`
      - `settings.maxPlayers = 6`
  - `9-player` room `0LMECG` at desktop `1280x900`:
    - `.runlogs/task7-room-9p-desktop-1280x900.png`
    - browser metrics:
      - `anchorCount = 9`
      - `scrollHeight = clientHeight = 900`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
    - backend truth:
      - `.runlogs/task7-room-9p-debug.json`
      - `settings.maxPlayers = 9`
  - the same `9-player` room `0LMECG` rerun at phone portrait `390x844`:
    - `.runlogs/task7-room-9p-phone-390x844.png`
    - browser metrics:
      - `anchorCount = 9`
      - `scrollHeight = clientHeight = 844`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
  - the rerun confirmed the unified-table contract with no player-count-specific fallback geometry in the browser:
    - `2 / 6 / 9` players all stayed on the same tournament-capsule stage language
    - hero stayed anchored to the canonical hero slot
    - no scenario reintroduced page-scroll fighting once the room-shell scroll contract was threaded through the tablet / short-height path
- canonical-table + true-modal follow-up rerun on the same live `3001 / 5173` dev pair:
  - explicit review gates for this rerun:
    - canonical seat symmetry must be treated as a first-class gate, not a post-hoc summary:
      - desktop `9-max` left/right slot pairs must stay mirrored around the center line
      - phone `9-max` left/right slot pairs must stay mirrored around the center line
      - the same canonical slot ids and normalized coordinates must stay stable across active footprints
    - true modal keyboard isolation must be treated as a first-class gate:
      - active `[role="dialog"]` must live under `#modal-root`, not inside inerted `#root`
      - forward `Tab` and backward `Shift+Tab` must stay inside the active surface
      - `Escape` must clear the surface and remove inert from `#root`
  - create-room desktop modal rerun after the portal-root fix:
    - screenshot:
      - `.runlogs/task3-create-room-modal-desktop.png`
    - browser contract:
      - `rootInert = true`
      - `rootAriaHidden = true`
      - `modalRootHasDialog = true`
      - `dialogInsideRoot = false`
      - `Tab` remained inside `#modal-root`
      - `Escape` closed the dialog and restored focus to `创建新游戏`
  - room support-sheet desktop rerun on `0LMECG` after the portal-root fix:
    - screenshot:
      - `.runlogs/task3-room-sheet-desktop.png`
    - browser contract:
      - `rootInert = true`
      - `rootAriaHidden = true`
      - `modalRootHasDialog = true`
      - `dialogInsideRoot = false`
      - focus opened on `关闭`
      - forward `Tab` stayed inside the sheet and reached `补码`
      - backward `Shift+Tab` stayed inside the sheet and reached `分享房间链接`
      - `Escape` cleared the dialog and removed inert from `#root`
  - fresh `9-max` desktop rerun on room `0LMECG`:
    - screenshot:
      - `.runlogs/task3-room-9max-desktop.png`
    - browser metrics:
      - `tableFamily = tournament-capsule-9max`
      - `tableProfile = desktop-oval`
      - `anchorCount = 9`
      - `scrollHeight = clientHeight = 900`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
  - fresh `9-max` phone rerun on room `0LMECG`:
    - screenshot:
      - `.runlogs/task3-room-9max-phone.png`
    - browser metrics:
      - `tableFamily = tournament-capsule-9max`
      - `tableProfile = phone-oval`
      - `anchorCount = 9`
      - `scrollHeight = clientHeight = 844`
      - `tableBody overlaps = 0`
      - `cardBand overlaps = 0`
  - backend truth for this rerun:
    - `.runlogs/task3-room-9max-debug.json`
    - `settings.maxPlayers = 9`
    - `settings.roomMode = pro`
  - this rerun closed the two final branch-review concerns:
    - canonical slot geometry is now footprint-driven and stable across active footprints
    - modalized surfaces now render outside the inerted app root instead of inside it
  - post-review short-handed occupancy spot check after `c7443ce`:
    - `2-player` room `D2MUUC` desktop `1280x900`:
      - screenshot:
        - `.runlogs/task3-room-2p-desktop.png`
      - backend truth:
        - `.runlogs/task3-room-2p-debug.json`
        - `settings.maxPlayers = 2`
      - browser geometry:
        - `anchorCount = 2`
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = desktop-oval`
        - `scrollHeight = clientHeight = 900`
        - hero center:
          - `x = 435`
          - `y = 665`
        - opposite seat center:
          - `x = 435`
          - `y = 76`
        - result:
          - heads-up now uses a true centered opposite seat, not the old `top-left` convenience slot
    - `6-player` room `EYQTON` desktop `1280x900`:
      - screenshot:
        - `.runlogs/task3-room-6p-desktop.png`
      - backend truth:
        - `.runlogs/task3-room-6p-debug.json`
        - `settings.maxPlayers = 6`
      - browser geometry:
        - `anchorCount = 6`
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = desktop-oval`
        - `scrollHeight = clientHeight = 900`
        - top seat center:
          - `x = 453`
          - `y = 76`
        - left/right flank pairs:
          - `座2` / `座6` at `y = 566`
          - `座3` / `座5` at `y = 248`
        - result:
          - short-handed occupancy now matches the documented hero + flank pairs + true `top` seat model
  - post-review true `9-anchor` occupancy rerun after `300fb24` and the fail-closed clamp follow-up:
    - `7-player` room `B562EM` desktop `1280x900`:
      - screenshot:
        - `.runlogs/task3-room-7p-desktop-fresh.png`
      - backend truth:
        - `.runlogs/task3-room-7p-debug.json`
        - `settings.maxPlayers = 7`
        - `settings.roomMode = pro`
      - browser geometry:
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = desktop-oval`
        - `anchorCount = 7`
        - `scrollHeight = clientHeight = 900`
        - `tableBody overlaps = 0`
        - `cardBand overlaps = 0`
        - seat centers:
          - left column:
            - `(257, 646)`
            - `(257, 328)`
            - `(257, 156)`
          - centered top:
            - `(640, 156)`
          - right column:
            - `(1023, 328)`
            - `(1023, 646)`
      - result:
        - `7-player` now reads as hero bottom + three left-side anchors + true centered `top` + mirrored upper/lower right anchors
    - `8-player` room `J5VWKI` desktop `1280x900`:
      - screenshot:
        - `.runlogs/task3-room-8p-desktop-fresh.png`
      - backend truth:
        - `.runlogs/task3-room-8p-debug.json`
        - `settings.maxPlayers = 8`
        - `settings.roomMode = pro`
      - browser geometry:
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = desktop-oval`
        - `anchorCount = 8`
        - `scrollHeight = clientHeight = 900`
        - `tableBody overlaps = 0`
        - `cardBand overlaps = 0`
        - centered top:
          - `(640, 156)`
        - mirrored flank pairs:
          - top:
            - `(257, 156)` / `(1023, 156)`
          - upper:
            - `(257, 328)` / `(1023, 328)`
          - lower:
            - `(257, 646)` / `(1023, 646)`
    - the same `8-player` room `J5VWKI` rerun at phone portrait `390x844`:
      - screenshot:
        - `.runlogs/task3-room-8p-phone.png`
      - browser geometry:
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = phone-oval`
        - `anchorCount = 8`
        - `scrollHeight = clientHeight = 844`
        - `tableBody overlaps = 0`
        - `cardBand overlaps = 0`
        - centered top:
          - `(195, 307)`
        - mirrored flank pairs:
          - top:
            - `(46, 307)` / `(344, 307)`
          - upper:
            - `(46, 464)` / `(344, 464)`
          - lower:
            - `(46, 754)` / `(344, 754)`
    - `9-player` room `T1AFB6` desktop `1280x900`:
      - screenshot:
        - `.runlogs/task3-room-9p-desktop.png`
      - backend truth:
        - `.runlogs/task3-room-9p-debug.json`
        - `settings.maxPlayers = 9`
        - `settings.roomMode = pro`
      - browser geometry:
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = desktop-oval`
        - `anchorCount = 9`
        - `scrollHeight = clientHeight = 900`
        - `tableBody overlaps = 0`
        - `cardBand overlaps = 0`
        - centered top:
          - `(640, 156)`
        - mirrored flank pairs:
          - top:
            - `(257, 156)` / `(1023, 156)`
          - upper:
            - `(257, 328)` / `(1023, 328)`
          - lower:
            - `(257, 646)` / `(1023, 646)`
        - ninth anchor:
          - near-hero-right at `(977, 811)`
    - the same `9-player` room `T1AFB6` rerun at phone portrait `390x844`:
      - screenshot:
        - `.runlogs/task3-room-9p-phone.png`
      - browser geometry:
        - `tableFamily = tournament-capsule-9max`
        - `tableProfile = phone-oval`
        - `anchorCount = 9`
        - `scrollHeight = clientHeight = 844`
        - `tableBody overlaps = 0`
        - `cardBand overlaps = 0`
        - centered top:
          - `(195, 307)`
        - mirrored flank pairs:
          - top:
            - `(46, 307)` / `(344, 307)`
          - upper:
            - `(46, 464)` / `(344, 464)`
          - lower:
            - `(46, 754)` / `(344, 754)`
        - ninth anchor:
          - near-hero-right at `(326, 905)`
  - this rerun closed the remaining “10-slot model” concern:
    - the validated browser path now covers `7 / 8 / 9` players, not only `2 / 6 / 9`
    - `10+` inputs are now clamped back to the explicit `9-anchor` contract instead of silently reviving the legacy generic ring

## Next Tactical Arena Backlog

- `[done]` Extend Motion choreography into `EventRail` and `Hand Tape`
- `[done]` Upgrade `TableStage` to an SVG-backed stage chrome
- `[done]` Capture tablet and ultrawide shell screenshots after the Motion pass
- `[done]` Run the `Broadcast Tactical Density Pass` to compress dead spacing in the create-room sheet, room shell, plaques, and phone support launchers without breaking the single-screen contract. The browser-evidence pass captured all of:
  - create-room desktop compact mode tiles
  - room desktop waiting with tighter header/dock spacing
  - room desktop live-hand with co-visible table and action area
  - room phone waiting with compact launcher row
  - room phone roster sheet open without page-length scroll

## Risks To Watch

- room-level mode and local display mode can easily get conflated
- presets can become marketing labels unless they map to real user-visible differences
- UI density changes can reintroduce mobile regressions if they are only validated on desktop
- study-mode feature ideas can bloat the live-play product if not constrained
- shell-level geometry can invalidate previously safe seat layouts because the old table lived in a full-screen canvas, not inside nested panels

## 2026-03-20 Broadcast Tactical Table Evidence Rerun

This rerun closed the browser-evidence task for the new broadcast-tactical table family on the reused local-dev pair (`3001 / 5173`) without restarting the user-owned `pnpm dev` servers.

- fresh room:
  - `LVLO1D`
- fresh screenshots:
  - `.runlogs/broadcast-tactical-create-room-desktop.png`
  - `.runlogs/broadcast-tactical-room-desktop-waiting.png`
  - `.runlogs/broadcast-tactical-room-desktop-live.png`
  - `.runlogs/broadcast-tactical-room-phone-waiting.png`
  - `.runlogs/broadcast-tactical-room-phone-roster-sheet.png`
- create-room desktop:
  - the mode chooser stayed horizontally readable instead of collapsing into vertical single-character columns
  - the `club / pro / study` surfaces remained visibly distinct before room creation
- desktop waiting state (`1366x900`):
  - `scrollHeight = clientHeight = 900`
  - `coupledMain = true`
  - `dockBottom = 2.4px`
  - `dockTransform = none`
  - hero plaque text remained readable
  - open-seat plaque text remained readable
  - `data-center-priority = board-pot-street`
- desktop live-hand state (`1366x900`):
  - `scrollHeight = clientHeight = 900`
  - `coupledMain = true`
  - `dockBottom = 2.4px`
  - `dockTransform = none`
  - `hasActionButtons = true`
  - live cue: `轮到 座2 · TO CALL 10`
  - center shell remained `board-pot-street`
  - the board shell and pot capsule stayed visually separated, confirming the clean-center hierarchy instead of collapsing into a HUD-like center stack
- phone portrait waiting state (`390x844`):
  - `scrollHeight = clientHeight = 844`
  - support launcher buttons stayed readable and tap-sized
  - `dockBottom = 0`
  - `dockTransform = none`
  - the same broadcast-tactical family still read as a vertical capsule instead of a different table product
- phone portrait roster sheet (`390x844`):
  - `sheetOpen = true`
  - `sheetTitle = Roster`
  - `scrollHeight = clientHeight = 844`
  - the page stayed locked to the single-screen shell while the sheet owned the overflow
- fresh blocker discovered and fixed during evidence capture:
  - starting a new hand briefly flipped `gameStarted = true` before the action-state payload was fully present, so `ActionButtons` tried to read `gameState.currentBet` and blanked the page
  - fix landed by keeping the live-hand action frame mounted, then making `ActionButtons` fail-closed with `等待牌局状态同步` until the authoritative `gameState` arrived

## 2026-03-20 Broadcast Tactical Density Evidence Rerun

This pass closed the density-pass browser-evidence task on the reused local-dev pair (`3001 / 5173`) without restarting the user-owned `pnpm dev` servers.

- dated sample evidence only:
  - keep this as the 2026-03-20 evidence block
  - future reruns should substitute current room IDs and can follow a naming pattern like `density-<date>-<surface>.png`
- fresh room:
  - `SBJV6M`
  - `0G3HEY`
- fresh screenshots:
  - `.runlogs/density-create-room-desktop.png`
  - `.runlogs/density-room-desktop-waiting.png`
  - `.runlogs/density-room-desktop-live.png`
  - `.runlogs/density-room-phone-waiting.png`
  - `.runlogs/density-room-phone-roster-sheet.png`
- the committed `density-*.png` files are the 2026-03-20 pre-convention sample set for this pass
- viewport numbers like `1366x900` and `390x844` are CSS-pixel viewports; screenshot files may be DPR-scaled and therefore larger on disk
- create-room desktop compact mode tiles:
  - modal dialog footprint: `1024x868`
  - modal-body-owned overflow case, not a locked room-shell page-scroll case
  - body overflow: `visible`
  - html overflow: `visible`
  - dialog class: `modal-content max-w-5xl create-room-modal`
  - overflow owner: `.modal-content__body.create-room-modal__body`
  - modal body `clientHeight = 716`, `scrollHeight = 859`, `overflowY = auto`
  - three compact tiles inside the modal: `306x180` each
  - page metrics while modal open: `scrollHeight = 1347`, `clientHeight = 900`
  - the tiles stayed horizontal and readable instead of collapsing into tall profile cards
  - the modal read as a compact terminal sheet, not a full-height room builder
- room desktop waiting viewport `1366x900`:
  - `scrollHeight = clientHeight = 770`
  - shell `scrollHeight = clientHeight = 763`
  - hero dock remained visible with `top = 490`, `bottom = 764.2`, `height = 274.2`
  - DOM/a11y extracted sample text for plaques: `座1 Hero HOST 1,000 等待开始`; `座2 OPEN SEAT`
  - tighter spacing preserved readability without reintroducing page scroll
- room desktop live-hand viewport `1366x900`:
  - `scrollHeight = clientHeight = 770`
  - shell `scrollHeight = clientHeight = 763`
  - hero dock stayed co-visible with the action area: `top = 328.96`, `bottom = 764.20`, `height = 435.23`
  - DOM/a11y extracted sample text:
    - `座1 SB/BTN Hero HOST 990 BET 10 -10 游戏中`
    - `座2 BB device_mmynmk3d_2v08hd_lbfwmz 980 BET 20 -20 游戏中`
    - `座3 OPEN SEAT`
  - the compact density kept the table and decision area visible together instead of collapsing the lower dock
- room phone portrait waiting viewport `390x844`:
  - `scrollHeight = clientHeight = 844`
  - shell `scrollHeight = clientHeight = 844`
  - hero dock remained visible with `top = 547.72`, `bottom = 842.40`, `height = 294.68`
  - DOM/a11y extracted sample text for plaques: `座1 Hero HOST 1,000 等待开始`; `座2 OPEN SEAT`
  - the compact launcher row stayed present and the page-length scroll stayed locked out
- room phone roster sheet open viewport `390x844`:
  - `scrollHeight = clientHeight = 844`
  - shell `scrollHeight = clientHeight = 844`
  - `data-sheet-density = tight-terminal`
  - `data-room-panel-presentation = bottom-sheet`
  - `data-surface-variant = panel`
  - `data-support-launcher-density = compact`
  - sheet body scroll remained independent: `clientHeight = 516`, `scrollHeight = 773`
  - the page itself did not regain a hidden scroll range under the sheet
- density-specific pitfall recorded:
  - after many HMR updates, a browser page can enter a corrupted `useGame must be used within a GameProvider` state
  - reloading the page cleared the corruption without restarting the user-owned dev servers

- Task 6 final verification rerun for this density-pass evidence task:
  - client full node tests: `176/176`
  - client build: passed
  - server full suite: `114/114`
  - these reruns were part of the same density-pass evidence closure and confirmed the browser evidence did not leave the repo in a broken state

## 2026-03-22 Copy Cleanup and Primary-Dock Evidence Rerun

This rerun reused the user-owned local-dev pair and focused on real operator-facing polish instead of geometry:

- fresh room:
  - `FA1JHX`
- fresh screenshots:
  - `.runlogs/create-room-copy-clean-desktop.png`
  - `.runlogs/broadcast-tactical-copy-clean-desktop-live.png`
  - `.runlogs/broadcast-tactical-copy-clean-phone-live.png`
- create-room copy cleanup verified:
  - the gateway now reads `当前桌型 / 显示模式 / 开设牌桌 / 加入牌桌 / 模式速览`
  - mode scenes read `私局控制桌 / 职业竞技桌 / 训练分析台`
  - density and motion labels now read as short Chinese product language instead of mixed English descriptors
- room-shell copy cleanup verified:
  - header now reads `房间`
  - the mode pill no longer leaks `ROOM / PRO / Pro`
  - the support surface now reads `辅助面板`
  - phone portrait now exposes `快速操作` directly inside the dock with `补码 / 离座 / 分享 / 退出`
- live-hand cleanup verified:
  - no raw `device_*` nickname leaked into the tested hero-facing surfaces
  - duplicate textual `房主` markers were removed from seat plaques and the leaderboard
  - pro mode dropped the duplicate explanatory stage caption and duplicate board-summary copy
  - the stale legacy pot block inside `CommunityCards` was removed, leaving a single center-stage pot readout
- evidence-capture pitfall recorded:
  - immediately after `开始游戏`, a11y snapshots can briefly retain an exiting pre-hand node until Motion settles
  - wait for an authoritative live-hand cue such as `需跟注`, `您的回合`, or the `preflop` stage beacon before concluding that the center-stage data is duplicated

## 2026-03-22 Create-Room Compression and True-Capsule Waiting Rerun

This follow-up rerun stayed on the same local-dev pair and focused on two waiting-state problems a picky live review immediately surfaced:

- fresh room:
  - `D3OMEW`
- fresh screenshots:
  - `.runlogs/create-room-summary-tight-desktop.png`
  - `.runlogs/broadcast-tactical-room-waiting-no-back-cards-desktop.png`
  - `.runlogs/broadcast-tactical-room-desktop-true-capsule.png`
- create-room modal evidence:
  - the right-side summary now reads as `开桌速览`, with opening parameters and rule state instead of repeating the selected mode identity
  - the quick summary now stays on `信息重点 / 桌面参数 / 规则状态`
- waiting-room evidence:
  - waiting-state dock now uses a denser hero strip so the table keeps more visible depth
  - the board tray no longer renders five blue back cards while the room is idle or still preflop without board cards
  - a wide short-height desktop viewport such as `1366x707` now stays `desktop-oval` with a `horizontal-capsule` shell instead of incorrectly collapsing to `phone-oval`
- follow-up note:
  - the coupled dock still intentionally overlaps the hero zone and lower flank region in waiting rooms; this is now a visual-polish trade-off, not a table-family regression

## 2026-05-03 Non-Full All-In Call-Only Validation

This pass closed the first professional-player betting-rule edge case after the phone table/action UI stabilized.

- fixed gameplay rule:
  - a short stack all-in that raises the current bet by less than `minRaise` no longer ends the street before prior bettors have matched the new bet
  - players pulled back only because of that non-full all-in are marked `currentPlayerActionMode = call_only`
  - call-only players may only fold/call, and a deep all-in raise attempt is rejected with `当前只能跟注或弃牌`
- fixed phone action UI:
  - when the server marks the current player as `call_only`, the phone decision cockpit hides `加注` and `全下`
  - the same state still shows the reachable two-button row: `弃牌 / 跟注 380`
- fixed short-phone single-screen layout:
  - moved room-shell vertical padding out of the JSX `py-3` utility so data-attribute short-height CSS can actually override it
  - tightened the short-height single-screen stage budget for `375x667`
- evidence:
  - browser audit: `.runlogs/2026-05-03-nonfull-allin-callonly-audit.json` (`runId = mooo6t98`)
  - fresh room: `X7DSC9`
  - `390x844`: `shellScrollHeight = shellClientHeight = 844`, command labels `弃牌 / 跟注`, no raise/all-in button
  - `375x667`: `shellScrollHeight = shellClientHeight = 667`, command labels `弃牌 / 跟注`, no raise/all-in button
  - preflop action record: host `raise 600`, short stack `allin 990`, deep stack `call 980`, host `call 380`
  - hand history panel on both phone viewports showed localized `牌局记录 / 最近手牌` and total pot `3,000`
- next queue:
  - validate odd-chip split and side-pot replay details in the hand-history drawer
  - validate timeout/disconnect while the current player is in a call-only state
  - validate min-raise reopening after a full all-in raise with four or more players

## 2026-05-03 Betting Edge Coverage and Odd-Chip Replay

This pass narrowed the next professional-player correctness queue after the non-full all-in fix.

- locked existing correct gameplay behavior:
  - a complete all-in raise in a 4-handed preflop spot reopens action to prior bettors as `currentPlayerActionMode = open`
  - a call-only current player who times out is auto-folded and the hand record stores `auto: true`, `reason: timeout`
  - a call-only current player who disconnects is force-folded and the hand record stores `auto: true`, `reason: disconnect`
- improved replay clarity:
  - hand-history pot lines now mark uneven split recipients with `（奇数筹码）`
  - a 303-chip main pot split between two winners records `151 / 152`, with the extra chip awarded to the winner closest to the small blind
- targeted verification:
  - `cd server && pnpm jest tests/gameLogic/GameplaySmoke.test.js --runInBand`
  - `cd server && pnpm jest tests/gameLogic/SidePotFlow.test.js --runInBand`
  - `cd client && pnpm exec node --test src/view-models/handHistoryViewModel.test.js`
- final verification:
  - `cd client && pnpm exec node --test`: `247/247`
  - `cd client && pnpm build`: passed, with existing large chunk warning (`assets/index-7fcc17c4.js` 532.27 kB)
  - `cd server && pnpm test --runInBand`: `125/125`
  - browser audit: `.runlogs/2026-05-03-nonfull-allin-callonly-audit.json` (`runId = moopggpk`, fresh room `DJ60VQ`)
- next queue:
  - build or verify a compact phone drill-down for hands with multiple side pots so the user can inspect every pot layer without leaving the single-screen table context
  - keep service preflight explicit: browser audits that create socket rooms on `3101` must run Vite with `VITE_SERVER_ORIGIN=http://127.0.0.1:3101`

## 2026-05-03 Embedded Replay Drill-Down

This pass addressed the first replay drill-down issue without changing the table layout.

- change:
  - embedded `HandHistoryDrawer` surfaces now use `Number.POSITIVE_INFINITY` for the line limit, so phone support-panel replay cards do not truncate pot layers after 4 lines
  - normal toggle drawers keep the previous compact line limits
- verification:
  - `cd client && pnpm exec node --test src/components/gameRoomStageContract.test.js`: passed
  - `cd client && pnpm exec node --test`: `248/248`
  - `cd client && pnpm build`: passed, with existing large chunk warning (`assets/index-3104147b.js` 532.41 kB)
  - `cd server && pnpm test --runInBand`: `125/125`
  - browser side-pot audit: `.runlogs/2026-05-02-phone-side-pot-allin-audit.json` (`runId = moopltvc`, fresh room `2R0DDL`)
  - browser multi-side-pot history audit: `.runlogs/2026-05-03-phone-multisidepot-history-audit.json` (`runId = moopphv2`, fresh room `S88824`)
- next queue:
  - `[done]` continue reveal-detail density validation for long multiway showdown histories where several players choose `show_one` / `show_all`

## 2026-05-03 Multiway Reveal Replay Density

This pass locked the remaining reveal-detail replay case after the embedded history drill-down.

- coverage added:
  - `buildHandSummary` now has a contract test for multiple mixed reveal choices in one replay: `show_all`, `show_one`, and `hide`
  - `hide` stays out of replay text, while every visible reveal line remains in both `detailLines` and the full replay `lines`
- browser evidence:
  - `.runlogs/2026-05-03-phone-multi-reveal-history-audit.json` (`runId = moopyq2i`, fresh room `EH92HC`)
  - 4-way all-in hand with main pot, two side pots, all chip-delta lines, and three visible reveal lines
  - `390x844`: `lineCount = 11`, `revealLineCount = 3`, `missingExpectedLines = []`, `shellScrollHeight = shellClientHeight = 844`
  - `375x667`: `lineCount = 11`, `revealLineCount = 3`, `missingExpectedLines = []`, `shellScrollHeight = shellClientHeight = 667`
- final verification:
  - `cd client && pnpm exec node --test`: `249/249`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-3104147b.js` 532.41 kB)
  - `cd server && pnpm test --runInBand`: `125/125`
- product decision:
  - long replay detail belongs in the support panel's internal scroll area, not in the room page scroll
  - the single-screen table shell remains locked; dense replay evidence can scroll inside the sheet when needed
- next queue:
  - `[done]` continue professional-player flow polish around post-hand review ergonomics: make dense replay easier to scan without dropping pot, delta, or reveal evidence

## 2026-05-03 Scan-Friendly Replay Sections

This pass improved dense post-hand review readability without changing replay data or dropping evidence.

- change:
  - `HandHistoryDrawer` now groups replay lines into `总览`, `底池与输赢`, and `亮牌`
  - the existing `.tactical-history-card__line` DOM hook remains intact so browser audits and downstream selectors still count every evidence line
  - normal drawer line limits still apply globally, while embedded support-panel history keeps the full record
- browser evidence:
  - `.runlogs/2026-05-03-phone-multi-reveal-history-audit.json` (`runId = mooq4wxz`, fresh room `XZ3TLU`)
  - `390x844`: section labels `总览 / 底池与输赢 / 亮牌`, `lineCount = 11`, `revealLineCount = 3`, `missingExpectedLines = []`, `shellScrollHeight = shellClientHeight = 844`
  - `375x667`: same section labels, `lineCount = 11`, `revealLineCount = 3`, `missingExpectedLines = []`, `shellScrollHeight = shellClientHeight = 667`
- final verification:
  - `cd client && pnpm exec node --test`: `250/250`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-365edde4.js` 533.49 kB)
  - `cd server && pnpm test --runInBand`: `125/125`
- next queue:
  - `[done]` continue product polish with the next highest-risk professional workflow after replay: invalid action/error feedback and fast recovery states in real browser flows

## 2026-05-03 Duplicate Player-Action Guard

This pass closed the highest-risk invalid-action feedback gap found after replay polish.

- change:
  - `GameContext.playerAction` now uses socket request-key concurrency protection, matching the existing `takeSeat` and `revealHand` request pattern
  - duplicate action submissions are rejected on the client before a second `playerAction` socket frame is emitted
  - duplicate action feedback now uses an informational toast: `动作已发送，正在等待牌局确认，请勿重复点击。`
- browser evidence:
  - `.runlogs/2026-05-03-phone-playeraction-duplicate-guard-audit.json` (`runId = mooqcsq5`)
  - `390x844` fresh room `U7E0F2`: duplicate fold produced `playerActionFrameCount = 1`, `hostFoldActionCount = 1`, no generic action failure, `shellScrollHeight = shellClientHeight = 844`
  - `375x667` fresh room `0AG8V4`: duplicate fold produced `playerActionFrameCount = 1`, `hostFoldActionCount = 1`, no generic action failure, `shellScrollHeight = shellClientHeight = 667`
- final verification:
  - `cd client && pnpm exec node --test`: `251/251`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-26d201e2.js` 533.65 kB)
  - `cd server && pnpm test --runInBand`: `125/125`
- next queue:
  - `[done]` continue invalid-action coverage for stale/out-of-turn requests and recovery-required room actions in real browser flows

## 2026-05-03 Invalid Action And Recovery Browser Coverage

This pass closed the remaining invalid-action browser-coverage gap without changing production code.

- browser evidence:
  - `.runlogs/2026-05-03-phone-invalid-action-recovery-audit.json` (`runId = mooqv5ok`)
  - stale-device UI flow:
    - `390x844` fresh room `DWCFN8`: the real action button returned `当前页面身份已失效，请刷新页面后重试。`, did not show the generic `操作失败：设备未注册`, and left the page single-screen
    - `375x667` fresh room `PHPBGH`: same stale-device feedback and single-screen metrics
  - out-of-turn socket flow:
    - `390x844` fresh room `HFWMQX`: after host called and action moved to P2, a stale host socket frame received `playerActionError` with `不是你的回合`
    - `375x667` fresh room `EI594A`: same out-of-turn server rejection while the browser stayed in the watch-state action console
  - recovery-required flow:
    - isolated browser harness room `JBXZOP` on `390x844`: host saw `房间状态异常`, clicked `恢复房间`, and received `房间已恢复，可以重新开始游戏。`
    - isolated browser harness room `B2KX9H` on `375x667`: same recovery banner and recover-button flow
- product decision:
  - stale-device is a real UI action failure and must surface as a refresh hint, not as a generic operation failure
  - out-of-turn is normally prevented by the watch-state action console, so browser coverage verifies the authoritative socket rejection frame rather than forcing a fake UI button
  - recovery-required is a dirty-state guard; browser coverage uses an isolated local harness instead of adding unsafe mutation endpoints to the product server
- next queue:
  - `[done]` validate live-hand refresh/reconnect on phone and desktop so hero hand, action state, and room membership recover without stale UI
  - `[todo]` validate leave-seat / leave-room confirmations during an active hand, including forced-fold feedback and single-screen phone layout
  - `[todo]` validate same-device room switching in a real browser so old room cleanup does not leave phantom membership or stale hand state

## 2026-05-03 Live-Hand Refresh/Reconnect Grace

This pass fixed the highest-risk reconnect failure: refreshing or briefly losing the socket during a live decision no longer immediately auto-folds the player.

- change:
  - `RoomManager` now schedules a short disconnect grace timer before applying the old disconnect forced-fold path
  - `joinRoom`, `handleDeviceReconnect`, recovery, leave-room, and room cleanup clear pending disconnect timers so stale timers cannot fold a recovered or departed player later
  - if the grace window expires and the player is still disconnected, the existing forced-fold path still records `reason: disconnect`
- automated evidence:
  - red test before the fix: `keeps a briefly disconnected current player in hand when the device reconnects before grace expires` failed because `host.folded` became `true` immediately after disconnect
  - `cd server && pnpm jest tests/gameLogic/RoomState.test.js --runInBand`: `18/18` passed after the fix
  - `cd server && pnpm jest tests/gameLogic/GameplaySmoke.test.js --runInBand`: `8/8` passed after updating the disconnect test to assert fold after grace expiry
- browser evidence:
  - `.runlogs/2026-05-03-live-refresh-reconnect-audit.json` (`runId = moorek12`)
  - desktop `1366x900` fresh room `NNSLC6`: refresh changed socket id, kept `currentPlayerId` on host, kept `holeCardCount = 2`, kept action console `decision`, and stayed single-screen
  - phone `390x844` fresh room `HNC2YF`: same reconnect outcome with `shellScrollHeight = shellClientHeight = 844`
- next queue:
  - `[done]` validate leave-seat / leave-room confirmations during an active hand, including forced-fold feedback and single-screen phone layout
  - `[todo]` validate same-device room switching in a real browser so old room cleanup does not leave phantom membership or stale hand state

## 2026-05-03 Active-Hand Leave/Exit Guard

This pass fixed the active-hand exit race found by real-browser testing after reconnect hardening.

- change:
  - `GameRoom` now marks an intentional room exit before calling `leaveRoom`
  - the room-verification effect skips automatic URL recovery while that intentional exit is in progress
  - successful active-hand exit closes the confirmation modal, resets local room state, and returns to `/` with `replace: true`
  - failed exit requests clear the guard so the player can retry or keep playing
- root cause:
  - the old success path called `resetGame()` while the route was still `/game/:roomId`
  - the `GameRoom` verification effect then saw `roomId && !currentRoomId` and treated the intentional exit as a refresh recovery, sometimes auto-joining the just-left room again
- browser evidence:
  - `.runlogs/2026-05-03-active-leave-exit-audit.json` (`runId = moorw8wp`)
  - leave-seat `390x844` fresh room `PJLKSR`: confirmation modal warned about auto-fold, host moved to `seat = -1`, `isActive = false`, last action was auto `fold` with `reason = leave_seat`, and the room shell stayed single-screen
  - exit-room `390x844` fresh room `QG83NT`: confirmation modal warned about auto-fold, host moved to `seat = -1`, `isActive = false`, last action was auto `fold` with `reason = leave_room`, returned to `/`, and `#root.inert = false`
  - leave-seat `375x667` fresh room `F9ZUQS`: same forced-fold and single-screen result
  - exit-room `375x667` fresh room `J6SJMJ`: same forced-fold result, stable return to `/`, and `#root.inert = false`
- final verification:
  - `cd client && pnpm exec node --test`: `252/252`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-81ce2b91.js` 533.76 kB)
- next queue:
  - `[done]` validate same-device room switching in a real browser so old room cleanup does not leave phantom membership or stale hand state

## 2026-05-03 Same-Device Room Switch Browser Audit

This pass validated the existing same-device room cleanup path in a real browser without requiring production code changes.

- browser evidence:
  - `.runlogs/2026-05-03-same-device-room-switch-audit.json` (`runId = moos5mtp`)
  - create-switch path on `390x844`: same browser created room `IVCRDU`, navigated home without explicit leave, created room `TZNB1B`, added a guest, started the new room, and folded as host
  - `IVCRDU` returned `404` after the second create, proving the old empty room was cleaned
  - `TZNB1B` recorded the host fold in the new room, kept the browser on `/game/TZNB1B`, showed no `IVCRDU` text, kept `#root.inert = false`, and stayed single-screen
  - join-switch path on `375x667`: same browser joined room `7DKBF2`, navigated home, then joined room `3A9ZV7`
  - after joining `3A9ZV7`, room `7DKBF2` contained only its original host, while `3A9ZV7` contained the browser device with two visible hand cards and no stale `7DKBF2` text
- product decision:
  - current server behavior is correct: `createRoom` and `joinRoom` both call `leaveOtherRoomsForDevice`, so a device has one authoritative room membership
  - no production code change is needed for this stage
- next queue:
  - `[done]` continue broader product polish from the next highest-risk workflow: post-switch stale page actions and multi-tab same-device ownership messaging

## 2026-05-03 Multi-Tab Same-Device Ownership Audit

This pass validated stale same-device tab messaging after room-switch cleanup.

- browser evidence:
  - `.runlogs/2026-05-03-stale-same-device-ownership-audit.json` (`runId = moosa0p2`)
  - stale home-create path on `390x844`: old page attempted `创建新游戏 -> 创建房间` after a newer same-device page registered the device
  - stale room-exit path on `375x667`: old room page attempted `退出` after a newer same-device page registered the device and became the authoritative socket
- result:
  - both stale actions surfaced `当前页面身份已失效，请刷新页面后重试。`
  - neither path exposed raw `设备未注册` nor a generic `创建房间失败/退出房间失败：设备未注册`
  - stale home remained on `/` with the create-room modal still open for recovery
  - stale room remained on `/game/H9N7CM`; the server room still had the player attached to the newer socket, so the stale tab did not accidentally leave the room
- product decision:
  - current error mapping is acceptable for this stage: stale ownership is a recoverable warning, not a destructive room action
- next queue:
  - `[done]` continue product hardening around room-end / empty-room lifecycle
  - `[todo]` continue post-hand navigation ergonomics

## 2026-05-03 Empty-Room Close Feedback

This pass improved the last-player exit lifecycle for room owners.

- change:
  - `deriveLeaveRoomFeedback` now distinguishes `roomClosed: true`
  - when the last player exits an idle room, the feedback is `已退出房间，房间已关闭。`
  - ordinary leave-room and active-hand auto-fold feedback remain unchanged
- automated evidence:
  - red test before implementation: `derives explicit feedback when leaving closes the room` failed because the copy was only `已退出房间。`
  - `cd client && pnpm exec node --test src/view-models/gameViewModel.test.js`: `42/42`
- browser evidence:
  - `.runlogs/2026-05-03-empty-room-close-audit.json` (`runId = moosel6h`)
  - fresh room `D7CX89`
  - after the sole host clicked `退出`, the page returned to `/`, showed `已退出房间，房间已关闭。`, had no dialog left open, and `#root.inert = false`
  - `GET /api/debug/rooms/D7CX89` returned `404`
  - `GET /api/rooms/D7CX89` through the Vite proxy also returned `404`
- final verification:
  - `cd client && pnpm exec node --test`: `253/253`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-3befab11.js` 533.83 kB)
- next queue:
  - `[done]` continue post-hand navigation ergonomics

## 2026-05-03 Post-Hand Support Panel Auto-Close

This pass fixed a real phone ergonomics problem after settlement review.

- root cause:
  - phone support panels are modal dialogs, correctly making `#root.inert = true` while open
  - if the user opened `牌局` during settlement and the next hand began automatically, the same support panel stayed open over the new hand
  - this hid the table/action surface even though the room had already advanced to a fresh preflop hand
- change:
  - `GameRoom` now tracks the last observed `gameState.handNumber`
  - support panels close automatically when the hand number changes
  - the tracker resets on room changes so joining another room does not carry stale hand-transition state
- automated evidence:
  - red test before implementation: `GameRoom closes support panels when a new hand begins so action is not hidden` failed because `lastObservedHandNumberRef` did not exist
  - `cd client && pnpm exec node --test src/components/roomTerminalShellContract.test.js`: `36/36`
- browser evidence:
  - `.runlogs/2026-05-03-post-hand-panel-ergonomics-audit.json` (`runId = moosobsp`)
  - fresh room `A6FBMH`
  - during settlement, `牌局` support panel was open: `dialogCount = 1`, `rootInert = true`, and the panel text included `最近手牌`
  - after hand 2 started, the panel was closed: `dialogCount = 0`, `rootInert = false`, `shellScrollHeight = shellClientHeight = 844`
  - the browser correctly remained in `watch` state because the next preflop action had rotated to the other player
- final verification:
  - `cd client && pnpm exec node --test`: `254/254`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-64028b6e.js` 534.06 kB)
- next queue:
  - `[done]` validate repeated multi-hand continuity on phone, including no stuck modal inert state, conserved chips, correct actor/watch states, and no room-shell scroll across several automatic hand transitions

## 2026-05-03 Phone Multi-Hand Continuity Audit

This pass verified repeated phone hand transitions after the support-panel auto-close fix.

- browser evidence:
  - `.runlogs/2026-05-03-phone-multihand-continuity-audit.json` (`runId = moosucfd`)
  - fresh room `260SKC`
  - host browser played hands 1 and 3; guest socket played hands 2 and 4, so both `decision` and `watch` host states were covered
  - each settlement opened the real `牌局` support panel, then the next hand auto-closed it
- verified contract:
  - hand 1 through hand 4 each kept `chipsPlusPot = 2000`
  - every preflop hand start had `dialogCount = 0`, `rootInert = false`, `holeCardCount = 2`, and `shellScrollHeight = shellClientHeight = 844`
  - every settlement review had `dialogCount = 1`, `rootInert = true`, and support-panel text containing `最近手牌`
  - final state reached hand 5 preflop with the host back in `decision`, no dialog, no inert root, and conserved chips
- next queue:
  - `[done]` validate rebuy / busted-player recovery in real phone browser flow, including zero-stack seat messaging, host start eligibility, and whether the action dock stays single-screen when a busted player requests chips

## 2026-05-03 Phone Rebuy / Busted Recovery Audit

This pass verified the phone recovery path for a zero-chip spectator returning to a playable seat.

- browser evidence:
  - `.runlogs/2026-05-03-phone-rebuy-recovery-390x844-audit.json` (`runId = moot2zaw`, fresh room `YOZJ1Z`)
  - `.runlogs/2026-05-03-phone-rebuy-recovery-375x667-audit.json` (`runId = moot38jj`, fresh room `6ZE37V`)
- verified contract:
  - a zero-chip spectator tapping an open seat stays unseated and receives `当前筹码不足，已保留观战状态，请先补码后再入座。`
  - the rebuy modal stays within the phone viewport on both `390x844` and `375x667`, with `bodyScrollHeight = bodyClientHeight` and `rootInert = true`
  - after submitting the default `1,000` rebuy, the player has `chips = 1000`, `seat = -1`, and the modal closes with `rootInert = false`
  - after tapping the open seat again, the player takes seat 3 with `isActive = true`
  - after the socket host starts the game, the rebought browser player receives two hole cards and the room shell remains single-screen on both phone viewports
- product observation:
  - the flow is functionally correct, but the earlier zero-chip warning toast remains visible briefly after successful rebuy and seating; this is a feedback-polish issue, not a state or layout blocker
- next queue:
  - `[done]` polish rebuy success feedback so the user gets an explicit confirmation after chips are restored and stale warning context does not dominate the next action

## 2026-05-03 Rebuy Success Feedback Polish

This pass tightened the feedback loop after a state-correction rebuy.

- change:
  - added `deriveRebuySuccessFeedback` so confirmed rebuy results produce `已补码 1,000，当前筹码 1,000。`
  - `RebuyModal` now dispatches `game-clear-toasts` before the success toast, so the old zero-chip warning does not stay as the dominant message after chips are restored
  - `ToastHandler` now supports the `game-clear-toasts` event for state-correction flows
- automated evidence:
  - red tests before implementation: missing `deriveRebuySuccessFeedback`, missing `game-clear-toasts` dispatch, and missing `toast.clearAll()`
  - `cd client && pnpm exec node --test src/view-models/gameViewModel.test.js`: `43/43`
  - `cd client && pnpm exec node --test src/components/interactionSurfaceContract.test.js`: `17/17`
- browser evidence:
  - `.runlogs/2026-05-03-phone-rebuy-recovery-390x844-audit.json` (`runId = moot8hrm`, fresh room `X3L3VX`)
  - `.runlogs/2026-05-03-phone-rebuy-recovery-375x667-audit.json` (`runId = moot8rhv`, fresh room `G7Y3PJ`)
  - after rebuy, both viewports showed `已补码 1,000，当前筹码 1,000。`
  - after rebuy, both viewports no longer contained the stale `当前筹码不足...` warning text
  - seating and host-start participation remained intact after the feedback change
- final verification:
  - `cd client && pnpm exec node --test`: `257/257`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-2190225f.js` 534.65 kB)
- next queue:
  - `[done]` continue professional product hardening with timer-expiry browser behavior: verify a live phone decision times out into the correct forced action, feedback remains clear, and the next player/next hand state does not create scroll or stale controls

## 2026-05-03 Phone Timeout Handoff Feedback

This pass verified and clarified the phone timeout path for a live decision.

- root cause:
  - the server already recorded timeout folds correctly as `auto: true, reason: timeout`
  - the phone watch console only said `本手已弃牌`, which did not tell the player why the hand was folded
- change:
  - `ActionButtons` now detects when the current player's last action is an automatic timeout fold
  - the watch console shows `超时自动弃牌` and `系统已自动弃牌，行动已交给下一位玩家`
- browser evidence:
  - `.runlogs/2026-05-03-phone-timeout-handoff-audit.json` (`runId = mootivlx`)
  - fresh room `W0QYOF`
  - before timeout: host browser had the decision console, four action commands, two hole cards, and timer `60`
  - after timeout: server last action was host `fold` with `auto = true` and `reason = timeout`
  - after timeout: current player handed off to P2, host console switched to `watch`, commands were removed, and the text showed `超时自动弃牌`
  - phone shell remained single-screen with no dialog and `rootInert = false`
- final verification:
  - `cd client && pnpm exec node --test src/components/interactionSurfaceContract.test.js`: `18/18`
  - `cd client && pnpm exec node --test`: `258/258`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-86714207.js` 534.86 kB)
- next queue:
  - `[done]` continue real-browser hardening around timeout/check spots: verify a no-call timeout auto-checks rather than folds, advances streets correctly, and explains the automatic check without stale action controls

## 2026-05-03 Phone Timeout Auto-Check Feedback

This pass closed the no-call timeout path for live phone decisions.

- root cause:
  - the server already auto-checked no-call timeout spots and recorded `auto: true, reason: timeout`
  - the phone watch console only had explicit timeout feedback for auto-folds, so an automatic check could look like a generic wait state
- change:
  - `ActionButtons` now detects the current player's timeout `check`
  - the watch console shows `超时自动过牌` and `系统已自动过牌，行动已交给下一位玩家`
- browser evidence:
  - `.runlogs/2026-05-03-phone-timeout-check-audit.json` (`runId = mootxidq`)
  - fresh room `LEMIH1`
  - before timeout: P2 browser was on `flop`, action console was `decision`, commands were `弃牌 / 过牌 / 加注 / 全下`, and timer was `60`
  - after timeout: server last action was P2 `check` with `auto = true` and `reason = timeout`
  - after timeout: current player handed off to P3, P2 console switched to `watch`, old commands were removed, and the text showed `超时自动过牌`
  - after P3 and the button both checked, the hand advanced to `turn`, P2 became current again, and the phone decision console showed `过牌`
  - phone shell stayed single-screen throughout, with no dialog and `rootInert = false`
- final verification:
  - red test before implementation: `ActionButtons explains timeout auto-folds in the watch console` failed on missing `超时自动过牌`
  - `cd client && pnpm exec node --test src/components/interactionSurfaceContract.test.js`: `18/18`
  - `cd client && pnpm exec node --test`: `258/258`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-0382b9d2.js` 535.05 kB)
- next queue:
  - `[done]` continue professional-player hardening around disconnect / reconnect in no-call check spots, so temporary refresh does not create misleading forced-action feedback and sustained disconnect semantics stay explicit

## 2026-05-03 Phone No-Call Disconnect Auto-Check

This pass aligned disconnect behavior with real poker check/fold expectations.

- root cause:
  - timeout already used check/fold semantics: no-call spots auto-check, bet-facing spots auto-fold
  - disconnect grace expiry always used `forceFoldPlayer`, so a disconnected player could be folded even when checking was free
  - after a disconnect auto-check, the same still-disconnected player could receive a fresh 60-second timer on the next street
- change:
  - `GameLogic.handlePlayerDisconnect` now auto-checks only when the disconnected player is the current actor and has `0` to call
  - bet-facing disconnects and non-current disconnects still force-fold after the existing grace path
  - `startPlayerTimer` immediately applies disconnect auto-action for still-disconnected current players after grace has already expired, instead of granting another full timer
  - `ActionButtons` now explains own disconnect auto-actions with `断线自动过牌` / `断线自动弃牌`
- browser evidence:
  - `.runlogs/2026-05-03-phone-disconnect-check-audit.json` (`runId = mooucfgj`)
  - quick reconnect fresh room `BMRBCZ`: phone reload in a flop check spot stayed on P2 decision after grace would have expired, with hole cards and `过牌` controls intact
  - disconnect auto-check fresh room `T7DTWT`: after closing the P2 phone page past grace, server recorded P2 `check` with `auto = true`, `reason = disconnect`, and reconnected P2 saw `断线自动过牌`
  - sustained disconnect fresh room `KPNG8Y`: after P2 disconnected on flop and remained offline, P2 auto-checked again immediately on `turn` with `reason = disconnect`; no extra 60-second wait was introduced
  - all phone browser states stayed single-screen with no dialog and `rootInert = false`
- final verification:
  - red server test before implementation: no-call disconnect expected `check` but received `fold`
  - red server test before sustained fix: next street still had `currentPlayerId = device-p2` instead of immediately handing off to P3
  - red client contract before copy fix: missing `断线自动过牌` / `断线自动弃牌`
  - `cd server && pnpm jest tests/gameLogic/GameplaySmoke.test.js --runInBand`: `10/10`
  - `cd server && pnpm test --runInBand`: `128/128`
  - `cd client && pnpm exec node --test src/components/interactionSurfaceContract.test.js`: `18/18`
  - `cd client && pnpm exec node --test`: `258/258`
  - `cd client && pnpm build`: passed, with the existing large chunk warning (`assets/index-86407b81.js` 535.44 kB)
- next queue:
  - `[done]` validate bet-facing disconnect auto-fold feedback in a real phone browser, including `断线自动弃牌`, call-only preservation, and no stale action controls

## 2026-05-03 Phone Bet-Facing Disconnect Auto-Fold Audit

This pass verified the existing bet-facing disconnect behavior in a real phone browser after the disconnect copy and no-call rules were tightened.

- browser evidence:
  - `.runlogs/2026-05-03-phone-disconnect-fold-audit.json` (`runId = mooujiy6`)
  - normal facing-bet fresh room `G9B132`: host phone was facing a `20` preflop call, closed past grace, then reconnected into `watch` with `断线自动弃牌`; old action controls were gone and action handed to P2
  - call-only fresh room `HWBOYP`: host phone was in `currentPlayerActionMode = call_only` with only `弃牌 / 跟注`; after disconnect past grace, the server recorded host `fold` with `reason = disconnect`, and the reconnected phone showed `断线自动弃牌`
  - both phone paths stayed single-screen with no dialog and `rootInert = false`
- product result:
  - no production code change was needed in this pass
  - the previous `ActionButtons` disconnect copy and existing call-only server fold behavior covered the browser path
- verification:
  - `.runlogs/2026-05-03-phone-disconnect-fold-audit.json`: `ok = true`
  - latest full verification still applies from the preceding disconnect code pass: server `128/128`, client `258/258`, and client build passed
- next queue:
  - `[todo]` continue product hardening with showdown / settlement interruption cases: refresh or reconnect during reveal windows should preserve result visibility, reveal eligibility, and support-panel ergonomics
