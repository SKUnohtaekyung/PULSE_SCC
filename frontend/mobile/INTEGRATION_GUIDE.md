# PULSE 프론트엔드 — 통합 테스트 인수인계

통합 테스트 담당자가 프론트엔드를 받아 실행하고 백엔드에 붙이기까지 필요한 것을 한곳에 모았다.
작성 2026-09-27, 기준 커밋은 로컬 브랜치 `docs/TASK-019-step0-rebaseline`의 `40e9a8a`다. 원격에는 브랜치 `feat/TASK-020-frontend-mobile`로 올린다.

이 문서는 **안내서**다. 규칙·요구사항의 정본은 따로 있고, 충돌하면 정본이 맞다(맨 아래 "정본 위치").

---

## 1. 지금 상태 한눈에

| 항목 | 상태 |
|---|---|
| 앱 | Expo 기반 Android 앱. 로그인·가입 → 가게 입력 3단계 → 분석 진행 → 첫 저장 → 결과(손님 TOP3·상세·근거) → 마이페이지까지 화면이 있다 |
| 서버 연결 | **기본은 가상 서버(fixture).** 환경변수 하나로 실제 서버 모드로 바뀐다(4장). 실제 백엔드와 붙여 본 적은 **아직 없다** |
| 실행 확인 | Android 에뮬레이터 + **Expo Go**에서만 확인했다. development build·실기기는 미실행(앱 패키지 ID·scheme 미확정) |
| 자동 검증 | `verify:tokens`·`lint`·`typecheck`·`export:android` 통과(2026-09-27). **단위 테스트·E2E·visual regression 도구는 없다**(도입하지 않기로 결정, 2026-09-27) |
| 코드 위치 | 이 저장소의 `frontend/mobile/`. 원격 main에는 아직 없다(7장) |

## 2. 기술 스택

값은 `package.json`·`app.json`에서 옮겼다. 결정 근거는 `docs/decisions/ADR-011-frontend-bootstrap.md`.

| 구분 | 버전·내용 |
|---|---|
| 런타임 | Expo SDK `~57.0.24`, React Native `0.86.3`, React `19.2.3` |
| 언어 | TypeScript `~6.0.3`, strict |
| 라우팅 | Expo Router `~57.0.22` — `src/app/` 파일 기반, typed routes 사용 |
| 빌드 실험 옵션 | `app.json`의 `experiments.reactCompiler: true` |
| 보안 저장소 | `expo-secure-store` — 로그인 토큰 보관 |
| 그림 | `react-native-svg` `15.15.4` — 하단 아이콘·손님 캐릭터 |
| 기타 | `expo-font`(Pretendard 4굵기), `expo-splash-screen`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens` |
| 정적 검사 | ESLint `^9.39.5` + `eslint-config-expo`, `tsc --noEmit` |
| 패키지 매니저 | npm + `package-lock.json` (yarn·pnpm 쓰지 않는다) |
| Node | `package.json` engines: `>=22.13.0 <25`. 확인한 값: Node `24.19.0`, npm `11.17.0` |

화면 색·간격·글자 크기는 모두 디자인 토큰(`src/design/tokens/foundation.ts`)에서 온다. 코드에 색 값을 직접 쓰지 않는다.

## 3. 개발 환경 셋팅 (Windows 기준)

### 3.1 설치할 것

1. **Node.js 22.13 이상 25 미만** (24.x 권장 — 확인한 버전)
2. **Android Studio** → SDK Manager로 Android SDK·Platform-Tools·Emulator 설치
   - 확인한 SDK 경로: `%LOCALAPPDATA%\Android\Sdk`
   - 확인한 에뮬레이터: AVD `Medium_Phone`, Android 17(API 37), 1080×2400, 420dpi
3. 에뮬레이터 안의 **Expo Go** 앱 (처음 실행 때 Expo CLI가 설치를 안내한다)

### 3.2 의존성 설치와 검증

저장소 루트에서:

```powershell
npm --prefix frontend/mobile install
npm --prefix frontend/mobile run verify:tokens   # 디자인 토큰 대비 검사
npm --prefix frontend/mobile run lint
npm --prefix frontend/mobile run typecheck
npm --prefix frontend/mobile run export:android  # Android JS 번들 빌드(결과는 git 제외 폴더 dist/)
```

2026-09-27 이 PC에서 `export:android`는 약 14초, 모듈 1423개, 번들 3.2MB였다.

### 3.3 앱 실행 — Expo Go로

`npm run start`는 `expo start --dev-client`(development build용)라서 **지금은 쓰지 않는다.** 앱 패키지 ID가 정해지기 전까지 Expo Go 모드를 명시한다.

```powershell
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = $androidSdk
$env:Path = "$androidSdk\platform-tools;$androidSdk\emulator;$env:Path"

