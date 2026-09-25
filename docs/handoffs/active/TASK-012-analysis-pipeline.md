# TASK-012 — 네이버 리뷰 수집·분석 API와 프론트 연결

## Status
구현 완료, 리뷰·병합 대기 — 전체 파이프라인이 실제 환경에서 끝까지 동작한다.
회원가입부터 페르소나 이미지 생성까지 E2E 확인, Testcontainers 포함 전체 테스트 skip 0.

## Owner
`role:feature` — 미배정 (`role:platform`, `role:product`, `role:design-system` 교차 리뷰 필요)

## Branch
`feat/TASK-012-analysis-pipeline`

## Work Note
- 원격 작업 브랜치에 push 완료. PR 은 아직 만들지 않았다.
- 분석 파이프라인 기능 구현 커밋은 `36561f6`이다. 이후 변경은 아래 날짜별 절을 본다.
- **Docker 정상 동작.** WSL2 백엔드로 붙어 Testcontainers 가 실제로 돈다.
- **OpenAI 키 설정 완료.** 실제 분석·이미지 생성까지 확인했다. 디버깅 중 `SCC_SERVICE_TOKEN` 이 로그에 노출됐으므로 교체를 권한다(localhost 전용 로컬 토큰).

## Goal
Expo 앱에서 Spring 공개 API를 통해 네이버 공개 리뷰 수집, 실제 분석 상태·결과 조회와 오류 복구를 제공하고 약관 동의 이력을 기록한다. 관련 이슈: TASK 자체 이슈 미생성, 후속 제품·정책 결정은 #28~#33. 관련 요구사항: PRD FR-001~FR-011.

## Completed
- Spring 분석 작업 생성·상태·결과·저장 결과 교체·인증 이미지 조회 API 구현
- FastAPI Playwright 공개 리뷰 수집, OpenAI Structured Outputs 분석·페르소나 이미지 생성 구현
- Expo 이메일 인증, 토큰 갱신, 세션 복원, 분석 상태 폴링, 오류 재시도, 결과·이미지 연결 구현
- 약관/개인정보 문서 버전 동의 기록과 법률 검토 전 초안·출시 체크리스트 작성
- Playwright Chromium 설치 및 headless smoke test 완료
- 제공된 테스트 매장 URL의 지도 iframe을 공개 리뷰 화면으로 정규화해 리뷰 본문 120건 수집 확인
- 마이페이지 분석 완료·실패 알림 조회와 알림 설정 조회·변경 API 구현
- 자체 계정 비밀번호 재확인을 포함한 회원 탈퇴 및 계정 연계 DB·이미지 삭제 구현
- 분석 Controller → Service → Repository 전체 흐름 Testcontainers 통합 테스트 추가
- 회원 생성 시 기본 알림 설정 생성 및 분석 실패 알림 생성 보완
- 리뷰 작성일을 네이버 구조화 필드에서 읽도록 보강해 PRD FR-009 2년 초과 경고를 실제 동작시킴
- 프론트 포디움을 항상 3칸으로 고정하고 유형이 모자라면 빈 슬롯과 근거 부족 메시지를 표시 (TASK-008 결정 9·18)
- 프론트 분석 불가 화면 신설 — 유효 리뷰 50건 미만은 실패·재시도와 분리해 원인·기준·다음 행동을 안내
- 프론트 마이페이지 알림 목록과 알림 설정을 실제 API에 연결 (기존에는 로컬 state 토글만 있었다)
- 프론트 Mock fixture를 유형 3·2·1·0개와 49건 미달 상태로 확장
- 분석·페르소나 소유권을 확인하는 cursor 기반 전체 근거 리뷰 조회 API 구현
- 프론트 4관점과 제안의 `근거 리뷰 전체 보기`를 실제 API에 연결하고 loading·error·다음 페이지 상태 구현
- 분석 작업 상태를 `QUEUED`에서 `RUNNING`으로 원자적으로 선점해 중복 dispatch가 Python/OpenAI를 재호출하지 않도록 보강
- 분석 실패 상태 변경과 실패 알림 생성을 기존 완료 저장과 같이 단일 Spring 트랜잭션으로 묶음

## Changed
- `backend/spring-api/**` — 공개 분석 API, 내부 Python gateway, 결과 저장, 이미지 보호, Flyway V3
- `backend/python-analysis/**` — 네이버 수집기, OpenAI 분석/이미지 파이프라인, 내부 API와 단위테스트
- `docs/architecture/**`, `docs/decisions/ADR-009-*` — 실제 실행·저장 경계 동기화
- `docs/legal/**` — 법률 검토 전 약관·개인정보 처리방침 초안과 체크리스트
- 별도 폴더 `C:\PULSE_SCC_FE` — API client, 보안 토큰 저장, 실제 분석/예외 UI (이 저장소 Git 범위 밖)

