# TASK-024 — 실사용 인증 진입 화면과 목데이터 제거

## Status
진행중

## Owner
role:feature — Codex

## Branch
ui/TASK-024-production-auth-entry

## Goal
앱 시작 시 PULSE 로고 인트로를 보여준 뒤 간결한 로그인 화면으로 전환하고, 프론트 런타임의 fixture·prototype 경로를 제거해 실제 API만 사용한다.
관련 이슈: 미생성
관련 요구사항: `docs/product/PRD.md`의 인증·온보딩 및 실사용 전환 범위

## Completed
- 첨부받은 PULSE 로고가 기존 `pulse-wordmark.png`와 동일함을 해시로 확인하고 기존 정본 자산을 재사용했다.
- 첨부 프롬프트의 웹용 SplitFlapText 효과를 React Native `Animated` 기반 문자별 플랩으로 이식하고, 마지막에 실제 PULSE 로고로 전환했다.
- 로그인 인트로는 앱 프로세스 한 번당 최초 진입에서만 재생되며 로그아웃 후에는 반복하지 않는다.
- 동작 줄이기 설정에서는 플랩을 건너뛰고 정적 로고만 표시하도록 처리했다.
- 로그인 레이아웃 전체를 화면 중앙에 배치하고 설명·개발용 문구를 제거했다.
- 이메일·Google 회원가입 버튼에서 `하기`를 제거하고 Google 버튼에 접근성 트리에서 숨긴 단색 Google 아이콘을 추가했다.
- 이메일 로그인과 회원가입은 실제 Spring API 경로를 사용한다.
- 프론트 런타임의 fixture transport, fixture 데이터, 개발 시나리오 패널, prototype 라우트·화면·이미지를 제거했다.
- Android Emulator에서 프론트 → Spring Boot → PostgreSQL 이메일 로그인 왕복을 확인했다.
- 실제 API로 health, 약관 조회, 가입, 세션 조회, 로그아웃, 로그인, 토큰 갱신을 확인했다.
- 분석 화면에 서버 `progressStep` 기반 퍼센트, 애니메이션 진행 막대, 현재 단계 상태를 추가했다.
- 분석·입력 화면은 compact 화면 간격을 사용하고 카드 내부 여백을 한 단계 줄였다.
- 2026-10-01 분석 실패는 Python 8000 서비스 미기동으로 발생한 `INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE`임을 Spring 로그로 확인하고 서비스를 정상 기동했다.
- 첫 저장 완료 화면을 성공 초록 체크 SVG, 중앙 정렬 제목, 리뷰·손님 유형 분리 지표로 재구성했다.
- 결과 화면 상단에 저장 상태·업종·유효 리뷰 수·손님 유형 수를 한 카드로 요약하고, TOP3 선택 안내와 선택 유형의 순위·근거 리뷰 수를 추가했다.
- 보호된 페르소나 PNG도 일반 API와 같은 401 토큰 갱신·1회 재요청 경로로 내려받게 해 세 유형의 실제 AI 생성 이미지가 모두 표시된다.
- 중복 근거 데이터가 React key 경고와 같은 리뷰 반복 표시를 만들지 않도록 결과 미리보기와 근거 목록을 중복 제거했다.
- 가게명은 번역·음역하지 않고 분석 요청의 `storeName`을 그대로 저장·표시한다. 로컬 검증 데이터도 `운산국밥`으로 바로잡아 확인했다.

