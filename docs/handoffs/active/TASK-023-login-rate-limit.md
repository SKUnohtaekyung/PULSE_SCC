# TASK-023 — 가입 여부 노출과 로그인 시도 제한

## Status
리뷰 대기

## Owner
role:feature(인증 코드) — 사용자 결정(2026-09-28)에 따라 TASK-012 세션이 구현. ADR-008·API.md 는 role:platform 소유라 platform 리뷰 필요

## Branch
feat/TASK-023-login-rate-limit — `feat/TASK-011-authentication`(PR #27) 위에서 시작했다. PR 대상도 그 브랜치다. PR #27 이 병합되면 대상을 `main` 으로 바꾼다

## Goal
비밀번호 대입과 가입 여부 대량 조회를 막는다.
관련 이슈: #32
관련 요구사항: ADR-008, API.md §4

## Completed
- 사용자 결정(2026-09-28): `/register` 의 `409 EMAIL_ALREADY_EXISTS` 는 유지하고 시도 제한을 둔다. 수치는 "느슨하게" 안
  - 같은 이메일로 로그인 10번 실패 → 15분 잠금(첫 시도부터 15분 창, 성공하면 초기화, 없는 이메일도 같이 셈, 잠긴 동안 비밀번호 확인 안 함)
  - 같은 클라이언트 주소에서 로그인·가입 요청이 10분에 60번 초과 → 10분 차단(IPv6 는 /64 로 묶음)
  - 막히면 `429 TOO_MANY_ATTEMPTS`, `Retry-After`(초, 올림), `retryable=true`
- `LoginAttemptLimiter` — 인스턴스 메모리의 계정·주소별 창. 기존 `Clock` 빈 사용
  - 로그인 시도는 비밀번호 확인 **전에** 실패로 먼저 센다(`reserveAttempt`). 성공하면 지운다. 동시 요청으로 10회 제한을 넘지 못하게 하려는 것이다(독립 Reviewer 1차 FAIL 1)
  - 계정·주소 기록 각 최대 10만 건. 꽉 차면 30초에 한 번까지만 기한 지난 기록을 치우고, 그래도 차 있으면 새 키를 429 로 막는다(Reviewer FAIL 2)
- `AuthController` — 로그인·가입 입구에서 `remoteAddr` 로 주소 제한
- `AuthService.login` — 확인 전 시도 예약·성공 초기화
- `AuthException`·`AuthErrorHandler` — 재시도 시간이 있으면 `Retry-After` 헤더와 `retryable=true`
- ADR-008 결정 11·12와 결과, API.md §4.3

## Changed
- `backend/spring-api/src/main/java/kr/co/scc/api/auth/application/LoginAttemptLimiter.java` — 새 파일, 시도 제한
- `.../auth/application/AuthService.java` — 계정 잠금 연결, 생성자에 제한기 추가
- `.../auth/api/AuthController.java` — 주소 제한 연결
- `.../auth/application/AuthException.java`, `.../auth/api/AuthErrorHandler.java` — `Retry-After`·`retryable`
- 테스트: `LoginAttemptLimiterTests`(새 14개), `AuthCredentialTests`(새 4개 — 동시 요청 30개에서 비밀번호 확인 10회 포함), `AuthRateLimitWebTests`(새 2개), `AuthServiceTests`·`RefreshRotationTests`(생성자 인자만)
- `docs/decisions/ADR-008-authentication-policy.md`, `docs/architecture/API.md` — 결정과 계약(role:platform)

## Decisions
- 상태를 DB 가 아니라 메모리에 둔다. DB 에 두려면 새 Flyway migration 이 필요한데, PR #36 이 V3·V4 를 쓰고 있어 번호가 엇갈리면 이미 적용된 DB 에서 순서 오류가 난다. 한계는 ADR-008 결과에 적었다
- 주소는 `remoteAddr` 만 믿는다. `X-Forwarded-For` 는 조작할 수 있다
- Google 로그인·토큰 갱신에는 제한을 걸지 않았다. 서명 토큰·고엔트로피 토큰이라 대입 대상이 아니고, 결정이 로그인·가입만 말했다
- 기록이 꽉 차면 새 키를 막는다(fail closed). 메모리 고갈보다 일시 차단이 낫다고 봤다

## Verification
2026-09-28, Docker 29.8.0.

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | — | 없음 — Spring 에 별도 lint 명령이 없다(AGENTS.md 3장) |
| Spring build·test | `.\\backend\\spring-api\\gradlew.bat -p backend\\spring-api build --rerun-tasks` | PASS — BUILD SUCCESSFUL, tests=78 failures=0 errors=0 skipped=0 (PR #27 브랜치 58개 + 새 20개). 1차 구현(72개)은 Reviewer FAIL 뒤 고쳤다 |
| typecheck | — | 없음 |
| Visual QA | — | 해당 없음 — 백엔드 변경 |
| 앱에서 429 표시 | — | 미실행. 앱은 모르는 코드면 서버 `error.message` 를 보여 준다(SCREEN_STATES 불변식 11) — 코드 판독 |

## Unresolved
- `SCREEN_STATES.md` §2.1 에 `TOO_MANY_ATTEMPTS` 행과 로그인·가입 화면의 상태가 없다. 지금은 불변식 11 로 서버 문구가 나온다. `role:product` 에 추가를 요청한다
- 여러 인스턴스 운영 전 공유 저장소로 옮기기, 프록시 뒤 배포 시 `server.forward-headers-strategy` 설정 — 배포 설정은 role:platform
- 같은 주소를 쓰는 여러 사용자(공용 와이파이)는 60회 한도를 함께 쓴다
- 누구나 남의 이메일로 10번 틀려 그 계정을 15분 잠글 수 있다(ADR-008 결과에 기록)
- 시도는 비밀번호 확인 전에 세므로 DB 오류 등으로 확인하지 못한 시도도 실패로 남는다. DB 장애 중 10번 다시 시도하면 복구 뒤에도 15분 잠길 수 있다(보수적인 쪽, 독립 Reviewer 재검토 지적)
- 기록이 꽉 찼을 때 막는(fail closed) 것은 사용자 결정 밖에서 구현자가 고른 트레이드오프다. 서로 다른 이메일 10만 개로 채우려면 IPv4 주소 약 1,700개 이상이 필요하다. PR 에서 확인을 요청한다
- **PR 방식**: 이 브랜치는 PR #27 브랜치 위에 있고 PR 대상도 그 브랜치다. PR #27 이 병합되기 전에는 이 PR 을 PR #27 브랜치에 병합하지 않는다(병합하면 #27 범위가 바뀐다). PR #27 이 squash 로 병합되면 이 브랜치에 남은 #27 원래 커밋 때문에 `main` 대상 diff 가 겹치므로 `main` 위로 다시 쌓는다(merge 전략은 AGENTS.md 6.1 "확정 필요")
- 이슈 #32 완료 조건의 "구현 후속 작업 연결 (PR #27 병합 이후)"는 2026-09-28 사용자 결정으로 "PR #27 위에 이어서 지금"으로 바뀌었다
- 이슈 #32 는 `role:platform`·`type:spec` 이지만 이 PR 은 인증 코드 구현이라 `role:feature`·`type:feature` 로 붙인다. ADR-008·API.md(role:platform) 수정은 PR 본문에 밝히고 platform 리뷰를 요청한다

## Do Not Assume
- 서버를 재시작하면 잠금이 풀린다
- 실제 서버 기동(`bootRun`)으로 429 를 확인하지 않았다. MockMvc 통합 테스트로만 확인했다

## Next Action
- 독립 Reviewer 검토 → PR(대상 `feat/TASK-011-authentication`, `type:feature`·`role:feature`, `Closes #32`)

## Last Verified Commit
`3fac3c4` — 코드 커밋. 위 Verification(78개)은 이 커밋의 코드에서 실행했다. 문서 커밋은 그 다음이다.