## Decisions
- Python은 DB를 쓰지 않고 완성 산출물을 내부 HTTP로 반환하며 Spring만 완료 트랜잭션과 영속화를 소유한다. ADR-009 참조.
- 네이버 수집기는 두 HTTPS host만 허용하고 DNS 사설주소, 로그인·차단 우회를 금지한다.
- 법률 문서는 확정본으로 표시하지 않으며 적격 법률 검토와 운영자·국외이전 정보 확정 전 운영 출시를 차단한다.
- 근거 조회 `limit` 최대값은 별도 임의값 대신 분석당 공개 리뷰 수집 상한과 같은 120으로 제한한다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| Python lint/format | `.venv\\Scripts\\python.exe -m ruff check ...`, `ruff format --check ...` | PASS |
| Python test | `.venv\\Scripts\\python.exe -m pytest backend\\python-analysis` | PASS, 7 tests |
| Spring test | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api test` | PASS, 14 tests 중 4 Testcontainers tests는 Docker 부재로 SKIP |
| Spring test (2026-09-18) | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api test --rerun-tasks` | PASS, 19 tests 중 13 PASS·6 Testcontainers SKIP |
| PostgreSQL 통합 테스트 코드 | `AnalysisApiIntegrationTests` | 분석 전체 흐름·알림·탈퇴 삭제 시나리오 작성, 컴파일 PASS |
| Playwright runtime | Chromium 설치 후 headless page title smoke | PASS |
| 네이버 공개 리뷰 수집 | 제공된 테스트 URL, limit 120 | PASS, 본문 120건(작성자 식별정보 제외) |
| Frontend lint/typecheck/test | `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` | PASS, 7 tests |
| Android bundle | `npx expo export --platform android --output-dir dist-android` | PASS |
| Visual QA | 실제 API·DB·OpenAI 키·테스트 매장 URL을 사용한 실기기 E2E | 미실행 |
| Python test (2026-09-18) | `.venv\Scripts\python.exe -m pytest backend\python-analysis` | PASS, 23 tests (기존 7 + 날짜 보강 16) |
| 2년 규칙 발동 회귀 테스트 | 위 pytest의 `test_two_year_warning_fires_only_once_dates_are_known` | PASS — 커밋된 fixture로 재현 가능. 날짜 보강 전 `False`, 후 `True` |
| 본문 접두사 충돌 처리 | 위 pytest의 `test_conflicting_dates_for_one_key_leave_the_date_unknown` 외 2건 | PASS — 충돌 시 날짜를 버리고 `None` 유지 |
| Frontend typecheck (2026-09-18) | `npx tsc --noEmit` (`C:\PULSE_SCC_FE`) | PASS |
| Frontend lint (2026-09-18) | `npm run lint` (`C:\PULSE_SCC_FE`) | PASS — `react-hooks/set-state-in-effect` 1건 수정 후 통과 |
| Frontend test (2026-09-18) | `npm test` (`C:\PULSE_SCC_FE`) | PASS, 24 tests (기존 7 + 포디움·fixture 17) |
| Frontend Visual QA | 실기기·에뮬레이터 렌더링 | **미실행 — 사용자 요청으로 이번 세션에서 서버·앱을 기동하지 않았다** |
| 날짜 보강 실데이터 확인 | 로컬에 임시 저장한 실제 `m.place.naver.com` 응답 1페이지에 수집 경로 적용 | **재현 불가 — 응답 원본을 저장소에 커밋하지 않았다.** 1회 수동 확인 결과는 `written_at` 0/10건 → 10/10건, 수집 건수 후퇴 없음이었다. 저장소로 재현 가능한 근거는 위 fixture 테스트다 |
| Spring 전체 test (2026-09-24) | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api test --rerun-tasks` | PASS, 27 tests 중 20 PASS·7 Testcontainers SKIP |
| Spring build (2026-09-24) | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api build` | PASS |
| 근거 cursor·서비스 단위 테스트 | `EvidenceCursorCodecTests`, `AnalysisServiceEvidenceTests` | PASS, malformed cursor·소유권 은닉·limit·next cursor 확인 |
| 작업 선점·실패 원자성 단위 테스트 | `AnalysisJobRunnerTests` | PASS, 중복 dispatch 중단·실패 상태/알림 트랜잭션 확인 |
| Frontend lint/typecheck/test (2026-09-24) | `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` | PASS, 24 tests |
| Python lint/format/test (2026-09-24) | `ruff check`, `ruff format --check`, `pytest` | PASS, 23 tests |
| Frontend Visual QA (2026-09-24) | Expo Web + Playwright, 390x844·1440x1000 | PASS — Mock 결과의 대표 근거·전체 목록 펼침·작성자 정보 제외·가로 overflow·콘솔 오류 0 확인. 실제 API loading·error·다음 페이지와 Android 실기기는 미확인 |

## 리뷰 작성일 보강 (2026-09-18)

기존 `_extract_date` 는 **리뷰 본문 글자에서** 정규식으로 날짜를 찾았다. 실제 리뷰 본문에는 날짜가 거의 적히지 않아 실측 10건 중 0건만 날짜를 얻었고, 그 결과 **PRD FR-009의 2년 초과 경고가 구조적으로 발동할 수 없었다.**

네이버 응답의 `representativeVisitDateTime` 만 연도를 포함한 완전한 타임스탬프다(`visited`·`created` 는 `9.13.일` 형식으로 연도가 없다). 이 값을 읽어 본문에 매칭하는 `build_date_index` 를 추가했다.

**검증된 DOM 텍스트 수집 경로는 그대로 두었다.** `__APOLLO_STATE__` 는 SSR 첫 페이지(약 20건)만 담고 나머지는 스크롤 시 GraphQL 응답으로 오므로, 구조화 추출로 전면 교체하면 수집 건수가 120건에서 20건 수준으로 후퇴해 50건 기준에 미달한다. 따라서 수집은 기존 방식을 유지하고 **날짜만 보강**한다. GraphQL 응답은 페이지가 스스로 보내는 요청의 응답을 읽을 뿐 별도 요청을 만들지 않는다.

본문 정규식 방식은 fallback 으로 남겼다. 구조화 타임스탬프가 없으면 `written_at` 은 `None` 으로 두고 연도를 추정하지 않는다.

## 프론트 구현 범위 (2026-09-18)

`C:\PULSE_SCC_FE` 는 Git 저장소가 아니라 이 커밋에 포함되지 않는다. 실제 변경 파일은 다음과 같다.

| 파일 | 내용 |
|---|---|
| `src/types/domain.ts` | `PodiumSlot`, `AppNotification`, `NotificationSetting`, `PODIUM_SLOT_COUNT`, `MINIMUM_VALID_REVIEWS` 추가 |
| `src/services/api.ts` | `mapPodium` 으로 3칸 고정, 알림 조회·설정 API 3개 추가 |
| `src/mocks/fixtures.ts` | 유형 3·2·1·0개 결과와 49건 미달 표시값 |
| `src/features/app/PulseApp.tsx` | 빈 포디움 슬롯, 분석 불가 화면, 알림 목록 연결 |
| `src/mocks/__tests__/fixtures.test.ts`, `src/services/__tests__/podium.test.ts` | 포디움 불변식 테스트 17개 |

