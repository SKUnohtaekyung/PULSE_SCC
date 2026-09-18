# TASK-014 — Design Foundation

## Status

리뷰 대기 — Design Foundation 구현·보조 웹 Visual QA 완료, Android 네이티브 검증·독립 리뷰 전

## Owner

`role:design-system` — 미배정

## Branch

`ui/TASK-014-design-tokens`

## Goal

`preview.html`의 Step 3에 따라 Design Token·Component Rules·Asset Rules를 실행 가능한 코드와 문서 기준으로 확정하고, 다음 ImageGen 디자인 탐색이 흔들리지 않을 기반을 만든다.

관련 이슈: 생성 전
관련 요구사항: `docs/design/DESIGN_SYSTEM.md`, PRD FR-004·FR-007, 기능명세 RESULT-005

## Completed

- 색상·타입·간격·모서리·선·그림자·모션·breakpoint·접근성 값을 readonly semantic theme으로 구현했다.
- WCAG 2.2 AA 기준으로 대표 텍스트·상태색 8개 조합을 자동 검증한다.
- Pretendard v1.3.9 Regular·Medium·SemiBold·Bold와 OFL을 포함하고 SHA-256 무결성 검증을 추가했다.
- 개발용 Token Showcase를 만들어 compact·expanded 레이아웃과 실제 폰트 렌더링을 확인했다.
- Design System에 Component Rules와 ImageGen 포함 Asset Rules를 반영하고 코드 정본 위치를 프로젝트 문서와 동기화했다.

## Changed

- `frontend/mobile/src/design/tokens/**` — semantic Design Foundation 정본
- `frontend/mobile/src/design/fonts.ts`, `frontend/mobile/assets/fonts/**` — Pretendard 로더·공식 자산·라이선스·해시
- `frontend/mobile/scripts/verify-design-tokens.mjs` — 색상 대비·스케일·breakpoint·자산 무결성 검증
- `frontend/mobile/src/design/TokenShowcase.tsx`, `frontend/mobile/src/app/**` — 개발용 토큰 렌더링 견본과 전역 폰트 로드
- `docs/design/DESIGN_SYSTEM.md` — 구현값·WCAG 목표·Asset Rules와 남은 결정 동기화
- `AGENTS.md`, `.claude/skills/verify/SKILL.md`, `README.md`, `docs/architecture/ARCHITECTURE.md`, `frontend/mobile/README.md` — 정본 경로·검증 명령·현재 상태 동기화
- `.gitattributes` — 공식 OTF와 OFL 원문을 byte-for-byte 보존

## Decisions

1. 제품 접근성 목표는 WCAG 2.2 AA로 두고 일반 텍스트 4.5:1, 큰 텍스트·비텍스트 3:1을 최소값으로 검증한다.
2. 기존 반투명 action `#FF5A36CC`는 source overlay로만 보존한다. CTA는 불투명 `#FF5A36`과 `#191F28` 조합을 사용해 5.34:1을 확보한다.
3. spacing은 4px 기본 단위, radius는 8/12/24px, breakpoint는 600/1024px, 제품 터치 영역은 최소 44px로 확정한다.
4. Android 7까지의 폰트 호환성을 위해 Pretendard 가변 폰트 하나보다 실제 사용하는 정적 굵기 4종을 포함한다.
5. ImageGen 시안은 Step 4의 UX 가설 탐색 자료이며, 선택 전에는 제품 에셋으로 넣지 않는다.

## Verification

| 검증 | 명령·방법 | 결과 |
|---|---|---|
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS — 글꼴·OFL 5개 SHA-256, 대비 8개, spacing·타입·breakpoint·target size |
| lint | `npm --prefix frontend/mobile run lint` | PASS |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS |
| unit/integration test | 프로젝트 명령 | 없음 — 프론트엔드 테스트 러너 미도입 |
| Android JS bundle | `npm --prefix frontend/mobile run export:android` | PASS — Hermes bundle, Pretendard 4개 포함 |
| 문서 링크 | `docs/**/*.md` 상대 링크 검사 | PASS — 123개 확인, 깨진 링크 0개 |
| 보조 Web Visual QA | Expo web, CSS 390×844·1024×800 | PASS — document와 scroll width 일치, 가로 overflow 0, 하단까지 스크롤, Pretendard Medium 실제 스타일 확인 |
| Android native Visual QA | development build·실기기/에뮬레이터 | 미실행 — Android SDK·adb·에뮬레이터 없음 |
| 독립 Reviewer | — | 미실행 |

## Unresolved

1. 최소 지원·검증 Android 기기와 TalkBack 조합 확정
2. Android development build에서 Pretendard·그림자·글자 확대 실제 확인
3. 정적 OTF 4종이 최종 앱 크기에 미치는 영향 측정과 필요 시 subsetting 검토
4. 공용 UI 컴포넌트와 interaction state 구현
5. 페르소나 이미지 화풍·톤·구성, 결과 카드 시안

## Do Not Assume

- Web Visual QA는 Android 네이티브 완료 근거가 아니다.
- 자동 대비 검사는 대표 불투명 조합만 보장한다. 이미지 위 텍스트와 반투명 합성, 모든 컴포넌트 상태는 화면별로 다시 검증한다.
- 현재 첫 route는 제품 화면이 아니라 개발용 Token Showcase다.
- `boxShadow`의 Android 7 fallback은 `elevation`이며 네이티브 결과를 아직 보지 못했다.
- Design Foundation이 생겼지만 공용 Button·Input·Card 컴포넌트는 아직 없다.
- ImageGen 시안은 제품 에셋이나 Figma 정본이 아니다.
- 공용 계약·아키텍처·검증 문서 변경은 `role:platform` 리뷰가 필요하다.

## Next Action

Step 4 `Design Exploration` Task에서 ImageGen으로 핵심 결과 경험에 대한 서로 다른 UX 가설 3~4개를 만들고, 각 시안에서 채택할 요소와 버릴 요소를 Design Foundation·Result IA·State Model 기준으로 비교한다.

## Last Verified Commit

`ed8de82` — Design Foundation 코드·문서, 토큰 검증, lint·typecheck·Android bundle·보조 Web Visual QA가 유효한 커밋.
