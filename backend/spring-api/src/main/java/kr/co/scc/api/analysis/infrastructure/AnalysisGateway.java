package kr.co.scc.api.analysis.infrastructure;

import kr.co.scc.api.analysis.application.AnalysisException;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerRequest;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
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
    private final AnalysisServiceProperties properties;
    private final ObjectMapper objectMapper;

    public AnalysisGateway(
            RestClient analysisRestClient,
            AnalysisServiceProperties properties,
            ObjectMapper objectMapper) {
        this.client = analysisRestClient;
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
                    error.retryable());
        } catch (RestClientException exception) {
            throw unavailable("분석 서비스에 연결할 수 없습니다.");
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
                        detail.path("retryable").asBoolean(exception.getStatusCode().is5xxServerError()));
            }
        } catch (Exception ignored) {
            // The worker may return an HTML proxy error or an unstructured authentication error.
        }
        return new WorkerError(
                "ANALYSIS_SERVICE_REJECTED",
                "리뷰 수집 또는 분석 서비스가 요청을 처리하지 못했습니다.",
                exception.getStatusCode().is5xxServerError());
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

    private record WorkerError(String code, String message, boolean retryable) {
    }
}
