# TASK-012 — 네이버 리뷰 수집·분석 API와 프론트 연결

## Status
구현 진행 — 마이페이지·탈퇴 완료, 실제 PostgreSQL 실행 검증 대기

## Owner
`role:feature` — 미배정 (`role:platform`, `role:product`, `role:design-system` 교차 리뷰 필요)

## Branch
`feat/TASK-012-analysis-pipeline`

## Work Note
- 원격 push와 PR 생성은 수행하지 않았다. 현재 변경은 로컬 브랜치에만 있다.
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

## Unresolved
- 네이버 정책은 원칙적으로 자동 수집을 금지한다. 명시적 승인 또는 공식 API/robots 허용 확인 전 운영 활성화 금지.
- 실제 OpenAI API 호출을 포함한 전체 분석 E2E는 미실행. 채팅에 노출된 키는 사용하지 않고 폐기·재발급이 필요하다.
- Docker Desktop 4.91.0과 WSL/VirtualMachinePlatform 기능은 설치·활성화했으나 재부팅 전이라 Flyway V3와 PostgreSQL 저장 통합 테스트는 미실행.
- 2026-09-18 Docker Desktop 프로세스는 시작됐으나 WSL 런타임이 설치 완료 상태가 아니어서 엔진 연결 실패. 로컬 PostgreSQL 18 서비스는 실행 중이나 테스트 계정 비밀번호가 없어 실제 통합 테스트는 계속 미실행.
- Spring 인프로세스 비동기 작업은 재시작 복구·다중 인스턴스를 지원하지 않는다. 운영 전 내구성 큐 필요.
- RAG 전문 지식 검색은 아직 구현되지 않아 제안의 지식 참고 목록이 비어 있다.
- 정식 법률 검토, 운영자 정보, 보유기간, 국외 이전, 탈퇴·삭제 기능이 미완료다.

## Do Not Assume
- Android 번들 성공은 실기기 E2E 성공이나 네이버 selector 안정성을 증명하지 않는다.
- 약관과 개인정보 처리방침은 법률 검토 전 초안이다.
- 프론트 변경은 `C:\PULSE_SCC_FE`에만 있으며 현재 백엔드 저장소 커밋 대상이 아니다.
- 이 브랜치는 원격에 push되지 않았고 PR도 생성되지 않았다.

## Next Action
WSL/Docker 엔진을 정상화하거나 전용 PostgreSQL 테스트 DB 접속정보를 준비한 뒤 `AnalysisApiIntegrationTests`와 `InitialSchemaMigrationTests`의 6개 Testcontainers 테스트를 실제 실행한다. 이후 새 OpenAI 키를 로컬 `backend/.env`에만 설정하고 전체 E2E를 수행한다.

## Last Verified Commit
`36561f6` — 마이페이지 알림·설정, 회원 탈퇴·삭제, 분석 전체 흐름 통합 테스트 코드와 문서를 대상으로 컴파일·테스트·빌드 검증 수행
