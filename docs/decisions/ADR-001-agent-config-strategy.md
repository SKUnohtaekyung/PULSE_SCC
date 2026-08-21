# ADR-001 — Agent 설정을 AGENTS.md 단일 정본으로 관리한다

| | |
|---|---|
| Status | Accepted |
| Date | 2026-08-21 |
| 결정자 | `role:platform` |

## Context

이 프로젝트는 Claude Code와 Codex를 함께 쓴다. 두 도구가 서로 다른 규칙을 읽으면 4명이 만든 코드의 일관성이 깨진다.
따라서 "공통 규칙을 어디에 둘 것인가"를 먼저 정해야 했다.

일반적으로 제안되는 구조는 프로젝트 안에 `.codex/config.toml`, `.codex/agents/`, `.agents/skills/` 를 두고
Claude 쪽 `.claude/` 와 대칭을 맞추는 방식이다. 이 방식이 실제로 동작하는지 확인이 필요했다.

## Decision

- **공통 규칙은 `AGENTS.md` 한 곳에만 둔다.** Claude와 Codex 양쪽이 이 파일을 읽는다.
- `CLAUDE.md` 는 `@AGENTS.md` 로 import하고 **Claude 전용 내용만** 담는다.
- 프로젝트에 `.codex/` 와 `.agents/skills/` 를 **만들지 않는다.**
- 검증·Visual QA 절차는 `.claude/skills/` 아래 한 벌만 두고, `AGENTS.md` 9장에서 그 경로를 가리킨다.
  Codex 세션에서는 해당 파일을 직접 읽어 절차를 따른다. **같은 절차를 두 벌로 복제하지 않는다.**

## Reason

설치된 Codex CLI **0.147.0** 에서 다음을 직접 확인했다 (2026-08-21).

1. `codex --help` / `codex exec --help` — 설정은 `~/.codex/config.toml` 에서 로드된다고 명시.
   `--profile <name>` 은 `$CODEX_HOME/<name>.config.toml` 을, `--ignore-user-config` 는 `$CODEX_HOME/config.toml` 을 대상으로 한다.
   프로젝트 디렉터리의 설정 파일을 읽는다는 표기는 없다.
2. `codex.exe` 바이너리 문자열 검사 — `.codex/config.toml` 과 `.codex/skills` 가 등장하는 **모든 문맥이 `~/` 또는 `$CODEX_HOME` 접두사**였다.
   `.agents/skills` 문자열은 **0회** 등장했다.
3. 프로젝트별 설정은 전역 `~/.codex/config.toml` 안에 `[projects.'<절대경로>'] trust_level = "trusted"` 형태로 저장되는 것을 사용자 전역 설정에서 확인했다. 즉 저장소가 아니라 사용자 머신에 남는다.
4. 반면 `AGENTS.md` 문자열은 바이너리에 **72회** 등장했다. Codex가 실제로 지원하는 프로젝트 레벨 규칙 파일이다.
5. 공식 skill-creator 지침도 스킬 위치를 `$CODEX_HOME/skills` (또는 `~/.codex/skills`)로 안내한다.

Claude Code **2.1.237** 쪽은 반대로 `.claude/rules/*.md`, `.claude/agents/`, `.claude/skills/`, `.claude/settings.json` 이
프로젝트 레벨 설정 표면으로 실제 지원됨을 `claude.exe` 문자열에서 확인했다.

즉 **두 도구가 저장소에서 공유할 수 있는 유일한 지점이 `AGENTS.md` 다.**

## Alternatives Considered

| 대안 | 채택하지 않은 이유 |
|---|---|
| `.codex/config.toml` 을 만들어 둔다 | Codex 0.147.0이 읽지 않는다. 동작하지 않는 설정이 저장소에 남아 다음 사람을 오해시킨다 |
| `.agents/skills/` 에 Codex용 스킬을 둔다 | 해당 경로 지원 근거가 없다 |
| 규칙을 `CLAUDE.md` 와 `AGENTS.md` 양쪽에 복제한다 | 두 파일이 갈라진다. 규칙 중복 금지 원칙 위반 |
| Codex 스킬을 각자 `~/.codex/skills` 에 설치하는 스크립트를 만든다 | 4명의 로컬 상태가 저장소와 분리되어 버전이 어긋난다. 지금 규모에 비해 과하다 |

## Consequences

**좋아지는 것**
- 규칙 정본이 하나뿐이라 두 도구의 동작이 갈라지지 않는다
- 저장소에 동작하지 않는 설정 파일이 없다
- Codex 사용자가 별도 설치 절차 없이 저장소만 clone하면 된다

**나빠지는 것 / 감수하는 것**
- Codex는 스킬 자동 로드 혜택을 받지 못한다. `AGENTS.md` 9장이 경로를 가리키므로 **에이전트가 해당 파일을 직접 읽어야 한다.**
- Codex의 모델·승인·샌드박스 설정은 저장소로 공유되지 않는다. 팀원 각자 `~/.codex/config.toml` 에서 맞춰야 한다.
- Codex 신뢰 설정(`trust_level`)은 각자 로컬에 남는다.

**되돌리는 조건**
- Codex가 프로젝트 레벨 설정 디렉터리를 지원하는 버전이 나오면 이 ADR을 Superseded 처리하고 재검토한다.
- 재검토 시 `codex --version` 과 실제 로딩 경로를 **다시 확인한 뒤에** 파일을 만든다. 문서만 보고 만들지 않는다.
