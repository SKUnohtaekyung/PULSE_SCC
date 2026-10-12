# TASK-033 — 마이페이지 태블릿 가로 배치와 로그아웃 문구

## Status

리뷰 대기. 구현하고 에뮬레이터에서 태블릿 크기를 흉내 내 확인했다. 독립 검토 지적(문서 동기화)을 반영했다. 실제 태블릿에서는 보지 않았다.

## Owner

role:design-system — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`ui/TASK-033-mypage-tablet` — `main`의 `6ad8b14`(PR #47 병합)에서 갈라졌다.

## Goal

2026-10-12 태블릿 크기 확인에서 나온 두 가지를 고친다(사용자 선택).

1. 태블릿 가로(1280dp)에서 마이페이지가 640 폭 한 줄로 나오고, 옆으로 넘기는 이미지 카드의 두 번째 장이 잘려 보인다. 양옆은 비어 있다.
2. 로그아웃 확인 문구가 "이메일과 비밀번호로 로그인"이라고 해서 Google로 가입한 계정에 맞지 않는다.

관련 이슈: 미생성(사용자의 구두 요청으로 시작했다)
관련 요구사항: PRD FR-012(마이페이지), DESIGN_SYSTEM §7.1

## Completed

- 넓은 화면(1024dp 이상)에서 마이페이지 본문을 960으로 넓히고, 저장 이미지 카드 세 장을 넘기지 않고 한 줄에 같은 폭으로 놓는다.
- 1023dp 이하는 그대로다(옆으로 넘기는 카드 피드).
- 로그아웃 확인 문구를 "다시 이용하려면 로그인해야 해요."로 바꿨다.

## Changed

- `frontend/mobile/src/features/mypage/MyPageScreen.tsx` — `Screen`·`ScreenHeader`에 `wide`, 넓은 화면용 카드 줄, 로그아웃 문구
- `docs/design/DESIGN_SYSTEM.md` §7.1 — 마이페이지 행의 넓은 화면 규칙
- `docs/product/requirements/SCREEN_STATES.md` `STORED-IMAGES-NORMAL` — 넓은 화면에서는 한 줄이라는 구절 추가(`role:product` 소유, reviewer 지적)
- `docs/handoffs/active/TASK-028-responsive-tablet.md` — "마이페이지는 `wide`가 아니다"에 정정 주석
- `docs/design/figma/TASK-020/README.md` — 보드 11의 마이페이지 프레임이 현재 규칙과 다르다는 주석

## Decisions

- **넓은 화면의 마이페이지를 960으로 넓힌다**(2026-10-12 사용자 결정). 2026-10-09에 "본문 640 그대로"로 정했던 것을 바꾼다. TASK-028의 3칸 배치로 돌아간 셈이지만 카드는 TASK-029의 피드 카드를 그대로 쓴다.
- **카드 폭은 계산하지 않고 잰다.** 처음에는 `min(화면 폭 - 여백, 960)`으로 계산했는데, `Screen`의 최대 폭 960은 좌우 여백을 포함한 값이라 세 번째 카드가 본문 밖으로 64dp 나갔다(캡처로 확인). 이미지 구역의 실제 폭을 `onLayout`으로 재서 셋으로 나눈다. 좌우 안전 영역이 있는 기기에서도 맞는다.
- 손님 유형이 1~2개면 카드는 같은 폭(1/3)으로 왼쪽부터 놓이고 오른쪽이 빈다.
- 로그아웃 문구는 계정 종류를 가리지 않는 말로 바꿨다. 앱은 로그인 방식(이메일/Google)을 알지 못한다(`ApiUser`에 없다).
- 새 토큰과 공용 컴포넌트를 만들지 않았다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | `npm run lint` (`frontend/mobile`) | PASS — 종료 코드 0 |
| typecheck | `npm run typecheck` | PASS — 종료 코드 0 |
| 토큰 검증 | `npm run verify:tokens` | PASS — `Design token verification: PASS` |
| test | 없음 | 프론트엔드 단위 테스트는 프로젝트에 없다 |
| build | `gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease` | PASS — `BUILD SUCCESSFUL` |
| 화면 확인 | `Medium_Phone` 에뮬레이터에 release APK, `wm size`·`wm density 320`으로 폭 흉내, 글자 100%. 시험용 계정으로 분석 1회를 돌려 저장 이미지 3장을 만든 뒤 캡처하고 `uiautomator` 좌표를 읽음 | 가로 1280dp: 카드 3장이 본문 폭(384~2176px)에 정확히 들어감(셋째 카드 버튼 오른쪽 끝 2142px + 카드 안쪽 여백). 가로 1024dp: 같음(128~1920px). 가로 1023dp·세로 800dp: 전과 같은 넘기는 피드, 본문 640. 휴대폰 411dp: 전과 같음. 모든 크기에서 가로 넘침 없음 |
| 로그아웃 문구 | 휴대폰 크기에서 로그아웃을 눌러 대화상자 글자를 읽음 | PASS — "다시 이용하려면 로그인해야 해요." 취소로 닫음 |
| 글자 200% | 가로 1280dp에서 `settings put system font_scale 2.0` 뒤 캡처와 좌표 | PASS — 카드 안의 `N위 손님`과 `리뷰 N건`이 겹치지 않음(첫 카드 418~620px, 740~931px), 가로 넘침 없음. 확인 뒤 1.0으로 되돌림 |
| Visual QA | 미실행 | visual-qa 스킬 절차 전체로 하지 않았다. TalkBack, 손님 유형이 1~2개인 결과, 이미지 불러오기 실패 상태, 가로에서 이미지를 크게 보는 창, 1376·1480dp, 좌우 안전 영역이 있는 기기는 보지 않았다 |
| 독립 검토 | `reviewer` 서브에이전트 2회 | 1차 FAIL — 코드 지적 없음, 이번 변경으로 틀려진 문서 서술 3곳과 이 문서의 `Last Verified Commit` → 반영 뒤 2차 PASS. 기기 렌더링은 reviewer가 재현하지 않았다 |

## Unresolved

- 실제 태블릿에서 보지 않았다. `wm size`로 흉내 낸 폭이다.
- 손님 유형이 1~2개인 결과에서 넓은 화면 배치를 보지 않았다(코드상 왼쪽부터 놓이고 오른쪽이 빈다).
- 화면이 1024dp 경계를 넘어 돌거나 크기가 바뀌면 이미지 카드가 새로 그려진다. 등장 움직임이 다시 돌고 카드의 "사진 앱에 저장했어요" 표시와 이미지 재시도 횟수가 처음으로 돌아간다. 크게 보기 창은 유지된다(reviewer 판독, 실행해 보지 않음).
- `components/ui/Screen.tsx`의 주석 "열을 늘리는 결과 화면이 쓴다"는 이제 마이페이지도 포함한다. 고치지 않았다.
- 넓은 화면에서 알림·설정·서비스 정보 카드가 960 폭으로 늘어나 내용에 비해 넓어 보인다. 2열로 나눌지는 정하지 않았다.
- `wm size`를 여러 번 바꾼 뒤 에뮬레이터 화면이 검게 나오는 일이 있었다. 에뮬레이터를 새로 켜니 정상이었다. 앱 문제인지 에뮬레이터 문제인지 가리지 않았다(화면 구조와 좌표는 정상으로 읽혔다).
- 확인에 쓴 시험용 계정(`tablet-qa-1012@example.com`)이 이 PC의 로컬 DB에 남아 있다.

## Do Not Assume

- `Screen`의 `bodyMaxWidth`는 좌우 여백을 포함한다. 본문 안쪽 폭을 쓰려면 여백을 빼거나 재야 한다.
- `wm size`를 바꾸면 앱이 첫 화면으로 돌아간다. 크기를 바꾼 뒤에는 확인할 화면으로 다시 들어가야 한다.

## Next Action

- PR을 만들어 병합한다. 실제 태블릿에서 마이페이지를 확인한다.

## Last Verified Commit

이 문서를 담은 커밋(base `6ad8b14`). 화면 확인에 쓴 APK는 커밋 전 작업 폴더에서 빌드했고, `MyPageScreen.tsx`는 그 뒤 주석 한 줄만 바뀌었다.
