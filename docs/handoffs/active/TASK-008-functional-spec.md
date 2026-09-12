# TASK-008 — 손님분석 기능명세·디자인·제품 결정 정합화

## Status

문서 반영 완료 — PRD 4차 결정 검증·커밋 완료, PR·리뷰 전

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
- 상위 토픽 3개와 토픽별 페르소나·이미지 총 3개 요구 반영
- Expo 기반 React Native·TypeScript, Spring Boot, PostgreSQL, Python 스택 반영
- 페르소나 이미지 생성에 OpenAI API 사용 결정 반영
- 분석 유효 리뷰 최소 50건과 2년 초과 리뷰 정확성 우려 메시지 반영
- Google 소셜 로그인과 서비스 자체 로그인 반영
- 자체 로그인 필수 정보를 이메일 형식 아이디·비밀번호·전화번호로 한정
- 분석 필수 입력을 가게 이름·업종·네이버 가게 URL로 확정
- MVP 리뷰 출처를 네이버로 한정하고 카카오맵을 제외
- 기술 결정 ADR-003 작성
- 리뷰 출처 범위 결정 ADR-004 작성
- 계정당 분석 저장 1개와 일회성 결과 정책 ADR-005 작성
- 프로젝트 계약, 아키텍처, README, `.gitignore`, verify 절차 동기화

## Changed

| 경로 | 이유 |
|---|---|
| `docs/product/PRD.md` | 제품 요구사항 정본 4차 결정 반영 |
| `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` | 상세 기능·상태·API 초안·인수 기준 동기화 |
| `docs/design/DESIGN_SYSTEM.md` | Android·인증 흐름과 PULSE 디자인 기반 반영 |
| `docs/decisions/ADR-003-application-stack.md` | 기술 스택 결정과 미확정 세부사항 기록 |
| `docs/decisions/ADR-004-naver-only-review-source.md` | MVP 리뷰 출처를 네이버로 한정한 결정 기록 |
| `docs/decisions/ADR-005-analysis-storage-policy.md` | 계정당 저장 1개와 세션 한정 일회성 결과 기록 |
| `docs/architecture/ARCHITECTURE.md` | 목표 시스템 구조와 호출 흐름 갱신 |
| `AGENTS.md` | 제품 정의와 상위 스택 표 갱신 |
| `README.md` | 현재 제품·스택 상태 갱신 |
| `.gitignore` | Expo·Spring Boot·Python 산출물 제외 규칙 추가 |
| `.claude/skills/verify/SKILL.md` | 확정 스택별 실제 매니페스트 탐색 순서 반영 |

## Decisions

1. 제공 형태는 웹뷰가 아니라 Expo 기반 React Native·TypeScript Android 앱이다.
2. 근거가 확인되는 상위 토픽 3개를 선정하고 토픽별 페르소나를 1개씩 생성한다.
3. 세 페르소나 이미지는 모두 OpenAI API로 생성하며 P0 완료 조건으로 둔다.
4. 메인 백엔드는 Spring Boot, DB는 PostgreSQL, AI·분석 처리는 Python이다.
5. 분석 유효 리뷰가 50건 미만이면 분석하지 않는다.
6. 분석 시점보다 2년 오래된 리뷰가 포함되면 정확성 우려 메시지를 표시한다.
7. Google 소셜 로그인과 서비스 자체 로그인을 모두 제공한다.
8. 중복·무효 제거 전 수집 원본 건수가 아니라 분석에 실제 사용하는 유효 리뷰 건수를 50건 판정 기준으로 해석했다.
9. 근거가 유효한 토픽이 3개보다 적으면 페르소나를 임의로 채우지 않고 분석 불충분 상태로 처리한다.
10. 서비스 자체 로그인은 이메일 형식 아이디·비밀번호·전화번호만 필수로 받는다.
11. 분석 시작 전 가게 이름·업종·네이버 가게 URL을 필수로 받는다.
12. 1차 MVP는 네이버 공개 리뷰만 분석하고 카카오맵 리뷰는 제외한다.
13. 계정당 분석 결과는 최대 1개만 저장한다.
14. 저장본이 있어도 추가 분석은 가능하지만 새 결과는 현재 로그인 세션에서만 확인하고 재로그인 시 삭제한다.

## Verification

문서 작업이며 애플리케이션 코드와 실행 명령은 아직 없다.

| 검증 | 결과 |
|---|---|
| PRD 결정 키워드 | Android, Expo, TypeScript, Spring Boot, PostgreSQL, Python, OpenAI API, 50건, 2년, 로그인 반영 확인 |
| 요구사항 추적 | PRD FR-001~FR-011이 상세 기능명세에 모두 연결됨 |
| 상세 요구사항 ID | 67개, 중복 0 |
| 상대 링크 | 변경 문서 기준 깨진 링크 0 |
| stale 표현 | 현재 정본 영역을 웹뷰로 정의하거나 로그인 제외·최소 리뷰 TBD로 정의한 표현 0 |
| whitespace | `git diff --check` PASS |
| 코드 검증 | 없음 — 코드와 매니페스트 미생성 |
| Git 사용법 HTML 동기화 | 확인함 — 이번 변경은 Git 규칙·설정 변경이 아니므로 수정 불필요 |

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
16. 첫 분석 자동 저장 또는 명시적 저장 선택
17. 기존 저장본 삭제·교체 허용 여부
18. 동시 분석 작업 수와 일회성 결과 최대 보관 시간

## Next Action

`role:product`, `role:design-system`, `role:platform` 리뷰 후 커밋하고 PR을 갱신한다. 이후 Expo·Spring Boot·Python 프로젝트를 만들기 전에 Unresolved 1~4를 결정한다.

## Last Verified Commit

`6460ea8` — PRD 4차 결정, 기능명세, ADR-003~005와 관련 문서 변경을 2026-09-13에 검증한 커밋.
