-- V4가 적용되기 전에 RUNNING이었던 작업에는 임대 정보가 없다. 그대로 두면 새 poller가
-- 집지도, 만료 작업으로 회수하지도 못해 영구 정지하므로 안전하게 다시 대기열로 보낸다.
--
-- 이 보정은 배포 후 변경할 수 없는 기존 V4에 추가하지 않고 새 forward migration으로 둔다.
UPDATE analysis_jobs
SET status = 'QUEUED',
    progress_step = 'QUEUED',
    message_code = 'QUEUED',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'RUNNING'
  AND lease_expires_at IS NULL;
