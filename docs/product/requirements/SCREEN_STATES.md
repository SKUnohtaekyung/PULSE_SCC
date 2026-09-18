# PULSE MVP 화면 상태 모델

## 1. 문서 개요

| 항목 | 내용 |
|---|---|
| 목적 | Android 프론트엔드가 화면별 정상·진행·빈 상태·오류·복구 상태를 빠뜨리지 않도록 구현 상태를 정의한다 |
| 상태 | 1차 초안 — 제품·디자인 검토 전, 세부 카피·시각 디자인·오프라인 정책은 미정 |
| 기준일 | 2026-09-18 |
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

---

## 3. 앱 시작과 인증 상태

### 3.1 앱 전역 진입 상태

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 전이 |
|---|---|---|---|---|
| `APP-BOOTING` | 앱 실행 직후 | 서비스 시작 상태. 홈이나 로그인 화면을 잠깐 잘못 보여주지 않는다 | 안전 저장소의 인증 정보 확인 | `AUTH-RESTORING` 또는 `AUTH-INITIAL` |
| `AUTH-RESTORING` | 저장된 인증 정보가 있음 | 로그인 상태 확인 중이라는 안내 | 세션 복원 요청과 저장 결과 존재 여부 확인 | `APP-READY`, `APP-FIRST-ANALYSIS-REQUIRED`, `AUTH-EXPIRED` |
| `APP-FIRST-ANALYSIS-REQUIRED` | 인증 성공, 저장 결과 없음 | 가게 정보 입력 흐름 | 홈·하단 내비게이션 접근 차단 | `STORE-INITIAL` |
| `APP-READY` | 인증 성공, 저장 결과 있음 | 저장된 분석 결과가 있는 홈 | 하단 내비게이션 활성화 | `HOME-LOADING` |
| `AUTH-EXPIRED` | 세션 만료·폐기·복원 실패 | 다시 로그인해야 하는 이유와 로그인 행동 | 로컬 인증 정보 제거 또는 무효 처리 | `AUTH-INITIAL` |
| `APP-OFFLINE` | 앱 시작 시 네트워크 없음 | 연결 상태와 다시 시도 행동 | 캐시 사용 여부는 미정 | 정책 확정 후 결정 |

### 3.2 `SC-AUTH` 로그인·가입

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 행동 |
|---|---|---|---|---|
| `AUTH-INITIAL` | 미인증 진입 | Google 로그인과 서비스 자체 로그인 진입점 | 요청 없음 | 로그인 방식 선택 |
| `AUTH-EDITING` | 서비스 자체 로그인 정보 입력 | 이메일·비밀번호 입력값, 필수 여부, 제출 가능 상태 | 클라이언트 형식 검증 | 계속 입력 또는 로그인 제출 |
| `AUTH-SIGNUP-EDITING` | 자체 계정 가입 정보 입력 | 이메일·비밀번호·전화번호와 확정된 수집·이용 목적 고지 | 클라이언트 형식 검증 | 계속 입력 또는 가입 제출 |
| `AUTH-FIELD-ERROR` | 이메일 형식·필수값·비밀번호 정책·전화번호 형식 오류 | 해당 필드 가까이 원인과 수정 방법 | 서버 요청 전 차단 가능한 오류는 요청하지 않음 | 입력 수정 |
| `AUTH-SUBMITTING` | 서비스 자체 로그인 요청 | 로그인 처리 중 안내 | 중복 제출 차단 | 성공 또는 오류 |
| `AUTH-SIGNUP-SUBMITTING` | 자체 계정 가입 요청 | 가입 처리 중 안내 | 중복 제출 차단 | 생성 또는 오류 |
| `AUTH-SIGNUP-CREATED` | 자체 계정 생성 성공 | 계정이 만들어졌다는 안내 | 가입 후 자동 로그인 여부는 정책 확정 전 임의 결정하지 않음 | `AUTH-SUCCESS` 또는 `AUTH-INITIAL` |
| `AUTH-SIGNUP-ERROR` | 중복·정책·서버 오류로 가입 실패 | 민감정보를 노출하지 않는 원인과 수정·재시도 행동 | 입력값 중 비밀번호 보존 여부는 보안 정책을 따름 | 입력 수정 또는 재시도 |
| `AUTH-GOOGLE-PENDING` | Google 인증 시작 | 외부 인증 진행 중 안내 | Google 인증 결과 대기 | 성공·취소·외부 인증 실패 |
| `AUTH-GOOGLE-CANCELLED` | 사용자가 Google 인증을 취소 | 취소됐으며 다시 시도할 수 있다는 안내 | 실패로 기록하되 자격 증명 오류처럼 표현하지 않음 | 재시도 또는 다른 방식 선택 |
| `AUTH-INVALID-CREDENTIALS` | 이메일 또는 비밀번호 불일치 | 자격 증명을 확인하라는 안내 | 민감한 실패 원인을 세분화해 노출하지 않음 | 다시 입력 |
| `AUTH-GOOGLE-ERROR` | Google 인증·서버 검증 실패 | 실패 이유와 가능한 다음 행동 | 계정 연결 방식은 인증 정책이 확정되기 전까지 임의로 처리하지 않음 | 재시도 또는 기존 방식 로그인 |
| `AUTH-SUCCESS` | 서버 세션 생성 성공 | 다음 단계로 이동 중인 상태 | 토큰을 안전 저장소에 저장하고 저장 결과 여부 확인 | `APP-READY` 또는 `APP-FIRST-ANALYSIS-REQUIRED` |
| `AUTH-OFFLINE` | 로그인 요청 시 네트워크 없음 | 인터넷 연결 후 다시 시도 안내 | 자격 증명 요청을 큐에 보관하지 않음 | 재시도 |