## Changed
- `frontend/mobile/src/features/auth/LoginScreen.tsx` — 로고 인트로와 단순화한 실사용 로그인 화면
- `frontend/mobile/src/features/auth/components/SplitFlapLogo.tsx` — React Native 문자별 플랩 인트로
- `frontend/mobile/src/components/icons/GoogleIcon.tsx` — Google 회원가입 버튼 아이콘
- `frontend/mobile/src/components/icons/SuccessCheckIcon.tsx` — 완료 상태 전용 초록 체크 SVG
- `frontend/mobile/src/components/ui/Button.tsx` — 버튼 leading icon 지원
- `frontend/mobile/src/components/ui/{PersonaAvatar.tsx,PersonaImageBlock.tsx,usePersonaImage.ts}` — 인증 이미지 로딩·갱신·실패 상태
- `frontend/mobile/src/components/ui/ProgressList.tsx` — 단계 기반 퍼센트와 애니메이션 진행 막대
- `frontend/mobile/src/components/ui/Screen.tsx` — 진행·입력 화면용 compact 간격 옵션
- `frontend/mobile/src/features/analysis/{AnalyzeScreen.tsx,jobOutcome.ts}` — 퍼센트 연결과 간격 조정
- `frontend/mobile/src/features/analysis/FirstSaveScreen.tsx` — 완료 화면과 분석 요약 지표
- `frontend/mobile/src/features/result/{ResultView.tsx,EvidenceScreen.tsx}` — 결과 요약·선택 안내·근거 중복 제거
- `frontend/mobile/src/api/**` — fixture 분기 제거 및 실제 HTTP transport 단일화
- `frontend/mobile/src/features/**` — fixture banner·scenario 의존 제거
- `frontend/mobile/src/app/{flow,preview,prototype-result}.tsx`, `frontend/mobile/src/prototypes/**` — prototype 런타임 삭제
- `frontend/mobile/assets/images/personas/prototype/**` — prototype 전용 자산 삭제
- `frontend/mobile/app.json` — 인증 리디렉션용 앱 scheme 추가
- `frontend/mobile/{README.md,INTEGRATION_GUIDE.md}` — 실사용 API 실행 방법으로 정리
- `docs/design/evidence/TASK-024/**` — 기본·200% 글자 크기 및 실제 API 로그인 증거

## Decisions
- Android 개발 환경에서는 별도 설정이 없을 때 `http://10.0.2.2:8080`을 사용하고, 그 밖의 환경은 명시적 API base URL이 없으면 실패하게 했다.
- `10.0.2.2`는 Android Emulator 전용이다. 실기기에서는 같은 Wi-Fi의 개발 PC 주소를 설정하거나 USB `adb reverse`와 `127.0.0.1` 조합을 사용해야 한다.
- Google 가입 버튼은 UI만 제공하고 성공을 가장하지 않는다. Android package ID와 Google OAuth client ID·redirect 설정이 확정되기 전까지 구성 안내를 표시한다.
- 기존 `public` schema의 Flyway V4 checksum 불일치를 임의 repair하지 않고, `scc_codex_it_20261001_1640` 격리 schema에 V1~V5를 적용해 API 검증했다.
- 분석 퍼센트는 경과 시간 추정치가 아니라 서버가 확인한 단계의 위치다. 서버 단계가 바뀌지 않으면 숫자를 임의로 올리지 않는다.
- 페르소나 이미지는 공개 URL로 바꾸지 않는다. `ApiClient`가 보호된 PNG를 받아 토큰 만료 시 갱신하고, 앱에는 data URI로 전달한다.
- `UnsanGukbap`을 프론트에서 `운산국밥`으로 치환하는 매핑은 만들지 않았다. 사용자가 입력한 한국어 이름을 그대로 API에 보내고, 저장된 결과의 값을 그대로 표시한다.

## Verification
**실제로 실행한 것만 적는다.**

