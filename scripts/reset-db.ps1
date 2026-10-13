# 로컬 개발 DB를 처음 상태로 되돌린다. 되돌릴 수 없다.
#
#   .\scripts\reset-db.ps1            지울 대상을 보여 주고, DB 이름을 직접 입력해야 진행한다
#   .\scripts\reset-db.ps1 -DryRun    지울 대상만 보여 주고 아무것도 하지 않는다
#
# 지우는 것:
#   - DB의 public 스키마 전체: 계정, 분석 작업, 저장된 분석 결과, 근거 리뷰, 알림, Flyway 이력
#   - 손님 유형 이미지 파일(backend\storage 아래)
# 그 뒤 Spring을 띄우면 Flyway가 테이블을 처음부터 다시 만든다.
#
# 안전장치:
#   - DB 주소가 이 PC(localhost)가 아니면 하지 않는다.
#   - DB 이름·사용자·포트에 글자·숫자·밑줄·붙임표 밖의 글자가 있으면 하지 않는다.
#   - Spring이 떠 있으면 하지 않는다. 먼저 .\scripts\demo-start.ps1 -Stop 으로 내린다.
#   - 이미지 폴더가 저장소의 backend\storage 아래 하위 폴더가 아니면 파일을 지우지 않는다.
#
# backend\.env 에서 접속 정보를 읽어 쓴다. 비밀번호는 화면에 출력하지 않는다.
# Windows PowerShell 5.1 용이다.

#Requires -PSEdition Desktop

param(
    [switch]$DryRun,
    # 시험용. 다른 환경 파일로 계획만 확인할 때 쓴다.
    [string]$EnvFile
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$springDir = Join-Path $root 'backend\spring-api'
$storageRoot = Join-Path $root 'backend\storage'
if (-not $EnvFile) { $EnvFile = Join-Path $root 'backend\.env' }

function Write-Step($text) { Write-Host ''; Write-Host "== $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "  [확인] $text" -ForegroundColor Green }
function Write-Info($text) { Write-Host "  $text" }
function Stop-WithMessage($text) {
    Write-Host ''
    Write-Host "  [중단] $text" -ForegroundColor Yellow
    Write-Host '  아무것도 지우지 않았어요.'
    exit 1
}

# KEY=VALUE 줄만 읽는다. 값의 앞뒤 따옴표는 뗀다.
function Read-EnvFile($path) {
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $path -Encoding UTF8) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        $index = $trimmed.IndexOf('=')
        if ($index -lt 1) { continue }
        $key = $trimmed.Substring(0, $index).Trim()
        $value = $trimmed.Substring($index + 1).Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }
    return $values
}

function Find-Psql {
    $command = Get-Command 'psql.exe' -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    # 설치 폴더에는 pgAdmin 이 함께 넣은 psql 도 있다. 서버의 bin 폴더 것만 고른다.
    $installed = Get-ChildItem -Path (Join-Path $env:ProgramFiles 'PostgreSQL') -Filter 'psql.exe' -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.DirectoryName -like '*\bin' -and $_.DirectoryName -notlike '*pgAdmin*' } |
        Sort-Object FullName -Descending | Select-Object -First 1
    if ($installed) { return $installed.FullName }
    return $null
}

# psql 은 알림(NOTICE)을 stderr 로 낸다. 5.1 에서는 stderr 를 합치면 오류 레코드가 되어
# $ErrorActionPreference = 'Stop' 과 만나 스크립트가 끝나므로, 이 호출 동안만 낮춘다.
function Invoke-Psql($psql, $db, $sql) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $env:PGPASSWORD = $db.Password
    try {
        $output = & $psql -X -q -t -A -v ON_ERROR_STOP=1 -h $db.Host -p $db.Port -U $db.User -d $db.Name -c $sql 2>&1 |
            ForEach-Object { "$_" }
        return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = @($output) }
    } finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        $ErrorActionPreference = $previous
    }
}

# ---------- 접속 정보 ----------

Write-Step '대상 확인'

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Stop-WithMessage "환경 파일이 없어요: $EnvFile"
}
$settings = Read-EnvFile $EnvFile

