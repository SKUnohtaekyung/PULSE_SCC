package kr.co.scc.api.analysis.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

import kr.co.scc.api.analysis.domain.AnalysisContracts.CreateJobCommand;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobCreated;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobStatus;
import kr.co.scc.api.analysis.infrastructure.AnalysisRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

@Service
public class AnalysisService {

    private static final Set<String> CATEGORIES =
            Set.of("한식", "중식", "일식", "양식", "카페/디저트", "주점", "기타");

    private final AnalysisRepository repository;
    private final AnalysisJobRunner runner;

    public AnalysisService(AnalysisRepository repository, AnalysisJobRunner runner) {
        this.repository = repository;
        this.runner = runner;
    }

    @Transactional
    public JobCreated create(UUID userId, String idempotencyKey, CreateJobCommand command) {
        String storeName = command.storeName().trim();
        if (storeName.isBlank() || !CATEGORIES.contains(command.category())) {
            throw new AnalysisException(
                    HttpStatus.BAD_REQUEST,
                    "INVALID_INPUT",
                    "가게 이름과 지원 업종을 확인해 주세요.",
                    false);
        }
        String normalizedUrl = NaverPlaceUrlPolicy.validate(command.naverPlaceUrl());
        String requestHash = requestHash(storeName, command.category(), normalizedUrl);
        AnalysisRepository.ExistingJob existing = repository
                .findByIdempotencyKey(userId, idempotencyKey)
                .orElse(null);
        if (existing != null) {
            if (!existing.requestHash().equals(requestHash)) {
                throw new AnalysisException(
                        HttpStatus.CONFLICT,
                        "IDEMPOTENCY_KEY_REUSED",
                        "같은 요청 키를 다른 가게 분석에 다시 사용할 수 없습니다.",
                        false);
            }
            return new JobCreated(
                    existing.jobId(),
                    existing.status(),
                    existing.progressStep(),
                    "기존 분석 요청 상태를 반환했습니다.",
                    existing.createdAt());
        }
        JobContext context = repository.insertJob(
                userId,
                idempotencyKey,
                requestHash,
                storeName,
                command.category(),
                normalizedUrl);
        return new JobCreated(
                context.jobId(),
                "QUEUED",
                "QUEUED",
                "분석 작업을 준비하고 있습니다.",
                Instant.now());
    }

    public void dispatch(UUID jobId) {
        runner.run(jobId);
    }

    public JobStatus status(UUID userId, UUID jobId) {
        return repository.findStatus(jobId, userId).orElseThrow(AnalysisService::notFound);
    }

    public JsonNode result(UUID userId, UUID jobId) {
        JobStatus status = status(userId, jobId);
        if (!"COMPLETED".equals(status.status())) {
            throw new AnalysisException(
                    HttpStatus.CONFLICT,
                    "ANALYSIS_NOT_COMPLETED",
                    "분석이 아직 완료되지 않았습니다.",
                    status.retryable());
        }
        return repository.findResultByJob(jobId, userId).orElseThrow(AnalysisService::notFound);
    }

    public JsonNode savedResult(UUID userId) {
        return repository.findSavedResult(userId).orElseThrow(() -> new AnalysisException(
                HttpStatus.NOT_FOUND,
                "SAVED_ANALYSIS_NOT_FOUND",
                "저장된 분석 결과가 없습니다.",
                false));
    }

    @Transactional
    public SavedAnalysis replaceSavedResult(UUID userId, UUID analysisId) {
        if (!repository.replaceSavedResult(userId, analysisId)) {
            throw notFound();
        }
        return new SavedAnalysis(analysisId, Instant.now());
    }

    private static String requestHash(String storeName, String category, String url) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest((storeName + "\n" + category + "\n" + url)
                            .getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static AnalysisException notFound() {
        return new AnalysisException(
                HttpStatus.NOT_FOUND, "ANALYSIS_NOT_FOUND", "분석 작업을 찾을 수 없습니다.", false);
    }

    public record SavedAnalysis(UUID analysisId, Instant savedAt) {
    }
}
