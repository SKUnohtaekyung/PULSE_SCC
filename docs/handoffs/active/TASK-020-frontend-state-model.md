# TASK-020 — 프론트엔드 화면 상태 모델

## Status

Step 8 Architecture Validation 완료 (2026-09-23). Step 7 첫 Vertical Slice 구현 완료 (2026-09-22). `frontend/mobile`에 API 계층·세션·화면을 만들고 Android에서 첫 분석 흐름과 실패 경계를 확인했다. 백엔드가 병합·배포 전이라 **가상(fixture) 서버**로 동작한다. 작업은 TASK-019 브랜치에서 수행

## Owner

`role:product` — 미배정

**소유 영역 밖 수정(AGENTS 5장 규칙 4·5).** PR 본문에 적고 해당 역할을 리뷰어로 지정한다.

| 파일 | 소유 역할 | 이유 |
|---|---|---|
| `docs/architecture/FRONTEND_STRUCTURE.md`(신설)·`docs/architecture/ARCHITECTURE.md` | `role:platform` | Step 8 구조 검증 기록 |
| `docs/design/**`(DESIGN_SYSTEM·evidence·synthesis·figma) | `role:design-system` | Step 3~8 토큰·컴포넌트·검증 기록 |
| `frontend/mobile/src/design/**`·`src/components/ui/**` | `role:design-system` | 토큰과 공용 컴포넌트 |
| `docs/product/requirements/SCREEN_STATES.md` | `role:product` | 상태 모델 갱신 |

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
- (Step 6) 이 세션에 Figma 연결이 없어 사용자 선택에 따라 팀 Figma import용 SVG 보드 8장(IA·Flow, Foundation, Components, Assets, Final UI 4장)을 토큰에서 생성했다. Step 5에서 넘긴 결정 4개를 정해 합성안·프로토타입·보드와 SCREEN_STATES·DESIGN_SYSTEM에 반영했다(키보드 가림은 가설 — Step 7에서 확인).
- (Step 5) 사용자 선택(한 화면 입력·쌓이는 진행 목록 — 가설 1, 첫 저장 완료 화면 — 가설 2, 새 결과 미리보기 — 상태 보드 ③)을 합성하고, 위임받은 저장 선택 시점(처음부터 하단 고정 + 교체 확인)과 실패 배치·결과 상태 표현을 정했다.
- (Step 7) SCREEN_STATES §10의 첫 Vertical Slice를 구현했다. 계약 타입·HTTP 클라이언트(봉투 없는 401 → 단일 갱신 → 재전송)·엔드포인트·가상 서버, 안전 저장소 기반 세션, 로그인·가게 입력·진행·첫 저장·홈 결과 화면, 공용 UI 컴포넌트 9종을 만들었다. Android에서 정상 흐름과 실패 경계 7가지를 실행해 캡처 23장으로 남겼다.
- (Step 8) Component·State·API·Env·오류 처리·반응형 여섯 축으로 Step 7 구조가 전체 구현까지 버티는지 확인했다. 화면 골격 공통화(`components/ui/Screen`), 요청 timeout, 오류 문구 공통 규칙(`api/errorMessage`)을 보완하고, 결정이 필요한 5건을 `docs/architecture/FRONTEND_STRUCTURE.md`에 남겼다.
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
- (Step 6) `docs/design/figma/TASK-020/` — generate.mjs, svg 8장, README / 합성안 Step 6 decisions / 프로토타입의 멈춘 진행 행·분석하기 현재 위치 표시 / evidence `step6-*.png`
- (Step 6) `SCREEN_STATES.md` §5.1 뒤 문단(멈춘 행)·§9 `NAV-ANALYSIS-ACTIVE`, `DESIGN_SYSTEM.md` §5.3 BottomNavigation 행 — 결정 2·3 반영
- (Step 5) `frontend/mobile/src/prototypes/flow/FlowPrototype.tsx`, `src/app/flow.tsx`, `src/app/preview.tsx`, `ResultPrototype.tsx`(미리보기 모드·저장 선택·확인 대화상자·하단 내비게이션 연결) — Android 합성 프로토타입
- (Step 5) `docs/design/evidence/TASK-020/step5-*.png` — Android 실행 캡처
- (Step 8) `docs/architecture/FRONTEND_STRUCTURE.md` 신설 + `ARCHITECTURE.md` 링크 / `frontend/mobile/src/components/ui/Screen.tsx`·`api/errorMessage.ts` 신설 / `api/transport.ts` timeout / 화면 5개를 공통 골격으로 이동 / evidence `step8-*.png`
- (Step 7) `frontend/mobile/src/api/**` — 계약 타입, 오류 봉투 해석, HTTP/가상 서버 전송, 인증 클라이언트, 엔드포인트, 페르소나 이미지 source, fixtures(고정 결과 데이터 + 상황 12종)
- (Step 7) `frontend/mobile/src/session/**` — `expo-secure-store` 토큰 저장과 `SessionProvider`(앱 시작·세션 복원·만료)
- (Step 7) `frontend/mobile/src/components/ui/**` — Button, TextField, Chip, Notice, LoadingBlock, ProgressList, ScreenHeader, BottomNavigation(프로토타입에서 옮김)
- (Step 7) `frontend/mobile/src/features/**` — auth·analysis·result 화면과 fixture 상황 전환 패널
- (Step 7) `frontend/mobile/src/app/**` — `/`(시작 분기), `/login`, `/analyze`, `/first-save`, `/home`, `/prototype-result`
- (Step 7) `frontend/mobile/package.json`·`app.json` — `expo-secure-store` 추가
- (Step 7) `frontend/mobile/README.md` — 화면 구성, 서버 연결(`EXPO_PUBLIC_API_BASE_URL`), 코드 구조
- (Step 7) `DESIGN_SYSTEM.md` §5.3 경로·§5.4 버튼 loading/disabled·§13(아이콘 공급원, 인증 만료 표현 해소)
- (Step 7) `SCREEN_STATES.md` §13 7차 기록 / `docs/design/evidence/TASK-020/step7-*.png` 23장과 README
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
12. (Step 6) Figma 보드는 사람이 보는 사본이고, 토큰·상태·합성 결정의 정본은 코드와 문서다. 보드는 `generate.mjs`로 토큰에서 다시 뽑는다.
13. (Step 6) Figma 컴포넌트화·오토레이아웃은 10단계까지 끝낸 뒤 0~10단계 재검토에서 한다(2026-09-22 사용자 결정).

