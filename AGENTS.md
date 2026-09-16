# SCC — Agent Contract

이 문서는 **Claude Code와 Codex가 공통으로 따르는 프로젝트 계약**이다.
두 도구 모두 이 파일을 읽는다. 따라서 **공통 규칙은 전부 이 파일에만 쓴다.** 다른 문서에 복사하지 않는다.

- Claude 전용 지침: `CLAUDE.md`, `.claude/agents/`, `.claude/skills/`
- Codex는 프로젝트 레벨 설정 디렉터리를 읽지 않는다. 근거와 대응: [ADR-001](docs/decisions/ADR-001-agent-config-strategy.md)

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| 이름 | SCC |
| 제품 정의 | 공개 음식점 리뷰를 손님 인사이트와 실행 제안으로 바꾸는 Android 앱 — 정본은 [docs/product/PRD.md](docs/product/PRD.md) |
| 팀 규모 | 4명 |
| 협업 방식 | Git 기반. 역할별 소유 영역 분리 (5장) |
| AI 도구 | Claude Code, Codex |

### 이 저장소가 담는 것

**코드만 두는 저장소가 아니다.** 제품 문서, 조사 근거, 발표 자료, 회의·인터뷰 기록을 함께 관리한다.
SCC는 15주짜리 프로젝트이고 산출물의 상당 부분이 문서다. 따라서 문서도 코드와 같은 규칙(브랜치 → PR → 리뷰)을 따른다.

| 축 | 위치 | 성격 |
|---|---|---|
| **문서 정본** | `docs/**` | 지금 무엇이 참인가. 갱신하면 이전 값은 사라진다 |
| **조사 근거** | `research/**` | 언제 무엇을 확인했는가. **소급 수정하지 않고** 정정 주석을 단다 |
| **발표 자료** | `docs/presentation/**` | 대외 산출물. 원본 덱은 커밋하지 않는다 |
| **기록** | `docs/meetings/**`, `research/interviews/**` | 그 시점의 사실. 나중에 고쳐 쓰지 않는다 |

**정본과 기록을 섞지 않는다.** 정본은 최신 상태를 말하고, 기록은 그때 무엇을 알았는지를 말한다. 조사 결과가 틀린 것으로 밝혀져도 원문을 지우지 않고 정정 주석을 단다 — 그래야 판단이 어떻게 바뀌었는지 추적된다.

## 2. 기술 스택

**상위 수준 스택은 2026-09-12, 백엔드 실행 스택은 2026-09-16 확정했다.** 결정 근거는 [ADR-003](docs/decisions/ADR-003-application-stack.md), [ADR-006](docs/decisions/ADR-006-backend-bootstrap.md)이다. 프론트엔드 세부 버전은 확정 전까지 추측해서 코드·설정·문서를 작성하지 않는다.

| 항목 | 상태 |
|---|---|
| 프로젝트 유형 | Android 앱 + 자체 API + Python AI 처리 |
| Frontend framework | Expo 기반 React Native |
| Backend | Spring Boot 4.1.1·Java 21·Gradle Wrapper 9.7.1 + FastAPI 0.141.1·Python 3.13 |
| 데이터베이스 | PostgreSQL 18.6, migration은 Spring Boot Flyway가 단독 소유 |
| 언어 | TypeScript, Java 21, Python 3.13 |
| 이미지 생성 | OpenAI API |
| 패키지 매니저 | 백엔드: Gradle Wrapper, Python venv + pip / 프론트엔드: 확정 필요 |
| 테스트 러너 | 백엔드: JUnit Platform, Testcontainers 2.0.5, pytest / 프론트엔드: 확정 필요 |

로컬에서 실제 실행 확인된 도구 (2026-09-16 기준):

```
java 21.0.8   python 3.13.2
Gradle 9.7.1 → backend/spring-api/gradlew.bat으로 실행 확인
Docker → 미설치, Testcontainers PostgreSQL 테스트는 컴파일 확인·실행 건너뜀
```

### 스택 확정 시 반드시 함께 갱신할 것

