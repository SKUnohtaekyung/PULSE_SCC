# TASK-012 — 네이버 리뷰 수집·분석 API와 프론트 연결

## Status
구현 완료, 리뷰·병합 대기 — 전체 파이프라인이 실제 환경에서 끝까지 동작한다.
회원가입부터 페르소나 이미지 생성까지 E2E 확인, Testcontainers 포함 전체 테스트 skip 0.

## Owner
`role:feature` — 미배정 (`role:platform`, `role:product`, `role:design-system` 교차 리뷰 필요)

## Branch
`feat/TASK-012-analysis-pipeline`

## Work Note
- 원격 작업 브랜치에 push 완료. 2026-09-28 사용자 요청으로 **draft PR #36** 을 만들었다(`type:feature`·`role:feature`, 리뷰어 지정 전). Ready for review 조건은 PR 본문 상단에 적었다. TASK-012 이슈 #37 을 만들어 `Closes #37` 로 연결했다.
- 분석 파이프라인 기능 구현 커밋은 `36561f6`이다. 이후 변경은 아래 날짜별 절을 본다.
- **Docker 정상 동작.** WSL2 백엔드로 붙어 Testcontainers 가 실제로 돈다.
- **OpenAI 키 설정 완료.** 실제 분석·이미지 생성까지 확인했다. 디버깅 중 `SCC_SERVICE_TOKEN` 이 로그에 노출됐으므로 교체를 권한다(localhost 전용 로컬 토큰).

## Goal
Expo 앱에서 Spring 공개 API를 통해 네이버 공개 리뷰 수집, 실제 분석 상태·결과 조회와 오류 복구를 제공하고 약관 동의 이력을 기록한다. 관련 이슈: #37(TASK-012, 2026-09-28 뒤늦게 생성해 PR #36 에 `Closes` 로 연결), 후속 제품·정책 결정은 #28~#33. 관련 요구사항: PRD FR-001~FR-011.

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
- 펼친 리뷰의 "접기" 버튼 줄 때문에 같은 리뷰가 두 번 수집되던 문제 수정 (2026-09-28)
- 손님 유형이 4개 이상 오면 재시도 대신 리뷰 수 상위 3개만 남김 (2026-09-28)
- 결과 문구 필터가 뺀 문장 건수 로그, Python 서비스 로그에 시각·레벨·작업 ID (2026-09-28)

## Changed
- `backend/spring-api/**` — 공개 분석 API, 내부 Python gateway, 결과 저장, 이미지 보호, Flyway V3
- `backend/python-analysis/**` — 네이버 수집기, OpenAI 분석/이미지 파이프라인, 내부 API와 단위테스트
- `docs/architecture/**`, `docs/decisions/ADR-009-*` — 실제 실행·저장 경계 동기화
- `docs/legal/**` — 법률 검토 전 약관·개인정보 처리방침 초안과 체크리스트
- `docs/decisions/ADR-010-*`(계정 탈퇴), `ADR-012-*`(작업 큐), Flyway V4(임대)·V5(유효 리뷰 수), `backend/.env.example`, `.gitignore`
- 별도 폴더 `C:\PULSE_SCC_FE` — API client, 보안 토큰 저장, 실제 분석/예외 UI (이 저장소 Git 범위 밖)

## Decisions
- Python은 DB를 쓰지 않고 완성 산출물을 내부 HTTP로 반환하며 Spring만 완료 트랜잭션과 영속화를 소유한다. ADR-009 참조.
- 입력 URL 은 두 HTTPS host(`map.naver.com`, `m.place.naver.com`)만 허용하고, 수집기는 수집 페이지 host 3개(`pcmap.place.naver.com` 포함)와 공개 인터넷 주소만 허용한다. 로그인·차단 우회는 금지한다.
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
> 내구성 있는 작업 큐(구현 완료, [ADR-012](../../decisions/ADR-012-durable-analysis-job-queue.md)),
> 전체 근거 조회(구현 완료).
> **아직 유효한 항목**: 브랜치 관계와 인증 충돌 해결 지침, PR #27 리뷰어 지정,
> 브랜치 보호 설정, 법률 검토, 실기기 확인, RAG, 제품 결정 목록(큐 방식 제외).

### 브랜치 관계 (가장 먼저 읽을 것)

> **해소(2026-09-28)**: PR #27 이 merge commit 으로 `main` 에 병합됐고(`fcd095a`), 이 브랜치에 `main` 을 연결했다(`e17fe61`). 아래 서술은 병합 전 기록이다. "2026-09-28 `main` 연결과 문서 정리" 절을 본다.

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
| 3 | ~~PR #27 리뷰어 지정·승인~~ 2026-09-28 병합 | 인증 병합 |
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

## 2026-09-27 임대 만료 실패 알림, 토픽 수 규칙, 빈 슬롯 문구

### 사용자 결정 (2026-09-27)

- **유효 리뷰 50건 기준은 유지한다.** #28 의 50건 부분은 결정됐다. 최소 글자 수도 10자 유지로 결정됐고 #28 을 닫았다(2026-09-27).
- **토픽 수 규칙**: 분석 후 반복 토픽이 1개면 1개, 2개면 2개의 페르소나만 만들고, 나머지 슬롯에는 "리뷰 수가 적어서 도출되지 않았다"를 표시한다. 여러 개면 상위(top) 3개를 도출한다. 기능명세 PERSONA-002·PERSONA-007·RESULT-013 과 PRD FR-003 의 기존 규칙과 같다. 이번에 바뀐 것은 문구와 순위 기준이다.

### 변경

| 위치 | 내용 |
|---|---|
| `AnalysisRepository.failExhaustedJobs` | 임대 만료로 재시도를 다 쓴 작업을 FAILED 로 바꾸면서 `markFailed` 와 같은 실패 알림을 만든다. 상태 변경과 알림 생성을 데이터 변경 CTE 한 문장으로 묶었다. 알림 설정이 꺼져 있으면 만들지 않고, `ON CONFLICT (job_id, type) DO NOTHING` 으로 중복을 막는다 |
| `openai_analyzer.SYSTEM_PROMPT` | 반복 확인되는 토픽만 만들고 3개를 채우려고 근거가 적은 토픽을 만들지 말라고 지시한다. 3개보다 많으면 근거 리뷰가 많은 상위 3개만 남긴다 |
| `StructuredAnalysis` 검증 | 순위를 모델이 매긴 값 대신 `topic_review_count` 내림차순으로 다시 매긴다. 수가 같으면 모델 순위를 따른다 |
| 빈 슬롯 문구 | 서버 `INSUFFICIENT_TOPIC_EVIDENCE` 메시지와 API.md 예시를 "리뷰 수가 적어서 손님 유형이 도출되지 않았습니다." 로 바꿨다. 프론트(`C:\PULSE_SCC_FE`, Git 범위 밖) 빈 슬롯 라벨·안내·접근성 문구도 같은 표현으로 바꿨다 |

### 검증

| 검증 | 결과 |
|---|---|
| Python lint·format | PASS |
| Python test | PASS — 39개 (기존 35 + 토픽 순위 4) |
| Spring test (`--rerun-tasks`) | **부분 실행** — 50개 중 40개 통과·실패 0, **10개 SKIP**. Docker Desktop 이 기동되지 않아 Testcontainers 테스트가 건너뛰어졌다. **새 알림 통합 테스트 2개도 SKIP 이라 새 SQL 은 아직 실행으로 확인하지 못했다** |
| Frontend typecheck·lint·test | PASS — 24개 |
| 새 SQL 직접 실행 (독립 Reviewer) | PASS — 로컬 PostgreSQL 18.4 임시 클러스터에 V1~V4 를 적용하고 CTE 를 실행. 시도 3회 만료 작업만 FAILED, 알림 켜짐 1건·꺼짐 0건·설정 행 없음 0건, 기존 알림은 ON CONFLICT 로 1건 유지, 두 세션 동시 실행 시 한쪽만 처리. 테스트 이미지 버전(18.6)과 JdbcClient 런타임 매핑은 미확인 |
| 독립 Reviewer | PASS (비차단 지적 반영: 4개 초과 거부 테스트가 목록 길이 제한을 실제로 검사하도록 수정, 아래 남은 것 2건 추가) |

### 남은 것

