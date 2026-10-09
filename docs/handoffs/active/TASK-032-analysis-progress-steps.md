# TASK-032 — 분석 중간 진행 단계 전달

## Status

진행중. 구현을 마치고 실제 분석 한 번에서 단계가 넘어가는 것을 확인했다. Spring 통합 테스트는 Docker가 꺼져 있어 실행되지 않았다. 독립 검토 전이다. PR은 만들지 않았다.

## Owner

role:feature — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`feat/TASK-032-analysis-progress-steps` — `ui/TASK-031-analysis-progress`([TASK-031](TASK-031-analysis-progress.md)) 위에서 갈라졌다. 서버 코드는 TASK-031의 화면 변경과 겹치는 파일이 없다. 2026-10-09에 푸시했다.

## Goal

분석이 도는 몇 분 동안 앱에 `네이버 리뷰 수집 중`(36%)만 보이던 것을 고친다. 서버가 분석·이미지 생성 단계도 알려 주게 한다(2026-10-09 사용자 요청).

관련 이슈: 미생성
관련 요구사항: PRD의 진행 표시 요구, API.md 5.2 `progressStep`, SCREEN_STATES §5

## Completed

- Python이 처리 중인 작업의 단계를 기억하고 `GET /internal/v1/analysis-jobs/{jobId}/progress`로 알려 준다. 단계는 그 일을 시작하기 직전에 기록한다: 리뷰 수집 → 분석 → 이미지 생성.
- Spring이 처리 중인 작업마다 3초 간격으로 단계를 물어 `analysis_jobs.progress_step`에 옮긴다.
- 공개 작업 상태 응답의 `message`에 `ANALYZING`·`GENERATING_IMAGE` 문구를 더했다. `COLLECTING_REVIEWS` 문구는 "수집하고 분석하고 있습니다"에서 "수집하고 있습니다"로 고쳤다.

## Changed

- `backend/python-analysis/src/scc_analysis/analysis/progress.py` — 신규. 작업별 현재 단계(프로세스 메모리)
- `backend/python-analysis/src/scc_analysis/analysis/pipeline.py`, `openai_analyzer.py` — 단계 시작 지점에서 기록
- `backend/python-analysis/src/scc_analysis/api/analysis.py` — 진행 단계 조회 endpoint, 작업이 끝나면 단계 지움
- `backend/python-analysis/tests/test_analysis_api.py` — 테스트 5개 추가
- `backend/spring-api/.../analysis/infrastructure/AnalysisGateway.java` — `fetchProgressStep`
- `backend/spring-api/.../analysis/infrastructure/AnalysisConfiguration.java` — 진행 조회용 `RestClient`(제한 시간 2초)
- `backend/spring-api/.../analysis/infrastructure/AnalysisRepository.java` — `updateProgressStep`, 단계 문구
- `backend/spring-api/.../analysis/application/AnalysisJobQueue.java` — `syncProgress` 주기 작업. 생성자에 `AnalysisGateway` 추가
- `backend/spring-api/src/test/.../AnalysisJobQueueTests.java`, `AnalysisApiIntegrationTests.java` — 테스트 추가
- `docs/architecture/API.md` 5.2, 9장 — 실제로 오는 단계와 내부 진행 조회

## Decisions

- **Spring이 Python에 묻는다(폴링).** Python이 Spring으로 알리는 방식은 Spring에 새 내부 endpoint와 인증이 필요하다. 분석 요청이 결과가 나올 때까지 응답하지 않는 지금 구조에서는 Spring이 이미 처리 중인 작업 목록(`inFlight`)을 갖고 있어 묻는 쪽이 고칠 곳이 적다. ADR로 남기지 않았다.
- **실제로 구분되는 세 단계만 보낸다.** 리뷰 정리는 수집 안에서 끝나고, 검토할 행동은 분석과 같은 모델 호출에서 나온다. 따로 구분할 수 없는 단계(`PREPROCESSING`·`GENERATING_ADVICE`·`VALIDATING_RESULT`)는 지어내지 않았다.
- **DB 마이그레이션이 없다.** `progress_step` CHECK 제약(V1)이 이미 이 값들을 허용한다.
- Spring은 Python이 보낸 값 중 `COLLECTING_REVIEWS`·`ANALYZING`·`GENERATING_IMAGE`만 받는다. 그 시도가 작업을 소유하고 있을 때만 바꾼다(`attempt_count` 일치).

## Verification

| 검증 | 명령 | 결과 |
|---|---|---|
| Python lint | `python -m ruff check --no-cache .` (`backend/python-analysis`) | PASS — `All checks passed!` |
| Python format | `python -m ruff format --check --no-cache .` | PASS — `22 files already formatted` |
| Python test | `python -m pytest -q` | PASS — 실패 없음. 캐시 폴더 쓰기 경고 1건 |
| Spring test | `gradlew.bat test` (`backend/spring-api`) | 부분 — `BUILD SUCCESSFUL`, 121개 중 실패 0, **28개 건너뜀**. Docker가 꺼져 있어 Testcontainers를 쓰는 통합 테스트가 돌지 않았다. 이번에 더한 `updateProgressStep` 통합 테스트 2개도 여기에 들어 있다 |
| Spring build | 미실행 | |
| 실제 동작 | 두 서버를 새 코드로 다시 띄우고 에뮬레이터 앱에서 운산국밥 분석 1회 | PASS — 앱 화면이 7초 `네이버 리뷰 수집 중`(36%) → 54초 `반복되는 손님 경험 분석 중`(68%) → 195초 `손님 유형 이미지 생성 중`(90%) → 230초 결과 미리보기로 바뀜(4초 간격 관찰) |
| 독립 검토 | 미실행 | |

## Unresolved

- `updateProgressStep`의 SQL은 실제 분석 1회로만 확인됐다. 통합 테스트 2개(오래된 시도 거부, 허용 밖 값 거부, 같은 값 재기록 안 함)는 Docker를 켜고 돌려야 한다.
- 분석 단계가 전체의 절반 넘게 걸린다(위 실행에서 약 140초). 그동안 화면은 68%에 머문다. 더 잘게 나누려면 모델 호출을 쪼개야 한다.
- 재시도로 다시 큐에 들어가면 단계가 `QUEUED`로 돌아가지만 앱의 퍼센트는 이미 본 최고값에 머문다(앱은 본 단계 중 가장 높은 값을 쓴다). 사용자에게 재시도 중임을 따로 알리지 않는다.
- Python 프로세스가 여러 개면 진행 조회가 다른 프로세스로 가 `404`가 날 수 있다. 지금은 프로세스 하나로 띄운다.
- `docs/product/requirements/SCREEN_STATES.md` §5의 "2026-09-21 원격 백엔드 코드는 `QUEUED → COLLECTING_REVIEWS → COMPLETED | FAILED`만 기록한다"는 서술을 고치지 않았다(`role:product` 소유).

## Do Not Assume

- 테스트가 `BUILD SUCCESSFUL`이어도 통합 테스트가 돌았다고 가정하지 않는다. 건너뛴 수를 확인한다.
- 서버 코드를 고친 뒤에는 Spring과 Python을 모두 다시 띄워야 한다.

## Next Action

- Docker를 켜고 Spring 테스트를 다시 돌린 뒤 `reviewer` 검토를 받고 PR을 만든다.

## Last Verified Commit

이 문서를 담은 커밋. Python·Spring 테스트는 이 커밋의 소스로 실행했다(Spring 통합 테스트 28개는 건너뜀).