---

## 4. 가게 지정 상태

### 4.1 `SC-001` 가게 정보 입력

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 행동 |
|---|---|---|---|---|
| `STORE-INITIAL` | 첫 분석 또는 분석하기 진입 | 가게 이름·업종·네이버 가게 URL 필수 입력 | 새 요청 초깃값 준비 | 입력 시작 |
| `STORE-EDITING` | 하나 이상의 필드 변경 | 입력값과 제출 가능 여부 | 업종 허용값·URL 형식 등 로컬 검증 | 계속 입력 또는 확인 요청 |
| `STORE-FIELD-ERROR` | 누락·허용 업종 밖·URL 형식 오류 | 필드별 원인과 수정 방법 | 오류 필드에 접근 가능한 연결 제공 | 입력 수정 |
| `STORE-RESOLVING` | 세 필드가 유효하고 가게 확인 요청 | 가게 정보를 확인 중이라는 안내 | 서버에서 URL 허용 목록·리다이렉트·가게 식별 검증 | 확인 또는 실패 |
| `STORE-UNSUPPORTED-URL` | 허용되지 않은 호스트·스킴·주소 | 지원하는 네이버 가게 주소 안내 | 수집 브라우저를 실행하지 않음 | URL 수정 |
| `STORE-NOT-FOUND` | 가게 식별 실패 | 이름과 URL 확인 안내 | 입력값 유지 | 수정 후 재시도 |
| `STORE-OFFLINE` | 확인 요청 시 네트워크 없음 | 연결 후 다시 시도 안내 | 입력값 유지 | 재시도 |

### 4.2 `SC-002` 가게 확인

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 행동 |
|---|---|---|---|---|
| `STORE-CONFIRM-READY` | 가게 식별 성공 | 입력한 정보와 확인된 가게 정보 | 아직 분석 작업을 생성하지 않음 | 분석 시작 또는 입력 수정 |
| `STORE-MISMATCH` | 입력 이름·업종과 확인 정보가 크게 다름 | 불일치 항목과 확인 요청 | 자동으로 값을 덮어쓰지 않음 | 계속 진행 또는 수정 |
| `STORE-CREATING-JOB` | 분석 시작 선택 | 분석 작업을 만드는 중이라는 안내 | 멱등성 키로 작업 생성 | `ANALYSIS-QUEUED` 또는 오류 |
| `STORE-JOB-ERROR` | 작업 생성 실패 | 원인·현재 입력 보존·재시도 가능 여부 | 중복 작업 생성 방지 | 재시도 또는 수정 |

