# PULSE Mobile

Expo 기반 React Native·TypeScript Android 클라이언트다. 제품 요구사항은 저장소 루트의 `docs/product/PRD.md`, UI/UX 원칙은 `docs/design/DESIGN_SYSTEM.md`가 정본이다.

통합 테스트·백엔드 연결을 맡는다면 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)부터 읽는다.

## 요구 환경

- Node.js `>=22.13.0 <25`
- npm과 `package-lock.json`
- 실제 Android development build: Android Studio·Android SDK 또는 EAS Build 환경

2026-09-21 기준 로컬 PC에는 Android SDK·`adb`와 `Medium_Phone` 에뮬레이터(Android 17/API 37)가 있고 Expo Go 실행을 확인했다. `android.package`·scheme이 정해지지 않아 development build와 실기기 검증은 아직 수행하지 않았다.

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
| `/prototype-result`, `/flow`, `/preview` | Step 5·6 디자인 프로토타입(가상 데이터) | — |

상태 정본은 `docs/product/requirements/SCREEN_STATES.md`다.

## 서버 연결

기본값은 **가상(fixture) 서버**다. 백엔드가 아직 병합·배포되지 않아 `src/api/fixtures`의 고정 데이터로 동작한다.
fixture 모드에서는 입력 화면 위에 어떤 상황을 재현 중인지 보여주는 전환 패널이 나오고, 예시 계정은 `owner@example.com / pulse1234`다.

실제 서버에 붙일 때는 환경변수로 주소를 준다. 값이 있으면 자동으로 HTTP 모드가 된다.

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://10.0.2.2:8080"
npm run start
```

`10.0.2.2`는 Android 에뮬레이터에서 PC의 `localhost`를 가리키는 주소다. 실기기는 PC의 LAN 주소를 쓴다.
토큰은 `expo-secure-store`에 저장하고, 봉투 없는 401을 받으면 토큰을 한 번 갱신한 뒤 원래 요청을 다시 보낸다(SCREEN_STATES 공통 불변식 12).

## 코드 구조

```
src/
├─ api/          계약 타입·HTTP 클라이언트·엔드포인트·가상 서버(fixtures)
├─ session/      안전 저장소와 세션 상태(SessionProvider)
├─ components/ui 공용 UI 컴포넌트
├─ features/     화면 단위 구현(auth·analysis·result·dev)
├─ design/       토큰과 글꼴
├─ prototypes/   Step 5·6 디자인 프로토타입(제품 화면 아님)
└─ app/          Expo Router route
```
