# TASK-020 — 세션 인계 (2026-09-28)

새 대화에서 이어갈 때 **가장 먼저 읽는 문서**다. 정본은 아니고 인계용이다.
시스템 전체 상태의 정본은 [TASK-020-frontend-state-model.md](TASK-020-frontend-state-model.md)다.

## 지금 어디까지 왔나

작업 순서는 사용자가 준 `preview.html` 「최종 AI-Native 워크플로」 0~12단계다(`preview.html`은 저장소에 없다). **0~12단계가 모두 끝났다.** 이 인계 문서에 남은 일은 없다. 다음 작업은 사용자가 정한다.

| 갈래 | 상태 |
|---|---|
| 워크플로 0~10단계 | 끝남. Step 10 게이트는 5차 독립 Reviewer PASS |
| 발표 시안·디자인 리뷰 반영 | 끝남. 독립 리뷰 8차 PASS. 시상대 캐릭터가 사라지던 버그도 고침 |
| 11단계 자동 검증 | 끝남(2026-09-27). 테스트·E2E·visual regression은 **지금 도입하지 않기로 사용자가 정했다** |
| 가입 비밀번호 확인 칸 | 끝남(2026-09-28). 독립 Reviewer PASS(차단 0·P3 4 반영) |
| Figma 파일 갱신 | 끝남(2026-09-28). MCP가 막혀 **사용자가 직접** 새 페이지에 보드 10장을 넣었다. Pretendard 표시는 사용자 보고 |
| 12단계 Spec Update | 끝남(2026-09-28). 독립 Reviewer PASS(차단 0·P2 1·P3 6). P2는 role:platform으로 넘김 |
| 통합 테스트 인계 문서 | 끝남. [frontend/mobile/INTEGRATION_GUIDE.md](../../../frontend/mobile/INTEGRATION_GUIDE.md) |
| GitHub 업로드·PR | 원격 `feat/TASK-020-frontend-mobile`은 `10161ab`까지다. **그 뒤 커밋은 전부 로컬에만 있다**(아래 Git 상태) |

## 2026-09-28 세션에서 한 것

1. **가입 비밀번호 확인 칸** — `frontend/mobile/src/features/auth/SignupScreen.tsx`. 비어 있음·불일치는 제출 전 필드 오류, 확인 값은 서버에 보내지 않음, 약관 변경 시 함께 지움. 정본 `SCREEN_STATES` §3.2·§13 9차, `DESIGN_SYSTEM` CredentialForm 행, 보드 09. Android 캡처 5장 `docs/design/evidence/TASK-020/signup-confirm-*`. 약관 변경은 가상 서버에 임시 분기를 넣어 재현한 뒤 되돌렸다(커밋에 없음).
2. **Figma** — `get_metadata`가 Starter 플랜 한도로 두 번 거부됐다. 사용자가 SVG 10장을 드래그해 넣었다. 처음엔 Inter로 바뀌었는데, Figma 앱이 글꼴 설치 전부터 켜져 있었기 때문이다. 재실행 뒤 다시 넣어 Pretendard로 나왔다. 기록은 [보드 README "Import 결과 (2026-09-28)"](../../design/figma/TASK-020/README.md).
3. **12단계 Spec Update** — 홈 결과 순서(가게 이름 → TOP3 → 선택 유형 → 맨 아래 분석 정보·한계)를 `RESULT_IA`·`USER_FLOW`·기능명세 RESULT-001·`SCREEN_STATES` §6.1에 맞췄다. `AGENTS.md` 2장 테스트 러너 행에 E2E·visual regression 미도입(재검토 시점 TBD)을 적었다.

4. **손님 캐릭터 교체** — 사용자가 시안(대화 안 미리보기)을 보고 골랐다. 서로 다른 세 사람, 얼굴 있음, 안경 쓴 사람은 안경다리까지. 하단 바 아이콘은 "지금이 제일 낫다"고 해서 그대로 뒀다. 도형은 `frontend/mobile/src/components/icons/guestCharacterShapes.ts` 한 곳에 있고 앱과 보드 생성기가 같이 읽는다. 옷 두 벌은 대비 3:1을 넘기려고 시안보다 조금 진하다. 캡처 `guest-v2-*` 2장.

5. **선택 유형 요약 카드** — 결과 화면의 빈 이미지 칸 대신, 사용자가 시안 6개 중 고른 F안을 넣었다. 왼쪽 손님 캐릭터(실제 서버에서는 AI 이미지), 순위·리뷰 수, "분석한 리뷰 N건 중 M%" 막대, 관점별 근거 수 칩. 사용자 결정: 큰 이미지 칸은 없앤다 / 비율은 지금 넣고 백엔드 확인(SCREEN_STATES §11) / 이미지 실패 시 카드에 다시 불러오기.

6. **마이페이지 저장 이미지** — 사용자 요청으로 큰 회색 칸 3개를 홈과 같은 동그란 손님 그림 + `N위 손님`·유형 이름 한 줄씩으로 바꿨다. 실패·다시 불러오기 로직은 `PersonaAvatar.tsx`의 `usePersonaImageRetry`·`PersonaImageError`로 모아 홈 카드와 함께 쓴다. `PersonaImageBlock`은 쓰는 곳이 없어 지웠다. Figma 보드 10에 마이페이지 스크롤 아래 화면을 한 장 더했다(보드 너비 2608 → 3032).

## 남은 것 (다음 작업 후보 — 사용자가 고른다)

