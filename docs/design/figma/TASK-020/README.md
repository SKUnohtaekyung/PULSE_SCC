# TASK-020 — Figma 정본화용 보드 (Step 6)

## Status

Step 5 합성안([synthesis/TASK-020](../../synthesis/TASK-020/README.md))을 팀 Figma에 옮기기 위한 SVG 보드 10장이다. 2026-09-22에 Step 5 합성 범위로 8장을 만들었고, 2026-09-27에 인증·로딩·빈 상태 보드 2장을 더하면서 화면 보드를 새 디자인으로 다시 뽑았다. [발표 자료](../../../presentation/README.md)와 같은 방식으로 SVG를 만들어 Figma에 넣는다(2026-09-22 사용자 선택).

**2026-09-22 import:** https://www.figma.com/design/lIEsVWuCpKr2SzvYeu2EzZ — `lawyland` 팀의 내 드래프트, 파일 `PULSE TASK-020 Vertical Slice`, 페이지 `TASK-020 Vertical Slice`. 팀 공용 파일로 옮기는 것은 사용자가 정한다.

> **Figma 파일은 2026-09-22 보드 8장 그대로다.** 2026-09-27 갱신분(새 디자인 + 09·10)은 아직 넣지 못했다. Figma MCP가 Starter 플랜 호출 한도에 걸려 파일을 직접 고칠 수 없었다. 지금 디자인 정본은 이 폴더의 SVG와 앱 코드이고, Figma 파일은 구버전이다.

정본 관계:

| 정보 | 정본 | 이 보드의 역할 |
|---|---|---|
| 토큰 값 | `frontend/mobile/src/design/tokens/foundation.ts` | 생성 시점의 값을 그대로 옮긴 사본 |
| 화면 상태·전이 | [SCREEN_STATES](../../../product/requirements/SCREEN_STATES.md) | Step 5 합성 범위의 상태를 그림으로 옮긴 사본 |
| 선택 요소와 UX 근거 | [synthesis/TASK-020](../../synthesis/TASK-020/README.md) | 같은 결정을 화면으로 표현 |
| 사람이 보는 디자인 정본 | 팀 Figma 파일(import 후) | Figma에서 고친 것은 위 정본에도 반영해야 한다 |

Figma와 코드·문서가 다르면 코드·문서가 맞다(AGENTS.md 4장). Figma에서 디자인을 바꾸면 합성안과 토큰을 먼저 고치고 이 스크립트로 다시 뽑는다.

> 화면의 상호명·리뷰 수·날짜·유형 이름은 가상 데이터다. 모든 보드 오른쪽 아래에 표시했다.

## 파일

```
docs/design/figma/TASK-020/
├─ README.md       이 문서
├─ generate.mjs    svg/를 만드는 스크립트 (토큰을 foundation.ts에서 읽는다)
├─ shared.mjs     생성기와 검사기가 같이 쓰는 화면 크기·글자 폭 근사
├─ check.mjs      보드의 이탈·겹침·가림 검사
└─ svg/            Figma에 넣을 보드 10장
```

| 파일 | 내용 | preview.html Step 6 항목 |
|---|---|---|
| `01-ia-flow.svg` | 앱 구조와 Step 5 합성 범위의 흐름 | IA · Flow |
| `02-foundation.svg` | 색·타입·간격·모서리 토큰 | (Component 기반) |
| `03-components.svg` | 버튼·입력·칩·진행 단계·안내·하단 내비·포디움 칸·대화상자와 상태 | Component |
| `04-assets.svg` | 프로토타입 페르소나 이미지와 사용처·사용 금지 조건 | Asset |
| `05-final-first-analysis.svg` | 첫 분석: 입력 3단계 → 진행 → 첫 저장 완료 → 홈 | Final UI |
| `06-final-failures.svg` | 재시도 가능·리뷰 부족·서비스 문제·가게 못 찾음 | Final UI |
| `07-final-reanalysis.svg` | 다시 분석 입력 → 새 결과 미리보기 → 교체 확인 / 뒤로가기. **SCREEN_STATES §10의 다음 Slice** | Final UI |
| `08-final-result-states.svg` | 유형 부족·유형 0개·이미지 로딩·조회 실패 | Final UI |
| `09-final-auth.svg` | 앱 시작·세션 복원·시작 실패·로그인 3종·가입 3종 | Final UI (2026-09-27 추가) |
| `10-final-loading-empty.svg` | 홈 조회 중·저장본 없음·결과 조회 실패·근거 목록 2종·마이페이지 | Final UI (2026-09-27 추가) |

