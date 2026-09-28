# TASK-020 — 세션 인계 (2026-09-28 마감)

새 대화에서 이어갈 때 **가장 먼저 읽는 문서**다. 정본은 아니고 인계용이다.
시스템 전체 상태의 정본은 [TASK-020-frontend-state-model.md](TASK-020-frontend-state-model.md)다.

## 지금 어디까지 왔나

작업 순서는 사용자가 준 `preview.html` 「최종 AI-Native 워크플로」 0~12단계다(`preview.html`은 저장소에 없다). **0~12단계가 모두 끝났고, 그 뒤 사용자 요청 디자인 수정 3건도 끝났다.** 이 문서에 진행 중인 일은 없다. 다음 작업은 사용자가 정한다.

| 갈래 | 상태 |
|---|---|
| 워크플로 0~10단계 | 끝남. Step 10 게이트는 5차 독립 Reviewer PASS |
| 발표 시안·디자인 리뷰 반영 | 끝남. 독립 리뷰 8차 PASS |
| 11단계 자동 검증 | 끝남(2026-09-27). 테스트·E2E·visual regression은 **지금 도입하지 않기로 사용자가 정했다** |
| 가입 비밀번호 확인 칸 | 끝남(2026-09-28). 독립 Reviewer PASS |
| 12단계 Spec Update | 끝남(2026-09-28). 독립 Reviewer PASS. P2 1건은 role:platform으로 넘김(Unresolved 15) |
| 손님 캐릭터 교체 | 끝남(2026-09-28). 독립 Reviewer PASS |
| 결과 화면 선택 유형 요약 카드 | 끝남(2026-09-28). 1차 FAIL(대체 텍스트) → 2차 PASS |
| 마이페이지 저장 이미지 | 끝남(2026-09-28). 독립 Reviewer PASS |
| Figma 파일 | 사용자 보고로 지금 보드와 같다(2026-09-28, 기준 커밋 `6c63086`의 `svg/`). MCP가 막혀 **사용자가 직접** 넣었다. 보드 10장 전체 → 5장 교체 → 보드 10 교체. 에이전트는 파일을 직접 보지 못했다 |
| 통합 테스트 인계 문서 | 끝남. [frontend/mobile/INTEGRATION_GUIDE.md](../../../frontend/mobile/INTEGRATION_GUIDE.md) |
| GitHub | 원격 `feat/TASK-020-frontend-mobile`은 `10161ab`까지다. **그 뒤 커밋은 전부 로컬에만 있다**(아래 Git 상태) |

## 2026-09-28 세션에서 한 것

1. **가입 비밀번호 확인 칸** — `features/auth/SignupScreen.tsx`. 비어 있음·불일치는 제출 전 필드 오류, 확인 값은 서버에 보내지 않음, 약관 변경 시 함께 지움. 캡처 `signup-confirm-*` 5장. 약관 변경은 가상 서버에 임시 분기를 넣어 재현한 뒤 되돌렸다(커밋에 없음).
2. **12단계 Spec Update** — 홈 결과 순서(가게 이름 → TOP3 → 선택 유형 → 맨 아래 분석 정보·한계)를 `RESULT_IA`·`USER_FLOW`·기능명세 RESULT-001·`SCREEN_STATES` §6.1에 맞췄다. `AGENTS.md` 2장 테스트 러너 행에 E2E·visual regression 미도입(재검토 시점 TBD).
3. **손님 캐릭터 교체** — 서로 다른 세 사람(1위 안경·짧은 머리+안경다리, 2위 올림머리·귀걸이, 3위 모자·후드), 얼굴 있는 일러스트. 도형은 `components/icons/guestCharacterShapes.ts` 한 곳에 있고 앱과 보드 생성기가 같이 읽는다. 옷 두 벌은 대비 3:1 때문에 시안보다 조금 진하다. 하단 바 아이콘은 사용자가 "지금이 제일 낫다"고 해서 그대로다. 캡처 `guest-v2-*` 2장.
4. **결과 화면 선택 유형 요약 카드** — 큰 이미지 칸 대신 사용자가 고른 F안: 손님 그림(실제 서버에서는 AI 이미지), `N위 손님`·`리뷰 N건`, "분석한 리뷰 N건 중 M%" 막대(앱 계산값), 관점별 근거 수 칩. 이미지 실패 시 카드 안에 원인과 다시 불러오기(원격 이미지일 때만). 캡처 `stats-card-*` 3장.
5. **마이페이지 저장 이미지** — 큰 회색 칸 3개를 홈과 같은 동그란 손님 그림 + `N위 손님`·유형 이름 한 줄씩으로. 실패·다시 불러오기는 `components/ui/PersonaAvatar.tsx`의 `usePersonaImageRetry`·`PersonaImageError`로 모아 홈 카드와 함께 쓴다. `PersonaImageBlock`은 지웠다(공용 컴포넌트 17종). 캡처 `mypage-images-*` 2장.
6. **Figma** — 기록은 [보드 README "Import 결과 (2026-09-28)"](../../design/figma/TASK-020/README.md). 처음 Inter로 바뀐 것은 Figma 앱이 글꼴 설치 전부터 켜져 있었기 때문이다(재실행 뒤 해결).

