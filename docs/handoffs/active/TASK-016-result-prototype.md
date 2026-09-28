# TASK-016 — 결과 화면 Design Synthesis 실행 프로토타입

## Status
Step 5 독립 리뷰 PASS · 사용자 실행 확인 대기

## Owner
role:design-system — Codex

## Branch
ui/TASK-016-result-prototype

## Goal
사용자가 선택한 A의 전체 정보 구조, D의 하단 내비게이션, 음식 중심 TOP3를 하나의 Step 5 합성안으로 정리하고 Android에서 직접 조작 가능한 개발용 프로토타입으로 검증한다.
관련 이슈: 미생성 — GitHub 인증 복구 후 연결 필요
관련 요구사항: PRD FR-002~FR-006·FR-012, `docs/product/requirements/RESULT_IA.md` D1~D15

## Completed
- 사용자 선택 조합과 UX 근거를 Design Synthesis 문서에 정리했다.
- 사람·인구통계 단서가 없는 TOP3 ImageGen PNG 3개를 생성하고 출처·해시·용도를 기록했다.
- TOP3 탭 전환, 4관점, 대표 근거, 리뷰 사실+행동, AI·지식 펼치기, 고정 하단 바를 개발용 프로토타입으로 구현했다.
- 기존 TokenShowcase는 `/foundation` 경로로 보존했다.
- API 37 Expo Go에서 기본·2위 선택·하단·AI 펼치기·글자 200%를 실제 렌더링했다.
- 200%에서 발견한 TOP3 말줄임 문제를 수정하고 재검증했다.
- 독립 리뷰에서 발견한 하단 라벨 대비, 펼침 행동명, 참고 지식 출처 진입점 문제를 수정했다.
- 수정 후 Android에서 AI·참고 지식 `접기`, 시안용 출처 안내, 200% 상·하단을 재검증하고 독립 리뷰 PASS를 받았다.

## Changed
- `frontend/mobile/src/prototypes/result/ResultPrototype.tsx` — 선택 조합의 실행 프로토타입
- `frontend/mobile/src/app/index.tsx` — 기본 개발 진입점을 프로토타입으로 연결
- `frontend/mobile/src/app/foundation.tsx` — 기존 토큰 쇼케이스 경로 보존
- `frontend/mobile/assets/images/personas/prototype/**` — TOP3 ImageGen 에셋과 manifest
- `docs/design/synthesis/TASK-016/README.md` — Step 5 선택 요소·이유·IA 매핑
- `docs/design/evidence/TASK-016/**` — Android 실행 증거와 한계
- `docs/handoffs/active/TASK-016-result-prototype.md` — 현재 상태와 다음 게이트

## Decisions
- 전체 화면의 카드·근거 흐름은 A, 하단 내비게이션과 음식 중심 TOP3는 D 계열을 사용한다.
- 탐색 시안과 정본이 충돌하면 RESULT_IA를 우선해 사실+행동을 먼저, AI·지식은 접힌 상태로 둔다.
- 제품 공용 컴포넌트를 확정하지 않고 모든 새 UI를 `src/prototypes/result`에 격리한다.
- 사람 페르소나 대신 음식·상차림 이미지를 사용하지만, 유형명·특징·근거는 이미지 없이도 이해 가능하게 유지한다.

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS |
| lint | `npm --prefix frontend/mobile run lint` | PASS |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS |
| test | 없음 — 프론트엔드 단위 테스트 미도입 | 없음 |
| build | `npm --prefix frontend/mobile run export:android` | sandbox `spawn EPERM` 후 권한 확장 재실행 PASS |
| Visual QA | API 37 Expo Go, 1080×2400·420dpi | 기본·탭 전환·하단·AI/참고 지식 펼치기 PASS, 200% 최초 FAIL 수정 후 PASS |
| 접근성 | UIAutomator + TalkBack 서비스·TTS audio focus | 의미 레이블 PASS, 사람의 한국어 발화 청취·전체 초점 순서는 미확인 |
| 실기기 | 미실행 — USB 기기 미연결 | 미확인 |
| 독립 리뷰 | 초회 P1 1건·P2 2건 수정 후 재검토 | 잔여 P0~P3 없음, Step 5 PASS |

## Unresolved
- 사용자가 실행본을 보고 `첫 번째`·`다섯 번째` 해석과 세부 조합을 최종 확인해야 한다.
- RESULT_IA D8·D12·D15의 유형 부족·첫 분석 전·오류 상태는 구현하지 않았다.
- 최소 Android OS, 지원 기기 범위, compact API/TalkBack 조합이 미정이다.
- `android.package`·scheme이 미정이어서 development build와 USB 실기기 검증을 하지 않았다.
- GitHub 인증 복구 전까지 관련 이슈를 생성·연결하지 못한다.

## Do Not Assume
- 이 프로토타입은 제품 Vertical Slice나 실제 홈 화면이 아니다.
- 이미지·상호명·리뷰·날짜·수치는 전부 가상이다.
- Expo Go의 회색 설정 버튼과 scheme 경고는 앱 UI가 아니다.
- 하단 바의 다른 화면과 근거 전체 보기는 실제 기능에 연결되지 않았다.
- 에뮬레이터 TalkBack 신호는 실기기에서 사람이 들은 한국어 발화 검증을 대신하지 않는다.

## Next Action
사용자가 현재 실행 중인 프로토타입을 직접 조작해 조합을 승인하거나 수정점을 남긴다. 승인되면 Step 6 디자인 절차로 이동하되, 제품 Vertical Slice는 별도 미결 게이트를 해결하기 전까지 시작하지 않는다.

## Last Verified Commit
`d05266a` — `feat(mobile): 결과 화면 합성 프로토타입 추가`
