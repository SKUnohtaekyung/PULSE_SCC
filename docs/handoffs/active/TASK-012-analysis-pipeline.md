# TASK-012 — 네이버 리뷰 수집·분석 API와 프론트 연결

## Status
구현 진행 — 마이페이지·탈퇴 완료, 실제 PostgreSQL 실행 검증 대기

## Owner
`role:feature` — 미배정 (`role:platform`, `role:product`, `role:design-system` 교차 리뷰 필요)

## Branch
`feat/TASK-012-analysis-pipeline`

## Work Note
- 원격 push와 PR 생성은 수행하지 않았다. 현재 변경은 로컬 브랜치에만 있다.
- 최신 로컬 커밋은 `02cd854`, 분석 파이프라인 기능 구현 커밋은 `36561f6`이다.
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
| 날짜 보강 실데이터 확인 | 로컬에 임시 저장한 실제 `m.place.naver.com` 응답 1페이지에 수집 경로 적용 | **재현 불가 — 응답 원본을 저장소에 커밋하지 않았다.** 1회 수동 확인 결과는 `written_at` 0/10건 → 10/10건, 수집 건수 후퇴 없음이었다. 저장소로 재현 가능한 근거는 위 fixture 테스트다 |

## 리뷰 작성일 보강 (2026-09-18)

기존 `_extract_date` 는 **리뷰 본문 글자에서** 정규식으로 날짜를 찾았다. 실제 리뷰 본문에는 날짜가 거의 적히지 않아 실측 10건 중 0건만 날짜를 얻었고, 그 결과 **PRD FR-009의 2년 초과 경고가 구조적으로 발동할 수 없었다.**

네이버 응답의 `representativeVisitDateTime` 만 연도를 포함한 완전한 타임스탬프다(`visited`·`created` 는 `9.13.일` 형식으로 연도가 없다). 이 값을 읽어 본문에 매칭하는 `build_date_index` 를 추가했다.

**검증된 DOM 텍스트 수집 경로는 그대로 두었다.** `__APOLLO_STATE__` 는 SSR 첫 페이지(약 20건)만 담고 나머지는 스크롤 시 GraphQL 응답으로 오므로, 구조화 추출로 전면 교체하면 수집 건수가 120건에서 20건 수준으로 후퇴해 50건 기준에 미달한다. 따라서 수집은 기존 방식을 유지하고 **날짜만 보강**한다. GraphQL 응답은 페이지가 스스로 보내는 요청의 응답을 읽을 뿐 별도 요청을 만들지 않는다.

본문 정규식 방식은 fallback 으로 남겼다. 구조화 타임스탬프가 없으면 `written_at` 은 `None` 으로 두고 연도를 추정하지 않는다.

## 폐기한 중복 브랜치

`feat/TASK-012-naver-review-collector` (커밋 `739c516`) 는 같은 TASK 번호·같은 `collection/` 패키지·같은 ADR-009 번호로 수집 계층을 중복 구현한 브랜치다. 이 브랜치를 정본으로 유지하기로 결정하고 해당 브랜치는 개발을 중단했다. ref 는 삭제하지 않고 남겨 두었다. 위 날짜 보강은 그 브랜치에서 옮겨 온 유일한 항목이다.

## Unresolved
- 네이버 정책은 원칙적으로 자동 수집을 금지한다. 명시적 승인 또는 공식 API/robots 허용 확인 전 운영 활성화 금지.
- 실제 OpenAI API 호출을 포함한 전체 분석 E2E는 미실행. 채팅에 노출된 키는 사용하지 않고 폐기·재발급이 필요하다.
- Docker Desktop 4.91.0과 WSL/VirtualMachinePlatform 기능은 설치·활성화했으나 재부팅 전이라 Flyway V3와 PostgreSQL 저장 통합 테스트는 미실행.
- 2026-09-18 Docker Desktop 프로세스는 시작됐으나 WSL 런타임이 설치 완료 상태가 아니어서 엔진 연결 실패. 로컬 PostgreSQL 18 서비스는 실행 중이나 테스트 계정 비밀번호가 없어 실제 통합 테스트는 계속 미실행.
- Spring 인프로세스 비동기 작업은 재시작 복구·다중 인스턴스를 지원하지 않는다. 운영 전 내구성 큐 필요.
- RAG 전문 지식 검색은 아직 구현되지 않아 제안의 지식 참고 목록이 비어 있다.
- 날짜 보강의 **실제 브라우저 수집 중 동작은 미검증이다.** 저장된 응답과 단위 테스트로만 확인했다. 실제 수집 시 GraphQL 응답이 몇 건의 날짜를 채우는지는 다음 E2E에서 측정해야 한다.
- `build_reviews` 의 `len(normalized) < 10` 최소 글자 수는 제품 결정 없이 들어간 임의 임계값이다. 확정하거나 제거해야 한다.
- 실제 네이버 응답의 필드 형태(`__typename`, `representativeVisitDateTime`)를 저장소 안의 원자료로 대조하지 못했다. 커밋된 fixture는 1회 수동 확인한 형태를 본떠 만든 합성 데이터이므로, 네이버가 필드를 바꾸면 테스트는 통과하면서 수집만 조용히 실패할 수 있다.
- DOM 텍스트 앞에 별점 등 접두어가 붙으면 본문 매칭이 실패해 날짜가 비는 열화가 발생한다. 실제 수집에서 발생률을 측정해야 한다.
- 정식 법률 검토, 운영자 정보, 보유기간, 국외 이전 정보가 미완료다. 탈퇴·연계 데이터 삭제 코드는 구현됐지만 실제 PostgreSQL 검증은 남아 있다.

## Do Not Assume
- Android 번들 성공은 실기기 E2E 성공이나 네이버 selector 안정성을 증명하지 않는다.
- 약관과 개인정보 처리방침은 법률 검토 전 초안이다.
- 프론트 변경은 `C:\PULSE_SCC_FE`에만 있으며 현재 백엔드 저장소 커밋 대상이 아니다.
- 이 브랜치는 원격에 push되지 않았고 PR도 생성되지 않았다.

## Next Action
WSL/Docker 엔진을 정상화하거나 전용 PostgreSQL 테스트 DB 접속정보를 준비한 뒤 `AnalysisApiIntegrationTests`와 `InitialSchemaMigrationTests`의 6개 Testcontainers 테스트를 실제 실행한다. 이후 새 OpenAI 키를 로컬 `backend/.env`에만 설정하고 전체 E2E를 수행한다.

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

`02cd854` — 리뷰 작성일 보강과 충돌 처리까지 위 Verification이 유효하다. 분석 파이프라인 본체의 직전 검증 기준 커밋은 `36561f6` — 마이페이지 알림·설정, 회원 탈퇴·삭제, 분석 전체 흐름 통합 테스트 코드와 문서를 대상으로 컴파일·테스트·빌드 검증 수행
