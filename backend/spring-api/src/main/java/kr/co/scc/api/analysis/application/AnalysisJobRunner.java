package kr.co.scc.api.analysis.application;

import java.util.UUID;

import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerRequest;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
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
    public void runClaimed(UUID jobId) {
        JobContext context = repository.findContext(jobId).orElse(null);
        if (context == null) {
            log.warn("집어온 작업의 정보를 찾지 못했습니다. jobId={}", jobId);
            markFailed(jobId, "ANALYSIS_OUTPUT_INVALID", false);
            return;
        }
        try {
            WorkerResponse response = gateway.analyze(new WorkerRequest(
                    context.jobId().toString(),
                    context.storeName(),
                    context.category(),
                    context.naverPlaceUrl()));
            transactions.executeWithoutResult(status -> repository.saveCompleted(context, response));
        } catch (AnalysisException exception) {
            finishFailure(jobId, exception.code(), exception.retryable());
        } catch (RuntimeException exception) {
            log.error("분석 작업 처리 중 예기치 못한 오류가 발생했습니다. jobId={}", jobId, exception);
            finishFailure(jobId, "ANALYSIS_OUTPUT_INVALID", true);
        }
    }

    private void finishFailure(UUID jobId, String errorCode, boolean retryable) {
        if (retryable && requeue(jobId)) {
            log.info("재시도 가능한 실패라 작업을 다시 큐에 넣었습니다. jobId={} code={}", jobId, errorCode);
            return;
        }
        markFailed(jobId, errorCode, retryable);
    }

    private boolean requeue(UUID jobId) {
        return Boolean.TRUE.equals(transactions.execute(
                status -> repository.requeueForRetry(jobId, AnalysisJobQueue.MAX_ATTEMPTS)));
    }

    private void markFailed(UUID jobId, String errorCode, boolean retryable) {
        transactions.executeWithoutResult(
                status -> repository.markFailed(jobId, errorCode, retryable));
    }
}
