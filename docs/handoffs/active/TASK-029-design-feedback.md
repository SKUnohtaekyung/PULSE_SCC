# TASK-029 — 팀 디자인 피드백 반영

## Status

진행 중. 결정 4건의 문서 반영과 이미지 프롬프트 변경까지 끝났다. 화면 구현은 시작하지 않았다.

## Owner

오해서 (`role` 배정은 미정 — `AGENTS.md` 5장)

## Branch

`ui/TASK-029-design-feedback` — `feat/TASK-027-analysis-resume`(`92ef51b`)에서 갈라졌다. `main`에서 갈라진 것이 아니다.

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

## Changed

- `docs/product/PRD.md` — FR-006 인수 기준, FR-012 탭 이름, 페르소나 취급 규칙 6, §13-9
- `docs/product/requirements/{RESULT_IA,USER_FLOW,GUEST_ANALYSIS_FUNCTIONAL_SPEC,SCREEN_STATES}.md`
- `docs/design/DESIGN_SYSTEM.md` — §2.1, §2.2, §3.6, §4.1, §4.2, §4.4, §5.3, §6, §13
- `docs/design/synthesis/TASK-020/README.md` — 정정 주석 1건
- `backend/python-analysis/src/scc_analysis/analysis/openai_analyzer.py` — 프롬프트 문자열만

소유 영역 밖 수정이다: `docs/product/**`(`role:product`), `docs/design/**`(`role:design-system`), `backend/python-analysis/**`(`role:feature`).

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
| 프론트엔드 검증 | — | 미실행. 화면 코드를 바꾸지 않았다 |

## Unresolved

- 화면 구현 전부. 지금 화면 코드는 옛 기준(차례로 펼치기, 탭 이름 `홈`, 사실 먼저)이다.
- 이 브랜치는 `origin/main`(`4fc1630`, PR #38·#39·#42 병합 뒤)과 6개 파일에서 충돌한다: `api/fixtures/server.ts`, `PersonaAvatar.tsx`, `PersonaImageBlock.tsx`, `AnalyzeScreen.tsx`, `PreviewResultScreen.tsx`, `ResultView.tsx`. TASK-024·027 줄기에서 온 충돌이라 화면 작업 전에 먼저 풀어야 한다.
- 이미지 참고 자료를 받지 못했다. 배경색·구도 세부 규칙은 확정 필요다(PRD §13-9).
- 이미지 생성 품질이 `low`다. 사진풍에서 충분한지 미확인이고 비용 한도는 PRD §13-10 미결이다.
- AI 해석의 강조 방식(상자 대신 글자 위계)은 확정 필요다(`DESIGN_SYSTEM.md` §4.2).
- `DESIGN_SYSTEM.md` §2.2·§3.3의 "입력 단계 표시"는 한 화면 입력에서 가리킬 대상이 없어진다. 단계 표시를 없앨지는 화면 구현 때 정한다.
- 결과 순서의 기존 불일치(`RESULT_IA.md` D7 등 "분석 메타정보 먼저" 문장)는 이 TASK 전부터 있던 것이라 고치지 않았다.
- 연결할 이슈를 만들지 않았다.

## Do Not Assume

- 문서가 바뀌었다고 화면이 바뀐 것이 아니다.
- 사진풍 이미지가 실제로 어떻게 나오는지 아무도 보지 않았다.
- `DATA_MODEL.md`의 화풍 규칙 버전 컬럼 값을 갱신해야 하는지 확인하지 않았다.

## Next Action

1. TASK-024·027 줄기와 `main`의 충돌을 푼다.
2. 그 위에서 분석하기 화면, 분석 결과 화면, 마이페이지 순서로 구현한다.

## Last Verified Commit

이 문서를 담은 커밋(문서 반영과 프롬프트 변경을 함께 담는다).
