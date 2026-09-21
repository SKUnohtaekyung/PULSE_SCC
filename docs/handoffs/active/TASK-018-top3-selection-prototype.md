# TASK-018 — 웹 정렬 TOP3 선택 프로토타입

## Status
사용자 피드백·Codex 리뷰 반영, 코드 검증과 Android Visual QA(글자 100%·200%) PASS · Reviewer·최종 사용자 확인 대기

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
- 사용자 참고 이미지에 맞춰 완료 히어로를 딥 네이비로 바꾸고 달력·문서·체크·반짝임 장식을 추가했다.
- TOP3의 화면상 순위 배지를 제거하고 선택 카드의 크기·브랜드 테두리·태그·설명·페이지 표시로 현재 선택을 전달하도록 수정했다. 순위와 선택 상태는 접근성 레이블에 유지했다.
- 1·2·3위 전환과 200% 글자 크기를 다시 실행 검증하고 최종 화면을 Android 캡처로 남겼다.
- 2026-09-21 Codex CLI 읽기 전용 리뷰(5건) 중 4건을 Claude Code 세션에서 반영했다.
  - 히어로에 플랫폼·리뷰 수와 수집·분석 완료 시점을 구분해 표시했다 (PRD 사용자 흐름 4단계, RESULT_IA 분석 기준 정보).
  - TOP3 카드 이미지는 탭 버튼 레이블과 중복되므로 접근성 트리에서 제외하고, 선택 유형 상세 이미지만 대체 텍스트를 가진 포커스 요소로 만들었다.
  - 펼침 버튼 안에 중첩됐던 출처 링크를 버튼 밖으로 분리했다.
  - evidence README의 캡처를 시점별 묶음으로 나눠 최종 판정 근거를 명확히 했다.
- 유형 부족·loading·empty·error 상태 지적은 이번에 반영하지 않았다. 아래 Unresolved의 D8·D12·D15 항목과 같다.

## Changed

- `frontend/mobile/src/prototypes/result/ResultPrototype.tsx` — 웹 정렬 시각 계층, 동적 TOP3, `더보기`, reduced motion, 고객 여정, 큰 글자 보완
- `docs/design/evidence/TASK-018/**` — Android PNG·UIAutomator XML과 검증 경계
- `docs/handoffs/active/TASK-018-top3-selection-prototype.md` — 현재 상태와 다음 게이트

## Decisions

- 제품 공용 컴포넌트를 확정하지 않고 TASK-016과 같은 프로토타입 파일 안에서만 변경한다.
- 선택 상태는 크기·브랜드 테두리·태그·상세 문구·페이지 표시를 함께 사용하며 색만으로 전달하지 않는다. 화면상 `N위 선택됨` 배지는 사용자 피드백에 따라 제거한다.
- 순위 정보는 화면 순서와 `N / 3` 페이지 표시, 접근성 레이블에 유지한다.
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
| build | `npm --prefix frontend/mobile run export:android` | 사용자 피드백 반영 후 재실행 PASS |
| Visual QA | API 37 Expo Go, 1080×2400·420dpi | 사용자 피드백 반영 후 기본·2위·3위 선택·200% 글자 재검증 PASS |
| 접근성 | UIAutomator XML | 화면상 순위 배지 없이도 TOP3 순위 레이블·선택 상태, 더보기, 하단 내비게이션 이름 PASS |
| Codex 리뷰 반영 후 코드 검증 | `verify:tokens`, `lint`, `typecheck`, `export:android` | 전부 PASS (2026-09-21, 커밋 전 작업 트리) |
| Codex 리뷰 반영 후 Visual QA | API 37 Expo Go 완전 재실행, 글자 100%·200% | 히어로 분석 기준 정보·참고 지식 펼침 PASS. 200%에서 출처 링크 여백 초과를 발견해 수정 후 재캡처 PASS |
| Codex 리뷰 반영 후 접근성 | UIAutomator XML | TOP3 이미지 비포커스·빈 설명, 상세 이미지 포커스·대체 텍스트, 펼침 버튼과 출처 링크 분리 PASS |
| TalkBack 발화 | 미실행 — 재검증 시 서비스 비활성 | 미확인 |
| 실기기 | 미실행 — USB 기기 미연결 | 미확인 |

## Unresolved

- 사용자가 현재 실행 중인 프로토타입을 직접 조작해 동적 TOP3와 고객 여정 조합을 승인하거나 수정점을 남겨야 한다.
- 고객 여정을 제품에 포함하려면 `role:product`가 PRD와 `RESULT_IA`를 먼저 갱신해야 한다.
- RESULT_IA D8·D12·D15의 유형 부족·첫 분석 전·오류 상태는 별도 설계가 필요하다.
- 최소 Android OS, 지원 기기 범위, `android.package`, scheme은 확정되지 않았다.
- `frontend/mobile/README.md`와 `AGENTS.md`의 로컬 도구 설명은 Android SDK·AVD가 없다고 적혀 있으나 현재 PC에는 SDK와 `Medium_Phone` AVD가 있다. 플랫폼 소유 문서 갱신이 필요하다.
- Codex 리뷰 반영분은 `reviewer` 서브에이전트 독립 검토 PASS(P0~P2 없음, 문서 P3 4건 반영)를 받았다. TASK-018 전체 변경(`f38658a..HEAD`)에 대한 독립 검토는 아직 받지 않았다. Codex CLI 리뷰는 보조 의견이다.
- 히어로의 수집 시점과 분석 완료 시점은 둘 다 가상 날짜 `2026.09.18`이다. 두 시점을 구분하는 표시 형식만 검증했다.

## Do Not Assume

- 이 프로토타입은 제품 Vertical Slice나 실제 홈 화면이 아니다.
- 이미지·상호명·리뷰·날짜·수치는 전부 가상이다.
- 고객 여정은 제품 확정 기능이 아니다.
- Expo Go의 회색 설정 버튼과 scheme 경고는 앱 UI가 아니다.
- UIAutomator 의미 트리 확인은 사람이 들은 TalkBack 한국어 발화 검증을 대신하지 않는다.
- 하단 바의 다른 화면과 근거 전체 보기는 실제 기능에 연결되지 않았다.

## Next Action

사용자가 실행 중인 Android 프로토타입에서 수정된 완료 히어로와 세 TOP3 전환, `더보기`, 고객 여정을 직접 확인하고 조합을 승인하거나 구체적인 수정점을 남긴다.

## Last Verified Commit

`ee30a46` — `fix(mobile): restore result metadata and separate source link`. Codex 리뷰 반영분의 코드 검증·Android 100%·200% Visual QA·reviewer PASS가 유효하다
