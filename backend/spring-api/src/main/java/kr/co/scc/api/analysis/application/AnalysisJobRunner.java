package kr.co.scc.api.analysis.application;

import java.util.UUID;

import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerRequest;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
import kr.co.scc.api.analysis.domain.JobOwnershipLostException;
import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository.ClaimedJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 큐에서 집어온 분석 작업 하나를 실행한다.
 *
 * <p>작업을 집고 임대를 관리하는 일은 {@link AnalysisJobQueue} 가 한다. 여기서는 이미
 * RUNNING 으로 확정된 작업의 본 처리만 맡는다.
 */
@Service
public class AnalysisJobRunner {

    private static final Logger log = LoggerFactory.getLogger(AnalysisJobRunner.class);

    private final AnalysisRepository repository;
    private final AnalysisGateway gateway;
    private final TransactionTemplate transactions;

    public AnalysisJobRunner(
            AnalysisRepository repository,
            AnalysisGateway gateway,
            TransactionTemplate transactions) {
        this.repository = repository;
        this.gateway = gateway;
        this.transactions = transactions;
    }

    /**
     * 큐가 이미 RUNNING 으로 집어온 작업을 처리한다.
     *
     * <p>재시도 가능한 실패는 시도 횟수가 남아 있으면 다시 큐에 넣는다. 남아 있지 않거나
     * 재시도해도 결과가 같은 실패는 그대로 실패로 마감한다.
     */
    public void runClaimed(ClaimedJob claim) {
        UUID jobId = claim.jobId();
        JobContext context = repository.findContext(jobId).orElse(null);
        if (context == null) {
            log.warn("집어온 작업의 정보를 찾지 못했습니다. jobId={}", jobId);
            markFailed(claim, "ANALYSIS_OUTPUT_INVALID");
            return;
        }
        try {
            WorkerResponse response = gateway.analyze(new WorkerRequest(
                    context.jobId().toString(),
                    context.storeName(),
                    context.category(),
                    context.naverPlaceUrl()));
            transactions.executeWithoutResult(status -> repository.saveCompleted(claim, context, response));
        } catch (JobOwnershipLostException exception) {
            // 임대가 끝나 이 작업은 이미 실패로 마감됐거나 다른 시도로 넘어갔다. 결과는 버리고
            // 상태도 건드리지 않는다. 다시 넣거나 실패로 바꾸면 다른 경로의 결정을 덮어쓴다.
            log.warn("작업 소유권을 잃어 분석 결과를 저장하지 않았습니다. jobId={}", jobId);
        } catch (AnalysisException exception) {
            finishFailure(claim, exception.code(), exception.retryable(), exception.validReviewCount());
        } catch (RuntimeException exception) {
            log.error("분석 작업 처리 중 예기치 못한 오류가 발생했습니다. jobId={}", jobId, exception);
            finishFailure(claim, "ANALYSIS_OUTPUT_INVALID", true, null);
        }
    }

    private void finishFailure(
            ClaimedJob claim, String errorCode, boolean retryable, Integer validReviewCount) {
        UUID jobId = claim.jobId();
        if (!retryable) {
            if (validReviewCount == null) {
                markFailed(claim, errorCode);
            } else {
                transactions.executeWithoutResult(
                        status -> repository.markFailed(claim, errorCode, validReviewCount));
            }
            return;
        }
        if (requeue(claim)) {
            log.info("재시도 가능한 실패라 작업을 다시 큐에 넣었습니다. jobId={} code={}", jobId, errorCode);
            return;
        }
        // 재시도할 수 있는 실패인데 다시 넣지 못했다. 시도 횟수를 다 썼거나, 임대가 끝나
        // 이 작업이 이미 다른 워커에게 넘어간 경우다.
        boolean closed = Boolean.TRUE.equals(transactions.execute(status -> repository.markRetryExhausted(
                claim, errorCode, AnalysisJobQueue.MAX_ATTEMPTS)));
        if (closed) {
            log.warn("재시도 횟수를 모두 써서 실패로 마감했습니다. jobId={} code={}", jobId, errorCode);
        } else {
            log.warn("다시 넣지 못했지만 시도 횟수가 남았거나 이미 끝난 작업이라 그대로 둡니다. jobId={} code={}",
                    jobId, errorCode);
        }
    }

    private boolean requeue(ClaimedJob claim) {
        return Boolean.TRUE.equals(transactions.execute(
                status -> repository.requeueForRetry(claim, AnalysisJobQueue.MAX_ATTEMPTS)));
    }

    private void markFailed(ClaimedJob claim, String errorCode) {
        transactions.executeWithoutResult(
                status -> repository.markFailed(claim, errorCode));
    }
}
