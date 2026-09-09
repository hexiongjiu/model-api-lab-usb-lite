$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$bundledNode = Join-Path $projectRoot "runtime\node.exe"
$serverEntry = Join-Path $projectRoot "server.mjs"

function Test-LabReady {
    param([int]$Port)
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/__model_api_lab_health" -UseBasicParsing -TimeoutSec 1
        $health = $response.Content | ConvertFrom-Json
        return $response.StatusCode -eq 200 -and $health.app -eq "model-api-lab" -and $health.version -eq 2
    }
    catch {
        return $false
    }
}

function Test-PortInUse {
    param([int]$Port)
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $connection = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if (-not $connection.AsyncWaitHandle.WaitOne(250)) {
            return $false
        }
        $client.EndConnect($connection)
        return $client.Connected
    }
    catch {
        return $false
    }
    finally {
        $client.Close()
    }
}

if (-not (Test-Path $bundledNode)) {
    Write-Host "Runtime not found. Please copy the complete USB folder." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $serverEntry)) {
    Write-Host "Server file not found. Please copy the complete USB folder." -ForegroundColor Red
    exit 1
}

$startPort = if ($env:MODEL_API_LAB_START_PORT) { [int]$env:MODEL_API_LAB_START_PORT } else { 8188 }
$selectedPort = $null
$alreadyRunning = $false
foreach ($candidatePort in $startPort..($startPort + 10)) {
    if (Test-LabReady -Port $candidatePort) {
        $selectedPort = $candidatePort
        $alreadyRunning = $true
        break
    }
    if (-not (Test-PortInUse -Port $candidatePort)) {
        $selectedPort = $candidatePort
        break
    }
}

if ($null -eq $selectedPort) {
    Write-Host "No free local port was found." -ForegroundColor Red
    exit 1
}

$labUrl = "http://127.0.0.1:$selectedPort/"

if (-not $alreadyRunning) {
    Write-Host "Starting Model API Lab..." -ForegroundColor Cyan
    # Trust certificates installed in Windows (important on campus/corporate networks).
    Start-Process -FilePath $bundledNode -ArgumentList @("--use-system-ca", $serverEntry, $selectedPort) -WorkingDirectory $projectRoot -WindowStyle Hidden

    $ready = $false
    for ($attempt = 0; $attempt -lt 120; $attempt++) {
        Start-Sleep -Milliseconds 500
        if (Test-LabReady -Port $selectedPort) {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Write-Host "Startup failed." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Ready. Opening Model API Lab..." -ForegroundColor Green
if ($env:MODEL_API_LAB_NO_BROWSER -ne "1") {
    Start-Process $labUrl
} else {
    Write-Host "Browser launch skipped for verification: $labUrl"
}
