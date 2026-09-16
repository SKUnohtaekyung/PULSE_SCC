package kr.co.scc.api.auth.application;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import kr.co.scc.api.auth.domain.RefreshSession;
import kr.co.scc.api.auth.domain.UserAccount;
import kr.co.scc.api.auth.infrastructure.AuthRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTests {

    @Test
    void reusedRotatedRefreshTokenRevokesAllActiveSessions() {
        Instant now = Instant.parse("2026-09-16T00:00:00Z");
        AuthRepository repository = mock(AuthRepository.class);
        TokenService tokenService = mock(TokenService.class);
        UserAccount user = new UserAccount(
                UUID.randomUUID(),
                "owner@example.com",
                "hash",
                "01012345678",
                "ACTIVE");
        RefreshSession session = new RefreshSession(
                UUID.randomUUID(),
                user,
                now.plusSeconds(3600),
                now.minusSeconds(1));
        when(tokenService.hashRefreshToken("rotated-token")).thenReturn("token-hash");
        when(repository.findSessionByTokenHash("token-hash")).thenReturn(Optional.of(session));

        AuthService service = new AuthService(
                repository,
                mock(PasswordEncoder.class),
                tokenService,
                mock(GoogleIdTokenVerifier.class),
                Clock.fixed(now, ZoneOffset.UTC));

        assertThatThrownBy(() -> service.refresh("rotated-token"))
                .isInstanceOf(AuthException.class)
                .hasMessageContaining("다시 로그인");
        verify(repository).revokeAllSessions(user.id(), now);
    }
}
