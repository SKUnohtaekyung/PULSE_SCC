package kr.co.scc.api.database;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.DriverManager;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers(disabledWithoutDocker = true)
class AnalysisLeaseMigrationUpgradeTests {

    @Container
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:18.6-alpine3.23");

    @Test
    void v6RequeuesOnlyPreleaseRunningJobsWithoutChangingV4Checksum() throws Exception {
        String schema = "upgrade_" + UUID.randomUUID().toString().replace("-", "");
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema)
                .defaultSchema(schema)
                .target(MigrationVersion.fromVersion("3"))
                .load()
                .migrate();

        UUID userId = UUID.randomUUID();
        UUID storeId = UUID.randomUUID();
        UUID jobId = UUID.randomUUID();
        try (var connection = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
            connection.createStatement().execute("SET search_path TO " + schema);
            try (var statement = connection.prepareStatement(
                    "INSERT INTO users (id, login_email, status) VALUES (?, ?, 'ACTIVE')")) {
                statement.setObject(1, userId);
                statement.setString(2, "upgrade@scc.test");
                statement.executeUpdate();
            }
            try (var statement = connection.prepareStatement("""
                    INSERT INTO stores (id, name, category, naver_place_url)
                    VALUES (?, '업그레이드 식당', '한식', 'https://map.naver.com/p/entry/place/123')
                    """)) {
                statement.setObject(1, storeId);
                statement.executeUpdate();
            }
            try (var statement = connection.prepareStatement("""
                    INSERT INTO analysis_jobs (
                        id, user_id, store_id, idempotency_key, request_hash,
                        status, progress_step, message_code
                    ) VALUES (?, ?, ?, 'upgrade-key', 'upgrade-hash',
                        'RUNNING', 'ANALYZING', 'ANALYZING')
                    """)) {
                statement.setObject(1, jobId);
                statement.setObject(2, userId);
                statement.setObject(3, storeId);
                statement.executeUpdate();
            }
        }

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema)
                .defaultSchema(schema)
                .target(MigrationVersion.fromVersion("4"))
                .load()
                .migrate();

        try (var connection = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
            connection.createStatement().execute("SET search_path TO " + schema);
            try (var statement = connection.prepareStatement(
                    "SELECT status FROM analysis_jobs WHERE id = ?")) {
                statement.setObject(1, jobId);
                try (var result = statement.executeQuery()) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString("status")).isEqualTo("RUNNING");
                }
            }
        }

        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .schemas(schema)
                .defaultSchema(schema)
                .load()
                .migrate();

        try (var connection = DriverManager.getConnection(
                POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())) {
            connection.createStatement().execute("SET search_path TO " + schema);
            try (var statement = connection.prepareStatement(
                    "SELECT status, progress_step, message_code, lease_expires_at "
                            + "FROM analysis_jobs WHERE id = ?")) {
                statement.setObject(1, jobId);
                try (var result = statement.executeQuery()) {
                    assertThat(result.next()).isTrue();
                    assertThat(result.getString("status")).isEqualTo("QUEUED");
                    assertThat(result.getString("progress_step")).isEqualTo("QUEUED");
                    assertThat(result.getString("message_code")).isEqualTo("QUEUED");
                    assertThat(result.getObject("lease_expires_at")).isNull();
                }
            }
            connection.createStatement().execute("DROP SCHEMA " + schema + " CASCADE");
        }
    }
}
