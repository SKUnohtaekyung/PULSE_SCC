# 프론트엔드 구조와 Architecture Validation

| 항목 | 내용 |
|---|---|
| 상태 | Step 8 Architecture Validation 결과 — 2026-09-23 |
| 대상 | `frontend/mobile` (Expo SDK 57 · React Native 0.86 · Expo Router) |
| 소유 역할 | `role:platform` (구조) · `role:design-system` (`components/ui`) |
| 관련 정본 | [ARCHITECTURE.md](ARCHITECTURE.md) · [API.md](API.md) · [SCREEN_STATES.md](../product/requirements/SCREEN_STATES.md) · [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) |

Step 7 Vertical Slice로 만든 구조가 **나머지 화면과 기능(Step 9 전체 구현)까지 버티는지** 확인한 기록이다.
검증 축은 워크플로 8단계가 정한 여섯 가지다: Component · State · API · Env · Error Handling · Responsive.

판정 표기: **유지** = 지금 구조로 간다 · **보완함** = 이번 단계에서 고쳤다 · **결정 필요** = 사람이 정해야 한다 · **미이행** = 아직 하지 않았다. 언제 하는지 함께 적는다.

Step 10 독립 검토에서 세 번 갱신했다. 2026-09-24에 8단계 시점의 `9단계` 표기 중 9단계에서 실제로 하지 않은 것을 `미이행`으로 바로잡고 치수 리터럴 개수를 다시 셌다. 2026-09-27에 리터럴을 센 범위(`src/prototypes/**` 제외)를 명시했고, 같은 날 실재하지 않는 DESIGN_SYSTEM §13 참조를 지웠다.

---

## 1. 계층

```text
src/
├─ app/           Expo Router route. 화면 조립과 진입 분기만 담당한다
├─ features/      화면 단위 구현 (auth · analysis · result · dev)
├─ components/ui/ 공용 UI. 화면에 종속된 문구·API 호출을 넣지 않는다
├─ api/           계약 타입 · HTTP/가상 서버 전송 · 인증 클라이언트 · 엔드포인트
├─ session/       안전 저장소와 세션 상태
├─ design/        토큰과 글꼴
└─ prototypes/    Step 5·6 디자인 프로토타입. 제품 화면이 아니다
```

의존 방향(2026-09-23 코드 확인):

```text
app        → features · session · components/ui · design · prototypes
features   → api · session · components/ui · design
session    → api
components/ui → design
prototypes → components/ui · design
api        → (앱 안 다른 계층에 의존하지 않는다)
```

- `components/ui`는 `api`를 부르지 않는다. 화면이 데이터를 받아 UI에 넘긴다.
- `api`는 `design`(토큰)에 의존하지 않는다. 화면 표현을 모른다.
- `app → design`은 글꼴 로드(`_layout`)와 토큰 견본 route(`/foundation`), `app → prototypes`는 시안 route(`/flow`·`/preview`·`/prototype-result`) 때문이다. 둘 다 제품 화면 경로가 아니다(§2.4 참고).
- **문구는 두 곳에 나뉜다.** 코드를 모를 때도 보여줄 수 있는 일반 문구(연결 실패, 세션 만료, 원인을 단정하지 않는 오류)는 `api`가 갖고, 화면마다 다른 문구(§2.1 표의 코드별 문구)는 `features`가 갖는다. `api/errorMessage.ts`는 이 둘을 합치는 지점이다.

---

## 2. 축별 검증

### 2.1 Component

| 확인한 것 | 결과 |
|---|---|
| 공용 컴포넌트 14종(Button·TextField·Field·Chip·CheckRow·ToggleRow·ConfirmDialog·PersonaImageBlock·Notice·LoadingBlock·ProgressList·ScreenHeader·BottomNavigation·Screen) | 유지 — 9단계에서 CheckRow·ToggleRow·ConfirmDialog·PersonaImageBlock을 더했다. 페르소나 이미지는 결과 화면과 마이페이지가 같은 컴포넌트를 쓴다 |
| 화면 골격(SafeArea·스크롤·읽기 폭·좌우 여백)이 화면마다 복제됨 | **보완함** — `components/ui/Screen.tsx`로 모으고 5개 화면을 옮겼다. 9단계에서 화면이 늘어도 골격은 한 곳이다 |
| 같은 입력을 두 번 구현(`TextField` ↔ 가게 입력 화면) | 보완함(Step 7 리뷰에서 해소) — `Field`를 분리해 글자 입력과 선택 입력이 같은 껍데기를 쓴다 |
| DESIGN_SYSTEM §5.3 목록 중 미구현 | AuthMethodSelector(Google 결정 대기)·StoreConfirmation(API 없음, SCREEN_STATES §4.3) |
| 9단계에 새로 필요한 공용 컴포넌트 | 확인 대화상자(Modal/Dialog), 설정 토글(Switch), 알림 목록 행. 프로토타입(`prototypes/result`)에 대화상자 구현이 있어 승격해 쓴다 |
| 목록 화면(`SC-005` 전체 근거는 cursor 페이지네이션이라 `FlatList`가 필요) | **보완함** — `Screen`에 `scroll={false}`를 두면 본문이 남은 높이를 모두 차지해 목록이 자기 스크롤을 갖는다. 60행짜리 목록을 임시 화면에 띄워 실제로 스크롤되는 것을 확인했다(`step8-05-list-scroll.png`, 확인 뒤 임시 화면은 되돌림). `FlatList`를 `ScrollView` 안에 넣으면 가상화가 꺼진다 |
| 버튼·칩의 focus 표현 | 결정 필요 — DESIGN_SYSTEM §5.2가 요구하나 Android 실기기 기준(§8.2)이 미정이라 두지 않았다 |

