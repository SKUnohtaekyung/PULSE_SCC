# TASK-020 — 프론트엔드 화면 상태 모델

## Status

발표 시안·디자인 리뷰 반영 진행 중 (2026-09-27). 그 앞 Step 10 독립 검토 반영 완료 (1차 2026-09-24, 2차·3차 2026-09-27) — 독립 리뷰를 다섯 번 받았다. 1차 FAIL 16건(P2 6·P3 10), 2차 FAIL 9건(P2 2·P3 7 — 1차 수정이 만든 회귀), 3차 FAIL 6건(P2 1·P3 5 — 2차 수정이 만든 회귀), 4차 FAIL 4건(P3만 — 코드는 P2 0건, 문서가 코드와 어긋남), 5차 **PASS**. 모두 반영했다. 새 화면은 만들지 않았다. Step 9 전체 구현 완료 (2026-09-23) — 가입·새 결과 저장 선택·마이페이지·근거 목록. Step 8 Architecture Validation 완료 (2026-09-23). Step 7 첫 Vertical Slice 구현 완료 (2026-09-22). `frontend/mobile`에 API 계층·세션·화면을 만들고 Android에서 첫 분석 흐름과 실패 경계를 확인했다. 백엔드가 병합·배포 전이라 **가상(fixture) 서버**로 동작한다. 작업은 TASK-019 브랜치에서 수행

## Owner

`role:product` — 미배정

**소유 영역 밖 수정(AGENTS 5장 규칙 4·5).** PR 본문에 적고 해당 역할을 리뷰어로 지정한다.

| 파일 | 소유 역할 | 이유 |
|---|---|---|
| `docs/architecture/FRONTEND_STRUCTURE.md`(신설)·`docs/architecture/ARCHITECTURE.md` | `role:platform` | Step 8 구조 검증 기록 |
| `docs/design/**`(DESIGN_SYSTEM·evidence·synthesis·figma) | `role:design-system` | Step 3~8 토큰·컴포넌트·검증 기록 |
| `frontend/mobile/src/design/**`·`src/components/ui/**` | `role:design-system` | 토큰과 공용 컴포넌트 |
| `docs/product/requirements/SCREEN_STATES.md` | `role:product` | 상태 모델 갱신과 Step 7·9 검증 기록 |
| `frontend/mobile/src/components/ui/**`(Step 9 신설 4종 포함) | `role:design-system` | CheckRow·ToggleRow·ConfirmDialog·PersonaImageBlock |

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
- (Step 9) Step 7 Slice 밖에 있던 화면을 구현했다. 이메일 가입(약관 조회·동의), 저장본이 있는 사용자의 새 결과 미리보기와 저장 선택(교체 확인·유지·뒤로가기 3택), 마이페이지(알림·알림 설정·저장 이미지·서비스 정보·로그아웃), 근거 리뷰 전체 보기(cursor). API 계층에 6개 호출과 가상 서버 응답을 더했다.
- (Step 8) Component·State·API·Env·오류 처리·반응형 여섯 축으로 Step 7 구조가 전체 구현까지 버티는지 확인했다. 화면 골격 공통화(`components/ui/Screen`), 요청 timeout, 오류 문구 공통 규칙(`api/errorMessage`)을 보완하고, 결정이 필요한 5건을 `docs/architecture/FRONTEND_STRUCTURE.md`에 남겼다.
- (Step 10) 새로 붙은 독립 Reviewer의 1차 지적 16건(P2 6·P3 10)을 반영했다. 활성 탭의 틀린 안내, 입력이 바뀌어도 같은 멱등 키를 쓰던 문제, 작업 조회 중복 실행, 약관 변경 안내 소실, `setHasSavedAnalysis` identity, 순위 정렬 미보장, `ADVICE-EMPTY` 영역 소실, footer SafeArea, 탭 이동 스택, 대화상자 접근성 초점, 쓰지 않는 export 2개를 고치고, SCREEN_STATES §13 8차 기록과 FRONTEND_STRUCTURE의 `9단계` 표기·리터럴 개수를 사실에 맞게 정정했다.
- PRD·기능명세·User Flow·Result IA를 다시 대조해 회원가입, 새 결과 미리보기, 저장 오류, 결과 한계, 마이페이지 상태 누락을 보완했다.

## Changed

