package kr.co.scc.api.auth.domain;

import java.time.Instant;

public record SessionTokens(
        String accessToken,
        Instant accessTokenExpiresAt,
        String refreshToken,
        String refreshTokenHash,
        Instant refreshTokenExpiresAt) {
}
