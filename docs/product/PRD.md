# SCC — PRD

**이 문서는 제품 요구사항의 정본이다.**

여기에 쓰지 않는 것: 작업 진행률, 코드 구현 세부사항, 담당자별 상태.
→ 진행 상황은 `docs/handoffs/active/`, 구현 상태는 Git과 실제 코드가 정본이다.

| | |
|---|---|
| 상태 | **초안 — 전 항목 미확정** |
| 최종 수정 | 2026-08-21 |
| 소유 역할 | `role:product` |

> 아래 `TBD` 는 아직 정해지지 않았다는 뜻이다. **추측으로 채우지 않는다.**
> 항목을 채울 때는 근거(사용자 인터뷰, 데이터, 팀 합의)를 함께 남긴다.

---

## 1. Product Overview

TBD — 이 제품이 한 문장으로 무엇인지.

## 2. Problem

TBD — 누구의 어떤 문제를 푸는가. 지금은 그 문제가 어떻게 처리되고 있고 왜 불충분한가.

## 3. Target User

TBD — 주 사용자 1명을 구체적으로. 상황, 동기, 제약.

부차 사용자가 있으면 구분해서 적는다.

## 4. Goals

TBD — 이 제품이 달성하려는 것. 측정 가능하게.

## 5. Non-Goals

TBD — **이번에 하지 않는 것.** MVP 범위를 지키는 가장 중요한 항목이므로 비워두지 않는다.

## 6. Core User Journey

TBD — 사용자가 처음 들어와서 핵심 가치를 얻기까지의 흐름을 단계로.

```
1.
2.
3.
```

## 7. Functional Requirements

TBD

| ID | 요구사항 | 우선순위 | 비고 |
|---|---|---|---|
| FR-001 | TBD | TBD | |

기능이 커지면 `docs/product/requirements/<기능>.md` 로 분리한다. **작은 단계에서 미리 쪼개지 않는다.**

## 8. Non-Functional Requirements

TBD — 성능, 접근성, 브라우저/기기 지원 범위, 보안, 개인정보.

## 9. MVP Scope

TBD — 4명이 실제로 만들 수 있는 범위로 자른다.

**포함**
- TBD

**제외 (Non-Goals와 연결)**
- TBD

## 10. Acceptance Criteria

TBD — 각 요구사항이 "완료"인지 판정하는 관찰 가능한 조건.

Agent와 Reviewer는 이 항목을 기준으로 PASS/FAIL을 판정한다. 여기가 비어 있으면 UI 작업의 완료 판정이 불가능하다.

| 요구사항 ID | 완료 조건 |
|---|---|
| FR-001 | TBD |

## 11. Metrics

TBD — 성공을 무엇으로 확인하는가.

## 12. Constraints

- 팀 4명, AI Agent(Claude Code / Codex) 활용
- 기술 스택 **미확정** — 확정 시 `docs/decisions/` 에 ADR 기록
- 그 외 TBD (기간, 예산, 외부 의존, 배포 환경)

## 13. Open Questions

| # | 질문 | 필요한 결정 시점 |
|---|---|---|
| 1 | 제품이 무엇인가 (1~5장 전체) | 착수 전 |
| 2 | 프로젝트 유형 — Web / Mobile / API 포함 여부 | 스택 결정 전 |
| 3 | 기술 스택 | 코드 작성 전 |
| 4 | 4명의 역할 배정 (`AGENTS.md` 5장) | 첫 TASK 배정 전 |
| 5 | merge 전략 (squash / merge commit) | 첫 PR 전 |