- **`docs/architecture/API.md` 272줄 옛 결과 순서** — `role:platform` 소유. 상태 정본 Unresolved 15. PR 본문에 적고 넘긴다.
- **`docs/architecture/FRONTEND_STRUCTURE.md` 58줄 이미지 컴포넌트 서술** — `PersonaImageBlock`을 지워 공용 컴포넌트가 17종이 됐다. `role:platform` 소유. 상태 정본 Unresolved 16.
- **한 리뷰가 여러 유형에 세어지는지** — 요약 카드의 비율 뜻이 달라진다. 백엔드(`role:feature`) 확인. SCREEN_STATES §11.
- **Figma 미확인** — 잘림·굵기 4단계·팀원 PC 글꼴. MCP가 Starter 한도라 에이전트는 파일을 볼 수 없다.
- **원격에 없는 로컬 커밋 push·PR** — 사용자가 말하기 전에는 하지 않는다. 범위는 `git log --oneline @{u}..HEAD`로 뽑는다(아래 Git 상태). PR을 올릴 때 `docs/product/**`(role:product)·`docs/design/**`(role:design-system) 수정을 본문에 밝힌다(AGENTS 5장).
- 상태 정본 Unresolved 1~12·14(오프라인·polling·TalkBack·브랜치와 TASK 불일치 등), 실제 백엔드 연결.
- 요구사항 문서 머리의 "기준일"이 2026-09-21~22 그대로다(12단계 리뷰 P3, 보류).

## 사용자가 정한 것 (되묻지 않는다)

- 주요 버튼은 남색. 주황은 입력 포커스·진행 중 단계·저장 완료 표시·하단 중앙 버튼에만. (디자인 리뷰 #2·#7)
- 홈은 TOP3가 맨 위, 분석 정보는 맨 아래. (디자인 리뷰 #3)
- 테스트·E2E·visual regression은 지금 도입하지 않는다(2026-09-27). 다시 정할 시점은 정하지 않았다.
- 가입 화면에 비밀번호 확인 칸을 둔다(2026-09-27).
- Figma는 MCP가 막히면 사용자가 직접 넣는다. 옛 페이지는 날짜를 붙여 남긴다.

## 반복된 실수 — 이것부터 조심한다

1. **코드에 없는 것을 문서에 있다고 적었다.** 매수·수치·컴포넌트 이름·절 번호를 기억으로 쓰지 않는다. `ls`·`git log`·`grep`·명령 출력에서 뽑는다. (2026-09-28에도 절 번호를 기억으로 적었다가 `awk`로 확인해 고쳤다.)
2. **눈으로 본 것을 검증했다고 적었다.** 보드는 `check.mjs`, 앱은 에뮬레이터 실행, Figma는 사용자 보고가 근거다. 확인 못 한 것은 "미확인"이라고 쓴다.
3. **정책을 바꾸면 그 정책을 언급한 모든 절을 grep으로 찾는다.** 결과 순서는 한 곳만 고쳐져 있고 `RESULT_IA` 4곳·`USER_FLOW` 3곳·기능명세 1곳, 모두 8곳에 옛 순서가 남아 있었다.
4. **셸 heredoc 안 node 템플릿 문자열로 파일을 고치면 `\d` 같은 백슬래시가 사라진다.** 백슬래시가 들어가는 수정은 Edit 도구로 하고 `grep -nF`로 다시 확인한다.

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

- 앱 실행: 에뮬레이터 `Medium_Phone` + Expo Go. 명령은 [INTEGRATION_GUIDE 3.3](../../../frontend/mobile/INTEGRATION_GUIDE.md). Metro가 이미 8081에 떠 있으면 `npx expo start`가 포트를 물으며 멈추므로 `adb shell am start -a android.intent.action.VIEW -d exp://10.0.2.2:8081`로 연다.
- `adb`는 `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. 한글 입력은 안 된다. 뒤로 가기(`keyevent 4`)는 앱을 닫을 수 있다. 입력 칸 좌표는 키보드가 뜨면 바뀌므로 `uiautomator dump`로 매번 다시 읽는다. 화면 아래 Expo 경고 알림(scheme 미설정)을 누르면 개발 경고 창이 열린다 — `Dismiss`로 닫는다.
- Figma MCP: SCC 팀 포함 소속 팀이 모두 Starter라 호출 한도에 걸린다(2026-09-28). 넣을 일이 생기면 보드 README "Figma에 넣는 법"대로 사용자가 직접 넣는다.
- 독립 리뷰는 `reviewer` 서브에이전트에게 맡긴다. 에뮬레이터·`npm install`·`generate.mjs`(svg/를 덮어씀)를 금지하고 판정과 근거만 받는다.

## Git 상태

- 로컬 브랜치 `docs/TASK-019-step0-rebaseline`은 원격 `feat/TASK-020-frontend-mobile`을 추적한다.
- 원격 추적 브랜치는 `10161ab`다. 그 뒤 로컬 커밋은 **push하지 않았다.** 이 문서를 고친 시점에 `git rev-list --count @{u}..HEAD`는 10이었다(이 정정 커밋 포함 전). 개수는 커밋마다 바뀌므로 명령으로 다시 확인한다.
  - `0a110b1`·`749aa71` — 2026-09-27 밤 인계 문서 커밋. 원격에 올라가지 않았다.
  - `6d9ac20`~`08b13d3` 7개 — 이 세션 작업(비밀번호 확인 칸·Figma 기록·12단계).
  - `e173468`과 그 뒤 — 인계 정리.
- 앱 실행에 `npm run start`(AGENTS 3장 dev server 명령)는 쓰지 않는다. `expo start --dev-client`라 development build용이고, 지금은 Expo Go로 연다.
- Figma 파일: https://www.figma.com/design/lIEsVWuCpKr2SzvYeu2EzZ — 페이지 `TASK-020 Vertical Slice (2026-09-28)`가 지금 보드, `… (2026-09-22)`는 옛 보드.
