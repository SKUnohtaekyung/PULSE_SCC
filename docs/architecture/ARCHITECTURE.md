# SCC — Architecture

**이 문서는 시스템 구조의 정본이다.**

| | |
|---|---|
| 상태 | **백엔드 실행 골격 구현 — 비즈니스 API·migration 전** |
| 최종 수정 | 2026-09-16 |
| 소유 역할 | `role:platform` |

---

## 1. 현재 상태

상위 수준 구조는 [ADR-003](../decisions/ADR-003-application-stack.md), 백엔드 실행 스택과 프로젝트 경계는 [ADR-006](../decisions/ADR-006-backend-bootstrap.md)으로 확정했다. 공개 API와 PostgreSQL 논리 설계는 [API.md](API.md), [DATA_MODEL.md](DATA_MODEL.md)에 기록했다. 현재 Spring Boot와 FastAPI의 실행 골격·헬스 체크·환경 설정은 존재하지만 비즈니스 API와 Flyway migration은 아직 없다.

| 항목 | 상태 |
|---|---|
| 프로젝트 유형 | Android 앱 + 자체 API + Python AI 처리 |
| Frontend | Expo 기반 React Native + TypeScript |
| Backend | Spring Boot 4.1.1 + Java 21 + Gradle Wrapper 9.7.1 |
| AI·분석 | FastAPI 0.141.1 + Python 3.13 |
| 데이터 저장소 | PostgreSQL 18.6, Flyway migration은 Spring 단독 소유 |
| 인증 방식 | Google 소셜 로그인 + 서비스 자체 로그인 |
| 페르소나 이미지 | OpenAI API |
| 배포 환경 | 확정 필요 |
| 저장소 구조 | 단일 저장소의 `backend/spring-api`, `backend/python-analysis` 독립 프로젝트 |

프론트엔드 프로젝트 위치는 프론트엔드 스택 세부 결정 후 추가한다. 백엔드는 각 런타임의 관례를 유지하는 독립 프로젝트로 구성하며 공통 소스 패키지를 섣불리 만들지 않는다.

### 목표 호출 흐름

```text
Expo + React Native + TypeScript Android 앱
  → Spring Boot API
      ├─ 인증·권한
      ├─ 분석 작업 상태
      ├─ 저장 결과 선택·마이페이지 API
      ├─ PostgreSQL
      └─ 내부 인증 경계
          → Python AI·분석 컴포넌트
              ├─ 네이버 리뷰 수집·정제
              ├─ 분석·근거 연결·제안 생성
              ├─ OpenAI API 이미지 생성
              └─ PostgreSQL
```

