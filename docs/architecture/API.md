# SCC — API 설계 계약

| 항목 | 내용 |
|---|---|
| 상태 | **설계 계약 v0.5 — 인증·분석·근거·마이페이지 API 구현** |
| 기준일 | 2026-09-24 |
| 소유 역할 | `role:platform` |
| 제품 요구사항 | [PRD.md](../product/PRD.md) |
| 상세 기능명세 | [GUEST_ANALYSIS_FUNCTIONAL_SPEC.md](../product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md) |
| 데이터 모델 | [DATA_MODEL.md](DATA_MODEL.md) |

이 문서는 SCC Android 앱과 Spring Boot API 사이의 설계 계약이다. 실제 OpenAPI 파일과 DTO·타입이 생기면 해당 구현물이 필드·enum·검증 규칙의 정본이 되고, 이 문서는 경계와 설계 의도를 설명한다.

참고한 기존 PULSE 손님분석 문서의 비동기 작업·공개/내부 API 분리·권한 격리 원칙은 유지했다. 다음 기존 값은 SCC 정본과 충돌하므로 가져오지 않았다.

| 기존 PULSE 참고값 | SCC 적용값 |
|---|---|
| Web React 클라이언트 | Expo 기반 React Native Android 앱 |
| MySQL + MongoDB | PostgreSQL 단일 데이터베이스 |
| 인증 사용자에게 연결된 매장 | 요청의 가게 이름·업종·네이버 가게 URL을 서버가 검증 |
| 네이버 + 카카오 | 네이버만 사용 |
| 리뷰 1~2건 fallback | 유효 리뷰 50건 미만이면 분석하지 않음 |
| 부족한 페르소나를 보완해 3개 생성 | 근거가 있는 0~3개만 생성하고 빈 포디움 슬롯 표시 |
| 4단계 고객 여정 | 페르소나별 긍정·부정·인식·우선순위 4관점 |

---

## 1. API 경계

```text
Expo Android App
  → HTTPS /api/v1/**
Spring Boot API
  → 인증·권한·입력 검증·공개 응답 정규화
  → PostgreSQL
  → 내부 인증 경계
Python AI·분석 컴포넌트
  → 네이버 리뷰 수집·정제·분석·이미지 생성
  → PostgreSQL
```

Spring Boot는 외부 클라이언트가 접근하는 유일한 API다. Android 앱은 Python 컴포넌트, 크롤러, PostgreSQL, OpenAI API에 직접 접근하지 않는다.

Spring Boot와 Python은 [ADR-006](../decisions/ADR-006-backend-bootstrap.md)에 따라 인증된 내부 HTTP로 통신한다. 구체 분석 endpoint와 서비스 토큰·timeout·재시도 값은 이 문서 §9와 실제 구현에서 확정한다.

---

## 2. 공통 규칙

| 항목 | 규칙 |
|---|---|
| Base path | `/api/v1` |
| 형식 | JSON 엔드포인트는 `application/json; charset=utf-8`; 페르소나 이미지 조회는 검증된 이미지 MIME type |
| 필드명 | 외부 JSON은 `camelCase` |
| 식별자 | 서버가 생성한 UUID 문자열. 순번형 내부 ID를 외부에 노출하지 않음 |
| 시간 | ISO 8601 UTC 문자열. 예: `2026-09-15T12:30:00Z` |
| 인증 | `Authorization: Bearer <access-token>` |
| 사용자 범위 | 요청 본문의 `userId`를 신뢰하지 않고 인증 주체로 결정 |
| 멱등성 | 분석 생성은 `Idempotency-Key` 헤더를 받으며 같은 사용자·키의 재시도는 같은 작업을 반환 |
| 민감정보 | 비밀번호·토큰·API 키·리뷰 작성자 식별정보를 응답과 로그에 포함하지 않음 |

액세스·갱신 토큰 정책은 [ADR-008](../decisions/ADR-008-authentication-policy.md)을 따른다. Access Token은 15분 HS256 JWT, Refresh Token은 30일 불투명 난수이며 매 사용 시 회전한다. 토큰 문자열을 URL, 로그, 오류 상세에 넣지 않는다.

### 2.1 공통 오류

