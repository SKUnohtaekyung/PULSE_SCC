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
| 제품 정의 | **TBD** — 정본은 [docs/product/PRD.md](docs/product/PRD.md) |
| 팀 규모 | 4명 |
| 협업 방식 | Git 기반. 역할별 소유 영역 분리 (5장) |
| AI 도구 | Claude Code, Codex |

## 2. 기술 스택

**현재 미확정이다. 확정 전까지 스택을 추측해서 코드·설정·문서를 작성하지 않는다.**

| 항목 | 상태 |
|---|---|
| 프로젝트 유형 (Web / Mobile / API 포함 여부) | 확정 필요 |
| Frontend framework | 확정 필요 |
| Backend / BaaS | 확정 필요 |
| 언어 | 확정 필요 |
| 패키지 매니저 | 확정 필요 |
| 테스트 러너 | 확정 필요 |

로컬에서 실제 실행 확인된 도구 (2026-08-21 기준):

```
git 2.49.0   node v22.16.0   npm 10.9.2   python 3.13.2
gh 2.73.0    claude 2.1.237  codex-cli 0.147.0
pnpm / yarn / bun → 미설치
```

### 스택 확정 시 반드시 함께 갱신할 것

1. `docs/decisions/` 에 ADR 추가 (선택 근거·대안·결과)
2. 위 표를 실제 값으로 교체
3. 3장 실행 명령 채우기
4. `.claude/skills/verify/SKILL.md` 의 명령 채우기
5. `.gitignore` 에 스택별 항목 추가
6. `docs/architecture/ARCHITECTURE.md` 갱신
7. 백엔드/DB가 생기면 `docs/architecture/API.md`, `DATA_MODEL.md` 신설
8. 필요 시 `.github/workflows/` CI 추가

## 3. 실행 명령

**아직 없다.** 루트에 `package.json` 이 존재하지 않는다.
존재하지 않는 명령을 실행했다고 기록하거나 CI·문서·PR에 넣지 않는다.

| 목적 | 명령 |
|---|---|
| install | TBD |
| dev | TBD |
| lint | TBD |
| typecheck | TBD |
| test | TBD |
| build | TBD |

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
| API 계약 | 실제 schema/types + architecture 문서 (현재 없음) |
| DB 구조 | 실제 schema/migration (현재 없음) |
| 현재 구현 상태 | Git + 실제 코드 |
| 테스트 통과 여부 | 실제 테스트 실행 결과 |
| 주요 기술 결정 근거 | `docs/decisions/*` |
| 현재 작업 진행 상황 | `docs/handoffs/active/*` |
| Agent가 발견한 경험적 패턴 | Agent Memory (12장 제한 준수) |

### 충돌 처리

- **PRD ≠ 코드**: 코드가 자동으로 정답이 아니다. 요구사항 미구현이거나 PRD가 stale일 수 있다. 둘을 비교해 보고한다.
- **Handoff ≠ 코드**: 코드와 Git이 우선이다. Handoff를 갱신한다.
- **Memory ≠ 정본**: Memory를 폐기하거나 갱신한다.

## 5. 역할과 소유 영역

4명이 같은 파일을 동시에 고치지 않게 하기 위한 구조다. **사람 이름이 아니라 소유 영역으로 나눈다.**

| 역할 | 라벨 | 문서 소유 | 코드 소유 |
|---|---|---|---|
| Product / Spec | `role:product` | `docs/product/**` | — |
| Design System | `role:design-system` | `docs/design/**` | 디자인 토큰, 공용 UI 컴포넌트 (경로 TBD) |
| Feature | `role:feature` | 담당 `docs/handoffs/active/TASK-*` | 화면·기능 단위 (경로 TBD) |
| Platform | `role:platform` | `docs/architecture/**`, `docs/decisions/**` | 빌드 설정, `.github/**`, `.claude/**`, CI |

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
| `type:docs` | 그 외 문서 변경 | `docs` |
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
- `.env` 및 시크릿 커밋 — 환경변수는 `.env.example` 로만 공유한다 (현재 미생성, 스택 확정 후)

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
