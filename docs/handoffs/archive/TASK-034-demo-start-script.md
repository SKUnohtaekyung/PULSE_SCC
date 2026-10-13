# TASK-034 — 시연 당일 한 번에 실행하는 스크립트

## Status

리뷰 대기. 스크립트를 만들어 이 PC에서 세 경우(이미 떠 있음, 내리기, 처음부터 띄우기)를 실행해 봤다. 실제 태블릿을 꽂은 상태로는 돌려 보지 않았다.

## Owner

role:platform — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`chore/TASK-034-demo-start-script` — `main`의 `ca0d16c`(PR #48 병합)에서 갈라졌다.

## Goal

졸업작품 전시 당일, 노트북에서 서버 두 개를 띄우고 태블릿을 서버에 잇는 일을 명령 하나로 한다(2026-10-12 사용자 요청). 서버는 배포하지 않고 노트북에서만 돌린다.

관련 이슈: 미생성(사용자의 구두 요청으로 시작했다)
관련 요구사항: 해당 없음(시연 운영 도구). 배경은 [TASK-030](../active/TASK-030-android-apk-build.md)의 USB 연결 결정

## Completed

- `scripts\demo-start.ps1` — 준비 확인 → 서버 띄우기 → Google 로그인 설정 확인 → 노트북 인터넷 확인 → 기기 연결을 차례로 하고, 문제가 있으면 마지막에 모아 보여 준다.
- `scripts\demo-start.cmd` — 더블클릭용. 인자를 그대로 넘긴다.

## Changed

- `scripts/demo-start.ps1`, `scripts/demo-start.cmd` — 신규
- `.gitattributes` — `*.cmd`는 CRLF로 체크아웃
- `docs/handoffs/active/TASK-030-android-apk-build.md` — 실행 방법 메모에 스크립트 안내 한 줄

## Decisions

- **Windows PowerShell 5.1에서 돈다.** 이 PC의 기본 셸이다. 스크립트 파일은 한글이 깨지지 않게 UTF-8 BOM으로 저장했다.
- **서버는 새 창 두 개에서 띄운다.** 시연 중 오류가 나면 그 창에서 로그를 바로 볼 수 있고, 스크립트가 끝나도 서버는 남는다.
- **다시 실행해도 안전하게 했다.** 이미 떠 있는 서버(포트 8080·8000을 듣는 프로세스)는 그대로 두고 기기 연결만 다시 한다. `adb reverse`는 태블릿을 꽂을 때마다 해야 하기 때문이다.
- **`backend\.env`의 내용을 읽지 않는다.** 파일이 있는지만 본다. Google 로그인이 설정됐는지는 가짜 토큰을 서버에 보내 응답 코드로 판단한다(`GOOGLE_AUTH_NOT_CONFIGURED` / `INVALID_GOOGLE_ID_TOKEN`).
- **`-Stop`은 포트 8080·8000을 듣는 프로세스를 자식까지 끝낸다.** 다른 프로그램이 그 포트를 쓰고 있어도 끝내므로 시연용 노트북에서만 쓴다.
- 새 계정 가입 허용(`-AllowSignup`)은 기본으로 켜지 않는다. 서버 기본값(가입 닫힘)을 따른다.
- APK 빌드는 스크립트에 넣지 않았다. 오래 걸리고 서명 키·클라이언트 ID가 얽혀 있어 미리 해 둔다(TASK-030).

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint·typecheck·test | 없음 | PowerShell 스크립트에 대한 검증 명령이 프로젝트에 없다 |
| 문법 | `[System.Management.Automation.Language.Parser]::ParseFile` | PASS — 오류 0 |
| 이미 떠 있을 때 | `.\scripts\demo-start.ps1` (서버 두 개 실행 중, 에뮬레이터 연결) | PASS — 서버를 다시 띄우지 않고 모든 항목 확인, 종료 코드 0 |
| 내리기 | `.\scripts\demo-start.ps1 -Stop` | PASS — 8080의 java, 8000의 python을 끝냄, 종료 코드 0 |
| 처음부터 | `.\scripts\demo-start.ps1` (서버 없음) | PASS — 새 창에서 두 서버를 띄우고 응답을 기다린 뒤 Google 설정·인터넷·기기 연결 확인, 종료 코드 0. 포트를 듣는 프로세스의 시작 시각이 실행 시각과 맞는 것을 확인했다 |
| `-InstallApk` | `.\scripts\demo-start.ps1 -InstallApk` (에뮬레이터) | PASS — APK 설치 뒤 포트 연결, 종료 코드 0 |
| adb 실패 처리 | 스크립트의 `Invoke-Adb` 함수만 떼어 `$ErrorActionPreference = 'Stop'` 아래에서 없는 기기로 설치 시도 | PASS — 종료 코드 1과 `device 'no-such-serial' not found`를 돌려주고 실행이 이어짐. 고치기 전에는 여기서 스크립트가 끝났다(reviewer 재현) |
| 고친 뒤 다시 | `-Stop` 뒤 `.\scripts\demo-start.ps1` | PASS — 새 창에서 두 서버가 뜨고 전 항목 확인, 종료 코드 0. 결과 문구에서 창 개수가 빠져 나오는 것을 발견해 고쳤다(`$openedWindows개에서`가 한 변수 이름으로 읽혔다). 고친 문구는 따로 떼어 확인했고 전체 실행은 다시 하지 않았다 |
| 실패 경로 | 미실행 | `.env` 없음, PostgreSQL 멈춤, 서버가 뜨지 않음, Google 설정 없음, 인터넷 없음, 기기 없음·미허가, APK 없음, 실제 설치 실패의 안내가 전체 실행에서 나오는지 보지 않았다 |
| `-AllowSignup`·`demo-start.cmd` | 미실행 | |
| 실제 태블릿 | 미실행 | 기기 연결은 에뮬레이터(`emulator-5554`)로만 확인했다 |
| 독립 검토 | `reviewer` 서브에이전트 2회 | 1차 FAIL — `adb install`의 stderr가 5.1에서 스크립트 전체를 끝냄 → `Invoke-Adb`로 고친 뒤 2차 PASS(정적 검토와 함수 단위 분리 시험 근거). 권고(Google 판정 보조, 띄우지 못한 서버 대기 생략, 창 명령 인코딩, `-Stop` 결과 확인, DB를 5432 포트로 확인, 패키지 정확 일치, 결과 문구)도 반영했다 |

## Unresolved

- 실패 경로와 `-AllowSignup`, 더블클릭 실행을 돌려 보지 않았다.
- Google 설정이 없을 때의 응답(`503 GOOGLE_AUTH_NOT_CONFIGURED`)을 스크립트가 제대로 읽는지는 실행으로 확인하지 못했다. 본문을 읽지 못하면 상태 코드 503으로 판정하도록 보조 판정을 뒀다.
- `-Stop` 뒤 Spring을 띄웠던 창(gradlew)이 남는다. 닫아도 된다고 안내만 한다.
- PR #41(로그인 시도 제한)이 병합되면 Google 설정 확인용 가짜 토큰 요청이 시도 횟수에 잡히는지 봐야 한다.
- 실제 태블릿에서 돌려 보지 않았다.
- DB는 5432 포트로만 확인한다. `POSTGRES_PORT`를 바꾼 PC에서는 DB가 떠 있어도 Spring을 띄우지 않는다. 시연 노트북은 기본 포트다.
- 태블릿의 인터넷은 확인하지 않는다. Google 로그인은 태블릿도 인터넷에 연결돼 있어야 한다.
- `.gitattributes`가 `* text=auto eol=lf`라 다른 PC에서는 `.ps1`이 LF로 체크아웃된다. LF로 바꾼 사본이 5.1 파서에서 오류 없이 읽히는 것까지만 확인했다(실행은 하지 않았다).

## Do Not Assume

- 마지막의 "서버가 응답하고 기기가 이어졌어요"는 말 그대로의 뜻이다. 앱에서 로그인·분석이 실제로 되는지는 확인하지 않는다.
- 이 PC에서 Google 로그인이 "설정돼 있어요"로 나온 것은 `backend\.env`에 값이 있다는 뜻이다(2026-10-12 스크립트로 띄운 서버에서 확인). 다른 PC에서는 다를 수 있다.

## Next Action

- PR을 만든다. 태블릿을 꽂고 한 번 돌려 본다.

## Last Verified Commit

`7514510`(base `ca0d16c`). 위 실행은 커밋 전 작업 폴더의 스크립트로 했고, 마지막 전체 실행 뒤에 결과 문구 한 줄을 고쳤다.
