# TASK-018 — 웹 정렬 TOP3 선택 프로토타입

## Status
코드 검증·Android Visual QA PASS · 사용자 실행 확인 대기

## Owner
role:design-system — Codex

## Branch
ui/TASK-018-top3-selection-prototype

## Goal
TASK-017의 웹 정렬 권장 시각 언어를 기존 Android 결과 프로토타입에 토큰 기반으로 반영하고, TOP3 선택의 확대·축소와 선택 유형 상세 이동을 실제 Android에서 검증한다. 사용자가 비교를 요청한 고객 여정은 제품 확정 기능과 구분된 탐색 영역으로만 제공한다.
관련 이슈: 미생성
관련 요구사항: PRD FR-002~FR-006·FR-012, `docs/product/requirements/RESULT_IA.md` D1~D15

## Completed

- 압축된 완료 히어로, 흰 카드·딥 네이비·차가운 회색·단일 오렌지 행동이라는 TASK-017 권장 시각 언어를 실행 프로토타입에 반영했다.
- 선택한 TOP3 카드는 확대하고 이미지·특징을 노출하며, 다른 두 카드는 비교 가능한 이름과 순위를 유지하도록 구현했다.
- TOP3 `더보기`가 현재 선택 유형의 상세 시작점으로 이동하도록 구현했다.
- 시스템 `Reduce motion` 설정을 반영한 선택 전환과 스크롤을 구현했다.
- 고객 여정을 유형별 탐색 기능으로 추가하고 `AI 해석 기반 시안`, `제품 미확정`, MVP 계약 밖이라는 경계를 화면 안에 표시했다.
- 중단됐던 작업을 재검토해 큰 글자 대응 스타일 10개가 누락된 TypeScript 오류를 발견하고 보완했다.
- 디자인 토큰, lint, typecheck, Android export와 API 37 Android 렌더링을 다시 검증했다.
- 에뮬레이터 글자 크기를 200%로 바꿔 상단·TOP3·3위 선택·하단·AI 펼침을 확인한 뒤 100%로 복원했다.

## Changed

- `frontend/mobile/src/prototypes/result/ResultPrototype.tsx` — 웹 정렬 시각 계층, 동적 TOP3, `더보기`, reduced motion, 고객 여정, 큰 글자 보완
- `docs/design/evidence/TASK-018/**` — Android PNG·UIAutomator XML과 검증 경계
- `docs/handoffs/active/TASK-018-top3-selection-prototype.md` — 현재 상태와 다음 게이트

## Decisions

- 제품 공용 컴포넌트를 확정하지 않고 TASK-016과 같은 프로토타입 파일 안에서만 변경한다.
- 선택 상태는 크기·테두리·배경·배지·텍스트를 함께 사용하며 색만으로 전달하지 않는다.
- 200% 글자에서는 헤더를 줄바꿈하고 장식용 히어로 차트를 숨겨 핵심 텍스트 공간을 우선한다.
- 고객 여정은 현재 정본 밖이므로 제품 기능으로 주장하지 않고 화면 안에서 탐색 기능임을 명시한다.
- 앱 package와 scheme은 제품·플랫폼 결정 없이 임의로 추가하지 않는다.

## Verification

**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.

| 검증 | 명령 | 결과 |
|---|---|---|
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS |
| lint | `npm --prefix frontend/mobile run lint` | PASS |
| typecheck | `npm --prefix frontend/mobile run typecheck` | 최초 누락 스타일 10개로 FAIL, 수정 후 PASS |
| test | 없음 — 프론트엔드 단위 테스트 미도입 | 없음 |
| build | `npm --prefix frontend/mobile run export:android` | sandbox `spawn EPERM` 후 권한 확장 재실행 PASS |
| Visual QA | API 37 Expo Go, 1080×2400·420dpi | 기본·2위·3위 선택·더보기·고객 여정·AI 펼침·200% 글자 PASS |
| 접근성 | UIAutomator XML | TOP3 레이블·선택 상태, 더보기, 하단 내비게이션, AI 펼침·접힘 이름 PASS |
| TalkBack 발화 | 미실행 — 재검증 시 서비스 비활성 | 미확인 |
| 실기기 | 미실행 — USB 기기 미연결 | 미확인 |

## Unresolved

- 사용자가 현재 실행 중인 프로토타입을 직접 조작해 동적 TOP3와 고객 여정 조합을 승인하거나 수정점을 남겨야 한다.
- 고객 여정을 제품에 포함하려면 `role:product`가 PRD와 `RESULT_IA`를 먼저 갱신해야 한다.
- RESULT_IA D8·D12·D15의 유형 부족·첫 분석 전·오류 상태는 별도 설계가 필요하다.
- 최소 Android OS, 지원 기기 범위, `android.package`, scheme은 확정되지 않았다.
- `frontend/mobile/README.md`와 `AGENTS.md`의 로컬 도구 설명은 Android SDK·AVD가 없다고 적혀 있으나 현재 PC에는 SDK와 `Medium_Phone` AVD가 있다. 플랫폼 소유 문서 갱신이 필요하다.
- 독립 Reviewer 검토는 미실행이다. 이번 턴에는 현재 작업을 직접 재검토하고 코드·Android 검증까지만 완료했다.

## Do Not Assume

- 이 프로토타입은 제품 Vertical Slice나 실제 홈 화면이 아니다.
- 이미지·상호명·리뷰·날짜·수치는 전부 가상이다.
- 고객 여정은 제품 확정 기능이 아니다.
- Expo Go의 회색 설정 버튼과 scheme 경고는 앱 UI가 아니다.
- UIAutomator 의미 트리 확인은 사람이 들은 TalkBack 한국어 발화 검증을 대신하지 않는다.
- 하단 바의 다른 화면과 근거 전체 보기는 실제 기능에 연결되지 않았다.

## Next Action

사용자가 실행 중인 Android 프로토타입에서 세 TOP3 전환, `더보기`, 고객 여정을 직접 확인하고 조합을 승인하거나 구체적인 수정점을 남긴다.

## Last Verified Commit

`59be2ae` — `feat(mobile): refine TOP3 result prototype`
