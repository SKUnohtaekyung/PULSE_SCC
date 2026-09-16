package kr.co.scc.api.auth.domain;

import java.time.Instant;
import java.util.UUID;

public record RefreshSession(
        UUID id,
        UserAccount user,
        Instant expiresAt,
        Instant revokedAt) {
}
