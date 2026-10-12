# 전시 시연 준비를 한 번에 한다. 저장소 어디에서 실행해도 된다.
#
#   .\scripts\demo-start.ps1                 서버 두 개를 띄우고 연결된 기기에 포트를 잇는다
#   .\scripts\demo-start.ps1 -InstallApk     위에 더해 빌드해 둔 APK를 기기에 설치한다
#   .\scripts\demo-start.ps1 -AllowSignup    새 계정 가입을 허용한 채 Spring을 띄운다
#   .\scripts\demo-start.ps1 -Stop           서버 포트(8080·8000)를 듣는 프로세스를 끝낸다
#
# 다시 실행해도 안전하다. 이미 떠 있는 서버는 그대로 두고 기기 연결만 다시 한다.
# 태블릿을 뽑았다 꽂았으면 다시 실행한다 — 포트 연결(adb reverse)은 기기를 꽂을 때마다 해야 한다.
#
# backend\.env 의 내용은 읽지 않는다. Google 로그인 설정 여부는 서버에 물어서 확인한다.
# Windows PowerShell 5.1 용이다. demo-start.cmd 는 항상 powershell.exe 로 실행한다.

#Requires -PSEdition Desktop

param(
    [switch]$InstallApk,
    [switch]$AllowSignup,
    [switch]$Stop
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$springDir = Join-Path $root 'backend\spring-api'
$pythonDir = Join-Path $root 'backend\python-analysis'
$envFile = Join-Path $root 'backend\.env'
$pythonExe = Join-Path $pythonDir '.venv\Scripts\python.exe'
$apk = Join-Path $root 'frontend\mobile\android\app\build\outputs\apk\release\app-release.apk'
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'

$springPort = 8080
$pythonPort = 8000
$springHealth = "http://localhost:$springPort/actuator/health"
$pythonHealth = "http://127.0.0.1:$pythonPort/internal/v1/health"

$problems = New-Object System.Collections.Generic.List[string]

function Write-Step($text) { Write-Host ''; Write-Host "== $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "  [확인] $text" -ForegroundColor Green }
function Write-Info($text) { Write-Host "  $text" }
function Write-Problem($text) {
    Write-Host "  [문제] $text" -ForegroundColor Yellow
    $problems.Add($text)
}

function Get-Listener($port) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique
}

function Test-Url($url, $timeoutSec) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec $timeoutSec
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# 인터넷의 주소에 닿는지만 본다. 4xx·5xx 응답도 '닿았다'로 친다.
function Test-Reachable($url) {
    try {
        Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 6 | Out-Null
        return $true
    } catch [System.Net.WebException] {
        return $null -ne $_.Exception.Response
    } catch {
        return $false
    }
}

function Wait-Url($url, $seconds) {
    $deadline = (Get-Date).AddSeconds($seconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-Url $url 3) { return $true }
        Write-Host '.' -NoNewline
        Start-Sleep -Seconds 3
    }
    return $false
}

function Start-InWindow($title, $directory, $command) {
    # 경로에 공백이나 작은따옴표가 있어도 깨지지 않게 명령을 인코딩해 넘긴다.
    $safeDirectory = $directory -replace "'", "''"
    $script = "`$Host.UI.RawUI.WindowTitle = '$title'; Set-Location -LiteralPath '$safeDirectory'; $command"
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $encoded | Out-Null
}

# adb 는 실패 이유를 stderr 로 낸다. 5.1 에서는 stderr 를 합치면 오류 레코드가 되어
# $ErrorActionPreference = 'Stop' 과 만나 스크립트가 끝나므로, 이 호출 동안만 낮춘다.
function Invoke-Adb {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $output = & $adb @args 2>&1 | ForEach-Object { "$_" }
        return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = @($output) }
    } finally {
        $ErrorActionPreference = $previous
    }
}

# ---------- 내리기 ----------

