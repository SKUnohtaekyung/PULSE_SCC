# ADR-007 — PostgreSQL 초기 스키마 적용 범위

| | |
|---|---|
| Status | Accepted |
| Date | 2026-09-16 |
| 결정자 | 사용자 승인에 따른 `role:platform` 결정 |

## Context

[DATA_MODEL.md](../architecture/DATA_MODEL.md)는 PostgreSQL 논리 모델을 정의했지만 서비스별 schema·DB role, 인증 토큰, 전화번호와 네이버 URL의 중복 정책, 보관 기간은 미확정이었다. 개발을 시작하려면 확정된 데이터 관계는 실제 migration으로 만들되 미확정 정책은 되돌리기 어려운 제약으로 고정하지 않아야 한다.

## Decision

1. Flyway V1은 PostgreSQL `public` schema에 확정된 사용자·가게·분석 작업·리뷰·결과·페르소나·근거·저장 결과·알림 테이블을 만든다.
2. 외래키와 복합 외래키로 분석 작업의 사용자·가게 소유권과 분석별 근거 격리를 DB에서 보장한다.
3. `saved_analyses.user_id`를 기본키로 두어 계정당 저장 분석을 최대 1개로 제한한다.
4. `auth_sessions`는 토큰 저장·회전 정책 확정 전이므로 V1에서 제외한다.
5. 전화번호와 네이버 URL에는 미확정 unique 제약을 추가하지 않고, 보관 기간과 자동 삭제도 구현하지 않는다.
6. 로컬과 통합 테스트는 단일 DB 계정을 허용한다. 운영 배포 전 Flyway migration role과 Spring·Python 런타임 role을 분리한다.
7. 통합 테스트는 [Testcontainers Java 2.0.5](https://github.com/testcontainers/testcontainers-java/releases/tag/2.0.5)와 PostgreSQL 18.6 이미지를 사용한다.

## Consequences

- 확정된 관계와 저장 한도를 실제 PostgreSQL 제약으로 검증할 수 있다.
- 비즈니스 API와 ORM은 Flyway V1을 구현 계약으로 사용할 수 있다.
- 현재 단일 DB 계정은 운영용 최소 권한 구성이 아니므로 운영 배포의 선행 조건으로 role 분리가 남는다.
- 인증 세션, 전화번호 중복, URL 정규화·중복, 보관·삭제는 후속 ADR과 migration이 필요하다.
