package kr.co.scc.api.database;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@Transactional
class InitialSchemaMigrationTests {

    private static final List<String> EXPECTED_TABLES = List.of(
            "advice",
            "analyses",
            "analysis_jobs",
            "auth_sessions",
            "evidence_links",
            "flyway_schema_history",
            "insights",
            "knowledge_references",
            "notification_settings",
            "notifications",
            "persona_images",
            "personas",
            "reviews",
            "saved_analyses",
            "stores",
            "user_identities",
            "users");

    @Container
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:18.6-alpine3.23");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcClient jdbc;

    @Test
    void flywayCreatesTheExpectedInitialTables() {
        List<String> tables = jdbc.sql("""
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema = 'public'
                        ORDER BY table_name
                        """)
                .query(String.class)
                .list();

        assertThat(tables).containsExactlyElementsOf(EXPECTED_TABLES);
        Long migrations = jdbc.sql("""
                        SELECT count(*)
                        FROM flyway_schema_history
                        WHERE success = true AND version = '1'
                        """)
                .query(Long.class)
                .single();
        assertThat(migrations).isEqualTo(2L);
    }

    @Test
    void analysisMustMatchTheJobOwnerAndStore() {
        UUID ownerId = insertUser("owner@scc.test");
        UUID otherUserId = insertUser("other@scc.test");
        UUID storeId = insertStore("소유권 검증 가게");
        UUID jobId = insertJob(ownerId, storeId, "ownership-key");

        assertThatThrownBy(() -> insertAnalysis(jobId, otherUserId, storeId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void oneUserCannotSaveMoreThanOneAnalysis() {
        UUID userId = insertUser("saved@scc.test");
        UUID storeId = insertStore("저장 제한 가게");
        UUID firstJobId = insertJob(userId, storeId, "saved-first");
        UUID secondJobId = insertJob(userId, storeId, "saved-second");
        UUID firstAnalysisId = insertAnalysis(firstJobId, userId, storeId);
        UUID secondAnalysisId = insertAnalysis(secondJobId, userId, storeId);

        jdbc.sql("INSERT INTO saved_analyses (user_id, analysis_id) VALUES (:userId, :analysisId)")
                .param("userId", userId)
                .param("analysisId", firstAnalysisId)
                .update();

        assertThatThrownBy(() -> jdbc
                        .sql("INSERT INTO saved_analyses (user_id, analysis_id) "
                                + "VALUES (:userId, :analysisId)")
                        .param("userId", userId)
                        .param("analysisId", secondAnalysisId)
                        .update())
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void evidenceCannotCrossAnalysisBoundaries() {
        UUID userId = insertUser("evidence@scc.test");
        UUID storeId = insertStore("근거 검증 가게");
        UUID firstJobId = insertJob(userId, storeId, "evidence-first");
        UUID secondJobId = insertJob(userId, storeId, "evidence-second");
        UUID firstAnalysisId = insertAnalysis(firstJobId, userId, storeId);
        UUID secondAnalysisId = insertAnalysis(secondJobId, userId, storeId);
        UUID reviewId = insertReview(firstJobId, firstAnalysisId);
        UUID insightId = insertInsight(secondAnalysisId);

        assertThatThrownBy(() -> jdbc.sql("""
                        INSERT INTO evidence_links (
                            id, analysis_id, review_id, insight_id, excerpt, sort_order
                        ) VALUES (
                            :id, :analysisId, :reviewId, :insightId, '다른 분석의 리뷰', 0
                        )
                        """)
                .param("id", UUID.randomUUID())
                .param("analysisId", secondAnalysisId)
                .param("reviewId", reviewId)
                .param("insightId", insightId)
                .update()).isInstanceOf(DataIntegrityViolationException.class);
    }

    private UUID insertUser(String email) {
        UUID id = UUID.randomUUID();
        jdbc.sql("INSERT INTO users (id, login_email, status) VALUES (:id, :email, 'ACTIVE')")
                .param("id", id)
                .param("email", email)
                .update();
        return id;
    }

    private UUID insertStore(String name) {
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO stores (id, name, category, naver_place_url)
                        VALUES (:id, :name, '한식', :url)
                        """)
                .param("id", id)
                .param("name", name)
                .param("url", "https://m.place.naver.com/restaurant/" + id)
                .update();
        return id;
    }

    private UUID insertJob(UUID userId, UUID storeId, String idempotencyKey) {
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO analysis_jobs (
                            id, user_id, store_id, idempotency_key, request_hash,
                            status, progress_step
                        ) VALUES (
                            :id, :userId, :storeId, :idempotencyKey, :requestHash,
                            'RUNNING', 'ANALYZING'
                        )
                        """)
                .param("id", id)
                .param("userId", userId)
                .param("storeId", storeId)
                .param("idempotencyKey", idempotencyKey)
                .param("requestHash", "request-" + id)
                .update();
        return id;
    }

    private UUID insertAnalysis(UUID jobId, UUID userId, UUID storeId) {
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();
        jdbc.sql("""
                        INSERT INTO analyses (
                            id, job_id, user_id, store_id,
                            collected_review_count, valid_review_count,
                            schema_version, collected_at, analyzed_at
                        ) VALUES (
                            :id, :jobId, :userId, :storeId,
                            50, 50, '1', :collectedAt, :analyzedAt
                        )
                        """)
                .param("id", id)
                .param("jobId", jobId)
                .param("userId", userId)
                .param("storeId", storeId)
                .param("collectedAt", now)
                .param("analyzedAt", now)
                .update();
        return id;
    }

    private UUID insertReview(UUID jobId, UUID analysisId) {
        UUID id = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO reviews (
                            id, job_id, analysis_id, platform, content,
                            normalized_content, collected_at, content_hash
                        ) VALUES (
                            :id, :jobId, :analysisId, 'NAVER', '리뷰 본문',
                            '리뷰 본문', :collectedAt, :contentHash
                        )
                        """)
                .param("id", id)
                .param("jobId", jobId)
                .param("analysisId", analysisId)
                .param("collectedAt", OffsetDateTime.now())
                .param("contentHash", "content-" + id)
                .update();
        return id;
    }

    private UUID insertInsight(UUID analysisId) {
        UUID personaId = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO personas (
                            id, analysis_id, rank, topic_review_count, label, summary, caveat
                        ) VALUES (
                            :id, :analysisId, 1, 10, '테스트 유형', '테스트 요약', '실제 개인이 아님'
                        )
                        """)
                .param("id", personaId)
                .param("analysisId", analysisId)
                .update();

        UUID insightId = UUID.randomUUID();
        jdbc.sql("""
                        INSERT INTO insights (
                            id, persona_id, analysis_id, kind, review_fact, sort_order
                        ) VALUES (
                            :id, :personaId, :analysisId, 'POSITIVE', '반복된 리뷰 사실', 0
                        )
                        """)
                .param("id", insightId)
                .param("personaId", personaId)
                .param("analysisId", analysisId)
                .update();
        return insightId;
    }
}