if ($Stop) {
    Write-Step '서버 내리기'
    foreach ($port in @($springPort, $pythonPort)) {
        $owners = @(Get-Listener $port)
        if ($owners.Count -eq 0) {
            Write-Info "$port 포트에 떠 있는 서버가 없어요."
            continue
        }
        foreach ($owner in $owners) {
            $name = (Get-Process -Id $owner -ErrorAction SilentlyContinue).ProcessName
            # 자식 프로세스까지 함께 끝낸다. Python은 실행 파일이 자식을 하나 더 띄운다.
            & taskkill.exe /PID $owner /T /F | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Ok "$port 포트의 $name (PID $owner) 을 끝냈어요."
            } else {
                Write-Problem "$port 포트의 $name (PID $owner) 을 끝내지 못했어요."
            }
        }
    }
    Write-Host ''
    Write-Host '서버 창이 남아 있으면 닫아도 돼요.'
    if ($problems.Count -gt 0) { exit 1 }
    exit 0
}

# ---------- 준비 확인 ----------

Write-Step '준비 확인'

$hasEnv = Test-Path -LiteralPath $envFile
if ($hasEnv) {
    Write-Ok 'backend\.env 파일이 있어요.'
} else {
    Write-Problem 'backend\.env 파일이 없어요. backend\.env.example 을 복사해 값을 채워야 서버가 떠요.'
}

$hasPython = Test-Path -LiteralPath $pythonExe
if ($hasPython) {
    Write-Ok 'Python 가상 환경이 있어요.'
} else {
    Write-Problem "Python 가상 환경이 없어요. AGENTS.md 3장의 'Python install' 명령을 먼저 실행하세요."
}

# DB 는 Windows 서비스로 띄웠든 docker compose 로 띄웠든 5432 포트를 듣는다.
$hasDatabase = @(Get-Listener 5432).Count -gt 0
if ($hasDatabase) {
    Write-Ok 'PostgreSQL 이 떠 있어요(5432 포트).'
} else {
    $postgres = @(Get-Service -Name 'postgresql*' -ErrorAction SilentlyContinue)
    if ($postgres.Count -gt 0) {
        Write-Problem "PostgreSQL 이 떠 있지 않아요. 관리자 PowerShell에서 Start-Service $($postgres[0].Name) 을 실행하세요."
    } else {
        Write-Problem "PostgreSQL 이 떠 있지 않아요. AGENTS.md 3장의 'PostgreSQL 시작' 명령으로 띄우세요."
    }
}

# ---------- 서버 띄우기 ----------

Write-Step '서버 띄우기'

# 떠 있거나 방금 띄운 서버만 기다린다. 띄울 수 없는 서버를 몇 분씩 기다리지 않는다.
$waitPython = $false
$waitSpring = $false
$openedWindows = 0

if (@(Get-Listener $pythonPort).Count -gt 0) {
    Write-Ok "분석 서비스가 이미 떠 있어요($pythonPort 포트)."
    $waitPython = $true
} elseif ($hasEnv -and $hasPython) {
    Start-InWindow 'PULSE 분석 서비스 (Python)' $pythonDir '.\.venv\Scripts\python.exe -m scc_analysis'
    Write-Info '분석 서비스를 새 창에서 띄웠어요.'
    $waitPython = $true
    $openedWindows++
} else {
    Write-Info '위 문제 때문에 분석 서비스를 띄우지 않았어요.'
}

if (@(Get-Listener $springPort).Count -gt 0) {
    Write-Ok "Spring이 이미 떠 있어요($springPort 포트)."
    $waitSpring = $true
    if ($AllowSignup) {
        Write-Problem '-AllowSignup 은 Spring을 새로 띄울 때만 적용돼요. 먼저 -Stop 으로 내린 뒤 다시 실행하세요.'
    }
} elseif ($hasEnv -and $hasDatabase) {
    $command = '.\gradlew.bat bootRun'
    if ($AllowSignup) {
        $command = "`$env:LEGAL_REGISTRATION_ENABLED = 'true'; $command"
        Write-Info '새 계정 가입을 허용한 채 띄워요.'
    }
    Start-InWindow 'PULSE API (Spring)' $springDir $command
    Write-Info 'Spring을 새 창에서 띄웠어요. 처음에는 1분쯤 걸려요.'
    $waitSpring = $true
    $openedWindows++
} else {
    Write-Info '위 문제 때문에 Spring을 띄우지 않았어요.'
}

