# TASK-021 — 상태 조회 실패 뒤 재시도가 새 작업을 만드는 문제

## Status
리뷰 대기

## Owner
role:feature — 오해서(TASK-012 세션). 앱 코드 작성자인 프론트 담당 리뷰 필요

## Branch
fix/TASK-021-status-poll-retry

## Goal
분석 진행 중 작업 상태 조회가 네트워크 오류가 아닌 이유(5xx 등)로 실패하면, "다시 분석하기"가 같은 작업을 다시 조회하지 않고 **새 분석 작업**을 만든다. 원래 작업은 서버에서 계속 돌 수 있어서 수집·OpenAI 비용이 두 번 든다. 이 버튼이 같은 작업을 다시 조회하게 한다.
관련 이슈: #34
관련 요구사항: `docs/product/requirements/SCREEN_STATES.md` 공통 불변식 11·13, §5 SC-003

## Completed
- 상태 조회 실패를 작업 실패(`retryable`)와 분리한 실패 종류 `statusUnavailable` 추가
- 이 실패의 버튼 "진행 상태 다시 확인"은 같은 `jobId` 로 조회를 다시 시작한다. 새 작업을 만들지 않는다
- 제목·실패 행 문구를 "진행 상태를 확인하지 못했어요"로, 멈춘 단계 표시를 "여기까지 확인했어요"로 바꿨다. 분석이 실패했다고 단정하지 않는다(불변식 11 "원인을 단정하지 않는 일반 오류 문구")
- 코드가 있는 4xx 조회 오류(예: `ANALYSIS_NOT_FOUND`)는 다시 조회해도 같은 답이 오므로 재조회하지 않고 원인을 알린 뒤 "입력 화면으로" 보낸다(`fatal`). `ANALYSIS_NOT_FOUND` 는 앱 문구, 그 밖의 코드는 서버 `error.message`(불변식 11). 재조회(`statusUnavailable`)는 코드 없는 오류·5xx·예상 못한 예외에만 쓴다
- `statusUnavailable` 에 보조 버튼 "입력 화면으로"를 둔다. 조회가 계속 실패해도 화면에 갇히지 않는다(첫 분석 사용자는 하단 내비게이션이 없다). 입력값은 보존되고, 다시 요청하면 새 키로 새 작업이 된다(사용자가 직접 고른 행동)
- fixture 서버에 가상 서버 상황 "상태 조회 실패" 추가: 수집 단계에 들어간 뒤 상태 조회가 한 번 봉투 없는 500 을 돌려주고, 다시 조회하면 같은 작업으로 끝난다

## Changed
- `frontend/mobile/src/features/analysis/jobOutcome.ts` — `statusUnavailable` 실패 종류와 문구
- `frontend/mobile/src/features/analysis/AnalyzeScreen.tsx` — 상태 조회 오류 처리(코드 유무·5xx 로 분기), 버튼 동작·문구, 보조 버튼, 제목·행 문구, 상태 목록 주석
- `frontend/mobile/src/api/fixtures/server.ts` — `statusUnavailable` 가상 상황

## Decisions
- SC-003 표에는 "상태 조회가 5xx 로 실패" 상태가 따로 없다. 공통 불변식 11(봉투 없는 오류는 일반 문구와 재시도 행동)과 §7 5번(저장 조회가 5xx 로 실패하면 재조회 행동)을 따랐다. 작업은 이미 만들어졌으므로 이 경우의 재시도는 "같은 작업 재조회"다.
- 상태 조회의 `ANALYSIS_NOT_FOUND` 는 명세 §2.1 이 `RESULT-ERROR`(재조회)로 정했지만, 진행 화면에서 사라진 작업을 재조회하면 끝나지 않는 반복이 된다. 입력 화면 복귀로 처리했고 이 판단도 SPEC 요청에 포함한다.
- 네트워크 오류(`NetworkError`)의 기존 동작(오프라인 표시 후 자동으로 계속 조회)과 서버가 알려 준 작업 실패(`retryable`→새 키로 새 작업, 불변식 13)는 바꾸지 않았다.