1. `docs/decisions/` 에 ADR 추가 (선택 근거·대안·결과)
2. 위 표를 실제 값으로 교체
3. 3장 실행 명령 채우기
4. `.claude/skills/verify/SKILL.md` 의 명령 채우기
5. `.gitignore` 에 스택별 항목 추가
6. `docs/architecture/ARCHITECTURE.md` 갱신
7. 백엔드/API/DB 변경 시 `docs/architecture/API.md`, `DATA_MODEL.md`와 실제 schema/types/migration 동기화
8. 필요 시 `.github/workflows/` CI 추가

## 3. 실행 명령

백엔드 명령은 저장소 루트에서 실행한다. 프론트엔드는 아직 프로젝트가 없어 명령이 없다.

| 목적 | 명령 |
|---|---|
| PostgreSQL 시작 | `docker compose --env-file backend/.env -f backend/compose.yaml up -d postgres` |
| Spring test | `.\backend\spring-api\gradlew.bat -p backend\spring-api test` |
| Spring build | `.\backend\spring-api\gradlew.bat -p backend\spring-api build` |
| Spring dev | `.\backend\spring-api\gradlew.bat -p backend\spring-api bootRun` |
| Python install | `python -m venv backend\python-analysis\.venv` 후 `.\backend\python-analysis\.venv\Scripts\python.exe -m pip install -e ".\backend\python-analysis[dev]"` |
| Python lint | `.\backend\python-analysis\.venv\Scripts\python.exe -m ruff check --no-cache backend\python-analysis` |
| Python format check | `.\backend\python-analysis\.venv\Scripts\python.exe -m ruff format --check --no-cache backend\python-analysis` |
| Python test | `.\backend\python-analysis\.venv\Scripts\python.exe -m pytest backend\python-analysis` |
| Backend typecheck | 없음 — 현재 정의하지 않음 |

## 4. Source of Truth

정보마다 정본은 하나다. 충돌이 나면 **해당 정보 영역의 정본**을 확인한다. 문서 우선순위를 일괄 적용하지 않는다.

| 정보 | 정본 |
|---|---|
| 제품 목표·요구사항 | `docs/product/PRD.md` |
| 상세 기능 요구사항 | `docs/product/requirements/*` (기능이 커지면 신설) |
| UI/UX 원칙 | `docs/design/DESIGN_SYSTEM.md` |
| 실제 디자인 토큰 값 | 토큰 코드 (위치 미정 — 스택 확정 후) |
| 재사용 UI 컴포넌트 | 컴포넌트 코드 (위치 미정 — 스택 확정 후) |
| 시스템 구조 | `docs/architecture/ARCHITECTURE.md` |
| API 계약 | `docs/architecture/API.md` 설계 계약 + 실제 controller/DTO 코드 (인증 구현됨, OpenAPI 파일은 아직 없음) |
| DB 구조 | 실제 Flyway migration `backend/spring-api/src/main/resources/db/migration/**` + `docs/architecture/DATA_MODEL.md` |
| 현재 구현 상태 | Git + 실제 코드 |
| 테스트 통과 여부 | 실제 테스트 실행 결과 |
| 주요 기술 결정 근거 | `docs/decisions/*` |
| 현재 작업 진행 상황 | `docs/handoffs/active/*` |
| 조사 결과·근거 | `research/*` — 근거 대장은 `research/evidence_registry.csv` |
| 현장 인터뷰 1차 자료 | `research/interviews/*` |
| 발표 자료 시안 | `docs/presentation/svg/*` (원본 덱은 저장소 밖) |
| 회의 기록 | `docs/meetings/*` |
| SCC 프로그램·신청서 | `docs/program/*` — **대외 제출 문서는 수정하지 않는다** |
| Agent가 발견한 경험적 패턴 | Agent Memory (12장 제한 준수) |

### 충돌 처리

- **PRD ≠ 코드**: 코드가 자동으로 정답이 아니다. 요구사항 미구현이거나 PRD가 stale일 수 있다. 둘을 비교해 보고한다.
- **Handoff ≠ 코드**: 코드와 Git이 우선이다. Handoff를 갱신한다.
- **Memory ≠ 정본**: Memory를 폐기하거나 갱신한다.
- **조사 결과가 틀렸을 때**: `research/**` 의 본문 수치를 고쳐 쓰지 않는다. **정정 주석을 달고** 새 문서로 갱신분을 남긴다. 조사 시점의 판단 기록이기 때문이다.
- **발표 자료 ≠ 정본**: 슬라이드에 적힌 수치가 정본과 다르면 정본이 맞다. 슬라이드를 고친다.

