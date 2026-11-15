# PULSE 시연 앱 (demo-web)

결과물을 보는 사람이 **서버 없이 브라우저에서 PULSE 앱을 그대로 써 볼 수 있게** 만든 정적 웹사이트다. 주소를 열면 소개 페이지 없이 앱이 바로 뜬다(2026-11-11 사용자 결정).

- 흐름: 앱 시작(맥박 스플래시) → 로그인(테스트 계정) → 가게 입력 → 분석 진행(맥박 스플래시) → 첫 저장(TOP3 미리보기) → 홈(요약) → 손님 유형 → 근거 리뷰 / 검토해 볼 행동 / 분석 기준 → 다시 분석 시 저장 선택 → 마이페이지
- **PC에서는 화면 가운데에 휴대폰 폭(최대 430px)의 앱**만 뜨고 바깥은 차분한 배경이다. 휴대폰에서는 화면 전체가 앱이다(`src/demo/AppColumn.tsx`, `src/demo/appFrame.ts`).
- 원본 앱 `frontend/mobile`을 **복제한 별도 폴더**다. 여기서 디자인을 바꿔도 Android 앱에는 영향이 없고, 원본 앱의 변경도 자동으로 따라오지 않는다.
- 디자인은 발표 시안(사용자가 보낸 화면 이미지 3장)에 최대한 맞췄다. 원본 앱과 다른 점은 아래 "발표 시안을 따르느라 원본과 달라진 디자인"에 있다.
- 데이터는 모두 **시연용 예시**다. 실제 가게·실제 리뷰가 아니다(아래 "시연 데이터 표시").

## 명령

저장소 루트에서 실행한다.

| 목적 | 명령 |
|---|---|
| 설치 | `npm --prefix frontend/demo-web install` |
| 토큰 대비 검증 | `npm --prefix frontend/demo-web run verify:tokens` |
| lint | `npm --prefix frontend/demo-web run lint` |
| typecheck | `npm --prefix frontend/demo-web run typecheck` |
| 정적 사이트 빌드 | `npm --prefix frontend/demo-web run export:web` → `frontend/demo-web/dist` |
| 개발 서버 | `npm --prefix frontend/demo-web run start` |

`app.json`의 `experiments.baseUrl`이 `/PULSE_SCC`라서 사이트는 `https://<계정>.github.io/PULSE_SCC/` 경로를 전제로 빌드된다. 로컬에서 `dist`를 열 때도 `/PULSE_SCC/` 아래에서 제공해야 자산 경로가 맞는다. 저장소 이름이 바뀌면 이 값과 `src/demo/appFrame.ts`의 `siteBase`를 함께 바꾼다.

## 맥박 장면(Remotion)

앱을 켤 때(최소 2.4초)와 분석 결과를 기다리는 동안에만 나온다(2026-11-11 사용자 결정). `remotion`·`@remotion/player` **4.0.535**(2026-10-12 배포)를 쓴다.

- `src/demo/motion/pulseMath.ts` — 심전도 한 박동(PQRST)을 가우시안 다섯 개로 근사한 순수 함수
- `src/demo/motion/PulseSignal.tsx` — 컴포지션(960×240, 6초). 병원 모니터처럼 신호 머리가 쓸고 지나가며 새 신호를 덮어 써서 끊김 없이 되풀이되고, 리뷰를 뜻하는 점들이 신호 머리로 흘러들며, 봉우리마다 주황 물결이 퍼진다. **장식이다** — 봉우리 높이는 어떤 수치도 뜻하지 않고, 진행 정도는 화면의 막대가 알린다
- `src/demo/motion/PulsePlayer.tsx` — 재생기. 정적 렌더에서는 빈 칸, 모션 감소 설정이면 멈춘 한 컷(`Thumbnail`)을 보여 준다. 보조 기술에는 숨긴다. 되풀이(`loop`)는 기다리는 동안의 로딩 표시에만 쓴다

