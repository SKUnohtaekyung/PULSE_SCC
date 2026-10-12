package kr.co.scc.api.analysis.infrastructure;

import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.analysis.application.AnalysisException;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerRequest;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class AnalysisGateway {

    private final RestClient client;
    private final RestClient progressClient;
    private final AnalysisServiceProperties properties;
    private final ObjectMapper objectMapper;

    public AnalysisGateway(
            @Qualifier("analysisRestClient") RestClient analysisRestClient,
            @Qualifier("analysisProgressRestClient") RestClient analysisProgressRestClient,
            AnalysisServiceProperties properties,
            ObjectMapper objectMapper) {
        this.client = analysisRestClient;
        this.progressClient = analysisProgressRestClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public WorkerResponse analyze(WorkerRequest request) {
        try {
            WorkerResponse response = client.post()
                    .uri("/internal/v1/analysis-jobs")
                    .header("X-SCC-Service-Token", properties.serviceToken())
                    .body(request)
                    .retrieve()
                    .body(WorkerResponse.class);
            if (response == null) {
                throw unavailable("분석 서비스가 빈 응답을 반환했습니다.");
            }
            return response;
        } catch (RestClientResponseException exception) {
            WorkerError error = readError(exception);
            throw new AnalysisException(
                    exception.getStatusCode().value() == 422
                            ? HttpStatus.valueOf(422)
                            : HttpStatus.BAD_GATEWAY,
                    error.code(),
                    error.message(),
                    error.retryable(),
                    error.validReviewCount());
        } catch (RestClientException exception) {
            throw unavailable("분석 서비스에 연결할 수 없습니다.");
        }
    }

    /**
     * 분석 서비스가 지금 처리 중인 단계를 묻는다.
     *
     * <p>알 수 없으면 비어 있다. 분석 서비스가 그 작업을 처리 중이 아니거나(404), 응답하지
     * 않거나, 모르는 형식으로 답한 경우다. 진행 단계는 보조 정보라 실패를 예외로 올리지 않는다.
     */
    public Optional<String> fetchProgressStep(UUID jobId) {
        try {
            JsonNode body = progressClient.get()
                    .uri("/internal/v1/analysis-jobs/{jobId}/progress", jobId)
                    .header("X-SCC-Service-Token", properties.serviceToken())
                    .retrieve()
                    .body(JsonNode.class);
            if (body == null) {
                return Optional.empty();
            }
            String step = body.path("progress_step").asString("");
            return step.isBlank() ? Optional.empty() : Optional.of(step);
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private WorkerError readError(RestClientResponseException exception) {
        try {
            JsonNode detail = objectMapper.readTree(exception.getResponseBodyAsString()).path("detail");
            if (detail.isObject()) {
                return new WorkerError(
                        textOrDefault(detail.path("code"), "ANALYSIS_SERVICE_REJECTED"),
                        textOrDefault(
                                detail.path("message"),
                                "리뷰 수집 또는 분석 서비스가 요청을 처리하지 못했습니다."),
                        detail.path("retryable").asBoolean(exception.getStatusCode().is5xxServerError()),
                        detail.path("valid_review_count").isInt() ? detail.path("valid_review_count").asInt() : null);
            }
        } catch (Exception ignored) {
            // The worker may return an HTML proxy error or an unstructured authentication error.
        }
        return new WorkerError(
                "ANALYSIS_SERVICE_REJECTED",
                "리뷰 수집 또는 분석 서비스가 요청을 처리하지 못했습니다.",
                exception.getStatusCode().is5xxServerError(),
                null);
    }

    private static String textOrDefault(JsonNode node, String defaultValue) {
        String value = node.asString(defaultValue);
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private static AnalysisException unavailable(String message) {
        return new AnalysisException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "INTERNAL_ANALYSIS_SERVICE_UNAVAILABLE",
                message,
                true);
    }

    private record WorkerError(String code, String message, boolean retryable, Integer validReviewCount) {
    }
}
