# TASK-025 — Flyway 마이그레이션 정합성 복구

## Status
리뷰 대기

## Owner
role:platform — Codex

## Branch
fix/TASK-025-flyway-migration

## Goal
이미 운영 로컬 DB에 적용된 V4 마이그레이션의 checksum을 보존하면서, 임대 정보가 없는 RUNNING 분석 작업을 안전하게 재대기 처리한다.
관련 이슈: 미생성
관련 요구사항: `docs/decisions/ADR-012-durable-analysis-job-queue.md`

## Completed
- 적용 이력이 있는 V4 파일을 원래 내용으로 복구했다.
- RUNNING 작업 보정을 새 V6 forward migration으로 분리했다.
- V4와 V6 사이의 상태 변화를 검증하는 통합 테스트를 보강했다.

## Changed
- `backend/spring-api/src/main/resources/db/migration/V4__add_analysis_job_lease.sql` — 적용 당시 내용으로 복구해 checksum mismatch 제거
- `backend/spring-api/src/main/resources/db/migration/V6__requeue_prelease_running_analysis_jobs.sql` — 임대 없는 RUNNING 작업의 재대기 보정
- `backend/spring-api/src/test/java/kr/co/scc/api/database/AnalysisLeaseMigrationUpgradeTests.java` — V4에서는 상태 유지, V6에서는 재대기됨을 검증

## Decisions
- 이미 적용된 migration은 수정하지 않고 새 forward migration으로 후속 데이터 보정을 수행한다.
- 정상적으로 임대를 가진 RUNNING 작업은 건드리지 않도록 `lease_expires_at IS NULL` 조건을 둔다.

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| lint | 없음 | 없음 |
| typecheck | 없음 | 없음 |
| test | `.\backend\spring-api\gradlew.bat -p backend\spring-api test` | PASS — 116 tests, failures 0, errors 0, Docker 미실행으로 Testcontainers 26 skipped |
| build | `.\backend\spring-api\gradlew.bat -p backend\spring-api build` | PASS |
| migration | public schema 대상 `bootRun --args='--server.port=0'` | PASS — V4 checksum 검증 성공, V5·V6 적용, schema v6 |
| Visual QA | 해당 없음 | 해당 없음 |

## Unresolved
- GitHub 이슈와 PR은 GitHub 인증 복구 후 생성해야 한다.

## Do Not Assume
- 기존 public schema의 V4 checksum mismatch가 `flyway repair`로 해결된 것이 아니다. 소스 V4를 적용 당시 내용으로 되돌려 해결한다.

## Next Action
GitHub 인증을 복구한 뒤 이 브랜치의 PR을 만들고 `role:platform` 리뷰를 요청한다.

## Last Verified Commit
4374fc1 — 이 시점의 코드까지 위 Verification이 유효하다
