package kr.co.scc.api.analysis.application;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

class AnalysisJobRunnerTests {

    @Test
    void duplicateDispatchStopsWhenAnotherRunnerAlreadyClaimedTheJob() {
        AnalysisRepository repository = mock(AnalysisRepository.class);
        AnalysisGateway gateway = mock(AnalysisGateway.class);
        TransactionTemplate transactions = mock(TransactionTemplate.class);
        UUID jobId = UUID.randomUUID();
        JobContext context = new JobContext(
                jobId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "테스트 식당",
                "한식",
                "https://map.naver.com/p/entry/place/123");
        when(repository.findContext(jobId)).thenReturn(Optional.of(context));
        when(repository.markRunning(jobId)).thenReturn(false);

        new AnalysisJobRunner(repository, gateway, transactions).run(jobId);

        verify(repository).markRunning(jobId);
        verifyNoInteractions(gateway, transactions);
    }

    @Test
    void analysisFailureAndNotificationAreWrittenInOneTransaction() {
        AnalysisRepository repository = mock(AnalysisRepository.class);
        AnalysisGateway gateway = mock(AnalysisGateway.class);
        TransactionTemplate transactions = mock(TransactionTemplate.class);
        UUID jobId = UUID.randomUUID();
        JobContext context = new JobContext(
                jobId,
                UUID.randomUUID(),
                UUID.randomUUID(),
                "테스트 식당",
                "한식",
                "https://map.naver.com/p/entry/place/123");
        when(repository.findContext(jobId)).thenReturn(Optional.of(context));
        when(repository.markRunning(jobId)).thenReturn(true);
        when(gateway.analyze(any())).thenThrow(new AnalysisException(
                HttpStatus.BAD_GATEWAY,
                "COLLECTION_BLOCKED",
                "수집이 차단되었습니다.",
                false));
        doAnswer(invocation -> {
            Consumer<TransactionStatus> action = invocation.getArgument(0);
            action.accept(null);
            return null;
        }).when(transactions).executeWithoutResult(any());

        new AnalysisJobRunner(repository, gateway, transactions).run(jobId);

        verify(transactions).executeWithoutResult(any());
        verify(repository).markFailed(jobId, "COLLECTION_BLOCKED", false);
    }
}
