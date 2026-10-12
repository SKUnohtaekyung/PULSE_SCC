package kr.co.scc.api.analysis.application;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository.ClaimedJob;
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
    private final AnalysisGateway gateway;
    private final TaskExecutor executor;
    private final int capacity;

    /**
     * 이 인스턴스가 지금 처리 중인 작업과 그 실행 수. 하트비트 대상이다.
     *
     * <p>임대가 끝난 작업을 같은 인스턴스가 다시 집으면 한 작업이 두 번 실행될 수 있다. 집합으로
     * 두면 먼저 끝난 실행이 ID 를 지워 남은 실행의 하트비트와 정원 계산이 빠지므로 실행 수를 센다.
     */
    private final ConcurrentHashMap<ClaimedJob, Boolean> inFlight = new ConcurrentHashMap<>();
    /** 동시 실행 상한의 기준. */
    private final AtomicInteger running = new AtomicInteger();

    @Autowired
    public AnalysisJobQueue(
            AnalysisRepository repository,
            AnalysisJobRunner runner,
            AnalysisGateway gateway,
            TaskExecutor analysisTaskExecutor) {
        this(repository, runner, gateway, analysisTaskExecutor, 2);
    }

    /** 정원을 지정해 만드는 테스트용 생성자. */
    AnalysisJobQueue(
            AnalysisRepository repository,
            AnalysisJobRunner runner,
            AnalysisGateway gateway,
            TaskExecutor executor,
            int capacity) {
        this.repository = repository;
        this.runner = runner;
        this.gateway = gateway;
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
        for (ClaimedJob claim : inFlight.keySet()) {
            try {
                if (!repository.extendLease(claim, LEASE)) {
                    // 이미 완료됐거나 다른 워커가 회수해 간 경우다.
                    log.debug("임대를 연장하지 못했습니다. jobId={} attempt={}",
                            claim.jobId(), claim.attemptCount());
                }
            } catch (RuntimeException exception) {
                log.warn("임대 연장 중 오류가 발생했습니다. jobId={} attempt={}",
                        claim.jobId(), claim.attemptCount(), exception);
            }
        }
    }

    /**
     * 처리 중인 작업이 지금 어느 단계인지 분석 서비스에 물어 작업 상태에 옮긴다.
     *
     * <p>분석 요청은 결과가 나올 때까지 몇 분 동안 응답이 없다. 이 조회가 없으면 사용자에게는
     * 그동안 '리뷰 수집 중'만 보인다. 단계를 알아내지 못하면 마지막으로 확인한 단계를 그대로 둔다.
     */
    @Scheduled(fixedDelayString = "${scc.analysis-service.progress-interval-ms:3000}")
    public void syncProgress() {
        for (ClaimedJob claim : inFlight.keySet()) {
            try {
                gateway.fetchProgressStep(claim.jobId())
                        .ifPresent(step -> repository.updateProgressStep(claim, step));
            } catch (RuntimeException exception) {
                log.warn("진행 단계를 옮기지 못했습니다. jobId={} attempt={}",
                        claim.jobId(), claim.attemptCount(), exception);
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
        while (running.get() < capacity) {
            Optional<ClaimedJob> claimed = repository.claimNextQueuedJob(LEASE);
            if (claimed.isEmpty()) {
                return;
            }
            ClaimedJob claim = claimed.get();
            track(claim);
            try {
                executor.execute(() -> runClaimed(claim));
            } catch (RuntimeException exception) {
                // 실행 큐에 넣지 못했으면 임대를 붙든 채 두지 않는다. 다음 주기가 회수한다.
                untrack(claim);
                log.error("집어온 작업을 실행하지 못했습니다. jobId={} attempt={}",
                        claim.jobId(), claim.attemptCount(), exception);
                repository.requeueForRetry(claim, MAX_ATTEMPTS);
                return;
            }
        }
    }

    private void runClaimed(ClaimedJob claim) {
        try {
            runner.runClaimed(claim);
        } finally {
            untrack(claim);
        }
    }

    private void track(ClaimedJob claim) {
        inFlight.put(claim, true);
        running.incrementAndGet();
    }

    private void untrack(ClaimedJob claim) {
        if (inFlight.remove(claim) != null) {
            running.decrementAndGet();
        }
    }

    /** 테스트와 운영 점검용. 이 인스턴스가 처리 중인 작업 수. */
    public int inFlightCount() {
        return running.get();
    }
}
