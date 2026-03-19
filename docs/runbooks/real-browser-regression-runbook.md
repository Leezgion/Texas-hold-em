# Real Browser Regression Runbook

This runbook is the authoritative operator workflow for real-browser regression in the current repository checkout on `main`.

Use it when you need to:

- start the regression server and client
- confirm the correct backend is live
- run browser scenarios with isolated player identities
- capture room-state evidence
- clean up browsers and ports after the run

## Scope

- Repo root: `D:\GITHUB\Texas-hold'em`
- Server port for regression runs: `3101`
- Client port for regression runs: `5173`
- Stable scripts:
  - `scripts/manage-real-browser-env.ps1`
  - `scripts/browser-room-workflow.ps1`

## 1. Preflight

Close old browser pages first. Keep one `about:blank` page if you are using Chrome DevTools MCP.

Run:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 status
```

Expected:

- no unexpected listeners on `3101 / 5173`
- if old listeners exist, stop them before proceeding

Optional hard reset:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 stop-all
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\browser-room-workflow.ps1 clear-current-room
```

If you intentionally already have local `pnpm dev` running, do not restart blindly just because `status` only shows `5173` or misses `3101`. Verify whether you are on the local-dev pair instead:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/debug/devices | ConvertTo-Json -Depth 4
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/ | Select-Object StatusCode
```

If `3001` and `5173` are healthy and clearly serving the current checkout, you may reuse them for UI evidence. Fall back to `start-all` only when that local-dev environment is missing, stale, or pointing at the wrong code.

## 2. Start The Environment

Standard start:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 start-all -CleanProfile
```

Long-settlement start for reconnect or settlement UI verification:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 start-all -CleanProfile -SettleMs 15000
```

Important:

- do not assume a non-zero exit code means both services are down
- if startup looks suspicious, immediately continue with the verification steps below

## 3. Verify The Environment Before Touching The UI

Check listeners:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 status
```

Check server health:

```powershell
Invoke-RestMethod http://127.0.0.1:3101/api/debug/devices | ConvertTo-Json -Depth 4
```

Check client reachability:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:5173/index.html | Select-Object StatusCode
```

If `5173` is missing or startup returned an unexpected failure, inspect the logs before retrying:

```powershell
Get-Content D:\GITHUB\Texas-hold'em\.runlogs\server-3101.out.log -Tail 80
Get-Content D:\GITHUB\Texas-hold'em\.runlogs\client-5173.out.log -Tail 80
Get-Content D:\GITHUB\Texas-hold'em\.runlogs\client-5173.err.log -Tail 80
```

Only proceed when both `3101` and `5173` are confirmed alive.

## 4. Browser Session Rules

- Prefer Chrome DevTools MCP over ad-hoc shell browser commands.
- Use a fresh `isolatedContext` for every non-host player and every new scenario.
- Do not reuse old contexts across rooms unless you are intentionally testing reconnect with the same browser identity.
- Do not keep multiple active host pages on the same `deviceId`; the most recently registered page owns the server-side device mapping and older pages can fail later actions with `设备未注册`.
- After every major UI change, take a fresh snapshot instead of reusing stale element handles.

## 5. Room Tracking

After creating a room in the browser, save it immediately:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\browser-room-workflow.ps1 set-from-url -Url http://127.0.0.1:5173/game/ABC123
```

Show the current saved room:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\browser-room-workflow.ps1 show-current-room
```

Print the saved room URL for a new browser context:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\browser-room-workflow.ps1 print-current-room-url
```

## 6. Evidence Capture

For every meaningful scenario, capture the room debug payload:

```powershell
Invoke-RestMethod http://127.0.0.1:3101/api/debug/rooms/ABC123 | ConvertTo-Json -Depth 8
```

At minimum, record:

- room id
- scenario name
- browser-observed result
- `seat / chips / isActive / tableState`
- `handHistory`
- `potResults` when side-pot settlement is involved

For Poker OS shell work, add these spot checks explicitly:

- gateway desktop: three readable mode cards plus create/join controls
- gateway mobile: cards stack cleanly without overlap
- room shell desktop: seat ring stays inside the stage panel and the hero dock remains readable
- room shell desktop: in-hand current-turn verification must include the stage beacon, not only the hero dock; confirm the beacon shows the active seat and, after one real action, a last-action cue
- settlement hierarchy: when validating settlement UI, prefer a long-settlement room such as `-SettleMs 15000` so the overlay, countdown, and winner-first ordering can be captured before the next hand starts
- settlement hierarchy: confirm both the desktop settlement sheet and the phone event rail show winner-first ordering:
  - winner/pot headline first
  - total-pot line second
  - chip-delta lines afterwards
- Motion choreography: when a surface uses `motion/react` on top of CSS ambience, inspect both:
  - computed `animationName` to confirm the CSS ambience is still active
  - inline `style` transforms/opacity on the same element to confirm Motion is driving the entrance or pulse state
