# TASK-020 — 프론트엔드 화면 상태 모델

## Status

진행중 — State Model 2차 자체 교차 검토·문서 검증 완료, 독립 제품·디자인 검토 전

## Owner

`role:product` — 미배정

## Branch

`docs/TASK-020-frontend-state-model`

## Goal

`preview.html`의 작업 순서에 따라 기존 IA·User Flow 다음 단계인 화면별 State Model을 만들고, 첫 Android Vertical Slice가 정상·진행·빈 상태·오류·복구 상태를 빠뜨리지 않게 한다.

관련 이슈: 생성 전
관련 요구사항: PRD FR-001~FR-012, 기능명세 `SC-AUTH`, `SC-001`~`SC-012`

## Completed

- 프로젝트 계약, PRD, User Flow, Result IA, 기능명세가 Step 0~1을 충족하는지 대조했다.
- `docs/product/requirements/SCREEN_STATES.md`에 앱 시작·인증·가게 지정·분석 진행·결과·근거·이미지·제안·저장·마이페이지·내비게이션 상태를 작성했다.
- 첫 Vertical Slice에서 반드시 연결할 상태 범위를 정의했다.
- 확정된 요구사항과 오프라인·polling·route·보관 정책 등 미정 항목을 분리했다.
- 기능명세의 논리 화면 13개 추적과 저장소 내 Markdown 상대 링크를 검증했다.
- PRD·기능명세·User Flow·Result IA를 다시 대조해 회원가입, 새 결과 미리보기, 저장 오류, 결과 한계, 마이페이지 상태 누락을 보완했다.

## Changed

- `docs/product/requirements/SCREEN_STATES.md` — 화면 상태 모델 신설
- `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` — 상태 모델 링크 추가
- `docs/product/requirements/USER_FLOW.md` — 상태 모델 링크 추가
- `docs/product/requirements/RESULT_IA.md` — 상태 모델 링크 추가

## Decisions

1. 기능명세의 `SC-*`를 route가 아니라 논리 화면 ID로 취급한다.
2. 화면 상태를 UI 배치와 분리해 먼저 확정한다.
3. 첫 Vertical Slice는 인증 → 가게 입력·확인 → 분석 진행 → 첫 결과 자동 저장 → 홈 결과를 연결한다.
4. 실제 분석 API가 없는 단계는 비식별 fixture를 사용하되 실제 API와 같은 상태 타입을 사용한다.
5. 저장본이 있는 사용자의 새 결과는 기존 저장본과 구분되는 미저장 미리보기 문맥에서 확인한 뒤 저장 선택으로 이동한다.
6. 첫 자동 저장 실패와 기존 저장본 교체 실패는 저장본 보존 의미가 다르므로 별도 상태로 처리한다.

## Verification

- `SC-AUTH`, `SC-001`~`SC-012` 추적: PASS — 13/13
- 저장소 Markdown 상대 링크: PASS — 문서 55개, 링크 150개, 깨진 링크 0개
- `git diff --check`: PASS
- 애플리케이션 코드 검증: 미실행 — 코드 변경 없음
- Android 렌더링·Visual QA: 미실행 — 프론트엔드 미생성
- 독립 Reviewer: 미실행 — 제품·디자인 담당자 검토 필요
- 2차 자체 교차 검토: 수정 완료 — 회원가입/Google 취소/미저장 새 결과/저장 실패/대표성 한계/알림 설정/로그아웃 전이 보완

## Unresolved

1. 오프라인·캐시·자동 재시도 정책
2. 분석 polling·백오프와 앱 종료·복귀 정책
3. 가게 입력·확인 route 분리 여부
4. 저장 선택 UI와 미저장 결과 보관 정책
5. 알림 읽음 처리
6. 최소 Android OS·지원 기기·접근성 목표
7. ~~Expo SDK·React Native 버전과 workflow~~ — 2026-09-18 [ADR-011](../../decisions/ADR-011-frontend-bootstrap.md)로 해소
8. 백엔드 인증·탈퇴·오류 계약 반영(3차)은 [TASK-019](TASK-019-step0-rebaseline.md)에서 수행했다. 독립 Reviewer PASS는 그 변경분에 대한 것이며, 이 State Model 전체의 제품·디자인 검토는 아직이다

## Do Not Assume

- State Model은 화면 디자인 시안이 아니다.
- `SC-*` 하나가 React Native route 하나라는 뜻이 아니다.
- `offline` 상태를 정의했지만 캐시나 자동 재시도 정책을 확정한 것은 아니다.
- ImageGen 시안은 State Model과 Design Foundation이 준비된 뒤 생성한다.
- 실제 백엔드가 없는 상태의 fixture를 구현 완료 증거로 사용하지 않는다.

## Next Action

제품·디자인 Reviewer가 State Model을 검토한다. 병행 가능한 다음 별도 Task에서는 Step 3 Design Foundation으로 이동해 프론트 기술 스택과 코드 토큰 정본 위치를 확정한다.

## Last Verified Commit

`ce8c7ef` — State Model 2차 자체 교차 검토와 문서 링크·화면 추적 검증을 완료한 커밋.
