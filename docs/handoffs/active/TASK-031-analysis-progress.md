# TASK-031 — 분석 진행 화면 디자인 개선

## Status

진행중. 분석 중에 퍼센트 게이지 팝업을 띄우도록 바꾸고 에뮬레이터에서 실제 분석으로 확인했다(휴대폰 크기, 글자 100%). 독립 검토를 거쳤다(1차 FAIL → 수정). 정식 Visual QA는 하지 않았다.

## Owner

role:design-system — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`ui/TASK-031-analysis-progress` — `chore/TASK-030-android-apk-build`의 `3d1919b` 위에서 갈라졌다. 그 아래의 TASK-029([SKUnohtaekyung/PULSE_SCC#43](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/43))와 TASK-030([SKUnohtaekyung/PULSE_SCC#44](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/44))은 2026-10-09에 `main`으로 병합됐다. 서버 쪽 변경(TASK-032)은 이 브랜치 위의 `feat/TASK-032-analysis-progress-steps`에 있고, 인계 문서도 그 브랜치에 있다.

## Goal

분석을 기다리는 화면이 예쁘지 않고 아래가 비어 있으며 지루하다는 사용자 요청(2026-10-09)을 푼다.

관련 이슈: 미생성(사용자의 구두 요청으로 시작했고 이슈를 만들지 않았다)
관련 요구사항: PRD의 진행 표시 요구("수집·분석이 1초를 넘으면 진행 상태를 표시한다", 공통 인수 기준 "진행 상태가 화면에 표시된다"), SCREEN_STATES §5

## Completed

- 분석이 진행되는 동안 화면을 덮는 팝업을 띄운다. 큰 원형 퍼센트 게이지와 그 밑의 작은 현재 단계 문구로 이뤄진다.
- 기다리는 동안 안내 제목에 백틱이 글자 그대로 보이던 것을 고쳤다.

## Changed

- `frontend/mobile/src/features/analysis/AnalysisProgressDialog.tsx` — 신규. 진행 팝업
- `frontend/mobile/src/features/analysis/AnalyzeScreen.tsx` — 팝업을 넣음
- `frontend/mobile/src/features/analysis/WaitingTips.tsx` — 제목의 백틱을 작은따옴표로

## Decisions

- **화면을 덮는 팝업으로 한다**(2026-10-09 사용자 결정). 화면 맨 위에 큰 게이지를 두는 안을 권했으나 사용자가 팝업을 골랐다. 닫는 버튼이 없고 뒤로가기로도 닫히지 않는다. 분석이 끝나거나 실패해 화면 단계가 바뀌면 사라진다. 분석은 끝났는데 저장 상태를 확인하지 못한 경우(`completionIssue`)에도 내린다 — 다시 확인하는 버튼이 뒤 화면에 있어, 팝업을 그대로 두면 빠져나올 수 없다(reviewer 지적).
- **같은 날 먼저 만든 움직이는 손님 그림과 분석 순서 안내 카드는 뺐다**(사용자 결정). 팝업이 뒤 화면을 가리므로 둘 다 보이지 않는다. DESIGN_SYSTEM §9에 넣었던 되풀이 모션 예외도 되돌렸다. 두 조각의 코드는 저장소에 남기지 않았다.
- **팝업 뒤 화면은 그대로 뒀다.** 실패하면 팝업이 사라지고 기존 진행 목록의 실패 행이 보여야 한다(SCREEN_STATES §5.1).
- 게이지는 서버가 확인해 준 단계에서만 움직인다. 퍼센트 값은 기존 `progressPercent`를 그대로 쓴다.
- 새 토큰을 만들지 않았다. 배경 가림 색과 틀은 `ConfirmDialog`와 같은 토큰을 쓴다. 공용 컴포넌트로 올리지 않고 분석 기능 안에 뒀다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | `npm run lint` (`frontend/mobile`) | PASS — 출력 없음 |
| typecheck | `npm run typecheck` | PASS — 출력 없음 |
| 토큰 검증 | `npm run verify:tokens` | PASS — `Design token verification: PASS` |
| test | 없음 | 프론트엔드 단위 테스트는 프로젝트에 없다 |
| build | `gradlew.bat :app:createBundleReleaseJsAndAssets --rerun assembleRelease` | PASS — `BUILD SUCCESSFUL in 1m 10s` |
| 설치 | `adb install -r app-release.apk` (`Medium_Phone`) | PASS — `Success` |
| 화면 확인 | `Medium_Phone`(1080x2400, 글자 100%)에서 실제 분석 1회, 단계가 바뀔 때마다 `adb exec-out screencap` | 부분 확인 — 팝업이 뜨고 36% → 68% → 90%로 게이지와 단계 문구가 바뀐 뒤 결과 미리보기로 넘어감. 겹침·잘림 없음. 캡처는 저장소에 남기지 않았다 |
| Visual QA | 미실행 | visual-qa 스킬 절차로 하지 않았다. 태블릿 폭, 모션 감소 설정, 글자 크기 확대, TalkBack, 연결 끊김 문구, 실패로 팝업이 닫히는 순간, 뒤로가기를 보지 않았다 |
| 독립 검토 | `reviewer` 서브에이전트 2회 | 1차 FAIL — 저장 상태 확인 실패 때 팝업이 닫히지 않아 재시도 버튼을 누를 수 없음, 인계 문서의 낡은 서술 → 수정 뒤 2차 PASS. 2차는 코드 판독과 lint·typecheck 근거다 |

## Unresolved

- **팝업이 기존 기다리는 동안 안내 카드를 가린다.** 그 카드는 2026-10-05 팀 디자인 피드백 #1·#13(기다리는 동안 지루하다)으로 넣은 것이다. 팝업 뒤에서 계속 넘어가지만 읽을 수 없다. 팝업 안으로 옮길지, 뺄지 정하지 않았다.
- **연결이 오래 끊기거나 서버 작업이 멈추면 팝업에서 나갈 방법이 없다.** 연결이 끊기면 문구만 바뀌고 앱은 계속 다시 확인한다. 앱을 껐다 켜도 진행 중이던 분석을 이어받아 팝업이 다시 뜨므로, 연결이 돌아오거나 작업이 끝나기 전에는 입력 화면이나 홈으로 갈 수 없다. 일정 횟수 실패하면 팝업을 내릴지는 정하지 않았다(SCREEN_STATES §5.1도 이 경우의 정책을 미정으로 둔다).
- **SCREEN_STATES §5의 "근거 없는 퍼센트 대신 `progressStep`과 사용자용 문장을 표시한다"와 위계가 어긋난다.** 팝업은 퍼센트를 가장 크게, 단계 문구를 작게 둔다. 퍼센트는 서버가 확인한 단계의 위치이고 전부터 진행 목록에 있었으나, `role:product`에 `[SPEC]` 이슈로 넘겨야 한다.
- 게이지 애니메이션 길이 520ms는 모션 토큰에 없는 값이다(`ProgressList`의 기존 값과 같다). 팝업의 배경·틀 스타일은 `ConfirmDialog`와 겹친다. 공용 모달 틀로 뽑을지는 `role:design-system` 판단이 필요하다.
- 저장 상태 확인 실패 때 보이는 `저장 결과 다시 확인` 버튼에 진행 표시와 중복 누름 방지가 없다. 전부터 있던 동작이다.
- 팝업 뒤에서 안내 카드의 타이머와 진행 목록의 애니메이션이 보이지 않는 채 계속 돈다.
- **분석 중에는 다른 탭으로 갈 수 없다.** 전에는 하단 탭으로 나갔다 돌아올 수 있었다. 앱을 껐다 켜면 진행 중인 분석을 이어서 보여 주는 동작(TASK-027)은 그대로다.
- `docs/product/requirements/SCREEN_STATES.md` §5는 진행 화면을 "받은 단계를 쌓는 목록"이라고 적는다. 팝업을 반영하지 않았다(`role:product` 소유). `docs/design/DESIGN_SYSTEM.md`에도 이 팝업 규칙을 적지 않았다.
- 작업 폴더에 TASK-030에서 넘어온 V4·V6 마이그레이션 임시 파일이 있다. 커밋하면 안 된다([TASK-030](TASK-030-android-apk-build.md) Unresolved).

## Do Not Assume

- lint와 typecheck가 통과했다고 화면이 의도대로 보인다고 가정하지 않는다.
- `EXPO_PUBLIC_*` 값이나 소스를 바꾼 뒤에는 번들을 강제로 다시 만들어야 APK에 들어간다([TASK-030](TASK-030-android-apk-build.md) Do Not Assume).

## Next Action

- 태블릿에서 팝업을 확인한다. 위 Unresolved의 탈출 조건과 안내 카드 처리를 사용자와 정한다.

## Last Verified Commit

`3068257`. 화면 확인에 쓴 APK는 그 커밋의 화면 소스와 TASK-032의 서버 변경을 함께 둔 작업 폴더에서 빌드했다. 그 뒤의 커밋(reviewer 지적 반영: 저장 확인 실패 때 팝업 내림, 단계 문구 줄어듦 허용)은 lint·typecheck만 실행했고 기기에서 보지 않았다.