# 에뮬레이터가 꺼져 있으면 먼저 켠다
Start-Process -FilePath "$androidSdk\emulator\emulator.exe" -ArgumentList @('-avd', 'Medium_Phone')

# Android 홈 화면이 뜬 뒤
cd frontend\mobile
npx expo start --go --android
```

이미 Metro(개발 서버, 8081 포트)가 떠 있으면 에뮬레이터에서 `exp://10.0.2.2:8081`로 다시 열 수 있다.

```powershell
adb shell am start -a android.intent.action.VIEW -d exp://10.0.2.2:8081
```

## 4. 백엔드에 붙이기

### 4.0 백엔드는 어디서 띄우나

백엔드는 이 안내서의 범위 밖이라 위치만 적는다. 2026-09-27 원격 기준으로 인증·분석·마이페이지 API가 모두 있는 브랜치는 `feat/TASK-012-analysis-pipeline`이다(TASK-011 인증 커밋 일부를 품고 있다).

- 실행 명령: 저장소 `AGENTS.md` 3장(PostgreSQL·Spring·Python)
- 진행 상황과 실행 기록: 그 브랜치의 `docs/handoffs/active/TASK-012-analysis-pipeline.md`
- 환경변수: 그 브랜치의 `backend/.env.example`. 이름만 옮기면 `POSTGRES_*`, `SPRING_DATASOURCE_URL`, `SERVER_PORT`, `ANALYSIS_SERVICE_BASE_URL`·`ANALYSIS_SERVICE_TOKEN`·`ANALYSIS_*_TIMEOUT`·`ANALYSIS_IMAGE_STORAGE_PATH`, `AUTH_ACCESS_TOKEN_SECRET`, `GOOGLE_CLIENT_ID`, `SCC_*`(분석 서비스, `SCC_OPENAI_API_KEY` 포함)이다. 실제 값은 저장소에 없고 담당자에게 받는다.
- Spring 기본 포트는 8080이다(`SERVER_PORT`). 아래 예시 주소의 8080이 이것이다.

### 4.1 모드 전환