### 2.2 State

| 확인한 것 | 결과 |
|---|---|
| 세션(인증·저장본 유무)은 `SessionProvider` 한 곳 | 유지 |
| 화면 상태는 화면 로컬 | 유지. 화면 사이로 옮길 데이터는 **서버가 정본**이라 id만 넘기고 다시 조회한다(첫 저장 화면은 요약값만 route 파라미터로 받는다) |
| 분석 작업 polling이 가게 입력 화면 안에 있음 | 유지 — 9단계에서 다시 봤고 그대로 뒀다. 두 번째 사용처(저장본이 있는 사용자의 미리보기)가 생기면 hook으로 뽑는다. polling·백오프 정책 자체가 미정이라(§11) 지금 추상화하면 잘못된 모양으로 굳는다 |
| 전역 상태 라이브러리 | 도입하지 않는다. 서버 상태는 화면 진입마다 조회하고, 공유 상태는 세션뿐이다 |

### 2.3 API

| 확인한 것 | 결과 |
|---|---|
| 구현된 엔드포인트 15개(login·register·session·logout·refresh·legal-documents·작업 생성/조회/결과·저장본 조회/교체·근거 목록·알림 조회·알림 설정 조회/변경) | 유지 |
| API.md에 있으나 미구현: google 로그인·persona-images 직접 조회 | Google은 앱 식별자·OAuth 설정 결정 대기, 이미지 직접 조회는 실제 서버 연결과 함께 |
| API.md와 실제 백엔드가 어긋나는 endpoint 3건: `GET /api/v1/auth/session`(API.md 표에 없음), `GET /api/v1/legal-documents`(API.md에 없고 SCREEN_STATES §3.2에만 있음), `DELETE /api/v1/me/account`(원격 백엔드에는 있으나 API.md §3.3이 계약에서 제외) | 결정 필요 — API.md를 실제에 맞출지 `role:platform`이 정한다(§4.2 세션 응답 불일치와 같은 건). 탈퇴는 이 결정 전까지 앱에서 구현하지 않는다 |
| 가상 서버가 실제와 같은 경로·요청·응답을 쓰는지 | 유지 — 원격 백엔드 코드에서 읽은 모양을 따른다. Step 7 호출 9개와 Step 9 호출 6개를 각각 리뷰에서 대조했다. 9단계 대조에서 `GET /me/notifications`가 배열인데 앱이 `{ items }`로 읽던 것을 찾아 고쳤다 |
| fixture ↔ http 전환 | 유지 — `EXPO_PUBLIC_API_BASE_URL` 유무로 갈린다. 화면 코드는 그대로다 |
| 요청 timeout | **보완함** — 15초 뒤 요청을 끊고 `NetworkError`로 다룬다. 없으면 진행 화면 조회가 영영 멈춘다 |
| API.md §4.2와 실제 `SessionResponse` 불일치 | 결정 필요 — SCREEN_STATES §11 머리말에 기록. `role:platform`이 정한다 |
| 이미지 요청의 401 갱신·재요청(§6.4) | **미이행** — 9단계에서 하지 않았다. fixture 모드에는 내려받을 이미지가 없어 확인할 수 없다. 실제 서버 연결과 함께 한다 |

### 2.4 Env

