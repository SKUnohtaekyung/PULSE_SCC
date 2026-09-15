# TASK-008 — 손님분석 기능명세·디자인·제품 결정 정합화

## Status

핵심 결과 IA와 PostgreSQL 기반 API·데이터 모델 초안 반영·검증 완료 — 역할별 리뷰·PR 전

## Owner

`role:product`

정합성을 위해 `docs/design/**`, `docs/architecture/**`, `docs/decisions/**`, `AGENTS.md`, `.gitignore`, `.claude/skills/verify/**`도 변경했다. PR 전에 `role:design-system`과 `role:platform` 리뷰가 필요하다.

## Branch

`docs/TASK-008-functional-spec`

## Goal

손님분석 상세 기능명세와 PULSE 디자인 기준을 저장소에 반영하고, 2026-09-12~13에 확정한 Android 앱·페르소나·기술 스택·이미지 생성·리뷰 기준·로그인·매장 입력·네이버 단일 출처·분석 저장 결정을 제품 정본과 관련 문서에 일관되게 반영한다.

## Completed

- `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` 신설
- PULSE 디자인 대조본에서 SCC MVP에 필요한 디자인 원칙과 이식 토큰 후보 반영
- PRD를 Android 앱 기준으로 변경
- 정상 결과의 상위 토픽·페르소나·이미지 3개와 유형 부족 부분 결과 요구 반영
- Expo 기반 React Native·TypeScript, Spring Boot, PostgreSQL, Python 스택 반영
- 페르소나 이미지 생성에 OpenAI API 사용 결정 반영
- 분석 유효 리뷰 최소 50건과 2년 초과 리뷰 정확성 우려 메시지 반영
- Google 소셜 로그인과 서비스 자체 로그인 반영
- 자체 로그인 필수 정보를 이메일 형식 아이디·비밀번호·전화번호로 한정
- 분석 필수 입력을 가게 이름·업종·네이버 가게 URL로 확정
- MVP 리뷰 출처를 네이버로 한정하고 카카오맵을 제외
- 기술 결정 ADR-003 작성
- 리뷰 출처 범위 결정 ADR-004 작성
- 계정당 분석 저장 1개와 첫 결과 자동 저장·저장본 교체 선택 정책 ADR-005 반영
- 로그인부터 결과 탐색·저장까지 핵심 사용자 플로우 7개 작성
- 홈·분석하기·마이페이지 하단 내비게이션과 승인된 마이페이지 항목 반영
- 앱 전체와 포디움 기반 결과 화면 IA를 확정·미정·제안으로 분리해 작성
- 결과 순서를 `분석 메타정보 → TOP3 포디움 → 선택 페르소나별 4관점`으로 확정
- 유효 토픽 3개 미만은 3칸 포디움의 부족한 슬롯을 비우고 근거 부족 메시지를 표시하도록 확정
- 대표 근거 1~2개 기본 노출, 사실·AI 해석 분리, 제안 기본·펼쳐보기 계층 확정
- 첫 분석 전 홈·하단 내비게이션 진입 제한과 `홈 → 분석하기 → 마이페이지` 순서 확정
- 마이페이지를 분석 인앱 알림·알림 설정·서비스 정보·로그아웃·현재 결과 이미지 최대 3개로 한정
- 프로젝트 계약, 아키텍처, README, `.gitignore`, verify 절차 동기화
- 기존 PULSE 기능명세·기술 아키텍처의 비동기 작업·Spring/Python 경계 패턴을 SCC 요구사항에 맞게 선별 반영
- Android 공개 API 초안과 표준 오류·작업 상태·결과·근거·저장·알림 계약을 `docs/architecture/API.md`에 작성
- MySQL·MongoDB 이중 저장 구조를 사용하지 않는 PostgreSQL 단일 논리 모델을 `docs/architecture/DATA_MODEL.md`에 작성
- 리뷰·작업·분석 결과까지 PostgreSQL 관계와 제한적 `jsonb`로 표현하고 계정당 저장 결과 1개를 제약으로 설계

