package kr.co.scc.api.analysis.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.core.task.TaskExecutor;

class AnalysisJobQueueTests {

    private AnalysisRepository repository;
    private AnalysisJobRunner runner;
    private List<Runnable> submitted;
    private TaskExecutor executor;

    @BeforeEach
    void setUp() {
        repository = mock(AnalysisRepository.class);
        runner = mock(AnalysisJobRunner.class);
        submitted = new CopyOnWriteArrayList<>();
        executor = submitted::add;
    }

    private AnalysisJobQueue queue(int capacity) {
        return new AnalysisJobQueue(repository, runner, executor, capacity);
    }

    private void queueHolds(UUID... jobIds) {
        var responses = new java.util.ArrayDeque<UUID>(List.of(jobIds));
        when(repository.claimNextQueuedJob(any()))
                .thenAnswer(invocation ->
                        responses.isEmpty() ? Optional.empty() : Optional.of(responses.poll()));
    }

    private void queueIsEmpty() {
        when(repository.claimNextQueuedJob(any())).thenReturn(Optional.empty());
    }

    @Test
    void runsAClaimedJob() {
        UUID jobId = UUID.randomUUID();
        queueHolds(jobId);

        AnalysisJobQueue queue = queue(2);
        queue.poll();
        submitted.forEach(Runnable::run);

        verify(runner).runClaimed(jobId);
    }

    @Test
    void claimsWithALease() {
        queueIsEmpty();

        queue(2).poll();

        verify(repository).claimNextQueuedJob(AnalysisJobQueue.LEASE);
    }

    @Test
    void doesNothingWhenTheQueueIsEmpty() {
        queueIsEmpty();

        queue(2).poll();

        assertThat(submitted).isEmpty();
        verify(runner, never()).runClaimed(any());
    }

    @Test
    void stopsClaimingAtCapacity() {
        queueHolds(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID());

        AnalysisJobQueue queue = queue(2);
        queue.poll();

        // 실행을 끝내지 않은 상태이므로 정원 이상으로 집지 않는다.
        assertThat(submitted).hasSize(2);
        assertThat(queue.inFlightCount()).isEqualTo(2);
        verify(repository, times(2)).claimNextQueuedJob(any());
    }

    @Test
    void freesCapacityOnceAJobFinishes() {
        UUID first = UUID.randomUUID();
        queueHolds(first);

        AnalysisJobQueue queue = queue(1);
        queue.poll();
        assertThat(queue.inFlightCount()).isEqualTo(1);

        submitted.forEach(Runnable::run);

        assertThat(queue.inFlightCount()).isZero();
    }

    @Test
    void freesCapacityEvenWhenTheRunnerThrows() {
        UUID jobId = UUID.randomUUID();
        queueHolds(jobId);
        doThrow(new IllegalStateException("boom")).when(runner).runClaimed(jobId);

        AnalysisJobQueue queue = queue(1);
        queue.poll();
        for (Runnable task : submitted) {
            try {
                task.run();
            } catch (RuntimeException ignored) {
                // 큐가 정원을 돌려주는지만 본다.
            }
        }

        assertThat(queue.inFlightCount()).isZero();
    }

    /** 죽은 워커가 붙들던 작업을 같은 주기에 다시 집을 수 있도록 회수를 먼저 한다. */
    @Test
    void recoversAbandonedJobsBeforeClaiming() {
        queueIsEmpty();

        queue(2).poll();

        InOrder order = inOrder(repository);
        order.verify(repository).failExhaustedJobs(AnalysisJobQueue.MAX_ATTEMPTS);
        order.verify(repository).requeueExpiredLeases(AnalysisJobQueue.MAX_ATTEMPTS);
        order.verify(repository).claimNextQueuedJob(any());
    }

    @Test
    void usesTheSameAttemptLimitForRecoveryAndFailure() {
        queueIsEmpty();

        queue(2).poll();

        verify(repository).requeueExpiredLeases(AnalysisJobQueue.MAX_ATTEMPTS);
        verify(repository).failExhaustedJobs(AnalysisJobQueue.MAX_ATTEMPTS);
    }

    /** 폴링이 예외로 죽으면 큐 전체가 멈춘다. 예외를 삼키고 다음 주기를 기다려야 한다. */
    @Test
    void survivesARepositoryFailureDuringPolling() {
        when(repository.failExhaustedJobs(anyInt())).thenThrow(new IllegalStateException("db down"));

        queue(2).poll();

        assertThat(submitted).isEmpty();
    }

    @Test
    void releasesTheClaimWhenTheJobCannotBeSubmitted() {
        UUID jobId = UUID.randomUUID();
        queueHolds(jobId);
        TaskExecutor rejecting = task -> {
            throw new IllegalStateException("executor full");
        };

        AnalysisJobQueue queue = new AnalysisJobQueue(repository, runner, rejecting, 2);
        queue.poll();

        assertThat(queue.inFlightCount()).isZero();
        verify(repository).requeueForRetry(jobId, AnalysisJobQueue.MAX_ATTEMPTS);
    }

    @Test
    void heartbeatExtendsLeasesForInFlightJobsOnly() {
        UUID jobId = UUID.randomUUID();
        queueHolds(jobId);
        when(repository.extendLease(any(), any())).thenReturn(true);

        AnalysisJobQueue queue = queue(2);
        queue.poll();
        queue.heartbeat();

        verify(repository).extendLease(jobId, AnalysisJobQueue.LEASE);

        submitted.forEach(Runnable::run);
        queue.heartbeat();

        // 끝난 작업에는 더 이상 하트비트를 보내지 않는다.
        verify(repository, times(1)).extendLease(eq(jobId), any());
    }

    @Test
    void heartbeatKeepsGoingWhenOneJobFails() {
        queueHolds(UUID.randomUUID(), UUID.randomUUID());
        when(repository.extendLease(any(), any()))
                .thenThrow(new IllegalStateException("db down"))
                .thenReturn(true);

        AnalysisJobQueue queue = queue(2);
        queue.poll();
        queue.heartbeat();

        verify(repository, times(2)).extendLease(any(), any());
    }

    @Test
    void theLeaseOutlivesTheHeartbeatInterval() {
        // 하트비트가 한 번 실패해도 임대가 바로 끊기지 않아야 한다.
        assertThat(AnalysisJobQueue.LEASE).isGreaterThan(AnalysisJobQueue.HEARTBEAT_INTERVAL);
        assertThat(AnalysisJobQueue.MAX_ATTEMPTS).isGreaterThan(1);
    }
}
