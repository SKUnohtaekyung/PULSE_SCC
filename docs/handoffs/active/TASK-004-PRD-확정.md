# TASK-004 — PRD 1차 확정 및 리뷰 수집 ADR

## Status

완료 — 리뷰 대기

## Owner

`role:product` — 미배정

## Branch

`docs/TASK-004-PRD-확정`

## Goal

전 항목 `TBD` 였던 [PRD.md](../../product/PRD.md) 를 팀 방향 정리본과 2026-08-23 팀 결정으로 채우고,
그 과정에서 필요해진 리뷰 수집 경로 결정을 ADR로 남긴다.

관련 이슈: #3 (ADR-002로 해소)
근거 문서: `restaurant_ai_project_decisions.html` (루트, 2026-08-21 정리본 — **저장소에 커밋하지 않았다**)

---

## Completed

- `docs/product/PRD.md` 1~13장을 실제 값으로 교체 (기존: 전 항목 TBD)
- `docs/decisions/ADR-002-review-collection.md` 신규 — 리뷰 수집 경로 결정
- 팀 결정 4건을 PRD 해당 절에 반영

## Changed

| 경로 | 이유 |
|---|---|
| `docs/product/PRD.md` | 전면 교체. 1~9장 확정, 10~13장은 확정분 + 남은 TBD 명시 |
| `docs/decisions/ADR-002-review-collection.md` | 신규 — 이슈 #3 대응 |
| `docs/handoffs/active/TASK-004-PRD-확정.md` | 신규 — 이 문서 |

## Decisions

2026-08-23에 팀이 확인한 4건이다.

| # | 쟁점 | 결정 | PRD 반영 위치 |
|---|---|---|---|
| 1 | 프로젝트 정체성 | PULSE의 핵심 기능을 **빠르게 검증하는 웹뷰 MVP**로 본다. 별도 프로젝트로 분리하지 않는다 | §1 |
| 2 | 타깃 지역 | **제품은 지역 무관**, 안양시는 1단계 검증 장소로만 | §3, §9 |
| 3 | 리뷰 수집 | **Playwright 수집으로 진행** | §12, ADR-002 |
| 4 | 기능 범위 | **홍보영상 생성·인플루언서 매칭 둘 다 MVP 제외** | §5 |

추가 판단:

5. **PRD를 독립 문서로 썼다.** "이 저장소에 기존 PULSE 정보는 없었으면 좋겠다"는 요청에 따라 신청서·프로그램 문서를 근거로 인용하지 않았다. 다만 `docs/program/**` 실물은 **건드리지 않았다** — Unresolved #1 참조.
6. **ADR-002에 위험을 사실대로 적었다.** robots.txt·약관 상태는 결정으로 바뀌지 않으므로 Context에 그대로 두고, 팀이 알고 선택했음을 명시했다. 지켜야 할 5개 항목과 되돌리는 방법을 함께 적었다.
7. **수집 계층과 분석 계층을 분리 설계할 것을 ADR 전제로 넣었다.** 계정 연동 방식으로 되돌릴 수 있어야 한다.

## Verification

문서 작업이므로 코드 검증 대상이 없다.

| 검증 | 명령 | 결과 |
|---|---|---|
| lint / typecheck / test / build | — | **없음** (스택 미확정, `package.json` 부재) |
| Visual QA | — | **해당 없음** (UI 변경 없음) |
| 상대 링크 | 경로 해석 스크립트 | 깨진 링크 **0건** |
| 무관한 변경 | `git diff` | 없음 |
| PRD 잔여 TBD | 문서 검색 | §8 2건, §11 4건, §13 8건 — **전부 의도적이며 §13에 결정 시점을 적었다** |

## Unresolved

1. **`docs/program/**` 을 어떻게 할지 미결.** "이 저장소에 기존 PULSE 정보는 없었으면 좋겠다"는 요청이 있었으나, `APPLICATION_F12.md`(신청서 전문)·`SCC_PROGRAM.md`·`archive/` 를 지우면 [PROBLEM_BASELINE.md](../../product/PROBLEM_BASELINE.md) 전체가 근거를 잃는다. **별도 결정 필요.** 이 TASK에서는 손대지 않았다
2. **§5 Non-Goals와 발표덱이 어긋난다.** 덱 p16·p19에 릴스 생성 UI가 있는데 영상은 이제 Non-Goal이다. 발표에서 범위 축소를 설명해야 한다
3. **`AGENTS.md` 1장의 제품 정의가 여전히 TBD**다. `role:platform` 소유라 이 TASK에서 고치지 않았다. PRD가 확정됐으므로 갱신 대상이다
4. **기술 스택 미확정.** PRD §8의 "웹뷰" 요구가 생겼으므로 스택 ADR에서 이를 만족하는지 확인해야 한다
5. **PRD §11 목표치가 TBD**다. 1단계 테스트 대상 수가 정해져야 채울 수 있다
6. `PROBLEM_BASELINE.md` §6.2 "SCC 범위" 행이 "신청서 우선, 세 기능 약속 유지"로 되어 있어 이번 결정 4와 충돌한다. `role:product` 소유 문서이며 갱신 필요

## Do Not Assume

- **PRD의 안양시는 제품 요구사항이 아니다.** 1단계 검증 장소일 뿐이다. 제품 자체는 지역 무관이다
- **ADR-002가 법적 문제를 해소한 것이 아니다.** robots.txt·약관 상태는 그대로이며, 팀이 위험을 알고 선택한 기록이다. 발표·문서에서 "공식 API를 쓴다"고 표현하면 안 된다
- **월별 추적·변화 감지는 MVP가 아니다.** 4단계다. "켜두면 알아서 돌아간다" 같은 표현을 쓰지 않는다
- **사장님 추가 데이터 입력은 MVP가 아니다.** 2단계다. MVP는 공개 리뷰만 쓴다
- **페르소나에 연령·성별·직업을 단정형으로 넣지 마라.** PRD §7 페르소나 취급 규칙 2번
- `restaurant_ai_project_decisions.html` 은 저장소에 없다(untracked). PRD가 그 내용의 정본이다

## Next Action

**Unresolved #1을 팀이 결정한다.** `docs/program/**` 을 남길지 지울지에 따라 `PROBLEM_BASELINE.md` 의 존립이 갈린다.
그다음 `AGENTS.md` 1장 제품 정의를 PRD 기준으로 갱신한다(이슈 #7과 함께 처리 가능).

## Last Verified Commit

`151fbf9` — 이 브랜치의 작업 커밋. 기반 커밋은 `8b848c3` (main).
