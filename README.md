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

## 저장소

| | |
|---|---|
| 원격 | https://github.com/SKUnohtaekyung/PULSE_SCC |
| 공개 범위 | **Public** — 누구나 열람 가능. push·리뷰 승인은 collaborator만 |
| 기본 브랜치 | `main` (보호 적용됨) |

```bash
git clone https://github.com/SKUnohtaekyung/PULSE_SCC.git
```

### 완료된 세팅

- Public 저장소 생성 및 push
- 이슈 라벨 8종 (`type:feature` `type:ui` `type:bug` `type:spec` / `role:product` `role:design-system` `role:feature` `role:platform`)
- 이슈 폼 4종, PR 템플릿, `.gitattributes`(줄바꿈 LF 통일)
- `main` 브랜치 보호 (아래)

### main 브랜치 보호 규칙

`AGENTS.md` 6장의 Git 규칙을 GitHub 설정으로 강제한 것이다.

| 규칙 | 설정 |
|---|---|
| PR 없이 main에 직접 push | 차단 |
| 머지 전 승인 | 1명 이상 |
| 새 커밋 push 시 기존 승인 | 자동 해제 |
| force push | 차단 |
| main 브랜치 삭제 | 차단 |
| 리뷰 코멘트 | 전부 해결해야 머지 가능 |
| 관리자 우회 | **허용 (임시)** |

**관리자 우회를 열어둔 이유:** 현재 collaborator가 1명뿐이라 승인해 줄 사람이 없다.
그대로 두면 저장소 소유자가 자기 PR을 머지하지 못해 아무 작업도 진행할 수 없다.
**팀원 3명을 초대한 뒤에는 아래로 관리자에게도 적용할 것을 권한다.**

```bash
gh api -X POST repos/SKUnohtaekyung/PULSE_SCC/branches/main/protection/enforce_admins
```

merge 전략(squash / merge commit)은 팀 결정 사항이므로 강제하지 않았다. `AGENTS.md` 6장 참고.

## 아직 실행하지 않은 세팅

아래는 **팀에서 직접 해야 하는 작업**이다.

### 1. 팀원 초대

Public이라 열람은 누구나 가능하지만 **push와 리뷰 승인은 collaborator만 가능하다.** 나머지 3명을 초대해야 브랜치 보호가 의도대로 동작한다.

### 2. CODEOWNERS

4명의 역할 배정이 끝나면 `.github/CODEOWNERS` 를 추가해 소유 영역별 리뷰어를 자동 지정한다. **담당자 미정이라 지금은 만들지 않았다.**

### 3. 빈 이슈 허용 여부

현재 `.github/ISSUE_TEMPLATE/config.yml` 에서 `blank_issues_enabled: false` 로 템플릿 사용을 강제한다. 불편하면 `true` 로 바꾼다.
