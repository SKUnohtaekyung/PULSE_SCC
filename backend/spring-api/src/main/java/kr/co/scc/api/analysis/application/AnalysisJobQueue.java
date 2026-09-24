package kr.co.scc.api.analysis.application;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 분석 작업을 데이터베이스 큐에서 집어 실행한다.
 *
 * <p>이전에는 작업 생성 직후 {@code @Async} 로 바로 실행했다. 처리 도중 서버가 재시작되면
 * 그 작업은 RUNNING 상태로 남은 채 아무도 다시 집어가지 않았고, 사용자에게는 영원히
 * "분석 중"으로 보였다. 이제 상태와 소유권을 모두 DB 가 가진다.
 *
 * <ul>
 *   <li>집기 — {@code FOR UPDATE SKIP LOCKED} 로 한 작업을 한 워커만 가져간다.
 *   <li>임대 — 집을 때 만료 시각을 찍고 처리 중에는 하트비트로 연장한다.
 *   <li>복구 — 임대가 끝난 작업은 워커가 죽은 것으로 보고 다시 큐에 넣는다.
 *       재시작 복구도 이 경로로 처리되므로 별도 기동 훅이 없다.
 *   <li>재시도 — 시도 횟수 상한을 넘으면 되살리지 않고 실패로 마무리한다.
 * </ul>
 */
@Component
public class AnalysisJobQueue {

    static final Duration LEASE = Duration.ofMinutes(2);
    static final Duration HEARTBEAT_INTERVAL = Duration.ofSeconds(30);

    /**
     * 한 작업을 최대 몇 번까지 시도할지.
     *
     * <p>수집과 모델 호출에 실제 비용이 드는 작업이라 무한 재시도는 두지 않는다.
     */
    static final int MAX_ATTEMPTS = 3;

    private static final Logger log = LoggerFactory.getLogger(AnalysisJobQueue.class);

    private final AnalysisRepository repository;
    private final AnalysisJobRunner runner;
    private final TaskExecutor executor;
    private final int capacity;

    /** 이 인스턴스가 지금 처리 중인 작업. 하트비트 대상이자 동시 실행 상한의 기준이다. */
    private final Set<UUID> inFlight = ConcurrentHashMap.newKeySet();

    @Autowired
    public AnalysisJobQueue(
            AnalysisRepository repository,
            AnalysisJobRunner runner,
            TaskExecutor analysisTaskExecutor) {
        this(repository, runner, analysisTaskExecutor, 2);
    }

    /** 정원을 지정해 만드는 테스트용 생성자. */
    AnalysisJobQueue(
            AnalysisRepository repository,
            AnalysisJobRunner runner,
            TaskExecutor executor,
            int capacity) {
        this.repository = repository;
        this.runner = runner;
        this.executor = executor;
        this.capacity = capacity;
    }

    /**
     * 버려진 작업을 회수하고 대기 중인 작업을 집어 실행한다.
     *
     * <p>회수를 먼저 한다. 죽은 워커가 붙들고 있던 작업이 같은 주기에 다시 실행될 수 있다.
     */
    @Scheduled(fixedDelayString = "${scc.analysis-service.poll-interval-ms:2000}")
    public void poll() {
        try {
            recoverAbandonedJobs();
            claimAndRun();
        } catch (RuntimeException exception) {
            // 폴링이 예외로 멈추면 큐 전체가 정지한다. 기록만 하고 다음 주기를 기다린다.
            log.error("분석 작업 폴링에 실패했습니다", exception);
        }
    }

    /** 처리 중인 작업의 임대를 연장해 다른 워커가 가져가지 않게 한다. */
    @Scheduled(fixedDelayString = "${scc.analysis-service.heartbeat-interval-ms:30000}")
    public void heartbeat() {
        for (UUID jobId : inFlight) {
            try {
                if (!repository.extendLease(jobId, LEASE)) {
                    // 이미 완료됐거나 다른 워커가 회수해 간 경우다.
                    log.debug("임대를 연장하지 못했습니다. jobId={}", jobId);
                }
            } catch (RuntimeException exception) {
                log.warn("임대 연장 중 오류가 발생했습니다. jobId={}", jobId, exception);
            }
        }
    }

    private void recoverAbandonedJobs() {
        int failed = repository.failExhaustedJobs(MAX_ATTEMPTS);
        if (failed > 0) {
            log.warn("재시도 횟수를 모두 쓴 분석 작업 {}건을 실패로 마감했습니다", failed);
        }
        int requeued = repository.requeueExpiredLeases(MAX_ATTEMPTS);
        if (requeued > 0) {
            log.info("임대가 만료된 분석 작업 {}건을 다시 큐에 넣었습니다", requeued);
        }
    }

    private void claimAndRun() {
        while (inFlight.size() < capacity) {
            Optional<UUID> claimed = repository.claimNextQueuedJob(LEASE);
            if (claimed.isEmpty()) {
                return;
            }
            UUID jobId = claimed.get();
            inFlight.add(jobId);
            try {
                executor.execute(() -> runClaimed(jobId));
            } catch (RuntimeException exception) {
                // 실행 큐에 넣지 못했으면 임대를 붙든 채 두지 않는다. 다음 주기가 회수한다.
                inFlight.remove(jobId);
                log.error("집어온 작업을 실행하지 못했습니다. jobId={}", jobId, exception);
                repository.requeueForRetry(jobId, MAX_ATTEMPTS);
                return;
            }
        }
    }

    private void runClaimed(UUID jobId) {
        try {
            runner.runClaimed(jobId);
        } finally {
            inFlight.remove(jobId);
        }
    }

    /** 테스트와 운영 점검용. 이 인스턴스가 처리 중인 작업 수. */
    public int inFlightCount() {
        return inFlight.size();
    }
}
