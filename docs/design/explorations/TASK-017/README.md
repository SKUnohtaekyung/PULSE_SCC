# TASK-017 — `pulse_FE` 정렬 모바일 결과 화면 탐색

## Status

별도 웹 저장소 `C:\Users\303\Desktop\pulse_FE`의 실제 렌더링과 SCC의 기존 Android 결과 프로토타입을 다시 대조해 네 가지 모바일 시안을 만들었다. 이 작업은 **디자인 비교용 탐색**이며 제품 코드나 확정 디자인 시스템을 변경하지 않는다.

> 화면의 상호명·리뷰·날짜·건수는 모두 가상 데이터다. 네 PNG에도 `디자인 탐색 · 가상 데이터`를 표시했다. ImageGen 결과는 배치와 시각 언어를 검토하기 위한 참고 이미지이며, 화면 문자열·간격·접근성 통과를 보장하는 구현 산출물이 아니다.

## Sources reviewed

### SCC 정본과 현재 구현

- [PRD](../../../product/PRD.md)
- [결과 화면 IA](../../../product/requirements/RESULT_IA.md)
- [디자인 시스템](../../DESIGN_SYSTEM.md)
- [TASK-016 합성안](../../synthesis/TASK-016/README.md)
- [TASK-016 Android 실행 증거](../../evidence/TASK-016/android-live.png)
- `frontend/mobile/src/prototypes/result/ResultPrototype.tsx`

### 웹 참고 저장소

읽기 전용으로 다음 파일을 확인했다.

- `C:\Users\303\Desktop\pulse_FE\src\features\insight\UnifiedInsightPage.jsx`
- `C:\Users\303\Desktop\pulse_FE\src\features\insight\JourneyMapSection.jsx`
- `C:\Users\303\Desktop\pulse_FE\src\components\layout\DashboardLayout.jsx`
- `C:\Users\303\Desktop\pulse_FE\src\components\layout\Sidebar.jsx`
- `C:\Users\303\Desktop\pulse_FE\MD\design_guide.md`
- `C:\Users\303\Desktop\pulse_FE\tailwind.config.js`
- `C:\Users\303\Desktop\pulse_FE\src\styles\globals.css`

2026-09-21에 웹 HEAD `d57e75470fbec25f8efc79a1b5c320d360b05696`을 기준으로 Vite 개발 서버에서 데스크톱과 390×844 모바일 뷰포트를 직접 확인했다. 검토 종료 시 `pulse_FE` working tree가 clean임을 다시 확인했다.

## Web review

| 판단 | 내용 |
|---|---|
| 가져올 것 | 딥 네이비, 차가운 회색 캔버스, 흰 카드, 행동에만 쓰는 오렌지, 선택 카드의 옅은 파랑+네이비 테두리, 큰 모서리, 태그 칩, 명확한 제목 계층 |
| 모바일에 맞게 바꿀 것 | 데스크톱의 목록/상세 2열 구조와 사이드바를 한 열 세로 탐색으로 변환하고 터치 영역을 44px 이상으로 설계 |
| 가져오지 않을 것 | 모바일에서 잘리는 데스크톱 레이아웃, 사람 아바타와 인구통계 암시, 점수·비율처럼 보이는 미확인 수치, MVP 밖 `릴스 제작` 행동 |
| 보류할 것 | 웹의 고객 여정 지도는 매력적인 시각 요소지만 현재 PRD와 `RESULT_IA`의 확정 결과 계약이 아니므로 제품 화면에 확정하지 않음 |

실제 모바일 렌더링에서는 데스크톱 2열 폭이 유지되어 오른쪽 상세 영역이 화면 밖으로 잘렸다. 따라서 앱은 웹을 그대로 축소하지 않고 **시각 언어만 계승한 모바일 전용 구조**가 필요하다.

## Re-review of TASK-016

기존 Android 프로토타입은 `RESULT_IA` D1–D15 중 정상 결과 흐름, TOP3 선택, 4관점, 대표 근거, 사실과 AI 해석 분리, 접힌 참고 지식, 하단 내비게이션을 이미 검증했다. 이번 탐색에서도 다음을 유지한다.

- `분석 메타정보 → TOP3 → 선택 유형 → 4관점 → 대표 근거 → 검토할 행동 → 접힌 AI 해석·지식` 순서
- 세 유형을 동시에 비교할 수 있는 3칸 포디움과 최초 1위 선택
- 사람·연령·성별·직업을 추정하지 않는 음식 중심 이미지
- 이미지 없이도 유형명·특징·근거를 이해할 수 있는 텍스트 구조
- 단일 오렌지 주요 행동과 `홈 → 분석하기 → 마이페이지` 하단 내비게이션
- 리뷰 한계, AI 생성 이미지 고지, 사실과 추론의 언어·구조 분리

