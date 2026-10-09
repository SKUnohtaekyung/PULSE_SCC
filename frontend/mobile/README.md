# PULSE Mobile

Expo 기반 React Native·TypeScript Android 클라이언트다. 제품 요구사항은 저장소 루트의 `docs/product/PRD.md`, UI/UX 원칙은 `docs/design/DESIGN_SYSTEM.md`가 정본이다.

통합 테스트·백엔드 연결을 맡는다면 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)부터 읽는다.

## 요구 환경

- Node.js `>=22.13.0 <25`
- npm과 `package-lock.json`
- 실제 Android development build: Android Studio·Android SDK 또는 EAS Build 환경

2026-09-21 기준 로컬 PC에는 Android SDK·`adb`와 `Medium_Phone` 에뮬레이터(Android 17/API 37)가 있고 Expo Go 실행을 확인했다. `android.package`·scheme이 정해지지 않아 development build와 실기기 검증은 아직 수행하지 않았다.

2026-10-09 기준 `android.package`는 `kr.co.scc.pulse`, scheme은 `pulse-scc`로 정해졌다(`app.json`). `expo prebuild`로 만든 release APK를 빌드해 `Medium_Phone` 에뮬레이터에 설치하고 실행했다. development build와 실기기 검증은 여전히 수행하지 않았다.

**`app.json`은 암호화되지 않은 http 접속을 허용한다**(`expo-build-properties`의 `usesCleartextTraffic: true`). 전시 시연에서 앱이 노트북의 `http://localhost:8080` 서버에 붙기 위한 설정이며, 이 저장소에서 만드는 모든 Android 빌드에 적용된다. 외부에 배포하는 빌드를 만들기 전에는 이 설정을 빼거나 빌드 종류별로 나눠야 한다.

## 명령

```powershell
cd frontend\mobile
npm install
npm run verify:tokens
npm run lint
npm run typecheck
npm run export:android
npm run start
```

로컬 Android development build를 처음 만들 때:

```powershell
npm run android
```

연결한 실제 기기에 설치할 때:

```powershell
npm run android:device
```

`npm run web`은 빠른 레이아웃 확인용 보조 경로다. Android 완료 판정이나 Visual QA를 대신하지 않는다.

## 현재 범위

- Expo SDK 57, React Native 0.86, React 19.2
- Expo Router의 `src/app` 파일 기반 route
- `expo-dev-client` development build
- ESLint와 TypeScript strict 검사
- `src/design/tokens/foundation.ts`의 readonly semantic theme
- Pretendard v1.3.9 정적 굵기 4종과 토큰 대비 자동 검증

앱 패키지 ID, 서명, EAS 프로젝트, 최종 아이콘·스플래시 자산은 아직 확정하지 않았다.

## 화면 구성 (2026-09-22 Step 7 Vertical Slice)

| route | 화면 | 다루는 상태 |
|---|---|---|
| `/` | 앱 시작·세션 복원 후 분기 | `APP-BOOTING`, `AUTH-RESTORING`, `APP-READY`, `APP-FIRST-ANALYSIS-REQUIRED` |
| `/login` | 자체 계정 로그인 | `AUTH-INITIAL`·`AUTH-EDITING`·`AUTH-FIELD-ERROR`·`AUTH-SUBMITTING`·`AUTH-INVALID-CREDENTIALS`·`AUTH-EXPIRED` 안내 |
| `/signup` | 이메일 가입 | `AUTH-LEGAL-*`·`AUTH-SIGNUP-*`·`AUTH-CONSENT-OUTDATED` |
| `/analyze` | 가게 정보 입력과 분석 진행 | `STORE-*`, `ANALYSIS-*` |
| `/first-save` | 첫 저장 완료 | `SAVE-FIRST-SUCCESS` |
| `/home` | 저장된 결과 | `HOME-LOADING`·`RESULT-*` |
| `/preview-result` | 새 결과 미리보기와 저장 선택 | `RESULT-UNSAVED-PREVIEW`·`SAVE-CHOICE-REQUIRED`·`SAVE-REPLACING`·`SAVE-KEEPING` |
| `/evidence` | 근거 리뷰 전체 보기 | `EVIDENCE-*` |
| `/mypage` | 마이페이지 | `MYPAGE-*`·`NOTIFICATION-*`·`SETTING-*`·`LOGOUT-*` |
| `/foundation` | Design Foundation 견본 | — |

상태 정본은 `docs/product/requirements/SCREEN_STATES.md`다.

## 서버 연결

앱은 실제 HTTP API만 사용한다. Android 에뮬레이터 개발 모드에서는 기본 주소가 `http://10.0.2.2:8080`이고,
그 밖의 환경은 `EXPO_PUBLIC_API_BASE_URL` 또는 `expo.extra.apiBaseUrl`을 반드시 제공한다.

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:8080"
npm run start
```

`10.0.2.2`는 Android 에뮬레이터에서 PC의 `localhost`를 가리키는 주소다. 실기기는 PC의 LAN 주소를 쓴다.
토큰은 `expo-secure-store`에 저장하고, 봉투 없는 401을 받으면 토큰을 한 번 갱신한 뒤 원래 요청을 다시 보낸다(SCREEN_STATES 공통 불변식 12).

### Google 로그인

`@react-native-google-signin/google-signin`으로 계정 선택 창을 띄워 ID 토큰을 받고, 서버 `POST /api/v1/auth/google`이 검증한다.
네이티브 모듈이라 **Expo Go에서는 동작하지 않는다.** 모듈이 없으면 안내 문구를 띄우도록 했으나 Expo Go에서 직접 눌러 보지는 않았다(미확인). 설치용 빌드에서 확인한다.

Google Cloud 콘솔의 같은 프로젝트에 OAuth 클라이언트 ID가 두 개 필요하다.

| 유형 | 넣는 값 | 쓰는 곳 |
|---|---|---|
| 웹 애플리케이션 | 없음 | 앱 빌드의 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`(또는 `expo.extra.googleWebClientId`)와 서버의 `GOOGLE_CLIENT_ID`. 두 값은 같아야 한다 |
| Android | 패키지 이름 `kr.co.scc.pulse`, APK 서명 인증서의 SHA-1 | 코드에 넣지 않는다. 등록돼 있어야 Google이 이 앱에 토큰을 내준다 |

웹 클라이언트 ID는 빌드할 때 번들에 들어가므로 바꾸면 다시 빌드한다. 값이 없으면 앱은 Google 로그인을 시작하지 않는다.
패키지 이름이나 SHA-1이 등록과 다르면 계정을 고른 뒤 실패할 것으로 본다. 이때 앱은 `adb logcat`에 `Google 로그인 실패 <코드>`를 남기며 코드는 10일 것으로 예상한다(실패 경로는 실행해 보지 않았다).

## 코드 구조

```
src/
├─ api/          계약 타입·HTTP 클라이언트·엔드포인트
├─ session/      안전 저장소와 세션 상태(SessionProvider)
├─ components/ui 공용 UI 컴포넌트
├─ features/     화면 단위 구현(auth·analysis·result·mypage)
├─ design/       토큰과 글꼴
└─ app/          Expo Router route
```
