package kr.co.scc.api.analysis.infrastructure;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.analysis.domain.AnalysisContracts.JobContext;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobError;
import kr.co.scc.api.analysis.domain.AnalysisContracts.JobStatus;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerAdvice;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerEvidence;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerImage;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerInsight;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerPersona;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerReview;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Repository
public class AnalysisRepository {

    private final JdbcClient jdbc;
    private final ObjectMapper objectMapper;
    private final PersonaImageStorage imageStorage;

    public AnalysisRepository(JdbcClient jdbc, ObjectMapper objectMapper, PersonaImageStorage imageStorage) {
        this.jdbc = jdbc;
        this.objectMapper = objectMapper;
        this.imageStorage = imageStorage;
    }

    public Optional<ExistingJob> findByIdempotencyKey(UUID userId, String idempotencyKey) {
        return jdbc.sql("""
                        SELECT id, request_hash, status, progress_step, created_at
                        FROM analysis_jobs
                        WHERE user_id = :userId AND idempotency_key = :idempotencyKey
                        """)
                .param("userId", userId)
                .param("idempotencyKey", idempotencyKey)
                .query((rs, rowNum) -> new ExistingJob(
                        rs.getObject("id", UUID.class),
                        rs.getString("request_hash"),
                        rs.getString("status"),
                        rs.getString("progress_step"),
                        rs.getObject("created_at", OffsetDateTime.class).toInstant()))
                .optional();
    }

    public JobContext insertJob(
            UUID userId,
            String idempotencyKey,
            String requestHash,
            String storeName,
            String category,
            String naverPlaceUrl) {
        UUID storeId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO stores (id, name, category, naver_place_url)
                        VALUES (:id, :name, :category, :url)
                        """)
                .param("id", storeId)
                .param("name", storeName)
                .param("category", category)
                .param("url", naverPlaceUrl)
                .update();
        jdbc.sql("""
                        INSERT INTO analysis_jobs (
                            id, user_id, store_id, idempotency_key, request_hash,
                            status, progress_step, message_code
                        ) VALUES (
                            :id, :userId, :storeId, :idempotencyKey, :requestHash,
                            'QUEUED', 'QUEUED', 'ANALYSIS_QUEUED'
                        )
                        """)
                .param("id", jobId)
                .param("userId", userId)
                .param("storeId", storeId)
                .param("idempotencyKey", idempotencyKey)
                .param("requestHash", requestHash)
                .update();
        return new JobContext(jobId, userId, storeId, storeName, category, naverPlaceUrl);
    }

    public Optional<JobContext> findContext(UUID jobId) {
        return jdbc.sql("""
                        SELECT j.id, j.user_id, j.store_id, s.name, s.category, s.naver_place_url
                        FROM analysis_jobs j
                        JOIN stores s ON s.id = j.store_id
                        WHERE j.id = :jobId
                        """)
                .param("jobId", jobId)
                .query((rs, rowNum) -> new JobContext(
                        rs.getObject("id", UUID.class),
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("store_id", UUID.class),
                        rs.getString("name"),
                        rs.getString("category"),
                        rs.getString("naver_place_url")))
                .optional();
    }

    public Optional<JobStatus> findStatus(UUID jobId, UUID userId) {
        return jdbc.sql("""
                        SELECT j.id, j.status, j.progress_step, j.message_code,
                               j.error_code, j.retryable, j.created_at, j.updated_at,
                               a.id AS analysis_id
                        FROM analysis_jobs j
                        LEFT JOIN analyses a ON a.job_id = j.id
                        WHERE j.id = :jobId AND j.user_id = :userId
                        """)
                .param("jobId", jobId)
                .param("userId", userId)
                .query(this::mapStatus)
                .optional();
    }

    public void markRunning(UUID jobId) {
        jdbc.sql("""
                        UPDATE analysis_jobs
                        SET status = 'RUNNING', progress_step = 'COLLECTING_REVIEWS',
                            message_code = 'COLLECTING_REVIEWS', started_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP, attempt_count = attempt_count + 1
                        WHERE id = :jobId AND status = 'QUEUED'
                        """)
                .param("jobId", jobId)
                .update();
    }

    public void markFailed(UUID jobId, String code, boolean retryable) {
        jdbc.sql("""
                        UPDATE analysis_jobs
                        SET status = 'FAILED', progress_step = 'FAILED', message_code = 'ANALYSIS_FAILED',
                            error_code = :code, retryable = :retryable,
                            completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :jobId AND status IN ('QUEUED', 'RUNNING')
                        """)
                .param("jobId", jobId)
                .param("code", code)
                .param("retryable", retryable)
                .update();
        jdbc.sql("""
                        INSERT INTO notifications (id, user_id, job_id, type, message_code)
                        SELECT :id, j.user_id, j.id, 'ANALYSIS_FAILED', 'ANALYSIS_FAILED'
                        FROM analysis_jobs j
                        JOIN notification_settings s ON s.user_id = j.user_id
                        WHERE j.id = :jobId AND j.status = 'FAILED'
                          AND s.analysis_result_enabled = true
                        ON CONFLICT (job_id, type) DO NOTHING
                        """)
                .param("id", UUID.randomUUID())
                .param("jobId", jobId)
                .update();
    }

    public UUID saveCompleted(JobContext context, WorkerResponse response) {
        UUID analysisId = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO analyses (
                            id, job_id, user_id, store_id, collected_review_count, valid_review_count,
                            contains_old_reviews, schema_version, model_versions, limitations,
                            collected_at, analyzed_at
                        ) VALUES (
                            :id, :jobId, :userId, :storeId, :collected, :valid,
                            :containsOld, :schemaVersion,
                            CAST(:modelVersions AS jsonb), CAST(:limitations AS jsonb),
                            :collectedAt, :analyzedAt
                        )
                        """)
                .param("id", analysisId)
                .param("jobId", context.jobId())
                .param("userId", context.userId())
                .param("storeId", context.storeId())
                .param("collected", response.collectedReviewCount())
                .param("valid", response.validReviewCount())
                .param("containsOld", response.containsOldReviews())
                .param("schemaVersion", response.schemaVersion())
                .param("modelVersions", writeJson(response.modelVersions()))
                .param("limitations", writeJson(response.analysis().limitations()))
                .param("collectedAt", utc(response.collectedAt()))
                .param("analyzedAt", utc(response.analyzedAt()))
                .update();

