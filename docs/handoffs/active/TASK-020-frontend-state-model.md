# TASK-020 — 프론트엔드 화면 상태 모델

## Status

Step 5 Design Synthesis 게이트 PASS (2026-09-22) — 독립 Reviewer 1차 FAIL(P2 2건) → 2차 FAIL(P2 1건) → 3차 PASS. 입력 화면 헤더 색 조정은 사용자 확인 대기. Step 4 게이트는 2026-09-22 PASS. 작업은 TASK-019 브랜치에서 수행

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
- (Step 3) 상태 모델이 요구하는 오류·주의·입력·삭제·로딩·이미지 실패 표현을 토큰·컴포넌트 규칙·에셋 규칙과 대조했다. 기존 토큰의 대비 미달 3건(오류 원색/화면 배경 4.4999:1, 주의 원색 아이콘/화면 배경 2.97:1, 입력 경계 `border.strong` 1.48:1)과 삭제 토큰 부재를 찾아 토큰을 추가하고 규칙을 적었다. 새 삭제 버튼과 포커스 링이 맞닿는 조합(1.9954:1)은 리뷰에서 추가로 찾아 링 offset 규칙으로 막았다.
- (Step 4) Vertical Slice 앞 단계(입력·진행·첫 저장/홈)의 서로 다른 UX 가설 4개와 결과 상태 변형 보드 1개를 ImageGen으로 만들고, 각 가설의 최적화 대상·상태 대응·trade-off와 Step 5 질문을 정리했다. 정상 결과 화면은 TASK-015·017·016에서 이미 탐색·합성돼 다시 하지 않았다.
- (Step 5) 사용자 선택(한 화면 입력·쌓이는 진행 목록 — 가설 1, 첫 저장 완료 화면 — 가설 2, 새 결과 미리보기 — 상태 보드 ③)을 합성하고, 위임받은 저장 선택 시점(처음부터 하단 고정 + 교체 확인)과 실패 배치·결과 상태 표현을 정했다.
- PRD·기능명세·User Flow·Result IA를 다시 대조해 회원가입, 새 결과 미리보기, 저장 오류, 결과 한계, 마이페이지 상태 누락을 보완했다.

## Changed

- `docs/product/requirements/SCREEN_STATES.md` — 화면 상태 모델 신설
- `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` — 상태 모델 링크 추가
- `docs/product/requirements/USER_FLOW.md` — 상태 모델 링크 추가
- `docs/product/requirements/RESULT_IA.md` — 상태 모델 링크 추가
- (Step 3) `frontend/mobile/src/design/tokens/foundation.ts` — `slate500`·`warningStrong`·`errorStrong`, `border.control`, `status.warningText`·`status.errorText`, `destructive` 추가
- (Step 3) `frontend/mobile/scripts/verify-design-tokens.mjs` — 화면 배경·강조 배경·입력·포커스·삭제 조합 검사와 사용 금지 조합(`knownLimits`) 고정
- (Step 3) `frontend/mobile/src/design/TokenShowcase.tsx` — State color 견본 추가
- (Step 3) `docs/design/DESIGN_SYSTEM.md` — 라이트 테마 한정, 색상 이식표·대비 한계표, 오류·주의·입력·삭제 사용 규칙, 로딩 자리표시·이미지 실패 대체·에셋 사용 금지 조건, 아이콘 공급원 미결정 기록, 5.4절 포커스 링 offset 규칙, §13 후속 결정 3행(로딩·실패·빈 슬롯 구분, 오프라인·인증 만료 표현, 버튼·내비게이션·토글 상태)
- (Step 3) `docs/design/evidence/TASK-020/` — Android 100%·200% 글자 크기 캡처
- (Step 4) `docs/design/explorations/TASK-020/` — 가설 보드 4장, 상태 보드 1장, README, PROMPTS
- (Step 5) `docs/design/synthesis/TASK-020/README.md` — 합성안 정본
- (Step 5) `SCREEN_STATES.md` §5.1·§7·§9·§11·§13, `DESIGN_SYSTEM.md` 5.4·§6·§13, `RESULT_IA.md` §5·§6, `USER_FLOW.md` UF-03·UF-04·UF-06 — 합성 결정 반영

## Decisions