## Changed

| 경로 | 이유 |
|---|---|
| `docs/product/PRD.md` | 제품 요구사항 정본 6차 결정 반영 |
| `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` | 상세 기능·상태·API 초안·인수 기준 동기화 |
| `docs/product/requirements/USER_FLOW.md` | 확정사항과 미정사항을 분리한 MVP 핵심 사용자 플로우 7개 기록 |
| `docs/product/requirements/RESULT_IA.md` | 앱 전체·결과 화면 IA와 최소 리뷰 수 제안·근거·충돌 기록 |
| `docs/design/DESIGN_SYSTEM.md` | Android·인증 흐름과 PULSE 디자인 기반 반영 |
| `docs/decisions/ADR-003-application-stack.md` | 기술 스택 결정과 미확정 세부사항 기록 |
| `docs/decisions/ADR-004-naver-only-review-source.md` | MVP 리뷰 출처를 네이버로 한정한 결정 기록 |
| `docs/decisions/ADR-005-analysis-storage-policy.md` | 첫 결과 자동 저장과 새 결과 교체·기존 결과 유지 정책 기록 |
| `docs/architecture/ARCHITECTURE.md` | 목표 시스템 구조와 호출 흐름 갱신 |
| `docs/architecture/API.md` | Android–Spring 공개 API와 Spring–Python 내부 경계 초안 신설 |
| `docs/architecture/DATA_MODEL.md` | PostgreSQL 단일 데이터베이스 논리 모델·제약·인덱스 초안 신설 |
| `AGENTS.md` | 제품 정의와 상위 스택 표 갱신 |
| `README.md` | 현재 제품·스택 상태 갱신 |
| `.gitignore` | Expo·Spring Boot·Python 산출물 제외 규칙 추가 |
| `.claude/skills/verify/SKILL.md` | 확정 스택별 실제 매니페스트 탐색 순서 반영 |

## Decisions

1. 제공 형태는 웹뷰가 아니라 Expo 기반 React Native·TypeScript Android 앱이다.
2. 근거가 확인되는 상위 토픽 3개를 선정하고 토픽별 페르소나를 1개씩 생성한다.
3. 도출된 모든 페르소나 이미지는 OpenAI API로 생성하며 P0 완료 조건으로 둔다. 정상 결과는 3개, 유형 부족 결과는 도출된 수만큼이다.
4. 메인 백엔드는 Spring Boot, DB는 PostgreSQL, AI·분석 처리는 Python이다.
5. 분석 유효 리뷰가 50건 미만이면 분석하지 않는다.
6. 분석 시점보다 2년 오래된 리뷰가 포함되면 정확성 우려 메시지를 표시한다.
7. Google 소셜 로그인과 서비스 자체 로그인을 모두 제공한다.
8. 중복·무효 제거 전 수집 원본 건수가 아니라 분석에 실제 사용하는 유효 리뷰 건수를 50건 판정 기준으로 해석했다.
9. 근거가 유효한 토픽이 3개보다 적으면 페르소나를 임의로 채우지 않고 3칸 포디움의 부족한 슬롯과 근거 부족 메시지로 표시한다.
10. 서비스 자체 로그인은 이메일 형식 아이디·비밀번호·전화번호만 필수로 받는다.
11. 분석 시작 전 가게 이름·업종·네이버 가게 URL을 필수로 받는다.
12. 1차 MVP는 네이버 공개 리뷰만 분석하고 카카오맵 리뷰는 제외한다.
13. 계정당 분석 결과는 최대 1개만 저장하며 첫 결과는 자동 저장한다.
14. 저장본이 있는 상태에서 새 분석이 완료되면 사용자가 새 결과로 교체하거나 기존 결과를 유지한다.
15. 하단 내비게이션은 홈·분석하기·마이페이지로 구성한다.
16. 마이페이지에는 알림·설정·로그아웃·페르소나 이미지 보관 공간을 둔다.
17. 결과는 분석 메타정보 다음 TOP3 포디움을 보여주고, 선택한 페르소나별 4관점을 표시한다.
18. 유효 토픽이 3개보다 적으면 3칸 포디움을 유지하고 부족한 슬롯을 비운 채 리뷰 근거 부족 메시지를 표시한다. 0개면 선택 콘텐츠를 표시하지 않는다.
19. 근거 리뷰는 대표 1~2개를 기본 노출하고 나머지는 전체 보기로 제공한다.
20. `리뷰에서 확인`과 `AI 해석`은 별도 카드·배지·제목으로 구분한다.
21. 제안은 리뷰 사실과 검토할 행동을 기본 노출하고 AI 해석·전문 지식은 펼쳐보기에 둔다.
22. 저장 결과가 없는 인증 사용자는 가게 입력으로 이동하며 첫 분석 완료 전에는 홈·하단 내비게이션에 진입하지 못한다.
23. 하단 내비게이션은 `홈 → 분석하기 → 마이페이지` 순서이고 가운데 분석하기를 강조한다.
24. 도출된 페르소나가 1개 이상이면 최초 1위를 선택한다.
25. 입력 오류·수집 및 분석 오류·결과 한계는 발생 단계에서 원인·현재 상태·다음 행동과 함께 표시한다.
26. 마이페이지는 분석 완료·실패 인앱 알림, 알림 설정·서비스 정보, 로그아웃, 현재 저장 결과 이미지 최대 3개만 제공한다.
27. 분석 알림은 기본으로 켜며, 끄면 이후 완료·실패 작업의 새 인앱 알림을 생성하지 않고 기존 이력은 유지한다.

