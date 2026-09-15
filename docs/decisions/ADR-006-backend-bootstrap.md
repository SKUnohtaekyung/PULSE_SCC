# ADR-006 — 백엔드 실행 스택과 프로젝트 경계

| | |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| 결정자 | 사용자 승인에 따른 `role:platform` 결정 |

## Context

[ADR-003](ADR-003-application-stack.md)은 Spring Boot·PostgreSQL·Python이라는 상위 방향만 확정했다. 실제 백엔드 프로젝트를 생성하려면 JVM 언어·버전·빌드 도구, Python 웹 프레임워크, PostgreSQL 버전과 migration 소유자, 서비스 간 통신 경계를 정해야 한다.

로컬에서는 Java 21.0.8과 Python 3.13.2가 실행 확인됐지만 시스템 Gradle과 Docker는 설치되어 있지 않았다. 따라서 팀원별 전역 Gradle 설치에 의존하지 않고, Docker 미설치 환경에서도 각 애플리케이션의 단위 검증은 가능해야 한다.

## Decision

| 영역 | 결정 |
|---|---|
| 외부 API | Spring Boot 4.1.1, Java 21 |
| JVM 빌드 | 저장소에 포함한 Gradle Wrapper 9.7.1 |
| Python 내부 서비스 | FastAPI 0.141.1, Python 3.13 |
| 서비스 통신 | Spring Boot에서 Python으로 가는 인증된 내부 HTTP |
| 데이터베이스 | PostgreSQL 18.6 단일 사용 |
| migration | Spring Boot의 Flyway가 단독 소유 |
| Python DB 드라이버 | Psycopg 3 |
| 로컬 DB | Docker Compose의 공식 PostgreSQL 이미지 |
| 프로젝트 위치 | `backend/spring-api`, `backend/python-analysis` |

Spring Boot는 외부 `/api/v1/**`, 인증·권한, 공개 작업 상태, 첫 결과 저장과 알림 완료 트랜잭션을 소유한다. Python은 외부에 노출하지 않는 내부 분석 경계로 두며 리뷰 정제·분석·AI 처리를 담당한다.

비즈니스 테이블 migration과 공개 API 구현은 이 부트스트랩에 포함하지 않는다. 실제 migration이 추가되면 DB 구조의 정본은 `backend/spring-api/src/main/resources/db/migration/**`가 된다.

## Reason

- Java 21은 로컬에서 실행 확인된 LTS 런타임이며 [Spring Boot 4.1.1 시스템 요구사항](https://docs.spring.io/spring-boot/system-requirements.html)의 지원 범위를 충족한다.
- Gradle Wrapper는 시스템 Gradle이 없는 현재 PC에서도 같은 버전의 빌드 도구를 내려받아 실행한다. 생성된 9.7.1 Wrapper로 실제 빌드했고 [공식 체크섬](https://gradle.org/release-checksums/)으로 배포 ZIP과 Wrapper JAR의 무결성을 고정·확인했다.
- [FastAPI 0.141.1](https://pypi.org/project/fastapi/)은 Spring과 분리된 Python 분석 컴포넌트의 작은 내부 HTTP 경계를 만들기 적합하며 Python 3.13에서 설치·테스트했다.
- [PostgreSQL 지원 정책](https://www.postgresql.org/support/versioning/)상 18은 지원 중인 메이저 버전이다. 공식 `18.6-alpine3.23` 이미지를 고정해 팀별 로컬 환경 차이를 줄인다.
- Python의 PostgreSQL 연결에는 신규 프로젝트용 현행 구현인 [Psycopg 3](https://pypi.org/project/psycopg/)를 사용한다.
- migration을 Flyway 한 곳에서만 관리하면 Spring과 Python이 서로 다른 migration 도구로 같은 스키마를 변경하는 충돌을 피할 수 있다.

## Alternatives Considered

| 대안 | 채택하지 않은 이유 |
|---|---|
| Kotlin + Gradle | 팀 공통 언어 비용을 줄이기 위해 Java를 선택했다 |
| 시스템 Gradle 설치 | 팀원 환경마다 버전이 달라질 수 있어 Wrapper를 선택했다 |
| Python 단일 외부 API | ADR-003의 Spring Boot 중심 인증·권한 경계와 맞지 않는다 |
| 메시지 큐 기반 통신 | 현재 MVP 규모에서 운영 요소가 늘어나며, 필요성이 확인되면 별도 ADR로 재검토한다 |
| Python Alembic 병행 | 동일 PostgreSQL schema에 migration 소유자가 둘이 되는 문제를 피한다 |
| PostgreSQL에 이미지 바이너리 저장 | 객체 저장소가 확정되기 전이며 현재는 이미지 메타데이터만 DB 대상으로 둔다 |

## Consequences

**쉬워지는 것**

- 전역 Gradle 없이 Spring 프로젝트를 빌드할 수 있다.
- 공개 API와 AI 분석 컴포넌트를 독립적으로 테스트하고 배포할 수 있다.
- PostgreSQL schema 변경 경로가 Flyway 하나로 고정된다.
- 로컬 환경변수 이름과 헬스 체크 경로가 생긴다.

**어려워지는 것**

- Spring과 Python 두 런타임을 함께 운영해야 한다.
- 내부 HTTP 인증·timeout·재시도·멱등성 구현이 필요하다.
- Docker가 없는 현재 PC에서는 PostgreSQL 통합 테스트를 실행할 수 없다.
- Spring Boot 4와 PostgreSQL 18의 minor 업데이트는 보안 수정 확인 후 별도 의존성 갱신 작업으로 관리해야 한다.
