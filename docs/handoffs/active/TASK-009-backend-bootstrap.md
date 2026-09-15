# TASK-009 — 백엔드 실행 환경과 프로젝트 구조

## Status

구현·로컬 검증·독립 리뷰 완료 — PR 전

## Owner

`role:platform`

## Branch

`chore/TASK-009-backend-bootstrap`

## Goal

권장 백엔드 구성을 실제 실행 가능한 프로젝트 골격으로 만들고, Spring Boot·FastAPI·PostgreSQL의 버전·실행 명령·환경변수·소유 경계를 정본 문서와 동기화한다.

## Completed

- Spring Boot 4.1.1·Java 21·Gradle Wrapper 9.7.1 프로젝트 생성
- Spring Security 기본 거부 정책과 공개 Actuator health endpoint 구성
- PostgreSQL datasource, JPA validate, Flyway와 Python 내부 서비스 설정 구성
- FastAPI 0.141.1·Python 3.13 프로젝트와 내부 health endpoint 생성
- Psycopg 3, pytest, Ruff 개발 환경과 단위 테스트 구성
- PostgreSQL 18.6 Docker Compose와 `.env.example` 작성
- PostgreSQL 포트를 loopback에만 바인딩하고 Gradle 배포본 체크섬 검증 구성
- Python 환경변수 기반 실행 진입점과 Spring Security 기본 차단 회귀 테스트 추가
- 백엔드 실행 결정 ADR-006과 프로젝트 계약·아키텍처·검증 절차 동기화

## Verification

| 검증 | 결과 |
|---|---|
| Spring test | Gradle `clean build` → PASS, 3 tests |
| Spring build | `.\backend\spring-api\gradlew.bat -p backend\spring-api clean build` → PASS, 실행 JAR 생성 |
| Gradle 무결성 | 배포 ZIP SHA-256 고정, Wrapper JAR SHA-256가 공식 값과 일치 |
| Python install | `pip install -e ".[dev]"` → PASS |
| Python lint | `ruff check --no-cache .` → PASS |
| Python format | `ruff format --check --no-cache .` → PASS, 9 files |
| Python test | `pytest` → PASS, 2 tests |
| Python health | `SCC_PORT=18001`, `SCC_ENVIRONMENT=test`로 `python -m scc_analysis` 실행 후 `GET /internal/v1/health` → 200 |
| 독립 리뷰 | PASS — correctness·security·scope·문서 일관성 추가 finding 없음 |
| PostgreSQL Compose | 미실행 — 현재 PC에 Docker 없음 |
| Spring bootRun | 미실행 — PostgreSQL 미기동 |

## Decisions

1. Spring Boot 4.1.1, Java 21, Gradle Wrapper 9.7.1을 사용한다.
2. Python 내부 서비스는 FastAPI 0.141.1과 Python 3.13을 사용한다.
3. PostgreSQL 18.6 하나를 사용하고 Flyway migration은 Spring Boot가 단독 소유한다.
4. Spring Boot와 Python은 인증된 내부 HTTP로 통신한다.
5. 현재 단계에서는 health와 안전한 기본 설정만 구현하고 비즈니스 API·migration을 만들지 않는다.

## Unresolved

1. 실제 배포 환경과 비밀 관리 방식
2. 내부 서비스 토큰 회전·timeout·재시도 값
3. Spring·Python PostgreSQL schema와 DB role 분리
4. 작업 큐 도입 여부
5. CI 실행 환경과 Docker 기반 PostgreSQL 통합 테스트 방식

## Next Action

사용자 확인 후 이 브랜치를 커밋하고 PR을 만든다. 다음 백엔드 TASK는 `docs/architecture/DATA_MODEL.md`를 기준으로 첫 Flyway migration과 Testcontainers PostgreSQL 통합 테스트를 구현한다.

## Last Verified Commit

작업 트리 — 커밋 전. 커밋 후 실제 hash로 갱신한다.
