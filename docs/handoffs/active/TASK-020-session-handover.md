# TASK-020 — 세션 인계 (2026-09-27 저녁)

새 대화에서 이어갈 때 **가장 먼저 읽는 문서**다. 정본은 아니고 인계용이다.
시스템 전체 상태의 정본은 [TASK-020-frontend-state-model.md](TASK-020-frontend-state-model.md)다.

## 지금 어디까지 왔나

작업 순서는 사용자가 준 `preview.html` 「최종 AI-Native 워크플로」 0~12단계다(한 단계씩, 끝나면 재검토 후 다음으로).

| 갈래 | 상태 |
|---|---|
| 워크플로 0~10단계 | 끝남. Step 10 게이트는 5차 독립 Reviewer PASS |
| 발표 시안·디자인 리뷰 반영 | 끝남. 반영분 독립 리뷰 8차 PASS |
| 시상대 그림 버그 | 고침. 선택되지 않은 순위의 캐릭터가 사라지던 것(Android 둥근 클리핑). 캐릭터는 SVG 안에서 원으로 자른다 |
| **11단계 자동 검증** | **끝남.** lint·typecheck·`export:android`·`verify:tokens`·보드 `check.mjs` 모두 통과. 테스트·E2E·visual regression은 도구가 없고 **지금은 도입하지 않기로 사용자가 정했다** |
| **12단계 Spec Update** | **시작 전.** 사용자가 진행 여부를 아직 말하지 않았다 |
| **Figma 파일 갱신** | **시작 전.** 파일이 2026-09-22 옛 보드 8장 그대로다(아래) |
| 통합 테스트 인계 문서 | 끝남. [frontend/mobile/INTEGRATION_GUIDE.md](../../../frontend/mobile/INTEGRATION_GUIDE.md) |
| GitHub 업로드·PR | 끝남. 이 인계의 범위 밖이다. 사용자가 다시 말하기 전에는 push·PR·병합을 하지 않는다 |

## 끝남 — 가입 비밀번호 확인 칸 (2026-09-28)

"남은 일 2번(비밀번호 확인)"을 끝냈다. 독립 Reviewer **PASS**(차단 0·P3 4 — 인계 문서 모순, 보드 확인 칸의 흐린 글씨가 앱에 없음, 보드 잘림 판정식에 제목 높이 누락, "요청 없이"가 코드 기준임을 안 밝힘 → 모두 반영하고 `check.mjs` 0건 재확인). 사용자 확인 뒤 1번(Figma)으로 간다.

- 끝남: `SignupScreen.tsx`에 `비밀번호 확인` 칸(비어 있음·불일치 필드 오류, 서버 미전송, 약관 변경 시 함께 지움, 비밀번호가 바뀌면 확인 오류도 지움). `SCREEN_STATES.md` §3.2의 `AUTH-SIGNUP-EDITING`·`AUTH-CONSENT-OUTDATED`·`AUTH-FIELD-ERROR` 행, `DESIGN_SYSTEM.md` CredentialForm 행 갱신. 보드 09 `generate.mjs`에 칸 추가 — `Signup-ConsentOutdated`는 한 화면에 안 들어가 약관 동의·가입하기를 그리지 않고 캡션에 "스크롤 아래"로 적었다.
- 실행 결과: `check.mjs` 0건(종료 0), `verify:tokens`·`lint`·`typecheck`·`export:android` 모두 종료 0.
- 2026-09-28: 에뮬레이터 캡처 5장(`signup-confirm-*`)과 evidence README·SCREEN_STATES §13 9차 기록 끝남. 약관 변경은 임시 fixture 분기로 재현하고 되돌렸다.
- `PRD.md`·기능명세는 "필수로 받는 정보"라 확인 칸(서버 미전송)과 충돌하지 않아 고치지 않았다. `INTEGRATION_GUIDE.md`·`frontend/mobile/README.md`는 가입 칸 목록이 없어 고칠 것 없음(grep 확인).

## 남은 일

### 1. Figma에 지금 화면 넣기

**목표:** Figma에서 지금 앱과 같은 화면을 볼 수 있게 한다.