`src/api/config.ts`가 정한다. **`EXPO_PUBLIC_API_BASE_URL` 값이 있으면 실제 서버(http) 모드, 없으면 가상 서버(fixture) 모드**다. `app.json`의 `expo.extra.apiBaseUrl`로도 줄 수 있다(환경변수가 우선).

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:8080"
cd frontend\mobile
npx expo start --go --android --clear
```

- `10.0.2.2` = 에뮬레이터에서 본 PC의 `localhost`. 실기기는 PC의 LAN 주소를 쓴다.
- `EXPO_PUBLIC_*` 값은 번들에 박힌다. 값을 바꾸면 Metro를 `--clear`로 다시 띄운다.
- 끝의 `/`는 자동으로 떼어 낸다.
- 실제 서버 모드에서는 입력 화면 위 "가상 서버 상황" 패널(`features/dev/ScenarioPanel.tsx`)과 "예시 데이터" 안내(`FixtureBanner.tsx`)가 그려지지 않는다.

### 4.2 인증 동작

- 로그인·가입 응답의 access·refresh 토큰을 `expo-secure-store`에 저장한다.
- 요청에는 `Authorization: Bearer <accessToken>`를 붙인다.
- **봉투 없는 401**을 받으면 `POST /api/v1/auth/refresh`(`{ refreshToken }`)로 한 번 갱신하고 원래 요청을 다시 보낸다. 동시에 여러 요청이 401을 받아도 갱신은 한 번만 한다(`src/api/client.ts`).
- 손님 유형 이미지는 공개 URL이 아니라 인증 헤더를 붙여 받는다(`src/api/personaImages.ts`). 서버가 준 `image.url` 앞에 base URL을 붙인다.
- **알려진 한계:** 이미지 요청은 401을 받아도 토큰 갱신·재전송을 하지 않는다(코드 주석 "§6.4, 아직 미구현"). 액세스 토큰이 만료되면 다른 API 호출이 토큰을 갱신하기 전까지 이미지가 실패로 보일 수 있다.

### 4.3 앱이 호출하는 API (`src/api/endpoints.ts`)

| 메서드 | 경로 |
|---|---|
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/register` |
| GET | `/api/v1/auth/session` |
| POST | `/api/v1/auth/refresh` |
| POST | `/api/v1/auth/logout` |
| GET | `/api/v1/legal-documents` (인증 없이) |
| POST | `/api/v1/analysis-jobs` |
| GET | `/api/v1/analysis-jobs/{jobId}` |
| GET | `/api/v1/analysis-jobs/{jobId}/result` |
| GET | `/api/v1/me/saved-analysis` |
| PUT | `/api/v1/me/saved-analysis/{analysisId}` |
| GET | `/api/v1/analyses/{analysisId}/evidence?...` |
| GET | `/api/v1/me/notifications` |
| GET·PATCH | `/api/v1/me/notification-settings` |
| GET | 이미지 — 서버가 준 `image.url` (백엔드는 `/api/v1/persona-images/{imageId}`) |

**대조 결과(2026-09-27):** 위 경로 이름은 원격 브랜치 `feat/TASK-012-analysis-pipeline`의 Spring `@*Mapping`과 모두 대응한다(`git grep`으로 확인). **요청·응답 필드가 일치하는지는 미확인**이다. 통합 테스트에서 가장 먼저 볼 곳이다.

### 4.4 이미 알려진 계약 차이·미결정

정본은 `docs/product/requirements/SCREEN_STATES.md` §11이다. 통합 테스트에 바로 걸리는 것만 옮긴다.

- 세션 응답: API.md §4.2와 실제 `AuthController.SessionResponse` 필드가 다르다. **앱은 실제 응답**(`accessTokenExpiresAt`·`refreshToken`·`refreshTokenExpiresAt`·`user.hasSavedAnalysis`)을 따랐다.
- 분석 API 오류 봉투: API.md §2.1(`fieldErrors`·`traceId`)과 현재 서버(`retryable`·`fields`·`timestamp`)가 다르다.
- 인증 실패 401의 실제 응답 형식: 미확인.
- 실패한 분석 단계: 서버가 `progressStep`을 `FAILED`로 덮어 어느 단계에서 실패했는지 앱이 알 수 없다.
- `IMAGE_GENERATION_FAILED`·`ANALYSIS_TIMEOUT` 코드와 세부 `progressStep` 기록: 결정 대기.
- RAG 지식 참고: `knowledgeReferences`가 비어서 온다.
- Refresh 회전 유예(30초): TASK-011과 TASK-012 코드 중 어느 동작을 남길지 **두 백엔드 브랜치 병합 전**에 정해야 한다.
- 분석 진행 polling 주기·백오프, 오프라인·자동 재시도 정책: 미정.

그 밖에 `STORE_NOT_FOUND` 판정 범위, 같은 `Idempotency-Key`로 실패 작업을 다시 요청할 때의 동작 등 결정 대기 항목은 §11 원문을 본다.

아래는 §11이 아니라 **코드를 보고 확인한 것**이다(2026-09-27, 원격 `feat/TASK-012-analysis-pipeline` 기준).

- 서버는 시간 초과를 DB에는 `ANALYSIS_TIMEOUT`으로 남기지만 응답 코드는 `ANALYSIS_RETRY_EXHAUSTED`로 보낸다(`AnalysisRepository.java`). 프론트는 이 코드를 따로 다루지 않는다 — `features/analysis/jobOutcome.ts`는 모르는 코드를 서버의 `retryable` 값에 따라 재시도 가능 실패 또는 다시 할 수 없는 실패로 나누고, 문구는 서버가 보낸 것을 그대로 보여 준다. 화면은 깨지지 않지만 문구가 앱의 다른 실패 문구와 톤이 다를 수 있다.

