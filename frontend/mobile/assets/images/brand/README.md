# PULSE brand assets

팀이 만든 PULSE 로고다. 프로토타입 에셋이 아니라 **제품 화면에 그대로 쓰는 에셋**이다.

| 파일 | 크기 | 쓰는 곳 | SHA-256 |
|---|---|---|---|
| `pulse-wordmark.png` | 1740×673 | 화면 머리(`components/ui/ScreenHeader`)의 `brand` 표시 | `d8f2b91b20d71467ed0066fc381ce4c947fd6b472cd72511fa58482cda6a9efe` |
| `pulse-symbol.png` | 565×458 | **아직 쓰는 곳이 없다.** 앱 아이콘·스플래시·좁은 화면 머리처럼 워드마크가 들어가지 않는 자리를 위해 받아 두었다 | `dcec1d8b1a54ffacd826f9fe2f15b109b4a0ad17641e2a020302be411ffce524` |

- Source: 팀 내부 제작. 2026-09-27에 사용자가 전달했다.
- Version: 전달본 그대로다. 크기를 줄이거나 색을 바꾸지 않았다.
- Terms: 팀 소유 에셋이라 외부 라이선스 조건이 없다. 제3자 스톡 에셋을 쓰지 않았다.
- Format: PNG, 알파 채널 포함(네 모서리 알파 0으로 확인).
- Color: 워드마크·심볼 모두 딥 로얄 블루 단색이다.

## 사용 금지 조건

- 로고 색을 바꾸거나 그림자·테두리를 덧붙이지 않는다. 색을 바꿔야 하면 단색 버전을 새로 받는다.
- 비율을 고정한다. `ScreenHeader`는 높이를 정하고 너비를 원본 비율(1740:673)로 계산한다.
- 워드마크를 아이콘 자리에 욱여넣지 않는다. 좁은 자리에는 `pulse-symbol.png`를 쓴다.
- 대체 텍스트는 `PULSE`다. 장식이 아니라 제품 이름이므로 숨기지 않는다.

## 미결

`pulse-symbol.png`를 어디에 쓸지 정하지 않았다. 앱 아이콘(`assets/images/icon.png`, `android-icon-*.png`)은 아직 Expo 기본값이다. 앱 식별자·빌드 프로파일을 정할 때 함께 결정한다(`docs/architecture/FRONTEND_STRUCTURE.md` §2.4).
