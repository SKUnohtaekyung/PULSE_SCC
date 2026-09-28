# TASK-013 — 프론트엔드 실행 기반

## Status

진행중 — 실행 골격·문서 동기화 완료, 네이티브 Android 검증·독립 리뷰 전

## Owner

`role:platform` — 미배정

## Branch

`chore/TASK-013-frontend-bootstrap`

## Goal

Expo Android 클라이언트의 실제 버전·routing·development build·검증 명령과 저장소 경계를 확정하고 재현 가능한 최소 프로젝트를 만든다.

관련 이슈: 생성 전
관련 요구사항: PRD FR-007, 기능명세 RESULT-005·AC-09

## Completed

- Expo 공식 기본 템플릿으로 `frontend/mobile`을 생성하고 학습용 화면·패키지를 제거했다.
- Expo SDK 57·React Native 0.86·React 19.2·TypeScript·Expo Router·npm lockfile을 고정했다.
- `expo-dev-client`, ESLint, typecheck, Android export 명령을 구성했다.
- Expo Router가 해석할 수 있는 최소 route와 부트스트랩 화면을 만들었다.
- ADR·아키텍처·프로젝트 계약·README·검증 절차를 실제 코드와 동기화했다.

## Changed

- `frontend/mobile/**` — Expo Android 클라이언트 실행 골격
- `docs/decisions/ADR-011-frontend-bootstrap.md` — 프론트엔드 실행 결정
- `docs/architecture/ARCHITECTURE.md` — 실제 frontend 경계 반영
- `docs/design/DESIGN_SYSTEM.md` — 토큰·공용 UI 예정 경로 확정
- `docs/product/PRD.md`, `docs/product/requirements/GUEST_ANALYSIS_FUNCTIONAL_SPEC.md` — 해결된 Expo 질문 반영
- `AGENTS.md`, `.claude/skills/verify/SKILL.md`, `.gitignore`, `README.md` — 실행·검증·상태 동기화

## Decisions

1. `frontend/mobile`에 npm lockfile 기반 Expo 프로젝트를 둔다.
2. Expo Router의 `src/app`은 route만 소유한다.
3. Expo Go가 아니라 `expo-dev-client` development build를 기준으로 한다.
4. native 폴더는 CNG 생성물로 두고 커밋하지 않는다.
5. web은 보조 미리보기이며 Android 완료 근거가 아니다.

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| install | `npx create-expo-app@latest ...`, `npx expo install ...` | PASS — package-lock 생성, 844 packages 설치 |
| lint | `npm run lint` | PASS |
| typecheck | `npm run typecheck` | PASS |
| Expo 진단 | `npx expo-doctor` | PASS — 21/21 checks |
| Android JS bundle | `npm run export:android` | PASS — Hermes `.hbc` export |
| dependency audit | `npm audit --audit-level=moderate` | FAIL — Expo 전이 의존성 moderate 14건, `--force`는 호환되지 않는 breaking downgrade 제안 |
| Android native build | `npm run android` | 미실행 — Android SDK·adb·emulator 없음 |
| Visual QA | 실제 Android 렌더링 | 미실행 — native 실행 환경 없음, 화면은 부트스트랩 전용 |
| 독립 Reviewer | — | 미실행 |

## Unresolved

1. Android Studio·SDK·에뮬레이터 또는 EAS Build 준비
2. 앱 package ID·서명·EAS 프로젝트·배포 환경
3. Expo 전이 의존성 moderate audit의 호환 업데이트
4. 디자인 토큰 실제 값·Pretendard 자산·공용 UI 구현
5. 최종 앱 아이콘·스플래시 자산
6. 최소 지원·검증 Android 기기 범위

## Do Not Assume

- Android bundle 성공은 APK build나 실기기 실행 성공이 아니다.
- 현재 `PULSE` 한 줄 화면과 Expo 기본 아이콘은 제품 UI가 아니다.
- `frontend/mobile/assets`의 아이콘은 임시 생성 자산이다.
- 앱 package ID와 EAS 연결은 설정하지 않았다.
- 디자인 토큰 경로는 정했지만 토큰 코드는 아직 없다.
- `npm audit fix --force`를 실행하면 Expo 호환 버전을 깨뜨릴 수 있다.
- `docs/product/**`와 `docs/design/**` 동기화는 소유 영역 밖 변경이므로 PR에서 `role:product`, `role:design-system` 리뷰가 필요하다.

## Next Action

`role:design-system` Task에서 `frontend/mobile/src/design/tokens/`에 색상·간격·타입·radius 토큰을 구현하고 대비와 실제 Android 렌더링 기준을 확정한다.

## Last Verified Commit

`07912cb` — Expo 실행 골격, 문서 동기화, lint·typecheck·Expo Doctor·Android bundle 검증을 기록한 커밋.