$pythonUp = $false
$springUp = $false
if ($waitPython -or $waitSpring) {
    Write-Host '  기다리는 중' -NoNewline
    if ($waitPython) { $pythonUp = Wait-Url $pythonHealth 60 }
    if ($waitSpring) { $springUp = Wait-Url $springHealth 240 }
    Write-Host ''
}

if ($pythonUp) { Write-Ok '분석 서비스가 응답해요.' } elseif ($waitPython) { Write-Problem "분석 서비스가 응답하지 않아요. 'PULSE 분석 서비스' 창의 오류를 확인하세요." }
if ($springUp) { Write-Ok 'Spring이 응답해요.' } elseif ($waitSpring) { Write-Problem "Spring이 응답하지 않아요. 'PULSE API' 창의 오류를 확인하세요." }

# ---------- Google 로그인 설정 ----------

Write-Step 'Google 로그인'

if ($springUp) {
    # 가짜 토큰을 보낸다. 설정이 없으면 서버가 '설정되지 않음'으로, 있으면 '토큰이 틀림'으로 답한다.
    $code = ''
    $status = 0
    try {
        Invoke-WebRequest -Uri "http://localhost:$springPort/api/v1/auth/google" -Method Post `
            -ContentType 'application/json' -Body '{"idToken":"demo-start-check"}' `
            -UseBasicParsing -TimeoutSec 10 | Out-Null
    } catch [System.Net.WebException] {
        $response = $_.Exception.Response
        if ($null -ne $response) {
            $status = [int]$response.StatusCode
            # 5.1 은 응답 방식에 따라 본문을 미리 읽어 ErrorDetails 에 넣는다. 두 곳을 모두 본다.
            $body = ''
            if ($null -ne $_.ErrorDetails) { $body = "$($_.ErrorDetails.Message)" }
            if (-not $body) {
                $stream = $response.GetResponseStream()
                if ($stream.CanSeek) { $stream.Position = 0 }
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Dispose()
            }
            if ($body -match '"code"\s*:\s*"([A-Z_]+)"') { $code = $Matches[1] }
        }
    } catch {
        $code = ''
    }

    # 본문을 읽지 못했으면 상태 코드로 본다: 설정 없음은 503, 가짜 토큰 거절은 401 이다.
    if ($code -eq 'INVALID_GOOGLE_ID_TOKEN' -or (-not $code -and $status -eq 401)) {
        Write-Ok '서버에 Google 로그인이 설정돼 있어요.'
    } elseif ($code -eq 'GOOGLE_AUTH_NOT_CONFIGURED' -or (-not $code -and $status -eq 503)) {
        Write-Problem 'Google 로그인이 꺼져 있어요. backend\.env 에 GOOGLE_CLIENT_ID 를 넣고 -Stop 뒤 다시 실행하세요. 이메일 로그인은 돼요.'
    } else {
        Write-Problem "Google 로그인 설정을 확인하지 못했어요(서버 응답: $status '$code')."
    }
} else {
    Write-Info 'Spring이 떠야 확인할 수 있어요.'
}

# ---------- 인터넷 ----------

Write-Step '노트북 인터넷'

$targets = @(
    @{ Name = 'Google (로그인 확인)'; Url = 'https://www.googleapis.com/oauth2/v3/certs' },
    @{ Name = '네이버 플레이스 (리뷰 수집)'; Url = 'https://pcmap.place.naver.com' },
    @{ Name = 'OpenAI (분석·그림)'; Url = 'https://api.openai.com' }
)
foreach ($target in $targets) {
    if (Test-Reachable $target.Url) {
        Write-Ok "$($target.Name) 에 닿아요."
    } else {
        Write-Problem "$($target.Name) 에 닿지 않아요. 새 분석이나 Google 로그인이 안 될 수 있어요."
    }
}
Write-Info 'Google 로그인은 태블릿도 인터넷에 연결돼 있어야 해요. 이 스크립트는 태블릿의 인터넷은 확인하지 않아요.'

