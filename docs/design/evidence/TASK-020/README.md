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