        List<UUID> reviewIds = insertReviews(context, analysisId, response);
        Map<Integer, PublicPersona> personas = insertPersonas(analysisId, response, reviewIds);
        String publicPayload = writeJson(buildPublicResult(context, analysisId, response, personas));
        jdbc.sql("""
                        INSERT INTO analysis_result_documents (analysis_id, payload)
                        VALUES (:analysisId, CAST(:payload AS jsonb))
                        """)
                .param("analysisId", analysisId)
                .param("payload", publicPayload)
                .update();

        jdbc.sql("""
                        INSERT INTO saved_analyses (user_id, analysis_id)
                        VALUES (:userId, :analysisId)
                        ON CONFLICT (user_id) DO NOTHING
                        """)
                .param("userId", context.userId())
                .param("analysisId", analysisId)
                .update();
        jdbc.sql("""
                        INSERT INTO notification_settings (user_id)
                        VALUES (:userId)
                        ON CONFLICT (user_id) DO NOTHING
                        """)
                .param("userId", context.userId())
                .update();
        jdbc.sql("""
                        INSERT INTO notifications (id, user_id, job_id, type, message_code)
                        SELECT :id, :userId, :jobId, 'ANALYSIS_COMPLETED', 'ANALYSIS_COMPLETED'
                        FROM notification_settings
                        WHERE user_id = :userId AND analysis_result_enabled = true
                        ON CONFLICT (job_id, type) DO NOTHING
                        """)
                .param("id", UUID.randomUUID())
                .param("userId", context.userId())
                .param("jobId", context.jobId())
                .update();
        jdbc.sql("""
                        UPDATE analysis_jobs
                        SET status = 'COMPLETED', progress_step = 'COMPLETED',
                            message_code = 'ANALYSIS_COMPLETED', retryable = false,
                            completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :jobId AND status = 'RUNNING'
                        """)
                .param("jobId", context.jobId())
                .update();
        return analysisId;
    }

    public Optional<JsonNode> findResultByJob(UUID jobId, UUID userId) {
        return jdbc.sql("""
                        SELECT d.payload
                        FROM analysis_result_documents d
                        JOIN analyses a ON a.id = d.analysis_id
                        WHERE a.job_id = :jobId AND a.user_id = :userId
                        """)
                .param("jobId", jobId)
                .param("userId", userId)
                .query((rs, rowNum) -> readJson(rs.getString("payload")))
                .optional();
    }

    public Optional<JsonNode> findSavedResult(UUID userId) {
        return jdbc.sql("""
                        SELECT d.payload
                        FROM saved_analyses s
                        JOIN analysis_result_documents d ON d.analysis_id = s.analysis_id
                        WHERE s.user_id = :userId
                        """)
                .param("userId", userId)
                .query((rs, rowNum) -> readJson(rs.getString("payload")))
                .optional();
    }

    public boolean replaceSavedResult(UUID userId, UUID analysisId) {
        return jdbc.sql("""
                        INSERT INTO saved_analyses (user_id, analysis_id, saved_at)
                        SELECT :userId, a.id, CURRENT_TIMESTAMP
                        FROM analyses a
                        WHERE a.id = :analysisId AND a.user_id = :userId
                        ON CONFLICT (user_id) DO UPDATE
                        SET analysis_id = EXCLUDED.analysis_id, saved_at = EXCLUDED.saved_at
                        """)
                .param("userId", userId)
                .param("analysisId", analysisId)
                .update() == 1;
    }

    public Optional<ImageRecord> findImage(UUID imageId, UUID userId) {
        return jdbc.sql("""
                        SELECT i.storage_key, i.alt_text
                        FROM persona_images i
                        JOIN personas p ON p.id = i.persona_id
                        JOIN analyses a ON a.id = p.analysis_id
                        WHERE i.id = :imageId AND a.user_id = :userId AND i.status = 'COMPLETED'
                        """)
                .param("imageId", imageId)
                .param("userId", userId)
                .query((rs, rowNum) -> new ImageRecord(
                        rs.getString("storage_key"), rs.getString("alt_text")))
                .optional();
    }

    private List<UUID> insertReviews(JobContext context, UUID analysisId, WorkerResponse response) {
        List<UUID> ids = new ArrayList<>();
        for (WorkerReview review : response.reviews()) {
            UUID reviewId = UUID.randomUUID();
            ids.add(reviewId);
            jdbc.sql("""
                            INSERT INTO reviews (
                                id, job_id, analysis_id, platform, content, normalized_content,
                                rating, written_at, collected_at, content_hash
                            ) VALUES (
                                :id, :jobId, :analysisId, 'NAVER', :content, :normalized,
                                :rating, :writtenAt, :collectedAt, :contentHash
                            )
                            """)
                    .param("id", reviewId)
                    .param("jobId", context.jobId())
                    .param("analysisId", analysisId)
                    .param("content", review.content())
                    .param("normalized", review.normalizedContent())
                    .param("rating", review.rating())
                    .param("writtenAt", review.writtenAt())
                    .param("collectedAt", utc(response.collectedAt()))
                    .param("contentHash", review.contentHash())
                    .update();
        }
        return ids;
    }

    private Map<Integer, PublicPersona> insertPersonas(
            UUID analysisId, WorkerResponse response, List<UUID> reviewIds) {
        Map<Integer, PublicPersona> result = new LinkedHashMap<>();
        for (WorkerPersona persona : response.analysis().personas()) {
            UUID personaId = UUID.randomUUID();
            jdbc.sql("""
                            INSERT INTO personas (
                                id, analysis_id, rank, topic_review_count, label, summary, caveat
                            ) VALUES (:id, :analysisId, :rank, :count, :label, :summary, :caveat)
                            """)
                    .param("id", personaId)
                    .param("analysisId", analysisId)
                    .param("rank", persona.rank())
                    .param("count", persona.topicReviewCount())
                    .param("label", persona.label())
                    .param("summary", persona.summary())
                    .param("caveat", persona.caveat())
                    .update();

            Map<String, PublicInsight> insights = new LinkedHashMap<>();
            for (WorkerInsight insight : persona.insights()) {
                UUID insightId = UUID.randomUUID();
                jdbc.sql("""
                                INSERT INTO insights (
                                    id, persona_id, analysis_id, kind,
                                    review_fact, ai_interpretation, sort_order
                                ) VALUES (
                                    :id, :personaId, :analysisId, :kind,
                                    :reviewFact, :interpretation, 0
                                )
                                """)
                        .param("id", insightId)
                        .param("personaId", personaId)
                        .param("analysisId", analysisId)
                        .param("kind", insight.kind())
                        .param("reviewFact", insight.reviewFact())
                        .param("interpretation", insight.aiInterpretation())
                        .update();
                List<Map<String, Object>> evidence = insertEvidence(
                        analysisId, reviewIds, insight.evidence(), insightId, null, response.reviews());
                insights.put(insight.kind(), new PublicInsight(insightId, insight, evidence));
            }

            List<PublicAdvice> advice = new ArrayList<>();
            for (int index = 0; index < persona.advice().size(); index++) {
                WorkerAdvice item = persona.advice().get(index);
                UUID adviceId = UUID.randomUUID();
                jdbc.sql("""
                                INSERT INTO advice (
                                    id, persona_id, analysis_id, review_fact,
                                    suggested_action, ai_interpretation, sort_order
                                ) VALUES (
                                    :id, :personaId, :analysisId, :reviewFact,
                                    :action, :interpretation, :sortOrder
                                )
                                """)
                        .param("id", adviceId)
                        .param("personaId", personaId)
                        .param("analysisId", analysisId)
                        .param("reviewFact", item.reviewFact())
                        .param("action", item.suggestedAction())
                        .param("interpretation", item.aiInterpretation())
                        .param("sortOrder", index)
                        .update();
                List<Map<String, Object>> evidence = insertEvidence(
                        analysisId, reviewIds, item.evidence(), null, adviceId, response.reviews());
                advice.add(new PublicAdvice(adviceId, item, evidence));
            }

            WorkerImage workerImage = response.images().stream()
                    .filter(image -> image.rank() == persona.rank())
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Missing persona image"));
            UUID imageId = UUID.randomUUID();
            String storageKey = imageStorage.save(analysisId, imageId, workerImage.contentBase64());
            jdbc.sql("""
                            INSERT INTO persona_images (
                                id, persona_id, storage_key, alt_text,
                                style_version, model_version, status
                            ) VALUES (
                                :id, :personaId, :storageKey, :altText,
                                'pulse-editorial-v1', 'configured-openai-image-model', 'COMPLETED'
                            )
                            """)
                    .param("id", imageId)
                    .param("personaId", personaId)
                    .param("storageKey", storageKey)
                    .param("altText", persona.imageAltText())
                    .update();
            result.put(
                    persona.rank(),
                    new PublicPersona(personaId, imageId, persona, insights, advice));
        }
        return result;
    }

    private List<Map<String, Object>> insertEvidence(
            UUID analysisId,
            List<UUID> reviewIds,
            List<WorkerEvidence> evidence,
            UUID insightId,
            UUID adviceId,
            List<WorkerReview> reviews) {
        List<Map<String, Object>> publicEvidence = new ArrayList<>();
        for (int index = 0; index < evidence.size(); index++) {
            WorkerEvidence item = evidence.get(index);
            UUID reviewId = reviewIds.get(item.reviewIndex());
            jdbc.sql("""
                            INSERT INTO evidence_links (
                                id, analysis_id, review_id, insight_id, advice_id, excerpt, sort_order
                            ) VALUES (
                                :id, :analysisId, :reviewId, :insightId, :adviceId, :excerpt, :sortOrder
                            )
                            """)
                    .param("id", UUID.randomUUID())
                    .param("analysisId", analysisId)
                    .param("reviewId", reviewId)
                    .param("insightId", insightId)
                    .param("adviceId", adviceId)
                    .param("excerpt", item.excerpt())
                    .param("sortOrder", index)
                    .update();
            WorkerReview review = reviews.get(item.reviewIndex());
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("reviewId", reviewId.toString());
            preview.put("excerpt", item.excerpt());
            preview.put("writtenAt", review.writtenAt());
            publicEvidence.add(preview);
        }
        return publicEvidence;
    }

    private Map<String, Object> buildPublicResult(
            JobContext context,
            UUID analysisId,
            WorkerResponse response,
            Map<Integer, PublicPersona> personas) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("analysisId", analysisId.toString());
        root.put("jobId", context.jobId().toString());
        root.put("store", Map.of(
                "name", context.storeName(),
                "category", context.category(),
                "naverPlaceUrl", context.naverPlaceUrl()));
        root.put("metadata", Map.of(
                "platform", "NAVER",
                "collectedReviewCount", response.collectedReviewCount(),
                "validReviewCount", response.validReviewCount(),
                "collectedAt", response.collectedAt().toString(),
                "analyzedAt", response.analyzedAt().toString(),
                "containsReviewsOlderThanTwoYears", response.containsOldReviews(),
                "modelVersions", response.modelVersions()));
        List<Map<String, String>> limitations = response.analysis().limitations().stream()
                .map(message -> Map.of("code", "ANALYSIS_LIMITATION", "message", message))
                .toList();
        root.put("limitations", limitations);

        List<Map<String, Object>> podium = new ArrayList<>();
        for (int rank = 1; rank <= 3; rank++) {
            PublicPersona persona = personas.get(rank);
            if (persona == null) {
                podium.add(Map.of(
                        "rank", rank,
                        "status", "EMPTY",
                        "reason", Map.of(
                                "code", "INSUFFICIENT_TOPIC_EVIDENCE",
                                "message", "분석에 활용할 리뷰 근거가 부족해 손님 유형을 채우지 않았습니다.")));
            } else {
                podium.add(publicPersona(persona));
            }
        }
        root.put("podium", podium);
        return root;
    }

    private Map<String, Object> publicPersona(PublicPersona value) {
        WorkerPersona persona = value.worker();
        Map<String, Object> perspectives = new LinkedHashMap<>();
        for (Map.Entry<String, PublicInsight> entry : value.insights().entrySet()) {
            PublicInsight item = entry.getValue();
            perspectives.put(entry.getKey().toLowerCase(), Map.of(
                    "reviewFacts", List.of(Map.of(
                            "id", item.id().toString(), "text", item.worker().reviewFact())),
                    "aiInterpretations", List.of(Map.of(
                            "id", item.id().toString(), "text", item.worker().aiInterpretation())),
                    "evidencePreview", item.evidence(),
                    "evidenceCount", item.evidence().size()));
        }
        List<Map<String, Object>> advice = value.advice().stream()
                .map(item -> Map.<String, Object>of(
                        "id", item.id().toString(),
                        "reviewFact", item.worker().reviewFact(),
                        "suggestedAction", item.worker().suggestedAction(),
                        "details", Map.of(
                                "aiInterpretation", item.worker().aiInterpretation(),
                                "knowledgeReferences", List.of()),
                        "evidencePreview", item.evidence()))
                .toList();
        Map<String, Object> publicPersona = new LinkedHashMap<>();
        publicPersona.put("id", value.id().toString());
        publicPersona.put("label", persona.label());
        publicPersona.put("summary", persona.summary());
        publicPersona.put("caveat", persona.caveat());
        publicPersona.put("image", Map.of(
                "id", value.imageId().toString(),
                "url", "/api/v1/persona-images/" + value.imageId(),
                "altText", persona.imageAltText(),
                "generatedByAi", true));
        publicPersona.put("perspectives", perspectives);
        publicPersona.put("advice", advice);
        return Map.of(
                "rank", persona.rank(),
                "status", "FILLED",
                "topicReviewCount", persona.topicReviewCount(),
                "persona", publicPersona);
    }

    private JobStatus mapStatus(ResultSet rs, int rowNum) throws SQLException {
        String status = rs.getString("status");
        String errorCode = rs.getString("error_code");
        return new JobStatus(
                rs.getObject("id", UUID.class),
                status,
                rs.getString("progress_step"),
                messageFor(rs.getString("message_code"), errorCode),
                rs.getBoolean("retryable"),
                rs.getObject("analysis_id", UUID.class),
                errorCode == null ? null : new JobError(errorCode, messageFor(null, errorCode)),
                rs.getObject("created_at", OffsetDateTime.class).toInstant(),
                rs.getObject("updated_at", OffsetDateTime.class).toInstant());
    }

    private static String messageFor(String messageCode, String errorCode) {
        if (errorCode != null) {
            return switch (errorCode) {
                case "INVALID_NAVER_PLACE_URL" -> "지원하는 네이버 가게 주소를 확인해 주세요.";
                case "INSUFFICIENT_VALID_REVIEWS" -> "분석 가능한 리뷰가 50건보다 적습니다.";
                case "REVIEW_COLLECTION_BLOCKED" -> "현재 네이버 공개 리뷰를 가져올 수 없습니다.";
                case "ANALYSIS_CONFIGURATION_MISSING" -> "분석 서비스 설정이 완료되지 않았습니다.";
                default -> "분석을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.";
            };
        }
        return switch (String.valueOf(messageCode)) {
            case "ANALYSIS_QUEUED" -> "분석 작업을 준비하고 있습니다.";
            case "COLLECTING_REVIEWS" -> "공개 리뷰를 수집하고 분석하고 있습니다.";
            case "ANALYSIS_COMPLETED" -> "리뷰 분석이 완료되었습니다.";
            default -> "분석 상태를 확인하고 있습니다.";
        };
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("분석 결과 JSON을 만들지 못했습니다.", exception);
        }
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("저장된 분석 결과 JSON을 읽지 못했습니다.", exception);
        }
    }

    private static OffsetDateTime utc(Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    public record ExistingJob(
            UUID jobId, String requestHash, String status, String progressStep, Instant createdAt) {
    }

    public record ImageRecord(String storageKey, String altText) {
    }

    private record PublicInsight(UUID id, WorkerInsight worker, List<Map<String, Object>> evidence) {
    }

    private record PublicAdvice(UUID id, WorkerAdvice worker, List<Map<String, Object>> evidence) {
    }

    private record PublicPersona(
            UUID id,
            UUID imageId,
            WorkerPersona worker,
            Map<String, PublicInsight> insights,
            List<PublicAdvice> advice) {
    }
}
