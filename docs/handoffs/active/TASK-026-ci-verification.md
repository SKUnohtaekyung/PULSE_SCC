# TASK-026 — 통합 CI 검증

## Status
리뷰 대기

## Owner
role:platform — Codex

## Branch
chore/TASK-026-ci-verification

## Goal
PR과 main push마다 Spring, Python, 모바일 프론트엔드의 정본 검증 명령을 자동 실행해 회귀를 조기에 차단한다.
관련 이슈: 미생성
관련 요구사항: `AGENTS.md` 9장

## Completed
- Spring build와 Testcontainers 통합 테스트를 포함하는 CI job을 추가했다.
- Python Ruff·format·pytest job을 추가했다.
- 프론트엔드 디자인 토큰·lint·typecheck·Android export job을 추가했다.
- workflow 권한을 `contents: read`로 제한하고 중복 실행 취소를 설정했다.

## Changed
- `.github/workflows/verify.yml` — PR/main 통합 검증 workflow

## Decisions
- 세 스택을 독립 job으로 나눠 병렬 실행하고 실패 원인을 스택별로 식별할 수 있게 한다.
- 공식 action의 2026-10-01 현재 사용 예시와 맞춰 checkout/setup-python/setup-node v7, setup-java v6를 사용한다.
- 테스트가 실제 Docker가 있는 GitHub-hosted runner에서 수행되므로 Spring Testcontainers 테스트도 skip 없이 실행될 것으로 기대하지만, 최초 원격 실행 전에는 PASS로 기록하지 않는다.

## Verification
**실제로 실행한 것만 적는다.** 실행하지 않았으면 `미실행` 이라고 쓴다.
| 검증 | 명령 | 결과 |
|---|---|---|
| lint | Ruff check·format, `npm --prefix frontend/mobile run lint` | PASS — Ruff 21 files, Expo lint 오류 0 |
| typecheck | `npm --prefix frontend/mobile run typecheck` | PASS |
| test | Spring build 내 test, `python -m pytest backend/python-analysis` | PASS — Spring 116 tests/0 failures/26 skipped, Python 166 passed |
| build | `.\backend\spring-api\gradlew.bat -p backend\spring-api build`, `npm --prefix frontend/mobile run export:android` | PASS |
| design token | `npm --prefix frontend/mobile run verify:tokens` | PASS |
| Visual QA | 해당 없음 | 해당 없음 |
| GitHub Actions | `Verify` workflow | 미실행 — PR 생성 전 |

## Unresolved
- GitHub 인증이 없어 이 브랜치의 PR 생성과 최초 원격 workflow 실행 확인은 아직 할 수 없다.

## Do Not Assume
- workflow 파일이 존재한다는 사실만으로 CI가 PASS한 것은 아니다. 최초 원격 실행 결과를 별도로 확인해야 한다.

## Next Action
GitHub 인증 복구 후 PR을 만들고 최초 `Verify` workflow가 세 job 모두 통과하는지 확인한다.

## Last Verified Commit
미커밋 — 검증 완료 후 기록
