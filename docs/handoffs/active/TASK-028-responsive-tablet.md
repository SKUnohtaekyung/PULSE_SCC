# TASK-028 — 태블릿 크기 화면 배치(반응형)

## Status

구현·검증 완료. 독립 Reviewer 1차 PASS(차단 0, P2 1·P3 3) — 권고를 모두 반영하고 재검증했고, 반영분 2차 PASS(P3 1 — 인계 문서 문구, 반영) (2026-10-01). 2026-10-02 사용자 요청으로 가장 큰 태블릿 크기 확인과 Figma 태블릿 보드(보드 11)를 더했다 — 이 추가분도 독립 Reviewer PASS(P3 2 — 문서 줄바꿈·밀도 가정 표현, 반영). 2026-10-02 사용자 결정으로 #38 병합을 기다리지 않고 **PR #42**(기준 브랜치 `feat/TASK-020-design-followup`, 라벨 `type:feature`·`type:ui`·`role:feature` 조회 확인)를 열었다.

## Owner

`role:feature` — 미배정

**소유 영역 밖 수정(AGENTS 5장 규칙 4·5).** PR 본문에 적고 해당 역할을 리뷰어로 지정한다.

| 파일 | 소유 역할 | 이유 |
|---|---|---|
| `frontend/mobile/src/components/ui/Screen.tsx`·`ScreenHeader.tsx`·`BottomNavigation.tsx` | `role:design-system` | 공용 골격·공용 컴포넌트 변경(리뷰 필수, AGENTS 5장 규칙 5) |
| `docs/design/DESIGN_SYSTEM.md`(§7.1 신설, §13 한 줄)·`docs/design/evidence/TASK-020/**` | `role:design-system` | 배치 규칙과 근거 캡처 |
| `docs/design/figma/TASK-020/**`(`generate.mjs`·`check.mjs`·`README.md`·`svg/11-final-tablet.svg`) | `role:design-system` | 태블릿 보드 11 추가와 검사기의 프레임 크기 판정 |

## Branch

`feat/TASK-028-responsive-tablet` — PR #38 head `8a34b96`에서 만들었다(2026-10-01). 2026-10-02 push, **PR #42**(https://github.com/SKUnohtaekyung/PULSE_SCC/pull/42)를 #38 브랜치 `feat/TASK-020-design-followup` 위에 이어 붙여 열었다(사용자 결정). **#42를 #38보다 먼저 병합하지 않는다.** #38이 main에 squash 병합되면 `git fetch` 뒤 `origin/main`을 이 브랜치에 merge 커밋으로 합쳐(같은 내용이라 충돌은 적을 것으로 보지만 미확인) #42에 이 작업 변경만 남기고, 기준 브랜치가 main인지 확인한다. force push는 하지 않는다. 메시지 정리 전 기록은 로컬 `backup/TASK-028-before-msgfix`에 남겨 두었다(원격에 올리지 않음).

## Goal

지금 화면이 갤럭시 탭·아이패드 크기에서도 어색하지 않게 보이게 한다. 아이패드는 실제 iOS가 아니라 같은 폭의 Android 화면으로 레이아웃만 맞춘다(사용자 결정 2026-10-01 — PRD의 "Android 앱" 정의는 그대로).
관련 요구사항: PRD FR-007, DESIGN_SYSTEM §7.

## Completed

