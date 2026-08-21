# SCC

4명이 Claude Code와 Codex를 함께 사용해 개발하는 프로젝트.

> **현재 상태: 제품 정의와 기술 스택 모두 미확정.**
> 애플리케이션 코드는 아직 없다. 지금 있는 것은 협업 규칙과 문서 정본 구조뿐이다.

---

## 먼저 읽을 것

| 순서 | 문서 | 내용 |
|---|---|---|
| 1 | [AGENTS.md](AGENTS.md) | **프로젝트 공통 계약.** 소유 영역, Git 규칙, 검증 규칙, 금지사항, 완료 기준 |
| 2 | [docs/product/PRD.md](docs/product/PRD.md) | 제품 요구사항 정본 (현재 초안) |
| 3 | [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) | UI/UX 원칙 정본 |
| 4 | [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) | 시스템 구조 정본 |

Claude Code 사용자는 [CLAUDE.md](CLAUDE.md) 를 추가로 읽는다. Codex 사용자는 `AGENTS.md` 만 자동으로 읽는다 ([ADR-001](docs/decisions/ADR-001-agent-config-strategy.md)).

## 문서 지도

```
docs/
├─ product/       제품 요구사항        (role:product)
├─ design/        UI/UX 원칙           (role:design-system)
├─ architecture/  시스템 구조          (role:platform)
├─ decisions/     ADR — 주요 기술 결정 (role:platform)
└─ handoffs/      작업 인수인계
   ├─ TEMPLATE.md
   ├─ active/     진행 중 TASK
   └─ archive/    merge 완료 TASK
```

정보별 정본 위치는 [AGENTS.md 4장](AGENTS.md)에 표로 정리되어 있다. **같은 내용을 여러 문서에 복사하지 않는다.**

## 작업 흐름

이슈 생성 → 브랜치 → Handoff 작성 → 구현 → 검증 → Visual QA(UI) → Reviewer → PR → merge → Handoff archive

전체 흐름과 완료 기준은 [AGENTS.md 13·14장](AGENTS.md).

## 아직 안 만든 것과 이유

| 항목 | 이유 |
|---|---|
| `apps/`, `packages/` | 스택 미확정. 빈 디렉터리를 미리 만들지 않는다 |
| `package.json`, `.env.example` | 스택·환경변수 미확정 |
| `.github/workflows/` (CI) | 실행 명령이 존재하지 않아 검증할 것이 없다 |
| `docs/architecture/API.md`, `DATA_MODEL.md` | 백엔드·DB 존재 여부 미확정 |
| `.claude/rules/` | 규칙을 여기에 두면 `AGENTS.md` 와 중복된다. Claude는 `CLAUDE.md` 의 `@AGENTS.md` import로 이미 전부 읽는다 |
| `.codex/`, `.agents/skills/` | Codex 0.147.0이 프로젝트 레벨에서 읽지 않음 ([ADR-001](docs/decisions/ADR-001-agent-config-strategy.md)) |
| `.claude/commands`, `hooks`, `output-styles`, `workflows` | 반복 자동화 필요성이 아직 확인되지 않음 |

각 항목은 필요성이 생긴 시점에 추가한다.

---

## 저장소 초기 세팅 (아직 실행하지 않음)

아래는 **팀에서 직접 실행해야 하는 미실행 작업**이다.

### 1. GitHub 원격 연결

로컬은 `git init` 만 되어 있고 커밋과 원격이 없다.

### 2. 이슈 라벨 생성

이슈 템플릿이 `type:*` 라벨을 사용한다. 저장소에 라벨이 없으면 적용되지 않는다.

```bash
gh label create "type:feature" --color 1D76DB && gh label create "type:ui" --color 5319E7 && gh label create "type:bug" --color D73A4A && gh label create "type:spec" --color 0E8A16 && gh label create "role:product" --color FBCA04 && gh label create "role:design-system" --color FBCA04 && gh label create "role:feature" --color FBCA04 && gh label create "role:platform" --color FBCA04
```

### 3. main 브랜치 보호

`AGENTS.md` 6장의 "main 직접 push 금지"는 문서 규칙일 뿐이다. GitHub 저장소 설정에서 브랜치 보호 규칙을 걸어야 실제로 강제된다.

### 4. CODEOWNERS

4명의 역할 배정이 끝나면 `.github/CODEOWNERS` 를 추가해 소유 영역별 리뷰어를 자동 지정한다. **담당자 미정이라 지금은 만들지 않았다.**

### 5. 빈 이슈 허용 여부

현재 `.github/ISSUE_TEMPLATE/config.yml` 에서 `blank_issues_enabled: false` 로 템플릿 사용을 강제한다. 불편하면 `true` 로 바꾼다.
