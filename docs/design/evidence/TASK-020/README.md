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
