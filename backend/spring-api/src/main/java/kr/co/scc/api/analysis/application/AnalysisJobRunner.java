package kr.co.scc.api.analysis.application;

import java.util.UUID;

import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerRequest;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AnalysisJobRunner {

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

    @Async("analysisTaskExecutor")
    public void run(UUID jobId) {
        JobContext context = repository.findContext(jobId).orElse(null);
        if (context == null) {
            return;
        }
        repository.markRunning(jobId);
        try {
            WorkerResponse response = gateway.analyze(new WorkerRequest(
                    context.jobId().toString(),
                    context.storeName(),
                    context.category(),
                    context.naverPlaceUrl()));
            transactions.executeWithoutResult(status -> repository.saveCompleted(context, response));
        } catch (AnalysisException exception) {
            repository.markFailed(jobId, exception.code(), exception.retryable());
        } catch (RuntimeException exception) {
            repository.markFailed(jobId, "ANALYSIS_OUTPUT_INVALID", true);
        }
    }
}
