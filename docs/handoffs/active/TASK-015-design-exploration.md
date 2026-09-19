# TASK-015 — 분석 결과 화면 디자인 탐색

## Status
리뷰 대기 — Step 4 독립 리뷰 PASS, Step 5 사용자·팀 선택 대기

## Owner
role:design-system — Codex

## Branch
ui/TASK-015-design-exploration

## Goal
결과 화면의 고정 IA를 지키는 서로 다른 시각 방향을 ImageGen으로 비교하고, 구현 전에 채택할 요소와 피할 요소를 근거와 함께 정리한다.
관련 이슈: 미생성 — GitHub 인증 복구 후 연결 필요
관련 요구사항: PRD FR-005, FR-006, FR-008 및 `docs/product/requirements/RESULT_IA.md`

## Completed
- 근거 연결, 순차 안내, 빠른 비교를 각각 우선한 세 가지 시안을 생성했다.
- 세 시안의 장점을 결합한 합성안을 생성하고 결과 보장 문구와 사실·행동·AI 정보 순서를 교정했다.
- 가상 데이터임을 명시하고 채택·보류 원칙을 기록했다.
- 네 이미지 자체에 `시안용 가상 데이터` 라벨을 넣고 합성안 우선순위 문구를 관찰 사실로 교정했다.
- 생성 결과 네 장을 저장소 안의 탐색 근거로 보존했다.
- 독립 리뷰의 P1/P2 지적을 모두 보완하고 Step 4 PASS, Step 5 진입 GO 판정을 받았다.

## Changed
- `docs/design/explorations/TASK-015/README.md` — 후보 비교와 잠정 추천 방향 기록
- `docs/design/explorations/TASK-015/PROMPTS.md` — ImageGen 모드와 프롬프트 조건 기록
- `docs/design/explorations/TASK-015/*.png` — A/B/C 및 합성 시안 보존
- `docs/handoffs/active/TASK-015-design-exploration.md` — 작업 상태와 다음 게이트 기록

## Decisions
- D를 A의 판단별 근거 링크, B의 평이한 읽기 안내, C의 압축된 비교 구조를 결합한 잠정 추천 후보로 제안한다. 사용자·팀 선택 전에는 확정하지 않는다.
- D를 선택할 경우 페르소나는 사람의 인구통계를 시각화하지 않고 음식·공간의 상징적 보조 이미지로 제한한다.
- D를 선택할 경우 대표 근거와 리뷰 사실·행동을 먼저 보여 주며, AI 해석·참고 지식은 접고 효과를 약속하지 않는다.
- 이 시안은 정보 구조 탐색 근거이며 실제 UI, 실제 데이터, 디자인 토큰 정본이 아니다.

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| lint | 미실행 — 코드 변경 없음 | 해당 없음 |
| typecheck | 미실행 — 코드 변경 없음 | 해당 없음 |
| test | 미실행 — 코드 변경 없음 | 해당 없음 |
| build | 미실행 — 코드 변경 없음 | 해당 없음 |
| Visual QA | 네 생성 이미지를 직접 비교 | IA 순서, 토큰 방향, 근거/AI 구분, 인구통계 암시, 과장 문구 점검 완료 |
| 문서 링크 | 추적 Markdown의 로컬 링크를 PowerShell로 해석 | 64개 파일·175개 링크·깨진 링크 0개 |
| 이미지 무결성 | PNG signature·크기 검사 | 4개 모두 정상, 1312×1199 |
| diff | `git diff --cached --check` | PASS |
| 독립 리뷰 | 읽기 전용 요구사항·시각 재검토 | Step 4 PASS, Step 5 진입 GO |

## Unresolved
- 팀이 합성 방향을 구현 기준으로 승인했는지 아직 확인하지 않았다.
- Step 5 최종 합성에서는 TOP 3가 인기·매출 순위가 아니라 리뷰 반복량 순임을 화면 안에서 설명해야 한다.
- 최소 Android OS, 지원 기기 범위, 작은 화면/API/TalkBack 검증 조합이 제품·플랫폼 정본에 확정되지 않았다.
- GitHub 인증이 복구되기 전까지 관련 이슈를 생성·연결하지 못한다.
- 제품 화면의 개발 빌드 식별자와 scheme, USB 실기기 TalkBack 청취 검증은 미완료다.

## Do Not Assume
- 이미지 속 상호명, 리뷰, 날짜, 수치, 손님 유형은 모두 가상이다.
- 합성안의 픽셀 값과 문구는 디자인 토큰이나 제품 요구사항의 정본이 아니다.
- Android 에뮬레이터 TalkBack 포커스 확인은 실제 사용자의 한국어 발화 청취 검증을 대신하지 않는다.
- 이 작업이 완료되어도 지원 범위가 확정되기 전에는 제품 결과 화면 구현을 시작하지 않는다.

## Next Action
합성 방향을 팀과 확인하고, 제품·플랫폼 소유자에게 Android 지원 범위와 개발 빌드 식별자 결정을 요청한다.

## Last Verified Commit
미커밋 — 검증과 독립 리뷰 후 기록
