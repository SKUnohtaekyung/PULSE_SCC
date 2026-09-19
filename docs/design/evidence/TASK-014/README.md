# TASK-014 Android Native Visual QA

## Environment

- AVD: Android Studio `Medium_Phone`
- OS: Android 17 / API 37
- Display: 1080×2400, 420 dpi
- Runtime: Expo Go, Expo SDK 57
- TalkBack service: `com.google.android.marvin.talkback/.TalkBackService`
- Date: 2026-09-19

연결된 USB 실기기는 없었다. `app.json`의 `android.package`가 아직 제품·플랫폼 결정 전이므로 값을 임의로 만들지 않고 Expo Go에서 네이티브 렌더링을 검증했다.

## Results

| 검증 | 결과 | 근거 |
|---|---|---|
| 기본 네이티브 렌더링 | PASS | [android-default.png](android-default.png) |
| 시스템 글자 크기 200% | PASS | [android-font-200.png](android-font-200.png), [android-font-200-end.png](android-font-200-end.png) |
| TalkBack 서비스·TTS 활성화 | PASS | `dumpsys accessibility`에서 TalkBack bound/enabled, `logcat`에서 접근성 TTS audio focus 확인 |
| TalkBack 정적 action 의미 | PASS | [android-talkback-action.png](android-talkback-action.png), UI tree에서 `clickable=false`, 라벨은 `Action 스타일 예시, 분석하기. 실행되지 않는 개발용 견본입니다.` |
| heading 의미 구조 | PASS | `PULSE`, hero title, 각 section title, WCAG title에 `accessibilityRole="header"` 적용 |
| 사람의 TalkBack 발화 청취·한국어 발음 | 미확인 | 자동화 환경은 음성 출력을 직접 청취하지 못함 |
| USB 실기기·development build | 미확인 | 연결 기기 없음. `android.package` 결정 전 |

200% 확대에서 앱 소유 콘텐츠의 가로 잘림이나 겹침은 발견하지 못했다. 상단 Expo Go 개발 도구 오버레이는 확대 시 우측 텍스트 위에 겹쳤지만 제품 UI가 아니며 production build에는 포함되지 않는다.

검증 후 `font_scale`, `enabled_accessibility_services`, `accessibility_enabled`, `touch_exploration_enabled`는 테스트 전 값으로 복구했다.
