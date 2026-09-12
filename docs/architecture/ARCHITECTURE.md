# SCC — Architecture

**이 문서는 시스템 구조의 정본이다.**

| | |
|---|---|
| 상태 | **상위 수준 스택 확정 — 코드 없음** |
| 최종 수정 | 2026-09-13 |
| 소유 역할 | `role:platform` |

---

## 1. 현재 상태

저장소에 애플리케이션 코드는 아직 없다. 상위 수준 구조는 [ADR-003](../decisions/ADR-003-application-stack.md)으로 확정했고, 세부 버전·도구·배포 방식은 미확정이다.

| 항목 | 상태 |
|---|---|
| 프로젝트 유형 | Android 앱 + 자체 API + Python AI 처리 |
| Frontend | Expo 기반 React Native + TypeScript |
| Backend | Spring Boot |
| AI·분석 | Python. 프레임워크 TBD |
| 데이터 저장소 | PostgreSQL |
| 인증 방식 | Google 소셜 로그인 + 서비스 자체 로그인 |
| 페르소나 이미지 | OpenAI API |
| 배포 환경 | 확정 필요 |
| monorepo 여부 | 확정 필요 |

코드가 없는 상태에서 `apps/`, `packages/` 같은 빈 디렉터리를 미리 만들지 않는다. 실제 Expo·Spring Boot·Python 프로젝트를 생성할 때 프레임워크 관례와 역할 경계를 기준으로 구조를 확정한다.

### 목표 호출 흐름

```text
Expo + React Native + TypeScript Android 앱
  → Spring Boot API
      ├─ 인증·권한
      ├─ 분석 작업 상태
      ├─ PostgreSQL
      └─ Python AI·분석 컴포넌트
          └─ OpenAI API 이미지 생성
```

Spring Boot와 Python 사이의 통신 방식, 리뷰 수집기의 실행 위치와 작업 큐 사용 여부는 아직 결정하지 않았다.

분석 결과 저장은 [ADR-005](../decisions/ADR-005-analysis-storage-policy.md)를 따른다. PostgreSQL에서 계정당 저장 분석 1개를 고유 제약으로 보장한다. 저장본이 없으면 첫 결과를 자동 저장하고, 이후 새 분석에서는 사용자가 새 결과로 교체하거나 기존 결과를 유지한다. 기존 결과 유지 시 미저장 새 결과의 접근·삭제 정책은 아직 미정이다.

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

현재 결정은 [ADR-003](../decisions/ADR-003-application-stack.md)이다. FastAPI는 확정하지 않았고, MySQL·MongoDB 대신 PostgreSQL 하나를 사용하며, 영상 생성이 아닌 페르소나 이미지 생성에 OpenAI API를 사용한다.

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
├─ docs/
│  ├─ product/          제품 요구사항 정본
│  ├─ design/           UI/UX 원칙 정본
│  ├─ architecture/     시스템 구조 정본
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

애플리케이션 코드가 생기면 여기에 실제 구조를 추가한다.

## 3. 구조 결정 시 지킬 것

1. **프레임워크 관례를 우선한다.** 임의의 구조를 프레임워크 관례보다 앞세우지 않는다.
2. **필요해진 시점에 만든다.** 공유할 코드가 없는데 `packages/` 를 미리 만들지 않는다.
3. **결정은 ADR로 남긴다.** `docs/decisions/`
4. 백엔드/API가 생기면 `docs/architecture/API.md` 를 신설한다. **지금 만들지 않는다.**
5. DB/스키마가 생기면 `docs/architecture/DATA_MODEL.md` 를 신설한다. **지금 만들지 않는다.**
   - 단, API 계약과 DB 구조의 정본은 문서가 아니라 실제 schema/types/migration 이다. 문서는 그 위치와 설계 의도를 설명한다.

## 4. 4인 협업을 위한 구조 요건

구조를 정할 때 다음을 만족하는지 확인한다. (`AGENTS.md` 5장 소유 영역과 연결)

- 역할별 소유 경계가 디렉터리로 구분되는가
- 두 사람이 같은 파일을 자주 고쳐야 하는 지점이 있는가 (있으면 분리한다)
- 공용 UI 컴포넌트·토큰이 한 곳에 모여 있는가
- 기능 추가가 기존 파일 수정이 아니라 새 파일 추가로 끝나는가

## 5. Open Questions

| # | 질문 | 막고 있는 것 |
|---|---|---|
| 1 | 실제 프로젝트 디렉터리와 monorepo 여부 | 디렉터리 구조 전체 |
| 2 | Expo SDK·React Native 버전과 workflow | 클라이언트 생성·실행 명령 |
| 3 | Spring Boot·Java 버전과 빌드 도구 | 백엔드 생성·실행 명령 |
| 4 | Python 프레임워크와 Spring Boot 연동 방식 | AI 서비스 경계 |
| 5 | PostgreSQL 마이그레이션 도구 | DB 스키마 정본 위치 |
| 6 | 배포 환경 | CI 워크플로 |