캡처는 모두 [evidence README](../../design/evidence/TASK-020/README.md)에 절별로 적었다.

## 남은 것 (다음 작업 후보 — 사용자가 고른다)

- **role:platform에 넘길 문서 2건** — `docs/architecture/API.md` 272줄 옛 결과 순서(Unresolved 15), `docs/architecture/FRONTEND_STRUCTURE.md` 58줄 공용 컴포넌트 목록 18종·`PersonaImageBlock` 서술(Unresolved 16). 이 TASK에서는 고치지 않는다.
- **백엔드(role:feature) 확인 1건** — 한 리뷰가 여러 손님 유형의 `topicReviewCount`에 함께 세어지는지. 겹치면 요약 카드의 "N건 중 M%" 표현을 바꾼다(SCREEN_STATES §11).
- **실제 서버 연결 뒤 확인** — 원격 이미지의 로딩 회색 원·다시 불러오기, 서버 `altText` 형식(마침표로 끝나면 읽기 문장에 마침표가 겹친다). 가상 데이터의 대체 텍스트는 음식을 설명해 보이는 사람 그림과 다르다(가상 서버에서만).
- **미확인 Visual QA** — 글자 크기 200%, TalkBack 실제 낭독, 실기기, 요약 카드 3위 선택.
- **Figma 미확인** — 잘림·굵기 4단계·팀원 PC 글꼴. 에이전트는 MCP 한도로 파일을 볼 수 없다.
- **push·PR** — 사용자가 말하기 전에는 하지 않는다. PR을 올릴 때 `docs/product/**`(role:product)·`docs/design/**`·`src/design/**` 토큰·`components/ui/**`(role:design-system — 토큰 변경은 리뷰 필수), 공용 파일 `AGENTS.md`, 앞 단계의 `docs/architecture/**` 수정과 위 platform 이관 2건을 본문에 밝힌다(AGENTS 5장). 전체 목록은 상태 정본 Owner 표.
- 상태 정본 Unresolved 1~6·8~12·14(오프라인·polling·TalkBack·브랜치와 TASK 불일치 등), 요구사항 문서 머리의 "기준일"(2026-09-21~22 그대로, 보류).

## 사용자가 정한 것 (되묻지 않는다)