## Verification

문서 작업이며 애플리케이션 코드와 실행 명령은 아직 없다.

| 검증 | 결과 |
|---|---|
| PRD 결정 키워드 | Android, Expo, TypeScript, Spring Boot, PostgreSQL, Python, OpenAI API, 50건, 2년, 로그인 반영 확인 |
| 요구사항 추적 | PRD FR-001~FR-012가 상세 기능명세에 모두 연결됨 |
| 상세 요구사항 ID | 79개, 중복 0 |
| 상대 링크 | 저장소 Markdown 42개 기준 깨진 링크 0 |
| stale 표현 | 가게 전체 4관점·내비게이션 순서 미정·첫 분석 진입 위치 미정·이미지 3개 고정 충돌 표현 0 |
| whitespace | `git diff --check` PASS |
| 코드 검증 | 없음 — 코드와 매니페스트 미생성 |
| Git 사용법 HTML 동기화 | 확인함 — 이번 변경은 Git 규칙·설정 변경이 아니므로 수정 불필요 |
| 결과 IA 독립 검토 | PASS — 0개 유형 경계조건, 부분 결과 이미지 조건, 추적표와 AC 보완 후 재검토 통과 |
| 제품 문서 커밋 | `0db8a05` — 사용자 결과 IA 결정 반영 |
| 상대 링크 | 저장소 Markdown 44개·로컬 링크 127개 기준 깨진 링크 0 |
| API JSON 예제 | 11개 블록 모두 `ConvertFrom-Json` 파싱 PASS |
| 실행 명령 탐색 | 매니페스트·wrapper·task runner·CI 없음 — 코드 검증 명령 없음 |
| API·PostgreSQL 독립 검토 | PASS — 교차 사용자 근거 연결 방지, 완료·첫 저장·알림 원자성, 알림 설정, 이미지 권한 보완 후 재검토 통과 |

## Unresolved