- (Step 10) `frontend/mobile/src/components/ui/BottomNavigation.tsx`(활성 탭 가드)·`ConfirmDialog.tsx`(배경 초점 제외, 본문은 터치 삼킴)·`Screen.tsx`(footer 좌우 SafeArea — 배경색은 주지 않는다. 주면 세로 모드에서 둥근 모서리를 가진 footer의 radius 뒤를 채운다) / `features/analysis/AnalyzeScreen.tsx`(멱등 키 입력 비교, polling `inFlight`, 탭 `navigate`) / `features/auth/SignupScreen.tsx`(약관 변경 안내 유지, 비밀번호 삭제 고지) / `features/result/HomeScreen.tsx`·`features/mypage/MyPageScreen.tsx`(탭 `navigate`) / `features/result/ResultView.tsx`(rank 정렬, `ADVICE-EMPTY`) / `session/SessionProvider.tsx`(`useCallback`)·`session/storage.ts`(주석·미사용 export 제거) / `api/fixtures/server.ts`(미사용 export 제거)
- (Step 10) `docs/product/requirements/SCREEN_STATES.md` §13 8차 기록 정정 / `docs/architecture/FRONTEND_STRUCTURE.md` `미이행` 표기·리터럴 개수·§3 제목 / `docs/design/evidence/TASK-020/README.md` Step 10 섹션 / evidence `step10-01`~`step10-07` 7장
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
- (Step 9) `frontend/mobile/src/api/**` — 가입·약관·근거·알림·알림 설정 타입과 호출, 가상 서버 응답 / `components/ui/CheckRow·ToggleRow·ConfirmDialog` 신설 / `features/auth/SignupScreen`·`features/result/PreviewResultScreen`·`EvidenceScreen`·`features/mypage/MyPageScreen` 신설 / `ResultView`에 근거 전체 보기 진입점 / route `/signup`·`/preview-result`·`/evidence`·`/mypage` / evidence `step9-*.png` 9장
- (Step 9) `SCREEN_STATES.md` §13 8차 기록 / `DESIGN_SYSTEM.md` §5.3 경로·§13 토글 결정 / `FRONTEND_STRUCTURE.md` 구현 현황 / `frontend/mobile/README.md` 화면 표
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

