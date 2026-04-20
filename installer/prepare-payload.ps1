param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$PayloadRoot = (Join-Path $PSScriptRoot "payload")
)

$ErrorActionPreference = "Stop"

function Copy-Tree {
  param(
    [Parameter(Mandatory=$true)][string]$From,
    [Parameter(Mandatory=$true)][string]$To
  )

  if (Test-Path -LiteralPath $From -PathType Leaf) {
    $parent = Split-Path -Parent $To
    if (-not (Test-Path $parent)) {
      New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Copy-Item -LiteralPath $From -Destination $To -Force
    return
  }

  if (Test-Path $To) {
    Remove-Item -LiteralPath $To -Recurse -Force
  }
  New-Item -ItemType Directory -Path $To -Force | Out-Null
  $childGlob = Join-Path $From "*"
  Copy-Item -Path $childGlob -Destination $To -Recurse -Force
}

function Ensure-PathExists {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

$appOut = Join-Path $PayloadRoot "app"
Ensure-PathExists (Join-Path $payloadRoot "app\package.json")
Ensure-PathExists (Join-Path $payloadRoot "app\public")
$runtimeNode = Join-Path $PayloadRoot "runtime\\node"
$runtimeWinsw = Join-Path $PayloadRoot "runtime\\winsw"

New-Item -ItemType Directory -Path $appOut -Force | Out-Null
New-Item -ItemType Directory -Path $runtimeNode -Force | Out-Null
New-Item -ItemType Directory -Path $runtimeWinsw -Force | Out-Null

Write-Host "Preparing app payload..." -ForegroundColor Cyan
# Ensure dependencies are installed and production build is generated
Write-Host "Running npm install and npm run build..." -ForegroundColor Cyan
Push-Location $RepoRoot
npm install
npm run build
Pop-Location

$pathsToCopy = @(
  "package.json",
  "package-lock.json",
  "next.config.mjs",
  "src",
  "public",
  ".next",
  "node_modules"
)

foreach ($rel in $pathsToCopy) {
  $from = Join-Path $RepoRoot $rel
  if (-not (Test-Path $from)) {
    Write-Host "Skipping missing: $rel" -ForegroundColor Yellow
    continue
  }
  $to = Join-Path $appOut $rel
  Write-Host "Copying $rel" -ForegroundColor Gray
  Copy-Tree -From $from -To $to
}

if (-not (Test-Path (Join-Path $appOut ".next"))) {
  Write-Host "WARNING: .next build output not found in payload. Run `npm run build` before packaging." -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $runtimeNode "node.exe"))) {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if ($null -ne $nodeCmd -and (Test-Path $nodeCmd.Source)) {
    $nodeVersion = & $nodeCmd.Source -v
    if ($nodeVersion -eq "v23.11.1") {
      Write-Host "Copying local Node.js runtime ($nodeVersion) into payload..." -ForegroundColor Cyan
      $nodeDir = Split-Path -Parent $nodeCmd.Source
      Copy-Tree -From $nodeDir -To $runtimeNode
    } else {
      Write-Host "WARNING: Node runtime missing. Found local node $nodeVersion at $($nodeCmd.Source), but need v23.11.1. Put Node 23.11.1 into: $runtimeNode" -ForegroundColor Yellow
    }
  } else {
    Write-Host "WARNING: Node runtime missing. Put Node 23.11.1 (win-x64) into: $runtimeNode" -ForegroundColor Yellow
  }
}

if (-not (Test-Path (Join-Path $runtimeWinsw "ElectionGraphicService.exe"))) {
  Write-Host "WARNING: WinSW missing. Put WinSW exe into: $runtimeWinsw\\ElectionGraphicService.exe" -ForegroundColor Yellow
}

Write-Host "Done. Payload at: $PayloadRoot" -ForegroundColor Green
