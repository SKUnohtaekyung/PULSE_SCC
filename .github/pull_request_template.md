## 관련 이슈 / TASK

- Closes #
- Handoff: `docs/handoffs/active/TASK-XXX-<주제>.md`

## 담당 역할

- [ ] `role:product`
- [ ] `role:design-system`
- [ ] `role:feature`
- [ ] `role:platform`

## 변경 요약

<!-- 무엇을 왜 바꿨는가. 구현 방법 나열이 아니라 목적 중심으로. -->

## 소유 영역 확인

`AGENTS.md` 5장 기준.

- [ ] 내 소유 영역 안에서만 수정했다
- [ ] 소유 영역 밖 파일을 수정했다 → 아래에 파일과 이유를 적고, 해당 역할을 리뷰어로 지정했다

<!-- 소유 영역 밖 수정이 있으면 여기에: -->

- [ ] `git diff` 로 확인했고 작업과 무관한 변경이 없다

## 검증 결과

**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행`, 프로젝트에 없으면 `없음` 이라고 쓴다.
절차: `.claude/skills/verify/SKILL.md`

| 검증 | 실행한 명령 | 결과 |
|---|---|---|
| lint | | |
| typecheck | | |
| test | | |
| build | | |

<!-- 실패했다가 고친 것이 있으면 원인을 적는다 -->

## Visual QA

UI 변경이 없으면 `해당 없음`. 절차: `.claude/skills/visual-qa/SKILL.md`

- 확인 방법: <!-- 실제 URL / 뷰포트 -->
- [ ] desktop 확인
- [ ] mobile 확인
- [ ] loading / empty / error / disabled / hover·focus 중 해당 상태 확인
- [ ] 디자인 토큰 우회(하드코딩 값) 없음
- [ ] 기존 컴포넌트와 중복되는 컴포넌트를 만들지 않았음

<!-- 확인하지 못한 항목과 이유: -->

## 리뷰

- [ ] 독립 Reviewer 검토 PASS (`.claude/agents/reviewer.md`)

## 문서

- [ ] Handoff 갱신 (`Last Verified Commit` 포함)
- [ ] 요구사항이 바뀌었으면 PRD 갱신 또는 `[SPEC]` 이슈 생성
- [ ] 되돌리기 어려운 결정이 있으면 `docs/decisions/` 에 ADR 추가
- [ ] 해당 없음

---

<!--
머지 전 확인:
- Git 규칙은 AGENTS.md 6장을 따른다.
- .env / 시크릿이 포함되지 않았는지 파일 목록을 확인한다.
- 완료 기준은 AGENTS.md 13장 Definition of Done.
-->