---

## 5. `SC-003` 분석 진행 상태

공개 작업 상태는 `QUEUED → RUNNING → COMPLETED | FAILED`이며, 화면은 근거 없는 퍼센트 대신 `progressStep`과 사용자용 문장을 표시한다.

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
| `ANALYSIS-INSUFFICIENT` | 유효 리뷰 50건 미만 | 현재 유효 리뷰 수와 50건 기준 | 다른 가게 입력 또는 종료 |
| `ANALYSIS-RETRYABLE-ERROR` | 일시적 수집 실패·모델 오류·시간 초과 등 | 실패 단계·현재 상태·재시도 가능 안내 | 같은 작업 확인 또는 안전한 재시도 |
| `ANALYSIS-FATAL-ERROR` | 사용자 수정 없이는 복구 불가 | 실패 원인과 수정해야 할 입력 | 가게 정보 수정 |
| `ANALYSIS-UNAUTHORIZED` | 진행 중 세션 만료·폐기 | 로그인 만료 안내 | 로그인 후 작업 접근 정책은 미정 |
| `ANALYSIS-OFFLINE` | 상태 조회 중 네트워크 단절 | 마지막으로 확인한 단계와 연결 복구 안내 | 자동 polling·백오프 정책은 미정 |

### 5.2 `SC-009` 오류·한계 배치

`SC-009`는 독립 route를 뜻하지 않는다. 오류와 한계를 발생 단계 안에 배치하기 위한 논리 화면 ID다.

| 발생 영역 | 연결 상태 | 배치 원칙 |
|---|---|---|
| 인증 | `AUTH-FIELD-ERROR`, `AUTH-INVALID-CREDENTIALS`, `AUTH-GOOGLE-ERROR`, `AUTH-EXPIRED` | 인증 화면에서 이유와 다음 행동을 표시한다 |
| 가게 입력 | `STORE-FIELD-ERROR`, `STORE-UNSUPPORTED-URL`, `STORE-NOT-FOUND` | 관련 필드 가까이에 원인과 수정 방법을 표시한다 |
| 수집·분석 | `ANALYSIS-INSUFFICIENT`, `ANALYSIS-RETRYABLE-ERROR`, `ANALYSIS-FATAL-ERROR` | 분석 진행 화면에서 실패 단계·현재 상태·다음 행동을 표시한다 |
| 결과 | `RESULT-PARTIAL`, `RESULT-NO-PERSONA`, `RESULT-OLD-REVIEWS`, `RESULT-ERROR` | 결과 화면에서 근거 부족·오래된 리뷰·조회 실패를 해당 정보와 함께 표시한다 |
| 저장 | `SAVE-CONFLICT`, `SAVE-FIRST-ERROR`, `SAVE-REPLACE-ERROR` | 저장 결과 유무와 기존 저장본의 보존 여부를 구분하고 재시도 행동을 표시한다 |

---

## 6. 결과·근거·제안 상태

### 6.1 `SC-011` 홈과 `SC-006` 손님 유형

