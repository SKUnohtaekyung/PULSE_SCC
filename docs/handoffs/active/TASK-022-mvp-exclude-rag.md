# TASK-022 — MVP 제안에서 마케팅 지식(RAG) 참고 제외

## Status
리뷰 대기

## Owner
role:product — 사용자 결정(2026-09-28). 사용자가 이슈를 하나씩 처리해 달라고 해서 TASK-012 세션이 문서에 반영했다

## Branch
docs/TASK-022-mvp-exclude-rag

## Goal
승인된 운영용 마케팅 지식 베이스가 없어 RAG 구현이 막혀 있었다(#31 배경). 사용자 결정으로 MVP 에서는 RAG 를 제외하고, 제안은 리뷰 사실과 AI 해석으로 만든다. 요구사항 정본을 이 결정에 맞춘다.
관련 이슈: #31
관련 요구사항: PRD FR-005, 기능명세 ADVICE-004·ADVICE-008

## Completed
- PRD: 상태·최종 수정·근거, §1 제품 정의 문장, §5 Non-Goals 에 RAG 참고 추가, FR-005(§7 표·4레이어 표·4레이어 아래 RAG 원칙 문장·§9 요약·단계 3·§10 완료 조건)
- 기능명세: 범위 문장, FR-005 요약, 흐름도, ADVICE-004(MVP 제외, 우선순위 P2)·ADVICE-008(리뷰 사실만 근거), 처리 단계 6, `RETRIEVING_KNOWLEDGE`, 보안 문장, AC-07, 결정 대기 표
- 화면 상태 명세: `RETRIEVING_KNOWLEDGE` 단계, 백엔드 선행 작업 표의 RAG 행

## Changed
- `docs/product/PRD.md` — 제품 요구사항 정본의 FR-005·범위·단계
- `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` — 제안 생성 요구사항(ADVICE)·처리 단계·인수 기준
- `docs/product/requirements/SCREEN_STATES.md` — 분석 단계와 백엔드 선행 작업 표

## Decisions
- **화면은 바꾸지 않는다**(사용자 결정 2026-09-28). 제안의 "AI 해석·전문 지식 펼쳐보기"는 유지하고, 전문 지식 영역에는 기존 `ADVICE-NO-KNOWLEDGE`("이 제안에는 참고한 전문 지식이 없어요")가 나온다. 그래서 `RESULT_IA.md`·`USER_FLOW.md`·`SCREEN_STATES.md` 의 펼쳐보기 상태는 그대로 유효하다.
- API 의 `knowledgeReferences` 필드는 이후 단계를 위해 빈 목록으로 남긴다. 코드 변경은 없다. 현재 백엔드(TASK-012)도 빈 목록을 돌려준다.
- RAG 를 도입할 때의 원칙(근거 보강이지 결과 보장이 아님, 승인된 지식베이스만 검색)은 지우지 않고 "도입 시" 조건으로 남겼다.

## Verification
문서 변경만 있다. 코드 검증 명령은 해당 없음.

| 검증 | 명령 | 결과 |
|---|---|---|
| 남은 서술 | `grep -n "지식\|RAG\|knowledge"` 로 `docs/product/**` 전수 확인 | MVP 에 RAG 가 있다고 읽히는 문장이 남지 않도록 고쳤다. 화면 구성(펼쳐보기) 서술과 RAG 도입 시 원칙은 의도적으로 남겼다 |
| 상대 링크 | 이번 diff 는 링크를 추가·변경하지 않았다 | 해당 없음 |
| 공백 | `git diff --check` | 문제 없음 |
| 열린 PR 과 충돌 | 독립 Reviewer 가 `git merge-file` 3-way 시뮬레이션(#27·#38 은 origin/main 기준, #36 은 b30bada 기준) | PRD·기능명세·SCREEN_STATES 모두 충돌 0. 인접 행만 있다 |

## Unresolved
- 다른 소유 영역에 이번 결정 뒤 낡은 서술이 남아 있다. 직접 고치지 않고 PR 본문으로 해당 역할에 넘긴다.
  - `docs/architecture/API.md` §6.2 제안 블록 예시(380~395행 부근, role:platform): `knowledgeReferences` 를 값이 채워진 예시로만 보여 준다. MVP 에서는 항상 빈 목록이라는 주석이 없다
  - `frontend/mobile/INTEGRATION_GUIDE.md` 151행: "RAG 지식 참고: 비어서 온다"가 미결정 목록에 남아 있다
  - `docs/design/DESIGN_SYSTEM.md` 314행 "지식 참고는 서버가 아직 빈 배열", 243행 "자료명 또는 출처 진입점 제공"(role:design-system): 곧 채워질 것처럼 읽힌다
- `docs/architecture/ARCHITECTURE.md` 83행의 RAG 는 "과거 신청서 선언, 현재 정본 아님" 표 안이고 뜻도 "리뷰 근거로만 생성"이라 이번 결정과 충돌하지 않는다. 고칠 대상이 아니다.
- #31 은 닫지 않는다(PR 은 `Refs #31`). 이슈의 완료 조건(출처 목록·검수 절차·구현 연결)은 RAG 를 도입할 때의 일이고, PRD §9 단계 3 과 기능명세 결정 대기 표가 #31 을 앞으로 결정할 곳으로 가리킨다. 이번 결정은 2026-09-28 #31 댓글로 기록했다.

## Do Not Assume
- 이 변경은 RAG 를 영구히 빼는 것이 아니다. PRD §9 단계 3 에서 지식 출처·이용 조건·검수 절차를 정한 뒤 도입한다.

## Next Action
- PR(`type:spec`, `role:product`, `Refs #31`) 리뷰

## Last Verified Commit
`a330677` — 요구사항 문서 변경 커밋. 문서 검증은 이 커밋과 같은 내용에서 했다.
