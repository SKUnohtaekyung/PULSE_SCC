package kr.co.scc.api.mypage;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MyPageRepository {

    private final JdbcClient jdbc;

    public MyPageRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<NotificationView> findNotifications(UUID userId) {
        return jdbc.sql("""
                        SELECT id, job_id, type, message_code, read_at, created_at
                        FROM notifications
                        WHERE user_id = :userId
                        ORDER BY created_at DESC
                        LIMIT 50
                        """)
                .param("userId", userId)
                .query((rs, rowNum) -> new NotificationView(
                        rs.getObject("id", UUID.class),
                        rs.getObject("job_id", UUID.class),
                        rs.getString("type"),
                        messageFor(rs.getString("message_code")),
                        instant(rs.getObject("read_at", OffsetDateTime.class)),
                        rs.getObject("created_at", OffsetDateTime.class).toInstant()))
                .list();
    }

    public NotificationSetting findOrCreateSetting(UUID userId) {
        jdbc.sql("""
                        INSERT INTO notification_settings (user_id)
                        VALUES (:userId)
                        ON CONFLICT (user_id) DO NOTHING
                        """)
                .param("userId", userId)
                .update();
        return jdbc.sql("""
                        SELECT analysis_result_enabled, updated_at
                        FROM notification_settings
                        WHERE user_id = :userId
                        """)
                .param("userId", userId)
                .query((rs, rowNum) -> new NotificationSetting(
                        rs.getBoolean("analysis_result_enabled"),
                        rs.getObject("updated_at", OffsetDateTime.class).toInstant()))
                .single();
    }

    public NotificationSetting updateSetting(UUID userId, boolean enabled) {
        findOrCreateSetting(userId);
        jdbc.sql("""
                        UPDATE notification_settings
                        SET analysis_result_enabled = :enabled, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = :userId
                        """)
                .param("enabled", enabled)
                .param("userId", userId)
                .update();
        return findOrCreateSetting(userId);
    }

    public List<String> findImageStorageKeys(UUID userId) {
        return jdbc.sql("""
                        SELECT i.storage_key
                        FROM persona_images i
                        JOIN personas p ON p.id = i.persona_id
                        JOIN analyses a ON a.id = p.analysis_id
                        WHERE a.user_id = :userId
                        """)
                .param("userId", userId)
                .query(String.class)
                .list();
    }

    public void deleteAccountData(UUID userId) {
        jdbc.sql("DELETE FROM knowledge_references WHERE advice_id IN (SELECT d.id FROM advice d JOIN analyses a ON a.id = d.analysis_id WHERE a.user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM evidence_links WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM persona_images WHERE persona_id IN (SELECT p.id FROM personas p JOIN analyses a ON a.id = p.analysis_id WHERE a.user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM insights WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM advice WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM personas WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM reviews WHERE job_id IN (SELECT id FROM analysis_jobs WHERE user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM analysis_result_documents WHERE analysis_id IN (SELECT id FROM analyses WHERE user_id = :userId)").param("userId", userId).update();
        jdbc.sql("DELETE FROM saved_analyses WHERE user_id = :userId").param("userId", userId).update();
        jdbc.sql("DELETE FROM notifications WHERE user_id = :userId").param("userId", userId).update();
        jdbc.sql("DELETE FROM analyses WHERE user_id = :userId").param("userId", userId).update();
        List<UUID> storeIds = jdbc.sql("SELECT store_id FROM analysis_jobs WHERE user_id = :userId").param("userId", userId).query(UUID.class).list();
        jdbc.sql("DELETE FROM analysis_jobs WHERE user_id = :userId").param("userId", userId).update();
        for (UUID storeId : storeIds) {
            jdbc.sql("DELETE FROM stores WHERE id = :storeId AND NOT EXISTS (SELECT 1 FROM analysis_jobs WHERE store_id = :storeId)").param("storeId", storeId).update();
        }
        jdbc.sql("DELETE FROM legal_consents WHERE user_id = :userId").param("userId", userId).update();
        jdbc.sql("DELETE FROM auth_sessions WHERE user_id = :userId").param("userId", userId).update();
        jdbc.sql("DELETE FROM notification_settings WHERE user_id = :userId").param("userId", userId).update();
        jdbc.sql("DELETE FROM user_identities WHERE user_id = :userId").param("userId", userId).update();
        jdbc.sql("DELETE FROM users WHERE id = :userId").param("userId", userId).update();
    }

    private static String messageFor(String code) {
        return "ANALYSIS_COMPLETED".equals(code)
                ? "리뷰 분석이 완료되었습니다."
                : "리뷰 분석을 완료하지 못했습니다.";
    }

    private static Instant instant(OffsetDateTime value) {
        return value == null ? null : value.toInstant();
    }

    public record NotificationView(UUID id, UUID jobId, String type, String message, Instant readAt, Instant createdAt) {}
    public record NotificationSetting(boolean analysisResultEnabled, Instant updatedAt) {}
}