`GET /api/v1/analyses/{analysisId}/evidence`를 구현해 전체 근거 보기를 연결했다. 대표 근거는 결과 응답의 `evidencePreview`로 먼저 표시하고, 펼치면 소유권을 확인하는 cursor API를 호출한다. Mock 모드에서는 fixture 근거를 같은 UI로 표시한다.

## 폐기한 중복 브랜치

`feat/TASK-012-naver-review-collector` (커밋 `739c516`) 는 같은 TASK 번호·같은 `collection/` 패키지·같은 ADR-009 번호로 수집 계층을 중복 구현한 브랜치다. 이 브랜치를 정본으로 유지하기로 결정하고 해당 브랜치는 개발을 중단했다. ref 는 삭제하지 않고 남겨 두었다. 위 날짜 보강은 그 브랜치에서 옮겨 온 유일한 항목이다.

## 2026-09-22 세션 종료 — 다음 세션이 이어받을 것

> **이 절의 상당 부분은 2026-09-24 에 해소됐다.** 아래 두 절을 먼저 읽는다.
> 해소된 항목: WSL·Docker(완료), OpenAI 키(설정 완료), Testcontainers 실행(skip 0),
> 내구성 있는 작업 큐(구현 완료, [ADR-011](../../decisions/ADR-011-durable-analysis-job-queue.md)),
> 전체 근거 조회(구현 완료).
> **아직 유효한 항목**: 브랜치 관계와 인증 충돌 해결 지침, PR #27 리뷰어 지정,
> 브랜치 보호 설정, 법률 검토, 실기기 확인, RAG, 제품 결정 목록(큐 방식 제외).

### 브랜치 관계 (가장 먼저 읽을 것)

- 이 브랜치는 PR #27(`feat/TASK-011-authentication`)의 **수정 전** 인증 커밋 3개(`7773443`, `e61e713`, `948e404`)를 포함한다.
- PR #27 에는 그 뒤로 오류 계약 준수·Google issuer 500 수정·계정 열거·회전 경합 수정(`aa0dfa1`, `74d6df8`, `bc6439b`)이 추가됐다. 이 브랜치에는 **없다.**
- PR #27 이 squash 병합되면 이 브랜치에 `main` 을 **merge commit 으로 연결**한다. force push 금지.
- **인증 파일 충돌은 한쪽을 통째로 택하지 말고 손으로 합친다.** 양쪽이 같은 파일을 다르게 발전시켰다.
  - 이 브랜치만 가진 것: `AuthService.register` 의 약관 동의 기록(`insertLegalConsent`)·기본 알림 설정 생성(`insertNotificationSettings`)·`LegalDocuments.requireCurrent` 검사, Google 가입 시 알림 설정 생성, `SecurityConfigTests` 의 `TransactionTemplate` mock
  - PR #27 만 가진 것: `traceId`·`fieldErrors` 오류 계약, Google issuer 문자열 클레임 처리, 이메일 320자 제한, 로그인 미끼 해시, 회전 유예 창·`deleteUnusedSession`, `RefreshSession.replacedBySessionId`, 테스트 46개
  - `main` 쪽을 통째로 택하면 **약관 동의 기록이 사라진다.** 이 브랜치 쪽을 통째로 택하면 **보안 수정이 사라진다.**
  - 합친 뒤 Spring test 전체와 로컬 DB `bootRun` + 가입·로그인·회전 호출로 재확인한다.
- 폐기한 중복 브랜치 `feat/TASK-012-naver-review-collector`(`739c516`)는 **로컬에만** 있다. 삭제 여부는 사용자 결정 대기.
- 인증 쪽 상세 상태는 PR #27 브랜치의 `docs/handoffs/active/TASK-011-authentication.md` 를 본다.

### 사람만 할 수 있는 것

| 순위 | 작업 | 풀리는 것 |
|---|---|---|
| 1 | 관리자 PowerShell `wsl --install --no-distribution` → 재부팅 | Docker → Testcontainers 6개 |
| 2 | OpenAI 새 키 발급·이전 키 폐기 → `backend/.env` 의 `SCC_OPENAI_API_KEY` | 수집→분석→이미지 전체 E2E |
| 3 | PR #27 리뷰어 지정·승인 | 인증 병합 |
| 4 | GitHub 브랜치 보호 설정 (현재 없음) | `main` 보호 |
| 5 | Google OAuth Client ID, 약관 법률 검토, 실기기 확인 | 출시 준비 |

### 결정 또는 외부 준비 후 에이전트가 이어서 할 것

| 순위 | 작업 | 메모 |
|---|---|---|
| 1 | RAG 전문 지식 검색 | 승인된 지식 출처·검수/승인 절차가 없어 구현 중지. 결정 후 `knowledgeReferences` 계약과 검색·인용 구현 |
| 2 | 내구성 있는 작업 큐 | 큐 제품 또는 DB lease·재시도·다중 인스턴스 정책이 미결정. ADR 확정 후 구현 |
| 3 | `build_reviews` 의 `len < 10` 최소 글자 수 | 제품 결정 전 임의값. 결정 후 반영 |

### 조건 충족 후 할 것

- Docker 가능 → `AnalysisApiIntegrationTests`·`InitialSchemaMigrationTests` 실행, skip 0 확인
- OpenAI 키 → 실제 매장 URL 로 E2E. 날짜 보강이 GraphQL 응답으로 120건 중 몇 건을 채우는지 측정 (현재 저장 응답 1페이지로만 확인)
- 앱 기동 → Visual QA: 빈 포디움 슬롯, 분석 불가 화면, 알림 목록

### 제품 결정 대기