| 확인한 것 | 결과 |
|---|---|
| 서버 주소 | 유지 — `EXPO_PUBLIC_API_BASE_URL`. 없으면 가상 서버 |
| `android.package`·`scheme` | **결정 필요** — 없어서 development build·딥링크·Google 로그인을 할 수 없다. Expo Go 실행만 가능하다 |
| Google OAuth client id | 결정 필요 — 백엔드의 `GOOGLE_CLIENT_ID`와 함께 정해야 한다(SCREEN_STATES §11) |
| 시크릿 | 앱에는 시크릿을 두지 않는다. OpenAI 키는 서버만 가진다(PRD FR-004) |
| dev/prod 구분 | **미이행** — 9단계에서 하지 않았다. 빌드 프로파일(EAS)과 함께 정한다 |
| 프로토타입 route(`/flow`·`/preview`·`/prototype-result`·`/foundation`)와 가상 서버가 제품 번들에도 들어감 | **미이행** — 9단계에서 하지 않았다. 배포 빌드에서 제외하는 방법(route 분리 또는 조건부 번들)을 빌드 프로파일과 함께 정한다 |

### 2.5 Error Handling

| 확인한 것 | 결과 |
|---|---|
| 오류 타입 3종(`ApiError`·`NetworkError`·`SessionExpiredError`) | 유지 |
| 봉투 없는 401 → 단일 갱신 → 재전송 | 유지(불변식 12). 갱신 실패 판정은 401로 한정했다 |
| 코드 → 문구 규칙이 화면마다 반복됨 | **보완함** — `api/errorMessage.ts`의 `resolveErrorMessage`로 모았다. 화면은 아는 코드 표만 넘긴다 |
| 작업 실패 → 화면 상태 매핑 | 유지 — `features/analysis/jobOutcome.ts`. §2.1 표와 1:1 |
| 로깅·리포팅 | **미이행** — 9단계에서 하지 않았다. 도구 미정이라 지금은 화면 문구로만 알린다 |

### 2.6 Responsive

| 확인한 것 | 결과 |
|---|---|
| 좌우 여백·읽기 폭 규칙이 화면마다 복제됨 | **보완함** — `Screen`과 `usePagePadding()`에서만 정한다. compact·medium·expanded 세 단계를 모두 쓴다 |
| 가로 화면 | 확인함 — 가로에서 본문이 읽기 폭 안에서 가운데 정렬되고 늘어지지 않는다(`step8-02-home-landscape.png`). 캡처한 AVD에는 디스플레이 컷아웃이 없다 |
| 컷아웃 기기의 가로 여백 | **보완함**(코드) — `Screen`의 SafeArea에 좌우를 넣었다. 컷아웃 있는 기기에서의 확인은 미실행 |
| 글자 크기 200% | 확인함 — Step 8 골격 변경 뒤 다시 실행(`step8-03-home-200.png`) |
| 태블릿 실기기 | 미확인 — 지원 기기 범위가 미정이다(DESIGN_SYSTEM §13) |

---

## 3. 사람이 정해야 할 것

8단계에서 `9단계 전에 정해야 할 것`으로 적었으나 9단계에서 정해지지 않았다. 다섯 항목 모두 아직 열려 있다.

1. `android.package`·`scheme` — development build·딥링크·Google 로그인의 선행 조건
2. Google OAuth client id(앱·백엔드 쌍)
3. API.md §4.2 세션 응답을 실제 구현에 맞출지 여부
4. 지원 기기·최소 Android OS와 focus 표현 기준
5. SCREEN_STATES §11의 백엔드 공백(오프라인·polling 정책 포함)

---

## 4. 검증 기록

| 항목 | 결과 |
|---|---|
| `verify:tokens` · `lint` · `typecheck` · `export:android` | PASS (2026-09-23, 구조 변경 후 재실행). 9·10단계에서도 다시 실행해 PASS — 기록은 handoff `TASK-020` |
| Android 회귀 확인 | PASS — 로그인 → 입력 → 진행 → 첫 저장 → 홈까지 다시 실행. `step8-01-home-after-refactor.png` |
| 가로 화면 | PASS — `step8-02-home-landscape.png`(컷아웃 없는 AVD) |
| 글자 크기 200% | PASS — 골격 변경 뒤 다시 실행. `step8-03-home-200.png` |
| 세로 가운데 정렬 화면 | PASS — `step8-04-first-save-after-refactor.png` |
| 목록 화면(`scroll={false}`) | PASS — 임시 확인 화면에 60행 목록을 띄워 스크롤 확인. `step8-05-list-scroll.png` |
| 하드코딩 색·간격 | 센 범위는 `src/components/ui/**`·`src/features/**`·`src/app/**`이다(`src/prototypes/**` 제외 — 제품 화면이 아니다). 색은 없음. 값이 든 치수 리터럴은 `LoadingBlock`의 `minHeight: 120`과 `ProgressList`의 모듈 상수 `markerSize = 20` 2건이다. 두 값은 토큰으로 승격할지 정하지 않았고 **이 표가 유일한 기록이다**(DESIGN_SYSTEM §13에는 없다). 나머지는 `0` 리셋 5건(`borderWidth`·`padding`·`minHeight`·`flexShrink`)이라 토큰 우회가 아니다 |
