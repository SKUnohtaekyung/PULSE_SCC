package kr.co.scc.api.analysis.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public final class AnalysisContracts {

    private AnalysisContracts() {
    }

    public record CreateJobCommand(String storeName, String category, String naverPlaceUrl) {
    }

    public record JobCreated(
            UUID jobId,
            String status,
            String progressStep,
            String message,
            Instant createdAt) {
    }

    public record JobStatus(
            UUID jobId,
            String status,
            String progressStep,
            String message,
            boolean retryable,
            UUID analysisId,
            JobError error,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record JobError(String code, String message) {
    }

    public record WorkerRequest(
            @JsonProperty("job_id") String jobId,
            @JsonProperty("store_name") String storeName,
            String category,
            @JsonProperty("naver_place_url") String naverPlaceUrl) {
    }

    public record WorkerResponse(
            @JsonProperty("job_id") String jobId,
            @JsonProperty("collected_review_count") int collectedReviewCount,
            @JsonProperty("valid_review_count") int validReviewCount,
            @JsonProperty("contains_reviews_older_than_two_years") boolean containsOldReviews,
            @JsonProperty("collected_at") Instant collectedAt,
            @JsonProperty("analyzed_at") Instant analyzedAt,
            List<WorkerReview> reviews,
            WorkerAnalysis analysis,
            List<WorkerImage> images,
            @JsonProperty("model_versions") Map<String, String> modelVersions,
            @JsonProperty("schema_version") String schemaVersion) {
    }

    public record WorkerReview(
            String content,
            @JsonProperty("normalized_content") String normalizedContent,
            @JsonProperty("content_hash") String contentHash,
            BigDecimal rating,
            @JsonProperty("written_at") LocalDate writtenAt) {
    }

    public record WorkerAnalysis(List<WorkerPersona> personas, List<String> limitations) {
    }

    public record WorkerPersona(
            int rank,
            @JsonProperty("topic_review_count") int topicReviewCount,
            String label,
            String summary,
            String caveat,
            @JsonProperty("image_prompt") String imagePrompt,
            @JsonProperty("image_alt_text") String imageAltText,
            List<WorkerInsight> insights,
            List<WorkerAdvice> advice) {
    }

    public record WorkerInsight(
            String kind,
            @JsonProperty("review_fact") String reviewFact,
            @JsonProperty("ai_interpretation") String aiInterpretation,
            List<WorkerEvidence> evidence) {
    }

    public record WorkerAdvice(
            @JsonProperty("review_fact") String reviewFact,
            @JsonProperty("suggested_action") String suggestedAction,
            @JsonProperty("ai_interpretation") String aiInterpretation,
            List<WorkerEvidence> evidence) {
    }

    public record WorkerEvidence(
            @JsonProperty("review_index") int reviewIndex,
            String excerpt) {
    }

    public record WorkerImage(
            int rank,
            @JsonProperty("content_base64") String contentBase64,
            @JsonProperty("media_type") String mediaType) {
    }

    public record JobContext(
            UUID jobId,
            UUID userId,
            UUID storeId,
            String storeName,
            String category,
            String naverPlaceUrl) {
    }
}
