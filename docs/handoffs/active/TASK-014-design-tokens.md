# TASK-014 — Design Foundation

## Status

Step 4 진입 가능 — Design Foundation 독립 리뷰 PASS, Android 에뮬레이터 QA 완료. 전체 Task DoD는 `[SPEC]` 이슈와 최종 네이티브 접근성 검증 전까지 미완료

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
- Android 17/API 37 에뮬레이터에서 기본 렌더링·200% 글자 확대·TalkBack 접근성 초점과 라벨을 확인했다.
- 개발용 Token Showcase의 시각적 heading을 접근성 heading으로 맞추고, 정적 `분석하기` 예시가 실행 버튼으로 오인되지 않도록 명시적 비동작 라벨을 추가했다.

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
4. 구형 Android의 가변 폰트 동작에 의존하지 않도록 Pretendard 가변 폰트 하나보다 실제 사용하는 정적 굵기 4종을 포함한다. 이 결정은 최소 지원 OS를 확정하지 않는다.
5. ImageGen 시안은 Step 4의 UX 가설 탐색 자료이며, 선택 전에는 제품 에셋으로 넣지 않는다.

## Verification

| 검증 | 명령·방법 | 결과 |
|---|---|---|
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS — 글꼴·OFL 5개 SHA-256, 대비 8개, spacing·타입·breakpoint·target size |
| lint | `npm --prefix frontend/mobile run lint` | PASS |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS |
| unit/integration test | 프로젝트 명령 | 없음 — 프론트엔드 테스트 러너 미도입 |
| Android JS bundle | `npm --prefix frontend/mobile run export:android` | PASS — Hermes bundle, Pretendard 4개 포함 |
| 문서 링크 | `docs/**/*.md` 상대 링크 검사 | PASS — 128개 확인, 깨진 링크 0개 |
| 보조 Web Visual QA | Expo web, CSS 390×844·1024×800 | PASS — document와 scroll width 일치, 가로 overflow 0, 하단까지 스크롤, Pretendard Medium 실제 스타일 확인 |
| Android native Visual QA | Android 17/API 37 `Medium_Phone` AVD + Expo Go | PASS — 기본·200% 글자 확대에서 앱 콘텐츠 가로 잘림·겹침 없음. [증거](../../design/evidence/TASK-014/README.md) |
| TalkBack | 실제 TalkBack service + TTS + 접근성 초점/UI tree | PARTIAL PASS — service·TTS·정적 action 비클릭 라벨·heading role 확인. 사람의 발화 청취는 미확인 |
| Android development build | `expo run:android` | 미실행 — `android.package` 제품·플랫폼 결정 전이며 임의 생성하지 않음 |
| USB 실기기 | `adb devices -l` | 미실행 — 연결 기기 없음 |
| 독립 Reviewer | 별도 읽기 전용 Agent, `59088bb..HEAD` 및 working tree | PASS — 접근성 의미 구조 해결, 지원 범위는 제품 구현 선행 게이트로 격리. TASK-014 전체 DoD는 미완료 |

## Unresolved

1. **제품 구현 선행 게이트:** 최소 지원 Android OS·지원 기기 범위·대표 compact 기기/API·TalkBack 검증 조합을 `role:product`가 확정해야 한다. 제품 화면 코드는 이 결정 전 시작하지 않는다.
2. `[SPEC]` GitHub issue 생성 필요 — 현재 `gh` 인증 토큰이 유효하지 않아 생성하지 못함.
3. `android.package`·linking `scheme` 확정 후 development build와 USB 실기기에서 Pretendard·그림자·글자 확대·발화 청취 확인
4. 정적 OTF 4종이 최종 앱 크기에 미치는 영향 측정과 필요 시 subsetting 검토
5. 공용 UI 컴포넌트와 interaction state 구현
6. 페르소나 이미지 화풍·톤·구성, 결과 카드 시안

## Do Not Assume

- Web Visual QA는 Android 네이티브 완료 근거가 아니다.
- 자동 대비 검사는 대표 불투명 조합만 보장한다. 이미지 위 텍스트와 반투명 합성, 모든 컴포넌트 상태는 화면별로 다시 검증한다.
- 현재 첫 route는 제품 화면이 아니라 개발용 Token Showcase다.
- Android 에뮬레이터 결과는 USB 실기기·development build·사람이 직접 들은 TalkBack 발화를 대신하지 않는다.
- `boxShadow`의 구형 Android fallback은 `elevation`이며 최소 지원 OS는 아직 확정되지 않았다.
- Design Foundation이 생겼지만 공용 Button·Input·Card 컴포넌트는 아직 없다.
- ImageGen 시안은 제품 에셋이나 Figma 정본이 아니다.
- 공용 계약·아키텍처·검증 문서 변경은 `role:platform` 리뷰가 필요하다.

## Next Action

Step 4 `Design Exploration` Task에서 ImageGen으로 핵심 결과 경험에 대한 서로 다른 UX 가설 3~4개를 만들고, 각 시안에서 채택할 요소와 버릴 요소를 Design Foundation·Result IA·State Model 기준으로 비교한다. 독립 Reviewer가 이 범위의 진입을 `GO`로 판정했다. Step 4는 구현 전 탐색까지만 진행하며, 제품 화면 코드는 Android 지원 범위가 확정되기 전 시작하지 않는다.

## Last Verified Commit

`985b79f` — Design Foundation 코드·문서, 접근성 의미 구조 보완, 토큰 검증·lint·typecheck·Android bundle, 웹 QA·Android 에뮬레이터 QA와 독립 리뷰가 유효한 커밋.