25. (Step 9) 저장본이 있는 사용자의 새 결과는 미리보기 화면(`/preview-result`)으로 보내고, 저장 선택을 끝내기 전에는 근거 전체 보기로 나가지 않는다.
26. (Step 9) 알림 설정 토글은 스위치 옆에 `켜짐`·`꺼짐` 글자를 함께 둔다. 색만으로 상태를 알리지 않는다.
27. (Step 9) 계정 탈퇴는 구현하지 않는다. 원격 백엔드에는 `DELETE /api/v1/me/account`가 있으나 이 저장소 API.md §3.3이 계약에서 제외했다. 계약을 맞출지는 `role:platform`이 정한다(FRONTEND_STRUCTURE §2.3).
28. (Step 9) Google 로그인은 앱 식별자·scheme·OAuth client id가 정해진 뒤에 만든다. 로그인 화면에 그 사실을 적는다.
29. (Step 9, 리뷰 반영) 페르소나 이미지는 `components/ui/PersonaImageBlock` 하나로 그린다. 결과 화면과 마이페이지가 같은 고지·로딩·실패 규칙을 쓴다.
30. (Step 9, 리뷰 반영) 입력 검증은 서버 규칙보다 좁히지 않는다. 전화번호는 숫자 8~15자리와 국가번호를 허용하고, 보낼 때만 숫자로 정리한다.

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
- (Step 9) `verify:tokens`·`lint`·`typecheck`·`export:android`: PASS (2026-09-23)
- (Step 9) Android Visual QA: PASS — 가입 → 첫 분석 → 홈 → 마이페이지(알림 설정 토글 포함) → 근거 목록(끝까지) → 두 번째 분석 → 미리보기 → 교체 확인 → 홈 교체 → 로그아웃을 실제로 실행하고 캡처 9장. 실패 상태·200%·TalkBack·실기기는 미실행(evidence README에 기록)
- (Step 9) 독립 Reviewer: 1차 FAIL(P2 3건 — SCREEN_STATES §13 7차 제목 소실, `GET /me/notifications` 응답 모양 불일치, 마이페이지 이미지의 AI 고지·실패 상태 누락, P3 7건) → 모두 반영 후 재검토
- (Step 9) 수정 후 재검증: `verify:tokens`·`lint`·`typecheck`·`export:android` PASS, Android에서 마이페이지 이미지 고지 재확인(`step9-10`)
- (Step 8) `verify:tokens`·`lint`·`typecheck`·`export:android`: PASS (2026-09-23, 구조 변경 후 재실행)
- (Step 8) Android 회귀·반응형: PASS — 화면 5개를 공통 골격으로 옮긴 뒤 로그인 → 입력 → 진행 → 첫 저장 → 홈 재실행, 가로 화면과 글자 크기 200%를 다시 확인(`step8-01`~`step8-04`). 컷아웃 기기·태블릿은 미실행
- (Step 8) 독립 Reviewer: 1차 FAIL(P2 1건 — 구조 문서의 의존 서술이 코드와 불일치, P3 11건) → 문서 정정과 `Screen`의 목록·컷아웃·가운데 정렬 보완 후 재검토
- (Step 10) `verify:tokens`·`lint`·`typecheck`·`export:android`: PASS (1차 반영 2026-09-24, 2차 반영 2026-09-27, 3차 반영 2026-09-27 — 매번 재실행)
- (Step 10) Android 회귀: PASS — 로그인 → 입력 → 진행 → 첫 저장 → 홈 → 마이페이지를 다시 실행했다. 활성 탭을 눌러도 틀린 안내가 뜨지 않고(`step10-01`·`step10-02`), `/mypage`·`/analyze`에서 하드웨어 뒤로가기로 홈에 돌아오며(`step10-03`·`step10-04`), 확인 대화상자는 본문을 눌러도 닫히지 않고 배경을 눌러야 닫힌다(`step10-05`). 멱등 키·polling 중복·순위 정렬은 코드 확인으로만 판정했고 그 사실을 evidence README에 적었다
- (Step 10) 독립 Reviewer: 1차 FAIL(P2 6건 — 활성 탭의 틀린 안내, 입력 변경 후 멱등 키 재사용, 작업 조회 중복 실행, 약관 변경 안내 소실, SCREEN_STATES §13 8차 기록 오류, `setHasSavedAnalysis` identity, P3 10건) → 전부 반영
- (Step 10) 2차 독립 Reviewer: FAIL(P2 2건 — 1차 수정이 만든 회귀. 대화상자 본문이 터치를 삼키지 않아 눌러도 닫힘, 탭 이동 `replace`가 뒤로가기 pop 대상을 없앰. P3 7건) → 본문 래퍼를 `Pressable`로 되돌리고 탭 이동을 `navigate`로 바꾼 뒤 Android에서 둘 다 확인. P3 중 빈 슬롯 클릭 지적은 `PodiumSlot.status`가 `'FILLED' | 'EMPTY'` 두 값뿐이라 성립하지 않음을 코드로 확인하고 evidence README에 기록
- (Step 10) 3차 독립 Reviewer: FAIL(P2 1건 — 2차에서 footer 래퍼에 준 배경색이 좌우 inset 0인 세로 모드에서 저장 선택 바의 둥근 모서리를 지움. P3 5건 — 코드에 없는 `accessibilityViewIsModal`을 문서가 "줬다"고 적음, Step 10 날짜가 1·2차를 구분하지 않음, Status의 결함 총계, `accessible={false}`와 함께 둔 `accessibilityRole="alert"`, footer 변경의 Visual QA 범위) → 래퍼 배경을 되돌리고 무효 role을 지우고 문서를 정정
- (Step 10) 3차 수정 후 재검증: `verify:tokens`·`lint`·`typecheck`·`export:android` PASS. Android에서 저장 선택 바의 둥근 모서리(`step10-06`)와 교체 확인 대화상자 본문 탭(`step10-07`)을 추가로 확인
- (Step 10) 4차 독립 Reviewer: **코드 P1 0·P2 0**. FAIL(P3 4건 — 문서가 코드와 어긋남: 이미 지운 footer 배경색을 있다고 적음, 캡처 매수 5장↔7장, 실재하지 않는 DESIGN_SYSTEM §13 기록 참조, 미확인 항목 중복) → 문서만 정정
- (Step 10) **5차 독립 Reviewer: PASS**(P1 0·P2 0·P3 4 — 검토 이력 기록 누락). P3는 이 기록으로 반영
- (발표 시안 반영) `verify:tokens`·`lint`·`typecheck`·`export:android`: PASS (2026-09-27)
- (발표 시안 반영) Android Visual QA: PASS — 로그인 → 입력 3단계 → 진행 → 첫 저장 → 홈 시상대 → 상세·제안을 실행하고 캡처 6장(`redesign-01`·`03`~`07`. `02`는 결번). 글자 크기 200%와 가로 화면을 다시 실행했고, 분석 정보 3열이 200%에서 날짜를 쪼개는 것을 찾아 세로로 쌓도록 고친 뒤 재확인
- (발표 시안 반영) 독립 Reviewer: 1차 FAIL(P1 3 — 활성 탭 아이콘 대비 1.28:1, DESIGN_SYSTEM §3.6·§4.1이 코드와 반대, P2 7) → 반영 / 2차 FAIL(P1 2 — §13이 §3.6과 충돌, 보드 10개 화면의 안 보이는 상태 표시줄, P2 7·P3 4) → P1·P2 전부와 P3 일부 반영. P3 3건(검사 이름, 배열 길이 단언, `StepIndicator`의 `✓`와 TalkBack)은 판단해 보류했다
- (발표 시안 반영) 3차 독립 Reviewer: FAIL(P1 1·P2 10·P3 10 — 보드 SVG의 프레임 이탈 6건과 글자 겹침 17건을 좌표로 찾아냈다) → 눈으로 보는 대신 `check.mjs`로 검사를 고정하고 전부 고쳤다. 보류한 P3 3건은 이 리뷰가 타당하다고 확인했다
- (발표 시안 반영) 4차 독립 Reviewer: FAIL(P1 1 — 분석 정보 카드가 하단 내비 뒤로 숨음, P2 7 — 검사기가 보드 01~04를 검사하지 않고 세로·가림 축이 없음, P3 10) → 검사기에 가림·세로 이탈·미배정 보고를 더하고 전부 고쳤다
- (발표 시안 반영) 5차 독립 Reviewer: FAIL(차단 3 — 08 분석 정보 캡션이 아직 가운데 버튼 뒤로 숨음, 가림 70% 임계값·원 정사각형 근사가 그것을 놓침, README 검증 범위 절이 검사기 실제 동작과 다름 / 권고 3 — 빈 슬롯 사유를 점선 원이 관통, 카드 축소로 제외 사유 문구 누락, Last Verified Commit 절이 낡음) → 검사기를 절대 넓이 가림·원 실측·테두리 관통·도형 이탈로 바꾸고, 새 검사기가 찾은 18건(06·09·01 포함)을 모두 고쳤다. 분석 정보 카드는 앱 `AnalysisInfoBlock` 문구와 맞췄다
- (발표 시안 반영) 사용자 제보 버그: 시상대에서 선택되지 않은 순위의 캐릭터가 사라짐 → `PersonaAvatar`의 둥근 클리핑을 원격 사진일 때만 쓰고 선택 테두리를 겹친 링으로 바꿨다. Android(Expo Go 강제 종료 후 재실행)에서 1·2·3위 선택을 캡처로 확인(evidence `fix-podium-*`). `verify:tokens`·`lint`·`typecheck` PASS, `export:android` 미실행
- (발표 시안 반영) 6차 독립 Reviewer: PASS(차단 0·권고 5). R1(원 테두리 두께)·R2(README 사각지대)·R4(캐릭터 어깨가 원 밖으로 나옴 → SVG ClipPath)를 반영하고 Expo Go 재실행 뒤 다시 캡처했다. 7차 리뷰: FAIL(차단 1 — R1 정규식 오타로 두께가 늘 1로 읽힘) → 오타를 고치고 민감도 실험으로 확인. 권고(`</G>` 들여쓰기, 입 Path fill 누락, handoff 리뷰 요청 절 낡음, "R1 반영" 문구가 사실과 다름)도 반영했다. 8차 독립 Reviewer: PASS(차단 0·권고 3 — Last Verified Commit 설명, evidence README 캡처 방법 두 줄 모순, 불릿 붙음) → 문서만 정리했다. R3(보드 유형 2개 화면에 상세 섹션 없음·유형 0개 이미지 고지 문구)는 이번 변경 전부터 있던 차이로 남긴다. R5는 Last Verified Commit 갱신으로 반영
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
9. SecureStore를 쓸 수 없는 기기에서 앱을 다시 켜면 로그인 화면으로 돌아가는데, 그 이유를 사용자에게 알리는 방법이 정해지지 않았다. `frontend/mobile/src/session/storage.ts` 주석에만 있었고 정본 어디에도 없어 여기에 등재한다. 지원 기기 범위(DESIGN_SYSTEM §13)가 정해진 뒤에 정한다.
10. 확인 대화상자가 열렸다는 사실을 TalkBack에 알리는 수단이 없다(`accessibilityLiveRegion`·`announceForAccessibility` 모두 없음). Android 네이티브 `Modal`의 윈도 전환 안내에 기대고 있다. DESIGN_SYSTEM §8이 지원 기기·TalkBack 조합 미확정을 이유로 네이티브 접근성 완료 판정을 보류했으므로 그 결정과 함께 정한다.
11. `HomeScreen`의 `첫 분석 시작하기`는 `router.replace('/analyze')`다. 저장본이 없는 홈은 돌아갈 화면이 없어 의도한 단방향 전환이지만, 스택 깊이 가정이 걸린 지점이라 기록해 둔다(Step 10 5차 리뷰).
12. `StepIndicator`의 끝난 단계에 붙인 `✓`가 라벨 본문에 섞여 있다. TalkBack이 기호를 그대로 읽을 수 있는데 실행하지 못해 미확인이다. 보조기술 검증을 할 때 함께 본다.
13. **Figma 파일(`lIEsVWuCpKr2SzvYeu2EzZ`)이 2026-09-22 보드 8장 그대로다.** 2026-09-27 갱신분과 새 보드 2장을 넣지 못했다. Figma MCP가 Starter 플랜 호출 한도에 걸린다. 한도가 풀리거나 플랜을 올리면 import한다. 그때까지 디자인 정본은 `docs/design/figma/TASK-020/svg/`와 앱 코드다.
14. **브랜치와 TASK가 어긋나 있다.** 이 문서의 `Branch`는 `docs/TASK-020-frontend-state-model`이지만 Step 3~10 작업은 전부 `docs/TASK-019-step0-rebaseline` 브랜치에서 했다. PR을 TASK-019와 TASK-020으로 나눌지, 한 PR로 낼지 사용자가 정한다(AGENTS 6.2 — PR은 TASK 1개에 대응).

