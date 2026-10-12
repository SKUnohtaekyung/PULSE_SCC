# TASK-032 — 분석 중간 진행 단계 전달

## Status

리뷰 대기. 구현을 마치고 실제 분석 한 번에서 단계가 넘어가는 것을 확인했다. Docker를 켜고 Spring 통합 테스트까지 통과했고 독립 검토 PASS를 받았다.

## Owner

role:feature — 오해서 (`role` 배정은 미정, `AGENTS.md` 5장)

## Branch

`feat/TASK-032-analysis-progress-steps` — `ui/TASK-031-analysis-progress`의 `3068257` 위에서 갈라졌다. TASK-031([TASK-031](TASK-031-analysis-progress.md), [SKUnohtaekyung/PULSE_SCC#45](https://github.com/SKUnohtaekyung/PULSE_SCC/pull/45))은 2026-10-09에 `main`으로 병합됐으므로 이 브랜치가 `main`에 더하는 것은 서버 변경과 문서뿐이다. 서버 코드는 TASK-031의 화면 변경과 겹치는 파일이 없다.

## Goal

분석이 도는 몇 분 동안 앱에 `네이버 리뷰 수집 중`(36%)만 보이던 것을 고친다. 서버가 분석·이미지 생성 단계도 알려 주게 한다(2026-10-09 사용자 요청).

관련 이슈: 미생성(사용자의 구두 요청으로 시작했고 이슈를 만들지 않았다)
관련 요구사항: PRD §8 Non-Functional Requirements의 진행 표시("수집·분석이 1초를 넘으면 진행 상태를 표시한다"), API.md 5.2 `progressStep`, SCREEN_STATES §5

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
| Python test | `python -m pytest` | PASS — `171 passed, 1 warning`(캐시 폴더 쓰기 경고) |
| Spring test | `gradlew.bat test` — 커밋 `50386d2`의 깨끗한 체크아웃(V4·V6 임시 파일 없음), Docker 29.8.0 실행 중 | PASS — `BUILD SUCCESSFUL in 2m 10s`, 121개, 건너뜀 0, 실패 0. 이번에 더한 `updateProgressStep` 통합 테스트 2개 포함. Docker가 꺼진 첫 실행에서는 통합 테스트 28개가 건너뛰어졌다 |
| Spring build | 미실행 | |
| 실제 동작 | 두 서버를 새 코드로 다시 띄우고 에뮬레이터 앱에서 운산국밥 분석 1회 | PASS — 앱 화면이 7초 `네이버 리뷰 수집 중`(36%) → 54초 `반복되는 손님 경험 분석 중`(68%) → 195초 `손님 유형 이미지 생성 중`(90%) → 230초 결과 미리보기로 바뀜(4초 간격 관찰) |
| 독립 검토 | `reviewer` 서브에이전트 | PASS — 코드에 차단 결함 없음. PR 전 조건(이 문서의 낡은 테스트 결과, API.md 5.2 예시 문구, TASK-031 선병합)을 반영했다 |

## Unresolved

- **같은 작업이 Python에서 두 번 도는 동안 단계 표시가 섞일 수 있다.** Python은 단계를 작업 ID로만 기억한다. Spring 쪽 요청이 끊겨 재시도가 시작됐는데 앞선 요청이 Python에서 아직 돌고 있으면, 앞선 요청이 쓴 단계가 보이거나 앞선 요청이 끝나며 새 요청의 단계를 지울 수 있다. 저장 결과와 작업 소유권은 깨지지 않고 표시만 잠깐 어긋난다(reviewer 판독, 재현하지 않음). 요청마다 표식을 함께 두면 막을 수 있다.
- `fetchProgressStep`은 실패를 로그 없이 삼킨다. 토큰 불일치나 분석 서비스 오류로 단계가 넘어가지 않을 때 원인을 볼 방법이 없다. 이 메서드와 Python `pipeline.py`의 단계 기록 연결에는 단위 테스트가 없고 실제 분석 1회로만 확인됐다.
- 스케줄 작업(`poll`·`heartbeat`·`syncProgress`)이 스레드 하나를 나눠 쓴다(프로젝트에 스케줄러 스레드 설정이 없다). 분석 서비스가 응답 없이 매달리면 진행 조회가 주기마다 몇 초씩 그 스레드를 잡는다. 임대 2분·하트비트 30초라 임대 연장을 놓칠 정도는 아니라고 판단했다(실측하지 않음).
- `updateProgressStep`이 끝난 작업(`COMPLETED`·`FAILED`)을 건드리지 않는다는 것은 SQL 조건으로만 보장되고 테스트가 없다.
- 분석 단계가 전체의 절반 넘게 걸린다(위 실행에서 약 140초). 그동안 화면은 68%에 머문다. 더 잘게 나누려면 모델 호출을 쪼개야 한다.
- 재시도로 다시 큐에 들어가면 단계가 `QUEUED`로 돌아가지만 앱의 퍼센트는 이미 본 최고값에 머문다(앱은 본 단계 중 가장 높은 값을 쓴다). 사용자에게 재시도 중임을 따로 알리지 않는다.
- Python 프로세스가 여러 개면 진행 조회가 다른 프로세스로 가 `404`가 날 수 있다. 지금은 프로세스 하나로 띄운다.
- `docs/product/requirements/SCREEN_STATES.md` §5의 "2026-09-21 원격 백엔드 코드는 `QUEUED → COLLECTING_REVIEWS → COMPLETED | FAILED`만 기록한다"는 서술을 고치지 않았다(`role:product` 소유). `docs/handoffs/active/TASK-012-analysis-pipeline.md`의 "알려진 한계"에 적힌 같은 내용도 이번에 풀렸으나 그 문서는 고치지 않았다.

## Do Not Assume

- 테스트가 `BUILD SUCCESSFUL`이어도 통합 테스트가 돌았다고 가정하지 않는다. 건너뛴 수를 확인한다.
- 서버 코드를 고친 뒤에는 Spring과 Python을 모두 다시 띄워야 한다.

## Next Action

- 위 Unresolved의 단계 섞임과 로그 없는 실패를 손볼지 정한다. `SCREEN_STATES.md` §5의 낡은 서술은 `[SPEC]` 이슈로 넘긴다.

## Last Verified Commit

`50386d2`. Python·Spring 테스트는 그 커밋의 소스로 실행했다. 그 뒤의 커밋은 문서(이 문서와 `docs/architecture/API.md`)만 고쳤다.
