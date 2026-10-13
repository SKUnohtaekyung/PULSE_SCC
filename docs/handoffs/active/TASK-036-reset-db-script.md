# TASK-036 — 로컬 DB 전체 초기화 스크립트

## Status

리뷰 대기. 스크립트를 만들어 버리는 용도의 Postgres 컨테이너로 지우는 동작까지 시험했다. **이 PC의 실제 DB에는 실행하지 않았다** — 실행은 사용자가 한다.

## Owner

role:platform — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`chore/TASK-036-reset-db-script` — `main`의 `28d4210`(PR #50 병합)에서 갈라졌다.

## Goal

시연 전에 로컬 DB를 깨끗한 상태로 되돌린다(2026-10-13 사용자 요청: 전체 초기화, 스크립트로). 계정·분석 결과와 손님 유형 이미지 파일을 모두 지우고, 다음에 Spring을 띄우면 Flyway가 테이블을 다시 만들게 한다.

관련 이슈: 미생성(사용자의 구두 요청으로 시작했다)
관련 요구사항: 해당 없음(개발·시연 운영 도구)

## Completed

- `scripts\reset-db.ps1` — 지울 대상을 보여 주고, DB 이름을 직접 입력받은 뒤 `public` 스키마를 지우고 다시 만든다. 이어서 손님 유형 이미지 파일을 지운다.
- `scripts\reset-db.cmd` — 실행 정책에 막히지 않게 여는 용도. 인자를 그대로 넘긴다.

## Changed

- `scripts/reset-db.ps1`, `scripts/reset-db.cmd` — 신규

## Decisions

- **`backend\.env`에서 접속 정보를 읽는다.** 비밀번호는 화면에 출력하지 않고, `psql`에는 환경 변수(`PGPASSWORD`)로 넘긴 뒤 지운다. Agent는 이 파일을 읽을 수 없어, 실제 파일로 스크립트를 실행하는 것은 사용자가 한다.
- **스키마를 통째로 지운다**(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`). Flyway 이력도 함께 사라지므로 다음 기동 때 V1부터 다시 적용된다. 마이그레이션은 확장(extension)을 쓰지 않아 다시 만드는 데 필요한 것이 없다(2026-10-13 `db/migration` 검색).
- **안전장치**: DB 주소가 `localhost`·`127.0.0.1`이 아니면 중단. DB 이름·사용자·포트에 글자·숫자·밑줄·붙임표 밖의 글자가 있으면 중단(`psql -d`가 `=`가 든 값을 접속 문자열로 읽어 주소 확인을 우회할 수 있다 — reviewer 재현). URL에 `currentSchema`가 있으면 중단. Spring이 떠 있으면(`SERVER_PORT`, 기본 8080) 중단. DB 이름을 대소문자까지 그대로 입력해야 진행. 이미지 폴더가 저장소 `backend\storage`의 하위 폴더가 아니면 파일을 지우지 않고, 링크는 따라가지 않는다.
- **접속 대상은 Spring과 같은 규칙으로 정한다.** 주소는 `SPRING_DATASOURCE_URL`로만 정하고 없으면 `localhost:5432/scc`다. `POSTGRES_DB`·`POSTGRES_PORT`는 Spring이 쓰지 않으므로 보지 않는다(`application.yml`).
- 스키마를 지우는 문장은 한 트랜잭션이라 실패하면 아무것도 바뀌지 않는다. 다른 접속이 테이블을 붙들고 있으면 10초 뒤 실패한다(`lock_timeout`).
- **`-DryRun`** 은 지울 대상만 보여 주고 끝낸다. DB에 접속하지 않는다.
- **`-EnvFile`** 은 시험용이다. 다른 환경 파일을 가리켜 실제 `.env`를 건드리지 않고 시험할 수 있게 한다.
- Spring을 직접 내리지 않는다. 내리는 것은 `demo-start.ps1 -Stop`의 일이다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint·typecheck·test | 없음 | PowerShell 스크립트에 대한 검증 명령이 프로젝트에 없다 |
| 문법 | `[System.Management.Automation.Language.Parser]::ParseFile` | PASS — 오류 0 |
| 계획만 보기 | `reset-db.ps1 -DryRun -EnvFile <시험용 파일>` | PASS — DB·사용자·이미지 폴더와 파일 수를 보여 주고 종료 코드 0. 비밀번호는 출력되지 않음 |
| 원격 주소 거부 | 시험용 파일의 주소를 `db.example.com`으로 | PASS — 중단, 종료 코드 1 |
| 저장소 밖 이미지 폴더 | 시험용 파일의 이미지 경로를 `C:/Windows/Temp/...`로 | PASS — "지우지 않아요"로 표시 |
| 환경 파일 없음 | 없는 경로 | PASS — 중단, 종료 코드 1 |
| Spring이 떠 있을 때 | 서버 실행 중에 시험용 파일로 실행 | PASS — 중단, 종료 코드 1 |
| 확인 입력이 다를 때 | 버리는 용도의 Postgres 18.6 컨테이너(포트 55432)에 테이블 3개, `backend\storage\_reset_test`에 파일 2개를 두고 다른 이름 입력 | PASS — 중단. 테이블 3개·파일 2개 그대로 |
| 지우기 | 같은 조건에서 DB 이름을 맞게 입력 | PASS — 테이블 0개, 시험 폴더의 파일 0개, 종료 코드 0. 실제 이미지 폴더(`personas`, 19개 항목)는 그대로. 지운 뒤 새 테이블을 만들 수 있음 |
| 비밀번호가 틀릴 때 | 시험용 파일의 비밀번호를 바꿔 실행 | PASS — "DB에 접속하지 못했어요"로 중단, 종료 코드 1 |
| 실제 DB | 미실행 | 이 PC의 `backend\.env`와 실제 DB로는 돌리지 않았다 |
| 지운 뒤 Spring 기동 | 미실행 | 비운 스키마에 Flyway가 V1~V6을 다시 적용하는 것은 시험 컨테이너에서도 해 보지 않았다. 통합 테스트(`InitialSchemaMigrationTests`)가 빈 스키마에서 같은 일을 한다 |
| `reset-db.cmd` | 미실행 | |
| 독립 검토 | `reviewer` 서브에이전트 | PASS — 반드시 고칠 것 없음. 안전 권고(DB 이름 허용 글자, `backend\storage` 루트 제외, 이미지 삭제 실패 안내, 링크 건너뛰기, Spring 기본 주소, `SERVER_PORT`, `lock_timeout`, 문구)를 반영했다 |
| 권고 반영 뒤 | 가짜 환경 파일과 같은 시험 컨테이너로 다시 실행 | PASS — DB 이름 자리에 접속 문자열(`dbname=fake host=...`)을 넣으면 중단, `currentSchema`가 있으면 중단, 이미지 경로가 `../storage`면 "지우지 않아요", URL이 없으면 `POSTGRES_DB`·`POSTGRES_PORT`를 무시하고 `scc (localhost:5432)`를 대상으로 표시. 지우기: 테이블 0개, 시험 폴더 파일 0개, 실제 `personas`(19개 항목) 그대로, 종료 코드 0. 이 시험은 서버를 내리지 않고 했다(시험용 파일의 `SERVER_PORT`를 다른 값으로 둠) |

시험에 쓴 컨테이너와 `_reset_test` 폴더는 지웠다. 시험을 위해 서버를 잠시 내렸다가 `demo-start.ps1`로 다시 올렸다.

## Unresolved

- 실제 DB에서 돌려 보지 않았다. 실제 DB 사용자가 `public` 스키마의 소유자가 아니면 `DROP SCHEMA`가 권한 오류로 실패한다. 그 경우 스크립트는 오류를 보여 주고 끝난다.
- 확인 입력(`Read-Host`)은 시험에서 표준 입력으로 넣었다. 창에서 직접 입력하는 것은 해 보지 않았다.
- Python 분석 서비스가 떠 있어도 막지 않는다. 분석 서비스에는 DB에 접속하는 코드가 없다(`core/config.py`의 설정 필드 선언뿐 — reviewer 확인).
- Spring은 OS 환경 변수가 `.env`보다 우선한다. 스크립트는 `.env`만 읽으므로, 환경 변수로 다른 DB를 가리켜 Spring을 띄우는 PC에서는 대상이 다를 수 있다.
- 기기의 앱에는 예전 로그인 정보가 남는다. 초기화 뒤 앱을 열면 "로그인이 만료됐어요"가 보일 것으로 예상한다(실행해 보지 않음).
- 이미지 삭제가 실패했을 때의 안내와 링크를 건너뛰는 동작, `lock_timeout`으로 실패하는 경우는 실행해 보지 않았다.
- `AGENTS.md` 3장 실행 명령 표에는 넣지 않았다.

## Do Not Assume

- 이 스크립트는 로컬 개발 DB용이다. 주소가 로컬인지로만 판단하므로, 로컬에 띄운 다른 DB를 `.env`가 가리키고 있으면 그것을 지운다. 실행 전에 화면에 나오는 DB 이름을 확인한다.
- 지운 뒤에는 계정이 하나도 없다. 서버 기본값은 가입을 막으므로 `demo-start.ps1 -AllowSignup`으로 띄워야 새 계정을 만들 수 있다.

## Next Action

- 사용자가 실제 DB에서 실행한다: `demo-start.ps1 -Stop` → `reset-db.ps1` → `demo-start.ps1 -AllowSignup`.

## Last Verified Commit

`b3b08a8`(base `28d4210`). 위 시험은 커밋 전 작업 폴더의 스크립트로 했고, 마지막 시험 뒤에 스크립트를 고치지 않았다.