기존 화면에서 개선할 부분은 상단의 큰 빈 공간, 웹과 다른 평면적인 첫인상, 가게 특성과 맞지 않는 1위 음식 이미지, 반복되는 카드의 시각적 단조로움이다.

## Variants

| 시안 | 강점 | 한계 / 판단 |
|---|---|---|
| [A — Journey](web-aligned-a-journey.png) | 웹의 요약·선택 카드·고객 여정을 가장 직접적으로 계승 | 고객 여정과 일부 CTA가 확정 범위를 넘으므로 시각 탐색 전용 |
| [B — Evidence](web-aligned-b-evidence.png) | 네 관점의 핵심을 빠르게 훑고 근거 건수를 명확히 확인 | 대표 리뷰와 사실/AI 분리가 충분히 보이지 않아 단독 채택 불가 |
| [C — Focus](web-aligned-c-focus.png) | 큰 터치 영역과 여백, 한 손 탐색, 선택 유형 집중도가 가장 좋음 | 가로 캐러셀이 3칸 포디움의 동시 비교성을 약화할 수 있음 |
| [Final — Recommended](web-aligned-final-recommended.png) | 웹의 브랜드 감각과 SCC의 확정 IA를 함께 유지하고 사실+행동을 기본 노출 | 실제 구현 후 작은 화면·큰 글자·TalkBack 재검증 필요 |

## Recommended direction

최종 권장안은 다음 조합이다.

1. C의 압축된 네이비 완료 히어로와 상단 정보 밀도
2. B의 세 유형 동시 비교와 근거 우선 행 구조
3. A의 카드 질감, 태그, 명확한 선택 상태
4. TASK-016의 4관점·대표 리뷰·사실+행동·접힌 AI/지식 순서
5. 사용자가 선호한 중앙 원형 `분석하기` 하단 내비게이션

최종 권장안에는 상단 알림·프로필, TOP3 `더보기`, 별도 제안 CTA를 두지 않는다. 검토할 행동은 화면에 기본 노출하고, 유일한 오렌지 주요 행동은 중앙 `분석하기` 아이콘으로 제한한다. 흰 배경의 작은 레이블과 내비게이션 문자는 네이비를 사용한다.

웹의 고객 여정은 최종 권장안에서 제외했다. 제품 요구사항에 추가하려면 먼저 `role:product`가 PRD와 `RESULT_IA`를 갱신해야 한다.

## ImageGen provenance

생성 방식: Codex 내장 ImageGen. 첫 안은 실제 `pulse_FE` 데스크톱 렌더링을 시각 참고로 사용했고, 이후 안은 앞선 모바일 결과를 참조해 서로 다른 정보 구조를 만들었다.

| 파일 | 크기 | SHA-256 | 프롬프트 요약 |
|---|---:|---|---|
| `web-aligned-a-journey.png` | 841×1870 | `eb5e6fc983bbb3b9f0a2744c78bc05f34b2bd1e1b67a315cc3520e7a6f0310d2` | 웹의 요약·TOP3·고객 여정을 모바일 한 열로 변환, 시안 고지 추가 |
| `web-aligned-b-evidence.png` | 841×1870 | `35581d96a14ef33a986d8aa543573ef1bbc5ebba910b099efe93f5ca618e5099` | 네 관점의 리뷰 근거를 본문 중심으로 배치, 시안 고지 추가 |
| `web-aligned-c-focus.png` | 841×1870 | `b998205a8bcb735a7e8f571fe84e9fbb36fe5cc51bdce8d32c2d0c2ccf1dfa77` | 큰 선택 카드와 단계적 공개로 모바일 집중도 강화, 시안 고지 추가 |
| `web-aligned-final-recommended.png` | 841×1870 | `8be9c68acf8fd9b767318ca4674fe6b7904e059b1077a9406074a34ede6f7273` | 정본 밖 동작·중복 CTA·저대비 주황 텍스트를 제거한 최종 합성 |

원본은 Codex 생성 이미지 디렉터리에 유지하고, 이 폴더에는 프로젝트 검토용 복사본을 보존한다.

## Validation boundary

- 네 PNG를 육안으로 확인하고 크기와 SHA-256을 기록했다.
- `pulse_FE`의 고정 commit에서 데스크톱·390×844 실제 렌더링을 확인했다.
- 독립 리뷰 초회 NO-GO에서 정본 밖 동작, 가상 데이터 고지, 오렌지 대비, 웹 기준점, 문구 오류를 발견해 이미지와 문서를 수정했다.
- SCC 앱 코드는 바꾸지 않았으므로 lint, typecheck, Android export, TalkBack은 이번 탐색에 적용하지 않았다.
- 최종 시안을 코드로 옮길 때는 디자인 토큰만 사용하고, ImageGen이 그린 아이콘·문자·간격을 그대로 자산화하지 않는다.
