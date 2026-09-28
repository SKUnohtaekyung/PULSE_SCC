# ADR-011 — 프론트엔드 실행 스택과 프로젝트 경계

| | |
|---|---|
| Status | Accepted |
| Date | 2026-09-18 |
| 결정자 | 사용자 승인에 따른 `role:platform` 결정 |

## Context

[ADR-003](ADR-003-application-stack.md)은 Expo 기반 React Native·TypeScript Android 앱이라는 상위 방향만 확정했다. 실제 클라이언트를 만들려면 Expo SDK·React Native·Node 범위, package manager, routing, native project 관리 방식, development build 사용 여부와 저장소 경로를 정해야 한다.

로컬에는 Node 24.19.0과 npm 11.17.0이 있지만 Android SDK·`adb`·에뮬레이터는 없다. 따라서 JavaScript bundle까지는 로컬에서 검증하되, Android 네이티브 빌드와 실기기 Visual QA는 도구가 준비되기 전까지 완료로 기록할 수 없다.

## Decision

| 영역 | 결정 |
|---|---|
| 프로젝트 위치 | `frontend/mobile` |
| 프레임워크 | Expo SDK 57.0.24 |
| UI 런타임 | React Native 0.86.3, React 19.2.3 |
| 언어 | TypeScript 6.0.3 strict mode |
| routing | Expo Router 57.0.22, `src/app` 파일 기반 route |
| Node | `>=22.13.0 <25` |
| package manager | npm과 커밋된 `package-lock.json` |
| 개발 방식 | `expo-dev-client` development build |
| native project | Expo Continuous Native Generation. `android/`·`ios/`는 생성물로 두고 커밋하지 않음 |
| UI mode | 디자인 토큰이 없는 현재 MVP 기반에서는 light mode만 선언 |
| 보조 미리보기 | web은 빠른 레이아웃 확인에만 사용하고 Android 완료 판정 근거로 사용하지 않음 |

앱 패키지 ID, 서명, EAS 프로젝트, 배포 파이프라인은 이 결정에 포함하지 않는다. 실제 지원 기기의 기술 하한은 Expo SDK 57의 Android 7 이상이지만, 제품의 최소 지원 OS와 검증 기기 범위는 별도로 확정한다.

## Reason

- [Expo SDK 공식 버전표](https://docs.expo.dev/versions/latest/)는 SDK 57을 React Native 0.86·React 19.2.3·최소 Node 22.13.x·Android 7 이상 조합으로 제시한다.
- [create-expo-app 공식 문서](https://docs.expo.dev/more/create-expo/)는 다중 화면 앱에 TypeScript와 Expo Router가 포함된 기본 템플릿을 권장하며, npm은 `package-lock.json`이 있으면 EAS에서 기본 지원한다.
- [Expo Router 공식 구조](https://docs.expo.dev/router/basics/core-concepts/)는 route를 `src/app`에 두고 컴포넌트·hook·utility는 그 밖에 두도록 한다. 화면과 공용 UI의 소유 경계를 나누기 쉽다.
- [development build 공식 안내](https://docs.expo.dev/develop/development-builds/introduction/)는 앱스토어 배포를 목표로 하는 제품에 development build를 권장한다. Google 인증·안전 저장소 등 native 기능을 추가할 수 있어 Expo Go의 고정 native library 제한을 피한다.
- 기본 템플릿을 실제 생성한 결과 위 버전이 설치됐고 lint·TypeScript·Expo Doctor·Android bundle을 실행해 확인했다.

## Alternatives Considered

| 대안 | 채택하지 않은 이유 |
|---|---|
| Expo Go 중심 개발 | 제품용 native dependency와 설정을 자유롭게 추가할 수 없고 공식 문서도 실제 제품에는 development build를 권장한다 |
| blank TypeScript + 수동 React Navigation | 기본 템플릿이 제공하는 Router·TypeScript 설정을 다시 조합해야 하며 팀 공통 route 관례가 늦게 생긴다 |
| bare-minimum과 native 폴더 커밋 | 초기부터 Android Gradle 생성물을 직접 관리하는 비용이 늘고 현재 필요한 custom native code가 없다 |
| Yarn·pnpm | 현재 팀 환경에 npm이 이미 있고 Expo/EAS가 lockfile만으로 기본 지원한다. 별도 package manager 운영 근거가 없다 |
| Expo SDK 56 | SDK 57이 현재 안정 문서의 최신 조합이며 신규 프로젝트가 이전 SDK를 택해야 할 확인된 호환성 사유가 없다 |

## Consequences

**쉬워지는 것**

- `frontend/mobile` 안에서 install·lint·typecheck·Android bundle 명령을 재현할 수 있다.
- route와 비-route 코드 경계가 Expo Router 관례로 고정된다.
- native dependency가 필요해져도 development build와 config plugin을 사용할 수 있다.
- 생성된 native 폴더를 수동 동기화하지 않아도 된다.

**어려워지는 것**

- Android SDK 또는 EAS 환경이 없으면 APK 설치와 실제 Android Visual QA를 완료할 수 없다.
- native dependency나 app config가 바뀌면 development build를 다시 만들어야 한다.
- 현재 `npm audit`은 Expo Router와 Expo config plugin의 전이 의존성에서 moderate 14건을 보고한다. 자동 수정은 SDK와 맞지 않는 breaking downgrade를 제안하므로 적용하지 않고 Expo 호환 업데이트를 추적한다.
- dark mode, 앱 패키지 ID, 서명, EAS·CI는 후속 결정이 필요하다.
