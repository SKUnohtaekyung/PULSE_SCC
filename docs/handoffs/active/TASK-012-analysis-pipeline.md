# TASK-012 — 네이버 리뷰 수집·분석 API와 프론트 연결

## Status
구현 진행 — 전체 근거 조회 연결 완료, 실제 PostgreSQL 실행 검증 대기

## Owner
`role:feature` — 미배정 (`role:platform`, `role:product`, `role:design-system` 교차 리뷰 필요)

## Branch
`feat/TASK-012-analysis-pipeline`

## Work Note
- 2026-09-24 전체 근거 조회와 작업 선점·실패 트랜잭션 변경은 `c35c342`에 커밋했다. 이 인수인계 갱신 커밋과 함께 원격 작업 브랜치에 push한다.
- 최신 커밋은 `6a79607`, 분석 파이프라인 기능 구현 커밋은 `36561f6`이다.
- Docker Desktop은 설치됐지만 WSL 런타임 미완료로 엔진이 시작되지 않는다. 로컬 PostgreSQL 18은 실행 중이나 테스트 계정 접속정보가 없다.
- 채팅에 노출된 OpenAI 키는 사용하지 않았으며 폐기·재발급해야 한다. 새 키는 로컬 `backend/.env`에만 설정한다.

## Goal
Expo 앱에서 Spring 공개 API를 통해 네이버 공개 리뷰 수집, 실제 분석 상태·결과 조회와 오류 복구를 제공하고 약관 동의 이력을 기록한다. 관련 이슈: 미생성. 관련 요구사항: PRD FR-001~FR-011.

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

## Unresolved
- 네이버 정책은 원칙적으로 자동 수집을 금지한다. 명시적 승인 또는 공식 API/robots 허용 확인 전 운영 활성화 금지.
- 실제 OpenAI API 호출을 포함한 전체 분석 E2E는 미실행. 채팅에 노출된 키는 사용하지 않고 폐기·재발급이 필요하다.
- Docker Desktop 4.91.0과 WSL/VirtualMachinePlatform 기능은 설치·활성화했으나 재부팅 전이라 Flyway V3와 PostgreSQL 저장 통합 테스트는 미실행.
- 2026-09-18 Docker Desktop 프로세스는 시작됐으나 WSL 런타임이 설치 완료 상태가 아니어서 엔진 연결 실패. 로컬 PostgreSQL 18 서비스는 실행 중이나 테스트 계정 비밀번호가 없어 실제 통합 테스트는 계속 미실행.
- Spring 인프로세스 비동기 작업은 재시작 복구·다중 인스턴스를 지원하지 않는다. 운영 전 내구성 큐 필요.
- RAG 전문 지식 검색은 아직 구현되지 않아 제안의 지식 참고 목록이 비어 있다.
- 위 두 미결정 사항을 역할별 GitHub 이슈(`role:product`, `role:platform`)로 넘기려 했으나 2026-09-24 로컬 `gh` 인증이 HTTP 401을 반환해 이슈를 생성하지 못했다. 인증 복구 후 생성해야 한다.
- 날짜 보강의 **실제 브라우저 수집 중 동작은 미검증이다.** 저장된 응답과 단위 테스트로만 확인했다. 실제 수집 시 GraphQL 응답이 몇 건의 날짜를 채우는지는 다음 E2E에서 측정해야 한다.
- `build_reviews` 의 `len(normalized) < 10` 최소 글자 수는 제품 결정 없이 들어간 임의 임계값이다. 확정하거나 제거해야 한다.
- 실제 네이버 응답의 필드 형태(`__typename`, `representativeVisitDateTime`)를 저장소 안의 원자료로 대조하지 못했다. 커밋된 fixture는 1회 수동 확인한 형태를 본떠 만든 합성 데이터이므로, 네이버가 필드를 바꾸면 테스트는 통과하면서 수집만 조용히 실패할 수 있다.
- DOM 텍스트 앞에 별점 등 접두어가 붙으면 본문 매칭이 실패해 날짜가 비는 열화가 발생한다. 실제 수집에서 발생률을 측정해야 한다.
- 정식 법률 검토, 운영자 정보, 보유기간, 국외 이전 정보가 미완료다. 탈퇴·연계 데이터 삭제 코드는 구현됐지만 실제 PostgreSQL 검증은 남아 있다.

## Do Not Assume
- Android 번들 성공은 실기기 E2E 성공이나 네이버 selector 안정성을 증명하지 않는다.
- 약관과 개인정보 처리방침은 법률 검토 전 초안이다.
- 프론트 변경은 `C:\PULSE_SCC_FE`에만 있으며 현재 백엔드 저장소 커밋 대상이 아니다.
- 이 브랜치는 2026-09-24 변경까지 원격 작업 브랜치에 push하며 PR은 아직 생성하지 않았다.

## Next Action
`c35c342` 변경을 독립 리뷰한 뒤 PR을 생성한다. `gh auth` 복구 후 RAG 지식 출처/승인 절차는 `role:product`, 내구성 큐 방식은 `role:platform` 이슈로 생성한다. WSL/Docker 엔진을 정상화하거나 전용 PostgreSQL 테스트 DB 접속정보를 준비하면 `AnalysisApiIntegrationTests`와 `InitialSchemaMigrationTests`의 7개 Testcontainers 테스트를 실제 실행한다. 이후 새 OpenAI 키를 로컬 `backend/.env`에만 설정하고 전체 E2E를 수행한다.

## Claude Continuation

1. `git status --short`, `git log -3 --oneline`으로 로컬 브랜치와 변경 유무를 확인한다. 원격 push는 사용자가 별도로 요청하기 전까지 하지 않는다.
2. Docker를 사용할 경우 `wsl --status`와 `docker info`부터 확인한다. 현재 `docker info`는 `docker_engine` 파이프 연결 실패 상태다.
3. 로컬 PostgreSQL을 사용할 경우 운영 DB가 아닌 별도 테스트 DB와 계정을 준비한다. 비밀번호를 문서나 커밋에 넣지 않는다.
4. 다음 명령으로 실제 통합 테스트를 실행한다.
   - `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api test --tests "kr.co.scc.api.database.InitialSchemaMigrationTests" --rerun-tasks`
   - `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api test --tests "kr.co.scc.api.analysis.AnalysisApiIntegrationTests" --rerun-tasks`
5. 통합 테스트가 PASS하면 전체 `test`와 `build`를 다시 실행하고 이 문서의 SKIP 수·검증 결과·`Last Verified Commit`을 갱신한다.
6. 집중 확인 파일:
   - `backend/spring-api/src/main/java/kr/co/scc/api/mypage/**`
   - `backend/spring-api/src/test/java/kr/co/scc/api/analysis/AnalysisApiIntegrationTests.java`
   - `backend/spring-api/src/test/java/kr/co/scc/api/database/InitialSchemaMigrationTests.java`
   - `docs/decisions/ADR-010-account-deletion.md`
7. 실제 DB 검증 후에는 회원 탈퇴가 `users`, 인증 세션, 약관 동의, 작업·리뷰·분석·근거·알림을 모두 제거하고 이미지 파일도 삭제하는지 반드시 확인한다.

## Last Verified Commit

`c35c342` — 전체 근거 조회 API·프론트 연결·작업 원자 선점·실패 트랜잭션·문서에 대해 위 검증을 수행했다. 분석 파이프라인 본체의 직전 검증 기준 커밋은 `36561f6`이다.