Spring Boot와 Python은 인증된 내부 HTTP로 통신한다. 공개 상태와 완료 트랜잭션은 Spring이 소유하고 Python은 준비된 분석 산출물을 전달한다. 구체 endpoint와 서비스 토큰·timeout·재시도 값은 [API.md §9](API.md#9-spring-bootpython-내부-계약)에 따라 비즈니스 API 구현 시 확정한다. 작업 큐 도입 여부는 아직 결정하지 않았다.

분석 결과 저장은 [ADR-005](../decisions/ADR-005-analysis-storage-policy.md)를 따른다. PostgreSQL에서 계정당 저장 분석 1개를 고유 제약으로 보장한다. 저장본이 없으면 첫 결과를 자동 저장하고, 이후 새 분석에서는 사용자가 새 결과로 교체하거나 기존 결과를 유지한다. 기존 결과 유지 시 미저장 새 결과의 접근·삭제 정책은 아직 미정이다. MySQL·MongoDB를 별도로 도입하지 않으며 작업·리뷰·분석 결과도 PostgreSQL 논리 모델로 통합한다.

## 1-A. 신청서에 선언된 기술 계획 — ⚠️ 계획일 뿐 확정 아님

2026-06-28 신청서와 내부 설계 문서에 적힌 내용이다. **대외 문서에 이미 선언됐지만 ADR로 확정되지 않았고, 실행·검증 증빙이 없다.**
위 1장의 "확정 필요"는 그대로 유효하다. 이 절은 *무엇이 이미 대외에 선언됐는가*를 기록할 뿐이다.

정본: [docs/program/APPLICATION_F12.md ③](../program/APPLICATION_F12.md)

### 사용자 흐름 (설계)

1. 매장 리뷰 또는 예시 데이터를 입력한다
2. 반복 의견, 긍정·불만, 핵심 키워드와 주제를 분석한다
3. 대표 손님 유형, 니즈·불편, 고객여정과 실행 제안을 확인한다
4. 분석 결과의 타깃·분위기를 영상 제작 단계로 넘긴다
5. 음식·매장 사진을 올려 세로형 홍보영상을 생성한다
6. 손님 유형·키워드와 맞는 지역 푸드 인플루언서를 추천한다

> 3단계 "대표 손님 유형"은 근거 문제가 있다. [PROBLEM_BASELINE.md §2.6](../product/PROBLEM_BASELINE.md) 참조

### 기술 스택 (과거 신청서 선언, 현재 정본 아님)

| 계층 | 선언된 값 |
|---|---|
| 프론트엔드 | React |
| 메인 백엔드 | Spring Boot |
| AI·데이터 서버 | FastAPI |
| 정형 데이터 | MySQL |
| 원본 리뷰·분석 로그 | MongoDB |
| 한국어 형태소 분석 | Kiwi |
| 토픽 군집화 | BERTopic |
| 쉬운 문장형 인사이트 | LLM + 실제 리뷰 근거 기반 생성(RAG) |
| 지역 정보 | Kakao Local API |
| 영상 생성 | Google Veo 3 API |
| 개발 방식 | Claude Code 기반 AI 에이전트 개발 |

문서상 호출 흐름: `React → Spring Boot → FastAPI → 외부 AI·데이터 API → 결과 반환`

현재 결정은 [ADR-003](../decisions/ADR-003-application-stack.md)과 [ADR-006](../decisions/ADR-006-backend-bootstrap.md)이다. FastAPI 내부 서비스와 PostgreSQL 하나를 사용하며, 영상 생성이 아닌 페르소나 이미지 생성에 OpenAI API를 사용한다.

### 영상 프롬프트 설계

- 9:16 세로형, 8~10초
- HOOK 0~3초 / BODY 3~7초 / OUTRO 7~10초
- 에너지·프리미엄·무드 스타일 매핑
- 업로드된 음식 이미지와 페르소나를 반영
- **생성 모델에는 글자·자막·워터마크를 만들지 않도록 제한**

> ⚠️ 마지막 항목이 신청서 9주차 "자막·템플릿" 구현과 충돌한다. 후처리 합성 방식인지 확정해야 한다.

### 데이터 수집

**여기가 가장 큰 리스크다.** 과거 내부 기술 문서는 Playwright로 네이버·카카오 리뷰를 자동 수집하는 구조를 제안했고, 두 플랫폼의 robots.txt는 AI·RAG 용도의 봇 접근을 명시적으로 금지한다. 현재 MVP 수집 대상은 [ADR-004](../decisions/ADR-004-naver-only-review-source.md)에 따라 네이버로 한정하지만, 네이버의 자동 수집 위험은 그대로 남는다.

허용 순위와 근거는 [PROBLEM_BASELINE.md §2.5](../product/PROBLEM_BASELINE.md) 를 따른다. **ADR 없이 구현에 착수하지 않는다.**

## 2. 디렉터리 구조

현재 존재하는 것만 적는다.

```
SCC/
├─ AGENTS.md            공통 Agent 계약 (Claude + Codex)
├─ CLAUDE.md            Claude 전용 지침
├─ README.md
├─ .gitignore
│
├─ backend/
│  ├─ spring-api/       Spring Boot 공개 API·Flyway 소유
│  ├─ python-analysis/  FastAPI 내부 분석 서비스
│  ├─ compose.yaml      로컬 PostgreSQL
│  └─ .env.example      비밀이 없는 환경변수 예시
│
├─ docs/
│  ├─ product/          제품 요구사항 정본
│  ├─ design/           UI/UX 원칙 정본
│  ├─ architecture/     시스템 구조·API·PostgreSQL 논리 설계
│  ├─ decisions/        ADR
│  └─ handoffs/         작업 인수인계 (active / archive)
│
├─ .claude/             Claude Code 설정 (팀 공용)
│  ├─ settings.json
│  ├─ rules/
│  ├─ agents/
│  └─ skills/
│
└─ .github/             이슈 / PR 템플릿
   └─ ISSUE_TEMPLATE/
```

프론트엔드가 생성되면 실제 경로를 이 구조에 추가한다.

## 3. 구조 결정 시 지킬 것

1. **프레임워크 관례를 우선한다.** 임의의 구조를 프레임워크 관례보다 앞세우지 않는다.
2. **필요해진 시점에 만든다.** 공유할 코드가 없는데 `packages/` 를 미리 만들지 않는다.
3. **결정은 ADR로 남긴다.** `docs/decisions/`
4. 공개 API 설계는 `docs/architecture/API.md`에서 관리한다. 실제 OpenAPI/schema/types가 생기면 구현 계약의 정본으로 승격하고 문서와 동기화한다.
5. PostgreSQL 논리 모델은 `docs/architecture/DATA_MODEL.md`에서 관리한다. 실제 migration이 생기면 컬럼·타입·제약의 정본은 migration과 ORM 모델이다.

## 4. 4인 협업을 위한 구조 요건

구조를 정할 때 다음을 만족하는지 확인한다. (`AGENTS.md` 5장 소유 영역과 연결)

- 역할별 소유 경계가 디렉터리로 구분되는가
- 두 사람이 같은 파일을 자주 고쳐야 하는 지점이 있는가 (있으면 분리한다)
- 공용 UI 컴포넌트·토큰이 한 곳에 모여 있는가
- 기능 추가가 기존 파일 수정이 아니라 새 파일 추가로 끝나는가

## 5. Open Questions

| # | 질문 | 막고 있는 것 |
|---|---|---|
| 1 | Expo SDK·React Native 버전과 workflow | 클라이언트 생성·실행 명령 |
| 2 | 내부 HTTP 서비스 토큰·timeout·재시도 값 | 분석 서비스 호출 구현 |
| 3 | 작업 큐 도입 여부 | 장기 분석 실행·복구 방식 |
| 4 | 배포 환경 | CI·컨테이너·비밀 관리 방식 |