**라이선스 확인 필요**: Remotion은 회사 규모에 따라 유료 라이선스가 필요할 수 있다. 팀이 무료 대상인지 [remotion.dev/license](https://www.remotion.dev/license)에서 확인한다. 확인 전이라 `acknowledgeRemotionLicense`를 넣지 않았고, 그래서 브라우저 콘솔에 라이선스 안내가 나올 수 있다.

## 결과 화면 구조(2026-11-15)

원본 앱은 결과 전체(TOP3·선택한 유형의 4관점·검토해 볼 행동·분석 기준·한계)를 한 화면에 세로로 이어 붙인다. 시연 앱은 사용자 결정으로 누르면 넘어가는 화면으로 나눴다. **보여 주는 정보와 기능은 같고 화면 구조만 다르다.**

```
홈(요약)                       src/features/result/ResultSummary.tsx
 ├─ 손님 유형  /persona?rank=  src/features/result/PersonaScreen.tsx
 │   ├─ 근거 리뷰 전체 /evidence
 │   └─ 검토해 볼 행동 /advice?rank=
 ├─ 검토해 볼 행동 /advice?rank=1   ← "먼저 살펴볼 것"
 └─ 분석 기준 /analysis-info       ← 기준 한 줄
```

- 하위 화면은 결과를 들고 다니지 않고 주소로 다시 불러온다(`useAnalysisResult`). 저장 전 미리보기에서 들어가면 `jobId`가 붙어 새 결과를 보여 준다. 링크로 바로 들어와도 같은 화면이 나온다.
- PRD FR-002에 따라 4개 관점은 손님 유형 화면 한 장에 모두 두고, 관점마다 사실·대표 리뷰 1건·펄스의 분석을 기본으로 보인다. 나머지 근거는 "근거 리뷰 N건 전체 보기"로 넘긴다.
- 원본의 순위 바로가기 막대(1위·2위·3위·검토할 행동·맨 위로)는 없앴다. TOP3를 누르는 것과 뒤로가기가 그 역할을 한다.
- 원본 앱은 저장 전 미리보기에서 다른 화면으로 나가지 않는다(SCREEN_STATES §7). 시연 앱은 하위 화면을 열 수 있고, 돌아오면 저장 선택이 그대로 있다.
- 하위 화면은 뒤로가기 머리(`components/ui/BackHeader.tsx`)를 쓰고, 열릴 때 본문이 오른쪽에서 살짝 밀려 들어온다(`components/ui/PageEnter.tsx`, 모션 감소면 바로 보인다).

## 발표 시안을 따르느라 원본과 달라진 디자인

| 자리 | 원본 앱(DESIGN_SYSTEM) | 시연 앱(발표 시안) |
|---|---|---|
| 앱 시작 | 로딩 문장 | 로고 → 맥박 → 상태 → "외식업의 맥박을 읽다" 스플래시. 로그인의 로고 인트로는 틀지 않는다 |
| 로그인 | 이메일 폼 → 로그인·가입·Google 버튼 → 작은 테스트 계정 글자 | "테스트 계정으로 바로 시작하기"가 맨 위 큰 버튼. 가입·Google은 글자 버튼 |
| 가게 입력 | 번호 붙은 단계 카드 3개, 업종 아이콘 격자 | "가게 분석 / 가게 정보를 알려주세요" 머리, 카드 하나에 세 칸, 업종은 3칸 선택 + 나머지 글자 줄, "가게 분석 시작하기" |
| 분석 진행 | 팝업 안 원형 퍼센트 게이지 | 전체 화면: 로고 → 맥박 → "리뷰에서 손님을 찾고 있어요" → 단계 → 짧은 막대 → "외식업의 맥박을 읽다" |
| 결과 머리 | 가게 이름 + 한 줄 요약 | 업종 칩·저장 상태 → 가게 이름 → "우리 가게 손님은 이런 분들이에요" |
| 분석 기준(리뷰 수·날짜) | 결과 맨 아래(2026-09-27 리뷰 #3) | 홈 머리 아래 한 줄("예시 리뷰 90건 중 78건 분석 · 날짜"), 누르면 분석 기준 화면 |
| 먼저 살펴볼 것 | 없음 | TOP3 아래 남색 카드(1위 손님의 첫 검토해 볼 행동), 주황 머리표. 누르면 검토해 볼 행동 화면 |
| 손님 유형 머리 | 순위·이름·요약 + 그림·비율 카드 | 손님 유형 화면 맨 위 카드: 사진 → 이름 → 요약 → 리뷰 수·비율 막대 |
| 관점 카드 | AI 해석이 첫머리(2026-10-05), 관점 색 이름 | 리뷰에서 확인한 사실(굵게)이 첫머리 → 대표 리뷰 → "펄스의 분석" 점선 상자(P 로고, "AI로 분석한 내용이에요"). 표시 설명은 화면 위 범례 한 번. "먼저 볼 것"만 남색 칸 위 흰 아이콘 + 주황 점 |
| 검토해 볼 행동 | 남색 행동 → 흰 사실, "AI 해석·전문 지식 펼쳐보기" | 별도 화면. 순위 칩으로 유형 전환, 흰 사실 카드 → 화살표 → 남색 행동 카드(주황 번호 칩), "펄스의 분석 펼쳐보기" |
| 첫 저장 | 체크·가게·숫자 두 개 | 아래에 찾은 TOP3 목록(1위 주황 번호) |
| 분석 대기 안내 | 진행 화면 뒤에 깔려 보이지 않음 | 진행 화면 안 막대 아래 |
| 하단 첫 탭 | "분석 결과"(PRD FR-012) | "홈" |
| 넓은 화면 | 1024px 이상에서 본문 960·관점 카드 2열(§7) | 앱 폭이 430px을 넘지 않으므로 넓은 배치를 쓰지 않는다 |
| 맥박 모션 | 없음 | 위 "맥박 장면". §9 "반복되는 장식 모션을 피한다"에 따라 되풀이는 로딩 화면에만 둔다 |
| 주황 서브 컬러 | 분석하기 버튼 | 화면의 약 5%: 분석하기 버튼, "먼저 살펴볼 것"·행동 번호 칩, "먼저 볼 것" 점, 행동 개수, 첫 저장 1위 번호, 맥박 머리. 흰 바탕 대비 2.9:1이라 작은 글씨에는 쓰지 않고 면·점·진한 글자를 얹은 칩에만 쓴다 |
| 글씨 위계 | 화면마다 제각각 | 페이지 제목 22~26 굵게, 섹션 제목 18 굵게, 핵심 문장 16 굵게, 본문 14~16, 보조 12 |

입력 칸은 시안처럼 테두리 없는 회색 칸으로 바꾸지 않았다. 칸 경계가 배경과 3:1 대비를 넘지 못해 칸이 보이지 않게 되기 때문이다(DESIGN_SYSTEM §8, WCAG 1.4.11).

새 토큰은 `palette.white14`·`white24`와 `colors.brand.onPrimarySubtle`·`onPrimaryDivider`(남색 위 반투명 흰 칩·구분선)뿐이며 demo-web의 토큰 사본에만 있다.

## 시연 데이터 표시

화면 위 상시 띠는 두지 않는다(2026-11-11 사용자 결정 — 시안과 같게). 대신 아래 자리에서 예시임을 알린다.

| 자리 | 문구 |
|---|---|
| 로그인 | "가입 없이 시연용 예시 데이터로 모든 화면을 써 볼 수 있어요." |
| 가게 입력 | "시연판은 입력한 가게와 관계없이 예시 가게 '온기 한식당'의 결과를 보여 줘요." |
| 홈 | 기준 한 줄 "예시 리뷰 …", 맨 아래 "시연용 예시 데이터예요. 리뷰·분석·제안 모두 미리 써 둔 예시 문장이에요." |
| 분석 기준 화면 | "시연용 예시 리뷰 기준", 알아 둘 것 목록, "실제 가게의 네이버 리뷰를 모으거나 분석하지 않았어요." |
| 마이페이지 서비스 정보 | "시연판의 리뷰·손님 유형·제안은 모두 미리 써 둔 예시예요. 실제 서비스는 …" |
| 대표·근거 리뷰 | 출처 줄 "예시 리뷰 · 날짜" |
| 손님 유형 사진 | "사진은 AI로 만든 가상 인물이에요. 실제 손님이 아니에요.", 마이페이지 카드 "AI 가상 인물" |

"펄스의 분석 · AI로 분석한 내용이에요"와 "펄스의 분석을 참고해 사장님이 최종 판단해 주세요"는 실제 서비스에서 그 자리가 무엇인지 보여 주는 표시다. 위 자리들이 이 앱의 내용이 예시임을 함께 알린다.

**결과의 가게는 입력과 관계없이 늘 예시 가게 '온기 한식당'이다.** 지어낸 리뷰(불만 포함)가 사용자가 입력한 실제 가게 이름에 붙지 않게 하려는 것이다.

## 원본 앱과 다른 코드

`ApiClient`(토큰 갱신·오류 봉투 처리)와 화면의 상태 처리(검증·오류·빈 상태)는 원본과 같다. 데이터·플랫폼·문구 때문에 바꾼 곳은 아래다(디자인 차이는 위 표).

| 파일 | 원본 | 시연 앱 |
|---|---|---|
| `src/api/transport.ts` | `fetch`로 서버 호출 | `src/demo/mockServer.ts`(브라우저 안 가짜 백엔드)로 보냄 |
| `src/api/config.ts` | 환경변수에서 서버 주소·Google ID·시연 계정 | 고정값. 시연 계정 `demo@pulse.example` / `pulse-demo` |
| `src/api/personaImages.ts` | 인증 PNG 다운로드 | 앱에 넣은 손님 유형 사진(`assets/images/personas/persona-{lunch,family,solo}.webp`, 640px 투명 WebP). 팀이 ChatGPT로 만든 AI 가상 인물이며 원본 PNG는 `.gitignore`로 커밋하지 않는다 |
| `src/session/storage.ts`, `features/analysis/pendingAnalysisStorage.ts` | `expo-secure-store` | 브라우저 `localStorage`(`src/demo/webStorage.ts`) |
| `src/features/auth/googleSignIn.ts` | 네이티브 Google 계정 선택 | 누르면 시연 계정으로 로그인 |
| `src/features/mypage/MyPageScreen.tsx` | 사진 앱에 저장 | 브라우저 다운로드(WebP) |
| `src/components/ui/Screen.tsx`, `MyPageScreen.tsx` | 창 폭으로 배치 판단 | 앱 폭(최대 430)으로 판단(`useAppWidth`) |
| `src/app/{analyze,evidence,first-save,home,mypage,preview-result}.tsx` | 로그인 확인 전이면 `/`로 보냄 | 확인하는 동안 기다림 — 링크로 화면에 바로 들어올 수 있게 |
| `src/app/foundation.tsx` | 토큰 쇼케이스 화면 | 없음(공개 시연 앱에 두지 않는다) |
| `src/features/result/{ResultSummary,PersonaScreen,AdviceScreen,AnalysisInfoScreen,PulseInsight,resultFormat,useAnalysisResult}` | `ResultView.tsx` 한 파일 | 위 "결과 화면 구조". `ResultView.tsx`는 지웠다 |
| `src/app/{persona,advice,analysis-info}.tsx` | — | 새 화면 경로 |
| `src/components/ui/{BackHeader,PageEnter}.tsx`, `PodiumTop3.tsx` | — / "보는 중" | 뒤로가기 머리, 화면 전환, 단상을 누르면 손님 유형 화면 |
| `src/components/ui/ModalColumn.tsx`, `ConfirmDialog.tsx`, `MyPageScreen.tsx`(크게 보기), `AnalysisProgressDialog.tsx` | 팝업이 화면 전체를 덮음 | 웹의 팝업은 브라우저 창 전체에 붙으므로, PC에서도 덮개·대화상자를 가운데 앱 기둥(최대 430px) 안에만 그린다. 바깥 PC 배경은 그대로 둔다 |
| `src/features/result/PreviewResultScreen.tsx` | — | 요약 + 하위 화면(jobId), 저장 상태 "저장 전 새 결과" |
| `src/app/_layout.tsx` | Stack만 | `AppColumn`으로 감싼다(PC 가운데 휴대폰 폭) |
| `src/features/result/EvidenceScreen.tsx` | "실제 리뷰" | "근거 리뷰", 출처 줄 "예시 리뷰 · 날짜" |
| `src/features/analysis/jobOutcome.ts` | "네이버 리뷰 수집 중" | "예시 리뷰 불러오는 중" |
| `src/features/analysis/WaitingTips.tsx` | 해석이 먼저라는 안내 | 사실이 먼저, 해석은 점선 상자라는 안내 |
| `src/components/ui/PersonaAvatar.tsx` | "그림은 AI로 만든 가상 이미지예요" | "사진은 AI로 만든 가상 인물이에요. 실제 손님이 아니에요." |
| `src/features/analysis/CategoryPicker.tsx`, `src/design/TokenShowcase.tsx` | 업종 격자, 토큰 쇼케이스 | 없음(쓰는 곳이 없어 지웠다) |

네이티브 전용 의존성(`google-signin`, `expo-secure-store`, `expo-media-library`, `expo-file-system`, `expo-dev-client`, `expo-build-properties`)은 `package.json`에서 뺐다.

## 시연 시나리오

가짜 백엔드는 실제 API 계약(`docs/architecture/API.md`)과 같은 경로·응답 모양·오류 코드를 쓴다. 진행 단계도 실제 서버가 기록하는 것만 쓴다(`QUEUED → COLLECTING_REVIEWS → ANALYZING → COMPLETED`). 그림을 만들지 않으므로 `GENERATING_IMAGE`는 보내지 않는다. 실제 분석은 몇 분 걸리지만 시연은 약 10초다.

| 하고 싶은 것 | 방법 |
|---|---|
| 정상 흐름 | 테스트 계정으로 시작 → 미리 채워진 예시 가게로 "가게 분석 시작하기" |
| 첫 분석 자동 저장 | 저장본이 없는 계정의 첫 완료 분석은 자동 저장 → 첫 저장 화면 |
| 새 결과 저장 선택 | 저장본이 있는 상태에서 다시 분석 → 미리보기에서 바꾸기·유지 |
| 자동 재시도를 다 쓴 실패 | 가게 주소에 `fail` 포함 → `ANALYSIS_RETRY_EXHAUSTED`. 입력 화면으로 돌아가 다시 요청하면 성공 |
| 가게를 찾지 못함 | 가게 주소에 `notfound` 포함 |
| 유효 리뷰 부족 | 가게 이름에 `리뷰부족` 포함 |
| 처음부터 다시 | 로그인 화면 맨 아래 "시연 데이터 처음부터" → 확인 → 이 브라우저의 시연 데이터를 지우고 처음으로 |

## 예시 데이터

화면의 숫자는 모두 `src/demo/fixtures.ts`의 예시 리뷰에서 계산한다. 손님 유형 리뷰 수(32·22·14), 관점별 근거 수, 분석한 리뷰(78 = 유형에 묶인 68 + 가게 전반 10), 모은 리뷰(90 = 78 + 분석에서 뺀 12)가 서로 맞는다. 사실 문장의 "모두", "가장 많아요"는 예시 리뷰가 실제로 뒷받침하게 맞췄다. 손님 유형 이름은 직업·연령·성별을 단정하지 않고 이용 상황으로 짓는다(PRD FR-003).

## 가짜 서버의 한계

- 실제 백엔드 동작을 증명하지 않는다. 계약의 모양만 따른다.
- 시연 access token은 만료되지 않는다. 봉투 없는 401 → 토큰 갱신 → 재전송 경로는 코드에는 있지만 정상 시연에서는 실행되지 않는다.
- 시간이 흐르는 서버 프로세스가 없다. 작업 완료·자동 저장·알림은 작업 상태를 **조회할 때** 처리된다. 진행 화면이 조회를 계속하므로 화면 흐름에는 영향이 없다.
- 가입한 계정의 비밀번호는 저장하지 않는다(공개 사이트의 브라우저에 사용자가 넣은 비밀번호를 남기지 않으려는 것). 그래서 가입 계정은 어떤 비밀번호로도 로그인된다.

## 아직 하지 않은 것

- 회원가입·마이페이지·첫 저장 화면은 시안에 없어 기존 모양을 유지했다
- GitHub Pages 배포 워크플로(`.github/workflows/`) — `role:platform` 소유 영역이라 별도 합의 후 추가. 브랜치 방식으로 배포하면 Jekyll이 `_expo/` 폴더를 버리므로 `dist`에 `.nojekyll`이 필요하다(Actions 배포면 필요 없다)
- 웹용 폰트 경량화 — Pretendard OTF 4종(약 6.1MB)을 그대로 실어 첫 화면이 느리다
