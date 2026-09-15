# TASK-010 — PostgreSQL 초기 스키마와 통합 테스트

## Status

구현·검증·독립 리뷰 완료 — 커밋 전

## Owner

`role:platform`

## Branch

`feat/TASK-010-initial-database-schema`

## Goal

확정된 PostgreSQL 논리 모델을 Flyway V1 migration으로 구현하고, 실제 PostgreSQL 18.6에서 핵심 소유권·근거 격리·저장 한도 제약을 검증하는 Testcontainers 테스트를 추가한다.

## Completed

- Flyway V1 초기 스키마 작성
- Testcontainers 2.0.5 PostgreSQL 통합 테스트 4개 작성

## Changed

- `backend/spring-api/src/main/resources/db/migration/V1__create_initial_schema.sql` — 초기 테이블·제약·인덱스
- `backend/spring-api/src/test/java/kr/co/scc/api/database/InitialSchemaMigrationTests.java` — 실제 PostgreSQL 검증
- `backend/spring-api/build.gradle` — Testcontainers 테스트 의존성
- `docs/decisions/ADR-007-initial-database-schema.md` — V1 적용·제외 범위 결정
- `docs/architecture/**`, `README.md`, `AGENTS.md` — 현재 구현 상태 동기화

## Decisions

- V1은 `public` schema를 사용하며 운영 배포 전 migration/runtime DB role을 분리한다.
- 미확정 인증 세션, 전화번호·네이버 URL unique, 보관·삭제 정책은 V1에서 제외한다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| Spring unit test | `.\backend\spring-api\gradlew.bat -p backend\spring-api test` | PASS, 3개 |
| PostgreSQL integration test | 위 명령 | 컴파일 PASS, 4개 미실행 — Docker 없음 |
| Flyway V1 실제 적용 | 격리 PostgreSQL 18.4 + Spring `bootRun` | PASS, migration 1개·애플리케이션 테이블 15개 |
| DB 제약 smoke test | 격리 PostgreSQL 18.4 + `psql -v ON_ERROR_STOP=1` | PASS, 저장 한도·작업 소유권·근거 격리 |
| Spring build | `.\backend\spring-api\gradlew.bat -p backend\spring-api clean build` | PASS, unit 3개 통과·integration 4개 skip |
| Python lint·format·test | Ruff check/format + pytest | PASS, 9 files·2 tests |
| 문서 링크 | Markdown 상대 링크 검사 | PASS, 54 files·141 links·broken 0 |
| diff 검사 | `git diff --check` | PASS |
| 독립 리뷰 | 작업 트리 검토 | PASS — README 상태 문구 보완 후 추가 finding 없음 |

## Unresolved

- Docker가 없어 Testcontainers 4개를 실제 실행하지 못했다. 대신 별도 PostgreSQL 18.4 임시 클러스터에서 동일 migration과 핵심 제약을 검증했다.
- 운영 DB role과 schema 분리, 인증 세션, 중복·보관·삭제 정책은 후속 결정이 필요하다.

## Do Not Assume

- Testcontainers 테스트 4개는 아직 Docker 컨테이너로 실행된 적이 없다. 격리된 로컬 PostgreSQL 검증은 이를 대체하는 추가 근거일 뿐이다.
- `auth_sessions` 테이블은 누락이 아니라 의도적으로 V1에서 제외했다.
- V1의 단일 DB 계정 구성을 운영에 그대로 사용하면 안 된다.

## Next Action

커밋·푸시한 뒤 Docker가 있는 환경에서 Testcontainers 4개를 재실행한다.

## Last Verified Commit

작업 트리 — 커밋 전.