## 5. 역할과 소유 영역

4명이 같은 파일을 동시에 고치지 않게 하기 위한 구조다. **사람 이름이 아니라 소유 영역으로 나눈다.**

| 역할 | 라벨 | 문서 소유 | 코드 소유 |
|---|---|---|---|
| Product / Spec | `role:product` | `docs/product/**`, `docs/presentation/**`, `research/**` | — |
| Design System | `role:design-system` | `docs/design/**` | 디자인 토큰, 공용 UI 컴포넌트 (경로 TBD) |
| Feature | `role:feature` | 담당 `docs/handoffs/active/TASK-*` | `backend/spring-api/src/main/java/kr/co/scc/api/{auth,analysis,mypage}/**`, `backend/python-analysis/src/scc_analysis/**`의 담당 기능 |
| Platform | `role:platform` | `docs/architecture/**`, `docs/decisions/**`, `docs/program/**` | `backend/**` 빌드·환경 설정, Spring `common/config/**`, `.github/**`, `.claude/**`, CI |

`docs/meetings/**` 와 `research/interviews/**` 는 **참석자·기록자가 소유**한다. 남의 회의록·인터뷰 기록을 대신 고치지 않는다. 오류를 발견하면 해당 문서 하단에 정정을 덧붙이거나 기록자에게 알린다.

공용 파일(`AGENTS.md`, `CLAUDE.md`, `README.md`)은 누구나 고칠 수 있으나 반드시 PR과 리뷰를 거친다.

**담당자 배정은 미정이다.** 팀이 정한 뒤 `.github/CODEOWNERS` 를 추가한다.

### 동시 편집 회피 규칙

1. 하나의 TASK = 하나의 브랜치 = 하나의 소유자 = 하나의 Agent 세션
2. 두 Agent가 같은 파일을 동시에 수정하는 작업 분할을 만들지 않는다
3. 내 소유 영역 밖 파일을 고쳐야 하면 → 직접 고치지 말고 이슈를 만들어 해당 역할에 넘긴다
4. 불가피하게 넘어가야 하면 → PR 본문에 명시하고 해당 역할을 리뷰어로 지정한다
5. 공용 UI 컴포넌트·디자인 토큰 변경은 `role:design-system` 리뷰 필수

## 6. Git 규칙

### 6.1 브랜치와 커밋

- 기본 브랜치는 `main`. **`main` 직접 push 금지.** GitHub 브랜치 보호로 강제된다.
- 브랜치명: `<type>/TASK-<번호>-<짧은설명>` (예: `feat/TASK-003-login-form`)
- 커밋 메시지: Conventional Commits. 본문 한국어 허용. (예: `feat(auth): 로그인 폼 추가`)
- merge 전략(squash / merge commit)은 **확정 필요**.

### 6.2 PR 규칙

- PR은 이슈 1개, TASK 1개에 대응시킨다.
- PR 제목은 커밋 메시지와 같은 규칙을 쓴다.
- **본문은 `.github/pull_request_template.md` 구조를 그대로 따른다.**
  섹션을 지우지 않는다. 해당 없으면 `해당 없음` 이라고 적는다.

#### 라벨은 반드시 붙인다

**라벨 없는 PR은 리뷰하지 않는다.** GitHub은 이슈 폼과 달리 **PR 템플릿으로 라벨을 자동 부여하지 않는다.** 생성할 때 직접 지정해야 한다.

| 붙일 라벨 | 개수 | 기준 |
|---|---|---|
| `type:*` | 1개 이상 | 아래 표 |
| `role:*` | 정확히 1개 | 소유 역할 (5장) |

| `type:*` 라벨 | 용도 | 브랜치 type |
|---|---|---|
| `type:feature` | 새 기능 또는 기능 변경 | `feat` |
| `type:bug` | 버그 수정 | `fix` |
| `type:ui` | 화면, 디자인 토큰, 공용 컴포넌트 | `ui` |
| `type:spec` | PRD·요구사항·디자인 원칙 변경 | `docs` |
| `type:docs` | 그 외 문서 변경 — 조사 결과, 회의·인터뷰 기록, 발표 자료 포함 | `docs` |
| `type:chore` | 빌드·설정·의존성·리팩터링 | `chore` / `refactor` |