보드에 없는 상태:

- `STORE-CREATING-JOB`·`AUTH-SUBMITTING`(버튼 loading — 누른 버튼의 글자만 바뀌므로 정지 화면으로 담기 어렵다)
- `IMAGE-GENERATION-FAILED`(서버가 이 코드를 아직 보내지 않는다, SCREEN_STATES §11)
- Google 로그인·계정 탈퇴(구현 범위 밖, SCREEN_STATES §11)

이 목록은 SCREEN_STATES의 상태를 전수 대조한 것이 아니라 위 네 가지만 확인한 결과다.

휴대폰 화면은 360×800 기준이다. 페르소나 이미지는 파일 크기를 줄이려고 240px로 축소해 넣었다(원본은 `frontend/mobile/assets/images/personas/prototype/`).

## 2026-09-27 갱신 — 발표 시안과 디자인 리뷰 반영

보드 8장을 만든 2026-09-22 이후 두 가지가 바뀌어 **화면 보드(05~08)를 다시 뽑고 09·10을 더했다.** 01(IA·Flow)과 04(Assets)는 화면이 아니라 구조·에셋 설명이라 바뀐 곳이 없다(04의 아이콘 공급원 문구만 고쳤다).

1. 2026-09-26 최종 발표 시안(`PULSE 최종발표.pdf`, 저장소 밖)
2. 이 Figma 파일에 달린 디자인 리뷰 댓글 9건

바뀐 것:

| 항목 | 전 | 후 |
|---|---|---|
| 헤더 | 네이비 색면 150px, 큰 제목 포함 | 흰 배경 88px + 얇은 아래 경계선. 큰 제목은 본문 첫 줄(`PageTitle`) |
| 주요 버튼 | 주황 배경 | 남색 배경. 주황은 입력 포커스·진행 중 단계·저장 완료 표시·하단 중앙 버튼에만 |
| 손님 유형 | 3칸 카드 나열 | **1위를 가운데 가장 높게 두는 시상대.** 좌우는 2위·3위 |
| 홈 순서 | 분석 정보(네이비 블록) → TOP3 | TOP3 → 분석 정보(흰 카드 3열) |
| 입력 화면 | 헤더에 `첫 분석` 배지 | 상단 3단계 표시 + 단계별 제목. 배지 제거 |
| 진행 완료 표시 | 진한 초록 원 | 연한 초록 바탕 + 진한 초록 기호 |
| 하단 아이콘 | 사각형·막대 도형 | 앱과 같은 24×24 SVG path |
| 손님 유형 그림 | 프로토타입 ImageGen 사진 | 앱과 같은 코드 캐릭터(`GuestCharacter`) |

보드와 앱 코드가 같은 값을 쓰도록, 아이콘 path와 캐릭터 도형은 `frontend/mobile/src/components/icons/`의 것과 같게 적었다. 한쪽을 고치면 다른 쪽도 고쳐야 한다.

## Figma에 넣는 법

1. 팀 Figma 파일에 페이지 `TASK-020 Vertical Slice`를 만든다.
2. `svg/`의 파일을 캔버스로 드래그하거나 `File > Import`.
3. 텍스트는 편집 가능한 텍스트 레이어로, 도형은 벡터로 들어간다. 레이어 이름은 `Button/Primary/분석하기`, `ProgressStep/paused`처럼 컴포넌트 이름을 따른다.
4. 오토레이아웃·컴포넌트 변형(variant)은 붙지 않는다(SVG에 그런 개념이 없다). 03의 요소를 Figma 컴포넌트로 묶을 때 레이어 이름을 컴포넌트 이름으로 쓴다.
5. 글꼴은 Pretendard다. Figma에 Pretendard가 없으면 대체 글꼴로 보인다.