| 결정 | 현재 |
|---|---|
| **유효 리뷰 50건 기준 유지 여부** | 실측 표본에서 본문 없는 리뷰가 50%. 소규모 매장은 사실상 분석 불가 |
| 리뷰 최소 글자 수 | 10자, 근거 없음 |
| 작성일 모르는 리뷰의 2년 경고 | 경고 대상에서 제외 중 (PRD 미해결 질문 13) |
| RAG 지식 출처와 승인 절차 | 승인된 운영용 마케팅 지식 베이스가 없음. `GUEST_ANALYSIS_FUNCTIONAL_SPEC.md`도 선결 결정으로 명시 |
| 내구성 큐 방식 | 외부 브로커와 PostgreSQL lease 중 선택, lease 만료·재시도·재조정 정책 미정 |
| `/register` 409 로 가입 여부 노출 | 노출 중 |
| 로그인 시도 제한 | 없음 |

### 로컬 환경 메모

- 로컬 PostgreSQL 18 에 `scc` 역할·DB 생성 완료. `backend/.env` 생성됨(gitignore). OpenAI 키만 비어 있다.
- 이 조합으로 2026-09-19 Spring `bootRun` 과 인증 API 실동작을 확인했다(상세는 TASK-011 핸드오프).
- 명령은 PowerShell 기준으로 안내한다. Git Bash 경로(`/c/...`)는 사용자 터미널에서 실패했다.

## 2026-09-24 전체 E2E 성공과 환경 문제 3건 수정

### 처음으로 전체 파이프라인이 끝까지 돌았다

실제 매장(`https://map.naver.com/p/entry/place/2080629959`)으로 `COMPLETED` 까지 확인했다. 소요 약 230초.

| 구간 | 결과 |
|---|---|
| 네이버 공개 리뷰 수집 | 120건 (유효 120건) |
| 손님 유형 도출 | 3개 — 56건·50건·40건 근거 |
| 4관점 | 4개 모두 생성 |
| 근거 리뷰 | 실제 리뷰 원문 인용 확인 |
| 페르소나 이미지 | 3장 생성, 1.5~1.8MB PNG, `backend/storage/personas/<analysisId>/` 에 저장 |
| 이미지 접근 제어 | 인증 있으면 200, 없으면 401 |
| 저장 분석 조회 | `GET /me/saved-analysis` 200 |
| Testcontainers | Docker 기동 후 skip 0 |

### 수정한 문제 3건 (커밋 `d30dd30`)

두 서비스를 함께 띄워야만 드러나는 문제였다. 단위 테스트로는 잡히지 않는다.

1. **Playwright 가 서버 안에서 죽던 문제** — uvicorn 은 reload 를 켜면 Windows 에서 `SelectorEventLoop` 를 고르는데(`loops/asyncio.py`), 이 루프는 asyncio 서브프로세스를 지원하지 않아 `NotImplementedError` 가 났다. 스크립트로는 되고 서버에서만 실패하던 원인이다. uvicorn 이 지원하는 커스텀 루프 팩토리(`asyncio:ProactorEventLoop`)로 고정했다.
2. **Spring → Python 호출이 422 로 거부되던 문제** — JDK HttpClient 기본 버전이 HTTP/2 라 평문 연결에서 `Upgrade: h2c` 를 보냈고, HTTP/1.1 만 처리하는 uvicorn 이 이를 거부하면서 chunked 본문이 유실됐다. Python 은 필드 없는 요청으로 보고 422 를 냈다. 내부 호출을 HTTP/1.1 로 고정했다. **본문 자체는 처음부터 정상이었다.**
3. **기본 저장 경로로 기동조차 못 하던 문제** — Spring 의 String → Path 변환기가 `..` 로 시작하는 값을 리소스 경로로 해석해 거부했다. 문자열로 바인딩하고 `imageStorageDirectory()` 에서 변환한다.

### 검증

| 검증 | 결과 |
|---|---|
| Spring test | PASS — 30개, **skip 0** (Testcontainers 7개 포함) |
| Python lint·format | PASS |
| Python test | PASS — 26개 |
| 전체 E2E | PASS — 위 표 |

### 내부 호출 read timeout 5m -> 15m (2026-09-24)

전체 사용자 여정을 재현하던 중 정상 작업이 **정확히 310초(5분)에 끊겼다**. `INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE` 이 떴지만 Python 로그에는 요청 완료 기록이 없었다. 즉 서비스 장애가 아니라 Spring 의 `ANALYSIS_READ_TIMEOUT=5m` 이 만료된 것이다.

수집·분석·이미지 3장을 **한 번의 동기 HTTP 호출**로 처리하는 구조라 실측 소요가 230~310초 이상이고 네이버 응답 속도 편차가 크다. `.env.example` 과 로컬 `.env` 를 15m 로 올렸다. 같은 조건으로 재실행해 268초에 `COMPLETED` 를 확인했다.

**근본 해결은 타임아웃 상향이 아니라 내구성 있는 작업 큐다.** 동기 호출로 5분 이상을 붙들고 있는 구조는 운영에서 유지할 수 없다.

### 전체 사용자 여정 재현 (2026-09-24)

| 단계 | 결과 |
|---|---|
| 약관 버전 조회 | 200 (`legallyReviewed=false`) |
| 회원가입 | 201, 토큰 발급 |
| 로그인 | 200 |
| 세션 복원 | 200 |
| 분석 작업 생성 | 202 |
| 수집·분석·이미지 | **COMPLETED, 268초** |
| 결과 조회 | 리뷰 120건, 유형 3개(56·50·42건), 4관점 전부, 실제 리뷰 인용 |
| 페르소나 이미지 | 3장 생성, 1.6~1.9MB PNG |
| 이미지 접근 제어 | 소유자 200 / 비인증 401 / **타 계정 404** |
| 첫 결과 자동 저장 | `hasSavedAnalysis` false → true |
| 근거 전체 보기 | 200, cursor 응답 정상 |
| 마이페이지 알림 | 완료·실패 알림 2건, 설정 조회 200 |
| 로그아웃 | 204 |

