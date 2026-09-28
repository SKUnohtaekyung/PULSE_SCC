# PULSE MVP 화면 상태 모델

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 목적 | Android 프론트엔드가 화면별 정상·진행·빈 상태·오류·복구 상태를 빠뜨리지 않도록 구현 상태를 정의한다 |
| 상태 | 6차 — Step 5 디자인 합성의 저장 선택 시점·실패 배치·내비게이션 조건 반영. 세부 카피·시각 디자인·오프라인 정책은 미정 |
| 기준일 | 2026-09-22 |
| 백엔드 계약 출처 | 인증 정책·계정 연결·가입 응답: 원격 `feat/TASK-011-authentication`(PR #27, `74d6df8`)의 `docs/decisions/ADR-008-authentication-policy.md`, `docs/architecture/API.md`, `AuthService`·`AuthController`. 약관·법률 문서 동의와 계정 탈퇴: 원격 `feat/TASK-012-analysis-pipeline`(`a4ab15b`)의 `docs/architecture/API.md`, `docs/decisions/ADR-010-account-deletion.md`, `LegalController`, `MyPageService`. 두 브랜치는 2026-09-21 기준 `main`에 병합 전이며 병합 후 상대 링크로 바꾼다 |
| 제품 요구사항 정본 | [PRD.md](../PRD.md) |
| 사용자 흐름 | [USER_FLOW.md](USER_FLOW.md) |
| 정보구조 | [RESULT_IA.md](RESULT_IA.md) |
| 상세 기능명세 | [GUEST_ANALYSIS_FUNCTIONAL_SPEC.md](GUEST_ANALYSIS_FUNCTIONAL_SPEC.md) |
| UI/UX 원칙 | [DESIGN_SYSTEM.md](../../design/DESIGN_SYSTEM.md) |
| API 계약 | [API.md](../../architecture/API.md) |
| 소유 역할 | `role:product` |

이 문서는 `preview.html`이 제안한 `IA → User Flow → State Model → 상세 IA` 순서에서 State Model을 담당한다. 화면 배치나 컴포넌트 모양을 확정하지 않으며, 구현해야 할 상태와 상태 전이만 정의한다.

기능명세의 `SC-*`는 논리 화면 ID다. 로그인 후 가게 입력·확인·분석 진행을 실제로 몇 개의 React Native route로 나눌지는 아직 정하지 않았다. 하나의 route 안에서 단계가 바뀌더라도 아래 상태는 모두 구현해야 한다.

---

## 2. 상태 표기 규칙

| 상태군 | 뜻 | 공통 표시 원칙 |
|---|---|---|
| `initial` | 화면에 처음 진입해 아직 사용자 행동이나 네트워크 요청이 없는 상태 | 핵심 목적과 다음 행동을 명확히 표시한다 |
| `editing` | 사용자가 입력·선택을 변경하는 상태 | 기존 입력을 보존하고 제출 가능 여부를 갱신한다 |
| `loading` | 초기 데이터나 다음 화면에 필요한 데이터를 읽는 상태 | 1초를 넘으면 처리 중임을 문장으로 알린다 |
| `submitting` | 사용자가 요청한 작업을 서버로 보내고 응답을 기다리는 상태 | 중복 요청을 막고 어떤 작업을 수행 중인지 표시한다 |
| `success` | 요청 또는 조회가 정상적으로 끝난 상태 | 완료 결과와 다음 행동을 제공한다 |
| `empty` | 요청은 성공했지만 표시할 데이터가 없는 상태 | 빈 화면 대신 이유와 가능한 다음 행동을 제공한다 |
| `error` | 요청·검증·외부 서비스 처리에 실패한 상태 | 원인·현재 상태·다음 행동을 함께 표시한다 |
| `unauthorized` | 인증 정보가 없거나 만료·폐기된 상태 | 민감정보를 노출하지 않고 로그인으로 돌아갈 수 있게 한다 |
| `offline` | 네트워크 연결이 없는 상태 | 구체 캐시·재시도 정책은 미정이며 임의로 구현하지 않는다 |

### 공통 불변식

1. `loading`, `submitting`, `error`를 색상이나 스피너만으로 표현하지 않는다.
2. 처리 중인 주요 CTA는 중복 실행되지 않아야 한다.
3. 서버의 내부 예외명·스택 트레이스·외부 서비스 응답 전문을 표시하지 않는다.
4. 인증 사용자의 저장 결과가 없으면 홈과 하단 내비게이션을 표시하지 않는다.
5. 저장 결과가 있는 사용자가 새 분석을 실행하는 동안 기존 저장본은 유지한다.
6. 분석 작업은 실제 도출된 모든 페르소나 이미지와 근거 검증이 끝나기 전에는 `success`로 보이지 않는다.
7. 오류가 발생해도 사용자가 다시 입력하지 않아도 되는 값은 보존한다.
8. `offline`의 캐시·자동 재시도·백그라운드 처리 방식은 제품 결정 전까지 구현값으로 확정하지 않는다.
9. 서버 오류 응답은 `{ "error": { "code", "message", ... } }` 봉투로 온다. 앱은 `error.code`로 상태를 가르고 HTTP 상태만으로 가르지 않는다. §2.1 표에 있는 코드는 **앱이 정한 문구와 다음 행동**을 쓰고, 서버 `error.message`는 표에 없는 코드일 때만 보여준다. 서버 문구가 상태 의도와 다를 수 있기 때문이다. 예를 들어 작업의 `STORE_NOT_FOUND` 메시지는 "잠시 후 다시 시도해 주세요"이고, `ACCOUNT_LINK_REQUIRED` 메시지는 MVP에 없는 계정 연결을 안내한다. 봉투의 부가 필드는 API와 브랜치마다 다르다. 인증 API는 TASK-011 `74d6df8`에서 [API.md](../../architecture/API.md) §2.1의 `fieldErrors`·`traceId`를 주지만 TASK-012 `a4ab15b`에는 `traceId`가 없고 `fieldErrors`가 항상 비어 있다. 분석 API는 현재 `retryable`·`fields`(빈 값)·`timestamp`를 준다(§11). 앱은 `fieldErrors`를 있을 수도 없을 수도 있는 필드로 다룬다. 탈퇴의 `401 PASSWORD_CONFIRMATION_FAILED`처럼 `error.code`가 있는 401은 세션 만료가 아니므로 불변식 12의 토큰 갱신을 일으키지 않는다. `traceId`를 화면에 노출할지는 §11에서 정한다.
10. 백엔드 인증 정책(ADR-008 결정 6, API.md §4.2)은 이미 폐기된 Refresh Token이 다시 오면 해당 사용자의 활성 세션을 모두 폐기한다. 그러므로 앱은 토큰 갱신 요청을 한 번에 하나만 보내고, 동시에 필요한 요청은 진행 중인 갱신 결과를 기다린다. TASK-011 `74d6df8` 코드에는 회전으로 폐기된 토큰이 30초 안에 다시 오면 그 요청만 거부하는 유예가 있지만, ADR·API.md에는 없고 TASK-012 `a4ab15b` 코드에도 없다. 로그아웃으로 폐기된 토큰은 유예 없이 전체 세션을 폐기한다. 앱은 이 유예에 의존하지 않는다.
11. 알 수 없는 `error.code`를 받으면 `error.message`를 보여주고, 분석 작업이면 작업의 `retryable` 값으로 `ANALYSIS-RETRYABLE-ERROR`와 `ANALYSIS-FATAL-ERROR`를 가른다. 봉투가 없는 오류 응답(서버 기본 400·500, 작업 대기열 초과 등)은 원인을 단정하지 않는 일반 오류 문구와 재시도 행동을 보여준다. §2.1에 없는 코드에 대해 코드별 문구를 앱에 임의로 추가하지 않는다.
12. 인증이 필요한 요청이 **`error` 봉투 없는 401**(또는 `WWW-Authenticate: Bearer`)을 받으면 액세스 토큰 만료로 보고, 불변식 10에 따라 토큰 갱신을 한 번 한 뒤 원래 요청을 다시 보낸다. 갱신이 §2.1의 `AUTH-EXPIRED` 코드로 실패하거나 다시 보낸 요청이 또 401이면 `AUTH-EXPIRED`로 간다. 이 규칙은 페르소나 이미지 요청(§6.4)에도 적용한다. 근거: 원격 백엔드의 `SecurityConfig`에 인증 실패 응답이 따로 정의되지 않아 Spring Security 기본 401을 쓴다. 코드 판독 근거이며 실제 응답은 확인하지 않았다(§11).
13. `Idempotency-Key`는 **응답을 받지 못한 같은 제출을 다시 보낼 때만** 재사용한다(네트워크 끊김·시간 초과). 작업이 `FAILED`로 끝난 뒤 다시 분석하거나 입력을 고친 뒤 요청할 때는 새 키를 만든다. 같은 키를 다시 쓰면 서버가 이전 작업(`FAILED` 포함)을 그대로 돌려주거나, 입력이 다르면 `IDEMPOTENCY_KEY_REUSED`로 거부한다.

### 2.1 서버 오류 코드와 상태 연결

코드 이름의 정본은 [API.md](../../architecture/API.md)와 실제 controller·DTO다. 아래 "구현" 열은 2026-09-21 기준 원격 백엔드 코드(`feat/TASK-011-authentication` `74d6df8`, `feat/TASK-012-analysis-pipeline` `a4ab15b`)에 해당 코드가 있는지를 뜻한다. 병합 전이므로 병합 후 다시 대조한다.

| 코드 | 발생 시점 | 상태 | 구현 |
|---|---|---|---|
| `INVALID_INPUT`, `INVALID_REQUEST` | 요청 검증(`400`) | 화면에 따라 `AUTH-FIELD-ERROR` 또는 `STORE-FIELD-ERROR`. `fieldErrors`가 있으면 필드별로 연결(`fieldErrors[].code`에는 `INVALID_VALUE` 등이 온다) | 있음 |
| `INVALID_PASSWORD`, `INVALID_PHONE_NUMBER` | 가입 검증(`422`) | `AUTH-FIELD-ERROR` — 비밀번호·전화번호 필드 | 있음 |
| `EMAIL_ALREADY_EXISTS`, `ACCOUNT_ALREADY_EXISTS` | 가입 | `AUTH-SIGNUP-ERROR` | 있음 |
| `CURRENT_LEGAL_CONSENT_REQUIRED` | 가입 | `AUTH-CONSENT-OUTDATED` | 있음 |
| `INVALID_CREDENTIALS` | 자체 로그인 | `AUTH-INVALID-CREDENTIALS` | 있음 |
| `INVALID_GOOGLE_ID_TOKEN`, `GOOGLE_AUTH_NOT_CONFIGURED` | Google 로그인 | `AUTH-GOOGLE-ERROR` | 있음 |
| `ACCOUNT_LINK_REQUIRED` | Google 로그인(`409`) | `AUTH-ACCOUNT-LINK-REQUIRED` | 있음 |
| `INVALID_REFRESH_TOKEN`, `SESSION_REVOKED`, `ACCOUNT_NOT_ACTIVE`, `ACCOUNT_NOT_FOUND` | 세션 복원·토큰 갱신·계정 확인 | `AUTH-EXPIRED` | 있음 |
| `ACCOUNT_NOT_ACTIVE` | 로그인 요청 자체 | 로그인 화면에 머물며 이 계정은 지금 사용할 수 없다고 안내(`AUTH-INVALID-CREDENTIALS` 또는 `AUTH-GOOGLE-ERROR` 화면 안). `AUTH-EXPIRED`로 보내 로그인을 반복시키지 않음 | 있음 |
| 봉투 없는 `401` | 인증이 필요한 모든 요청 | 불변식 12 — 토큰 갱신 후 원래 요청 재전송, 실패하면 `AUTH-EXPIRED` | 서버 기본 동작(코드 판독) |
| `PASSWORD_CONFIRMATION_FAILED` | 탈퇴(`401`) | `ACCOUNT-DELETE-VERIFY-ERROR`. 세션 오류로 처리하지 않음 | 있음 |
| `INVALID_NAVER_PLACE_URL` | 분석 작업 생성(`400`), 또는 작업 실패(리다이렉트 결과가 허용 밖 주소) | `STORE-UNSUPPORTED-URL` | 있음 |
| `IDEMPOTENCY_KEY_REUSED` | 분석 작업 생성(`409`) | `STORE-JOB-ERROR`. 불변식 13에 따라 새 키로 다시 요청 | 있음 |
| `STORE_NOT_FOUND` | 작업 실패(`FAILED`) | `STORE-NOT-FOUND` — 가게 입력으로 돌아가 입력값을 보존 | 있음 |
| `INSUFFICIENT_VALID_REVIEWS` | 작업 실패 | `ANALYSIS-INSUFFICIENT` | 있음 |
| `REVIEW_COLLECTION_BLOCKED`, `ANALYSIS_OUTPUT_INVALID`, `INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE`, `ANALYSIS_SERVICE_REJECTED`, `ANALYSIS_CONFIGURATION_MISSING` | 작업 실패 | 작업의 `retryable` 값이 우선한다. `true`면 `ANALYSIS-RETRYABLE-ERROR`, `false`면 `ANALYSIS-FATAL-ERROR`. 같은 코드가 두 값으로 올 수 있다(예: `ANALYSIS_SERVICE_REJECTED`는 Python 4xx면 `false`) | 있음 |
| 표에 없는 작업 실패 코드 | 작업 실패 | 위와 같이 `retryable`로 상태를 고르고, 문구는 불변식 11에 따라 서버 `error.message`를 쓴다 | — |
| `IMAGE_GENERATION_FAILED` | 작업 실패 | `IMAGE-GENERATION-FAILED`. 현재 이미지 생성 실패는 `ANALYSIS_SERVICE_REJECTED`로 온다 | API.md에만 있음 |
| `ANALYSIS_TIMEOUT` | 작업 실패 | `ANALYSIS-RETRYABLE-ERROR`. 현재 시간 초과는 `INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE`로 온다 | API.md에만 있음 |
| `ANALYSIS_NOT_COMPLETED` | 결과 조회(`409`) | 결과 대신 작업 상태 조회로 돌아간다 | 있음 |
| `ANALYSIS_NOT_FOUND` | 작업 상태·결과 조회, 저장본 교체(`404`, 요청 사용자 범위) | 조회면 `RESULT-ERROR`, 저장본 교체면 `SAVE-REPLACE-ERROR` | 있음 |
| `SAVED_ANALYSIS_NOT_FOUND` | 저장 결과 조회(`404`) | 홈 진입 조회면 `HOME-NO-SAVED-RESULT`, 작업 완료 직후 조회면 `SAVE-FIRST-ERROR`(§7) | 있음 |
| `IMAGE_NOT_FOUND` | 이미지 조회 | `IMAGE-LOAD-ERROR` | 있음 |

결과 안의 빈 포디움 슬롯 사유 `INSUFFICIENT_TOPIC_EVIDENCE`는 오류가 아니라 결과 데이터다(§6.1). `SAVE-CONFLICT`를 일으키는 코드는 현재 없다. 저장본 교체가 충돌 없이 덮어쓰는 방식이기 때문이다. 상태는 이후 계약 변경에 대비해 남긴다.

---

## 3. 앱 시작과 인증 상태

### 3.1 앱 전역 진입 상태

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 전이 |
|---|---|---|---|---|
| `APP-BOOTING` | 앱 실행 직후 | 서비스 시작 상태. 홈이나 로그인 화면을 잠깐 잘못 보여주지 않는다 | 안전 저장소의 인증 정보 확인 | `AUTH-RESTORING` 또는 `AUTH-INITIAL` |
| `AUTH-RESTORING` | 저장된 인증 정보가 있음 | 로그인 상태 확인 중이라는 안내 | 세션 확인(`GET /api/v1/auth/session`)으로 세션과 `user.hasSavedAnalysis` 확인. 액세스 토큰이 만료돼 봉투 없는 401이 오면 불변식 12로 갱신한 뒤 한 번 더 확인 | `APP-READY`, `APP-FIRST-ANALYSIS-REQUIRED`, `AUTH-EXPIRED` |
| `APP-FIRST-ANALYSIS-REQUIRED` | 인증 성공, 저장 결과 없음 | 가게 정보 입력 흐름 | 홈·하단 내비게이션 접근 차단 | `STORE-INITIAL` |
| `APP-READY` | 인증 성공, 저장 결과 있음 | 저장된 분석 결과가 있는 홈 | 하단 내비게이션 활성화 | `HOME-LOADING` |
| `AUTH-EXPIRED` | 세션 만료·폐기·복원 실패 | 다시 로그인해야 하는 이유와 로그인 행동 | 로컬 인증 정보 제거 또는 무효 처리 | `AUTH-INITIAL` |
| `APP-OFFLINE` | 앱 시작 시 네트워크 없음 | 연결 상태와 다시 시도 행동 | 캐시 사용 여부는 미정 | 정책 확정 후 결정 |

### 3.2 `SC-AUTH` 로그인·가입

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 행동 |
|---|---|---|---|---|
| `AUTH-INITIAL` | 미인증 진입 | Google 로그인과 서비스 자체 로그인 진입점 | 요청 없음 | 로그인 방식 선택 |
| `AUTH-EDITING` | 서비스 자체 로그인 정보 입력 | 이메일·비밀번호 입력값, 필수 여부, 제출 가능 상태 | 클라이언트 형식 검증 | 계속 입력 또는 로그인 제출 |
| `AUTH-LEGAL-LOADING` | 가입 화면 진입 | 약관·개인정보 처리방침을 불러오는 중 | `GET /api/v1/legal-documents`로 현재 `termsVersion`·`privacyVersion` 조회 | `AUTH-SIGNUP-EDITING` 또는 `AUTH-LEGAL-ERROR` |
| `AUTH-LEGAL-ERROR` | 법률 문서 조회 실패 | 약관을 불러오지 못해 가입을 진행할 수 없다는 안내와 재시도 | 가입 요청을 보내지 않음 | 재조회 또는 로그인 방식 선택 |
| `AUTH-SIGNUP-EDITING` | 자체 계정 가입 정보 입력 | 이메일·비밀번호·전화번호, 전화번호는 인증·복구에 쓰지 않는다는 목적 고지, 조회한 버전의 이용약관·개인정보 처리방침 동의 | 클라이언트 형식 검증. 동의한 `termsVersion`·`privacyVersion`을 가입 요청에 포함 | 계속 입력 또는 가입 제출 |
| `AUTH-CONSENT-OUTDATED` | 가입 요청이 `400 CURRENT_LEGAL_CONSENT_REQUIRED`로 거부됨 | 약관이 바뀌어 다시 동의해야 한다는 안내. 입력한 이메일·전화번호는 보존 | 법률 문서를 다시 조회 | `AUTH-LEGAL-LOADING` |
| `AUTH-SIGNUP-UNAVAILABLE` | 운영 가입이 닫혀 있음 | 지금은 가입할 수 없다는 안내와 기존 계정 로그인 진입점 | 가입 요청을 보내지 않음. 판별 방법은 §11 미정 — 현재 백엔드는 `legallyReviewed`를 항상 `false`로 반환하고 가입을 막지 않으므로 이 값만으로 판별하지 않는다 | 로그인 방식 선택 |
| `AUTH-FIELD-ERROR` | 이메일 형식·필수값·비밀번호 정책(8자 이상, UTF-8 72바이트 이하)·전화번호 형식·약관 미동의, 또는 서버 `fieldErrors` | 해당 필드 가까이 원인과 수정 방법 | 서버 요청 전 차단 가능한 오류는 요청하지 않음 | 입력 수정 |
| `AUTH-SUBMITTING` | 서비스 자체 로그인 요청 | 로그인 처리 중 안내 | 중복 제출 차단 | 성공 또는 오류 |
| `AUTH-SIGNUP-SUBMITTING` | 자체 계정 가입 요청 | 가입 처리 중 안내 | 중복 제출 차단 | 생성 또는 오류 |
| `AUTH-SIGNUP-CREATED` | 자체 계정 생성 성공 | 계정이 만들어졌다는 안내 | 백엔드가 가입 응답(`201`)으로 세션을 발급하므로 토큰을 안전 저장소에 저장 | `AUTH-SUCCESS` |
| `AUTH-SIGNUP-ERROR` | 중복·정책·서버 오류로 가입 실패 | 민감정보를 노출하지 않는 원인과 수정·재시도 행동 | 입력값 중 비밀번호 보존 여부는 보안 정책을 따름 | 입력 수정 또는 재시도 |
| `AUTH-GOOGLE-PENDING` | Google 인증 시작 | 외부 인증 진행 중 안내 | Google 인증 결과 대기 | 성공·취소·외부 인증 실패 |
| `AUTH-GOOGLE-CANCELLED` | 사용자가 Google 인증을 취소 | 취소됐으며 다시 시도할 수 있다는 안내 | 실패로 기록하되 자격 증명 오류처럼 표현하지 않음 | 재시도 또는 다른 방식 선택 |
| `AUTH-INVALID-CREDENTIALS` | 이메일 또는 비밀번호 불일치 | 자격 증명을 확인하라는 안내 | 민감한 실패 원인을 세분화해 노출하지 않음 | 다시 입력 |
| `AUTH-GOOGLE-ERROR` | Google 인증·서버 검증 실패 | 실패 이유와 가능한 다음 행동 | 계정을 자동으로 연결하지 않음 | 재시도 또는 기존 방식 로그인 |
| `AUTH-ACCOUNT-LINK-REQUIRED` | 같은 이메일의 자체 계정이 있어 Google 로그인이 `409 ACCOUNT_LINK_REQUIRED`로 거부됨 | 이미 이메일로 가입한 계정이 있으니 그 방식으로 로그인하라는 안내 | 자동 연결하지 않음. 명시적 연결 기능은 MVP에 없음 | 서비스 자체 로그인으로 이동 |
| `AUTH-SUCCESS` | 서버 세션 생성 성공 | 다음 단계로 이동 중인 상태 | 토큰을 안전 저장소에 저장하고 저장 결과 여부 확인 | `APP-READY` 또는 `APP-FIRST-ANALYSIS-REQUIRED` |
| `AUTH-OFFLINE` | 로그인 요청 시 네트워크 없음 | 인터넷 연결 후 다시 시도 안내 | 자격 증명 요청을 큐에 보관하지 않음 | 재시도 |

---

## 4. 가게 지정 상태

현재 API 계약에는 분석 작업을 만들기 전에 가게를 식별하는 endpoint가 없다. 서버는 `POST /api/v1/analysis-jobs`에서 가게 이름·업종과 URL 허용 목록을 동기로 검증하고, 가게 접근·식별은 작업 실행 중에 수행한다. API 계약상 이 단계는 `RESOLVING_STORE`이지만 원격 백엔드 코드는 이 단계를 기록하지 않는다. 따라서 현재 구현 가능한 흐름은 `SC-001 입력 → 작업 생성 → SC-003 진행`이며, 작업 생성 전 가게 확인(`SC-002`)은 §4.3에 보류로 둔다.

### 4.1 `SC-001` 가게 정보 입력과 분석 요청

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 행동 |
|---|---|---|---|---|
| `STORE-INITIAL` | 첫 분석 또는 분석하기 진입 | 가게 이름·업종·네이버 가게 URL 필수 입력 | 새 요청 초깃값 준비 | 입력 시작 |
| `STORE-EDITING` | 하나 이상의 필드 변경 | 입력값과 제출 가능 여부 | 업종 허용값·URL 형식 등 로컬 검증 | 계속 입력 또는 분석 시작 |
| `STORE-FIELD-ERROR` | 누락·허용 업종 밖·URL 형식 오류(로컬 검증), 또는 작업 생성의 `INVALID_INPUT` | 필드별 원인과 수정 방법. 분석 API는 현재 필드별 정보를 주지 않으므로 `INVALID_INPUT`은 가게 이름과 업종을 함께 확인하라고 안내 | 오류 필드에 접근 가능한 연결 제공 | 입력 수정 |
| `STORE-CREATING-JOB` | 세 필드가 유효하고 분석 시작 선택 | 분석 요청을 보내는 중이라는 안내 | `Idempotency-Key`를 붙여 작업 생성(불변식 13) | `ANALYSIS-QUEUED` 또는 오류 |
| `STORE-UNSUPPORTED-URL` | 작업 생성이 `INVALID_NAVER_PLACE_URL`로 거부되거나, 작업이 같은 코드로 실패(리다이렉트 결과가 허용 밖 주소) | 지원하는 네이버 가게 주소 안내 | 작업 생성 거부면 서버가 수집을 시작하지 않는다. 작업 실패면 분석 진행 화면에서 입력 화면으로 돌아오며 입력값 유지 | URL 수정 후 새 키로 분석 요청 |
| `STORE-NOT-FOUND` | 작업이 `STORE_NOT_FOUND`로 실패 | 가게를 찾지 못했으니 이름과 URL을 확인하라는 안내 | 분석 진행 화면에서 입력 화면으로 돌아오며 입력값 유지. 원격 백엔드는 허용 주소의 DNS 조회 실패에만 이 코드를 쓰고, 존재하지 않는 가게는 `REVIEW_COLLECTION_BLOCKED`·`INSUFFICIENT_VALID_REVIEWS`로 올 수 있다(§11) | 수정 후 새 키로 다시 분석 요청 |
| `STORE-JOB-ERROR` | 작업 생성 실패(`IDEMPOTENCY_KEY_REUSED`, 서버 오류 등) | 원인·현재 입력 보존·재시도 가능 여부 | 중복 작업 생성 방지 | 재시도 또는 수정 |
| `STORE-OFFLINE` | 작업 생성 요청의 응답을 받지 못함 | 연결 후 다시 시도 안내 | 입력값 유지. 응답을 받지 못한 같은 제출이므로 같은 `Idempotency-Key`로 재전송(불변식 13) | 재시도 |

### 4.2 입력 오류의 위치

`STORE-FIELD-ERROR`와 `STORE-UNSUPPORTED-URL`은 해당 필드 가까이에 표시한다. `STORE-NOT-FOUND`는 작업 실패로 알게 되지만, 고칠 대상이 입력값이므로 입력 화면으로 돌아가 이름·URL 필드 가까이에 표시한다(기능명세 RESULT-015).

### 4.3 `SC-002` 가게 확인 — 보류

기능명세 SC-002와 INPUT-007(P1)은 URL에서 확인한 가게 정보를 입력값과 대조한 뒤 분석을 시작하는 단계를 둔다. 현재 API에는 이를 위한 endpoint가 없어 구현할 수 없다. 백엔드가 작업 생성 전 가게 식별 API를 제공하면 아래 상태를 `STORE-EDITING`과 `STORE-CREATING-JOB` 사이에 넣는다(§11).

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 행동 |
|---|---|---|---|---|
| `STORE-RESOLVING` | 가게 확인 요청 | 가게 정보를 확인 중이라는 안내 | 서버에서 URL 허용 목록·리다이렉트·가게 식별 검증 | 확인 또는 실패 |
| `STORE-CONFIRM-READY` | 가게 식별 성공 | 입력한 정보와 확인된 가게 정보 | 아직 분석 작업을 생성하지 않음 | 분석 시작 또는 입력 수정 |
| `STORE-MISMATCH` | 입력 이름·업종과 확인 정보가 크게 다름 | 불일치 항목과 확인 요청 | 자동으로 값을 덮어쓰지 않음 | 계속 진행 또는 수정 |

---

## 5. `SC-003` 분석 진행 상태

공개 작업 상태는 `QUEUED → RUNNING → COMPLETED | FAILED`이며, 화면은 근거 없는 퍼센트 대신 `progressStep`과 사용자용 문장을 표시한다.

아래 표는 API 계약의 `progressStep` 전체다. 서버가 모든 단계를 보내는 것은 보장되지 않는다. 2026-09-21 원격 백엔드 코드는 `QUEUED → COLLECTING_REVIEWS → COMPLETED | FAILED`만 기록한다. 앱은 받은 단계만 표시하고, 오지 않은 단계를 시간에 맞춰 흉내 내거나 순서대로 채워 넣지 않는다. 앱이 모르는 단계 값은 "분석 중"으로 표시한다.

| 상태 ID / `progressStep` | 사용자에게 보이는 처리 단계 | 완료 조건 | 실패 시 |
|---|---|---|---|
| `ANALYSIS-QUEUED` / `QUEUED` | 분석 준비 중 | 작업 실행 시작 | 지연·서비스 불가 안내 |
| `ANALYSIS-RESOLVING` / `RESOLVING_STORE` | 가게 확인 중 | 가게 식별 완료 | 가게 미발견·URL 오류 안내 |
| `ANALYSIS-COLLECTING` / `COLLECTING_REVIEWS` | 네이버 리뷰 수집 중 | 수집 완료 | 차단·페이지 변경·시간 초과 구분 |
| `ANALYSIS-PREPROCESSING` / `PREPROCESSING` | 리뷰를 정리 중 | 비식별화·중복·무효 리뷰 제외 완료 | 현재 작업을 완료로 표시하지 않음 |
| `ANALYSIS-ANALYZING` / `ANALYZING` | 반복되는 손님 경험 분석 중 | 상위 토픽과 4관점 생성 | 모델·응답 검증 오류 안내 |
| `ANALYSIS-KNOWLEDGE` / `RETRIEVING_KNOWLEDGE` | 관련 운영·마케팅 지식 확인 중 | 승인 지식 검색 완료 | 근거 없는 제안을 만들지 않음 |
| `ANALYSIS-ADVICE` / `GENERATING_ADVICE` | 검토할 행동 정리 중 | 근거가 연결된 제안 생성 | 재시도 가능 여부 표시 |
| `ANALYSIS-IMAGE` / `GENERATING_IMAGE` | 손님 유형 이미지 생성 중 | 실제 도출된 모든 유형 이미지 생성 | 일부 이미지 상태로 완료하지 않음 |
| `ANALYSIS-VALIDATING` / `VALIDATING_RESULT` | 결과와 근거 확인 중 | 스키마·근거·금지 표현 검증 통과 | 검증 실패 안내 |
| `ANALYSIS-COMPLETED` / `COMPLETED` | 분석 완료 | 결과 ID와 필수 산출물 확인 | 저장 상태로 이동 |

### 5.1 분석 예외 상태

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `ANALYSIS-INSUFFICIENT` | 유효 리뷰 50건 미만 | 분석에 필요한 50건 기준. 현재 유효 리뷰 수는 API가 주지 않으므로 표시하지 않고, 메시지 문자열을 파싱해 만들지 않는다(§11) | 다른 가게 입력 또는 종료 |
| `ANALYSIS-RETRYABLE-ERROR` | 작업 실패, `retryable=true` | 실패했지만 다시 시도할 수 있다는 안내와 현재 상태 | 새 `Idempotency-Key`로 다시 분석 요청(불변식 13) |
| `ANALYSIS-FATAL-ERROR` | 작업 실패, `retryable=false`이고 입력 수정 대상이 아닌 코드 | 서비스 쪽 문제로 지금은 분석을 완료할 수 없다는 안내. 입력을 고치라고 안내하지 않음 | 나중에 다시 시도 또는 입력 화면으로 돌아가기 |
| `ANALYSIS-UNAUTHORIZED` | 진행 중 세션 만료·폐기 | 로그인 만료 안내 | 로그인 후 작업 접근 정책은 미정 |
| `ANALYSIS-OFFLINE` | 상태 조회 중 네트워크 단절 | 마지막으로 확인한 단계와 연결 복구 안내 | 자동 polling·백오프 정책은 미정 |

입력을 고쳐야 하는 작업 실패(`STORE_NOT_FOUND`, 작업 실패로 온 `INVALID_NAVER_PLACE_URL`)는 `ANALYSIS-FATAL-ERROR`가 아니라 §4.1의 `STORE-NOT-FOUND`·`STORE-UNSUPPORTED-URL`로 돌아간다.

진행 화면은 받은 단계를 쌓는 목록이다([Step 5 합성](../../design/synthesis/TASK-020/README.md)). 원격 백엔드는 실패 시 `progressStep`을 `FAILED`로 덮어써 실패 단계를 알 수 없으므로, 위 예외 상태는 마지막 진행 행을 오류로 바꾸지 않고 목록 끝에 실패 결과 행을 붙여 원인(`error.code`·`retryable` 기준)과 다음 행동을 둔다. 마지막 진행 행에는 "여기까지 진행했어요"를 붙여 멈춘 행임을 알린다. 입력을 고쳐야 하는 실패는 목록에 남기지 않고 입력 화면으로 돌아간다.

### 5.2 `SC-009` 오류·한계 배치

`SC-009`는 독립 route를 뜻하지 않는다. 오류와 한계를 발생 단계 안에 배치하기 위한 논리 화면 ID다.

| 발생 영역 | 연결 상태 | 배치 원칙 |
|---|---|---|
| 인증 | `AUTH-FIELD-ERROR`, `AUTH-INVALID-CREDENTIALS`, `AUTH-GOOGLE-ERROR`, `AUTH-EXPIRED` | 인증 화면에서 이유와 다음 행동을 표시한다 |
| 가게 입력 | `STORE-FIELD-ERROR`, `STORE-UNSUPPORTED-URL`, `STORE-NOT-FOUND` | 관련 필드 가까이에 원인과 수정 방법을 표시한다 |
| 수집·분석 | `ANALYSIS-INSUFFICIENT`, `ANALYSIS-RETRYABLE-ERROR`, `ANALYSIS-FATAL-ERROR` | 분석 진행 화면에서 실패 단계·현재 상태·다음 행동을 표시한다 |
| 결과 | `RESULT-PARTIAL`, `RESULT-NO-PERSONA`, `RESULT-OLD-REVIEWS`, `RESULT-ERROR` | 결과 화면에서 근거 부족·오래된 리뷰·조회 실패를 해당 정보와 함께 표시한다 |
| 저장 | `SAVE-CONFLICT`, `SAVE-FIRST-ERROR`, `SAVE-REPLACE-ERROR` | 저장 결과 유무와 기존 저장본의 보존 여부를 구분하고 재시도 행동을 표시한다 |
| 계정 탈퇴 | `ACCOUNT-DELETE-VERIFY-ERROR`, `ACCOUNT-DELETE-ERROR` | 마이페이지 탈퇴 흐름 안에서 계정이 삭제되지 않았음을 먼저 알리고 재시도 행동을 표시한다 |

---

## 6. 결과·근거·제안 상태

### 6.1 `SC-011` 홈과 `SC-006` 손님 유형

결과의 저장 문맥과 결과 형태는 서로 독립적이다. `RESULT-SAVED-CONTEXT` 또는 `RESULT-UNSAVED-PREVIEW` 중 하나가 `RESULT-NORMAL`, `RESULT-PARTIAL`, `RESULT-NO-PERSONA` 중 하나와 결합된다.

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `RESULT-SAVED-CONTEXT` | 홈에서 계정의 저장 결과 조회 | 현재 저장된 결과라는 문맥 | 유형·근거·제안 탐색 또는 새 분석 |
| `RESULT-UNSAVED-PREVIEW` | 새 분석이 완료됐지만 저장본의 `analysisId`가 이 작업과 다름(§7 판정) | 새 결과이며 아직 기존 저장본을 교체하지 않았다는 안내 | 결과 탐색 후 새 결과로 교체 또는 기존 결과 유지 |

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `HOME-LOADING` | 저장 분석 조회 중 | 저장 결과를 불러오는 중이라는 안내 | 정상·없음·오류 |
| `HOME-NO-SAVED-RESULT` | 인증됐지만 저장 결과 없음 | 홈 대신 가게 입력 흐름 | 첫 분석 시작 |
| `RESULT-NORMAL` | 페르소나 3개 | TOP3 시상대 → 최초 1위 콘텐츠 → 분석 정보 | 유형 선택·근거·제안 탐색 |
| `RESULT-PARTIAL` | 페르소나 1~2개 | 3칸 유지, 실제 유형만 채우고 빈 슬롯에 근거 부족 이유 | 존재하는 유형 선택 |
| `RESULT-NO-PERSONA` | 유효 리뷰 50건 이상이나 근거를 충족한 토픽 0개 | 세 빈 슬롯과 근거 부족 안내, 선택 콘텐츠 없음 | 새 분석 또는 한계 확인 |
| `RESULT-LIMITS` | 모든 정상·유형 부족 결과 | 리뷰 작성자가 전체 고객을 대표하지 않을 수 있다는 자기선택·대표성 한계 | 한계를 확인한 상태로 결과 탐색 |
| `RESULT-OLD-REVIEWS` | 2년 초과 리뷰 포함 | 현재 매장과 다를 수 있다는 우려 메시지 | 결과를 한계와 함께 탐색 |
| `RESULT-ERROR` | 저장 결과 조회 실패·결과 불완전 | 원인·현재 저장본 상태·재시도 | 재조회 |
| `RESULT-UNAUTHORIZED` | 다른 사용자 결과·세션 만료 | 접근 불가 또는 로그인 만료 안내 | 로그인 |

결과 형태와 경고는 결과 응답(API.md §6)에서 다음처럼 판정한다.

| 상태 | 판정 근거 |
|---|---|
| `RESULT-NORMAL` / `RESULT-PARTIAL` / `RESULT-NO-PERSONA` | `podium` 세 슬롯 중 `status=FILLED` 개수가 3 / 1~2 / 0 |
| 빈 슬롯의 사유 | `status=EMPTY` 슬롯의 `reason.message`. 빈 슬롯에는 `persona` 키가 없을 수 있다 |
| 최초 선택 | `FILLED` 슬롯 중 가장 낮은 `rank` |
| `RESULT-OLD-REVIEWS` | `metadata.containsReviewsOlderThanTwoYears=true`. 원격 백엔드의 `limitations[].code`는 항상 `ANALYSIS_LIMITATION`이라 코드로 판정하지 않는다 |
| `RESULT-LIMITS` | 항상 표시. 서버 `limitations[].message`가 있으면 함께 표시 |
| 분석 기준 정보 | `store.name`, `metadata`의 `platform`, `collectedReviewCount`(수집 건수), `validReviewCount`(분석 사용 건수), `collectedAt`, `analyzedAt` |

`RESULT-NO-PERSONA`는 계약상 상태지만 원격 백엔드에서는 현재 나올 수 없다. Python 분석 결과가 페르소나를 최소 1개 요구해, 근거를 충족한 토픽이 0개면 결과 대신 재시도 가능한 작업 실패(`ANALYSIS_SERVICE_REJECTED`)가 된다(§11). 앱은 이 상태를 구현하되 검증은 fixture로 한다.

`RESULT-LIMITS`와 `RESULT-OLD-REVIEWS`는 별도의 결과 유형이 아니라 `NORMAL`, `PARTIAL`, `NO-PERSONA`와 함께 표시되는 한계·경고 상태다. `RESULT-UNSAVED-PREVIEW`를 닫거나 앱을 종료했을 때 다시 접근할 수 있는 범위는 보관 정책 확정 전까지 보장하지 않는다.

### 6.2 `SC-004` 페르소나별 4관점

| 상태 ID | 조건 | 사용자에게 보이는 것 | 시스템 규칙 |
|---|---|---|---|
| `INSIGHT-SELECTED` | 도출된 유형 선택 | 유형명·이미지·긍정·부정·인식·우선순위 | 진입 시 1위 최초 선택 |
| `INSIGHT-SWITCHING` | 다른 순위 선택 | 선택 변화가 진행 중임을 알 수 있는 상태 | 포디움은 유지하고 아래 콘텐츠만 교체 |
| `INSIGHT-LIMITED` | 특정 관점에 근거 항목이 적음 | 존재하는 근거 항목과 한계 | 근거 없는 항목을 채워 넣지 않음 |
| `INSIGHT-ERROR` | 선택 콘텐츠 조회 실패 | 포디움은 유지하고 해당 콘텐츠 재시도 | 다른 저장 결과로 바꾸지 않음 |

### 6.3 `SC-005` 근거 상세

대표 근거는 결과 응답의 `evidencePreview`(최대 2개)와 `evidenceCount`로 표시한다. 전체 근거 조회 `GET /api/v1/analyses/{analysisId}/evidence`는 API 계약에만 있고 2026-09-21 원격 백엔드에는 구현되지 않았다. endpoint가 생기기 전에는 아래 상태를 실제 데이터로 구현할 수 없다(§11).

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `EVIDENCE-LOADING` | 전체 근거 첫 조회 | 근거를 불러오는 중 | 정상·오류 |
| `EVIDENCE-NORMAL` | 근거 존재 | 작성자 식별정보 없는 리뷰 본문과 필요한 메타정보 | 다음 cursor 조회 |
| `EVIDENCE-LOADING-MORE` | 추가 페이지 조회 | 기존 목록 유지 + 추가 로딩 상태 | 성공·오류 |
| `EVIDENCE-END` | 다음 cursor 없음 | 전체 근거를 확인했다는 끝 상태 | 결과로 돌아가기 |
| `EVIDENCE-EMPTY` | 연결 근거 없음 | 결과 무결성 문제 안내 | 결과 제공 중단·재조회. 정상 완료 결과로 취급하지 않음 |
| `EVIDENCE-ERROR` | 조회 실패 | 기존에 받은 근거 보존 + 재시도 | 재시도 |

### 6.4 `SC-007` 페르소나 이미지

결과의 `image.url`은 `/api/v1/persona-images/{imageId}` 형태의 상대 경로이며, 요청 사용자의 소유권을 확인하므로 `Authorization` 헤더가 필요하다. 앱은 API 기본 주소와 결합하고 인증 헤더를 붙여 요청한다. 401이면 불변식 12에 따라 토큰을 갱신한 뒤 한 번 다시 요청하고, 그래도 실패할 때만 `IMAGE-LOAD-ERROR`로 간다. 이미지 컴포넌트의 오류 콜백으로는 HTTP 상태를 알기 어려우므로, 세션 응답의 `accessTokenExpiresAt`을 보고 만료 전에 미리 갱신하거나 이미지를 앱의 요청 계층으로 받아 표시한다. 마이페이지의 `STORED-IMAGES-*`도 같은 규칙을 따른다.

| 상태 ID | 조건 | 사용자에게 보이는 것 | 시스템 규칙 |
|---|---|---|---|
| `IMAGE-READY` | 이미지 생성·검증 완료 | AI 생성 이미지 고지와 대체 텍스트 | 실제 고객 사진처럼 표현하지 않음 |
| `IMAGE-LOADING` | 이미지 파일 조회 중 | 레이아웃을 보존하는 로딩 상태 | 무한 스피너 금지 |
| `IMAGE-LOAD-ERROR` | 파일 조회 실패 | 유형 정보는 유지하고 이미지 재조회 행동 | 생성 실패와 단순 조회 실패를 구분 |
| `IMAGE-GENERATION-FAILED` | 분석 작업 중 이미지 생성 실패 | 분석 완료로 이동하지 않고 실패·재시도 안내 | placeholder로 완료 처리하지 않음 |

### 6.5 `SC-008` 실행 제안

| 상태 ID | 조건 | 사용자에게 보이는 것 | 시스템 규칙 |
|---|---|---|---|
| `ADVICE-COLLAPSED` | 기본 상태 | 리뷰 사실 + 검토할 행동 | AI 해석·전문 지식은 숨김 |
| `ADVICE-EXPANDED` | 사용자가 상세 펼침 | AI 해석과 전문 지식 출처 | 사실과 다른 영역으로 구분 |
| `ADVICE-NO-KNOWLEDGE` | 펼친 제안의 `knowledgeReferences`가 비어 있음 | AI 해석만 표시하고, 참고한 전문 지식이 없다는 사실을 표시 | 출처·자료명을 지어내지 않음. 참고 지식 영역을 빈 칸으로 두지 않음 |
| `ADVICE-EMPTY` | 근거를 충족한 제안 없음 | 억지 제안을 만들지 않았다는 한계 | 임의 fallback 제안 금지 |
| `ADVICE-ERROR` | 상세 지식 조회 실패 | 기본 리뷰 사실·행동은 보존 | 상세만 재시도 |

---

## 7. `SC-010` 저장 결과 상태

첫 결과 자동 저장은 앱이 따로 요청하지 않는다. 서버가 작업을 `COMPLETED`로 바꾸는 같은 트랜잭션에서 저장본이 없는 계정에 첫 결과를 저장한다([API.md](../../architecture/API.md) §3.2). 그래서 앱이 보는 첫 저장은 "작업 완료"와 같은 사건이며, 저장 실패는 작업이 `COMPLETED`가 되지 않는 것으로 나타난다. 아래 `SAVE-FIRST-*`는 이 사건을 화면 문구로 옮긴 것이지 별도 요청 상태가 아니다.

작업이 `COMPLETED`가 되면 앱은 로그인 시점의 `hasSavedAnalysis` 값에 기대지 않고 다음 순서로 판정한다. 같은 계정의 다른 작업이 먼저 끝나 첫 저장본이 된 경우에도 올바르게 갈라진다.

1. `GET /api/v1/me/saved-analysis`로 현재 저장본을 조회한다.
2. 저장본의 `analysisId`가 이 작업 상태의 `analysisId`와 같으면 이 결과가 저장된 것이다 → `SAVE-FIRST-SUCCESS` → 홈의 `RESULT-SAVED-CONTEXT`.
3. 다르면 이 결과는 저장되지 않은 것이다 → `GET /api/v1/analysis-jobs/{jobId}/result`로 결과를 받아 `RESULT-UNSAVED-PREVIEW` → `SAVE-CHOICE-REQUIRED`.
4. 저장본이 없으면(`SAVED_ANALYSIS_NOT_FOUND`) → `SAVE-FIRST-ERROR`.
5. 조회 자체가 실패하면(네트워크·5xx) 불변식 11의 일반 오류와 재조회 행동을 보여준다. 결과가 저장됐는지 단정하지 않는다.

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 전이 |
|---|---|---|---|---|
| `SAVE-FIRST-PENDING` | 저장본이 없는 계정의 작업이 아직 `RUNNING` | 분석 진행 화면의 마지막 단계 문구. 별도 저장 화면을 만들지 않음 | 작업 상태 조회 계속 | `SAVE-FIRST-SUCCESS` 또는 분석 실패 상태 |
| `SAVE-FIRST-SUCCESS` | 작업이 `COMPLETED`이고 저장본의 `analysisId`가 이 작업의 `analysisId`와 같음 | 결과가 저장돼 홈에서 볼 수 있다는 별도 완료 화면 | 사용자가 `결과 보기`를 누르면 홈으로 이동 | `HOME-LOADING` |
| `SAVE-CHOICE-REQUIRED` | 저장본의 `analysisId`가 이 작업과 다름. `RESULT-UNSAVED-PREVIEW`와 같은 화면에 함께 표시 | 미리보기 하단에 고정된 새 결과로 교체 / 기존 결과 유지와 "유지하면 새 결과는 저장되지 않고 화면을 닫은 뒤 다시 볼 수 없을 수 있다"는 안내. 교체는 현재 저장본(가게 이름·분석일)을 밝힌 확인을 거친다 | 선택 전 기존 저장본 유지. 뒤로가기·닫기는 조용히 버리지 않고 두 선택과 계속 보기를 묻는다. 여기서 교체를 고르면 교체 확인을 한 번 더 거친다 | 사용자 선택 |
| `SAVE-REPLACING` | 새 결과로 교체 선택 | 교체 중 안내, 중복 선택 차단 | 소유권·완료 상태 확인 후 트랜잭션 update | 홈의 새 결과 |
| `SAVE-KEEPING` | 기존 결과 유지 선택 | 기존 결과로 돌아가는 중 안내 | 기존 저장본 변경 없음 | 홈의 기존 결과 |
| `SAVE-CONFLICT` | 동시 변경·저장 충돌 | 저장 상태가 바뀌었다는 안내 | 최신 저장본 재조회 | 다시 선택 또는 홈 |
| `SAVE-FIRST-ERROR` | 작업이 `COMPLETED`됐는데 저장 결과 조회가 `SAVED_ANALYSIS_NOT_FOUND` | 아직 홈에 저장된 결과가 없다는 안내와 재조회 | 첫 분석 결과를 완료로 가장하지 않음. 서버 계약상 발생하면 안 되는 불일치이므로 결과 무결성 오류로 다룬다 | 저장 결과 재조회 |
| `SAVE-REPLACE-ERROR` | 기존 저장본 교체 실패 | 기존 저장본이 그대로 유지됐다는 안내 | 기존 저장본을 손상시키지 않음 | 교체 재시도 또는 기존 결과 유지 |

저장 선택을 미리보기 첫 화면부터 보여주고 교체만 확인을 거치는 결정과 그 근거는 [Step 5 합성](../../design/synthesis/TASK-020/README.md)의 Save choice timing에 있다. 기존 결과 유지 후 미저장 새 결과를 얼마나 다시 볼 수 있는지는 미정이다. 이 정책이 확정되기 전에는 프론트가 임의의 영구 보관·히스토리 화면을 만들지 않는다.

---

## 8. `SC-012` 마이페이지 상태

| 영역 | 상태 ID | 사용자에게 보이는 것 | 다음 행동·규칙 |
|---|---|---|---|
| 화면 | `MYPAGE-LOADING` | 알림·설정·현재 이미지 로딩 상태 | 영역별 실패를 전체 화면 실패로 합칠지는 구현 전 결정 |
| 화면 | `MYPAGE-NORMAL` | 확정된 최소 기능만 표시 | 홍보·푸시·별도 아카이브 추가 금지 |
| 화면 | `MYPAGE-PARTIAL-ERROR` | 정상 조회된 영역은 유지하고 실패한 영역만 오류 안내 | 실패 영역만 재시도 |
| 알림 | `NOTIFICATION-NORMAL` | 분석 완료·실패 인앱 알림 | 읽음 처리 기능은 아직 미정 |
| 알림 | `NOTIFICATION-EMPTY` | 아직 분석 알림이 없다는 안내 | 분석하기로 이동 가능 |
| 알림 | `NOTIFICATION-ERROR` | 기존 화면을 유지한 조회 실패와 재시도 | 다른 설정을 숨기지 않음 |
| 설정 | `SETTING-NORMAL-ON` | 분석 알림 켜짐 | 이후 완료·실패 작업의 새 인앱 알림 생성 |
| 설정 | `SETTING-NORMAL-OFF` | 분석 알림 꺼짐 | 이후 새 알림은 생성하지 않고 기존 알림 이력은 유지 |
| 설정 | `SETTING-UPDATING` | 분석 알림 설정 변경 중 | 중복 토글 방지 |
| 설정 | `SETTING-ERROR` | 기존 설정값과 저장 실패 안내 | 서버 값 재조회·재시도 |
| 서비스 | `SERVICE-INFO-NORMAL` | 확정된 서비스 정보 | MVP 밖 설정·프로필 기능으로 확장하지 않음 |
| 이미지 | `STORED-IMAGES-NORMAL` | 현재 저장 결과 이미지 최대 3개 | 읽기 전용 |
| 이미지 | `STORED-IMAGES-EMPTY` | 현재 결과에 표시할 이미지가 없다는 안내 | 별도 업로드·삭제 기능 없음 |
| 로그아웃 | `LOGOUT-CONFIRM` | 로그아웃 확인 | 취소 또는 로그아웃 |
| 로그아웃 | `LOGOUT-SUBMITTING` | 로그아웃 처리 중 | 중복 실행 방지 |
| 로그아웃 | `LOGOUT-SUCCESS` | 로그인 화면으로 이동 | 기기 인증 정보를 제거하고 `AUTH-INITIAL`로 전이 |
| 로그아웃 | `LOGOUT-ERROR` | 로컬·서버 세션 상태를 구분한 안전한 안내 | 민감정보 없이 재시도 또는 로그인 이동 |
| 탈퇴 | `ACCOUNT-DELETE-CONFIRM` | 삭제 대상(계정과 로그인 정보·세션·약관 동의 이력, 분석 작업·리뷰·분석 결과·근거·저장 결과, 알림과 설정, 페르소나 이미지)과 복구 불가 안내. 자체 계정은 현재 비밀번호 입력 | 취소 또는 탈퇴 제출 |
| 탈퇴 | `ACCOUNT-DELETE-SUBMITTING` | 탈퇴 처리 중 | 중복 제출 차단, 하단 내비게이션 이동 차단 |
| 탈퇴 | `ACCOUNT-DELETE-VERIFY-ERROR` | `401 PASSWORD_CONFIRMATION_FAILED` — 비밀번호가 맞지 않아 계정은 그대로라는 안내 | 비밀번호 재입력. 토큰 갱신·로그아웃을 일으키지 않음(불변식 9). 세션 만료는 `AUTH-EXPIRED`로 처리 |
| 탈퇴 | `ACCOUNT-DELETE-ERROR` | 서버·파일 삭제 실패로 계정이 삭제되지 않았다는 안내 | 재시도. 부분 삭제를 완료처럼 보이지 않음 |
| 탈퇴 | `ACCOUNT-DELETE-SUCCESS` | 탈퇴 완료 안내 후 로그인 화면 | 기기 인증 정보를 제거하고 `AUTH-INITIAL`로 전이 |

---

## 9. 하단 내비게이션 상태

| 상태 ID | 조건 | 표시·동작 |
|---|---|---|
| `NAV-HIDDEN` | 저장 결과 없음·첫 분석 전, 첫 저장 완료 화면(`SAVE-FIRST-SUCCESS`), 새 결과 미리보기(`RESULT-UNSAVED-PREVIEW`) | 하단 내비게이션을 표시하지 않는다. 미리보기에서는 선택 없이 다른 탭으로 떠나 새 결과를 잃지 않게 한다 |
| `NAV-HOME-ACTIVE` | 홈 | 홈 선택 상태. 가운데 분석하기는 주요 행동으로 유지 |
| `NAV-ANALYSIS-ACTIVE` | 새 분석 흐름(저장본이 있는 사용자의 입력·진행). 새 결과 미리보기는 `NAV-HIDDEN` | 분석하기 선택 상태. 가운데 원은 현재 위치 표시(네이비)로 바뀌고 눌러도 이동하지 않는다. 진행 중 이탈 정책은 미정 |
| `NAV-MYPAGE-ACTIVE` | 마이페이지 | 마이페이지 선택 상태 |
| `NAV-DISABLED-TRANSITION` | 저장 교체 등 중복 이동이 위험한 짧은 전이 | 필요한 항목만 일시 비활성화하고 이유를 접근 가능하게 알림 |

---

## 10. 첫 Vertical Slice 필수 상태

첫 프론트 구현은 아래 상태를 한 흐름으로 연결해 구조를 검증한다.

```text
APP-BOOTING
→ AUTH-INITIAL / AUTH-SUBMITTING / AUTH-FIELD-ERROR / AUTH-SUCCESS
→ STORE-INITIAL / STORE-EDITING / STORE-FIELD-ERROR / STORE-CREATING-JOB
→ ANALYSIS-QUEUED / ANALYSIS-COLLECTING / (서버가 보내는 나머지 progressStep)
→ SAVE-FIRST-SUCCESS (작업 COMPLETED)
→ HOME-LOADING / RESULT-NORMAL / RESULT-PARTIAL / RESULT-NO-PERSONA
```

같은 Slice에서 `STORE-UNSUPPORTED-URL`, `STORE-NOT-FOUND`, `ANALYSIS-INSUFFICIENT`, `ANALYSIS-RETRYABLE-ERROR`, `ANALYSIS-FATAL-ERROR`, `IMAGE-GENERATION-FAILED` fixture도 각각 재현해 실패 경계를 검증한다. 봉투 없는 401 뒤의 토큰 갱신·재전송(불변식 12)과 실패 후 새 `Idempotency-Key` 재요청(불변식 13)도 Slice에서 확인한다. `RESULT-NO-PERSONA`는 현재 백엔드에서 나올 수 없으므로 fixture로만 검증한다(§6.1). `SC-002` 가게 확인(§4.3)은 API가 생기기 전까지 Slice에 넣지 않는다. 저장본이 있는 사용자의 `RESULT-UNSAVED-PREVIEW → SAVE-CHOICE-REQUIRED → SAVE-REPLACING | SAVE-KEEPING` 흐름은 다음 Slice에서 연결한다.

Vertical Slice에서 실제 백엔드 endpoint가 아직 없는 단계는 고정된 비식별 fixture를 사용한다. fixture 상태와 실제 API 상태의 타입을 다르게 만들지 않으며, 화면 안에 데모 데이터를 운영 데이터처럼 표시하지 않는다.

---

## 11. 구현 전 남은 결정

> 2026-09-22 Step 7에서 확인한 계약 차이: [API.md](../../architecture/API.md) §4.2의 세션 응답(`accessToken`·`expiresAt`·`hasSavedAnalysis`)과 실제 `AuthController.SessionResponse`(`accessToken`·`accessTokenExpiresAt`·`refreshToken`·`refreshTokenExpiresAt`·`user.hasSavedAnalysis`)가 다르다. 앱은 실제 응답을 따랐다. API.md는 `role:platform` 소유이므로 어느 쪽으로 맞출지 그 역할이 정한다.

| 항목 | 막고 있는 상태·동작 | 결정 시점 |
|---|---|---|
| 네트워크 오프라인·캐시·자동 재시도 정책 | 모든 `*-OFFLINE`, 앱 재실행 | 네트워크 계층 구현 전 |
| 분석 polling 주기·백오프·백그라운드 복귀 | `SC-003` | 분석 API 연동 전 |
| 진행 중 화면 이탈·앱 종료 후 복원 | `SC-003`, 하단 내비게이션 | 분석 화면 구현 전 |
| 세션 만료 중 분석 작업 접근 | `ANALYSIS-UNAUTHORIZED` | 인증·분석 API 연결 전 |
| 운영 가입 차단을 앱이 판별하는 방법(빌드 설정 또는 서버 필드) | `AUTH-SIGNUP-UNAVAILABLE` | 운영 출시 전 |
| Refresh 회전 유예(30초)를 백엔드 정본(ADR·API.md)에 올릴지, TASK-011과 TASK-012 코드 중 어느 동작을 남길지 (`role:feature`·`role:platform`) | 불변식 10 | 두 원격 브랜치 병합 전 |
| 가게 입력과 확인의 route 분리 | `SC-001`, `SC-002` | 화면 구조 구현 전 |
| 저장 선택 UI 세부 문구(형식은 [Step 5 합성](../../design/synthesis/TASK-020/README.md)에서 결정) | `SC-010` | Step 6 정본화 |
| 실패한 분석 단계를 서버가 알려줄지(현재 `progressStep`이 `FAILED`로 덮여 알 수 없음, `role:feature`) | `SC-003` 실패 결과 행 | 분석 API 연동 전 |
| 미저장 새 결과의 접근·보관 시간 | `SAVE-KEEPING` 이후 | 작업 큐·삭제 배치 구현 전 |
| 알림 읽음 처리 | `SC-012` | 마이페이지 API 구현 전 |
| 최소 Android OS·지원 기기·접근성 목표 | 전체 Visual QA | 첫 UI 구현 전 |
| 오류 화면에 `traceId`를 문의용 코드로 보여줄지 | 모든 `*-ERROR` | 오류 화면 구현 전 |
| 웹 계정 삭제 요청 링크 제공 방식 (PRD §13-24) | `ACCOUNT-DELETE-*` 밖의 스토어 요구 | Play Console 데이터 보안 양식 작성 전 |
| 작업 생성 전 가게 식별 API 제공 여부 (`role:feature`·`role:product`) | `SC-002`, INPUT-007 (§4.3) | 가게 확인 화면 구현 전 |
| 전체 근거 조회 endpoint 구현 (`role:feature`) | `SC-005` `EVIDENCE-*`, `근거 리뷰 전체 보기` | 근거 상세 화면 구현 전 |
| `IMAGE_GENERATION_FAILED`·`ANALYSIS_TIMEOUT` 코드와 세부 `progressStep` 기록 (`role:feature`) | `IMAGE-GENERATION-FAILED`, §5 단계 표시 | 분석 진행 화면 구현 전 |
| RAG 지식 참고 구현 (`role:feature`) — 현재 `knowledgeReferences`가 비어서 온다 | `ADVICE-EXPANDED`의 전문 지식, PRD FR-005 | 제안 상세 화면 구현 전 |
| 분석 API 오류 봉투를 API.md §2.1(`fieldErrors`·`traceId`)에 맞출지 (`role:feature`·`role:platform`) — 현재 `retryable`·`fields`(빈 값)·`timestamp` | `STORE-FIELD-ERROR`의 필드별 안내, 불변식 9 | 가게 입력 화면 구현 전 |
| 인증 실패 401의 응답 형식 명시 (`role:feature`) — 현재 서버 기본 동작이며 실제 응답은 미확인 | 불변식 12 | 인증 API 연동 전 |
| 유효 리뷰 부족 실패에 현재 유효 리뷰 수 필드 제공 (`role:feature`) — PRD §10 공통·AC-04가 요구 | `ANALYSIS-INSUFFICIENT` | 분석 진행 화면 구현 전 |
| 유효 토픽 0개 결과 처리 (`role:feature`) — 현재 Python이 페르소나 최소 1개를 요구해 재시도 가능 실패가 된다 | `RESULT-NO-PERSONA`, PRD FR-003 | 결과 화면 구현 전 |
| `STORE_NOT_FOUND` 판정 범위 (`role:feature`) — 현재 DNS 조회 실패에만 쓰고, 없는 가게는 다른 코드로 온다 | `STORE-NOT-FOUND` | 가게 입력 화면 구현 전 |
| 같은 `Idempotency-Key`로 `FAILED` 작업을 다시 요청하면 서버가 분석을 다시 실행하지만 작업 상태는 `FAILED`로 남는 동작, 그리고 작업 행 저장 뒤 실행 요청이 실패해 500을 받은 경우 새 키 재시도가 중복 작업을 만드는 동작 (`role:feature`) | 불변식 13, `STORE-JOB-ERROR` | 분석 API 연동 전 |

미정 항목은 상태를 삭제하는 근거가 아니다. 프론트 코드는 확정된 상태 경계를 수용할 수 있게 만들되, 미정 정책을 숫자·시간·route 구조로 임의 고정하지 않는다.

---

## 12. 검증 기준

1. 기능명세의 `SC-AUTH`, `SC-001`~`SC-012`가 모두 하나 이상의 상태와 연결되는가.
2. `loading`, `empty`, `error`, 정상 상태가 결과·목록 화면에서 빠지지 않았는가.
3. 오류 상태마다 원인·현재 상태·다음 행동이 있는가.
4. 첫 분석 전 홈·하단 내비게이션 진입 제한이 모든 전이에서 유지되는가.
5. 기존 저장본이 새 분석·저장 실패로 손상되지 않는가.
6. 사실·AI 해석·전문 지식·제안이 상태 변화 중에도 같은 정보 계층을 유지하는가.
7. 구현 후 `.claude/skills/visual-qa/SKILL.md`로 실제 Android 렌더링을 확인했는가.

---

## 13. 검증 기록

검증일: 2026-09-18

| 항목 | 결과 | 근거 |
|---|---|---|
| 논리 화면 추적 | PASS | 기능명세의 `SC-AUTH`, `SC-001`~`SC-012` 13개가 모두 본 문서의 상태와 연결됨 |
| 요구사항 문서 연결 | PASS | PRD·기능명세·User Flow·Result IA와 상호 링크 확인 |
| 저장본 보호 규칙 | PASS | 새 분석 실패와 저장 선택 전에는 기존 저장본을 유지하도록 명시 |
| 미정 정책 분리 | PASS | 오프라인·polling·route·보관·알림 정책을 11장에 별도 기록 |
| 저장소 Markdown 상대 링크 | PASS | Markdown 55개, 로컬 링크 150개 검사 결과 깨진 링크 0개 |
| 공백·충돌 표식 | PASS | `git diff --check` 이상 없음 |
| 앱 렌더링·Visual QA | 미실행 | 프론트엔드 코드가 아직 없으므로 Design Foundation과 Vertical Slice 이후 수행 |
| 독립 Reviewer | 미실행 | 제품·디자인 담당자 배정과 검토 필요 |

### 8차 Step 9 전체 구현 확인

확인일: 2026-09-23. Step 7 Slice 밖에 있던 화면을 구현하고 Android 에뮬레이터(`Medium_Phone`, Expo Go)에서 실행했다.
백엔드는 여전히 병합·배포 전이라 **고정 fixture 서버**로 확인했다.

| 상태 | 결과 | 근거 캡처 |
|---|---|---|
| `AUTH-LEGAL-LOADING` → `AUTH-SIGNUP-EDITING` | 확인 | `step9-01-signup.png` — 조회한 약관 버전을 화면에 표시 |
| `AUTH-FIELD-ERROR`(가입) | 확인 | 빈 값 제출 시 필드별 오류와 동의 누락 안내 |
| `AUTH-SIGNUP-SUBMITTING` → `AUTH-SIGNUP-CREATED` → `APP-FIRST-ANALYSIS-REQUIRED` | 확인 | `step9-02-signup-to-analyze.png` |
| `MYPAGE-NORMAL`·`NOTIFICATION-NORMAL`·`SETTING-NORMAL-ON` | 확인 | `step9-03-mypage.png` |
| `SETTING-UPDATING` → `SETTING-NORMAL-OFF` | 확인 | 토글이 꺼짐으로 바뀌고 글자도 함께 바뀜 |
| `STORED-IMAGES-NORMAL`·서비스 정보·로그아웃 진입점·탈퇴 안내 | 확인 | 마이페이지 아래쪽 |
| `EVIDENCE-LOADING` → `EVIDENCE-NORMAL` → `EVIDENCE-LOADING-MORE` → `EVIDENCE-END` | 확인 | `step9-04-evidence-list.png`, `step9-05-evidence-end.png` — cursor로 47건을 모두 이어 받음 |
| `RESULT-UNSAVED-PREVIEW` + `SAVE-CHOICE-REQUIRED` + `NAV-HIDDEN` | 확인 | `step9-06-preview-save-choice.png` |
| 교체 확인 대화상자 | 확인 | `step9-07-replace-confirm.png` — 현재 저장본 이름·분석일을 밝히고 최종 버튼만 `destructive` |
| `SAVE-REPLACING` → 홈의 새 결과 | 확인 | `step9-08-home-after-replace.png` |
| `LOGOUT-CONFIRM` → `LOGOUT-SUCCESS` | 확인 | `step9-09-logout-confirm.png` 이후 로그인 화면 |

확인하지 못한 것:

- `AUTH-SIGNUP-ERROR`(중복 이메일): 코드와 fixture 경로는 있으나 화면 캡처는 남기지 않았다.
- `AUTH-CONSENT-OUTDATED`: 화면 코드와 fixture 응답 경로는 있으나 **UI 조작으로는 재현할 수 없다.** 앱이 직전에 조회한 약관 버전을 그대로 제출하므로, 조회와 제출 사이에 서버가 버전을 올린 경우에만 나온다.
- `AUTH-SIGNUP-UNAVAILABLE`: **구현하지 않았다.** 운영 가입 차단을 앱이 판별하는 방법이 §11 미정이다.
- `EVIDENCE-EMPTY`·`EVIDENCE-ERROR`·`MYPAGE-PARTIAL-ERROR`·`SETTING-ERROR`·`SAVE-REPLACE-ERROR`·`LOGOUT-ERROR`: 실패를 재현하지 않았다.
- `SAVE-KEEPING`(기존 결과 유지)과 뒤로가기 3택 대화상자: 코드에 있으나 이번 실행에서는 교체 경로만 확인했다.
- Google 로그인(`AUTH-GOOGLE-*`)과 계정 탈퇴(`ACCOUNT-DELETE-*`): 구현하지 않았다. 앱 식별자·OAuth 설정과 탈퇴 API가 정해지기 전에는 만들지 않는다(§11).
- 실제 백엔드 연결·TalkBack·실기기: 미실행.

### 7차 Step 7 첫 Vertical Slice 구현 확인

확인일: 2026-09-22. §10의 흐름을 `frontend/mobile`에 구현하고 Android 에뮬레이터(`Medium_Phone`, Android 17/API 37, Expo Go)에서 실행해 확인했다.
백엔드가 아직 병합·배포되지 않아 **고정 fixture 서버**로 확인했다(§10 마지막 문단 허용 범위). fixture와 실제 API는 같은 타입을 쓰고 endpoint·요청·응답 모양은 원격 백엔드 코드를 그대로 따랐다.

| 상태 | 결과 | 근거 캡처 |
|---|---|---|
| `APP-BOOTING` → `AUTH-RESTORING` → `AUTH-EXPIRED` | 확인 | `step7-08-auth-expired.png` — 앱을 껐다 켜면 저장소의 토큰으로 세션을 확인하고, 봉투 없는 401 → 토큰 갱신 실패 → 로그인 화면 |
| `AUTH-FIELD-ERROR` | 확인 | `step7-09-auth-field-error.png` |
| `AUTH-SUBMITTING` → `AUTH-SUCCESS` → `APP-FIRST-ANALYSIS-REQUIRED` | 확인 | `step7-01-login.png`, `step7-02-store-input.png` |
| `STORE-INITIAL`·`STORE-EDITING` | 확인 | `step7-02`, `step7-03-store-category.png` |
| `STORE-FIELD-ERROR`(URL 형식) | 확인 | `step7-04-store-url-error.png` |
| `STORE-CREATING-JOB` | 확인 | 버튼 loading 표현(DESIGN_SYSTEM §5.4). 별도 캡처 없음 — fixture 응답이 빨라 화면에 남지 않음 |
| `ANALYSIS-QUEUED` → `ANALYSIS-COLLECTING` | 확인 | `step7-05-progress.png` — 받은 단계만 쌓아서 표시 |
| `SAVE-FIRST-SUCCESS` → `HOME-LOADING` → `RESULT-NORMAL` | 확인 | `step7-06-first-save.png`, `step7-07-home-result.png` |
| `RESULT-LIMITS`·`RESULT-OLD-REVIEWS` | 확인 | `step7-07` 아래쪽 한계 안내 |
| `RESULT-NO-PERSONA` | 확인(fixture 전용) | `step7-15-result-no-persona.png` |
| `ANALYSIS-RETRYABLE-ERROR` → 새 키 재요청 성공 | 확인 | `step7-10-analysis-retryable.png` — 멈춘 행 + 실패 결과 행 |
| `ANALYSIS-INSUFFICIENT` | 확인 | `step7-13-analysis-insufficient.png` |
| `STORE-NOT-FOUND` | 확인 | `step7-12-store-not-found.png` — 입력 화면으로 돌아가 값 보존 |
| `STORE-JOB-ERROR`(`IDEMPOTENCY_KEY_REUSED`) | 확인 | `step7-14-store-job-error.png` |
| 불변식 12(봉투 없는 401 → 갱신 → 재전송) | 확인 | 액세스 토큰 만료 상황에서 흐름이 끊기지 않고 끝까지 진행 |
| 불변식 13(실패 후 새 `Idempotency-Key`) | 확인 | 재시도 가능 실패 뒤 `다시 분석하기`가 새 키로 성공 |
| `NAV-HIDDEN`·`NAV-ANALYSIS-ACTIVE` | 확인 | `step7-11-nav-analysis-active.png` |
| `IMAGE-LOAD-ERROR` | 부분 확인 | `step7-19-image-load-error.png` — 원인과 "유형 내용은 그대로 볼 수 있어요" 안내까지 확인. 재조회 버튼은 실제 서버 모드에만 나오므로 동작은 미확인 |
| `ADVICE-NO-KNOWLEDGE` | 확인 | `step7-21-advice-expanded.png` — 서버가 빈 배열을 주므로 없다는 사실을 표시 |

확인하지 못한 것:

- `ANALYSIS-FATAL-ERROR`, `STORE-UNSUPPORTED-URL`(작업 실패로 오는 경우), `IMAGE-GENERATION-FAILED`, `RESULT-PARTIAL`: 코드 경로와 fixture 상황은 만들었으나 화면 캡처는 남기지 않았다.
- `IMAGE-READY`·`IMAGE-LOADING`: fixture 모드에는 내려받을 이미지가 없어 자리표시만 확인했다(`step7-20`, 200%는 `step7-23`). 실제 서버 연결 후 확인한다. 이미지 요청의 401 갱신·재요청(§6.4)도 아직 구현하지 않았다.
- `INSIGHT-LIMITED`: 대표 근거가 없는 관점을 문구로 처리했으나 fixture에 해당 데이터가 없어 화면으로 보지는 못했다.
- `STORE-OFFLINE`·`ANALYSIS-OFFLINE`: 네트워크 단절을 재현하지 않았다.
- `SAVE-FIRST-ERROR`: 서버 계약상 발생하면 안 되는 불일치라 fixture로 만들지 않았다.
- TalkBack 낭독과 실기기: 미실행.
- 실제 백엔드 연결: 미실행. §11의 백엔드 공백이 풀리기 전에는 fixture 결과가 실제 응답과 같다고 볼 수 없다.

### 6차 Step 5 디자인 합성 반영

반영일: 2026-09-22. 사용자가 고른 합성안([Step 5 합성](../../design/synthesis/TASK-020/README.md))에 맞춰 아래를 고쳤다.

| 변경 | 내용 |
|---|---|
| §5.1 뒤 | 분석 실패를 진행 목록 끝의 실패 결과 행과 원인·다음 행동으로 배치. 실패 단계는 표시하지 않음 |
| §7 `SAVE-FIRST-SUCCESS` | 자동 이동 대신 별도 완료 화면에서 `결과 보기`로 홈 이동 |
| §9 `NAV-ANALYSIS-ACTIVE` | 미리보기를 제외 |
| §11 | 저장 선택 형식 해소(문구만 남음), 실패 단계 제공 여부 추가 |
| §7 `SAVE-CHOICE-REQUIRED` | "미리보기 확인을 마친 뒤"에서 "미리보기와 같은 화면에 함께 표시"로. 교체 확인, 유지 안내, 뒤로가기 처리 추가 |
| §9 `NAV-HIDDEN` | 첫 저장 완료 화면과 새 결과 미리보기를 조건에 추가 |

### 5차 독립 재검토 반영

검토일: 2026-09-21. 4차 반영본을 독립 reviewer가 원격 백엔드 코드와 대조해 FAIL(P1 2·P2 6·P3 다수) 판정했다.

| 발견 사항 | 조치 |
|---|---|
| 액세스 토큰 만료는 `error.code` 없는 401로 와서, 코드 기준 규칙만으로는 토큰 갱신이 시작되지 않는다 | 불변식 12, `AUTH-RESTORING`·§6.4 갱신 규칙 추가 |
| `Idempotency-Key` 재사용 범위가 없어 실패 후 재시도가 이전 `FAILED` 작업을 돌려받는다 | 불변식 13, `STORE-*`·`ANALYSIS-RETRYABLE-ERROR` 재요청 규칙 |
| 작업 완료 뒤 첫 저장·미저장 미리보기 분기 규칙이 없다 | §7에 `analysisId` 비교 판정 추가 |
| 유효 리뷰 수·토픽 0개 결과·`ANALYSIS-FATAL-ERROR` 정의·서버 문구 사용 범위·이미지 인증이 코드와 맞지 않는다 | 상태 정의 수정, 불변식 9·11, §6.1·§6.4, §11 항목 추가 |
| 코드 표의 HTTP 상태·발생 시점·문맥별 연결, `RESOLVING_STORE` 서술, `limitations` 코드, 수집 건수 필드 | §2.1·§4·§6.1 정정 |
| 기능명세 `SC-*` 13개 추적 재확인 | `SC-002`는 §4.3 보류 상태에, 나머지 12개는 기존 상태에 연결됨 |
| 재검토에서 발견: 저장본이 있는 사용자의 새 로그인 뒤 첫 화면이 문서마다 다름(IA·User Flow·기능명세는 항상 가게 입력, 이 문서·API.md는 `hasSavedAnalysis` 분기) | 사용자 결정(2026-09-21): 새 로그인도 세션 복원과 같이 저장본이 있으면 홈, 없으면 가게 입력. PRD §6, RESULT_IA 원칙 1과 흐름도, USER_FLOW 결정 1·UF-01·UF-02·흐름도, 기능명세 흐름도를 이 기준으로 맞춤. `AUTH-SUCCESS` 전이는 원래 이 기준 |

### 4차 프론트엔드 구현 가능성 재검토

검토일: 2026-09-21. 기준: 프론트엔드가 이 문서와 실제 백엔드 코드만으로 구현할 수 있는가.

| 발견 사항 | 조치 |
|---|---|
| `SC-002` 가게 확인과 `STORE-RESOLVING`을 호출할 API가 없다. 가게 식별은 작업 안의 `RESOLVING_STORE`에서 일어나며 `STORE_NOT_FOUND`는 작업 실패로 온다 | §4를 `입력 → 작업 생성 → 진행` 흐름으로 다시 쓰고 `SC-002`를 §4.3 보류로 분리, §11에 API 결정 추가 |
| 서버 오류 코드와 화면 상태의 연결이 없다 | §2.1 코드 표와 불변식 11 추가. 원격 코드에 없는 코드를 표시 |
| 첫 자동 저장은 서버 완료 트랜잭션 안에서 일어나 앱이 별도로 관찰할 수 없다 | §7 `SAVE-FIRST-*`를 작업 완료 사건 기준으로 재정의 |
| 서버가 `progressStep` 일부만 보낸다 | §5에 받은 단계만 표시하는 규칙 추가 |
| `knowledgeReferences`가 비어 올 때의 상태가 없다 | `ADVICE-NO-KNOWLEDGE` 추가 |
| 전체 근거 조회 endpoint가 없다 | §6.3 설명과 §11 항목 추가 |
| 결과 형태·경고의 판정 근거 필드가 없다 | §6.1 판정 표 추가 |

### 3차 백엔드 계약 동기화

검토일: 2026-09-21

| 발견 사항 | 조치 |
|---|---|
| 백엔드 인증 정책(비밀번호 규칙, 전화번호 목적, 계정 자동 연결 금지, 폐기 토큰 재사용 시 전체 세션 폐기, 가입 시 세션 발급)이 상태에 없음 | `AUTH-FIELD-ERROR`·`AUTH-SIGNUP-CREATED` 보강, `AUTH-ACCOUNT-LINK-REQUIRED` 추가, 불변식 10 추가. 30초 회전 유예는 정본이 아니라 미정 항목으로 분리 |
| 약관·개인정보 버전 동의 흐름이 없음 | `AUTH-LEGAL-LOADING`, `AUTH-LEGAL-ERROR`, `AUTH-CONSENT-OUTDATED`, `AUTH-SIGNUP-UNAVAILABLE` 추가 |
| `main`의 API.md §2.1 오류 계약과 필드 오류 상태의 연결이 없음 | 불변식 9 추가(`error.code` 기준 전이), `traceId` 노출 여부를 미정 항목으로 분리 |
| PRD FR-012에 추가한 계정 탈퇴의 상태가 없음 | `ACCOUNT-DELETE-*` 5개와 `SC-009` 배치 추가. 삭제 대상은 원격 ADR-010 목록을 따름 |

### 2차 자체 교차 검토

검토일: 2026-09-18

| 발견 사항 | 조치 |
|---|---|
| 자체 회원가입과 로그인의 입력·제출 상태가 혼재 | `AUTH-SIGNUP-*` 상태를 분리하고 전화번호 목적·가입 후 전이를 미정 항목으로 명시 |
| Google 인증 취소와 인증 실패가 같은 오류 상태 | `AUTH-GOOGLE-CANCELLED`를 분리 |
| 저장본이 있는 사용자가 새 결과를 확인하는 상태 누락 | `RESULT-UNSAVED-PREVIEW`와 저장 문맥 조합 규칙 추가 |
| 첫 자동 저장 실패와 기존 저장본 교체 실패가 같은 상태 | `SAVE-FIRST-ERROR`, `SAVE-REPLACE-ERROR`로 분리 |
| 대표성 한계·알림 끄기·로그아웃 완료 상태가 불명확 | `RESULT-LIMITS`, 설정 ON/OFF, `LOGOUT-SUCCESS` 상태 추가 |
