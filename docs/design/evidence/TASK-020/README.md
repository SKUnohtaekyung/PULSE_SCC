# TASK-020 Step 3 Design Foundation 실행 증거

## Environment

- AVD: `Medium_Phone`
- Android 17 / API 37, 1080×2400, 420dpi
- Runtime: Expo Go SDK 57, route `/foundation`(`TokenShowcase`)
- Data: 개발용 견본 문구
- 검증일: 2026-09-22

실행 방법은 [TASK-018 증거 README](../TASK-018/README.md)의 Direct run과 같다. 앱이 열리면 `exp://127.0.0.1:8081/--/foundation`으로 이동한다.

## Captures

| 파일 | 확인한 것 |
|---|---|
| `step3-state-color-100.png` | 글자 크기 100%. 입력 경계 `border.control`, 오류 문장 `status.errorText`, 주의 안내 `status.warningText`, 삭제 버튼 `destructive` 렌더링 |
| `step3-state-color-200.png` | 시스템 글자 크기 200%(`font_scale 2.0`). 문장 줄바꿈, 잘림·겹침 없음. 캡처 후 `font_scale 1.0`으로 복원 |

## Not verified

- TalkBack 낭독: 미실행 — 견본 화면이며 지원 기기·TalkBack 기준 미확정(DESIGN_SYSTEM §8.2)
- 실기기: 미실행

## Step 5 flow prototype

- 검증일: 2026-09-22, 같은 AVD·Expo Go. route `/flow`(입력·진행·첫 저장 완료)와 `/preview`(새 결과 미리보기)
- 9장 모두 네이비 헤더와 입력 차례로 펼치기를 반영한 코드로, `/flow`를 첫 경로로 연 상태(콜드 스타트)에서 찍었다
- 데이터: 고정 시나리오와 가상 데이터. 가게 이름 `Test Store`는 adb가 한글 입력을 넣지 못해 쓴 영문 테스트 값이다. 결과 화면의 `영등원조쌈밥`은 결과 프로토타입의 고정 가상 데이터다

| 파일 | 확인한 것 |
|---|---|
| `step5-input-1-name.png` | 입력 1단계 — 가게 이름만 보이고 주요 버튼은 `다음`. 네이비 위 흰 상태 표시줄 아이콘(키보드를 닫은 뒤 찍어 포커스 테두리는 보이지 않음) |
| `step5-input-2-category.png` | 입력 2단계 — 이름이 `수정` 한 줄로 접히고 업종 칩이 나타남. 버튼 없음 |
| `step5-input-3-url.png` | 입력 3단계 — 이름·업종이 접히고 URL과 `분석하기` |
| `step5-progress.png` | 진행 목록 — 끝난 단계 체크, 현재 단계 굵게와 진행 표시(회전 중인 호) |
| `step5-first-saved.png` | 첫 저장 완료 화면 — 요약 카드와 `결과 보기` |
| `step5-failed-retryable.png` | 실패 — 마지막 진행 행은 진행 표시만 멈추고 목록 끝에 실패 결과 행, `다시 분석하기` |
| `step5-preview.png` | 새 결과 미리보기 — 주의 띠, 하단 고정 두 선택, 유지 안내. 하단 내비게이션 없음 |
| `step5-replace-confirm.png` | 교체 확인 — 지금 저장된 결과를 밝히고 최종 `바꾸기`는 `destructive.primary`. 어두운 배경이 상태 표시줄·내비 바까지 덮음 |
| `step5-leave-dialog.png` | 뒤로가기 — 바꾸기·유지·계속 보기 |

미실행: 글자 크기 200%, TalkBack, 실기기, 키보드가 입력·버튼을 가리는지.

## Step 6 decisions on Android

- 검증일: 2026-09-22, 같은 AVD·Expo Go

| 파일 | 확인한 것 |
|---|---|
| `step6-paused-step.png` | 결정 2 — 실패 뒤 멈춘 진행 행이 가로줄 원과 "여기까지 진행했어요"로 표시됨 |
| `step6-reanalysis-nav.png` | 결정 3 — 저장본이 있는 사용자의 입력 화면에서 하단 가운데 분석하기가 네이비·흰 아이콘. 오렌지는 화면 안 `분석하기` 하나 |

미확인: 결정 4(키보드 가림) — 에뮬레이터에 하드웨어 키보드가 연결돼 화면 키보드가 전체로 올라오지 않았다.