### 남은 것

- `.env.example` 의 `ANALYSIS_IMAGE_STORAGE_PATH=../storage/personas` 는 이제 정상 동작하지만, 배포 환경에서는 절대 경로 사용을 권한다.
- 디버깅 중 `SCC_SERVICE_TOKEN` 값이 로그에 노출됐다. localhost 전용 로컬 토큰이지만 교체를 권한다(Spring `ANALYSIS_SERVICE_TOKEN` 과 Python `SCC_SERVICE_TOKEN` 을 같은 새 값으로).
- OpenAI 실제 호출 비용이 발생한다. 반복 E2E 시 `SCC_REVIEW_COLLECTION_LIMIT` 를 낮추면 50건 게이트에서 막혀 모델 호출 없이 수집만 검증할 수 있다.

## 2026-09-24 내구성 있는 작업 큐와 페르소나 이미지 인물 포함

### 작업 큐 (Unresolved 의 "내구성 있는 큐 필요" 해소)

이전에는 컨트롤러가 작업 생성 직후 `@Async` 로 바로 실행했다. 처리 도중 서버가 재시작되면 그 작업은 RUNNING 으로 남은 채 아무도 다시 집어가지 않았고 사용자에게는 영원히 "분석 중" 으로 보였다.

이제 상태와 소유권을 DB 가 가진다. `V4__add_analysis_job_lease.sql` 이 `lease_expires_at`·`last_heartbeat_at` 과 부분 인덱스 2개를 추가한다.

| 구성 | 동작 |
|---|---|
| 집기 | `UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id` — 한 작업을 한 워커만 가져간다. 인스턴스가 여러 개여도 중복 실행이 없다 |
| 임대 | 집을 때 2분 만료를 찍고, 30초마다 하트비트로 연장한다 |
| 복구 | 임대가 만료된 RUNNING 작업을 다시 큐에 넣는다. 재시작 복구도 이 경로라 별도 기동 훅이 없다 |
| 재시도 | 최대 3회. 재시도 가능한 실패만 큐로 돌리고, 횟수를 다 쓰면 실패로 마감한다 |
| 폴링 | 기본 2초(`scc.analysis-service.poll-interval-ms`), 인스턴스당 동시 2건 |

컨트롤러는 더 이상 실행을 시작하지 않는다(`AnalysisService.dispatch` 제거). 작업은 QUEUED 로 남고 `AnalysisJobQueue` 가 집어간다.

**실제 검증 — 재시작 복구**

| 시점 | 관찰 |
|---|---|
| 처리 중 서버 강제 종료 | 작업이 `RUNNING`, 남은 임대 1분 35초 |
| 재기동 후 70초 | 임대 만료 → 자동 회수 → 재집기, `attempts=1 → 2`, 임대 갱신 |
| 이후 | `COMPLETED`, `attempts=2` |

하트비트도 DB 로 확인했다. 23:45:36 → 23:46:06 → 23:46:36 으로 정확히 30초 간격 갱신, 남은 임대가 0 으로 떨어지지 않았다.

### 페르소나 이미지에 사람 포함

이전 프롬프트는 `No text, logos, real people` 로 **사람을 명시적으로 배제**했다. 그래서 페르소나 이미지인데 사람이 없었다.

기능명세 IMAGE-001 은 "비식별 가상 이미지", IMAGE-003 은 "AI 생성 고지"를 요구할 뿐 인물 배제를 요구하지 않는다. 인구통계 추정 금지는 **분석**에 적용되는 규칙이다. 따라서 다음 조건으로 인물을 넣었다.

- 식사 장면에 stylised 인물 1~2명, 둥근 형태·최소한의 얼굴 묘사, 약간 떨어진 시점
- 특정 인물로 식별되지 않아야 하고 나이·성별·직업을 단정하지 않는다
- 사진 같은 표현·문자·로고 금지

결과 alt 텍스트도 "반찬을 덜어 담고 비벼 먹는 사람들" 처럼 행동 중심으로 바뀌었다.

### 검증

| 검증 | 결과 |
|---|---|
| Spring test | PASS — **48개, skip 0** (Testcontainers 포함) |
| Python lint·test | PASS — 26개 |
| 큐 집기 | 작업 생성 후 2초 내 RUNNING 전이 확인 |
| 하트비트 | 30초 간격 임대 갱신 확인 |
| 재시작 복구 | 위 표 |
| 전체 E2E | COMPLETED 196초, 리뷰 120건, 유형 3개, 이미지 3장(1.4~1.8MB) |

### 남은 것

- 폴링 주기·임대·재시도 횟수는 로컬 기준값이다. 운영 부하를 보고 조정한다.
- 재시도가 3회 모두 실패하면 `ANALYSIS_TIMEOUT` 으로 마감한다. 사용자에게 보여줄 문구를 제품이 확정해야 한다.
  > 정정(2026-09-26): `ANALYSIS_TIMEOUT` 마감은 임대 만료 경로에만 해당한다. 작업 안에서 난 실패는 3회째에 원래 오류 코드로 마감된다. 자세한 경로는 "기술적으로 남은 것".

## 2026-09-25 네이버 선택형 키워드 제외

"음식이 맛있어요"·"양이 많아요" 같은 "이런 점이 좋았어요" 키워드는 손님이 목록에서 고르는 것이라 직접 쓴 리뷰가 아니다. 사용자 요청으로 리뷰 종합에서 제외한다.

| 구성 | 동작 |
|---|---|
| `NAVER_VOTED_KEYWORDS` | 50개 문구 — 사용자가 제공한 음식점 통계 45개, 카페 통계에서 음식점 목록에 없던 2개(`종류가 다양해요`·`집중하기 좋아요`, 카페 통계 20개 중 18개는 겹쳤다), 카페 매장 실측에서 발견한 3개(아래) |
| `strip_voted_keywords` | `이 키워드를 선택한 인원` 문구가 있으면 통째로 버린다. 그 밖에는 끝에서부터 칩 줄(키워드 하나만 있는 줄, `+N`, 빈 줄)을 떼어 낸다. 전부 칩이면 빈 문자열이 되어 리뷰에서 빠진다 |
| `is_voted_keyword_text` | 위 처리 후 남는 글이 없으면 키워드 텍스트로 본다 |