- 주요 버튼은 남색. 주황은 입력 포커스·진행 중 단계·저장 완료 표시·하단 중앙 버튼에만. (디자인 리뷰 #2·#7)
- 홈은 TOP3가 맨 위, 분석 정보는 맨 아래. (디자인 리뷰 #3)
- 테스트·E2E·visual regression은 지금 도입하지 않는다(2026-09-27). 다시 정할 시점은 정하지 않았다.
- 가입 화면에 비밀번호 확인 칸을 둔다(2026-09-27).
- 하단 바 아이콘은 지금 것을 유지한다(2026-09-28).
- 손님 캐릭터는 얼굴 있는 서로 다른 세 사람, 안경 쓴 사람은 안경다리까지(2026-09-28).
- 결과 화면은 큰 이미지 칸 대신 F안 요약 카드. 왼쪽은 음식이 아니라 사람 그림. 비율은 백엔드 확인 전에도 표시. 이미지 실패 시 카드에 다시 불러오기(2026-09-28).
- 마이페이지 저장 이미지도 같은 사람 그림(2026-09-28).
- Figma는 MCP가 막히면 사용자가 직접 넣는다. 옛 페이지는 날짜를 붙여 남긴다.

## 반복된 실수 — 이것부터 조심한다

1. **코드에 없는 것을 문서에 있다고 적었다.** 매수·수치·컴포넌트 이름·절 번호·커밋 개수를 기억으로 쓰지 않는다. `ls`·`git log`·`grep`·명령 출력에서 뽑는다. (2026-09-28에도 절 번호와 원격 미반영 커밋 수를 기억으로 적었다가 리뷰에서 잡혔다.)
2. **눈으로 본 것을 검증했다고 적었다.** 보드는 `check.mjs`, 앱은 에뮬레이터 실행, Figma는 사용자 보고가 근거다. 확인 못 한 것은 "미확인"이라고 쓴다.
3. **정책을 바꾸면 그 정책을 언급한 모든 절을 grep으로 찾는다.** 결과 순서는 8곳, 이미지 칸은 정본 3개 문서와 보드 08에 흩어져 있었다.
4. **셸 heredoc 안 node 템플릿 문자열로 파일을 고치면 `\d` 같은 백슬래시가 사라진다.** 백슬래시가 들어가는 수정은 Edit 도구로 하고 `grep -nF`로 다시 확인한다.
5. **그림을 묶어 읽게(`accessible`) 하면 안쪽 그림의 대체 텍스트가 가려진다.** 묶음 라벨에 `altText`를 붙인다(2026-09-28 요약 카드 1차 FAIL 원인).
6. **파일을 두 번에 나눠 고치면 Fast Refresh가 중간 상태를 불러와 오류 화면이 뜰 수 있다.** 고친 뒤 `curl -X POST http://localhost:8081/reload`로 다시 불러와 확인한다.

## 알아 둘 도구·환경

```bash
# 프론트 검증 (저장소 루트)
npm --prefix frontend/mobile run verify:tokens
npm --prefix frontend/mobile run lint
npm --prefix frontend/mobile run typecheck
npm --prefix frontend/mobile run export:android

# 보드 다시 뽑기 + 검사
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/generate.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs
```

- 앱 실행: 에뮬레이터 `Medium_Phone` + Expo Go. 명령은 [INTEGRATION_GUIDE 3.3](../../../frontend/mobile/INTEGRATION_GUIDE.md). `npm run start`(AGENTS 3장 dev server 명령)는 `expo start --dev-client`라 쓰지 않는다. Metro가 이미 8081에 떠 있으면 `npx expo start`가 포트를 물으며 멈추므로 `adb shell am start -a android.intent.action.VIEW -d exp://10.0.2.2:8081`로 연다.
- 예시 계정은 `src/api/fixtures/server.ts`의 `fixtureAccount`다. 로그인 화면 이메일 칸에 예시 이메일이 미리 채워져 있으니 이어 쓰지 않는다.
- 가상 서버 상황은 분석하기 화면 위 `가상 서버 상황: … 바꾸기`로 고른다(`이미지 조회 실패`로 IMAGE-LOAD-ERROR 재현).
- `adb`는 `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. 한글 입력은 안 된다. 뒤로 가기(`keyevent 4`)는 앱을 닫을 수 있다. 입력 칸 좌표는 키보드가 뜨면 바뀌므로 `uiautomator dump`로 매번 다시 읽는다. 화면 아래 Expo 경고 알림(scheme 미설정)을 누르면 개발 경고 창이 열린다 — `Dismiss`로 닫는다.
- Figma MCP: SCC 팀 포함 소속 팀이 모두 Starter라 호출 한도에 걸린다(2026-09-28). 넣을 일이 생기면 보드 README "Figma에 넣는 법"대로 사용자가 직접 넣는다. 바뀐 보드만 `git diff --stat 6c63086 HEAD -- docs/design/figma/TASK-020/svg/`로 뽑아 안내한다(`6c63086` = 사용자가 마지막으로 넣은 보드 상태). 새로 넣게 하면 이 기준 커밋도 갱신한다.
- Figma 파일: https://www.figma.com/design/lIEsVWuCpKr2SzvYeu2EzZ — 페이지 `TASK-020 Vertical Slice (2026-09-28)`가 지금 보드, `… (2026-09-22)`는 옛 보드. 보드는 X=0에 01→10 세로 배치(좌표는 보드 README).
- 독립 리뷰는 `reviewer` 서브에이전트에게 맡긴다. 에뮬레이터·`npm install`·`generate.mjs`(svg/를 덮어씀)를 금지하고 판정과 근거만 받는다.

## Git 상태

- 로컬 브랜치 `docs/TASK-019-step0-rebaseline`은 원격 `feat/TASK-020-frontend-mobile`을 추적한다. 원격 추적 브랜치는 `10161ab`다.
- 그 뒤 로컬 커밋은 **push하지 않았다.** 이 문서를 쓰기 직전 `git rev-list --count @{u}..HEAD`는 20이었다(이 정리 커밋 포함 전). 개수는 커밋마다 바뀌므로 `git log --oneline @{u}..HEAD`로 다시 뽑는다.
  - `0a110b1`·`749aa71` — 2026-09-27 밤 인계 문서 커밋
  - `6d9ac20`~`08b13d3` — 비밀번호 확인 칸·Figma 기록·12단계
  - `e173468`·`47cdb05` — 첫 인계 정리
  - `b580bf8`~`6c63086` — 손님 캐릭터·요약 카드·마이페이지 이미지·Figma 재교체 기록
  - 그 뒤 — 이 인계 정리