- 고치기 전 조사: 휴대폰 411dp·태블릿 세로 800dp·가로 1280dp × 전 화면. 어색한 곳은 가로 1280dp의 홈(본문이 절반만 씀)·하단 내비(항목이 양끝)·마이페이지 저장 이미지(세로 한 줄)
- 설계 1~4 구현(사용자 확인 2026-10-01): 하단 내비 항목 640 안 가운데 / expanded에서 홈·미리보기 본문 960, 4관점 카드 2열 / expanded에서 마이페이지 저장 이미지 3칸 / 입력·진행·근거 목록은 1열 640 유지
- 설계에 없던 것 하나: 새 결과 미리보기 저장 바의 문구·버튼도 640 안 가운데로 모았다(띠가 화면 전체 폭이라 가로에서 버튼이 1280dp로 늘어남). 조사 표에 없던 화면이라 보고에 밝힌다
- 가장 큰 태블릿 크기 확인(2026-10-02 사용자 요청): 아이패드 프로 13 가로 1376dp·세로 1032dp, 갤럭시 탭 S10 Ultra 가로 1480dp·세로 924dp(밀도 320 가정). 모두 넘침 0, 본문 960 유지
- Figma 태블릿 보드 `svg/11-final-tablet.svg`(2026-10-02 사용자 요청). 프레임 4개 — 가로 1280×800 홈 위쪽·관점 카드 2열·마이페이지 3칸, 세로 800×1280 홈. Figma에 넣는 것은 사용자가 한다

## Changed

`git diff --stat 8a34b96 05b80b8 -- frontend` 기준 코드 7개 파일(첫 구현 `e584777`, 리뷰 반영 `05b80b8`).

- `src/components/ui/Screen.tsx` — `useExpandedLayout`(1024 이상 판단 한 곳)·`useBodyMaxWidth`, `wide` prop(expanded에서만 본문 960)
- `src/components/ui/ScreenHeader.tsx` — `wide` prop(본문과 왼쪽 끝 맞춤)
- `src/components/ui/BottomNavigation.tsx` — 항목 줄을 `readingMaxWidth` 안 가운데로(띠는 전체 폭)
- `src/features/result/ResultView.tsx` — 본문 폭 `useBodyMaxWidth(true)`, `arrangePerspectiveCards`(expanded에서 2장씩 한 줄, 홀수면 빈칸)
- `src/features/result/HomeScreen.tsx`·`PreviewResultScreen.tsx` — 결과가 준비됐을 때만 `wide`(불러오는 중·빈 상태·오류는 640, 리뷰 P2 반영), 저장 바 안쪽 `saveBarInner`(640)
- `src/features/mypage/MyPageScreen.tsx` — expanded에서 `imageGrid` 3칸, 칸 안은 그림 위·이름 아래, 1~2장이면 빈칸으로 채움(리뷰 P3 반영)
- 문서: `docs/design/DESIGN_SYSTEM.md` §7.1 신설·§13 한 줄, evidence README "태블릿 크기 화면 배치" 절과 캡처 `tablet-00`~`tablet-19` 20장, 이 문서, TASK-020 인계 두 문서의 연결 항목
- 보드(2026-10-02): `docs/design/figma/TASK-020/generate.mjs`(`appHeader`·`podium`·`statsCard`·`bottomNav` 폭 옵션 — 기본값은 휴대폰이라 보드 01~10 변화 없음, 태블릿 화면 함수·`tabletsBoard`), `check.mjs`(프레임 크기를 `data-frame-w`·`h`에서 읽음), `README.md`("2026-10-02 보드 11" 절), `svg/11-final-tablet.svg` 신설

## Decisions