# Spring 이 붙는 DB 를 그대로 따른다(application.yml). 주소는 SPRING_DATASOURCE_URL 로만 정해지고,
# 없으면 localhost:5432/scc 다. POSTGRES_DB·POSTGRES_PORT 는 docker compose 용이라 Spring 은 쓰지 않는다.
$db = [pscustomobject]@{
    Host     = 'localhost'
    Port     = '5432'
    Name     = 'scc'
    User     = 'scc'
    Password = ''
}
if ($settings['POSTGRES_USER']) { $db.User = $settings['POSTGRES_USER'] }
if ($settings['POSTGRES_PASSWORD']) { $db.Password = $settings['POSTGRES_PASSWORD'] }

$jdbc = $settings['SPRING_DATASOURCE_URL']
if ($jdbc) {
    if ($jdbc -match '^jdbc:postgresql://(?<host>[^:/?]+)(:(?<port>\d+))?/(?<name>[^?]+)') {
        $db.Host = $Matches['host']
        if ($Matches['port']) { $db.Port = $Matches['port'] }
        $db.Name = $Matches['name']
    } else {
        Stop-WithMessage 'SPRING_DATASOURCE_URL 을 읽지 못했어요. jdbc:postgresql://호스트:포트/DB이름 모양이어야 해요.'
    }
}

$localHosts = @('localhost', '127.0.0.1')
if ($localHosts -notcontains $db.Host.ToLowerInvariant()) {
    Stop-WithMessage "DB 주소가 이 PC 가 아니에요($($db.Host)). 이 스크립트는 로컬 DB 만 지워요."
}
# psql 은 -d 값에 '=' 가 있으면 접속 문자열로 읽어 -h 를 무시한다. 이름에 쓸 수 있는 글자만 받는다.
$plain = '^[A-Za-z0-9_-]+$'
if ($db.Name -notmatch $plain -or $db.User -notmatch $plain -or $db.Port -notmatch '^\d+$') {
    Stop-WithMessage 'DB 이름·사용자·포트에 쓸 수 없는 글자가 있어요. 글자·숫자·밑줄·붙임표만 받아요.'
}
if ($jdbc -and $jdbc -match 'currentSchema') {
    Stop-WithMessage 'SPRING_DATASOURCE_URL 에 currentSchema 가 있어요. 이 스크립트는 public 스키마만 지우므로 Spring 이 쓰는 스키마와 달라요.'
}
if (-not $db.Password) {
    Stop-WithMessage '환경 파일에 POSTGRES_PASSWORD 가 없어요.'
}