결과의 저장 문맥과 결과 형태는 서로 독립적이다. `RESULT-SAVED-CONTEXT` 또는 `RESULT-UNSAVED-PREVIEW` 중 하나가 `RESULT-NORMAL`, `RESULT-PARTIAL`, `RESULT-NO-PERSONA` 중 하나와 결합된다.

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `RESULT-SAVED-CONTEXT` | 홈에서 계정의 저장 결과 조회 | 현재 저장된 결과라는 문맥 | 유형·근거·제안 탐색 또는 새 분석 |
| `RESULT-UNSAVED-PREVIEW` | 저장본이 있는 계정의 새 분석 완료 | 새 결과이며 아직 기존 저장본을 교체하지 않았다는 안내 | 결과 탐색 후 새 결과로 교체 또는 기존 결과 유지 |

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `HOME-LOADING` | 저장 분석 조회 중 | 저장 결과를 불러오는 중이라는 안내 | 정상·없음·오류 |
| `HOME-NO-SAVED-RESULT` | 인증됐지만 저장 결과 없음 | 홈 대신 가게 입력 흐름 | 첫 분석 시작 |
| `RESULT-NORMAL` | 페르소나 3개 | 메타정보 → 3칸 포디움 → 최초 1위 콘텐츠 | 유형 선택·근거·제안 탐색 |
| `RESULT-PARTIAL` | 페르소나 1~2개 | 3칸 유지, 실제 유형만 채우고 빈 슬롯에 근거 부족 이유 | 존재하는 유형 선택 |
| `RESULT-NO-PERSONA` | 유효 리뷰 50건 이상이나 근거를 충족한 토픽 0개 | 세 빈 슬롯과 근거 부족 안내, 선택 콘텐츠 없음 | 새 분석 또는 한계 확인 |
| `RESULT-LIMITS` | 모든 정상·유형 부족 결과 | 리뷰 작성자가 전체 고객을 대표하지 않을 수 있다는 자기선택·대표성 한계 | 한계를 확인한 상태로 결과 탐색 |
| `RESULT-OLD-REVIEWS` | 2년 초과 리뷰 포함 | 현재 매장과 다를 수 있다는 우려 메시지 | 결과를 한계와 함께 탐색 |
| `RESULT-ERROR` | 저장 결과 조회 실패·결과 불완전 | 원인·현재 저장본 상태·재시도 | 재조회 |
| `RESULT-UNAUTHORIZED` | 다른 사용자 결과·세션 만료 | 접근 불가 또는 로그인 만료 안내 | 로그인 |

`RESULT-LIMITS`와 `RESULT-OLD-REVIEWS`는 별도의 결과 유형이 아니라 `NORMAL`, `PARTIAL`, `NO-PERSONA`와 함께 표시되는 한계·경고 상태다. `RESULT-UNSAVED-PREVIEW`를 닫거나 앱을 종료했을 때 다시 접근할 수 있는 범위는 보관 정책 확정 전까지 보장하지 않는다.

### 6.2 `SC-004` 페르소나별 4관점

| 상태 ID | 조건 | 사용자에게 보이는 것 | 시스템 규칙 |
|---|---|---|---|
| `INSIGHT-SELECTED` | 도출된 유형 선택 | 유형명·이미지·긍정·부정·인식·우선순위 | 진입 시 1위 최초 선택 |
| `INSIGHT-SWITCHING` | 다른 순위 선택 | 선택 변화가 진행 중임을 알 수 있는 상태 | 포디움은 유지하고 아래 콘텐츠만 교체 |
| `INSIGHT-LIMITED` | 특정 관점에 근거 항목이 적음 | 존재하는 근거 항목과 한계 | 근거 없는 항목을 채워 넣지 않음 |
| `INSIGHT-ERROR` | 선택 콘텐츠 조회 실패 | 포디움은 유지하고 해당 콘텐츠 재시도 | 다른 저장 결과로 바꾸지 않음 |

### 6.3 `SC-005` 근거 상세

| 상태 ID | 조건 | 사용자에게 보이는 것 | 다음 행동 |
|---|---|---|---|
| `EVIDENCE-LOADING` | 전체 근거 첫 조회 | 근거를 불러오는 중 | 정상·오류 |
| `EVIDENCE-NORMAL` | 근거 존재 | 작성자 식별정보 없는 리뷰 본문과 필요한 메타정보 | 다음 cursor 조회 |
| `EVIDENCE-LOADING-MORE` | 추가 페이지 조회 | 기존 목록 유지 + 추가 로딩 상태 | 성공·오류 |
| `EVIDENCE-END` | 다음 cursor 없음 | 전체 근거를 확인했다는 끝 상태 | 결과로 돌아가기 |
| `EVIDENCE-EMPTY` | 연결 근거 없음 | 결과 무결성 문제 안내 | 결과 제공 중단·재조회. 정상 완료 결과로 취급하지 않음 |
| `EVIDENCE-ERROR` | 조회 실패 | 기존에 받은 근거 보존 + 재시도 | 재시도 |

