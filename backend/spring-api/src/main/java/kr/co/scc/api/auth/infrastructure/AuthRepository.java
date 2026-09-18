package kr.co.scc.api.auth.infrastructure;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.auth.domain.RefreshSession;
import kr.co.scc.api.auth.domain.UserAccount;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AuthRepository {

    private final JdbcClient jdbc;

    public AuthRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserAccount> findUserByEmail(String email) {
        return jdbc.sql("""
                        SELECT id, login_email, credential_hash, phone_number, status
                        FROM users
                        WHERE login_email = :email
                        """)
                .param("email", email)
                .query(this::mapUser)
                .optional();
    }

    public Optional<UserAccount> findUserById(UUID userId) {
        return jdbc.sql("""
                        SELECT id, login_email, credential_hash, phone_number, status
                        FROM users
                        WHERE id = :userId
                        """)
                .param("userId", userId)
                .query(this::mapUser)
                .optional();
    }

    public Optional<UserAccount> findUserByIdentity(String provider, String subject) {
        return jdbc.sql("""
                        SELECT u.id, u.login_email, u.credential_hash, u.phone_number, u.status
                        FROM users u
                        JOIN user_identities i ON i.user_id = u.id
                        WHERE i.provider = :provider AND i.provider_subject = :subject
                        """)
                .param("provider", provider)
                .param("subject", subject)
                .query(this::mapUser)
                .optional();
    }

    public void insertUser(UserAccount user) {
        jdbc.sql("""
                        INSERT INTO users (id, login_email, credential_hash, phone_number, status)
                        VALUES (:id, :email, :credentialHash, :phoneNumber, :status)
                        """)
                .param("id", user.id())
                .param("email", user.email())
                .param("credentialHash", user.credentialHash())
                .param("phoneNumber", user.phoneNumber())
                .param("status", user.status())
                .update();
    }

    public void insertIdentity(UUID id, UUID userId, String provider, String subject) {
        jdbc.sql("""
                        INSERT INTO user_identities (id, user_id, provider, provider_subject)
                        VALUES (:id, :userId, :provider, :subject)
                        """)
                .param("id", id)
                .param("userId", userId)
                .param("provider", provider)
                .param("subject", subject)
                .update();
    }

    public void insertLegalConsent(UUID userId, String documentType, String documentVersion) {
        jdbc.sql("""
                        INSERT INTO legal_consents (id, user_id, document_type, document_version)
                        VALUES (:id, :userId, :documentType, :documentVersion)
                        """)
                .param("id", UUID.randomUUID())
                .param("userId", userId)
                .param("documentType", documentType)
                .param("documentVersion", documentVersion)
                .update();
    }

    public void insertNotificationSettings(UUID userId) {
        jdbc.sql("""
                        INSERT INTO notification_settings (user_id)
                        VALUES (:userId)
                        ON CONFLICT (user_id) DO NOTHING
                        """)
                .param("userId", userId)
                .update();
    }

    public void insertSession(
            UUID id,
            UUID userId,
            String refreshTokenHash,
            Instant expiresAt) {
        jdbc.sql("""
                        INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at)
                        VALUES (:id, :userId, :tokenHash, :expiresAt)
                        """)
                .param("id", id)
                .param("userId", userId)
                .param("tokenHash", refreshTokenHash)
                .param("expiresAt", OffsetDateTime.ofInstant(expiresAt, ZoneOffset.UTC))
                .update();
    }

    public Optional<RefreshSession> findSessionByTokenHash(String tokenHash) {
        return jdbc.sql("""
                        SELECT s.id AS session_id, s.expires_at, s.revoked_at,
                               u.id, u.login_email, u.credential_hash, u.phone_number, u.status
                        FROM auth_sessions s
                        JOIN users u ON u.id = s.user_id
                        WHERE s.refresh_token_hash = :tokenHash
                        """)
                .param("tokenHash", tokenHash)
                .query((rs, rowNum) -> new RefreshSession(
                        rs.getObject("session_id", UUID.class),
                        mapUser(rs, rowNum),
                        rs.getObject("expires_at", OffsetDateTime.class).toInstant(),
                        optionalInstant(rs.getObject("revoked_at", OffsetDateTime.class))))
                .optional();
    }

    public boolean rotateSession(UUID currentId, UUID replacementId, Instant revokedAt) {
        return jdbc.sql("""
                        UPDATE auth_sessions
                        SET revoked_at = :revokedAt, replaced_by_session_id = :replacementId
                        WHERE id = :currentId AND revoked_at IS NULL
                        """)
                .param("revokedAt", OffsetDateTime.ofInstant(revokedAt, ZoneOffset.UTC))
                .param("replacementId", replacementId)
                .param("currentId", currentId)
                .update() == 1;
    }

    public void revokeSession(UUID sessionId, UUID userId, Instant revokedAt) {
        jdbc.sql("""
                        UPDATE auth_sessions
                        SET revoked_at = COALESCE(revoked_at, :revokedAt)
                        WHERE id = :sessionId AND user_id = :userId
                        """)
                .param("revokedAt", OffsetDateTime.ofInstant(revokedAt, ZoneOffset.UTC))
                .param("sessionId", sessionId)
                .param("userId", userId)
                .update();
    }

    public void revokeAllSessions(UUID userId, Instant revokedAt) {
        jdbc.sql("""
                        UPDATE auth_sessions
                        SET revoked_at = :revokedAt
                        WHERE user_id = :userId AND revoked_at IS NULL
                        """)
                .param("revokedAt", OffsetDateTime.ofInstant(revokedAt, ZoneOffset.UTC))
                .param("userId", userId)
                .update();
    }

    public boolean isSessionActive(UUID sessionId, UUID userId, Instant now) {
        return jdbc.sql("""
                        SELECT EXISTS (
                            SELECT 1 FROM auth_sessions
                            WHERE id = :sessionId
                              AND user_id = :userId
                              AND revoked_at IS NULL
                              AND expires_at > :now
                        )
                        """)
                .param("sessionId", sessionId)
                .param("userId", userId)
                .param("now", OffsetDateTime.ofInstant(now, ZoneOffset.UTC))
                .query(Boolean.class)
                .single();
    }

    public boolean hasSavedAnalysis(UUID userId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM saved_analyses WHERE user_id = :userId)")
                .param("userId", userId)
                .query(Boolean.class)
                .single();
    }

    private UserAccount mapUser(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new UserAccount(
                rs.getObject("id", UUID.class),
                rs.getString("login_email"),
                rs.getString("credential_hash"),
                rs.getString("phone_number"),
                rs.getString("status"));
    }

    private static Instant optionalInstant(OffsetDateTime value) {
        return value == null ? null : value.toInstant();
    }
}