14. (Step 7) 백엔드 병합 전까지 앱은 `src/api/fixtures`의 가상 서버로 동작한다. `EXPO_PUBLIC_API_BASE_URL`이 있으면 자동으로 실제 HTTP 모드가 된다. fixture와 실제 API는 같은 타입을 쓰고, 화면에는 가상 서버로 동작 중임을 표시한다.
15. (Step 7) 아이콘 라이브러리를 쓰지 않는다(§13 해소). 필요한 아이콘은 `View` 도형으로 그린다.
16. (Step 7) 버튼 loading은 색을 유지하고 글자를 진행 문구로 바꾸며, disabled는 `background.emphasized`+`text.disabled`로 구분한다(DESIGN_SYSTEM §5.4).
17. (Step 7) 회원가입·Google 로그인·마이페이지·전체 근거 화면·새 결과 미리보기는 이번 Slice에 넣지 않는다. 화면에서 "이번 범위가 아니다"라고 알린다.
18. (Step 7) 공용 `BottomNavigation`을 `components/ui`로 옮기고 프로토타입도 같은 것을 쓴다(중복 금지).
19. (Step 7, 리뷰 반영) fixture 모드에서는 페르소나 이미지를 코드로 그린 자리표시로 대신한다. 프로토타입 전용 에셋을 제품 화면에 쓰지 않는다(DESIGN_SYSTEM §3.6).
20. (Step 7, 리뷰 반영) 가상 데이터로 그린 화면에는 첫 저장·홈에도 안내를 둔다(`features/dev/FixtureBanner`).