# 이미지 폴더. Spring 은 backend\spring-api 를 기준으로 상대 경로를 푼다.
$imageSetting = $settings['ANALYSIS_IMAGE_STORAGE_PATH']
if (-not $imageSetting) { $imageSetting = '../storage/personas' }
if ([System.IO.Path]::IsPathRooted($imageSetting)) {
    $imageDir = [System.IO.Path]::GetFullPath($imageSetting)
} else {
    $imageDir = [System.IO.Path]::GetFullPath((Join-Path $springDir $imageSetting))
}
# backend\storage 자체가 아니라 그 아래 하위 폴더일 때만 지운다. storage 에 다른 것이 생겨도 함께 지우지 않게 한다.
$storagePrefix = [System.IO.Path]::GetFullPath($storageRoot).TrimEnd('\') + '\'
$imageDirFull = $imageDir.TrimEnd('\') + '\'
$imageDirIsSafe = $imageDirFull.StartsWith($storagePrefix, [System.StringComparison]::OrdinalIgnoreCase) -and
    ($imageDirFull.Length -gt $storagePrefix.Length)
$imageCount = 0
if ((Test-Path -LiteralPath $imageDir) -and $imageDirIsSafe) {
    $imageCount = @(Get-ChildItem -LiteralPath $imageDir -Recurse -File -ErrorAction SilentlyContinue).Count
}

Write-Info "DB        : $($db.Name) ($($db.Host):$($db.Port), 사용자 $($db.User))"
Write-Info '지울 것   : public 스키마 전체 (계정, 분석 작업, 저장된 결과, 근거 리뷰, 알림, Flyway 이력)'
if ($imageDirIsSafe) {
    Write-Info "이미지    : $imageDir (파일 $imageCount 개)"
} else {
    Write-Info "이미지    : $imageDir (저장소의 backend\storage 아래 하위 폴더가 아니라 지우지 않아요)"
}

if ($DryRun) {
    Write-Host ''
    Write-Host '  -DryRun 이라 여기서 끝내요. 아무것도 지우지 않았어요.'
    exit 0
}

# ---------- 실행 전 확인 ----------

$springPort = 8080
if ($settings['SERVER_PORT'] -match '^\d+$') { $springPort = [int]$settings['SERVER_PORT'] }
if (@(Get-NetTCPConnection -LocalPort $springPort -State Listen -ErrorAction SilentlyContinue).Count -gt 0) {
    Stop-WithMessage "Spring 이 떠 있어요($springPort 포트). 먼저 .\scripts\demo-start.ps1 -Stop 으로 내려 주세요."
}

$psql = Find-Psql
if (-not $psql) {
    Stop-WithMessage 'psql.exe 를 찾지 못했어요. PostgreSQL 설치 폴더의 bin 을 PATH 에 넣어 주세요.'
}

$before = Invoke-Psql $psql $db "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
if ($before.ExitCode -ne 0) {
    Stop-WithMessage "DB 에 접속하지 못했어요: $($before.Output | Select-Object -Last 1)"
}
Write-Info "지금 테이블: $($before.Output | Select-Object -Last 1) 개"

Write-Host ''
Write-Host '  되돌릴 수 없어요. 계정과 분석 결과가 모두 사라져요.' -ForegroundColor Yellow
$typed = Read-Host "  계속하려면 DB 이름($($db.Name))을 그대로 입력하세요"
if ($typed -cne $db.Name) {
    Stop-WithMessage '입력이 DB 이름과 달라요.'
}

# ---------- 지우기 ----------

Write-Step 'DB 지우기'

# 한 번에 보내는 문장들은 한 트랜잭션으로 실행돼 실패하면 모두 되돌려진다.
# 다른 접속이 테이블을 붙들고 있으면 끝없이 기다리지 않고 10초 뒤 실패한다.
$reset = Invoke-Psql $psql $db "SET lock_timeout = '10s'; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
if ($reset.ExitCode -ne 0) {
    Write-Host "  [문제] 스키마를 지우지 못했어요: $($reset.Output | Select-Object -Last 1)" -ForegroundColor Yellow
    Write-Host '  DB 는 바뀌지 않았어요. DB 를 쓰는 다른 프로그램을 끄고 다시 실행하세요.'
    exit 1
}

$after = Invoke-Psql $psql $db "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
$remaining = "$($after.Output | Select-Object -Last 1)".Trim()
if ($after.ExitCode -eq 0 -and $remaining -eq '0') {
    Write-Ok 'public 스키마를 비웠어요.'
} else {
    Write-Host "  [문제] 지운 뒤에도 테이블이 남아 있어요($remaining 개)." -ForegroundColor Yellow
    exit 1
}

Write-Step '이미지 지우기'

if (-not $imageDirIsSafe) {
    Write-Info '이미지 폴더가 backend\storage 밖이라 건드리지 않았어요. 필요하면 직접 지우세요.'
} elseif (-not (Test-Path -LiteralPath $imageDir)) {
    Write-Info '이미지 폴더가 없어요. 지울 것이 없어요.'
} else {
    # 링크(junction·심볼릭 링크)는 따라가지 않는다. 링크가 가리키는 폴더까지 지워질 수 있다.
    $entries = @(Get-ChildItem -LiteralPath $imageDir -Force)
    $links = @($entries | Where-Object { $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint })
    $targets = @($entries | Where-Object { -not ($_.Attributes -band [System.IO.FileAttributes]::ReparsePoint) })
    try {
        $targets | Remove-Item -Recurse -Force
        Write-Ok "이미지 파일 $imageCount 개를 지웠어요."
    } catch {
        # DB 는 이미 비었다. 여기서 끝내지 않고 남은 일을 알려 준다.
        Write-Host "  [문제] 이미지 파일을 모두 지우지 못했어요: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "  DB 는 비웠어요. 남은 파일은 $imageDir 에서 직접 지우거나 이 스크립트를 다시 실행하세요."
    }
    if ($links.Count -gt 0) {
        Write-Info "링크 $($links.Count)개는 건드리지 않았어요."
    }
}

Write-Step '끝'

Write-Host '  DB 가 비었어요. 다음에 Spring 을 띄우면 테이블이 다시 만들어져요.'
Write-Host '  계정이 모두 사라졌으니 가입을 허용한 채 띄워야 새로 만들 수 있어요:'
Write-Host '    .\scripts\demo-start.ps1 -AllowSignup'
Write-Host '  기기의 앱에는 예전 로그인 정보가 남아 있어 "로그인이 만료됐어요"가 한 번 보일 수 있어요.'
