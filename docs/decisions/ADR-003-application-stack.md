# ADR-003 — Android 애플리케이션과 백엔드 기술 스택

| | |
|---|---|
| Status | Accepted |
| Date | 2026-09-12 |
| 결정자 | 팀 제품·기술 결정 |

## Context

SCC 손님분석 MVP는 제공 형태와 애플리케이션 기술 스택이 미정이라 프로젝트 생성, API 경계, 데이터 저장, 인증과 이미지 생성 구현을 시작할 수 없었다.

기존 신청서에는 React, Spring Boot, FastAPI, MySQL, MongoDB, Google Veo 3가 계획으로 적혀 있었지만 현재 PRD는 손님분석 Android 앱으로 범위를 좁혔고, 2026-09-12에 기술 방향을 다시 결정했다.

## Decision

다음 상위 수준 기술 스택을 사용한다.

| 계층 | 결정 |
|---|---|
| 클라이언트 | Expo 기반 React Native Android 앱 |
| 클라이언트 언어 | TypeScript |
| 메인 백엔드 | Spring Boot |
| 데이터베이스 | PostgreSQL |
| AI·분석 처리 | Python |
| 페르소나 이미지 | OpenAI API |
| 인증 | Google 소셜 로그인 + 서비스 자체 로그인 |

Expo SDK·React Native 버전과 workflow, Spring Boot와 Python 컴포넌트 사이의 프로토콜, Python 웹 프레임워크, 버전, 빌드 도구, 배포 환경은 아직 확정하지 않는다. 실제 프로젝트 생성 전에 별도 결정하거나 이 ADR을 보완한다.

OpenAI API 키와 인증 관련 비밀은 서버에서만 관리하며 Android 앱 번들에 포함하지 않는다.

## Reason

- Android 앱이라는 제품 제공 형태가 확정됐다.
- Expo와 TypeScript를 사용해 React 기반으로 Android 클라이언트를 개발하기로 했다.
- Spring Boot를 공개 API, 인증과 데이터 영속성의 중심 백엔드로 사용하기로 했다.
- PostgreSQL 하나를 정형 데이터 저장소로 선택해 MySQL·MongoDB 이중 운영 계획을 제거했다.
- 리뷰 분석과 AI 처리는 Python 생태계를 사용한다.
- 페르소나 이미지 생성은 이전 Google Veo 계획 대신 OpenAI API를 사용한다.

위 항목은 2026-09-12 팀 결정이다. 성능·비용·운영 편의는 아직 실제 코드나 벤치마크로 검증되지 않았다.

## Alternatives Considered

| 대안 | 채택하지 않은 이유 |
|---|---|
| 모바일 웹뷰만 제공 | Android 앱으로 제품 형태를 변경하기로 결정했다 |
| FastAPI 단일 백엔드 | 메인 백엔드로 Spring Boot를 사용하기로 결정했다 |
| Spring Boot + FastAPI 확정 | Python 사용은 확정했지만 Python 서비스 프레임워크는 아직 결정하지 않았다 |
| MySQL + MongoDB | MVP에서 두 DB를 동시에 운영하지 않고 PostgreSQL 하나를 사용하기로 했다 |
| Google Veo 3 이미지·영상 생성 | 현재 MVP의 페르소나 이미지는 OpenAI API로 생성하기로 했다 |

## Consequences

**쉬워지는 것**

- 클라이언트, 메인 API, AI 처리의 책임 경계가 상위 수준에서 구분된다.
- 데이터베이스가 PostgreSQL 하나로 줄어 운영과 마이그레이션 범위가 명확해진다.
- Android 앱 인증과 사용자별 결과 접근 제어를 Spring Boot 중심으로 설계할 수 있다.

**어려워지는 것**

- Spring Boot와 Python 두 런타임을 개발·테스트·배포해야 한다.
- Expo·Spring Boot·Python 사이의 API 계약과 오류 전달 규칙이 필요하다.
- Google 로그인과 서비스 자체 로그인을 함께 운영하므로 계정 연결, 토큰, 복구와 탈퇴 정책을 추가로 결정해야 한다.
- OpenAI API 비용, 모델, 재시도, 콘텐츠 안전성과 장애 격리 정책이 필요하다.

**후속 결정**

1. Expo SDK·React Native 버전과 development build 사용 여부
2. Spring Boot·Java 버전과 빌드 도구
3. Python 버전, 프레임워크와 Spring Boot 연동 방식
4. PostgreSQL 버전과 마이그레이션 도구
5. OpenAI 이미지 모델·크기·비용 한도
6. Google·자체 로그인 계정 연결과 토큰 정책
7. 개발·운영 배포 환경

### 2026-09-16 후속 결정

후속 항목 2~4의 백엔드 언어·버전·빌드 도구, Python 프레임워크·통신 방식, PostgreSQL 버전·migration 도구는 [ADR-006](ADR-006-backend-bootstrap.md)에서 확정했다. Expo와 배포 환경 등 나머지 항목은 계속 미정이다.