- (이전 기록) 이 작업 직후에는 `Docker Desktop.exe` 를 두 번 실행해도 프로세스가 곧바로 끝났고 `docker-desktop` WSL 배포판은 `Stopped` 여서 Testcontainers 테스트를 돌리지 못했다.
- (해소) 같은 날 Docker 가 정상 기동해 Spring test skip 0 과 새 알림 테스트 2개 통과를 확인했다(아래 #29 절 검증 표).
- 모델이 4개 이상 토픽을 반환하면 스키마(`max_length=3`, `rank le=3`) 검증에서 실패해 재시도된다. 프롬프트로 3개 이하를 요구하지만, 넘겼을 때 상위 3개로 자르는 처리는 없다.
  > 정정(2026-09-28): 검증 전에 리뷰 수 상위 3개로 자르도록 수정했다(`47c1130`). 아래 "2026-09-28 결정 없이 처리한 기술 과제 2건" 절.
- `docs/decisions/ADR-012` 31행의 "횟수를 다 쓰면 `ANALYSIS_TIMEOUT` 으로 마감"도 임대 만료 경로에만 맞는다. ADR 은 `role:platform` 소유라 고치지 않았다.
  > 정정(2026-09-28): `dbf6d02` 에서 ADR-012 결정 5번에 #30 갱신 주석을 달았다(원문 유지).
- 실제 OpenAI 호출로 토픽 1~2개 결과가 나오는지는 확인하지 않았다(비용 발생).
- **명세 문구 갱신 요청** — 기능명세 PERSONA-007·RESULT-013·인수조건(464행 부근), RESULT_IA, PRD FR-003 의 빈 슬롯 문구는 "리뷰 근거가 부족해 3개보다 적게 도출됐다" 이다. 사용자 결정(2026-09-27)으로 화면 문구를 "리뷰 수가 적어서 도출되지 않았다" 로 바꿨으니 `role:product` 에 명세 문구 갱신을 요청한다. 규칙 자체는 명세와 같다.
- **소유 영역** — `docs/architecture/API.md` 는 `role:platform` 소유다. AGENTS.md 2장 7번(API 변경 시 동기화)에 따라 예시 문구를 함께 고쳤으므로 PR 본문에 명시하고 platform 리뷰어를 지정한다. ADR-012 은 결정 기록이라 고치지 않았다.
- Docker 기동 실패 원인: `%LOCALAPPDATA%\Docker\run\sailor-ingest.sock.stale`(2026-09-19 잔여 소켓)이 남아 새 소켓 이름 변경이 실패하고 백엔드가 크래시한다(`com.docker.backend.exe.log`). 일반 권한으로는 이 파일이 지워지지 않았다("The file cannot be accessed by the system"). 같은 날 이후 Docker 29.8.0 이 정상 기동했는데, **그때도 `.stale` 파일은 그대로 남아 있었다.** 따라서 이 파일이 진짜 원인이 아니었을 수 있다. 어떤 조치로 풀렸는지는 이 세션에서 확인하지 못했다. 같은 증상이 다시 나면 `com.docker.backend.exe.log` 의 `backend crashed` 줄부터 본다.

### #29 작성일을 모르는 리뷰 안내 (2026-09-27)

**사용자 결정: 3번.** 작성일을 모르는 리뷰는 지금처럼 2년 경고 판정에서 제외하고, 몇 건이 제외됐는지 결과 화면에 따로 안내한다.

| 위치 | 내용 |
|---|---|
| `AnalysisRepository.buildPublicResult` | 결과 `metadata.reviewsWithoutWrittenDateCount` 추가. 결과를 저장할 때 Python 응답의 리뷰 중 `writtenAt` 이 없는 것을 센다. Python `contains_old_reviews` 가 제외하는 리뷰와 같은 집합이다. 결과 조회와 저장본 조회(`/me/saved-analysis`)가 같은 결과 문서를 쓴다. Python 은 바꾸지 않았다 |
| `docs/architecture/API.md` | 필드 예시와 의미, 이전 저장 결과에는 없으므로 0 으로 본다는 규칙 |
| 프론트(`C:\PULSE_SCC_FE`, Git 범위 밖) | `reviewsWithoutDateCount` 타입·매핑(없으면 0), 1건 이상일 때 안내 "작성일을 모르는 리뷰가 N건 있어요 / 작성일을 확인할 수 없어 오래된 리뷰인지 판단할 때는 제외했어요.", Mock fixture 8건, 매핑 테스트 2개 |

| 검증 | 결과 |
|---|---|
| Spring test (`--rerun-tasks`, Docker 기동) | PASS — **50개, skip 0.** 임대 만료 알림 테스트 2개(`jobThatExhausts…`, `lostLeaseFailure…`)와 결과 응답 통합 테스트(빈 슬롯 문구, 결과·저장본 조회 모두 `reviewsWithoutWrittenDateCount` = 1)가 실제로 실행됐다 |
| 독립 Reviewer | PASS (권고 반영: 저장본 조회 검증 추가, Docker 원인 서술 보정) |
| Frontend typecheck·lint·test | PASS — 26개 (기존 24 + 매핑 2) |
| Python | 변경 없음 |

- PRD 13장 Open Question 13 과 FR-009 는 `role:product` 소유라 고치지 않았다. 결정 내용을 반영하도록 요청이 필요하다.
- Visual QA 로 안내 문구가 실제 화면에 어떻게 보이는지는 확인하지 않았다.

### #30 재시도를 모두 쓴 실패 표시 (2026-09-27)

**사용자 결정: 3번 + 오류 코드 숨김.** 자동 재시도를 모두 쓴 실패는 "여러 번 시도했다"고 구분해 알리고, 즉시 재시도 버튼 없이 가게 정보로 돌아가게 한다. 곧바로 다시 요청하면 수집·OpenAI 호출이 또 최대 3번 반복되기 때문이다. 모든 실패 화면에서 오류 코드를 뺀다.

| 위치 | 내용 |
|---|---|
| `AnalysisRepository.RETRY_EXHAUSTED` | 공개 오류 코드이자 `message_code` 값 `ANALYSIS_RETRY_EXHAUSTED` |
| `AnalysisRepository.markRetryExhausted` | 분석 중 오류 경로. 원인 코드는 `error_code` 에 남기고 `message_code = ANALYSIS_RETRY_EXHAUSTED`, 같은 코드로 실패 알림. **시도 횟수가 상한(`MAX_ATTEMPTS`)에 닿은 작업만 마감한다** — 임대가 끝나 다른 워커가 다시 가져간 작업을 원래 워커가 잘못 마감하지 않게 한다. `markFailed` 와 SQL 을 공유한다 |
| `AnalysisRepository.markFailed` | `retryable` 인자를 없앴다. 실패 작업은 항상 `retryable = false` 로 저장된다. 실제로 상태를 바꾼 경우에만 실패 알림을 만든다 |
| `AnalysisRepository.failExhaustedJobs` | 임대 만료 경로. `error_code = ANALYSIS_TIMEOUT` 은 그대로, `message_code = ANALYSIS_RETRY_EXHAUSTED`, `retryable = false`(이전에는 `true`) |
| `AnalysisRepository.mapStatus` | `FAILED` 작업은 저장값과 관계없이 `retryable = false` 로 응답한다(규칙 이전에 `true` 로 저장된 행 호환). `message_code` 가 재시도 소진이면 공개 `error.code` 를 `ANALYSIS_RETRY_EXHAUSTED` 로 바꾸고 문구 "여러 번 시도했지만 분석을 완료하지 못했습니다. 잠시 뒤에 가게 정보에서 다시 요청해 주세요." |
| `AnalysisJobRunner.finishFailure` | 재시도 불가 실패 → `markFailed`, 다시 큐에 넣지 못한 재시도 가능 실패 → `markRetryExhausted(…, MAX_ATTEMPTS)` |
| `MyPageRepository.messageFor` | 알림 문구 "여러 번 시도했지만 리뷰 분석을 완료하지 못했습니다. 잠시 뒤에 다시 요청해 주세요." |
| `API.md` 5.3 | `ANALYSIS_RETRY_EXHAUSTED` 추가. 표의 `retryable` 열(서버 자동 재시도 여부)과 작업 상태 응답의 `retryable`(즉시 재시도 가능 여부, FAILED 면 항상 false), 공통 오류 응답(2.1절)의 `retryable` 을 구분해 적었다. 작업 정보를 찾지 못한 `ANALYSIS_OUTPUT_INVALID` 예외도 적었다 |
| 프론트(`C:\PULSE_SCC_FE`, Git 범위 밖) | `src/features/analysis/failure.ts` 의 `failureTitle`·`canRetryNow`. 재시도 소진이면 제목 "분석을 완료하지 못했어요", 재시도 버튼 없음. 실패 화면에서 `{error.code} ·` 제거. 코드를 빼면서 상단 설명 줄과 안내 상자에 같은 문장이 두 번 나오게 돼 오류일 때 상단 설명 줄을 숨겼다. 테스트 4개 |

**동작 변화**: 이제 `FAILED` 작업의 `retryable` 은 항상 `false` 다. 재시도 가능한 원인은 서버가 먼저 자동 재시도하기 때문이다. 앱의 "분석 다시 시도" 버튼은 요청 전송·상태 조회 같은 네트워크 오류(`NETWORK_ERROR`, 5xx)에만 나온다.

| 검증 | 결과 |
|---|---|
| Spring test (`--rerun-tasks`, Docker) | PASS — 53개, skip 0. 임대 만료 경로(상태 API `retryable=false`·`ANALYSIS_RETRY_EXHAUSTED`·문구, 알림 문구), 분석 중 오류 경로(원인 코드 보존, 상태·알림 문구), 시도 횟수가 남은 작업은 마감하지 않음, 규칙 이전 `retryable=true` 실패 행도 `false` 로 응답 — 통합 테스트 포함 |
| 독립 Reviewer | 1차 PASS(권고 6건) → 권고 반영(경쟁 상황 가드, 이전 행 호환, `markFailed` 인자 제거, 화면 중복 문장, API.md 서술, 테스트 공백) → 재검토 PASS(2026-09-27). 재검토 권고였던 `finishFailure` 로그 구분도 반영 |
| 범위 밖 발견 | 앱에서 상태 조회가 5xx 로 실패하면 재시도 버튼이 기존 작업을 이어 조회하지 않고 새 작업을 만든다(`PulseApp.tsx` 의 `resume = code === 'NETWORK_ERROR'`). 서버 작업이 아직 도는 중이면 비용이 중복될 수 있다. 이번 변경 전부터 있던 문제라 별도 이슈로 다룬다 |
| Frontend typecheck·lint·test | PASS — 30개 (기존 26 + 실패 표시 4) |

- 경쟁 상황: 임대가 끝나 작업이 QUEUED 로 돌아갔거나 다른 워커가 다시 가져간 뒤 원래 워커가 실패하면 `requeueForRetry` 가 false 를 돌려준다. 이때 `markRetryExhausted` 는 시도 횟수가 상한 미만이면 아무것도 바꾸지 않는다. 다만 다른 워커가 세 번째 시도로 가져간 뒤라면(시도 횟수 3) 원래 워커가 그 작업을 마감할 수 있다. 워커 소유권 식별이 없는 at-least-once 큐의 기존 한계다(ADR-012).
- **비용 방지 효과의 한계**: "가게 정보로 돌아가기" 뒤 확인 화면에서 "리뷰 분석 시작"을 한 번 더 누르면 새 작업이 만들어져 다시 최대 3회 시도한다. 사용자가 고른 안(즉시 재시도 버튼만 없앰)의 범위다.
- 문서 동기화: `docs/architecture/DATA_MODEL.md` 는 `error_code` 를 "공개 가능한 표준 오류 코드"로 설명하지만, 재시도 소진이면 공개 코드는 `message_code` 로 정해진다. `role:platform` 소유라 고치지 않았다. `C:\PULSE_SCC_FE\docs\architecture\API.md` 사본도 병합 후 동기화가 필요하다.
  > 정정(2026-09-28): `dbf6d02` 에서 DATA_MODEL `error_code` 설명을 고쳤다.
- 재시도 불가(`retryable=false`)지만 사용자 입력 문제가 아닌 실패(예: 작업 정보를 찾지 못한 `ANALYSIS_OUTPUT_INVALID`)도 제목이 "입력 또는 설정 확인이 필요해요" 로 나온다. 드문 경로라 이번 범위에서 나누지 않았다.
- Visual QA 미실행.

## 2026-09-28 새 프론트(`frontend/mobile`) 실제 백엔드 통합 확인과 결과 문구 정리

### 프론트 전환

사용자 결정: `C:\PULSE_SCC_FE` 는 프론트가 붙기 전 사용자가 임시로 만든 앱이다. 이제부터 프론트는 프론트 개발자의 `frontend/mobile`(브랜치 `feat/TASK-020-frontend-mobile`, PR #35)로 진행한다. 앞 절들에 적은 `C:\PULSE_SCC_FE` 변경(빈 슬롯 문구, 작성일 미확인 안내, 재시도 소진 표시)은 새 앱에 아직 없다.

### 통합 확인 (전체 분석 1회, OpenAI 비용 발생)

- 방식: 로컬에 `git worktree`(`C:\PULSE_SCC-mobile`)로 새 앱을 받고 Expo 웹(8081)으로 띄웠다. Android SDK 가 이 PC 에 없어서다. Spring 에 CORS 설정이 없어 앱과 API 를 한 출처로 묶는 임시 프록시(8090, 스크래치 폴더, 저장소 밖)를 썼다. 실제 Android 앱에는 필요 없다.
- 백엔드: 이 브랜치 `e26a783` 기준. Spring 은 사용자가 `.env` 를 불러 띄웠고 Python 은 에이전트가 띄웠다.

| 단계 | 결과 |
|---|---|
| 약관 조회 → 가입 → 로그인 | 정상 |
| 분석 요청 → 상태 조회 → 완료 | 정상. 약 3분, 리뷰 120건, 유형 3개(50·44·37건) |
| 첫 결과 저장 → 결과(TOP3·4관점·근거·제안·메타정보) | 정상 |
| 근거 전체 보기 | 정상 |
| 마이페이지(알림·알림 설정·계정) | 정상 |
| 결과 JSON 과 앱 타입(`frontend/mobile/src/api/types.ts`) 대조 | 화면을 깨는 불일치 없음 |

**발견 — 백엔드(이 브랜치)**

1. 결과 문구에 내부 정보가 샜다. caveat 에 "근거 리뷰: 0, 1, 3, …" 번호 목록, limitations 에 "100~119", "68번 리뷰", `NEGATIVE`, `caveat`·`insight`, "토픽" 같은 표현. **이번 커밋에서 수정**(아래).
2. 모델이 limitations 에 "120개 중 100~119 는 끝에 '접기'가 붙은 중복"이라고 적었다. 같은 매장을 수집만 다시 돌렸을 때는 120건 모두 고유했다. **미확인** — 실제 저장된 `reviews` 를 봐야 하는데 DB 비밀번호가 `.env` 에 있어 에이전트가 조회하지 못했다.
   > 정정(2026-09-28, 같은 날 이후 세션): 같은 현상을 일으키는 수집기 버그를 재현하고 수정했다. 아래 "'접기' 중복 수집 수정" 절. 이 분석이 그 버그 때문이었다는 것은 추정이다 — 저장된 분석의 `reviews` 는 여전히 조회하지 않았다.
3. 분석 약 3분 내내 진행 단계가 `COLLECTING_REVIEWS` 로 머문다(동기 단일 호출 구조, 알려진 한계).
4. CORS 설정이 없다. Android 앱에는 영향이 없고 웹 미리보기에서만 필요하다.

**발견 — 새 앱(프론트 개발자 소유, 전달 필요)**

1. 웹에서 페르소나 이미지 3장이 401. React Native `Image` 의 `headers` 가 웹에서는 전달되지 않는다. 같은 계정 토큰으로 직접 요청하면 200(1.4MB PNG), 토큰 없으면 401 로 서버는 정상이다. Android 동작은 미확인.
2. 작성일을 모르는 근거 리뷰(`writtenAt: null`)가 "1970.01.01" 로 표시된다. `formatDate` 가 `new Date(null)` 을 유효한 날짜로 본다. 이번 결과는 해당 0건이라 화면에는 나오지 않았고 코드로 확인했다.
3. #29 작성일 미확인 건수 안내, 빈 슬롯 문구, #30 재시도 소진 표시가 없다(서버 문구를 그대로 보여 주므로 깨지지는 않는다).
4. 주소 입력 안내가 "naver.me 또는 naver.com 주소"인데 서버는 `map.naver.com`·`m.place.naver.com` 만 받는다.
5. 분석 중 상태 조회 간격이 1.2초다(`AnalyzeScreen.tsx` 의 `pollIntervalMs = 1200`). 이번 분석 1회에서 네트워크 기록상 상태 조회가 약 160회였다.
6. 계정 탈퇴 계약 불일치 — 앱은 "계약에 없어 미연결"로 두었다. `main` 과 TASK-020 브랜치의 API.md 는 "탈퇴 API 는 계약에 추가하지 않는다"이고, 이 브랜치 API.md 에는 `DELETE /api/v1/me/account` 가 있다. 앱 버그가 아니라 두 브랜치의 계약 동기화 문제다.
7. 웹 접근성 트리에서 일부 버튼(로그인 등)에 이름이 없다.
8. 웹에서는 새로고침하면 로그아웃된다(보안 저장소가 없어 메모리 토큰, 설계대로).

### 결과 문구 정리 (이번 커밋)

| 위치 | 내용 |
|---|---|
| `openai_analyzer.SYSTEM_PROMPT` | review_index 를 뺀 모든 글이 사장님이 읽는 문장이니 리뷰 번호·번호 목록·`[12]` 표기·번호 범위·영어 필드명·토픽·인덱스·임베딩·RAG 를 쓰지 말 것, "토픽" 대신 "손님 유형", 숫자에는 단위, caveat 은 주의점 한두 문장, limitations 는 읽을 때의 한계만 최대 3개, 유형별 리뷰 수의 합이 전체와 다를 수 있으면 알릴 것 |
| `models.reader_facing` | 모델이 어겨도 내부 표현이 든 **문장만** 뺀다. 숫자 뒤 단위는 끝이 없으므로(팀·병·가지·만 원 …) 단위를 허용 목록으로 두지 않고, **숫자 바로 뒤에 조사(은·는·이·가·을·를·의·에서·까지·와·과·부터 등, 뒤에 공백·문장 끝)가 붙어 숫자 자체가 대상인 경우**만 리뷰 번호로 본다("100~119는", "68번은", "0, 1, 3, 4번이"). "근거 리뷰 3, 7에서"·"리뷰 3은"도 같은 원칙으로 번호 끝에 조사·문장 끝이 올 때만 본다("근거 리뷰가 1, 2월에", "리뷰 3, 4건"은 남김). 그 밖에 `[68]`, `#68`, `리뷰(68)`, `Review 68`, "68번 리뷰", "리뷰 68번", "0번~99번", 인덱스·토픽·임베딩·RAG, 영어 필드명(대소문자 구분이라 "Positive한" 은 남김)을 뺀다. 숫자 목록 패턴은 목록 첫 숫자에서만 시작하고 소유 한정자를 써 긴 입력에서도 선형으로 끝난다 |
| `PersonaOutput.caveat` 검증 | 위 필터 적용. 전부 빠지면 기본 문구 "리뷰에서 반복된 상황을 묶은 유형이며 실제 개인이나 전체 손님을 뜻하지 않습니다." |
| `StructuredAnalysis.limitations` 검증 | 항목마다 필터 적용, 빈 항목은 뺀다 |

오늘 실제 결과에 필터를 적용해 봤다. caveat 3개는 번호 목록만 빠지고 설명 문장은 남았다. limitations 5개 중 내부 정보뿐인 2개는 통째로, "토픽" 설명 1개도 빠지고, 지점 혼재·효과 비보장 같은 읽을 만한 한계는 남았다. 새 프롬프트로 다시 분석하지는 않았다(비용).

| 검증 | 결과 |
|---|---|
| Python lint·format | PASS |
| Python test | PASS — 114개 (기존 39 + 문구 필터 75: 실제 유출 문장 3, 걸러야 할 변형 29, 남겨야 할 일반 문장 42, 긴 숫자 목록 성능 1) |
| 독립 Reviewer 1차 | FAIL — 조사만 바꾼 변형 미탐, "주 2~3번 방문"·"3, 4, 5월" 같은 일반 문장 오탐. 단위·문맥 기준으로 다시 짰다 |
| 독립 Reviewer 2차 | FAIL — 단위 허용 목록 밖("2~3팀", "1~2만 원대", "소주 1~2병", "리뷰 2~3개에서만")이 새로 지워짐. 판정을 뒤집어 조사 기준으로 다시 짰다 |
| 독립 Reviewer 3차 | FAIL — "근거" 패턴만 조사 기준을 따르지 않아 "근거 리뷰가 1, 2월에" 같은 문장이 지워짐. 같은 원칙으로 맞추고 "리뷰 3은" 패턴, limitations 항목 1,000자 상한 추가 |
| 독립 Reviewer 4차 | PASS. 비차단 권고 2건("리뷰 100이"류 과삭제, 1,000자 자르기가 표시 문장에도 적용)은 남은 위험에 기록 |
| 새 프롬프트로 실제 분석 | 미실행 |

**남은 위험**

- 필터는 caveat 과 limitations 에만 걸었다(이번에 유출이 확인된 곳). label·summary·review_fact·ai_interpretation·suggested_action·image_alt_text 는 프롬프트 지시만 있다. 필수 필드라 문장을 빼면 빈 값이 될 수 있어서다.
- 필터는 Python 파싱 시점에만 작동한다. 이미 저장된 결과(오늘 분석 포함)는 유출 문장을 계속 보여 준다.
- 문장은 마침표·물음표·느낌표 뒤 공백으로만 나눈다. "다." 뒤에 공백이 없거나 마침표 없이 줄만 바꾼 글은 한 문장으로 보고, 그 안에 내부 표현이 하나라도 있으면 통째로 뺀다(과삭제 쪽이지 유출은 아니다). caveat 이면 기본 문구로 바뀐다.
- "집계"는 일반 우리말로 보고 막지 않는다.
- 두 자리 이상 숫자 + "번" + 조사("10번은")는 리뷰 번호로 본다. "10번은 넘게 왔다" 같은 드문 횟수 표현은 지워질 수 있다. 번호 범위 뒤에 곧바로 마침표가 오는 경우("10~20."), 단위를 생략한 범위에 조사가 붙은 경우("평점 4~5에", "1~2만은"), "리뷰"·"근거" 바로 뒤 숫자에 조사가 붙은 경우("리뷰 100이 넘는", "근거 리뷰 중 3번이 넘는")도 지워진다.
- 잡지 못하는 표현: 한 자리 번호("3번은", "5번과 7번은" — "주 2번은 온다" 같은 횟수와 구분할 수 없어서), 두 개짜리 목록("리뷰 번호 3, 7이"). 프롬프트가 1차 방어선이다.
- limitations 항목은 필터 전에 1,000자로 자른다(caveat 스키마 상한과 같음). 긴 숫자 연속 입력에서 정규식이 느려지는 것을 막기 위해서다. 잘린 결과가 그대로 저장·표시되므로 1,000자를 넘는 항목은 말줄임표 없이 문장 중간에서 끊길 수 있다.

## 2026-09-28 "접기" 중복 수집 수정

**확인한 것**: 같은 매장을 다시 수집해 "접기"가 붙은 같은 리뷰가 두 번 들어가는 **수집기 버그를 재현하고 고쳤다.**
**추정인 것**: 위 발견 2번(모델이 적은 "100~119 는 '접기'가 붙은 중복")이 이 버그 때문이라는 것. 저장된 2026-09-28 분석의 `reviews` 는 조회하지 않았다. 모델이 적은 범위는 100~119번(20건)이고 이번에 재현한 범위는 110~119번(10건)이다. 실행이 달라 로드된 건수가 다르면 범위도 달라지는 구조라 모순은 아니지만, 저장본의 실제 중복 건수는 **미확인**이다.

**원인** — `REVIEW_SELECTORS` 는 여러 셀렉터를 차례로 모으고 `build_reviews` 가 정규화 텍스트 해시로 중복을 뺀 뒤 상한(120)에서 멈춘다. 펼친 리뷰를 `.pui__vn15t2 a`·`.pui__vn15t2` 로 잡으면 본문 끝에 버튼 문구 "접기" 한 줄이 붙어 해시가 달라진다. 첫 셀렉터(`a.pui__GStJHb`)가 120건을 채우면 드러나지 않지만, 스크롤 로딩이 그보다 적게 되면 남은 자리를 앞 리뷰의 "접기" 복사본이 채운다. 이번 4회 실측에서 로딩 건수는 110~130건으로 달랐다. 이전 세션의 수집만 재실행에서 재현되지 않은 이유로 보인다(추정).

**실측** — 음식점 `2080629959`, 수집만 4회, OpenAI 호출 없음. 스크래치 스크립트로 건수만 출력했고 원문은 저장하지 않았다.

| 회차 | 코드 | 첫 셀렉터 로드 | 최종 120건 중 "접기" 중복 | 상한 없이 모았을 때 |
|---|---|---|---|---|
| 1 | 수정 전 | 120건 | 0 | 측정 안 함 |
| 2 | 수정 전 | 110건 | **10건 (110~119번)** | 142건 중 32건이 "접기" 중복 |
| 3 | 권고 반영 전 수정 | 130건 | 0 | 130건, "접기" 끝 0 |
| 4 | `4177727` | 130건 | 0 | 130건, "접기" 끝 0 |

- 셈 기준: 네이버 리뷰 화면은 프레임 2개에 같은 목록이 있어 첫 셀렉터 텍스트 수(240·220·260·260개)를 2로 나눈 값을 "로드"로 적었다(계산값). "최종"·"상한 없이" 칸은 `build_reviews` 가 중복을 뺀 뒤의 고유 건수다.
- 2회차 "접기"로 끝난 텍스트 128개(`.pui__vn15t2 a` 64 + `.pui__vn15t2` 64)는 모두 마지막 줄이 정확히 "접기" 한 줄이었다. 상한 없이 모았을 때의 "접기" 32건은 모두 앞 리뷰 본문과 버튼 줄만 다른 복사본이었다.
- 3·4회차에서 첫 셀렉터와 다른 텍스트는 `.pui__vn15t2` 의 74개(프레임 중복 포함 텍스트 수)뿐이었고, 모두 "접기" 줄로 끝났으며 수정 후에는 전부 합쳐졌다. 확인한 범위는 "접기" 중복뿐이다.

**수정** (`4177727`)

| 위치 | 내용 |
|---|---|
| `strip_fold_control` | 끝의 빈 줄을 떼고, 마지막 줄이 정확히 "접기"면 그 한 줄만 뗀다 |
| `build_reviews` | 스크랩 텍스트에서 먼저 버튼 줄을 뗀 뒤 칩 제거·해시·방문일 매칭을 한다. 칩 줄 뒤에 드러나는 버튼 줄도 한 번 더 뗀다. 구조화 body 에는 버튼 문구가 없으므로 방문일 "원문 키 우선" 조회도 버튼 줄을 뗀 텍스트로 한다 |

**효과** — 로딩이 상한보다 적으면 이제 리뷰 수가 120 미만(실제 고유 건수)으로 나온다. 이전에는 중복이 건수를 부풀려 50건 미만 매장이 게이트를 통과할 수 있었다. PRD 의 "중복·무효 리뷰를 제외한 유효 리뷰 50건" 에 맞게 바로잡힌 것이다.

| 검증 | 결과 |
|---|---|
| Python lint·format (`4177727`) | PASS |
| Python test (`4177727`) | PASS — 118개 (기존 114 + 접기 4). `strip_fold_control` 을 항등 함수로 바꾸면 3개가 실패한다(독립 Reviewer 재검토에서 확인). 과삭제 방지 테스트 1개는 원래 통과하는 것이 맞다 |
| 실제 수집 | 위 표 3회차(권고 반영 전), 4회차(`4177727`) |
| 독립 Reviewer | 코드 1차 PASS(권고 4건) → 3건 반영(칩 뒤 버튼 줄, docstring 2곳), 나머지 1건은 이 절 → 문서 재검토 FAIL(추정을 사실로 적음, 검증 대상 커밋 불일치) → 이 절 수정 → 재검토 PASS |

**남은 것**

- 같은 줄에 붙은 "본문 접기", 제로폭 문자가 섞인 "접기" 는 떼지 않는다. 실측에서 줄 단독 형태만 나왔다.
- 손님이 마지막 줄에 "접기" 한 단어만 쓴 경우 버튼과 구분할 수 없어 그 줄이 빠진다.
- 펼침 버튼(`a.pui__wFzIYl`)을 못 누른 접힌 리뷰가 다른 끝 문구로 근사 중복을 만드는지는 미확인이다.
- **이미 저장된 분석 결과는 그대로다.** 2026-09-28 분석에 중복이 섞였을 가능성이 높지만 저장된 `reviews` 는 조회하지 않았다(추정).
- 이번 4회에서 스크롤 로딩은 110~130건이었다. 적게 로드되면 120건을 못 채운다. 로딩을 늘리는 것은 네이버 요청이 늘어나는 변경이라 이번 범위에서 하지 않았다.

## 2026-09-28 새 프롬프트·수집 수정으로 실제 분석 1회

사용자 승인으로 실행했다(OpenAI 비용 발생). 실행 시점 HEAD `76975f3`(문서 커밋이라 코드는 수집 수정 `4177727` 과 같다. 결과 문구 필터 `317dc8f` 포함). 에이전트가 Python·Spring 을 띄우고, 새 테스트 계정(`@scc.test`, 비밀번호는 스크래치에만)으로 API 를 직접 호출했다. 앱 화면은 쓰지 않았다. 확인 뒤 두 서비스를 껐다.

| 항목 | 결과 |
|---|---|
| 가입 → 작업 생성 → 완료 | 201 → 202 → `COMPLETED`, 약 220초 |
| 리뷰 수 | 수집 120건·유효 120건, 작성일 모름 0건, 2년 초과 없음 |
| 손님 유형 | 3개 FILLED — 53·51·43건 |
| caveat 3개 | 모두 설명 문장 2개로 된 쉬운 말. 리뷰 번호·번호 목록 없음. 기본 대체 문구로 바뀐 것 없음 |
| limitations | 3개(프롬프트 상한과 같음). 유형별 리뷰 수 합이 전체와 다른 이유, 개업 시기·행사·지점 혼재, 긍정 편중 — 모두 사장님이 읽을 한계 |
| 내부 표현 스캔 | 사장님이 읽는 글 57개(label·summary·caveat·altText·4관점 사실·해석·제안·limitations)에서 번호 범위+조사·"N번"·`[12]`·`#12`·"리뷰 12"·번호 목록·토픽·인덱스·임베딩·RAG·영어 단어 4자 이상 패턴 **0건**(스크래치 정규식 스캔) |
| "접기" | 결과에 담긴 대표 근거 33개(고유 리뷰 19건) 중 "접기"로 끝나는 것 0건 |
| 로그 | grep 기준 Python error·exception·traceback 0건, Spring ERROR·WARN 0건(Hibernate·deprecation 줄 제외) |

**확인하지 못한 것**

- 필터가 이번에 실제로 문장을 뺐는지는 모른다. 필터는 뺀 문장을 기록하지 않고, 모델 원출력도 저장하지 않는다. 결과가 깨끗한 것이 프롬프트 덕인지 필터 덕인지 구분되지 않는다.
  > 이후 조치(2026-09-28): 필터가 문장을 빼면 건수를 로그로 남기게 했다(`c87b4a7`). 다음 분석부터 알 수 있다. 이번 분석에는 소급되지 않는다.
- 이번 수집은 120건을 다 채웠다. 로딩이 적게 된 경우의 수집 수정 효과는 앞 절의 수집만 실측으로 확인했고, 전체 분석으로는 확인하지 않았다. 저장된 `reviews` 는 DB 로 조회하지 않았다.
- 결과 JSON 은 스크래치에만 두었고(근거 리뷰 원문 포함) 저장소에 넣지 않았다.

## 2026-09-28 결정 없이 처리한 기술 과제 2건

사용자 요청("다음 작업이나 이슈 하나씩")으로 진행했다. 결정 대기 이슈(#31·#32·#33)에는 새 결정이 없고 #34 는 프론트 담당 몫이라, 인수인계의 기술 과제 중 `role:feature` 소유이면서 결정이 필요 없는 것을 골랐다. 3번은 이후 사용자 요청으로 추가했고 `role:platform` 영역으로 볼 수 있는 파일(`core/logs.py`, `__main__.py`)을 포함한다.

### 1. 손님 유형이 4개 이상이면 리뷰 수 상위 3개만 남김 (`47c1130`)

| 항목 | 내용 |
|---|---|
| 문제 | 모델이 4개 이상을 돌려주면 pydantic 검증 실패 → Python 5xx → Spring 재시도 가능 실패 → 작업 재실행. 수집·분석 모델 호출이 반복된다 |
| 확인한 것 | OpenAI 로 보내는 스키마(`to_strict_json_schema`)에는 `maxItems: 3`, rank `maximum: 3` 이 들어간다. **Structured Outputs 가 이를 강제하는지는 공식 문서(developers.openai.com structured-outputs 가이드)에서 확인하지 못했다** |
| 수정 | `StructuredAnalysis.keep_top_three_personas`(before 검증기). 3개를 넘고 모든 항목의 rank·리뷰 수가 정수면 (리뷰 수 내림차순, 모델 순위) 로 정렬해 상위 3개만 남기고 rank 를 1..3 으로 다시 매긴다. 정수가 아니면 자르지 않아 기존 검증이 거부한다. 스키마 상한은 그대로 보낸다 |
| 의도한 완화 | 4개 이상일 때는 모델 rank 의 범위·연속 검사가 풀리고(동률 기준으로만 씀), 잘려 나간 항목은 검증하지 않는다. 출력은 항상 rank 1..3·중복 없음이라 DB 제약(`ck_personas_rank`, `uq_personas_analysis_rank`)은 지킨다 |
| 검증 | ruff PASS, pytest 122개(기존 `test_more_than_three_topics_are_rejected` 를 동작 변경에 맞춰 교체, 새 테스트 5개). `models.py` 만 되돌리면 3개 실패(상위 3개, 동률, JSON 경로 — 독립 Reviewer 가 스크래치에서 재현). 독립 Reviewer 는 권고 반영 전 diff 에 PASS, 반영분(주석 범위, 테스트 이름, JSON 문자열 경로 테스트)은 문서 검토 때 `git show` 로 확인 |

- `maxItems` 가 강제되면 이 코드는 실행되지 않는다. 비용이 작고 해가 없어 방어선으로 둔다.
- 모델이 limitations 에 "4가지 유형"처럼 잘리기 전 개수를 적을 가능성은 남는다(미확인).

### 2. 결과 문구 필터가 뺀 문장 건수 기록 (`c87b4a7`)

| 항목 | 내용 |
|---|---|
| 문제 | "실제 분석 1회" 절에서 필터가 일했는지 알 수 없었다 |
| 수정 | `reader_facing(text, *, field=...)` 가 문장을 빼면 WARNING "결과 문구 필터: {caveat\|limitations} 에서 문장 N개 중 M개를 뺐습니다." 빠진 문장 본문은 남기지 않는다(리뷰 인용이 섞일 수 있어서) |
| 검증 | ruff PASS, pytest 124개(새 테스트 2개). 소스를 되돌리면 1개 실패. uvicorn `LOGGING_CONFIG` 적용 상태에서 stderr 출력 확인. 독립 Reviewer PASS — `parse_text` 경로와 FastAPI `response_model` 재검증에서 로그가 중복되지 않음을 probe 로 확인 |

- Python 서비스에는 로그 설정이 없어 이 경고는 logging 의 lastResort 로 **레벨·로거 이름·시각 없이 메시지만** stderr 에 나온다. 운영에서 자체 log config 를 넣으면(`disable_existing_loggers` 기본값 등) 사라질 수 있다.
  > 이후 조치(2026-09-28): 로그 설정을 추가했다(`ea45b4a`, 아래 3번). 이제 시각·레벨·로거 이름·작업 ID 가 붙는다.
- 로그에 작업 ID 가 없다. 여러 작업이 겹치면 어느 분석의 로그인지 구분할 수 없고, 검증이 다른 이유로 실패해 재시도된 시도의 로그도 남는다.
  > 이후 조치(2026-09-28): 작업 ID 는 붙게 됐다(`ea45b4a`). 같은 작업의 재시도는 같은 ID 아래 섞여 시도끼리는 여전히 구분되지 않는다.
- 필터 경고는 실제 서버(`python -m scc_analysis`)와 실제 OpenAI 응답으로 확인하지 않았다(아래 3번의 실서버 실행은 50건 게이트에서 멈춰 필터 경로를 타지 않는다).

### 3. Python 서비스 로그 설정 (`ea45b4a`)

사용자 요청으로 이어서 진행했다.

| 항목 | 내용 |
|---|---|
| 문제 | 로그 설정이 없어 서비스 로그는 lastResort 로 메시지만 나오고 INFO 는 버려졌다. 작업 ID 가 없었다 |
| 수정 | `core/logs.py` — uvicorn `LOGGING_CONFIG` 복사본에 `scc_analysis` 로거만 더한다(INFO, stderr, `시각 레벨 로거 job=<작업 ID> 메시지`, propagate 끔). 작업 ID 는 `current_job_id` ContextVar 로 두고 필터가 붙인다. `__main__.py` 가 `uvicorn.run(log_config=...)` 로 넘긴다. uvicorn 자체 로그 형식은 그대로다 |
| 분석 요청 로그 | `api/analysis.py` — 인증 뒤 작업 ID 를 설정하고 시작 INFO, 완료 INFO(유효 리뷰 수·손님 유형 수·초), 실패 WARNING(HTTP 오류는 detail.code, 그 밖은 예외 이름만·초). 예외→HTTP 변환은 `_run` 으로 옮겼을 뿐 같다. traceback 은 uvicorn 이 남기므로 여기서는 남기지 않는다(검증 오류에 모델 출력·리뷰 인용이 들어 있을 수 있어서) |
| 검증 | ruff PASS, pytest 128개(새 `test_logging.py` 4개, `test_runtime.py` 기대값 갱신). `reset` 을 지우면 복구 테스트가 실패하는 것을 확인(구현 세션·Reviewer 재검토 모두). 실제 서버(`SCC_REVIEW_COLLECTION_LIMIT=20`, reload 켜짐) + Spring 으로 50건 게이트 실패 작업을 두 번 돌렸다(OpenAI 호출 없음). 1회차(13:18)는 권고 반영 전 작업 트리, **2회차(13:26)는 커밋된 `ea45b4a` 코드 그대로**다. 2회차 출력: `2026-09-28 13:26:29,658 WARNING scc_analysis.api.analysis job=6a19742c-… 분석이 실패했습니다: INSUFFICIENT_VALID_REVIEWS (27초)` — 작업 ID 는 Spring 상태 응답의 jobId 와 같았다 |
| 독립 Reviewer | 1차 PASS(권고 5건) → 반영(효과 없던 복구 assert 를 같은 컨텍스트에서 직접 확인하는 테스트로 교체, 부정확한 주석 삭제, 작업 ID 설정 직후를 `try` 안으로) → 재검토에서 반영분 PASS. 동시 요청 5개에서 코루틴·`to_thread` 의 작업 ID 가 섞이지 않음을 Reviewer 가 probe 로 확인했다(실제 uvicorn 서버가 아니라 httpx `ASGITransport` 로 프로세스 안에서) |

- **소유 영역**: `core/logs.py`·`__main__.py` 는 서비스 전역 런타임 설정이라 `role:platform` 영역으로 보는 편이 안전하다(Reviewer 의견). PR 본문에 소유 영역 밖 수정으로 적고 platform 리뷰어를 지정한다(AGENTS.md 5장 4번).
- 성공 경로 INFO("분석을 마쳤습니다…")는 OpenAI 비용 때문에 실제로 출력해 보지 않았다.
- uvicorn 은 `0.52.4` 로 고정돼 있다. 버전을 올렸을 때 `test_logging.py` 가 잡는 것은 uvicorn 로거 이름이 없어진 경우, `formatters`·`handlers`·`loggers` 키가 없어진 경우, uvicorn 로그 줄 형식(`INFO:     …`)이 바뀐 경우다. 그 밖의 구조 변화까지 잡는다고 보장하지 않는다.
- openai·httpx 등 외부 라이브러리 로거는 설정하지 않아 이전과 같다.

## 2026-09-28 `main` 연결과 문서 정리 (PR #27 병합 뒤)

사용자가 PR #27 을 안전한 방식(merge commit)으로 병합하라고 해 `fcd095a` 로 병합한 뒤, 이 브랜치에 `main` 을 연결했다.

| 작업 | 커밋 | 내용 |
|---|---|---|
| `main` 연결 | `e17fe61` | 텍스트 충돌 2곳: `SecurityConfigTests`(두 mock 모두 유지), `ARCHITECTURE.md`(분석 API·Python 파이프라인 + Expo 앱·프론트 ADR, 결정된 미결 항목 제거). 인증 파일은 자동 병합됐고 양쪽 기능(약관 동의·기본 알림 설정 / `traceId` 오류 계약·미끼 해시·회전 유예·320자)이 남은 것을 확인했다. **의미 충돌 2곳**: `MyPageErrorHandler` 가 바뀐 `ErrorBody` 생성자를 못 써 컴파일 실패 → 공통 오류 계약(`traceId`, 필드 오류 생략)으로 맞춤. `AuthCredentialTests` 의 가입 호출(인자 3개)을 현재 약관 버전을 넘기는 도우미로 바꿈 |
| ADR 번호 | `b0e6175` | 작업 큐 ADR-011 → **ADR-012**. `main` 의 `ADR-011-frontend-bootstrap` 이 먼저 공개됐다(TASK-019 인수인계 8장의 "먼저 공개된 쪽 유지" 원칙). 이 인수인계의 ADR-011 참조 8곳도 ADR-012 로 바꿨다 |
| 문서 불일치 | `dbf6d02` | PR #36 본문 "알려진 문서 불일치": ARCHITECTURE·API 의 "재시작 복구 미지원" → ADR-012 임대 큐, API §10 에서 확정된 토큰 정책·탈퇴 제거, DATA_MODEL `error_code` 설명, ADR-012 결정 5번 #30 갱신 주석(원문 유지), API §5.3 "최대 3회 시도(재시도 2회)" |

| 검증 | 명령 | 결과 |
|---|---|---|
| Spring build·test | `.\backend\spring-api\gradlew.bat -p backend\spring-api build --rerun-tasks` (Docker 29.8.0) | `e17fe61` 에서 PASS — tests=99 failures=0 errors=0 skipped=0 |
| Python test | `.\backend\python-analysis\.venv\Scripts\python.exe -m pytest -p no:cacheprovider backend\python-analysis` | PASS — 128 passed |
| 상대 링크 | 저장소 전체 `*.md` 상대 링크 검사(스크래치 스크립트) | 문서 92개·링크 300개, 깨진 링크 0 |
| 실제 서버 | 로컬 PostgreSQL + `bootRun`, 새 테스트 계정 | Flyway 4개 검증·적용 없음. 약관 버전 없는 가입 400, 가입 201, 재가입 409(`traceId`), 틀린 비밀번호 401(`traceId`), 대문자 이메일 로그인 200, 세션 200, 회전 200, 옛 토큰 재사용 401 뒤 새 토큰 200(회전 유예), 알림 설정 200, 로그아웃 204 |

- V2 migration 은 옛 인증 커밋(`7773443`) 이후 바뀌지 않아 로컬 DB 와 checksum 이 맞는다.
- **PR #41(로그인 시도 제한)과의 충돌**: #41 과 이 브랜치가 둘 다 `AuthController`·`AuthService`·`AuthCredentialTests` 를 고친다. 둘 중 늦게 병합되는 쪽에서 손으로 합쳐야 한다(병합 전 시뮬레이션에서 `AuthController` 충돌 확인). #41 의 `AuthService` 생성자 인자 추가와 이 브랜치의 가입 인자 추가가 함께 들어가야 한다.
- `frontend/mobile/INTEGRATION_GUIDE.md` 206행(프론트 소유)은 ADR 번호 충돌을 아직 "미결정"으로 적고 있다. PR 본문으로 알린다.

## 2026-09-28 브랜치 전체 검토 반영 (PR #36)

독립 Reviewer 가 브랜치 전체(`main...HEAD`)를 검토해 결함 12건과 비용·보안 권고를 냈다. 사용자는 결함 12건과 권고를 모두 고치고, 유효 리뷰 수는 지금 서버에서 전달하고, 법률 초안은 실제 동작에 맞추고, 분석 API 오류는 공통 계약으로 맞추기로 정했다.

| 커밋 | 고친 것 |
|---|---|
| `f71d246` | 완료 저장은 첫 문장에서 `RUNNING` → `COMPLETED` 를 바꾸고 1행이 아니면 전부 되돌린다(임대 만료로 실패 마감된 작업에 결과·알림이 커밋되던 문제). 큐 `inFlight` 를 실행 수로 셈. 결과 저장이 되돌려지면 방금 쓴 이미지 파일 삭제, 탈퇴는 커밋 뒤 파일 삭제. 탈퇴 시 JWT `sid` 세션이 살아 있는지 확인(`401 SESSION_REVOKED`) |
| `ef74aad` | 분석 API 오류를 API.md 2.1 공통 계약(`fieldErrors`, `traceId`)으로. 본문 검증·헤더/쿼리 누락·경로 값 형식·깨진 JSON 은 `400 INVALID_REQUEST` |
| `1c7e0dd`, `62f6003` | REVIEW-008: 유효 리뷰 50건 미만 실패에 `validReviewCount`·`minimumValidReviewCount`(Flyway V5). `1c7e0dd` 는 ruff 실패 상태로 커밋돼 `62f6003` 에서 고쳤다 |
| `632aa3d` | Python: 모델 출력 검증 실패 502 `ANALYSIS_OUTPUT_INVALID`, 이미지 생성 실패 502 `IMAGE_GENERATION_FAILED`, OpenAI 호출 실패 503 `INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE`(모두 재시도 대상). 수집 host 는 공개 인터넷 주소만(CGNAT·멀티캐스트 차단), DNS 일시 실패는 재시도 가능. 서비스 토큰을 본문 검증보다 먼저 확인 |
| `c61f432` | 같은 `Idempotency-Key` 동시 요청이 500 이던 문제(`ON CONFLICT DO NOTHING`), 255자 초과 키 400, 알림 설정 행 없는 사용자의 실패 알림 누락 |
| 이 절의 문서 커밋 | API.md v0.6, DATA_MODEL(V3~V5 컬럼·인덱스, 완료·알림 경계 서술), ADR-009·010·012 갱신 주석·과장 표현, 법률 초안(OpenAI 로 보내는 항목, 탈퇴 구현 상태), `backend/README.md`·`AGENTS.md` 3장(`playwright install chromium`) |

- 완료 저장 소유권·되돌림 시 이미지 정리 테스트는 수정을 되돌려 실패하는 것을 직접 확인했다.
- 법률 초안은 실제 동작을 적었을 뿐이다. 가명 처리는 하지 않으며 적격 법률 검토 전 초안이라는 상태는 그대로다.

| 검증 | 명령 | 결과 |
|---|---|---|
| Spring build·test | `.\backend\spring-api\gradlew.bat -p backend\spring-api build --rerun-tasks` (Docker) | PASS — tests=112 failures=0 errors=0 skipped=0 (BUILD SUCCESSFUL, Docker 29.8.0) |
| Python lint·format | `ruff check --no-cache`, `ruff format --check --no-cache` (`backend\python-analysis`) | PASS — All checks passed, 21 files already formatted |
| Python test | `.\backend\python-analysis\.venv\Scripts\python.exe -m pytest -p no:cacheprovider backend\python-analysis` | PASS — 156 passed |
| 실제 분석 | — | 미실행(비용). 이번 수정 뒤 실제 서버로 분석하지 않았다 |
| Visual QA | — | 미실행 |

### 남은 권고 (이번 범위 밖, 이슈 후보)

- 알림 설정 `PATCH` 에 빈 본문 `{}` 을 보내면 조용히 꺼진다
- 비밀번호 재확인 실패(`PASSWORD_CONFIRMATION_FAILED`)가 401 이라 앱이 로그아웃으로 오인할 수 있다
- 입력 URL 의 포트·경로를 검사하지 않는다
- 쓰지 않는 `markRunning`·`@EnableAsync`
- Google 가입은 약관 동의를 기록하지 않는다
- Tomcat `/error` 가 `denyAll` 에 걸려 400·500 이 403 으로 보일 수 있다(확인 필요)
- (재검토 권고) 테스트 공백: 큐 `inFlight` 중복 track, 러너의 `JobOwnershipLostException` 분기, 설정 행 없는 사용자의 `failExhaustedJobs` 경로
- (재검토 권고) 비용: 근거 인덱스 검증이 이미지 3장 생성 뒤에 돌아 실패하면 재시도마다 이미지 비용이 다시 든다. `openai.APIError` 전체(인증 401·모델 없음 포함)를 503 재시도로 보내 설정 오류도 3회 시도한다
- (재검토 권고) 완료 저장 소유권은 "작업이 `RUNNING` 인가" 로만 판정한다. 재회수된 작업이면 원 워커 저장이 성공하고 새 워커 결과가 버려진다(ADR-012 의 at-least-once 한계 안)

## Unresolved

### 제품·법무 결정

- 네이버 정책은 원칙적으로 자동 수집을 금지한다. 명시적 승인 또는 공식 API/robots 허용 확인 전 운영 활성화 금지. 근거와 경위는 [ADR-002](../../decisions/ADR-002-review-collection.md).
- ~~**유효 리뷰 50건 기준을 유지할지.**~~ 2026-09-27 유지 결정(#28 종료). 실측 표본에서 본문 없는 별점 리뷰가 약 50%다. 소규모 매장은 현재 기준으로 사실상 분석이 불가능하다.
- ~~`build_reviews` 의 `len(normalized) < 10` 최소 글자 수는 제품 결정 없이 들어간 임의 임계값이다.~~ 2026-09-27 10자 유지 결정(#28 종료).
- ~~작성일을 알 수 없는 리뷰의 2년 경고 처리(PRD 미결 질문 13).~~ 2026-09-27 결정: 제외 유지 + 건수 안내(#29). 현재는 경고 대상에서 제외한다.
- ~~재시도 3회를 모두 쓴 작업을 사용자에게 어떻게 표현할지.~~ 2026-09-27 결정·구현(#30).
- RAG 지식 출처와 검수·승인 절차가 없어 `knowledgeReferences` 가 비어 있다. 승인된 지식 베이스가 선결 조건이다.
- 정식 법률 검토, 운영자 정보, 보유기간, 국외 이전 정보가 미완료다.
- 위 미결정 사항은 2026-09-25 역할별 GitHub 이슈로 넘겼다(2026-09-24 에는 `gh` 인증 401 로 생성하지 못했었다).
  - #28 유효 리뷰 50건 기준·최소 글자 수, #29 작성일 미확인 리뷰의 2년 경고, #30 재시도 소진 실패 문구, #31 RAG 지식 출처와 승인 절차, #33 업종별 선택형 키워드 목록 — `role:product`
  - #32 `/register` 409 가입 여부 노출·로그인 시도 제한 — `role:platform`
  - 법률 검토, 네이버 수집 허용 확인, 브랜치 보호 설정은 사람이 외부에서 처리할 일이라 이슈로 만들지 않았다.

### 기술적으로 남은 것

- **수집 안정성 실측은 매장 2곳뿐이다.** 음식점 `2080629959`(E2E 포함)와 카페 `2045844114`(수집만, 2026-09-26)에서 120건 수집을 확인했다. 커밋된 fixture 는 1회 수동 확인한 형태를 본뜬 합성 데이터다. 네이버가 필드를 바꾸면 테스트는 통과하면서 수집만 조용히 실패할 수 있다.
- DOM 텍스트 앞에 별점 등 접두어가 붙으면 본문 매칭이 실패해 날짜가 비는 열화가 있다. 실제 수집에서 발생률을 측정해야 한다.
- 큐는 at-least-once 다. 임대 만료 직후 원 워커가 되살아나면 수집·모델 호출 비용이 두 번 발생할 수 있다([ADR-012](../../decisions/ADR-012-durable-analysis-job-queue.md) Consequences).
- 폴링 주기·임대 시간·재시도 횟수는 로컬 실측 기준값이다. 운영 부하를 보고 조정한다.
- 내부 호출 read timeout 15m 은 동기 호출 구조를 전제한 값이다. 작업을 더 쪼개면 줄일 수 있다.
- Visual QA 미실행. 빈 포디움 슬롯·분석 불가 화면·알림 목록을 실기기에서 확인해야 한다.
- 회원 탈퇴의 실제 PostgreSQL 삭제 검증은 통합 테스트 코드로만 확인했다(2026-09-28 완료된 분석이 있는 사용자 탈퇴 통합 테스트 추가, 앱 화면은 아직 연결 안 됨).
- ~~**임대 만료로 재시도 횟수를 다 쓴 작업에는 실패 알림이 생기지 않는다.**~~ 2026-09-27 수정(아래 절 참조, 통합 테스트 실행 확인 대기). 재시도 소진에는 두 경로가 있다.
  - 작업 안에서 실패(Python 이 재시도 가능한 오류를 반환하는 등): `AnalysisJobRunner.finishFailure` → `requeueForRetry` 가 `attempt_count < maxAttempts` 조건에 걸려 false → `markFailed` 가 원래 오류 코드로 마감하고 **알림을 만든다.**
  - 임대 만료(워커 종료·하트비트 끊김): `AnalysisJobQueue.recoverAbandonedJobs` → `failExhaustedJobs` 가 `ANALYSIS_TIMEOUT` 으로 FAILED 처리하는 UPDATE 뿐이다. **알림이 빠지는 건 이 경로다.** 알림 설정이 켜져 있어도 마이페이지에 아무것도 뜨지 않는다.
  - 2026-09-26 인수인계 검토에서 코드를 읽어 확인했다. 실행 재현은 하지 않았다. 코드 미수정.
  > 정정(2026-09-28): 위 두 줄은 수정 전 상태다. 2026-09-27 임대 만료 경로에도 알림을 만들도록 고쳤고, 2026-09-28 알림 설정 행이 없는 사용자도 알림을 받도록 고쳤다(`c61f432`).

## Do Not Assume
- Android 번들 성공은 실기기 E2E 성공이나 네이버 selector 안정성을 증명하지 않는다.
- 약관과 개인정보 처리방침은 법률 검토 전 초안이다.
- 프론트는 2026-09-28 부터 `frontend/mobile`(`feat/TASK-020-frontend-mobile`, PR #35)이다. 그 이전 절에 적힌 앱 변경은 사용자가 임시로 만든 `C:\PULSE_SCC_FE`(Git 저장소 아님)에만 있고 새 앱에는 없다.
- PR #36 은 draft 다. PR #27 병합·인증 충돌 병합·문서 불일치 정리는 끝났고, 브랜치 전체 독립 Reviewer 결함 수정은 아래 "2026-09-28 브랜치 전체 검토 반영" 절이다. Ready 전환은 사용자가 정한다.
- PR #41(로그인 시도 제한)과 이 브랜치는 `AuthController`·`AuthService`·`AuthCredentialTests` 를 함께 고친다. 늦게 병합되는 쪽에서 손으로 합친다. 이 브랜치는 `MyPageService` 생성자에 `Clock` 도 추가했다.
- E2E 가 성공했다고 네이버 selector 안정성이 증명된 것은 아니다. 전체 E2E 는 음식점 1개 매장에서 COMPLETED 3회 이상(230초·268초·196초, 재시작 복구 1회 포함)이 전부고, 카페 1개 매장은 수집 단계만 확인했다.
- 선택형 키워드 제외 목록(50개)은 사용자 제공 통계와 카페 1곳 실측으로 모은 것이다. 네이버 전체 선택지 목록이 아니다.
- 큐의 재시작 복구는 실제로 검증했지만 다중 인스턴스 동시 운영은 검증하지 않았다.

## Next Action

> **2026-09-28 세 번째 세션 종료(사용량 소진).** 이 인수인계 갱신 직전 HEAD 는 `625821c` 이고 원격과 같다. 이 갱신 커밋에는 코드 변경이 없고, 사용량 소진으로 이 커밋 자체는 독립 Reviewer 검토 없이 커밋했다.
> 종료 시 상태: 코드 수정과 문서 커밋 `e82ce89`·`625821c` 는 독립 Reviewer 재검토 PASS(1차 FAIL: 인수인계 자리표시자 1건 → `625821c` 에서 수정). PR #36 본문 갱신 완료(검증 표 Spring 112·Python 156, ADR-012 체크, 전체 검토 반영 요약). PR #36 은 **draft**, 라벨 `type:feature`·`role:feature`. 프론트(`frontend/mobile`)는 받아올 변경 없음을 확인했다.
> 로컬 상태: 이 세션에서 띄운 서버 없음. worktree `C:\PULSE_SCC-mobile` 은 디스크에 남아 있다.
> 결함·권고 코드 수정 6커밋(`f71d246`~`c61f432`)과 문서 정리 커밋. 위 "2026-09-28 브랜치 전체 검토 반영" 절.
> 같은 날 병합: PR #40(`7a968b9`), PR #25(`44da270`) squash, PR #27 merge commit(`fcd095a`, #26 자동 종료). #33 은 "업종 키워드 목록 불필요" 결정으로 종료, #31 은 MVP 에서 RAG 제외·화면 '없음' 유지 결정 댓글 뒤 열어 둠. #32 는 PR #41 로, #34 는 PR #39 로 진행 중.
> 이어서 할 것
> 1. PR #36 Ready 전환(사용자 결정) → 리뷰어 지정. 소유 영역 밖 파일 목록은 PR 본문에 있다
> 2. PR #41 과 PR #36 중 늦게 병합되는 쪽에서 인증 파일 손 병합
> 3. 위 "남은 권고" 를 이슈로 만들지 사용자에게 묻는다
> 4. 이번 수정 뒤 실제 분석 1회(OpenAI 비용, 사용자 승인 필요)와 Visual QA 는 미실행

> **2026-09-28 두 번째 세션 종료 시점.** 시작 시 HEAD `61b9b15`, 이 인수인계 갱신 직전 HEAD 는 `a22935d` 이고 원격과 같았다. 이 인수인계 갱신 커밋 자체에는 코드 변경이 없다.
> 이 세션에서 한 것
> - "접기" 중복 의심의 원인으로 보이는 수집기 버그를 실측으로 재현하고 수정(`4177727`). 저장된 분석이 실제로 이 중복으로 만들어졌는지는 추정이다. 확인하고 싶으면 사용자가 DB 에서 그 분석의 `reviews` 중 본문 끝이 "접기"인 행을 세면 된다(선택, 수집기 수정 여부와는 무관)
> - #34 에 새 앱(`frontend/mobile`, `10161ab`) 위치를 적은 갱신 댓글을 올렸다(사용자 승인). 수정은 프론트 담당 몫이다
> - 새 프롬프트·수집 수정으로 실제 분석 1회(사용자 승인, OpenAI 비용 발생). "2026-09-28 새 프롬프트·수집 수정으로 실제 분석 1회" 절
> - 결정 없이 할 수 있는 기술 과제: 손님 유형 4개 이상이면 리뷰 수 상위 3개만 남김(`47c1130`), 결과 문구 필터가 뺀 문장 건수 로그(`c87b4a7`), 사용자 요청으로 Python 로그 설정(`ea45b4a`). "2026-09-28 결정 없이 처리한 기술 과제 2건" 절
> - 코드 커밋 4개(`4177727`, `47c1130`, `c87b4a7`, `ea45b4a`)는 모두 독립 Reviewer PASS. 인수인계 기록 커밋은 `dccda0f`·`eb174cc`·`bc8a0f0`·`a22935d` 가 Reviewer PASS 뒤 커밋이고, `cdb9b7d` 는 Reviewer 가 지적한 수치 한 곳만 고쳐 재검토 없이, `76975f3`(#34 댓글 기록 두 줄)은 검토 없이 커밋했다. 브랜치 push 완료
> 세션 종료 시 확인한 외부 상태: PR #27·#35 OPEN, 리뷰어 지정 0명·리뷰 결정 없음. PR #25(`docs/TASK-010-archive-handoffs`, 병합된 인수인계 archive)도 OPEN·리뷰어 0명. #31·#32 댓글 0, #33 은 2026-09-25 진행 댓글 뒤로 결정 없음, #34 는 이 세션 갱신 댓글 1개 뒤로 응답 없음.
> 이어서 할 것(우선순위 순) — 비용 없는 선택적 수집 실측(주점 등 다른 매장 수집, DOM 본문 앞 별점 접두어로 날짜가 비는 발생률 — "지금 바로 할 수 있는 것" 절, 방법은 Claude Continuation 8번) 외에는, **에이전트가 결정·비용·외부 조건 없이 할 수 있는 과제는 남아 있지 않다**
> 1. **사람**: PR #27 에 리뷰어 지정·병합. 이것이 풀려야 2·3번이 움직인다
> 2. PR #27 병합 뒤 `main` 연결·인증 충돌 수동 병합 → draft PR #36 을 Ready 로("막혀 있는 순서", PR #36 본문 상단). **PR 을 만들 때 `git diff --name-only main...HEAD` 로 소유 영역 밖 파일을 전수 확인하고** PR 본문에 적은 뒤 해당 역할 리뷰어를 지정한다(AGENTS.md 5장 4번). 2026-09-28 Reviewer 가 PR #27 커밋을 빼고 대조한 알려진 목록(전수 확인을 대신하지 않는다):
>    - role:platform 명시 경로: `backend/spring-api/src/main/java/kr/co/scc/api/common/config/SecurityConfig.java`, `docs/architecture/API.md`("2026-09-27 임대 만료 실패 알림, 토픽 수 규칙, 빈 슬롯 문구" 절의 남은 것)·`DATA_MODEL.md`·`ARCHITECTURE.md`, `docs/decisions/ADR-009-*`·`ADR-012-*`
>    - backend 빌드·환경 설정(role:platform): `backend/spring-api/src/main/resources/application.yml`, `backend/python-analysis/pyproject.toml`, `backend/.env.example`, `.gitignore`
>    - 판단이 필요한 것(서비스 전역 런타임 설정이라 role:platform 으로 볼 수 있음): Python `core/logs.py`·`core/config.py`·`main.py`·`__main__.py`
>    - 판단이 필요한 것(DB 구조 정본이라 `DATA_MODEL.md` 와 함께 role:platform 리뷰 대상): Flyway migration `V3__create_analysis_read_model_and_legal_consents.sql`, `V4__add_analysis_job_lease.sql`
>    - 소유 역할이 AGENTS.md 5장에 없는 것: `docs/legal/**`, Spring `backend/spring-api/src/main/java/kr/co/scc/api/legal/**`(5장이 role:feature 에 준 패키지는 `auth`·`analysis`·`mypage` 뿐이다)
>    - PR #27 커밋에만 있는 `docs/product/**`(role:product), `AGENTS.md`, `README.md`, `V2__create_auth_sessions.sql` 등은 PR #27 병합 뒤 diff 에서 빠질 것으로 보이나 병합 뒤 다시 확인한다
> 3. 남은 이슈: #33(업종 범위 결정) → #32(PR #27 병합 후) → #31(지식 출처 결정)
> 확인이 남은 것(필요할 때만, 비용 발생): 스크롤 로딩이 120건보다 적게 된 경우의 수집 수정 효과는 수집만 실측으로 확인했다. 성공 경로 완료 로그와 결과 문구 필터 경고는 실제 서버에서 찍어 보지 않았다. 다음 실제 분석 때 Python 로그에서 `결과 문구 필터:` 줄이 나오는지 보면 필터가 일했는지 알 수 있다.
> 로컬 상태: 이 세션에서 띄운 Python 8000·Spring 8080 은 모두 껐다(포트 닫힘 확인). 새 앱 worktree `C:\PULSE_SCC-mobile` 은 디스크에 남아 있다. 이 세션에서 만든 테스트 계정 3개(`e2e-<시각>@scc.test`)는 로컬 DB 에 가입된 채 남아 있고, 비밀번호·결과 JSON·서버 로그는 세션 스크래치에만 있다.

> **2026-09-28 세션 종료 시점.** 이 인수인계 갱신 직전 HEAD 는 `35c374a` 이고 원격과 같았다. 이 인수인계 갱신 커밋 자체에는 코드 변경이 없다.
> 이 세션에서 한 것
> - 프론트 전환: 앞으로 프론트는 `frontend/mobile`(`feat/TASK-020-frontend-mobile`, PR #35)로 진행한다. `C:\PULSE_SCC_FE` 는 사용자가 임시로 만든 앱이라 더 쓰지 않는다
> - 새 앱을 실제 백엔드에 붙여 전체 분석 1회까지 확인(위 "2026-09-28" 절). 발견 사항을 PR #35 댓글에 7개 절로 전달
> - 결과 문구에서 리뷰 번호·내부 용어를 거르는 프롬프트·필터(`317dc8f`, Reviewer 4차 PASS)
> 이어서 할 것(우선순위 순)
> 1. **새 프롬프트로 분석 1회**(OpenAI 비용) — caveat·limitations 가 쉬운 말로 나오는지, 필터가 무엇을 빼는지 확인
> 2. **"접기" 중복 리뷰 의심 확인**(사용자가 DB 조회 필요) — 2026-09-28 분석의 `reviews` 에서 본문 끝이 "접기"인 행과 같은 본문 중복이 있는지. 있으면 수집기 수정
> 3. **#34 재평가** — #34 는 이제 쓰지 않는 `C:\PULSE_SCC_FE` 기준으로 적었다. 새 앱에도 같은 문제가 있다: `frontend/mobile/src/features/analysis/AnalyzeScreen.tsx` 는 상태 조회가 네트워크 오류면 오프라인 표시 후 계속 조회하지만, 5xx 등 그 밖의 오류면 `retryable` 실패로 바꾸고 "다시 분석하기"가 `submit({ reuseKey: false })` 로 새 작업을 만든다. #34 에 새 앱 위치로 갱신 댓글이 필요하다(프론트 소유라 프론트 개발자에게)
> 4. 남은 이슈: #33(업종 범위 결정) → #32(PR #27 병합 후) → #31(지식 출처 결정)
> 5. PR #27 은 2026-09-28 확인 시에도 **OPEN, 리뷰어 0명**. PR #35 도 OPEN, 리뷰 결정 없음
> 로컬 상태: 새 앱 worktree `C:\PULSE_SCC-mobile`(`feat/TASK-020-frontend-mobile`, 의존성 설치됨)는 디스크에 남는다. 재부팅·세션 종료 시 사라지는 것은 서버 프로세스뿐이다 — Expo 웹 8081·프록시 8090(에이전트가 띄움), Spring 8080(사용자가 띄움). Python 8000 은 이미 꺼져 있다.

> **2026-09-27 세션 종료 시점.** 이 인수인계 갱신 직전 HEAD 는 `76bae1a` 다. 이 인수인계 갱신 커밋 자체에는 코드 변경이 없다.
> 이 세션에서 한 것
> - 임대 만료 실패 알림 누락 수정, 토픽 수 규칙(1·2개면 그만큼만, 여러 개면 리뷰 수 상위 3개)과 빈 슬롯 문구 "리뷰 수가 적어서 도출되지 않았다"
> - #28 종료(50건·10자 유지), #29 종료(작성일 미확인 리뷰 건수 안내), #30 구현(재시도 소진 시 즉시 재시도 차단, 오류 코드 숨김)
> - 범위 밖 발견을 #34 로 등록: 상태 조회 5xx 뒤 재시도가 새 작업을 만든다
> - Docker 가 한때 기동 실패했다가 복구됐다. Spring test 는 53개 skip 0 으로 끝났다
> 남은 이슈 순서 제안: #34(버그, 코드만으로 처리 가능) → #33(업종 범위 결정) → #32(PR #27 병합 후) → #31(지식 출처 결정 필요)
> PR #27 은 2026-09-27 확인 시에도 **OPEN, 리뷰어 0명**이다.

> **2026-09-26 세션 종료 시점.** 이 인수인계 갱신 직전 HEAD 는 `218d179` 이고 원격과 같았다. 이 인수인계 갱신 커밋 자체에는 코드 변경이 없다.
> 이 세션에서 한 것: 선택형 키워드 제외(음식점·카페, 50개), 카페 매장 실측, 후속 결정 이슈 #28~#33 생성과 #33 진행 댓글 2건.
> PR #27 은 2026-09-26 확인 시 **OPEN, 리뷰어 0명, 승인 없음**이다. 아래 1번이 풀리기 전에는 2~4번을 시작할 수 없다.

### 막혀 있는 순서

1. ~~PR #27 병합~~ — 2026-09-28 merge commit `fcd095a`
2. ~~`main` 연결·인증 충돌 수동 병합~~ — 2026-09-28 `e17fe61`
3. ~~Spring test 전체와 로컬 DB `bootRun` + 가입·로그인·회전 호출~~ — 2026-09-28, "2026-09-28 `main` 연결과 문서 정리" 절
4. 독립 Reviewer 검토 후 TASK-012 PR 을 만든다. PR 본문 관련 이슈에 #28~#33 을 후속 결정으로 연결하되 `Refs` 로 쓴다. `Closes` 를 쓰면 결정 전인 SPEC 이슈가 병합 때 닫힌다.

### 사람만 할 수 있는 것 (2026-09-26 기준)

- GitHub 브랜치 보호 설정 (현재 없음)
- `SCC_SERVICE_TOKEN` 교체 — Spring `ANALYSIS_SERVICE_TOKEN` 과 Python `SCC_SERVICE_TOKEN` 을 같은 새 값으로
- Visual QA 용 Expo Go 또는 실기기 준비 — 빈 포디움 슬롯·분석 불가 화면·알림 목록
- Google OAuth Client ID, 약관 법률 검토, 네이버 수집 허용 확인([ADR-002](../../decisions/ADR-002-review-collection.md))

### 결정을 받으면 에이전트가 할 것

| 이슈 | 결정 | 반영 위치 |
|---|---|---|
| ~~#28~~ | 종료 (2026-09-27) — 50건·10자 모두 유지, 코드 변경 없음 | 기준을 다시 바꿀 때는 `build_reviews` 10자, Python 50건 게이트(`analysis/pipeline.py`), DB 제약 `ck_analyses_review_counts`(새 Flyway migration), PRD FR-009 를 함께 바꾼다 |
| #29 | 2026-09-27 구현 — 제외 유지 + `reviewsWithoutWrittenDateCount` 안내 | PRD Open Question 13·FR-009 문구는 `role:product` 에 반영 요청 |
| #30 | 2026-09-27 구현 — 재시도 소진은 `ANALYSIS_RETRY_EXHAUSTED`·즉시 재시도 불가, 오류 코드 숨김 | 기능명세 오류 상태 표에 반영하도록 `role:product` 요청 |
| #31 | RAG 지식 출처·승인 절차 | `knowledgeReferences` 계약과 검색·인용 구현 |
| #32 | `/register` 409·로그인 시도 제한 | 인증 코드 (PR #27 병합 후). ADR-008·API.md 는 `role:platform` 소유 |
| #33 | 지원 업종 범위·업종별 키워드 목록 | `NAVER_VOTED_KEYWORDS`. 주점 등 목록을 받으면 카페 때와 같이 대조·추가하고 실측한다 |

### 지금 바로 할 수 있는 것 (선택)

- **#34** 상태 조회 5xx 뒤 재시도가 새 작업을 만드는 버그. 새 앱 `frontend/mobile` 에도 같은 문제가 있다. 2026-09-28 #34 에 새 앱 위치를 적은 갱신 댓글을 올렸다(Next Action 맨 위 블록 "이 세션에서 한 것"). 프론트 개발자 소유라 에이전트가 더 할 일은 없다.
- ~~재시도 소진 작업의 실패 알림 누락 수정~~ — 2026-09-27 완료, 통합 테스트 실행 확인까지 끝났다.
- 다른 매장(주점 등) 수집 실측. OpenAI 비용 없음. 방법은 Claude Continuation 8번.
- DOM 본문 앞에 별점 등 접두어가 붙어 방문일 매칭이 실패하는 발생률 측정("기술적으로 남은 것"). 같은 방식의 수집 실측이라 OpenAI 비용 없음.

## Claude Continuation

1. `git status --short`, `git branch -a`, `git log -3 --oneline` 으로 상태를 확인한다. **`git branch -a` 를 빼먹지 않는다** — 이전 세션이 로컬 브랜치를 못 보고 같은 TASK 를 중복 구현한 적이 있다.
2. 환경은 준비돼 있다. Docker 정상, 로컬 PostgreSQL 18 에 `scc` DB·계정 존재, `backend/.env` 설정 완료(OpenAI 키 포함).
3. 검증 명령
   - Spring: `.\backend\spring-api\gradlew.bat -p backend\spring-api test` → 112개, skip 0 이어야 한다(Docker 필요)
   - Python: `.\backend\python-analysis\.venv\Scripts\python.exe -m pytest -p no:cacheprovider backend\python-analysis` → 156개 (`-p no:cacheprovider` 는 `.pytest_cache` 쓰기 권한 오류 회피)
4. E2E 를 돌릴 때는 **OpenAI 실제 비용이 발생한다.** 수집만 확인하려면 `SCC_REVIEW_COLLECTION_LIMIT=20` 으로 띄운다. 50건 게이트에서 막혀 모델을 호출하지 않는다.
5. 서비스 기동 순서: Python(`python -m scc_analysis`, 8000) → Spring(`gradlew bootRun`, 8080). 전체 분석은 약 200~310초 걸린다.
6. 사용자 터미널은 PowerShell 이다. Git Bash 경로(`/c/...`)나 `&` 없는 따옴표 경로를 안내하면 실패한다.
7. 한글이 든 JSON 본문은 UTF-8 파일로 써서 `curl --data-binary @file` 로 보낸다. 셸 인라인은 인코딩이 깨진다.
8. 매장 수집 실측은 서버 없이 스크래치 스크립트로 한다. 모듈 함수 `review_collection_url` 로 URL 을 만들고, `_collect_from_browser` 와 같은 순서로 `page.goto` → `validate_collection_page_url` → `NaverPublicReviewCollector._open_review_surface` → `_extract_review_texts` 를 호출한다. `build_reviews` 에는 필터를 끄는 인자가 없으므로, 필터 전 결과는 `strip_voted_keywords` 를 항등 함수로 잠시 패치해 얻고 필터 후 결과와 비교한다. 칩 문구는 `li[class*='place_apply_pui']` 항목 텍스트에서 본문(`.pui__vn15t2`)과 `반응 남기기` 사이의 짧은 `요` 줄로 모은다. **원문에는 작성자 닉네임이 섞이므로 결과는 건수·문구만 남기고 원문 파일은 지운다.**
9. **`backend/.env` 는 에이전트가 읽을 수 없다**(`.claude/settings.json` deny). 하지만 두 서비스 모두 **스스로** `backend/.env` 를 읽는다 — Spring 은 `application.yml` 의 `spring.config.import: optional:file:../.env[.properties]`(bootRun 작업 디렉터리 `backend/spring-api` 기준), Python 은 `core/config.py` 의 `env_file=("../.env", ".env")`(`backend/python-analysis` 에서 실행 기준). 따라서 에이전트가 값을 보지 않고도 두 서비스를 띄울 수 있다(`backend/README.md` 1장). 2026-09-28 에는 이 사실을 놓쳐 사용자에게 Spring 을 PowerShell 로 `.env` 를 불러 띄우게 했는데, 그 방식은 선택 사항이다. Python 상태 확인 경로는 `/internal/v1/health` 다(`/health` 아님). DB 직접 조회는 비밀번호가 필요해 사용자에게 요청한다.
10. **새 앱(`frontend/mobile`) 통합 확인 방법**: 먼저 `git worktree list` 로 `C:\PULSE_SCC-mobile` 이 있는지 본다. 없을 때만 `git worktree add ../PULSE_SCC-mobile feat/TASK-020-frontend-mobile` 후 `npm --prefix ../PULSE_SCC-mobile/frontend/mobile ci`. 있으면 `git -C ../PULSE_SCC-mobile pull` 로 최신화하고, `package-lock.json` 이 바뀌었으면 `npm ci` 를 다시 한다. 이 PC 에 Android SDK 가 없어 Expo 웹으로 띄운다(에이전트 Bash 기준): `cd ../PULSE_SCC-mobile/frontend/mobile && CI=1 EXPO_PUBLIC_API_BASE_URL=http://localhost:8090 npx expo start --web --port 8081`. Spring 에 CORS 가 없으므로 `/api/` 는 8080, 나머지는 8081 로 넘기는 작은 Node 프록시(8090, 웹소켓 업그레이드 포함)를 스크래치 폴더에 두고 띄운다. 이 프록시는 저장소 밖이라 세션마다 다시 만든다. 브라우저 창에서 주소창으로 이동하면 새로고침돼 로그아웃되므로 앱 안 메뉴로 이동한다. 테스트 계정은 매번 새로 만든다(`@scc.test`, 비밀번호는 채팅에 적지 않고 스크래치에만).

## Last Verified Commit

`c61f432` — 브랜치 전체 검토 결함·권고 코드 수정까지(그 뒤 문서 커밋은 코드 변경 없음). 이 코드로 Spring build·test PASS(`build --rerun-tasks`, Docker 29.8.0, BUILD SUCCESSFUL, tests=112 failures=0 errors=0 skipped=0), Python lint·format PASS·pytest 156개. 실제 분석·Visual QA 미실행.

`dbf6d02` — `main`(PR #27) 연결·ADR 번호 변경·문서 불일치 정리까지. 코드는 `e17fe61` 과 같다. `e17fe61` 에서 Spring 99개 skip 0, Python 128개, 로컬 DB `bootRun` 인증 흐름 확인. 브랜치 전체 독립 Reviewer 는 아직이다.

이전 기준 `ea45b4a` — Python 서비스 로그 설정까지. 이 커밋 기준으로 Python lint·format PASS, pytest 128개 PASS, 독립 Reviewer PASS(반영분 재검토 포함), 이 커밋 코드 그대로 실제 서버 + Spring 으로 50건 게이트 실패 작업 1개에서 로그 형식·작업 ID 확인(OpenAI 호출 없음). Spring 은 변경 없음(직전 확인 53개 skip 0).

이전 기준 `c87b4a7` — 결정 없이 처리한 기술 과제 2건(손님 유형 상위 3개 자르기 `47c1130`, 필터 건수 로그)까지. 이 커밋 기준으로 Python lint·format PASS, pytest 124개 PASS, 두 변경 모두 독립 Reviewer PASS. Spring 은 변경 없음(직전 확인 53개 skip 0). 실제 분석은 이 두 변경 뒤로 실행하지 않았다(비용).

이전 기준 `4177727` — "접기" 중복 수집 수정까지. 이 커밋 기준으로 Python lint·format PASS, pytest 118개 PASS(독립 Reviewer 재검토에서도 실행), 실제 수집(OpenAI 없음) 1회로 "접기" 중복 0 확인. Spring 은 변경 없음(직전 확인 53개 skip 0). API 수준 실제 분석 1회 완료(`76975f3` 에서 실행, 코드는 이 커밋과 같음. 앱 화면·Visual QA 미실행) — "2026-09-28 새 프롬프트·수집 수정으로 실제 분석 1회" 절.

이전 기준 `317dc8f` — 결과 문구 내부 표현 필터와 새 프론트 통합 확인 기록까지. 이 커밋 기준으로 Python lint·format PASS, pytest 114개 PASS, 독립 Reviewer 4차 PASS. Spring 은 이번 커밋 변경 없음(직전 확인 53개 skip 0). 새 프롬프트로 실제 분석은 실행하지 않았다(비용).

이전 기준 `76bae1a` — #30 재시도 소진 실패 구분·즉시 재시도 차단까지. 이 커밋 기준으로 **Spring test 53개 skip 0 PASS**, Frontend typecheck·lint·test 30개 PASS(`C:\PULSE_SCC_FE`, Git 범위 밖), 독립 Reviewer 재검토 PASS. Python 은 이번 커밋 변경 없음(직전 확인 39개). 전체 E2E·Visual QA 는 실행하지 않았다.

이전 기준 `4aaa709` — #29 작성일 미확인 리뷰 건수 안내까지. 이 커밋 기준으로 **Spring test 50개 skip 0 PASS**(임대 만료 알림 통합 테스트 포함), Python pytest 39개 PASS(이번 커밋 변경 없음), Frontend typecheck·lint·test 26개 PASS, 독립 Reviewer PASS. 전체 E2E·Visual QA 는 실행하지 않았다.

이전 기준 `ebcf9bf` — 임대 만료 실패 알림, 토픽 수 규칙, 빈 슬롯 문구. 당시 Spring 10개 SKIP 이었고 `4aaa709` 에서 실행 확인됐다.

이전 기준 `be2117b` — 네이버 선택형 키워드 제외·카페 키워드까지. Python pytest 35개.

이전 기준 `025eb8b` — 작업 큐·페르소나 이미지 인물 포함까지. Spring 48개(skip 0)·Python 26개 통과, 전체 E2E COMPLETED, 재시작 복구를 실제로 검증했다.