## Step 6 Figma import

- 검증일: 2026-09-22. 파일 https://www.figma.com/design/lIEsVWuCpKr2SzvYeu2EzZ 의 페이지 `TASK-020 Vertical Slice`
- 캡처는 Figma가 렌더한 화면이다(글꼴 교정 뒤 상태, Gothic A1)

| 파일 | 확인한 것 |
|---|---|
| `step6-figma-01.png` | 01 IA·Flow — 상자·화살표·설명이 그대로. 글꼴 교정 전 캡처 |
| `step6-figma-05.png` | 05 첫 분석 6화면 — 한글·이미지·색 정상, 글꼴 교정 뒤 |
| `step6-figma-07.png` | 07 다시 분석·저장 선택 — 대화상자와 어두운 배경 정상, 글꼴 교정 전 캡처 |

미확인: 팀원 PC에서 열었을 때의 글꼴(각자 Gothic A1이 없으면 다시 대체된다), Figma 컴포넌트화.

## Step 7 첫 Vertical Slice

- 검증일: 2026-09-22. 같은 AVD(`Medium_Phone`, Android 17/API 37, 1080×2400)와 Expo Go
- 앱을 실제로 조작한 캡처다. 데이터는 **가상 서버(fixture)** 응답이고, 입력·첫 저장·홈 화면에 가상 데이터임을 알리는 안내가 함께 나온다(SCREEN_STATES §10)
- 가게 이름 `Test Store`와 URL `https://naver.me/testStore*`는 adb가 한글을 입력하지 못해 쓴 영문 테스트 값이다. 손님 유형·리뷰 문구는 고정 fixture의 가상 데이터다

| 파일 | 확인한 것 |
|---|---|
| `step7-01-login.png` | 로그인 화면 — 네이비 헤더, 이메일·비밀번호 입력, 가상 서버 안내 |
| `step7-02-store-input.png` | 로그인 직후 가게 입력 1단계. 저장본이 없어 하단 내비게이션 없음(`NAV-HIDDEN`), `첫 분석` 배지 |
| `step7-03-store-category.png` | 입력 2단계 — 이름이 한 줄로 접히고 업종 칩이 나타남 |
| `step7-04-store-url-error.png` | URL 형식 오류 — 빨간 테두리와 필드 아래 원인·수정 방법 |
| `step7-05-progress.png` | 진행 목록 — 끝난 단계 체크, 현재 단계 굵게. 입력값은 한 줄 요약으로 접힘 |
| `step7-06-first-save.png` | 첫 저장 완료 화면 — 가게 이름, 분석에 쓴 리뷰 수, 손님 유형 수, `결과 보기` |
| `step7-07-home-result.png` | 홈 결과 — 분석 기준 정보 → 3칸 포디움 → 선택한 유형 |
| `step7-08-auth-expired.png` | 앱을 껐다 켠 뒤 세션 복원 실패 — `로그인이 만료됐어요` 안내 |
| `step7-09-auth-field-error.png` | 로그인 필드 오류 |
| `step7-10-analysis-retryable.png` | 재시도 가능 실패 — 멈춘 행 + 실패 결과 행 + `다시 분석하기` |
| `step7-11-nav-analysis-active.png` | 저장본이 있는 사용자의 분석 화면 — 가운데 원이 네이비(현재 위치) |
| `step7-12-store-not-found.png` | 가게 못 찾음 — 입력 화면으로 돌아오고 값 보존, 이름·URL 양쪽에 원인 |
| `step7-13-analysis-insufficient.png` | 리뷰 부족 — 50건 기준 안내와 `가게 정보 다시 입력` |
| `step7-14-store-job-error.png` | 멱등 키 거부 — 새 요청으로 다시 보내라는 안내 |
| `step7-15-result-no-persona.png` | 유형 0개 — 점선 빈 슬롯 3개와 이유 |
| `step7-16-persona-select.png` | 2위 유형 선택 — 선택 테두리와 아래 상세가 함께 바뀜 |
| `step7-17-home-200.png` | 시스템 글자 크기 200%의 홈 결과 — 줄바꿈되고 잘림·겹침 없음 |
| `step7-18-analyze-200.png` | 시스템 글자 크기 200%의 입력 화면 |
| `step7-22-first-save-200.png` | 200%의 첫 저장 완료 화면 — 가상 데이터 안내와 요약이 모두 보임 |
| `step7-23-image-placeholder-200.png` | 200%의 이미지 자리표시 — 상자가 글자에 맞게 늘어나 잘리지 않음 |
| `step7-19-image-load-error.png` | 페르소나 이미지 조회 실패 — 원인과 "유형 내용은 그대로 볼 수 있어요" 안내. 캡처에 보이는 `이미지 다시 불러오기`는 이후 실제 서버 모드 전용으로 바꿨다(아래 캡처 시점) |
| `step7-20-image-placeholder.png` | 가상 서버라 이미지가 없을 때의 자리표시 — 이미지와 같은 크기, 코드로 그림 |
| `step7-21-advice-expanded.png` | 제안 펼침 — AI 해석과 "참고한 전문 지식이 없어요" |