## 5. 가상 서버(fixture)로 상태 재현하기

실제 서버 없이 화면 상태를 재현할 수 있다. 가상 서버 모드에서 입력 화면 위 패널의 **바꾸기**로 상황을 고른다(`src/api/fixtures/server.ts`).

| 상황 | 내용 |
|---|---|
| 첫 분석 성공 | 손님 유형 3개까지 채워진 결과 |
| 유형 부족 | 손님 유형 2개, 빈 슬롯 1개 |
| 유형 0개 | 세 슬롯이 모두 빈 결과 |
| 이미지 조회 실패 | 1위 이미지를 불러오지 못하는 결과 |
| 리뷰 부족 | 유효 리뷰 50건 미만으로 실패 |
| 재시도 가능 실패 | 첫 시도만 실패하고 다시 시도하면 성공 |
| 서비스 문제 | 다시 시도해도 지금은 끝낼 수 없는 실패 |
| 가게 못 찾음 | 입력 화면으로 돌아가는 실패 |
| 지원하지 않는 주소 | 작업 생성 자체가 거부됨 |
| 이미지 생성 실패 | 이미지 생성 단계에서 실패 |
| 액세스 토큰 만료 | 봉투 없는 401 → 토큰 갱신 후 재전송 |
| 멱등 키 거부 | 첫 요청이 409, 새 키로 다시 요청 |

예시 계정은 로그인 화면 아래 안내에 나온다(`src/api/fixtures/server.ts`의 `fixtureAccount`). 가상 서버에는 실제 이미지가 없어 손님 그림 대신 코드로 그린 캐릭터가 나온다.

## 6. 테스트할 때 알아 둘 것

- **Android 에뮬레이터 결과가 판정 기준**이다. `npm run web`은 레이아웃을 빨리 보는 보조 수단일 뿐이다.
- `adb shell input text`는 **한글을 넣지 못한다.** 자동 입력 테스트에서는 영문 값(예: `LandTest`)을 쓴다.
- adb로 입력할 때 키보드가 안 떠 있는 상태에서 뒤로 가기(`keyevent 4`)를 보내면 **앱이 닫힌다.** 제출은 Enter(`keyevent 66`)가 안전하다.
- prop을 **지운** 변경은 Fast Refresh만으로 네이티브 뷰에 반영되지 않을 수 있다. Expo Go를 강제 종료(`adb shell am force-stop host.exp.exponent`) 뒤 다시 열어 확인한다. 가상 서버 모드는 세션이 메모리에만 있어 다시 열면 로그인부터 다시 한다. 실제 서버 모드는 SecureStore의 토큰으로 세션을 복원한다(`session/SessionProvider.tsx`).
- 제품 화면이 아닌 route(`/foundation`, `/prototype-result`, `/flow`, `/preview`)도 앱 안에 있다. 디자인 단계 견본이므로 통합 테스트 대상에서 뺀다.
- 실제 분석은 오래 걸린다. 백엔드 `.env.example` 주석 기준 수집·AI 분석·이미지 생성 한 번에 **4~6분**이다.
- 캡처 오른쪽 위의 회색 톱니 원은 **Expo Go 개발 도구 버튼**이다. 앱 UI가 아니다.
- 글자 크기 확대 확인: `adb shell settings put system font_scale 2.0` → 끝나면 원래 값으로 되돌린다.
- 캡처·접근성 트리 남기는 법은 `.claude/skills/visual-qa/SKILL.md` §0.
- 2026-09-27 고친 버그: 손님 TOP3에서 선택하지 않은 순위의 그림이 사라지던 문제(원인은 Android에서 둥근 클리핑이 SVG를 지운 것). 회귀 확인 캡처는 `docs/design/evidence/TASK-020/fix-podium-*.png`.

## 7. 코드 병합 전에 알아야 할 것

2026-09-27 `git merge-tree`로 시뮬레이션한 결과다. 아직 실제로 병합하지 않았다.

