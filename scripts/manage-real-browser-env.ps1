[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('preflight', 'start-all', 'stop-all', 'status')]
    [string]$Action = 'status',

    [switch]$CleanProfile,

    [string]$BindHost = '127.0.0.1',

    [int]$ServerPort = 3101,

    [int]$ClientPort = 5173,

    [int]$SettleMs = -1
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$RunLogDir = Join-Path $RepoRoot '.runlogs'
$ServerDir = Join-Path $RepoRoot 'server'
$ClientDir = Join-Path $RepoRoot 'client'
$RoomStateFile = Join-Path $RunLogDir 'current-room.txt'
$ServerOutLog = Join-Path $RunLogDir "server-$ServerPort.out.log"
$ServerErrLog = Join-Path $RunLogDir "server-$ServerPort.err.log"
$ClientOutLog = Join-Path $RunLogDir "client-$ClientPort.out.log"
$ClientErrLog = Join-Path $RunLogDir "client-$ClientPort.err.log"

function Ensure-RunLogDir {
    New-Item -ItemType Directory -Force -Path $RunLogDir | Out-Null
}

function Get-Listeners {
    param([int[]]$Ports)

    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in $Ports } |
        Sort-Object LocalPort, OwningProcess
}

function Stop-Ports {
    param([int[]]$Ports)

    $processIds = Get-Listeners -Ports $Ports |
        Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force
    }
}

function Wait-ForHttp {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 20
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -SkipHttpErrorCheck -Uri $Url -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 300
        }
    } while ((Get-Date) -lt $deadline)

    throw "Timed out waiting for $Url"
}

function Show-Status {
    $listeners = Get-Listeners -Ports @($ServerPort, $ClientPort)

    Write-Host "Worktree root: $RepoRoot"
    Write-Host "Logs: $RunLogDir"
    Write-Host ""

    if (-not $listeners) {
        Write-Host "No listeners on $ServerPort / $ClientPort."
        return
    }

    $listeners |
        Select-Object LocalAddress, LocalPort, OwningProcess |
        Format-Table -AutoSize
}

function Start-Server {
    Ensure-RunLogDir
    $commandParts = @(
        "set PORT=$ServerPort",
        "set HOST=$BindHost"
    )
    if ($SettleMs -ge 0) {
        $commandParts += "set DEFAULT_SETTLE_MS=$SettleMs"
    }
    $commandParts += "cd /d `"$ServerDir`""
    $commandParts += 'node server.js'
    $command = [string]::Join('&& ', $commandParts)
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c', $command `
        -RedirectStandardOutput $ServerOutLog `
        -RedirectStandardError $ServerErrLog `
        -PassThru | Out-Null

    Wait-ForHttp -Url "http://$BindHost`:$ServerPort/api/debug/devices"
}

function Start-Client {
    Ensure-RunLogDir
    $command = "set VITE_SERVER_ORIGIN=http://$BindHost`:$ServerPort&& cd /d `"$ClientDir`"&& npm run dev -- --host $BindHost --port $ClientPort"
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c', $command `
        -RedirectStandardOutput $ClientOutLog `
        -RedirectStandardError $ClientErrLog `
        -PassThru | Out-Null

    Wait-ForHttp -Url "http://$BindHost`:$ClientPort"
}

function Run-Preflight {
    Write-Host "Preflight checks"
    Write-Host "---------------"

    if (-not (Test-Path $ServerDir)) {
        throw "Missing server directory: $ServerDir"
    }

    if (-not (Test-Path $ClientDir)) {
        throw "Missing client directory: $ClientDir"
    }

    $listeners = Get-Listeners -Ports @($ServerPort, $ClientPort)
    if ($listeners) {
        Write-Host "Ports already occupied:"
        $listeners | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table -AutoSize
    } else {
        Write-Host "Ports $ServerPort / $ClientPort are free."
    }

    if ($CleanProfile) {
        Write-Host "CleanProfile requested: removing stale room-state file."
        Remove-Item $RoomStateFile -Force -ErrorAction SilentlyContinue
    }

    if ($SettleMs -ge 0) {
        Write-Host "Using DEFAULT_SETTLE_MS=$SettleMs for newly created rooms."
    }
}

switch ($Action) {
    'preflight' {
        Run-Preflight
    }

    'start-all' {
        Run-Preflight
        Stop-Ports -Ports @($ServerPort, $ClientPort)
        Start-Sleep -Seconds 1
        Start-Server
        Start-Client
        Write-Host ""
        Write-Host "Environment started."
        Write-Host "Server: http://$BindHost`:$ServerPort"
        Write-Host "Client: http://$BindHost`:$ClientPort"
        if ($SettleMs -ge 0) {
            Write-Host "Default settleMs: $SettleMs"
        }
        Write-Host ""
        Show-Status
    }

    'stop-all' {
        Stop-Ports -Ports @($ServerPort, $ClientPort)
        Write-Host "Stopped listeners on $ServerPort / $ClientPort."
    }

    'status' {
        Show-Status
    }
}
