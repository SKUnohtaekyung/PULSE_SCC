# TASK-030 — 전시 시연용 Android APK 빌드

## Status

진행중. 휴대폰 크기 에뮬레이터에서 설치·가입·분석·이미지 저장까지 확인했다. 실제 태블릿 설치와 Google 로그인은 시작하지 않았다.

## Owner

role:platform — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`chore/TASK-030-android-apk-build` — `ui/TASK-029-design-feedback`([SKUnohtaekyung/PULSE_SCC#43](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/43), 미병합) 위에서 갈라졌다. PR #43이 먼저 병합돼야 이 브랜치의 PR이 깔끔해진다. 아직 푸시하지 않았다.

## Goal

졸업작품 전시회에서 보유한 태블릿으로 앱을 시연한다. 스토어 배포 없이 APK를 직접 설치하고, 서버는 옆에 둔 노트북에서 돌린다. Google 로그인도 붙여야 한다.

관련 이슈: 미생성
관련 요구사항: PRD FR-007(Android 앱 제공), FR-008(Google 로그인)

## Completed

- Android 패키지 이름을 `kr.co.scc.pulse`로 정했다(2026-10-09 사용자 결정).
- `expo prebuild`로 `frontend/mobile/android/`를 만들고 release APK를 빌드했다. 이 저장소의 첫 네이티브 빌드다.
- APK를 `Medium_Phone` 에뮬레이터에 설치해 Expo Go 없이 실행했다. 가입 → 가게 입력 → 분석 → 첫 저장 → 결과 화면 → 마이페이지 이미지 저장까지 동작했다.

## Changed

- `frontend/mobile/app.json` — `android.package`, `expo-build-properties` 플러그인(`usesCleartextTraffic: true`)
- `frontend/mobile/package.json`, `package-lock.json` — `expo-build-properties` 추가

`frontend/mobile/.gitignore`는 이미 `/android`·`/ios`를 무시하고 있어(ADR-011: 생성물은 커밋하지 않는다) 고치지 않았다.

## Decisions

- **USB로 서버에 붙인다**(2026-10-09 사용자 결정). APK에 서버 주소 `http://localhost:8080`을 넣어 빌드하고, 기기를 연결할 때마다 `adb reverse tcp:8080 tcp:8080`을 실행한다. 전시장 와이파이는 기기 간 통신을 막는 경우가 많다. 주소는 빌드 때 `EXPO_PUBLIC_API_BASE_URL`로 정해지므로 바꾸려면 다시 빌드한다.
- **http 접속을 허용했다.** release 빌드는 암호화되지 않은 접속을 기본으로 막는다. 시연용 설정이며 실제 배포 빌드에는 넣으면 안 된다.
- **개발용 키로 서명한다.** Expo 템플릿의 `android/app/debug.keystore`를 release 서명에도 쓴다. 시연에는 충분하지만 스토어에 올릴 수 있는 서명이 아니다.
- **계정당 저장 결과는 하나**이므로, 시연은 분석을 끝낸 계정으로 결과 화면부터 보여 주는 쪽을 권했다. 분석 한 번에 2분 반~4분이 걸리고 현장 인터넷에 달려 있다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | 미실행 | 이 브랜치에서 소스 코드를 바꾸지 않았다 |
| typecheck | 미실행 | 위와 같음 |
| test | 없음 | 프론트엔드 단위 테스트는 프로젝트에 없다 |
| build | `frontend/mobile/android`에서 `gradlew.bat assembleRelease` (`EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`, `NODE_ENV=production`, `ANDROID_HOME` 지정) | PASS — `BUILD SUCCESSFUL in 1h 6m 34s`, `app-release.apk` 약 108MB |
| 설치 | `adb install -r app-release.apk` | PASS — `Success`, versionName 1.0.0, minSdk 24, targetSdk 36 |
| Visual QA | 에뮬레이터 `Medium_Phone`(API 37), 글자 100% | 부분 확인 — 로그인, 회원가입, 빈 입력 화면, 분석 결과, 순위 바로가기, 마이페이지 카드 피드. 분석 진행·첫 저장 완료 화면은 사용자가 직접 진행해 보지 못했다 |
| 이미지 저장 | 마이페이지 `이미지 저장` | PASS — 권한 창 없이 저장됨. `/sdcard/DCIM/pulse-persona-1 (3).png` 생성 확인 |

## Unresolved

- **실제 태블릿에 설치하지 않았다.** 태블릿 폭(1024dp 이상) 배치는 TASK-028에서 들어왔지만, TASK-029로 바꾼 화면들은 휴대폰 크기에서만 확인했다. 깨지는 곳이 있을 수 있다.
- **Google 로그인 미구현.** 앱의 Google 버튼은 안내 문구만 띄운다. 로그인 라이브러리 추가, 버튼 연결, 구글 콘솔 등록이 모두 남았다. 설정 절차는 2026-10-09 세션에서 사용자에게 설명했고 문서로는 남기지 않았다.
- 서버의 `GOOGLE_CLIENT_ID`에는 Android 클라이언트 ID가 아니라 **웹 클라이언트 ID**가 들어가야 한다고 판단했다(Android 앱이 받는 ID 토큰의 대상이 웹 클라이언트 ID). `backend/.env.example`의 안내는 Android 클라이언트 ID라고 적는다. 실제 토큰으로 확인하지 않았다.
- **신규 가입은 서버 기본값으로 막혀 있다**(`LEGAL_REGISTRATION_ENABLED=false`). 이번 세션에서는 Spring을 `LEGAL_REGISTRATION_ENABLED=true` 환경 변수로 띄워 한 번만 열었다. `backend/.env`는 고치지 않았다. 전시 전에 시연용 계정을 미리 만들어 둬야 한다.
- **로컬 Spring이 뜨려면 임시 파일이 필요하다.** 이 PC의 DB에 적용된 V4 마이그레이션과 `main`의 V4 파일이 달라 Flyway 검증에서 멈춘다. `origin/fix/TASK-025-flyway-migration`의 `V4__add_analysis_job_lease.sql`과 `V6__requeue_prelease_running_analysis_jobs.sql`을 작업 폴더에 커밋 없이 덮어써 둔 상태다. TASK-025는 PR이 없다. 이 두 파일을 이 브랜치에 커밋하면 안 된다.
- APK에 모든 기기 종류(ABI)용 코드가 들어가 크다. 태블릿의 종류에 맞춰 줄일 수 있다.
- `expo-media-library` 플러그인 기본값이 읽기 권한까지 매니페스트에 넣는다(`requestLegacyExternalStorage` 포함). 줄이는 옵션을 확인하지 않았다.
- 패키지 이름 결정을 ADR로 남기지 않았다. `AGENTS.md` 2장의 로컬 실행 확인 기록과 `frontend/mobile/README.md`의 "`android.package` 미정" 서술도 고치지 않았다.

## Do Not Assume

- 에뮬레이터에서 됐다고 태블릿에서도 된다고 가정하지 않는다. 화면 크기, Android 버전, 제조사가 다르다.
- `frontend/mobile/android/`는 커밋되지 않는 생성물이다. 새로 받은 저장소에는 없으므로 `npx expo prebuild --platform android`부터 다시 해야 한다. 첫 빌드는 NDK 컴파일 때문에 1시간쯤 걸렸고, 같은 폴더에서의 다음 빌드는 훨씬 빠를 것으로 보지만 재 보지는 않았다.
- Android SDK는 2026-10-09에 다시 설치했다(`%LOCALAPPDATA%\Android\Sdk`). 그 전에 SDK 폴더가 사라져 있었다. NDK 27.1과 CMake 3.22는 빌드 중 자동으로 받아졌다.
- 서명 키 지문은 Expo 템플릿의 공용 개발 키 것이다. `prebuild --clean` 뒤에도 같은 키가 복사된다고 보지만 확인하지 않았다. Google 콘솔에 등록하기 직전에 `keytool`로 다시 확인한다.
  - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
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
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 NODE_ENV=production ./gradlew.bat assembleRelease

# 설치와 서버 연결
adb install -r frontend/mobile/android/app/build/outputs/apk/release/app-release.apk
adb reverse tcp:8080 tcp:8080
```

Expo Go로 개발할 때는 `frontend/mobile`에서 `npx expo start --go --android`를 쓴다. `CI=1`을 붙이면 파일 변경이 반영되지 않는다.

## Next Action

- 태블릿을 USB 디버깅을 켠 채 노트북에 연결해 APK를 설치하고, 결과·분석하기·마이페이지 화면을 태블릿 폭에서 확인한다.

## Last Verified Commit

이 문서를 담은 커밋. APK는 그 커밋의 `app.json`·`package.json`과 `ui/TASK-029-design-feedback`의 `2bb6ec1`(저장 뒤 캐시 삭제 수정) 시점 소스로 빌드했다.