#### Agent가 PR을 만들 때

에디터가 열리는 형태는 비대화형 세션에서 실패한다. `--body-file` 을 쓴다.

```bash
gh pr create --base main   --title "feat(auth): 로그인 폼 추가"   --label "type:feature" --label "role:feature"   --body-file - <<'PRBODY'
<pull_request_template.md 구조대로 채운 본문>
PRBODY
```

생성 후 라벨이 실제로 붙었는지 **조회해서 확인한다.** 붙지 않았으면 보완한다.

```bash
gh pr view <번호> --json labels --jq '[.labels[].name]'
gh pr edit <번호> --add-label "type:feature"
```

### 6.3 금지

- 공유 브랜치에 force push
- 다른 사람의 진행 중 변경 삭제
- 작업과 무관한 파일을 함께 수정
- `.env` 및 시크릿 커밋 — 환경변수 이름과 로컬 예시는 `backend/.env.example`로만 공유한다

## 7. 개발 규칙

- 문서보다 실제 코드·Git 상태·테스트 결과를 먼저 확인한다.
- 확인하지 않은 명령·패키지·경로·테스트 결과를 성공했다고 기록하지 않는다.
- 같은 규칙을 여러 문서에 복제하지 않는다. 정본 위치를 링크한다.
- 문서를 많이 만드는 것을 품질로 간주하지 않는다.
- 확정되지 않은 값은 `TBD` 또는 `확정 필요` 라고 명시한다. 그럴듯하게 채우지 않는다.

## 8. UI 구현 규칙

UI/UX는 Agent가 코드로 직접 구현하는 Code-first 방식이다. Markdown만으로 디자인 시스템을 확정하지 않는다.

**디자인 원칙 자체의 정본은 [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) 3장이다.** 원칙을 여기에 복사하지 않는다.
이 절은 **착수 전에 무엇을 조사할 것인가**만 정한다.

### UI 작업 착수 전 순서

1. **요구사항 확인** — `docs/product/PRD.md` 에서 해당 화면·기능의 Acceptance Criteria를 읽는다.
   없으면 만들어내지 말고 `[SPEC]` 이슈로 `role:product` 에 요청한다.
2. **상세 요구사항 확인** — `docs/product/requirements/*` (존재하는 경우)
3. **디자인 원칙 확인** — `docs/design/DESIGN_SYSTEM.md`
4. **기존 토큰 탐색** — 코드에서 색상·간격·타이포 토큰 정의를 찾는다.
   정의를 찾지 못하면 **하드코딩하지 말고 멈추고 보고한다.**
5. **기존 컴포넌트 탐색** — 컴포넌트 디렉터리를 찾고 유사한 이름·역할을 검색한다.
   **최소 2가지 이름으로 검색한다.** (예: `Modal`/`Dialog`, `Input`/`TextField`, `Card`/`Panel`)
6. **재사용 판단** — 기존 것으로 되면 재사용, props 확장으로 되면 확장한다.
7. **새로 만들어야 하면** — 만들기 전에 이유를 한 줄로 말한다.
   공용 컴포넌트나 새 토큰이 되면 `role:design-system` 리뷰를 요청한다.

구현 중·구현 후 지켜야 할 원칙(토큰 우회 금지, 상태 누락 금지, 반응형, 접근성)은 전부 `DESIGN_SYSTEM.md` 3장을 따른다.

## 9. 검증 규칙

절차 정본은 다음 두 스킬이다. 내용을 여기에 복제하지 않는다.

- 코드 검증: [.claude/skills/verify/SKILL.md](.claude/skills/verify/SKILL.md)
- UI 검증: [.claude/skills/visual-qa/SKILL.md](.claude/skills/visual-qa/SKILL.md)

Codex 세션에서는 위 파일을 직접 읽고 절차를 따른다.

원칙:

- `lint PASS` + `build PASS` 만으로 UI 작업을 완료로 판정하지 않는다.
- 실행하지 않은 검증은 `미실행` 이라고 쓴다. 추정으로 PASS를 쓰지 않는다.
- 검증 결과는 실제 명령과 실제 출력을 근거로 기록한다.

### 문서 작업의 검증

이 저장소는 문서 비중이 크다. 코드 검증 명령이 없다고 검증을 건너뛰지 않는다. **문서에는 문서의 검증이 있다.**