| 검증 | 명령 | 결과 |
|---|---|---|
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS |
| lint | `npm --prefix frontend/mobile run lint` | PASS |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS |
| Android export | `npm --prefix frontend/mobile run export:android` | PASS |
| Spring test | `.\backend\spring-api\gradlew.bat -p backend\spring-api test --rerun-tasks` | BUILD SUCCESSFUL, 116개 중 90 PASS·26 SKIP (Docker daemon 미실행으로 Testcontainers 통합 테스트 skip) |
| Python lint/format | `.venv`의 ruff check 및 format check | PASS |
| Python test | `.venv`의 pytest | 166 PASS |
| 실제 API | 로컬 Spring Boot + PostgreSQL 격리 schema에서 health·약관·가입·세션·로그아웃·로그인·refresh 요청 | 모두 기대 상태 코드 PASS |
| Android API 연동 | Emulator에서 실제 이메일 로그인 후 분석 화면 진입 | PASS, `docs/design/evidence/TASK-024/api-login.png` |
| 인증 진입 버튼 | Emulator에서 이메일 회원가입 route 진입 및 Google 구성 안내 표시 | PASS |
| Visual QA | 1080×2400 기본 및 font scale 2.0 | PASS, 중앙 정렬·Google 아이콘·문구·잘림 없음. `login-centered.png`, `login-centered-font-200.png`, `split-flap.mp4` |
| 분석 진행 UI | Android 17/API 37 Emulator 1080×2400 | PASS, 8%→36% 단계 전환·실패 상태·접근성 progressbar 확인. `analysis-progress-live.png`, `analysis-progress-failed.png` |
| 완료·결과 UI | Android 17/API 37 Emulator 1080×2400 기본·font scale 2.0 | PASS, 한국어 가게명·초록 체크·분리 지표·세 AI 이미지·큰 글자 잘림 없음. `first-save-final.png`, `first-save-200.png`, `result-final.png` |
| Spring→Python 분석 연결 | Python 수집 상한을 임시로 20건으로 설정한 뒤 실제 요청 | PASS, 요청 수신·36초 수집 후 의도한 `INSUFFICIENT_VALID_REVIEWS`; OpenAI 호출 없음. 검증 후 제한 제거 및 정상 Python health `ok` 확인 |
| 네이티브 development build | 미실행 | Android package ID 미확정 |
| Google OAuth E2E | 미실행 | OAuth 자격 증명·package ID 미확정 |

## Unresolved
- Android package ID를 제품·플랫폼 담당자가 확정해야 한다.
- Google OAuth Android/Web client ID, SHA 인증서 지문, redirect URI를 발급·확정한 뒤 네이티브 development build에서 E2E 검증해야 한다.
- `backend/.env.example`은 `GOOGLE_CLIENT_ID`를 Android client ID라고 적지만, 서버가 검증할 ID token의 audience는 일반적으로 Web/server client ID다. 실제 라이브러리 선택 후 `role:platform`이 Google Cloud 설정과 함께 정정 여부를 검토해야 한다.
- 기존 `public` schema는 적용된 Flyway V4 checksum과 현재 파일 checksum이 달라 일반 `bootRun`이 실패한다. migration 이력 확인 후 정식 대응이 필요하다.
- Docker daemon이 꺼져 Spring Testcontainers 기반 26개 테스트가 skip됐다.
- 정상 상한으로 전체 분석을 다시 완료하는 E2E는 OpenAI 비용이 발생하므로 이번 수정 뒤 미실행이다.
- 현재 생성 이미지 자체는 기존 완료 분석의 세 장을 사용해 조회·표시를 검증했다. 새 OpenAI 이미지 생성 호출은 실행하지 않았다.
- 독립 Reviewer 검토와 커밋은 아직 미실행이다.

## Do Not Assume
- Google 회원가입은 아직 인증 완료 기능이 아니다. 버튼은 필요한 구성 누락을 사용자에게 알린다.
- SplitFlap은 PULSE 문자를 플랩으로 완성한 뒤 실제 로고로 교체한다. 래스터 로고 자체를 글자별로 변형하는 방식은 아니다.
- Expo Go의 자체 로딩 화면 때문에 앱 인트로의 정확한 cold-start 캡처는 네이티브 splash 이후 동작과 같다고 단정할 수 없다.
- 기존 DB의 Flyway checksum을 repair하지 않았다. 테스트용 격리 schema만 생성했다.
- 삭제한 것은 프론트 런타임 fixture·prototype이다. 문서 기록에 남은 과거 조사·회의 자료는 수정하지 않았다.

## Next Action
Android package ID와 Google OAuth 자격 증명을 확정한 뒤 Google 가입 E2E와 네이티브 development build를 검증한다.

## Last Verified Commit
`7a7dc46` — TASK-024 구현 커밋. 이 커밋 기준으로 위 Verification이 유효하다.