# ---------- 기기 ----------

Write-Step '기기 연결'

$connected = New-Object System.Collections.Generic.List[string]
if (-not (Test-Path -LiteralPath $adb)) {
    Write-Problem "adb 를 찾지 못했어요($adb). Android SDK platform-tools 를 설치하세요."
} else {
    $lines = (Invoke-Adb devices).Output | Where-Object { $_ -match '\t' }
    $ready = @($lines | Where-Object { $_ -match '\tdevice$' } | ForEach-Object { ($_ -split '\t')[0] })
    $waiting = @($lines | Where-Object { $_ -notmatch '\tdevice$' })

    foreach ($line in $waiting) {
        Write-Problem "기기가 준비되지 않았어요: $line — 태블릿 화면의 'USB 디버깅 허용' 창에서 허용을 눌렀는지 확인하세요."
    }

    if ($ready.Count -eq 0) {
        Write-Problem '연결된 기기가 없어요. 태블릿을 USB로 꽂고 USB 디버깅을 켠 뒤 다시 실행하세요.'
    }

    foreach ($serial in $ready) {
        if ($InstallApk) {
            if (Test-Path -LiteralPath $apk) {
                Write-Info "$serial 에 APK를 설치하는 중이에요."
                $install = Invoke-Adb -s $serial install -r $apk
                if ($install.ExitCode -eq 0 -and ($install.Output -match 'Success')) {
                    Write-Ok "$serial 에 APK를 설치했어요."
                } else {
                    Write-Problem "$serial 에 APK를 설치하지 못했어요: $($install.Output | Select-Object -Last 1)"
                }
            } else {
                Write-Problem 'APK 파일이 없어요. 먼저 빌드해야 해요(docs\handoffs 의 TASK-030 문서 참고).'
            }
        }

        $reverse = Invoke-Adb -s $serial reverse "tcp:$springPort" "tcp:$springPort"
        if ($reverse.ExitCode -eq 0) {
            Write-Ok "$serial 의 앱이 노트북 서버에 닿게 이었어요."
            $connected.Add($serial)
        } else {
            Write-Problem "$serial 에 포트를 잇지 못했어요: $($reverse.Output | Select-Object -Last 1)"
        }

        $packages = (Invoke-Adb -s $serial shell pm list packages kr.co.scc.pulse).Output
        if (@($packages | Where-Object { $_.Trim() -eq 'package:kr.co.scc.pulse' }).Count -eq 0) {
            Write-Problem "$serial 에 PULSE 앱이 없어요. -InstallApk 를 붙여 다시 실행하세요."
        }
    }
}

# ---------- 정리 ----------

Write-Step '결과'

if ($problems.Count -eq 0) {
    Write-Host "  서버가 응답하고 기기($($connected -join ', '))가 이어졌어요. 그 기기에서 PULSE 앱을 열면 돼요." -ForegroundColor Green
} else {
    Write-Host "  확인할 것이 $($problems.Count)개 있어요." -ForegroundColor Yellow
    foreach ($problem in $problems) { Write-Host "   - $problem" -ForegroundColor Yellow }
}
Write-Host ''
if ($openedWindows -gt 0) {
    Write-Host "  서버는 새로 열린 창 $($openedWindows)개에서 돌아요. 창을 닫지 마세요."
} else {
    Write-Host '  서버는 전부터 떠 있던 것을 그대로 썼어요.'
}
Write-Host '  태블릿을 뽑았다 꽂았으면 이 스크립트를 다시 실행하세요.'
Write-Host '  끝낼 때: .\scripts\demo-start.ps1 -Stop'

if ($problems.Count -gt 0) { exit 1 }
