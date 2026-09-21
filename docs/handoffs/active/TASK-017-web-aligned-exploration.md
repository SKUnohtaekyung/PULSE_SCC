# TASK-017 — `pulse_FE` 정렬 결과 화면 탐색

## Status
디자인 탐색 완료 · 사용자 선택 대기

## Owner
role:design-system — Codex

## Branch
ui/TASK-017-web-aligned-exploration

## Goal
별도 웹 저장소 `pulse_FE`의 실제 디자인을 확인하고 SCC Android 결과 화면을 같은 제품군처럼 보이도록 재해석한 뒤, 기존 정본 요구사항과 충돌하지 않는 권장 시안을 제안한다.
관련 이슈: 미생성
관련 요구사항: PRD FR-002~FR-006·FR-012, `docs/product/requirements/RESULT_IA.md` D1~D15

## Completed
- `pulse_FE` 소스와 데스크톱·390×844 실제 렌더링을 읽기 전용으로 검토했다.
- 기존 TASK-016 구현·문서·Android 증거를 PRD, 결과 IA, 디자인 시스템과 다시 대조했다.
- 웹 정렬 모바일 시안 3개와 확정 IA를 반영한 최종 권장안 1개를 ImageGen으로 생성했다.
- 고객 여정, 사람 아바타, 릴스 제작 등 웹에서 앱 MVP로 가져오면 안 되는 요소를 분리했다.

## Changed
- `docs/design/explorations/TASK-017/README.md` — 웹 검토, 재검토 결과, 시안 비교, 권장 방향과 생성 근거
- `docs/design/explorations/TASK-017/*.png` — 비교 시안 3개와 최종 권장안
- `docs/handoffs/active/TASK-017-web-aligned-exploration.md` — 작업 상태와 다음 게이트

## Decisions
- 웹의 브랜드 언어는 계승하되 데스크톱 2열 레이아웃은 모바일에 복사하지 않는다.
- 최종 권장안은 `RESULT_IA`의 메타정보→TOP3→4관점→대표 근거→행동→접힌 AI/지식 순서를 유지한다.
- 웹의 고객 여정은 현재 제품 계약 밖이므로 최종 권장안에서 제외하고 탐색안에만 남긴다.
- 현재 React Native 프로토타입은 사용자 시안 선택 전까지 수정하지 않는다.

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| lint | 미실행 — 코드 변경 없음 | 해당 없음 |
| typecheck | 미실행 — 코드 변경 없음 | 해당 없음 |
| test | 미실행 — 코드 변경 없음 | 해당 없음 |
| build | 미실행 — 코드 변경 없음 | 해당 없음 |
| Web Visual QA | Vite 실제 렌더링, 데스크톱·390×844 | 데스크톱 확인, 모바일 2열 잘림 확인 |
| Image QA | 네 PNG 육안 확인, `System.Drawing` 크기 확인, `Get-FileHash -Algorithm SHA256` | 4개 모두 841×1870, 해시 기록 완료 |
| 저장소 경계 | `git status --short --branch` in `pulse_FE` | 추적 파일 변경 없음 |

## Unresolved
- 사용자가 최종 권장안 또는 다른 시안의 조합을 선택해야 한다.
- 최종 이미지는 구현 화면이 아니므로 실제 토큰, 반응형, 큰 글자, TalkBack 동작을 보장하지 않는다.
- 유형 부족·오류·첫 분석 전 상태는 TASK-016과 동일하게 별도 설계가 필요하다.
- 고객 여정을 제품에 넣으려면 Product/Spec 결정과 정본 갱신이 선행돼야 한다.

## Do Not Assume
- ImageGen의 텍스트·아이콘·간격을 그대로 제품 자산으로 사용하지 않는다.
- 화면의 리뷰 건수와 문구는 가상 데이터다.
- `pulse_FE`의 사람 아바타, 점수, 릴스 CTA는 SCC MVP 요구사항이 아니다.
- 이번 작업은 기존 TASK-016 프로토타입을 교체하거나 앱 검증을 새로 통과시킨 작업이 아니다.

## Next Action
사용자가 권장 시안과 조합을 승인하면 현재 React Native 프로토타입의 시각 계층만 토큰 기반으로 수정하고 코드 검증, Android Visual QA, 큰 글자, TalkBack, 독립 리뷰를 다시 실행한다.

## Last Verified Commit
`818bb60` — `docs(design): 웹 정렬 결과 화면 탐색 추가`
