# TASK-027 — 앱 재실행 후 분석 작업 재개

## Status
리뷰 대기

## Owner
role:feature — Codex

## Branch
feat/TASK-027-analysis-resume

## Goal
분석 작업 중 앱이 종료되거나 다시 시작되어도 로그인한 사용자의 진행 중 작업을 서버 상태 기준으로 다시 확인하고 결과 흐름까지 이어간다.
관련 이슈: 미생성
관련 요구사항: PRD FR-007·FR-012, 기능명세 ANALYSIS-001·ANALYSIS-003

## Completed
- 사용자별 진행 작업 ID·입력·실제 수신 단계를 SecureStore에 저장한다.
- 분석 화면 재진입 시 저장 작업을 복구하고 기존 polling·완료·실패 처리로 연결한다.
- 완료·실패·존재하지 않는 작업은 저장값을 정리한다.
- 복구 중임을 기존 Notice와 ProgressList로 명시한다.

## Changed
- `frontend/mobile/src/features/analysis/pendingAnalysisStorage.ts` — 사용자별 진행 작업의 안전 저장·검증·삭제
- `frontend/mobile/src/features/analysis/AnalyzeScreen.tsx` — 생성 후 저장, 재실행 복구, 단계 갱신, terminal 정리

## Decisions
- 백엔드가 실제로 반환한 단계만 저장하며 시간에 따른 가짜 단계를 만들지 않는다.
- 작업 키를 사용자 ID별로 분리하고, 복구 후에도 서버의 소유권 검사를 최종 접근 경계로 사용한다.
- 새 공용 컴포넌트나 토큰이 필요하지 않아 기존 Notice·ProgressList를 재사용한다.

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| lint | `npm --prefix frontend/mobile run lint` | PASS — 오류 0 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS |
| test | 프론트 단위 테스트 러너 없음 | 없음 |
| build | `npm --prefix frontend/mobile run export:android` | PASS — Android bundle 생성 |
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS |
| Visual QA | Medium_Phone, Android 17/API 37, 1080×2400, 420dpi, 글자 배율 1.0에서 분석 36% 중 Expo Go 강제 종료·재실행 | PASS — 동일 작업·입력·서버 단계 복원, `docs/design/evidence/TASK-027/` |

## Unresolved
- 분석 생성 POST 응답을 받기 전에 프로세스가 종료된 경우에는 jobId를 알 수 없어 자동 복구할 수 없다.
- 세션 만료 후 다시 로그인했을 때 진행 작업을 자동 재개할지에 대한 제품 정책은 SCREEN_STATES §5.1에서 아직 미정이다.
- GitHub 이슈와 PR은 GitHub 인증 복구 후 생성해야 한다.

## Do Not Assume
- 앱 재실행 복구는 서버 작업을 새로 만들지 않는다. 저장된 jobId를 조회할 뿐이다.
- SecureStore를 지원하지 않는 환경에서는 현재 프로세스 메모리만 사용하므로 앱 재실행 복구가 보장되지 않는다.

## Next Action
GitHub 인증 복구 후 PR을 만들고 `role:feature` 리뷰를 요청한다.

## Last Verified Commit
미커밋 — 검증 완료 후 기록
