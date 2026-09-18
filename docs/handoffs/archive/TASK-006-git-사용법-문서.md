# TASK-006 — Git·GitHub 사용법 HTML 문서와 문서 동기화 훅

## Status
완료 — PR #18이 `main`에 squash 병합됨 (`284de80`). 이후 PR #20(`ef32b22`)이 브랜치 자동 삭제 설정 변경을 이 문서와 HTML에 반영했다.
이 문서는 인수인계 기록이며 정본이 아니다.

## Owner
role:platform

## Branch
`docs/TASK-006-git-guide-html`

## Goal
Git·GitHub 개념과 이 저장소의 실제 설정을 한 화면에서 대조할 수 있는 단일 HTML 문서를 만들고, 규칙 문서가 바뀌면 이 문서도 확인하라고 알리는 훅을 건다.

관련 이슈: #17
관련 요구사항: 해당 없음 — 제품 기능이 아니다

## Completed
- `git-관련-사용법.html` 신설. 12개 장, SVG 다이어그램 3개, JS 인터랙티브 위젯 2개. 외부 의존 없음
- `.claude/hooks/sync-git-guide.sh` 신설. `PostToolUse(Write|Edit)` 훅
- `.claude/settings.json` 에 훅 등록. 기존 `permissions.deny` 3건 보존
- `CLAUDE.md` "아직 만들지 않은 것" 절에서 `.claude/hooks/` 제거하고 실제 훅을 표로 기록

## Changed
- `git-관련-사용법.html` — 신규. 개념 + 이 저장소 실제 설정
- `.claude/hooks/sync-git-guide.sh` — 신규. 규칙 문서 변경 감지
- `.claude/settings.json` — 훅 등록 (추가만)
- `CLAUDE.md` — 훅 도입에 따른 실제 상태 반영
- `docs/handoffs/active/TASK-006-git-사용법-문서.md` — 이 문서

## Decisions

**1. 훅은 알리기만 하고 문서를 자동 수정하지 않는다.**
규칙 변경이 문서의 어느 문장에 영향을 주는지는 판단이 필요하다. 자동 수정은 틀린 내용을 조용히 퍼뜨릴 위험이 더 크다.

**2. 훅 스크립트는 `jq` 를 쓰지 않는다.**
`command -v jq` 결과 이 환경에 `jq` 가 없다. bash 파라미터 확장만으로 `file_path` 를 뽑고 역슬래시를 슬래시로 정규화해 Windows·POSIX 경로를 함께 처리한다.

**3. 근거 ID·수치는 전부 원본에서 조회했다.**
브랜치 보호는 `gh api .../branches/main/protection`, 라벨은 `gh label list`, 이력은 `gh pr list`·`gh issue list`, 머지 방식은 `git log --merges`(0건, 직선). 1차 리뷰에서 잔존 브랜치 목록이 `git branch -a` 의 로컬 캐시였음이 드러나 `git ls-remote --heads origin` 결과로 교체했다.

**4. 이슈 #5·#7에 대한 서술을 추론에서 관찰로 바꿨다.**
초안은 "다른 템플릿을 골라 제목만 고쳐 썼다"고 적었으나 근거가 없었다. 실제 본문에는 이슈 폼이 만드는 `###` 필드 구조가 없다는 관찰만 남겼다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| lint | — | 없음 (스택 미확정, 루트에 `package.json` 없음) |
| typecheck | — | 없음 |
| test | — | 없음 |
| build | — | 없음 |
| HTML 구조 | `html.parser` 전체 파싱 | PASS — 닫히지 않은 태그 0, 불일치 0, 중복 id 0 (id 16개), SVG marker id 3개 모두 고유 |
| 훅 동작 | stdin 주입 6종 (Windows/POSIX 경로, `.github` 하위, 무관 파일, `file_path` 없음, HTML 자신) | PASS — 매치 3건만 발화, 나머지 무출력 exit 0 |
| 훅 실제 발화 | `CLAUDE.md` 를 Edit → `PostToolUse:Edit hook additional context` 주입 확인 | PASS |
| 훅 출력 JSON | `json.load` 파싱 | PASS |
| settings.json | `json.load` + `permissions.deny` 건수 대조 | PASS — 3건 보존, 훅 스키마 유효 |
| 위젯 동작 | 브라우저에서 탭 클릭 후 DOM 값 확인 (레이아웃 측정이 아니라 DOM 값 조회) | PASS — 머지 4종·템플릿 5종 모두 전환됨 |
| 반응형 CSS | 375px에서 `getComputedStyle` 조회 | PASS — `.fig{overflow-x:auto}`, `#graph{min-width:470px}`, `pre{overflow-x:auto}`, `table{display:block}` 적용 |
| Visual QA | — | **부분 미실행** — 프리뷰 페인이 프레임을 합성하지 않아 스크린샷과 `clientWidth` 측정 불가. 실제 가로 스크롤 유무는 **미확인** |

