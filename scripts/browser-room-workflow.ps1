[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('show-current-room', 'set-current-room', 'set-from-url', 'clear-current-room', 'print-current-room-url')]
    [string]$Action = 'show-current-room',

    [string]$RoomId,

    [string]$Url,

    [string]$FrontendOrigin = 'http://127.0.0.1:5173'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$RunLogDir = Join-Path $RepoRoot '.runlogs'
$RoomStateFile = Join-Path $RunLogDir 'current-room.txt'

function Ensure-RunLogDir {
    New-Item -ItemType Directory -Force -Path $RunLogDir | Out-Null
}

function Normalize-RoomId {
    param([string]$Value)

    if (-not $Value) {
        throw 'RoomId is required.'
    }

    $normalized = $Value.Trim().ToUpperInvariant()
    if ($normalized -notmatch '^[A-Z0-9]{6}$') {
        throw "Invalid room id: $Value"
    }

    return $normalized
}

function Get-CurrentRoomId {
    if (-not (Test-Path $RoomStateFile)) {
        return $null
    }

    $content = Get-Content $RoomStateFile -Raw
    if (-not $content) {
        return $null
    }

    return $content.Trim().ToUpperInvariant()
}

function Set-CurrentRoomId {
    param([string]$Value)

    Ensure-RunLogDir
    $normalized = Normalize-RoomId -Value $Value
    Set-Content -Path $RoomStateFile -Value $normalized -NoNewline
    return $normalized
}

switch ($Action) {
    'show-current-room' {
        $current = Get-CurrentRoomId
        if ($current) {
            Write-Host $current
        } else {
            Write-Host 'No current room saved.'
        }
    }

    'set-current-room' {
        $current = Set-CurrentRoomId -Value $RoomId
        Write-Host "Saved room: $current"
    }

    'set-from-url' {
        if (-not $Url) {
            throw 'Url is required.'
        }

        if ($Url -notmatch '/game/([A-Za-z0-9]{6})') {
            throw "Could not parse room id from URL: $Url"
        }

        $current = Set-CurrentRoomId -Value $Matches[1]
        Write-Host "Saved room from URL: $current"
    }

    'clear-current-room' {
        Remove-Item $RoomStateFile -Force -ErrorAction SilentlyContinue
        Write-Host 'Cleared current room.'
    }

    'print-current-room-url' {
        $current = Get-CurrentRoomId
        if (-not $current) {
            Write-Host 'No current room saved.'
            return
        }

        Write-Host "$FrontendOrigin/game/$current"
    }
}