### 6.4 `SC-007` 페르소나 이미지

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
| `ADVICE-EMPTY` | 근거를 충족한 제안 없음 | 억지 제안을 만들지 않았다는 한계 | 임의 fallback 제안 금지 |
| `ADVICE-ERROR` | 상세 지식 조회 실패 | 기본 리뷰 사실·행동은 보존 | 상세만 재시도 |

---

## 7. `SC-010` 저장 결과 상태

| 상태 ID | 조건·이벤트 | 사용자에게 보이는 것 | 시스템 처리 | 다음 전이 |
|---|---|---|---|---|
| `SAVE-FIRST-PENDING` | 첫 분석 완료, 저장본 없음 | 첫 결과를 저장 중이라는 안내 | 완료 트랜잭션에서 자동 저장 | `SAVE-FIRST-SUCCESS` 또는 오류 |
| `SAVE-FIRST-SUCCESS` | 자동 저장 성공 | 홈에서 결과를 볼 수 있다는 완료 상태 | 저장 결과 1개 확인 | `HOME-LOADING` |
| `SAVE-CHOICE-REQUIRED` | 기존 저장본이 있고 `RESULT-UNSAVED-PREVIEW` 확인을 마침 | 새 결과로 교체 / 기존 결과 유지 | 선택 전 기존 저장본 유지 | 사용자 선택 |
| `SAVE-REPLACING` | 새 결과로 교체 선택 | 교체 중 안내, 중복 선택 차단 | 소유권·완료 상태 확인 후 트랜잭션 update | 홈의 새 결과 |
| `SAVE-KEEPING` | 기존 결과 유지 선택 | 기존 결과로 돌아가는 중 안내 | 기존 저장본 변경 없음 | 홈의 기존 결과 |
| `SAVE-CONFLICT` | 동시 변경·저장 충돌 | 저장 상태가 바뀌었다는 안내 | 최신 저장본 재조회 | 다시 선택 또는 홈 |
| `SAVE-FIRST-ERROR` | 첫 결과 자동 저장 실패 | 아직 홈에 저장된 결과가 없다는 안내와 재시도 | 첫 분석 결과를 완료로 가장하지 않음 | 저장 재시도 |
| `SAVE-REPLACE-ERROR` | 기존 저장본 교체 실패 | 기존 저장본이 그대로 유지됐다는 안내 | 기존 저장본을 손상시키지 않음 | 교체 재시도 또는 기존 결과 유지 |

기존 결과 유지 후 미저장 새 결과를 얼마나 다시 볼 수 있는지는 미정이다. 이 정책이 확정되기 전에는 프론트가 임의의 영구 보관·히스토리 화면을 만들지 않는다.

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

---

## 9. 하단 내비게이션 상태

| 상태 ID | 조건 | 표시·동작 |
|---|---|---|
| `NAV-HIDDEN` | 저장 결과 없음·첫 분석 전 | 하단 내비게이션을 표시하지 않는다 |
| `NAV-HOME-ACTIVE` | 홈 | 홈 선택 상태. 가운데 분석하기는 주요 행동으로 유지 |
| `NAV-ANALYSIS-ACTIVE` | 새 분석 흐름 | 분석하기 선택 상태. 진행 중 이탈 정책은 미정 |
| `NAV-MYPAGE-ACTIVE` | 마이페이지 | 마이페이지 선택 상태 |
| `NAV-DISABLED-TRANSITION` | 저장 교체 등 중복 이동이 위험한 짧은 전이 | 필요한 항목만 일시 비활성화하고 이유를 접근 가능하게 알림 |

---

## 10. 첫 Vertical Slice 필수 상태

첫 프론트 구현은 아래 상태를 한 흐름으로 연결해 구조를 검증한다.

