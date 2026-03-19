# Poker Product Polish Todo

**Goal:** Keep polishing the game on `main` until it is robust in normal play, resilient in edge cases, aligned with serious Hold'em table expectations, and only then spend time on visual refinement.

**Non-goals for this phase:** deployment, staging, CI, persistence, or launch preparation. Those tracks are intentionally deferred.

**Current product direction:** support three usage goals at the same time through configurable modes instead of three separate products:

- `club`: for offline private games and club-style table assistance
- `pro`: for online-grinder style play, speed, and information density
- `study`: for review, replay, and hand-history comprehension

**Architecture direction:** keep one authoritative gameplay engine. Add a thin configuration layer instead of forking rules or UI flows:

- shared room-level mode presets for table behavior and defaults
- local client display modes for information density and presentation
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

- Branch: `main`
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
- Newly discovered pitfall:
  - the old full-screen seat geometry does not fit unchanged inside the new shell panels; desktop clipping and mobile side-seat overflow both reappeared until the seat-ring scale was reduced for panel-based layout
  - long device-style nicknames can tear open narrow rail cards if the new shell forgets to apply explicit truncation rules
  - if the same `deviceId` is open in multiple pages, the page that re-registers last owns the server mapping; an older page can still look “connected” but fail `createRoom` with `设备未注册`
  - responsive shell verification cannot rely on accessibility snapshots alone; take at least one real screenshot for phone portrait before concluding that seat ring spacing, rail stacking, and hero dock spacing are truly stable

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

## Risks To Watch

- room-level mode and local display mode can easily get conflated
- presets can become marketing labels unless they map to real user-visible differences
- UI density changes can reintroduce mobile regressions if they are only validated on desktop
- study-mode feature ideas can bloat the live-play product if not constrained
- shell-level geometry can invalidate previously safe seat layouts because the old table lived in a full-screen canvas, not inside nested panels
