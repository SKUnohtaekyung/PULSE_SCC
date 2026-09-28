package kr.co.scc.api.analysis.domain;

import java.util.UUID;

/**
 * 결과를 저장하려는 순간 작업이 더 이상 이 워커의 RUNNING 작업이 아닐 때 던진다.
 *
 * <p>임대가 끝나 작업이 실패로 마감됐거나 다시 큐에 들어간 경우다. 저장 트랜잭션 전체를
 * 되돌리고, 재시도하거나 실패로 바꾸지 않는다. 그 작업의 상태는 이미 다른 경로가 정했다.
 */
public class JobOwnershipLostException extends RuntimeException {

    public JobOwnershipLostException(UUID jobId) {
        super("Analysis job is no longer running: " + jobId);
    }
}
