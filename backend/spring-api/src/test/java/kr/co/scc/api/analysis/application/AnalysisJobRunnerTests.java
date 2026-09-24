package kr.co.scc.api.analysis.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

class AnalysisJobRunnerTests {

    private AnalysisRepository repository;
    private AnalysisGateway gateway;
    private TransactionTemplate transactions;
    private AnalysisJobRunner runner;
    private UUID jobId;

    @BeforeEach
    void setUp() {
        repository = mock(AnalysisRepository.class);
        gateway = mock(AnalysisGateway.class);
        transactions = mock(TransactionTemplate.class);
        runner = new AnalysisJobRunner(repository, gateway, transactions);
        jobId = UUID.randomUUID();

        doAnswer(invocation -> {
            Consumer<TransactionStatus> action = invocation.getArgument(0);
            action.accept(null);
            return null;
        }).when(transactions).executeWithoutResult(any());
        when(transactions.execute(any())).thenAnswer(invocation -> {
            org.springframework.transaction.support.TransactionCallback<?> callback =
                    invocation.getArgument(0);
            return callback.doInTransaction(null);
        });
    }

    private void jobExists() {
        when(repository.findContext(jobId)).thenReturn(Optional.of(new JobContext(
                jobId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "테스트 식당",
                "한식",
                "https://map.naver.com/p/entry/place/123")));
    }

    private void gatewayFailsWith(String code, boolean retryable) {
        when(gateway.analyze(any())).thenThrow(new AnalysisException(
                HttpStatus.BAD_GATEWAY, code, "분석 서비스 오류", retryable));
    }

    @Test
    void aJobWithoutContextIsFailedWithoutCallingTheAnalysisService() {
        when(repository.findContext(jobId)).thenReturn(Optional.empty());

        runner.runClaimed(jobId);

        verify(repository).markFailed(jobId, "ANALYSIS_OUTPUT_INVALID", false);
        verifyNoInteractions(gateway);
    }

    @Test
    void analysisFailureAndNotificationAreWrittenInOneTransaction() {
        jobExists();
        gatewayFailsWith("COLLECTION_BLOCKED", false);

        runner.runClaimed(jobId);

        verify(transactions).executeWithoutResult(any());
        verify(repository).markFailed(jobId, "COLLECTION_BLOCKED", false);
    }

    @Test
    void aNonRetryableFailureIsNotPutBackOnTheQueue() {
        jobExists();
        gatewayFailsWith("INSUFFICIENT_VALID_REVIEWS", false);

        runner.runClaimed(jobId);

        verify(repository, never()).requeueForRetry(any(), anyInt());
        verify(repository).markFailed(jobId, "INSUFFICIENT_VALID_REVIEWS", false);
    }

    @Test
    void aRetryableFailureGoesBackOnTheQueue() {
        jobExists();
        gatewayFailsWith("REVIEW_COLLECTION_BLOCKED", true);
        when(repository.requeueForRetry(jobId, AnalysisJobQueue.MAX_ATTEMPTS)).thenReturn(true);

        runner.runClaimed(jobId);

        verify(repository).requeueForRetry(jobId, AnalysisJobQueue.MAX_ATTEMPTS);
        verify(repository, never()).markFailed(any(), any(), anyBooleanArg());
    }

    @Test
    void aRetryableFailureIsFailedOnceTheAttemptsAreUsedUp() {
        jobExists();
        gatewayFailsWith("REVIEW_COLLECTION_BLOCKED", true);
        when(repository.requeueForRetry(jobId, AnalysisJobQueue.MAX_ATTEMPTS)).thenReturn(false);

        runner.runClaimed(jobId);

        verify(repository).markFailed(jobId, "REVIEW_COLLECTION_BLOCKED", true);
    }

    @Test
    void anUnexpectedErrorIsTreatedAsRetryable() {
        jobExists();
        when(gateway.analyze(any())).thenThrow(new IllegalStateException("boom"));
        when(repository.requeueForRetry(eq(jobId), anyInt())).thenReturn(true);

        runner.runClaimed(jobId);

        verify(repository).requeueForRetry(jobId, AnalysisJobQueue.MAX_ATTEMPTS);
    }

    private static boolean anyBooleanArg() {
        return org.mockito.ArgumentMatchers.anyBoolean();
    }
}