- 아이패드 = 같은 폭의 Android 화면으로 흉내(실제 iOS 지원 아님). 사용자 결정 2026-10-01
- 새 TASK·새 브랜치로 진행(PR #38에 더하지 않음). 사용자 결정 2026-10-01
- 2026-10-02 번호 변경: 처음 TASK-024로 만들었으나, 팀원 브랜치 `ui/TASK-024-production-auth-entry`(2026-10-01 원격)와 번호가 겹쳤다. GitHub에 올리기 전이라 다음 빈 번호 TASK-028로 바꿨다(TASK-025~027도 원격에서 쓰임, `git log --all`에 TASK-028 0건). 브랜치 `feat/TASK-024-responsive-tablet` → `feat/TASK-028-responsive-tablet`, 이 문서와 코드 주석·문서의 TASK-024 표기를 모두 바꿨다. 커밋 메시지의 옛 번호는 GitHub에 올리기 전 `git filter-branch --msg-filter`로 고쳤다(팀원 브랜치를 가리키는 `f6abb71` 메시지는 그대로). 메시지만 바뀌어 파일 내용은 같다(`git diff`가 빔). 커밋 번호가 바뀌었다 — 옛→새: `21fa9de`→`203b779`, `0f2baca`→`05b80b8`, `fd4daa8`→`669203f`, `7f5d950`→`f4544e4`, `cd12210`→`5c68420`, `667999d`→`f6abb71`, `f39d968`→`3b39bbc`, `1f48f27`→`d6fd104`(`e584777`은 그대로)
- 새 토큰 없음. 열을 늘리는 기준은 `expanded`(1024) 하나. 600~1023(아이패드 미니~11인치 세로, 태블릿 세로 800)은 1열 640을 유지한다
- 태블릿을 **지원 범위**에 넣을지는 정하지 않았다. 정본은 PRD §13 Open Questions 6번(`role:product`) — 직접 고치지 않고 PR 본문에 넘긴다. 배치 규칙은 DESIGN_SYSTEM §7.1에 "지원 약속이 아니다"라고 적었다
- 화면 방향은 고정하지 않았다(`app.json`에 `orientation` 없음)

## Verification

환경과 수치는 [evidence README](../../design/evidence/TASK-020/README.md) "태블릿 크기 화면 배치" 절.

| 검증 | 명령 | 결과 |
|---|---|---|
| design token | `npm --prefix frontend/mobile run verify:tokens` | 종료 0, `Design token verification: PASS` |
| lint | `npm --prefix frontend/mobile run lint` | 종료 0 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | 종료 0 |
| build | `npm --prefix frontend/mobile run export:android` | 종료 0, `Exported: dist` |
| 보드 검사 | `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs` | 종료 0, `이탈·겹침·가림·관통·도형 이탈 없음`(보드는 바꾸지 않음) |
| test | 없음 — 단위 테스트·E2E 미도입(2026-09-27 사용자 결정) | 미실행 |
| Visual QA | AVD `Pixel_Tablet`(2560×1600, 320dpi)·Expo Go, `wm size`/`wm density`로 폭 흉내 | 고친 뒤 가로·세로 100%·200%, 휴대폰 100%·200% 흐름 모두 넘침 0. 경계 599/600/744/1023/1024 확인 — 2열은 1024부터 |
| 리뷰 반영 뒤 | 위 자동 검증 5개 다시 실행(`05b80b8`와 같은 작업 트리) | 5개 모두 종료 0. Android: `유형 부족` 상황에서 홈 결과 960 유지, 마이페이지 2장 3등분 칸(`tablet-15`), 하단 `분석하기` 원 윗부분 y=1406·1390px 탭 모두 이동. 홈·미리보기의 불러오는 중·빈 상태·오류 모습은 재현할 가상 서버 상황이 없어 미확인(코드 조건만 확인) |
| 가장 큰 크기(2026-10-02) | 같은 AVD `wm size` — 2752x2064·2960x1848 가로, 각 세로 | 1376dp·1480dp 가로 전체 흐름 각 19장 넘침 0, 1032dp 세로 2열·924dp 세로 1열 넘침 0. 1376·1480에서 글자 200%는 미실행 |
| 보드(2026-10-02) | `generate.mjs` 실행 뒤 `git status --short docs/design/figma`, `check.mjs` | 보드 01~10 변화 없음(새 파일은 `svg/11-final-tablet.svg`뿐), `check.mjs` 종료 0 `이탈·겹침·가림·관통·도형 이탈 없음`. 태블릿 프레임 밖 x=1300 글자를 일부러 넣어 `이탈 118px` 검출 확인 뒤 되돌림 |

## Unresolved

1. 태블릿을 지원 범위에 넣을지 — PRD §13 Open Questions 6번(`role:product`)
2. `docs/architecture/FRONTEND_STRUCTURE.md`(`role:platform`) 두 줄 — 고치지 않았다, PR 본문에 넘긴다
   - 115줄 "가로에서 본문이 읽기 폭 안에서 … 늘어지지 않는다"는 이제 1024 미만에서만 맞다. 홈·미리보기 결과는 1024 이상에서 960을 쓴다(독립 리뷰 P3)
   - 118줄 "태블릿 실기기 — 미확인, 지원 기기 범위 미정"은 여전히 맞지만 넓은 화면 배치 규칙(DESIGN_SYSTEM §7.1)을 가리키는 말이 없다
3. `.claude/skills/visual-qa/SKILL.md` 28줄은 "기기 범위가 정해지기 전에는 compact 폰 기준으로 판정하고 넓은 화면은 미확인"이다. 범위가 아직 미정이라 틀린 말은 아니다. 범위가 정해지면 함께 고친다(`role:platform`)
4. 실제 iOS·아이패드, 태블릿 실기기, development build의 화면 방향 기본값, 1024 이상에서 홈·미리보기의 불러오는 중·빈 상태·오류 화면 모습 — 미확인
5. ~~Figma 태블릿 보드 없음~~ — 2026-10-02 보드 11을 만들었다. 남은 것: Figma에 넣기(사용자, 위치 X=0·Y=15360), Figma에서의 모습과 Pretendard 칩 간격 미확인
6. 갤럭시 탭 S10 Ultra의 실제 dp 폭 — 삼성 기본 밀도를 공식 자료로 확인하지 못해 320(1480dp)을 가정했다
7. **팀원 브랜치 `ui/TASK-024-production-auth-entry`(2026-10-01, 아직 PR 없음)가 `frontend/mobile` 39개 파일을 바꿨고 그중 5개가 이 TASK와 겹친다**(`Screen.tsx`·`HomeScreen.tsx`·`PreviewResultScreen.tsx`·`MyPageScreen.tsx`·`ResultView.tsx`). 그 브랜치는 PR #38 이전 main에서 갈라졌고 가상 서버(fixture)·프로토타입을 지웠다. 병합 순서와 충돌 정리는 사용자와 팀원이 정한다

## Do Not Assume

- `wm size`로 흉내 낸 폭은 같은 폭의 Android 화면이다. iOS 글꼴·안전 영역·회전은 확인하지 않았다
- 1023dp 이하 화면은 코드상 바뀌지 않는다. 휴대폰 100% dump 좌표 비교에서 차이는 1px 반올림뿐이었다
- 마이페이지는 `wide`가 아니다. 본문 640 그대로, 저장 이미지 칸만 3개다
- `ResultView`는 늘 `useBodyMaxWidth(true)`를 쓴다. 이 컴포넌트를 담는 화면은 결과를 보여 줄 때 `Screen`·`ScreenHeader`에 `wide`를 함께 줘야 헤더와 본문 끝이 맞는다(홈·미리보기는 `phase === 'ready'`일 때만 켠다)

## Next Action

PR #42 리뷰 대응(리뷰어 요청·병합은 사용자). #38이 병합되면 위 Branch대로 main을 merge해 #42를 정리한다. 팀원 브랜치(Unresolved 7)와의 병합 순서는 팀이 정한다. 보드 11은 사용자가 Figma에 넣는다(X=0, Y=15360).

## Last Verified Commit

`f6abb71` (2026-10-02) — TASK 번호 변경 커밋. 앱 코드는 주석의 TASK 번호만 바뀌었고 `lint`·`typecheck` 종료 0. 가장 큰 크기 Android 확인(위 Verification "가장 큰 크기")은 이 커밋 위에서 했다. 그 뒤 커밋은 문서·보드만 바꾼다.

이전 값: `05b80b8` (2026-10-01) — 리뷰 반영 코드 커밋. 자동 검증 5개와 위 "리뷰 반영 뒤" Android 확인을 이 커밋과 같은 작업 트리에서 했다(커밋 전 실행, 커밋은 그 변경을 그대로 담음). 그 뒤 커밋은 문서·캡처만 더한다.

이전 값: `e584777` (2026-10-01) — 첫 구현 커밋. 자동 검증 5개와 전체 흐름 Android 확인.
