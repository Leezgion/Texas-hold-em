# Real Browser Regression Runbook

This runbook is the authoritative operator workflow for real-browser regression on `feat/presentation-state-refactor`.

Use it when you need to:

- start the worktree server and client
- confirm the correct backend is live
- run browser scenarios with isolated player identities
- capture room-state evidence
- clean up browsers and ports after the run

## Scope

- Worktree root: `D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor`
- Server port for this worktree: `3101`
- Client port for this worktree: `5173`
- Stable scripts:
  - `scripts/manage-real-browser-env.ps1`
  - `scripts/browser-room-workflow.ps1`

## 1. Preflight

Close old browser pages first. Keep one `about:blank` page if you are using Chrome DevTools MCP.

Run:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 status
```

Expected:

- no unexpected listeners on `3101 / 5173`
- if old listeners exist, stop them before proceeding

Optional hard reset:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 stop-all
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\browser-room-workflow.ps1 clear-current-room
```

## 2. Start The Environment

Standard start:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 start-all -CleanProfile
```

Long-settlement start for reconnect or settlement UI verification:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 start-all -CleanProfile -SettleMs 15000
```

Important:

- do not assume a non-zero exit code means both services are down
- if startup looks suspicious, immediately continue with the verification steps below

## 3. Verify The Environment Before Touching The UI

Check listeners:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 status
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
Get-Content D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\.runlogs\server-3101.out.log -Tail 80
Get-Content D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\.runlogs\client-5173.out.log -Tail 80
Get-Content D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\.runlogs\client-5173.err.log -Tail 80
```

Only proceed when both `3101` and `5173` are confirmed alive.

## 4. Browser Session Rules

- Prefer Chrome DevTools MCP over ad-hoc shell browser commands.
- Use a fresh `isolatedContext` for every non-host player and every new scenario.
- Do not reuse old contexts across rooms unless you are intentionally testing reconnect with the same browser identity.
- After every major UI change, take a fresh snapshot instead of reusing stale element handles.

## 5. Room Tracking

After creating a room in the browser, save it immediately:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\browser-room-workflow.ps1 set-from-url -Url http://127.0.0.1:5173/game/ABC123
```

Show the current saved room:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\browser-room-workflow.ps1 show-current-room
```

Print the saved room URL for a new browser context:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\browser-room-workflow.ps1 print-current-room-url
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

Update both of these after the run:

- `docs/plans/2026-03-19-poker-product-readiness-todolist.md`
- `真实浏览器联机回归踩坑记录.md`

## 7. Cleanup

After the scenario batch:

1. Close all extra browser pages and leave only one blank page.
2. Stop the worktree services.
3. Clear the saved room id.
4. Confirm the ports are gone.

Commands:

```powershell
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 stop-all
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\browser-room-workflow.ps1 clear-current-room
pwsh -NoProfile -File D:\GITHUB\Texas-hold'em\.worktrees\presentation-state-refactor\scripts\manage-real-browser-env.ps1 status
```

Expected final state:

- no listeners on `3101 / 5173`
- no stale room id in `.runlogs/current-room.txt`
- browser reduced to one blank page
- if `status` still shows listeners right after `stop-all`, run `stop-all` once more and verify again before ending the session

## 8. Known Operator Pitfalls

- `start-all` can fail fast even though `3101` is already up and `5173` comes up shortly after. Always check `status` and `.runlogs` before retrying.
- If `5173` points at the wrong backend, stop and restart using this worktree runbook. Do not trust a stale dev server.
- If a browser page shows old room state, verify the room via `/api/debug/rooms/:roomId` before assuming a gameplay bug.
- If multi-player testing looks wrong, check whether you accidentally reused the same browser context and therefore the same `deviceId`.
- `stop-all` should always be followed by `status`; a printed success line is not sufficient evidence that both listeners are already gone.