```text
APP-BOOTING
→ AUTH-INITIAL / AUTH-SUBMITTING / AUTH-FIELD-ERROR / AUTH-SUCCESS
→ STORE-INITIAL / STORE-EDITING / STORE-FIELD-ERROR
→ STORE-RESOLVING / STORE-CONFIRM-READY / STORE-CREATING-JOB
→ ANALYSIS-QUEUED / ANALYSIS-COLLECTING / ANALYSIS-ANALYZING / ANALYSIS-IMAGE / ANALYSIS-VALIDATING
→ SAVE-FIRST-PENDING / SAVE-FIRST-SUCCESS
→ HOME-LOADING / RESULT-NORMAL / RESULT-PARTIAL / RESULT-NO-PERSONA
```

같은 Slice에서 `ANALYSIS-INSUFFICIENT`, `ANALYSIS-RETRYABLE-ERROR`, `IMAGE-GENERATION-FAILED`, `SAVE-FIRST-ERROR` fixture도 각각 재현해 실패 경계를 검증한다. 저장본이 있는 사용자의 `RESULT-UNSAVED-PREVIEW → SAVE-CHOICE-REQUIRED → SAVE-REPLACING | SAVE-KEEPING` 흐름은 다음 Slice에서 연결한다.

Vertical Slice에서 실제 백엔드 endpoint가 아직 없는 단계는 고정된 비식별 fixture를 사용한다. fixture 상태와 실제 API 상태의 타입을 다르게 만들지 않으며, 화면 안에 데모 데이터를 운영 데이터처럼 표시하지 않는다.

---

## 11. 구현 전 남은 결정

| 항목 | 막고 있는 상태·동작 | 결정 시점 |
|---|---|---|
| 네트워크 오프라인·캐시·자동 재시도 정책 | 모든 `*-OFFLINE`, 앱 재실행 | 네트워크 계층 구현 전 |
| 분석 polling 주기·백오프·백그라운드 복귀 | `SC-003` | 분석 API 연동 전 |
| 진행 중 화면 이탈·앱 종료 후 복원 | `SC-003`, 하단 내비게이션 | 분석 화면 구현 전 |
| 세션 만료 중 분석 작업 접근 | `ANALYSIS-UNAUTHORIZED` | 인증·분석 API 연결 전 |
| 전화번호 수집·이용 목적, 약관 동의, 가입 후 자동 로그인 | `AUTH-SIGNUP-*` | 자체 계정 가입 구현 전 |
| 가게 입력과 확인의 route 분리 | `SC-001`, `SC-002` | 화면 구조 구현 전 |
| 저장 선택 UI 형식과 세부 문구 | `SC-010` | 저장 선택 화면 구현 전 |
| 미저장 새 결과의 접근·보관 시간 | `SAVE-KEEPING` 이후 | 작업 큐·삭제 배치 구현 전 |
| 알림 읽음 처리 | `SC-012` | 마이페이지 API 구현 전 |
| 최소 Android OS·지원 기기·접근성 목표 | 전체 Visual QA | 첫 UI 구현 전 |

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

### 2차 자체 교차 검토

검토일: 2026-09-18

| 발견 사항 | 조치 |
|---|---|
| 자체 회원가입과 로그인의 입력·제출 상태가 혼재 | `AUTH-SIGNUP-*` 상태를 분리하고 전화번호 목적·가입 후 전이를 미정 항목으로 명시 |
| Google 인증 취소와 인증 실패가 같은 오류 상태 | `AUTH-GOOGLE-CANCELLED`를 분리 |
| 저장본이 있는 사용자가 새 결과를 확인하는 상태 누락 | `RESULT-UNSAVED-PREVIEW`와 저장 문맥 조합 규칙 추가 |
| 첫 자동 저장 실패와 기존 저장본 교체 실패가 같은 상태 | `SAVE-FIRST-ERROR`, `SAVE-REPLACE-ERROR`로 분리 |
| 대표성 한계·알림 끄기·로그아웃 완료 상태가 불명확 | `RESULT-LIMITS`, 설정 ON/OFF, `LOGOUT-SUCCESS` 상태 추가 |
