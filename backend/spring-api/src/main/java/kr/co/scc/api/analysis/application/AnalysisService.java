package kr.co.scc.api.analysis.application;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
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

    private static final int DEFAULT_EVIDENCE_PAGE_SIZE = 20;
    private static final int MAX_EVIDENCE_PAGE_SIZE = 120;
    private static final Set<String> CATEGORIES =
            Set.of("한식", "중식", "일식", "양식", "카페/디저트", "주점", "기타");

    private final AnalysisRepository repository;

    public AnalysisService(AnalysisRepository repository) {
        this.repository = repository;
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

    @Transactional(readOnly = true)
    public EvidencePage evidence(
            UUID userId,
            UUID analysisId,
            UUID personaId,
            String perspectiveValue,
            String cursorValue,
            Integer requestedLimit) {
        String perspective;
        try {
            perspective = EvidencePerspective.valueOf(perspectiveValue).name();
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw invalidEvidenceRequest("근거 리뷰 관점을 확인해 주세요.");
        }
        int limit = requestedLimit == null ? DEFAULT_EVIDENCE_PAGE_SIZE : requestedLimit;
        if (limit < 1 || limit > MAX_EVIDENCE_PAGE_SIZE) {
            throw invalidEvidenceRequest("근거 리뷰는 한 번에 1개 이상 120개 이하로 조회할 수 있습니다.");
        }
        if (!repository.ownsPersona(userId, analysisId, personaId)) {
            throw notFound();
        }
        EvidenceCursorCodec.Cursor cursor = cursorValue == null || cursorValue.isBlank()
                ? null
                : EvidenceCursorCodec.decode(cursorValue);
        List<AnalysisRepository.EvidenceRecord> records =
                repository.findEvidence(analysisId, personaId, perspective, cursor, limit + 1);
        boolean hasNext = records.size() > limit;
        List<AnalysisRepository.EvidenceRecord> page = hasNext
                ? records.subList(0, limit)
                : records;
        String nextCursor = hasNext
                ? EvidenceCursorCodec.encode(new EvidenceCursorCodec.Cursor(
                        page.getLast().sortOrder(), page.getLast().evidenceLinkId()))
                : null;
        List<EvidenceItem> items = page.stream()
                .map(record -> new EvidenceItem(
                        record.reviewId(),
                        record.excerpt(),
                        record.rating(),
                        record.writtenAt(),
                        record.platform()))
                .toList();
        return new EvidencePage(items, nextCursor);
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

    private static AnalysisException invalidEvidenceRequest(String message) {
        return new AnalysisException(
                HttpStatus.BAD_REQUEST, "INVALID_EVIDENCE_REQUEST", message, false);
    }

    public record SavedAnalysis(UUID analysisId, Instant savedAt) {
    }

    public record EvidencePage(List<EvidenceItem> items, String nextCursor) {
    }

    public record EvidenceItem(
            UUID reviewId,
            String excerpt,
            BigDecimal rating,
            LocalDate writtenAt,
            String platform) {
    }

    private enum EvidencePerspective {
        POSITIVE,
        NEGATIVE,
        PERCEPTION,
        PRIORITY,
        ADVICE
    }
}