1. 기능명세의 `SC-*`를 route가 아니라 논리 화면 ID로 취급한다.
2. 화면 상태를 UI 배치와 분리해 먼저 확정한다.
3. 첫 Vertical Slice는 인증 → 가게 입력·확인 → 분석 진행 → 첫 결과 자동 저장 → 홈 결과를 연결한다.
4. 실제 분석 API가 없는 단계는 비식별 fixture를 사용하되 실제 API와 같은 상태 타입을 사용한다.
5. 저장본이 있는 사용자의 새 결과는 기존 저장본과 구분되는 미저장 미리보기 문맥에서 확인한 뒤 저장 선택으로 이동한다.
6. 첫 자동 저장 실패와 기존 저장본 교체 실패는 저장본 보존 의미가 다르므로 별도 상태로 처리한다.
7. (Step 3) 기존 원색 값은 바꾸지 않고, 기준에 못 미치는 배경에서 쓸 강조 토큰을 추가한다. 이미 쓰인 값의 의미를 바꾸면 프로토타입과 증거가 함께 흔들리기 때문이다.
8. (Step 3) 되돌릴 수 없는 행동은 진입점 텍스트 버튼(`destructive.text`)과 최종 확인 버튼(`destructive.primary`)으로 나눈다.
9. (Step 3) 아이콘 공급원은 이번 단계에서 정하지 않는다. 의존성 추가 결정이므로 Vertical Slice 착수 전에 정한다.
10. (Step 4) 시안 이미지 생성에 한해 Codex 내장 ImageGen을 쓴다(2026-09-22 사용자 허용). Codex는 저장소 밖에서 read-only로 실행하고, 저장소 반영·검토·문서화는 Claude가 한다.
11. (Step 5) 새 결과 미리보기의 저장 선택은 처음부터 하단에 고정하고, 교체만 확인 대화상자를 거친다. 교체 확인 대화상자의 최종 `바꾸기`만 `destructive.primary`를 쓴다. 유지는 "새 결과는 저장되지 않고 닫은 뒤 다시 볼 수 없을 수 있다" 안내로 대신하고, 미리보기에서는 하단 내비게이션을 숨겨 선택 없이 떠나지 않게 한다.

## Verification

- `SC-AUTH`, `SC-001`~`SC-012` 추적: PASS — 13/13
- 저장소 Markdown 상대 링크: PASS — 문서 55개, 링크 150개, 깨진 링크 0개
- `git diff --check`: PASS
- (Step 2 시점) 애플리케이션 코드 검증: 미실행 — 코드 변경 없음
- (Step 2 시점) Android 렌더링·Visual QA: 미실행 — 프론트엔드 미생성
- 독립 Reviewer: PASS — 0~2단계 정본 전체를 프론트엔드 구현 관점과 원격 백엔드 코드(`74d6df8`, `a4ab15b`)로 대조. 1차 FAIL(P1 2·P2 6) → 2차 FAIL(P2 1, 새 로그인 분기는 사용자 결정으로 해소) → 3차 PASS
- (Step 3) `verify:tokens`: PASS — 대비 조합 26개 통과, 사용 금지 조합 4개가 기준 미만임을 확인
- (Step 3) `lint`: PASS, `typecheck`: PASS, `export:android`: PASS
- (Step 3) 독립 Reviewer: PASS — 1차 FAIL(status.error 범위 모순, 포커스 링/삭제 버튼 대비 미검사, handoff 기록 오류 2건) → 2차 PASS(P3만 남음, 반영)
- (Step 3) Android Visual QA(`Medium_Phone`, Expo Go, `/foundation`): PASS — 100%·200% 글자 크기에서 State color 견본 잘림·겹침 없음. TalkBack·실기기 미실행
- (Step 4) 시안 5장 육안 대조: 초안 문제 3건(장식 이미지의 AI 표시, 유형 이름 누락, 편집 중 생긴 오타)을 편집으로 수정. 가설 3의 "분석하지" 오타는 편집 2회 실패로 남겨 Known defects에 기록. 앱 코드 변경 없음, Visual QA 해당 없음
- (Step 5) 문서 전용 변경. 링크·`git diff --check` 확인, 앱 코드 변경 없음
- 2차 자체 교차 검토: 수정 완료 — 회원가입/Google 취소/미저장 새 결과/저장 실패/대표성 한계/알림 설정/로그아웃 전이 보완

## Unresolved

1. 오프라인·캐시·자동 재시도 정책
2. 분석 polling·백오프와 앱 종료·복귀 정책
3. 가게 입력·확인 route 분리 여부
4. 미저장 결과 보관 정책과 저장 선택 문구(저장 선택 형식은 Step 5 합성에서 결정)
5. 알림 읽음 처리
6. 최소 Android OS·지원 기기·접근성 목표
7. ~~Expo SDK·React Native 버전과 workflow~~ — 2026-09-18 [ADR-011](../../decisions/ADR-011-frontend-bootstrap.md)로 해소
8. 백엔드 계약 반영(3차)과 구현 가능성 재검토(4·5차)는 [TASK-019](TASK-019-step0-rebaseline.md)에서 수행했고 Step 2 게이트 독립 Reviewer PASS를 받았다. 남은 백엔드 공백은 SCREEN_STATES §11에 있다

## Do Not Assume

- State Model은 화면 디자인 시안이 아니다.
- `SC-*` 하나가 React Native route 하나라는 뜻이 아니다.
- `offline` 상태를 정의했지만 캐시나 자동 재시도 정책을 확정한 것은 아니다.
- ImageGen 시안은 State Model과 Design Foundation이 준비된 뒤 생성한다.
- 실제 백엔드가 없는 상태의 fixture를 구현 완료 증거로 사용하지 않는다.

## Next Action

입력 화면 헤더 색 조정(합성안 §1)을 사용자에게 확인받은 뒤 Step 6 Figma 정본화. SCREEN_STATES §11의 백엔드 공백은 2026-09-24 오해서와의 회의에서 전달한다(요청 목록: https://claude.ai/artifact/3DSab1M4q4qaLbAKqzxghc — 비공개 페이지, 정본은 SCREEN_STATES §11).

## Last Verified Commit

`6a7e3a9` — Step 4 Design Exploration 시안·기록과 독립 Reviewer PASS를 반영한 커밋.