- **프론트 작업은 원격 main에 없다.** 백엔드 브랜치 `feat/TASK-011-authentication`·`feat/TASK-012-analysis-pipeline`도 main에 없다. 셋 다 main의 커밋 `b30bada` 뒤에 있다. 다만 TASK-012는 TASK-011의 커밋 `948e404`(TASK-011 앞쪽 3개 커밋)를 이미 품고 있어 두 백엔드 브랜치는 독립이 아니다.
- 파일 영역은 겹치지 않는다. 백엔드 브랜치는 `frontend/`를, 프론트 브랜치는 `backend/`를 건드리지 않았다.
- **git 충돌이 나는 파일:**
  - 프론트 ↔ TASK-011: `AGENTS.md`, `README.md`, `docs/architecture/ARCHITECTURE.md`
  - 프론트 ↔ TASK-012: `README.md`, `docs/architecture/ARCHITECTURE.md`
  - TASK-011 ↔ TASK-012: `backend/spring-api/src/test/java/kr/co/scc/api/common/config/SecurityConfigTests.java`
  - 대부분 "현재 상태" 문장이 서로 다른 것이라 두 내용을 합치면 된다.
- **git이 못 잡는 충돌 — ADR 번호 중복:** 프론트 `ADR-011-frontend-bootstrap.md`(2026-09-18 추가)와 TASK-012의 `ADR-011-durable-analysis-job-queue.md`(2026-09-25 추가)가 같은 번호다. 문자열 `ADR-011`이 들어 있는 파일은 프론트 커밋 `40e9a8a`에서 10개(ADR 자신 포함, 이 안내서 제외), TASK-012에서 2개다(`git grep -l ADR-011`). 병합 전에 한쪽 번호를 바꿔야 한다. **미결정.**
- **문서 내용 충돌:** TASK-012 브랜치의 `ARCHITECTURE.md`는 "프론트엔드는 별도 폴더 `C:\PULSE_SCC_FE`에서 관리하고 이 저장소에는 커밋하지 않는다"고 적었다. 실제로는 이 저장소 `frontend/mobile/`에 있다(ADR-011-frontend-bootstrap). 병합 때 이 문장을 고쳐야 한다.
- 프론트 브랜치는 TASK-013~020 작업을 한 브랜치에 담고 있다. PR을 나눌지는 미결정이다.

## 8. 코드 구조

```
frontend/mobile/
├─ app.json              Expo 설정
├─ scripts/              verify-design-tokens.mjs
├─ assets/               글꼴(Pretendard)·로고·아이콘
└─ src/
   ├─ app/               Expo Router route (화면 하나 = 파일 하나)
   ├─ api/               계약 타입(types.ts)·HTTP 클라이언트(client.ts)·엔드포인트·가상 서버(fixtures/)
   ├─ session/           보안 저장소와 세션 상태(SessionProvider)
   ├─ features/          화면 단위 구현(auth·analysis·result·mypage·dev). 가게 입력은 analysis/AnalyzeScreen.tsx
   ├─ components/ui/     공용 UI 컴포넌트
   ├─ components/icons/  하단 아이콘·손님 캐릭터(SVG)
   ├─ design/            토큰과 글꼴
   └─ prototypes/        디자인 단계 프로토타입 — 제품 화면 아님
```

route와 화면 상태 대응표는 `frontend/mobile/README.md` "화면 구성"에 있다.

## 9. 정본 위치

| 알고 싶은 것 | 문서 |
|---|---|
| 협업 규칙·브랜치·PR | `AGENTS.md` |
| 제품 요구사항 | `docs/product/PRD.md` |
| 화면별 상태와 남은 결정 | `docs/product/requirements/SCREEN_STATES.md` |
| API 설계 계약 | `docs/architecture/API.md` (실제 구현과 다른 곳은 4.4절) |
| 프론트 구조 검증 | `docs/architecture/FRONTEND_STRUCTURE.md` |
| 디자인 원칙 | `docs/design/DESIGN_SYSTEM.md` |
| 프론트 작업 진행 상황 | `docs/handoffs/active/TASK-020-frontend-state-model.md` |
