package kr.co.scc.api.analysis;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerAdvice;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerAnalysis;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerEvidence;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerImage;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerInsight;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerPersona;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerResponse;
import kr.co.scc.api.analysis.domain.AnalysisContracts.WorkerReview;
import kr.co.scc.api.analysis.infrastructure.AnalysisGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class AnalysisApiIntegrationTests {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:18.6-alpine3.23");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("scc.analysis-service.image-storage-path",
                () -> System.getProperty("java.io.tmpdir") + "/scc-integration-images-" + UUID.randomUUID());
    }

    @Autowired MockMvc mockMvc;
    @Autowired JdbcClient jdbc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PasswordEncoder passwordEncoder;
    @MockitoBean AnalysisGateway gateway;

    private UUID userId;
    private UUID sessionId;

    @BeforeEach
    void user() {
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        jdbc.sql("INSERT INTO users (id, login_email, credential_hash, phone_number, status) VALUES (:id, :email, :hash, '01012345678', 'ACTIVE')")
                .param("id", userId).param("email", userId + "@scc.test")
                .param("hash", passwordEncoder.encode("password1234")).update();
        jdbc.sql("INSERT INTO user_identities (id, user_id, provider, provider_subject) VALUES (:id, :userId, 'LOCAL', :subject)")
                .param("id", UUID.randomUUID()).param("userId", userId).param("subject", userId.toString()).update();
        jdbc.sql("INSERT INTO notification_settings (user_id) VALUES (:userId)").param("userId", userId).update();
        when(gateway.analyze(any())).thenReturn(workerResponse());
    }

    @Test
    void controllerServiceAndRepositoryCompleteAnAnalysisAndExposeNotification() throws Exception {
        String body = mockMvc.perform(post("/api/v1/analysis-jobs")
                        .with(userJwt())
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType("application/json")
                        .content("""
                                {"storeName":"통합 테스트 식당","category":"한식",\
                                "naverPlaceUrl":"https://map.naver.com/p/entry/place/1234567890"}
                                """))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andReturn().getResponse().getContentAsString();
        UUID jobId = UUID.fromString(objectMapper.readTree(body).get("jobId").stringValue());

        JsonNode statusBody = awaitCompleted(jobId);
        assertThat(statusBody.get("status").stringValue()).isEqualTo("COMPLETED");

        String resultBody = mockMvc.perform(get("/api/v1/analysis-jobs/{jobId}/result", jobId).with(userJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.store.name").value("통합 테스트 식당"))
                .andExpect(jsonPath("$.podium[0].status").value("FILLED"))
                .andReturn().getResponse().getContentAsString();
        JsonNode result = objectMapper.readTree(resultBody);
        UUID analysisId = UUID.fromString(result.get("analysisId").stringValue());
        UUID personaId = UUID.fromString(result.at("/podium/0/persona/id").stringValue());
        mockMvc.perform(get("/api/v1/analyses/{analysisId}/evidence", analysisId)
                        .with(userJwt())
                        .queryParam("personaId", personaId.toString())
                        .queryParam("perspective", "POSITIVE")
                        .queryParam("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].excerpt").value("맛있고 빨라요"))
                .andExpect(jsonPath("$.items[0].platform").value("NAVER"))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
        mockMvc.perform(get("/api/v1/me/notifications").with(userJwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("ANALYSIS_COMPLETED"));
        assertThat(jdbc.sql("SELECT count(*) FROM analyses WHERE user_id = :userId")
                .param("userId", userId).query(Long.class).single()).isEqualTo(1L);
    }

    @Test
    void evidenceRejectsAnInvalidCursorAndAnotherUsersPersona() throws Exception {
        String body = mockMvc.perform(post("/api/v1/analysis-jobs")
                        .with(userJwt())
                        .header("Idempotency-Key", UUID.randomUUID().toString())
                        .contentType("application/json")
                        .content("""
                                {"storeName":"통합 테스트 식당","category":"한식",\
                                "naverPlaceUrl":"https://map.naver.com/p/entry/place/1234567890"}
                                """))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();
        UUID jobId = UUID.fromString(objectMapper.readTree(body).get("jobId").stringValue());
        JsonNode completed = awaitCompleted(jobId);
        UUID analysisId = UUID.fromString(completed.get("analysisId").stringValue());
        String resultBody = mockMvc.perform(get("/api/v1/analysis-jobs/{jobId}/result", jobId)
                        .with(userJwt()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID personaId = UUID.fromString(
                objectMapper.readTree(resultBody).at("/podium/0/persona/id").stringValue());

        mockMvc.perform(get("/api/v1/analyses/{analysisId}/evidence", analysisId)
                        .with(userJwt())
                        .queryParam("personaId", personaId.toString())
                        .queryParam("perspective", "POSITIVE")
                        .queryParam("cursor", "not-a-cursor"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_EVIDENCE_CURSOR"));

        mockMvc.perform(get("/api/v1/analyses/{analysisId}/evidence", analysisId)
                        .with(jwt().jwt(token -> token.subject(UUID.randomUUID().toString())))
                        .queryParam("personaId", personaId.toString())
                        .queryParam("perspective", "POSITIVE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("ANALYSIS_NOT_FOUND"));
    }

    @Test
    void accountDeletionRemovesUserOwnedData() throws Exception {
        mockMvc.perform(delete("/api/v1/me/account")
                        .with(userJwt()).contentType("application/json")
                        .content("{\"password\":\"password1234\"}"))
                .andExpect(status().isNoContent());
        assertThat(jdbc.sql("SELECT count(*) FROM users WHERE id = :userId")
                .param("userId", userId).query(Long.class).single()).isZero();
        assertThat(jdbc.sql("SELECT count(*) FROM notification_settings WHERE user_id = :userId")
                .param("userId", userId).query(Long.class).single()).isZero();
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor userJwt() {
        return jwt().jwt(token -> token.subject(userId.toString())
                .claim("sid", sessionId.toString()).claim("email", userId + "@scc.test"));
    }

    private JsonNode awaitCompleted(UUID jobId) throws Exception {
        for (int attempt = 0; attempt < 50; attempt++) {
            String body = mockMvc.perform(get("/api/v1/analysis-jobs/{jobId}", jobId).with(userJwt()))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            JsonNode value = objectMapper.readTree(body);
            if ("COMPLETED".equals(value.get("status").stringValue())) return value;
            Thread.sleep(100);
        }
        throw new AssertionError("analysis did not complete");
    }

    private WorkerResponse workerResponse() {
        WorkerReview review = new WorkerReview("맛있고 빨라요", "맛있고 빨라요", "hash-1", BigDecimal.valueOf(5), LocalDate.now());
        List<WorkerInsight> insights = List.of("POSITIVE", "NEGATIVE", "PERCEPTION", "PRIORITY").stream()
                .map(kind -> new WorkerInsight(kind, "반복 리뷰 사실", "AI 해석", List.of(new WorkerEvidence(0, "맛있고 빨라요"))))
                .toList();
        WorkerPersona persona = new WorkerPersona(1, 50, "빠른 식사 손님", "빠른 제공을 중요하게 봐요", "실제 개인이 아닙니다", "prompt", "AI 생성 이미지", insights,
                List.of(new WorkerAdvice("빠른 제공 칭찬", "대기 시간을 안내해 보세요", "불확실성을 줄일 수 있습니다", List.of(new WorkerEvidence(0, "맛있고 빨라요")))));
        Instant now = Instant.now();
        return new WorkerResponse("job", 50, 50, false, now, now, List.of(review),
                new WorkerAnalysis(List.of(persona), List.of()),
                List.of(new WorkerImage(1, "aGVsbG8=", "image/png")), Map.of("analysis", "test"), "1");
    }
}
