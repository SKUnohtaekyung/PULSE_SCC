# TASK-025 — Flyway 마이그레이션 정합성 복구

## Status
리뷰 대기

## Owner
role:platform — Codex

## Branch
fix/TASK-025-flyway-migration

## Goal
이미 로컬 DB(시연에 쓰는 이 PC의 DB 포함)에 적용된 V4 마이그레이션의 checksum을 보존하면서, 임대 정보가 없는 RUNNING 분석 작업을 안전하게 재대기 처리한다.
관련 이슈: 미생성
관련 요구사항: `docs/decisions/ADR-012-durable-analysis-job-queue.md`

## Completed
- 적용 이력이 있는 V4 파일을 원래 내용으로 복구했다.
- RUNNING 작업 보정을 새 V6 forward migration으로 분리했다.
- V4와 V6 사이의 상태 변화를 검증하는 통합 테스트를 보강했다.
- 2026-10-12: `main`을 이 브랜치에 합치고, 적용된 마이그레이션 수를 세는 테스트의 기대값을 5에서 6으로 고쳤다. V6이 더해져 실패하던 것이며, Docker 없이 검증한 2026-10-01에는 이 테스트가 건너뛰어져 드러나지 않았다.

## Changed
- `backend/spring-api/src/main/resources/db/migration/V4__add_analysis_job_lease.sql` — 적용 당시 내용으로 복구해 checksum mismatch 제거
- `backend/spring-api/src/main/resources/db/migration/V6__requeue_prelease_running_analysis_jobs.sql` — 임대 없는 RUNNING 작업의 재대기 보정
- `backend/spring-api/src/test/java/kr/co/scc/api/database/AnalysisLeaseMigrationUpgradeTests.java` — V4에서는 상태 유지, V6에서는 재대기됨을 검증
- `backend/spring-api/src/test/java/kr/co/scc/api/database/InitialSchemaMigrationTests.java` — 성공한 마이그레이션 수 기대값 5 → 6
- `backend/README.md`, `docs/architecture/DATA_MODEL.md` — 마이그레이션 범위를 V6까지로 고치고 V6 설명 추가

## Decisions
- 이미 적용된 migration은 수정하지 않고 새 forward migration으로 후속 데이터 보정을 수행한다.
- 정상적으로 임대를 가진 RUNNING 작업은 건드리지 않도록 `lease_expires_at IS NULL` 조건을 둔다.
- 복구한 V4는 처음 들어온 커밋 `025eb8b`(2026-09-24)의 V4와 내용이 같다(2026-10-12 `git hash-object`로 비교: 둘 다 `9f91a94`). `main`의 V4는 `353285a`(2026-09-29)에서 UPDATE 문이 더해져 checksum이 달라졌다.

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
| test (2026-10-12) | `main`을 합친 깨끗한 체크아웃에서 `gradlew.bat build`, Docker 29.8.0 실행 중 | 1차 FAIL — `InitialSchemaMigrationTests.flywayCreatesTheExpectedInitialTables` `expected: 5L but was: 6L`. 기대값을 고친 뒤 PASS — `BUILD SUCCESSFUL in 1m 42s`, 121개, 건너뜀 0, 실패 0 |
| 독립 검토 (2026-10-12) | `reviewer` 서브에이전트 | PASS — 코드 결함 없음. V4가 `025eb8b`와 같음, V6 조건의 필요성, DB 종류별 결과를 확인. 문서 지적(README·DATA_MODEL의 V5 서술)을 반영했다 |
| 실제 DB (2026-10-09~12) | 이 PC의 로컬 PostgreSQL에 이 브랜치의 V4·V6 파일을 작업 폴더에 둔 채 `bootRun` | PASS — Spring이 Flyway 검증을 통과해 떴고 분석을 여러 번 돌렸다. 두 파일이 없으면 V4 checksum 불일치로 뜨지 않는다 |

## Unresolved
- **`main`의 V4(2026-09-29 이후 내용)를 이미 적용한 DB는 이 변경을 받으면 Flyway 검증에서 멈춘다.** 그 DB에 기록된 V4 checksum이 복구한 V4와 다르기 때문이다. 해당하는 것은 2026-09-29 이후에 새로 만든 로컬 DB다. 그런 DB는 새로 만드는 것이 기본 방법이다. 이 프로젝트에는 Flyway CLI나 Gradle Flyway 플러그인이 없어 `flyway repair`를 바로 실행할 수 없다. 기록을 맞춘 뒤 V6이 적용돼도 대상 행이 없어 해가 없다. 팀원들의 로컬 DB가 어느 쪽인지는 확인하지 못했다. 테스트는 매번 새 DB를 만들어 영향이 없고, 배포된 운영 DB는 없다.
- 관련 GitHub 이슈는 만들지 않았다.
- `AnalysisLeaseMigrationUpgradeTests`는 임대 없는 RUNNING 작업 1건만 넣는다. "임대를 가진 RUNNING 작업은 V6이 건드리지 않는다"는 테스트로 검증되지 않는다(reviewer 권고).
- 다른 인계 문서(TASK-029·030·031)의 "V4·V6 임시 파일이 필요하다" 서술은 이 변경이 병합되면 낡는다. 고치지 않았다.

## Do Not Assume
- 기존 public schema의 V4 checksum mismatch가 `flyway repair`로 해결된 것이 아니다. 소스 V4를 적용 당시 내용으로 되돌려 해결한다.

## Next Action
병합 뒤 팀원에게 위 Unresolved의 로컬 DB 영향을 알린다.

## Last Verified Commit
4374fc1 — 2026-10-01의 Verification 행은 이 시점까지 유효하다. 2026-10-12 행은 병합 커밋 `c8648b9`(`main`의 `dcfb3c1`을 합침)에 테스트 기대값 수정을 더한 트리로 실행했다. 그 수정은 이 문서와 같은 커밋에 들어 있다.