## 다시 만들기

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/generate.mjs
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs
```

생성 뒤에는 반드시 `check.mjs`를 돌린다. 문구를 한 글자만 늘려도 프레임을 넘길 수 있다.

`frontend/mobile/node_modules`가 있어야 한다(이미지 축소에 `jimp-compact`를 쓴다). 설치는 `npm --prefix frontend/mobile install`.

## Import 결과 (2026-09-22)

- 보드 8장이 각각 프레임으로 들어갔고 레이어 이름은 파일명과 같다(`01-ia-flow` …). 크기는 원본과 같다.
- 도형·색·점선·이미지(페르소나 3장)는 그대로 들어갔다. 이미지 fill 노드 16개 확인.
- **글꼴 대체:** Figma 계정에 Pretendard가 없어 SVG import가 모든 글자를 `Inter Regular/Bold` 두 가지로 바꿨다. 굵기 4단계(400·500·600·700)가 2단계로 뭉개졌다. `font-family="Pretendard, Noto Sans KR"`처럼 목록을 줘도 Figma는 무시한다(시험으로 확인).
- 그래서 import 뒤 글자 레이어 604개를 **Gothic A1**(Regular·Medium·SemiBold·Bold)로 바꾸고, 각 글자의 굵기는 이 폴더 SVG의 `font-weight`를 순서대로 읽어 그대로 넣었다. 보드별 글자 수가 SVG와 정확히 같아 순서로 대응했다(51·104·89·27·83·69·110·71 = 604).
- Gothic A1은 Figma에서 쓸 수 있는 **대체 글꼴**이다. 제품 글꼴 정본은 Pretendard이고(DESIGN_SYSTEM §3.4) 코드는 그대로다. 팀이 Pretendard를 각자 PC에 설치하면(원본 OTF: `frontend/mobile/assets/fonts/`) Figma에서 글꼴만 바꿔 쓸 수 있다.
- 실행 캡처: [evidence/TASK-020](../../evidence/TASK-020/README.md)의 `step6-figma-*.png`

## 검증 범위

### 2026-09-27 (보드 10장)

- `check.mjs`로 네 가지를 기계로 검사한다. 사람이 눈으로 보는 것만으로는 놓친다 — 독립 리뷰가 좌표를 직접 재서 이탈 6건·겹침 17건을 찾았고, 그 뒤 리뷰가 검사기조차 보지 않던 축에서 또 4건을 찾았다. 현재 결과는 **0건**이다.

  ```bash
  node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON docs/design/figma/TASK-020/check.mjs
  ```

  | 검사 | 내용 |
  |---|---|
  | 이탈 | 글자가 휴대폰 화면의 좌·우·아래로 나가는가 |
  | 겹침 | 같은 화면 안에서 글자끼리 포개지는가 |
  | 가림 | 나중에 그린 불투명 도형이 글자를 덮는가(하단 내비가 본문을 먹는 사고) |
  | 미배정 | 어떤 화면에도 속하지 않아 검사받지 못한 글자가 몇 개인가 |

- **검사가 닿지 않는 곳:** 화면 프레임(`Screen/…`) 밖 글자 306개는 이탈·가림 검사를 받지 않는다. 보드 01·02·04는 화면 프레임이 없어 겹침만 검사하고, 03은 컴포넌트 견본이라 절반이 프레임 밖이다. 검사기가 실행할 때마다 이 숫자를 출력한다.
- **육안 확인:** 05·09·10 세 장을 PNG로 렌더링해 배치를 봤다. 이 PC에 Pretendard가 시스템 글꼴로 없어 **한글이 네모로 보이므로 확인한 것은 요소의 자리와 크기뿐이고 글자 내용·잘림은 보지 못했다.** 저장소의 `frontend/mobile/assets/fonts/Pretendard-*.otf`를 로드하면 글자까지 볼 수 있으나 그렇게 하지 않았다.
- 글자 폭은 근사(`measure()`: 한글 1.0배, 라틴 0.56배)이고 자동 줄바꿈이 없다. 긴 문장은 스크립트에서 줄을 직접 나눈다. 근사식은 `shared.mjs`에 한 번만 두고 생성기와 검사기가 함께 쓴다.

### 2026-09-22 (보드 8장, 그때 기준)

- 8장을 브라우저로 렌더링해 겹침·넘침을 눈으로 확인했다. 독립 리뷰에서 Pretendard OTF를 로드해 다시 렌더링했을 때 눈에 띄는 넘침은 없었다.
- 레이어 id는 보드 안에서 겹치지 않게 번호를 붙였다. 대화상자 뒤 배경 화면(07)의 페르소나 이미지는 용량을 줄이려고 회색 사각형으로 대체했다.
- 2026-09-22 import 결과는 위 "Import 결과"에서 확인했다. 그때 8장 모두 화면으로 보고 글자 잘림·겹침·이미지 누락이 없음을 확인했다. 2026-09-27 갱신분은 아직 import하지 못했다.
- Figma에서 컴포넌트·오토레이아웃으로 묶는 작업은 하지 않았다. 레이어 이름(`Button/Primary/분석하기` 등)만 그대로 들어가 있다. **2026-09-22 사용자 결정: 이 작업은 워크플로 10단계까지 마친 뒤 0~10단계 재검토 때 한다.**
- 보드는 Android 렌더링과 픽셀 단위로 같지 않다. 간격·크기의 기준은 코드다.