```json
{
  "error": {
    "code": "INVALID_NAVER_PLACE_URL",
    "message": "지원하는 네이버 가게 주소를 입력해 주세요.",
    "retryable": false,
    "fieldErrors": [
      {
        "field": "naverPlaceUrl",
        "code": "UNSUPPORTED_HOST",
        "message": "지원하지 않는 주소입니다."
      }
    ],
    "traceId": "01J..."
  }
}
```

- `message`는 사용자에게 표시 가능한 한국어다.
- 내부 예외명·SQL·스택 트레이스·외부 제공자 응답 원문은 반환하지 않는다.
- `traceId`는 운영 로그 상관관계용이며 개인정보를 포함하지 않는다.
- `fieldErrors`는 필드 오류가 있을 때만 포함한다.

### 2.2 공통 HTTP 상태

| HTTP | 의미 |
|---:|---|
| 200 | 조회·갱신 성공 |
| 201 | 계정 등 동기 리소스 생성 성공 |
| 202 | 비동기 분석 작업 생성·접수 |
| 400 | 형식·상태 전이 오류 |
| 401 | 인증 필요·토큰 무효 |
| 403 | 인증됐지만 해당 리소스 접근 불가 |
| 404 | 요청 사용자의 범위 안에서 리소스 없음 |
| 409 | 이메일 중복, 저장본 교체 충돌, 멱등성 키 payload 불일치 |
| 422 | 필드 형식은 유효하지만 제품 규칙 위반 |
| 429 | 사용자 또는 외부 제공자 한도 초과 |
| 500 | 복구 불가능한 내부 오류 |
| 502 | Python·OpenAI 등 내부/외부 서비스 오류 |
| 503 | 분석 서비스 일시 사용 불가 |

---

## 3. 공개 엔드포인트

### 3.1 인증

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/v1/auth/register` | 없음 | 이메일 형식 아이디·비밀번호·전화번호로 자체 계정 생성 |
| POST | `/api/v1/auth/login` | 없음 | 자체 계정 로그인 |
| POST | `/api/v1/auth/google` | 없음 | Google 인증 결과를 서버가 검증하고 서비스 세션 생성 |
| POST | `/api/v1/auth/refresh` | 갱신 토큰 | 서비스 세션 갱신 |
| POST | `/api/v1/auth/logout` | 필요 | 현재 세션 폐기 |
| GET | `/api/v1/auth/session` | 필요 | Access Token과 DB 세션 상태를 확인해 로그인 상태 복원 |
| GET | `/api/v1/legal-documents` | 없음 | 현재 이용약관·개인정보 처리방침 버전 조회 |

전화번호 인증·계정 복구는 정책이 확정되지 않았다. 계정 탈퇴는 `DELETE /api/v1/me/account`로 제공하며 자체 계정은 현재 비밀번호 확인 후 계정과 연계 데이터를 삭제한다. Google 전용 계정은 현재 인증 세션으로 본인을 확인한다.

`GET /api/v1/legal-documents`는 현재 동의 가능한 `termsVersion`, `privacyVersion`과 `legallyReviewed`를 반환한다. 법률 전문가 검토가 완료되기 전에는 `legallyReviewed=false`이며 운영 가입을 열어서는 안 된다.

### 3.2 분석 작업과 결과

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/v1/analysis-jobs` | 가게 정보 검증 후 비동기 분석 작업 생성 |
| GET | `/api/v1/analysis-jobs/{jobId}` | 작업 상태·진행 단계·실패 정보 조회 |
| GET | `/api/v1/analysis-jobs/{jobId}/result` | 완료된 작업의 분석 결과 조회 |
| GET | `/api/v1/analyses/{analysisId}/evidence` | 결과에 연결된 전체 근거 리뷰를 cursor 방식으로 조회 |
| GET | `/api/v1/persona-images/{imageId}` | 요청 사용자 소유 결과의 페르소나 이미지 조회 |
| GET | `/api/v1/me/saved-analysis` | 현재 계정의 저장 분석 1개 조회 |
| PUT | `/api/v1/me/saved-analysis/{analysisId}` | 저장 분석을 새 결과로 교체 |

`/analyses/{analysisId}/evidence`는 요청 사용자 소유 분석과 해당 분석의 페르소나를 함께 확인한다. 앱은 결과 응답의 `evidencePreview`를 대표 근거로 먼저 보여주고, 전체 보기에서 이 endpoint를 호출한다.