## Do Not Assume

- State Model은 화면 디자인 시안이 아니다.
- `SC-*` 하나가 React Native route 하나라는 뜻이 아니다.
- `offline` 상태를 정의했지만 캐시나 자동 재시도 정책을 확정한 것은 아니다.
- ImageGen 시안은 State Model과 Design Foundation이 준비된 뒤 생성한다.
- 실제 백엔드가 없는 상태의 fixture를 구현 완료 증거로 사용하지 않는다.

## Next Action

발표 시안·디자인 리뷰 반영을 재검토 받는 중이다. 그 뒤에 Step 11(자동 검증)로 넘어간다. Step 10 게이트는 5차 독립 Reviewer PASS로 통과했다.

2026-09-27에 한 것: 2026-09-26 최종 발표 시안과 Figma 디자인 리뷰 댓글 9건을 반영해 화면을 다시 만들었고(주요 버튼 남색, 흰 헤더, TOP3 시상대, 홈 순서 변경, 입력 3단계 표시), PULSE 로고·SVG 아이콘·손님 캐릭터를 넣었으며, Figma 보드를 새 디자인으로 다시 뽑고 인증·로딩 보드 2장을 더했다. Figma MCP는 Starter 플랜 호출 한도에 걸려 파일을 직접 고치지 못했고, 기존과 같은 SVG import 방식으로 만들었다. Step 9~10에서 남은 것: 실제 백엔드 연결(§11 공백 해소 후), Google 로그인과 계정 탈퇴(결정 대기), 실패 상태 재현, 오프라인·키보드·TalkBack·실기기 확인. 팀 Figma 공용 파일로 옮길지, Pretendard를 각 PC에 설치할지는 사용자가 정한다. SCREEN_STATES §11의 백엔드 공백은 2026-09-24 오해서와의 회의에서 전달한다(요청 목록: https://claude.ai/artifact/3DSab1M4q4qaLbAKqzxghc — 비공개 페이지, 정본은 SCREEN_STATES §11).

## Last Verified Commit

`ea6ea03` — 7차 리뷰 반영 커밋(check.mjs 테두리 두께 정규식 `[\d.]`, 캐릭터 입 `fill="none"`). 그 앞 `88fdfda`는 R2·R4를 반영했지만 R1 정규식이 `[d.]` 오타라 R1은 실제로 동작하지 않았다. 8차 독립 Reviewer PASS(권고 3 — 문서 정합성, 이 절과 evidence README로 반영). 이 뒤 커밋은 문서만 바꾼다.