| 대상 | 확인할 것 |
|---|---|
| 모든 문서 | 상대 링크가 실제 파일을 가리키는가 |
| 수치를 담은 문서 | 근거 문서·원자료와 대조했는가. 계산값은 계산값이라고 적었는가 |
| 정본 문서(PRD 등) | 절 사이에 모순이 없는가. `TBD` 에 결정 시점이 붙어 있는가 |
| 근거를 인용한 문서 | 인용이 원문 범위를 넘지 않는가. 등급을 과장하지 않았는가 |
| 발표 자료 | 슬라이드 수치가 정본과 일치하는가. 출처·단위·기준시점을 밝혔는가 |
| 파일을 옮긴 변경 | 이동 후 다른 문서의 링크가 깨지지 않았는가 |

**확인하지 못한 것은 `미확인` 이라고 쓴다.** 원문에 접근하지 못했으면 그 사실을 적는다. 이것이 이 프로젝트에서 가장 자주 깨지는 규칙이다.

## 10. Handoff 규칙

- 위치: `docs/handoffs/active/TASK-<번호>-<주제>.md`
- 템플릿: [docs/handoffs/TEMPLATE.md](docs/handoffs/TEMPLATE.md)
- 사람별 문서(`taekyung.md` 등)를 만들지 않는다. **Task 단위로만 관리한다.**
- Handoff는 "시스템 전체 상태"의 정본이 아니다. 인수인계용이다.

기존 Handoff를 이어받을 때 순서:

1. 현재 Git HEAD 확인
2. Handoff의 `Last Verified Commit` 확인
3. 그 commit 이후 diff 확인
4. 실제 코드와 Handoff 비교
5. Handoff가 오래되었으면 **실제 코드와 Git 상태를 우선**
6. 필요하면 Handoff를 먼저 수정하고 작업 시작

merge된 TASK는 `docs/handoffs/active/` → `docs/handoffs/archive/` 로 옮긴다. 장기적으로 유효한 결정만 ADR로 승격한다.

## 11. 금지사항

- 확정되지 않은 기술 스택·요구사항·API·디자인 값을 지어내기
- 실행하지 않은 검증을 통과했다고 쓰기
- 지원 여부를 확인하지 않은 설정 옵션 작성
- 같은 규칙을 여러 파일에 복제
- 빈 폴더·빈 placeholder 문서 양산
- 다른 사람 소유 영역의 파일을 협의 없이 수정
- `main` 직접 push, 공유 브랜치 force push
- `.env`·시크릿 커밋
- 작업 범위를 벗어난 리팩터링

## 12. Agent Memory 정책

Memory에 허용하는 것: 반복되는 디버깅 인사이트, 프로젝트 특유의 함정, 반복 regression 패턴, 탐색 효율 정보.

Memory에 두지 않는 것: PRD, API 계약, DB schema, 현재 Task 상태, 디자인 시스템 정본, 아키텍처 정본.

Memory가 실제 코드·정본과 충돌하면 Memory를 폐기하거나 갱신한다.

## 13. Definition of Done

전부 만족해야 완료다.

- [ ] 관련 이슈·TASK와 연결됨
- [ ] PRD/요구사항을 충족함
- [ ] 내 소유 영역 밖 파일을 임의로 수정하지 않음
- [ ] 작업과 무관한 변경 없음 (`git diff` 로 확인)
- [ ] 코드 검증 완료 — verify 스킬 기준. 실행한 명령과 결과를 PR에 기록
- [ ] UI 작업이면 Visual QA 완료 — visual-qa 스킬 기준
- [ ] 독립 Reviewer 검토 PASS
- [ ] Handoff 문서 갱신 (`Last Verified Commit` 포함)
- [ ] 중요한 결정은 ADR로 기록

## 14. 표준 작업 흐름

```
Task
 → 현재 Git 상태 확인
 → 관련 PRD / Design System / Architecture 확인
 → 관련 Handoff 확인
 → 실제 코드 조사
 → 계획
 → 구현
 → 코드 검증 (verify)
 → UI 작업이면 Visual QA
 → 독립 Reviewer
 → FAIL이면 원인 분석 후 최소 수정 → 재검증
 → PR / Merge
 → 중요 결정은 ADR 승격
 → Handoff archive 이동
```
