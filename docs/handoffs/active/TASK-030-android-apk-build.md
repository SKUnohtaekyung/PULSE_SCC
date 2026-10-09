# TASK-030 — 전시 시연용 Android APK 빌드

## Status

진행중. 휴대폰 크기 에뮬레이터에서 설치·가입·분석·이미지 저장까지 확인했다. Google 로그인은 앱 코드를 연결했고 에뮬레이터에서 로그인에 성공했다(2026-10-09 사용자 확인). 이 확인은 reviewer 지적을 반영하기 전 빌드에서 한 것이고, 반영한 뒤의 빌드로는 다시 로그인해 보지 않았다. 실제 태블릿 설치는 시작하지 않았다.

## Owner

role:platform — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`chore/TASK-030-android-apk-build` — `ui/TASK-029-design-feedback`([SKUnohtaekyung/PULSE_SCC#43](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/43)) 위에서 갈라졌다. PR #43은 2026-10-09에 `main`으로 병합됐고(`f69cc51`), 이 브랜치도 같은 날 푸시했다. 이 브랜치 위에 `ui/TASK-031-analysis-progress`와 `feat/TASK-032-analysis-progress-steps`가 쌓여 있다.

## Goal

졸업작품 전시회에서 보유한 태블릿으로 앱을 시연한다. 스토어 배포 없이 APK를 직접 설치하고, 서버는 옆에 둔 노트북에서 돌린다. Google 로그인도 붙여야 한다.

관련 이슈: 미생성
관련 요구사항: PRD FR-007(Android 앱 제공), FR-008(Google 로그인)

## Completed

- Android 패키지 이름을 `kr.co.scc.pulse`로 정했다(2026-10-09 사용자 결정).
- `expo prebuild`로 `frontend/mobile/android/`를 만들고 release APK를 빌드했다. 이 저장소의 첫 네이티브 빌드다.
- APK를 `Medium_Phone` 에뮬레이터에 설치해 Expo Go 없이 실행했다. 가입 → 가게 입력 → 분석 → 첫 저장 → 결과 화면 → 마이페이지 이미지 저장까지 동작했다.
- 로그인 화면의 Google 버튼을 실제 로그인 흐름에 연결했다(2026-10-09). 계정 선택 → ID 토큰 → 서버 `POST /api/v1/auth/google` → 세션 저장. 진행 중·취소·실패·같은 이메일 계정 있음 상태를 나눠 안내한다(SCREEN_STATES §3.2 `AUTH-GOOGLE-*`).

## Changed

- `frontend/mobile/app.json` — `android.package`, `expo-build-properties` 플러그인(`usesCleartextTraffic: true`)
- `frontend/mobile/package.json`, `package-lock.json` — `expo-build-properties` 추가

아래는 2026-10-09 Google 로그인 작업분이다.

- `frontend/mobile/package.json`, `package-lock.json` — `@react-native-google-signin/google-signin` 16.1.5 추가
- `frontend/mobile/src/features/auth/googleSignIn.ts` — 신규. 계정 선택 창을 띄워 ID 토큰을 받는다
- `frontend/mobile/src/features/auth/LoginScreen.tsx` — Google 버튼 연결, 버튼 문구 `Google로 회원가입` → `Google로 계속하기`
- `frontend/mobile/src/api/config.ts` — `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 읽기
- `frontend/mobile/README.md`, `backend/README.md`, `backend/.env.example` — 클라이언트 ID 안내
- `frontend/mobile/README.md` — 2026-10-09 기준 네이티브 빌드 상태와 http 접속 허용 경고(reviewer 지적 반영)

`frontend/mobile/.gitignore`는 이미 `/android`·`/ios`를 무시하고 있어(ADR-011: 생성물은 커밋하지 않는다) 고치지 않았다.

## Decisions

- **USB로 서버에 붙인다**(2026-10-09 사용자 결정). APK에 서버 주소 `http://localhost:8080`을 넣어 빌드하고, 기기를 연결할 때마다 `adb reverse tcp:8080 tcp:8080`을 실행한다. 전시장 와이파이는 기기 간 통신을 막는 경우가 많다. 주소는 빌드 때 `EXPO_PUBLIC_API_BASE_URL`로 정해지므로 바꾸려면 다시 빌드한다.
- **http 접속을 허용했다.** release 빌드는 암호화되지 않은 접속을 기본으로 막는다. 시연용 설정이며 실제 배포 빌드에는 넣으면 안 된다.
- **개발용 키로 서명한다.** Expo 템플릿의 `android/app/debug.keystore`를 release 서명에도 쓴다. 시연에는 충분하지만 스토어에 올릴 수 있는 서명이 아니다.
- **Google 로그인은 `@react-native-google-signin/google-signin`(네이티브 계정 선택 창)으로 한다.** Firebase를 쓰지 않으므로 이 라이브러리의 Expo 플러그인은 `app.json`에 넣지 않았다(옵션 없이 넣으면 `google-services.json`을 요구한다). Expo Go에는 이 모듈이 없어, 버튼을 누를 때 네이티브 모듈이 있는지 먼저 확인하고 없으면 안내 문구를 띄운다(Expo Go에서 직접 눌러 보지 않았다 — 미확인). 불러오기를 `try/catch`로 감싸는 방식은 Metro가 예외를 삼켜 동작하지 않는다(reviewer 지적). ADR로 남기지 않았다.
- **토큰을 받은 직후 Google 쪽 로그인 상태를 지운다.** 남겨 두면 다음에 계정 선택 창 없이 같은 계정으로 들어가 시연 중 계정을 바꿀 수 없다. 앱의 세션은 서버 토큰으로 유지된다.
- **계정당 저장 결과는 하나**이므로, 시연은 분석을 끝낸 계정으로 결과 화면부터 보여 주는 쪽을 권했다. 분석 한 번에 2분 반~4분이 걸리고 현장 인터넷에 달려 있다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | `npm run lint` (`frontend/mobile`, 2026-10-09 Google 로그인 작업 뒤) | PASS — 출력 없음 |
| typecheck | `npm run typecheck` | PASS — 출력 없음 |
| 토큰 검증 | `npm run verify:tokens` | PASS — `Design token verification: PASS` |
| Android bundle | `npm run export:android` | PASS — `entry-….hbc (3.2MB)`, `Exported: dist` |
| build (Google 모듈 포함) | `gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease` (웹 클라이언트 ID 지정) | PASS — `BUILD SUCCESSFUL in 1m 59s`. APK 번들 안에 클라이언트 ID 1회, dex 안에 `RNGoogleSignin` 확인. 모듈을 처음 넣은 빌드는 9m 17s |
| 설치 | `adb install -r app-release.apk` (`Medium_Phone`) | PASS — `Success`. 기존 로그인 세션이 유지돼 결과 화면으로 열림 |
| 서버 설정 | Spring을 `GOOGLE_CLIENT_ID`·`LEGAL_REGISTRATION_ENABLED=true` 환경 변수로 띄운 뒤 가짜 토큰으로 `POST /api/v1/auth/google` | 설정 전 `503 GOOGLE_AUTH_NOT_CONFIGURED` → 설정 후 `INVALID_GOOGLE_ID_TOKEN` |
| Google 로그인 실제 동작 | `Medium_Phone` 에뮬레이터에서 `Google로 계속하기` | 부분 확인 — 로그인 성공(2026-10-09 사용자가 직접 진행하고 결과를 알려 줌. Agent는 화면을 보지 않았다). 취소·실패·같은 이메일 계정 있음 안내는 미실행. **성공 확인은 reviewer 지적 반영 전 빌드 기준이다.** 그 뒤 토큰을 받는 코드(모듈 확인, 불러오는 방식, Google 로그아웃을 기다리지 않음)를 고쳐 다시 빌드(`BUILD SUCCESSFUL in 1m 51s`)·설치(`Success`)했으나 그 빌드로는 로그인하지 않았다 |
| 독립 검토 | `reviewer` 서브에이전트 2회 | 1차 FAIL(Expo Go 대비 `try/catch`가 동작하지 않음) → 수정 뒤 2차 PASS. 2차는 코드 판독과 lint·typecheck 근거다 |
| test | 없음 | 프론트엔드 단위 테스트는 프로젝트에 없다 |
| build | `frontend/mobile/android`에서 `gradlew.bat assembleRelease` (`EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`, `NODE_ENV=production`, `ANDROID_HOME` 지정) | PASS — `BUILD SUCCESSFUL in 1h 6m 34s`, `app-release.apk` 약 108MB |
| 설치 | `adb install -r app-release.apk` | PASS — `Success`, versionName 1.0.0, minSdk 24, targetSdk 36 |
| Visual QA | 에뮬레이터 `Medium_Phone`(API 37), 글자 100% | 부분 확인 — 로그인, 회원가입, 빈 입력 화면, 분석 결과, 순위 바로가기, 마이페이지 카드 피드. 분석 진행·첫 저장 완료 화면은 사용자가 직접 진행해 보지 못했다 |
| 이미지 저장 | 마이페이지 `이미지 저장` | PASS — 권한 창 없이 저장됨. `/sdcard/DCIM/pulse-persona-1 (3).png` 생성 확인 |

## Unresolved

- **실제 태블릿에 설치하지 않았다.** 태블릿 폭(1024dp 이상) 배치는 TASK-028에서 들어왔지만, TASK-029로 바꾼 화면들은 휴대폰 크기에서만 확인했다. 깨지는 곳이 있을 수 있다.
- **Google 로그인의 취소·실패 안내를 기기에서 보지 않았다.** 성공 경로만, 그것도 reviewer 지적 반영 전 빌드에서만 확인됐다. 전시 전에 지금 APK로 다시 눌러 본다. 태블릿에서도 해 보지 않았다. 구글 콘솔 등록 내용은 `frontend/mobile/README.md` "Google 로그인" 절에 적었다.
- 서버의 `GOOGLE_CLIENT_ID`에는 Android 클라이언트 ID가 아니라 **웹 클라이언트 ID**가 들어간다. 서버를 웹 클라이언트 ID로 띄운 상태에서 실제 로그인이 성공해 확인됐다(2026-10-09). 앱 코드와 `backend/.env.example`·`backend/README.md`를 그렇게 맞췄다.
- 2026-10-09 확인 때 Spring은 `GOOGLE_CLIENT_ID`·`LEGAL_REGISTRATION_ENABLED=true`를 환경 변수로 붙여 띄웠다. `backend/.env`에 값이 들어 있는지는 Agent가 읽을 수 없어 미확인이다. 구글 콘솔의 게시 상태(테스트/프로덕션)와 테스트 사용자 목록도 미확인이다.
- Google로 처음 들어오는 계정은 서버가 새로 만든다. 가입이 닫혀 있으면(`LEGAL_REGISTRATION_ENABLED=false`) `503 REGISTRATION_NOT_AVAILABLE`로 거부되고 앱은 서버 문구를 그대로 보여 준다. 이메일 가입과 달리 이 경로는 약관 동의를 받지 않는다 — 기존 서버 동작이며 이번에 바꾸지 않았다.
- `docs/product/requirements/SCREEN_STATES.md`(Google 로그인 "구현하지 않았다")와 `docs/design/DESIGN_SYSTEM.md` §AuthMethodSelector("미구현") 서술을 고치지 않았다. `role:product`·`role:design-system` 소유다.
- 버튼 문구를 `Google로 계속하기`로 바꾼 것은 디자인 검토를 받지 않았다. 이 버튼은 가입과 로그인을 모두 한다.
- **신규 가입은 서버 기본값으로 막혀 있다**(`LEGAL_REGISTRATION_ENABLED=false`). 이번 세션에서는 Spring을 `LEGAL_REGISTRATION_ENABLED=true` 환경 변수로 띄워 한 번만 열었다. `backend/.env`는 고치지 않았다. 전시 전에 시연용 계정을 미리 만들어 둬야 한다.
- **로컬 Spring이 뜨려면 임시 파일이 필요하다.** 이 PC의 DB에 적용된 V4 마이그레이션과 `main`의 V4 파일이 달라 Flyway 검증에서 멈춘다. `origin/fix/TASK-025-flyway-migration`의 `V4__add_analysis_job_lease.sql`과 `V6__requeue_prelease_running_analysis_jobs.sql`을 작업 폴더에 커밋 없이 덮어써 둔 상태다. TASK-025는 PR이 없다. 이 두 파일을 이 브랜치에 커밋하면 안 된다.
- APK에 모든 기기 종류(ABI)용 코드가 들어가 크다. 태블릿의 종류에 맞춰 줄일 수 있다.
- `expo-media-library` 플러그인 기본값이 읽기 권한까지 매니페스트에 넣는다(`requestLegacyExternalStorage` 포함). 줄이는 옵션을 확인하지 않았다.
- 패키지 이름 결정을 ADR로 남기지 않았다. `frontend/mobile/README.md`에는 2026-10-09 기준 상태를 덧붙였으나, 아래 문서의 "`android.package` 미정"·"네이티브 development build·실기기 검증 미실행" 서술은 고치지 않았다: `AGENTS.md` 2장 로컬 실행 확인 기록, `docs/architecture/FRONTEND_STRUCTURE.md`(94·95·126~127줄 부근), `.claude/skills/visual-qa/SKILL.md`(15줄 부근).

## Do Not Assume

- 에뮬레이터에서 됐다고 태블릿에서도 된다고 가정하지 않는다. 화면 크기, Android 버전, 제조사가 다르다.
- `frontend/mobile/android/`는 커밋되지 않는 생성물이다. 새로 받은 저장소에는 없으므로 `npx expo prebuild --platform android`부터 다시 해야 한다. 첫 빌드는 NDK 컴파일 때문에 1시간쯤 걸렸고, 같은 폴더에서의 다음 빌드는 훨씬 빠를 것으로 보지만 재 보지는 않았다.
- Android SDK는 2026-10-09에 다시 설치했다(`%LOCALAPPDATA%\Android\Sdk`). 그 전에 SDK 폴더가 사라져 있었다. NDK 27.1과 CMake 3.22는 빌드 중 자동으로 받아졌다.
- 서명 키 지문은 Expo 템플릿의 공용 개발 키 것이다. `prebuild --clean` 뒤에도 같은 키가 복사된다고 보지만 확인하지 않았다. Google 콘솔에 등록하기 직전에 `keytool`로 다시 확인한다.
  - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **`EXPO_PUBLIC_*` 값만 바꿔 `assembleRelease`를 다시 돌리면 값이 APK에 들어가지 않는다.** Gradle이 JS 번들 작업을 최신으로 보고 건너뛴다(2026-10-09 실제로 겪음: `BUILD SUCCESSFUL`인데 번들 시각이 그대로였고 APK 안에 클라이언트 ID가 없었다). `./gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease`로 번들을 강제로 다시 만들고, `unzip -p app-release.apk assets/index.android.bundle | grep -a -c <값>`으로 확인한다.
- Expo Go와 설치용 앱은 별개 앱이다. 로그인 정보와 저장 데이터를 공유하지 않는다.

## 실행 방법 메모

저장소 루트 기준이다. PostgreSQL은 Windows 서비스(`postgresql-x64-18`)로 떠 있다.

```bash
# 서버 (각각 따로 실행). 신규 가입이 필요하면 Spring 앞에 LEGAL_REGISTRATION_ENABLED=true 를 붙인다
cd backend/spring-api && ./gradlew.bat bootRun
cd backend/python-analysis && ./.venv/Scripts/python.exe -m scc_analysis

# 에뮬레이터
"$LOCALAPPDATA/Android/Sdk/emulator/emulator.exe" -avd Medium_Phone

# APK 다시 빌드 (frontend/mobile/android 에서)
# EXPO_PUBLIC_* 값을 바꿨으면 번들 작업을 강제로 다시 돌린다(Do Not Assume 참고)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<웹 클라이언트 ID> NODE_ENV=production ./gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease

# 설치와 서버 연결
adb install -r frontend/mobile/android/app/build/outputs/apk/release/app-release.apk
adb reverse tcp:8080 tcp:8080
```

Expo Go로 개발할 때는 `frontend/mobile`에서 `npx expo start --go --android`를 쓴다. `CI=1`을 붙이면 파일 변경이 반영되지 않는다.

## Next Action

- 지금 APK로 Google 로그인 성공과 취소 안내를 다시 확인한다.
- 태블릿을 USB 디버깅을 켠 채 노트북에 연결해 APK를 설치하고, 결과·분석하기·마이페이지 화면을 태블릿 폭에서 확인한다.

## Last Verified Commit

`3d1919b`(Google 로그인 연결). lint·typecheck·토큰 검증·Android 번들은 그 커밋의 소스로 실행했다. 에뮬레이터에 설치했던 APK도 같은 소스로 빌드했다. 그 뒤의 커밋은 문서(이 문서와 `frontend/mobile/README.md`)만 고쳤다. 로그인 화면(`LoginScreen.tsx`, `googleSignIn.ts`)과 `api/config.ts`는 이 브랜치에서 바뀌었고, 그 밖의 화면 소스는 `ui/TASK-029-design-feedback`의 `2bb6ec1` 시점 그대로다.