21. (Step 8) 화면 골격·좌우 여백·읽기 폭은 `components/ui/Screen`에서만 정한다. 화면은 본문만 그린다. 목록 화면은 `scroll={false}`로 자기 스크롤을 갖는다.
22. (Step 8) 전역 상태 라이브러리를 도입하지 않는다. 서버가 정본이므로 화면 사이에는 id만 넘기고 다시 조회한다.
23. (Step 8) 분석 polling은 두 번째 사용처가 생길 때 hook으로 뽑는다. polling 정책이 미정이라 지금 추상화하지 않는다.
24. (Step 8) 문구는 두 곳에 둔다. 일반 문구(연결·세션·원인 미상)는 `api`, 코드별 문구는 `features`가 갖는다.

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
- (Step 5) 합성 문서: 링크·`git diff --check` 확인
- (Step 5) Android 프로토타입: lint·typecheck·verify:tokens·export:android PASS, Expo Go에서 첫 분석·재시도 실패·저장본 있음(미리보기·교체 확인·뒤로가기) 경로 실행, 캡처 9장. 글자 크기 200%·TalkBack·실기기 미실행. 독립 Reviewer PASS
- (Step 7) `verify:tokens`: PASS, `lint`: PASS, `typecheck`: PASS, `export:android`: PASS (2026-09-22, 변경 반영 후 재실행)
- (Step 7) Android Visual QA(`Medium_Phone`, Expo Go): PASS — 로그인 → 가게 입력 → 진행 → 첫 저장 → 홈 결과 전체 흐름과 실패 7가지를 실행해 캡처 23장. 글자 크기 200%는 마지막 수정본으로 다시 확인하고 1.0으로 복원했다. 도중 발견한 헤더 배지 잘림 결함을 고치고 다시 확인. TalkBack·실기기·오프라인·키보드 가림은 미실행(evidence README에 기록)
- (Step 7) 독립 Reviewer: 1차 FAIL(P1 2·P2 4) → 지적 사항 반영 후 재검토. 반영 내용: fixture 안내 누락(P1), 프로토타입 에셋 제품 사용(P1), TextField 중복(P2), IMAGE-LOAD-ERROR 재조회·크기(P2), DESIGN_SYSTEM §3.6↔§13 모순(P2), 갱신 실패 판정 범위(P2), 그리고 P3 중 하단 내비게이션 노출·401 코드 처리·주의 테두리 대비·미처리 rejection·§11 계약 차이 기록
- (Step 7) 1차 수정 후 재검증: `verify:tokens`·`lint`·`typecheck`·`export:android` PASS, Android에서 첫 저장·홈·이미지 자리표시·이미지 조회 실패·제안 펼침 재확인(`step7-06`·`07`·`19`·`20`·`21`)
- (Step 7) 2차 독립 Reviewer: 새 P2 1건(이미지 대체 영역 고정 높이 → 큰 글자에서 넘침 위험, 200% 캡처가 수정 전 것) 지적. 최소 높이로 되돌리고 200%를 다시 찍어 확인(`step7-17`·`22`·`23`), 홈 기반 캡처(`step7-15`·`16`)도 배너 반영본으로 교체
- (Step 8) `verify:tokens`·`lint`·`typecheck`·`export:android`: PASS (2026-09-23, 구조 변경 후 재실행)
- (Step 8) Android 회귀·반응형: PASS — 화면 5개를 공통 골격으로 옮긴 뒤 로그인 → 입력 → 진행 → 첫 저장 → 홈 재실행, 가로 화면과 글자 크기 200%를 다시 확인(`step8-01`~`step8-04`). 컷아웃 기기·태블릿은 미실행
- (Step 8) 독립 Reviewer: 1차 FAIL(P2 1건 — 구조 문서의 의존 서술이 코드와 불일치, P3 11건) → 문서 정정과 `Screen`의 목록·컷아웃·가운데 정렬 보완 후 재검토
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

사용자 확인 후 Step 8. Step 7에서 남은 것: 실제 백엔드 연결(§11 공백 해소 후), 오프라인·키보드·TalkBack 확인, 회원가입·Google 로그인·마이페이지·전체 근거 화면. 팀 Figma 공용 파일로 옮길지, Pretendard를 각 PC에 설치할지는 사용자가 정한다. SCREEN_STATES §11의 백엔드 공백은 2026-09-24 오해서와의 회의에서 전달한다(요청 목록: https://claude.ai/artifact/3DSab1M4q4qaLbAKqzxghc — 비공개 페이지, 정본은 SCREEN_STATES §11).

## Last Verified Commit

`f071322` — Step 8 Architecture Validation과 독립 Reviewer PASS(3차)를 반영한 커밋.