1. Expo SDK·React Native 버전과 development build 사용 여부
2. Spring Boot JVM 언어·버전·빌드 도구
3. Python 프레임워크와 Spring Boot 간 통신 방식
4. PostgreSQL 버전과 마이그레이션 도구
5. 전화번호의 용도(SMS 인증, 계정 복구, 연락처 저장 여부)와 가입·복구·탈퇴 정책
6. 인증 토큰 수명·회전·폐기 정책
7. OpenAI 이미지 모델·크기·비용·재시도 정책
8. 최소 Android OS와 지원 기기
9. 리뷰 작성일을 알 수 없을 때 2년 경고 처리
10. 원본 리뷰·분석 결과·인증 데이터 보관 및 삭제 기간
11. 허용 네이버 URL 도메인 목록
12. 주소·대표 메뉴·최근 이전·리뉴얼·업주 변경 시점의 선택 입력 여부
13. 비밀번호 규칙과 전화번호 중복 가입 정책
14. `기타` 업종 세부값 입력 여부
15. 이용약관·개인정보 처리 동의와 이력 보관 방식
16. 기존 결과 유지 시 미저장 새 결과의 세션 내 접근 범위·최대 보관 시간
17. 동시 분석 작업 수
18. 유형별 최소 리뷰 수를 별도로 도입할지
19. 가게 지정·분석 대기 화면의 세부 시각 구성
20. 포디움을 스크롤 중 상단에 붙이는 sticky 동작 여부
21. 실제 OpenAPI 작성 도구와 schema/types 생성 방향
22. Spring Boot와 Python 간 내부 HTTP 사용 여부, 인증·timeout·재시도 값
23. PostgreSQL schema/role 분리, migration 소유권과 보관·삭제 배치 방식
24. 저장 결과 없음과 진행 중 결과 조회 등 API 오류별 최종 HTTP 상태

## Do Not Assume

- [RESULT_IA.md](../../product/requirements/RESULT_IA.md)의 핵심 결과 계층은 확정됐지만 세부 화면 디자인과 남은 미정 항목은 구현값으로 추측하지 않는다.
- 정상 분석 결과의 손님 유형은 3개지만 유효 토픽이 3개보다 적으면 임의로 채우지 않는다. 3칸 포디움의 부족한 슬롯을 비우고 근거 부족 이유를 표시한다.
- `30~49건 경고 후 제공`, `30건 미만`, `유형당 10건 미만`은 제안(미확정)이다. 현재 PRD는 유효 리뷰 50건 미만이면 분석을 시작하지 않는다.
- 포디움 `고정`은 유형 전환 시 선택 영역을 유지한다는 뜻이다. 스크롤 중 sticky 동작은 확정하지 않았다.
- 하단 내비게이션 순서는 `홈 → 분석하기 → 마이페이지`다. 첫 분석 완료 전에는 표시하지 않는다.
- 마이페이지는 확정된 최소 기능만 구현한다. 홍보 알림·OS 푸시·별도 이미지 아카이브·개별 이미지 삭제를 추가하지 않는다.
- 현재 브랜치에는 제품·설계 문서만 있으며 애플리케이션 구현과 실행 검증은 미착수다.
- PR은 아직 만들지 않았다. `main`에 직접 push하지 말고 현재 브랜치에서 역할별 리뷰 후 PR 템플릿을 실제로 읽어 생성한다.

## Next Action

`role:product`·`role:design-system`·`role:platform` 리뷰를 받은 뒤 PR 템플릿을 읽고 `type:spec`, `role:product` 라벨로 PR을 만든다. 백엔드 구현 TASK는 Spring Boot 언어·빌드 도구, Python 통신 방식, PostgreSQL migration 도구를 먼저 결정한 뒤 `OpenAPI → migration → 인증/분석 작업 API → Python 분석 경계 → 저장·알림 API` 순서로 분리한다.

## Last Verified Commit

`8c4eaea` — 결과 IA 결정 반영 상태를 기록한 현재 작업의 기준 커밋. 이후 API·PostgreSQL 문서 변경은 아직 커밋하지 않았다.
