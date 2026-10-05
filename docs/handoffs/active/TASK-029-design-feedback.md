# TASK-029 — 팀 디자인 피드백 반영

## Status

진행 중. 결정 4건의 문서 반영, 이미지 프롬프트 변경, `origin/main` 병합, 화면 구현까지 끝났다. Android 렌더링 검증(Visual QA)은 하지 못했다.

## Owner

오해서 (`role` 배정은 미정 — `AGENTS.md` 5장)

## Branch

`ui/TASK-029-design-feedback` — `feat/TASK-027-analysis-resume`(`92ef51b`)에서 갈라졌고, `origin/main`(`4fc1630`, PR #36·#38·#39·#42 병합 뒤)을 병합했다(`c08ba27`). `main` 대상 PR에는 TASK-024·027 커밋이 함께 들어간다.

## Goal

2026-10-05에 받은 팀원 디자인 피드백 18건을 반영한다. 이 중 기존 결정을 뒤집는 4건은 사용자가 같은 날 정했다.

관련 요구사항: PRD FR-004, FR-006, FR-010, FR-012. 관련 이슈는 아직 없다.

1. 결과 화면의 각 관점은 `AI 해석 → 리뷰에서 확인한 사실 → 대표 근거 리뷰` 순서로 읽는다.
2. 하단 내비게이션 첫 탭의 표시 이름을 `홈`에서 `분석 결과`로 바꾼다.
3. 페르소나 이미지를 사진풍 상반신 인물과 단색 배경으로 만든다.
4. 가게 정보 입력은 세 칸을 한 화면에 모두 펼치고 스크롤로 이어 입력한다.

## Completed

- 결정 4건을 `docs/product/PRD.md`, `docs/product/requirements/*`, `docs/design/DESIGN_SYSTEM.md`에 반영했다.
- 2026-09-22 합성 기록(`docs/design/synthesis/TASK-020/README.md`)에는 본문을 고치지 않고 정정 주석을 달았다.
- 이미지 프롬프트(`openai_analyzer.py`)를 사진풍 상반신 인물·단색 배경으로 바꿨다.
- `origin/main`을 병합하며 충돌 9건을 풀었다. 이미지는 인증 요청으로 받는 TASK-024 방식과 다시 불러오기(#38)를 함께 쓴다.
- 분석 결과 화면: 관점마다 AI 해석 → 리뷰에서 확인 → 실제 리뷰 순서, 관점별 색과 아이콘, 비율 막대, 순위별 단상 농도, 순위 바로가기, AI 안내 한 번, 제안은 행동 먼저.
- 분석하기 화면: 세 칸을 한 화면에 펼침, 저장된 가게 정보 미리 채우기, 주소 복사 안내, 기다리는 동안 안내, 진행 막대 모션.
- 마이페이지 저장 이미지를 정사각 3칸 격자와 크게 보기로 바꿨다. 첫 탭 이름을 `분석 결과`로 바꿨다.

## Changed

- `docs/product/PRD.md` — FR-006 인수 기준, FR-012 탭 이름, 페르소나 취급 규칙 6, §13-9
- `docs/product/requirements/{RESULT_IA,USER_FLOW,GUEST_ANALYSIS_FUNCTIONAL_SPEC,SCREEN_STATES}.md`
- `docs/design/DESIGN_SYSTEM.md` — §2.1, §2.2, §3.6, §4.1, §4.2, §4.4, §5.3, §6, §13
- `docs/design/synthesis/TASK-020/README.md` — 정정 주석 1건
- `backend/python-analysis/src/scc_analysis/analysis/openai_analyzer.py` — 프롬프트 문자열만
- `frontend/mobile/src/design/tokens/foundation.ts`, `frontend/mobile/scripts/verify-design-tokens.mjs` — 관점 색, 순위 농도, 대비 검사
- `frontend/mobile/src/components/icons/PerspectiveIcons.tsx` — 신규
- `frontend/mobile/src/components/ui/{BottomNavigation,PersonaAvatar,PodiumTop3,ProgressList,Screen}.tsx`
- `frontend/mobile/src/features/result/{ResultView,HomeScreen,EvidenceScreen}.tsx`
- `frontend/mobile/src/features/analysis/AnalyzeScreen.tsx`, `WaitingTips.tsx`(신규)
- `frontend/mobile/src/features/mypage/MyPageScreen.tsx`
- 병합으로 사라진 것: `components/ui/PersonaImageBlock.tsx`(#38), `api/fixtures/server.ts`(TASK-024)

소유 영역 밖 수정이다: `docs/product/**`(`role:product`), `docs/design/**`(`role:design-system`), `backend/python-analysis/**`(`role:feature`), 디자인 토큰과 `components/ui/**`(`role:design-system`).

## Decisions

- 문서 안의 `홈`은 SC-011 화면의 내부 이름으로 남겼다. 탭 이름을 명시한 문자열만 `분석 결과`로 바꾸고, 규칙은 PRD FR-012 비고에 한 번 적었다. 코드 경로 `/home`과 상태 ID `HOME-*`는 바꾸지 않는다.
- 제안 카드는 `리뷰 사실 + 검토할 행동` 기본 노출(FR-005 인수 기준)을 그대로 둔다. 해석 먼저는 4개 관점에만 적용한다.
- 화면에서 읽는 순서만 바꿨다. 분석을 만드는 순서(리뷰가 출발점, PRD 설계 원칙 A)는 그대로다.

## Verification

| 항목 | 명령 | 결과 |
|---|---|---|
| Python lint | `python.exe -m ruff check --no-cache backend/python-analysis` | PASS — `All checks passed!` |
| Python format | `python.exe -m ruff format --check --no-cache backend/python-analysis` | PASS — `21 files already formatted` |
| Python test | `python.exe -m pytest backend/python-analysis -p no:cacheprovider -o addopts=""` | PASS — `166 passed`. 프롬프트 문자열을 검증하는 테스트는 없다 |
| 추가한 상대 링크 | `git diff`에서 뽑아 대조 | 3개 모두 실제 파일 |
| 실제 이미지 생성 | — | 미실행. 바뀐 프롬프트로 OpenAI를 호출해 보지 않았다 |
| 토큰 검증 | `npm --prefix frontend/mobile run verify:tokens` | PASS — 관점·순위 조합 15개 포함 |
| lint | `npm --prefix frontend/mobile run lint` | PASS — 출력 없음 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS — 출력 없음 |
| Android bundle | `npm --prefix frontend/mobile run export:android` | PASS — `Exported: dist` |
| Visual QA | — | 미실행. 백엔드와 에뮬레이터가 떠 있지 않았고, 결과 화면을 보려면 실제 분석 결과가 있는 계정이 필요하다 |

## Unresolved

- **Android에서 화면을 한 번도 보지 않았다.** 배치·줄바꿈·글자 200%·TalkBack·순위 바로가기의 스크롤 위치는 모두 미확인이다.
- 이미지 참고 자료를 받지 못했다. 배경색·구도 세부 규칙은 확정 필요다(PRD §13-9).
- 이미지 생성 품질이 `low`다. 사진풍에서 충분한지 미확인이고 비용 한도는 PRD §13-10 미결이다.
- 관점마다 해석 한 문장·사실 한 줄·대표 리뷰 한 건만 기본으로 보이고 나머지는 `더 보기`에 있다. PRD FR-002의 "대표 근거 1~2개 기본 노출"은 1건으로 충족한다.
- 추론 안내 문장을 해석마다 되풀이하지 않고 관점 묶음 위에 한 번 둔다. 팀 확인이 필요하다.
- 폰트 굵기는 토큰을 바꾸지 않고 결과 화면의 핵심 문장에만 SemiBold를 썼다. 핵심 구절만 굵게 하는 것은 데이터에 구절 표시가 없어 하지 못했다.
- `StepIndicator` 컴포넌트는 이제 쓰는 곳이 없다. 지우지 않았다.
- `SCREEN_STATES.md`의 `STORE-*` 상태 서술과 `docs/architecture/FRONTEND_STRUCTURE.md`는 이번 화면 변경에 맞춰 고치지 않았다.
- 결과 순서의 기존 불일치(`RESULT_IA.md` D7 등 "분석 메타정보 먼저" 문장)는 이 TASK 전부터 있던 것이라 고치지 않았다.
- 연결할 이슈를 만들지 않았다.

## Do Not Assume

- 화면이 의도대로 보인다고 가정하지 않는다. lint·typecheck·번들만 통과했다.
- 관점 카드의 "이 손님 리뷰 N건 중 M건"은 관점에 연결된 리뷰가 그 유형 리뷰의 일부라는 가정이다. API 계약에 그 관계가 적혀 있지 않다.
- 진행 막대의 빛 모션과 안내 자동 넘김은 `DESIGN_SYSTEM.md` §9의 "반복 장식 모션을 피한다"에 대한 예외로 넣었다. 디자인 시스템 담당의 확인을 받지 않았다.
- 사진풍 이미지가 실제로 어떻게 나오는지 아무도 보지 않았다.
- `DATA_MODEL.md`의 화풍 규칙 버전 컬럼 값을 갱신해야 하는지 확인하지 않았다.

## Next Action

1. 백엔드와 에뮬레이터를 띄워 Visual QA를 한다(`.claude/skills/visual-qa/SKILL.md`).
2. 사진풍 이미지를 실제로 생성해 보고 배경색·구도 규칙을 정한다.
3. 이슈를 만들고 PR을 올린다.

## Last Verified Commit

화면 구현을 담은 커밋. 해시는 `git log -1 -- frontend/mobile/src/features/result/ResultView.tsx`로 확인한다.
