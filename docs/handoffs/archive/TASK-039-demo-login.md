# TASK-039 — 로그인 화면의 테스트 계정 버튼 (전시 시연용)

## Status

리뷰 대기. 구현하고 시연용 APK를 빌드해 에뮬레이터에서 확인했다. 커밋해 PR을 열었다. 이 방식은 시연 계정 비밀번호를 APK에 넣으므로 **PRD §8 "인증"의 예외**이고, 사용자가 그 예외를 받아들였다(2026-10-14, 아래 Decisions).

## Owner

role:feature — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`ui/TASK-039-demo-login` — `main`의 `c17b5f4`(PR #55 병합)에서 갈라졌다.

## Goal

전시 시연에서 미리 분석해 둔 "바람난 얼큰 수제비" 결과를 버튼 하나로 바로 보여 준다. 사용자 요청(2026-10-14): 로그인 화면 아래에 조그맣게, 버튼 하나만 누르면 들어오게.

관련 이슈: [SKUnohtaekyung/PULSE_SCC#56](https://github.com/SKUnohtaekyung/PULSE_SCC/issues/56) — 사용자의 구두 요청으로 시작했고, 이슈는 구현과 검토를 마친 뒤 PR과 연결하려고 만들었다
관련 요구사항: 없음 — PRD에 없는 시연용 기능이다. PRD §5 Non-Goals에 걸리는 항목은 없으나, **PRD §8 "인증"("비밀번호·Refresh Token 원문, 인증 토큰과 OpenAI API 키를 Android 앱 코드나 로그에 포함하지 않는다")과 충돌한다.**

## Completed

- 로그인 화면 맨 아래에 작은 글자 버튼 "테스트 계정으로 로그인"을 뒀다. 누르면 빌드할 때 넣은 계정으로 바로 로그인하고, 그 계정의 저장 결과 화면으로 간다.
- 버튼은 빌드할 때 `EXPO_PUBLIC_DEMO_LOGIN_EMAIL`과 `EXPO_PUBLIC_DEMO_LOGIN_PASSWORD`를 둘 다 줬을 때만 나온다. 하나라도 없으면 그리지 않는다.
- 시연 전용 계정을 이 PC의 로컬 DB에 만들고(이메일·비밀번호는 `frontend/mobile/.env.local`), 그 계정으로 바람난 얼큰 수제비(네이버 플레이스 `31264425`)를 지금 `main`의 서버 코드로 분석해 저장했다(2026-10-14, 129초 만에 완료, 유효 리뷰 120건, 손님 유형 3개 — 얼큰한 맛 찾는 손님, 생각나서 다시 온 손님, 곁들여 먹는 손님).
- 계정 정보는 저장소에 없다. `frontend/mobile/.env.local`과 그 값으로 만든 빌드 산출물(APK, `dist/`, `android/` 빌드 폴더) — 모두 `.gitignore` 대상 — 에만 있다. 비밀번호는 Agent가 무작위로 만들었고 어디에도 출력하지 않았다.
- 버튼이 들어간 release APK를 빌드해 에뮬레이터에 설치했다.

## Changed

- `frontend/mobile/src/api/config.ts` — `demoAccount`(두 빌드 값이 모두 있을 때만 값이 있다)
- `frontend/mobile/src/features/auth/LoginScreen.tsx` — 테스트 계정 버튼, 그 진행·실패 상태, 진행 중에는 다른 로그인 버튼을 막음
- `frontend/mobile/README.md` — "테스트 계정 버튼 (전시 시연용)" 절

저장소 밖에서 바꾼 것: 이 PC의 로컬 DB에 계정 1개와 분석 결과 1개, `frontend/mobile/.env.local`, 빌드 폴더의 `app-release.apk`(이전 APK는 Agent의 임시 폴더에 백업했다).

## Decisions

- **계정 정보를 코드에 넣지 않고 빌드할 때만 넣는다.** 저장소에 비밀번호가 남지 않고, 값을 빼고 빌드하면 버튼이 사라진다. 대신 넣은 값은 APK 안에 그대로 들어간다.
- **이것은 PRD §8 "인증"의 예외다.** 그 문장은 비밀번호를 Android 앱 코드에 넣지 않는다고 정한다. 사용자는 "버튼 하나만 누르면 들어오게"를 원했고 방식은 고르지 않았다(2026-10-14). 비밀번호를 APK에 넣는 위험은 Agent가 고른 방식에서 나온 것이라 독립 검토에서 지적받았고, 사용자에게 세 가지(이대로 예외로 두기, 서버 시연 모드, 버튼 없이 미리 로그인)를 물었다. **사용자 결정(2026-10-14): 지금 방식을 유지하고 시연용 빌드 한정 예외로 기록한다.** PRD 정본은 고치지 않았다(`role:product` 소유). 예외를 PRD에 남길지는 `role:product`가 정할 일이다. 비밀번호를 앱에 넣지 않는 다른 방법: 시연 기기를 미리 시연 계정으로 로그인해 두기(앱이 세션을 유지한다), 서버가 시연 모드에서만 시연 계정 세션을 내주는 전용 요청을 만들기(서버 변경과 API 계약 추가가 필요하다).
- **사용자의 기존 계정 대신 시연 전용 계정을 새로 만들었다.** 사용자는 두 방법 중 고르지 않고 "버튼 하나만 누르면 들어오게"만 원했다(2026-10-14). 기존 계정을 쓰면 그 비밀번호가 APK에 들어가고, 그 계정의 저장 결과는 보류한 TASK-038의 시험 문구로 만든 것일 수 있었다.
- **매장 주소는 로컬 DB의 2026-10-13 분석 기록에서 읽었다.** 읽기 전용 `SELECT` 하나였고, DB 접속 정보는 서비스 설정에서 프로세스가 읽어 `psql`에만 넘겼다(Agent는 `backend/.env`를 읽지 않았다).
- **공용 `Button`을 쓰지 않고 이 화면 안에서만 쓰는 글자 버튼을 만들었다.** 공용 `Button`은 넓은 버튼(primary·ghost)뿐이라 "조그맣게"를 맞출 수 없었다. 새 토큰은 없고 기존 토큰을 썼다(`typography.body7`, `colors.text.secondary`·`text.disabled`, `layout.touchTargetMin`, `spacing[2]`·`spacing[3]`). 눌림 표현은 공용 `Button`과 같은 값(`opacity: 0.9`, 크기 0.98배)을 그대로 적었다 — 이 값의 토큰은 없다. 진행 중에는 공용 `Button`처럼 작은 진행 표시를 글자 앞에 둔다(DESIGN_SYSTEM §5.4). 다만 §5.4의 "모션 감소 설정에서는 문구만"은 따르지 않는다 — 이 화면의 기존 로그인·Google 버튼도 그 설정을 넘겨받지 않아 같은 상태다. 공용 컴포넌트로 올리지 않았다.
- **APK의 Google 웹 클라이언트 ID는 이전 APK 번들에서 꺼낸 값을 그대로 넣었다.** 비밀 값이 아니고(`config.ts` 주석), 저장소에 없어 사용자에게 받아야 하던 값이다. 값은 출력하지 않았다.
- 시연 계정을 만드는 동안만 서버를 가입 허용(`-AllowSignup`)으로 띄웠고, 끝난 뒤 기본값(가입 닫힘)으로 다시 띄웠다. 가입이 닫힌 서버에서도 시연 계정 로그인은 된다(200, 저장 결과 있음).
- ADR로 남기지 않았다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | `npm --prefix frontend/mobile run lint` | PASS — 종료 코드 0 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS — 종료 코드 0 |
| 토큰 검증 | `npm --prefix frontend/mobile run verify:tokens` | PASS — `Design token verification: PASS` |
| Android 번들 | `npm --prefix frontend/mobile run export:android` | PASS — `Exported: dist` |
| test | 없음 | 프론트엔드 단위 테스트는 프로젝트에 없다 |
| APK 빌드 | `frontend/mobile/android`에서 `gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease`(`EXPO_PUBLIC_API_BASE_URL=http://localhost:8080`, 이전 APK의 웹 클라이언트 ID, `NODE_ENV=production`. 테스트 계정 값은 `.env.local`에서 Expo가 읽음) | PASS — 처음 `BUILD SUCCESSFUL in 2m 53s`, 1차 검토 반영 뒤 `1m 19s`, 2차 검토 권고 반영 뒤 `1m 9s`(지금 설치된 APK). 새 APK 번들 안에 테스트 계정 이메일·비밀번호, 웹 클라이언트 ID, `http://localhost:8080`, 버튼 문구, 고친 실패 문구가 들어 있음을 확인했다 |
| 설치 | `adb install -r app-release.apk`(`Medium_Phone`) | PASS — `Success`(세 빌드 모두) |
| Visual QA | `Medium_Phone` 에뮬레이터(Android 17, 1080×2400, 420dpi, 글자 100%), release APK | 부분 PASS — 아래 표 |
| 독립 검토 | `reviewer` 서브에이전트 2회 | 1차 FAIL — 차단 1건: PRD §8 "인증"과의 충돌을 이 문서가 적지 않았다 → 사용자 결정(예외 유지)을 받아 적음. 비차단 지적(README의 빌드 경로 안내, 실패 문구, 진행 표시, 눌림 값, 가운데 정렬, 공개 저장소의 이메일, 공백 비밀번호)도 반영. 2차 PASS. 2차의 비차단 권고 가운데 실패 문구가 원인을 단정하지 않게 고친 것과 글자 줄임(`flexShrink`)을 반영해 다시 빌드했다 — 이 마지막 수정은 다시 검토받지 않았다 |

**Visual QA (2026-10-14)**

| 항목 | 결과 |
|---|---|
| 로그인 화면 | 버튼이 Google 버튼 아래 가운데에 회색 밑줄 글자로 나온다. 주요 버튼보다 눈에 덜 띈다 |
| 누르기 | 바람난 얼큰 수제비 결과 화면이 바로 열렸다(리뷰 120건, 손님 유형 3개, 그림 3장) |
| 검토 반영 뒤 | 마지막으로 빌드한 APK로 로그아웃 → 로그인 화면 → 버튼 누르기 → 바람난 얼큰 수제비 결과 화면까지 다시 확인했다. 로그인 화면의 접근성 트리를 다시 떠 버튼이 `android.widget.Button`, 이름 "테스트 계정으로 로그인", 높이 116px로 반영 전과 같은 것을 확인했다. 아래 실패·글자 200% 행은 반영 전 APK로 본 것이다. 바뀐 실패 문구("이 서버에서 테스트 계정으로 로그인하지 못했어요…")는 화면에 띄워 보지 않았다(시연 계정을 지우거나 비밀번호를 바꿔야 해서 하지 않았다) |
| 접근성 | `android.widget.Button`, 이름 "테스트 계정으로 로그인", 누를 수 있는 높이 116px(=44dp, `layout.touchTargetMin`과 같다) |
| 실패 | 서버 포트 연결(`adb reverse`)을 끊고 앱을 다시 켠 뒤 누름 → "로그인하지 못했어요 / 인터넷에 연결되지 않았어요. 연결한 뒤 다시 시도해 주세요."가 뜨고 버튼을 다시 누를 수 있다. 확인 뒤 포트를 다시 이었다 |
| 글자 200% | 버튼 글자가 한 줄로 들어가고 넘치지 않는다. 확인 뒤 글자 크기를 1.0으로 되돌렸다 |
| 진행 중 | **미확인** — 로컬 서버라 응답이 빨라 진행 표시와 "테스트 계정으로 들어가는 중이에요" 문구, 다른 버튼이 막힌 모습을 캡처하지 못했다. 코드로만 확인했다 |
| 넓은 화면·TalkBack 발화·실제 태블릿 | **미확인** |

캡처는 저장소에 넣지 않았다(Agent의 임시 폴더에만 있다).

## Unresolved

- **계정 정보가 APK 안에 그대로 들어간다.** APK를 풀면 누구나 시연 계정의 이메일과 비밀번호를 볼 수 있다. 시연 계정에는 바람난 얼큰 수제비 분석 결과 말고는 없고, 서버는 이 노트북에서만 돌며 앱은 USB로 이은 기기에서만 그 서버에 닿는다. 배포용 빌드에는 넣지 않는다.
- **이 PC에 `.env.local`이 있는 동안에는 이 PC에서 하는 모든 빌드와 개발 실행(Expo Go 포함)에 버튼이 들어간다.** `expo lint`도 그 파일을 읽는다(검토자가 확인). 배포용 빌드 전에 그 파일을 지우거나 두 값을 뺀다. README에도 적었다.
- 저장소는 공개(PUBLIC)다. 시연 계정의 이메일은 이 문서나 PR에 적지 않는다.
- **시연 계정은 이 PC의 로컬 DB에만 있다.** `scripts\reset-db.ps1`로 DB를 초기화하면 계정과 결과도 사라진다. 다시 만들려면 서버를 `-AllowSignup`으로 띄워 같은 이메일·비밀번호로 가입하고(값은 `.env.local`), 그 계정으로 바람난 얼큰 수제비를 다시 분석한다. 이것을 하는 스크립트는 저장소에 넣지 않았다. 다른 PC에서 시연하려면 그 PC의 DB에도 같은 계정과 결과가 있어야 한다.
- 시연 계정의 가입 전화번호는 실제 번호가 아닌 `01000000000`이다.
- 화면 상태 정본(`docs/product/requirements/SCREEN_STATES.md`)과 디자인 원칙(`docs/design/DESIGN_SYSTEM.md`)에 이 버튼이 없다. 시연용이라 정본에 넣을지는 `role:product`·`role:design-system`이 정할 일이다. 고치지 않았다.
- 시연 계정의 결과에서도 손님 유형 이름 "생각나서 다시 온 손님"이 포디움에서 "손/님"으로 갈린다(이미 알려진 문제, [TASK-030](../active/TASK-030-android-apk-build.md) "분석에 대해 알아 둘 것").
- 에뮬레이터의 앱은 시연 계정으로 로그인된 상태로 두었다. 사용자가 원래 쓰던 계정은 에뮬레이터에서 로그아웃됐다(계정 자체는 그대로다).

## Do Not Assume

- 버튼은 빌드할 때 두 값이 있어야 나온다. `EXPO_PUBLIC_*` 값을 바꾼 뒤에는 `:app:createBundleReleaseJsAndAssets --rerun`으로 번들을 다시 만들어야 APK에 들어간다([TASK-030](../active/TASK-030-android-apk-build.md) Do Not Assume).
- 버튼이 보여도 서버에 그 계정과 저장 결과가 없으면 결과 화면이 열리지 않는다(로그인 실패 또는 빈 홈).
- 이 APK의 웹 클라이언트 ID는 이전 APK에서 꺼낸 값이다. 서버의 `GOOGLE_CLIENT_ID`가 바뀌었다면 다시 맞춰야 한다. 새 APK로 Google 로그인은 눌러 보지 않았다.

## Next Action

- 실제 태블릿에 새 APK를 설치한다(`.\scripts\demo-start.ps1 -InstallApk`). PRD §8 예외를 정본에 남길지 `role:product`에 넘기는 `[SPEC]` 이슈는 아직 만들지 않았다.

## Last Verified Commit

`9ad5887`. lint·typecheck·토큰 검증·Android 번들은 이 커밋의 내용으로 커밋 직전에 실행했다. 지금 에뮬레이터에 설치된 APK도 이 커밋의 소스로 빌드했다(`BUILD SUCCESSFUL in 1m 9s`). 이 커밋 뒤의 커밋은 이 문서만 고쳤다.