Python 컴포넌트는 결과를 PostgreSQL에 내구성 있게 기록한 뒤 Spring Boot에 준비 완료를 알린다. Spring Boot는 결과 소유권과 필수 산출물을 확인하고 하나의 완료 트랜잭션에서 작업을 `COMPLETED`로 전이하고, 저장본이 없는 계정에는 첫 결과를 저장하며, 알림 설정이 켜진 경우에만 완료 알림을 멱등하게 생성한다. 중간에 실패하면 작업은 공개 `COMPLETED`가 되지 않으며 같은 작업을 안전하게 재조정할 수 있어야 한다. 저장본이 있는 사용자가 새 결과를 유지하지 않기로 선택하면 교체 API를 호출하지 않는다.

### 3.3 마이페이지 최소 기능

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/v1/me/notifications` | 분석 완료·실패 인앱 알림 조회 |
| GET | `/api/v1/me/notification-settings` | 분석 알림 설정 조회 |
| PATCH | `/api/v1/me/notification-settings` | 분석 알림 켜기·끄기 |
| DELETE | `/api/v1/me/account` | 자체 계정은 현재 비밀번호 확인 후 계정·세션·분석·리뷰·알림·이미지 삭제 |

홍보 알림·OS 푸시·별도 이미지 아카이브 API는 MVP에 포함하지 않는다. 현재 저장 결과의 페르소나 이미지는 저장 분석 응답에 포함한다.

---

## 4. 인증 계약 초안

### 4.1 자체 계정 생성

```json
{
  "email": "owner@example.com",
  "password": "<user-input>",
  "phoneNumber": "01012345678",
  "termsVersion": "2026-09-17",
  "privacyVersion": "2026-09-17"
}
```

이메일은 trim 후 소문자로 정규화한다. 비밀번호는 8자 이상, UTF-8 기준 72바이트 이하이며 BCrypt 해시만 저장한다. 전화번호는 필수지만 MVP에서 인증·복구에 사용하지 않고 중복을 허용한다.

### 4.2 세션 응답 최소 필드

```json
{
  "accessToken": "<jwt>",
  "accessTokenExpiresAt": "2026-09-15T13:00:00Z",
  "refreshToken": "<opaque-token>",
  "refreshTokenExpiresAt": "2026-10-15T12:45:00Z",
  "user": {
    "id": "8bf5c78a-...",
    "email": "owner@example.com",
    "hasSavedAnalysis": false
  }
}
```

`user.hasSavedAnalysis=false`이면 앱은 홈이 아니라 가게 정보 입력으로 이동한다.

Refresh Token은 `/api/v1/auth/refresh` 요청 본문에서만 받고 매 성공 시 새 값으로 교체한다. 로그아웃은 JWT의 `sid`가 가리키는 현재 세션을 폐기한다. 이미 폐기된 Refresh Token 재사용이 감지되면 해당 사용자의 활성 세션을 모두 폐기한다.

Google 로그인 요청은 Android가 받은 `idToken`을 본문으로 전달한다. 서버는 Google 공개키로 서명과 만료를 검증하고 `issuer`, `audience=GOOGLE_CLIENT_ID`, `email_verified=true`를 확인한다. 같은 이메일의 기존 자체 계정에는 자동 연결하지 않고 `409 ACCOUNT_LINK_REQUIRED`를 반환한다.

---

## 5. 분석 작업 계약

### 5.1 작업 생성

```http
POST /api/v1/analysis-jobs
Authorization: Bearer <access-token>
Idempotency-Key: <uuid>
Content-Type: application/json
```

```json
{
  "storeName": "예시 식당",
  "category": "한식",
  "naverPlaceUrl": "https://map.naver.com/..."
}
```

클라이언트가 `userId`, 내부 `storeId`, 리뷰 수 또는 분석 상태를 지정할 수 없다. 서버는 리다이렉트된 최종 URL까지 허용 목록과 사설·로컬 주소 여부를 검증한 뒤 작업을 만든다.
`category`는 PRD에 정의된 사용자 표시값(`한식`, `중식`, `일식`, `양식`, `카페/디저트`, `주점`, `기타`)을 사용한다. 별도 영문 enum 코드는 OpenAPI 작성 시 확정하기 전까지 만들지 않는다. `naverPlaceUrl`은 `https://map.naver.com` 또는 `https://m.place.naver.com` 호스트만 허용하며 Python 수집기도 DNS 해석 결과가 사설·loopback·link-local 주소이면 거부한다.