손님이 문장 안에 직접 쓴 "가성비가 좋아요" 같은 표현, 한 줄에 키워드를 이어 쓴 "음식이 맛있어요 친절해요", 끝줄의 숫자는 본인 글이므로 남긴다. **키워드 하나만 따로 선 줄**이 본문 끝에 있을 때만 칩으로 본다.

칩으로 끝줄을 떼면 방문일 매칭 키가 GraphQL `body` 와 달라질 수 있어(본문 40자 이하일 때), **떼기 전 원문 키로 먼저** 조회하고, 못 찾으면 뗀 텍스트로 조회한다. 순서를 거꾸로 하면 뗀 텍스트와 본문이 같은 다른 리뷰의 날짜가 붙는다.

**실측** — 테스트 매장(`2080629959`)에서 DOM 원문 1,040건을 다시 수집해 확인했다.

- 현재 셀렉터는 키워드 통계 영역과 리뷰 칩을 잡지 않았다. 키워드 통계는 `li.MHaAm` 안에, 칩은 본문(`.pui__vn15t2`) 밖에 있다. 즉 이 매장에서는 원래도 섞이지 않았고, 이번 변경은 셀렉터가 바뀌거나 넓은 fallback 셀렉터가 걸릴 때를 막는 방어선이다.
- 필터 전후 리뷰 120건 → 120건, 제거·변경 0건.

**카페 실측 (2026-09-26)** — 카페 매장(`2045844114`, 사용자 제공 URL)에서 DOM 원문 1,042건을 수집해 확인했다. OpenAI 호출 없음.

- **카페도 수집 경로가 동작한다.** URL 은 `pcmap.place.naver.com/restaurant/2045844114/review/visitor` 로 변환됐고 리다이렉트 없이 그 주소에서 리뷰 화면이 열렸다.
- 필터 전후 리뷰 120건 → 120건, 제거·변경 0건. 수집한 본문 텍스트 중 키워드 칩 줄을 가진 것은 0건이었다. 음식점과 같이 현재 셀렉터는 칩을 잡지 않는다.
- 칩 조사는 수집 상한(120건)과 별개로 화면에 로드된 리뷰 항목 130개 전체를 대상으로 했다. 이 130개의 본문 뒤 줄을 뽑아 칩 문구 24종을 모았다. **목록에 없던 3개**를 추가했다: `반려동물과 가기 좋아요`(3회), `빵이 맛있어요`(1회), `차가 맛있어요`(1회). 칩 추출은 리뷰 항목 텍스트에서 본문과 `반응 남기기` 사이의 `요` 로 끝나는 20자 이하 줄을 모은 휴리스틱이다.
- 키워드 통계는 화면에 접힌 상위 5개만 보였다. 통계는 목록과 무관하게 걸러지므로 영향은 없다.

| 검증 | 결과 |
|---|---|
| Python lint·format | PASS |
| Python test | PASS — 35개 (기존 26 + 키워드 9, 카페 1개 포함. 카페 실측 3개는 기존 카페 테스트에 입력을 추가). 이 PC 에서는 `.pytest_cache` 쓰기 권한 오류로 `-p no:cacheprovider` 를 붙여 실행했다 |
| 독립 Reviewer 1차 | FAIL — 한 줄로 이어 쓴 손님 리뷰 삭제, 끝줄 숫자 삭제, 방문일 키 비대칭, 경계 테스트 누락. 위 규칙으로 수정 |
| 독립 Reviewer 2차 | FAIL — 뗀 텍스트 키를 먼저 조회해 다른 리뷰 날짜가 붙는 regression. 원문 키 우선으로 수정, 테스트 2개 추가 |

**한계**