## Unresolved

1. ~~`05-docs.yml` 이 main에 없다~~ — **해소됨.** PR #16이 2026-08-24 squash 머지됐고(`6a990ba`) 이슈 #15가 자동으로 닫혔다. 이 브랜치를 최신 main 위로 옮긴 뒤 "제안 중" 표시를 지우고 기본 탭을 `docs` 로 되돌렸다.
2. **배치 위치와 SoT 등재 미결.** 루트에 뒀으나 직전 PR #14가 루트를 정리한 직후다. `README.md` 문서 지도와 `AGENTS.md` 4장 SoT 표에 등재되지 않았다.
3. **규칙 복제 문제.** 브랜치 보호 표는 `README.md` 100–108행과, 라벨·소유 영역 표는 `AGENTS.md` 5·6장과 내용이 겹친다. `AGENTS.md` 7장·11장이 금지하는 복제다. 훅으로 완화했을 뿐 해소하지 못했다.
4. 팔레트가 CSS `.c-*` 클래스와 JS `DARK`/`TONE` 객체에 두 번 정의돼 있다. 한쪽만 고치면 조용히 어긋난다.
5. `@media (max-width:620px)` 에서 `table{display:block}` 을 쓴다. 좁은 화면에서 표가 자체 스크롤되지만, 브라우저·보조기술 조합에 따라 표의 행·열 관계가 사라질 수 있다고 알려져 있다. 스크린리더 실측을 하지 못했다. 더 안전한 형태는 각 표를 `overflow-x:auto` 를 가진 `<div>` 로 감싸는 것이다.
6. 이 문서의 브랜치·이력 서술은 **시점 의존적**이다. 실제로 잔존 브랜치 항목이 두 번 연속 깨졌다 — 처음엔 `git branch -a` 캐시를 서버 상태로 착각해서, 두 번째는 리뷰 도중 PR #16이 머지되면서. 지금은 개별 브랜치 유무 서술을 빼고 진단 방법만 남겼다. **같은 종류의 서술을 추가할 때 주의할 것.**

## Do Not Assume

- **훅은 Claude Code 세션 안에서만 발화한다.** GitHub 웹 편집이나 다른 편집기로 규칙 문서를 고치면 아무 알림이 없다. merge로 들어온 변경도 마찬가지다.
- 훅은 `.claude/settings.json` 을 읽는 세션에만 적용된다. 다른 팀원이 이 저장소를 받아도 Claude Code를 쓰지 않으면 동작하지 않는다.
- 이 문서의 수치는 **2026-08-24 조회 시점** 값이다. 브랜치 보호와 이력은 바뀐다.
- **저장소 설정 변경은 훅이 절대 못 잡는다.** 훅은 파일 편집에만 반응한다. 실제로 `deleteBranchOnMerge` 를 켰을 때 훅은 발화하지 않았고 문서를 직접 고쳐야 했다 (TASK-007).

## Next Action
**병합 후에도 `Unresolved` 2번은 결정되지 않았다.** archive 이동 시점(2026-09-18)에 다시 확인했더니 `git-관련-사용법.html` 은 여전히 루트에 있고, `README.md` 문서 지도와 `AGENTS.md` 4장 SoT 표 어디에도 등재돼 있지 않다.
이 TASK는 종료하고, 배치 위치·SoT 등재 결정은 **별도 이슈로 세워 `role:platform`이 판단한다.** `Unresolved` 3~6번(규칙 복제, 팔레트 이중 정의, 표 접근성 미실측)도 같이 넘긴다.

## Last Verified Commit
`284de80` — PR #18의 `main` 병합 커밋. HTML 문서와 훅 반영 완료.

위 Verification은 병합 전 브랜치 커밋 `282b9c7` 시점에 실행한 것이다. 그 커밋은 squash 병합으로 사라져 지금은 조회되지 않는다.
이후 `ef32b22`(PR #20)가 브랜치 자동 삭제 설정을 HTML과 이 문서에 반영했고, 그 변경분은 위 Verification 대상이 아니다.