```json
{
  "jobId": "6af9a900-...",
  "status": "QUEUED",
  "progressStep": "QUEUED",
  "message": "분석 작업을 준비하고 있습니다.",
  "createdAt": "2026-09-15T12:30:00Z"
}
```

성공 HTTP 상태는 `202 Accepted`다.

### 5.2 작업 상태

```json
{
  "jobId": "6af9a900-...",
  "status": "RUNNING",
  "progressStep": "ANALYZING",
  "message": "손님 유형과 리뷰 특징을 분석하고 있습니다.",
  "retryable": false,
  "analysisId": null,
  "error": null,
  "createdAt": "2026-09-15T12:30:00Z",
  "updatedAt": "2026-09-15T12:31:10Z"
}
```

공개 상태는 다음으로 제한한다.

```text
QUEUED → RUNNING → COMPLETED | FAILED
```

`progressStep`은 다음 enum을 사용한다.

```text
QUEUED
RESOLVING_STORE
COLLECTING_REVIEWS
PREPROCESSING
ANALYZING
RETRIEVING_KNOWLEDGE
GENERATING_ADVICE
GENERATING_IMAGE
VALIDATING_RESULT
COMPLETED
FAILED
```

근거 없는 퍼센트 진행률은 계약하지 않는다. 앱은 단계와 메시지를 표시한다.

### 5.3 대표 실패 코드

| 코드 | retryable | 의미 |
|---|---:|---|
| `STORE_NOT_FOUND` | false | URL에서 가게를 식별하지 못함 |
| `INVALID_NAVER_PLACE_URL` | false | 허용되지 않은 URL |
| `REVIEW_COLLECTION_BLOCKED` | true | 접근 제한·페이지 변경 등으로 수집 실패 |
| `INSUFFICIENT_VALID_REVIEWS` | false | 유효 리뷰가 50건 미만 |
| `ANALYSIS_OUTPUT_INVALID` | true | 구조화 결과·근거 연결 검증 실패 |
| `IMAGE_GENERATION_FAILED` | true | 도출된 페르소나 이미지 생성 실패 |
| `ANALYSIS_TIMEOUT` | true | 목표 시간 초과 |
| `INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE` | true | 내부 분석 서비스 연결 실패 |

---

## 6. 분석 결과 계약

결과는 `분석 메타정보 → 3칸 포디움 → 선택 페르소나별 4관점 → 근거와 제안` 구조를 지원한다.

```json
{
  "analysisId": "87adf76d-...",
  "jobId": "6af9a900-...",
  "store": {
    "name": "예시 식당",
    "category": "한식",
    "naverPlaceUrl": "https://map.naver.com/..."
  },
  "metadata": {
    "platform": "NAVER",
    "collectedReviewCount": 84,
    "validReviewCount": 67,
    "collectedAt": "2026-09-15T12:30:30Z",
    "analyzedAt": "2026-09-15T12:32:00Z",
    "containsReviewsOlderThanTwoYears": true
  },
  "limitations": [
    {
      "code": "OLD_REVIEWS_INCLUDED",
      "message": "오래된 리뷰가 포함되어 현재 매장 상태와 다를 수 있습니다."
    }
  ],
  "podium": [
    {
      "rank": 1,
      "status": "FILLED",
      "topicReviewCount": 24,
      "persona": {
        "id": "57cdd38d-...",
        "label": "빠른 한 끼 손님",
        "summary": "점심시간에 빠르고 든든한 식사를 찾는 이용 상황",
        "image": {
          "id": "141f8562-...",
          "url": "/api/v1/persona-images/141f8562-...",
          "altText": "빠른 점심 식사 상황을 설명하는 AI 생성 이미지",
          "generatedByAi": true
        },
        "perspectives": {
          "positive": {},
          "negative": {},
          "perception": {},
          "priority": {}
        },
        "advice": []
      }
    },
    {
      "rank": 2,
      "status": "EMPTY",
      "reason": {
        "code": "INSUFFICIENT_TOPIC_EVIDENCE",
        "message": "리뷰 수가 적어서 손님 유형이 도출되지 않았습니다."
      },
      "persona": null
    },
    {
      "rank": 3,
      "status": "EMPTY",
      "reason": {
        "code": "INSUFFICIENT_TOPIC_EVIDENCE",
        "message": "리뷰 수가 적어서 손님 유형이 도출되지 않았습니다."
      },
      "persona": null
    }
  ]
}
```