글자 크기는 `settings put system font_scale 2.0`으로 바꾸고 확인한 뒤 `1.0`으로 되돌렸다(`settings get`으로 복원 확인).

### 고친 결함

- 홈 헤더의 `저장된 결과` 배지가 `저장된 결`로 잘렸다. 배지를 View로 감싸면 Android가 글자 너비를 짧게 재서, Text 자체에 테두리를 주는 방식으로 바꿨다(`components/ui/ScreenHeader.tsx`). 수정 뒤 캡처가 위 `step7-07`·`step7-17`이다.
- (독립 리뷰 반영) 첫 저장 완료·홈 화면에 가상 데이터 안내가 없어 운영 데이터처럼 보였다 → `features/dev/FixtureBanner`를 두 화면에 추가했다.
- (독립 리뷰 반영) 프로토타입 전용 페르소나 이미지를 제품 화면에서 썼다(DESIGN_SYSTEM §3.6 금지) → fixture 모드에서는 코드로 그린 자리표시를 쓰도록 바꿨다.
- (독립 리뷰 반영) 이미지 조회 실패에 재조회 행동이 없고 영역 크기가 이미지와 달랐다 → 재시도 버튼을 넣고 높이를 맞췄다.
- (독립 리뷰 반영) 가게 입력 화면이 공용 `TextField`와 같은 입력을 다시 구현하고 있었다 → 공용 `Field`·`TextField`로 합쳤다.
- (2차 독립 리뷰 반영) 이미지 대체 영역을 고정 높이로 바꾼 탓에 글자를 키우면 내용이 넘칠 수 있었다 → 최소 높이로 되돌리고 200%에서 다시 확인했다(`step7-23`).
- (2차 독립 리뷰 반영) 가상 서버에서는 다시 불러올 이미지가 없는데도 재조회 버튼이 보였다 → fixture 모드에서는 버튼 대신 "예시 화면이라 다시 불러올 수 없어요"를 보여준다.
- (2차 독립 리뷰 반영) 그림이 없는 화면에서도 "이 이미지는 …"이라고 적었다 → 상황에 맞는 문구로 나눴다.

### 캡처 시점

- `step7-06`·`07`·`15`~`18`·`20`~`23`은 독립 리뷰 반영 뒤 다시 찍었다.
- `step7-01`~`05`·`08`~`14`는 그 전에 찍었고, 해당 화면은 이후 수정에서 바뀌지 않았다(로그인·입력·진행·실패 화면).
- `step7-19`는 재조회 버튼을 실제 서버 모드로 한정하기 **전** 화면이다. 지금 코드의 가상 서버 모드에서는 버튼 대신 "예시 화면이라 다시 불러올 수 없어요"가 나온다.

### 미확인

- 실제 백엔드 연결: 미실행. 병합·배포 전이라 fixture로만 확인했다
- `이미지 다시 불러오기` 버튼의 실제 재조회 동작: 미확인. 가상 서버에는 내려받을 이미지가 없어 이 버튼은 실제 서버 모드에서만 나온다
- TalkBack 낭독, 실기기, 넓은 화면(태블릿·가로): 미실행
- 키보드가 입력·버튼을 가리는지: 미확인. 에뮬레이터에 하드웨어 키보드가 연결돼 화면 키보드가 전체로 올라오지 않는다
- `ANALYSIS-FATAL-ERROR`·`IMAGE-GENERATION-FAILED`·`RESULT-PARTIAL`·작업 실패로 오는 `STORE-UNSUPPORTED-URL`: 상황은 만들었으나 캡처를 남기지 않았다
- 오프라인 상태(`STORE-OFFLINE`·`ANALYSIS-OFFLINE`): 재현하지 않았다