- **지금 Figma 상태:** 파일 `lIEsVWuCpKr2SzvYeu2EzZ`(`PULSE TASK-020 Vertical Slice`, 링크 https://www.figma.com/design/lIEsVWuCpKr2SzvYeu2EzZ)는 2026-09-22 보드 8장이다. 네이비 헤더, 주황 CTA, 3칸 카드 등 옛 디자인이다.
- **지금 정본:** 저장소 `docs/design/figma/TASK-020/svg/`의 보드 10장이다. 01 IA·Flow, 02 Foundation, 03 Components, 04 Assets, 05 첫 분석, 06 실패, 07 다시 분석, 08 결과 상태, 09 인증, 10 로딩·빈 상태. 앱 코드와 맞춘 새 디자인이고 검사기 0건이다.
- **막힌 것:** Figma MCP(`use_figma`·`get_metadata`)가 Starter 플랜 호출 한도에 걸려 거부됐다(2026-09-27). 2026-09-27 저녁 `whoami` 결과, 계정은 SCC 팀(starter, Full seat, admin)에 있다. 기존 파일이 있다고 기록된 `lawyland` 팀은 소속 목록에 **없었다**. 파일 접근 권한은 미확인이다.
- **방법 후보:**
  1. MCP 한도가 풀렸으면 → `figma-use` 스킬을 먼저 읽고, 기존 파일에 새 페이지를 만들어 SVG 10장을 넣는다. 옛 페이지는 지우지 말고 이름에 날짜를 붙여 남긴다. 사용자는 "한도가 풀리면 이어서, 안 되면 새 파일로 만들어도 된다"고 했다.
  2. 기존 파일에 접근이 안 되면 → SCC 팀에 새 파일을 만든다(`figma-create-new-file` 스킬 먼저).
  3. MCP가 계속 막히면 → 사용자가 `svg/` 파일 10장을 Figma 캔버스로 드래그하면 된다(MCP 한도와 무관). 절차는 [보드 README "Figma에 넣는 법"](../../design/figma/TASK-020/README.md#figma에-넣는-법).
- **넣은 뒤 할 일:** 글꼴 대체 여부를 확인한다. 2026-09-22에는 Pretendard가 없어 Inter로 바뀌었고, Gothic A1로 교정했다(보드 README "Import 결과"). 스크린샷으로 확인하고 [보드 README](../../design/figma/TASK-020/README.md)의 Import 결과와 상태 정본 Unresolved 13을 갱신한다.
- **주의:** 보드를 다시 만들 일이 생기면 `generate.mjs` 뒤에 반드시 `check.mjs`를 돌린다. 보드 문구·배치의 기준은 앱 코드다.

### 2. 이메일 가입에 "비밀번호 확인" 칸 추가 (사용자 요청, 2026-09-27) — **끝남 (2026-09-28). 위 "끝남" 절 참고. 아래는 당시 작업 지시 기록이다**

- **당시 상태(2026-09-27):** `SignupScreen.tsx`에는 비밀번호 칸이 하나뿐이었다.
- **정본에 먼저 반영:** `SCREEN_STATES.md`의 `AUTH-SIGNUP-EDITING` 행은 "이메일·비밀번호·전화번호"라고 적혀 있다. AGENTS 8장 순서대로 요구사항을 먼저 확인하고, 이 행과 가입 관련 절을 grep으로 찾아 함께 고친다. `docs/product/**`는 `role:product` 소유라 변경을 handoff에 적는다.
- **구현할 것:** 비밀번호 아래에 확인 칸을 둔다. 두 값이 다르면 제출 전에 필드 오류를 보여 준다(기존 `errors` 방식, 문구 예: "비밀번호가 서로 달라요."). 확인 값은 **서버에 보내지 않는다** — `POST /api/v1/auth/register` 계약은 바뀌지 않는다. 약관이 바뀌어 비밀번호를 지우는 경우(`AUTH-CONSENT-OUTDATED`)에는 확인 칸도 함께 지운다. 입력 중 오류 지우기, 보안 입력(`secureTextEntry`), 자동완성 속성도 기존 비밀번호 칸과 맞춘다.
- **함께 고칠 것:** Figma 보드 09(인증)의 가입 화면 중 입력 칸이 있는 `Signup-Editing`·`Signup-ConsentOutdated`에 칸을 추가한다(`Signup-LegalLoading`은 칸이 없다). `generate.mjs` → `check.mjs` 0건을 확인하고, 화면 높이가 넘치면 간격을 조정한다. `INTEGRATION_GUIDE.md`는 가입 칸을 다루지 않으니 바꿀 필요가 없는지만 확인한다.
- **검증:** `verify:tokens`·`lint`·`typecheck`·`export:android`, 에뮬레이터에서 일치·불일치·약관 변경 세 경우를 캡처한다(evidence README에 기록). 끝나면 reviewer 독립 검토를 받는다.
- **순서:** Figma 넣기(1번)와 파일이 겹친다. 보드 09가 바뀌므로 **이 작업을 먼저 하고 Figma에 넣는 것**이 두 번 일하지 않는 길이다. 사용자에게 순서를 확인한다.

### 3. 12단계 Spec Update

진행 여부를 **사용자에게 먼저 묻는다.** 진행하면 이번에 새로 정한 것을 정본에 다시 반영한다. 후보는 다음과 같다(반영 여부는 각 정본을 읽고 판단한다).

- 주요 버튼 남색 / 주황 사용처, 홈 순서 TOP3 먼저 → `docs/design/DESIGN_SYSTEM.md`에 이미 들어갔는지 grep으로 확인
- 손님 TOP3 시상대, 빈 칸 사유 위치, 분석 정보 카드 문구 → `SCREEN_STATES.md`·`RESULT_IA.md`
- 테스트 도구 미도입 결정 → `AGENTS.md` 2장 "프론트엔드: 단위 테스트 미도입"이 이미 맞는지 확인
- 정책을 바꾸면 그 정책을 언급한 **모든 절**을 grep으로 찾아 함께 고친다

## 사용자가 정한 것 (되묻지 않는다)

- 주요 버튼은 남색. 주황은 입력 포커스·진행 중 단계·저장 완료 표시·하단 중앙 버튼에만. (디자인 리뷰 #2·#7)
- 홈은 TOP3가 맨 위, 분석 정보는 맨 아래. (디자인 리뷰 #3)
- 11단계의 테스트·E2E·visual regression은 지금 도입하지 않는다(2026-09-27).
- Figma는 한도가 풀리면 이어서, 안 되면 새 파일로 만들어도 된다.

## 반복된 실수 — 이것부터 조심한다

발표 시안 반영분에서만 독립 리뷰가 FAIL 6번(1~5차, 7차)이 났다. 원인은 세 가지로 모인다.

1. **코드에 없는 것을 문서에 있다고 적었다.** 매수·수치·컴포넌트 이름·절 번호를 기억으로 쓰지 않는다. `ls`·`git log`·`grep`·명령 출력에서 뽑는다.
2. **눈으로 본 것을 검증했다고 적었다.** 보드는 `check.mjs`가, 앱은 에뮬레이터 실행이 근거다. 확인 못 한 것은 "미확인"이라고 쓴다.
3. **셸 heredoc 안 node 템플릿 문자열로 파일을 고치면 `\d` 같은 백슬래시가 사라진다.** 7차 FAIL 원인이다. 백슬래시가 들어가는 수정은 Edit 도구로 하고, 결과를 `grep -nF`로 다시 확인한다.

## 알아 둘 도구·환경

```bash
# 프론트 검증 (저장소 루트)
npm --prefix frontend/mobile run verify:tokens
npm --prefix frontend/mobile run lint
npm --prefix frontend/mobile run typecheck
npm --prefix frontend/mobile run export:android   # 2026-09-27 약 14초

# 보드 다시 뽑기 + 검사
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/generate.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs
```

- 앱 실행: 에뮬레이터 `Medium_Phone` + Expo Go. `npm run start`는 development build용이라 쓰지 않는다. 명령은 [INTEGRATION_GUIDE 3.3](../../../frontend/mobile/INTEGRATION_GUIDE.md).
- `adb`는 `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`에 있다. 한글 입력은 안 된다. 입력 제출은 Enter(`keyevent 66`)로 한다. 뒤로 가기(`keyevent 4`)를 보내면 앱이 닫힐 수 있다.
- 독립 리뷰는 `reviewer` 서브에이전트에게 맡긴다. 제약으로 에뮬레이터·`npm install`·`generate.mjs`(svg/를 덮어씀)를 금지하고, 판정과 근거만 받는다.

## Git 상태

- 로컬 브랜치 `docs/TASK-019-step0-rebaseline`은 원격 `feat/TASK-020-frontend-mobile`을 추적한다.
- 이 인계 문서 갱신은 로컬 커밋만 했다. **push하지 않는다** — 사용자가 GitHub 작업은 끝났다고 했다.
