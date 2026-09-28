package kr.co.scc.api.auth.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import kr.co.scc.api.auth.domain.SessionTokens;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthProperties;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;

class TokenServiceTests {

    @Test
    void issuesFifteenMinuteAccessAndThirtyDayRotatableRefreshMaterial() {
        Instant now = Instant.parse("2026-09-16T00:00:00Z");
        JwtEncoder encoder = mock(JwtEncoder.class);
        Jwt jwt = mock(Jwt.class);
        when(jwt.getTokenValue()).thenReturn("signed-access-token");
        when(encoder.encode(any())).thenReturn(jwt);

        AuthProperties properties = new AuthProperties(
                "test-only-access-token-secret-at-least-32-bytes",
                Duration.ofMinutes(15),
                Duration.ofDays(30),
                "scc-api",
                "google-client-id");
        TokenService service = new TokenService(
                encoder,
                properties,
                Clock.fixed(now, ZoneOffset.UTC),
                new SecureRandom());
        UserAccount user = new UserAccount(
                UUID.randomUUID(),
                "owner@example.com",
                "hash",
                "01012345678",
                "ACTIVE");

        SessionTokens tokens = service.issue(user, UUID.randomUUID());

        assertThat(tokens.accessToken()).isEqualTo("signed-access-token");
        assertThat(tokens.accessTokenExpiresAt()).isEqualTo(now.plus(Duration.ofMinutes(15)));
        assertThat(tokens.refreshTokenExpiresAt()).isEqualTo(now.plus(Duration.ofDays(30)));
        assertThat(tokens.refreshToken()).doesNotContain("=").hasSizeGreaterThanOrEqualTo(40);
        assertThat(tokens.refreshTokenHash()).hasSize(64).doesNotContain(tokens.refreshToken());
    }
}