- 목록에 없는 업종(주점 등)의 리뷰 칩은 걸러지지 않는다. 음식점·카페 목록은 사용자가 준 키워드 통계와 카페 매장 1곳 실측에서 모은 것이라, 거기 나오지 않은 키워드는 빠져 있을 수 있다(#33). 통계는 `이 키워드를 선택한 인원` 문구로 목록과 무관하게 걸러진다.
- 손님이 여러 줄로 쓰고 마지막 줄을 키워드 문구 하나로만 끝낸 경우 그 줄은 칩과 구분되지 않아 떼어진다.
- 실측은 원문에 작성자 정보가 섞일 수 있어 저장하지 않았다. 재현 불가 수동 확인이다.

## Unresolved

### 제품·법무 결정

- 네이버 정책은 원칙적으로 자동 수집을 금지한다. 명시적 승인 또는 공식 API/robots 허용 확인 전 운영 활성화 금지. 근거와 경위는 [ADR-002](../../decisions/ADR-002-review-collection.md).
- **유효 리뷰 50건 기준을 유지할지.** 실측 표본에서 본문 없는 별점 리뷰가 약 50%다. 소규모 매장은 현재 기준으로 사실상 분석이 불가능하다.
- `build_reviews` 의 `len(normalized) < 10` 최소 글자 수는 제품 결정 없이 들어간 임의 임계값이다.
- 작성일을 알 수 없는 리뷰의 2년 경고 처리(PRD 미결 질문 13). 현재는 경고 대상에서 제외한다.
- 재시도 3회를 모두 쓴 작업을 사용자에게 어떻게 표현할지.
- RAG 지식 출처와 검수·승인 절차가 없어 `knowledgeReferences` 가 비어 있다. 승인된 지식 베이스가 선결 조건이다.
- 정식 법률 검토, 운영자 정보, 보유기간, 국외 이전 정보가 미완료다.
- 위 미결정 사항은 2026-09-25 역할별 GitHub 이슈로 넘겼다(2026-09-24 에는 `gh` 인증 401 로 생성하지 못했었다).
  - #28 유효 리뷰 50건 기준·최소 글자 수, #29 작성일 미확인 리뷰의 2년 경고, #30 재시도 소진 실패 문구, #31 RAG 지식 출처와 승인 절차, #33 업종별 선택형 키워드 목록 — `role:product`
  - #32 `/register` 409 가입 여부 노출·로그인 시도 제한 — `role:platform`
  - 법률 검토, 네이버 수집 허용 확인, 브랜치 보호 설정은 사람이 외부에서 처리할 일이라 이슈로 만들지 않았다.

### 기술적으로 남은 것

- **수집 안정성 실측은 매장 2곳뿐이다.** 음식점 `2080629959`(E2E 포함)와 카페 `2045844114`(수집만, 2026-09-26)에서 120건 수집을 확인했다. 커밋된 fixture 는 1회 수동 확인한 형태를 본뜬 합성 데이터다. 네이버가 필드를 바꾸면 테스트는 통과하면서 수집만 조용히 실패할 수 있다.
- DOM 텍스트 앞에 별점 등 접두어가 붙으면 본문 매칭이 실패해 날짜가 비는 열화가 있다. 실제 수집에서 발생률을 측정해야 한다.
- 큐는 at-least-once 다. 임대 만료 직후 원 워커가 되살아나면 수집·모델 호출 비용이 두 번 발생할 수 있다([ADR-011](../../decisions/ADR-011-durable-analysis-job-queue.md) Consequences).
- 폴링 주기·임대 시간·재시도 횟수는 로컬 실측 기준값이다. 운영 부하를 보고 조정한다.
- 내부 호출 read timeout 15m 은 동기 호출 구조를 전제한 값이다. 작업을 더 쪼개면 줄일 수 있다.
- Visual QA 미실행. 빈 포디움 슬롯·분석 불가 화면·알림 목록을 실기기에서 확인해야 한다.
- 회원 탈퇴의 실제 PostgreSQL 삭제 검증은 통합 테스트 코드로만 확인했다.
- **임대 만료로 재시도 횟수를 다 쓴 작업에는 실패 알림이 생기지 않는다.** 재시도 소진에는 두 경로가 있다.
  - 작업 안에서 실패(Python 이 재시도 가능한 오류를 반환하는 등): `AnalysisJobRunner.finishFailure` → `requeueForRetry` 가 `attempt_count < maxAttempts` 조건에 걸려 false → `markFailed` 가 원래 오류 코드로 마감하고 **알림을 만든다.**
  - 임대 만료(워커 종료·하트비트 끊김): `AnalysisJobQueue.recoverAbandonedJobs` → `failExhaustedJobs` 가 `ANALYSIS_TIMEOUT` 으로 FAILED 처리하는 UPDATE 뿐이다. **알림이 빠지는 건 이 경로다.** 알림 설정이 켜져 있어도 마이페이지에 아무것도 뜨지 않는다.
  - 2026-09-26 인수인계 검토에서 코드를 읽어 확인했다. 실행 재현은 하지 않았다. 코드 미수정.

## Do Not Assume
- Android 번들 성공은 실기기 E2E 성공이나 네이버 selector 안정성을 증명하지 않는다.
- 약관과 개인정보 처리방침은 법률 검토 전 초안이다.
- 프론트 변경은 `C:\PULSE_SCC_FE`에만 있으며 현재 백엔드 저장소 커밋 대상이 아니다.
- 이 브랜치는 원격에 push 했지만 PR 은 아직 없다. PR 전에 PR #27 병합과 인증 충돌 수동 병합이 필요하다.
- E2E 가 성공했다고 네이버 selector 안정성이 증명된 것은 아니다. 전체 E2E 는 음식점 1개 매장에서 COMPLETED 3회 이상(230초·268초·196초, 재시작 복구 1회 포함)이 전부고, 카페 1개 매장은 수집 단계만 확인했다.
- 선택형 키워드 제외 목록(50개)은 사용자 제공 통계와 카페 1곳 실측으로 모은 것이다. 네이버 전체 선택지 목록이 아니다.
- 큐의 재시작 복구는 실제로 검증했지만 다중 인스턴스 동시 운영은 검증하지 않았다.

## Next Action

> **2026-09-26 세션 종료 시점.** 이 인수인계 갱신 직전 HEAD 는 `218d179` 이고 원격과 같았다. 이 인수인계 갱신 커밋 자체에는 코드 변경이 없다.
> 이 세션에서 한 것: 선택형 키워드 제외(음식점·카페, 50개), 카페 매장 실측, 후속 결정 이슈 #28~#33 생성과 #33 진행 댓글 2건.
> PR #27 은 2026-09-26 확인 시 **OPEN, 리뷰어 0명, 승인 없음**이다. 아래 1번이 풀리기 전에는 2~4번을 시작할 수 없다.

### 막혀 있는 순서

1. **사람**: PR #27 에 `role:product`·`role:platform` 리뷰어를 지정하고 병합한다.
2. 병합 후 이 브랜치에 `main` 을 merge commit 으로 연결한다. **인증 파일 충돌은 손으로 합친다**(2026-09-22 절 참조). force push 금지.
3. 합친 뒤 Spring test 전체와 로컬 DB `bootRun` + 가입·로그인·회전 호출로 재확인한다.
4. 독립 Reviewer 검토 후 TASK-012 PR 을 만든다. PR 본문 관련 이슈에 #28~#33 을 후속 결정으로 연결하되 `Refs` 로 쓴다. `Closes` 를 쓰면 결정 전인 SPEC 이슈가 병합 때 닫힌다.

### 사람만 할 수 있는 것 (2026-09-26 기준)

- GitHub 브랜치 보호 설정 (현재 없음)
- `SCC_SERVICE_TOKEN` 교체 — Spring `ANALYSIS_SERVICE_TOKEN` 과 Python `SCC_SERVICE_TOKEN` 을 같은 새 값으로
- Visual QA 용 Expo Go 또는 실기기 준비 — 빈 포디움 슬롯·분석 불가 화면·알림 목록
- Google OAuth Client ID, 약관 법률 검토, 네이버 수집 허용 확인([ADR-002](../../decisions/ADR-002-review-collection.md))

### 결정을 받으면 에이전트가 할 것

| 이슈 | 결정 | 반영 위치 |
|---|---|---|
| #28 | 유효 리뷰 50건 기준·최소 글자 수 | `build_reviews` 의 10자, Python 50건 게이트(`analysis/pipeline.py`), **DB 제약 `ck_analyses_review_counts`(V1, `valid_review_count >= 50`) — 새 Flyway migration 필요**, 프론트 분석 불가 화면. PRD FR-009 는 `role:product` 에 갱신 요청. Python 게이트만 낮추고 DB 제약을 두면 저장 단계 CHECK 위반이 재시도 가능한 실패로 처리돼 수집·OpenAI 호출이 최대 3번 반복된 뒤 실패한다(코드 흐름 추론, 미실행) |
| #29 | 작성일 미확인 리뷰의 2년 경고 | `contains_old_reviews`. PRD FR-009 는 `role:product` 에 갱신 요청 |
| #30 | 재시도 소진 실패 문구 | 프론트 실패 화면, 마이페이지 실패 알림. 단 임대 만료 경로(`ANALYSIS_TIMEOUT`)는 지금 알림 자체가 생성되지 않는다(위 "기술적으로 남은 것") |
| #31 | RAG 지식 출처·승인 절차 | `knowledgeReferences` 계약과 검색·인용 구현 |
| #32 | `/register` 409·로그인 시도 제한 | 인증 코드 (PR #27 병합 후). ADR-008·API.md 는 `role:platform` 소유 |
| #33 | 지원 업종 범위·업종별 키워드 목록 | `NAVER_VOTED_KEYWORDS`. 주점 등 목록을 받으면 카페 때와 같이 대조·추가하고 실측한다 |

### 지금 바로 할 수 있는 것 (선택)

- **재시도 소진 작업의 실패 알림 누락 수정** — `failExhaustedJobs` 가 FAILED 로 바꾼 작업에도 `markFailed` 와 같은 알림을 같은 트랜잭션에서 만든다. `role:feature` 소유(`analysis/**`)라 PR #27 과 무관하게 진행할 수 있다. 문구 자체는 #30 결정 전까지 기존 실패 알림 `message_code` 를 쓴다.
- 다른 매장(주점 등) 수집 실측. OpenAI 비용 없음. 방법은 Claude Continuation 8번.

## Claude Continuation

1. `git status --short`, `git branch -a`, `git log -3 --oneline` 으로 상태를 확인한다. **`git branch -a` 를 빼먹지 않는다** — 이전 세션이 로컬 브랜치를 못 보고 같은 TASK 를 중복 구현한 적이 있다.
2. 환경은 준비돼 있다. Docker 정상, 로컬 PostgreSQL 18 에 `scc` DB·계정 존재, `backend/.env` 설정 완료(OpenAI 키 포함).
3. 검증 명령
   - Spring: `.\backend\spring-api\gradlew.bat -p backend\spring-api test` → 48개, skip 0 이어야 한다
   - Python: `.\backend\python-analysis\.venv\Scripts\python.exe -m pytest -p no:cacheprovider backend\python-analysis` → 35개 (`-p no:cacheprovider` 는 `.pytest_cache` 쓰기 권한 오류 회피)
4. E2E 를 돌릴 때는 **OpenAI 실제 비용이 발생한다.** 수집만 확인하려면 `SCC_REVIEW_COLLECTION_LIMIT=20` 으로 띄운다. 50건 게이트에서 막혀 모델을 호출하지 않는다.
5. 서비스 기동 순서: Python(`python -m scc_analysis`, 8000) → Spring(`gradlew bootRun`, 8080). 전체 분석은 약 200~310초 걸린다.
6. 사용자 터미널은 PowerShell 이다. Git Bash 경로(`/c/...`)나 `&` 없는 따옴표 경로를 안내하면 실패한다.
7. 한글이 든 JSON 본문은 UTF-8 파일로 써서 `curl --data-binary @file` 로 보낸다. 셸 인라인은 인코딩이 깨진다.
8. 매장 수집 실측은 서버 없이 스크래치 스크립트로 한다. 모듈 함수 `review_collection_url` 로 URL 을 만들고, `_collect_from_browser` 와 같은 순서로 `page.goto` → `validate_collection_page_url` → `NaverPublicReviewCollector._open_review_surface` → `_extract_review_texts` 를 호출한다. `build_reviews` 에는 필터를 끄는 인자가 없으므로, 필터 전 결과는 `strip_voted_keywords` 를 항등 함수로 잠시 패치해 얻고 필터 후 결과와 비교한다. 칩 문구는 `li[class*='place_apply_pui']` 항목 텍스트에서 본문(`.pui__vn15t2`)과 `반응 남기기` 사이의 짧은 `요` 줄로 모은다. **원문에는 작성자 닉네임이 섞이므로 결과는 건수·문구만 남기고 원문 파일은 지운다.**

## Last Verified Commit

`be2117b` — 네이버 선택형 키워드 제외(`2c34663`), 카페 키워드 추가(`1b8a8bb`), 카페 실측 키워드 3개 추가까지. 이 커밋 기준으로 Python lint·format PASS, pytest 35개 통과, 독립 Reviewer PASS. Spring test·전체 E2E 는 이 커밋에서 재실행하지 않았다(Python 수집 모듈만 변경).

이전 기준 `025eb8b` — 작업 큐·페르소나 이미지 인물 포함까지. Spring 48개(skip 0)·Python 26개 통과, 전체 E2E COMPLETED, 재시작 복구를 실제로 검증했다.
