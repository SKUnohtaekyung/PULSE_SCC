# ADR-009 — 분석 실행과 저장 경계

| | |
|---|---|
| Status | Accepted |
| Date | 2026-09-17 |
| 결정자 | `role:platform`, `role:feature` |

## Context

초기 문서는 Python이 PostgreSQL에 분석 결과를 직접 기록하는 안을 제시했지만, 두 런타임이 같은 schema를 쓰면 트랜잭션 소유권·권한·재시도 경계가 복잡해진다. 현재 MVP는 한 번의 분석 요청에서 최대 120개의 공개 리뷰를 다루며 Spring이 Flyway와 공개 작업 상태를 이미 소유한다.

## Decision

Python은 서비스 토큰으로 보호된 내부 HTTP 요청 안에서 네이버 공개 리뷰 수집, 정제, OpenAI 구조화 분석과 이미지 생성을 수행해 완성된 산출물을 반환하고, Spring Boot만 PostgreSQL 정규화 테이블·조회 문서와 이미지 파일을 저장하고 공개 상태를 완료로 전이한다.

## Reason

- DB 쓰기 주체를 Spring으로 한정해 Flyway schema와 완료 트랜잭션의 소유권을 일치시킨다.
- Python 응답은 Pydantic과 Spring record 역직렬화로 양쪽에서 구조를 검증할 수 있다.
- 서비스 토큰, host allowlist, DNS 사설주소 차단으로 내부 호출과 수집 입력 경계를 분리한다.
- MVP 구현 속도에는 맞지만 OpenAI 이미지까지 한 HTTP 응답에서 기다리는 구조의 장기 실행 위험은 남는다.

## Alternatives Considered

| 대안 | 채택하지 않은 이유 |
|---|---|
| Python이 PostgreSQL 결과 테이블에 직접 쓰기 | 런타임 DB 권한과 트랜잭션 소유가 분산되고 실패 복구가 복잡해진다 |
| 메시지 큐 + 객체 저장소 | 운영 내구성은 높지만 현재 배포 환경과 큐 제품이 미확정이다 |
| Spring에서 직접 Playwright/OpenAI 실행 | Python 분석 경계를 없애고 기존 FastAPI 프로젝트 목적과 맞지 않는다 |

## Consequences

- Spring 완료 트랜잭션에서 정규화 결과, JSON read model, 첫 저장본과 알림을 함께 기록할 수 있다.
- 내부 응답 크기에 이미지 base64가 포함되므로 timeout과 메모리 사용을 관측해야 한다.
- 현재 `@Async` executor 작업은 Spring 재시작 시 유실될 수 있다. 운영 전 내구성 있는 큐, lease, 재조정 및 idempotent 결과 저장을 도입해야 한다.
- Python 오류 코드는 Spring이 구조화해 앱의 재시도 가능 여부로 전달한다.
