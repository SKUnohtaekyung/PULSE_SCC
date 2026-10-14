# TASK-030 — 전시 시연용 Android APK 빌드

## Status

진행중. 코드는 모두 `main`에 들어갔다(2026-10-14 기준 `88ac9dc`). 남은 것은 **실제 태블릿에서의 확인과 리허설**이다. 에뮬레이터에서는 설치·가입·분석·저장·Google 로그인(성공은 2026-10-09 빌드, 계정 선택 창과 취소 안내는 2026-10-12 빌드)과 테스트 계정 버튼(2026-10-14 빌드)을 확인했다. 지금 상태와 이어서 할 일은 바로 아래 "세션 인수인계"에 있다.

## 세션 인수인계 (2026-10-14) — 여기부터 읽는다

이 절은 2026-10-13~14 세션이 끝난 시점의 상태다. 아래 다른 절은 TASK-030 자체의 기록이고, 서로 다르면 이 절이 최신이다.

### 지금 상태

- **Git**: `main` = `origin/main` = `88ac9dc`. 이 절과 TASK-039 인계 문서의 `archive/` 이동은 브랜치 `docs/TASK-030-handover-1014`에서 했다 — **이 절이 `main`에 들어갔는지 먼저 확인한다**(`git grep -c "세션 인수인계 (2026-10-14)" main -- docs/handoffs/active/TASK-030-android-apk-build.md` 이 1 이상이면 들어간 것이다).
- **2026-10-09~14에 `main`으로 들어간 것**(#44~#51, #53, #55, #57은 독립 검토 PASS를 받은 뒤 병합했다. #57은 PASS 뒤의 비차단 권고 두 가지(실패 문구, 글자 줄임)를 반영한 마지막 수정을 다시 검토받지 않았다. #43은 그 전에 만들어진 PR이고 그 검토 기록은 [TASK-029](../archive/TASK-029-design-feedback.md)에 있다. 그 문서에서 마지막 검토가 PASS로 끝났는지는 확인하지 못했다):

  | PR | TASK | 내용 |
  |---|---|---|
  | #43 | 029 | 팀 디자인 피드백 반영 |
  | #44 | 030 | 전시용 APK 빌드 설정, Google 로그인 연결 |
  | #45 | 031 | 분석 중 퍼센트 게이지 팝업 |
  | #46 | 032 | 서버가 분석·이미지 생성 단계를 알려 줌 |
  | #47 | 025 | Flyway V4 복구, 보정을 V6으로 분리 |
  | #48 | 033 | 마이페이지 태블릿 가로 배치, 로그아웃 문구 |
  | #49 | 034 | 시연 당일 실행 스크립트 `scripts\demo-start.ps1` |
  | #50 | 035 | 뒤집히는 신분증 모양 손님 유형 카드 |
  | #51 | 036 | 로컬 DB 초기화 스크립트 `scripts\reset-db.ps1` |
  | #53 | 037 | 분석 소요 시간 단축(2026-10-13) |
  | #55 | 030 | 병합된 TASK 인계 문서를 `archive/`로 옮기고 세션 인수인계 갱신(2026-10-13) |
  | #57 | 039 | 로그인 화면의 시연용 테스트 계정 버튼(2026-10-14) |

- **시연 준비 상태(2026-10-14)**: 로그인 화면 맨 아래의 작은 **"테스트 계정으로 로그인"** 을 누르면 시연 전용 계정으로 들어가 매장 "바람난 얼큰 수제비"의 저장 결과(유효 리뷰 120건, 손님 유형 3개 — 얼큰한 맛 찾는 손님, 생각나서 다시 온 손님, 곁들여 먹는 손님)가 바로 열린다. 결과는 2026-10-14에 `main`의 서버 코드로 만들었다. 자세한 것은 [TASK-039](../archive/TASK-039-demo-login.md).
  - 시연 계정의 이메일·비밀번호는 `frontend/mobile/.env.local`(커밋 안 됨)에만 있고 이 문서에 적지 않는다. 그 값은 시연용 APK 안에 그대로 들어간다 — **PRD §8 "인증"의 시연 빌드 한정 예외이며 사용자가 받아들였다**(2026-10-14). 이 APK 파일을 다른 사람에게 주지 않는다.
  - 버튼은 빌드할 때 그 두 값이 있어야 나온다. `.env.local`이 있는 이 PC에서는 앞으로 하는 모든 빌드에 버튼이 들어간다. 배포용 빌드 전에는 그 파일을 지운다.
- **보류한 작업 — 분석 문구 구체화(TASK-038)**: 로컬 브랜치 `feat/TASK-038-specific-insights`(`7cd935d`)에만 있다. **원격에 올리지 않아 이 PC에만 있다.** 독립 검토 2회 모두 FAIL이라 PR을 만들지 않았다. 남은 문제는 그 브랜치의 `docs/handoffs/active/TASK-038-specific-insights.md` Unresolved에 있다: 제안이 "○○에 적으세요" 꼴로 굳고 불만을 고치라는 제안이 사라진다, 같은 리뷰에서 손님 유형 수가 1개와 3개로 갈린다, 느렸던 분석 호출이 모두 그 문구 계열이었다. 그 문서는 [TASK-037](../archive/TASK-037-analysis-speed.md)을 `active/` 경로로 가리키므로 이어서 할 때 링크를 `../archive/`로 고친다. **시연에는 `main`을 쓴다.**
- **열린 PR**: #41(TASK-023 로그인·가입 시도 제한) 하나. `main`과 충돌한다(2026-10-13 확인). 시연에는 필요 없고, 병합하면 시연 중 로그인 제한에 걸릴 수 있어 시연 뒤로 미루기를 권했다.
- **로컬 DB**: 2026-10-13 아침에 사용자가 `reset-db.ps1`로 전체 초기화했다. 그 뒤 시연 전용 계정을 만들었고, 사용자가 초기화 뒤 가입한 계정(들)이 있다 — **계정 목록은 조회하지 않았다.** `backend\storage\personas`에 분석 폴더가 5개 있다(2026-10-13 11:39, 11:44, 21:14, 21:43, 2026-10-14 13:19 KST). 2026-10-13 아침 두 번은 Agent가 돌린 것이 아니어서 사용자가 새로 가입해 돌린 것으로 보고, 밤 두 번(21:14, 21:43)은 사용자가 에뮬레이터 앱에서 돌렸다고 알려 준 것이다. 21:43의 결과는 `main`에 없는 TASK-038 시험 문구로 만든 것이다. 사용자 계정에 어느 결과가 저장돼 있는지는 미확인이다. **`reset-db.ps1`을 실행하면 시연 계정과 결과도 사라진다.**
- **실행 중인 것**: SCC 서버는 없다. 2026-10-14에 사용자 요청으로 SCC의 Spring·Python 서버와 서버 창, 에뮬레이터를 껐다. **그런데 2026-10-14 15:29에 보니 8080·8000 포트를 다른 프로젝트의 서버가 쓰고 있다**(8080은 `java.exe`, 8000은 `C:\programworks\PULSE\pulse_python\.venv\Scripts\python.exe run_server.py`, 둘 다 15:20에 시작. 이 세션이 띄운 것이 아니다). 그대로 `demo-start.ps1`을 돌리면 그 서버를 SCC 서버로 여긴다(아래 함정). PostgreSQL은 Windows 서비스(`postgresql-x64-18`, 5432 포트)로 떠 있다. **Docker Desktop은 꺼져 있다**(2026-10-14 15:24에 `docker info`가 응답하지 않음) — Spring 테스트 전에 켠다(아래 함정). Spring을 띄울 때 생긴 Gradle 데몬(`java.exe`)과 adb 서버는 남아 있을 수 있다(해롭지 않다). 서버를 `demo-start.ps1`로 띄우면 새 계정 가입은 기본값대로 닫힌다(`-AllowSignup`을 붙일 때만 열린다).
- **APK**: 2026-10-14 14:11에 테스트 계정 버튼을 넣어 다시 빌드했다(`frontend/mobile/android/app/build/outputs/apk/release/app-release.apk`). 서버 주소는 `http://localhost:8080`, Google 웹 클라이언트 ID는 이전 APK에서 꺼낸 같은 값이다. 서명 인증서는 이전 APK와 같다(`apksigner verify --print-certs`로 둘 다 SHA-1 `5E:8F:…:F6:25`, 아래 Do Not Assume의 지문과 같음). 그래도 **새 APK로 Google 로그인은 눌러 보지 않았다.** 다시 빌드할 때 필요한 웹 클라이언트 ID는 저장소에 없다 — `backend\.env`의 `GOOGLE_CLIENT_ID`와 같은 값이어야 하며, 지금 APK 안의 번들에서 꺼낼 수 있다(비밀 값이 아니다, `frontend/mobile/src/api/config.ts` 주석).
- **에뮬레이터(`Medium_Phone`)의 앱**: 위 새 APK가 설치돼 있고 시연 계정으로 로그인된 상태다. 사용자가 원래 쓰던 계정은 에뮬레이터에서 로그아웃됐다(계정 자체는 그대로다).
- **`backend\.env`**: Agent는 읽을 수 없다. `GOOGLE_CLIENT_ID`가 들어 있다는 것은 간접 확인했다 — 값을 붙이지 않고 스크립트로 띄운 서버가 Google 로그인을 "설정됨"으로 답했다(2026-10-14에도 같았다).

### 시연 전에 남은 일 (순서대로)

1. **실제 태블릿에 설치하고 확인한다.** 실제 태블릿에서는 **아무것도 확인하지 못했다.** 먼저 8080·8000 포트가 비어 있는지 본다 — PowerShell `Get-NetTCPConnection -LocalPort 8080,8000 -State Listen -ErrorAction SilentlyContinue`가 아무것도 내지 않으면 비어 있다. 다른 프로젝트 서버가 쓰고 있으면 그쪽에서 끈다(아래 함정). 순서: 태블릿을 켜고 Wi-Fi에 연결 → 개발자 옵션(빌드번호 7번 누르기)에서 USB 디버깅 켜기 → 데이터가 되는 USB 케이블로 노트북에 연결 → 태블릿의 "USB 디버깅 허용" 창에서 허용 → 노트북에서 `.\scripts\demo-start.ps1 -InstallApk`. 볼 것: 테스트 계정 버튼, 결과 화면, 손님 유형 카드, 마이페이지 카드(뒤집기), 로그아웃 뒤 다시 버튼, Google 로그인. 현장에서 새 분석을 보여 줄 생각이면 분석하기와 진행 팝업도 실기기에서 한 번 본다 — 시연 계정이 아닌 다른 계정으로 한다. 케이블을 뽑았다 꽂으면 `.\scripts\demo-start.ps1`을 다시 실행한다.
2. **시연 순서를 처음부터 한 번 리허설한다.** 새 분석은 한 번에 2분쯤 걸리고 현장 인터넷에 달려 있어, 테스트 계정으로 결과 화면부터 보여 주는 쪽을 권했다. 저장 결과 보기만이라면 노트북에 인터넷이 없어도 될 것으로 보지만(결과와 그림이 노트북 DB와 폴더에 있다) **확인하지 않았다** — 리허설 때 Wi-Fi를 끄고 한 번 본다.
3. **팀원에게 알린다.** TASK-025 병합으로, 2026-09-29 이후 로컬 DB를 새로 만든 PC는 Spring이 Flyway 검증에서 멈춘다. DB를 새로 만들면 된다([TASK-025](../archive/TASK-025-flyway-migration.md) Unresolved).

**시연 중에 하지 않는 것**: `reset-db.ps1` 실행(시연 계정이 사라진다), 시연 계정으로 새 분석(드물게 멈추면 진행 팝업에서 나갈 수 없다. 첫 결과만 자동 저장되므로 새 분석을 해도 저장 결과는 자동으로 바뀌지 않는다 — "새 결과로 바꿀까요?" 창에서 "바꾸기"를 누르지 않는다), 서버가 떠 있는 동안 `backend/python-analysis`의 `.py` 수정(서버가 멈춘다), PR #41 병합(로그인 제한), 시연용 APK 파일 공유(시연 계정 비밀번호가 들어 있다).

### 분석에 대해 알아 둘 것 (2026-10-13~14에 확인)

근거와 수치는 [TASK-037](../archive/TASK-037-analysis-speed.md)(2026-10-13)과 [TASK-039](../archive/TASK-039-demo-login.md)(2026-10-14)에 있다.

- **한 번에 2분 남짓 걸린다.** 사용자가 앱에서 돌렸을 때 Python 서버가 그 요청 하나에 쓴 시간이 138초였다(분석 호출 94초, 이미지 14초. 수집 약 30초는 나머지를 뺀 **계산값**). 앱에서 누른 때부터 결과가 뜰 때까지의 시간은 재지 않았다. 2026-10-09의 기록 230초는 앱 화면으로 본 값이라 조건이 달라 그대로 빼서 읽지 않는다. 2026-10-14에 시연 계정으로 맡긴 분석은 작업 생성부터 완료까지 129초였다(API로 4초마다 상태를 읽어 잰 값).
- **근거 인용 검증에 걸리면 수집부터 다시 한다.** 그만큼 더 걸릴 것으로 추정한다(재지 않았다). 얼마나 자주 생기는지는 모른다.
- **분석 호출이 드물게 몇 분씩 응답하지 않는다.** 2026-10-13 하루 분석 호출 25회 가운데 3회였다. 한 번은 약 11분 만에 끝났고, 두 번은 Agent가 건 제한(200초, 170초)에 끊겨 끝까지 기다렸으면 끝났을지 모른다. 세 번 모두 TASK-038의 시험 문구로 한 호출이었다: `gpt-6-astra` + `low`만 세면 시험 문구 15회 가운데 3회, `main`의 문구 5회 가운데 0회다. 나머지 5회(`main`의 문구, 다른 모델·추론 강도)에도 느린 것은 없었다. 문구 때문인지 우연인지는 가리지 못했다. 코드는 호출 제한 시간을 정하지 않아 SDK 기본값(600초, 재시도 2회)이 적용된다.
- **같은 가게도 돌릴 때마다 손님 유형의 구성과 리뷰 수가 조금씩 달라진다.**
- **손님 유형 이름이 길면 휴대폰 폭의 포디움에서 두 줄로 넘어간다.** 캡처에서 10자 이름은 한 줄이었고 12자·13자 이름은 두 줄이었다. 시연 계정의 "생각나서 다시 온 손님"(12자)도 "손/님"으로 갈린다(이름 상한은 15자).
- **사장님 답글이 리뷰로 수집되는 경우가 있다**(카페 1곳에서 확인). 고치지 않았다.

### 정하지 않고 남긴 것 (사용자 결정 필요)

- **진행 팝업에서 나갈 방법이 없는 경우.** 연결이 오래 끊기거나 서버 작업이 멈추면 팝업이 계속 떠 있고, 앱을 껐다 켜도 다시 뜬다. 일정 횟수 실패하면 팝업을 내릴지 정하지 않았다([TASK-031](../archive/TASK-031-analysis-progress.md) Unresolved).
- **분석 호출 제한 시간을 넣을지.** 2026-10-13에 사용자에게 물었고 답을 받지 않았다. 위 "응답하지 않는다"가 시연 중에 생기면 진행 팝업이 몇 분씩 멈춰 보인다.
- **손님 유형으로 만드는 최소 리뷰 수를 숫자로 정할지.** 사용자는 "리뷰가 적으면 유형이 하나만 나오는 것이 맞다"고 했다(2026-10-13). 지금 프롬프트의 "근거 리뷰가 적은 토픽을 만들지 마세요"에는 숫자가 없다.
- **PRD §8 "인증" 예외를 정본에 남길지.** 테스트 계정 버튼의 예외는 PRD 정본에는 없다(TASK-039 인계 문서, `frontend/mobile/README.md`, PR #57, 이 문서에만 있다). `role:product`에 넘기는 `[SPEC]` 이슈는 만들지 않았다.
- **팝업 뒤에 가려진 "기다리는 동안" 안내 카드**(2026-10-05 팀 디자인 피드백 #1·#13)를 팝업 안으로 옮길지, 뺄지.
- **손님 유형 카드의 제목 글꼴.** 사용자가 준 참고 이미지처럼 화려하게 하려면 새 글꼴 에셋과 토큰이 필요하다. 지금은 앱 글꼴과 남색만 썼다([TASK-035](../archive/TASK-035-persona-id-card.md) Unresolved).
- **넓은 화면의 마이페이지**에서 알림·설정·서비스 정보 카드가 960 폭으로 늘어나 내용에 비해 넓다. 2열로 나눌지 정하지 않았다([TASK-033](../archive/TASK-033-mypage-tablet.md) Unresolved).

### 인계 문서 정리

- **`archive/`로 옮긴 것**(자기 브랜치의 PR이 병합된 TASK): 2026-10-13에 011, 021, 022, 025, 028, 029, 031, 032, 033, 034, 035, 036, 037(PR #55), 2026-10-14에 039. 옮길 때마다 저장소의 추적 중인 `.md` 전체에서 상대 링크를 기계로 검사했다 — 깨진 링크는 이번 이동과 무관한 기존 1개뿐이다(`docs/design/synthesis/TASK-016/README.md`가 가리키는 `ResultPrototype.tsx`).
- **`active/`에 남긴 것과 이유**:
  - 012, 020(`TASK-020-frontend-state-model.md`): PR은 병합됐으나 `docs/handoffs` 밖의 문서(`docs/decisions/ADR-012-durable-analysis-job-queue.md`, `frontend/mobile/INTEGRATION_GUIDE.md`)가 가리키고 있어 그 문서들을 함께 고쳐야 한다. 이번에 하지 않았다.
  - 024, 027: 자기 브랜치의 PR은 없으나 커밋은 PR #43으로 `main`에 전부 들어갔다(원격 브랜치 `origin/ui/TASK-024-production-auth-entry`, `origin/feat/TASK-027-analysis-resume`는 남아 있다). 두 문서의 Status가 "진행중"·"리뷰 대기"이고 내용을 살펴보지 않아 옮기지 않았다. 저장소에서 두 문서를 가리키는 곳은 없다.
  - 013~019: 자기 브랜치의 PR은 없고 문서는 PR #35(`e07b6b1`)로 `main`에 들어왔다. Status가 "진행중"·"선택 대기" 등으로 적혀 있어 끝난 작업인지 판단하지 않고 남겼다.
  - `TASK-020-session-handover.md`: TASK-020의 PR(#35·#38)은 병합됐으나 짝인 `TASK-020-frontend-state-model.md`가 남아 있어 함께 뒀다.
  - 030: 이 문서. 진행 중이다.
- **옮긴 문서의 Status는 고치지 않았다.** 여러 문서가 "리뷰 대기"·"진행중"으로 적힌 채 병합됐다. 병합 여부는 PR 목록이 정본이다.

### 하지 않은 정리

- **PR #43~#51은 연결된 이슈 없이 병합했다**(#53은 이슈 #52, #55는 #54, #57은 #56에 연결했다). 다른 역할에 넘길 것도 이슈로 만들지 않았다: Google 가입 경로의 약관 동의 누락, `SCREEN_STATES.md` §5의 낡은 진행 단계 서술과 Google 로그인 "구현하지 않았다" 서술, `DESIGN_SYSTEM.md`의 AuthMethodSelector "미구현", FR-012와 카드에 붙은 부속 정보, 줄무늬 장식의 색 토큰 용도, 테스트 계정 버튼(SCREEN_STATES·DESIGN_SYSTEM에 없음). 각 PR 본문과 TASK 인계 문서의 Unresolved에 적혀 있다.
- ADR을 쓰지 않았다: Android 패키지 이름, Google 로그인 라이브러리, 진행 단계를 Spring이 Python에 묻는 방식, 분석 모델의 추론 강도.
- **원격 브랜치**: 자기 PR로 병합된 브랜치는 병합 뒤 원격에서 지워진다. **`main`에 없는 커밋을 가진 것은 둘이다**: `origin/feat/TASK-023-login-rate-limit`(PR #41)과 `origin/chore/TASK-026-ci-verification`(PR 없음). 지우지 않는다. `origin/ui/TASK-024-production-auth-entry`와 `origin/feat/TASK-027-analysis-resume`는 커밋이 PR #43으로 `main`에 전부 들어갔는데 브랜치만 남아 있다. 이 문서를 고친 `origin/docs/TASK-030-handover-1014`도 병합 전까지 원격에 있다. 로컬에는 원격에서 지워진 브랜치가 여럿 남아 있다(정리하지 않았다).
- 별도 작업 폴더 `C:\PULSE_SCC-mobile`이 `fix/TASK-021-status-poll-retry`를 체크아웃한 채 남아 있다(`git worktree list`). 이 세션들에서 만든 것이 아니다.
- [TASK-033](../archive/TASK-033-mypage-tablet.md)의 "시험용 계정이 로컬 DB에 남아 있다"는 2026-10-13 초기화로 더는 맞지 않는다. 그 문서는 고치지 않았다.
- `backend/.env.example`의 `ANALYSIS_READ_TIMEOUT` 주석("실측 4~6분")은 TASK-037 뒤로 낡았다. 고치지 않았다.
- 시연 계정을 다시 만드는 스크립트는 저장소에 넣지 않았다. 방법은 [TASK-039](../archive/TASK-039-demo-login.md) Unresolved에 있다.

### 이 PC에서 겪은 함정

- **`EXPO_PUBLIC_*` 값이나 소스를 바꾼 뒤에는 번들을 강제로 다시 만들어야 APK에 들어간다**(아래 Do Not Assume).
- **Spring 테스트는 Docker가 꺼져 있으면 통합 테스트를 건너뛰고도 `BUILD SUCCESSFUL`이 나온다.** 건너뛴 수를 XML에서 확인한다. 이 때문에 실패하는 테스트가 두 번 가려져 있었다([TASK-032](../archive/TASK-032-analysis-progress-steps.md), [TASK-025](../archive/TASK-025-flyway-migration.md)).
- **이 PC에는 같은 포트(8080·8000)를 쓰는 다른 프로젝트(`C:\programworks\PULSE`)가 있다.** `scripts\demo-start.ps1`은 포트에 무엇이 떠 있든 SCC 서버로 여기고 새로 띄우지 않으며, 기기를 그 서버에 잇는다. `-Stop`은 그 포트를 가진 프로세스를 끝내므로 다른 프로젝트의 서버를 죽인다. SCC 서버를 띄우기 전에 포트 주인을 확인하고, 다른 프로젝트의 서버는 그 프로젝트 쪽에서 끈다(2026-10-14 확인).
- **Python 분석 서버가 떠 있는 동안 `backend/python-analysis`의 `.py`(테스트 포함)를 고치면 서버가 요청을 받지 못하게 된다.** 자동 재시작 뒤 `Accept failed on a socket … WinError 87`이 나고, 8000 포트는 열려 있는데 헬스 체크가 응답 없이 매달린다(2026-10-13 겪음). 고친 뒤 Python 서버를 끝내고 `demo-start.ps1`을 다시 실행한다. Spring 코드를 고쳤으면 Spring도 다시 띄운다.
- **서버 창의 로그는 창을 닫으면 사라진다.** 파일로 남기지 않는다. 분석 시간은 "PULSE 분석 서비스 (Python)" 창의 `리뷰를 수집했습니다`·`분석 모델이 응답했습니다`·`손님 유형 이미지 N장을 만들었습니다` 줄에 찍힌다.
- **Git Bash에서 `adb shell uiautomator dump /sdcard/u.xml`처럼 `/`로 시작하는 기기 경로를 쓰면 Windows 경로로 바뀐다**(`/sdcard` → `C:/Program Files/Git/sdcard`). 앞에 `MSYS_NO_PATHCONV=1`을 붙인다.
- **에뮬레이터에서 `wm size`를 바꾸면 앱이 첫 화면으로 돌아간다.** 여러 번 바꾼 뒤 화면이 검게 나온 적이 있고 에뮬레이터를 새로 켜니 정상이었다. 확인이 끝나면 `wm size reset`·`wm density reset`·글자 크기를 되돌린다.
- **에뮬레이터 키보드가 한글이면 `adb shell input text`가 깨진다.** `adb shell input keycombination 113 62`(Ctrl+Space)로 영문으로 바꾼 뒤 입력한다.
- **Windows PowerShell 5.1**: 문자열 안에서 변수 바로 뒤에 한글을 붙이면 한 변수 이름으로 읽힌다(`$n개` → `$($n)개`). 네이티브 명령의 stderr를 `2>&1`로 합치면 `$ErrorActionPreference = 'Stop'` 아래에서 스크립트가 끝난다. `.ps1`에 한글이 있으면 UTF-8 BOM으로 저장한다.
- **Android에서 `Image`에 비율(%) 폭과 `aspectRatio`만 주면 원본 크기로 그려질 수 있다.** 숫자로 준다.

## Owner

role:platform — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`chore/TASK-030-android-apk-build` — `ui/TASK-029-design-feedback`([SKUnohtaekyung/PULSE_SCC#43](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/43)) 위에서 갈라졌다. PR #43은 2026-10-09에 `main`으로 병합됐고(`f69cc51`), 이 브랜치도 같은 날 푸시했다. 이 브랜치 위에 `ui/TASK-031-analysis-progress`와 `feat/TASK-032-analysis-progress-steps`가 쌓여 있다(2026-10-09 기준. 셋 다 그 뒤 `main`으로 병합됐다 — PR #44·#45·#46).

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

- **실제 태블릿에 설치하지 않았다.** 2026-10-12에 에뮬레이터 화면을 태블릿 크기(세로 800×1280dp, 가로 1280×800dp)로 바꿔 로그인·분석하기·진행 팝업·새 결과·분석 결과·마이페이지를 확인했고 넘침·겹침은 없었다. 같은 폭의 Android 화면을 흉내 낸 것이라 실기기의 화면 비율·제조사 글꼴·안전 영역·Play 서비스는 보지 못했다.
- **Google 로그인을 검토 반영 뒤의 빌드로 끝까지 해 보지 않았다.** 2026-10-12 빌드에서는 `Google로 계속하기`를 눌러 계정 선택 창이 뜨는 것과, 뒤로가기로 "Google 로그인을 취소했어요" 안내가 나오는 것까지 확인했다(계정은 고르지 않았다). 성공은 2026-10-09 빌드에서만 확인됐다. 실패 안내(같은 이메일 계정 있음, Play 서비스 없음)와 태블릿은 미확인이다. 구글 콘솔 등록 내용은 `frontend/mobile/README.md` "Google 로그인" 절에 적었다.
- 서버의 `GOOGLE_CLIENT_ID`에는 Android 클라이언트 ID가 아니라 **웹 클라이언트 ID**가 들어간다. 서버를 웹 클라이언트 ID로 띄운 상태에서 실제 로그인이 성공해 확인됐다(2026-10-09). 앱 코드와 `backend/.env.example`·`backend/README.md`를 그렇게 맞췄다.
- 2026-10-09 확인 때 Spring은 `GOOGLE_CLIENT_ID`·`LEGAL_REGISTRATION_ENABLED=true`를 환경 변수로 붙여 띄웠다. 2026-10-12에 값을 붙이지 않고 띄운 서버도 Google 로그인을 "설정됨"으로 답해, `backend/.env`에 `GOOGLE_CLIENT_ID`가 들어 있는 것으로 본다(파일을 읽은 것은 아니다). 구글 콘솔의 게시 상태(테스트/프로덕션)와 테스트 사용자 목록은 미확인이다.
- Google로 처음 들어오는 계정은 서버가 새로 만든다. 가입이 닫혀 있으면(`LEGAL_REGISTRATION_ENABLED=false`) `503 REGISTRATION_NOT_AVAILABLE`로 거부되고 앱은 서버 문구를 그대로 보여 준다. 이메일 가입과 달리 이 경로는 약관 동의를 받지 않는다 — 기존 서버 동작이며 이번에 바꾸지 않았다.
- `docs/product/requirements/SCREEN_STATES.md`(Google 로그인 "구현하지 않았다")와 `docs/design/DESIGN_SYSTEM.md` §AuthMethodSelector("미구현") 서술을 고치지 않았다. `role:product`·`role:design-system` 소유다.
- 버튼 문구를 `Google로 계속하기`로 바꾼 것은 디자인 검토를 받지 않았다. 이 버튼은 가입과 로그인을 모두 한다.
- **신규 가입은 서버 기본값으로 막혀 있다**(`LEGAL_REGISTRATION_ENABLED=false`). `scripts\demo-start.ps1 -AllowSignup`으로 띄우면 열린다. `backend/.env`는 고치지 않았다. 2026-10-13에 DB를 초기화했고, 그 뒤의 계정 상태는 위 "세션 인수인계"에 적었다.
- ~~로컬 Spring이 뜨려면 V4·V6 임시 파일이 필요하다~~ — 2026-10-12에 TASK-025가 `main`으로 병합돼(PR #47) 해소됐다. 임시 파일은 지웠다.
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

시연 당일에는 `scripts\demo-start.ps1`(또는 `scripts\demo-start.cmd` 더블클릭)이 아래의 서버 두 개 띄우기와 `adb reverse`를 한 번에 한다(2026-10-12, [TASK-034](../archive/TASK-034-demo-start-script.md)). 아래 명령은 직접 할 때의 참고다.

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

위 "세션 인수인계"의 "시연 전에 남은 일"을 따른다. 첫 일은 실제 태블릿에 APK를 설치해 처음부터 끝까지 확인하는 것이다.

## Last Verified Commit

`3d1919b`(Google 로그인 연결) — TASK-030(`chore/TASK-030-android-apk-build`) 자체의 코드 검증 기준이다. lint·typecheck·토큰 검증·Android 번들은 `3d1919b`의 소스로 실행했고, 2026-10-09에 에뮬레이터에 설치했던 APK도 그 소스로 빌드했다. 그 브랜치에서 바뀐 화면 소스는 로그인 화면(`LoginScreen.tsx`, `googleSignIn.ts`)과 `api/config.ts`이고, 그 밖의 화면 소스는 `ui/TASK-029-design-feedback`의 `2bb6ec1` 시점 그대로였다. `3d1919b` 뒤 그 브랜치의 커밋은 문서(이 문서와 `frontend/mobile/README.md`)만 고쳤다.

"세션 인수인계" 절은 `main`의 `88ac9dc` 시점의 상태를 적은 것이다. 그 시점의 검증은 각 TASK의 인계 문서에 있다(TASK-037: Python lint·테스트, TASK-039: 프론트엔드 lint·typecheck·토큰 검증·Android 번들·APK 빌드). `88ac9dc`에서 Spring 검증은 다시 돌리지 않았다. 이 절을 넣고 TASK-039 인계 문서를 `archive/`로 옮긴 커밋은 문서만 바꿨다.
