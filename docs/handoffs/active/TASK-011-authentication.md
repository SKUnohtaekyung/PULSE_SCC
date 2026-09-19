# TASK-011 — 인증 정책과 세션 API

## Status
리뷰 대기

## Owner
role:feature — 미배정

## Branch
feat/TASK-011-authentication

## Pull Request
[PR #27 — feat(auth): 회전형 토큰 인증 구현](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/27)

- 2026-09-16 종료 시점: `OPEN`, `MERGEABLE`, `mergeStateStatus=CLEAN`
- 라벨: `type:feature`, `role:feature`
- GitHub 자동 검사와 리뷰 승인: 없음

## Goal
자체 가입·로그인과 Google 로그인, 회전형 Refresh Token, 로그아웃, 세션 복원 API를 구현한다.
관련 이슈: #26
관련 요구사항: PRD FR-AUTH-001, 기능 명세 AUTH-001~AUTH-011

## Completed
- 이메일 정규화, 자체 가입·로그인, Google ID Token 검증을 구현했다.
- Access JWT 15분과 회전형 Refresh Token 30일 정책을 구현했다.
- Refresh Token 재사용 감지 시 사용자의 활성 세션을 모두 폐기하도록 했다.
- 현재 세션 로그아웃과 DB 세션 상태를 확인하는 로그인 복원을 구현했다.
- Flyway V2 `auth_sessions`와 인증 정책 ADR을 추가하고 API·DB·제품 문서를 동기화했다.
- 이슈 #26을 닫도록 연결한 PR #27을 생성하고 원격 브랜치에 반영했다.

## Changed
- `backend/spring-api/src/main/java/kr/co/scc/api/auth/**` — 인증 도메인, 서비스, 저장소, Google 검증, HTTP API 구현
- `backend/spring-api/src/main/java/kr/co/scc/api/common/config/SecurityConfig.java` — JWT 인증과 공개 인증 endpoint 경계 설정
- `backend/spring-api/src/main/resources/db/migration/V2__create_auth_sessions.sql` — Refresh Token 세션·회전 관계 추가
- `backend/spring-api/src/test/**` — 비밀번호·토큰·재사용 폐기·보안 경계·migration 검증 추가
- `docs/decisions/ADR-008-authentication-policy.md` — 인증 정책 결정 기록
- `docs/architecture/**`, `docs/product/**`, `README.md`, `backend/README.md`, `AGENTS.md` — 실제 구현과 정본 동기화

## Decisions
- 비밀번호는 복잡도 규칙 없이 8자 이상으로 받되 BCrypt 입력 한계 때문에 UTF-8 72바이트 상한을 둔다.
- 전화번호는 자체 가입에 필수지만 MVP에서는 인증·로그인·복구에 사용하지 않고 중복을 허용한다.
- Access Token은 HS256 JWT 15분, Refresh Token은 256-bit 난수 30일로 하고 매 갱신마다 회전한다.
- 동일 이메일의 Google 계정과 자체 계정은 자동 연결하지 않는다. 장기 정책은 ADR-008이 정본이다.

## Verification
**실제로 실행한 것만 적는다.**

| 검증 | 명령 | 결과 |
|---|---|---|
| Spring lint | Java compile `-Xlint:deprecation` (`clean build`에 포함) | PASS — 경고 0 |
| Python lint | `.\\backend\\python-analysis\\.venv\\Scripts\\python.exe -m ruff check --no-cache backend\\python-analysis` | PASS |
| Python format | `.\\backend\\python-analysis\\.venv\\Scripts\\python.exe -m ruff format --check --no-cache backend\\python-analysis` | PASS — 9 files already formatted |
| typecheck | 프로젝트에 별도 명령 없음 | 없음 |
| Spring test | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api clean build` | PASS — 12개 중 8개 통과, Docker 의존 통합 테스트 4개 skipped |
| Python test | `.\\backend\\python-analysis\\.venv\\Scripts\\python.exe -m pytest backend\\python-analysis` | PASS — 2 passed |
| Spring build | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api clean build` | PASS |
| 문서 | API JSON 파싱, 전체 Markdown 상대 링크 검사 | PASS — JSON 11개, 링크 143개 |
| PostgreSQL 통합 테스트 | 위 Spring 명령에서 Testcontainers 테스트 실행 시도 | 미실행 — 로컬 Docker 없음으로 4개 skipped |
| Visual QA | UI 변경 없음 | 없음 |

## 독립 검토 후속 수정 (2026-09-19)

독립 검토 FAIL 판정 중 계약 위반과 테스트 공백을 처리했다.

- `traceId` 를 오류 응답에 추가하고 `fieldErrors` 를 필드 오류가 있을 때만 포함하도록 고쳐 `docs/architecture/API.md` 2.1 을 준수한다. 요청마다 `TraceIdFilter` 가 값을 만들고 `X-Trace-Id` 헤더와 MDC 에 함께 싣는다. 클라이언트가 보낸 값은 신뢰하지 않는다.
- **Google issuer 를 문자열 클레임으로 읽도록 고쳤다.** `getIssuer()` 는 URL 로 변환하므로 Google 이 스킴 없는 `accounts.google.com` 을 보내면 `IllegalArgumentException` 이 발생하고, 기존 catch 가 이를 잡지 않아 인증 실패가 아니라 **500** 이 되는 경로였다. 테스트로 고정했다.
- 이메일에 `@Size(max = 320)` 을 추가했다. `users.login_email` 이 `varchar(320)` 이라 초과 입력이 DB 제약 위반으로 떨어져 `409 EMAIL_ALREADY_EXISTS` 로 잘못 보고되던 경로를 입력 단계에서 막는다.
- `GoogleJwtVerifier` 에 테스트용 decoder 주입 생성자를 추가하고 audience 불일치·issuer 위조·`email_verified` 누락·서명 실패·클레임 유출을 테스트로 고정했다.
- `login`·`register` 테스트를 추가했다. 계정 부재와 비밀번호 오류가 **같은 코드·상태·메시지**를 반환하는지, 실패 시 세션을 발급하지 않는지, 비밀번호 원문이 오류에 실리지 않는지를 확인한다.
- `denyAll` 의 핵심 성질(유효한 JWT 로도 미등록 경로는 403)과 `logout`·`session` 인증 요구를 테스트로 고정했다.

계속해서 검토 4·5번(계정 열거·회전 경합)도 처리했다.

- **로그인 응답 시간을 평탄화했다.** 계정이 없거나 Google 전용 계정이어도 미끼 해시로 비밀번호 비교를 한 번 수행한다. 기존에는 BCrypt 를 건너뛰어 응답 시간만으로 가입 여부가 드러났다. 미끼 해시는 실제 인코더로 한 번만 계산해 캐시하며 로그인 성공 판정에 쓰이지 않는다.
- **회전 경합이 전 기기 로그아웃을 일으키지 않게 했다.** 회전 직후 30초(`ROTATION_GRACE`) 안에 같은 토큰이 다시 들어오면 앱의 재시도로 보고 해당 요청만 거부한다. 유예 창을 넘긴 폐기 토큰과 로그아웃으로 폐기된 토큰은 그대로 전체 세션을 폐기한다.
- **CAS 경합 패자가 고아 행을 남기지 않게 했다.** 교체 세션은 `replaced_by_session_id` FK 때문에 먼저 INSERT 해야 하므로, 회전 실패 시 `deleteUnusedSession` 으로 즉시 제거한다. 경합 패배는 오래된 토큰 재사용이 아니므로 전체 폐기 대상이 아니다.
- `RefreshSession` 에 `replacedBySessionId` 를 추가해 회전 폐기와 로그아웃 폐기를 구분한다.

테스트 12개 → **58개** (통과 54, Docker 부재로 skip 4).

## Unresolved
- 이용약관·개인정보 처리 동의 시점과 저장 근거는 제품 결정이 필요하다. 결정 전 운영 가입 화면·API가 완결됐다고 간주하지 않는다.
- 계정 복구·탈퇴·비밀번호 변경과 Google 계정 명시적 연결은 후속 범위다.
- 실제 Google client ID와 Android OAuth 설정을 넣은 종단 간 로그인 검증은 미실행이다.
- Docker가 준비된 환경에서 PostgreSQL 18.6 Testcontainers 통합 테스트 4개를 실행해야 한다.
- Product 문서와 Platform 설정·migration을 함께 수정했으므로 `role:product`, `role:platform` 리뷰가 필요하다.

## Do Not Assume
- 로그아웃된 Access Token은 서명상 최대 15분 유효할 수 있다. `/auth/session`은 DB 세션도 확인하지만 모든 보호 API가 매 요청마다 DB 폐기 상태를 조회하는 것은 아니다.
- 전화번호는 검증된 식별자나 복구 수단이 아니다.
- Google 로그인은 동일 이메일 자체 계정에 자동 연결되지 않는다.
- PostgreSQL migration은 컴파일됐지만 Docker 부재로 실제 DB에 적용 검증되지 않았다.

## Next Action
PR #27에서 독립 Reviewer와 `role:product`·`role:platform` 리뷰를 요청한다. 이어서 Docker 환경에서 PostgreSQL 통합 테스트 4개를 실행하고 모두 PASS일 때만 병합한다.

## Last Verified Commit
aa0dfa1 — 오류 계약 준수와 인증 테스트 보완까지 위 Verification이 유효하다. 인증 구현 본체의 직전 검증 기준 커밋은 7773443
