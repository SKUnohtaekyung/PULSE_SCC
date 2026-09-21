# PULSE Mobile

Expo 기반 React Native·TypeScript Android 클라이언트다. 제품 요구사항은 저장소 루트의 `docs/product/PRD.md`, UI/UX 원칙은 `docs/design/DESIGN_SYSTEM.md`가 정본이다.

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

앱 패키지 ID, 서명, EAS 프로젝트, 최종 아이콘·스플래시 자산은 아직 확정하지 않았다. 현재 첫 화면은 Design Foundation을 렌더링하는 개발용 견본이고 기본 이미지 자산은 임시값이므로 제품 UI 완료 증거가 아니다.
