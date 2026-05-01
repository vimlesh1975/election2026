param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$DistDir = (Join-Path $PSScriptRoot "dist")
)

$ErrorActionPreference = "Stop"

function Find-Iscc {
  $candidates = @(
    (Join-Path ${env:ProgramFiles(x86)} "Inno Setup 6\ISCC.exe"),
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files (x86)\MultivideoCasparCG\installer\tools\inno-setup\ISCC.exe"
  )

  foreach ($p in $candidates) {
    if ($p -and (Test-Path -LiteralPath $p)) { return $p }
  }

  $found = Get-ChildItem "C:\Program Files (x86)" -Recurse -Filter ISCC.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $found) { return $found.FullName }
  throw "ISCC.exe not found. Install Inno Setup, or place ISCC.exe somewhere under Program Files (x86)."
}

function Ensure-PathExists {
  param([Parameter(Mandatory=$true)][string]$Path, [string]$Hint = "")
  if (-not (Test-Path -LiteralPath $Path)) {
    $msg = "Missing required file/folder: $Path"
    if ($Hint) { $msg = "$msg`n$Hint" }
    throw $msg
  }
}

$timestamp = Get-Date -Format "ddMMyyyy_HHmmss"
$buildName = "election2026_$timestamp"

New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
Get-ChildItem -LiteralPath $DistDir -Filter "*.exe" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -LiteralPath $DistDir -Filter "*.log" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Preparing payload..." -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "prepare-payload.ps1") -RepoRoot $RepoRoot | Out-Host

$payloadRoot = Join-Path $PSScriptRoot "payload"
Ensure-PathExists (Join-Path $payloadRoot "app\package.json")
Ensure-PathExists (Join-Path $payloadRoot "app\node_modules\next\dist\bin\next")
Ensure-PathExists (Join-Path $payloadRoot "data\mla.updated.xlsx") "The editable MLA workbook must exist in installer\payload\data."
Ensure-PathExists (Join-Path $payloadRoot "data\mlas") "The editable MLA image folder must exist in installer\payload\data\mlas."
Ensure-PathExists (Join-Path $payloadRoot "data\party-symbols") "The editable party symbol folder must exist in installer\payload\data\party-symbols."
Ensure-PathExists (Join-Path $payloadRoot "runtime\node\node.exe") "Node 23.11.1 runtime must exist in installer\payload\runtime\node."
Ensure-PathExists (Join-Path $payloadRoot "runtime\winsw\ElectionGraphicService.exe") "WinSW must exist in installer\payload\runtime\winsw."
Ensure-PathExists (Join-Path $payloadRoot "runtime\winsw\ElectionGraphicService.xml")

$iss = Join-Path $PSScriptRoot "ElectionGraphic.iss"
Ensure-PathExists $iss

$iscc = Find-Iscc
Write-Host "Building installer: $buildName" -ForegroundColor Cyan

$logPath = Join-Path $DistDir ($buildName + ".log")

Push-Location $PSScriptRoot
try {
  & $iscc /Qp ("/O" + $DistDir) ("/DBuildName=" + $buildName) $iss 2>&1 | Tee-Object -FilePath $logPath | Out-Host
} finally {
  Pop-Location
}

$outExe = Join-Path $DistDir ($buildName + ".exe")
Ensure-PathExists $outExe

# Keep the output folder clean (only the latest installer + its log).
Get-ChildItem -LiteralPath $DistDir -Filter "*.exe" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -ne $outExe } |
  Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "Done: $outExe" -ForegroundColor Green