`podium` 배열은 항상 1·2·3위 슬롯 세 개를 반환한다. 유효 토픽이 0개면 세 슬롯이 모두 `EMPTY`이고 선택할 페르소나 콘텐츠가 없다. 하나 이상이면 가장 낮은 `rank`가 최초 선택 대상이다.

### 6.1 4관점 블록

각 `perspectives` 값은 다음 구조다.

```json
{
  "reviewFacts": [
    {
      "id": "fact-...",
      "text": "점심시간에도 음식이 빠르게 나온다는 리뷰가 반복됩니다."
    }
  ],
  "aiInterpretations": [
    {
      "id": "interpretation-...",
      "text": "짧은 식사 시간이 중요한 손님에게 강점일 가능성이 있습니다."
    }
  ],
  "evidencePreview": [
    {
      "reviewId": "review-...",
      "excerpt": "점심에 갔는데 금방 나와서 좋았어요.",
      "writtenAt": "2026-08-01"
    }
  ],
  "evidenceCount": 8
}
```

대표 근거는 최대 2개다. 리뷰 작성자 닉네임·프로필·이미지·계정 식별자는 반환하지 않는다.

페르소나 이미지 URL은 영구 공개 객체 URL이 아니다. `GET /api/v1/persona-images/{imageId}`가 인증 사용자와 이미지가 속한 분석의 소유권을 확인한 뒤 이미지를 반환한다. 응답은 private cache 정책을 사용하며, 객체 저장소를 선택하더라도 외부에 노출되는 서명 URL의 짧은 수명과 재발급 방식은 구현 전 OpenAPI·보안 설정에서 확정한다.

### 6.2 제안 블록

```json
{
  "id": "advice-...",
  "reviewFact": "점심시간의 빠른 제공을 칭찬한 리뷰가 반복됩니다.",
  "suggestedAction": "점심 메뉴 안내에 빠른 제공 가능 시간을 함께 검토해 보세요.",
  "details": {
    "aiInterpretation": "시간 제약이 있는 손님의 선택 이유로 작동할 가능성이 있습니다.",
    "knowledgeReferences": [
      {
        "title": "참고 자료명",
        "locator": "문서의 확인 가능한 위치"
      }
    ]
  }
}
```

`reviewFact`와 `suggestedAction`은 기본 노출 대상이다. `details`는 펼쳐보기이며, 근거 없는 제안은 결과에서 제외한다.

---

## 7. 전체 근거 리뷰 조회

```http
GET /api/v1/analyses/{analysisId}/evidence?personaId={personaId}&perspective=POSITIVE&cursor={cursor}&limit=20
```

| 파라미터 | 규칙 |
|---|---|
| `personaId` | 요청 분석에 속한 페르소나만 허용 |
| `perspective` | `POSITIVE`, `NEGATIVE`, `PERCEPTION`, `PRIORITY`, `ADVICE` |
| `cursor` | 불투명 cursor. 클라이언트가 내부 ID 구조를 해석하지 않음 |
| `limit` | 기본 20, 최대 120. 한 분석의 공개 리뷰 수집 상한과 동일 |

응답에는 작성자 식별정보 없이 `reviewId`, `excerpt`, `rating`, `writtenAt`, `platform`만 포함한다.

```json
{
  "items": [
    {
      "reviewId": "review-...",
      "excerpt": "점심에 갔는데 금방 나와서 좋았어요.",
      "rating": 5,
      "writtenAt": "2026-08-01",
      "platform": "NAVER"
    }
  ],
  "nextCursor": "opaque-cursor-or-null"
}
```

