-- 분석 작업을 내구성 있는 큐로 처리하기 위한 임대(lease) 컬럼.
--
-- 이전에는 작업 생성 직후 @Async 로 바로 실행했다. 그래서 처리 도중 서버가 재시작되면
-- 그 작업은 RUNNING 상태로 영원히 남고 아무도 다시 집어가지 않았다.
-- 이제 워커가 작업을 집을 때 임대 만료 시각을 찍고 주기적으로 갱신한다.
-- 임대가 만료된 RUNNING 작업은 워커가 죽은 것으로 보고 다시 큐에 넣거나 실패 처리한다.

ALTER TABLE analysis_jobs
    ADD COLUMN lease_expires_at timestamptz,
    ADD COLUMN last_heartbeat_at timestamptz;

-- V1~V3에서는 RUNNING 작업에 임대 정보가 없었다. 그대로 두면 새 poller가 집지도,
-- 만료 작업으로 회수하지도 못해 영구 정지하므로 배포 시 안전하게 다시 대기열로 보낸다.
UPDATE analysis_jobs
SET status = 'QUEUED',
    progress_step = 'QUEUED',
    message_code = 'QUEUED',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'RUNNING';

-- 집어갈 작업을 고를 때 쓰는 인덱스. QUEUED 행만 담아 작게 유지한다.
CREATE INDEX ix_analysis_jobs_queued_created
    ON analysis_jobs (created_at)
    WHERE status = 'QUEUED';

-- 임대가 만료된 작업을 찾을 때 쓰는 인덱스.
CREATE INDEX ix_analysis_jobs_running_lease
    ON analysis_jobs (lease_expires_at)
    WHERE status = 'RUNNING';
