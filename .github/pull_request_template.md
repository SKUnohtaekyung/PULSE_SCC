<!--
라벨을 반드시 붙인다: type:* 1개 이상 + role:* 1개.
PR 템플릿은 라벨을 자동으로 붙여주지 않는다. 생성 시 직접 지정해야 한다.
규칙 정본: AGENTS.md 6장
-->

## 요약

<!-- 무엇을 왜 바꿨는가. 1~2문장. 구현 방법이 아니라 목적. -->

| | |
|---|---|
| 이슈 | Closes # |
| Handoff | `docs/handoffs/active/TASK-___.md` |
| 라벨 | `type:___` `role:___` |

---

## 변경 내용

<!-- 영역 단위로 묶어서. 파일 나열이 아니라 무엇이 달라졌는지. -->

-

---

## 검증 결과

> 절차: `.claude/skills/verify/SKILL.md`
> **`PASS` · `FAIL` · `미실행` · `없음` 을 구분한다.** 실행하지 않은 것을 PASS로 쓰지 않는다.

| 항목 | 실행한 명령 | 결과 |
|---|---|---|
| lint | | |
| typecheck | | |
| test | | |
| build | | |

<!-- 실패했다가 고친 것이 있으면 원인을 적는다: -->

<details>
<summary><b>Visual QA</b> — UI 변경이 있으면 펼쳐서 작성 (없으면 그대로 둔다)</summary>

<br>

> 절차: `.claude/skills/visual-qa/SKILL.md`

**확인 방법:** <!-- 실제 URL / 뷰포트 -->

- [ ] desktop 확인
- [ ] mobile 확인
- [ ] 해당하는 상태 확인 (loading / empty / error / disabled / hover·focus)
- [ ] 디자인 토큰 우회(하드코딩 값) 없음
- [ ] 기존 컴포넌트와 중복되는 컴포넌트 없음

**확인하지 못한 항목과 이유:**

</details>

---

## 머지 전 체크

- [ ] **라벨을 붙였다** — `type:*` 1개 이상 + `role:*` 1개
- [ ] 내 소유 영역 안에서만 수정했다
- [ ] `git diff` 로 확인했고 작업과 무관한 변경이 없다
- [ ] `.env`·시크릿이 포함되지 않았다
- [ ] 독립 Reviewer 검토 PASS
- [ ] Handoff 갱신 (`Last Verified Commit` 포함)
- [ ] 요구사항이 바뀌었으면 PRD 갱신 또는 `[SPEC]` 이슈 생성
- [ ] 되돌리기 어려운 결정은 ADR 추가

<details>
<summary>소유 영역을 벗어난 수정이 있다면 펼쳐서 작성</summary>

<br>

| 파일 | 이유 | 지정한 리뷰어 역할 |
|---|---|---|
| | | |

</details>

<!-- 완료 기준 전체: AGENTS.md 13장 Definition of Done -->