정렬은 근거 연결 순서와 내부 식별자의 안정된 순서를 사용한다. `nextCursor`는 다음 항목이 있을 때만 반환하며 클라이언트는 값을 해석하지 않고 그대로 다음 요청에 전달한다. 잘못된 cursor는 `400 INVALID_EVIDENCE_CURSOR`, 지원하지 않는 관점이나 범위를 벗어난 `limit`은 `400 INVALID_EVIDENCE_REQUEST`다. 다른 사용자의 분석 또는 요청 분석에 속하지 않은 페르소나는 리소스 존재 여부를 노출하지 않도록 `404 ANALYSIS_NOT_FOUND`로 응답한다.

---

## 8. 저장 분석과 알림

`GET /api/v1/me/saved-analysis`는 저장본이 있으면 6장의 분석 결과 구조를 반환한다. 저장본이 없으면 `404 Not Found`와 `SAVED_ANALYSIS_NOT_FOUND`를 반환한다. 로그인 직후 분기는 4장의 `hasSavedAnalysis`를 사용하므로 이 응답을 홈 진입 여부 판정용으로 반복 호출하지 않는다.

### 8.1 저장 분석 교체

`PUT /api/v1/me/saved-analysis/{analysisId}`는 요청 사용자 소유의 완료된 분석만 허용한다. 서버는 기존 저장본을 잠근 뒤 하나의 트랜잭션에서 교체하며, 계정당 저장 분석 1개 제약을 유지한다.

```json
{
  "analysisId": "87adf76d-...",
  "savedAt": "2026-09-15T12:35:00Z"
}
```

### 8.2 알림 설정

```json
{
  "analysisResultEnabled": true
}
```

분석 완료와 실패만 대상으로 한다. 전달 방식은 MVP에서 인앱으로 제한한다.
`analysisResultEnabled`의 기본값은 `true`다. `false`로 변경하면 변경 이후 완료·실패가 확정되는 작업의 새 인앱 알림을 생성하지 않는다. 이미 생성된 알림 이력은 삭제하거나 숨기지 않으며, 설정 변경은 분석 실행·결과 저장에는 영향을 주지 않는다.

---

## 9. Spring Boot–Python 내부 계약

전송 방식은 내부 HTTP로 확정했다. Python은 `GET /internal/v1/health`와 서비스 토큰으로 보호된 `POST /internal/v1/analysis-jobs`를 구현한다. Spring은 이 요청이 반환한 완성 결과를 검증·저장하고 공개 작업을 완료한다.

| Spring Boot | Python 후보 |
|---|---|
| `POST /api/v1/analysis-jobs` | `POST /internal/v1/analysis-jobs` |
| 이후 상태·결과 조회 | Spring이 PostgreSQL에서 직접 조회 |

내부 HTTP는 다음을 요구한다.

- 외부 네트워크에 노출하지 않는다.
- 별도 서비스 자격 증명을 사용하고 timing-safe 비교를 적용한다.
- 검증된 작업 ID와 가게 정보를 Spring Boot가 전달하며 사용자 ID는 내부 서비스로 보내지 않는다.
- Python은 허용 호스트와 DNS 결과를 다시 검증하지만 사용자·작업 소유권은 Spring이 소유한다.
- Spring Boot는 Python 내부 상태와 오류를 공개 enum·오류 구조로 정규화한다.
- 연결·응답 timeout은 환경변수로 설정하고 공개 생성 API는 사용자별 `Idempotency-Key`와 요청 해시로 중복 생성을 방지한다.
- 현재 Spring 인프로세스 executor는 재시작 복구를 지원하지 않는다. 운영 전 작업 큐·lease·재조정 정책을 확정한다.

---

## 10. 미확정 항목

1. 액세스·갱신 토큰 형식과 수명·회전·폐기
2. 전화번호 인증·복구·탈퇴 API
3. 동시 분석 작업 수와 재분석 cooldown
4. 기존 결과 유지 시 미저장 결과의 접근 범위·최대 보관 시간
5. 분석 목표 처리 시간과 timeout
6. 내부 서비스 자격 증명의 저장·회전 방식
7. 객체 저장소 선택과 이미지 private cache·서명 URL 수명

미확정 값을 구현자가 임의로 채우지 않는다. 결정 후 ADR과 OpenAPI/schema/types에 반영한다.
