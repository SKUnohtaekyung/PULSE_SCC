# TASK-029 — 팀 디자인 피드백 반영

## Status

리뷰 대기. 문서 반영, 이미지·분석 프롬프트 변경, `origin/main` 병합, 화면 구현을 마쳤고 Android 에뮬레이터에서 주요 화면을 확인했다. 글자 200%·TalkBack·태블릿 폭·실기기는 확인하지 않았다.

## Owner

오해서 (`role` 배정은 미정 — `AGENTS.md` 5장)

## Branch

`ui/TASK-029-design-feedback` — `feat/TASK-027-analysis-resume`(`92ef51b`)에서 갈라졌고, `origin/main`(`4fc1630`, PR #36·#38·#39·#42 병합 뒤)을 병합했다(`c08ba27`). `main` 대상 PR에는 PR이 없던 TASK-024·027 커밋이 함께 들어간다.

## Goal

2026-10-05에 받은 팀원 디자인 피드백 18건과, 2026-10-09 에뮬레이터 확인 뒤의 사용자 요청을 반영한다.

관련 요구사항: PRD FR-002, FR-004, FR-005, FR-006, FR-010, FR-012. 관련 이슈는 아직 없다.

## Completed

- 결정 4건을 `docs/product/PRD.md`, `docs/product/requirements/*`, `docs/design/DESIGN_SYSTEM.md`에 반영했다. 2026-09-22 합성 기록에는 정정 주석만 달았다.
- `origin/main`을 병합하며 충돌 9건을 풀었다. 이미지는 인증 요청으로 받는 TASK-024 방식과 다시 불러오기(#38)를 함께 쓴다.
- **분석 결과**: 관점마다 AI 해석 → 리뷰에서 확인 → 실제 리뷰 순서, 관점별 색과 아이콘, 손님 유형별 리뷰 비율 막대, 하단 순위 바로가기, 맨 위 한 줄 AI 안내, 제안은 행동 먼저. 분석마다 달라지는 한계 문장과 유형별 단서는 `알아 둘 점 N가지 더 보기`에 접었다.
- **시상대**: 지금 보는 유형만 남색, 나머지는 같은 연한 색. 순위별 파랑 세 단계는 넣었다가 뺐다.
- **분석하기**: 입력 세 칸을 번호가 붙은 단계 카드로 한 화면에 놓고, 채우면 번호가 체크로 바뀐다. 업종은 아이콘 타일 격자. 저장된 가게 정보를 미리 채운다. 주소 복사 안내는 한 줄. 분석 중에는 결과 읽는 법 안내와 진행 막대 모션.
- **마이페이지**: 저장 이미지를 옆으로 넘기는 카드 피드로 놓고, 카드마다 기기 사진 앱에 저장한다.
- **움직임**: 화면 조각이 나타날 때 한 번 떠오르고, 시상대 단상과 비율 막대가 자란다. 모션 감소 설정에서는 끈다.
- **프롬프트**: 페르소나 이미지를 사진풍 상반신 인물·단색 배경으로, 손님 유형 이름과 닮은 인물로 만든다. 분석 본문의 문장 길이를 제한한다.
- 첫 탭 이름을 `분석 결과`로, "근거 리뷰"를 "실제 리뷰"로 바꾸고 화면 전체의 설명 글을 줄였다.

## Changed

문서
- `docs/product/PRD.md` — FR-006·FR-012 인수 기준, 페르소나 취급 규칙 6, §13-9
- `docs/product/requirements/{RESULT_IA,USER_FLOW,GUEST_ANALYSIS_FUNCTIONAL_SPEC,SCREEN_STATES}.md`
- `docs/design/DESIGN_SYSTEM.md` — §2, §3.2·3.3·3.6, §4, §5.3, §6, §7.1, §9, §13
- `docs/design/synthesis/TASK-020/README.md` — 정정 주석 1건
- `docs/design/evidence/TASK-029/` — 에뮬레이터 캡처 7장과 README

백엔드
- `backend/python-analysis/src/scc_analysis/analysis/openai_analyzer.py` — 프롬프트 문자열만

프론트엔드 (`frontend/mobile/`)
- `src/design/tokens/foundation.ts`, `scripts/verify-design-tokens.mjs` — 관점 색, 시상대 색, 대비 검사
- `src/components/ui/Motion.tsx`(신규) — `Reveal`, `Grow`, `useReduceMotion`
- `src/components/icons/{PerspectiveIcons,CategoryIcons}.tsx`(신규)
- `src/components/ui/{BottomNavigation,Button,Field,TextField,PersonaAvatar,PodiumTop3,ProgressList,Screen,Chip}.tsx`
- `src/features/result/{ResultView,HomeScreen,EvidenceScreen}.tsx`
- `src/features/analysis/AnalyzeScreen.tsx`, `WaitingTips.tsx`(신규), `CategoryPicker.tsx`(신규)
- `src/features/mypage/MyPageScreen.tsx`
- `package.json`, `package-lock.json`, `app.json` — `expo-media-library`·`expo-file-system` 추가, 사진 저장 권한 문구
- 병합으로 사라진 것: `components/ui/PersonaImageBlock.tsx`(#38), `api/fixtures/server.ts`(TASK-024)

소유 영역 밖 수정이다: `docs/product/**`(`role:product`), `docs/design/**`·디자인 토큰·`components/ui/**`(`role:design-system`), `backend/python-analysis/**`(`role:feature`), 의존성·`app.json`(`role:platform`).

## Decisions

2026-10-05 사용자 결정
- 관점은 해석 먼저 읽는다. 제안 카드는 `리뷰 사실 + 검토할 행동` 기본 노출(FR-005)을 그대로 둔다. 화면에서 읽는 순서만 바꿨고 분석을 만드는 순서(PRD 설계 원칙 A)는 그대로다.
- 문서 안의 `홈`은 SC-011의 내부 이름으로 남기고 탭 이름만 `분석 결과`로 바꿨다. 코드 경로 `/home`과 상태 ID `HOME-*`는 그대로다.
- 페르소나 이미지는 사진풍 인물로 만든다.
- 입력은 한 화면에 모두 펼친다.

2026-10-09 사용자 결정 (에뮬레이터 확인 뒤)
- 시상대의 순위별 파랑 세 단계를 뺀다. 나란히 놓이면 색이 겹쳐 탁해 보였다. 팀 피드백 #14를 되돌린 것이다.
- 설명 글을 줄이고, 분석마다 달라지는 한계 문장과 유형별 단서는 접어 둔다. 대표성 한계와 2년 초과 경고는 항상 보인다.
- 저장 이미지를 카드 피드로 놓고 기기에 저장할 수 있게 한다. 앱 안의 별도 아카이브는 여전히 두지 않는다.
- 페르소나 인물은 손님 유형 이름과 닮게 그리고, 유형을 드러내는 물건 하나를 들게 한다. 리뷰에 근거가 없는 나이·성별·직업을 지정하지 않는 규칙은 유지했다.
- 화면에 움직임을 넣는다. 나타날 때 한 번만 움직이고 되풀이하지 않는다.
- 분석 본문의 문장 길이를 프롬프트에서 제한한다.

구현 판단
- 관점 카드의 비율 막대를 뺐다. `evidenceCount`는 그 이야기가 나온 리뷰 수가 아니라 근거로 연결한 리뷰 수(스키마상 최대 2)였다.
- `expo-media-library`는 `legacy` 진입점을 저장을 누를 때 동적으로 불러온다. Expo Go에 새 네이티브 모듈(`ExpoMediaLibraryNext`)이 없어, 파일 맨 위에서 불러오면 마이페이지 전체가 열리지 않았다.
- `Field`·`TextField`에 `labelHidden`을 더했다. 단계 카드의 제목이 보이는 label을 맡고, 읽기 이름은 입력이 그대로 가진다.

## Verification

| 항목 | 명령 | 결과 |
|---|---|---|
| 토큰 검증 | `npm --prefix frontend/mobile run verify:tokens` | PASS |
| lint | `npm --prefix frontend/mobile run lint` | PASS — 출력 없음 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS — 출력 없음 |
| Android bundle | `npm --prefix frontend/mobile run export:android` | PASS — `Exported: dist` |
| Python lint·format | `ruff check`, `ruff format --check` | PASS |
| Python test | `python.exe -m pytest backend/python-analysis -p no:cacheprovider -o addopts=""` | PASS — `166 passed`. 프롬프트 문자열을 검증하는 테스트는 없다 |
| Spring test | — | 미실행. Spring 코드를 바꾸지 않았다 |
| Visual QA | Android 에뮬레이터 `Medium_Phone`(API 37), Expo Go, 글자 100% | 부분 확인 — [증거](../../design/evidence/TASK-029/README.md) |
| 실제 분석 | 앱에서 운산국밥 재분석 2회 | 완료. 사진풍 인물 이미지와 짧아진 문장을 화면에서 확인 |
| 이미지 저장 | 카드의 `이미지 저장` | 기기 `/sdcard/DCIM/pulse-persona-1.png` 생성 확인 |

독립 검토: 문서 반영 1차 FAIL → PASS, 화면 구현 1차·2차 FAIL → 수정, 후속 변경 1차 FAIL(인계 문서 미갱신, 업종 이름 잘림, 정본 불일치) → 수정.

## Unresolved

- 글자 200%, TalkBack, 태블릿 폭(1024dp 이상), 모션 감소 설정, 실기기, development build는 확인하지 않았다. 움직임은 정지 캡처로만 봐서 보기 좋은지 판단하지 못했다.
- 사진 저장 권한 거부, 저장 실패, 이미지 로드 실패 때의 카드 표현을 화면으로 확인하지 않았다.
- `app.json`의 `expo-media-library` 플러그인 기본값은 네이티브 빌드에 읽기 권한까지 넣는다. 쓰기만 하는 기능이라 줄여야 하는데, 옵션을 확인하지 않아 그대로 뒀다. `role:platform` 확인이 필요하다.
- 의존성 2개 추가를 ADR로 남기지 않았다.
- 이미지 참고 자료를 받지 못했다. 배경색·구도 세부 규칙은 확정 필요다(PRD §13-9). 이미지 생성 품질은 `low` 그대로다.
- 사진풍 인물은 나이대·성별이 눈에 보인다. "유형과 닮게"라는 지시가 이를 고르도록 밀 수 있다. PRD 페르소나 규칙 2·6과의 경계를 팀이 확인해야 한다.
- 문장 길이는 프롬프트 지시일 뿐이고 스키마(`models.py`)로 강제하지 않는다.
- 접힌 한계 문장 가운데 "유형별 리뷰 수의 합이 전체와 다를 수 있다"는 위쪽 숫자를 읽는 데 필요한 설명이다. 기본으로 보이게 할지 팀 확인이 필요하다.
- `Chip`, `StepIndicator` 컴포넌트는 쓰는 화면이 없다. `docs/architecture/FRONTEND_STRUCTURE.md`가 목록에 싣고 있어 지우지 않았다. 그 문서의 컴포넌트 수와 `SCREEN_STATES.md`의 `STORE-*` 상태 서술은 이번 화면에 맞춰 고치지 않았다.
- 로컬에서 Spring을 띄우려면 `fix/TASK-025-flyway-migration`의 마이그레이션 수정(V4 복구, V6 추가)이 필요하다. 그 브랜치는 PR이 없다. 이 브랜치에는 넣지 않았다.
- 결과 순서의 기존 불일치(`RESULT_IA.md` D7 등)는 이 TASK 전부터 있던 것이라 고치지 않았다.
- 연결할 이슈를 만들지 않았다.

## Do Not Assume

- 에뮬레이터 한 대, 글자 100%, 가게 하나의 결과로만 봤다. 다른 가게·긴 문장·유형이 1~2개인 결과에서도 배치가 괜찮다고 가정하지 않는다.
- 진행 막대의 빛 모션, 안내 자동 넘김, 진입 모션은 `DESIGN_SYSTEM.md` §9에 문장을 더하며 넣었다. 디자인 시스템 담당의 확인을 받지 않았다.
- Expo Go에서 저장이 됐다고 정식 빌드에서도 된다고 가정하지 않는다.
- `DATA_MODEL.md`의 화풍 규칙 버전 컬럼 값을 갱신해야 하는지 확인하지 않았다.

## Next Action

1. PR 리뷰를 받는다. 소유 영역 밖 수정이 많아 역할별 리뷰가 필요하다.
2. 글자 200%와 태블릿 폭에서 화면을 확인한다.
3. TASK-025(마이그레이션)를 PR로 올린다.

## Last Verified Commit

이 문서를 고친 커밋 바로 앞의 `f9a76e4`까지 에뮬레이터로 확인했다. 그 뒤 리뷰 수정(업종 이름 줄바꿈, 오류 칸의 체크 숨김, 저장 뒤 캐시 삭제, 프롬프트 예시)은 lint·typecheck·테스트만 통과했고 화면으로 다시 보지 않았다.