- SVG stage chrome: verify `.table-stage-chrome` exists and the seat-guide count still matches the visible seat ring; when blinds or button labels are available, confirm the SVG marker texts mirror them
- ultrawide verification: if `resize_page` does not push `window.innerWidth` across the intended breakpoint, switch to viewport emulation before diagnosing the shell layout
- room shell mobile: side seats stay inside the stage, the current-player marker does not wrap badly, and long nicknames truncate instead of stretching rail cards
- room shell mobile: side seats must stay outside both the table circle and the community-card band; checking the table bounds alone is not sufficient
- room shell mobile: `IntelRail / EventRail / Hero Dock` stack in a stable top-to-bottom order without overlapping the stage or each other
- room shell mobile: opening `Players / History / Room` must not reintroduce page-length scrolling; verify:
  - `document.scrollingElement.scrollHeight === document.scrollingElement.clientHeight`
  - the sheet body still has its own independent scroll range when content is long
- tactical dock: stat cards wrap cleanly on phone portrait instead of compressing into unreadable chips
- roster and stack ledger: long device-style nicknames truncate instead of widening narrow cards
- cross-mode check: `club / pro / study` remain visibly different in theme and information emphasis

For phone portrait verification, do not rely on DevTools accessibility snapshots alone. Capture at least one real screenshot after resizing to a narrow viewport; snapshot text can confirm semantics, but it will not prove that the seat ring and dock spacing still fit visually.

If responsive geometry still looks suspicious after a helper refactor, measure the real rendered rectangles in the browser:

- `.arena-seat-anchor`
- `.poker-table`
- `.poker-card.community`

For split-stage desktop checks, do not trust the visual plaque body height. Measure the real rendered live-turn footprint after badges and the turn marker appear; the regression on `2026-03-19` only reproduced once the browser showed a footprint close to `132 x 144`.

Do not trust guessed mobile footprints from unit tests alone; the first broken phone pass under-budgeted the real seat-card height by roughly half and only browser rects exposed it.

Update both of these after the run:

- `docs/plans/2026-03-19-poker-product-readiness-todolist.md`
- `docs/plans/2026-03-19-poker-product-polish-todolist.md`
- `真实浏览器联机回归踩坑记录.md`

## 7. Cleanup

After the scenario batch:

1. Close all extra browser pages and leave only one blank page.
2. Stop the regression services.
3. Clear the saved room id.
4. Confirm the ports are gone.

Commands:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 stop-all
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\browser-room-workflow.ps1 clear-current-room
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\scripts\manage-real-browser-env.ps1 status
```

Expected final state:

- no listeners on `3101 / 5173`
- no stale room id in `.runlogs/current-room.txt`
- browser reduced to one blank page
- if `status` still shows listeners right after `stop-all`, run `stop-all` once more and verify again before ending the session

## 8. Known Operator Pitfalls

- `start-all` can fail fast even though `3101` is already up and `5173` comes up shortly after. Always check `status` and `.runlogs` before retrying.
- If `5173` points at the wrong backend, stop and restart using this worktree runbook. Do not trust a stale dev server.
- If you are intentionally reusing local `pnpm dev` on `3001 / 5173`, check `3001/api/debug/devices` first; `manage-real-browser-env.ps1 status` only tells you whether the dedicated `3101` regression backend is up.
- If a browser page shows old room state, verify the room via `/api/debug/rooms/:roomId` before assuming a gameplay bug.
- If multi-player testing looks wrong, check whether you accidentally reused the same browser context and therefore the same `deviceId`.
- If one page on the same device suddenly fails `createRoom` or `joinRoom` with `设备未注册`, check whether another page re-registered the same `deviceId` more recently.
- If a stale room page now shows `当前页面身份已失效，请刷新页面后重试。`, treat that as the expected front-end warning for a stolen `deviceId -> socket` mapping rather than a gameplay-state bug.
- `stop-all` should always be followed by `status`; a printed success line is not sufficient evidence that both listeners are already gone.
- After any Tailwind or build-pipeline dependency change, always hard-restart `5173`; do not trust a dev server that stayed alive across `npm install` or config rewiring.
- Settlement UI evidence is easy to miss on the default `settleMs = 3000`; if you need screenshots of the countdown, winner-first ordering, or reveal controls, restart with a longer settlement window before testing.
- Motion surfaces can look fine in a static screenshot while their entrance choreography is actually dead; inspect inline transforms or opacity on the live element before declaring the animation layer healthy.
- DevTools window resizing can under-report the real layout width; when you need a true tablet or ultrawide breakpoint, verify `window.innerWidth` before trusting the screenshot.
- Phone portrait support sheets can look visually correct while the page still has a hidden extra scroll range under them; inspect `document.scrollingElement` after opening a sheet instead of trusting the screenshot alone.
