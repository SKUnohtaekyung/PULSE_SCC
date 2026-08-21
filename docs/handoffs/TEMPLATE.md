# Handoff 템플릿

사용 규칙(파일명, 인수인계 순서, archive 이동 시점)은 `AGENTS.md` 10장이 정본이다. 여기에 복사하지 않는다.

- 새 작업: 아래 내용을 복사해 `docs/handoffs/active/TASK-<번호>-<주제>.md` 로 만든다
- 예: `docs/handoffs/active/TASK-001-auth.md`
- merge되면 `docs/handoffs/archive/` 로 옮긴다

---

```markdown
# TASK-XXX — <주제>

## Status
진행중 / 리뷰 대기 / 블로킹 / 완료

## Owner
role:<product|design-system|feature|platform> — <담당자>

## Branch
<type>/TASK-XXX-<짧은설명>

## Goal
무엇을 달성하려 했는가. 한두 문장.
관련 이슈: #<번호>
관련 요구사항: PRD FR-XXX

## Completed
실제로 끝난 것만 적는다. 진행 중인 것은 여기 쓰지 않는다.
-

## Changed
변경한 파일과 이유. `git diff --stat` 기준.
- `<경로>` — <이유>

## Decisions
이 작업 중 내린 판단과 근거. 장기적으로 유효한 것은 ADR로 승격한다.
-

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| lint | | |
| typecheck | | |
| test | | |
| build | | |
| Visual QA | | |

## Unresolved
아직 해결되지 않은 것. 알면서 남겨둔 것 포함.
-

## Do Not Assume
다음 사람이 착각하기 쉬운 것. "이건 됐을 것"이라고 넘겨짚으면 안 되는 지점.
-

## Next Action
다음 작업자가 **가장 먼저** 할 일 하나.
-

## Last Verified Commit
<git commit hash> — 이 시점의 코드까지 위 Verification이 유효하다
```
