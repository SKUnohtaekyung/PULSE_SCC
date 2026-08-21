# CLAUDE.md

프로젝트 공통 계약은 `AGENTS.md` 가 정본이다. 아래 import로 항상 함께 읽는다.

@AGENTS.md

이 파일에는 **Claude Code 전용 내용만** 쓴다. `AGENTS.md` 의 내용을 여기에 복사하지 않는다.

---

## Claude 전용 구조

| 경로 | 용도 |
|---|---|
| `.claude/agents/reviewer.md` | 독립 리뷰 서브에이전트 |
| `.claude/skills/verify/` | 코드 검증 절차 |
| `.claude/skills/visual-qa/` | UI 렌더링 검증 절차 |
| `.claude/settings.json` | 팀 공용 설정 (커밋됨). `.env` 계열 읽기 차단 |

`.claude/rules/` 는 두지 않는다. Claude가 읽어야 할 규칙은 위 `@AGENTS.md` import로 이미 전부 로드되고,
같은 규칙을 rules 파일에 다시 쓰면 Codex가 읽는 `AGENTS.md` 와 갈라지기 때문이다.

`.claude/settings.local.json` 과 `CLAUDE.local.md` 는 **개인 설정**이며 `.gitignore` 대상이다. 팀 공용 설정과 혼동하지 않는다.

## 세션 시작 시

1. `git status` 와 현재 브랜치를 먼저 확인한다.
2. 진행 중 작업이 있으면 `docs/handoffs/active/` 를 확인한다.
3. 문서와 코드가 다르면 `AGENTS.md` 4장의 충돌 처리 규칙을 따른다.

## 서브에이전트 사용

- 구현은 **한 세션이 직렬로** 수행한다. 같은 파일을 여러 에이전트가 동시에 고치지 않는다.
- `reviewer` 는 구현이 끝난 뒤 **독립 검토**에만 사용한다. reviewer가 직접 코드를 고치지 않는다.
- 읽기 전용 탐색이 넓게 필요할 때만 탐색 에이전트를 병렬로 쓴다.

## 아직 만들지 않은 것

`.claude/commands/`, `.claude/hooks/`, `.claude/output-styles/`, `.claude/workflows/` 는 **필요성이 확인되기 전까지 만들지 않는다.** 반복 자동화가 실제로 필요해진 시점에 추가한다.

스택이 확정되면 `.claude/launch.json` 에 dev 서버를 등록한다. Visual QA에서 실제 화면을 띄우는 데 필요하다.