## Verification
2026-09-28, `C:\PULSE_SCC-mobile` 워크트리. 1차(`a8788d3`)와 독립 Reviewer FAIL 반영(`19c32c9`) 뒤 lint·typecheck·export:android·Visual QA 를 다시 실행했다. design token 검증은 1차에서만 실행했다(토큰·스크립트 변경 없음)(브랜치 `fix/TASK-021-status-poll-retry`). 이 PC 의 Node 는 22.14.0 이다(AGENTS.md 기록은 24.19.0).

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | `npm --prefix frontend/mobile run lint` | PASS — 출력 없음 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS — 출력 없음 |
| design token | `npm --prefix frontend/mobile run verify:tokens` | 실행 실패 — Node 22.14 가 `.ts` 를 읽지 못함(`ERR_UNKNOWN_FILE_EXTENSION`). **변경 전 코드에서도 같은 오류.** 대신 `node --experimental-strip-types ... scripts/verify-design-tokens.mjs` 로 실행해 `Design token verification: PASS` |
| test | — | 없음 — 프론트엔드 단위 테스트 미도입(AGENTS.md 2장) |
| build | `npm --prefix frontend/mobile run export:android -- --output-dir <스크래치>` | PASS — Exported |
| Visual QA | Expo 웹(fixture 모드) + 앱 내 브라우저 | **부분** — 아래 |

**Visual QA (부분)**
- 확인한 것(페이지 텍스트·동작, fixture "상태 조회 실패")
  - 상태 조회 500 뒤 제목 "진행 상태를 확인하지 못했어요", 멈춘 단계 "분석 준비 중 / 여기까지 확인했어요", 실패 행 문구, 버튼 "진행 상태 다시 확인"이 나온다
  - 버튼을 누르면 1초 안에 첫 저장 화면(`/first-save`, 테스트 매장·리뷰 67건·유형 3개)으로 넘어갔다. 새 작업이었다면 fixture 에서 준비 1.5초 + 수집 4초가 다시 필요하다 → 원래 작업을 재조회한 것
  - `19c32c9` 뒤: 같은 상황에서 "진행 상태 다시 확인"과 보조 버튼 "입력 화면으로"가 함께 나온다. 보조 버튼을 누르면 입력 화면으로 돌아가고 가게 이름·업종·URL 이 보존된다(입력 요소 값 확인)
  - 코드가 있는 4xx 조회 오류(`ANALYSIS_NOT_FOUND`) 경로: 화면으로 재현하지 않았다(fixture 에 상황 없음). 코드 판독으로만 확인
  - 회귀: fixture "재시도 가능 실패"는 그대로 "분석을 마치지 못했어요" + "다시 분석하기"
  - 콘솔 오류 0
- 확인하지 못한 것
  - 레이아웃·반응형(데스크톱·모바일 폭)·overflow·포커스 링: **스크린샷 미확보.** 세션 창이 가려져 앱 내 브라우저가 화면을 그리지 않았다
  - Android 실기기·에뮬레이터: 미실행
  - 실제 백엔드에서 상태 조회 5xx 재현: 미실행
- 기존 문제(이번 변경과 무관): 웹 접근성 트리에서 공용 `Button` 에 이름이 없다(2026-09-28 PR #35 댓글로 전달한 문제)

## Unresolved
- SC-003 에 이 상태(상태 조회 실패, 보조 행동 "입력 화면으로", 진행 화면의 `ANALYSIS_NOT_FOUND` 처리)를 정식으로 추가할지는 `role:product` 결정이다(PR 본문에 요청). §10 Slice fixture 목록에도 "상태 조회 실패"가 없다.
- 기존 문제: 네트워크 오류로 오프라인 표시가 뜬 뒤 곧바로 5xx 가 오면, 실패 화면에 오프라인 안내 "같은 요청으로 다시 보내요"가 남는다(Reviewer 발견, 이번 범위 밖).
- 이 앱 코드(`frontend/mobile/src/**`)의 소유 역할은 AGENTS.md 5장에 명시돼 있지 않다.

## Do Not Assume
- fixture 상황으로만 확인했다. 실제 서버의 5xx 응답 형태는 확인하지 않았다.
- 화면 캡처가 없다. 문구와 동작은 확인했지만 시각적 배치는 확인하지 않았다.

## Next Action
- 프론트 담당 리뷰. 가능하면 Android 에서 fixture "상태 조회 실패"로 화면을 캡처한다.

## Last Verified Commit
`19c32c9` — 위 Verification(2차)은 이 커밋의 코드와 같은 작업 트리에서 실행했다. 1차는 `a8788d3`.
